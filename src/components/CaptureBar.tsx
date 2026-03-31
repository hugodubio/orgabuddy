import { useState, useRef, useEffect } from 'react'
import { useClassify } from '../hooks/useClassify'
import { useTasksStore } from '../store/tasks'
import { useNotesStore } from '../store/notes'
import { useAuthStore } from '../store/auth'
import { supabase } from '../lib/supabase'

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((e: { results: { [key: number]: { [key: number]: { transcript: string }; isFinal: boolean } }; resultIndex: number }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}

const SpeechRecognitionAPI: (new () => SpeechRecognitionInstance) | null =
  (typeof window !== 'undefined' &&
    ((window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
     (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition)) || null

export default function CaptureBar() {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [linkQuery, setLinkQuery] = useState<string | null>(null)
  const [linkResults, setLinkResults] = useState<{ id: number; text: string }[]>([])
  const [linkStart, setLinkStart] = useState(0)
  const [recording, setRecording] = useState(false)
  const [mode, setMode] = useState<'task' | 'note'>('task')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const baseTextRef = useRef('')
  const { classify, loading } = useClassify()
  const { addTask, fetchTasks, tasks } = useTasksStore()
  const { createNote, updateNote, fetchNotes } = useNotesStore()
  const { userId } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const m = input.match(/\[\[([^\]]*?)$/)
    if (m) {
      const q = m[1].toLowerCase()
      setLinkQuery(q)
      setLinkStart(input.lastIndexOf('[['))
      setLinkResults(tasks.filter((t) => !t.done && t.text.toLowerCase().includes(q)).slice(0, 5))
    } else {
      setLinkQuery(null)
      setLinkResults([])
    }
  }, [input, tasks])

  const insertLink = (task: { id: number; text: string }) => {
    const before = input.slice(0, linkStart)
    const after = input.slice(linkStart + 2 + (linkQuery?.length ?? 0))
    setInput(`${before}[[${task.text}]]${after}`)
    setLinkQuery(null)
    inputRef.current?.focus()
  }

  const submitNote = async (text: string) => {
    const note = await createNote()
    if (!note) { setError('Erro ao criar nota'); setInput(text); return }
    const title = text.slice(0, 60)
    const content = text.length > 60 ? text : ''
    await updateNote(note.id, title, content)
    await fetchNotes()
    setInput('')
    setError(null)
  }

  const submit = async () => {
    const text = input.trim()
    if (!text || loading) return
    setError(null)

    if (mode === 'note') {
      setInput('')
      await submitNote(text)
      return
    }

    const linkedIds: number[] = []
    const cleaned = text.replace(/\[\[([^\]]+)\]\]/g, (_, ref) => {
      const found = tasks.find((t) => t.text.toLowerCase() === ref.toLowerCase())
      if (found) linkedIds.push(found.id)
      return ref
    })

    setInput('')

    try {
      const classified = await classify(cleaned)
      if (!classified) {
        setError('Erro ao classificar — verifica a API key')
        setInput(text)
        return
      }

      const { data, error: err } = await supabase
        .from('ob_tasks')
        .insert({
          text: classified.text,
          projects: classified.projects,
          priority: classified.priority,
          reason: classified.reason,
          type: classified.type,
          tags: classified.tags ?? [],
          links: linkedIds,
          source: 'manual',
          done: false,
          user_id: userId ?? 'hugo',
          due_date: classified.due_date ?? null,
        })
        .select()
        .single()

      if (err || !data) {
        setError('Erro ao guardar tarefa')
        setInput(text)
        return
      }

      addTask(data as Parameters<typeof addTask>[0])
      fetchTasks()
    } catch {
      setError('Sem ligação')
      setInput(text)
    }
  }

  const toggleVoice = () => {
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }
    if (!SpeechRecognitionAPI) {
      setError('Browser não suporta reconhecimento de voz')
      return
    }
    const rec = new SpeechRecognitionAPI()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'pt-PT'
    baseTextRef.current = input
    rec.onresult = (e) => {
      let interim = ''
      let final = baseTextRef.current
      for (let i = e.resultIndex; i < Object.keys(e.results).length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) { final += (final ? ' ' : '') + t; baseTextRef.current = final }
        else interim = t
      }
      setInput(final + (interim ? (final ? ' ' : '') + interim : ''))
    }
    rec.onend = () => setRecording(false)
    rec.onerror = (e) => {
      if (e.error !== 'aborted') setError('Erro de microfone: ' + e.error)
      setRecording(false)
    }
    recognitionRef.current = rec
    rec.start()
    setRecording(true)
  }

  const hint = input
    ? loading ? 'a classificar…' : mode === 'note' ? '↵ guardar nota' : '↵ capturar · [[ para ligar'
    : null

  return (
    <div className="relative">
      {/* Mode toggle */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={() => setMode('task')}
          className="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all"
          style={mode === 'task'
            ? { background: 'var(--text-1)', color: '#fff' }
            : { background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
        >✓ Tarefa</button>
        <button
          onClick={() => setMode('note')}
          className="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all"
          style={mode === 'note'
            ? { background: 'var(--text-1)', color: '#fff' }
            : { background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
        >📝 Nota</button>
      </div>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !linkQuery) submit()
            if (e.key === 'Escape') setLinkQuery(null)
          }}
          placeholder={mode === 'note' ? 'escreve a nota…' : 'o que tens na cabeça?'}
          disabled={loading}
          className="capture-input w-full rounded-xl px-4 py-4 text-[15px] outline-none transition-all pr-20 disabled:opacity-60"
          style={{
            background: error ? '#fdf0ee' : recording ? '#fdf6ee' : 'var(--surface)',
            border: error ? '1.5px solid var(--red)' : recording ? '1.5px solid var(--amber)' : '1.5px solid var(--border-soft)',
            color: 'var(--text-1)',
            boxShadow: 'var(--shadow-md)',
          }}
        />
        <div className="absolute right-3 flex items-center gap-2">
          {hint && !recording && (
            <span className="text-[11px] pointer-events-none" style={{ color: 'var(--text-3)' }}>{hint}</span>
          )}
          {SpeechRecognitionAPI && (
            <button
              onMouseDown={(e) => { e.preventDefault(); toggleVoice() }}
              className="flex items-center justify-center w-7 h-7 rounded-md transition-all"
              style={recording
                ? { background: 'var(--amber)', color: '#fff' }
                : { color: 'var(--text-3)' }
              }
              title={recording ? 'Parar gravação' : 'Gravar voz'}
            >
              {recording ? (
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#fff' }} />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                  <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M2.5 8.5A5.5 5.5 0 008 14a5.5 5.5 0 005.5-5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <line x1="8" y1="14" x2="8" y2="16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-[12px] text-red-400 px-1">{error}</p>}

      {linkQuery !== null && linkResults.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-lg overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {linkResults.map((t) => (
            <button key={t.id} onMouseDown={() => insertLink(t)}
              className="w-full text-left px-4 py-2.5 text-[13px] transition-colors"
              style={{ color: 'var(--text-1)', borderBottom: '1px solid var(--border-soft)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
              {t.text}
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-[11px] px-1" style={{ color: 'var(--text-3)' }}>
        Atalhos:{' '}
        <code className="rounded px-1" style={{ background: 'var(--border-soft)', color: 'var(--text-2)' }}>@projeto</code>{' '}
        <code className="rounded px-1" style={{ background: 'var(--border-soft)', color: 'var(--text-2)' }}>#prioridade</code>{' '}
        <code className="rounded px-1" style={{ background: 'var(--border-soft)', color: 'var(--text-2)' }}>#tag</code>{' '}
        <code className="rounded px-1" style={{ background: 'var(--border-soft)', color: 'var(--text-2)' }}>[[tarefa]]</code>
      </p>
    </div>
  )
}
