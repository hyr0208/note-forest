import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  Check,
  ChevronDown,
  FileText,
  Folder,
  Heart,
  Leaf,
  ListFilter,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

type Note = {
  id: string
  title: string
  content: string
  folder: string
  favorite: boolean
  updatedAt: string
}

const starterNotes: Note[] = [
  {
    id: 'note-1',
    title: '천천히, 오래 쓰고 싶은 것들',
    content:
      '좋은 생각은 꼭 대단한 순간에만 오는 게 아니다.\n\n산책하다가 본 작은 꽃, 친구가 무심코 건넨 말, 문득 떠오른 계획.\n\n그런 것들을 잊기 전에 한곳에 모아두자. 나중에 다시 펼쳐봤을 때, 오늘의 내가 어떤 생각을 했는지 알 수 있도록.\n\n## 오늘의 메모\n- 생각이 나면 바로 적기\n- 완벽하게 정리하려고 애쓰지 않기\n- 가끔 다시 읽어보기',
    folder: '아이디어',
    favorite: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    title: '이번 주에 읽고 싶은 책',
    content: '읽을 책 목록을 모아두는 곳이에요.\n\n- 아주 작은 습관의 힘\n- 나는 메트로폴리탄 미술관의 경비원입니다',
    folder: '읽을거리',
    favorite: false,
    updatedAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: 'note-3',
    title: '주말 장보기',
    content: '토마토, 올리브오일, 바질, 사워도우 빵',
    folder: '생활',
    favorite: false,
    updatedAt: new Date(Date.now() - 172_800_000).toISOString(),
  },
]

const initialNotes = (): Note[] => {
  try {
    const saved = localStorage.getItem('note-forest-notes')
    return saved ? (JSON.parse(saved) as Note[]) : starterNotes
  } catch {
    return starterNotes
  }
}

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(
    new Date(value),
  )

