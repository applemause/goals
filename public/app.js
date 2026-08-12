const app = document.querySelector('#app');
const template = document.querySelector('#goal-form-template');
const state = { workspaceId: null, workspace: null, goals: [], selectedId: null };

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Не удалось выполнить действие.');
  return data;
};

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
const dateLabel = (value) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(value));

function notice(message) {
  let el = document.querySelector('.notice');
  if (!el) { el = document.createElement('div'); el.className = 'notice'; document.body.append(el); }
  el.textContent = message;
  el.classList.add('is-visible');
  window.setTimeout(() => el.classList.remove('is-visible'), 2600);
}

async function ensureWorkspace() {
  const saved = localStorage.getItem('goals.workspaceId');
  if (saved) {
    try {
      const data = await api(`/api/workspaces/${saved}`);
      state.workspaceId = saved; state.workspace = data.workspace; state.goals = data.goals;
      return;
    } catch { localStorage.removeItem('goals.workspaceId'); }
  }
  const created = await api('/api/workspaces', { method: 'POST', body: JSON.stringify({ name: 'Мои цели' }) });
  localStorage.setItem('goals.workspaceId', created.id);
  state.workspaceId = created.id;
  const data = await api(`/api/workspaces/${created.id}`);
  state.workspace = data.workspace; state.goals = data.goals;
}

async function refresh() {
  const data = await api(`/api/workspaces/${state.workspaceId}`);
  state.workspace = data.workspace; state.goals = data.goals;
}

function milestoneValues(milestone) {
  const target = Math.max(0.01, Number(milestone.progressTarget) || 1);
  const current = Math.max(0, Math.min(target, Number(milestone.progressCurrent) || 0));
  return { current, target, percentage: Math.round((current / target) * 100) };
}

function segmentDimensions(count) {
  const preferredRatio = 1.65;
  let best = { columns: count, rows: 1, score: Number.POSITIVE_INFINITY };
  for (let rows = 1; rows <= count; rows += 1) {
    const columns = Math.ceil(count / rows);
    const empty = columns * rows - count;
    const score = Math.abs(columns / rows - preferredRatio) + (empty / count) * 0.7;
    if (score < best.score) best = { columns, rows, score };
  }
  return best;
}

function segmentMarkup(current, target) {
  const count = Math.round(target);
  const { columns, rows } = segmentDimensions(count);
  const cells = Array.from({ length: count }, (_, index) => {
    const fill = Math.max(0, Math.min(1, current - index));
    const className = fill >= 1 ? 'is-filled' : fill > 0 ? 'is-partial' : '';
    const style = fill > 0 && fill < 1 ? ` style="--segment-progress:${Math.round(fill * 100)}%"` : '';
    return `<span class="segment-cell ${className}"${style}></span>`;
  }).join('');
  const density = count > 160 ? 'dense' : count > 64 ? 'compact' : '';
  return `<span class="segment-grid ${density}" style="--segment-columns:${columns};--segment-rows:${rows}" aria-hidden="true">${cells}</span>`;
}

function tileMarkup(milestone) {
  const { current, target, percentage } = milestoneValues(milestone);
  const complete = current >= target;
  const measured = target > 1 || milestone.unit;
  const segmented = Number.isInteger(target) && target >= 4 && target <= 366;
  const count = measured ? `<span class="tile-count">${current}/${target}${milestone.unit ? ` ${escapeHtml(milestone.unit)}` : ''}</span>` : '';
  const visual = segmented
    ? segmentMarkup(current, target)
    : `<span class="tile-fill" style="width:${percentage}%"></span><span class="tile-mark">${complete ? '✓' : ''}</span>`;
  return `<span class="tile-wrap"><span class="tile ${milestone.state} ${segmented ? 'segmented' : ''}" aria-label="${escapeHtml(milestone.label)}: ${current} из ${target}${milestone.unit ? ` ${escapeHtml(milestone.unit)}` : ''}">${visual}</span><span class="tile-label">${escapeHtml(milestone.label)}</span>${count}</span>`;
}

