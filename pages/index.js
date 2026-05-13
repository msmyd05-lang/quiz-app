import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { grammarQuestions, itCards } from '../lib/data';
import { isDue } from '../lib/srs';

function Nav({ user }) {
  const router = useRouter();
  async function logout() {
    await supabase.auth.signOut();
    router.push('/auth');
  }
  return (
    <nav className="nav">
      <div className="nav-inner">
        <span className="nav-brand">QuizMaster</span>
        <div className="nav-right">
          <span className="nav-user">{user?.user_metadata?.name || user?.email}</span>
          <button className="btn-ghost" onClick={logout}>Log out</button>
        </div>
      </div>
    </nav>
  );
}

export default function Dashboard({ user, loading }) {
  const router = useRouter();
  const [progress, setProgress] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    loadProgress();
  }, [user]);

  async function loadProgress() {
    const { data } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id);

    const progressMap = {};
    (data || []).forEach(p => { progressMap[p.card_id] = p; });

    // Calculate due counts
    const grammarDue = grammarQuestions.filter(q => {
      const p = progressMap[q.id];
      return !p || isDue(p);
    }).length;

    const itDue = itCards.filter(c => {
      const p = progressMap[c.id];
      return !p || isDue(p);
    }).length;

    const totalReviewed = (data || []).length;
    const totalCards = grammarQuestions.length + itCards.length;
    const masteredCount = (data || []).filter(p => p.repetitions >= 3 && p.ease_factor >= 2.3).length;

    setProgress({ grammarDue, itDue, totalReviewed, totalCards, masteredCount, data: data || [] });
    setLoadingData(false);
  }

  if (loading || !user || loadingData) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const streak = computeStreak(progress.data);

  return (
    <div className="page">
      <Nav user={user} />
      <div className="container">
        <div className="dash-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <h1>Your Dashboard</h1>
            {streak > 0 && (
              <span className="streak-badge">🔥 {streak} day streak</span>
            )}
          </div>
          <p>Keep going — spaced repetition builds long-term memory.</p>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Due Today</div>
            <div className="stat-value" style={{ color: progress.grammarDue + progress.itDue > 0 ? 'var(--accent2)' : 'var(--green)' }}>
              {progress.grammarDue + progress.itDue}
            </div>
            <div className="stat-sub">cards waiting for review</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Mastered</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{progress.masteredCount}</div>
            <div className="stat-sub">of {progress.totalCards} total cards</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Progress</div>
            <div className="stat-value">{Math.round(progress.totalReviewed / progress.totalCards * 100)}%</div>
            <div className="stat-sub">{progress.totalReviewed} cards started</div>
          </div>
        </div>

        <div className="mode-grid">
          <Link href="/quiz/grammar" className="mode-card">
            <div className="mode-icon">✏️</div>
            <h3>Grammar MCQ</h3>
            <p>Multiple choice questions on tenses, prepositions, clauses, and more.</p>
            <div className="mode-due">
              {progress.grammarDue > 0
                ? `${progress.grammarDue} cards due now`
                : '✓ All caught up!'}
            </div>
          </Link>
          <Link href="/quiz/it" className="mode-card">
            <div className="mode-icon">💻</div>
            <h3>IT Definitions</h3>
            <p>Flashcards for 50 IT terms — see the term, recall the definition.</p>
            <div className="mode-due">
              {progress.itDue > 0
                ? `${progress.itDue} cards due now`
                : '✓ All caught up!'}
            </div>
          </Link>
        </div>

        <div style={{ marginTop: 28 }}>
          <div className="progress-track" style={{ height: 6 }}>
            <div className="progress-fill" style={{ width: `${Math.round(progress.totalReviewed / progress.totalCards * 100)}%` }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
            <span>{progress.totalReviewed} cards started</span>
            <span>{progress.totalCards} total</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function computeStreak(data) {
  if (!data.length) return 0;
  const days = new Set(data.map(p => p.last_reviewed?.slice(0, 10)).filter(Boolean));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}
