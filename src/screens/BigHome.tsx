import { useState } from 'preact/hooks';
import type { Chore, Kid } from '../types';
import {
  state,
  choresFor,
  completeChore,
  completionFor,
  day,
  limitLeft,
  playableMinutes,
  saveTime,
  startSession,
  usedToday,
} from '../store';
import { go, showToast } from '../router';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Chips, Sheet } from '../components/Controls';
import { FamilyGoalCard, SessionBanner } from '../components/Chrome';
import { plural } from '../lib/util';
import { unlockAudio } from '../lib/sound';

/** Home for ages ~7+: minutes, saving up, and choosing how to help. */
export function BigHome({ kid }: { kid: Kid }) {
  const s = state.value;
  day.value; // re-render at midnight
  const chores = choresFor(s, kid.id);
  const [sheet, setSheet] = useState<null | 'use' | 'save' | Chore>(null);
  const used = usedToday(s, kid.id);

  return (
    <main class="screen big">
      <header class="kid-head">
        <Avatar kind={kid.avatar} size={64} />
        <div class="kid-head-text">
          <h1>Hey, {kid.name}</h1>
          <p class="muted">Small actions. A bigger you.</p>
        </div>
        <button class="icon-btn" onClick={() => go('us')} aria-label="Switch person">
          <Icon name="gear" />
        </button>
      </header>

      <SessionBanner />

      <section class="balance">
        <div class="balance-row">
          <div class="balance-ready">
            <strong>{kid.readyMinutes} min</strong>
            <span>ready</span>
          </div>
          <div class="balance-saved">
            <strong>{kid.savedMinutes} min</strong>
            <span>saved</span>
          </div>
        </div>
        <div class="balance-limit">
          Daily play limit: {kid.dailyLimit} min
          {used > 0 && <span class="muted"> · {limitLeft(s, kid)} left today</span>}
        </div>
      </section>

      <div class="btn-pair">
        <button
          class="btn btn-aub"
          disabled={playableMinutes(s, kid) <= 0 || !!s.session}
          onClick={() => {
            unlockAudio();
            setSheet('use');
          }}
        >
          Use time
        </button>
        <button class="btn btn-outline" disabled={kid.readyMinutes <= 0} onClick={() => setSheet('save')}>
          Save time
        </button>
      </div>

      <h2 class="h-section">Choose a way to help</h2>
      <div class="list">
        {chores.map((c) => {
          const comp = completionFor(s, c, kid.id);
          const byOther = comp && comp.kidId !== kid.id ? s.kids.find((k) => k.id === comp.kidId) : null;
          return (
            <button class={`card row chore-row ${comp ? comp.status : ''}`} onClick={() => setSheet(c)}>
              <span class={`chore-tile tint-${c.tint}`}>{c.emoji}</span>
              <span class="row-text">
                <b>{c.title}</b>
                <small>
                  {comp?.status === 'pending'
                    ? `Waiting for ${s.parent.name}`
                    : comp?.status === 'approved'
                      ? byOther
                        ? `Done by ${byOther.name}. Thanks!`
                        : 'Done. Thank you!'
                      : `+${plural(c.stars, 'star')}${c.assignee === 'shared' ? ' · anyone' : ''}`}
                </small>
              </span>
              {comp?.status === 'approved' ? (
                <span class="tick">
                  <Icon name="check" size={18} stroke={3} />
                </span>
              ) : comp?.status === 'pending' ? (
                <Icon name="hourglass" size={20} />
              ) : (
                <Icon name="chevron" size={20} />
              )}
            </button>
          );
        })}
      </div>

      <FamilyGoalCard />

      <UseSheet kid={kid} open={sheet === 'use'} onClose={() => setSheet(null)} />
      <SaveSheet kid={kid} open={sheet === 'save'} onClose={() => setSheet(null)} />
      {sheet && typeof sheet === 'object' && <ChoreSheet kid={kid} chore={sheet} onClose={() => setSheet(null)} />}
    </main>
  );
}

const USE_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

function UseSheet({ kid, open, onClose }: { kid: Kid; open: boolean; onClose: () => void }) {
  const s = state.value;
  const playable = playableMinutes(s, kid);
  const options = USE_OPTIONS.filter((m) => m < playable);
  if (playable > 0) options.push(playable);
  const [pick, setPick] = useState(0);
  const minutes = options.includes(pick) ? pick : options.filter((m) => m <= 30).pop() ?? playable;
  const capped = limitLeft(s, kid) < kid.readyMinutes + kid.savedMinutes;

  return (
    <Sheet open={open} onClose={onClose} title="How long?">
      <Chips options={options} value={minutes} onChange={setPick} />
      <p class="note">
        {capped
          ? `You can play ${playable} more minutes today. The rest stays safe for tomorrow.`
          : 'Uses ready time first, then saved time.'}
      </p>
      <button
        class="btn btn-aub wide"
        onClick={() => {
          startSession(kid.id, minutes);
          onClose();
          go('play');
        }}
      >
        <Icon name="play" size={20} /> Start {minutes} min
      </button>
    </Sheet>
  );
}

function SaveSheet({ kid, open, onClose }: { kid: Kid; open: boolean; onClose: () => void }) {
  const options = [5, 10, 15, 20, 30].filter((m) => m < kid.readyMinutes);
  if (kid.readyMinutes > 0) options.push(kid.readyMinutes);
  const [pick, setPick] = useState(0);
  const minutes = options.includes(pick) ? pick : options[options.length - 1] ?? 0;

  return (
    <Sheet open={open} onClose={onClose} title="Save for later">
      <Chips options={options} value={minutes} onChange={setPick} />
      <p class="note">Saved time waits for you, which is great for a weekend film. It still follows the daily limit.</p>
      <button
        class="btn btn-outline wide"
        onClick={() => {
          saveTime(kid.id, minutes);
          showToast(`Saved ${minutes} min. Nice planning!`);
          onClose();
        }}
      >
        Save {minutes} min
      </button>
    </Sheet>
  );
}

function ChoreSheet({ kid, chore, onClose }: { kid: Kid; chore: Chore; onClose: () => void }) {
  const s = state.value;
  const comp = completionFor(s, chore, kid.id);
  return (
    <Sheet open onClose={onClose} title={chore.title}>
      <div class={`chore-hero tint-${chore.tint}`}>{chore.emoji}</div>
      <p class="center">
        <b>+{plural(chore.stars, 'star')}</b>
        <span class="muted"> = {chore.stars * kid.minutesPerStar} min of play</span>
      </p>
      {comp ? (
        <p class="note center">
          {comp.status === 'pending' ? `Waiting for ${s.parent.name} to check ✨` : 'Already done today. Thank you!'}
        </p>
      ) : (
        <button
          class="btn btn-aub wide"
          onClick={() => {
            const r = completeChore(kid.id, chore.id);
            showToast(
              r === 'approved'
                ? `Nice work, ${kid.name}! +${chore.stars * kid.minutesPerStar} min`
                : `Nice work, ${kid.name}! Sent to ${s.parent.name} to check.`,
            );
            onClose();
          }}
        >
          <Icon name="check" size={20} stroke={3} /> I did it!
        </button>
      )}
    </Sheet>
  );
}
