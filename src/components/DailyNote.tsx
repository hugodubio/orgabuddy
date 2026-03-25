import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useTasksStore } from '../store/tasks'
import { useDayLogsStore } from '../store/daylogs'
import { useProjectsStore } from '../store/projects'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function DailyNote() {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [closing, setClosing] = useState(false)
  const [closedMsg, setClosedMsg] = useState(false)
  const [tab, setTab] = useState<'today' | 'archive'>('today')
  const [expandedLog, setExpandedLog] = useState<number | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const date = todayISO()

  const { tasks } = useTasksStore()
  const { daylogs, fetchDayLogs, createDayLog } = useDayLogsStore()
  const { projects } = useProjectsStore()

  useEffect(() => {
    supabase.from('notes').select('content').eq('date', date).single()
      .then(({ data }) => setContent(data?.content ?? ''))
  }, [date])

  useEffect(() => {
    fetchDayLogs()
  }, [fetchDayLogs])

  const save = useCallback(async (text: string) => {
    setSaving(true)
    await supabase.from('notes').upsert({ date, content: text, updated_at: new Date().toISOString() })
    setSaving(false)
    setLastSaved(new Date())
  }, [date])

  const onChange = (text: string) => {
    setContent(text)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(text), 1000)
  }

  const handleCloseDay = async () => {
    setClosing(true)
    try {
      const todayStart = new Date(date + 'T00:00:00').toISOString()
      const tasksDone = tasks
        .filter((t) => t.done && t.updated_at >= todayStart)
        .map((t) => ({ id: t.id, text: t.text, projects: t.projects }))
      const tasksCreated = tasks
        .filter((t) => t.created_at >= todayStart)
        .map((t) => ({ id: t.id, text: t.text, projects: t.projects }))
      await createDayLog(date, content, tasksDone, tasksCreated)
      setClosedMsg(true)
      setTimeout(() => setClosedMsg(false), 3000)
    } finally {
      setClosing(false)
    }
  }

  const formatted = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const getProject = (id: string) => projects.find((p) => p.id === id)

  const formatLogDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold text-[#1a1a1a] capitalize">{formatted}</h1>
          <div className="flex gap-1">
            <button
              onClick={() => setTab('today')}
              className={`text-[12px] px-2.5 py-1 rounded-md transition-colors ${tab === 'today' ? 'bg-[#1a1a1a] text-white' : 'text-[#aaa] hover:text-[#666]'}`}
            >Hoje</button>
            <button
              onClick={() => { setTab('archive') }}
              className={`text-[12px] px-2.5 py-1 rounded-md transition-colors ${tab === 'archive' ? 'bg-[#1a1a1a] text-white' : 'text-[#aaa] hover:text-[#666]'}`}
            >Arquivo</button>
          </div>
        </div>
        {tab === 'today' && (
          <div className="flex items-center gap-3">
            {closedMsg && <span className="text-[11px] text-green-600">✓ Dia fechado</span>}
            {!closedMsg && (
              <span className="text-[11px] text-[#bbb]">
                {saving ? 'a guardar…' : lastSaved
                  ? `guardado ${lastSaved.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
                  : ''}
              </span>
            )}
            <button
              onClick={handleCloseDay}
              disabled={closing}
              className="text-[12px] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}
            >
              {closing ? '…' : 'Fechar dia'}
            </button>
          </div>
        )}
      </div>

      {tab === 'today' ? (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Nota livre do dia…\n\nPodes usar markdown básico.\nEscreve [[tarefa]] para referenciar tarefas.`}
          className="flex-1 w-full resize-none outline-none text-[13.5px] text-[#1a1a1a] leading-relaxed placeholder:text-[#ccc] bg-transparent font-sans"
          style={{ minHeight: 400 }}
          spellCheck
        />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {daylogs.filter((d) => d.date !== date).length === 0 && (
            <p className="text-[13px] text-[#bbb] text-center py-12">Sem dias fechados ainda.<br/>Usa o botão "Fechar dia" para criar um registo.</p>
          )}
          {daylogs.filter((d) => d.date !== date).map((log) => (
            <div key={log.id} className="rounded-xl border border-[#ebebea] overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#faf9f7] transition-colors"
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <span className="text-[13px] font-medium text-[#1a1a1a] capitalize">{formatLogDate(log.date)}</span>
                <span className="text-[11px] text-[#aaa]">
                  {log.tasks_done.length > 0 && `${log.tasks_done.length} feitas`}
                  {log.tasks_done.length > 0 && log.tasks_created.length > 0 && ' · '}
                  {log.tasks_created.length > 0 && `${log.tasks_created.length} criadas`}
                </span>
                {log.projects.length > 0 && (
                  <div className="flex gap-1 ml-auto">
                    {log.projects.slice(0, 4).map((pid) => {
                      const p = getProject(pid)
                      return p ? (
                        <span key={pid} className="text-[10px] px-1.5 py-0.5 rounded-[3px] font-medium"
                          style={{ background: p.color_bg, color: p.color_text }}>
                          {p.label}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                <svg className={`w-3 h-3 ml-2 transition-transform ${expandedLog === log.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 10 10">
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {expandedLog === log.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-[#ebebea]">
                  {log.note_content && (
                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest text-[#aaa] mb-1">Nota</p>
                      <p className="text-[13px] text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">{log.note_content}</p>
                    </div>
                  )}
                  {log.tasks_done.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#aaa] mb-1">Concluídas</p>
                      <div className="space-y-1">
                        {log.tasks_done.map((t) => (
                          <p key={t.id} className="text-[12px] text-[#5c5248] flex items-center gap-1.5">
                            <span className="text-green-500">✓</span> {t.text}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {log.tasks_created.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#aaa] mb-1">Criadas</p>
                      <div className="space-y-1">
                        {log.tasks_created.map((t) => (
                          <p key={t.id} className="text-[12px] text-[#5c5248] flex items-center gap-1.5">
                            <span className="text-[#aaa]">+</span> {t.text}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
