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
  attachments: Attachment[]
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
  due_date?: string | null
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

export interface Attachment {
  name: string
  url: string
  size: number
  mime: string
}

export interface ObNote {
  id: number
  title: string
  content: string
  projects: string[]
  attachments: Attachment[]
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

export type RecurrenceRule = 'weekly' | 'monthly' | 'first-week-monthly'

export interface CalendarEvent {
  id: number
  user_id: string
  title: string
  start_date: string  // YYYY-MM-DD
  end_date: string    // YYYY-MM-DD
  project_id: string | null
  notes: string | null
  location: string | null
  recurrence_rule: RecurrenceRule | null
  recurrence_end: string | null
  parent_event_id: number | null
  task_id: number | null
  gcal_event_id: string | null
  gcal_calendar_id: string | null
  gcal_account: string | null
  created_at: string
}
