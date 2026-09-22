import { state, pendingList } from '../store';
import { activeKidId, go } from '../router';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Leaf, Logo } from '../components/Art';
import { SessionBanner } from '../components/Chrome';
import { speak } from '../lib/speech';

/** "Who's helping today?": the shared-device profile picker. */
export function Us() {
  const s = state.value;
  const waiting = pendingList(s).length;

  return (
    <main class="screen us">
      <Leaf class="corner-tr" flip />
      <header class="brand">
        <Logo />
        <p class="tagline">Small acts. Shared wins.</p>
      </header>

      <SessionBanner />

      {s.demo && (
        <p class="note center">
          This is a demo family. Set up your own from <b>Parent space</b> (PIN 1234).
        </p>
      )}

      <h1 class="h-section center">Who's helping today?</h1>
      {s.kids.length === 0 && <p class="muted center">Add your children in the Parent space to get started.</p>}
      <div class="profile-grid">
        {s.kids.map((k) => (
          <button
            class={`profile ${activeKidId.value === k.id ? 'on' : ''}`}
            onClick={() => {
              activeKidId.value = k.id;
              if (k.mode === 'little') speak(`Hello ${k.name}!`);
              go('home');
            }}
          >
            <Avatar kind={k.avatar} size={84} />
            <span class="profile-name">{k.name}</span>
            <span class="profile-mode">{k.mode === 'little' ? 'Little helper' : 'Growing up'}</span>
          </button>
        ))}
      </div>

      <button class="card row parent-entry" onClick={() => go('parent')}>
        <span class="avatar" style={{ width: 48, height: 48, background: 'var(--coral-soft)', fontSize: 28 }}>
          {s.parent.avatar}
        </span>
        <span class="row-text">
          <b>Parent space</b>
          <small>{waiting > 0 ? `${waiting} waiting for a check` : 'Approvals, chores and limits'}</small>
        </span>
        <Icon name="lock" size={20} />
      </button>

      <p class="hand center footnote">One family. Room to grow. ♡</p>
    </main>
  );
}
