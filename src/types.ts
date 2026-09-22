export type Mode = 'little' | 'big';
export type Tint = 'butter' | 'coral' | 'peri' | 'sage';

export interface Kid {
  id: string;
  name: string;
  avatar: string;
  age?: number;
  mode: Mode;
  /** Screen minutes each star is worth. */
  minutesPerStar: number;
  /** Max screen minutes per day, however many stars are earned. */
  dailyLimit: number;
  /** Trusted kids' chores count straight away without a parent check. */
  trusted: boolean;
  readyMinutes: number;
  savedMinutes: number;
}

export interface Chore {
  id: string;
  title: string;
  emoji: string;
  stars: number;
  tint: Tint;
  /** A kid id, or 'shared' for chores any child can claim. */
  assignee: string;
}

export interface Completion {
  id: string;
  choreId: string;
  kidId: string;
  day: string;
  status: 'pending' | 'approved';
  at: number;
}

export interface Session {
  kidId: string;
  totalSec: number;
  elapsedSec: number;
  runningSince: number | null;
  reservedReady: number;
  reservedSaved: number;
  warned?: boolean;
}

export interface Goal {
  title: string;
  emoji: string;
  target: number;
  stars: number;
}

export interface State {
  version: 2;
  /** False until the parent has finished first-run setup. */
  setupComplete: boolean;
  /** True while exploring the built-in demo family. */
  demo?: boolean;
  parent: { name: string; avatar: string; pin: string };
  kids: Kid[];
  chores: Chore[];
  completions: Completion[];
  usage: Record<string, { day: string; minutes: number }>;
  session: Session | null;
  goal: Goal;
}
