import {
  addDays,
  compareDates,
  formatDate,
  isValidDateString,
  todayString,
} from "./dates";
import {
  emptyDoses,
  makeId,
  type AppData,
  type DosePeriod,
  type DosePoint,
  type Doses,
  type Medication,
  type Person,
  type Schedule,
} from "./model";
import {
  escapeHtml,
  formatInputQuantity,
  formatQuantity,
  weekdayLabel,
} from "./presentation";
import {
  firstScheduledDoseOnOrAfter,
  projectedStock,
  projectionBaselineForDate,
  scheduledDoseAmount,
  scheduledDosePoints,
} from "./schedule";

type Persist = () => void;

export function openPersonDialog(
  dialog: HTMLDialogElement,
  data: AppData,
  persist: Persist,
  person?: Person,
): void {
  const editing = Boolean(person);
  dialog.innerHTML = `
    <form class="dialog-body" id="person-form">
      <div class="dialog-head">
        <h2 class="dialog-title">${editing ? "编辑成员" : "添加成员"}</h2>
        <button class="dialog-close" type="button" data-dialog-action="close" aria-label="关闭">×</button>
      </div>
      <label class="field">
        <span class="field-label">姓名或称呼</span>
        <input class="input" name="name" type="text" maxlength="30" value="${escapeHtml(person?.name ?? "")}" required autofocus />
      </label>
      <div class="dialog-actions">
        <button class="button button--secondary" type="button" data-dialog-action="close">取消</button>
        <button class="button button--primary" type="submit">保存</button>
      </div>
    </form>
  `;

  const form = requiredDialogElement<HTMLFormElement>(dialog, "person-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (!name) {
      return;
    }

    if (person) {
      person.name = name;
    } else {
      data.people.push({ id: makeId(), name });
    }

    persist();
    dialog.close();
  });

  dialog.showModal();
}

