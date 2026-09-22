import { useRef, useState } from 'preact/hooks';
import type { Chore, Kid, Mode, Tint } from '../types';
import {
  state,
  approve,
  choreById,
  kidById,
  notYet,
  patchKid,
  pendingList,
  removeChore,
  removeKid,
  exportBackup,
  importBackup,
  resetProgress,
  startOver,
  setGoal,
  setParent,
  upsertChore,
  upsertKid,
} from '../store';
import { activeKidId, go, parentUnlocked, showToast } from '../router';
import { AVATARS, Avatar, PARENT_AVATARS } from '../components/Avatar';
import { Icon, type IconName } from '../components/Icon';
import { Jar, Leaf, Star } from '../components/Art';
import { Field, KidsCallField, Segmented, Sheet, Stepper, Toggle } from '../components/Controls';
import { plural, uid } from '../lib/util';
import { defaultsFor, suggestionsFor } from '../suggestions';

export function Parent() {
  return parentUnlocked.value ? <ParentSpace /> : <PinGate />;
}

function PinGate() {
  const { pin } = state.value.parent;
  const [entry, setEntry] = useState('');
  const [wrong, setWrong] = useState(false);

  const press = (d: string) => {
    if (entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    setWrong(false);
    if (next.length === 4) {
      if (next === pin) {
        setTimeout(() => (parentUnlocked.value = true), 120);
      } else {
        setWrong(true);
        setTimeout(() => setEntry(''), 500);
      }
    }
  };

  return (
    <main class="screen pin">
      <span class="pin-lock">
        <Icon name="lock" size={30} />
      </span>
      <h1 class="play-title">Parent space</h1>
      <p class="muted center">Enter your PIN</p>
      <div class={`pin-dots ${wrong ? 'shake' : ''}`} aria-live="polite">
        {[0, 1, 2, 3].map((i) => (
          <span class={i < entry.length ? 'on' : ''} />
        ))}
      </div>
      <div class="keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button onClick={() => press(d)}>{d}</button>
        ))}
        <button class="ghost" onClick={() => go('us')} aria-label="Back">
          <Icon name="back" />
        </button>
        <button onClick={() => press('0')}>0</button>
        <button class="ghost" onClick={() => setEntry(entry.slice(0, -1))} aria-label="Delete">
          ⌫
        </button>
      </div>
      {state.value.demo && <p class="note center">The demo family's PIN is 1234.</p>}
    </main>
  );
}

type SheetId =
  | { t: 'kid'; kid: Kid }
  | { t: 'chores' }
  | { t: 'chore'; chore: Chore }
  | { t: 'limits' }
  | { t: 'trust' }
  | { t: 'goal' }
  | { t: 'settings' }
  | { t: 'why' };

