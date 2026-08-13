const app = document.querySelector('#app');
const supportedLanguages = ['en', 'de', 'ru'];
const savedLanguage = localStorage.getItem('goals.language');
const state = { user: null, workspaceId: null, workspace: null, goals: [], selectedId: null, lang: supportedLanguages.includes(savedLanguage) ? savedLanguage : 'en', screen: 'register' };

const translations = {
  en: {
    appTitle: 'Path — goals', brand: 'Goals', heroTitle: 'See the path.<br />Keep moving.', heroText: 'A personal tracker without the noise. A big goal, clear milestones, and honest progress.',
    register: 'Sign up', login: 'Log in', createAccount: 'Create account', welcomeBack: 'Welcome back', registerNote: 'After signing up, you’ll get three simple demo goals. You can delete or reshape them.', loginNote: 'Your goals will be waiting right where you left them.', password: 'Password', passwordPlaceholder: 'At least 8 characters', accountCreated: 'Account created', loggedIn: 'You’re in', noWorkspace: 'This account has no workspace yet.', actionFailed: 'Could not complete the action.',
    goals: 'Goals', logout: 'Log out', addGoal: 'Add goal', accountMenu: 'Account menu', language: 'Language', noGoals: 'No goals yet. Create your first one.', openGoal: 'Open goal: {title}', editGoalAria: 'Edit goal: {title}', edit: 'Edit',
    addMilestonesHint: 'Add milestones to see the path.', outOf: '{current} of {target}', stagesCount: '{count} milestones', overallProgress: 'Overall progress', overallProgressAria: 'Overall goal progress',
    markDay: 'Mark a day', addBook: 'Add a book', logWorkout: 'Log a workout', addProgress: 'Add progress', done: 'Done', progress: 'Progress', adjustment: 'Adjustment', note: 'Note',
    takeStep: 'Take a step', progressHistoryHint: 'Progress will be saved to history', addStagesFirst: 'Add milestones in the editor first.', history: 'History', historyEmpty: 'Nothing here yet.', notePlaceholder: 'What is worth remembering about this goal?', addNote: 'Add note',
    add: 'Add', date: 'Date', optionalComment: 'Comment (optional)', commentPlaceholder: 'For example, it felt easier than last time', recordProgress: 'Record progress', cancel: 'Cancel', progressRecorded: 'Progress recorded', nowOutOf: 'Now {current} of {target}', currentOutOf: 'Current: {current} of {target}',
    milestoneName: 'Milestone name', reorderAria: 'Drag milestone. Arrow keys move it up or down', reorder: 'Change order', deleteMilestone: 'Delete milestone', target: 'Target', unit: 'Unit', unitPlaceholder: 'days, %, km', backToGoal: 'Back to goal', editing: 'Editing', editorIntro: 'Change the goal structure, milestones, and their order here. Record everyday progress on the goal screen.', milestones: 'Milestones', editorHint: 'Edit the name, target, and unit directly in the fields — changes save automatically. Drag milestones by the handle to reorder them.', noMilestones: 'No milestones yet.', newMilestone: 'New milestone', name: 'Name', milestoneExample: 'For example, B2 course', addMilestone: 'Add milestone', goalSettings: 'Goal settings', titleAndDescription: 'Title and description', deleteGoal: 'Delete goal',
    editGoal: 'Edit goal', newGoal: 'New goal', type: 'Type', journey: 'Journey', record: 'Record', collection: 'Collection', custom: 'Custom', current: 'Current', goal: 'Goal', caption: 'Caption', captionPlaceholder: 'Course 18 of 25 · ≈ 7 months', save: 'Save', saved: 'Saved', milestoneAdded: 'Milestone added', checkValues: 'Check the values', saving: 'Saving…', notSaved: 'Not saved', savingOrder: 'Saving order…', orderSaved: 'Order saved', confirmDeleteMilestone: 'Delete this milestone?', milestoneDeleted: 'Milestone deleted', noteAdded: 'Note added', confirmDeleteGoal: 'Delete this goal and all of its history?', goalDeleted: 'Goal deleted', loadFailed: 'Could not load the application.'
  },
  de: {
    appTitle: 'Weg — Ziele', brand: 'Ziele', heroTitle: 'Den Weg sehen.<br />Weitergehen.', heroText: 'Ein persönlicher Tracker ohne Ablenkung. Ein großes Ziel, klare Etappen und ehrlicher Fortschritt.',
    register: 'Registrieren', login: 'Anmelden', createAccount: 'Konto erstellen', welcomeBack: 'Willkommen zurück', registerNote: 'Nach der Registrierung erscheinen drei einfache Demo-Ziele. Du kannst sie löschen oder anpassen.', loginNote: 'Deine Ziele warten genau dort, wo du aufgehört hast.', password: 'Passwort', passwordPlaceholder: 'Mindestens 8 Zeichen', accountCreated: 'Konto erstellt', loggedIn: 'Angemeldet', noWorkspace: 'Dieses Konto hat noch keinen Arbeitsbereich.', actionFailed: 'Die Aktion konnte nicht ausgeführt werden.',
    goals: 'Ziele', logout: 'Abmelden', addGoal: 'Ziel hinzufügen', accountMenu: 'Kontomenü', language: 'Sprache', noGoals: 'Noch keine Ziele. Erstelle dein erstes.', openGoal: 'Ziel öffnen: {title}', editGoalAria: 'Ziel bearbeiten: {title}', edit: 'Bearbeiten',
    addMilestonesHint: 'Füge Etappen hinzu, um den Weg zu sehen.', outOf: '{current} von {target}', stagesCount: '{count} Etappen', overallProgress: 'Gesamtfortschritt', overallProgressAria: 'Gesamtfortschritt des Ziels',
    markDay: 'Tag markieren', addBook: 'Buch hinzufügen', logWorkout: 'Training eintragen', addProgress: 'Fortschritt hinzufügen', done: 'Fertig', progress: 'Fortschritt', adjustment: 'Korrektur', note: 'Notiz',
    takeStep: 'Einen Schritt machen', progressHistoryHint: 'Der Fortschritt wird im Verlauf gespeichert', addStagesFirst: 'Füge zuerst Etappen im Editor hinzu.', history: 'Verlauf', historyEmpty: 'Noch ist hier nichts.', notePlaceholder: 'Was möchtest du zu diesem Ziel festhalten?', addNote: 'Notiz hinzufügen',
    add: 'Hinzufügen', date: 'Datum', optionalComment: 'Kommentar (optional)', commentPlaceholder: 'Zum Beispiel: Es fiel leichter als letztes Mal', recordProgress: 'Fortschritt eintragen', cancel: 'Abbrechen', progressRecorded: 'Fortschritt eingetragen', nowOutOf: 'Jetzt {current} von {target}', currentOutOf: 'Aktuell: {current} von {target}',
    milestoneName: 'Name der Etappe', reorderAria: 'Etappe ziehen. Mit den Pfeiltasten nach oben oder unten bewegen', reorder: 'Reihenfolge ändern', deleteMilestone: 'Etappe löschen', target: 'Zielwert', unit: 'Einheit', unitPlaceholder: 'Tage, %, km', backToGoal: 'Zurück zum Ziel', editing: 'Bearbeitung', editorIntro: 'Hier änderst du Aufbau, Etappen und Reihenfolge. Den täglichen Fortschritt trägst du auf der Zielseite ein.', milestones: 'Etappen', editorHint: 'Name, Zielwert und Einheit direkt in den Feldern ändern — alles wird automatisch gespeichert. Etappen lassen sich am Griff verschieben.', noMilestones: 'Noch keine Etappen.', newMilestone: 'Neue Etappe', name: 'Name', milestoneExample: 'Zum Beispiel B2-Kurs', addMilestone: 'Etappe hinzufügen', goalSettings: 'Zieleinstellungen', titleAndDescription: 'Titel und Beschreibung', deleteGoal: 'Ziel löschen',
    editGoal: 'Ziel bearbeiten', newGoal: 'Neues Ziel', type: 'Typ', journey: 'Weg', record: 'Rekord', collection: 'Sammlung', custom: 'Eigener Typ', current: 'Aktuell', goal: 'Ziel', caption: 'Unterzeile', captionPlaceholder: 'Kurs 18 von 25 · ≈ 7 Monate', save: 'Speichern', saved: 'Gespeichert', milestoneAdded: 'Etappe hinzugefügt', checkValues: 'Werte prüfen', saving: 'Wird gespeichert…', notSaved: 'Nicht gespeichert', savingOrder: 'Reihenfolge wird gespeichert…', orderSaved: 'Reihenfolge gespeichert', confirmDeleteMilestone: 'Diese Etappe löschen?', milestoneDeleted: 'Etappe gelöscht', noteAdded: 'Notiz hinzugefügt', confirmDeleteGoal: 'Dieses Ziel und den gesamten Verlauf löschen?', goalDeleted: 'Ziel gelöscht', loadFailed: 'Die Anwendung konnte nicht geladen werden.'
  },
  ru: {
    appTitle: 'Путь — цели', brand: 'Цели', heroTitle: 'Видеть путь.<br />Продолжать идти.', heroText: 'Личный трекер без лишнего шума. Большая цель, понятные этапы и честный прогресс.',
    register: 'Регистрация', login: 'Вход', createAccount: 'Создать аккаунт', welcomeBack: 'С возвращением', registerNote: 'После регистрации появятся три простые демо-цели. Их можно удалить или переделать.', loginNote: 'Ваши цели продолжат ждать там, где вы остановились.', password: 'Пароль', passwordPlaceholder: 'Минимум 8 символов', accountCreated: 'Аккаунт создан', loggedIn: 'Вы вошли', noWorkspace: 'У аккаунта пока нет доски.', actionFailed: 'Не удалось выполнить действие.',
    goals: 'Цели', logout: 'Выйти', addGoal: 'Добавить цель', accountMenu: 'Меню аккаунта', language: 'Язык', noGoals: 'Пока нет целей. Создайте первую.', openGoal: 'Открыть цель: {title}', editGoalAria: 'Редактировать цель: {title}', edit: 'Редактировать',
    addMilestonesHint: 'Добавьте этапы, чтобы видеть путь.', outOf: '{current} из {target}', stagesCount: '{count} подцели', overallProgress: 'Общий прогресс', overallProgressAria: 'Общий прогресс цели',
    markDay: 'Отметить день', addBook: 'Добавить книгу', logWorkout: 'Записать тренировку', addProgress: 'Добавить прогресс', done: 'Готово', progress: 'Прогресс', adjustment: 'Корректировка', note: 'Заметка',
    takeStep: 'Сделать шаг', progressHistoryHint: 'Прогресс сохранится в истории', addStagesFirst: 'Сначала добавьте этапы в редакторе.', history: 'История', historyEmpty: 'Пока здесь тихо.', notePlaceholder: 'Что важно запомнить об этой цели?', addNote: 'Добавить заметку',
    add: 'Добавить', date: 'Дата', optionalComment: 'Комментарий (необязательно)', commentPlaceholder: 'Например, было легче, чем в прошлый раз', recordProgress: 'Записать прогресс', cancel: 'Отмена', progressRecorded: 'Прогресс записан', nowOutOf: 'Сейчас {current} из {target}', currentOutOf: 'Сейчас: {current} из {target}',
    milestoneName: 'Название этапа', reorderAria: 'Перетащить этап. Стрелки вверх и вниз меняют порядок', reorder: 'Изменить порядок', deleteMilestone: 'Удалить этап', target: 'Цель', unit: 'Единица', unitPlaceholder: 'дней, %, км', backToGoal: 'К цели', editing: 'Редактирование', editorIntro: 'Здесь меняются устройство цели, этапы и их порядок. Ежедневный прогресс отмечается на экране цели.', milestones: 'Этапы', editorHint: 'Меняйте название, объём и единицу прямо в полях — они сохраняются автоматически. Этапы можно перетаскивать за маркер справа.', noMilestones: 'Пока нет этапов.', newMilestone: 'Новый этап', name: 'Название', milestoneExample: 'Например, Курс B2', addMilestone: 'Добавить этап', goalSettings: 'Настройки цели', titleAndDescription: 'Название и описание', deleteGoal: 'Удалить цель',
    editGoal: 'Изменить цель', newGoal: 'Новая цель', type: 'Тип', journey: 'Путь', record: 'Рекорд', collection: 'Коллекция', custom: 'Свой', current: 'Сейчас', goal: 'Цель', caption: 'Подпись', captionPlaceholder: 'Курс 18 из 25 · ≈ 7 месяцев', save: 'Сохранить', saved: 'Сохранено', milestoneAdded: 'Этап добавлен', checkValues: 'Проверьте значения', saving: 'Сохраняю…', notSaved: 'Не сохранено', savingOrder: 'Сохраняю порядок…', orderSaved: 'Порядок сохранён', confirmDeleteMilestone: 'Удалить этот этап?', milestoneDeleted: 'Этап удалён', noteAdded: 'Заметка добавлена', confirmDeleteGoal: 'Удалить эту цель и все её записи?', goalDeleted: 'Цель удалена', loadFailed: 'Не удалось загрузить приложение.'
  }
};

