import { useEffect, useState } from 'preact/hooks';
import {
  state,
  elapsedOf,
  finishSession,
  kidById,
  markWarned,
  pauseSession,
  resumeSession,
  stopSession,
} from '../store';
import { go } from '../router';
import { Icon } from '../components/Icon';
import { Leaf } from '../components/Art';
import { FamilyGoalCard } from '../components/Chrome';
import { clock } from '../lib/util';
import { chime } from '../lib/sound';
import { speak } from '../lib/speech';

const R = 112;
const C = 2 * Math.PI * R;

/** Quadratic point along the sun-to-moon arc. */
const arc = (t: number) => {
  const [x0, y0, x1, y1, x2, y2] = [30, 64, 150, -6, 270, 64];
  const u = 1 - t;
  return [u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2];
};

export function Play() {
  const s = state.value;
  const session = s.session;
  const kid = session ? kidById(s, session.kidId) : null;
  const [now, setNow] = useState(Date.now());
  const [doneFor, setDoneFor] = useState<string | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Keep the screen on while the timer is visible.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
    return () => void lock?.release();
  }, []);

  const elapsed = elapsedOf(session, now);
  const remaining = session ? Math.max(0, session.totalSec - elapsed) : 0;

  useEffect(() => {
    if (!session || !kid) return;
    if (remaining <= 60 && !session.warned && session.totalSec > 120) {
      markWarned();
      speak(kid.mode === 'little' ? 'Almost time to finish. One more minute!' : 'One minute left.');
    }
    if (remaining <= 0) {
      chime();
      speak(kid.mode === 'little' ? `Play time is finished. Well done, ${kid.name}!` : 'Time is up. Nice one!');
      setDoneFor(kid.id);
      finishSession();
    }
  }, [remaining <= 0, remaining <= 60]);

  if (!session) {
    const k = kidById(s, doneFor);
    if (!k) {
      queueMicrotask(() => go('home'));
      return null;
    }
    return (
      <main class="screen play done">
        <h1 class="play-title">Time's up!</h1>
        <p class="muted center">Well played, {k.name}.</p>
        <div class="dial finished">
          <div class="dial-core">
            <span class="bunny awake">🐰</span>
          </div>
        </div>
        <p class="hand center big-hand">What shall we do next? A story, a walk, a helping hand?</p>
        <button class="btn btn-aub wide" onClick={() => go('home')}>
          Back home
        </button>
        <Leaf class="corner-bl" />
        <Leaf class="corner-br" flip />
      </main>
    );
  }

  const frac = session.totalSec ? remaining / session.totalSec : 0;
  const progress = 1 - frac;
  const paused = !session.runningSince;
  const little = kid?.mode === 'little';

  return (
    <main class="screen play">
      <Leaf class="corner-tl" />
      <h1 class="play-title">Time to play</h1>
      <p class="muted center">{paused ? 'Paused. Take a break!' : `Enjoy your time${kid ? `, ${kid.name}` : ''}!`}</p>

      <svg class="sky" viewBox="0 0 300 80" aria-hidden="true">
        <g transform="translate(30 64)">
          <circle r="11" fill="var(--butter)" />
          {Array.from({ length: 8 }, (_, i) => (
            <path d="M0 -16v-5" transform={`rotate(${i * 45})`} stroke="var(--butter)" stroke-width="3" stroke-linecap="round" />
          ))}
        </g>
        {Array.from({ length: 7 }, (_, i) => {
          const t = 0.14 + i * 0.12;
          const [x, y] = arc(t);
          return <circle cx={x} cy={y} r="4" fill={t <= progress ? 'var(--butter)' : 'var(--peri)'} />;
        })}
        <path d="M268 50a14 14 0 1 0 12 22 11 11 0 1 1-12-22z" fill="var(--peri-deep)" transform="translate(-4 -6)" />
      </svg>

      <div class={`dial ${paused ? 'paused' : ''}`}>
        <svg viewBox="0 0 260 260" aria-hidden="true">
          <circle cx="130" cy="130" r={R} fill="none" stroke="var(--peri-soft)" stroke-width="16" />
          <circle
            cx="130"
            cy="130"
            r={R}
            fill="none"
            stroke="var(--peri-deep)"
            stroke-width="16"
            stroke-linecap="round"
            stroke-dasharray={C}
            stroke-dashoffset={C * (1 - frac)}
            transform="rotate(-90 130 130)"
            class="dial-ring"
          />
        </svg>
        <div class="dial-core">
          <span class="bunny">🐰</span>
        </div>
      </div>

      <p class="time-left" aria-live="polite">
        {little ? (frac > 0.5 ? 'Lots of time left' : frac > 0.15 ? 'Some time left' : 'Nearly done') : `${clock(remaining)} left`}
      </p>

      <div class="play-controls">
        <button
          class="round-btn coral xl"
          onClick={() => (paused ? resumeSession() : pauseSession())}
          aria-label={paused ? 'Resume' : 'Pause'}
        >
          <Icon name={paused ? 'play' : 'pause'} size={40} />
        </button>
      </div>
      {confirmStop ? (
        <div class="confirm">
          <span>Finish early? Unused minutes go back.</span>
          <button class="btn btn-small btn-aub" onClick={() => { stopSession(); go('home'); }}>
            Finish
          </button>
          <button class="btn btn-small btn-outline" onClick={() => setConfirmStop(false)}>
            Keep playing
          </button>
        </div>
      ) : (
        <button class="link center-block" onClick={() => setConfirmStop(true)}>
          Finish early
        </button>
      )}

      <FamilyGoalCard compact />
      <Leaf class="corner-br" flip />
    </main>
  );
}
