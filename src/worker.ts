export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

type GoalInput = {
  workspaceId: string;
  title: string;
  goalType: string;
  currentValue: string;
  targetValue: string;
  meta?: string;
  accent?: string;
  milestones?: MilestoneInput[];
};

type MilestoneInput = {
  label: string;
  state?: 'done' | 'current' | 'future';
  progressCurrent?: number;
  progressTarget?: number;
  unit?: string;
};

type AuthUser = { id: string; email: string };

const SESSION_COOKIE = 'goals_session';
const SESSION_DAYS = 30;
const PASSWORD_ITERATIONS = 100_000;
const PASSWORD_ROUNDS = 3;

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
  });

const clean = (value: unknown, limit = 140) => String(value ?? '').trim().slice(0, limit);
const validState = (value: unknown): 'done' | 'current' | 'future' =>
  value === 'done' || value === 'current' || value === 'future' ? value : 'future';
const progressNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1_000_000, parsed)) : fallback;
};
const milestoneProgress = (input: MilestoneInput) => {
  const target = Math.max(0.01, progressNumber(input.progressTarget, 1));
  const current = Math.min(target, progressNumber(input.progressCurrent, 0));
  return { current, target };
};

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
};

async function hashPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  let material = new TextEncoder().encode(password);
  for (let round = 0; round < PASSWORD_ROUNDS; round += 1) {
    const key = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveBits']);
    const roundSalt = new Uint8Array(salt.length + 1);
    roundSalt.set(salt);
    roundSalt[salt.length] = round;
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: roundSalt, iterations: PASSWORD_ITERATIONS }, key, 256);
    material = new Uint8Array(bits);
  }
  return { hash: bytesToBase64(material), salt: bytesToBase64(salt) };
}

async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const calculated = await hashPassword(password, base64ToBytes(salt));
  return safeEqual(calculated.hash, expectedHash);
}

const cookieValue = (request: Request, name: string) => {
  const cookies = request.headers.get('cookie') || '';
  for (const part of cookies.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return '';
};

const sessionCookie = (id: string, maxAge = SESSION_DAYS * 24 * 60 * 60) =>
  `${SESSION_COOKIE}=${encodeURIComponent(id)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

async function currentUser(request: Request, env: Env): Promise<AuthUser | null> {
  const sessionId = cookieValue(request, SESSION_COOKIE);
  if (!sessionId) return null;
  return env.DB.prepare(
    "SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = ? AND sessions.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')",
  )
    .bind(sessionId)
    .first<AuthUser>();
}

async function createSession(env: Env, userId: string) {
  const id = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll('-', '')}`;
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(id, userId, expiresAt).run();
  return id;
}

const validEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

async function body<T>(request: Request): Promise<T> {
  return request.json<T>();
}

async function getWorkspace(env: Env, workspaceId: string, userId: string) {
  return env.DB.prepare('SELECT id, name, created_at AS createdAt FROM workspaces WHERE id = ? AND user_id = ?')
    .bind(workspaceId, userId)
    .first();
}

async function getGoals(env: Env, workspaceId: string) {
  const goals = await env.DB.prepare(
    'SELECT id, title, goal_type AS goalType, current_value AS currentValue, target_value AS targetValue, meta, accent, sort_order AS sortOrder FROM goals WHERE workspace_id = ? ORDER BY sort_order, created_at',
  )
    .bind(workspaceId)
    .all<Record<string, unknown>>();

  const result = [];
  for (const goal of goals.results) {
    const [milestones, events] = await Promise.all([
      env.DB.prepare('SELECT id, label, state, progress_current AS progressCurrent, progress_target AS progressTarget, unit, sort_order AS sortOrder FROM milestones WHERE goal_id = ? ORDER BY sort_order, created_at')
        .bind(goal.id)
        .all(),
      env.DB.prepare('SELECT id, title, detail, occurred_at AS occurredAt FROM events WHERE goal_id = ? ORDER BY occurred_at DESC LIMIT 8')
        .bind(goal.id)
        .all(),
    ]);
    result.push({ ...goal, milestones: milestones.results, events: events.results });
  }
  return result;
}