function progressMarkup(goal, detail = false) {
  const milestones = goal.milestones || [];
  if (!milestones.length) return '<span class="goal-meta">Добавьте этапы, чтобы видеть путь.</span>';
  return `<span class="tiles ${detail ? 'detail-tiles' : ''}">${milestones.map((item) => tileMarkup(item)).join('')}</span>`;
}

function formatProgressNumber(value) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value);
}

function overallProgress(goal) {
  const milestones = goal.milestones || [];
  if (!milestones.length) return null;
  const items = milestones.map((milestone) => ({ ...milestoneValues(milestone), unit: String(milestone.unit || '').trim() }));
  const units = new Set(items.map((item) => item.unit.toLocaleLowerCase('ru-RU')));
  const oneScale = units.size === 1;

  if (oneScale) {
    const current = items.reduce((sum, item) => sum + item.current, 0);
    const target = items.reduce((sum, item) => sum + item.target, 0);
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
    const unit = items[0].unit;
    const allBinary = !unit && items.every((item) => item.target === 1);
    const detail = unit
      ? `${formatProgressNumber(current)} из ${formatProgressNumber(target)} ${escapeHtml(unit)}`
      : allBinary ? `${formatProgressNumber(current)} из ${formatProgressNumber(target)} этапов` : '';
    return { percentage, detail };
  }

  const percentage = Math.round(items.reduce((sum, item) => sum + (item.current / item.target) * 100, 0) / items.length);
  return { percentage, detail: `${milestones.length} подцели` };
}

function overallProgressMarkup(goal) {
  const progress = overallProgress(goal);
  if (!progress) return '';
  return `<span class="overall-progress" data-overall-progress><span class="overall-progress-copy"><span>Общий прогресс</span><span><strong>${progress.percentage}%</strong>${progress.detail ? ` · ${progress.detail}` : ''}</span></span><span class="overall-progress-track" role="progressbar" aria-label="Общий прогресс цели" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percentage}"><span style="width:${progress.percentage}%"></span></span></span>`;
}

function valueMarkup(goal) {
  if (goal.goalType === 'collection') return escapeHtml(goal.currentValue);
  return `${escapeHtml(goal.currentValue)} <span aria-hidden="true">→</span> ${escapeHtml(goal.targetValue)}`;
}

function goalCard(goal) {
  return `<li><button class="goal-card" data-open-goal="${goal.id}"><span class="goal-summary"><span class="goal-top"><span class="goal-title">${escapeHtml(goal.title)}</span><span class="chevron">›</span></span><span class="goal-value">${valueMarkup(goal)}</span>${goal.meta ? `<span class="goal-meta">${escapeHtml(goal.meta)}</span>` : ''}</span><span class="goal-progress-column">${overallProgressMarkup(goal)}${progressMarkup(goal)}</span></button></li>`;
}

function renderHome() {
  app.innerHTML = `<div class="app-shell"><header class="app-header"><h1 class="app-title">Цели</h1><div class="header-actions"><button class="header-link" data-new-workspace>Новая доска</button><button class="add-goal" aria-label="Добавить цель" data-add-goal>+</button></div></header><ul class="goal-list">${state.goals.length ? state.goals.map(goalCard).join('') : '<li class="empty">Пока нет целей. Создайте первую.</li>'}</ul></div>`;
  app.querySelector('[data-add-goal]')?.addEventListener('click', () => openGoalDialog());
  app.querySelector('[data-new-workspace]')?.addEventListener('click', newWorkspace);
  app.querySelectorAll('[data-open-goal]').forEach((button) => button.addEventListener('click', () => { state.selectedId = button.dataset.openGoal; renderDetail(); }));
}

