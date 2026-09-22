import { state, kidById, pendingList } from '../store';
import { activeKidId, go, route, toast } from '../router';
import { Icon, type IconName } from './Icon';
import { Avatar } from './Avatar';
import { Jar } from './Art';

export function Nav() {
  const r = route.value;
  const s = state.value;
  const active = r === 'us' || r === 'parent' ? 'us' : r;
  const waiting = pendingList(s).length;
  const tabs: { id: 'home' | 'family' | 'us'; label: string; icon: IconName }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'family', label: 'Family', icon: 'jar' },
    { id: 'us', label: 'Us', icon: 'users' },
  ];
  return (
    <nav class="nav" aria-label="Main">
      {tabs.map((t) => (
        <button
          class={active === t.id ? 'nav-tab on' : 'nav-tab'}
          aria-current={active === t.id ? 'page' : undefined}
          onClick={() => go(t.id === 'home' && !kidById(s, activeKidId.value) ? 'us' : t.id)}
        >
          <span class="nav-icon">
            <Icon name={t.icon} size={24} />
            {t.id === 'us' && waiting > 0 && <span class="badge">{waiting}</span>}
          </span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

export function Toast() {
  return toast.value ? (
    <div class="toast" role="status">
      {toast.value}
    </div>
  ) : null;
}

/** Reminds everyone a timer is running, from any screen. */
export function SessionBanner() {
  const s = state.value;
  const kid = s.session ? kidById(s, s.session.kidId) : null;
  if (!kid) return null;
  return (
    <button class="session-banner" onClick={() => go('play')}>
      <Avatar kind={kid.avatar} size={30} />
      <span>
        <b>{kid.name}</b> is playing{s.session?.runningSince ? '' : ' (paused)'}
      </span>
      <span class="session-banner-go">
        Timer <Icon name="chevron" size={18} />
      </span>
    </button>
  );
}

export function FamilyGoalCard({ compact = false }: { compact?: boolean }) {
  const { goal, kids } = state.value;
  const pct = Math.min(100, Math.round((goal.stars / goal.target) * 100));
  return (
    <button class="card goal-card" onClick={() => go('family')}>
      <Jar count={Math.min(goal.stars, 6)} width={compact ? 64 : 78} label={`${goal.stars} family stars`} />
      <div class="goal-body">
        <div class="goal-title">{goal.title}</div>
        <div class="muted small">Together is better.</div>
        {compact ? (
          <div class="goal-avatars">
            {kids.map((k) => (
              <Avatar kind={k.avatar} size={36} ring />
            ))}
          </div>
        ) : (
          <>
            <div class="bar" role="progressbar" aria-valuenow={goal.stars} aria-valuemax={goal.target}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <div class="small strong">
              {Math.min(goal.stars, goal.target)} / {goal.target} stars
            </div>
          </>
        )}
      </div>
      <span class="goal-heart">
        <Icon name="heart" size={22} />
      </span>
    </button>
  );
}