async function seedWorkspace(env: Env, workspaceId: string) {
  const templates: Array<Omit<GoalInput, 'workspaceId'>> = [
    {
      title: 'Прочитать 12 книг',
      goalType: 'collection',
      currentValue: '3 книги',
      targetValue: '12 книг',
      meta: 'До конца года',
      accent: 'vermillion',
      milestones: [
        { label: 'Художественные', state: 'current', progressCurrent: 2, progressTarget: 5, unit: 'книг' },
        { label: 'Нон-фикшн', state: 'current', progressCurrent: 1, progressTarget: 4, unit: 'книг' },
        { label: 'Профессиональные', state: 'future', progressCurrent: 0, progressTarget: 3, unit: 'книг' },
      ],
    },
    {
      title: 'Пробежать 10 км',
      goalType: 'journey',
      currentValue: '3 км',
      targetValue: '10 км',
      meta: 'Три тренировки в неделю',
      accent: 'vermillion',
      milestones: [
        { label: 'База', state: 'current', progressCurrent: 8, progressTarget: 12, unit: 'тренировок' },
        { label: 'Темп', state: 'future', progressCurrent: 0, progressTarget: 10, unit: 'тренировок' },
        { label: 'Дистанция', state: 'future', progressCurrent: 0, progressTarget: 8, unit: 'тренировок' },
      ],
    },
    {
      title: 'Накопить на отпуск',
      goalType: 'collection',
      currentValue: '450 €',
      targetValue: '2 000 €',
      meta: 'Поездка следующим летом',
      accent: 'vermillion',
      milestones: [
        { label: 'Билеты', state: 'current', progressCurrent: 450, progressTarget: 800, unit: '€' },
        { label: 'Жильё', state: 'future', progressCurrent: 0, progressTarget: 700, unit: '€' },
        { label: 'Расходы', state: 'future', progressCurrent: 0, progressTarget: 500, unit: '€' },
      ],
    },
  ];

  for (let index = 0; index < templates.length; index += 1) {
    await createGoal(env, { workspaceId, ...templates[index] }, index);
  }
}

async function createGoal(env: Env, input: GoalInput, sortOrder?: number) {
  const title = clean(input.title, 90);
  const currentValue = clean(input.currentValue, 60);
  const targetValue = clean(input.targetValue, 60);
  if (!title || !currentValue || !targetValue) throw new Error('Заполните название, текущее значение и цель.');

  const goalId = crypto.randomUUID();
  const order = sortOrder ?? Number(
    (await env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM goals WHERE workspace_id = ?')
      .bind(input.workspaceId)
      .first<{ next: number }>())?.next ?? 0,
  );
  const statements = [
    env.DB.prepare(
      'INSERT INTO goals (id, workspace_id, title, goal_type, current_value, target_value, meta, accent, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      goalId,
      input.workspaceId,
      title,
      clean(input.goalType || 'journey', 32),
      currentValue,
      targetValue,
      clean(input.meta, 160),
      clean(input.accent || 'vermillion', 24),
      order,
    ),
  ];
  for (const [index, milestone] of (input.milestones || []).entries()) {
    const label = clean(milestone.label, 60);
    if (label) {
      const progress = milestoneProgress(milestone);
      statements.push(
        env.DB.prepare('INSERT INTO milestones (id, goal_id, label, state, progress_current, progress_target, unit, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(
          crypto.randomUUID(),
          goalId,
          label,
          validState(milestone.state),
          progress.current,
          progress.target,
          clean(milestone.unit, 24),
          index,
        ),
      );
    }
  }
  await env.DB.batch(statements);
  return goalId;
}

