import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import type { Attachment } from '../types'

const BUCKET = 'orgabuddy-files'

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return '🖼'
  if (mime === 'application/pdf') return '📄'
  if (mime.includes('spreadsheet') || mime.includes('excel')) return '📊'
  if (mime.includes('word') || mime.includes('document')) return '📝'
  return '📎'
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

interface Props {
  attachments: Attachment[]
  onUpdate: (attachments: Attachment[]) => Promise<void>
  context: string // e.g. "task-123" or "note-456"
}

export default function Attachments({ attachments, onUpdate, context }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useAuthStore()

  const upload = async (file: File) => {
    setUploading(true)
    setError(null)
    const path = `${userId ?? 'hugo'}/${context}/${Date.now()}-${file.name}`
    const { error: err } = await supabase.storage.from(BUCKET).upload(path, file)
    if (err) { setError('Erro ao enviar ficheiro'); setUploading(false); return }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const newAttachment: Attachment = { name: file.name, url: data.publicUrl, size: file.size, mime: file.type }
    await onUpdate([...attachments, newAttachment])
    setUploading(false)
  }

  const remove = async (url: string) => {
    // Extract path from URL
    const path = url.split(`/${BUCKET}/`)[1]
    if (path) await supabase.storage.from(BUCKET).remove([path])
    await onUpdate(attachments.filter((a) => a.url !== url))
  }

  return (
    <div className="mt-3">
      {attachments.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-2">
          {attachments.map((a) => (
            <div key={a.url} className="flex items-center gap-2 px-2.5 py-2 rounded-lg group"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span className="text-[14px] shrink-0">{fileIcon(a.mime)}</span>
              <a href={a.url} target="_blank" rel="noreferrer"
                className="flex-1 min-w-0 text-[12px] truncate hover:underline"
                style={{ color: 'var(--text-1)' }}>
                {a.name}
              </a>
              <span className="text-[11px] shrink-0" style={{ color: 'var(--text-3)' }}>{fmtSize(a.size)}</span>
              <button onClick={() => remove(a.url)}
                className="opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity text-[11px]"
                style={{ color: 'var(--text-2)' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <input ref={fileInput} type="file" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />

      <button onClick={() => fileInput.current?.click()} disabled={uploading}
        className="flex items-center gap-1.5 text-[12px] transition-opacity opacity-50 hover:opacity-80 disabled:opacity-30"
        style={{ color: 'var(--text-2)' }}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
          <path d="M7 1v8M4 4l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        {uploading ? 'a enviar…' : 'Anexar ficheiro'}
      </button>
      {error && <p className="text-[11px] mt-1" style={{ color: 'var(--red)' }}>{error}</p>}
    </div>
  )
}