const localeByLanguage = { en: 'en-US', de: 'de-DE', ru: 'ru-RU' };
const t = (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), translations[state.lang][key] || translations.en[key] || key);

function languageSwitcher() {
  return `<div class="language-switcher" role="group" aria-label="Language">${supportedLanguages.map((language) => `<button type="button" class="language-option ${state.lang === language ? 'is-active' : ''}" data-language="${language}" aria-pressed="${state.lang === language}">${language.toUpperCase()}</button>`).join('')}</div>`;
}

function bindLanguageSwitcher() {
  app.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.language)));
}

function accountMenuMarkup() {
  return `<div class="account-menu"><button class="header-icon account-trigger" type="button" data-account-toggle aria-label="${t('accountMenu')}" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c.8-4 3-6 6.5-6s5.7 2 6.5 6"/></svg></button><div class="account-popover" data-account-popover hidden><span class="account-menu-email">${escapeHtml(state.user?.email || '')}</span><div class="account-language"><span>${t('language')}</span>${languageSwitcher()}</div><button class="account-logout" type="button" data-logout>${t('logout')}</button></div></div>`;
}

function cleanupAccountMenu() {
  state.menuCleanup?.();
  state.menuCleanup = null;
}

function bindAccountMenu() {
  cleanupAccountMenu();
  const menu = app.querySelector('.account-menu');
  const toggle = menu?.querySelector('[data-account-toggle]');
  const popover = menu?.querySelector('[data-account-popover]');
  if (!menu || !toggle || !popover) return;
  const close = () => { popover.hidden = true; toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const opening = popover.hidden;
    popover.hidden = !opening;
    toggle.setAttribute('aria-expanded', String(opening));
  });
  popover.addEventListener('click', (event) => event.stopPropagation());
  const outside = () => close();
  const keyboard = (event) => { if (event.key === 'Escape') { close(); toggle.focus(); } };
  document.addEventListener('click', outside);
  document.addEventListener('keydown', keyboard);
  state.menuCleanup = () => { document.removeEventListener('click', outside); document.removeEventListener('keydown', keyboard); };
}

