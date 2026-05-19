# Audit Note — AIPodcastProducer

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_06.md` section #26.

## Original Recommendations

### Gaps — AI Counterparts
- `/guest-fit-score`
- `/episode-quality-score`
- `/audience-sentiment-analyze`

### Gaps — Non-AI Features
- Podcast host integration (Buzzsprout, Anchor)
- Audience/email-list management
- Monetization (sponsorship/affiliate)
- Listener growth analytics
- YouTube/video integration

### Custom Feature Suggestions
1. Agentic episode orchestration (end-to-end)
2. Real-time transcription + editing
3. Audience intelligence
4. Guest matching
5. Multi-platform publishing

## Implemented (Mechanical)
- `POST /api/ai/guest-fit-score` — added in `backend/routes/ai.js`. Scores prospective guest fit with strengths/risks/topics. Persists via `saveAiResult`.
- `POST /api/ai/episode-quality-score` — added in `backend/routes/ai.js`. Pulls transcript by `episode_id` (or accepts inline) and returns multi-factor production-quality scoring.
- `POST /api/ai/audience-sentiment-analyze` — added in `backend/routes/ai.js`. Accepts feedback string/array, returns themes, complaints, requests, praise, recommended actions.

All three follow existing `callOpenRouter`/`parseAIJson`/`auth`/`aiRateLimiter`/`saveAiResult` style.

## Backlog (deferred)

### NEEDS-CREDS / NEW-DEPS
- Podcast-host APIs (Buzzsprout, Anchor, Transistor) — credentials.
- Email list integration (Mailchimp, ConvertKit).
- YouTube Data API.
- Real-time transcription (Whisper / Deepgram).

### NEEDS-PRODUCT-DECISION
- Sponsorship/affiliate tracking schema.
- Multi-platform publishing format definitions.

### TOO-RISKY
- End-to-end agentic episode pipeline (orchestrator + queue infra).
- Video clip auto-extraction (ffmpeg infra).

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS — FE already wired.
- All three pass-2 endpoints already have dedicated Vite-React pages styled with the project's CSS conventions:
  - `frontend/src/pages/GuestFitScorePage.jsx` → `POST /api/ai/guest-fit-score` (form + score/strengths/risks/topics view).
  - `frontend/src/pages/EpisodeQualityPage.jsx` → `POST /api/ai/episode-quality-score` (transcript or `episode_id`; factor breakdown).
  - `frontend/src/pages/AudienceSentimentPage.jsx` → `POST /api/ai/audience-sentiment-analyze` (themes/praise/complaints/requests/actions).
- Routes mounted at `/ai-guest-fit-score`, `/ai-episode-quality`, `/ai-audience-sentiment` in `App.jsx`.
- Auth via central axios `api` instance (`frontend/src/services/api.js` — Bearer from `localStorage.token` interceptor).
- 503/no-key handling: page surfaces `err.response?.data?.error` via `react-hot-toast`.
- No new files needed.

## Apply pass 4 (mechanical backlog)

Implemented 4 additional mechanical AI endpoints from the audit's "Custom Feature Suggestions" (Audience intelligence, Multi-platform publishing, Listener-growth analytics):

**Backend** (`backend/routes/ai.js`):
- Added `AIKeyMissingError` + guarded `callOpenRouter` so all AI endpoints (existing + new) now return 503 with `{error: "AI not configured: OPENROUTER_API_KEY is missing"}` when the key is unset.
- `POST /api/ai/episode-topic-cluster` — clusters supplied topics or recent episode titles into thematic pillars and gaps. Strict-JSON output.
- `POST /api/ai/cross-promo-finder` — surfaces realistic cross-promo opportunities, swap formats, and an outreach template.
- `POST /api/ai/listener-growth-strategy` — phased 90-day growth plan with KPIs and experiments.
- `POST /api/ai/multiplatform-publishing-prep` — repurposes an episode (transcript / summary / `episode_id`) into per-platform packages (YouTube/blog/Twitter/LinkedIn/IG/newsletter/TikTok) plus video-clip briefs and email subject lines.

All four use existing `auth`, `aiRateLimiter`, `parseAIJson`, and `saveAiResult` helpers.

**Frontend**:
- New pages: `EpisodeTopicClusterPage.jsx`, `CrossPromoFinderPage.jsx`, `ListenerGrowthStrategyPage.jsx`, `MultiPlatformPublishingPage.jsx`. Each: form → `api.post` → parsed/raw render. Auth via existing axios interceptor (Bearer from `localStorage.token`). 503 surfaced with `AI unavailable: ...` toast.
- Routes registered in `frontend/src/App.jsx` (`/ai-episode-topic-cluster`, `/ai-cross-promo-finder`, `/ai-listener-growth-strategy`, `/ai-multiplatform-publishing`).
- Sidebar entries added in `frontend/src/components/Layout.jsx` under "AI Tools".

Smoke-tested: 503-on-no-key path verified end-to-end with JWT bearer.

No new dependencies. No `npm install` run. Syntax-checked via `node --check` (backend) and `@babel/parser` (frontend JSX).