function ParentSpace() {
  const s = state.value;
  const waiting = pendingList(s);
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const close = () => setSheet(null);

  const newKid = (): Kid => ({
    id: uid(),
    name: '',
    avatar: Object.keys(AVATARS).find((a) => !s.kids.some((k) => k.avatar === a)) ?? 'owl',
    age: 8,
    ...defaultsFor(8),
    trusted: false,
    readyMinutes: 0,
    savedMinutes: 0,
  });

  return (
    <main class="screen parent">
      <header class="kid-head">
        <span class="avatar" style={{ width: 60, height: 60, background: 'var(--coral-soft)', fontSize: 36 }}>
          {s.parent.avatar}
        </span>
        <div class="kid-head-text">
          <h1>Family overview</h1>
          <p class="muted">Support today. Brighter tomorrow.</p>
        </div>
        <button
          class="icon-btn"
          aria-label="Lock parent space"
          onClick={() => {
            parentUnlocked.value = false;
            go('us');
          }}
        >
          <Icon name="lock" />
        </button>
      </header>

      {s.demo && (
        <div class="card demo-banner">
          <b>You're exploring a demo family.</b>
          <span class="muted small">When you're ready, set up your own. Every jar starts empty.</span>
          <button
            class="btn btn-coral btn-small"
            onClick={() => {
              startOver();
              activeKidId.value = null;
              parentUnlocked.value = false;
            }}
          >
            Set up my family
          </button>
        </div>
      )}

      <section class="approve-card">
        <div class="approve-head">
          <b>Ready to approve</b>
          {waiting.length > 0 && <span class="count">{waiting.length}</span>}
        </div>
        {waiting.length === 0 ? (
          <p class="muted small">All caught up ✨</p>
        ) : (
          waiting.map((c) => {
            const kid = kidById(s, c.kidId);
            const chore = choreById(s, c.choreId);
            if (!kid || !chore) return null;
            return (
              <div class="approve-item">
                <Avatar kind={kid.avatar} size={44} />
                <div class="row-text">
                  <b>
                    {chore.emoji} {chore.title}
                  </b>
                  <small>
                    {kid.name} · {plural(chore.stars, 'star')}
                  </small>
                </div>
                <div class="approve-actions">
                  <button
                    class="btn btn-aub btn-small"
                    onClick={() => {
                      approve(c.id);
                      showToast(`${kid.name} earned ${plural(chore.stars, 'star')} ⭐`);
                    }}
                  >
                    Approve
                  </button>
                  <button class="link small" onClick={() => notYet(c.id)}>
                    Not yet
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      <h2 class="h-section">Child settings</h2>
      <div class="list">
        {s.kids.map((k) => (
          <button class="card row" onClick={() => setSheet({ t: 'kid', kid: k })}>
            <Avatar kind={k.avatar} size={44} />
            <span class="row-text">
              <b>{k.name}</b>
              <small>
                1 star = {k.minutesPerStar} min · {k.mode === 'little' ? 'Little helper' : 'Growing up'}
              </small>
            </span>
            <Icon name="chevron" size={20} />
          </button>
        ))}
        <button class="card row dashed" onClick={() => setSheet({ t: 'kid', kid: newKid() })}>
          <span class="row-icon">
            <Icon name="plus" />
          </span>
          <span class="row-text">
            <b>Add a child</b>
          </span>
        </button>
      </div>

      <div class="list">
        <SettingRow icon="list" label="Chores" onClick={() => setSheet({ t: 'chores' })} />
        <SettingRow icon="sliders" label="Daily limits" onClick={() => setSheet({ t: 'limits' })} />
        <SettingRow icon="shield" label="Trust settings" onClick={() => setSheet({ t: 'trust' })} />
        <SettingRow icon="user" label="Parent settings" onClick={() => setSheet({ t: 'settings' })} />
        <SettingRow icon="book" label="Why Talli works" onClick={() => setSheet({ t: 'why' })} />
      </div>

      <div class="info-note">
        <Icon name="info" size={20} />
        <span>Saved time still follows daily limits.</span>
      </div>

      <button class="card goal-card" onClick={() => setSheet({ t: 'goal' })}>
        <Jar count={Math.min(s.goal.stars, 6)} width={70} />
        <div class="goal-body">
          <div class="goal-title">{s.goal.title}</div>
          <div class="bar">
            <span style={{ width: `${Math.min(100, (s.goal.stars / s.goal.target) * 100)}%` }} />
          </div>
          <div class="small strong">
            {Math.min(s.goal.stars, s.goal.target)} / {s.goal.target} stars
          </div>
        </div>
        <span class="goal-heart">
          <Icon name="heart" size={22} />
        </span>
      </button>

      <Leaf class="corner-br" flip />

      {sheet?.t === 'kid' && <KidEditor kid={sheet.kid} onClose={close} />}
      {sheet?.t === 'chores' && <ChoresSheet onClose={close} onEdit={(chore) => setSheet({ t: 'chore', chore })} />}
      {sheet?.t === 'chore' && <ChoreEditor chore={sheet.chore} onClose={() => setSheet({ t: 'chores' })} />}
      {sheet?.t === 'limits' && <LimitsSheet onClose={close} />}
      {sheet?.t === 'trust' && <TrustSheet onClose={close} />}
      {sheet?.t === 'goal' && <GoalSheet onClose={close} />}
      {sheet?.t === 'settings' && <SettingsSheet onClose={close} />}
      {sheet?.t === 'why' && <WhySheet onClose={close} />}
    </main>
  );
}

function SettingRow({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button class="card row setting" onClick={onClick}>
      <span class="row-icon">
        <Icon name={icon} />
      </span>
      <span class="row-text">
        <b>{label}</b>
      </span>
      <Icon name="chevron" size={20} />
    </button>
  );
}

function KidEditor({ kid, onClose }: { kid: Kid; onClose: () => void }) {
  const exists = !!kidById(state.value, kid.id);
  const [k, setK] = useState(kid);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (patch: Partial<Kid>) => setK({ ...k, ...patch });

  return (
    <Sheet open onClose={onClose} title={exists ? `${kid.name}'s settings` : 'Add a child'}>
      <Field label="Name">
        <input class="input" value={k.name} placeholder="First name" onInput={(e) => set({ name: e.currentTarget.value })} />
      </Field>
      <Field label="Avatar">
        <div class="avatar-pick">
          {Object.keys(AVATARS).map((a) => (
            <button class={a === k.avatar ? 'on' : ''} onClick={() => set({ avatar: a })} aria-label={a}>
              <Avatar kind={a} size={46} />
            </button>
          ))}
        </div>
      </Field>
      <Field label="Age">
        <Stepper
          label="age"
          value={k.age ?? (k.mode === 'little' ? 4 : 9)}
          min={2}
          max={16}
          onChange={(age) => set(exists ? { age } : { age, ...defaultsFor(age) })}
          format={(v) => `${v} years`}
        />
      </Field>
      <Field label="Layout" hint="Little helper is picture-first and needs no reading">
        <Segmented<Mode>
          options={[
            { value: 'little', label: 'Little helper · 3–6' },
            { value: 'big', label: 'Growing up · 7+' },
          ]}
          value={k.mode}
          onChange={(mode) => set({ mode })}
        />
      </Field>
      <Field label="Each star is worth">
        <Stepper label="minutes per star" value={k.minutesPerStar} min={1} max={30} onChange={(v) => set({ minutesPerStar: v })} format={(v) => `${v} min`} />
      </Field>
      <Field label="Daily play limit" hint="Earning more never goes past this">
        <Stepper label="daily limit" value={k.dailyLimit} min={15} max={240} step={15} onChange={(v) => set({ dailyLimit: v })} format={(v) => `${v} min`} />
      </Field>
      <Field label="Ready time" hint="Adjust by hand if needed">
        <Stepper label="ready minutes" value={k.readyMinutes} min={0} max={600} step={5} onChange={(v) => set({ readyMinutes: v })} format={(v) => `${v} min`} />
      </Field>
      <div class="field row-between">
        <div class="field-label">
          <span>Trust mode</span>
          <small>Chores count straight away, with no check needed</small>
        </div>
        <Toggle label="Trust mode" checked={k.trusted} onChange={(trusted) => set({ trusted })} />
      </div>
      <button
        class="btn btn-aub wide"
        disabled={!k.name.trim()}
        onClick={() => {
          upsertKid({ ...k, name: k.name.trim() });
          if (!exists) {
            // Start new kids with a few chores that suit their age.
            for (const c of suggestionsFor(k.age ?? 8).slice(0, 4)) upsertChore({ ...c, id: uid(), assignee: k.id });
          }
          showToast(exists ? 'Saved' : `Welcome, ${k.name.trim()}! We added a few starter chores.`);
          onClose();
        }}
      >
        {exists ? 'Save' : 'Add child'}
      </button>
      {exists &&
        (confirmDelete ? (
          <div class="confirm">
            <span>Remove {kid.name} and their chores?</span>
            <button
              class="btn btn-small btn-coral"
              onClick={() => {
                removeKid(kid.id);
                if (activeKidId.value === kid.id) activeKidId.value = null;
                onClose();
              }}
            >
              Remove
            </button>
            <button class="btn btn-small btn-outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button class="link danger center-block" onClick={() => setConfirmDelete(true)}>
            Remove child
          </button>
        ))}
    </Sheet>
  );
}

function ChoresSheet({ onClose, onEdit }: { onClose: () => void; onEdit: (c: Chore) => void }) {
  const s = state.value;
  const groups = [
    ...s.kids.map((k) => ({ id: k.id, label: k.name, avatar: k.avatar })),
    { id: 'shared', label: 'Anyone', avatar: '' },
  ];
  return (
    <Sheet open onClose={onClose} title="Chores">
      <p class="note">Tip: pick chores that match each age, so the effort feels fair even when the tasks are different.</p>
      {groups.map((g) => {
        const list = s.chores.filter((c) => c.assignee === g.id);
        return (
          <div class="chore-group">
            <div class="chore-group-head">
              {g.avatar ? <Avatar kind={g.avatar} size={28} /> : <Icon name="users" size={20} />}
              <b>{g.label}</b>
            </div>
            {list.length === 0 && <p class="muted small">No chores yet.</p>}
            {list.map((c) => (
              <button class="card row compact" onClick={() => onEdit(c)}>
                <span class={`chore-tile small tint-${c.tint}`}>{c.emoji}</span>
                <span class="row-text">
                  <b>{c.title}</b>
                  <small>{plural(c.stars, 'star')}</small>
                </span>
                <Icon name="chevron" size={18} />
              </button>
            ))}
          </div>
        );
      })}
      <button
        class="btn btn-aub wide"
        onClick={() =>
          onEdit({ id: uid(), title: '', emoji: '🧹', stars: 1, tint: 'butter', assignee: s.kids[0]?.id ?? 'shared' })
        }
      >
        <Icon name="plus" size={20} /> Add chore
      </button>
    </Sheet>
  );
}

const EMOJIS = ['🛏️', '🧸', '👟', '🪥', '🍽️', '🪴', '♻️', '🥪', '🐱', '🐶', '🧺', '🧹', '🧽', '🗑️', '📚', '🎒', '🧦', '🚿', '🥕', '🌱', '🛁', '🍳', '🚗', '💌'];
const TINTS: Tint[] = ['butter', 'coral', 'peri', 'sage'];

function ChoreEditor({ chore, onClose }: { chore: Chore; onClose: () => void }) {
  const s = state.value;
  const exists = !!choreById(s, chore.id);
  const [c, setC] = useState(chore);
  const set = (patch: Partial<Chore>) => setC({ ...c, ...patch });

  return (
    <Sheet open onClose={onClose} title={exists ? 'Edit chore' : 'New chore'}>
      <div class={`chore-hero tint-${c.tint}`}>{c.emoji}</div>
      <Field label="What's the chore?" hint="Kids hear this read aloud, so keep it short">
        <input class="input" value={c.title} placeholder="e.g. Feed the dog" onInput={(e) => set({ title: e.currentTarget.value })} />
      </Field>
      <Field label="Picture">
        <div class="emoji-pick">
          {EMOJIS.map((e) => (
            <button class={e === c.emoji ? 'on' : ''} onClick={() => set({ emoji: e })}>
              {e}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Colour">
        <div class="tint-pick">
          {TINTS.map((t) => (
            <button class={`tint-${t} ${t === c.tint ? 'on' : ''}`} onClick={() => set({ tint: t })} aria-label={t} />
          ))}
        </div>
      </Field>
      <Field label="Stars">
        <div class="star-count">
          {[1, 2, 3].map((n) => (
            <button class={n === c.stars ? 'on' : ''} onClick={() => set({ stars: n })} aria-label={`${n} stars`}>
              {Array.from({ length: n }, () => (
                <Star size={18} />
              ))}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Who's it for?">
        <div class="assign-pick">
          {s.kids.map((k) => (
            <button class={c.assignee === k.id ? 'on' : ''} onClick={() => set({ assignee: k.id })}>
              <Avatar kind={k.avatar} size={28} /> {k.name}
            </button>
          ))}
          <button class={c.assignee === 'shared' ? 'on' : ''} onClick={() => set({ assignee: 'shared' })}>
            <Icon name="users" size={20} /> Anyone
          </button>
        </div>
      </Field>
      <button
        class="btn btn-aub wide"
        disabled={!c.title.trim()}
        onClick={() => {
          upsertChore({ ...c, title: c.title.trim() });
          onClose();
        }}
      >
        {exists ? 'Save' : 'Add chore'}
      </button>
      {exists && (
        <button
          class="link danger center-block"
          onClick={() => {
            removeChore(c.id);
            onClose();
          }}
        >
          Delete chore
        </button>
      )}
    </Sheet>
  );
}

function LimitsSheet({ onClose }: { onClose: () => void }) {
  const s = state.value;
  return (
    <Sheet open onClose={onClose} title="Daily limits">
      <p class="note">
        Talli never lets earned time go past the daily limit. The American Academy of Pediatrics suggests about 1 hour a day
        of quality screen time for ages 2–5, and a consistent family plan for older kids.
      </p>
      {s.kids.map((k) => (
        <div class="field row-between">
          <div class="field-label with-avatar">
            <Avatar kind={k.avatar} size={36} />
            <span>{k.name}</span>
          </div>
          <Stepper label={`${k.name} daily limit`} value={k.dailyLimit} min={15} max={240} step={15} onChange={(v) => patchKid(k.id, { dailyLimit: v })} format={(v) => `${v} min`} />
        </div>
      ))}
    </Sheet>
  );
}

function TrustSheet({ onClose }: { onClose: () => void }) {
  const s = state.value;
  return (
    <Sheet open onClose={onClose} title="Trust settings">
      <p class="note">
        Trusted kids' chores count straight away. It's a good step up for older kids who want more independence. You can
        always switch it back.
      </p>
      {s.kids.map((k) => (
        <div class="field row-between">
          <div class="field-label with-avatar">
            <Avatar kind={k.avatar} size={36} />
            <span>
              {k.name}
              <small>{k.trusted ? 'Chores count straight away' : 'You check each chore'}</small>
            </span>
          </div>
          <Toggle label={`Trust ${k.name}`} checked={k.trusted} onChange={(trusted) => patchKid(k.id, { trusted })} />
        </div>
      ))}
    </Sheet>
  );
}

const GOAL_EMOJIS = ['🎬', '🍕', '🏞️', '🎳', '🍦', '🏊', '🎨', '🧁', '🎲', '⛺'];

function GoalSheet({ onClose }: { onClose: () => void }) {
  const goal = state.value.goal;
  const [g, setG] = useState(goal);
  return (
    <Sheet open onClose={onClose} title="Family goal">
      <p class="note">A shared reward gives siblings a reason to cheer each other on instead of competing.</p>
      <Field label="What are you working towards?">
        <input class="input" value={g.title} onInput={(e) => setG({ ...g, title: e.currentTarget.value })} />
      </Field>
      <Field label="Picture">
        <div class="emoji-pick">
          {GOAL_EMOJIS.map((e) => (
            <button class={e === g.emoji ? 'on' : ''} onClick={() => setG({ ...g, emoji: e })}>
              {e}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Stars needed" hint={`${goal.stars} collected so far`}>
        <Stepper label="stars needed" value={g.target} min={5} max={200} step={5} onChange={(target) => setG({ ...g, target })} />
      </Field>
      <button
        class="btn btn-aub wide"
        disabled={!g.title.trim()}
        onClick={() => {
          setGoal({ ...g, stars: goal.stars, title: g.title.trim() });
          onClose();
        }}
      >
        Save
      </button>
      <button
        class="btn btn-outline wide"
        onClick={() => {
          setGoal({ ...g, title: g.title.trim() || goal.title, stars: 0 });
          showToast('New goal started. Here we go!');
          onClose();
        }}
      >
        Start again from 0 stars
      </button>
    </Sheet>
  );
}

function SettingsSheet({ onClose }: { onClose: () => void }) {
  const parent = state.value.parent;
  const [p, setP] = useState(parent);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState<null | 'progress' | 'all'>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pinOk = pin === '' || /^\d{4}$/.test(pin);

  return (
    <Sheet open onClose={onClose} title="Parent settings">
      <Field label="Your name" hint="For the grown-up screens">
        <input class="input" value={p.name} onInput={(e) => setP({ ...p, name: e.currentTarget.value })} />
      </Field>
      <KidsCallField value={p.kidsCall ?? ''} onChange={(kidsCall) => setP({ ...p, kidsCall })} />
      <Field label="Your avatar">
        <div class="emoji-pick">
          {PARENT_AVATARS.map((a) => (
            <button class={a === p.avatar ? 'on' : ''} onClick={() => setP({ ...p, avatar: a })}>
              {a}
            </button>
          ))}
        </div>
      </Field>
      <Field label="New PIN" hint="4 digits; leave blank to keep the current one">
        <input
          class="input"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onInput={(e) => setPin(e.currentTarget.value.replace(/\D/g, ''))}
          placeholder="••••"
        />
      </Field>
      <button
        class="btn btn-aub wide"
        disabled={!pinOk || !p.name.trim()}
        onClick={() => {
          setParent({ ...p, name: p.name.trim(), kidsCall: p.kidsCall?.trim(), pin: pin || parent.pin });
          showToast(pin ? 'Saved, with your new PIN' : 'Saved');
          onClose();
        }}
      >
        Save
      </button>
      <h3 class="sheet-sub">Your data</h3>
      <p class="note">
        Talli keeps everything on this device. Save a backup now and then, especially before clearing your browser or
        switching phones.
      </p>
      <div class="btn-pair">
        <button class="btn btn-outline btn-small" onClick={exportBackup}>
          Save a backup
        </button>
        <button class="btn btn-outline btn-small" onClick={() => fileRef.current?.click()}>
          Restore backup
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.currentTarget.files?.[0];
          if (!f) return;
          if (importBackup(await f.text())) {
            showToast('Family restored');
            activeKidId.value = null;
            onClose();
          } else {
            showToast("That file doesn't look like a Talli backup");
          }
        }}
      />

      {confirm === 'progress' && (
        <div class="confirm">
          <span>Empty every jar and balance? Your family, chores and settings stay.</span>
          <button
            class="btn btn-small btn-coral"
            onClick={() => {
              resetProgress();
              showToast('All jars emptied. A fresh start!');
              onClose();
            }}
          >
            Empty jars
          </button>
          <button class="btn btn-small btn-outline" onClick={() => setConfirm(null)}>
            Cancel
          </button>
        </div>
      )}
      {confirm === 'all' && (
        <div class="confirm">
          <span>Delete this family completely and start setup again? This can't be undone without a backup.</span>
          <button
            class="btn btn-small btn-coral"
            onClick={() => {
              startOver();
              activeKidId.value = null;
              parentUnlocked.value = false;
            }}
          >
            Start over
          </button>
          <button class="btn btn-small btn-outline" onClick={() => setConfirm(null)}>
            Cancel
          </button>
        </div>
      )}
      {!confirm && (
        <div class="danger-links">
          <button class="link danger" onClick={() => setConfirm('progress')}>
            Reset stars &amp; time
          </button>
          <button class="link danger" onClick={() => setConfirm('all')}>
            Start over
          </button>
        </div>
      )}
    </Sheet>
  );
}

function WhySheet({ onClose }: { onClose: () => void }) {
  const points: [string, string][] = [
    ['Rewards straight away', 'Token systems work best when the reward is immediate, clear and consistent, so stars land the moment a chore is done.'],
    ['Helper, not job', 'Children aged 3–6 help more when invited to “be a helper” than to “help” (Bryan et al., 2014). Talli uses who-you-are words.'],
    ['Pictures before numbers', 'Four-year-olds can’t yet picture “20 minutes”. Little helpers see stars and a shrinking ring, never digits.'],
    ['Choice builds motivation', 'Self-Determination Theory: autonomy, competence and connection. Older kids choose chores and plan their saved time.'],
    ['A cap keeps it healthy', 'More chores never means unlimited screens. Daily limits follow American Academy of Pediatrics guidance.'],
    ['Together, not against', 'There are no leaderboards. Every star fills one family jar, so siblings cheer instead of compete.'],
    ['Nothing taken away', '“Not yet” just puts a chore back. Earned time is never removed as a punishment.'],
  ];
  return (
    <Sheet open onClose={onClose} title="Why Talli works">
      <ol class="why">
        {points.map(([h, p]) => (
          <li>
            <b>{h}</b>
            <span>{p}</span>
          </li>
        ))}
      </ol>
    </Sheet>
  );
}
