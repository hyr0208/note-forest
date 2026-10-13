import type { Note, NoteFolder } from './types'

export const demoStorageKey = 'note-forest-demo-v1'

export const starterFolders: NoteFolder[] = [
  { id: 'demo-ideas', name: '아이디어' },
  { id: 'demo-reading', name: '읽을거리' },
  { id: 'demo-life', name: '생활' },
]

export const starterNotes: Note[] = [
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

export function loadDemoData(): { notes: Note[]; folders: NoteFolder[] } {
  try {
    const stored = localStorage.getItem(demoStorageKey)
    if (stored) {
      const parsed = JSON.parse(stored) as { notes?: Note[]; folders?: NoteFolder[] }
      return { notes: parsed.notes ?? starterNotes, folders: parsed.folders ?? starterFolders }
    }
  } catch {
    // Start with the sample workspace when local data cannot be read.
  }
  return { notes: starterNotes, folders: starterFolders }
}