function setLanguage(language) {
  if (!supportedLanguages.includes(language) || language === state.lang) return;
  state.lang = language;
  localStorage.setItem('goals.language', language);
  document.documentElement.lang = language;
  document.title = t('appTitle');
  if (state.screen === 'goal') renderGoal();
  else if (state.screen === 'editor') renderEditor();
  else if (state.screen === 'home') renderHome();
  else renderAuth(state.screen === 'login' ? 'login' : 'register');
}

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json', 'x-app-language': state.lang, ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || t('actionFailed'));
    error.status = response.status;
    throw error;
  }
  return data;
};

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
const dateLabel = (value) => new Intl.DateTimeFormat(localeByLanguage[state.lang], { day: 'numeric', month: 'long' }).format(new Date(value));

function notice(message) {
  let el = document.querySelector('.notice');
  if (!el) { el = document.createElement('div'); el.className = 'notice'; document.body.append(el); }
  el.textContent = message;
  el.classList.add('is-visible');
  window.setTimeout(() => el.classList.remove('is-visible'), 2600);
}

async function ensureWorkspace() {
  const session = await api('/api/auth/me');
  state.user = session.user;
  const saved = localStorage.getItem('goals.workspaceId');
  const workspaceId = session.workspaces.some((workspace) => workspace.id === saved) ? saved : session.workspaces[0]?.id;
  if (!workspaceId) throw new Error(t('noWorkspace'));
  localStorage.setItem('goals.workspaceId', workspaceId);
  state.workspaceId = workspaceId;
  const data = await api(`/api/workspaces/${workspaceId}`);
  state.workspace = data.workspace; state.goals = data.goals;
}

