import "./app.css";

import { compareDates, formatDate, formatFullDate, todayString } from "./dates";
import {
  handleDialogChange,
  openMedicationDialog,
  openPersonDialog,
  openStockDialog,
} from "./dialogs";
import { emptyData, type AppData, type Medication, type Person } from "./model";
import {
  escapeHtml,
  formatQuantity,
  packageSuggestion,
  scheduleSummary,
} from "./presentation";
import {
  availableThroughDate,
  firstShortageDate,
  projectedStock,
  refillAmount,
} from "./schedule";
import {
  clearData,
  exportData,
  exportRawData,
  importData,
  loadData,
  saveData,
} from "./storage";

type View = "home" | "medications" | "settings";
type StatusTone = "success" | "warning" | "danger" | "neutral";

const app = requiredElement<HTMLDivElement>("app");
const dialog = requiredElement<HTMLDialogElement>("dialog");
const importFile = requiredElement<HTMLInputElement>("import-file");

const initialLoad = loadData();
let data = initialLoad.data;
let storageIssue = initialLoad.issue;
let recoveryRaw = initialLoad.recoveryRaw;
let view: View = "home";

render();

app.addEventListener("click", handleAppClick);
app.addEventListener("change", handleAppChange);
dialog.addEventListener("click", handleDialogClick);
dialog.addEventListener("change", (event) => handleDialogChange(dialog, event));
importFile.addEventListener("change", handleImportFile);

