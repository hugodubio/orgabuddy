-- Correr no Supabase SQL Editor
-- https://supabase.com/dashboard/project/dvaextwlgyidfsdfqnkl/sql

CREATE TABLE ob_events (
  id                bigserial PRIMARY KEY,
  user_id           text NOT NULL DEFAULT 'hugo',
  title             text NOT NULL,
  start_date        date NOT NULL,
  end_date          date NOT NULL,
  project_id        text REFERENCES projects(id),
  notes             text,
  location          text,

  -- Recorrentes
  recurrence_rule   text CHECK (recurrence_rule IN ('weekly', 'monthly', 'first-week-monthly')),
  recurrence_end    date,
  parent_event_id   bigint REFERENCES ob_events(id) ON DELETE CASCADE,

  -- Tarefa associada
  task_id           bigint REFERENCES ob_tasks(id) ON DELETE SET NULL,

  -- Google Calendar
  gcal_event_id     text UNIQUE,
  gcal_calendar_id  text,
  gcal_account      text,

  created_at        timestamptz DEFAULT now()
);

CREATE INDEX ob_events_user_dates ON ob_events (user_id, start_date, end_date);
CREATE INDEX ob_events_parent ON ob_events (parent_event_id) WHERE parent_event_id IS NOT NULL;
