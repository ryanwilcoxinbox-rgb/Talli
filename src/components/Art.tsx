import { useEffect, useRef, useState } from 'preact/hooks';

export const STAR_PATH = 'M12 2.6l2.75 5.6 6.15.9-4.45 4.33 1.05 6.12L12 16.66l-5.5 2.9 1.05-6.13L3.1 9.1l6.15-.9z';

export function Star({ size = 22, dim = false }: { size?: number; dim?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" class={dim ? 'star dim' : 'star'}>
      <path d={STAR_PATH} fill="var(--star)" stroke="var(--star-edge)" stroke-width="1.4" stroke-linejoin="round" />
    </svg>
  );
}

/** Where stars settle in the jar, bottom row first: [x, y, rotation]. */
const SPOTS: [number, number, number][] = [
  [62, 186, -12], [100, 190, 6], [138, 185, -5],
  [80, 158, 10], [121, 156, -14],
  [56, 131, 4], [100, 128, -6], [144, 130, 12],
  [78, 102, -10], [122, 100, 8],
  [60, 76, 6], [140, 76, -8],
];

/** A glass jar that fills with stars. The newest star drops in. */
export function Jar({ count, width = 200, label }: { count: number; width?: number; label?: string }) {
  const prev = useRef(count);
  const [dropFrom, setDropFrom] = useState<number | null>(null);

  useEffect(() => {
    if (count > prev.current) {
      setDropFrom(Math.min(prev.current, SPOTS.length));
      const t = setTimeout(() => setDropFrom(null), 1100);
      prev.current = count;
      return () => clearTimeout(t);
    }
    prev.current = count;
  }, [count]);

  const shown = Math.min(count, SPOTS.length);
  const extra = count - shown;

  return (
    <svg
      viewBox="0 0 200 224"
      width={width}
      height={(width * 224) / 200}
      role="img"
      aria-label={label ?? `${count} stars in the jar`}
      class="jar"
    >
      <rect x="56" y="6" width="88" height="26" rx="9" fill="#F3EEE6" stroke="#DCD3C5" stroke-width="3" />
      <path d="M62 14h76" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8" />
      <rect x="48" y="30" width="104" height="15" rx="7.5" fill="#FBF8F3" stroke="#DCD3C5" stroke-width="3" />
      <path
        d="M52 45C32 56 25 72 25 96v84c0 19 14 32 33 32h84c19 0 33-13 33-32V96c0-24-7-40-27-51z"
        fill="rgba(255,255,255,.62)"
        stroke="#DCD3C5"
        stroke-width="3"
      />
      {SPOTS.slice(0, shown).map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <g
            class={dropFrom !== null && i >= dropFrom ? 'jar-drop' : undefined}
            style={dropFrom !== null ? { animationDelay: `${(i - dropFrom) * 0.12}s` } : undefined}
          >
            <path
              d={STAR_PATH}
              transform="translate(-19 -19) scale(1.58)"
              fill="var(--star)"
              stroke="var(--star-edge)"
              stroke-width="1.1"
              stroke-linejoin="round"
            />
          </g>
        </g>
      ))}
      <path d="M42 90c-4 20-4 60 0 92" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".85" fill="none" />
      <path d="M44 72c1-4 3-7 6-10" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7" fill="none" />
      {extra > 0 && (
        <g>
          <rect x="128" y="50" width="52" height="30" rx="15" fill="var(--aub)" />
          <text x="154" y="70" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="15" fill="#fff">
            +{extra}
          </text>
        </g>
      )}
    </svg>
  );
}

export function TallyMarks({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g stroke-linecap="round" stroke-width="6">
        <path d="M17 14v36" stroke="#8DBB8B" />
        <path d="M27 14v36" stroke="#F4C94F" />
        <path d="M37 14v36" stroke="#A8B3EE" />
        <path d="M47 14v36" stroke="#3A2A56" />
        <path d="M9 41 55 21" stroke="#EC7A5C" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <div class="logo">
      <span class="logo-word">talli</span>
      <TallyMarks />
    </div>
  );
}

/** A little sage sprig for the corners of cards and screens. */
export function Leaf({ class: cls = '', flip = false }: { class?: string; flip?: boolean }) {
  return (
    <svg
      class={`leaf ${cls}`}
      viewBox="0 0 60 80"
      width="60"
      height="80"
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M30 78C29 55 26 33 16 10" stroke="#6E9A6B" stroke-width="2.4" fill="none" stroke-linecap="round" />
      <path d="M28 58c-10-2-18-9-20-19 10 1 18 8 20 19z" fill="#8DBB8B" />
      <path d="M26 42c8-4 12-12 12-21-8 4-12 12-12 21z" fill="#A5CBA2" />
      <path d="M21 26c-8-2-13-8-14-16 8 1 13 7 14 16z" fill="#8DBB8B" />
      <path d="M30 66c8-3 14-10 15-19-8 3-14 10-15 19z" fill="#A5CBA2" />
    </svg>
  );
}
