import { effect, signal } from '@preact/signals';
import type { Chore, Goal, Kid, State } from './types';
import { seed } from './seed';
import { dayKey, uid } from './lib/util';

const KEY = 'talli:v1';

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === 1) return parsed;
    }
  } catch {
    /* fall through to demo data */
  }
  return seed();
}

export const state = signal<State>(load());

effect(() => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state.value));
  } catch {
    /* private mode: the app still works for this visit */
  }
});

/** Today's date key, re-checked every 30s so chores reset at midnight. */
export const day = signal(dayKey(new Date()));
setInterval(() => {
  const d = dayKey(new Date());
  if (d !== day.value) day.value = d;
}, 30_000);

function update(fn: (s: State) => void) {
  const next = structuredClone(state.value);
  fn(next);
  state.value = next;
}

// ---------- selectors ----------

export const kidById = (s: State, id: string | null) => s.kids.find((k) => k.id === id) ?? null;
export const choreById = (s: State, id: string) => s.chores.find((c) => c.id === id) ?? null;

export const choresFor = (s: State, kidId: string) =>
  s.chores.filter((c) => c.assignee === kidId || c.assignee === 'shared');

/** Today's completion for this chore. A shared chore counts once for everyone. */
export function completionFor(s: State, chore: Chore, kidId: string, d = day.value) {
  return s.completions.find(
    (c) => c.choreId === chore.id && c.day === d && (chore.assignee === 'shared' || c.kidId === kidId),
  );
}

export const usedToday = (s: State, kidId: string) => {
  const u = s.usage[kidId];
  return u && u.day === day.value ? u.minutes : 0;
};

export const limitLeft = (s: State, kid: Kid) => Math.max(0, kid.dailyLimit - usedToday(s, kid.id));

/** Minutes the kid can start right now: what they've earned, capped by today's limit. */
export const playableMinutes = (s: State, kid: Kid) =>
  Math.min(kid.readyMinutes + kid.savedMinutes, limitLeft(s, kid));

export const pendingList = (s: State) => s.completions.filter((c) => c.status === 'pending');

export function elapsedOf(session: State['session'], now = Date.now()) {
  if (!session) return 0;
  const running = session.runningSince ? (now - session.runningSince) / 1000 : 0;
  return session.elapsedSec + running;
}

// ---------- chores ----------

function award(s: State, kidId: string, choreId: string) {
  const kid = s.kids.find((k) => k.id === kidId);
  const chore = s.chores.find((c) => c.id === choreId);
  if (!kid || !chore) return;
  kid.readyMinutes += chore.stars * kid.minutesPerStar;
  s.goal.stars += chore.stars;
}

/** Returns 'approved' if the kid is trusted, otherwise 'pending'. */
export function completeChore(kidId: string, choreId: string): 'approved' | 'pending' | null {
  let result: 'approved' | 'pending' | null = null;
  update((s) => {
    const kid = s.kids.find((k) => k.id === kidId);
    const chore = s.chores.find((c) => c.id === choreId);
    if (!kid || !chore || completionFor(s, chore, kidId)) return;
    const status = kid.trusted ? 'approved' : 'pending';
    result = status;
    s.completions.push({ id: uid(), choreId, kidId, day: day.value, status, at: Date.now() });
    if (status === 'approved') award(s, kidId, choreId);
    // A month of history is plenty for the family feed.
    const cutoff = Date.now() - 31 * 864e5;
    s.completions = s.completions.filter((c) => c.at > cutoff);
  });
  return result;
}

export function approve(completionId: string) {
  update((s) => {
    const c = s.completions.find((x) => x.id === completionId);
    if (!c || c.status !== 'pending') return;
    c.status = 'approved';
    award(s, c.kidId, c.choreId);
  });
}

/** "Not yet" puts the chore back on the kid's list; nothing is taken away. */
export function notYet(completionId: string) {
  update((s) => {
    s.completions = s.completions.filter((c) => c.id !== completionId);
  });
}

// ---------- time ----------

export function saveTime(kidId: string, minutes: number) {
  update((s) => {
    const kid = s.kids.find((k) => k.id === kidId);
    if (!kid) return;
    const m = Math.min(minutes, kid.readyMinutes);
    kid.readyMinutes -= m;
    kid.savedMinutes += m;
  });
}

export function startSession(kidId: string, minutes: number) {
  update((s) => {
    const kid = s.kids.find((k) => k.id === kidId);
    if (!kid || s.session) return;
    const m = Math.min(minutes, playableMinutes(s, kid));
    if (m <= 0) return;
    const fromReady = Math.min(m, kid.readyMinutes);
    const fromSaved = m - fromReady;
    kid.readyMinutes -= fromReady;
    kid.savedMinutes -= fromSaved;
    s.usage[kidId] = { day: day.value, minutes: usedToday(s, kidId) + m };
    s.session = {
      kidId,
      totalSec: m * 60,
      elapsedSec: 0,
      runningSince: Date.now(),
      reservedReady: fromReady,
      reservedSaved: fromSaved,
    };
  });
}

export function pauseSession() {
  update((s) => {
    if (!s.session?.runningSince) return;
    s.session.elapsedSec = elapsedOf(s.session);
    s.session.runningSince = null;
  });
}

export function resumeSession() {
  update((s) => {
    if (s.session && !s.session.runningSince) s.session.runningSince = Date.now();
  });
}

export function markWarned() {
  update((s) => {
    if (s.session) s.session.warned = true;
  });
}

/** Finish early: whole unused minutes go back where they came from. */
export function stopSession() {
  update((s) => {
    const session = s.session;
    if (!session) return;
    const kid = s.kids.find((k) => k.id === session.kidId);
    const unused = Math.floor((session.totalSec - elapsedOf(session)) / 60);
    if (kid && unused > 0) {
      const toSaved = Math.min(unused, session.reservedSaved);
      kid.savedMinutes += toSaved;
      kid.readyMinutes += unused - toSaved;
      const u = s.usage[kid.id];
      if (u) u.minutes = Math.max(0, u.minutes - unused);
    }
    s.session = null;
  });
}

export function finishSession() {
  update((s) => {
    s.session = null;
  });
}

// ---------- parent ----------

export function upsertKid(kid: Kid) {
  update((s) => {
    const i = s.kids.findIndex((k) => k.id === kid.id);
    if (i >= 0) s.kids[i] = kid;
    else s.kids.push(kid);
  });
}

export function removeKid(id: string) {
  update((s) => {
    s.kids = s.kids.filter((k) => k.id !== id);
    s.chores = s.chores.filter((c) => c.assignee !== id);
    s.completions = s.completions.filter((c) => c.kidId !== id);
    delete s.usage[id];
    if (s.session?.kidId === id) s.session = null;
  });
}

export function patchKid(id: string, patch: Partial<Kid>) {
  update((s) => {
    const kid = s.kids.find((k) => k.id === id);
    if (kid) Object.assign(kid, patch);
  });
}

export function upsertChore(chore: Chore) {
  update((s) => {
    const i = s.chores.findIndex((c) => c.id === chore.id);
    if (i >= 0) s.chores[i] = chore;
    else s.chores.push(chore);
  });
}

export function removeChore(id: string) {
  update((s) => {
    s.chores = s.chores.filter((c) => c.id !== id);
    s.completions = s.completions.filter((c) => c.choreId !== id || c.status === 'approved');
  });
}

export function setGoal(goal: Goal) {
  update((s) => {
    s.goal = goal;
  });
}

export function setParent(parent: State['parent']) {
  update((s) => {
    s.parent = parent;
  });
}

export function resetDemo() {
  state.value = seed();
}
