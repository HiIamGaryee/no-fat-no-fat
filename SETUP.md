# Local setup

## Requirements

- Node.js 20 or newer
- npm, using the committed `package-lock.json`
- A Gemini API key for live chat

## Commands

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes for live AI | Server-side Gemini credential |
| `GEMINI_MODEL` | No | Stable Gemini model override |

Never prefix the API key with `VITE_`. The application works locally without Gemini for rule-based missions, timers, onboarding, storage, and analytics; AI requests show an unavailable state.