function milestoneEditorMarkup(milestone) {
  const { current, target } = milestoneValues(milestone);
  return `<li class="milestone-card" data-milestone-id="${milestone.id}"><form class="milestone-form" data-edit-milestone="${milestone.id}"><label class="milestone-title-field"><span class="visually-hidden">Название этапа</span><input name="label" maxlength="60" value="${escapeHtml(milestone.label)}" aria-label="Название этапа" required /></label><div class="milestone-tools"><button class="icon-button drag-handle" type="button" aria-label="Перетащить этап. Стрелки вверх и вниз меняют порядок" title="Изменить порядок"><span aria-hidden="true">⠿</span></button><button class="icon-button delete-milestone" type="button" data-delete-milestone="${milestone.id}" aria-label="Удалить этап" title="Удалить этап"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" /></svg></button></div><div class="milestone-fields"><label>Сделано<input name="progressCurrent" type="number" min="0" max="1000000" step="any" value="${current}" required /></label><label>Из<input name="progressTarget" type="number" min="0.01" max="1000000" step="any" value="${target}" required /></label><label>Единица<input name="unit" maxlength="24" value="${escapeHtml(milestone.unit || '')}" placeholder="дней, %, км" /></label><label>Статус<select name="state"><option value="future" ${milestone.state === 'future' ? 'selected' : ''}>Впереди</option><option value="current" ${milestone.state === 'current' ? 'selected' : ''}>Сейчас</option><option value="done" ${milestone.state === 'done' ? 'selected' : ''}>Сделано</option></select></label></div></form></li>`;
}

function renderDetail() {
  const goal = state.goals.find((item) => item.id === state.selectedId);
  if (!goal) return renderHome();
  app.innerHTML = `<div class="app-shell"><section class="panel"><button class="back" data-back>‹ Цели</button><header class="detail-head"><div class="detail-summary"><h1 class="goal-title">${escapeHtml(goal.title)}</h1><div class="goal-value">${valueMarkup(goal)}</div>${goal.meta ? `<div class="goal-meta">${escapeHtml(goal.meta)}</div>` : ''}</div><div class="detail-progress">${overallProgressMarkup(goal)}${progressMarkup(goal, true)}</div></header><section class="detail-section"><div class="section-title-row"><h2>Этапы</h2><span class="autosave-status" data-autosave-status aria-live="polite"></span></div><p class="section-note">Меняйте данные прямо в полях — они сохраняются автоматически. Этапы можно перетаскивать за маркер справа.</p><ul class="milestone-list">${goal.milestones.length ? goal.milestones.map(milestoneEditorMarkup).join('') : '<li class="goal-meta">Пока нет этапов.</li>'}</ul><form class="form add-milestone" data-add-milestone><h3>Новый этап</h3><label>Название<input name="label" maxlength="60" placeholder="Например, Курс B2" required /></label><div class="milestone-fields"><label>Сделано<input name="progressCurrent" type="number" min="0" max="1000000" step="any" value="0" required /></label><label>Из<input name="progressTarget" type="number" min="0.01" max="1000000" step="any" value="1" required /></label><label>Единица<input name="unit" maxlength="24" placeholder="дней, %, км" /></label><label>Статус<select name="state"><option value="future">Впереди</option><option value="current">Сейчас</option><option value="done">Сделано</option></select></label></div><button class="button button-primary" type="submit">Добавить этап</button></form></section><section class="detail-section"><h2>Последние изменения</h2><ul class="event-list">${goal.events.length ? goal.events.map((event) => `<li class="event-row"><span><span class="event-title">${escapeHtml(event.title)}</span>${event.detail ? `<span class="event-detail">${escapeHtml(event.detail)}</span>` : ''}</span><time class="event-date">${dateLabel(event.occurredAt)}</time></li>`).join('') : '<li class="goal-meta">Пока нет записей.</li>'}</ul><form class="form add-event" data-add-event><label>Что изменилось?<input name="title" maxlength="120" placeholder="Например, сходил на Sprachcafé" required /></label><label>Деталь (необязательно)<input name="detail" maxlength="160" placeholder="90 минут" /></label><button class="button button-primary" type="submit">Записать</button></form></section><section class="detail-section"><h2>Настройки цели</h2><div class="settings-actions"><button class="button" data-edit-goal>Изменить цель</button><button class="button button-danger" data-delete-goal>Удалить цель</button></div></section></section></div>`;
  app.querySelector('[data-back]').addEventListener('click', () => { state.selectedId = null; renderHome(); });
  app.querySelectorAll('[data-edit-milestone]').forEach((form) => {
    form.addEventListener('submit', (event) => event.preventDefault());
    form.addEventListener('input', scheduleMilestoneSave);
    form.addEventListener('change', scheduleMilestoneSave);
  });
  app.querySelectorAll('[data-delete-milestone]').forEach((button) => button.addEventListener('click', deleteMilestone));
  bindMilestoneReordering();
  app.querySelector('[data-add-milestone]').addEventListener('submit', addMilestone);
  app.querySelector('[data-add-event]').addEventListener('submit', addEvent);
  app.querySelector('[data-edit-goal]').addEventListener('click', () => openGoalDialog(goal));
  app.querySelector('[data-delete-goal]').addEventListener('click', deleteGoal);
}

