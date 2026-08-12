ALTER TABLE events ADD COLUMN milestone_id TEXT REFERENCES milestones(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN amount REAL;
ALTER TABLE events ADD COLUMN kind TEXT NOT NULL DEFAULT 'note' CHECK (kind IN ('note', 'progress', 'adjustment'));

CREATE INDEX IF NOT EXISTS events_milestone_date ON events(milestone_id, occurred_at DESC);
