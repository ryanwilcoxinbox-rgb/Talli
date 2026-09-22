import type { Chore, Completion, State } from './types';
import { dayKey, daysAgo } from './lib/util';

/** Demo family matching the design board. Parents can rename and edit everything. */
export function seed(): State {
  const sam = 'kid-sam';
  const alex = 'kid-alex';

  const chores: Chore[] = [
    { id: 'c-bed', title: 'Make my bed', emoji: '🛏️', stars: 1, tint: 'butter', assignee: sam },
    { id: 'c-toys', title: 'Tidy toys', emoji: '🧸', stars: 1, tint: 'coral', assignee: sam },
    { id: 'c-shoes', title: 'Shoes away', emoji: '👟', stars: 1, tint: 'sage', assignee: sam },
    { id: 'c-teeth', title: 'Brush teeth', emoji: '🪥', stars: 1, tint: 'peri', assignee: sam },
    { id: 'c-table', title: 'Clear the table', emoji: '🍽️', stars: 1, tint: 'butter', assignee: alex },
    { id: 'c-plants', title: 'Water the plants', emoji: '🪴', stars: 1, tint: 'sage', assignee: alex },
    { id: 'c-recycle', title: 'Take out recycling', emoji: '♻️', stars: 2, tint: 'sage', assignee: alex },
    { id: 'c-lunch', title: 'Pack my lunch box', emoji: '🥪', stars: 2, tint: 'coral', assignee: alex },
    { id: 'c-cat', title: 'Feed the cat', emoji: '🐱', stars: 1, tint: 'peri', assignee: 'shared' },
  ];

  const done = (choreId: string, kidId: string, n: number, hour: number): Completion => {
    const d = daysAgo(n);
    d.setHours(hour, 15, 0, 0);
    return { id: `seed-${choreId}-${n}`, choreId, kidId, day: dayKey(d), status: 'approved', at: d.getTime() };
  };

  return {
    version: 1,
    parent: { name: 'Talli', avatar: '👩', pin: '1234' },
    kids: [
      { id: sam, name: 'Sam', avatar: 'bear', mode: 'little', minutesPerStar: 10, dailyLimit: 60, trusted: false, readyMinutes: 30, savedMinutes: 0 },
      { id: alex, name: 'Alex', avatar: 'fox', mode: 'big', minutesPerStar: 5, dailyLimit: 60, trusted: false, readyMinutes: 30, savedMinutes: 20 },
    ],
    chores,
    completions: [
      { id: 'seed-pending', choreId: 'c-toys', kidId: sam, day: dayKey(new Date()), status: 'pending', at: Date.now() - 20 * 60000 },
      done('c-bed', sam, 1, 8),
      done('c-recycle', alex, 1, 18),
      done('c-cat', alex, 1, 7),
      done('c-teeth', sam, 2, 19),
      done('c-plants', alex, 2, 16),
      done('c-toys', sam, 3, 17),
      done('c-table', alex, 3, 19),
    ],
    usage: {},
    session: null,
    goal: { title: 'Family movie night', emoji: '🎬', target: 40, stars: 28 },
  };
}
