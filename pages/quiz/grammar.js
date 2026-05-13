import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { grammarQuestions } from '../../lib/data';
import { getNextReview, isDue, sortByPriority } from '../../lib/srs';

export default function GrammarQuiz({ user, loading }) {
  const router = useRouter();
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, total: 0 });
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
    const { data } = await supabase.from('progress').select('*').eq('user_id', user.id).like('card_id', 'g%');
    const map = {};
    (data || []).forEach(p => { map[p.card_id] = { ...p, easeFactor: p.ease_factor }; });
    setProgressMap(map);

    // Build queue: due cards first, then new cards
    const withProgress = grammarQuestions.map(q => ({
      ...q,
      ...(map[q.id] || {}),
      easeFactor: map[q.id]?.ease_factor || 2.5,
    }));

    const due = withProgress.filter(q => isDue({ ...map[q.id], nextReview: map[q.id]?.next_review }));
    const sorted = sortByPriority(due.map(q => ({ ...q, nextReview: map[q.id]?.next_review })));

    // If no due cards, show all (practice mode)
    const finalQueue = sorted.length > 0 ? sorted : [...grammarQuestions].sort(() => Math.random() - 0.5).slice(0, 20);
    setQueue(finalQueue);
    setLoadingData(false);
  }

  async function handleSelect(optIdx) {
    if (selected !== null) return;
    setSelected(optIdx);
    const q = queue[currentIdx];
    const correct = optIdx === q.answer;

    // SM-2 quality: correct=3 (good), wrong=0 (again)
    const quality = correct ? 2 : 0;
    const existing = progressMap[q.id] || {};
    const next = getNextReview({
      interval: existing.interval || 0,
      repetitions: existing.repetitions || 0,
      easeFactor: existing.ease_factor || 2.5,
    }, quality);

    // Save to DB
    await supabase.from('progress').upsert({
      user_id: user.id,
      card_id: q.id,
      card_type: 'grammar',
      interval: next.interval,
      repetitions: next.repetitions,
      ease_factor: next.easeFactor,
      next_review: next.nextReview,
      last_reviewed: new Date().toISOString(),
      last_quality: quality,
    }, { onConflict: 'user_id,card_id' });

    setSessionStats(s => ({
      correct: s.correct + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1),
      total: s.total + 1,
    }));
  }

  function next() {
    if (currentIdx + 1 >= queue.length) {
      setDone(true);
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
    }
  }

  if (loading || !user || loadingData) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (done || queue.length === 0) {
    return (
      <div className="page">
        <SimpleNav />
        <div className="quiz-wrap">
          <div className="session-end">
            <div className="score-big">{sessionStats.correct}/{sessionStats.total}</div>
            <h2>{sessionStats.correct === sessionStats.total ? 'Perfect! 🎉' : 'Session complete!'}</h2>
            <p>{sessionStats.correct} correct · {sessionStats.wrong} to review again</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => { setDone(false); setCurrentIdx(0); setSelected(null); setSessionStats({ correct: 0, wrong: 0, total: 0 }); loadAndBuild(); }}>Study Again</button>
              <Link href="/" className="btn btn-secondary btn-lg">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = queue[currentIdx];
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="page">
      <SimpleNav />
      <div className="quiz-wrap">
        <div className="quiz-top">
          <Link href="/" className="btn btn-secondary btn-sm">← Back</Link>
          <div className="quiz-progress">
            <div className="quiz-progress-label">
              <span>Question {currentIdx + 1} of {queue.length}</span>
              <span style={{ color: 'var(--green)' }}>{sessionStats.correct} correct</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(currentIdx / queue.length) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="quiz-card">
          <div className="quiz-category">{q.category}</div>
          <div className="quiz-question">{q.question}</div>
          <div className="options-grid">
            {q.options.map((opt, i) => {
              let cls = 'opt-btn';
              if (selected !== null) {
                if (i === q.answer) cls += ' correct';
                else if (i === selected && selected !== q.answer) cls += ' wrong';
              }
              return (
                <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={selected !== null}>
                  <span style={{ opacity: 0.5, marginRight: 8, fontSize: 12 }}>{letters[i]}</span>{opt}
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <div className={`feedback-box ${selected === q.answer ? 'correct' : 'wrong'}`}>
              {selected === q.answer
                ? '✓ Correct!'
                : `✗ The answer is: ${q.options[q.answer]}`}
            </div>
          )}
        </div>

        {selected !== null && (
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={next}>
              {currentIdx + 1 >= queue.length ? 'See Results →' : 'Next →'}
            </button>
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
