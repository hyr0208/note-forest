export type Note = {
  id: string
  title: string
  content: string
  folderId: string | null
  favorite: boolean
  updatedAt: string
  deletedAt: string | null
}

export type NoteFolder = { id: string; name: string }
export type WorkspaceView = 'all' | 'favorites' | 'trash' | { folderId: string }