async function api(request: Request, env: Env, url: URL): Promise<Response> {
  const { pathname, searchParams } = url;
  const parts = pathname.split('/').filter(Boolean);
  const method = request.method;

  try {
    const origin = request.headers.get('origin');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && origin && origin !== url.origin) {
      return json({ error: 'Запрос с другого сайта отклонён.' }, { status: 403 });
    }

    if (pathname === '/api/auth/register' && method === 'POST') {
      const payload = await body<{ email?: string; password?: string; legacyWorkspaceId?: string }>(request);
      const email = clean(payload.email, 254).toLocaleLowerCase('en-US');
      const password = String(payload.password || '');
      if (!validEmail(email)) throw new Error('Введите корректный email.');
      if (password.length < 8 || password.length > 128) throw new Error('Пароль должен содержать от 8 до 128 символов.');
      if (await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()) {
        throw new Error('Аккаунт с таким email уже существует.');
      }

      const userId = crypto.randomUUID();
      const passwordData = await hashPassword(password);
      const legacyId = clean(payload.legacyWorkspaceId, 80);
      const legacy = legacyId
        ? await env.DB.prepare('SELECT id FROM workspaces WHERE id = ? AND user_id IS NULL').bind(legacyId).first<{ id: string }>()
        : null;
      const workspaceId = legacy?.id || crypto.randomUUID();
      const statements = [
        env.DB.prepare('INSERT INTO users (id, email, password_hash, password_salt) VALUES (?, ?, ?, ?)')
          .bind(userId, email, passwordData.hash, passwordData.salt),
      ];
      if (legacy) {
        statements.push(env.DB.prepare("UPDATE workspaces SET user_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND user_id IS NULL").bind(userId, workspaceId));
      } else {
        statements.push(env.DB.prepare('INSERT INTO workspaces (id, name, user_id) VALUES (?, ?, ?)').bind(workspaceId, 'Мои цели', userId));
      }
      await env.DB.batch(statements);
      if (!legacy) await seedWorkspace(env, workspaceId);
      const sessionId = await createSession(env, userId);
      return json({ user: { id: userId, email }, workspaceId }, { status: 201, headers: { 'set-cookie': sessionCookie(sessionId) } });
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const payload = await body<{ email?: string; password?: string }>(request);
      const email = clean(payload.email, 254).toLocaleLowerCase('en-US');
      const password = String(payload.password || '');
      const user = await env.DB.prepare('SELECT id, email, password_hash AS passwordHash, password_salt AS passwordSalt FROM users WHERE email = ?')
        .bind(email)
        .first<{ id: string; email: string; passwordHash: string; passwordSalt: string }>();
      if (!user || !(await verifyPassword(password, user.passwordSalt, user.passwordHash))) {
        return json({ error: 'Неверный email или пароль.' }, { status: 401 });
      }
      const sessionId = await createSession(env, user.id);
      const workspace = await env.DB.prepare('SELECT id FROM workspaces WHERE user_id = ? ORDER BY created_at LIMIT 1').bind(user.id).first<{ id: string }>();
      return json({ user: { id: user.id, email: user.email }, workspaceId: workspace?.id || null }, { headers: { 'set-cookie': sessionCookie(sessionId) } });
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      const sessionId = cookieValue(request, SESSION_COOKIE);
      if (sessionId) await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
      return json({ ok: true }, { headers: { 'set-cookie': sessionCookie('', 0) } });
    }

    const user = await currentUser(request, env);
    if (!user) return json({ error: 'Войдите в аккаунт.' }, { status: 401 });

    if (pathname === '/api/auth/me' && method === 'GET') {
      const workspaces = await env.DB.prepare('SELECT id, name, created_at AS createdAt FROM workspaces WHERE user_id = ? ORDER BY created_at')
        .bind(user.id)
        .all();
      return json({ user, workspaces: workspaces.results });
    }

    if (method === 'POST' && pathname === '/api/workspaces') {
      const payload = await body<{ name?: string }>(request);
      const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO workspaces (id, name, user_id) VALUES (?, ?, ?)')
        .bind(id, clean(payload.name || 'Мои цели', 80) || 'Мои цели', user.id)
        .run();
      await seedWorkspace(env, id);
      return json({ id });
    }

    if (parts[1] === 'workspaces' && parts[2] && method === 'GET') {
      const workspace = await getWorkspace(env, parts[2], user.id);
      if (!workspace) return json({ error: 'Пространство не найдено.' }, { status: 404 });
      return json({ workspace, goals: await getGoals(env, parts[2]) });
    }

    if (pathname === '/api/goals' && method === 'GET') {
      const workspaceId = searchParams.get('workspaceId') || '';
      if (!workspaceId || !(await getWorkspace(env, workspaceId, user.id))) return json({ error: 'Пространство не найдено.' }, { status: 404 });
      return json({ goals: await getGoals(env, workspaceId) });
    }

    if (pathname === '/api/goals' && method === 'POST') {
      const payload = await body<GoalInput>(request);
      if (!(await getWorkspace(env, payload.workspaceId, user.id))) return json({ error: 'Пространство не найдено.' }, { status: 404 });
      const id = await createGoal(env, payload);
      return json({ id }, { status: 201 });
    }

    if (parts[1] === 'goals' && parts[2] && parts.length === 3 && method === 'PUT') {
      const payload = await body<GoalInput>(request);
      if (!(await getWorkspace(env, payload.workspaceId, user.id))) return json({ error: 'Цель не найдена.' }, { status: 404 });
      const goal = await env.DB.prepare('SELECT id FROM goals WHERE id = ? AND workspace_id = ?')
        .bind(parts[2], payload.workspaceId)
        .first();
      if (!goal) return json({ error: 'Цель не найдена.' }, { status: 404 });
      const title = clean(payload.title, 90);
      const currentValue = clean(payload.currentValue, 60);
      const targetValue = clean(payload.targetValue, 60);
      if (!title || !currentValue || !targetValue) throw new Error('Заполните название, текущее значение и цель.');
      await env.DB.prepare(
        "UPDATE goals SET title = ?, goal_type = ?, current_value = ?, target_value = ?, meta = ?, accent = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
      )
        .bind(title, clean(payload.goalType || 'journey', 32), currentValue, targetValue, clean(payload.meta, 160), clean(payload.accent || 'vermillion', 24), parts[2])
        .run();
      return json({ ok: true });
    }

    if (parts[1] === 'goals' && parts[2] && parts.length === 3 && method === 'DELETE') {
      const workspaceId = searchParams.get('workspaceId') || '';
      if (!(await getWorkspace(env, workspaceId, user.id))) return json({ error: 'Цель не найдена.' }, { status: 404 });
      const result = await env.DB.prepare('DELETE FROM goals WHERE id = ? AND workspace_id = ?').bind(parts[2], workspaceId).run();
      return json({ ok: result.meta.changes > 0 });
    }

    if (parts[1] === 'goals' && parts[2] && parts[3] === 'milestones' && parts[4] === 'order' && method === 'PUT') {
      const payload = await body<{ workspaceId: string; milestoneIds: string[] }>(request);
      if (!(await getWorkspace(env, payload.workspaceId, user.id))) return json({ error: 'Цель не найдена.' }, { status: 404 });
      const goal = await env.DB.prepare('SELECT id FROM goals WHERE id = ? AND workspace_id = ?')
        .bind(parts[2], payload.workspaceId)
        .first();
      if (!goal) return json({ error: 'Цель не найдена.' }, { status: 404 });

      const existing = await env.DB.prepare('SELECT id FROM milestones WHERE goal_id = ?')
        .bind(parts[2])
        .all<{ id: string }>();
      const requested = Array.isArray(payload.milestoneIds) ? payload.milestoneIds.map((id) => clean(id, 80)) : [];
      const existingIds = new Set(existing.results.map((item) => item.id));
      if (requested.length !== existingIds.size || new Set(requested).size !== existingIds.size || requested.some((id) => !existingIds.has(id))) {
        throw new Error('Список этапов изменился. Обновите страницу и попробуйте ещё раз.');
      }

      await env.DB.batch(requested.map((id, index) =>
        env.DB.prepare("UPDATE milestones SET sort_order = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND goal_id = ?")
          .bind(index, id, parts[2]),
      ));
      return json({ ok: true });
    }

    if (parts[1] === 'goals' && parts[2] && parts[3] === 'milestones' && method === 'POST') {
      const payload = await body<MilestoneInput & { workspaceId: string }>(request);
      if (!(await getWorkspace(env, payload.workspaceId, user.id))) return json({ error: 'Цель не найдена.' }, { status: 404 });
      const goal = await env.DB.prepare('SELECT id FROM goals WHERE id = ? AND workspace_id = ?').bind(parts[2], payload.workspaceId).first();
      if (!goal) return json({ error: 'Цель не найдена.' }, { status: 404 });
      const label = clean(payload.label, 60);
      if (!label) throw new Error('Назовите этап.');
      const next = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM milestones WHERE goal_id = ?')
        .bind(parts[2])
        .first<{ next: number }>();
      const id = crypto.randomUUID();
      const progress = milestoneProgress(payload);
      await env.DB.prepare('INSERT INTO milestones (id, goal_id, label, state, progress_current, progress_target, unit, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, parts[2], label, validState(payload.state), progress.current, progress.target, clean(payload.unit, 24), next?.next ?? 0)
        .run();
      return json({ id }, { status: 201 });
    }

    if (parts[1] === 'milestones' && parts[2] && method === 'PUT') {
      const payload = await body<MilestoneInput & { workspaceId: string }>(request);
      const milestone = await env.DB.prepare(
        'SELECT milestones.id, milestones.label, milestones.state, milestones.progress_current AS progressCurrent, milestones.progress_target AS progressTarget, milestones.unit FROM milestones JOIN goals ON goals.id = milestones.goal_id JOIN workspaces ON workspaces.id = goals.workspace_id WHERE milestones.id = ? AND goals.workspace_id = ? AND workspaces.user_id = ?',
      )
        .bind(parts[2], payload.workspaceId, user.id)
        .first<{ id: string; label: string; state: 'done' | 'current' | 'future'; progressCurrent: number; progressTarget: number; unit: string }>();
      if (!milestone) return json({ error: 'Этап не найден.' }, { status: 404 });
      const progress = milestoneProgress({
        ...payload,
        progressCurrent: payload.progressCurrent ?? milestone.progressCurrent,
        progressTarget: payload.progressTarget ?? milestone.progressTarget,
      });
      await env.DB.prepare("UPDATE milestones SET label = COALESCE(NULLIF(?, ''), label), state = ?, progress_current = ?, progress_target = ?, unit = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
        .bind(clean(payload.label ?? milestone.label, 60), validState(payload.state ?? milestone.state), progress.current, progress.target, clean(payload.unit ?? milestone.unit, 24), parts[2])
        .run();
      return json({ ok: true });
    }

    if (parts[1] === 'milestones' && parts[2] && method === 'DELETE') {
      const workspaceId = searchParams.get('workspaceId') || '';
      await env.DB.prepare(
        'DELETE FROM milestones WHERE id = ? AND goal_id IN (SELECT goals.id FROM goals JOIN workspaces ON workspaces.id = goals.workspace_id WHERE goals.workspace_id = ? AND workspaces.user_id = ?)',
      )
        .bind(parts[2], workspaceId, user.id)
        .run();
      return json({ ok: true });
    }

    if (parts[1] === 'goals' && parts[2] && parts[3] === 'events' && method === 'POST') {
      const payload = await body<{ workspaceId: string; title: string; detail?: string; occurredAt?: string }>(request);
      if (!(await getWorkspace(env, payload.workspaceId, user.id))) return json({ error: 'Цель не найдена.' }, { status: 404 });
      const goal = await env.DB.prepare('SELECT id FROM goals WHERE id = ? AND workspace_id = ?').bind(parts[2], payload.workspaceId).first();
      if (!goal) return json({ error: 'Цель не найдена.' }, { status: 404 });
      const title = clean(payload.title, 120);
      if (!title) throw new Error('Опишите изменение.');
      const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO events (id, goal_id, title, detail, occurred_at) VALUES (?, ?, ?, ?, ?)')
        .bind(id, parts[2], title, clean(payload.detail, 160), clean(payload.occurredAt, 40) || new Date().toISOString())
        .run();
      return json({ id }, { status: 201 });
    }

    return json({ error: 'Маршрут не найден.' }, { status: 404 });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Не удалось выполнить действие.' }, { status: 400 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return api(request, env, url);
    return env.ASSETS.fetch(request);
  },
};
