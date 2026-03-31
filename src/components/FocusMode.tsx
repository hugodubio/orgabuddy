import { useState, useEffect, useCallback } from 'react'
import type { Task } from '../types'
import { useTasksStore } from '../store/tasks'

const WORK_MINS = 25
const BREAK_MINS = 5
const ICON = 'https://hugodubio.github.io/orgabuddy/favicon.ico'

function notify(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: ICON })
  }
}

function selectTask(tasks: Task[], userId: string): Task | null {
  const today = new Date().toISOString().split('T')[0]
  const candidates = tasks.filter((t) =>
    !t.done && (t.user_id === userId || (!t.user_id && userId === 'hugo'))
  )
  // due today first → alta → oldest
  const dueToday = candidates.filter((t) => t.due_date === today)
  if (dueToday.length) return dueToday[0]
  const alta = candidates.filter((t) => t.priority === 'alta')
  if (alta.length) return alta[0]
  if (candidates.length) return candidates[candidates.length - 1]
  return null
}

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface Props {
  userId: string
  onExit: () => void
}

export default function FocusMode({ userId, onExit }: Props) {
  const { tasks, toggleDone } = useTasksStore()
  const [task, setTask] = useState<Task | null>(() => selectTask(tasks, userId))
  const [phase, setPhase] = useState<'work' | 'break'>('work')
  const [timeLeft, setTimeLeft] = useState(WORK_MINS * 60)
  const [running, setRunning] = useState(true)
  const [celebrating, setCelebrating] = useState(false)
  const [skipped, setSkipped] = useState<number[]>([])

  // Timer
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          if (phase === 'work') {
            notify('OrgaBuddy — Pausa! ☕', 'Fizeste 25 minutos. Descansa 5 min.')
            setPhase('break')
            setRunning(false)
            return BREAK_MINS * 60
          } else {
            notify('OrgaBuddy — Volta ao trabalho! 💪', 'Pausa terminada. Vamos lá!')
            setPhase('work')
            setRunning(false)
            return WORK_MINS * 60
          }
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, phase])

  const handleDone = useCallback(async () => {
    if (!task) return
    setCelebrating(true)
    await toggleDone(task.id)
    setTimeout(() => {
      setCelebrating(false)
      const next = selectTask(
        tasks.map((t) => (t.id === task.id ? { ...t, done: true } : t)),
        userId
      )
      if (next && !skipped.includes(next.id)) {
        setTask(next)
        setPhase('work')
        setTimeLeft(WORK_MINS * 60)
        setRunning(true)
      } else {
        // All done
        notify('OrgaBuddy 🎉', 'Completaste todas as tarefas!')
        onExit()
      }
    }, 1800)
  }, [task, tasks, userId, skipped, toggleDone, onExit])

  const handleSkip = useCallback(() => {
    if (!task) return
    const newSkipped = [...skipped, task.id]
    setSkipped(newSkipped)
    const next = selectTask(
      tasks.filter((t) => !newSkipped.includes(t.id)),
      userId
    )
    if (next) {
      setTask(next)
      setPhase('work')
      setTimeLeft(WORK_MINS * 60)
      setRunning(true)
    } else {
      onExit()
    }
  }, [task, tasks, userId, skipped, onExit])

  const pct = phase === 'work'
    ? ((WORK_MINS * 60 - timeLeft) / (WORK_MINS * 60)) * 100
    : ((BREAK_MINS * 60 - timeLeft) / (BREAK_MINS * 60)) * 100

  const circumference = 2 * Math.PI * 54

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'var(--brand-primary)' }}>
        <p className="text-[18px] font-semibold text-white mb-6">Sem tarefas pendentes 🎉</p>
        <button onClick={onExit} className="px-6 py-3 rounded-xl text-[14px] font-semibold text-white"
          style={{ background: 'var(--brand-secondary)' }}>Sair</button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-6"
      style={{ background: 'var(--brand-primary)' }}>

      {/* Celebration overlay */}
      {celebrating && (
        <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-[80px] animate-bounce">🎉</span>
        </div>
      )}

      {/* Phase label */}
      <p className="text-[11px] font-semibold tracking-widest uppercase"
        style={{ color: phase === 'break' ? 'var(--brand-secondary)' : 'rgba(255,255,255,0.5)' }}>
        {phase === 'work' ? 'Foco' : 'Pausa'}
      </p>

      {/* Circular timer */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
          <circle cx="60" cy="60" r="54" fill="none"
            stroke={phase === 'break' ? '#1ABC9C' : '#F1C40F'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (pct / 100) * circumference}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="text-[32px] font-mono font-bold text-white">{fmtTime(timeLeft)}</span>
      </div>

      {/* Task */}
      <div className="max-w-sm w-full text-center">
        <p className="text-[22px] font-semibold leading-snug text-white mb-2"
          style={{ fontFamily: 'Lexend, Inter, sans-serif' }}>
          {task.text}
        </p>
        {task.projects.length > 0 && (
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {task.projects.join(', ')}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={handleSkip}
          className="px-5 py-2.5 rounded-xl text-[13px] font-medium transition-opacity hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
          ⏭ Saltar
        </button>
        <button onClick={handleDone}
          className="px-7 py-3 rounded-xl text-[14px] font-bold transition-all hover:scale-105"
          style={{ background: 'var(--brand-secondary)', color: '#fff' }}>
          ✓ Feita
        </button>
        <button onClick={() => running ? setRunning(false) : setRunning(true)}
          className="px-5 py-2.5 rounded-xl text-[13px] font-medium transition-opacity hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
          {running ? '⏸' : '▶'}
        </button>
      </div>

      {/* Exit */}
      <button onClick={onExit}
        className="text-[12px] transition-opacity opacity-40 hover:opacity-70"
        style={{ color: 'white' }}>
        ✕ Sair do foco
      </button>
    </div>
  )
}