function renderAuth(mode = 'register') {
  cleanupAccountMenu();
  const registering = mode === 'register';
  state.screen = mode;
  app.innerHTML = `<div class="auth-language">${languageSwitcher()}</div><div class="auth-shell"><section class="auth-intro"><span class="auth-wordmark">${t('brand')}</span><h1>${t('heroTitle')}</h1><p>${t('heroText')}</p></section><section class="auth-panel"><div class="auth-tabs"><button class="auth-tab ${registering ? 'is-active' : ''}" data-auth-mode="register">${t('register')}</button><button class="auth-tab ${!registering ? 'is-active' : ''}" data-auth-mode="login">${t('login')}</button></div><h2>${registering ? t('createAccount') : t('welcomeBack')}</h2><p class="auth-note">${registering ? t('registerNote') : t('loginNote')}</p><form class="form auth-form" data-auth-form><label>Email<input name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required /></label><label>${t('password')}<input name="password" type="password" autocomplete="${registering ? 'new-password' : 'current-password'}" minlength="8" maxlength="128" placeholder="${t('passwordPlaceholder')}" required /></label><button class="button button-primary" type="submit">${registering ? t('createAccount') : t('login')}</button><span class="auth-error" data-auth-error aria-live="polite"></span></form></section></div>`;
  bindLanguageSwitcher();
  app.querySelectorAll('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => renderAuth(button.dataset.authMode)));
  app.querySelector('[data-auth-form]').addEventListener('submit', (event) => submitAuth(event, mode));
}

async function submitAuth(event, mode) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const error = form.querySelector('[data-auth-error]');
  const data = Object.fromEntries(new FormData(form));
  button.disabled = true;
  error.textContent = '';
  try {
    const payload = mode === 'register' ? { ...data, language: state.lang, legacyWorkspaceId: localStorage.getItem('goals.workspaceId') || '' } : data;
    const result = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(payload) });
    if (result.workspaceId) localStorage.setItem('goals.workspaceId', result.workspaceId);
    await ensureWorkspace(); renderHome(); notice(mode === 'register' ? t('accountCreated') : t('loggedIn'));
  } catch (authError) {
    error.textContent = authError.message;
    button.disabled = false;
  }
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
  return `<span class="tile-wrap"><span class="tile ${milestone.state} ${segmented ? 'segmented' : ''}" aria-label="${escapeHtml(milestone.label)}: ${t('outOf', { current, target })}${milestone.unit ? ` ${escapeHtml(milestone.unit)}` : ''}">${visual}</span><span class="tile-label">${escapeHtml(milestone.label)}</span>${count}</span>`;
}

function progressMarkup(goal, detail = false) {
  const milestones = goal.milestones || [];
  if (!milestones.length) return `<span class="goal-meta">${t('addMilestonesHint')}</span>`;
  return `<span class="tiles ${detail ? 'detail-tiles' : ''}">${milestones.map((item) => tileMarkup(item)).join('')}</span>`;
}

function formatProgressNumber(value) {
  return new Intl.NumberFormat(localeByLanguage[state.lang], { maximumFractionDigits: 1 }).format(value);
}

