import { useEffect } from 'react'
import type { Task } from '../types'

const ICON = 'https://hugodubio.github.io/orgabuddy/favicon.ico'

function notify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification(title, { body, icon: ICON })
}

function todayKey(suffix: string) {
  const d = new Date().toISOString().split('T')[0]
  return `ob_reminder_${d}_${suffix}`
}

function alreadySent(key: string) {
  return !!localStorage.getItem(key)
}

function markSent(key: string) {
  localStorage.setItem(key, '1')
}

export function useReminders(tasks: Task[], userId: string | null) {
  useEffect(() => {
    if (!userId || !tasks.length) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const now = new Date()
    const hour = now.getHours()
    const today = now.toISOString().split('T')[0]

    const myTasks = tasks.filter((t) => !t.done && (t.user_id === userId || (!t.user_id && userId === 'hugo')))
    const todayTasks = myTasks.filter((t) => t.due_date === today)
    const doneTodayCount = tasks.filter((t) => t.done && t.user_id === userId && t.updated_at?.startsWith(today)).length

    // 9h — manhã: resumo do dia
    if (hour >= 9 && !alreadySent(todayKey('morning'))) {
      markSent(todayKey('morning'))
      const urgentes = myTasks.filter((t) => t.priority === 'alta' || t.due_date === today)
      if (urgentes.length > 0) {
        notify('OrgaBuddy — Bom dia 👋', `Tens ${urgentes.length} tarefa${urgentes.length > 1 ? 's' : ''} para hoje. Mais urgente: "${urgentes[0].text}"`)
      }
    }

    // 10h — due_date hoje
    if (hour >= 10 && !alreadySent(todayKey('duedate'))) {
      markSent(todayKey('duedate'))
      if (todayTasks.length > 0) {
        notify('OrgaBuddy — Para hoje', `"${todayTasks[0].text}"${todayTasks.length > 1 ? ` e mais ${todayTasks.length - 1}` : ''}`)
      }
    }

    // 17h — fim do dia sem nada feito
    if (hour >= 17 && !alreadySent(todayKey('evening'))) {
      markSent(todayKey('evening'))
      if (doneTodayCount === 0 && myTasks.length > 0) {
        notify('OrgaBuddy — Hey 👀', 'Ainda não concluíste nada hoje. Queres entrar em modo Foco?')
      }
    }
  }, [tasks, userId])
}
