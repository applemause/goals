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
  milestones?: Array<{ label: string; state: 'done' | 'current' | 'future' }>;
};

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
  });

const clean = (value: unknown, limit = 140) => String(value ?? '').trim().slice(0, limit);
const validState = (value: unknown): 'done' | 'current' | 'future' =>
  value === 'done' || value === 'current' || value === 'future' ? value : 'future';

async function body<T>(request: Request): Promise<T> {
  return request.json<T>();
}

async function getWorkspace(env: Env, workspaceId: string) {
  return env.DB.prepare('SELECT id, name, created_at AS createdAt FROM workspaces WHERE id = ?')
    .bind(workspaceId)
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
      env.DB.prepare('SELECT id, label, state, sort_order AS sortOrder FROM milestones WHERE goal_id = ? ORDER BY sort_order, created_at')
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
      title: 'Немецкий B2',
      goalType: 'journey',
      currentValue: 'A2',
      targetValue: 'B2',
      meta: 'Курс 18 из 25 · ≈ 7 месяцев',
      accent: 'vermillion',
      milestones: [
        { label: 'A2', state: 'done' },
        { label: 'Курс', state: 'current' },
        { label: 'B1', state: 'future' },
        { label: 'B2', state: 'future' },
      ],
    },
    {
      title: 'Сильное тело',
      goalType: 'record',
      currentValue: '80 кг',
      targetValue: '100 кг',
      meta: 'Год назад · 60 кг',
      accent: 'vermillion',
      milestones: [
        { label: '60', state: 'done' },
        { label: '70', state: 'done' },
        { label: '80', state: 'current' },
        { label: '90', state: 'future' },
        { label: '100', state: 'future' },
      ],
    },
    {
      title: 'Финансовая свобода',
      goalType: 'collection',
      currentValue: '1 из 3 квартир',
      targetValue: '3 квартиры',
      meta: 'Ипотека погашена на 42%',
      accent: 'vermillion',
      milestones: [
        { label: 'Квартира 1', state: 'done' },
        { label: 'Квартира 2', state: 'future' },
        { label: 'Квартира 3', state: 'future' },
        { label: 'Ипотека', state: 'current' },
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
      statements.push(
        env.DB.prepare('INSERT INTO milestones (id, goal_id, label, state, sort_order) VALUES (?, ?, ?, ?, ?)').bind(
          crypto.randomUUID(),
          goalId,
          label,
          validState(milestone.state),
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
    if (method === 'POST' && pathname === '/api/workspaces') {
      const payload = await body<{ name?: string }>(request);
      const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO workspaces (id, name) VALUES (?, ?)')
        .bind(id, clean(payload.name || 'Мои цели', 80) || 'Мои цели')
        .run();
      await seedWorkspace(env, id);
      return json({ id });
    }

    if (parts[1] === 'workspaces' && parts[2] && method === 'GET') {
      const workspace = await getWorkspace(env, parts[2]);
      if (!workspace) return json({ error: 'Пространство не найдено.' }, { status: 404 });
      return json({ workspace, goals: await getGoals(env, parts[2]) });
    }

    if (pathname === '/api/goals' && method === 'GET') {
      const workspaceId = searchParams.get('workspaceId') || '';
      if (!workspaceId || !(await getWorkspace(env, workspaceId))) return json({ error: 'Пространство не найдено.' }, { status: 404 });
      return json({ goals: await getGoals(env, workspaceId) });
    }

    if (pathname === '/api/goals' && method === 'POST') {
      const payload = await body<GoalInput>(request);
      if (!(await getWorkspace(env, payload.workspaceId))) return json({ error: 'Пространство не найдено.' }, { status: 404 });
      const id = await createGoal(env, payload);
      return json({ id }, { status: 201 });
    }

    if (parts[1] === 'goals' && parts[2] && method === 'PUT') {
      const payload = await body<GoalInput>(request);
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

    if (parts[1] === 'goals' && parts[2] && method === 'DELETE') {
      const workspaceId = searchParams.get('workspaceId') || '';
      const result = await env.DB.prepare('DELETE FROM goals WHERE id = ? AND workspace_id = ?').bind(parts[2], workspaceId).run();
      return json({ ok: result.meta.changes > 0 });
    }

    if (parts[1] === 'goals' && parts[2] && parts[3] === 'milestones' && method === 'POST') {
      const payload = await body<{ workspaceId: string; label: string; state?: string }>(request);
      const goal = await env.DB.prepare('SELECT id FROM goals WHERE id = ? AND workspace_id = ?').bind(parts[2], payload.workspaceId).first();
      if (!goal) return json({ error: 'Цель не найдена.' }, { status: 404 });
      const label = clean(payload.label, 60);
      if (!label) throw new Error('Назовите этап.');
      const next = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM milestones WHERE goal_id = ?')
        .bind(parts[2])
        .first<{ next: number }>();
      const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO milestones (id, goal_id, label, state, sort_order) VALUES (?, ?, ?, ?, ?)')
        .bind(id, parts[2], label, validState(payload.state), next?.next ?? 0)
        .run();
      return json({ id }, { status: 201 });
    }

    if (parts[1] === 'milestones' && parts[2] && method === 'PUT') {
      const payload = await body<{ workspaceId: string; label?: string; state?: string }>(request);
      const milestone = await env.DB.prepare(
        'SELECT milestones.id FROM milestones JOIN goals ON goals.id = milestones.goal_id WHERE milestones.id = ? AND goals.workspace_id = ?',
      )
        .bind(parts[2], payload.workspaceId)
        .first();
      if (!milestone) return json({ error: 'Этап не найден.' }, { status: 404 });
      await env.DB.prepare("UPDATE milestones SET label = COALESCE(NULLIF(?, ''), label), state = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
        .bind(clean(payload.label, 60), validState(payload.state), parts[2])
        .run();
      return json({ ok: true });
    }

    if (parts[1] === 'milestones' && parts[2] && method === 'DELETE') {
      const workspaceId = searchParams.get('workspaceId') || '';
      await env.DB.prepare(
        'DELETE FROM milestones WHERE id = ? AND goal_id IN (SELECT id FROM goals WHERE workspace_id = ?)',
      )
        .bind(parts[2], workspaceId)
        .run();
      return json({ ok: true });
    }

    if (parts[1] === 'goals' && parts[2] && parts[3] === 'events' && method === 'POST') {
      const payload = await body<{ workspaceId: string; title: string; detail?: string; occurredAt?: string }>(request);
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

