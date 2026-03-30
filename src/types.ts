export type Project = string
export type Priority = 'alta' | 'média' | 'baixa'
export type TaskType = 'tarefa' | 'ideia'
export type TaskSource = 'manual' | 'gmail' | 'mystic_event' | 'mystic_task' | 'calendar'
export type View = 'focus' | 'graph' | 'note' | 'calendar' | 'notes' | 'search' | 'admin' | 'time'

export interface TimeEntry {
  id: number
  user_id: string
  project_id: string | null
  description: string | null
  started_at: string
  ended_at: string
  duration_minutes: number
  created_at: string
}

export interface Task {
  id: number
  user_id: string
  text: string
  projects: Project[]
  priority: Priority
  reason: string | null
  type: TaskType
  done: boolean
  source: TaskSource
  source_email_id: string | null
  source_id: string | null
  links: number[]
  external_links: string[]
  tags: string[]
  note: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface ClassifyResult {
  text: string
  projects: Project[]
  priority: Priority
  reason: string
  type: TaskType
  tags: string[]
}

export interface Habit {
  id: number
  text: string
  frequency: 'daily' | 'weekly'
  days_of_week: number[]
  color: string
  created_at: string
}

export interface HabitLog {
  id: number
  habit_id: number
  date: string
  done: boolean
}

export interface ObNote {
  id: number
  title: string
  content: string
  projects: string[]
  created_at: string
  updated_at: string
}

export interface DayLog {
  id: number
  date: string
  note_content: string
  tasks_done: { id: number; text: string; projects: string[] }[]
  tasks_created: { id: number; text: string; projects: string[] }[]
  projects: string[]
  created_at: string
}

export interface ProjectDef {
  id: string
  label: string
  color_bg: string
  color_text: string
  dot_color: string
  parent_id: string | null
  note: string | null
  keywords: string[]
}

export interface Note {
  date: string
  content: string
  updated_at: string | null
}
