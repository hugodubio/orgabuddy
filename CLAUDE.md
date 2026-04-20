# OrgaBuddy — CLAUDE.md v2
> Atualizado com base na análise do código real (Abril 2026)

## Stack atual
- **Frontend:** React 18 + Vite + TypeScript + Zustand + Tailwind CSS
- **Backend:** Supabase (tabela `ob_tasks`, `notes`, `projects`)
- **IA:** Classificação local por keywords (`useClassify.ts`) — ver melhorias abaixo
- **Env:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ANTHROPIC_API_KEY`

## CRÍTICO: Tabelas Supabase
- **`ob_tasks`** → tarefas do OrgaBuddy (SEMPRE usar esta)
- **`tasks`** → Mystic Fyah (schema diferente: `descricao`, `membro`, `prio`) — NÃO tocar
- `notes`, `projects` → partilhadas, schema compatível

---

## Problema central identificado
O Hugo captura bem mas **nunca revê**. A app não tem loop de fecho — não há nada que o "puxe" de volta para ver o que está acumulado. As melhorias abaixo resolvem isso sem adicionar fricção.

---

## MELHORIA 1 — Daily Briefing com Claude (PRIORITÁRIA)

### O que é
Quando o Hugo abre a app, em vez de ver logo a lista completa, aparece um **briefing gerado pela IA** com:
- tarefas capturadas nos últimos 3 dias que ainda não foram tratadas
- próximo passo mais urgente por projeto
- número de tarefas em backlog por projeto

### Onde implementar
Novo componente: `src/components/DailyBriefing.tsx`

### Lógica
```typescript
// Chamar no App.tsx uma vez por sessão (sessionStorage key: 'ob_briefing_shown')
// Mostrar como overlay ou no topo da vista "Foco" antes da CaptureBar

async function generateBriefing(tasks: Task[]): Promise<string> {
  const pendentes = tasks.filter(t => !t.done)
  const recentes = pendentes.filter(t => {
    const dias = (Date.now() - new Date(t.created_at).getTime()) / 86400000
    return dias <= 3
  })
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `És o assistente pessoal do Hugo. Analisa estas tarefas pendentes e faz um briefing em PT de 3-4 linhas máximo. Destaca o que é mais urgente e o que foi capturado recentemente mas ainda não tratado. Sê direto, sem floreados.

Tarefas pendentes: ${JSON.stringify(pendentes.map(t => ({
  text: t.text,
  priority: t.priority,
  projects: t.projects,
  created_at: t.created_at,
  due_date: t.due_date
})))}

Tarefas dos últimos 3 dias (não tratadas): ${recentes.length}

Responde apenas com o briefing, sem introdução.`
      }]
    })
  })
  
  const data = await response.json()
  return data.content[0].text
}
```

### UI
- Card subtil no topo da vista Foco, acima da CaptureBar
- Fundo `#fffbeb` (amarelo muito suave), texto normal
- Botão "dispensar" (×) — guarda em `sessionStorage` para não repetir na mesma sessão
- Máximo 4 linhas de texto
- Loading state: "a preparar o teu dia…"

---

## MELHORIA 2 — Classificação com Claude (substituir keyword matching)

### Problema atual
`useClassify.ts` usa listas de palavras-chave. Não entende contexto, não detecta projectos por semântica, não infere datas relativas.

### Solução
Substituir `classifyLocally()` por chamada ao Claude via `VITE_ANTHROPIC_API_KEY`.

**Ficheiro:** `src/hooks/useClassify.ts` — substituir a função `classify`:

