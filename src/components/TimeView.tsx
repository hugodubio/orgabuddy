import { useState, useEffect } from 'react'
import { useTimeStore } from '../store/time'
import { useProjectsStore } from '../store/projects'
import type { TimeEntry } from '../types'

function fmt(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
}

function useElapsed(start: Date | null) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!start) { setElapsed(0); return }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [start])
  return elapsed
}

function fmtElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function ProjectSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { projects } = useProjectsStore()
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-3 py-2 rounded-xl text-[13px] outline-none flex-1"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
      <option value="">Sem projeto</option>
      {projects.map(p => (
        <option key={p.id} value={p.id}>{p.label}</option>
      ))}
    </select>
  )
}

function EntryRow({ entry, onDelete }: { entry: TimeEntry; onDelete: (id: number) => void }) {
  const { projects } = useProjectsStore()
  const proj = projects.find(p => p.id === entry.project_id)
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl group"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {proj && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-[3px] font-medium shrink-0"
              style={{ background: proj.color_bg, color: proj.color_text }}>
              {proj.label}
            </span>
          )}
          {entry.description && (
            <span className="text-[13px] truncate" style={{ color: 'var(--text-1)' }}>{entry.description}</span>
          )}
          {!entry.description && !proj && (
            <span className="text-[13px]" style={{ color: 'var(--text-3)' }}>sem descrição</span>
          )}
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
          {fmtTime(entry.started_at)} → {fmtTime(entry.ended_at)}
        </div>
      </div>
      <span className="text-[13px] font-mono font-semibold shrink-0" style={{ color: 'var(--amber)' }}>
        {fmt(entry.duration_minutes)}
      </span>
      <button onClick={() => onDelete(entry.id)}
        className="opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity text-[12px]"
        style={{ color: 'var(--text-2)' }}>✕</button>
    </div>
  )
}