function openGoalDialog(goal = null) {
  const dialog = document.createElement('dialog'); dialog.className = 'dialog';
  dialog.innerHTML = `<h2 class="dialog-title">${goal ? 'Изменить цель' : 'Новая цель'}</h2>${template.innerHTML}`;
  const form = dialog.querySelector('form');
  if (goal) { for (const [name, value] of Object.entries(goal)) { const field = form.elements.namedItem(name); if (field && typeof value === 'string') field.value = value; } }
  form.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const payload = { workspaceId: state.workspaceId, ...data, accent: 'vermillion' };
    try {
      if (goal) await api(`/api/goals/${goal.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await api('/api/goals', { method: 'POST', body: JSON.stringify({ ...payload, milestones: [] }) });
      dialog.close(); await refresh(); goal ? renderDetail() : renderHome(); notice('Сохранено');
    } catch (error) { notice(error.message); }
  });
  document.body.append(dialog); dialog.addEventListener('close', () => dialog.remove()); dialog.showModal();
}

async function addMilestone(event) {
  event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
  try { await api(`/api/goals/${state.selectedId}/milestones`, { method: 'POST', body: JSON.stringify({ workspaceId: state.workspaceId, ...data }) }); await refresh(); renderDetail(); notice('Этап добавлен'); } catch (error) { notice(error.message); }
}

function setAutosaveStatus(message, isError = false) {
  const status = app.querySelector('[data-autosave-status]');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

function milestoneData(form) {
  const data = Object.fromEntries(new FormData(form));
  const target = Math.max(0.01, Number(data.progressTarget) || 1);
  const current = Math.max(0, Math.min(target, Number(data.progressCurrent) || 0));
  form.elements.progressCurrent.value = current;
  form.elements.progressTarget.value = target;
  return { ...data, progressCurrent: current, progressTarget: target };
}

function updateMilestonePreview(form, data) {
  const goal = state.goals.find((item) => item.id === state.selectedId);
  const milestone = goal?.milestones.find((item) => item.id === form.dataset.editMilestone);
  if (!goal || !milestone) return;
  Object.assign(milestone, data);
  const overall = app.querySelector('.detail-head [data-overall-progress]');
  if (overall) overall.outerHTML = overallProgressMarkup(goal);
  const tiles = app.querySelector('.detail-head .tiles');
  if (tiles) tiles.outerHTML = progressMarkup(goal, true);
}

function scheduleMilestoneSave(event) {
  const form = event.currentTarget;
  window.clearTimeout(form.saveTimer);
  if (!form.checkValidity()) {
    setAutosaveStatus('Проверьте значения', true);
    return;
  }
  const data = milestoneData(form);
  updateMilestonePreview(form, data);
  setAutosaveStatus('Сохраняю…');
  form.saveTimer = window.setTimeout(() => persistMilestone(form), event.type === 'change' ? 80 : 550);
}

async function persistMilestone(form) {
  window.clearTimeout(form.saveTimer);
  if (!form.isConnected || !form.checkValidity()) return;
  const data = milestoneData(form);
  const version = (form.saveVersion || 0) + 1;
  form.saveVersion = version;
  try {
    await api(`/api/milestones/${form.dataset.editMilestone}`, { method: 'PUT', body: JSON.stringify({ workspaceId: state.workspaceId, ...data }) });
    if (form.saveVersion === version) setAutosaveStatus('Сохранено');
  } catch (error) {
    if (form.saveVersion === version) setAutosaveStatus('Не сохранено', true);
    notice(error.message);
  }
}

async function persistMilestoneOrder(list) {
  const ids = [...list.querySelectorAll('[data-milestone-id]')].map((item) => item.dataset.milestoneId);
  const goal = state.goals.find((item) => item.id === state.selectedId);
  if (!goal) return;
  const byId = new Map(goal.milestones.map((item) => [item.id, item]));
  goal.milestones = ids.map((id) => byId.get(id)).filter(Boolean);
  const tiles = app.querySelector('.detail-head .tiles');
  if (tiles) tiles.outerHTML = progressMarkup(goal, true);
  setAutosaveStatus('Сохраняю порядок…');
  try {
    await api(`/api/goals/${goal.id}/milestones/order`, { method: 'PUT', body: JSON.stringify({ workspaceId: state.workspaceId, milestoneIds: ids }) });
    setAutosaveStatus('Порядок сохранён');
  } catch (error) {
    notice(error.message);
    await refresh(); renderDetail();
  }
}

function bindMilestoneReordering() {
  const list = app.querySelector('.milestone-list');
  if (!list) return;
  list.querySelectorAll('.drag-handle').forEach((handle) => {
    const item = handle.closest('[data-milestone-id]');
    handle.addEventListener('keydown', (event) => {
      if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const sibling = event.key === 'ArrowUp' ? item.previousElementSibling : item.nextElementSibling;
      if (!sibling?.matches('[data-milestone-id]')) return;
      if (event.key === 'ArrowUp') list.insertBefore(item, sibling);
      else list.insertBefore(sibling, item);
      handle.focus();
      persistMilestoneOrder(list);
    });
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const initialOrder = [...list.querySelectorAll('[data-milestone-id]')].map((row) => row.dataset.milestoneId).join(',');
      item.classList.add('is-dragging');
      handle.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        const over = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest('[data-milestone-id]');
        if (!over || over === item || over.parentElement !== list) return;
        const rect = over.getBoundingClientRect();
        list.insertBefore(item, moveEvent.clientY < rect.top + rect.height / 2 ? over : over.nextElementSibling);
        if (moveEvent.clientY < 70) window.scrollBy(0, -12);
        if (moveEvent.clientY > window.innerHeight - 70) window.scrollBy(0, 12);
      };
      const finish = () => {
        item.classList.remove('is-dragging');
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', finish);
        handle.removeEventListener('pointercancel', finish);
        const nextOrder = [...list.querySelectorAll('[data-milestone-id]')].map((row) => row.dataset.milestoneId).join(',');
        if (nextOrder !== initialOrder) persistMilestoneOrder(list);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', finish);
      handle.addEventListener('pointercancel', finish);
    });
  });
}

async function deleteMilestone(event) {
  const id = event.currentTarget.dataset.deleteMilestone;
  if (!confirm('Удалить этот этап?')) return;
  const form = event.currentTarget.closest('form');
  if (form) window.clearTimeout(form.saveTimer);
  try {
    await api(`/api/milestones/${id}?workspaceId=${state.workspaceId}`, { method: 'DELETE' });
    await refresh(); renderDetail(); notice('Этап удалён');
  } catch (error) { notice(error.message); }
}

async function addEvent(event) {
  event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
  try { await api(`/api/goals/${state.selectedId}/events`, { method: 'POST', body: JSON.stringify({ workspaceId: state.workspaceId, ...data }) }); await refresh(); renderDetail(); notice('Запись добавлена'); } catch (error) { notice(error.message); }
}

async function deleteGoal() {
  if (!confirm('Удалить эту цель и все её записи?')) return;
  await api(`/api/goals/${state.selectedId}?workspaceId=${state.workspaceId}`, { method: 'DELETE' });
  state.selectedId = null; await refresh(); renderHome(); notice('Цель удалена');
}

async function newWorkspace() {
  if (!confirm('Создать новую доску? Текущая останется доступна в этом браузере только через прежнюю ссылку.')) return;
  const created = await api('/api/workspaces', { method: 'POST', body: JSON.stringify({ name: 'Мои цели' }) });
  localStorage.setItem('goals.workspaceId', created.id); state.workspaceId = created.id; state.selectedId = null; await refresh(); renderHome(); notice('Создана новая доска');
}

(async () => { try { await ensureWorkspace(); renderHome(); } catch (error) { app.innerHTML = `<div class="app-shell"><p class="empty">${escapeHtml(error.message || 'Не удалось загрузить приложение.')}</p></div>`; } })();