function overallProgress(goal) {
  const milestones = goal.milestones || [];
  if (!milestones.length) return null;
  const items = milestones.map((milestone) => ({ ...milestoneValues(milestone), unit: String(milestone.unit || '').trim() }));
  const units = new Set(items.map((item) => item.unit.toLocaleLowerCase(localeByLanguage[state.lang])));
  const oneScale = units.size === 1;

  if (oneScale) {
    const current = items.reduce((sum, item) => sum + item.current, 0);
    const target = items.reduce((sum, item) => sum + item.target, 0);
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
    const unit = items[0].unit;
    const allBinary = !unit && items.every((item) => item.target === 1);
    const detail = unit
      ? `${t('outOf', { current: formatProgressNumber(current), target: formatProgressNumber(target) })} ${escapeHtml(unit)}`
      : allBinary ? t('outOf', { current: formatProgressNumber(current), target: `${formatProgressNumber(target)} ${t('milestones').toLocaleLowerCase(localeByLanguage[state.lang])}` }) : '';
    return { percentage, detail };
  }

  const percentage = Math.round(items.reduce((sum, item) => sum + (item.current / item.target) * 100, 0) / items.length);
  return { percentage, detail: t('stagesCount', { count: milestones.length }) };
}

function overallProgressMarkup(goal) {
  const progress = overallProgress(goal);
  if (!progress) return '';
  return `<span class="overall-progress" data-overall-progress><span class="overall-progress-copy"><span>${t('overallProgress')}</span><span><strong>${progress.percentage}%</strong>${progress.detail ? ` · ${progress.detail}` : ''}</span></span><span class="overall-progress-track" role="progressbar" aria-label="${t('overallProgressAria')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percentage}"><span style="width:${progress.percentage}%"></span></span></span>`;
}

function valueMarkup(goal) {
  if (goal.goalType === 'collection') return escapeHtml(goal.currentValue);
  return `${escapeHtml(goal.currentValue)} <span aria-hidden="true">→</span> ${escapeHtml(goal.targetValue)}`;
}

function goalCard(goal) {
  return `<li class="goal-card"><button class="goal-open" data-open-goal="${goal.id}" aria-label="${t('openGoal', { title: escapeHtml(goal.title) })}"><span class="goal-summary"><span class="goal-top"><span class="goal-title">${escapeHtml(goal.title)}</span></span><span class="goal-value">${valueMarkup(goal)}</span>${goal.meta ? `<span class="goal-meta">${escapeHtml(goal.meta)}</span>` : ''}</span><span class="goal-progress-column">${overallProgressMarkup(goal)}${progressMarkup(goal)}</span></button><button class="goal-edit-button" data-edit-goal-card="${goal.id}" aria-label="${t('editGoalAria', { title: escapeHtml(goal.title) })}" title="${t('edit')}"><span class="edit-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m4 20 4.2-1 10.6-10.6a2.2 2.2 0 0 0-3.2-3.2L5 15.8 4 20Z" /><path d="m14.5 6.5 3 3" /></svg></span></button></li>`;
}

function renderHome() {
  cleanupAccountMenu();
  state.screen = 'home';
  app.innerHTML = `<div class="app-shell"><header class="app-header"><h1 class="app-title">${t('goals')}</h1><div class="header-actions"><button class="header-icon add-goal" aria-label="${t('addGoal')}" data-add-goal>+</button>${accountMenuMarkup()}</div></header><ul class="goal-list">${state.goals.length ? state.goals.map(goalCard).join('') : `<li class="empty">${t('noGoals')}</li>`}</ul></div>`;
  bindLanguageSwitcher();
  bindAccountMenu();
  app.querySelector('[data-add-goal]')?.addEventListener('click', () => openGoalDialog());
  app.querySelector('[data-logout]')?.addEventListener('click', logout);
  app.querySelectorAll('[data-open-goal]').forEach((button) => button.addEventListener('click', () => { state.selectedId = button.dataset.openGoal; renderGoal(); }));
  app.querySelectorAll('[data-edit-goal-card]').forEach((button) => button.addEventListener('click', () => { state.selectedId = button.dataset.editGoalCard; renderEditor(); }));
}

function editIconMarkup() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.2-1 10.6-10.6a2.2 2.2 0 0 0-3.2-3.2L5 15.8 4 20Z" /><path d="m14.5 6.5 3 3" /></svg>';
}

function milestoneActionLabel(milestone) {
  const unit = String(milestone.unit || '').toLocaleLowerCase(localeByLanguage[state.lang]);
  if (/дн|day|tag/.test(unit)) return t('markDay');
  if (/книг|book|buch|büch/.test(unit)) return t('addBook');
  if (/трениров|workout|training/.test(unit)) return t('logWorkout');
  return t('addProgress');
}

function workMilestoneMarkup(milestone) {
  const { current, target, percentage } = milestoneValues(milestone);
  const complete = current >= target;
  const unit = milestone.unit ? ` ${escapeHtml(milestone.unit)}` : '';
  return `<li class="work-milestone"><div class="work-milestone-main"><div class="work-milestone-copy"><span class="work-milestone-title">${escapeHtml(milestone.label)}</span><span class="work-milestone-value">${t('outOf', { current: formatProgressNumber(current), target: formatProgressNumber(target) })}${unit}</span></div><span class="work-percentage">${percentage}%</span></div><span class="work-track" aria-hidden="true"><span style="width:${percentage}%"></span></span><button class="button work-button" data-add-progress="${milestone.id}" ${complete ? 'disabled' : ''}>${complete ? t('done') : milestoneActionLabel(milestone)}</button></li>`;
}

