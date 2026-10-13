import { useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  error?: string
  onClose: () => void
  onCreate: (name: string) => Promise<void>
}

export function FolderDialog({ open, error, onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  if (!open) return null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    await onCreate(name)
    setBusy(false)
    setName('')
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="folder-modal" role="dialog" aria-modal="true" aria-labelledby="folder-dialog-title">
      <button className="icon-button modal-close" aria-label="닫기" onClick={onClose}><X size={18} /></button>
      <p className="overline">KEEP THINGS ORGANIZED</p>
      <h2 id="folder-dialog-title">새 폴더</h2>
      <p>메모를 담을 폴더 이름을 정해 주세요.</p>
      <form onSubmit={submit}>
        <label className="sr-only" htmlFor="new-folder-name">폴더 이름</label>
        <input id="new-folder-name" autoFocus maxLength={40} value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 아이디어" />
        {error && <p className="inline-error" role="alert">{error}</p>}
        <button className="auth-submit" disabled={busy}>{busy ? '만드는 중…' : '폴더 만들기'}</button>
      </form>
    </section>
  </div>
}
