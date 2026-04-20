import { useEffect, useState } from 'react'
import type { Task } from '../types'

const SESSION_KEY = 'ob_briefing_shown'
const ICON = 'https://hugodubio.github.io/orgabuddy/favicon.ico'

async function generateBriefing(tasks: Task[]): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) return ''

  const pendentes = tasks.filter((t) => !t.done)
  const cutoff = Date.now() - 3 * 86400000
  const recentes = pendentes.filter((t) => new Date(t.created_at).getTime() > cutoff)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `És o assistente pessoal do Hugo. Analisa estas tarefas pendentes e faz um briefing em PT de 3-4 linhas máximo. Destaca o que é mais urgente e o que foi capturado recentemente mas ainda não tratado. Sê direto, sem floreados.

Tarefas pendentes (${pendentes.length}): ${JSON.stringify(pendentes.map((t) => ({
  text: t.text,
  priority: t.priority,
  projects: t.projects,
  created_at: t.created_at,
  due_date: t.due_date,
})))}

Tarefas dos últimos 3 dias (não tratadas): ${recentes.length}

Responde apenas com o briefing, sem introdução.`,
      }],
    }),
  })

  if (!response.ok) return ''
  const data = await response.json()
  return data.content[0].text
}

interface Props {
  tasks: Task[]
}

export default function DailyBriefing({ tasks }: Props) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(() => !!sessionStorage.getItem(SESSION_KEY))

  useEffect(() => {
    if (dismissed || !tasks.length || !import.meta.env.VITE_ANTHROPIC_API_KEY) return
    setLoading(true)
    generateBriefing(tasks)
      .then((t) => setText(t || null))
      .catch(() => setText(null))
      .finally(() => setLoading(false))
  }, []) // only on mount

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1')
    setDismissed(true)
  }

  if (dismissed) return null
  if (!loading && !text) return null

  return (
    <div className="mb-6 rounded-xl px-4 py-3.5 relative" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
      <button
        onClick={dismiss}
        className="absolute top-2.5 right-3 text-[16px] leading-none opacity-40 hover:opacity-80 transition-opacity"
        style={{ color: '#92400e' }}
      >×</button>

      <div className="flex items-center gap-2 mb-2">
        <img src={ICON} alt="" className="w-4 h-4 rounded" />
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#92400e' }}>O teu dia</span>
      </div>

      {loading ? (
        <p className="text-[13px] italic" style={{ color: '#b45309' }}>a preparar o teu dia…</p>
      ) : (
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: '#78350f' }}>{text}</p>
      )}
    </div>
  )
}
