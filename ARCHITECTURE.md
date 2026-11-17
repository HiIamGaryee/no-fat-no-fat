# Architecture

```text
React browser application
├── LocalStorage: profile, drafts, chat, missions, XP, achievements, settings, tool events
└── POST /api/chat
    └── Vercel serverless proxy
        └── Google Gemini Interactions API (store: false)
```

There is no authentication service or application database. The proxy validates size, shape, locale, personality, history, origin, and allowlisted action identifiers. It constructs trusted safety instructions server-side and returns text plus an optional validated navigation action. Model output cannot directly mutate progress or award XP.

XP uses a canonical transaction ledger with stable `sourceId` values. Levels and analytics are derived from persisted records. Imports validate schemas and unique identifiers before an atomic best-effort restore with rollback.

`store:false` disables stored Interaction resources for this request pattern; Gemini still processes requests under Google's applicable terms. Browser-local records do not sync and can be lost when site data is cleared.

