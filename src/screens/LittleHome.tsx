import { useState } from 'preact/hooks';
import type { Chore, Kid } from '../types';
import { state, kidsName, choresFor, completeChore, completionFor, day, limitLeft, playableMinutes, startSession } from '../store';
import { go } from '../router';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Jar, Leaf, Star } from '../components/Art';
import { Sheet } from '../components/Controls';
import { SessionBanner } from '../components/Chrome';
import { speak } from '../lib/speech';
import { unlockAudio } from '../lib/sound';

/**
 * Home for ages ~3–6. No reading needed: big pictures, read-aloud buttons,
 * stars instead of minutes, and "helper" identity language.
 */
export function LittleHome({ kid }: { kid: Kid }) {
  const s = state.value;
  day.value; // re-render at midnight
  const chores = choresFor(s, kid.id);
  const stars = Math.floor(kid.readyMinutes / kid.minutesPerStar);
  const playable = playableMinutes(s, kid);
  const [cheer, setCheer] = useState<string | null>(null);
  const [playOpen, setPlayOpen] = useState(false);

  const onDone = (chore: Chore) => {
    const result = completeChore(kid.id, chore.id);
    if (!result) return;
    const msg =
      result === 'approved'
        ? `You're a super helper! A star for your jar!`
        : `You're a super helper! Let's show ${kidsName(s.parent)}.`;
    setCheer(msg);
    speak(msg);
    setTimeout(() => setCheer(null), 2600);
  };

  const greet = () => speak(`Hello ${kid.name}, little helper! You have ${stars} ${stars === 1 ? 'star' : 'stars'}.`);

  return (
    <main class="screen little">
      <header class="kid-head">
        <button class="plain" onClick={greet} aria-label="Say hello">
          <Avatar kind={kid.avatar} size={72} />
        </button>
        <h1 class="kid-title">
          Hello,
          <br />
          little helper!
        </h1>
        <button class="icon-btn" onClick={() => go('us')} aria-label="Switch person">
          <Icon name="gear" />
        </button>
      </header>

      <SessionBanner />

      <section class="jar-stage">
        <Jar count={stars} width={190} label={`${stars} stars in ${kid.name}'s jar`} />
        <p class="hand jar-note">
          Small acts make a happier home. ♡
        </p>
        <span class="spark s1" />
        <span class="spark s2" />
        <span class="spark s3" />
      </section>

      <button
        class="btn btn-play"
        disabled={playable <= 0 || !!s.session}
        onClick={() => {
          unlockAudio();
          setPlayOpen(true);
          speak('How many stars for play time?');
        }}
      >
        <Icon name="play" size={24} />
        {s.session
          ? 'Someone is playing'
          : limitLeft(s, kid) <= 0
            ? 'All done for today'
            : playable <= 0
              ? 'Help to fill your jar'
              : 'Play time!'}
      </button>

      {chores.length === 0 && <p class="note center">No chores yet. Ask {kidsName(s.parent)} to add some!</p>}
      <div class="chore-grid">
        {chores.map((c) => {
          const comp = completionFor(s, c, kid.id);
          const byOther = comp && comp.kidId !== kid.id ? s.kids.find((k) => k.id === comp.kidId) : null;
          return (
            <div class={`chore-card tint-${c.tint} ${comp ? comp.status : 'todo'}`}>
              <button
                class="chore-hit"
                disabled={!!comp}
                onClick={() => onDone(c)}
                aria-label={comp ? `${c.title}: done` : `I did it: ${c.title}`}
              >
                <span class="chore-art">{c.emoji}</span>
                <span class="chore-name">{c.title}</span>
              </button>
              <div class="chore-actions">
                {!comp && (
                  <button class="round-btn aub" onClick={() => speak(c.title)} aria-label={`Hear ${c.title}`}>
                    <Icon name="speaker" size={26} />
                  </button>
                )}
                {comp?.status === 'pending' && (
                  <>
                    <span class="round-btn stone" title="Waiting for a check">
                      <Icon name="hourglass" size={24} />
                    </span>
                    <span class="avatar" style={{ width: 44, height: 44, background: '#fff', fontSize: 26 }}>
                      {s.parent.avatar}
                    </span>
                  </>
                )}
                {comp?.status === 'approved' && (
                  <span class="done-pill">
                    {byOther ? <Avatar kind={byOther.avatar} size={28} /> : <Star size={26} />}
                    <Icon name="check" size={22} stroke={3} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Leaf class="corner-bl" />

      {cheer && (
        <div class="cheer" onClick={() => setCheer(null)} role="status">
          <div class="cheer-star">
            <Star size={140} />
          </div>
          <p>{cheer}</p>
        </div>
      )}

      <LittlePlaySheet kid={kid} open={playOpen} onClose={() => setPlayOpen(false)} />
    </main>
  );
}

function LittlePlaySheet({ kid, open, onClose }: { kid: Kid; open: boolean; onClose: () => void }) {
  const s = state.value;
  const playable = playableMinutes(s, kid);
  const maxStars = Math.max(1, Math.ceil(playable / kid.minutesPerStar));
  const available = Math.floor(kid.readyMinutes / kid.minutesPerStar);
  const [pick, setPick] = useState(1);
  const n = Math.min(pick, maxStars);
  const minutes = Math.min(n * kid.minutesPerStar, playable);

  return (
    <Sheet open={open} onClose={onClose} title="Play time!">
      <p class="center muted">Tap the stars you want to use.</p>
      <div class="star-picker">
        {Array.from({ length: Math.max(available, 1) }, (_, i) => (
          <button
            class={i < n ? 'on' : ''}
            disabled={i >= maxStars}
            onClick={() => {
              setPick(i + 1);
              speak(`${i + 1} ${i === 0 ? 'star' : 'stars'}`);
            }}
            aria-label={`${i + 1} stars`}
          >
            <Star size={48} dim={i >= n} />
          </button>
        ))}
      </div>
      <div class="play-preview">
        <div class="mini-ring" style={{ ['--p' as string]: `${Math.min(100, (minutes / 60) * 100)}%` }}>
          <span>🐰</span>
        </div>
        <span class="muted">{minutes} minutes</span>
      </div>
      {playable < available * kid.minutesPerStar && (
        <p class="note center">Some stars will wait in the jar for tomorrow.</p>
      )}
      <button
        class="btn btn-play wide"
        onClick={() => {
          startSession(kid.id, minutes);
          onClose();
          go('play');
        }}
      >
        <Icon name="play" size={24} /> Let's play!
      </button>
    </Sheet>
  );
}
