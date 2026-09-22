import { useRef, useState } from 'preact/hooks';
import type { Chore, Kid } from '../types';
import { completeSetup, importBackup, loadDemo } from '../store';
import { activeKidId, go, showToast } from '../router';
import { AVATARS, Avatar, PARENT_AVATARS } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Leaf, Logo, Star } from '../components/Art';
import { Field, Stepper } from '../components/Controls';
import { defaultsFor, suggestionsFor, type Suggestion } from '../suggestions';
import { uid } from '../lib/util';

interface DraftKid {
  id: string;
  name: string;
  age: number;
  avatar: string;
  chores: Suggestion[];
}

const GOAL_EMOJIS = ['🎬', '🍕', '🏞️', '🎳', '🍦', '🏊', '🎨', '🧁', '🎲', '⛺'];
const STEPS = ['welcome', 'you', 'kids', 'chores', 'goal', 'done'] as const;

/** First-run setup: the parent adds their own family, starting from zero. */
export function Setup() {
  const [step, setStep] = useState(0);
  const [parent, setParent] = useState({ name: '', avatar: '👩', pin: '' });
  const [kids, setKids] = useState<DraftKid[]>([]);
  const [goal, setGoal] = useState({ title: 'Family movie night', emoji: '🎬', target: 30 });
  const fileRef = useRef<HTMLInputElement>(null);

  const next = () => {
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };
  const back = () => setStep((s) => Math.max(0, s - 1));
  const id = STEPS[step];

  const finish = () => {
    const fullKids: Kid[] = kids.map((k) => ({
      id: k.id,
      name: k.name,
      avatar: k.avatar,
      age: k.age,
      ...defaultsFor(k.age),
      trusted: false,
      readyMinutes: 0,
      savedMinutes: 0,
    }));
    const chores: Chore[] = kids.flatMap((k) => k.chores.map((c) => ({ ...c, id: uid(), assignee: k.id })));
    completeSetup({ parent: { ...parent, name: parent.name.trim() }, kids: fullKids, chores, goal: { ...goal, stars: 0 } });
    activeKidId.value = null;
    go('us');
  };

  const restore = async (file: File) => {
    if (importBackup(await file.text())) {
      showToast('Family restored');
      go('us');
    } else {
      showToast("That file doesn't look like a Talli backup");
    }
  };

  if (id === 'welcome') {
    return (
      <main class="screen setup welcome">
        <Leaf class="corner-tr" flip />
        <Leaf class="corner-bl" />
        <header class="brand">
          <Logo />
          <p class="tagline">Small acts. Shared wins.</p>
        </header>
        <div class="welcome-art" aria-hidden="true">
          <Avatar kind="bear" size={76} ring />
          <Star size={54} />
          <Avatar kind="fox" size={76} ring />
        </div>
        <h1 class="play-title">Let's set up your family</h1>
        <p class="muted center">
          It takes about two minutes. Kids earn stars for helping out, and stars become play time, always within a daily
          limit you choose.
        </p>
        <button class="btn btn-aub wide" onClick={next}>
          Get started
        </button>
        <button class="link center-block" onClick={loadDemo}>
          Look around with a demo family first
        </button>
        <button class="link center-block small" onClick={() => fileRef.current?.click()}>
          Restore from a backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (f) void restore(f);
          }}
        />
      </main>
    );
  }

  return (
    <main class="screen setup">
      <header class="setup-head">
        <button class="icon-btn" onClick={back} aria-label="Back">
          <Icon name="back" />
        </button>
        <div class="setup-dots" aria-label={`Step ${step} of ${STEPS.length - 1}`}>
          {STEPS.slice(1).map((_, i) => (
            <span class={i < step ? 'on' : ''} />
          ))}
        </div>
        <span style={{ width: 44 }} />
      </header>

      {id === 'you' && <YouStep parent={parent} setParent={setParent} onNext={next} />}
      {id === 'kids' && <KidsStep kids={kids} setKids={setKids} onNext={next} />}
      {id === 'chores' && <ChoresStep kids={kids} setKids={setKids} onNext={next} />}
      {id === 'goal' && <GoalStep kids={kids} goal={goal} setGoal={setGoal} onNext={next} />}
      {id === 'done' && (
        <>
          <h1 class="setup-title">You're all set, {parent.name.trim()}!</h1>
          <div class="done-avatars">
            {kids.map((k) => (
              <div class="done-kid">
                <Avatar kind={k.avatar} size={72} ring />
                <b>{k.name}</b>
                <small class="muted">{k.chores.length} chores</small>
              </div>
            ))}
          </div>
          <div class="card setup-tips">
            <p>
              <b>Every jar starts empty.</b> Stars arrive when the kids help out and you approve it in the parent space.
            </p>
            <p>
              <b>Install it:</b> in your browser menu, choose <i>Add to Home Screen</i> so Talli opens like an app.
            </p>
            <p>
              <b>Everything stays on this device.</b> You can back it up from Parent settings.
            </p>
          </div>
          <button class="btn btn-play wide" onClick={finish}>
            Start using Talli
          </button>
        </>
      )}
    </main>
  );
}

