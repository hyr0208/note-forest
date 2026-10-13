import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { NoteFolder, WorkspaceView } from './types'
import { useWorkspaceData } from './useWorkspaceData'
import { WorkspaceFrame } from './components/WorkspaceFrame'
import { FolderDialog } from './components/FolderDialog'
import { supabase } from '../../lib/supabase'

type Props = { user?: User }

export function Workspace({ user }: Props) {
  const data = useWorkspaceData(user)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<WorkspaceView>('all')
  const [search, setSearch] = useState('')
  const [mobileListOpen, setMobileListOpen] = useState(false)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [folderDialogError, setFolderDialogError] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const activeNote = data.notes.find((note) => note.id === activeId) ?? null
  const userLabel = user?.user_metadata.full_name || user?.email?.split('@')[0] || '로컬 미리보기'

  const viewLabel = activeView === 'all' ? '전체 메모'
    : activeView === 'favorites' ? '즐겨찾기'
      : activeView === 'trash' ? '휴지통'
        : data.folders.find((folder) => folder.id === activeView.folderId)?.name ?? '폴더'

  const filteredNotes = useMemo(() => data.notes
    .filter((note) => activeView === 'trash' ? Boolean(note.deletedAt) : !note.deletedAt)
    .filter((note) => activeView === 'all' || activeView === 'trash' || (activeView === 'favorites' ? note.favorite : note.folderId === activeView.folderId))
    .filter((note) => `${note.title} ${note.content}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [activeView, data.notes, data.folders, search])

  useEffect(() => {
    if (data.loading || activeId) return
    const firstVisible = filteredNotes[0]
    if (firstVisible) setActiveId(firstVisible.id)
  }, [activeId, data.loading, filteredNotes])

  const createNote = async () => {
    const folderId = typeof activeView === 'object' ? activeView.folderId : null
    const note = await data.createNote(folderId)
    if (!note) return
    setActiveId(note.id)
    setActiveView('all')
    setPreviewMode(false)
    setMobileListOpen(false)
  }

  const createFolder = async (name: string) => {
    const result = await data.createFolder(name)
    if (result.error || !result.folder) {
      setFolderDialogError(result.error ?? '폴더를 만들지 못했어요.')
      return
    }
    setFolderDialogError('')
    setFolderDialogOpen(false)
    setActiveView({ folderId: result.folder.id })
  }

  const renameFolder = async (folder: NoteFolder) => {
    const name = window.prompt('새 폴더 이름을 입력해 주세요', folder.name)?.trim()
    if (!name || name === folder.name) return
    const error = await data.renameFolder(folder, name)
    if (error) window.alert(error)
  }

  const deleteFolder = async (folder: NoteFolder) => {
    if (!window.confirm(`“${folder.name}” 폴더를 삭제할까요? 메모는 전체 메모로 이동합니다.`)) return
    const error = await data.deleteFolder(folder)
    if (error) { window.alert(error); return }
    if (typeof activeView === 'object' && activeView.folderId === folder.id) setActiveView('all')
  }

  const deleteOrRestore = async () => {
    if (!activeNote) return
    if (activeView !== 'trash') {
      data.updateNote(activeNote.id, { deletedAt: new Date().toISOString() })
      setActiveId(filteredNotes.find((note) => note.id !== activeNote.id)?.id ?? null)
      return
    }
    if (!window.confirm('이 메모를 영구 삭제할까요? 이 작업은 되돌릴 수 없어요.')) return
    const error = await data.permanentlyDeleteNote(activeNote.id)
    if (error) { window.alert(error); return }
    setActiveId(filteredNotes.find((note) => note.id !== activeNote.id)?.id ?? null)
  }

  const restoreNote = () => {
    if (!activeNote) return
    data.updateNote(activeNote.id, { deletedAt: null })
    setActiveView('all')
  }

  const addMarkup = (prefix: string, suffix = '') => {
    if (!activeNote) return
    const editor = bodyRef.current
    const start = editor?.selectionStart ?? activeNote.content.length
    const end = editor?.selectionEnd ?? start
    const selected = activeNote.content.slice(start, end)
    const content = `${activeNote.content.slice(0, start)}${prefix}${selected}${suffix}${activeNote.content.slice(end)}`
    data.updateNote(activeNote.id, { content })
    requestAnimationFrame(() => {
      editor?.focus()
      editor?.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    })
  }

  const exportNotes = () => {
    const rows = activeNote ? [activeNote] : data.notes.filter((note) => !note.deletedAt)
    const markdown = rows.map((note) => `# ${note.title || '제목 없음'}\n\n${note.content}\n`).join('\n---\n\n')
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = activeNote ? `${activeNote.title || 'note'}.md` : 'note-forest-export.md'
    link.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey
      if (modifier && event.key.toLowerCase() === 'n') { event.preventDefault(); void createNote() }
      if (modifier && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus() }
      if (modifier && event.key.toLowerCase() === 's') { event.preventDefault(); data.saveNow(activeId) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeId, data.saveNow])

  return <WorkspaceFrame
    userLabel={userLabel}
    emailLabel={user?.email ?? '이 기기에 저장'}
    notes={data.notes}
    folders={data.folders}
    filteredNotes={filteredNotes}
    activeNote={activeNote}
    activeId={activeId}
    activeView={activeView}
    viewLabel={viewLabel}
    isCloud={data.isCloud}
    mobileListOpen={mobileListOpen}
    saveLabel={data.saveLabel}
    loading={data.loading}
    error={data.error}
    search={search}
    setSearch={setSearch}
    searchRef={searchRef}
    bodyRef={bodyRef}
    previewMode={previewMode}
    setPreviewMode={setPreviewMode}
    onCreateNote={() => void createNote()}
    onCreateFolder={() => { setFolderDialogError(''); setFolderDialogOpen(true) }}
    onSelectView={(view) => { setActiveView(view); setActiveId(null) }}
    onExport={exportNotes}
    onSignOut={user ? () => { void supabase?.auth.signOut() } : undefined}
    onRenameFolder={(folder) => void renameFolder(folder)}
    onDeleteFolder={(folder) => void deleteFolder(folder)}
    onCloseMobile={() => setMobileListOpen(false)}
    onOpenList={() => setMobileListOpen(true)}
    onSelectNote={(id) => { setActiveId(id); setPreviewMode(false); setMobileListOpen(false) }}
    onUpdateNote={data.updateNote}
    onDeleteOrRestore={() => void deleteOrRestore()}
    onRestore={restoreNote}
    onAddMarkup={addMarkup}
    dialog={<FolderDialog open={folderDialogOpen} error={folderDialogError} onClose={() => setFolderDialogOpen(false)} onCreate={createFolder} />}
  />
}
