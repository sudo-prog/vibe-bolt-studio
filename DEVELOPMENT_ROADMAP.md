# VIBE_BOLT_STUDIO — DEVELOPMENT ROADMAP

> Honest status as of 2026-07-22. Deployed to Cloudflare Pages as a static SPA,
> but **not functionally complete**. The app loads in a browser but cannot yet
> generate code, connect to models, or do the things a "vibe coder" is for.

---

## ✅ WHAT IS ACTUALLY DONE

- [x] Repo created: `github.com/sudo-prog/vibe-bolt-studio` (public, main)
- [x] Static site deployed to Cloudflare Pages: `https://vibe-bolt-studio.pages.dev`
- [x] `npm run build` produces a valid SPA (`build/client/index.html` present)
- [x] HTTP 200 on the live URL, real Bolt.diy app shell loads (`isSpaMode:true`)
- [x] Cloudflare OAuth token provisioned (Bitwarden `HERMES_CLOUDFLARE_OAUTH`)
- [x] `gemini-web2api:8081` verified serving free completions (no API key)

---

## ❌ WHAT IS NOT WORKING (core blockers)

### 1. No LLM provider wired → app cannot generate anything
- The deployed app has **no model configured**. Bolt.diy needs an OpenAI-Compatible
  provider `baseUrl` pointing at a working endpoint.
- Nothing was set in deployed config — it's a **runtime UI setting**, not code, so
  a fresh visitor hits the site with zero models and the chat does nothing.
- **Required:** point OpenAI-Compatible provider at `http://<host-ip>:8081`
  (gemini-web2api). Must be done by the user in the app UI, OR we bake a default
  into the provider list in code (`app/utils/constants.ts`).

### 2. Never browser-verified end-to-end
- I confirmed HTTP 200 + HTML shell only. I did **not** load the site in a browser,
  type a prompt, or confirm code generation. So "it's live" ≠ "it works."

---

## ⚠️ PARTIAL / UNVERIFIED (client-side logic exists, not proven in SPA deploy)

### 3. GitHub clone / pull existing project
- Logic is client-side (`GitUrlImport` / `Workbench.client.tsx`). Survives SPA mode.
- **Never tested** against the live deployment.

### 4. GitHub publish / push project
- Client-side (`workbenchStore.pushToGitHub` using user token from cookies).
- Survives SPA mode. **Never tested.**

---

## ❌ NOT STARTED (original intended features, zero progress)

### 5. Remote tunnel to VS Code (Linux/Mac)
- The whole reason you picked Cloudflare over Vercel. Not begun.
- Needs `cloudflared` tunnel + a way for the in-browser WebContainer to reach a
  local/remote VS Code. No code, no config, no plan executed.

### 6. OpenCode as default free-tier backend
- `opencode` installed locally (v1.18.4) with config pointing at `:8081`.
- But Bolt.diy was **never pointed at it** as the default provider.
- Not integrated into the deployed app.

---

## 🗑️ FEATURES DROPPED BY SPA MODE (removed to make the deploy succeed)

These were deleted because Cloudflare rejected the SSR Function. They are gone
from the current code and would need re-adding via client-side implementations:

- [ ] **Prompt enhancer** (`api.enhancer.ts`) — "enhance my prompt" button dead.
- [ ] **Model auto-listing** (`api.models.ts`) — model dropdown won't auto-populate
      from providers; must be entered manually.
- [ ] **Share / restore chat by URL** (`chat.$id.tsx`) — cannot reopen a saved chat
      via link.
- [ ] **Server-side LLM proxy** (`api.chat.ts`) — replaced by direct browser→provider
      calls (works only if provider baseUrl is reachable from the browser).

---

## 🔧 ROOT CAUSE OF THE 5-HOUR STRUGGLE (for the record)

1. **Vercel was the wrong target** — Bolt.diy is a Cloudflare-Pages-native Remix app;
   Vercel served a 404 (no `index.html`, no Remix adapter).
2. **Cloudflare SSR Function rejected the build** — `Uncaught SyntaxError: Unexpected
   reserved word` at worker line 68, repeatedly, even with `nodejs_compat` + compat_date
   2024-09-23 confirmed set via API. Cloudflare's publish-time Function wrapper, not our code.
3. **Fell back to SPA mode** — killed the Function + server routes. Site deploys, but
   lost server features and still has no model wired.

---

## 📋 NEXT STEPS (require user direction — not done)

| # | Task | Effort | Blocker |
|---|------|--------|---------|
| 1 | Bake default OpenAI-Compatible provider (baseUrl=:8081, no key) into `constants.ts` so the app works on first load | Low | none |
| 2 | Browser-verify: load site, send a prompt, confirm codegen works | Low | task 1 |
| 3 | Test GitHub clone + push against live deploy | Low | none |
| 4 | Set up `cloudflared` tunnel for remote VS Code access | Med | user network/setup |
| 5 | Point Bolt.diy default provider at local OpenCode | Low | task 1 |
| 6 | Re-add prompt-enhancer / model-listing client-side (optional) | Med | design decision |

---

**Bottom line:** The site is deployed but **not usable as a vibe coder yet**.
Tasks 1–2 are the minimum to call it "working." Tasks 4–5 were the original point
of the project and haven't been touched.
