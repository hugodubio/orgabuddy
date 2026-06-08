import { useEffect, useState } from 'react'
import { useTracksStore } from '../store/tracks'
import { useProjectsStore } from '../store/projects'
import { useTasksStore } from '../store/tasks'
import { useAuthStore } from '../store/auth'
import { supabase } from '../lib/supabase'
import type { Track, Release, TrackStatus } from '../types'

const PIPELINE: { key: TrackStatus; label: string; color: string; bg: string }[] = [
  { key: 'ideia',    label: 'Ideia',    color: '#94a3b8', bg: '#f8fafc' },
  { key: 'produção', label: 'Produção', color: '#3b82f6', bg: '#eff6ff' },
  { key: 'mix',      label: 'Mix',      color: '#f59e0b', bg: '#fffbeb' },
  { key: 'master',   label: 'Master',   color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'lançado',  label: 'Lançado',  color: '#10b981', bg: '#f0fdf4' },
]

const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm']

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

function DeadlineBadge({ date }: { date: string }) {
  const days = daysUntil(date)
  const color = days < 0 ? '#ef4444' : days <= 7 ? '#f59e0b' : '#10b981'
  const label = days < 0 ? `${Math.abs(days)}d atraso` : days === 0 ? 'hoje' : `${days}d`
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: color + '18', color }}>
      {label}
    </span>
  )
}

// ── Track Tasks ───────────────────────────────────────────────────────────────

