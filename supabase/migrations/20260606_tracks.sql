-- Módulo de músicas / tracks
CREATE TABLE IF NOT EXISTS ob_tracks (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL DEFAULT 'hugo',
  title       TEXT NOT NULL,
  artist      TEXT,
  project     TEXT,
  status      TEXT NOT NULL DEFAULT 'ideia', -- ideia | produção | mix | master | lançado
  deadline    TEXT,  -- YYYY-MM-DD
  bpm         INTEGER,
  key         TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Lançamentos (singles, EPs, álbuns)
CREATE TABLE IF NOT EXISTS ob_releases (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL DEFAULT 'hugo',
  name         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'single', -- single | ep | álbum
  release_date TEXT,  -- YYYY-MM-DD
  track_ids    JSONB NOT NULL DEFAULT '[]',
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) — opcional, a app não usa auth do Supabase
ALTER TABLE ob_tracks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ob_releases ENABLE ROW LEVEL SECURITY;

-- Política aberta (acesso por anon key — mesma abordagem do resto da app)
CREATE POLICY "open" ON ob_tracks  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON ob_releases FOR ALL USING (true) WITH CHECK (true);