export function openMedicationDialog(
  dialog: HTMLDialogElement,
  data: AppData,
  persist: Persist,
  medication?: Medication,
): void {
  const editing = Boolean(medication);
  const today = todayString();
  const schedule = medication?.schedule ?? defaultSchedule("daily");
  const personOptions = data.people
    .map(
      (person) => `
    <option value="${escapeHtml(person.id)}" ${person.id === medication?.personId ? "selected" : ""}>${escapeHtml(person.name)}</option>
  `,
    )
    .join("");

  dialog.innerHTML = `
    <form class="dialog-body" id="medication-form">
      <div class="dialog-head">
        <h2 class="dialog-title">${editing ? "编辑药品" : "添加药品"}</h2>
        <button class="dialog-close" type="button" data-dialog-action="close" aria-label="关闭">×</button>
      </div>

      <div class="form-grid form-grid--two">
        <label class="field">
          <span class="field-label">家庭成员</span>
          <select class="select" name="personId" required>${personOptions}</select>
        </label>
        <label class="field">
          <span class="field-label">药品名称</span>
          <input class="input" name="name" type="text" maxlength="80" value="${escapeHtml(medication?.name ?? "")}" required />
        </label>
      </div>

      <div class="form-grid form-grid--two">
        <label class="field">
          <span class="field-label">规格</span>
          <input class="input" name="strength" type="text" maxlength="40" placeholder="例如 20 mg" value="${escapeHtml(medication?.strength ?? "")}" />
        </label>
        <label class="field">
          <span class="field-label">服用单位</span>
          <input class="input" name="unit" type="text" maxlength="12" value="${escapeHtml(medication?.unit ?? "片")}" required />
        </label>
      </div>

      <div class="form-grid form-grid--two">
        <label class="field">
          <span class="field-label">每包装数量</span>
          <input class="input" name="packageSize" type="number" inputmode="decimal" min="0" step="any" placeholder="例如 28" value="${medication?.packageSize ?? ""}" />
        </label>
        <label class="field">
          <span class="field-label">包装单位</span>
          <input class="input" name="packageUnit" type="text" maxlength="12" value="${escapeHtml(medication?.packageUnit ?? "盒")}" />
        </label>
      </div>

      ${
        editing
          ? `
        <div class="alert alert--accent baseline-note">
          <p class="alert-title">当前预计库存</p>
          <strong>${formatQuantity(projectedStock(medication!, today))} ${escapeHtml(medication!.unit)}</strong>
          <small>只修改药品信息不会改变库存基准；修改服用计划时，会保留今天显示的预计库存，并从下一计划日开始按新计划推算。</small>
        </div>
      `
          : `
        <label class="field">
          <span class="field-label">实际库存</span>
          <input class="input" name="stock" type="number" inputmode="decimal" min="0" step="any" value="0" required />
          <small class="field-hint">输入当前手头的实际剩余数量。</small>
        </label>
      `
      }

      <div class="form-divider"></div>

      <label class="field">
        <span class="field-label">服用计划</span>
        <select class="select" id="schedule-type" name="scheduleType">
          <option value="daily" ${schedule.type === "daily" ? "selected" : ""}>每天</option>
          <option value="weekly" ${schedule.type === "weekly" ? "selected" : ""}>每周指定日期</option>
          <option value="interval" ${schedule.type === "interval" ? "selected" : ""}>每隔 N 天</option>
          <option value="as-needed" ${schedule.type === "as-needed" ? "selected" : ""}>按需服用</option>
        </select>
      </label>

      <div id="schedule-fields">${scheduleFieldsHtml(schedule)}</div>

      ${
        editing
          ? ""
          : `<div id="stock-baseline-container">${stockBaselineFieldHtml(schedule, today)}</div>`
      }

      <div class="dialog-actions split-actions">
        ${editing ? `<button class="button button--danger" type="button" data-dialog-action="delete-medication" data-id="${escapeHtml(medication!.id)}">删除</button>` : "<span></span>"}
        <div class="button-row">
          <button class="button button--secondary" type="button" data-dialog-action="close">取消</button>
          <button class="button button--primary" type="submit">保存</button>
        </div>
      </div>
    </form>
  `;

  const form = requiredDialogElement<HTMLFormElement>(
    dialog,
    "medication-form",
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    try {
      const parsedSchedule = readSchedule(form, formData);
      const packageSize = optionalPositiveNumber(formData, "packageSize");
      const personId = String(formData.get("personId") ?? "");
      const name = String(formData.get("name") ?? "").trim();
      const strength = String(formData.get("strength") ?? "").trim();
      const unit = String(formData.get("unit") ?? "").trim();
      const packageUnit =
        String(formData.get("packageUnit") ?? "").trim() || "盒";

      if (
        !data.people.some((person) => person.id === personId) ||
        !name ||
        !unit
      ) {
        throw new Error("请填写必要信息。");
      }

      if (medication) {
        const scheduleChanged = !sameSchedule(
          medication.schedule,
          parsedSchedule,
        );
        const currentStock = scheduleChanged
          ? projectedStock(medication, today)
          : medication.stock;
        const stockBaseline = scheduleChanged
          ? baselineFromNextDay(parsedSchedule, today)
          : medication.stockBaseline;

        Object.assign(medication, {
          personId,
          name,
          strength,
          unit,
          packageSize,
          packageUnit,
          stock: currentStock,
          stockBaseline,
          schedule: parsedSchedule,
        });
      } else {
        const stock = requiredNonNegativeNumber(formData, "stock");
        const stockBaseline = readStockBaseline(
          formData,
          parsedSchedule,
          today,
        );

        data.medications.push({
          id: makeId(),
          personId,
          name,
          strength,
          unit,
          packageSize,
          packageUnit,
          stock,
          stockBaseline,
          schedule: parsedSchedule,
        });
      }

      persist();
      dialog.close();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "无法保存药品。");
    }
  });

  dialog.showModal();
}