function SummaryView() {
  const { entries, fetchEntries, loading } = useTimeStore()
  const { projects } = useProjectsStore()
  const [period, setPeriod] = useState<'week' | 'month'>('week')

  useEffect(() => {
    const now = new Date()
    let from: string
    if (period === 'week') {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      from = d.toISOString().split('T')[0]
    } else {
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    }
    fetchEntries(from)
  }, [period, fetchEntries])

  const total = entries.reduce((s, e) => s + e.duration_minutes, 0)

  const byProject: Record<string, number> = {}
  for (const e of entries) {
    const key = e.project_id ?? '__none__'
    byProject[key] = (byProject[key] ?? 0) + e.duration_minutes
  }

  const rows = Object.entries(byProject).sort((a, b) => b[1] - a[1])

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['week', 'month'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{
              background: period === p ? 'var(--amber)' : 'var(--surface)',
              color: period === p ? '#fff' : 'var(--text-2)',
              border: '1px solid var(--border)',
            }}>
            {p === 'week' ? 'Esta semana' : 'Este mês'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-3)' }}>a carregar…</p>
      ) : (
        <>
          <div className="text-[32px] font-bold mb-6" style={{ color: 'var(--text-1)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em' }}>
            {fmt(total)}
            <span className="text-[14px] font-normal ml-2" style={{ color: 'var(--text-3)' }}>total</span>
          </div>

          <div className="flex flex-col gap-2">
            {rows.map(([key, mins]) => {
              const proj = projects.find(p => p.id === key)
              const pct = total > 0 ? Math.round((mins / total) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px]" style={{ color: 'var(--text-1)' }}>
                      {proj ? proj.label : 'Sem projeto'}
                    </span>
                    <span className="text-[13px] font-mono" style={{ color: 'var(--text-2)' }}>{fmt(mins)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: proj ? proj.dot_color : 'var(--amber)' }} />
                  </div>
                </div>
              )
            })}
            {rows.length === 0 && (
              <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-3)' }}>
                Nenhuma sessão registada
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

type PendingEntry = { startedAt: Date; endedAt: Date; project: string; description: string }

export default function TimeView() {
  const { entries, loading, timerStart, timerProject, timerDescription, startTimer, clearTimer, fetchEntries, addManual, deleteEntry } = useTimeStore()
  const [tab, setTab] = useState<'hoje' | 'resumo'>('hoje')
  const [selProject, setSelProject] = useState('')
  const [selDesc, setSelDesc] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0])
  const [manualStart, setManualStart] = useState('')
  const [manualEnd, setManualEnd] = useState('')
  const [manualProject, setManualProject] = useState('')
  const [manualDesc, setManualDesc] = useState('')
  const [pendingEntry, setPendingEntry] = useState<PendingEntry | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const elapsed = useElapsed(timerStart)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchEntries(today, today + 'T23:59:59')
  }, [fetchEntries, today])

  const todayEntries = entries.filter(e => e.started_at.startsWith(today))
  const todayTotal = todayEntries.reduce((s, e) => s + e.duration_minutes, 0)

  const handleStartStop = () => {
    if (timerStart) {
      const captured = clearTimer()
      if (captured) {
        setPendingEntry({
          startedAt: captured.start,
          endedAt: new Date(),
          project: captured.project ?? '',
          description: captured.description,
        })
      }
    } else {
      startTimer(selProject || null, selDesc)
    }
  }

  const handleConfirmPending = async () => {
    if (!pendingEntry) return
    await addManual(
      pendingEntry.startedAt.toISOString(),
      pendingEntry.endedAt.toISOString(),
      pendingEntry.project || null,
      pendingEntry.description,
    )
    setPendingEntry(null)
    fetchEntries(today, today + 'T23:59:59')
  }

  const handleDiscardPending = () => setPendingEntry(null)

  const handleManual = async () => {
    if (!manualStart || !manualEnd) return
    const startedAt = `${manualDate}T${manualStart}:00`
    const endedAt = `${manualDate}T${manualEnd}:00`
    await addManual(startedAt, endedAt, manualProject || null, manualDesc)
    setManualStart(''); setManualEnd(''); setManualDesc(''); setManualProject('')
    setManualDate(new Date().toISOString().split('T')[0])
    setShowManual(false)
    if (manualDate !== today) {
      const d = new Date(manualDate + 'T00:00:00')
      const label = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
      setSavedMsg(`Bloco guardado para ${label}`)
      setTimeout(() => setSavedMsg(null), 3000)
    }
    fetchEntries(today, today + 'T23:59:59')
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl inline-flex" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {(['hoje', 'resumo'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors capitalize"
            style={{
              background: tab === t ? 'var(--amber)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--text-2)',
            }}>
            {t === 'hoje' ? 'Hoje' : 'Resumo'}
          </button>
        ))}
      </div>

      {tab === 'hoje' && (
        <>
          {/* Timer */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {pendingEntry ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--amber)' }}>Sessão concluída</span>
                  <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>
                    {fmtTime(pendingEntry.startedAt.toISOString())} → {fmtTime(pendingEntry.endedAt.toISOString())}
                    {' · '}
                    {fmt(Math.max(1, Math.round((pendingEntry.endedAt.getTime() - pendingEntry.startedAt.getTime()) / 60000)))}
                  </span>
                </div>
                <div className="flex gap-2">
                  <ProjectSelect value={pendingEntry.project} onChange={v => setPendingEntry(p => p && ({ ...p, project: v }))} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Descrição (opcional)"
                    value={pendingEntry.description}
                    onChange={e => setPendingEntry(p => p && ({ ...p, description: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleConfirmPending() }}
                    className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleConfirmPending}
                    className="px-4 py-2 rounded-xl text-[13px] font-semibold"
                    style={{ background: 'var(--amber)', color: '#fff' }}>
                    Guardar
                  </button>
                  <button onClick={handleDiscardPending}
                    className="px-4 py-2 rounded-xl text-[13px]"
                    style={{ background: 'var(--border)', color: 'var(--text-2)' }}>
                    Descartar
                  </button>
                </div>
              </div>
            ) : timerStart ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[36px] font-mono font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                    {fmtElapsed(elapsed)}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {timerProject || 'sem projeto'}{timerDescription ? ` · ${timerDescription}` : ''}
                  </div>
                </div>
                <button onClick={handleStartStop}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: '#e05a2b', color: '#fff' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 14 14">
                    <rect x="3" y="3" width="3" height="8" rx="0.5"/>
                    <rect x="8" y="3" width="3" height="8" rx="0.5"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <ProjectSelect value={selProject} onChange={setSelProject} />
                  <input type="text" placeholder="Descrição (opcional)" value={selDesc} onChange={e => setSelDesc(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleStartStop}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
                    style={{ background: 'var(--amber)', color: '#fff' }}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 14 14">
                      <path d="M3 2l9 5-9 5V2z"/>
                    </svg>
                    Iniciar timer
                  </button>
                  <button onClick={() => setShowManual(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                    + Bloco manual
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Today total */}
          {todayTotal > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>Hoje</span>
              <span className="text-[13px] font-semibold font-mono" style={{ color: 'var(--text-2)' }}>{fmt(todayTotal)}</span>
            </div>
          )}

          {/* Today entries */}
          {loading ? (
            <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-3)' }}>a carregar…</p>
          ) : (
            <div className="flex flex-col gap-2">
              {todayEntries.map(e => (
                <EntryRow key={e.id} entry={e} onDelete={(id) => {
                  deleteEntry(id)
                }} />
              ))}
              {todayEntries.length === 0 && !timerStart && (
                <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-3)' }}>Nenhuma sessão hoje</p>
              )}
            </div>
          )}

          {/* Manual entry */}
          <div className="mt-4">
            {savedMsg && (
              <p className="text-[12px] mb-2 px-3 py-2 rounded-lg" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                ✓ {savedMsg}
              </p>
            )}
            {showManual && (
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex gap-2">
                  <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)}
                    className="px-3 py-2 rounded-xl text-[13px] outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
                  <input type="time" value={manualStart} onChange={e => setManualStart(e.target.value)}
                    placeholder="Início"
                    className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
                  <input type="time" value={manualEnd} onChange={e => setManualEnd(e.target.value)}
                    placeholder="Fim"
                    className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
                </div>
                <div className="flex gap-2">
                  <ProjectSelect value={manualProject} onChange={setManualProject} />
                  <input type="text" placeholder="Descrição" value={manualDesc} onChange={e => setManualDesc(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleManual}
                    className="px-4 py-2 rounded-xl text-[13px] font-semibold"
                    style={{ background: 'var(--amber)', color: '#fff' }}>
                    Guardar
                  </button>
                  <button onClick={() => setShowManual(false)}
                    className="px-4 py-2 rounded-xl text-[13px]"
                    style={{ background: 'var(--border)', color: 'var(--text-2)' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}



      {tab === 'resumo' && <SummaryView />}
    </div>
  )
}
