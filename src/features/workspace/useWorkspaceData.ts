import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import type { FolderRow, NoteRow } from '../../lib/database.types'
import { demoStorageKey, loadDemoData } from './demoData'
import type { Note, NoteFolder } from './types'

const mapNote = (row: NoteRow): Note => ({
  id: row.id,
  title: row.title,
  content: row.content,
  folderId: row.folder_id,
  favorite: row.favorite,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at,
})

const mapFolder = (row: FolderRow): NoteFolder => ({ id: row.id, name: row.name })

export function useWorkspaceData(user?: User) {
  const isCloud = Boolean(user && isSupabaseConfigured && supabase)
  const [notes, setNotes] = useState<Note[]>(() => isCloud ? [] : loadDemoData().notes)
  const [folders, setFolders] = useState<NoteFolder[]>(() => isCloud ? [] : loadDemoData().folders)
  const [loading, setLoading] = useState(isCloud)
  const [saveLabel, setSaveLabel] = useState(isCloud ? '불러오는 중…' : '이 기기에 저장됨')
  const [error, setError] = useState('')
  const notesRef = useRef(notes)
  const dirtyNotes = useRef(new Set<string>())
  const timers = useRef(new Map<string, number>())

  useEffect(() => { notesRef.current = notes }, [notes])

  const refresh = useCallback(async (mergeDirty = false) => {
    if (!supabase || !user) return
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
    const remoteNotes = (notesResult.data ?? []).map(mapNote)
    if (mergeDirty) {
      for (const note of notesRef.current.filter((item) => dirtyNotes.current.has(item.id))) {
        const index = remoteNotes.findIndex((row) => row.id === note.id)
        if (index >= 0) remoteNotes[index] = note
        else remoteNotes.unshift(note)
      }
    }
    setNotes(remoteNotes)
    notesRef.current = remoteNotes
    setFolders((foldersResult.data ?? []).map(mapFolder))
    setLoading(false)
    setError('')
    setSaveLabel('모든 기기에 저장됨')
  }, [user])

  useEffect(() => {
    if (!isCloud || !user || !supabase) return
    void refresh()
    const channel = supabase.channel(`note-forest-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` }, () => { void refresh(true) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folders', filter: `user_id=eq.${user.id}` }, () => { void refresh(true) })
      .subscribe()
    const refreshOnFocus = () => { if (document.visibilityState === 'visible') void refresh(true) }
    document.addEventListener('visibilitychange', refreshOnFocus)
    return () => {
      document.removeEventListener('visibilitychange', refreshOnFocus)
      void supabase?.removeChannel(channel)
    }
  }, [isCloud, refresh, user])

  useEffect(() => {
    if (!isCloud) localStorage.setItem(demoStorageKey, JSON.stringify({ notes, folders }))
  }, [folders, isCloud, notes])

  const persistNote = useCallback(async (id: string) => {
    const note = notesRef.current.find((item) => item.id === id)
    if (!supabase || !note) return
    const { data, error: saveError } = await supabase.from('notes').update({
      title: note.title,
      content: note.content,
      favorite: note.favorite,
      folder_id: note.folderId,
      deleted_at: note.deletedAt,
    }).eq('id', note.id).select('*').maybeSingle()
    if (saveError || !data) {
      setSaveLabel('저장하지 못했어요')
      setError(saveError?.message ?? '이 메모를 찾을 수 없어요.')
      return
    }
    dirtyNotes.current.delete(id)
    const saved = mapNote(data)
    setNotes((current) => current.map((item) => item.id === id ? saved : item))
    setSaveLabel('모든 기기에 저장됨')
    setError('')
  }, [])

  const updateNote = (id: string, patch: Partial<Note>) => {
    setNotes((current) => current.map((note) => note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note))
    if (!isCloud) { setSaveLabel('저장 중…'); window.setTimeout(() => setSaveLabel('이 기기에 저장됨'), 250); return }
    dirtyNotes.current.add(id)
    setSaveLabel('저장 중…')
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
    timers.current.set(id, window.setTimeout(() => { void persistNote(id) }, 550))
  }

  const createNote = async (folderId: string | null): Promise<Note | null> => {
    if (!isCloud || !supabase || !user) {
      const note: Note = { id: crypto.randomUUID(), title: '', content: '', folderId, favorite: false, updatedAt: new Date().toISOString(), deletedAt: null }
      setNotes((current) => [note, ...current])
      return note
    }
    const { data, error: createError } = await supabase.from('notes').insert({ user_id: user.id, folder_id: folderId, title: '', content: '' }).select('*').single()
    if (createError || !data) { setError(createError?.message ?? '메모를 만들지 못했어요.'); return null }
    const note = mapNote(data)
    setNotes((current) => [note, ...current])
    setError('')
    return note
  }

  const createFolder = async (name: string): Promise<{ folder: NoteFolder | null; error: string | null }> => {
    if (!name.trim()) return { folder: null, error: '폴더 이름을 입력해 주세요.' }
    if (folders.some((folder) => folder.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase())) return { folder: null, error: '같은 이름의 폴더가 이미 있어요.' }
    if (!isCloud || !supabase || !user) {
      const folder = { id: crypto.randomUUID(), name: name.trim() }
      setFolders((current) => [...current, folder])
      return { folder, error: null }
    }
    const { data, error: createError } = await supabase.from('folders').insert({ user_id: user.id, name: name.trim() }).select('*').single()
    if (createError || !data) return { folder: null, error: createError?.code === '23505' ? '같은 이름의 폴더가 이미 있어요.' : createError?.message ?? '폴더를 만들지 못했어요.' }
    const folder = mapFolder(data)
    setFolders((current) => [...current, folder])
    setError('')
    return { folder, error: null }
  }

  const renameFolder = async (folder: NoteFolder, name: string): Promise<string | null> => {
    if (!name.trim() || name.trim() === folder.name) return null
    if (!isCloud || !supabase) {
      setFolders((current) => current.map((item) => item.id === folder.id ? { ...item, name: name.trim() } : item))
      return null
    }
    const { error: renameError } = await supabase.from('folders').update({ name: name.trim() }).eq('id', folder.id)
    if (renameError) return renameError.code === '23505' ? '같은 이름의 폴더가 이미 있어요.' : renameError.message
    setFolders((current) => current.map((item) => item.id === folder.id ? { ...item, name: name.trim() } : item))
    return null
  }

  const deleteFolder = async (folder: NoteFolder): Promise<string | null> => {
    if (isCloud && supabase) {
      const { error: deleteError } = await supabase.from('folders').delete().eq('id', folder.id)
      if (deleteError) return deleteError.message
    }
    setFolders((current) => current.filter((item) => item.id !== folder.id))
    setNotes((current) => current.map((note) => note.folderId === folder.id ? { ...note, folderId: null } : note))
    return null
  }

  const permanentlyDeleteNote = async (id: string): Promise<string | null> => {
    if (isCloud && supabase) {
      const { error: deleteError } = await supabase.from('notes').delete().eq('id', id)
      if (deleteError) return deleteError.message
    }
    dirtyNotes.current.delete(id)
    setNotes((current) => current.filter((note) => note.id !== id))
    return null
  }

  const saveNow = (id: string | null) => {
    if (!id) return
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
    if (isCloud) void persistNote(id)
    else setSaveLabel('이 기기에 저장됨')
  }

  return { notes, folders, loading, saveLabel, error, isCloud, updateNote, createNote, createFolder, renameFolder, deleteFolder, permanentlyDeleteNote, saveNow, refresh }
}
