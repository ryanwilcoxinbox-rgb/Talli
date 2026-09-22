# Talli

*Small acts. Shared wins.* A family chore and play-time PWA. Kids earn stars for helping out, stars turn into screen time, and every star also fills a shared family jar.

## Run it

```bash
npm install
npm run dev
```

## Deploy to Vercel

Import the repo in Vercel. It detects Vite automatically (build: `npm run build`, output: `dist`). No environment variables are needed.

On a phone, open the site and choose **Add to Home Screen** to install it. It works offline after the first load.

## How it's built

- **Vite + Preact + TypeScript**, with `@preact/signals` for state
- **vite-plugin-pwa** for the manifest and service worker
- All data lives in `localStorage` on the device, with no accounts and no backend. That suits one shared family tablet. Syncing across phones would need a backend (for example Supabase) later.

| File | What it holds |
|---|---|
| `src/store.ts` | All data and rules: stars, approvals, daily limits, timer |
| `src/screens/Setup.tsx` | First-run setup: parent, PIN, kids, age-based chore picks, family goal |
| `src/suggestions.ts` | Age-appropriate starter chores and default settings |
| `src/seed.ts` | Optional demo family (Sam, 4, and Alex, 10), PIN 1234 |
| `src/screens/` | Us (profile picker), LittleHome, BigHome, Play, Family, Parent |
| `src/styles.css` | Design tokens from the design board (butter, coral, periwinkle, sage, aubergine) |

On first open, Talli walks the parent through setup: their name and PIN, each child (name, age, animal), starter chores suggested for each age, and a shared family goal. Every jar starts at zero.

Parent settings → **Your data** has backup/restore (a JSON file), **Reset stars & time** (keeps the family and chores), and **Start over**.

## Design principles (from child-development research)

- **Immediate, concrete rewards.** Stars land the moment a chore is done.
- **"Helper" identity language.** Children aged 3–6 help more when invited to *be a helper* (Bryan et al., 2014).
- **Pictures before numbers.** Little-helper mode uses stars, pictures, read-aloud and a visual timer, with no digits.
- **Autonomy for older kids.** They choose chores and can save time for later.
- **A healthy cap.** Earned time never exceeds the daily limit (AAP guidance: about 1 h/day for ages 2–5).
- **Cooperation, not competition.** There are no leaderboards, just one shared family goal.
- **Nothing taken away.** "Not yet" returns a chore to the list, and earned time is never removed.

## Known limits

- A web app can't lock a TV or tablet, so the timer runs on trust.
- Only one play timer runs at a time (one family screen).
- Chore art is emoji placeholders, ready to be swapped for Talli's illustrations.