```typescript
export function useClassify() {
  const [loading, setLoading] = useState(false)
  const { projects } = useProjectsStore()

  const classify = async (text: string): Promise<ClassifyResult | null> => {
    // Extrair shortcuts manuais primeiro (@projeto, #prioridade)
    const projectIds = projects.map(p => p.id)
    const { cleaned, priority: overridePriority, projects: overrideProjects, tags } = extractShortcuts(text, projectIds)
    
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Classifica esta tarefa. Responde APENAS com JSON válido, sem markdown.

Tarefa: "${cleaned || text}"
Data de hoje: ${today}

Projetos disponíveis:
- arroz: Associação Arroz (gestão, reuniões, burocracia, membros, financiamentos)
- mystic: Mystic Fyah sound system (ensaios, equipamento, bookings, logística)
- estudio: Estúdio/produção musical (composição, gravações, mixagem)
- subciety: Subciety (gestão, parcerias, eventos, comunicação, redes sociais, Instagram, posts)
- vida: Vida pessoal (saúde, finanças, família, amigos, casa, lazer)

${overridePriority ? `Prioridade forçada: ${overridePriority}` : ''}
${overrideProjects.length > 0 ? `Projecto forçado: ${overrideProjects.join(', ')}` : ''}

Devolve:
{
  "text": "versão limpa em imperativo, máx 80 chars",
  "projects": ["id_do_projeto"],
  "priority": "alta" | "média" | "baixa",
  "reason": "frase curta (máx 8 palavras)",
  "type": "tarefa" | "ideia",
  "tags": [],
  "due_date": "YYYY-MM-DD ou null"
}`
          }]
        })
      })
      
      const data = await response.json()
      const raw = data.content[0].text.trim()
      const parsed: ClassifyResult = JSON.parse(raw)
      
      // Aplicar overrides manuais
      if (overridePriority) parsed.priority = overridePriority
      if (overrideProjects.length > 0) parsed.projects = overrideProjects
      if (tags.length > 0) parsed.tags = [...(parsed.tags ?? []), ...tags]
      
      return parsed
    } catch (e) {
      // Fallback para classificação local se Claude falhar
      console.warn('Claude classify failed, falling back to local', e)
      return classifyLocally(cleaned || text, projects, overrideProjects, overridePriority)
    } finally {
      setLoading(false)
    }
  }

  return { classify, loading }
}
```

**Manter** a função `classifyLocally()` como fallback (não apagar).

---

## MELHORIA 3 — Weekly Review automático

### O que é
Uma vez por semana (segunda-feira ou na primeira abertura da semana), a app mostra um ecrã de revisão com:
- tarefas concluídas na semana anterior (celebração)
- tarefas por fazer há mais de 5 dias (prompt para decidir: fazer, adiar, ou apagar)
- tarefas sem projeto atribuído

### Onde implementar
Novo componente: `src/components/WeeklyReview.tsx`

### Lógica de trigger
```typescript
// Em App.tsx, após fetchTasks():
const lastReview = localStorage.getItem('ob_last_review')
const hoje = new Date()
const segunda = hoje.getDay() === 1 // Monday
const semanaPassada = lastReview 
  ? (Date.now() - new Date(lastReview).getTime()) > 6 * 86400000
  : true

if (segunda && semanaPassada) {
  setShowWeeklyReview(true)
  localStorage.setItem('ob_last_review', hoje.toISOString())
}
```

### UI
- Overlay full-screen (não modal) com fundo branco
- 3 secções com scroll vertical:
  1. ✅ "Completaste X tarefas esta semana" — lista pequena
  2. ⏰ "Estas tarefas estão paradas há mais de 5 dias" — para cada uma: botões [Manter] [Adiar 1 semana] [Apagar]
  3. 📂 "Tarefas sem projeto" — para cada uma: dropdown de projeto
- Botão "Fechar revisão" no fundo

---

## MELHORIA 4 — Estado de projeto no topo da ProjectSidebar

### O que é
Quando clicas num projeto na sidebar, além da lista de tarefas aparece uma linha de contexto rápido:
> *"Subciety — 3 tarefas activas · última actividade: ontem · próximo: publicar calendar Dub Experience"*

### Onde implementar
Em `src/components/ProjectSidebar.tsx`, abaixo do nome do projeto activo.

### Lógica
```typescript
// Calcular para o activeProject:
const projectTasks = tasks.filter(t => t.projects.includes(activeProject) && !t.done)
const lastActivity = projectTasks.length > 0 
  ? Math.max(...projectTasks.map(t => new Date(t.updated_at).getTime()))
  : null
const nextTask = projectTasks.find(t => t.priority === 'alta') ?? projectTasks[0]
```

---

## MELHORIA 5 — Notificação de revisão (à tarde)

### O que é
Web Notification às 17h (se a app estiver aberta) com:
> "Tens X tarefas por tratar. 2 minutos para rever?"

### Onde implementar
Em `src/hooks/useReminders.ts` — adicionar ao useEffect existente:

```typescript
// Verificar se são ~17h e se ainda não foi mostrado hoje
const agora = new Date()
const hora = agora.getHours()
const chaveHoje = `ob_review_${agora.toISOString().split('T')[0]}`

if (hora >= 17 && hora < 18 && !sessionStorage.getItem(chaveHoje)) {
  const pendentes = tasks.filter(t => !t.done && (t.user_id === userId || (!t.user_id && userId === 'hugo')))
  if (pendentes.length > 0) {
    sessionStorage.setItem(chaveHoje, '1')
    new Notification('OrgaBuddy', {
      body: `${pendentes.length} tarefas por tratar. 2 minutos para rever?`,
      icon: 'https://hugodubio.github.io/orgabuddy/favicon.ico'
    })
  }
}
```

---

## Ordem de implementação recomendada

1. **Melhoria 2** (classificação com Claude) — impacto imediato em cada captura, zero UI nova
2. **Melhoria 1** (Daily Briefing) — resolve directamente o problema de revisão
3. **Melhoria 5** (notificação das 17h) — 20 linhas de código, grande impacto
4. **Melhoria 4** (contexto de projeto na sidebar) — quick win visual
5. **Melhoria 3** (Weekly Review) — mais complexo, implementar por último

---

## Notas importantes

- Modelo: sempre `claude-sonnet-4-20250514`
- Header obrigatório para chamadas browser-side: `'anthropic-dangerous-direct-browser-access': 'true'`
- Manter `classifyLocally()` como fallback — nunca apagar
- Nunca commitar `.env` nem chaves
- A CaptureBar deve continuar sempre visível e em foco — não mexer nessa UX
- `VITE_ANTHROPIC_API_KEY` já está no `.env.local` do projecto
