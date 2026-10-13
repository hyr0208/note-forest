import { useState } from 'react'
import type { FormEvent } from 'react'
import { Leaf } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage('')
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (result.error) setMessage(result.error.message)
    else if (mode === 'signup' && !result.data.session) setMessage('가입 확인 링크를 이메일로 보냈어요. 메일함에서 확인을 마쳐주세요.')
  }

  return <main className="auth-shell">
    <section className="auth-card">
      <div className="auth-brand"><div className="brand-mark"><Leaf size={19} /></div><span>노트숲</span></div>
      <p className="auth-kicker">YOUR THOUGHTS, IN ONE PLACE</p>
      <h1>{mode === 'signin' ? '다시 만나요' : '나만의 숲을 만들어요'}</h1>
      <p className="auth-intro">로그인하면 어떤 기기에서도 메모를 이어 쓸 수 있어요.</p>
      <form onSubmit={submit} className="auth-form">
        <label>이메일<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>비밀번호<input type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8자 이상 입력" /></label>
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="auth-submit" disabled={busy}>{busy ? '잠시만 기다려 주세요…' : mode === 'signin' ? '로그인' : '계정 만들기'}</button>
      </form>
      <p className="auth-toggle">{mode === 'signin' ? '처음 오셨나요?' : '이미 계정이 있나요?'} <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>{mode === 'signin' ? '계정 만들기' : '로그인'}</button></p>
      <p className="auth-footnote">메모는 계정별로 안전하게 분리되어 저장됩니다.</p>
    </section>
  </main>
}
