# Vercel deployment

1. Import this repository into Vercel.
2. Keep the detected framework as Vite.
3. Add `GEMINI_API_KEY` as a server-side Production and Preview secret.
4. Optionally set `GEMINI_MODEL=gemini-3.8-flash`.
5. Deploy and verify `/`, a deep link such as `/app/tools`, and `POST /api/chat`.
6. Configure Gemini project quotas, Vercel rate limiting or firewall rules, usage alerts, and bot protection.

`vercel.json` rewrites non-API paths to `index.html` and deploys `api/chat.ts` as a serverless function. Do not deploy with a fake key. No public deployment URL has been verified from this workspace.