export function openStockDialog(
  dialog: HTMLDialogElement,
  medication: Medication,
  persist: Persist,
): void {
  const today = todayString();
  const current = projectedStock(medication, today);

  dialog.innerHTML = `
    <form class="dialog-body" id="stock-form">
      <div class="dialog-head">
        <div>
          <h2 class="dialog-title">${escapeHtml(medication.name)}</h2>
          <p class="dialog-description">预计当前库存 ${formatQuantity(current)} ${escapeHtml(medication.unit)}</p>
        </div>
        <button class="dialog-close" type="button" data-dialog-action="close" aria-label="关闭">×</button>
      </div>

      <div class="segmented">
        <label>
          <input type="radio" name="stock-action" value="add" checked />
          <span>补充</span>
        </label>
        <label>
          <input type="radio" name="stock-action" value="adjust" />
          <span>校准</span>
        </label>
      </div>

      <label class="field">
        <span class="field-label" id="stock-quantity-label">补充数量</span>
        <input class="input" name="quantity" type="number" inputmode="decimal" min="0" step="any" required />
        <small class="field-hint">补充只增加当前库存；校准会把库存改为实际清点数量。</small>
      </label>

      <div id="stock-adjust-baseline" hidden>
        ${stockBaselineFieldHtml(medication.schedule, today, true)}
      </div>

      <div class="dialog-actions">
        <button class="button button--secondary" type="button" data-dialog-action="close">取消</button>
        <button class="button button--primary" type="submit">保存</button>
      </div>
    </form>
  `;

  const form = requiredDialogElement<HTMLFormElement>(dialog, "stock-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const type = String(formData.get("stock-action")) as "add" | "adjust";

    try {
      const quantity = requiredNonNegativeNumber(formData, "quantity");
      if (
        (type !== "add" && type !== "adjust") ||
        (type === "add" && quantity <= 0)
      ) {
        throw new Error("请填写有效的库存数量。");
      }

      if (type === "add") {
        medication.stock = current + quantity;
        medication.stockBaseline = projectionBaselineForDate(medication, today);
      } else {
        medication.stock = quantity;
        medication.stockBaseline = readStockBaseline(
          formData,
          medication.schedule,
          today,
        );
      }

      persist();
      dialog.close();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "无法保存库存。");
    }
  });

  dialog.showModal();
}

export function handleDialogChange(
  dialog: HTMLDialogElement,
  event: Event,
): void {
  const target = event.target as HTMLInputElement | HTMLSelectElement;

  if (target.id === "schedule-type") {
    const container = dialog.querySelector<HTMLElement>("#schedule-fields");
    if (container) {
      container.innerHTML = scheduleFieldsHtml(
        defaultSchedule(target.value as Schedule["type"]),
      );
    }
    updateMedicationBaselineChooser(dialog);
    return;
  }

  if (isScheduleControl(target)) {
    updateMedicationBaselineChooser(dialog);
    return;
  }

  if (target.name === "stock-action") {
    const adjusting = target.value === "adjust";
    const label = dialog.querySelector<HTMLElement>("#stock-quantity-label");
    const baseline = dialog.querySelector<HTMLElement>(
      "#stock-adjust-baseline",
    );
    const select = baseline?.querySelector<HTMLSelectElement>(
      'select[name="stockBaseline"]',
    );

    if (label) {
      label.textContent = adjusting ? "实际库存" : "补充数量";
    }
    if (baseline) {
      baseline.hidden = !adjusting;
    }
    if (select) {
      select.disabled = !adjusting;
      select.required = adjusting;
    }
  }
}

function stockBaselineFieldHtml(
  schedule: Schedule,
  today: string,
  disabled = false,
): string {
  if (schedule.type === "as-needed") {
    return '<p class="alert alert--accent form-note">按需服用不自动扣减库存，因此无需设置下一次计划用药。</p>';
  }

  const points = scheduledDosePoints(schedule, today, 4);
  if (points.length === 0) {
    return '<p class="alert alert--accent form-note">当前计划没有可用的下一次用药节点。</p>';
  }

  return `
    <label class="field">
      <span class="field-label">库存从</span>
      <select class="select" name="stockBaseline" ${disabled ? "disabled" : "required"}>
        <option value="" selected disabled>选择下一次计划用药</option>
        ${points
          .map(
            (point) =>
              `<option value="${dosePointValue(point)}">${escapeHtml(dosePointLabel(point, today))}</option>`,
          )
          .join("")}
      </select>
      <small class="field-hint">选择这份实际库存之后的下一次计划用药；已经服用过的剂次不会再次扣减。</small>
    </label>
  `;
}

