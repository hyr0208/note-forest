import type { ReactNode, RefObject } from 'react'
import type { Note, NoteFolder, WorkspaceView } from '../types'
import { Sidebar } from './Sidebar'
import { NotesPanel } from './NotesPanel'
import { NoteEditor } from './NoteEditor'

type Props = {
  userLabel: string
  emailLabel: string
  notes: Note[]
  folders: NoteFolder[]
  filteredNotes: Note[]
  activeNote: Note | null
  activeId: string | null
  activeView: WorkspaceView
  viewLabel: string
  isCloud: boolean
  mobileListOpen: boolean
  saveLabel: string
  loading: boolean
  error: string
  search: string
  setSearch: (value: string) => void
  searchRef: RefObject<HTMLInputElement | null>
  bodyRef: RefObject<HTMLTextAreaElement | null>
  previewMode: boolean
  setPreviewMode: (value: boolean) => void
  onCreateNote: () => void
  onCreateFolder: () => void
  onSelectView: (view: WorkspaceView) => void
  onExport: () => void
  onSignOut?: () => void
  onRenameFolder: (folder: NoteFolder) => void
  onDeleteFolder: (folder: NoteFolder) => void
  onCloseMobile: () => void
  onOpenList: () => void
  onSelectNote: (id: string) => void
  onUpdateNote: (id: string, patch: Partial<Note>) => void
  onDeleteOrRestore: () => void
  onRestore: () => void
  onAddMarkup: (prefix: string, suffix?: string) => void
  dialog?: ReactNode
}

export function WorkspaceFrame(props: Props) {
  return <main className="app-shell">
    <Sidebar userLabel={props.userLabel} emailLabel={props.emailLabel} notes={props.notes} folders={props.folders} activeView={props.activeView} isCloud={props.isCloud} mobileListOpen={props.mobileListOpen} onCreateNote={props.onCreateNote} onCreateFolder={props.onCreateFolder} onSelectView={props.onSelectView} onExport={props.onExport} onSignOut={props.onSignOut} onRenameFolder={props.onRenameFolder} onDeleteFolder={props.onDeleteFolder} />
    <NotesPanel viewLabel={props.viewLabel} activeId={props.activeId} folders={props.folders} filteredNotes={props.filteredNotes} search={props.search} setSearch={props.setSearch} searchRef={props.searchRef} mobileListOpen={props.mobileListOpen} saveLabel={props.saveLabel} loading={props.loading} error={props.error} onCloseMobile={props.onCloseMobile} onSelectNote={props.onSelectNote} onCreateNote={props.onCreateNote} onExport={props.onExport} />
    <NoteEditor note={props.activeNote} folders={props.folders} activeView={props.activeView} viewLabel={props.viewLabel} loading={props.loading} saveLabel={props.saveLabel} previewMode={props.previewMode} setPreviewMode={props.setPreviewMode} bodyRef={props.bodyRef} onOpenList={props.onOpenList} onUpdateNote={props.onUpdateNote} onDeleteOrRestore={props.onDeleteOrRestore} onRestore={props.onRestore} onAddMarkup={props.onAddMarkup} onCreateNote={props.onCreateNote} />
    {props.dialog}
  </main>
}