function eventMarkup(event, goal) {
  const kind = event.kind === 'progress' ? t('progress') : event.kind === 'adjustment' ? t('adjustment') : t('note');
  const milestone = goal?.milestones.find((item) => item.id === event.milestoneId);
  const amount = Number(event.amount);
  const eventTitle = milestone && Number.isFinite(amount)
    ? `${escapeHtml(milestone.label)} · ${amount > 0 ? '+' : ''}${formatProgressNumber(amount)}${milestone.unit ? ` ${escapeHtml(milestone.unit)}` : ''}`
    : escapeHtml(event.title);
  return `<li class="event-row"><span><span class="event-kind">${kind}</span><span class="event-title">${eventTitle}</span>${event.detail ? `<span class="event-detail">${escapeHtml(event.detail)}</span>` : ''}</span><time class="event-date">${dateLabel(event.occurredAt)}</time></li>`;
}

function renderGoal() {
  cleanupAccountMenu();
  const goal = state.goals.find((item) => item.id === state.selectedId);
  if (!goal) return renderHome();
  state.screen = 'goal';
  app.innerHTML = `<div class="app-shell"><section class="panel"><div class="view-nav"><button class="back" data-back>‹ ${t('goals')}</button><div class="view-actions">${languageSwitcher()}<button class="edit-structure" data-edit-structure>${editIconMarkup()}<span>${t('edit')}</span></button></div></div><header class="detail-head"><div class="detail-summary"><h1 class="goal-title">${escapeHtml(goal.title)}</h1><div class="goal-value">${valueMarkup(goal)}</div>${goal.meta ? `<div class="goal-meta">${escapeHtml(goal.meta)}</div>` : ''}</div><div class="detail-progress">${overallProgressMarkup(goal)}${progressMarkup(goal, true)}</div></header><section class="detail-section work-section"><div class="section-title-row"><h2>${t('takeStep')}</h2><span class="section-hint">${t('progressHistoryHint')}</span></div><ul class="work-list">${goal.milestones.length ? goal.milestones.map(workMilestoneMarkup).join('') : `<li class="goal-meta">${t('addStagesFirst')}</li>`}</ul></section><section class="detail-section"><h2>${t('history')}</h2><ul class="event-list">${goal.events.length ? goal.events.map((event) => eventMarkup(event, goal)).join('') : `<li class="goal-meta">${t('historyEmpty')}</li>`}</ul><form class="form add-event note-form" data-add-event><label>${t('note')}<textarea name="title" maxlength="120" rows="3" placeholder="${t('notePlaceholder')}" required></textarea></label><button class="button" type="submit">${t('addNote')}</button></form></section></section></div>`;
  bindLanguageSwitcher();
  app.querySelector('[data-back]').addEventListener('click', () => { state.selectedId = null; renderHome(); });
  app.querySelector('[data-edit-structure]').addEventListener('click', renderEditor);
  app.querySelectorAll('[data-add-progress]').forEach((button) => button.addEventListener('click', () => {
    const milestone = goal.milestones.find((item) => item.id === button.dataset.addProgress);
    if (milestone) openProgressDialog(milestone);
  }));
  app.querySelector('[data-add-event]').addEventListener('submit', addEvent);
}

function openProgressDialog(milestone) {
  const { current, target } = milestoneValues(milestone);
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog progress-dialog';
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dialog.innerHTML = `<h2 class="dialog-title">${escapeHtml(milestone.label)}</h2><p class="dialog-note">${t('nowOutOf', { current: formatProgressNumber(current), target: formatProgressNumber(target) })}${milestone.unit ? ` ${escapeHtml(milestone.unit)}` : ''}</p><form class="form" data-progress-form><div class="form-grid"><label>${t('add')}<input name="amount" type="number" min="0.01" max="1000000" step="any" value="1" required /></label><label>${t('date')}<input name="date" type="date" value="${localDate}" required /></label></div><label>${t('optionalComment')}<textarea name="note" maxlength="240" rows="3" placeholder="${t('commentPlaceholder')}"></textarea></label><div class="form-actions"><button class="button button-primary" type="submit">${t('recordProgress')}</button><button class="button button-quiet" type="button" data-close>${t('cancel')}</button></div></form>`;
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-progress-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await api(`/api/milestones/${milestone.id}/progress`, { method: 'POST', body: JSON.stringify({ workspaceId: state.workspaceId, amount: Number(data.amount), note: data.note, occurredAt: new Date(`${data.date}T12:00:00`).toISOString() }) });
      dialog.close(); await refresh(); renderGoal(); notice(t('progressRecorded'));
    } catch (error) { notice(error.message); button.disabled = false; }
  });
  document.body.append(dialog); dialog.addEventListener('close', () => dialog.remove()); dialog.showModal();
}

