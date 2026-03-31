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
    const { cleaned, priority, projects: overrideProjects, tags } = extractShortcuts(text, projectIds)

    setLoading(true)
    try {
      const result = classifyLocally(cleaned || text, projects, overrideProjects, priority)
      result.tags = tags
      return result
    } finally {
      setLoading(false)
    }
  }

  return { classify, loading }
}
