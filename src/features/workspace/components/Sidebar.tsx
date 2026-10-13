import { Archive, ArrowDownToLine, Folder, Heart, Leaf, LogOut, MoreHorizontal, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { Note, NoteFolder, WorkspaceView } from '../types'

type Props = {
  userLabel: string
  emailLabel: string
  notes: Note[]
  folders: NoteFolder[]
  activeView: WorkspaceView
  isCloud: boolean
  mobileListOpen: boolean
  onCreateNote: () => void
  onCreateFolder: () => void
  onSelectView: (view: WorkspaceView) => void
  onExport: () => void
  onSignOut?: () => void
  onRenameFolder?: (folder: NoteFolder) => void
  onDeleteFolder?: (folder: NoteFolder) => void
}

export function Sidebar(props: Props) {
  const { userLabel, emailLabel, notes, folders, activeView, isCloud, mobileListOpen, onCreateNote, onCreateFolder, onSelectView, onExport, onSignOut, onRenameFolder, onDeleteFolder } = props
  const trashCount = notes.filter((note) => Boolean(note.deletedAt)).length

  return <aside className={`sidebar ${mobileListOpen ? 'mobile-visible' : ''}`}>
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
        {onRenameFolder && <button className="folder-menu icon-button" aria-label={`${folder.name} 폴더 이름 변경`} title="이름 변경" onClick={() => onRenameFolder(folder)}><MoreHorizontal size={16} /></button>}
        {onDeleteFolder && <button className="folder-delete" aria-label={`${folder.name} 폴더 삭제`} title="폴더 삭제" onClick={() => onDeleteFolder(folder)}><Trash2 size={13} /></button>}
      </div>)}
      {!folders.length && <p className="folder-empty">폴더를 만들면 메모를 더 쉽게 정리할 수 있어요.</p>}
    </nav>
    <button className={`nav-link trash-link ${activeView === 'trash' ? 'selected' : ''}`} onClick={() => onSelectView('trash')}><Trash2 size={16} /><span>휴지통</span><span className="nav-count">{trashCount}</span></button>
    <div className="sidebar-bottom">
      <div className={`sync-card ${!isCloud ? 'local-sync-card' : ''}`}><div className="sync-symbol"><Sparkles size={15} /></div><div><b>{isCloud ? '모든 기기에 동기화' : '로컬 미리보기'}</b><span>{isCloud ? '계정에 안전하게 저장돼요.' : '이 브라우저에만 저장돼요.'}</span></div></div>
      <div className="profile-row"><div className="avatar">{userLabel.slice(0, 1).toUpperCase()}</div><div className="profile-text"><b>{userLabel}</b><span>{emailLabel || (isCloud ? '개인 메모' : '동기화 설정 필요')}</span></div>{onSignOut ? <button className="icon-button" aria-label="로그아웃" onClick={onSignOut}><LogOut size={16} /></button> : <button className="icon-button" aria-label="Markdown 내보내기" title="Markdown 내보내기" onClick={onExport}><ArrowDownToLine size={16} /></button>}</div>
    </div>
  </aside>
}
