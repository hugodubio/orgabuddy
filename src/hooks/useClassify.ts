import { useState } from 'react'
import type { ClassifyResult, Priority } from '../types'
import { useProjectsStore } from '../store/projects'

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
  const [loading, setLoading] = useState(false)
  const { projects } = useProjectsStore()

  const classify = async (text: string): Promise<ClassifyResult | null> => {
    const projectIds = projects.map((p) => p.id)
    const { cleaned, priority, projects: overrideProjects } = extractShortcuts(text, projectIds)

    const list = projects.map((p) => `- ${p.id}: ${p.label}`).join('\n')
    const system = `És um assistente de organização pessoal. Classifica entradas em linguagem natural.

Projetos disponíveis:
${list}

Responde APENAS com JSON válido, sem markdown:
{"text":"versão limpa em imperativo, máx 80 chars","projects":["id"],"priority":"alta|média|baixa","reason":"frase curta","type":"tarefa|ideia"}

Prioridade: alta=urgente/deadline, média=importante, baixa=quando houver tempo`

    setLoading(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/classify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ text: cleaned, projects }),
        }
      )
      if (!res.ok) return null
      const result: ClassifyResult = await res.json()
      if (priority) result.priority = priority
      if (overrideProjects.length > 0) result.projects = overrideProjects
      return { ...result, text: cleaned || result.text }
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }

  return { classify, loading }
}
