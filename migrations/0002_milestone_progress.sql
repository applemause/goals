ALTER TABLE milestones ADD COLUMN progress_current INTEGER NOT NULL DEFAULT 0;
ALTER TABLE milestones ADD COLUMN progress_target INTEGER NOT NULL DEFAULT 1;
ALTER TABLE milestones ADD COLUMN unit TEXT NOT NULL DEFAULT '';

UPDATE milestones
SET progress_current = CASE WHEN state IN ('done', 'current') THEN 1 ELSE 0 END,
    progress_target = 1;

UPDATE milestones
SET label = 'Курс B1', progress_current = 15, progress_target = 50, unit = 'дней', state = 'current'
WHERE label = 'Курс'
  AND goal_id IN (SELECT id FROM goals WHERE title = 'Немецкий B2');

UPDATE milestones
SET progress_current = 42, progress_target = 100, unit = '%', state = 'current'
WHERE label = 'Ипотека'
  AND goal_id IN (SELECT id FROM goals WHERE title = 'Финансовая свобода');

UPDATE goals
SET meta = ''
WHERE title = 'Финансовая свобода' AND meta = 'Ипотека погашена на 42%';
