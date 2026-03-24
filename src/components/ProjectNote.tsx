import { useState, useEffect, useRef, useCallback } from 'react'
import { useProjectsStore } from '../store/projects'

interface Props {
  projectId: string
}

export default function ProjectNote({ projectId }: Props) {
  const { projects, updateProjectNote } = useProjectsStore()
  const project = projects.find((p) => p.id === projectId)
  const [content, setContent] = useState(project?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [open, setOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setContent(project?.note ?? '')
  }, [projectId, project?.note])

  const save = useCallback(async (text: string) => {
    setSaving(true)
    await updateProjectNote(projectId, text)
    setSaving(false)
    setLastSaved(new Date())
  }, [projectId, updateProjectNote])

  const onChange = (text: string) => {
    setContent(text)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(text), 1000)
  }

  return (
    <div className="mt-8 border-t border-[#ebebea] pt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <svg
          className={`w-2.5 h-2.5 text-[#ccc] transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 10 10"
        >
          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[11px] uppercase tracking-widest text-[#aaa] font-medium group-hover:text-[#666] transition-colors">
          Nota do projeto
        </span>
        {!open && content && (
          <span className="ml-auto text-[11px] text-[#ccc] truncate max-w-[160px]">{content.split('\n')[0]}</span>
        )}
        {open && (
          <span className="ml-auto text-[11px] text-[#bbb]">
            {saving ? 'a guardar…' : lastSaved
              ? `guardado ${lastSaved.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </span>
        )}
      </button>

      {open && (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Notas, links, contexto do projeto…\n\nPodes usar markdown básico.`}
          className="w-full resize-none outline-none text-[13.5px] text-[#1a1a1a] leading-relaxed placeholder:text-[#ccc] bg-transparent font-sans"
          style={{ minHeight: 160 }}
          spellCheck
          autoFocus
        />
      )}
    </div>
  )
}
