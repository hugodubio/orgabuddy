import { supabase } from './supabase'

const QUEUE_KEY = 'ob_offline_queue'
const CACHE_KEY = 'ob_tasks_cache'

export interface QueueItem {
  id: string
  table: string
  op: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
  match?: Record<string, unknown>
  ts: number
}

export function isOnline() {
  return navigator.onLine
}

export function enqueue(item: Omit<QueueItem, 'id' | 'ts'>) {
  const queue = getQueue()
  queue.push({ ...item, id: crypto.randomUUID(), ts: Date.now() })
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)) } catch {}
}

export function getQueue(): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') } catch { return [] }
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

export function cacheTasksLocally(tasks: unknown[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(tasks)) } catch {}
}

export function getCachedTasks(): unknown[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]') } catch { return [] }
}

export async function flushQueue(): Promise<number> {
  const queue = getQueue()
  if (queue.length === 0) return 0

  let flushed = 0
  const remaining: QueueItem[] = []

  for (const item of queue) {
    try {
      if (item.op === 'update' && item.match) {
        let q = supabase.from(item.table).update(item.payload)
        for (const [k, v] of Object.entries(item.match)) q = (q as any).eq(k, v)
        const { error } = await q
        if (!error) { flushed++; continue }
      } else if (item.op === 'insert') {
        const { error } = await supabase.from(item.table).insert(item.payload)
        if (!error) { flushed++; continue }
      } else if (item.op === 'delete' && item.match) {
        let q = supabase.from(item.table).delete()
        for (const [k, v] of Object.entries(item.match)) q = (q as any).eq(k, v)
        const { error } = await q
        if (!error) { flushed++; continue }
      }
      remaining.push(item)
    } catch {
      remaining.push(item)
    }
  }

  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining)) } catch {}
  return flushed
}
