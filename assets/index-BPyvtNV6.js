(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=864e5,t=/^\d{4}-\d{2}-\d{2}$/;function n(){let e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function r(e){let[t,n,r]=e.split(`-`).map(Number);return new Date(Date.UTC(t,n-1,r))}function i(e){return`${e.getUTCFullYear()}-${String(e.getUTCMonth()+1).padStart(2,`0`)}-${String(e.getUTCDate()).padStart(2,`0`)}`}function a(e){return typeof e!=`string`||!t.test(e)?!1:i(r(e))===e}function o(e,t){let n=r(e);return n.setUTCDate(n.getUTCDate()+t),i(n)}function s(t,n){return Math.round((r(n).getTime()-r(t).getTime())/e)}function c(e){let t=r(e).getUTCDay();return t===0?7:t}function l(e,t){return e.localeCompare(t)}function u(e){return e?new Intl.DateTimeFormat(`zh-CN`,{timeZone:`UTC`,month:`short`,day:`numeric`}).format(r(e)):`—`}function d(e){return e?new Intl.DateTimeFormat(`zh-CN`,{timeZone:`UTC`,year:`numeric`,month:`long`,day:`numeric`}).format(r(e)):`—`}function f(){return{version:2,people:[],medications:[],plan:{coverThrough:``}}}function p(){return{morning:0,noon:0,evening:0}}function ee(){return crypto.randomUUID()}function m(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function h(e){return(Math.round(e*1e6)/1e6).toLocaleString(`zh-CN`,{maximumFractionDigits:3,useGrouping:!1})}function te(e){return String(Math.round(e*1e6)/1e6)}function ne(e){return e===`morning`?`早`:e===`noon`?`中`:`晚`}function re(e){return[``,`一`,`二`,`三`,`四`,`五`,`六`,`日`][e]??String(e)}function g(e){let t=e.schedule;if(t.type===`as-needed`)return`按需服用`;let n=Object.entries(t.doses).filter(([,e])=>e>0).map(([t,n])=>`${ne(t)} ${h(n)}${m(e.unit)}`).join(` · `);return t.type===`weekly`?`每周${t.days.map(re).join(`、`)} · ${n}`:t.type===`interval`?`每 ${t.everyDays} 天 · ${n}`:`每天 · ${n}`}function ie(e,t){return!e.packageSize||e.packageSize<=0||t<=0?``:`约 ${Math.ceil(t/e.packageSize)} ${m(e.packageUnit||`盒`)}`}var ae=1e-9,_=10950,v=[`morning`,`noon`,`evening`];function y(e,t,n){return e.type===`as-needed`||!T(e,t)?0:e.doses[n]}function oe(e,t,n=4){if(e.type===`as-needed`||n<=0)return[];let r=[],i=t;for(let t=0;t<_&&r.length<n;t+=1){if(T(e,i)){for(let t of v)if(y(e,i,t)>0&&(r.push({date:i,period:t}),r.length>=n))break}i=o(i,1)}return r}function b(e,t){if(e.type===`as-needed`)return null;let n=t.date;for(let r=0;r<_;r+=1){if(T(e,n)){let r=n===t.date?v.indexOf(t.period):0;for(let t=Math.max(0,r);t<v.length;t+=1){let r=v[t];if(y(e,n,r)>0)return{date:n,period:r}}}n=o(n,1)}return null}function x(e,t){let n=e.stockBaseline;if(e.schedule.type===`as-needed`||n===null||l(t,n.date)<=0)return e.stock;let r=ue(e.schedule,n,o(t,-1));return w(Math.max(0,e.stock-r))}function se(e,t){if(e.schedule.type===`as-needed`)return null;let n=e.stockBaseline;return n&&C(n,{date:t,period:`morning`})>=0?n:b(e.schedule,{date:t,period:`morning`})}function S(e){let t=e.stockBaseline;if(e.schedule.type===`as-needed`||t===null)return null;let n=e.stock,r=t.date;for(let i=0;i<_;i+=1){if(T(e.schedule,r))for(let i of v){if(C({date:r,period:i},t)<0)continue;let a=y(e.schedule,r,i);if(!(a<=0)){if(a>n+ae)return r;n=w(n-a)}}r=o(r,1)}return null}function ce(e){let t=S(e);return t?o(t,-1):null}function le(e,t,n){let r=e.stockBaseline;if(e.schedule.type===`as-needed`||r===null||!t||!n||l(n,t)<0)return null;let i=b(e.schedule,{date:t,period:`morning`});if(!i)return 0;let a=C(r,i)>0?r:i;if(l(a.date,n)>0)return 0;let o=x(e,t),s=ue(e.schedule,a,n);return w(Math.max(0,s-o))}function C(e,t){let n=l(e.date,t.date);return n===0?v.indexOf(e.period)-v.indexOf(t.period):n}function w(e){let t=Math.round(e*1e6)/1e6;return Math.abs(t)<ae?0:t}function ue(e,t,n){if(e.type===`as-needed`||l(n,t.date)<0)return 0;let r=0,i=t.date;for(;l(i,n)<=0;){if(T(e,i))for(let n of v)C({date:i,period:n},t)>=0&&(r+=y(e,i,n));i=o(i,1)}return w(r)}function T(e,t){if(e.type===`as-needed`)return!1;if(e.type===`weekly`)return e.days.includes(c(t));if(e.type===`interval`){let n=s(e.startDate,t);return n>=0&&n%e.everyDays===0}return!0}function de(e,t,n,r){e.innerHTML=`
    <form class="dialog-body" id="person-form">
      <div class="dialog-head">
        <h2 class="dialog-title">${r?`编辑成员`:`添加成员`}</h2>
        <button class="dialog-close" type="button" data-dialog-action="close" aria-label="关闭">×</button>
      </div>
      <label class="field">
        <span class="field-label">姓名或称呼</span>
        <input class="input" name="name" type="text" maxlength="30" value="${m(r?.name??``)}" required autofocus />
      </label>
      <div class="dialog-actions">
        <button class="button button--secondary" type="button" data-dialog-action="close">取消</button>
        <button class="button button--primary" type="submit">保存</button>
      </div>
    </form>
  `;let i=M(e,`person-form`);i.addEventListener(`submit`,a=>{a.preventDefault();let o=String(new FormData(i).get(`name`)??``).trim();o&&(r?r.name=o:t.people.push({id:ee(),name:o}),n(),e.close())}),e.showModal()}function fe(e,t,r,i){let a=!!i,o=n(),s=i?.schedule??we(`daily`),c=t.people.map(e=>`
    <option value="${m(e.id)}" ${e.id===i?.personId?`selected`:``}>${m(e.name)}</option>
  `).join(``);e.innerHTML=`
    <form class="dialog-body" id="medication-form">
      <div class="dialog-head">
        <h2 class="dialog-title">${a?`编辑药品`:`添加药品`}</h2>
        <button class="dialog-close" type="button" data-dialog-action="close" aria-label="关闭">×</button>
      </div>

      <div class="form-grid form-grid--two">
        <label class="field">
          <span class="field-label">家庭成员</span>
          <select class="select" name="personId" required>${c}</select>
        </label>
        <label class="field">
          <span class="field-label">药品名称</span>
          <input class="input" name="name" type="text" maxlength="80" value="${m(i?.name??``)}" required />
        </label>
      </div>

      <div class="form-grid form-grid--two">
        <label class="field">
          <span class="field-label">规格</span>
          <input class="input" name="strength" type="text" maxlength="40" placeholder="例如 20 mg" value="${m(i?.strength??``)}" />
        </label>
        <label class="field">
          <span class="field-label">服用单位</span>
          <input class="input" name="unit" type="text" maxlength="12" value="${m(i?.unit??`片`)}" required />
        </label>
      </div>

      <div class="form-grid form-grid--two">
        <label class="field">
          <span class="field-label">每包装数量</span>
          <input class="input" name="packageSize" type="number" inputmode="decimal" min="0" step="any" placeholder="例如 28" value="${i?.packageSize??``}" />
        </label>
        <label class="field">
          <span class="field-label">包装单位</span>
          <input class="input" name="packageUnit" type="text" maxlength="12" value="${m(i?.packageUnit??`盒`)}" />
        </label>
      </div>

      ${a?`
        <div class="alert alert--accent baseline-note">
          <p class="alert-title">当前预计库存</p>
          <strong>${h(x(i,o))} ${m(i.unit)}</strong>
          <small>只修改药品信息不会改变库存基准；修改服用计划时，会保留今天显示的预计库存，并从下一计划日开始按新计划推算。</small>
        </div>
      `:`
        <label class="field">
          <span class="field-label">实际库存</span>
          <input class="input" name="stock" type="number" inputmode="decimal" min="0" step="any" value="0" required />
          <small class="field-hint">输入当前手头的实际剩余数量。</small>
        </label>
      `}

      <div class="form-divider"></div>

      <label class="field">
        <span class="field-label">服用计划</span>
        <select class="select" id="schedule-type" name="scheduleType">
          <option value="daily" ${s.type===`daily`?`selected`:``}>每天</option>
          <option value="weekly" ${s.type===`weekly`?`selected`:``}>每周指定日期</option>
          <option value="interval" ${s.type===`interval`?`selected`:``}>每隔 N 天</option>
          <option value="as-needed" ${s.type===`as-needed`?`selected`:``}>按需服用</option>
        </select>
      </label>

      <div id="schedule-fields">${Ce(s)}</div>

      ${a?``:`<div id="stock-baseline-container">${E(s,o)}</div>`}

      <div class="dialog-actions split-actions">
        ${a?`<button class="button button--danger" type="button" data-dialog-action="delete-medication" data-id="${m(i.id)}">删除</button>`:`<span></span>`}
        <div class="button-row">
          <button class="button button--secondary" type="button" data-dialog-action="close">取消</button>
          <button class="button button--primary" type="submit">保存</button>
        </div>
      </div>
    </form>
  `;let l=M(e,`medication-form`);l.addEventListener(`submit`,n=>{n.preventDefault();let a=new FormData(l);try{let n=k(l,a),s=Te(a,`packageSize`),c=String(a.get(`personId`)??``),u=String(a.get(`name`)??``).trim(),d=String(a.get(`strength`)??``).trim(),f=String(a.get(`unit`)??``).trim(),p=String(a.get(`packageUnit`)??``).trim()||`盒`;if(!t.people.some(e=>e.id===c)||!u||!f)throw Error(`请填写必要信息。`);if(i){let e=!Se(i.schedule,n),t=e?x(i,o):i.stock,r=e?ge(n,o):i.stockBaseline;Object.assign(i,{personId:c,name:u,strength:d,unit:f,packageSize:s,packageUnit:p,stock:t,stockBaseline:r,schedule:n})}else{let e=j(a,`stock`),r=he(a,n,o);t.medications.push({id:ee(),personId:c,name:u,strength:d,unit:f,packageSize:s,packageUnit:p,stock:e,stockBaseline:r,schedule:n})}r(),e.close()}catch(e){window.alert(e instanceof Error?e.message:`无法保存药品。`)}}),e.showModal()}function pe(e,t,r){let i=n(),a=x(t,i);e.innerHTML=`
    <form class="dialog-body" id="stock-form">
      <div class="dialog-head">
        <div>
          <h2 class="dialog-title">${m(t.name)}</h2>
          <p class="dialog-description">预计当前库存 ${h(a)} ${m(t.unit)}</p>
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
        ${E(t.schedule,i,!0)}
      </div>

      <div class="dialog-actions">
        <button class="button button--secondary" type="button" data-dialog-action="close">取消</button>
        <button class="button button--primary" type="submit">保存</button>
      </div>
    </form>
  `;let o=M(e,`stock-form`);o.addEventListener(`submit`,n=>{n.preventDefault();let s=new FormData(o),c=String(s.get(`stock-action`));try{let n=j(s,`quantity`);if(c!==`add`&&c!==`adjust`||c===`add`&&n<=0)throw Error(`请填写有效的库存数量。`);c===`add`?(t.stock=a+n,t.stockBaseline=se(t,i)):(t.stock=n,t.stockBaseline=he(s,t.schedule,i)),r(),e.close()}catch(e){window.alert(e instanceof Error?e.message:`无法保存库存。`)}}),e.showModal()}function me(e,t){let n=t.target;if(n.id===`schedule-type`){let t=e.querySelector(`#schedule-fields`);t&&(t.innerHTML=Ce(we(n.value))),D(e);return}if(xe(n)){D(e);return}if(n.name===`stock-action`){let t=n.value===`adjust`,r=e.querySelector(`#stock-quantity-label`),i=e.querySelector(`#stock-adjust-baseline`),a=i?.querySelector(`select[name="stockBaseline"]`);r&&(r.textContent=t?`实际库存`:`补充数量`),i&&(i.hidden=!t),a&&(a.disabled=!t,a.required=t)}}function E(e,t,n=!1){if(e.type===`as-needed`)return`<p class="alert alert--accent form-note">按需服用不自动扣减库存，因此无需设置下一次计划用药。</p>`;let r=oe(e,t,4);return r.length===0?`<p class="alert alert--accent form-note">当前计划没有可用的下一次用药节点。</p>`:`
    <label class="field">
      <span class="field-label">库存从</span>
      <select class="select" name="stockBaseline" ${n?`disabled`:`required`}>
        <option value="" selected disabled>选择下一次计划用药</option>
        ${r.map(e=>`<option value="${_e(e)}">${m(ve(e,t))}</option>`).join(``)}
      </select>
      <small class="field-hint">选择这份实际库存之后的下一次计划用药；已经服用过的剂次不会再次扣减。</small>
    </label>
  `}function D(e){let t=e.querySelector(`#stock-baseline-container`),r=e.querySelector(`#medication-form`);if(t&&r)try{t.innerHTML=E(k(r,new FormData(r)),n())}catch{t.innerHTML=`<p class="alert alert--accent form-note">完成服用计划后，再选择这份库存从哪一次计划用药开始计算。</p>`}}function he(e,t,n){if(t.type===`as-needed`)return null;let[r=``,i=``]=String(e.get(`stockBaseline`)??``).split(`:`);if(!a(r)||l(r,n)<0||!be(i)||y(t,r,i)<=0)throw Error(`请选择实际库存之后的下一次计划用药。`);return{date:r,period:i}}function ge(e,t){if(e.type===`as-needed`)return null;let n=b(e,{date:o(t,1),period:`morning`});if(!n)throw Error(`无法找到下一次计划用药。`);return n}function _e(e){return`${e.date}:${e.period}`}function ve(e,t){return`${e.date===t?`今天`:e.date===o(t,1)?`明天`:u(e.date)}${ye(e.period)}`}function ye(e){return e===`morning`?`早上`:e===`noon`?`中午`:`晚上`}function be(e){return e===`morning`||e===`noon`||e===`evening`}function xe(e){return e.name.startsWith(`dose-`)||e.name===`weekday`||e.name===`everyDays`||e.name===`startDate`}function Se(e,t){if(e.type!==t.type)return!1;if(e.type===`as-needed`||t.type===`as-needed`)return e.type===t.type;if(e.doses.morning!==t.doses.morning||e.doses.noon!==t.doses.noon||e.doses.evening!==t.doses.evening)return!1;if(e.type===`weekly`&&t.type===`weekly`){let n=[...e.days].sort((e,t)=>e-t),r=[...t.days].sort((e,t)=>e-t);return n.length===r.length&&n.every((e,t)=>e===r[t])}return e.type===`interval`&&t.type===`interval`?e.everyDays===t.everyDays&&e.startDate===t.startDate:e.type===`daily`&&t.type===`daily`}function Ce(e){return e.type===`as-needed`?`<p class="alert alert--accent form-note">按需药只记录库存，不自动预测耗尽日期或补药数量。</p>`:`
    ${e.type===`weekly`?`
    <fieldset class="field-group">
      <legend>服用日期</legend>
      <div class="weekday-picker">
        ${[1,2,3,4,5,6,7].map(t=>`
          <label>
            <input type="checkbox" name="weekday" value="${t}" ${e.days.includes(t)?`checked`:``} />
            <span>${re(t)}</span>
          </label>
        `).join(``)}
      </div>
    </fieldset>
  `:``}
    ${e.type===`interval`?`
    <div class="form-grid form-grid--two">
      <label class="field">
        <span class="field-label">间隔天数</span>
        <div class="input-affix">
          <span>每</span>
          <input class="input" name="everyDays" type="number" inputmode="numeric" min="1" step="1" value="${e.everyDays}" required />
          <span>天</span>
        </div>
      </label>
      <label class="field">
        <span class="field-label">开始日期</span>
        <input class="input" name="startDate" type="date" value="${m(e.startDate)}" required />
      </label>
    </div>
  `:``}
    <fieldset class="field-group">
      <legend>每次剂量</legend>
      <div class="dose-grid">
        ${O(`morning`,`早`,e.doses.morning)}
        ${O(`noon`,`中`,e.doses.noon)}
        ${O(`evening`,`晚`,e.doses.evening)}
      </div>
    </fieldset>
  `}function O(e,t,n){return`
    <label class="field dose-control">
      <span class="field-label">${t}</span>
      <input
        class="input dose-input"
        name="dose-${e}"
        type="number"
        inputmode="decimal"
        min="0"
        step="any"
        value="${n>0?te(n):``}"
        placeholder="0"
      />
    </label>
  `}function k(e,t){let n=String(t.get(`scheduleType`));if(n===`as-needed`)return{type:n};let r={morning:A(e,`morning`),noon:A(e,`noon`),evening:A(e,`evening`)};if(r.morning+r.noon+r.evening<=0)throw Error(`请至少填写一个服用剂量。`);if(n===`weekly`){let t=[...e.querySelectorAll(`input[name="weekday"]:checked`)].map(e=>Number(e.value)).filter(e=>Number.isInteger(e)&&e>=1&&e<=7).sort((e,t)=>e-t);if(t.length===0)throw Error(`请至少选择一个每周服用日期。`);return{type:n,days:[...new Set(t)],doses:r}}if(n===`interval`){let e=j(t,`everyDays`),i=String(t.get(`startDate`)??``);if(!Number.isInteger(e)||e<1||!a(i))throw Error(`请填写有效的间隔天数和开始日期。`);return{type:n,everyDays:e,startDate:i,doses:r}}if(n!==`daily`)throw Error(`无法识别服用计划。`);return{type:`daily`,doses:r}}function A(e,t){let n=e.elements.namedItem(`dose-${t}`)?.value.trim()??``;if(!n)return 0;let r=Number(n);if(!Number.isFinite(r)||r<0)throw Error(`请输入有效的服用剂量。`);return r}function we(e){return e===`as-needed`?{type:e}:e===`weekly`?{type:e,days:[1,3,5],doses:{morning:1,noon:0,evening:0}}:e===`interval`?{type:e,everyDays:2,startDate:n(),doses:{morning:1,noon:0,evening:0}}:{type:`daily`,doses:{...p(),morning:1}}}function Te(e,t){let n=String(e.get(t)??``).trim();if(!n)return null;let r=Number(n);if(!Number.isFinite(r)||r<=0)throw Error(`每包装数量必须大于 0。`);return r}function j(e,t){let n=String(e.get(t)??``).trim(),r=Number(n);if(!n||!Number.isFinite(r)||r<0)throw Error(`请输入有效的非负数值。`);return r}function M(e,t){let n=e.querySelector(`#${t}`);if(!n)throw Error(`Missing dialog element: ${t}`);return n}var N=`ratchet-meds`;function Ee(){let e;try{e=localStorage.getItem(N)}catch{return{data:f(),issue:`Ratchet 无法访问当前浏览器的本地存储。请检查浏览器隐私或站点存储设置。`,recoveryRaw:null}}if(!e)return{data:f(),issue:null,recoveryRaw:null};try{return{data:Ne(JSON.parse(e)),issue:null,recoveryRaw:null}}catch{return{data:f(),issue:`Ratchet 无法读取当前浏览器中的本地数据。原始数据尚未被覆盖。`,recoveryRaw:e}}}function De(e){localStorage.setItem(N,JSON.stringify(e))}function Oe(){localStorage.removeItem(N)}function ke(e){Me(JSON.stringify(e,null,2),`ratchet-backup-${n()}.json`)}function Ae(e){Me(e,`ratchet-recovery-${n()}.json`)}async function je(e){return Ne(JSON.parse(await e.text()))}function Me(e,t){let n=new Blob([e],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=t,document.body.append(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(r),0)}function Ne(e){if(!P(e)||e.version!==2)throw Error(`Unsupported backup`);if(!Array.isArray(e.people)||!Array.isArray(e.medications)||!Be(e.plan))throw Error(`Invalid backup`);if(!e.people.every(Le))throw Error(`Invalid people data`);let t=Pe(e.medications),n=e.people.map(e=>e.id),r=t.map(e=>e.id);if(new Set(n).size!==n.length||new Set(r).size!==r.length)throw Error(`Duplicate IDs`);let i=new Set(n);if(t.some(e=>!i.has(e.personId)))throw Error(`Medication references an unknown person`);return{version:2,people:e.people.map(e=>({id:e.id,name:e.name})),medications:t,plan:{coverThrough:e.plan.coverThrough}}}function Pe(e){if(!e.every(Re))throw Error(`Invalid medication data`);return e.map(Fe)}function Fe(e){return{id:e.id,personId:e.personId,name:e.name,strength:e.strength,unit:e.unit,packageSize:e.packageSize,packageUnit:e.packageUnit,stock:e.stock,stockBaseline:e.stockBaseline?{...e.stockBaseline}:null,schedule:Ie(e.schedule)}}function Ie(e){if(e.type===`as-needed`)return{type:`as-needed`};let t={...e.doses};return e.type===`weekly`?{type:`weekly`,days:[...e.days],doses:t}:e.type===`interval`?{type:`interval`,everyDays:e.everyDays,startDate:e.startDate,doses:t}:{type:`daily`,doses:t}}function Le(e){return P(e)&&I(e.id)&&I(e.name)&&e.name.trim().length<=30}function Re(e){return!ze(e)||!Ve(e.schedule)?!1:e.schedule.type===`as-needed`?e.stockBaseline===null:He(e.stockBaseline)&&y(e.schedule,e.stockBaseline.date,e.stockBaseline.period)>0}function ze(e){return P(e)&&I(e.id)&&I(e.personId)&&I(e.name)&&e.name.trim().length<=80&&F(e.strength)&&e.strength.length<=40&&I(e.unit)&&e.unit.trim().length<=12&&(e.packageSize===null||Ke(e.packageSize))&&F(e.packageUnit)&&e.packageUnit.length<=12&&L(e.stock)}function Be(e){return P(e)&&(e.coverThrough===``||a(e.coverThrough))}function Ve(e){if(!P(e)||!F(e.type))return!1;if(e.type===`as-needed`)return!0;if(!We(e.doses)||Ge(e.doses)<=0)return!1;if(e.type===`daily`)return!0;if(e.type===`weekly`){if(!Array.isArray(e.days)||e.days.length===0)return!1;let t=e.days;return t.every(e=>Number.isInteger(e)&&e>=1&&e<=7)&&new Set(t).size===t.length}return e.type===`interval`&&Number.isInteger(e.everyDays)&&Number(e.everyDays)>=1&&a(e.startDate)}function He(e){return P(e)&&a(e.date)&&Ue(e.period)}function Ue(e){return e===`morning`||e===`noon`||e===`evening`}function We(e){return P(e)&&L(e.morning)&&L(e.noon)&&L(e.evening)}function Ge(e){return e.morning+e.noon+e.evening}function P(e){return typeof e==`object`&&!!e}function F(e){return typeof e==`string`}function I(e){return typeof e==`string`&&e.trim().length>0}function L(e){return typeof e==`number`&&Number.isFinite(e)&&e>=0}function Ke(e){return typeof e==`number`&&Number.isFinite(e)&&e>0}var R=$(`app`),z=$(`dialog`),B=$(`import-file`),V=Ee(),H=V.data,U=V.issue,W=V.recoveryRaw,G=`home`;K(),R.addEventListener(`click`,ot),R.addEventListener(`change`,st),z.addEventListener(`click`,ct),z.addEventListener(`change`,e=>me(z,e)),B.addEventListener(`change`,lt);function K(){if(U){R.innerHTML=qe();return}R.innerHTML=`
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
        ${Je()}
      </main>

      <nav class="bottom-nav" aria-label="主导航">
        ${q(`home`,`首页`)}
        ${q(`medications`,`药品`)}
        ${q(`settings`,`设置`)}
      </nav>
    </div>
  `}function qe(){return`
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
        <p>${m(U??`Ratchet 无法读取本地数据。`)}</p>
        <p>Ratchet 已暂停继续写入，避免数据被意外覆盖。你可以先导出当前保留的数据，再检查浏览器存储设置或导入有效备份；确认这些数据不再需要时，也可以清空后重新开始。</p>
        <div class="button-row recovery-actions">
          ${W?`<button class="button button--secondary" type="button" data-action="export-recovery">导出保留数据</button>`:``}
          <button class="button button--primary" type="button" data-action="import">导入备份</button>
          <button class="button button--danger" type="button" data-action="reset-recovery">清空并重新开始</button>
        </div>
      </section>
    </main>
  `}function Je(){return G===`medications`?nt():G===`settings`?it():Ye()}function q(e,t){return`<button class="nav-btn" type="button" data-action="navigate" data-view="${e}"${G===e?` aria-current="page"`:``}>${t}</button>`}function Ye(){return H.people.length===0?`
      <section class="welcome-card">
        <p class="eyebrow">Family medication planner</p>
        <h1>药要准备到哪一天？</h1>
        <p>先添加家庭成员，再记录药品库存和服用计划。设置一个目标日期后，Ratchet 会自动推算库存和需要补充的药量。</p>
        <button class="button button--primary" type="button" data-action="add-person">添加成员</button>
      </section>
    `:`
    <section class="page-head">
      <div>
        <h1>用药计划</h1>
        <p>根据当前库存和服用计划，计算补足到目标日期需要的药量。</p>
      </div>
    </section>

    ${Xe()}
    ${Ze()}
    ${et()}
  `}function Xe(){let e=m(H.plan.coverThrough),t=n(),r=X(),i=!!(H.plan.coverThrough&&l(H.plan.coverThrough,t)<0);return`
    <section class="card card--raised plan-section" aria-label="备药目标日期">
      <div class="plan-fields">
        <label class="field" for="cover-through">
          <span class="field-label">目标日期</span>
          <input class="input" id="cover-through" type="date" value="${e}" min="${t}" />
        </label>
      </div>
      ${r?`<p class="plan-summary">以今天的预计库存为基准，补足至 ${d(H.plan.coverThrough)}。</p>`:`<p class="plan-hint${i?` text-danger`:``}">${i?`目标日期已过，请更新。`:`设置日期后即可生成补药清单。`}</p>`}
    </section>
  `}function Ze(){if(!X())return Y(`需要补充`,J(`设置“目标日期”后生成补药清单。`));let e=H.people.map(e=>{let t=Z(e.id),r=t.map(e=>({medication:e,amount:le(e,n(),H.plan.coverThrough)})).filter(e=>e.amount!==null&&e.amount>0),i=t.filter(e=>e.schedule.type===`as-needed`);if(r.length===0&&i.length===0)return``;let a=r.map(({medication:e,amount:t})=>Qe(e,t??0)).join(``),o=i.map($e).join(``);return`
      <div class="person-block">
        <div class="person-heading">
          <h3>${m(e.name)}</h3>
        </div>
        <div class="medication-list">${a}${o}</div>
      </div>
    `}).join(``);return e?Y(`需要补充`,e):Y(`需要补充`,at(`按当前记录，库存已足够覆盖到目标日期。`))}function Qe(e,t){let r=S(e),i=r&&l(r,n())<=0,a=ie(e,t);return`
    <article class="medication-row">
      <div class="medication-copy">
        <div class="medication-title-line">
          <strong>${m(e.name)}</strong>
          ${e.strength?`<span>${m(e.strength)}</span>`:``}
        </div>
        <small class="${i?`text-danger`:``}">${i?`预计 ${u(r)} 前后库存不足`:g(e)}</small>
      </div>
      <div class="bring-amount ${i?`text-danger`:`text-warning`}">
        <strong>${h(t)} ${m(e.unit)}</strong>
        ${a?`<small>${a}</small>`:``}
      </div>
    </article>
  `}function $e(e){let t=x(e,n());return`
    <article class="medication-row">
      <div class="medication-copy">
        <div class="medication-title-line">
          <strong>${m(e.name)}</strong>
          ${e.strength?`<span>${m(e.strength)}</span>`:``}
        </div>
        <small>按需服用，补药数量需手动判断</small>
      </div>
      <div class="bring-amount text-muted">
        <strong>${h(t)} ${m(e.unit)}</strong>
        <small>预计当前库存</small>
      </div>
    </article>
  `}function et(){return Y(`库存`,H.people.map(e=>{let t=Z(e.id);return t.length===0?``:`
      <div class="person-block">
        <div class="person-heading">
          <h3>${m(e.name)}</h3>
          <span>${t.length} 种药</span>
        </div>
        <div class="medication-list">
          ${t.map(tt).join(``)}
        </div>
      </div>
    `}).join(``)||J(`还没有记录药品。`))}function tt(e){let t=x(e,n()),r=ft(e),i=ce(e);return`
    <article class="medication-row">
      <div class="medication-copy">
        <div class="medication-title-line">
          <strong>${m(e.name)}</strong>
          ${e.strength?`<span>${m(e.strength)}</span>`:``}
        </div>
        <small>${g(e)}</small>
      </div>
      <div class="stock-copy">
        <strong>${h(t)} ${m(e.unit)}</strong>
        <small>${e.schedule.type===`as-needed`?`按需服用`:i?`预计可用至 ${u(i)}`:`长期充足`}</small>
        <span class="badge badge--${r.tone}">${r.label}</span>
      </div>
    </article>
  `}function nt(){return`
    <section class="page-head medications-page-head">
      <div>
        <h1>药品</h1>
        <p>记录药品、库存和服用计划。</p>
      </div>
      ${H.people.length>0?`<button class="button button--soft add-medication-btn" type="button" data-action="add-medication"><span aria-hidden="true">＋</span> 添加</button>`:`<button class="button button--soft add-medication-btn" type="button" data-action="add-person">添加成员</button>`}
    </section>
    <div class="medication-sections">${H.people.map(e=>{let t=Z(e.id);return`
      <section class="medication-person-section">
        <div class="medication-person-heading">
          <h2>${m(e.name)}</h2>
          <span>${t.length} 种药</span>
        </div>
        ${t.length>0?`
          <div class="manage-list">
            ${t.map(rt).join(``)}
          </div>
        `:J(`暂无药品。`,!0)}
      </section>
    `}).join(``)||J(`还没有家庭成员。`)}</div>
  `}function rt(e){let t=x(e,n()),r=ft(e),i=m(e.id);return`
    <article class="manage-row">
      <button class="manage-main" type="button" data-action="edit-medication" data-id="${i}">
        <span class="manage-copy">
          <strong>${m(e.name)}</strong>
          ${e.strength?`<small >${m(e.strength)}</small>`:``}
          <small>${g(e)}</small>
        </span>
      </button>
      <button class="manage-stock-button" data-tone="${r.tone}" type="button" data-action="stock" data-id="${i}" aria-label="管理 ${m(e.name)} 的库存">
        <strong>${h(t)} ${m(e.unit)}</strong>
        <small>库存</small>
      </button>
    </article>
  `}function it(){return`
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
        ${H.people.map(e=>{let t=Z(e.id).length,n=m(e.id);return`
      <div class="settings-row">
        <div class="settings-copy">
          <strong>${m(e.name)}</strong>
          <small>${t} 种药</small>
        </div>
        <div class="button-row">
          <button class="button button--secondary compact-action" type="button" data-action="edit-person" data-id="${n}">编辑</button>
          <button class="button button--danger compact-action" type="button" data-action="delete-person" data-id="${n}">删除</button>
        </div>
      </div>
    `}).join(``)||J(`还没有家庭成员。`,!0)}
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
  `}function J(e,t=!1){return`
    <div class="empty-state${t?` app-empty-state--compact`:``}">
      <p class="empty-state-copy">${m(e)}</p>
    </div>
  `}function at(e){return`
    <div class="alert alert--success">
      <p class="alert-copy">${m(e)}</p>
    </div>
  `}function Y(e,t){return`
    <section class="dashboard-section">
      <div class="section-heading"><h2>${m(e)}</h2></div>
      <div>${t}</div>
    </section>
  `}function ot(e){let t=e.target.closest(`[data-action]`);if(!t)return;let n=t.dataset.action;if(n===`export-recovery`){W&&Ae(W);return}if(n===`reset-recovery`){ut();return}if(n===`import`){B.click();return}if(!U){if(n===`navigate`){G=t.dataset.view,K();return}if(n===`add-person`){de(z,H,Q);return}if(n===`edit-person`){let e=pt(t.dataset.id);e&&de(z,H,Q,e);return}if(n===`delete-person`){dt(t.dataset.id);return}if(n===`add-medication`){fe(z,H,Q);return}if(n===`edit-medication`){let e=mt(t.dataset.id);e&&fe(z,H,Q,e);return}if(n===`stock`){let e=mt(t.dataset.id);e&&pe(z,e,Q);return}n===`export`&&ke(H)}}function st(e){if(U)return;let t=e.target;if(t.id!==`cover-through`)return;let r=t.value,i=n();if(r&&l(r,i)<0){window.alert(`“目标日期”不能早于今天。`),K();return}H.plan={coverThrough:r},Q()}function ct(e){let t=e.target.closest(`[data-dialog-action]`);if(t){if(t.dataset.dialogAction===`close`){z.close();return}if(t.dataset.dialogAction===`delete-medication`){let e=t.dataset.id;e&&window.confirm(`删除这条药品记录？`)&&(H.medications=H.medications.filter(t=>t.id!==e),Q(),z.close())}}}async function lt(){let e=B.files?.[0];if(B.value=``,!e||!U&&(H.people.length>0||H.medications.length>0)&&!window.confirm(`导入备份会替换当前数据。继续？`))return;let t;try{t=await je(e)}catch{window.alert(`无法读取这个 Ratchet 备份文件。`);return}try{De(t)}catch{H=t,U=`备份已经读取，但 Ratchet 无法写入当前浏览器的本地存储。请先导出保留数据，再检查浏览器存储设置。`,W=JSON.stringify(t,null,2),K();return}H=t,U=null,W=null,G=`home`,K()}function ut(){if(window.confirm(`清空当前浏览器中的 Ratchet 本地数据并重新开始？建议先导出保留数据。`)){try{Oe()}catch{window.alert(`Ratchet 仍无法访问当前浏览器的本地存储，暂时不能清空数据。请先检查浏览器存储设置。`);return}H=f(),U=null,W=null,G=`home`,K()}}function dt(e){if(!e)return;let t=pt(e);if(!t)return;let n=Z(e).length,r=n>0?`删除“${t.name}”会同时删除其 ${n} 种药品。继续？`:`删除“${t.name}”？`;window.confirm(r)&&(H.people=H.people.filter(t=>t.id!==e),H.medications=H.medications.filter(t=>t.personId!==e),Q())}function ft(e){if(e.schedule.type===`as-needed`)return{tone:`neutral`,label:`按需`};let t=S(e),r=n();if(t&&l(t,r)<=0)return{tone:`danger`,label:`库存不足`};if(X()){let t=le(e,r,H.plan.coverThrough);return t!==null&&t>0?{tone:`warning`,label:`目标期内需补`}:{tone:`success`,label:`可用至目标日`}}return{tone:`success`,label:`库存充足`}}function X(){return!!(H.plan.coverThrough&&l(H.plan.coverThrough,n())>=0)}function Z(e){return H.medications.filter(t=>t.personId===e)}function pt(e){return H.people.find(t=>t.id===e)}function mt(e){return H.medications.find(t=>t.id===e)}function Q(){if(!U){try{De(H)}catch{U=`Ratchet 无法保存到当前浏览器的本地存储。当前数据仍保留在本页内，请先导出保留数据，再检查浏览器存储设置。`,W=JSON.stringify(H,null,2)}K()}}function $(e){let t=document.getElementById(e);if(!t)throw Error(`Missing element: ${e}`);return t}