function YouStep({
  parent,
  setParent,
  onNext,
}: {
  parent: { name: string; avatar: string; pin: string };
  setParent: (p: { name: string; avatar: string; pin: string }) => void;
  onNext: () => void;
}) {
  const ok = parent.name.trim() && /^\d{4}$/.test(parent.pin);
  return (
    <>
      <h1 class="setup-title">First, you</h1>
      <p class="muted">The kids will see your name when a chore is waiting for you to check.</p>
      <Field label="Your name">
        <input
          class="input"
          value={parent.name}
          placeholder="e.g. Talli, Mum, Dad"
          onInput={(e) => setParent({ ...parent, name: e.currentTarget.value })}
        />
      </Field>
      <Field label="Your avatar">
        <div class="emoji-pick">
          {PARENT_AVATARS.map((a) => (
            <button class={a === parent.avatar ? 'on' : ''} onClick={() => setParent({ ...parent, avatar: a })}>
              {a}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Choose a 4-digit parent PIN" hint="This keeps approvals and settings grown-ups only">
        <input
          class="input pin-input"
          inputMode="numeric"
          maxLength={4}
          value={parent.pin}
          placeholder="••••"
          onInput={(e) => setParent({ ...parent, pin: e.currentTarget.value.replace(/\D/g, '') })}
        />
      </Field>
      <button class="btn btn-aub wide setup-next" disabled={!ok} onClick={onNext}>
        Next
      </button>
    </>
  );
}

function KidsStep({ kids, setKids, onNext }: { kids: DraftKid[]; setKids: (k: DraftKid[]) => void; onNext: () => void }) {
  const freeAvatar = () => Object.keys(AVATARS).find((a) => !kids.some((k) => k.avatar === a)) ?? 'owl';
  const [adding, setAdding] = useState(kids.length === 0);
  const [name, setName] = useState('');
  const [age, setAge] = useState(6);
  const [avatar, setAvatar] = useState(freeAvatar());

  const add = () => {
    const chores = suggestionsFor(age).slice(0, 4);
    setKids([...kids, { id: uid(), name: name.trim(), age, avatar, chores }]);
    setName('');
    setAdding(false);
  };

  return (
    <>
      <h1 class="setup-title">Who are your helpers?</h1>
      <p class="muted">Their age sets up the right layout: picture-first for little ones, more independence for older kids.</p>

      {kids.map((k) => (
        <div class="card row">
          <Avatar kind={k.avatar} size={48} />
          <span class="row-text">
            <b>{k.name}</b>
            <small>
              Age {k.age} · {defaultsFor(k.age).mode === 'little' ? 'Little helper' : 'Growing up'}
            </small>
          </span>
          <button class="icon-btn" aria-label={`Remove ${k.name}`} onClick={() => setKids(kids.filter((x) => x.id !== k.id))}>
            <Icon name="x" size={20} />
          </button>
        </div>
      ))}

      {adding ? (
        <div class="card add-kid">
          <Field label="Name">
            <input class="input" value={name} placeholder="First name" onInput={(e) => setName(e.currentTarget.value)} />
          </Field>
          <Field label="Age" hint={age <= 6 ? 'Little helper: pictures and read-aloud, no reading needed' : 'Growing up: minutes, saving, choosing'}>
            <Stepper label="age" value={age} min={2} max={16} onChange={setAge} format={(v) => `${v} years`} />
          </Field>
          <Field label="Pick an animal">
            <div class="avatar-pick">
              {Object.keys(AVATARS).map((a) => (
                <button class={a === avatar ? 'on' : ''} onClick={() => setAvatar(a)} aria-label={a}>
                  <Avatar kind={a} size={44} />
                </button>
              ))}
            </div>
          </Field>
          <button class="btn btn-outline wide" disabled={!name.trim()} onClick={add}>
            <Icon name="plus" size={20} /> Add {name.trim() || 'child'}
          </button>
        </div>
      ) : (
        <button
          class="card row dashed"
          onClick={() => {
            setAvatar(freeAvatar());
            setAdding(true);
          }}
        >
          <span class="row-icon">
            <Icon name="plus" />
          </span>
          <span class="row-text">
            <b>Add {kids.length ? 'another' : 'a'} child</b>
          </span>
        </button>
      )}

      <button class="btn btn-aub wide setup-next" disabled={kids.length === 0} onClick={onNext}>
        Next
      </button>
    </>
  );
}

function ChoresStep({ kids, setKids, onNext }: { kids: DraftKid[]; setKids: (k: DraftKid[]) => void; onNext: () => void }) {
  const [custom, setCustom] = useState<Record<string, string>>({});

  const setChores = (id: string, chores: Suggestion[]) => setKids(kids.map((k) => (k.id === id ? { ...k, chores } : k)));

  return (
    <>
      <h1 class="setup-title">Pick some chores</h1>
      <p class="muted">
        We've suggested chores that suit each age. Three to five is a great start, and you can change them any time.
      </p>

      {kids.map((k) => {
        const suggestions = suggestionsFor(k.age);
        const extras = k.chores.filter((c) => !suggestions.some((s) => s.title === c.title));
        const toggle = (c: Suggestion) =>
          setChores(k.id, k.chores.some((x) => x.title === c.title) ? k.chores.filter((x) => x.title !== c.title) : [...k.chores, c]);
        const addCustom = () => {
          const title = (custom[k.id] ?? '').trim();
          if (!title) return;
          setChores(k.id, [...k.chores, { title, emoji: '⭐', stars: 1, tint: 'butter' }]);
          setCustom({ ...custom, [k.id]: '' });
        };

        return (
          <section class="setup-kid">
            <div class="chore-group-head">
              <Avatar kind={k.avatar} size={36} />
              <b>{k.name}</b>
              <small class="muted">age {k.age}</small>
            </div>
            <div class="suggest-grid">
              {[...suggestions, ...extras].map((c) => {
                const on = k.chores.some((x) => x.title === c.title);
                return (
                  <button class={`suggest tint-${c.tint} ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle(c)}>
                    <span class="suggest-emoji">{c.emoji}</span>
                    <span class="suggest-title">{c.title}</span>
                    <span class="suggest-stars">
                      {Array.from({ length: c.stars }, () => (
                        <Star size={13} />
                      ))}
                    </span>
                    {on && (
                      <span class="suggest-tick">
                        <Icon name="check" size={14} stroke={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div class="custom-add">
              <input
                class="input"
                placeholder="Add your own…"
                value={custom[k.id] ?? ''}
                onInput={(e) => setCustom({ ...custom, [k.id]: e.currentTarget.value })}
                onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              />
              <button class="btn btn-outline btn-small" onClick={addCustom} disabled={!(custom[k.id] ?? '').trim()}>
                Add
              </button>
            </div>
          </section>
        );
      })}

      <button class="btn btn-aub wide setup-next" disabled={kids.some((k) => k.chores.length === 0)} onClick={onNext}>
        Next
      </button>
    </>
  );
}

function GoalStep({
  kids,
  goal,
  setGoal,
  onNext,
}: {
  kids: DraftKid[];
  goal: { title: string; emoji: string; target: number };
  setGoal: (g: { title: string; emoji: string; target: number }) => void;
  onNext: () => void;
}) {
  // Rough pace: kids manage about two thirds of their chores on a typical day.
  const perDay = kids.reduce((n, k) => n + k.chores.reduce((m, c) => m + c.stars, 0), 0) * 0.66;
  const days = perDay > 0 ? Math.max(1, Math.round(goal.target / perDay)) : 0;

  return (
    <>
      <h1 class="setup-title">A goal to share</h1>
      <p class="muted">Every star anyone earns also fills one family jar, so siblings cheer each other on instead of competing.</p>
      <Field label="What will you celebrate together?">
        <input class="input" value={goal.title} onInput={(e) => setGoal({ ...goal, title: e.currentTarget.value })} />
      </Field>
      <Field label="Picture">
        <div class="emoji-pick">
          {GOAL_EMOJIS.map((e) => (
            <button class={e === goal.emoji ? 'on' : ''} onClick={() => setGoal({ ...goal, emoji: e })}>
              {e}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Stars to fill the jar" hint={days ? `About ${days} ${days === 1 ? 'day' : 'days'} if everyone helps most days` : undefined}>
        <Stepper label="stars needed" value={goal.target} min={5} max={200} step={5} onChange={(target) => setGoal({ ...goal, target })} />
      </Field>
      <button class="btn btn-aub wide setup-next" disabled={!goal.title.trim()} onClick={onNext}>
        Next
      </button>
    </>
  );
}
