export const AVATARS: Record<string, { emoji: string; bg: string }> = {
  bear: { emoji: '🐻', bg: 'var(--butter-soft)' },
  fox: { emoji: '🦊', bg: 'var(--coral-soft)' },
  bunny: { emoji: '🐰', bg: 'var(--peri-soft)' },
  owl: { emoji: '🦉', bg: 'var(--sage-soft)' },
  panda: { emoji: '🐼', bg: 'var(--peri-soft)' },
  lion: { emoji: '🦁', bg: 'var(--butter-soft)' },
  frog: { emoji: '🐸', bg: 'var(--sage-soft)' },
  unicorn: { emoji: '🦄', bg: 'var(--coral-soft)' },
  tiger: { emoji: '🐯', bg: 'var(--butter-soft)' },
  koala: { emoji: '🐨', bg: 'var(--sage-soft)' },
};

export const PARENT_AVATARS = ['👩', '👨', '🧑', '👩🏽', '👨🏾', '👵', '👴'];

export function Avatar({ kind, size = 48, ring = false }: { kind: string; size?: number; ring?: boolean }) {
  const a = AVATARS[kind] ?? { emoji: kind, bg: 'var(--coral-soft)' };
  return (
    <span
      class={ring ? 'avatar ring' : 'avatar'}
      style={{ width: size, height: size, background: a.bg, fontSize: size * 0.58 }}
      aria-hidden="true"
    >
      {a.emoji}
    </span>
  );
}
