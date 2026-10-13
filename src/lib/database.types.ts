export type FolderRow = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type NoteRow = {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  content: string
  favorite: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type Table<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      folders: Table<FolderRow, { id?: string; user_id: string; name: string; created_at?: string }, { name?: string }>
      notes: Table<NoteRow, { id?: string; user_id: string; folder_id?: string | null; title?: string; content?: string; favorite?: boolean; deleted_at?: string | null }, { folder_id?: string | null; title?: string; content?: string; favorite?: boolean; deleted_at?: string | null; updated_at?: string }>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
