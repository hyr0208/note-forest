import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Archive,
  ArrowDownToLine,
  Check,
  ChevronDown,
  FileText,
  Folder,
  Heart,
  Leaf,
  ListFilter,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import type { FolderRow, NoteRow } from './lib/database.types'

type Note = {
  id: string
  title: string
  content: string
  folderId: string | null
  favorite: boolean
  updatedAt: string
  deletedAt: string | null
}
type NoteFolder = { id: string; name: string }
type View = 'all' | 'favorites' | 'trash' | { folderId: string }

const starterFolders: NoteFolder[] = [
  { id: 'demo-ideas', name: '아이디어' },
  { id: 'demo-reading', name: '읽을거리' },
  { id: 'demo-life', name: '생활' },
]
const starterNotes: Note[] = [
  {
    id: 'demo-1', folderId: 'demo-ideas', title: '천천히, 오래 쓰고 싶은 것들',
    content: '좋은 생각은 꼭 대단한 순간에만 오는 게 아니다.\n\n산책하다가 본 작은 꽃, 친구가 무심코 건넨 말, 문득 떠오른 계획.\n\n그런 것들을 잊기 전에 한곳에 모아두자. 나중에 다시 펼쳐봤을 때, 오늘의 내가 어떤 생각을 했는지 알 수 있도록.\n\n## 오늘의 메모\n- 생각이 나면 바로 적기\n- 완벽하게 정리하려고 애쓰지 않기\n- 가끔 다시 읽어보기',
    favorite: true, updatedAt: new Date().toISOString(), deletedAt: null,
  },
  {
    id: 'demo-2', folderId: 'demo-reading', title: '이번 주에 읽고 싶은 책',
    content: '읽을 책 목록을 모아두는 곳이에요.\n\n- 아주 작은 습관의 힘\n- 나는 메트로폴리탄 미술관의 경비원입니다',
    favorite: false, updatedAt: new Date(Date.now() - 86_400_000).toISOString(), deletedAt: null,
  },
  {
    id: 'demo-3', folderId: 'demo-life', title: '주말 장보기',
    content: '토마토, 올리브오일, 바질, 사워도우 빵',
    favorite: false, updatedAt: new Date(Date.now() - 172_800_000).toISOString(), deletedAt: null,
  },
]

const toNote = (row: NoteRow): Note => ({
  id: row.id, title: row.title, content: row.content, folderId: row.folder_id,
  favorite: row.favorite, updatedAt: row.updated_at, deletedAt: row.deleted_at,
})
const toFolder = (row: FolderRow): NoteFolder => ({ id: row.id, name: row.name })
const dateLabel = (value: string) => new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(value))
const preview = (value: string) => value.replace(/[#>*_`~-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 72) || '내용을 적어보세요…'
const demoStorageKey = 'note-forest-demo-v1'

function loadDemoData() {
  try {
    const stored = localStorage.getItem(demoStorageKey)
    if (stored) {
      const parsed = JSON.parse(stored) as { notes?: Note[]; folders?: NoteFolder[] }
      return { notes: parsed.notes ?? starterNotes, folders: parsed.folders ?? starterFolders }
    }
  } catch { /* Start with the sample workspace when local data cannot be read. */ }
  return { notes: starterNotes, folders: starterFolders }
}

function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage('')
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (result.error) setMessage(result.error.message)
    else if (mode === 'signup' && !result.data.session) setMessage('가입 확인 링크를 이메일로 보냈어요. 메일함에서 확인을 마쳐주세요.')
  }

  return <main className="auth-shell">
    <section className="auth-card">
      <div className="auth-brand"><div className="brand-mark"><Leaf size={19} /></div><span>노트숲</span></div>
      <p className="auth-kicker">YOUR THOUGHTS, IN ONE PLACE</p>
      <h1>{mode === 'signin' ? '다시 만나요' : '나만의 숲을 만들어요'}</h1>
      <p className="auth-intro">로그인하면 어떤 기기에서도 메모를 이어 쓸 수 있어요.</p>
      <form onSubmit={submit} className="auth-form">
        <label>이메일<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>비밀번호<input type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8자 이상 입력" /></label>
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="auth-submit" disabled={busy}>{busy ? '잠시만 기다려 주세요…' : mode === 'signin' ? '로그인' : '계정 만들기'}</button>
      </form>
      <p className="auth-toggle">{mode === 'signin' ? '처음 오셨나요?' : '이미 계정이 있나요?'} <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>{mode === 'signin' ? '계정 만들기' : '로그인'}</button></p>
      <p className="auth-footnote">메모는 계정별로 안전하게 분리되어 저장됩니다.</p>
    </section>
  </main>
}

