// SM-2 Spaced Repetition Algorithm
// quality: 0-2 = fail, 3-5 = pass (we use 0=fail, 1=hard, 2=good, 3=easy)

export function getNextReview(card, quality) {
  // Map our 0-3 to SM2's 0-5
  const q = quality === 0 ? 1 : quality === 1 ? 3 : quality === 2 ? 4 : 5;

  let { interval = 0, repetitions = 0, easeFactor = 2.5 } = card;

  if (q < 3) {
    // Failed - reset
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    repetitions += 1;
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { interval, repetitions, easeFactor, nextReview: nextReview.toISOString(), lastQuality: quality };
}

export function isDue(card) {
  if (!card.nextReview) return true;
  return new Date(card.nextReview) <= new Date();
}

export function getDueCount(cards) {
  return cards.filter(isDue).length;
}

export function sortByPriority(cards) {
  return [...cards].sort((a, b) => {
    const aDue = isDue(a);
    const bDue = isDue(b);
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    // Both due: show weakest first (lowest ease, most failures)
    return (a.easeFactor || 2.5) - (b.easeFactor || 2.5);
  });
}
