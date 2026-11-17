# Testing

## Automated checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The unit suite covers BMI, adult validation, deterministic missions, night-shift local-day grouping, XP idempotency, level thresholds, malformed storage, chat history limits, settings migration, duplicate import rejection, deletion scope, and action routing.

The live Gemini test is intentionally gated:

```bash
RUN_LIVE_GEMINI=1 npm test -- live-gemini
```

It calls the actual proxy handler and is not a mock. A failed network or provider request must remain reported as unverified.

## Manual release matrix

Check `/`, `/onboarding`, `/app`, `/app/chat`, all six `/app/tools/*` routes, `/app/progress`, `/app/profile`, and `/app/settings` at 320, 375, 390, 430, 768, 1024, 1440, and 1920 px. Repeat representative mobile and desktop checks with `ar-AE`.

Verify landing-to-onboarding routing, draft refresh, mission completion, duplicate clicks, tool-action navigation, timer backgrounding, export/import, reset, deletion, and mobile safe-area navigation.

