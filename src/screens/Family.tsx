import { state, choreById, kidById } from '../store';
import { Avatar } from '../components/Avatar';
import { Jar, Leaf } from '../components/Art';
import { SessionBanner } from '../components/Chrome';
import { timeAgo } from '../lib/util';

/** The shared goal: cooperation, not competition. No leaderboards. */
export function Family() {
  const s = state.value;
  const { goal } = s;
  const reached = goal.stars >= goal.target;
  const pct = Math.min(100, Math.round((goal.stars / goal.target) * 100));
  const weekAgo = Date.now() - 7 * 864e5;
  const feed = s.completions
    .filter((c) => c.status === 'approved' && c.at > weekAgo)
    .sort((a, b) => b.at - a.at)
    .slice(0, 12);

  return (
    <main class="screen family">
      <Leaf class="corner-tr" flip />
      <h1 class="play-title">Together</h1>
      <p class="muted center">Every star anyone earns fills the family jar.</p>

      <SessionBanner />

      <section class="family-jar">
        <Jar count={goal.stars} width={200} label={`${goal.stars} of ${goal.target} family stars`} />
        <div class="family-goal">
          <span class="goal-emoji">{goal.emoji}</span>
          <h2>{goal.title}</h2>
          <div class="bar big" role="progressbar" aria-valuenow={goal.stars} aria-valuemax={goal.target}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <p class="strong">
            {Math.min(goal.stars, goal.target)} / {goal.target} stars
          </p>
        </div>
      </section>

      {reached && (
        <div class="card celebrate">
          <b>You did it together! 🎉</b>
          <span>Time for {goal.title.toLowerCase()}.</span>
        </div>
      )}

      <div class="team">
        <div class="team-avatars">
          {s.kids.map((k) => (
            <Avatar kind={k.avatar} size={52} ring />
          ))}
          <span class="avatar ring" style={{ width: 52, height: 52, background: 'var(--coral-soft)', fontSize: 30 }}>
            {s.parent.avatar}
          </span>
        </div>
        <p class="hand">Kinder, brighter, braver, together ♡</p>
      </div>

      <h2 class="h-section">Kind acts this week</h2>
      {feed.length === 0 ? (
        <p class="muted">Nothing yet this week. Who'll be first?</p>
      ) : (
        <ul class="feed">
          {feed.map((c) => {
            const kid = kidById(s, c.kidId);
            const chore = choreById(s, c.choreId);
            if (!kid || !chore) return null;
            return (
              <li>
                <Avatar kind={kid.avatar} size={36} />
                <span>
                  <b>{kid.name}</b>: {chore.title.replace(/\bmy\b/i, 'their')}
                </span>
                <small>{timeAgo(c.at)}</small>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