function updateMedicationBaselineChooser(dialog: HTMLDialogElement): void {
  const container = dialog.querySelector<HTMLElement>(
    "#stock-baseline-container",
  );
  const form = dialog.querySelector<HTMLFormElement>("#medication-form");
  if (!container || !form) {
    return;
  }

  try {
    const schedule = readSchedule(form, new FormData(form));
    container.innerHTML = stockBaselineFieldHtml(schedule, todayString());
  } catch {
    container.innerHTML =
      '<p class="alert alert--accent form-note">完成服用计划后，再选择这份库存从哪一次计划用药开始计算。</p>';
  }
}

function readStockBaseline(
  formData: FormData,
  schedule: Schedule,
  today: string,
): DosePoint | null {
  if (schedule.type === "as-needed") {
    return null;
  }

  const value = String(formData.get("stockBaseline") ?? "");
  const [date = "", period = ""] = value.split(":");
  if (
    !isValidDateString(date) ||
    compareDates(date, today) < 0 ||
    !isDosePeriod(period) ||
    scheduledDoseAmount(schedule, date, period) <= 0
  ) {
    throw new Error("请选择实际库存之后的下一次计划用药。");
  }

  return { date, period };
}

function baselineFromNextDay(
  schedule: Schedule,
  today: string,
): DosePoint | null {
  if (schedule.type === "as-needed") {
    return null;
  }

  const baseline = firstScheduledDoseOnOrAfter(schedule, {
    date: addDays(today, 1),
    period: "morning",
  });
  if (!baseline) {
    throw new Error("无法找到下一次计划用药。");
  }
  return baseline;
}

function dosePointValue(point: DosePoint): string {
  return `${point.date}:${point.period}`;
}

function dosePointLabel(point: DosePoint, today: string): string {
  const dateLabel =
    point.date === today
      ? "今天"
      : point.date === addDays(today, 1)
        ? "明天"
        : formatDate(point.date);
  return `${dateLabel}${dosePeriodLongLabel(point.period)}`;
}

function dosePeriodLongLabel(period: DosePeriod): string {
  if (period === "morning") {
    return "早上";
  }
  if (period === "noon") {
    return "中午";
  }
  return "晚上";
}

function isDosePeriod(value: string): value is DosePeriod {
  return value === "morning" || value === "noon" || value === "evening";
}

function isScheduleControl(
  target: HTMLInputElement | HTMLSelectElement,
): boolean {
  return (
    target.name.startsWith("dose-") ||
    target.name === "weekday" ||
    target.name === "everyDays" ||
    target.name === "startDate"
  );
}

function sameSchedule(a: Schedule, b: Schedule): boolean {
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === "as-needed" || b.type === "as-needed") {
    return a.type === b.type;
  }
  if (
    a.doses.morning !== b.doses.morning ||
    a.doses.noon !== b.doses.noon ||
    a.doses.evening !== b.doses.evening
  ) {
    return false;
  }
  if (a.type === "weekly" && b.type === "weekly") {
    const aDays = [...a.days].sort((x, y) => x - y);
    const bDays = [...b.days].sort((x, y) => x - y);
    return (
      aDays.length === bDays.length &&
      aDays.every((day, index) => day === bDays[index])
    );
  }
  if (a.type === "interval" && b.type === "interval") {
    return a.everyDays === b.everyDays && a.startDate === b.startDate;
  }
  return a.type === "daily" && b.type === "daily";
}

function scheduleFieldsHtml(schedule: Schedule): string {
  if (schedule.type === "as-needed") {
    return '<p class="alert alert--accent form-note">按需药只记录库存，不自动预测耗尽日期或补药数量。</p>';
  }

  const weekly =
    schedule.type === "weekly"
      ? `
    <fieldset class="field-group">
      <legend>服用日期</legend>
      <div class="weekday-picker">
        ${[1, 2, 3, 4, 5, 6, 7]
          .map(
            (day) => `
          <label>
            <input type="checkbox" name="weekday" value="${day}" ${schedule.days.includes(day) ? "checked" : ""} />
            <span>${weekdayLabel(day)}</span>
          </label>
        `,
          )
          .join("")}
      </div>
    </fieldset>
  `
      : "";

  const interval =
    schedule.type === "interval"
      ? `
    <div class="form-grid form-grid--two">
      <label class="field">
        <span class="field-label">间隔天数</span>
        <div class="input-affix">
          <span>每</span>
          <input class="input" name="everyDays" type="number" inputmode="numeric" min="1" step="1" value="${schedule.everyDays}" required />
          <span>天</span>
        </div>
      </label>
      <label class="field">
        <span class="field-label">开始日期</span>
        <input class="input" name="startDate" type="date" value="${escapeHtml(schedule.startDate)}" required />
      </label>
    </div>
  `
      : "";

  return `
    ${weekly}
    ${interval}
    <fieldset class="field-group">
      <legend>每次剂量</legend>
      <div class="dose-grid">
        ${doseControl("morning", "早", schedule.doses.morning)}
        ${doseControl("noon", "中", schedule.doses.noon)}
        ${doseControl("evening", "晚", schedule.doses.evening)}
      </div>
    </fieldset>
  `;
}

