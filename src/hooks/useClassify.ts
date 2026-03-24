import type { ClassifyResult, Priority, ProjectDef } from '../types'
import { useProjectsStore } from '../store/projects'

const HIGH_KEYWORDS = ['urgente', 'hoje', 'amanhã', 'deadline', 'prazo', 'entrega', 'reunião', 'meeting', 'apresentação', 'show', 'evento', 'concerto', 'asap', 'agora']
const LOW_KEYWORDS = ['quando puder', 'quando der', 'algum dia', 'talvez', 'podia', 'seria fixe', 'ver se', 'explorar']
const IDEA_KEYWORDS = ['ideia', 'e se', 'talvez', 'podia', 'seria fixe', 'explorar', 'imaginar', 'pensar em']

function detectPriority(text: string): Priority {
  const lower = text.toLowerCase()
  if (HIGH_KEYWORDS.some((k) => lower.includes(k))) return 'alta'
  if (LOW_KEYWORDS.some((k) => lower.includes(k))) return 'baixa'
  return 'média'
}

function detectType(text: string): 'tarefa' | 'ideia' {
  const lower = text.toLowerCase()
  if (IDEA_KEYWORDS.some((k) => lower.includes(k))) return 'ideia'
  return 'tarefa'
}

function detectProjects(text: string, projects: ProjectDef[]): string[] {
  const lower = text.toLowerCase()
  const matched = projects.filter(
    (p) => lower.includes(p.id.toLowerCase()) || lower.includes(p.label.toLowerCase())
  ).map((p) => p.id)
  return matched.length > 0 ? matched : ['geral']
}

function extractShortcuts(text: string, projectIds: string[]) {
  const PRIORITIES: Record<string, Priority> = {
    alta: 'alta', urgente: 'alta',
    media: 'média', média: 'média',
    baixa: 'baixa',
  }
  let cleaned = text
  let priority: Priority | undefined
  const projects: string[] = []

  cleaned = cleaned.replace(/#(\w+)/g, (_, w) => {
    const p = PRIORITIES[w.toLowerCase()]
    if (p) { priority = p; return '' }
    return `#${w}`
  })
  cleaned = cleaned.replace(/@(\w+)/g, (_, w) => {
    const id = projectIds.find((pid) => pid === w.toLowerCase())
    if (id) { projects.push(id); return '' }
    return `@${w}`
  })

  return { cleaned: cleaned.trim(), priority, projects }
}

export function useClassify() {
  const { projects } = useProjectsStore()

  const classify = async (text: string): Promise<ClassifyResult | null> => {
    const projectIds = projects.map((p) => p.id)
    const { cleaned, priority: shortcutPriority, projects: overrideProjects } = extractShortcuts(text, projectIds)

    const finalText = cleaned || text
    const priority = shortcutPriority ?? detectPriority(finalText)
    const type = detectType(finalText)
    const detectedProjects = overrideProjects.length > 0 ? overrideProjects : detectProjects(finalText, projects)

    return {
      text: finalText,
      projects: detectedProjects,
      priority,
      reason: '',
      type,
    }
  }

  return { classify, loading: false }
}