const preview = (value: string) =>
  value.replace(/[#>*_`~-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 72) || '내용을 적어보세요…'

function App() {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [activeId, setActiveId] = useState<string | null>('note-1')
  const [activeView, setActiveView] = useState('전체 메모')
  const [search, setSearch] = useState('')
  const [mobileListOpen, setMobileListOpen] = useState(false)
  const [saveLabel, setSaveLabel] = useState('이 기기에 저장됨')

  useEffect(() => {
    localStorage.setItem('note-forest-notes', JSON.stringify(notes))
  }, [notes])

  const activeNote = notes.find((note) => note.id === activeId) ?? null
  const folders = [...new Set(notes.map((note) => note.folder).filter(Boolean))]
  const filteredNotes = useMemo(
    () =>
      notes
        .filter((note) => activeView === '즐겨찾기' ? note.favorite : activeView === '전체 메모' || note.folder === activeView)
        .filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [activeView, notes, search],
  )

  const updateNote = (id: string, patch: Partial<Note>) => {
    setNotes((current) => current.map((note) => note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note))
    setSaveLabel('저장 중…')
    window.setTimeout(() => setSaveLabel('이 기기에 저장됨'), 350)
  }

  const createNote = () => {
    const note: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      folder: activeView === '전체 메모' || activeView === '즐겨찾기' ? '' : activeView,
      favorite: false,
      updatedAt: new Date().toISOString(),
    }
    setNotes((current) => [note, ...current])
    setActiveId(note.id)
    setActiveView('전체 메모')
    setMobileListOpen(false)
  }

  const createFolder = () => {
    const name = window.prompt('새 폴더 이름을 입력해 주세요')?.trim()
    if (name) setActiveView(name)
  }

  const deleteNote = () => {
    if (!activeNote) return
    const remaining = notes.filter((note) => note.id !== activeNote.id)
    setNotes(remaining)
    setActiveId(remaining[0]?.id ?? null)
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileListOpen ? 'mobile-visible' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Leaf size={18} strokeWidth={2.2} /></div>
          <span className="brand-name">노트숲</span>
          <button className="icon-button sidebar-settings" aria-label="설정"><Settings2 size={17} /></button>
        </div>

        <button className="create-button" onClick={createNote}><Plus size={17} />새 메모<span className="shortcut">⌘ N</span></button>

        <nav className="main-nav" aria-label="메모 메뉴">
          <button className={`nav-link ${activeView === '전체 메모' ? 'selected' : ''}`} onClick={() => setActiveView('전체 메모')}>
            <Archive size={17} /><span>전체 메모</span><span className="nav-count">{notes.length}</span>
          </button>
          <button className={`nav-link ${activeView === '즐겨찾기' ? 'selected' : ''}`} onClick={() => setActiveView('즐겨찾기')}>
            <Heart size={17} /><span>즐겨찾기</span><span className="nav-count">{notes.filter((note) => note.favorite).length}</span>
          </button>
        </nav>

        <div className="folder-heading"><span>폴더</span><button className="icon-button" aria-label="폴더 추가" onClick={createFolder}><Plus size={16} /></button></div>
        <nav className="folder-nav" aria-label="폴더">
          {folders.map((folder) => (
            <button key={folder} className={`nav-link ${activeView === folder ? 'selected' : ''}`} onClick={() => setActiveView(folder)}>
              <Folder size={16} /><span>{folder}</span><span className="nav-count">{notes.filter((note) => note.folder === folder).length}</span>
            </button>
          ))}
          {!folders.length && <p className="folder-empty">폴더를 만들면 메모를 더 쉽게 정리할 수 있어요.</p>}
        </nav>

        <div className="sidebar-bottom">
          <div className="sync-card"><div className="sync-symbol"><Sparkles size={15} /></div><div><b>생각을 차곡차곡</b><span>나만의 메모 숲을 가꿔보세요.</span></div></div>
          <div className="profile-row"><div className="avatar">Y</div><div className="profile-text"><b>내 작업 공간</b><span>개인 메모</span></div><button className="icon-button" aria-label="계정 메뉴"><MoreHorizontal size={18} /></button></div>
        </div>
      </aside>

      <section className={`notes-column ${mobileListOpen ? 'mobile-visible' : ''}`}>
        <header className="list-header">
          <div><p className="overline">PERSONAL SPACE</p><h1>{activeView}</h1></div>
          <button className="icon-button mobile-close" onClick={() => setMobileListOpen(false)} aria-label="목록 닫기"><X size={19} /></button>
          <button className="icon-button desktop-more" aria-label="더 보기"><MoreHorizontal size={19} /></button>
        </header>
        <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="메모 검색" /><kbd>⌘ K</kbd></label>
        <div className="list-controls"><span>{filteredNotes.length}개의 메모</span><button aria-label="정렬"><ListFilter size={15} />최근 수정 <ChevronDown size={13} /></button></div>

        <div className="note-list">
          {filteredNotes.map((note) => (
            <button key={note.id} className={`note-card ${activeId === note.id ? 'active-note' : ''}`} onClick={() => { setActiveId(note.id); setMobileListOpen(false) }}>
              <div className="note-card-meta"><time>{dateLabel(note.updatedAt)}</time>{note.favorite && <Heart size={13} fill="currentColor" />}</div>
              <b>{note.title || '제목 없음'}</b><p>{preview(note.content)}</p>
              <span className="note-folder-label">{note.folder || '빠른 메모'}</span>
            </button>
          ))}
          {!filteredNotes.length && <div className="empty-list"><div className="empty-file"><FileText size={23} /></div><b>{search ? '검색 결과가 없어요' : '아직 메모가 없어요'}</b><p>{search ? '다른 단어로 다시 찾아보세요.' : '떠오른 생각을 가볍게 적어보세요.'}</p>{!search && <button onClick={createNote}>첫 메모 쓰기 <span>→</span></button>}</div>}
        </div>
        <footer className="list-footer"><span className="status-dot" />{saveLabel}</footer>
      </section>

      <section className="editor-column">
        {activeNote ? <>
          <header className="editor-header">
            <button className="icon-button editor-menu" onClick={() => setMobileListOpen(true)} aria-label="메모 목록"><Menu size={19} /></button>
            <div className="breadcrumbs"><span>내 메모</span><ChevronDown size={13} /><span>{activeNote.folder || '빠른 메모'}</span></div>
            <div className="editor-tools"><span className="save-state"><Check size={14} />저장됨</span><button className={`icon-button ${activeNote.favorite ? 'favorite' : ''}`} onClick={() => updateNote(activeNote.id, { favorite: !activeNote.favorite })} aria-label="즐겨찾기"><Heart size={18} fill={activeNote.favorite ? 'currentColor' : 'none'} /></button><button className="icon-button" onClick={deleteNote} aria-label="메모 삭제"><Trash2 size={17} /></button><button className="icon-button hide-small" aria-label="더 보기"><MoreHorizontal size={18} /></button></div>
          </header>
          <div className="editor-scroll"><article className="editor-content">
            <p className="editor-date">{new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(activeNote.updatedAt))}</p>
            <input className="title-input" value={activeNote.title} onChange={(event) => updateNote(activeNote.id, { title: event.target.value })} placeholder="제목 없음" aria-label="메모 제목" />
            <div className="format-row"><span>본문 <ChevronDown size={13} /></span><i /><button aria-label="제목 서식">H</button><button aria-label="목록 서식">≡</button><button aria-label="체크리스트">☑</button><button aria-label="인용">❞</button></div>
            <textarea className="body-input" value={activeNote.content} onChange={(event) => updateNote(activeNote.id, { content: event.target.value })} placeholder={'오늘 떠오른 생각을 적어보세요…\n\n완벽하게 정리하지 않아도 괜찮아요.'} aria-label="메모 내용" spellCheck="false" />
            <p className="editor-tip"><span>⌘ S</span> 자동 저장 <i>·</i> Markdown 지원</p>
          </article></div>
          <footer className="editor-footer"><span>{activeNote.content.trim().split(/\s+/).filter(Boolean).length} 단어</span><button><Folder size={14} />{activeNote.folder || '폴더에 추가'}</button></footer>
        </> : <div className="editor-empty"><div className="editor-empty-icon"><Leaf size={24} /></div><h2>생각이 자라는 곳</h2><p>떠오른 생각을 적어두면 언제든 다시 만날 수 있어요.</p><button className="create-button" onClick={createNote}><Plus size={16} />새 메모 만들기</button></div>}
      </section>
    </main>
  )
}

export default App
