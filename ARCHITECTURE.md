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


## Coaching state and personality lock

Chat and every Gemini-backed health tool share one validated coaching state (`src/lib/coach-state.ts`), stored with the chat history in LocalStorage (`nfnf:chat:v1`, optional `coach` field; older chats still load).

- **The server owns the decision.** Each chat turn sends the stored state; the proxy re-validates it (enums, ranges, an 8-hour freshness limit, forged values dropped), advances it deterministically from the new message, and returns the new state. Gemini never writes the state.
- **Repetition is not evidence.** Wishes, arguments, annoyance and "tomorrow" keep the recommendation. Only new facts (missed meals, genuine hunger, symptoms, night shift, a different situation) change it, and an unrelated topic lets a stale concern decay.
- **Trusted prompt assembly.** `system_instruction` is rebuilt server-side every turn from the personality lock (`src/lib/coach-personality.ts`: identity, selected roast level, humour-variation, banned phrases), the state directive, the language rule and the safety rules. User text only ever appears as input.
- **Output gate.** Replies are checked for the wrong script, caving or permission-granting, romantic softening, body or diet language, nagging advice and verbatim repeats; one corrective retry is allowed. Quick replies carry a role; capitulating or nagging roles are dropped and a translated "I'm actually hungry" option is added by the server.
- **Tools use the same decision.** Tools send `source: "tool"` (read-only): they receive the state but never advance it, and Midnight Food Rescue will not recommend a snack the chat already ruled out unless new information is given.
