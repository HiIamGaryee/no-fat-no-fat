# Deployment

## Netlify

1. Import this repository into Netlify.
2. Use `npm run build` as the build command and `dist` as the publish directory. These values are also defined in `netlify.toml`.
3. In **Site configuration → Environment variables**, add `GEMINI_API_KEY` for Production and Deploy Previews.
4. Trigger a new deployment after saving the environment variable.
5. Verify `/`, `/app/settings`, and `POST /api/chat`.

`netlify.toml` routes `/api/chat` to the Netlify Function before applying the React SPA fallback. The Gemini key must never use a `VITE_` prefix or appear in client code.

## Vercel

1. Import this repository into Vercel.
2. Keep the detected framework as Vite.
3. Add `GEMINI_API_KEY` as a server-side Production and Preview secret.
4. Deploy and verify `/`, a deep link such as `/app/tools`, and `POST /api/chat`.
5. Configure Gemini project quotas, Vercel rate limiting or firewall rules, usage alerts, and bot protection.

`vercel.json` rewrites non-API paths to `index.html` and deploys `api/chat.ts` as a serverless function. Do not deploy with a fake key. No public deployment URL has been verified from this workspace.

