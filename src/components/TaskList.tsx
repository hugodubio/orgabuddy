import type { Task } from '../types'
import TaskCard from './TaskCard'

const GROUPS = [
  { key: 'alta', label: 'Urgente', pip: 'bg-red-400' },
  { key: 'média', label: 'Esta semana', pip: 'bg-amber-400' },
  { key: 'baixa', label: 'Quando houver tempo', pip: 'bg-[#d0d0ce]' },
] as const

interface Props {
  tasks: Task[]
}

export default function TaskList({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="py-16 text-center text-[13px] text-[#bbb]">
        Nada por aqui.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {GROUPS.map(({ key, label, pip }) => {
        const group = tasks.filter((t) => t.priority === key)
        if (group.length === 0) return null
        return (
          <section key={key}>
            <div className="flex items-center gap-2 mb-2 px-3">
              <span className={`w-1.5 h-1.5 rounded-full ${pip}`} />
              <span className="text-[11px] uppercase tracking-widest text-[#aaa] font-medium">
                {label}
              </span>
            </div>
            <div>
              {group.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
