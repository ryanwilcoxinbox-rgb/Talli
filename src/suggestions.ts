import type { Kid, Tint } from './types';

export interface Suggestion {
  title: string;
  emoji: string;
  stars: number;
  tint: Tint;
}

/** Age-appropriate starter chores. Small and doable beats long lists. */
const BY_AGE: { maxAge: number; chores: Suggestion[] }[] = [
  {
    maxAge: 5,
    chores: [
      { title: 'Make my bed', emoji: '🛏️', stars: 1, tint: 'butter' },
      { title: 'Tidy toys', emoji: '🧸', stars: 1, tint: 'coral' },
      { title: 'Shoes away', emoji: '👟', stars: 1, tint: 'sage' },
      { title: 'Clothes in the basket', emoji: '🧺', stars: 1, tint: 'peri' },
      { title: 'Brush teeth', emoji: '🪥', stars: 1, tint: 'peri' },
      { title: 'Water the plants', emoji: '🪴', stars: 1, tint: 'sage' },
      { title: 'Feed the pet', emoji: '🐶', stars: 1, tint: 'butter' },
      { title: 'Put books away', emoji: '📚', stars: 1, tint: 'coral' },
    ],
  },
  {
    maxAge: 8,
    chores: [
      { title: 'Make my bed', emoji: '🛏️', stars: 1, tint: 'butter' },
      { title: 'Set the table', emoji: '🍽️', stars: 1, tint: 'coral' },
      { title: 'Clear my plate', emoji: '🥣', stars: 1, tint: 'peri' },
      { title: 'Tidy my room', emoji: '🧸', stars: 2, tint: 'sage' },
      { title: 'Pack my school bag', emoji: '🎒', stars: 1, tint: 'butter' },
      { title: 'Sort the socks', emoji: '🧦', stars: 1, tint: 'peri' },
      { title: 'Feed the pet', emoji: '🐶', stars: 1, tint: 'coral' },
      { title: 'Water the plants', emoji: '🪴', stars: 1, tint: 'sage' },
    ],
  },
  {
    maxAge: 99,
    chores: [
      { title: 'Clear the table', emoji: '🍽️', stars: 1, tint: 'butter' },
      { title: 'Load the dishwasher', emoji: '🧽', stars: 2, tint: 'peri' },
      { title: 'Take out recycling', emoji: '♻️', stars: 2, tint: 'sage' },
      { title: 'Pack my lunch box', emoji: '🥪', stars: 2, tint: 'coral' },
      { title: 'Fold my laundry', emoji: '🧺', stars: 2, tint: 'peri' },
      { title: 'Hoover a room', emoji: '🧹', stars: 2, tint: 'butter' },
      { title: 'Walk the dog', emoji: '🐕', stars: 2, tint: 'sage' },
      { title: 'Help make dinner', emoji: '🍳', stars: 2, tint: 'coral' },
    ],
  },
];

export const suggestionsFor = (age: number) => BY_AGE.find((b) => age <= b.maxAge)!.chores;

/** Sensible starting settings for an age; parents can change them any time. */
export const defaultsFor = (age: number): Pick<Kid, 'mode' | 'minutesPerStar' | 'dailyLimit'> =>
  age <= 6 ? { mode: 'little', minutesPerStar: 10, dailyLimit: 60 } : { mode: 'big', minutesPerStar: 5, dailyLimit: 60 };