function LocalPreview() {
  const initial = useMemo(loadDemoData, [])
  const [notes, setNotes] = useState<Note[]>(initial.notes)
  const [folders, setFolders] = useState<NoteFolder[]>(initial.folders)
  const [activeId, setActiveId] = useState<string | null>(initial.notes[0]?.id ?? null)
  const [activeView, setActiveView] = useState<View>('all')
  const [search, setSearch] = useState('')
  const [mobileListOpen, setMobileListOpen] = useState(false)
  const [saveLabel, setSaveLabel] = useState('이 기기에 저장됨')
  const [folderDialog, setFolderDialog] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const activeNote = notes.find((note) => note.id === activeId) ?? null

  useEffect(() => { localStorage.setItem(demoStorageKey, JSON.stringify({ notes, folders })) }, [notes, folders])

  const viewLabel = activeView === 'all' ? '전체 메모' : activeView === 'favorites' ? '즐겨찾기' : activeView === 'trash' ? '휴지통' : folders.find((folder) => folder.id === activeView.folderId)?.name ?? '폴더'
  const filteredNotes = useMemo(() => notes
    .filter((note) => activeView === 'trash' ? Boolean(note.deletedAt) : !note.deletedAt)
    .filter((note) => activeView === 'all' || activeView === 'trash' || (activeView === 'favorites' ? note.favorite : note.folderId === activeView.folderId))
    .filter((note) => `${note.title} ${note.content}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [activeView, notes, search])

  const updateNote = (id: string, patch: Partial<Note>) => {
    setNotes((current) => current.map((note) => note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note))
    setSaveLabel('저장 중…')
    window.setTimeout(() => setSaveLabel('이 기기에 저장됨'), 300)
  }
  const createNote = () => {
    const note: Note = { id: crypto.randomUUID(), title: '', content: '', folderId: typeof activeView === 'object' ? activeView.folderId : null, favorite: false, updatedAt: new Date().toISOString(), deletedAt: null }
    setNotes((current) => [note, ...current]); setActiveId(note.id); setActiveView('all'); setPreviewMode(false); setMobileListOpen(false)
  }
  const createFolder = (event: FormEvent) => {
    event.preventDefault()
    const name = folderName.trim()
    if (!name || folders.some((folder) => folder.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return
    const folder = { id: crypto.randomUUID(), name }
    setFolders((current) => [...current, folder]); setFolderName(''); setFolderDialog(false); setActiveView({ folderId: folder.id })
  }
  const removeFolder = (folder: NoteFolder) => {
    if (!window.confirm(`“${folder.name}” 폴더를 삭제할까요? 메모는 전체 메모로 이동합니다.`)) return
    setFolders((current) => current.filter((item) => item.id !== folder.id))
    setNotes((current) => current.map((note) => note.folderId === folder.id ? { ...note, folderId: null } : note))
    if (typeof activeView === 'object' && activeView.folderId === folder.id) setActiveView('all')
  }
  const deleteOrRestore = () => {
    if (!activeNote) return
    if (activeView === 'trash') {
      if (!window.confirm('이 메모를 영구 삭제할까요?')) return
      setNotes((current) => current.filter((note) => note.id !== activeNote.id))
    } else updateNote(activeNote.id, { deletedAt: new Date().toISOString() })
    setActiveId(notes.find((note) => note.id !== activeNote.id && (activeView === 'trash' ? Boolean(note.deletedAt) : !note.deletedAt))?.id ?? null)
  }
  const saveNow = () => { setSaveLabel('이 기기에 저장됨') }
  const addMarkup = (start: string, end = '') => {
    if (!activeNote) return
    const editor = bodyRef.current
    const left = editor?.selectionStart ?? activeNote.content.length
    const right = editor?.selectionEnd ?? left
    const text = activeNote.content.slice(left, right)
    const updated = `${activeNote.content.slice(0, left)}${start}${text}${end}${activeNote.content.slice(right)}`
    updateNote(activeNote.id, { content: updated })
    requestAnimationFrame(() => { editor?.focus(); editor?.setSelectionRange(left + start.length, left + start.length + text.length) })
  }
  const exportNotes = () => {
    const rows = activeNote ? [activeNote] : notes.filter((note) => !note.deletedAt)
    const markdown = rows.map((note) => `# ${note.title || '제목 없음'}\n\n${note.content}\n`).join('\n---\n\n')
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = activeNote ? `${activeNote.title || 'note'}.md` : 'note-forest-export.md'; link.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'n') { event.preventDefault(); createNote() }
      if (mod && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus() }
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); saveNow() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return <WorkspaceFrame
    userLabel="로컬 미리보기" emailLabel="이 기기에 저장" notes={notes} folders={folders} activeView={activeView} viewLabel={viewLabel} activeNote={activeNote} filteredNotes={filteredNotes} search={search} setSearch={setSearch} searchRef={searchRef} mobileListOpen={mobileListOpen} setMobileListOpen={setMobileListOpen} saveLabel={saveLabel} isCloud={false} previewMode={previewMode} setPreviewMode={setPreviewMode} bodyRef={bodyRef} onCreateNote={createNote} onCreateFolder={() => setFolderDialog(true)} onSelectView={setActiveView} onSelectNote={(id) => { setActiveId(id); setPreviewMode(false); setMobileListOpen(false) }} onUpdateNote={updateNote} onDeleteOrRestore={deleteOrRestore} onExport={exportNotes} onSignOut={undefined} onAddMarkup={addMarkup} onRenameFolder={undefined} onDeleteFolder={removeFolder}
    dialog={folderDialog ? <FolderDialog name={folderName} setName={setFolderName} onClose={() => setFolderDialog(false)} onSubmit={createFolder} /> : null}
  />
}

