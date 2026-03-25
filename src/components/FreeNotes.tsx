import { useEffect, useState, useRef, useCallback } from 'react'
import { useNotesStore } from '../store/notes'
import { useProjectsStore } from '../store/projects'
import type { ProjectDef } from '../types'

function detectProjects(text: string, allProjects: ProjectDef[]): string[] {
  const lower = text.toLowerCase()
  return allProjects
    .filter((p) => lower.includes(`@${p.id}`) || lower.includes(p.label.toLowerCase()))
    .map((p) => p.id)
}

export default function FreeNotes() {
  const { notes, selectedId, fetchNotes, createNote, updateNote, deleteNote, selectNote } = useNotesStore()
  const { projects } = useProjectsStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const selected = notes.find((n) => n.id === selectedId)

  useEffect(() => {
    if (selected) {
      setTitle(selected.title)
      setContent(selected.content)
      setLastSaved(null)
    }
  }, [selectedId, selected?.id])

  const save = useCallback(async (t: string, c: string) => {
    if (!selectedId) return
    setSaving(true)
    const detected = detectProjects(t + ' ' + c, projects)
    await updateNote(selectedId, t || 'Sem título', c, detected)
    setSaving(false)
    setLastSaved(new Date())
  }, [selectedId, updateNote, projects])

  const onChangeTitle = (t: string) => {
    setTitle(t)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(t, content), 1000)
  }

  const onChangeContent = (c: string) => {
    setContent(c)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(title, c), 1000)
  }

  const handleCreate = async () => {
    await createNote()
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })

  const getProject = (id: string) => projects.find((p) => p.id === id)

  const selectedProjects = selected?.projects ?? []

  return (
    <div className="flex flex-1 min-h-0 gap-0">
      {/* Lista */}
      <div className="w-[200px] shrink-0 border-r border-[#ebebea] flex flex-col">
        <div className="flex items-center justify-between px-3 py-3 border-b border-[#ebebea]">
          <span className="text-[12px] font-semibold text-[#1a1a1a]">Notas</span>
          <button
            onClick={handleCreate}
            className="text-[#bbb] hover:text-[#666] transition-colors"
            title="Nova nota"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 12 12">
              <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {notes.length === 0 && (
            <p className="px-3 py-4 text-[12px] text-[#bbb] text-center">Sem notas.<br/>Clica + para criar.</p>
          )}
          {notes.map((note) => (
            <div
              key={note.id}
              className={`group flex items-start justify-between px-3 py-2 cursor-pointer transition-colors ${
                note.id === selectedId ? 'bg-white' : 'hover:bg-white/60'
              }`}
              onClick={() => selectNote(note.id)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[#1a1a1a] truncate">{note.title || 'Sem título'}</p>
                <p className="text-[11px] text-[#bbb]">{formatDate(note.updated_at)}</p>
                {(note.projects ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(note.projects ?? []).map((pid) => {
                      const p = getProject(pid)
                      return p ? (
                        <span key={pid} className="text-[9px] px-1 py-0.5 rounded-[3px] font-medium"
                          style={{ background: p.color_bg, color: p.color_text }}>
                          {p.label}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
                className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 ml-1 shrink-0"
              >×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0 px-8 py-6">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[13px] text-[#bbb] mb-3">Selecciona uma nota ou cria uma nova</p>
              <button
                onClick={handleCreate}
                className="px-4 py-2 text-[13px] bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333] transition-colors"
              >
                Nova nota
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <input
                value={title}
                onChange={(e) => onChangeTitle(e.target.value)}
                placeholder="Título"
                className="flex-1 text-[22px] font-semibold text-[#1a1a1a] outline-none bg-transparent placeholder:text-[#ddd]"
              />
              <span className="text-[11px] text-[#bbb] ml-4 shrink-0">
                {saving ? 'a guardar…' : lastSaved
                  ? `guardado ${lastSaved.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
                  : ''}
              </span>
            </div>

            {/* Project chips */}
            {selectedProjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedProjects.map((pid) => {
                  const p = getProject(pid)
                  return p ? (
                    <span key={pid} className="text-[11px] px-1.5 py-0.5 rounded-[3px] font-medium"
                      style={{ background: p.color_bg, color: p.color_text }}>
                      {p.label}
                    </span>
                  ) : null
                })}
              </div>
            )}

            <textarea
              value={content}
              onChange={(e) => onChangeContent(e.target.value)}
              placeholder={`Escreve aqui…\n\nPodes usar markdown, adicionar links, contexto.\nUsa @projeto ou o nome do projeto para associar.`}
              className="flex-1 resize-none outline-none text-[13.5px] text-[#1a1a1a] leading-relaxed placeholder:text-[#ccc] bg-transparent font-sans"
              style={{ minHeight: 400 }}
              spellCheck
            />
          </>
        )}
      </div>
    </div>
  )
}