function milestoneEditorMarkup(milestone) {
  const { current, target } = milestoneValues(milestone);
  return `<li class="milestone-card" data-milestone-id="${milestone.id}"><form class="milestone-form" data-edit-milestone="${milestone.id}"><label class="milestone-title-field"><span class="visually-hidden">${t('milestoneName')}</span><input name="label" maxlength="60" value="${escapeHtml(milestone.label)}" aria-label="${t('milestoneName')}" required /></label><div class="milestone-tools"><button class="icon-button drag-handle" type="button" aria-label="${t('reorderAria')}" title="${t('reorder')}"><span aria-hidden="true">⠿</span></button><button class="icon-button delete-milestone" type="button" data-delete-milestone="${milestone.id}" aria-label="${t('deleteMilestone')}" title="${t('deleteMilestone')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" /></svg></button></div><div class="milestone-fields milestone-structure-fields"><label>${t('target')}<input name="progressTarget" type="number" min="0.01" max="1000000" step="any" value="${target}" required /></label><label>${t('unit')}<input name="unit" maxlength="24" value="${escapeHtml(milestone.unit || '')}" placeholder="${t('unitPlaceholder')}" /></label><span class="milestone-current-note">${t('currentOutOf', { current: formatProgressNumber(current), target: formatProgressNumber(target) })}${milestone.unit ? ` ${escapeHtml(milestone.unit)}` : ''}</span></div></form></li>`;
}

function renderEditor() {
  cleanupAccountMenu();
  const goal = state.goals.find((item) => item.id === state.selectedId);
  if (!goal) return renderHome();
  state.screen = 'editor';
  app.innerHTML = `<div class="app-shell"><section class="panel"><div class="view-nav"><button class="back" data-back>‹ ${t('backToGoal')}</button>${languageSwitcher()}</div><header class="editor-head"><span class="editor-kicker">${t('editing')}</span><h1>${escapeHtml(goal.title)}</h1><p>${t('editorIntro')}</p></header><section class="detail-section"><div class="section-title-row"><h2>${t('milestones')}</h2><span class="autosave-status" data-autosave-status aria-live="polite"></span></div><p class="section-note">${t('editorHint')}</p><ul class="milestone-list">${goal.milestones.length ? goal.milestones.map(milestoneEditorMarkup).join('') : `<li class="goal-meta">${t('noMilestones')}</li>`}</ul><form class="form add-milestone" data-add-milestone><h3>${t('newMilestone')}</h3><label>${t('name')}<input name="label" maxlength="60" placeholder="${t('milestoneExample')}" required /></label><div class="milestone-fields milestone-structure-fields"><label>${t('target')}<input name="progressTarget" type="number" min="0.01" max="1000000" step="any" value="1" required /></label><label>${t('unit')}<input name="unit" maxlength="24" placeholder="${t('unitPlaceholder')}" /></label></div><button class="button button-primary" type="submit">${t('addMilestone')}</button></form></section><section class="detail-section"><h2>${t('goalSettings')}</h2><div class="settings-actions"><button class="button" data-edit-goal>${t('titleAndDescription')}</button><button class="button button-danger" data-delete-goal>${t('deleteGoal')}</button></div></section></section></div>`;
  bindLanguageSwitcher();
  app.querySelector('[data-back]').addEventListener('click', renderGoal);
  app.querySelectorAll('[data-edit-milestone]').forEach((form) => {
    form.addEventListener('submit', (event) => event.preventDefault());
    form.addEventListener('input', scheduleMilestoneSave);
    form.addEventListener('change', scheduleMilestoneSave);
  });
  app.querySelectorAll('[data-delete-milestone]').forEach((button) => button.addEventListener('click', deleteMilestone));
  bindMilestoneReordering();
  app.querySelector('[data-add-milestone]').addEventListener('submit', addMilestone);
  app.querySelector('[data-edit-goal]').addEventListener('click', () => openGoalDialog(goal));
  app.querySelector('[data-delete-goal]').addEventListener('click', deleteGoal);
}

function goalFormMarkup() {
  return `<form class="form goal-form"><label>${t('name')}<input name="title" maxlength="90" placeholder="${t('milestoneExample')}" required /></label><label>${t('type')}<select name="goalType"><option value="journey">${t('journey')}</option><option value="record">${t('record')}</option><option value="collection">${t('collection')}</option><option value="custom">${t('custom')}</option></select></label><div class="form-grid"><label>${t('current')}<input name="currentValue" maxlength="60" placeholder="A2" required /></label><label>${t('goal')}<input name="targetValue" maxlength="60" placeholder="B2" required /></label></div><label>${t('caption')}<input name="meta" maxlength="160" placeholder="${t('captionPlaceholder')}" /></label><div class="form-actions"><button class="button button-primary" type="submit">${t('save')}</button><button class="button button-quiet" type="button" data-close>${t('cancel')}</button></div></form>`;
}

function openGoalDialog(goal = null) {
  const dialog = document.createElement('dialog'); dialog.className = 'dialog';
  dialog.innerHTML = `<h2 class="dialog-title">${goal ? t('editGoal') : t('newGoal')}</h2>${goalFormMarkup()}`;
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
      dialog.close(); await refresh(); goal ? renderEditor() : renderHome(); notice(t('saved'));
    } catch (error) { notice(error.message); }
  });
  document.body.append(dialog); dialog.addEventListener('close', () => dialog.remove()); dialog.showModal();
}

