export type Project = string
export type Priority = 'alta' | 'média' | 'baixa'
export type TaskType = 'tarefa' | 'ideia'
export type TaskSource = 'manual' | 'gmail'
export type View = 'focus' | 'graph' | 'note'

export interface Task {
  id: number
  text: string
  projects: Project[]
  priority: Priority
  reason: string | null
  type: TaskType
  done: boolean
  source: TaskSource
  source_email_id: string | null
  links: number[]
  created_at: string
  updated_at: string
}

export interface ClassifyResult {
  text: string
  projects: Project[]
  priority: Priority
  reason: string
  type: TaskType
}

export interface ProjectDef {
  id: string
  label: string
  color_bg: string
  color_text: string
  dot_color: string
}

export interface Note {
  date: string
  content: string
  updated_at: string | null
}
