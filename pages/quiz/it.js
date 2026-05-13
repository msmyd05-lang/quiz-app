import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { itCards } from '../../lib/data';
import { getNextReview, isDue, sortByPriority } from '../../lib/srs';

export default function ITQuiz({ user, loading }) {
  const router = useRouter();
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0, total: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    loadAndBuild();
  }, [user]);

  async function loadAndBuild() {
    const { data } = await supabase.from('progress').select('*').eq('user_id', user.id).like('card_id', 'it%');
    const map = {};
    (data || []).forEach(p => { map[p.card_id] = p; });
    setProgressMap(map);

    const withProgress = itCards.map(c => ({
      ...c,
      nextReview: map[c.id]?.next_review,
      easeFactor: map[c.id]?.ease_factor || 2.5,
      repetitions: map[c.id]?.repetitions || 0,
      interval: map[c.id]?.interval || 0,
    }));

    const due = withProgress.filter(c => isDue(c));
    const sorted = sortByPriority(due);
    const finalQueue = sorted.length > 0 ? sorted : [...itCards].sort(() => Math.random() - 0.5).slice(0, 20);
    setQueue(finalQueue);
    setLoadingData(false);
  }

  async function rate(quality) {
    // quality: 0=again, 1=hard, 2=good, 3=easy
    const c = queue[currentIdx];
    const existing = progressMap[c.id] || {};
    const next = getNextReview({
      interval: existing.interval || 0,
      repetitions: existing.repetitions || 0,
      easeFactor: existing.ease_factor || 2.5,
    }, quality);

    await supabase.from('progress').upsert({
      user_id: user.id,
      card_id: c.id,
      card_type: 'it',
      interval: next.interval,
      repetitions: next.repetitions,
      ease_factor: next.easeFactor,
      next_review: next.nextReview,
      last_reviewed: new Date().toISOString(),
      last_quality: quality,
    }, { onConflict: 'user_id,card_id' });

    const keys = ['again', 'hard', 'good', 'easy'];
    setSessionStats(s => ({ ...s, [keys[quality]]: s[keys[quality]] + 1, total: s.total + 1 }));

    if (currentIdx + 1 >= queue.length) {
      setDone(true);
    } else {
      setCurrentIdx(i => i + 1);
      setFlipped(false);
    }
  }

  if (loading || !user || loadingData) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (done || queue.length === 0) {
    const { again, hard, good, easy, total } = sessionStats;
    return (
      <div className="page">
        <SimpleNav />
        <div className="quiz-wrap">
          <div className="session-end">
            <div className="score-big">{total}</div>
            <h2>Session complete! 🎉</h2>
            <p style={{ marginBottom: 20 }}>
              <span style={{ color: 'var(--green)', marginRight: 12 }}>✓ Easy: {easy}</span>
              <span style={{ color: 'var(--accent2)', marginRight: 12 }}>Good: {good}</span>
              <span style={{ color: 'var(--yellow)', marginRight: 12 }}>Hard: {hard}</span>
              <span style={{ color: 'var(--red)' }}>✗ Again: {again}</span>
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => { setDone(false); setCurrentIdx(0); setFlipped(false); setSessionStats({ again: 0, hard: 0, good: 0, easy: 0, total: 0 }); loadAndBuild(); }}>Study Again</button>
              <Link href="/" className="btn btn-secondary btn-lg">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const c = queue[currentIdx];

  return (
    <div className="page">
      <SimpleNav />
      <div className="quiz-wrap">
        <div className="quiz-top">
          <Link href="/" className="btn btn-secondary btn-sm">← Back</Link>
          <div className="quiz-progress">
            <div className="quiz-progress-label">
              <span>Card {currentIdx + 1} of {queue.length}</span>
              <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                {flipped ? 'Rate your recall' : 'Tap to flip'}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(currentIdx / queue.length) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flashcard-wrap" onClick={() => !flipped && setFlipped(true)}>
          <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
            {/* Front */}
            <div className="flashcard-face">
              <span className="badge badge-accent" style={{ marginBottom: 16 }}>IT Term</span>
              <div className="card-term">{c.term}</div>
              <div className="card-hint">Tap to reveal definition</div>
            </div>
            {/* Back */}
            <div className="flashcard-face back">
              <span className="badge badge-green" style={{ marginBottom: 16 }}>{c.term}</span>
              <div className="card-def">{c.definition}</div>
            </div>
          </div>
        </div>

        {flipped && (
          <div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
              How well did you know this?
            </p>
            <div className="rating-row">
              <button className="rating-btn rating-again" onClick={() => rate(0)}>
                ✗ Again<br /><span style={{ fontSize: 11, opacity: 0.7 }}>Didn't know</span>
              </button>
              <button className="rating-btn rating-hard" onClick={() => rate(1)}>
                ~ Hard<br /><span style={{ fontSize: 11, opacity: 0.7 }}>Struggled</span>
              </button>
              <button className="rating-btn rating-good" onClick={() => rate(2)}>
                ✓ Good<br /><span style={{ fontSize: 11, opacity: 0.7 }}>Knew it</span>
              </button>
              <button className="rating-btn rating-easy" onClick={() => rate(3)}>
                ★ Easy<br /><span style={{ fontSize: 11, opacity: 0.7 }}>Perfect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SimpleNav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <span className="nav-brand">QuizMaster</span>
        <Link href="/" className="btn-ghost">Dashboard</Link>
      </div>
    </nav>
  );
}
