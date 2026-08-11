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

function tileMarkup(milestone) {
  const { current, target, percentage } = milestoneValues(milestone);
  const complete = current >= target;
  const measured = target > 1 || milestone.unit;
  const count = measured ? `<span class="tile-count">${current}/${target}${milestone.unit ? ` ${escapeHtml(milestone.unit)}` : ''}</span>` : '';
  return `<span class="tile-wrap"><span class="tile ${milestone.state}" aria-label="${escapeHtml(milestone.label)}: ${percentage}%"><span class="tile-fill" style="width:${percentage}%"></span><span class="tile-mark">${complete ? '✓' : ''}</span></span><span class="tile-label">${escapeHtml(milestone.label)}</span>${count}</span>`;
}

function progressMarkup(goal, detail = false) {
  const milestones = goal.milestones || [];
  if (!milestones.length) return '<div class="goal-meta">Добавьте этапы, чтобы видеть путь.</div>';
  return `<div class="tiles ${detail ? 'detail-tiles' : ''}">${milestones.map((item) => tileMarkup(item)).join('')}</div>`;
}

function valueMarkup(goal) {
  if (goal.goalType === 'collection') return escapeHtml(goal.currentValue);
  return `${escapeHtml(goal.currentValue)} <span aria-hidden="true">→</span> ${escapeHtml(goal.targetValue)}`;
}

function goalCard(goal) {
  return `<li><button class="goal-card" data-open-goal="${goal.id}"><span class="goal-top"><span class="goal-title">${escapeHtml(goal.title)}</span><span class="chevron">›</span></span><span class="goal-value">${valueMarkup(goal)}</span>${goal.meta ? `<span class="goal-meta">${escapeHtml(goal.meta)}</span>` : ''}${progressMarkup(goal)}</button></li>`;
}

function renderHome() {
  app.innerHTML = `<div class="app-shell"><header class="app-header"><h1 class="app-title">Цели</h1><div class="header-actions"><button class="header-link" data-new-workspace>Новая доска</button><button class="add-goal" aria-label="Добавить цель" data-add-goal>+</button></div></header><ul class="goal-list">${state.goals.length ? state.goals.map(goalCard).join('') : '<li class="empty">Пока нет целей. Создайте первую.</li>'}</ul></div>`;
  app.querySelector('[data-add-goal]')?.addEventListener('click', () => openGoalDialog());
  app.querySelector('[data-new-workspace]')?.addEventListener('click', newWorkspace);
  app.querySelectorAll('[data-open-goal]').forEach((button) => button.addEventListener('click', () => { state.selectedId = button.dataset.openGoal; renderDetail(); }));
}

function milestoneEditorMarkup(milestone) {
  const { current, target } = milestoneValues(milestone);
  return `<li class="milestone-card"><form class="milestone-form" data-edit-milestone="${milestone.id}"><label class="milestone-title-field">Название этапа<input name="label" maxlength="60" value="${escapeHtml(milestone.label)}" required /></label><div class="milestone-fields"><label>Сделано<input name="progressCurrent" type="number" min="0" max="1000000" step="any" value="${current}" required /></label><label>Из<input name="progressTarget" type="number" min="0.01" max="1000000" step="any" value="${target}" required /></label><label>Единица<input name="unit" maxlength="24" value="${escapeHtml(milestone.unit || '')}" placeholder="дней, %, км" /></label><label>Статус<select name="state"><option value="future" ${milestone.state === 'future' ? 'selected' : ''}>Впереди</option><option value="current" ${milestone.state === 'current' ? 'selected' : ''}>Сейчас</option><option value="done" ${milestone.state === 'done' ? 'selected' : ''}>Сделано</option></select></label></div><div class="milestone-actions"><button class="button" type="submit">Сохранить</button><button class="text-button delete-milestone" type="button" data-delete-milestone="${milestone.id}">Удалить</button></div></form></li>`;
}

function renderDetail() {
  const goal = state.goals.find((item) => item.id === state.selectedId);
  if (!goal) return renderHome();
  app.innerHTML = `<div class="app-shell"><section class="panel"><button class="back" data-back>‹ Цели</button><header class="detail-head"><h1 class="goal-title">${escapeHtml(goal.title)}</h1><div class="goal-value">${valueMarkup(goal)}</div>${goal.meta ? `<div class="goal-meta">${escapeHtml(goal.meta)}</div>` : ''}${progressMarkup(goal, true)}</header><section class="detail-section"><h2>Этапы</h2><p class="section-note">Для простого этапа используйте 0 из 1, а после выполнения — 1 из 1.</p><ul class="milestone-list">${goal.milestones.length ? goal.milestones.map(milestoneEditorMarkup).join('') : '<li class="goal-meta">Пока нет этапов.</li>'}</ul><form class="form add-milestone" data-add-milestone><h3>Новый этап</h3><label>Название<input name="label" maxlength="60" placeholder="Например, Курс B2" required /></label><div class="milestone-fields"><label>Сделано<input name="progressCurrent" type="number" min="0" max="1000000" step="any" value="0" required /></label><label>Из<input name="progressTarget" type="number" min="0.01" max="1000000" step="any" value="1" required /></label><label>Единица<input name="unit" maxlength="24" placeholder="дней, %, км" /></label><label>Статус<select name="state"><option value="future">Впереди</option><option value="current">Сейчас</option><option value="done">Сделано</option></select></label></div><button class="button" type="submit">Добавить этап</button></form></section><section class="detail-section"><h2>Последние изменения</h2><ul class="event-list">${goal.events.length ? goal.events.map((event) => `<li class="event-row"><span><span class="event-title">${escapeHtml(event.title)}</span>${event.detail ? `<span class="event-detail">${escapeHtml(event.detail)}</span>` : ''}</span><time class="event-date">${dateLabel(event.occurredAt)}</time></li>`).join('') : '<li class="goal-meta">Пока нет записей.</li>'}</ul><form class="form add-event" data-add-event><label>Что изменилось?<input name="title" maxlength="120" placeholder="Например, сходил на Sprachcafé" required /></label><label>Деталь (необязательно)<input name="detail" maxlength="160" placeholder="90 минут" /></label><button class="button button-primary" type="submit">Записать</button></form></section><section class="detail-section"><h2>Настройки цели</h2><div class="settings-actions"><button class="button" data-edit-goal>Изменить цель</button><button class="button button-danger" data-delete-goal>Удалить цель</button></div></section></section></div>`;
  app.querySelector('[data-back]').addEventListener('click', () => { state.selectedId = null; renderHome(); });
  app.querySelectorAll('[data-edit-milestone]').forEach((form) => form.addEventListener('submit', saveMilestone));
  app.querySelectorAll('[data-delete-milestone]').forEach((button) => button.addEventListener('click', deleteMilestone));
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

async function saveMilestone(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  try {
    await api(`/api/milestones/${form.dataset.editMilestone}`, { method: 'PUT', body: JSON.stringify({ workspaceId: state.workspaceId, ...data }) });
    await refresh(); renderDetail(); notice('Этап сохранён');
  } catch (error) { notice(error.message); }
}

async function deleteMilestone(event) {
  const id = event.currentTarget.dataset.deleteMilestone;
  if (!confirm('Удалить этот этап?')) return;
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
