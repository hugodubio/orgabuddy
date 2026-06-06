-- Hoje: agendar tarefa para um dia sem alterar due_date
ALTER TABLE ob_tasks ADD COLUMN IF NOT EXISTS scheduled_date TEXT;

-- Músicas → tarefas: ligar tarefa a uma track
ALTER TABLE ob_tasks ADD COLUMN IF NOT EXISTS track_id BIGINT REFERENCES ob_tracks(id) ON DELETE SET NULL;

-- Hábitos
CREATE TABLE IF NOT EXISTS ob_habits (
  id           BIGSERIAL PRIMARY KEY,
  text         TEXT NOT NULL,
  frequency    TEXT DEFAULT 'daily',
  days_of_week JSONB DEFAULT '[0,1,2,3,4,5,6]',
  color        TEXT DEFAULT '#3b82f6',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ob_habit_logs (
  id         BIGSERIAL PRIMARY KEY,
  habit_id   BIGINT NOT NULL REFERENCES ob_habits(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  done       BOOLEAN DEFAULT true,
  UNIQUE(habit_id, date)
);

ALTER TABLE ob_habits     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ob_habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open" ON ob_habits     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON ob_habit_logs FOR ALL USING (true) WITH CHECK (true);
