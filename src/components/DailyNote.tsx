import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function DailyNote() {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const date = todayISO()

  useEffect(() => {
    supabase.from('notes').select('content').eq('date', date).single()
      .then(({ data }) => setContent(data?.content ?? ''))
  }, [date])

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

  const formatted = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-[22px] font-semibold text-[#1a1a1a] capitalize">{formatted}</h1>
        <span className="text-[11px] text-[#bbb]">
          {saving ? 'a guardar…' : lastSaved
            ? `guardado ${lastSaved.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
            : ''}
        </span>
      </div>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Nota livre do dia…\n\nPodes usar markdown básico.\nEscreve [[tarefa]] para referenciar tarefas.`}
        className="flex-1 w-full resize-none outline-none text-[13.5px] text-[#1a1a1a] leading-relaxed placeholder:text-[#ccc] bg-transparent font-sans"
        style={{ minHeight: 400 }}
        spellCheck
      />
    </div>
  )
}
