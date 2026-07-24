# ARCHITECTURE — VIBE_BOLT_STUDIO Control Hub

> Status: 2026-07-24 — research + architecture synthesis. NOT yet implemented.
> Decision owner: user (Justin "Dmitri" Cor…). Implementation via Orca (chief-of-staff orchestrates, does not code directly).

---

## 1. Vision

VIBE_BOLT_STUDIO becomes the **central control hub** for all your deployed projects (Vercel apps + GitHub repos). From one interface you:

1. Load any live project URL in a preview window
2. Click / select elements in that window (Google AI Studio / Lovable style)
3. Describe a change in the chat
4. Route the change to an agent (**Hermes / Orca / VS Code**) that clones the GitHub repo, edits, pushes, and redeploys
5. Manage multiple projects as separate **tabs**, each with its own chat + agent config

---

## 2. Architecture Decision: Agentic Loop (Option A)

We chose **Option A** over bolt.diy's native WebContainer model.

| | bolt.diy native | Our Hub (Option A) |
|---|---|---|
| App runs | IN-BROWSER via WebContainer (Node-in-browser) | EXTERNAL live URL (your other Vercel apps) |
| Edits happen | In-browser WebContainer FS | On the real GitHub repo via agent |
| Preview | Local dev server | Proxied live deployment |

**Key consequence:** the target apps already exist and are deployed. The hub is a **control plane**, not a code generator. Therefore we can **DROP the WebContainer dependency entirely** — no COOP/COEP headers, no Node-in-browser, simpler Cloudflare deploy. The real components are: chat + GitHub + preview-iframe + element-picker + agent-router.

---

## 3. Component Breakdown

### 3.1 Visual Element Picker (the crux)

**Model:** Lovable's Visual Edits (proven in production, March 2025).

**Mechanism:** a Cloudflare Worker proxy in front of each target app.

```
hub.example.com/p/:projectId/*   ──proxy──▶   project.vercel.app
        │                                        │
        │  on HTML response:                     │
        │   • inject <script src="/picker.js">   │
        │   • (optional) data-bolt-id tagging    │
        ▼                                        ▼
   picker.js runs in app context (same-origin via Worker domain)
        • MutationObserver tags every element with stable data-bolt-id
        • hover  → blue overlay + tooltip (tag, classes, boltId)
        • click  → capture {boltId, tagName, xpath, outerHTML, rect}
                  → postMessage → parent hub
```

Hub receives the message, renders an **"element chip"** in the chat input. User types the change, sends. Agent payload:

```json
{
  "project": "looking-glass",
  "selectedElement": { "boltId": "b-1a2b", "tagName": "button",
                       "xpath": "/html/body/div[2]/button",
                       "outerHTML": "<button class='cta'>…</button>" },
  "prompt": "make this button rounded and primary-coloured"
}
```

**Why Cloudflare Worker:** you're already on Cloudflare Pages. A Worker is free-tier, sits in front of *any* Vercel app, rewrites HTML on the fly. **No changes to the target Vercel project needed.** Solves the cross-origin iframe problem (the proxied app is same-origin with the hub, so DOM access + postMessage work).

**Latency note:** proxy adds ~tens of ms per load. Acceptable for a dev hub.

### 3.2 Multi-Tab Project Manager

- State store (Zustand) keyed by `projectId`
- Each tab: `{ projectId, name, githubRepo, vercelProject, previewUrl, agentConfig, chatHistory[], selectedElements[], branch }`
- Tab bar to swap; per-tab isolated chat + agent routing
- bolt.diy's existing multi-project / tab infra is the base to extend

### 3.3 Agent Router

Chat message + selected elements → router → one of:

| Target | How | Use |
|---|---|---|
| **Hermes (direct)** | chief-of-staff tools | quick fixes, orchestration |
| **Orca** ⭐ default for code | `orca-dev` CLI → local terminal coding agent | real repo edits |
| **VS Code (remote)** | Tailscale-reachable instance | your earlier Cloudflare/Tailscale decision |

Agent payload → clone repo → edit → push → Vercel/Cloudflare auto-deploy → preview reloads.

### 3.4 GitHub ↔ Deploy Pipeline

Already proven on your other projects (Looking Glass, WWW Studio):
- Agent clones repo (GitHub SSH, `sudo-prog`)
- Edits via Orca / VS Code
- Pushes to branch
- Vercel (or Cloudflare Pages) auto-deploys
- Preview iframe reloads with the change

---

## 4. Phases

### Phase 0 — Unblock (BLOCKER, do first)
- [ ] Restore `/api/chat` route (deleted for SPA mode — **currently every prompt 404s**)
- [ ] Wire default provider to `gemini-web2api:8081` (free, no key) OR OpenCode (local, free) — **NOT** `api.opencode.ai` (doesn't exist)
- [ ] Add provider keys to `.env` + `.env.example`
- [ ] Verify chat works end-to-end (send prompt → response)

> Without Phase 0, nothing else functions. This is the #1 priority.

### Phase 1 — Chat Hub + Preview Window
- [ ] Working chat (Phase 0)
- [ ] Preview iframe loading external live URL (direct, pre-proxy)
- [ ] Per-project tab state store + tab bar
- [ ] Per-tab chat history

### Phase 2 — Visual Element Picker
- [ ] Cloudflare Worker proxy (HTML rewrite + script inject)
- [ ] picker.js (hover overlay, click capture, postMessage)
- [ ] Hub listener + element-chip UI in chat input
- [ ] Multi-select (Cmd/Ctrl click)

### Phase 3 — Agent Router
- [ ] Router service (Hermes / Orca / VS Code)
- [ ] Orca integration via `orca-dev` (clone → edit → push)
- [ ] VS Code / Tailscale remote path
- [ ] Structured payload assembly from chat + selected elements

### Phase 4 — Polish
- [ ] Auto-deploy + preview reload on push
- [ ] Per-project agent config persistence
- [ ] Agent status / error handling in UI

---

## 5. PWA Studio Reuse Assessment

Investigated `20.12_PWA_STUDIO` (PWA Studio Pro + mobile):

- Its "inspector" (`studio.tsx`) is a **widget-grid layout inspector** for an internal dashboard — NOT a live-app element picker.
- `mockupPreviewPlugin.ts` is a **Vite mockup file-watcher** — zero overlap with clicking external apps.
- It shares the www-studio api-server lineage (kanban/projects schema) but a different frontend.

**Recommendation: DO NOT merge.** The hub is its own product on the bolt.diy base. If we later want a backend for project/kanban management, we can borrow the schema pattern — optional, not now.

---

## 6. Constraints

- **NO PAID MODELS:** default provider must be free-tier (`gemini-web2api:8081` or OpenCode local). Never proxy to paid APIs.
- **Cloudflare Pages + Tailscale** is the chosen deploy/tunnel stack (not Vercel for this app).
- **All technical implementation via Orca** (chief-of-staff orchestrates, does not code directly).

---

## 7. Open Questions

1. Does the picker need to work on apps NOT behind the Worker (e.g. direct Vercel URL)? If yes, a browser-extension / bookmarklet fallback is needed. **Recommendation: require Worker proxy (simplest, same-origin).**
2. Per-project agent config: store in hub DB or in repo `.vibe-bolt.json`? **Recommend repo-side config for portability.**
