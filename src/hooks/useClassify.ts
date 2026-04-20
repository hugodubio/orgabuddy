import { useState } from 'react'
import type { ClassifyResult, Priority, TaskType } from '../types'
import { useProjectsStore } from '../store/projects'

const ALTA_WORDS = [
  'urgente', 'urgente!', 'hoje', 'agora', 'deadline', 'asap', 'fix', 'bug',
  'erro', 'crítico', 'critico', 'reunião', 'reuniao', 'meeting',
  'breaking', 'bloqueado', 'bloqueante', 'importante',
]

const AMANHA_WORDS = ['amanhã', 'amanha']

function getTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

const BAIXA_WORDS = [
  'ideia', 'talvez', 'futuro', 'explorar', 'investigar', 'pesquisar',
  'quando houver tempo', 'um dia', 'someday', 'pensar', 'considerar',
  'experimentar', 'tentar', 'ver se', 'e se', 'seria fixe', 'seria giro',
]

const IDEIA_WORDS = [
  'ideia', 'talvez', 'e se', 'seria fixe', 'seria giro', 'explorar',
  'considerar', 'pensar em', 'e se', 'podíamos', 'podiamos', 'e se fizesse',
]

function classifyLocally(
  text: string,
  projects: { id: string; label: string; keywords?: string[] }[],
  overrideProjects: string[],
  overridePriority?: Priority
): ClassifyResult {
  const lower = text.toLowerCase()

  // Priority
  let priority: Priority = 'média'
  let reason = 'Prioridade normal'

  if (overridePriority) {
    priority = overridePriority
    reason = 'Prioridade definida manualmente'
  } else if (ALTA_WORDS.some((w) => lower.includes(w))) {
    priority = 'alta'
    reason = 'Contém palavras de urgência'
  } else if (BAIXA_WORDS.some((w) => lower.includes(w))) {
    priority = 'baixa'
    reason = 'Sem urgência imediata'
  }

  // Type
  const type: TaskType = IDEIA_WORDS.some((w) => lower.includes(w)) ? 'ideia' : 'tarefa'

  // Auto-detect project from keywords if no override
  let detectedProjects = overrideProjects
  if (detectedProjects.length === 0) {
    for (const p of projects) {
      const terms = [
        p.label.toLowerCase(),
        p.id.toLowerCase(),
        ...(p.keywords ?? []).map((k) => k.toLowerCase()),
      ]
      if (terms.some((t) => t && lower.includes(t))) {
        detectedProjects = [p.id]
        break
      }
    }
  }

  // Detect "amanhã" → due_date tomorrow, priority normal
  const isAmanha = AMANHA_WORDS.some((w) => lower.includes(w))
  if (isAmanha && !overridePriority) {
    priority = 'média'
    reason = 'Para amanhã'
  }

  // Clean text: capitalize first letter
  const cleaned = text.charAt(0).toUpperCase() + text.slice(1)

  return {
    text: cleaned,
    projects: detectedProjects,
    priority,
    reason,
    type,
    tags: [],
    due_date: isAmanha ? getTomorrow() : null,
  }
}

const PRIORITY_SHORTCUTS: Record<string, Priority> = {
  alta: 'alta', urgente: 'alta',
  media: 'média', média: 'média',
  baixa: 'baixa',
}

function extractShortcuts(text: string, projectIds: string[]) {
  let cleaned = text
  let priority: Priority | undefined
  const projects: string[] = []
  const tags: string[] = []

  cleaned = cleaned.replace(/#(\w+)/g, (_, w) => {
    const p = PRIORITY_SHORTCUTS[w.toLowerCase()]
    if (p) { priority = p; return '' }
    tags.push(w.toLowerCase())
    return ''
  })
  cleaned = cleaned.replace(/@(\w+)/g, (_, w) => {
    const id = projectIds.find((pid) => pid === w.toLowerCase())
    if (id) { projects.push(id); return '' }
    return `@${w}`
  })

  return { cleaned: cleaned.trim(), priority, projects, tags }
}

export function useClassify() {
  const [loading, setLoading] = useState(false)
  const { projects } = useProjectsStore()

  const classify = async (text: string): Promise<ClassifyResult | null> => {
    const projectIds = projects.map((p) => p.id)
    const { cleaned, priority: overridePriority, projects: overrideProjects, tags } = extractShortcuts(text, projectIds)

    setLoading(true)
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (apiKey) {
        const today = new Date().toISOString().split('T')[0]
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            messages: [{
              role: 'user',
              content: `Classifica esta tarefa. Responde APENAS com JSON válido, sem markdown.

Tarefa: "${cleaned || text}"
Data de hoje: ${today}

Projetos disponíveis:
${projects.map((p) => `- ${p.id}: ${p.label}${p.keywords?.length ? ` (${p.keywords.join(', ')})` : ''}`).join('\n')}

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
}`,
            }],
          }),
        })
        if (response.ok) {
          const data = await response.json()
          const parsed: ClassifyResult = JSON.parse(data.content[0].text.trim())
          if (overridePriority) parsed.priority = overridePriority
          if (overrideProjects.length > 0) parsed.projects = overrideProjects
          if (tags.length > 0) parsed.tags = [...(parsed.tags ?? []), ...tags]
          return parsed
        }
      }
    } catch (e) {
      console.warn('Claude classify failed, falling back to local', e)
    } finally {
      setLoading(false)
    }

    const result = classifyLocally(cleaned || text, projects, overrideProjects, overridePriority)
    result.tags = [...(result.tags ?? []), ...tags]
    return result
  }

  return { classify, loading }
}
