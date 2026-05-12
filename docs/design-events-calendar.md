# Design: Sistema de Eventos e Calendário

_Validado: 2026-05-12_

## Resumo

Sistema unificado de eventos com duração multi-dia, recorrentes, tarefas associadas, e sync bi-direccional com duas contas Google Calendar (hugodubio@gmail.com e hugo@arrozetudios.pt).

## Contexto

Hugo gere múltiplos projectos em simultâneo (freelance, Arroz, Mystic Fyah, Sr. Dubong) e não consegue ver facilmente quando está ocupado nem manter controlo de recorrentes.

## O que é construído

- Eventos com data início + fim → barras visuais multi-dia estilo Google Calendar
- Tarefas com janela de dias ou bloqueio de calendário
- Criação via drag-to-select, form, ou CaptureBar com linguagem natural (Claude)
- Recorrentes com regra → instâncias automáticas → tarefa associada opcional
- Sync bi-direccional com duas contas GCal
- Notificações via Google Calendar (nativo)

## Non-goals

- Sem partilha/convites com outros utilizadores
- Sem push notifications próprias (delegado ao GCal)

## Modelo de Dados

```sql
CREATE TABLE ob_events (
  id                  bigserial PRIMARY KEY,
  user_id             text NOT NULL DEFAULT 'hugo',
  title               text NOT NULL,
  start_date          date NOT NULL,
  end_date            date NOT NULL,
  project_id          text REFERENCES projects(id),
  notes               text,
  location            text,

  -- Recorrentes
  recurrence_rule     text,        -- 'weekly' | 'monthly' | 'first-week-monthly'
  recurrence_end      date,
  parent_event_id     bigint REFERENCES ob_events(id),

  -- Tarefa associada
  task_id             bigint REFERENCES ob_tasks(id),

  -- Google Calendar
  gcal_event_id       text UNIQUE,
  gcal_calendar_id    text,        -- 'primary' ou ID do calendário Arroz
  gcal_account        text,        -- 'hugodubio@gmail.com' | 'hugo@arrozetudios.pt'

  created_at          timestamptz DEFAULT now()
);
```

## Fluxo de Sync GCal

**OrgaBuddy → GCal:**
1. Utilizador cria evento, escolhe conta GCal de destino
2. Edge Function cria evento na GCal API
3. `gcal_event_id` guardado em `ob_events`

**GCal → OrgaBuddy:**
1. Google envia webhook para Edge Function
2. Edge Function cria/actualiza evento em `ob_events`

**Conflitos:** Last-write-wins (single user, suficiente)

**OAuth:** Duas contas autenticadas independentemente, refresh tokens guardados no Supabase.

## Decision Log

| Decisão | Alternativas | Porquê |
|---|---|---|
| Tabela `ob_events` separada | Adicionar campos a `ob_tasks` | Eventos e tarefas têm ciclo de vida diferente |
| GCal desde o início (sem push próprio) | ntfy.sh / Web Push nativo | GCal já trata notificações em iOS e Android |
| Last-write-wins para conflitos | Merge manual | Single user, complexidade desnecessária |
| OAuth para 2 contas | Só uma conta | Vida pessoal e Arroz separados |
| CaptureBar com Claude | Parsing manual de regex | Claude já integrado, muito mais flexível |

## Assumptions

- Supabase Edge Functions usadas para GCal API calls e webhook receiver
- Calendário continua mensal como vista principal
- Recorrentes geram instâncias com 60 dias de antecedência via Supabase cron
- Setup OAuth feito uma vez manualmente (Google Cloud Console)
