# Magic Storybook — Production README (v2)

Production-focused guide for deploying **ZZSTORYBOOK** safely with a backend proxy so API keys are never exposed in browser code.

---

## 1) Executive Summary

**Magic Storybook** is a web app that generates personalized children’s stories with:
- Multi-page story text
- Per-page illustrations
- Read-aloud narration (TTS)
- Story continuation (next chapter)

Current code runs fully in-browser (`index.html`), which is fine for prototyping but **not production-safe** for secrets. This guide documents a production architecture and rollout path.

---

## 2) Current Repository Layout

```text
ZZSTORYBOOK/
├─ index.html
├─ metadata.json
├─ archive/
│  ├─ App.js
│  └─ genai-service.js
└─ README_PROD.md
```

Notes:
- `index.html` is the active app implementation.
- `archive/` contains legacy files retained for reference.

---

## 3) Production Architecture (Recommended)

### Frontend
- Static app (can remain simple HTML/JS or migrate to Vite/React app structure)
- No direct GenAI SDK calls with privileged API keys
- Calls backend endpoints only

### Backend Proxy (Required)
- Hosts all GenAI model calls server-side
- Stores API key in server environment variables
- Applies:
  - Input validation
  - Rate limiting
  - Basic abuse controls
  - Error normalization/retry policy
  - Optional request logging/telemetry

### Data Flow
1. Browser submits story inputs to backend
2. Backend calls story model and returns JSON pages
3. Browser requests images/audio per page via backend
4. Backend returns image/audio payloads

---

## 4) Security Controls (Minimum Viable)

### Must-Haves
- **No API keys in frontend code**
- Server-side env var for GenAI key
- CORS restricted to your production domain
- Rate limiting by IP/session/user
- Payload size limits (prevent abuse)
- Basic content moderation guardrails
- Dependency vulnerability checks in CI

### Recommended
- Bot protection (e.g., Turnstile/hCaptcha on public endpoints)
- Request signing or lightweight auth for write-heavy routes
- Structured logs + alerting for 429/5xx spikes
- Key rotation process (quarterly or on incident)

---

## 5) API Contract (Suggested)

> You can evolve these contracts, but keep responses deterministic for UI stability.

### `POST /api/story/generate`
**Request**
```json
{
  "name": "Leo",
  "animal": "Dragon",
  "activity": "Jumping in puddles",
  "place": "Cloud City",
  "color": "Sparkly Blue",
  "toy": "Mr. Bear",
  "length": "Short",
  "complexity": "Simple"
}
```

**Response**
```json
{
  "pages": [
    {
      "pageText": "...",
      "illustrationPrompt": "..."
    }
  ]
}
```

### `POST /api/story/continue`
Extends an existing story context.

### `POST /api/image/generate`
Returns page illustration as:
- `data:image/png;base64,...` **or**
- object storage URL (preferred at scale)

### `POST /api/audio/tts`
Returns PCM/WAV/MP3 payload for read-aloud.

---

## 6) Error Handling & Resilience

### User-facing behavior
- Friendly error messages (no raw stack traces)
- Retry option for transient failures
- Dedicated quota/rate-limit messaging for 429

### Backend behavior
- Retry with exponential backoff for transient 5xx
- Circuit-breaker style cooldown if provider instability spikes
- Standardized error envelope

**Suggested error envelope**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "The storyteller is resting. Please try again in a minute.",
    "retryAfterSeconds": 60
  }
}
```

---

## 7) Deployment Options

## Option A — Vercel (Frontend + Serverless API)
- Frontend: static host
- Backend: `/api/*` serverless routes
- Store `GEMINI_API_KEY` in Vercel project env vars
- Restrict CORS to production URL

## Option B — Netlify + Functions
- Frontend: Netlify static hosting
- Backend: Netlify functions for model calls
- Set secrets in Netlify Environment Variables

## Option C — Cloud Run / Render / Fly.io
- Containerized Node backend + static frontend host
- Better control for heavier traffic and queues

---

## 8) Environment Variables

Backend only:

```bash
GEMINI_API_KEY=...
APP_ENV=production
ALLOWED_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
```

Optional:

```bash
LOG_LEVEL=info
REQUEST_TIMEOUT_MS=30000
```

---

## 9) CI/CD Quality Gates

Before deploy, enforce:
- Lint + type checks (if migrated to TS)
- Unit tests for input validation and response shaping
- Secret scanning (gitleaks/trufflehog or platform-native)
- Dependency audit
- Basic smoke tests against staging endpoints

---

## 10) Observability

Track these KPIs in production:
- Story generation success rate
- P95 latency by endpoint (`story`, `image`, `tts`)
- 429 rate and retry success
- Error rate by model endpoint
- Average tokens/req (if available)
- Cost per session/story

---

## 11) Privacy & Compliance Notes

- Treat child-entered text as potentially sensitive user content.
- Publish clear privacy notice (what is sent to model provider, retention policy).
- Avoid storing raw prompts/responses unless required; if stored, define TTL and access controls.
- Add data deletion path for user-requested removal.

---

## 12) Migration Plan (Low-Risk)

### Phase 1 — Stabilize
- Keep UI mostly unchanged
- Move model calls to backend
- Preserve existing UX flows

### Phase 2 — Harden
- Add rate limiting, logging, moderation, retries
- Add staging environment + smoke tests

### Phase 3 — Scale
- Cache repeated assets
- Optional queue for image/TTS generation
- Add account/session controls if needed

---

## 13) Rollback Plan

If production deployment fails:
1. Revert to prior stable frontend release
2. Disable new API routes and re-enable previous stable version
3. Rotate API key if any exposure suspected
4. Review logs and incident notes before redeploy

---

## 14) Known Repository Context

- Legacy files are now in `archive/` and not part of active runtime flow.
- `index.html` currently includes direct client-side model logic; production should route through backend proxy endpoints.

---

## 15) Recommended Next Step

Implement a minimal Node/Express (or serverless) backend with these three endpoints first:
- `/api/story/generate`
- `/api/image/generate`
- `/api/audio/tts`

Then update frontend calls to use your backend base URL and remove all client-side API key handling.

---

## 16) Security Quick Rules (Commit Gate)

Before every commit/push, verify all of the following:

1. No `.env` files or secrets are staged (`.env`, keys, certs, tokens, private JSON credentials).
2. `node_modules/` is never committed.
3. No API keys are present in `index.html`, JS, or config files.
4. All GenAI calls route through backend API endpoints only.
5. CORS is restricted to approved production/staging origins.
6. Rate limiting is enabled on story/image/tts endpoints.
7. Logs do not include raw secrets or full credential payloads.
8. Dependency/security scan passes (or documented exception approved).

**Stop-ship rule:** If any item above fails, do not deploy.