async function addMilestone(event) {
  event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
  try { await api(`/api/goals/${state.selectedId}/milestones`, { method: 'POST', body: JSON.stringify({ workspaceId: state.workspaceId, ...data }) }); await refresh(); renderEditor(); notice(t('milestoneAdded')); } catch (error) { notice(error.message); }
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
  const goal = state.goals.find((item) => item.id === state.selectedId);
  const milestone = goal?.milestones.find((item) => item.id === form.dataset.editMilestone);
  const current = Math.max(0, Math.min(target, Number(milestone?.progressCurrent) || 0));
  form.elements.progressTarget.value = target;
  const nextState = current >= target ? 'done' : current > 0 ? 'current' : 'future';
  return { ...data, progressCurrent: current, progressTarget: target, state: nextState };
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
    setAutosaveStatus(t('checkValues'), true);
    return;
  }
  const data = milestoneData(form);
  updateMilestonePreview(form, data);
  setAutosaveStatus(t('saving'));
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
    if (form.saveVersion === version) setAutosaveStatus(t('saved'));
  } catch (error) {
    if (form.saveVersion === version) setAutosaveStatus(t('notSaved'), true);
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
  setAutosaveStatus(t('savingOrder'));
  try {
    await api(`/api/goals/${goal.id}/milestones/order`, { method: 'PUT', body: JSON.stringify({ workspaceId: state.workspaceId, milestoneIds: ids }) });
    setAutosaveStatus(t('orderSaved'));
  } catch (error) {
    notice(error.message);
    await refresh(); renderEditor();
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
      if (item.classList.contains('is-dragging')) return;
      const pointerId = event.pointerId;
      const initialOrder = [...list.querySelectorAll('[data-milestone-id]')].map((row) => row.dataset.milestoneId).join(',');
      let active = true;
      item.classList.add('is-dragging');
      document.body.classList.add('is-reordering');
      const move = (moveEvent) => {
        if (!active || moveEvent.pointerId !== pointerId) return;
        moveEvent.preventDefault();
        const over = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY)
          .map((element) => element.closest?.('[data-milestone-id]'))
          .find((candidate) => candidate && candidate !== item && candidate.parentElement === list);
        if (!over || over === item || over.parentElement !== list) return;
        const rect = over.getBoundingClientRect();
        list.insertBefore(item, moveEvent.clientY < rect.top + rect.height / 2 ? over : over.nextElementSibling);
        if (moveEvent.clientY < 70) window.scrollBy(0, -12);
        if (moveEvent.clientY > window.innerHeight - 70) window.scrollBy(0, 12);
      };
      const finish = (finishEvent) => {
        if (!active || (finishEvent?.pointerId !== undefined && finishEvent.pointerId !== pointerId)) return;
        active = false;
        item.classList.remove('is-dragging');
        document.body.classList.remove('is-reordering');
        window.removeEventListener('pointermove', move, true);
        window.removeEventListener('pointerup', finish, true);
        window.removeEventListener('pointercancel', finish, true);
        window.removeEventListener('blur', finish);
        const nextOrder = [...list.querySelectorAll('[data-milestone-id]')].map((row) => row.dataset.milestoneId).join(',');
        if (nextOrder !== initialOrder) persistMilestoneOrder(list);
      };
      window.addEventListener('pointermove', move, { capture: true, passive: false });
      window.addEventListener('pointerup', finish, true);
      window.addEventListener('pointercancel', finish, true);
      window.addEventListener('blur', finish);
    });
  });
}

async function deleteMilestone(event) {
  const id = event.currentTarget.dataset.deleteMilestone;
  if (!confirm(t('confirmDeleteMilestone'))) return;
  const form = event.currentTarget.closest('form');
  if (form) window.clearTimeout(form.saveTimer);
  try {
    await api(`/api/milestones/${id}?workspaceId=${state.workspaceId}`, { method: 'DELETE' });
    await refresh(); renderEditor(); notice(t('milestoneDeleted'));
  } catch (error) { notice(error.message); }
}

async function addEvent(event) {
  event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
  try { await api(`/api/goals/${state.selectedId}/events`, { method: 'POST', body: JSON.stringify({ workspaceId: state.workspaceId, ...data }) }); await refresh(); renderGoal(); notice(t('noteAdded')); } catch (error) { notice(error.message); }
}

async function deleteGoal() {
  if (!confirm(t('confirmDeleteGoal'))) return;
  await api(`/api/goals/${state.selectedId}?workspaceId=${state.workspaceId}`, { method: 'DELETE' });
  state.selectedId = null; await refresh(); renderHome(); notice(t('goalDeleted'));
}

async function logout() {
  try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); } catch { /* Session is cleared locally below. */ }
  state.user = null; state.workspaceId = null; state.workspace = null; state.goals = []; state.selectedId = null;
  renderAuth('login');
}

(async () => {
  document.documentElement.lang = state.lang;
  document.title = t('appTitle');
  try { await ensureWorkspace(); renderHome(); }
  catch (error) {
    if (error.status === 401) renderAuth('register');
    else app.innerHTML = `<div class="app-shell"><p class="empty">${escapeHtml(error.message || t('loadFailed'))}</p></div>`;
  }
})();
