# API deployment controls

`/api/chat` enforces same-origin JSON requests, body limits, history limits, and a best-effort per-instance request limit. Production deployment must additionally enable platform-level rate limits, usage alerts, API quotas, and bot protection because serverless instance memory and CORS are not abuse controls.

Keep `GEMINI_API_KEY` server-side. Never prefix it with `VITE_`, store it in browser storage, or commit it. Restrict the key to the Gemini API and rotate it if exposed.
