# OrgaBuddy — CLAUDE.md

Ferramenta de gestão pessoal do Hugo.

## Stack
- Vite + React 18 + TypeScript + Zustand + Tailwind CSS
- Supabase: `https://dvaextwlgyidfsdfqnkl.supabase.co` (mesmo projeto que Mystic Fyah)

## CRÍTICO: Tabelas
- **Usar `ob_tasks`** para todas as queries de tarefas do OrgaBuddy
- **NÃO usar `tasks`** — essa tabela pertence ao Mystic Fyah (schema diferente: descricao, membro, prio)
- `notes` e `projects` são partilhadas (schema compatível)

## Estrutura
```
src/
  store/tasks.ts      — fetchTasks (ob_tasks), syncFromMystic, toggleDone, deleteTask
  store/projects.ts   — projetos com cores
  lib/supabase.ts     — cliente (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
  components/
    CaptureBar.tsx    — captura com AI → ob_tasks
    ProjectSidebar.tsx — sidebar + botão sync ↺
    TaskCard.tsx      — badges source (gmail / mystic_event / mystic_task)
    TaskList.tsx
    GraphView.tsx
    DailyNote.tsx
    CommandPalette.tsx
```

## Sync com Mystic Fyah
`syncFromMystic()` no store lê `events` + `tasks` (membro=Dubio) e faz upsert em `ob_tasks` via `source_id`.
- source_id: `mf_event_{id}` ou `mf_task_{id}`
- Idempotente — pode correr N vezes sem duplicar

## Dev
```bash
npm run dev    # localhost:5173
npm run build  # verifica erros TS
```

## Env
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ANTHROPIC_API_KEY   # para classificação de tarefas com Claude
```