function TrackTasks({ trackId, project }: { trackId: number; project: string }) {
  const { tasks, toggleDone, fetchTasks } = useTasksStore()
  const { userId } = useAuthStore()
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)

  const linked = tasks.filter((t) => (t as any).track_id === trackId)

  const handleAdd = async () => {
    const text = newText.trim()
    if (!text) return
    setAdding(true)
    await supabase.from('ob_tasks').insert({
      text,
      projects: project ? [project] : [],
      priority: 'média',
      type: 'tarefa',
      done: false,
      track_id: trackId,
      user_id: userId ?? 'hugo',
      tags: [],
      links: [],
    })
    await fetchTasks()
    setNewText('')
    setAdding(false)
  }

  return (
    <div>
      <p className="text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
        Tarefas ({linked.length})
      </p>
      <div className="flex flex-col gap-1.5 mb-2">
        {linked.map((t) => (
          <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <button
              onClick={() => toggleDone(t.id)}
              className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
              style={{ border: t.done ? 'none' : '1.5px solid var(--border)', background: t.done ? 'var(--brand-secondary)' : 'transparent' }}
            >
              {t.done && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M2 5l2 2L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            </button>
            <span className={`text-[13px] flex-1 ${t.done ? 'line-through' : ''}`}
              style={{ color: t.done ? 'var(--text-3)' : 'var(--text-1)' }}>
              {t.text}
            </span>
          </div>
        ))}
        {linked.length === 0 && (
          <p className="text-[12px] px-1" style={{ color: 'var(--text-3)' }}>Sem tarefas ligadas ainda.</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          placeholder="Nova tarefa para esta música…"
          className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
        />
        <button onClick={handleAdd} disabled={!newText.trim() || adding}
          className="px-3 py-2 rounded-xl text-[12px] font-semibold disabled:opacity-40"
          style={{ background: 'var(--brand-primary)', color: '#fff' }}>
          {adding ? '…' : '+'}
        </button>
      </div>
    </div>
  )
}

// ── Track Form Modal ──────────────────────────────────────────────────────────

interface TrackFormProps {
  initial?: Partial<Track>
  onSave: (fields: Partial<Track>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

function TrackForm({ initial, onSave, onDelete, onClose }: TrackFormProps) {
  const { projects } = useProjectsStore()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [artist, setArtist] = useState(initial?.artist ?? '')
  const [project, setProject] = useState(initial?.project ?? '')
  const [status, setStatus] = useState<TrackStatus>(initial?.status ?? 'ideia')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [bpm, setBpm] = useState(initial?.bpm ? String(initial.bpm) : '')
  const [key, setKey] = useState(initial?.key ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      title: title.trim(),
      artist: artist.trim() || null,
      project: project || null,
      status,
      deadline: deadline || null,
      bpm: bpm ? parseInt(bpm) : null,
      key: key || null,
      notes: notes.trim() || null,
    })
    setSaving(false)
    onClose()
  }

  const cfg = PIPELINE.find((p) => p.key === status)!

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl flex flex-col max-h-[92vh]"
        style={{ background: 'var(--surface)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b"
          style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>
            {initial?.id ? 'Editar música' : 'Nova música'}
          </h2>
          <button onClick={onClose} className="text-[20px] leading-none" style={{ color: 'var(--text-3)' }}>×</button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">

          {/* Title */}
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da música *"
            className="w-full px-3 py-3 rounded-xl text-[15px] font-medium outline-none"
            style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-1)' }}
          />

          {/* Artist + Project */}
          <div className="flex gap-2">
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artista"
              className="flex-1 px-3 py-2.5 rounded-xl text-[14px] outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            />
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl text-[14px] outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            >
              <option value="">Sem projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Estado</p>
            <div className="flex gap-1.5 flex-wrap">
              {PIPELINE.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setStatus(p.key)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                  style={status === p.key
                    ? { background: p.color, color: '#fff' }
                    : { background: p.bg, color: p.color }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline + BPM + Key */}
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Prazo</p>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
            </div>
            <div className="w-20">
              <p className="text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>BPM</p>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="140"
                min={40} max={300}
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
            </div>
            <div className="w-24">
              <p className="text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Tom</p>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              >
                <option value="">—</option>
                {MUSICAL_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Notas</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referências, ideias, links, contexto…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-[14px] resize-none outline-none leading-relaxed"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
            />
          </div>

          {/* Tarefas ligadas — só em edição */}
          {initial?.id && <TrackTasks trackId={initial.id} project={project} />}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
          {onDelete && (
            confirmDelete ? (
              <>
                <button onClick={async () => { await onDelete(); onClose() }}
                  className="px-3 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                  style={{ background: '#ef4444' }}>
                  Confirmar
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2.5 rounded-xl text-[13px]"
                  style={{ color: 'var(--text-3)' }}>
                  Cancelar
                </button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="px-3 py-2.5 rounded-xl text-[13px]"
                style={{ color: '#ef4444' }}>
                Apagar
              </button>
            )
          )}
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[13px]"
            style={{ color: 'var(--text-2)' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-40"
            style={{ background: cfg.color, color: '#fff' }}
          >
            {saving ? '…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Release Form Modal ────────────────────────────────────────────────────────

interface ReleaseFormProps {
  initial?: Partial<Release>
  tracks: Track[]
  onSave: (fields: Partial<Release>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

function ReleaseForm({ initial, tracks, onSave, onDelete, onClose }: ReleaseFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<Release['type']>(initial?.type ?? 'single')
  const [releaseDate, setReleaseDate] = useState(initial?.release_date ?? '')
  const [trackIds, setTrackIds] = useState<number[]>(initial?.track_ids ?? [])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)

  const toggleTrack = (id: number) => {
    setTrackIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), type, release_date: releaseDate || null, track_ids: trackIds, notes: notes.trim() || null })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl flex flex-col max-h-[90vh]"
        style={{ background: 'var(--surface)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>

        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>
            {initial?.id ? 'Editar lançamento' : 'Novo lançamento'}
          </h2>
          <button onClick={onClose} className="text-[20px] leading-none" style={{ color: 'var(--text-3)' }}>×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do lançamento *"
            className="w-full px-3 py-3 rounded-xl text-[15px] font-medium outline-none"
            style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-1)' }}
          />

          <div className="flex gap-2">
            <select value={type} onChange={(e) => setType(e.target.value as Release['type'])}
              className="flex-1 px-3 py-2.5 rounded-xl text-[14px] outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
              <option value="single">Single</option>
              <option value="ep">EP</option>
              <option value="álbum">Álbum</option>
            </select>
            <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl text-[14px] outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
          </div>

          {/* Track selection */}
          <div>
            <p className="text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
              Músicas ({trackIds.length})
            </p>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {tracks.filter((t) => t.status !== 'lançado').length === 0
                ? <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>Sem músicas disponíveis</p>
                : tracks.filter((t) => t.status !== 'lançado').map((t) => {
                    const cfg = PIPELINE.find((p) => p.key === t.status)!
                    return (
                      <label key={t.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer"
                        style={{ background: trackIds.includes(t.id) ? cfg.bg : 'transparent' }}>
                        <input type="checkbox" checked={trackIds.includes(t.id)} onChange={() => toggleTrack(t.id)}
                          className="w-4 h-4 rounded" />
                        <span className="text-[13px] flex-1" style={{ color: 'var(--text-1)' }}>{t.title}</span>
                        {t.artist && <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{t.artist}</span>}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </label>
                    )
                  })}
            </div>
          </div>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas sobre o lançamento…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-[14px] resize-none outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
        </div>

        <div className="px-5 py-4 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
          {onDelete && (
            <button onClick={async () => { await onDelete(); onClose() }}
              className="px-3 py-2.5 rounded-xl text-[13px]" style={{ color: '#ef4444' }}>
              Apagar
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-[13px]" style={{ color: 'var(--text-2)' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!name.trim() || saving}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-40"
            style={{ background: 'var(--brand-primary)', color: '#fff' }}>
            {saving ? '…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Track Card ────────────────────────────────────────────────────────────────

function TrackCard({ track, onClick }: { track: Track; onClick: () => void }) {
  const { projects } = useProjectsStore()
  const cfg = PIPELINE.find((p) => p.key === track.status)!
  const proj = projects.find((p) => p.id === track.project)

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border cursor-pointer active:scale-[0.98] transition-transform"
      style={{ border: `1px solid ${cfg.color}30` }}
    >
      <div className="px-3 pt-3 pb-2.5" style={{ borderLeft: `3px solid ${cfg.color}`, borderRadius: '0 10px 10px 0', marginLeft: '-1px' }}>
        <p className="text-[14px] font-semibold leading-snug" style={{ color: 'var(--text-1)' }}>
          {track.title}
        </p>
        {track.artist && (
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>{track.artist}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {proj && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] font-medium"
              style={{ background: proj.color_bg, color: proj.color_text }}>
              {proj.label}
            </span>
          )}
          {track.bpm && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
              style={{ background: 'var(--bg)', color: 'var(--text-3)' }}>
              {track.bpm}bpm
            </span>
          )}
          {track.key && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
              style={{ background: 'var(--bg)', color: 'var(--text-3)' }}>
              {track.key}
            </span>
          )}
          {track.deadline && <DeadlineBadge date={track.deadline} />}
        </div>
      </div>
    </div>
  )
}

// ── Release Card ──────────────────────────────────────────────────────────────

function ReleaseCard({ release, tracks, onClick }: { release: Release; tracks: Track[]; onClick: () => void }) {
  const relTracks = tracks.filter((t) => release.track_ids.includes(t.id))
  const days = release.release_date ? daysUntil(release.release_date) : null
  const typeLabel = { single: 'Single', ep: 'EP', álbum: 'Álbum' }[release.type]

  const allMaster = relTracks.length > 0 && relTracks.every((t) => t.status === 'master' || t.status === 'lançado')
  const readyCount = relTracks.filter((t) => t.status === 'master' || t.status === 'lançado').length

  return (
    <div onClick={onClick}
      className="rounded-xl border cursor-pointer active:scale-[0.98] transition-transform px-4 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-[14px] font-bold leading-snug" style={{ color: 'var(--text-1)' }}>{release.name}</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{typeLabel}</p>
        </div>
        {release.release_date && (
          <div className="text-right shrink-0">
            <p className="text-[11px] font-semibold" style={{ color: days !== null && days < 0 ? '#ef4444' : days !== null && days <= 14 ? '#f59e0b' : 'var(--text-2)' }}>
              {new Date(release.release_date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
            </p>
            {days !== null && (
              <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                {days < 0 ? `${Math.abs(days)}d atraso` : days === 0 ? 'hoje' : `${days}d`}
              </p>
            )}
          </div>
        )}
      </div>

      {relTracks.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {relTracks.map((t) => {
            const cfg = PIPELINE.find((p) => p.key === t.status)!
            return (
              <span key={t.id} className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: cfg.bg, color: cfg.color }}>
                {t.title}
              </span>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: relTracks.length ? `${(readyCount / relTracks.length) * 100}%` : '0%', background: allMaster ? '#10b981' : '#8b5cf6' }} />
        </div>
        <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--text-3)' }}>
          {readyCount}/{relTracks.length} prontas
        </span>
      </div>
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────

export default function TracksView() {
  const { tracks, releases, loading, fetchTracks, fetchReleases, addTrack, updateTrack, deleteTrack, addRelease, updateRelease, deleteRelease } = useTracksStore()
  const [newTrack, setNewTrack] = useState(false)
  const [editTrack, setEditTrack] = useState<Track | null>(null)
  const [newRelease, setNewRelease] = useState(false)
  const [editRelease, setEditRelease] = useState<Release | null>(null)

  useEffect(() => {
    fetchTracks()
    fetchReleases()
  }, [fetchTracks, fetchReleases])

  const activeTracks = tracks.filter((t) => t.status !== 'lançado')
  const launchedTracks = tracks.filter((t) => t.status === 'lançado')

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[21px] md:text-[24px] font-extrabold" style={{ color: 'var(--text-1)', letterSpacing: '-0.04em' }}>
            Músicas
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>
            {activeTracks.length} em progresso · {launchedTracks.length} lançadas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setNewRelease(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5 7l1.5 1.5L9 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Lançamento
          </button>
          <button
            onClick={() => setNewTrack(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: 'var(--brand-primary)', color: '#fff' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Música
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-[13px] text-center py-16" style={{ color: 'var(--text-3)' }}>a carregar…</div>
      )}

      {!loading && tracks.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[32px] mb-3">🎵</p>
          <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Nenhuma música ainda</p>
          <p className="text-[13px] mb-5" style={{ color: 'var(--text-3)' }}>Adiciona a tua primeira música para começar</p>
          <button onClick={() => setNewTrack(true)}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: 'var(--brand-primary)', color: '#fff' }}>
            + Nova música
          </button>
        </div>
      )}

      {/* Pipeline — desktop: 5 colunas, mobile: secções verticais */}
      {!loading && activeTracks.length > 0 && (
        <>
          {/* Desktop pipeline */}
          <div className="hidden md:grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {PIPELINE.filter((p) => p.key !== 'lançado').map(({ key, label, color, bg }) => {
              const col = activeTracks.filter((t) => t.status === key)
              return (
                <div key={key}>
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>{label}</span>
                    <span className="ml-auto text-[11px]" style={{ color: 'var(--text-3)' }}>{col.length}</span>
                  </div>
                  <div className="flex flex-col gap-2 min-h-[80px] rounded-xl p-2" style={{ background: bg }}>
                    {col.map((t) => (
                      <TrackCard key={t.id} track={t} onClick={() => setEditTrack(t)} />
                    ))}
                    <button onClick={() => setNewTrack(true)}
                      className="w-full py-2 text-[11px] rounded-lg transition-colors"
                      style={{ color: color + '99' }}>
                      + Adicionar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile: lista com separadores por estado */}
          <div className="md:hidden flex flex-col gap-4 mb-6">
            {PIPELINE.filter((p) => p.key !== 'lançado').map(({ key, label, color, bg }) => {
              const col = activeTracks.filter((t) => t.status === key)
              if (col.length === 0) return null
              return (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>{label}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>({col.length})</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {col.map((t) => (
                      <TrackCard key={t.id} track={t} onClick={() => setEditTrack(t)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Releases */}
      {releases.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
              Lançamentos
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {releases.map((r) => (
              <ReleaseCard key={r.id} release={r} tracks={tracks} onClick={() => setEditRelease(r)} />
            ))}
          </div>
        </div>
      )}

      {/* Launched tracks (collapsed section) */}
      {launchedTracks.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer py-2 select-none list-none">
            <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
              Lançadas ({launchedTracks.length})
            </span>
            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 12 12" style={{ color: 'var(--text-3)' }}>
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </summary>
          <div className="flex flex-col gap-2 mt-2">
            {launchedTracks.map((t) => (
              <TrackCard key={t.id} track={t} onClick={() => setEditTrack(t)} />
            ))}
          </div>
        </details>
      )}

      {/* Modals */}
      {newTrack && (
        <TrackForm
          onSave={(fields) => addTrack(fields).then(() => {})}
          onClose={() => setNewTrack(false)}
        />
      )}
      {editTrack && (
        <TrackForm
          initial={editTrack}
          onSave={(fields) => updateTrack(editTrack.id, fields)}
          onDelete={() => deleteTrack(editTrack.id)}
          onClose={() => setEditTrack(null)}
        />
      )}
      {newRelease && (
        <ReleaseForm
          tracks={tracks}
          onSave={(fields) => addRelease(fields).then(() => {})}
          onClose={() => setNewRelease(false)}
        />
      )}
      {editRelease && (
        <ReleaseForm
          initial={editRelease}
          tracks={tracks}
          onSave={(fields) => updateRelease(editRelease.id, fields)}
          onDelete={() => deleteRelease(editRelease.id)}
          onClose={() => setEditRelease(null)}
        />
      )}
    </div>
  )
}