function render(): void {
  if (storageIssue) {
    app.innerHTML = renderStorageRecovery();
    return;
  }

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-lockup">
          <div class="brand" aria-label="Ratchet Meds">
            <span>Ratchet</span>
            <small class="brand-badge">MEDS</small>
          </div>
          <p class="brand-tagline">家庭用药记录与备药计划</p>
        </div>
      </header>

      <main class="content">
        ${renderView()}
      </main>

      <nav class="bottom-nav" aria-label="主导航">
        ${navButton("home", "首页")}
        ${navButton("medications", "药品")}
        ${navButton("settings", "设置")}
      </nav>
    </div>
  `;
}

function renderStorageRecovery(): string {
  return `
    <main class="recovery-shell">
      <section class="card card--raised recovery-panel">
        <div class="brand-lockup recovery-brand">
          <div class="brand" aria-label="Ratchet Recovery">
            <span>Ratchet</span>
            <small class="brand-badge">RECOVERY</small>
          </div>
          <p class="brand-tagline">本地数据恢复</p>
        </div>
        <p class="eyebrow">Local data needs attention</p>
        <h1>本地数据需要处理</h1>
        <p>${escapeHtml(storageIssue ?? "Ratchet 无法读取本地数据。")}</p>
        <p>Ratchet 已暂停继续写入，避免数据被意外覆盖。你可以先导出当前保留的数据，再检查浏览器存储设置或导入有效备份；确认这些数据不再需要时，也可以清空后重新开始。</p>
        <div class="button-row recovery-actions">
          ${recoveryRaw ? '<button class="button button--secondary" type="button" data-action="export-recovery">导出保留数据</button>' : ""}
          <button class="button button--primary" type="button" data-action="import">导入备份</button>
          <button class="button button--danger" type="button" data-action="reset-recovery">清空并重新开始</button>
        </div>
      </section>
    </main>
  `;
}

function renderView(): string {
  if (view === "medications") {
    return renderMedications();
  }
  if (view === "settings") {
    return renderSettings();
  }
  return renderHome();
}

function navButton(target: View, label: string): string {
  const active = view === target;
  return `<button class="nav-btn" type="button" data-action="navigate" data-view="${target}"${active ? ' aria-current="page"' : ""}>${label}</button>`;
}

function renderHome(): string {
  if (data.people.length === 0) {
    return `
      <section class="welcome-card">
        <p class="eyebrow">Family medication planner</p>
        <h1>药要准备到哪一天？</h1>
        <p>先添加家庭成员，再记录药品库存和服用计划。设置一个目标日期后，Ratchet 会自动推算库存和需要补充的药量。</p>
        <button class="button button--primary" type="button" data-action="add-person">添加成员</button>
      </section>
    `;
  }

  return `
    <section class="page-head">
      <div>
        <h1>用药计划</h1>
        <p>根据当前库存和服用计划，计算补足到目标日期需要的药量。</p>
      </div>
    </section>

    ${renderPlanSection()}
    ${renderRefillSection()}
    ${renderStockOverview()}
  `;
}

function renderPlanSection(): string {
  const coverThrough = escapeHtml(data.plan.coverThrough);
  const today = todayString();
  const planReady = isPlanReady();
  const planExpired = Boolean(
    data.plan.coverThrough && compareDates(data.plan.coverThrough, today) < 0,
  );
  const planHint = planExpired
    ? "目标日期已过，请更新。"
    : "设置日期后即可生成补药清单。";

  return `
    <section class="card card--raised plan-section" aria-label="备药目标日期">
      <div class="plan-fields">
        <label class="field" for="cover-through">
          <span class="field-label">目标日期</span>
          <input class="input" id="cover-through" type="date" value="${coverThrough}" min="${today}" />
        </label>
      </div>
      ${planReady ? `<p class="plan-summary">以今天的预计库存为基准，补足至 ${formatFullDate(data.plan.coverThrough)}。</p>` : `<p class="plan-hint${planExpired ? " text-danger" : ""}">${planHint}</p>`}
    </section>
  `;
}

function renderRefillSection(): string {
  if (!isPlanReady()) {
    return sectionBlock(
      "需要补充",
      emptyState("设置“目标日期”后生成补药清单。"),
    );
  }

  const groups = data.people
    .map((person) => {
      const medications = medicationsForPerson(person.id);
      const automatic = medications
        .map((medication) => ({
          medication,
          amount: refillAmount(
            medication,
            todayString(),
            data.plan.coverThrough,
          ),
        }))
        .filter((item) => item.amount !== null && item.amount > 0);
      const asNeeded = medications.filter(
        (medication) => medication.schedule.type === "as-needed",
      );

      if (automatic.length === 0 && asNeeded.length === 0) {
        return "";
      }

      const rows = automatic
        .map(({ medication, amount }) =>
          renderRefillRow(medication, amount ?? 0),
        )
        .join("");
      const manualRows = asNeeded.map(renderAsNeededRefillRow).join("");

      return `
      <div class="person-block">
        <div class="person-heading">
          <h3>${escapeHtml(person.name)}</h3>
        </div>
        <div class="medication-list">${rows}${manualRows}</div>
      </div>
    `;
    })
    .join("");

  if (!groups) {
    return sectionBlock(
      "需要补充",
      successAlert("按当前记录，库存已足够覆盖到目标日期。"),
    );
  }

  return sectionBlock("需要补充", groups);
}

function renderRefillRow(medication: Medication, amount: number): string {
  const shortage = firstShortageDate(medication);
  const urgent = shortage && compareDates(shortage, todayString()) <= 0;
  const packageText = packageSuggestion(medication, amount);

  return `
    <article class="medication-row">
      <div class="medication-copy">
        <div class="medication-title-line">
          <strong>${escapeHtml(medication.name)}</strong>
          ${medication.strength ? `<span>${escapeHtml(medication.strength)}</span>` : ""}
        </div>
        <small class="${urgent ? "text-danger" : ""}">${urgent ? `预计 ${formatDate(shortage)} 前后库存不足` : scheduleSummary(medication)}</small>
      </div>
      <div class="bring-amount ${urgent ? "text-danger" : "text-warning"}">
        <strong>${formatQuantity(amount)} ${escapeHtml(medication.unit)}</strong>
        ${packageText ? `<small>${packageText}</small>` : ""}
      </div>
    </article>
  `;
}

function renderAsNeededRefillRow(medication: Medication): string {
  const current = projectedStock(medication, todayString());
  return `
    <article class="medication-row">
      <div class="medication-copy">
        <div class="medication-title-line">
          <strong>${escapeHtml(medication.name)}</strong>
          ${medication.strength ? `<span>${escapeHtml(medication.strength)}</span>` : ""}
        </div>
        <small>按需服用，补药数量需手动判断</small>
      </div>
      <div class="bring-amount text-muted">
        <strong>${formatQuantity(current)} ${escapeHtml(medication.unit)}</strong>
        <small>预计当前库存</small>
      </div>
    </article>
  `;
}

function renderStockOverview(): string {
  const groups = data.people
    .map((person) => {
      const medications = medicationsForPerson(person.id);
      if (medications.length === 0) {
        return "";
      }

      return `
      <div class="person-block">
        <div class="person-heading">
          <h3>${escapeHtml(person.name)}</h3>
          <span>${medications.length} 种药</span>
        </div>
        <div class="medication-list">
          ${medications.map(renderStockRow).join("")}
        </div>
      </div>
    `;
    })
    .join("");

  return sectionBlock("库存", groups || emptyState("还没有记录药品。"));
}

function renderStockRow(medication: Medication): string {
  const current = projectedStock(medication, todayString());
  const status = medicationStatus(medication);
  const through = availableThroughDate(medication);

  return `
    <article class="medication-row">
      <div class="medication-copy">
        <div class="medication-title-line">
          <strong>${escapeHtml(medication.name)}</strong>
          ${medication.strength ? `<span>${escapeHtml(medication.strength)}</span>` : ""}
        </div>
        <small>${scheduleSummary(medication)}</small>
      </div>
      <div class="stock-copy">
        <strong>${formatQuantity(current)} ${escapeHtml(medication.unit)}</strong>
        <small>${medication.schedule.type === "as-needed" ? "按需服用" : through ? `预计可用至 ${formatDate(through)}` : "长期充足"}</small>
        <span class="badge badge--${status.tone}">${status.label}</span>
      </div>
    </article>
  `;
}

function renderMedications(): string {
  const addButton =
    data.people.length > 0
      ? '<button class="button button--soft add-medication-btn" type="button" data-action="add-medication"><span aria-hidden="true">＋</span> 添加</button>'
      : '<button class="button button--soft add-medication-btn" type="button" data-action="add-person">添加成员</button>';

  const groups = data.people
    .map((person) => {
      const medications = medicationsForPerson(person.id);
      return `
      <section class="medication-person-section">
        <div class="medication-person-heading">
          <h2>${escapeHtml(person.name)}</h2>
          <span>${medications.length} 种药</span>
        </div>
        ${
          medications.length > 0
            ? `
          <div class="manage-list">
            ${medications.map(renderMedicationManageRow).join("")}
          </div>
        `
            : emptyState("暂无药品。", true)
        }
      </section>
    `;
    })
    .join("");

  return `
    <section class="page-head medications-page-head">
      <div>
        <h1>药品</h1>
        <p>记录药品、库存和服用计划。</p>
      </div>
      ${addButton}
    </section>
    <div class="medication-sections">${groups || emptyState("还没有家庭成员。")}</div>
  `;
}

function renderMedicationManageRow(medication: Medication): string {
  const current = projectedStock(medication, todayString());
  const status = medicationStatus(medication);
  const id = escapeHtml(medication.id);
  return `
    <article class="manage-row">
      <button class="manage-main" type="button" data-action="edit-medication" data-id="${id}">
        <span class="manage-copy">
          <strong>${escapeHtml(medication.name)}</strong>
          ${medication.strength ? `<small >${escapeHtml(medication.strength)}</small>` : ""}
          <small>${scheduleSummary(medication)}</small>
        </span>
      </button>
      <button class="manage-stock-button" data-tone="${status.tone}" type="button" data-action="stock" data-id="${id}" aria-label="管理 ${escapeHtml(medication.name)} 的库存">
        <strong>${formatQuantity(current)} ${escapeHtml(medication.unit)}</strong>
        <small>库存</small>
      </button>
    </article>
  `;
}

function renderSettings(): string {
  const peopleRows = data.people
    .map((person) => {
      const count = medicationsForPerson(person.id).length;
      const id = escapeHtml(person.id);
      return `
      <div class="settings-row">
        <div class="settings-copy">
          <strong>${escapeHtml(person.name)}</strong>
          <small>${count} 种药</small>
        </div>
        <div class="button-row">
          <button class="button button--secondary compact-action" type="button" data-action="edit-person" data-id="${id}">编辑</button>
          <button class="button button--danger compact-action" type="button" data-action="delete-person" data-id="${id}">删除</button>
        </div>
      </div>
    `;
    })
    .join("");

  return `
    <section class="page-head">
      <div>
        <h1>设置</h1>
        <p>管理家庭成员以及本地数据备份。</p>
      </div>
    </section>

    <section class="settings-section">
      <div class="section-heading">
        <h2>家庭成员</h2>
        <button class="button button--soft compact-action" type="button" data-action="add-person">＋ 添加</button>
      </div>
      <div>
        ${peopleRows || emptyState("还没有家庭成员。", true)}
      </div>
    </section>

    <section class="settings-section">
      <div class="section-heading">
        <div>
          <h2>数据备份</h2>
          <p>数据只保存在当前浏览器，建议定期导出 JSON。</p>
        </div>
      </div>
      <div class="button-row backup-actions">
        <button class="button button--secondary" type="button" data-action="export">导出 JSON</button>
        <button class="button button--secondary" type="button" data-action="import">导入 JSON</button>
      </div>
    </section>

    <aside class="alert alert--warning usage-alert">
      <p class="alert-title">用途说明</p>
      <p class="alert-copy">Ratchet 只记录已经确定的服用计划并进行库存推算，不提供剂量调整、停药、换药或其他医疗建议。</p>
    </aside>
  `;
}

function emptyState(message: string, compact = false): string {
  return `
    <div class="empty-state${compact ? " app-empty-state--compact" : ""}">
      <p class="empty-state-copy">${escapeHtml(message)}</p>
    </div>
  `;
}

function successAlert(message: string): string {
  return `
    <div class="alert alert--success">
      <p class="alert-copy">${escapeHtml(message)}</p>
    </div>
  `;
}

function sectionBlock(title: string, content: string): string {
  return `
    <section class="dashboard-section">
      <div class="section-heading"><h2>${escapeHtml(title)}</h2></div>
      <div>${content}</div>
    </section>
  `;
}

function handleAppClick(event: MouseEvent): void {
  const target = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-action]",
  );
  if (!target) {
    return;
  }

  const action = target.dataset.action;

  if (action === "export-recovery") {
    if (recoveryRaw) {
      exportRawData(recoveryRaw);
    }
    return;
  }

  if (action === "reset-recovery") {
    resetRecoveryData();
    return;
  }

  if (action === "import") {
    importFile.click();
    return;
  }

  if (storageIssue) {
    return;
  }

  if (action === "navigate") {
    view = target.dataset.view as View;
    render();
    return;
  }

  if (action === "add-person") {
    openPersonDialog(dialog, data, persist);
    return;
  }

  if (action === "edit-person") {
    const person = findPerson(target.dataset.id);
    if (person) {
      openPersonDialog(dialog, data, persist, person);
    }
    return;
  }

  if (action === "delete-person") {
    deletePerson(target.dataset.id);
    return;
  }

  if (action === "add-medication") {
    openMedicationDialog(dialog, data, persist);
    return;
  }

  if (action === "edit-medication") {
    const medication = findMedication(target.dataset.id);
    if (medication) {
      openMedicationDialog(dialog, data, persist, medication);
    }
    return;
  }

  if (action === "stock") {
    const medication = findMedication(target.dataset.id);
    if (medication) {
      openStockDialog(dialog, medication, persist);
    }
    return;
  }

  if (action === "export") {
    exportData(data);
  }
}

function handleAppChange(event: Event): void {
  if (storageIssue) {
    return;
  }

  const target = event.target as HTMLInputElement;
  if (target.id !== "cover-through") {
    return;
  }

  const coverThrough = target.value;
  const today = todayString();
  if (coverThrough && compareDates(coverThrough, today) < 0) {
    window.alert("“目标日期”不能早于今天。");
    render();
    return;
  }

  data.plan = { coverThrough };
  persist();
}

function handleDialogClick(event: MouseEvent): void {
  const target = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-dialog-action]",
  );
  if (!target) {
    return;
  }

  if (target.dataset.dialogAction === "close") {
    dialog.close();
    return;
  }

  if (target.dataset.dialogAction === "delete-medication") {
    const id = target.dataset.id;
    if (id && window.confirm("删除这条药品记录？")) {
      data.medications = data.medications.filter((item) => item.id !== id);
      persist();
      dialog.close();
    }
  }
}

async function handleImportFile(): Promise<void> {
  const file = importFile.files?.[0];
  importFile.value = "";
  if (!file) {
    return;
  }

  if (
    !storageIssue &&
    (data.people.length > 0 || data.medications.length > 0) &&
    !window.confirm("导入备份会替换当前数据。继续？")
  ) {
    return;
  }

  let imported: AppData;
  try {
    imported = await importData(file);
  } catch {
    window.alert("无法读取这个 Ratchet 备份文件。");
    return;
  }

  try {
    saveData(imported);
  } catch {
    data = imported;
    storageIssue =
      "备份已经读取，但 Ratchet 无法写入当前浏览器的本地存储。请先导出保留数据，再检查浏览器存储设置。";
    recoveryRaw = JSON.stringify(imported, null, 2);
    render();
    return;
  }

  data = imported;
  storageIssue = null;
  recoveryRaw = null;
  view = "home";
  render();
}

function resetRecoveryData(): void {
  if (
    !window.confirm(
      "清空当前浏览器中的 Ratchet 本地数据并重新开始？建议先导出保留数据。",
    )
  ) {
    return;
  }

  try {
    clearData();
  } catch {
    window.alert(
      "Ratchet 仍无法访问当前浏览器的本地存储，暂时不能清空数据。请先检查浏览器存储设置。",
    );
    return;
  }

  data = emptyData();
  storageIssue = null;
  recoveryRaw = null;
  view = "home";
  render();
}

function deletePerson(id: string | undefined): void {
  if (!id) {
    return;
  }

  const person = findPerson(id);
  if (!person) {
    return;
  }

  const medicationCount = medicationsForPerson(id).length;
  const message =
    medicationCount > 0
      ? `删除“${person.name}”会同时删除其 ${medicationCount} 种药品。继续？`
      : `删除“${person.name}”？`;

  if (!window.confirm(message)) {
    return;
  }

  data.people = data.people.filter((item) => item.id !== id);
  data.medications = data.medications.filter((item) => item.personId !== id);
  persist();
}

function medicationStatus(medication: Medication): {
  tone: StatusTone;
  label: string;
} {
  if (medication.schedule.type === "as-needed") {
    return { tone: "neutral", label: "按需" };
  }

  const shortage = firstShortageDate(medication);
  const today = todayString();
  if (shortage && compareDates(shortage, today) <= 0) {
    return { tone: "danger", label: "库存不足" };
  }

  if (isPlanReady()) {
    const amount = refillAmount(medication, today, data.plan.coverThrough);
    if (amount !== null && amount > 0) {
      return { tone: "warning", label: "目标期内需补" };
    }
    return { tone: "success", label: "可用至目标日" };
  }

  return { tone: "success", label: "库存充足" };
}

function isPlanReady(): boolean {
  return Boolean(
    data.plan.coverThrough &&
    compareDates(data.plan.coverThrough, todayString()) >= 0,
  );
}

function medicationsForPerson(personId: string): Medication[] {
  return data.medications.filter(
    (medication) => medication.personId === personId,
  );
}

function findPerson(id: string | undefined): Person | undefined {
  return data.people.find((person) => person.id === id);
}

function findMedication(id: string | undefined): Medication | undefined {
  return data.medications.find((medication) => medication.id === id);
}

function persist(): void {
  if (storageIssue) {
    return;
  }

  try {
    saveData(data);
  } catch {
    storageIssue =
      "Ratchet 无法保存到当前浏览器的本地存储。当前数据仍保留在本页内，请先导出保留数据，再检查浏览器存储设置。";
    recoveryRaw = JSON.stringify(data, null, 2);
  }

  render();
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }
  return element as T;
}
