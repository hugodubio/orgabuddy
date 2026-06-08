import { useEffect } from 'react'
import type { Task } from '../types'

const ICON = 'https://hugodubio.github.io/orgabuddy/favicon.ico'

function notify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try { new Notification(title, { body, icon: ICON }) } catch {}
}

function todayKey(suffix: string) {
  const d = new Date().toISOString().split('T')[0]
  return `ob_reminder_${d}_${suffix}`
}

function alreadySent(key: string) { return !!localStorage.getItem(key) }
function markSent(key: string) { localStorage.setItem(key, '1') }

// Load user-configured reminder hours (default: 9 e 17)
export function getReminderHours(): { morning: number; evening: number } {
  try {
    const s = localStorage.getItem('ob_reminder_hours')
    if (s) return JSON.parse(s)
  } catch {}
  return { morning: 9, evening: 17 }
}

export function setReminderHours(morning: number, evening: number) {
  localStorage.setItem('ob_reminder_hours', JSON.stringify({ morning, evening }))
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function useReminders(tasks: Task[], userId: string | null) {
  useEffect(() => {
    if (!userId || !tasks.length) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const { morning, evening } = getReminderHours()
    const now = new Date()
    const hour = now.getHours()
    const today = now.toISOString().split('T')[0]

    const myTasks = tasks.filter((t) => !t.done && (t.user_id === userId || (!t.user_id && userId === 'hugo')))
    const todayTasks = myTasks.filter((t) => t.due_date === today)
    const urgentes = myTasks.filter((t) => t.priority === 'alta' || t.due_date === today)

    // Manhã
    if (hour >= morning && !alreadySent(todayKey('morning'))) {
      markSent(todayKey('morning'))
      if (urgentes.length > 0) {
        notify('OrgaBuddy — Bom dia 👋',
          `${urgentes.length} tarefa${urgentes.length > 1 ? 's' : ''} para hoje. Mais urgente: "${urgentes[0].text}"`)
      }
    }

    // Due date hoje (1h depois da manhã)
    if (hour >= morning + 1 && !alreadySent(todayKey('duedate'))) {
      markSent(todayKey('duedate'))
      if (todayTasks.length > 0) {
        notify('OrgaBuddy — Para hoje',
          `"${todayTasks[0].text}"${todayTasks.length > 1 ? ` e mais ${todayTasks.length - 1}` : ''}`)
      }
    }

    // Tarde
    if (hour >= evening && hour < evening + 1 && !alreadySent(todayKey('evening'))) {
      markSent(todayKey('evening'))
      if (myTasks.length > 0) {
        notify('OrgaBuddy', `${myTasks.length} tarefa${myTasks.length > 1 ? 's' : ''} por tratar. 2 minutos para rever?`)
      }
    }
  }, [tasks, userId])
}
