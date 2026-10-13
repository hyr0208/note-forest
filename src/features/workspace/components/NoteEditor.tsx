import type { RefObject } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowDownToLine, Check, ChevronDown, Folder, Heart, Leaf, Menu, Trash2, Undo2 } from 'lucide-react'
import type { Note, NoteFolder, WorkspaceView } from '../types'
import { dateLabel } from '../formatting'

type Props = {
  note: Note | null
  folders: NoteFolder[]
  activeView: WorkspaceView
  viewLabel: string
  loading: boolean
  saveLabel: string
  previewMode: boolean
  setPreviewMode: (value: boolean) => void
  bodyRef: RefObject<HTMLTextAreaElement | null>
  onOpenList: () => void
  onUpdateNote: (id: string, patch: Partial<Note>) => void
  onDeleteOrRestore: () => void
  onRestore: () => void
  onAddMarkup: (prefix: string, suffix?: string) => void
  onCreateNote: () => void
}

export function NoteEditor(props: Props) {
  const { note, folders, activeView, viewLabel, loading, saveLabel, previewMode, setPreviewMode, bodyRef, onOpenList, onUpdateNote, onDeleteOrRestore, onRestore, onAddMarkup, onCreateNote } = props
  const isTrash = activeView === 'trash'
  const folderName = folders.find((folder) => folder.id === note?.folderId)?.name ?? '빠른 메모'

  const exportNote = () => {
    if (!note) return
    const blob = new Blob([`# ${note.title || '제목 없음'}\n\n${note.content}\n`], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${note.title || 'note'}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!note) return <section className="editor-column"><div className="editor-empty"><div className="editor-empty-icon"><Leaf size={24} /></div><h2>{loading ? '메모를 불러오는 중이에요' : '생각이 자라는 곳'}</h2><p>{loading ? '잠시만 기다려 주세요.' : '떠오른 생각을 적어두면 언제든 다시 만날 수 있어요.'}</p>{!loading && activeView !== 'trash' && <button className="create-button" onClick={onCreateNote}><span>＋</span>새 메모 만들기</button>}</div></section>

  return <section className="editor-column">
    <header className="editor-header">
      <button className="icon-button editor-menu" onClick={onOpenList} aria-label="메모 목록"><Menu size={19} /></button>
      <div className="breadcrumbs"><span>{viewLabel}</span><ChevronDown size={13} /><span>{folderName}</span></div>
      <div className="editor-tools">
        <span className="save-state"><Check size={14} />{saveLabel}</span>
        {isTrash
          ? <button className="icon-button" onClick={onRestore} aria-label="복원" title="복원"><Undo2 size={17} /></button>
          : <button className={`icon-button ${note.favorite ? 'favorite' : ''}`} onClick={() => onUpdateNote(note.id, { favorite: !note.favorite })} aria-label="즐겨찾기"><Heart size={18} fill={note.favorite ? 'currentColor' : 'none'} /></button>}
        <button className="icon-button" onClick={onDeleteOrRestore} aria-label={isTrash ? '영구 삭제' : '휴지통으로 이동'} title={isTrash ? '영구 삭제' : '휴지통으로 이동'}><Trash2 size={17} /></button>
        <button className="icon-button hide-small" title="Markdown 내보내기" onClick={exportNote}><ArrowDownToLine size={17} /></button>
      </div>
    </header>
    <div className="editor-scroll"><article className="editor-content">
      <p className="editor-date">{dateLabel(note.updatedAt)}</p>
      <input className="title-input" value={note.title} onChange={(event) => onUpdateNote(note.id, { title: event.target.value })} placeholder="제목 없음" aria-label="메모 제목" disabled={isTrash} />
      <div className="format-row">
        <span>{previewMode ? '미리보기' : 'Markdown'} <ChevronDown size={13} /></span><i />
        {previewMode ? <button className="preview-toggle" onClick={() => setPreviewMode(false)}>편집으로 돌아가기</button> : <>
          <button aria-label="제목 서식" onClick={() => onAddMarkup('## ')}>H</button>
          <button aria-label="굵게" onClick={() => onAddMarkup('**', '**')}><b>B</b></button>
          <button aria-label="목록" onClick={() => onAddMarkup('- ')}>≡</button>
          <button aria-label="체크리스트" onClick={() => onAddMarkup('- [ ] ')}>☑</button>
          <button aria-label="인용" onClick={() => onAddMarkup('> ')}>❞</button>
          <button className="preview-toggle" onClick={() => setPreviewMode(true)}>미리보기</button>
        </>}
      </div>
      {previewMode
        ? <div className="markdown-preview"><Markdown remarkPlugins={[remarkGfm]}>{note.content || '*내용이 비어 있어요.*'}</Markdown></div>
        : <textarea ref={bodyRef} className="body-input" value={note.content} onChange={(event) => onUpdateNote(note.id, { content: event.target.value })} placeholder={'오늘 떠오른 생각을 적어보세요…\n\n완벽하게 정리하지 않아도 괜찮아요.'} aria-label="메모 내용" spellCheck="false" disabled={isTrash} />}
      <p className="editor-tip"><span>⌘ S</span> 자동 저장 <i>·</i> Markdown 지원</p>
    </article></div>
    <footer className="editor-footer"><span>{note.content.trim().split(/\s+/).filter(Boolean).length} 단어</span><label className="folder-select-label"><Folder size={14} /><select aria-label="메모 폴더" value={note.folderId ?? ''} onChange={(event) => onUpdateNote(note.id, { folderId: event.target.value || null })} disabled={isTrash}><option value="">폴더에 추가</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><ChevronDown size={12} /></label></footer>
  </section>
}
