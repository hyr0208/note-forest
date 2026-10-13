import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthScreen } from './features/auth/AuthScreen'
import { Workspace } from './features/workspace/Workspace'
import { isSupabaseConfigured, supabase } from './lib/supabase'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) return <Workspace />
  if (!authReady) return <main className="auth-shell"><div className="auth-loading">노트숲을 준비하고 있어요…</div></main>
  if (!session?.user) return <AuthScreen />
  return <Workspace user={session.user} />
}
