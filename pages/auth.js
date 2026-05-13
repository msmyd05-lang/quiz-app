import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name } }
      });
      if (error) setError(error.message);
      else setSuccess('Account created! You can now log in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push('/');
    }
    setLoading(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>QuizMaster</h1>
          <p>Grammar &amp; IT Vocabulary — Spaced Repetition</p>
        </div>
        <div className="auth-card">
          <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-error" style={{color:'var(--green)',background:'rgba(34,211,165,.08)',borderColor:'rgba(34,211,165,.2)'}}>{success}</div>}
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="field">
                <label>Name</label>
                <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
          </form>
          <div className="auth-switch">
            {mode === 'login'
              ? <>No account? <span onClick={() => { setMode('signup'); setError(''); }}>Sign up</span></>
              : <>Have an account? <span onClick={() => { setMode('login'); setError(''); }}>Log in</span></>}
          </div>
        </div>
      </div>
    </div>
  );
}