function doseControl(
  period: DosePeriod,
  label: string,
  amount: number,
): string {
  return `
    <label class="field dose-control">
      <span class="field-label">${label}</span>
      <input
        class="input dose-input"
        name="dose-${period}"
        type="number"
        inputmode="decimal"
        min="0"
        step="any"
        value="${amount > 0 ? formatInputQuantity(amount) : ""}"
        placeholder="0"
      />
    </label>
  `;
}

function readSchedule(form: HTMLFormElement, formData: FormData): Schedule {
  const type = String(formData.get("scheduleType")) as Schedule["type"];
  if (type === "as-needed") {
    return { type };
  }

  const doses: Doses = {
    morning: readDose(form, "morning"),
    noon: readDose(form, "noon"),
    evening: readDose(form, "evening"),
  };

  if (doses.morning + doses.noon + doses.evening <= 0) {
    throw new Error("请至少填写一个服用剂量。");
  }

  if (type === "weekly") {
    const days = [
      ...form.querySelectorAll<HTMLInputElement>(
        'input[name="weekday"]:checked',
      ),
    ]
      .map((input) => Number(input.value))
      .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7)
      .sort((a, b) => a - b);
    if (days.length === 0) {
      throw new Error("请至少选择一个每周服用日期。");
    }
    return { type, days: [...new Set(days)], doses };
  }

  if (type === "interval") {
    const everyDays = requiredNonNegativeNumber(formData, "everyDays");
    const startDate = String(formData.get("startDate") ?? "");
    if (
      !Number.isInteger(everyDays) ||
      everyDays < 1 ||
      !isValidDateString(startDate)
    ) {
      throw new Error("请填写有效的间隔天数和开始日期。");
    }
    return { type, everyDays, startDate, doses };
  }

  if (type !== "daily") {
    throw new Error("无法识别服用计划。");
  }

  return { type: "daily", doses };
}

function readDose(form: HTMLFormElement, period: DosePeriod): number {
  const input = form.elements.namedItem(
    `dose-${period}`,
  ) as HTMLInputElement | null;
  const raw = input?.value.trim() ?? "";
  if (!raw) {
    return 0;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("请输入有效的服用剂量。");
  }
  return value;
}

function defaultSchedule(type: Schedule["type"]): Schedule {
  if (type === "as-needed") {
    return { type };
  }

  if (type === "weekly") {
    return {
      type,
      days: [1, 3, 5],
      doses: { morning: 1, noon: 0, evening: 0 },
    };
  }

  if (type === "interval") {
    return {
      type,
      everyDays: 2,
      startDate: todayString(),
      doses: { morning: 1, noon: 0, evening: 0 },
    };
  }

  return { type: "daily", doses: { ...emptyDoses(), morning: 1 } };
}

function optionalPositiveNumber(
  formData: FormData,
  key: string,
): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("每包装数量必须大于 0。");
  }
  return value;
}

function requiredNonNegativeNumber(formData: FormData, key: string): number {
  const raw = String(formData.get(key) ?? "").trim();
  const value = Number(raw);
  if (!raw || !Number.isFinite(value) || value < 0) {
    throw new Error("请输入有效的非负数值。");
  }
  return value;
}

function requiredDialogElement<T extends HTMLElement>(
  dialog: HTMLDialogElement,
  id: string,
): T {
  const element = dialog.querySelector<T>(`#${id}`);
  if (!element) {
    throw new Error(`Missing dialog element: ${id}`);
  }
  return element;
}