function Workspace({ user }: { user: User }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<NoteFolder[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<View>('all')
  const [search, setSearch] = useState('')
  const [mobileListOpen, setMobileListOpen] = useState(false)
  const [saveLabel, setSaveLabel] = useState('불러오는 중…')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [folderDialog, setFolderDialog] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const notesRef = useRef(notes)
  const dirtyNotes = useRef(new Set<string>())
  const timers = useRef(new Map<string, number>())
  const activeNote = notes.find((note) => note.id === activeId) ?? null
  const userLabel = user.user_metadata.full_name || user.email?.split('@')[0] || '내 작업 공간'

  useEffect(() => { notesRef.current = notes }, [notes])

  const refreshWorkspace = useCallback(async (mergeDirty = false) => {
    if (!supabase) return
    const [notesResult, foldersResult] = await Promise.all([
      supabase.from('notes').select('*').order('updated_at', { ascending: false }),
      supabase.from('folders').select('*').order('created_at', { ascending: true }),
    ])
    if (notesResult.error || foldersResult.error) {
      setError(notesResult.error?.message || foldersResult.error?.message || '데이터를 불러오지 못했어요.')
      setSaveLabel('동기화 오류')
      setLoading(false)
      return
    }
    const remoteNotes = (notesResult.data ?? []).map(toNote)
    if (mergeDirty) {
      const dirty = dirtyNotes.current
      const localById = new Map(notesRef.current.filter((note) => dirty.has(note.id)).map((note) => [note.id, note]))
      for (const note of localById.values()) {
        const index = remoteNotes.findIndex((row) => row.id === note.id)
        if (index >= 0) remoteNotes[index] = note
        else remoteNotes.unshift(note)
      }
    }
    setNotes(remoteNotes)
    notesRef.current = remoteNotes
    setFolders((foldersResult.data ?? []).map(toFolder))
    setActiveId((current) => current && remoteNotes.some((note) => note.id === current) ? current : remoteNotes.find((note) => !note.deletedAt)?.id ?? null)
    setLoading(false)
    setError('')
    setSaveLabel('모든 기기에 저장됨')
  }, [])

  useEffect(() => {
    void refreshWorkspace()
    const channel = supabase?.channel(`note-forest-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` }, () => { void refreshWorkspace(true) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folders', filter: `user_id=eq.${user.id}` }, () => { void refreshWorkspace(true) })
      .subscribe()
    const refreshOnFocus = () => { if (document.visibilityState === 'visible') void refreshWorkspace(true) }
    document.addEventListener('visibilitychange', refreshOnFocus)
    return () => {
      document.removeEventListener('visibilitychange', refreshOnFocus)
      if (channel) void supabase?.removeChannel(channel)
    }
  }, [refreshWorkspace, user.id])

  const viewLabel = activeView === 'all' ? '전체 메모' : activeView === 'favorites' ? '즐겨찾기' : activeView === 'trash' ? '휴지통' : folders.find((folder) => folder.id === activeView.folderId)?.name ?? '폴더'
  const filteredNotes = useMemo(() => notes
    .filter((note) => activeView === 'trash' ? Boolean(note.deletedAt) : !note.deletedAt)
    .filter((note) => activeView === 'all' || activeView === 'trash' || (activeView === 'favorites' ? note.favorite : note.folderId === activeView.folderId))
    .filter((note) => `${note.title} ${note.content}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [activeView, notes, search])

  const persistNote = useCallback(async (id: string) => {
    const note = notesRef.current.find((item) => item.id === id)
    if (!supabase || !note) return
    const { data, error: saveError } = await supabase.from('notes').update({
      title: note.title, content: note.content, favorite: note.favorite,
      folder_id: note.folderId, deleted_at: note.deletedAt,
    }).eq('id', note.id).select('*').maybeSingle()
    if (saveError || !data) { setSaveLabel('저장하지 못했어요'); setError(saveError?.message ?? '이 메모를 찾을 수 없어요.'); return }
    dirtyNotes.current.delete(id)
    const saved = toNote(data)
    setNotes((current) => current.map((item) => item.id === id ? saved : item))
    setSaveLabel('모든 기기에 저장됨')
    setError('')
  }, [])

  const updateNote = (id: string, patch: Partial<Note>) => {
    setNotes((current) => current.map((note) => note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note))
    dirtyNotes.current.add(id)
    setSaveLabel('저장 중…')
    const oldTimer = timers.current.get(id)
    if (oldTimer) window.clearTimeout(oldTimer)
    timers.current.set(id, window.setTimeout(() => { void persistNote(id) }, 550))
  }

  const createNote = async () => {
    if (!supabase) return
    const folderId = typeof activeView === 'object' ? activeView.folderId : null
    const { data, error: createError } = await supabase.from('notes').insert({ user_id: user.id, folder_id: folderId, title: '', content: '' }).select('*').single()
    if (createError || !data) { setError(createError?.message ?? '메모를 만들지 못했어요.'); return }
    const note = toNote(data)
    setNotes((current) => [note, ...current]); setActiveId(note.id); setActiveView('all'); setPreviewMode(false); setMobileListOpen(false)
  }

  const createFolder = async (event: FormEvent) => {
    event.preventDefault()
    const name = folderName.trim()
    if (!supabase || !name) return
    const { data, error: createError } = await supabase.from('folders').insert({ user_id: user.id, name }).select('*').single()
    if (createError || !data) { setError(createError?.code === '23505' ? '같은 이름의 폴더가 이미 있어요.' : createError?.message ?? '폴더를 만들지 못했어요.'); return }
    setFolders((current) => [...current, toFolder(data)]); setFolderName(''); setFolderDialog(false); setActiveView({ folderId: data.id })
  }

  const renameFolder = async (folder: NoteFolder) => {
    const name = window.prompt('새 폴더 이름을 입력해 주세요', folder.name)?.trim()
    if (!name || name === folder.name || !supabase) return
    const { error: renameError } = await supabase.from('folders').update({ name }).eq('id', folder.id)
    if (renameError) { setError(renameError.code === '23505' ? '같은 이름의 폴더가 이미 있어요.' : renameError.message); return }
    setFolders((current) => current.map((item) => item.id === folder.id ? { ...item, name } : item))
  }

  const removeFolder = async (folder: NoteFolder) => {
    if (!window.confirm(`“${folder.name}” 폴더를 삭제할까요? 메모는 전체 메모로 이동합니다.`) || !supabase) return
    const { error: deleteError } = await supabase.from('folders').delete().eq('id', folder.id)
    if (deleteError) { setError(deleteError.message); return }
    setFolders((current) => current.filter((item) => item.id !== folder.id))
    setNotes((current) => current.map((note) => note.folderId === folder.id ? { ...note, folderId: null } : note))
    if (typeof activeView === 'object' && activeView.folderId === folder.id) setActiveView('all')
  }

  const deleteOrRestore = async () => {
    if (!activeNote || !supabase) return
    if (activeView === 'trash') {
      if (!window.confirm('이 메모를 영구 삭제할까요? 이 작업은 되돌릴 수 없어요.')) return
      const { error: deleteError } = await supabase.from('notes').delete().eq('id', activeNote.id)
      if (deleteError) { setError(deleteError.message); return }
      const remaining = notes.filter((note) => note.id !== activeNote.id)
      setNotes(remaining); setActiveId(remaining.find((note) => note.deletedAt)?.id ?? null)
    } else {
      const nextId = notes.find((note) => note.id !== activeNote.id && !note.deletedAt)?.id ?? null
      updateNote(activeNote.id, { deletedAt: new Date().toISOString() })
      setActiveId(nextId)
    }
  }

  const saveNow = () => { if (activeNote) { const timer = timers.current.get(activeNote.id); if (timer) window.clearTimeout(timer); void persistNote(activeNote.id) } }
  const addMarkup = (start: string, end = '') => {
    if (!activeNote) return
    const editor = bodyRef.current
    const left = editor?.selectionStart ?? activeNote.content.length
    const right = editor?.selectionEnd ?? left
    const text = activeNote.content.slice(left, right)
    updateNote(activeNote.id, { content: `${activeNote.content.slice(0, left)}${start}${text}${end}${activeNote.content.slice(right)}` })
    requestAnimationFrame(() => { editor?.focus(); editor?.setSelectionRange(left + start.length, left + start.length + text.length) })
  }
  const exportNotes = () => {
    const rows = activeNote ? [activeNote] : notes.filter((note) => !note.deletedAt)
    const markdown = rows.map((note) => `# ${note.title || '제목 없음'}\n\n${note.content}\n`).join('\n---\n\n')
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = activeNote ? `${activeNote.title || 'note'}.md` : 'note-forest-export.md'; link.click(); URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'n') { event.preventDefault(); void createNote() }
      if (mod && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus() }
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); saveNow() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return <WorkspaceFrame
    userLabel={userLabel} emailLabel={user.email ?? ''} notes={notes} folders={folders} activeView={activeView} viewLabel={viewLabel} activeNote={activeNote} filteredNotes={filteredNotes} search={search} setSearch={setSearch} searchRef={searchRef} mobileListOpen={mobileListOpen} setMobileListOpen={setMobileListOpen} saveLabel={saveLabel} isCloud previewMode={previewMode} setPreviewMode={setPreviewMode} bodyRef={bodyRef} onCreateNote={() => void createNote()} onCreateFolder={() => { setFolderName(''); setFolderDialog(true) }} onSelectView={setActiveView} onSelectNote={(id) => { setActiveId(id); setPreviewMode(false); setMobileListOpen(false) }} onUpdateNote={updateNote} onDeleteOrRestore={() => void deleteOrRestore()} onExport={exportNotes} onSignOut={() => { void supabase?.auth.signOut() }} onAddMarkup={addMarkup} onRenameFolder={(folder) => void renameFolder(folder)} onDeleteFolder={(folder) => void removeFolder(folder)}
    error={error} loading={loading} dialog={folderDialog ? <FolderDialog name={folderName} setName={setFolderName} onClose={() => setFolderDialog(false)} onSubmit={(event) => void createFolder(event)} /> : null}
  />
}

type WorkspaceProps = {
  userLabel: string; emailLabel: string; notes: Note[]; folders: NoteFolder[]; activeView: View; viewLabel: string; activeNote: Note | null; filteredNotes: Note[]; search: string; setSearch: (value: string) => void; searchRef: React.RefObject<HTMLInputElement | null>; mobileListOpen: boolean; setMobileListOpen: (value: boolean) => void; saveLabel: string; isCloud: boolean; previewMode: boolean; setPreviewMode: (value: boolean) => void; bodyRef: React.RefObject<HTMLTextAreaElement | null>; onCreateNote: () => void; onCreateFolder: () => void; onSelectView: (view: View) => void; onSelectNote: (id: string) => void; onUpdateNote: (id: string, patch: Partial<Note>) => void; onDeleteOrRestore: () => void; onExport: () => void; onSignOut?: () => void; onAddMarkup: (start: string, end?: string) => void; onRenameFolder?: (folder: NoteFolder) => void; onDeleteFolder?: (folder: NoteFolder) => void; error?: string; loading?: boolean; dialog: ReactNode
}

function WorkspaceFrame(props: WorkspaceProps) {
  const { userLabel, emailLabel, notes, folders, activeView, viewLabel, activeNote, filteredNotes, search, setSearch, searchRef, mobileListOpen, setMobileListOpen, saveLabel, isCloud, previewMode, setPreviewMode, bodyRef, onCreateNote, onCreateFolder, onSelectView, onSelectNote, onUpdateNote, onDeleteOrRestore, onExport, onSignOut, onAddMarkup, onRenameFolder, onDeleteFolder, error, loading, dialog } = props
  const trashCount = notes.filter((note) => Boolean(note.deletedAt)).length

  return <main className="app-shell">
    <aside className={`sidebar ${mobileListOpen ? 'mobile-visible' : ''}`}>
      <div className="brand-row"><div className="brand-mark"><Leaf size={18} strokeWidth={2.2} /></div><span className="brand-name">노트숲</span><button className="icon-button sidebar-settings" aria-label="Markdown으로 내보내기" title="Markdown으로 내보내기" onClick={onExport}><ArrowDownToLine size={16} /></button></div>
      <button className="create-button" onClick={onCreateNote}><Plus size={17} />새 메모<span className="shortcut">⌘ N</span></button>
      <nav className="main-nav" aria-label="메모 메뉴">
        <button className={`nav-link ${activeView === 'all' ? 'selected' : ''}`} onClick={() => onSelectView('all')}><Archive size={17} /><span>전체 메모</span><span className="nav-count">{notes.filter((note) => !note.deletedAt).length}</span></button>
        <button className={`nav-link ${activeView === 'favorites' ? 'selected' : ''}`} onClick={() => onSelectView('favorites')}><Heart size={17} /><span>즐겨찾기</span><span className="nav-count">{notes.filter((note) => note.favorite && !note.deletedAt).length}</span></button>
      </nav>
      <div className="folder-heading"><span>폴더</span><button className="icon-button" aria-label="폴더 추가" onClick={onCreateFolder}><Plus size={16} /></button></div>
      <nav className="folder-nav" aria-label="폴더">
        {folders.map((folder) => <div className={`folder-nav-row ${typeof activeView === 'object' && activeView.folderId === folder.id ? 'selected' : ''}`} key={folder.id}>
          <button className={`nav-link ${typeof activeView === 'object' && activeView.folderId === folder.id ? 'selected' : ''}`} onClick={() => onSelectView({ folderId: folder.id })}><Folder size={16} /><span>{folder.name}</span><span className="nav-count">{notes.filter((note) => note.folderId === folder.id && !note.deletedAt).length}</span></button>
          {onRenameFolder && <button className="folder-menu icon-button" aria-label={`${folder.name} 폴더 옵션`} onClick={() => onRenameFolder(folder)}><MoreHorizontal size={16} /></button>}
          {onDeleteFolder && <button className="folder-delete" aria-label={`${folder.name} 삭제`} onClick={() => onDeleteFolder(folder)}><X size={14} /></button>}
        </div>)}
        {!folders.length && <p className="folder-empty">폴더를 만들면 메모를 더 쉽게 정리할 수 있어요.</p>}
      </nav>
      <button className={`nav-link trash-link ${activeView === 'trash' ? 'selected' : ''}`} onClick={() => onSelectView('trash')}><Trash2 size={16} /><span>휴지통</span><span className="nav-count">{trashCount}</span></button>
      <div className="sidebar-bottom">
        <div className={`sync-card ${!isCloud ? 'local-sync-card' : ''}`}><div className="sync-symbol"><Sparkles size={15} /></div><div><b>{isCloud ? '모든 기기에 동기화' : '로컬 미리보기'}</b><span>{isCloud ? '계정에 안전하게 저장돼요.' : '이 브라우저에만 저장돼요.'}</span></div></div>
        <div className="profile-row"><div className="avatar">{userLabel.slice(0, 1).toUpperCase()}</div><div className="profile-text"><b>{userLabel}</b><span>{emailLabel || (isCloud ? '개인 메모' : '동기화 설정 필요')}</span></div>{onSignOut ? <button className="icon-button" aria-label="로그아웃" onClick={onSignOut}><LogOut size={16} /></button> : <button className="icon-button" aria-label="Markdown 내보내기" title="Markdown으로 내보내기" onClick={onExport}><ArrowDownToLine size={16} /></button>}</div>
      </div>
    </aside>

    <section className={`notes-column ${mobileListOpen ? 'mobile-visible' : ''}`}>
      <header className="list-header"><div><p className="overline">PERSONAL SPACE</p><h1>{viewLabel}</h1></div><button className="icon-button mobile-close" onClick={() => setMobileListOpen(false)} aria-label="목록 닫기"><X size={19} /></button><button className="icon-button desktop-more" title="Markdown 내보내기" onClick={onExport}><ArrowDownToLine size={17} /></button></header>
      <label className="search-field"><Search size={16} /><input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="메모 검색" /><kbd>⌘ K</kbd></label>
      <div className="list-controls"><span>{filteredNotes.length}개의 메모</span><span className="sort-label"><ListFilter size={15} />최근 수정 <ChevronDown size={13} /></span></div>
      <div className="note-list">
        {loading ? <div className="empty-list"><div className="empty-file"><FileText size={23} /></div><b>메모를 불러오는 중이에요</b></div> : filteredNotes.map((note) => <button key={note.id} className={`note-card ${activeNote?.id === note.id ? 'active-note' : ''}`} onClick={() => onSelectNote(note.id)}>
          <div className="note-card-meta"><time>{dateLabel(note.updatedAt)}</time>{note.favorite && !note.deletedAt && <Heart size={13} fill="currentColor" />}</div><b>{note.title || '제목 없음'}</b><p>{preview(note.content)}</p><span className="note-folder-label">{folders.find((folder) => folder.id === note.folderId)?.name ?? '빠른 메모'}</span>
        </button>)}
        {!loading && !filteredNotes.length && <div className="empty-list"><div className="empty-file"><FileText size={23} /></div><b>{search ? '검색 결과가 없어요' : activeView === 'trash' ? '휴지통이 비어 있어요' : '아직 메모가 없어요'}</b><p>{search ? '다른 단어로 다시 찾아보세요.' : '떠오른 생각을 가볍게 적어보세요.'}</p>{!search && activeView !== 'trash' && <button onClick={onCreateNote}>첫 메모 쓰기 <span>→</span></button>}</div>}
      </div>
      <footer className="list-footer"><span className={`status-dot ${saveLabel.includes('오류') || saveLabel.includes('못') ? 'status-error' : ''}`} />{saveLabel}</footer>
    </section>

    <section className="editor-column">
      {activeNote ? <>
        <header className="editor-header"><button className="icon-button editor-menu" onClick={() => setMobileListOpen(true)} aria-label="메모 목록"><Menu size={19} /></button><div className="breadcrumbs"><span>{viewLabel}</span><ChevronDown size={13} /><span>{folders.find((folder) => folder.id === activeNote.folderId)?.name ?? '빠른 메모'}</span></div><div className="editor-tools"><span className="save-state"><Check size={14} />{saveLabel}</span>{activeView === 'trash' ? <button className="icon-button" onClick={() => { onUpdateNote(activeNote.id, { deletedAt: null }); onSelectView('all') }} aria-label="복원" title="복원"><Undo2 size={17} /></button> : <button className={`icon-button ${activeNote.favorite ? 'favorite' : ''}`} onClick={() => onUpdateNote(activeNote.id, { favorite: !activeNote.favorite })} aria-label="즐겨찾기"><Heart size={18} fill={activeNote.favorite ? 'currentColor' : 'none'} /></button>}<button className="icon-button" onClick={onDeleteOrRestore} aria-label={activeView === 'trash' ? '영구 삭제' : '휴지통으로 이동'} title={activeView === 'trash' ? '영구 삭제' : '휴지통으로 이동'}><Trash2 size={17} /></button><button className="icon-button hide-small" title="Markdown으로 내보내기" onClick={onExport}><ArrowDownToLine size={17} /></button><button className="icon-button hide-small" aria-label="더 보기"><MoreHorizontal size={18} /></button></div></header>
        {error && <div className="inline-error" role="alert">{error}</div>}
        <div className="editor-scroll"><article className="editor-content"><p className="editor-date">{new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(activeNote.updatedAt))}</p><input className="title-input" value={activeNote.title} onChange={(event) => onUpdateNote(activeNote.id, { title: event.target.value })} placeholder="제목 없음" aria-label="메모 제목" disabled={activeView === 'trash'} />
          <div className="format-row"><span>{previewMode ? '미리보기' : 'Markdown'} <ChevronDown size={13} /></span><i />{previewMode ? <button className="preview-toggle" onClick={() => setPreviewMode(false)}>편집으로 돌아가기</button> : <><button aria-label="제목 서식" onClick={() => onAddMarkup('## ')}>H</button><button aria-label="굵게" onClick={() => onAddMarkup('**', '**')}><b>B</b></button><button aria-label="목록" onClick={() => onAddMarkup('- ')}>≡</button><button aria-label="체크리스트" onClick={() => onAddMarkup('- [ ] ')}>☑</button><button aria-label="인용" onClick={() => onAddMarkup('> ')}>❞</button><button className="preview-toggle" onClick={() => setPreviewMode(true)}>미리보기</button></>}</div>
          {previewMode ? <div className="markdown-preview"><Markdown remarkPlugins={[remarkGfm]}>{activeNote.content || '*내용이 비어 있어요.*'}</Markdown></div> : <textarea ref={bodyRef} className="body-input" value={activeNote.content} onChange={(event) => onUpdateNote(activeNote.id, { content: event.target.value })} placeholder={'오늘 떠오른 생각을 적어보세요…\n\n완벽하게 정리하지 않아도 괜찮아요.'} aria-label="메모 내용" spellCheck="false" disabled={activeView === 'trash'} />}
          <p className="editor-tip"><span>⌘ S</span> 자동 저장 <i>·</i> Markdown 지원</p>
        </article></div>
        <footer className="editor-footer"><span>{activeNote.content.trim().split(/\s+/).filter(Boolean).length} 단어</span><label className="folder-select-label"><Folder size={14} /><select aria-label="메모 폴더" value={activeNote.folderId ?? ''} onChange={(event) => onUpdateNote(activeNote.id, { folderId: event.target.value || null })} disabled={activeView === 'trash'}><option value="">폴더에 추가</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><ChevronDown size={12} /></label></footer>
      </> : <div className="editor-empty"><div className="editor-empty-icon"><Leaf size={24} /></div><h2>{loading ? '메모를 불러오는 중이에요' : '생각이 자라는 곳'}</h2><p>{loading ? '잠시만 기다려 주세요.' : '떠오른 생각을 적어두면 언제든 다시 만날 수 있어요.'}</p>{!loading && activeView !== 'trash' && <button className="create-button" onClick={onCreateNote}><Plus size={16} />새 메모 만들기</button>}</div>}
    </section>
    {dialog}
  </main>
}

function FolderDialog({ name, setName, onClose, onSubmit }: { name: string; setName: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  return <div className="modal-backdrop" onClick={onClose}><form className="folder-modal" onSubmit={onSubmit} onClick={(event) => event.stopPropagation()}><div className="modal-icon"><Folder size={19} /></div><button type="button" className="modal-close" onClick={onClose}><X size={17} /></button><h2>새 폴더 만들기</h2><p>메모를 주제별로 모아 정리해 보세요.</p><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="폴더 이름" maxLength={60} /><button className="modal-submit" type="submit" disabled={!name.trim()}>폴더 만들기</button></form></div>
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthReady(true) })
    return () => subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) return <LocalPreview />
  if (!authReady) return <main className="auth-shell"><div className="auth-loading">노트숲을 준비하고 있어요…</div></main>
  if (!session?.user) return <AuthScreen />
  return <Workspace user={session.user} />
}

export default App
