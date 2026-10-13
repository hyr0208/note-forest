import { ArrowDownToLine, FileText, Search, X } from 'lucide-react'
import type { RefObject } from 'react'
import type { Note, NoteFolder } from '../types'
import { dateLabel, notePreview } from '../formatting'

type Props = {
  viewLabel: string
  activeId: string | null
  folders: NoteFolder[]
  filteredNotes: Note[]
  search: string
  setSearch: (value: string) => void
  searchRef: RefObject<HTMLInputElement | null>
  mobileListOpen: boolean
  saveLabel: string
  loading: boolean
  error: string
  onCloseMobile: () => void
  onSelectNote: (id: string) => void
  onCreateNote: () => void
  onExport: () => void
}

export function NotesPanel(props: Props) {
  const { viewLabel, activeId, folders, filteredNotes, search, setSearch, searchRef, mobileListOpen, saveLabel, loading, error, onCloseMobile, onSelectNote, onCreateNote, onExport } = props
  return <section className={`notes-column ${mobileListOpen ? 'mobile-visible' : ''}`}>
    <header className="list-header"><div><p className="overline">PERSONAL SPACE</p><h1>{viewLabel}</h1></div><button className="icon-button mobile-close" onClick={onCloseMobile} aria-label="목록 닫기"><X size={19} /></button><button className="icon-button desktop-more" title="Markdown 내보내기" onClick={onExport}><ArrowDownToLine size={17} /></button></header>
    <label className="search-field"><Search size={16} /><input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="메모 검색" /><kbd>⌘ K</kbd></label>
    <div className="list-controls"><span>{filteredNotes.length}개의 메모</span><span className="sort-label">최근 수정</span></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    <div className="note-list">
      {loading ? <div className="empty-list"><div className="empty-file"><FileText size={23} /></div><b>메모를 불러오는 중이에요</b></div> : filteredNotes.map((note) => <button key={note.id} className={`note-card ${activeId === note.id ? 'active-note' : ''}`} onClick={() => onSelectNote(note.id)}>
        <div className="note-card-meta"><time>{dateLabel(note.updatedAt)}</time>{note.favorite && !note.deletedAt && <span className="favorite-dot">♥</span>}</div><b>{note.title || '제목 없음'}</b><p>{notePreview(note.content)}</p><span className="note-folder-label">{folders.find((folder) => folder.id === note.folderId)?.name ?? '빠른 메모'}</span>
      </button>)}
      {!loading && !filteredNotes.length && <div className="empty-list"><div className="empty-file"><FileText size={23} /></div><b>{search ? '검색 결과가 없어요' : viewLabel === '휴지통' ? '휴지통이 비어 있어요' : '아직 메모가 없어요'}</b><p>{search ? '다른 단어로 다시 찾아보세요.' : '떠오른 생각을 가볍게 적어보세요.'}</p>{!search && viewLabel !== '휴지통' && <button onClick={onCreateNote}>첫 메모 쓰기 <span>→</span></button>}</div>}
    </div>
    <footer className="list-footer"><span className={`status-dot ${saveLabel.includes('오류') || saveLabel.includes('못') ? 'status-error' : ''}`} />{saveLabel}</footer>
  </section>
}
