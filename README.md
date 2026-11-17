# no-fat-no-fat

**Your Excuses Are Getting Cooked.**

A browser-local, multilingual wellness prototype for the **Sustaining Healthy Behaviors** hackathon challenge. UNFIT AI connects sarcastic—but responsible—coaching to small missions, confirmation-based XP, six interactive tools, and analytics derived from actual local records.

## What works

- Maximalist responsive landing page and seven-step adult onboarding
- Metric BMI screening reference with optional measurements
- Local profile, draft, chat, mission, XP, achievement, settings, and tool-event persistence
- Secure server-side Gemini proxy using the official `@google/genai` Interactions API
- Allowlisted Gemini action cards that open relevant tools
- Midnight Food Rescue, Excuse Court, manual-label Food Detective, Movement Roulette, Habit Autopsy, and Evidence Lab
- Five locale choices; landing and onboarding translations; Arabic document direction
- Export, validated import, progress reset, and application-only data deletion

## Stack

React, TypeScript, Vite, Tailwind CSS, Radix/shadcn-style primitives, Motion, Lucide, React Router, LocalStorage, Vitest, and Vercel Functions.

## Start

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `GEMINI_API_KEY` server-side.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Set `RUN_LIVE_GEMINI=1` only when intentionally running the real provider smoke test.

## Deployment

Live site: [https://astounding-tartufo-f4ea8d.netlify.app](https://astounding-tartufo-f4ea8d.netlify.app)

Vercel configuration is included. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Known limitations

- Dashboard, settings, chat chrome, and tool UI copy are not yet fully translated into all five locales.
- Chat uses one persistent conversation; rename, search, and multiple conversation threads are not implemented.
- Food Detective uses factual manual nutrition-label entry; food search and barcode scanning are not implemented.
- The in-memory API limiter is best-effort per serverless instance; production platform quotas and bot protection remain required.
- This is a hackathon prototype for general wellness, not medical advice or a clinical product.

