import { useEffect, useState, useRef, useCallback } from 'react'
import { useNotesStore } from '../store/notes'
import { useProjectsStore } from '../store/projects'
import type { ProjectDef } from '../types'
import Attachments from './Attachments'

function detectProjects(text: string, allProjects: ProjectDef[]): string[] {
  const lower = text.toLowerCase()
  return allProjects
    .filter((p) => lower.includes(`@${p.id}`) || lower.includes(p.label.toLowerCase()))
    .map((p) => p.id)
}

export default function FreeNotes() {
  const { notes, selectedId, fetchNotes, createNote, updateNote, deleteNote, selectNote, updateNoteAttachments } = useNotesStore()
  const { projects } = useProjectsStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [mobileShowEditor, setMobileShowEditor] = useState(false)
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

  const openNote = (id: number) => {
    selectNote(id)
    setMobileShowEditor(true)
  }

  const handleCreateAndOpen = async () => {
    await createNote()
    setMobileShowEditor(true)
  }

  const NoteList = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#ebebea]">
        <span className="text-[12px] font-semibold text-[#1a1a1a]">Notas</span>
        <button
          onClick={handleCreateAndOpen}
          className="text-[#bbb] hover:text-[#666] transition-colors p-1"
          title="Nova nota"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 12 12">
            <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {notes.length === 0 && (
          <p className="px-3 py-8 text-[13px] text-[#bbb] text-center">Sem notas.<br/>Toca + para criar.</p>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className={`group flex items-start justify-between px-3 py-3 cursor-pointer transition-colors border-b border-[#f5f5f5] ${
              note.id === selectedId ? 'bg-white' : 'hover:bg-white/60'
            }`}
            onClick={() => openNote(note.id)}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-[#1a1a1a] truncate">{note.title || 'Sem título'}</p>
              <p className="text-[12px] text-[#bbb] mt-0.5">{formatDate(note.updated_at)}</p>
              {(note.projects ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(note.projects ?? []).map((pid) => {
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
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
              className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 ml-2 shrink-0 text-lg leading-none p-1"
            >×</button>
          </div>
        ))}
      </div>
    </div>
  )

  const NoteEditor = ({ showBack }: { showBack?: boolean }) => (
    <div className="flex flex-col h-full">
      {showBack && (
        <div className="flex items-center gap-2 px-3 py-3 border-b border-[#ebebea]">
          <button
            onClick={() => setMobileShowEditor(false)}
            className="flex items-center gap-1.5 text-[13px] text-[#666]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 14 14">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Notas
          </button>
          <span className="text-[11px] text-[#bbb] ml-auto">
            {saving ? 'a guardar…' : lastSaved
              ? `guardado ${lastSaved.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center pt-20">
            <div className="text-center">
              <p className="text-[13px] text-[#bbb] mb-3">Selecciona uma nota ou cria uma nova</p>
              <button
                onClick={handleCreateAndOpen}
                className="px-4 py-2 text-[13px] bg-[#1a1a1a] text-white rounded-lg"
              >
                Nova nota
              </button>
            </div>
          </div>
        ) : (
          <>
            {!showBack && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#bbb]">
                  {saving ? 'a guardar…' : lastSaved
                    ? `guardado ${lastSaved.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
                    : ''}
                </span>
              </div>
            )}
            <input
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="Título"
              className="w-full text-[22px] font-semibold text-[#1a1a1a] outline-none bg-transparent placeholder:text-[#ddd] mb-2"
            />

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
              placeholder={`Escreve aqui…\n\nUsa @projeto para associar.`}
              className="w-full resize-none outline-none text-[15px] text-[#1a1a1a] leading-relaxed placeholder:text-[#ccc] bg-transparent font-sans"
              style={{ minHeight: 300 }}
              spellCheck
            />

            {selected && (
              <div className="mt-4 pt-4 border-t border-[#ebebea]">
                <Attachments
                  attachments={selected.attachments ?? []}
                  onUpdate={(a) => updateNoteAttachments(selected.id, a)}
                  context={`note-${selected.id}`}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">
      {/* Mobile: lista ou editor alternado */}
      <div className="md:hidden flex-1 overflow-hidden">
        {mobileShowEditor ? <NoteEditor showBack /> : <NoteList />}
      </div>

      {/* Desktop: dois painéis lado a lado */}
      <div className="hidden md:flex flex-1 min-h-0">
        <div className="w-[220px] shrink-0 border-r border-[#ebebea] overflow-y-auto">
          <NoteList />
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <NoteEditor />
        </div>
      </div>
    </div>
  )
}
