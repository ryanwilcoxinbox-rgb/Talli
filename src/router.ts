import { effect, signal } from '@preact/signals';

export type Route = 'us' | 'home' | 'family' | 'play' | 'parent';
const ROUTES: Route[] = ['us', 'home', 'family', 'play', 'parent'];

const fromHash = (): Route | null => {
  const r = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : null;
};

export const route = signal<Route>(fromHash() ?? 'us');

window.addEventListener('hashchange', () => {
  route.value = fromHash() ?? 'us';
  window.scrollTo(0, 0);
});

export function go(r: Route) {
  if (route.value !== r) location.hash = `/${r}`;
}

/** Which child is using the app on this device. */
export const activeKidId = signal<string | null>(readKid());

function readKid() {
  try {
    return localStorage.getItem('talli:kid');
  } catch {
    return null;
  }
}

effect(() => {
  try {
    if (activeKidId.value) localStorage.setItem('talli:kid', activeKidId.value);
    else localStorage.removeItem('talli:kid');
  } catch {
    /* ignore */
  }
});

/** The parent space stays unlocked for this visit only. */
export const parentUnlocked = signal(false);

export const toast = signal<string | null>(null);
let toastTimer: number | undefined;
export function showToast(msg: string) {
  toast.value = msg;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.value = null), 2800);
}
