# Novique.ai content worker

The worker runs the long-form content pipeline on an always-on Linux host. Supabase is the control plane; the website remains the approval, editing, and publishing surface.

## Environment

The full `worker:run` path requires:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
```

Optional variables:

```dotenv
BRAVE_API_KEY=...          # Without it, production research warns and uses the selected feed item.
DISCORD_WEBHOOK_URL=...    # Without it, alerts are logged as warnings.
WORKER_FEEDS_JSON='["https://example.com/feed.xml"]' # Test-only feed override.
```

Required variables are read from `process.env` and throw a named error when the command reaches the capability that needs them. There are no silent credential fallbacks. Keep the service-role key only on the worker host and never expose it through `NEXT_PUBLIC_*`.

## Commands

Install dependencies, then run from the repository root:

```bash
npm run worker:discover
npm run worker:plan
npm run worker:produce
npm run worker:run
npm run worker:typecheck
```

| Command | Purpose |
| --- | --- |
| `worker:discover` | Fetch feeds, batch-score candidates with Haiku 4.5, and write `worker/state/candidates.json`. |
| `worker:plan` | Draft three briefs, create proposed campaigns, create one pending weekly-plan approval, and alert Discord. |
| `worker:produce` | Produce campaigns selected by approved weekly plans and create `pending_review` blog posts. |
| `worker:run` | Daily idempotent entry point: refresh stale candidates, ensure the current week's plan exists, then produce approved work. |
| `worker:typecheck` | Type-check only the worker surface. The application remains covered by `npx tsc --noEmit`. |

An approved plan may select campaigns through `selected_campaign_id`, `selected_campaign_ids`, an ID or one-based item number in approval notes, or equivalent notes in the payload. If the approval has no selection, every proposed campaign in that approval is eligible, matching the approval contract.

## Production stages

| Stage | Durable location | Artifact kind | Model |
| --- | --- | --- | --- |
| Discovery scoring | `worker/state/candidates.json`, usage ledger | — | Haiku 4.5 |
| Weekly brief | `content_campaigns.topic_brief`, approval payload | — | Haiku 4.5 |
| Research | `content_campaigns.source_bundle` plus source excerpts | `brief` with `meta.stage=research` | Brave/feed + page fetch |
| Outline | Markdown | `outline` | Sonnet 5 |
| Draft | Markdown with inline source links | `draft` | Sonnet 5 |
| Editorial | Revised Markdown | `editorial` | Sonnet 5 |
| Fact check | Structured claims, verdicts, sources, flags, optional safe revision | `fact_check` | Sonnet 5 |
| Final | Publishable Markdown and generated blog metadata | `final` | Sonnet 5 |

Migration 009 does not define a `research` artifact kind. Research therefore uses the existing `brief` kind and identifies itself unambiguously in artifact metadata; the full structured source bundle also lives on the campaign. Every Claude-backed artifact stores the same per-call token/cost record that is appended to `worker/state/usage.jsonl`.

The final blog insert follows the existing generator shape: HTML and Markdown bodies, summary, meta description, tags, admin author, `ai_generated`, AI provenance/metadata, exactly three `key_insights`, `core_takeaway`, and `status=pending_review`. Publishing remains an operator action and triggers the existing WS4a derivative fan-out.

## Budget guard

The worker sums the current calendar month's `cost_usd` values from `worker/state/usage.jsonl`. If spend is at or above `monthly_token_budget_usd` in `worker/config.json`, `worker:run` skips all generation and sends/logs an alert. Production re-checks before every Claude stage, so a run that crosses the threshold stops before its next generation call. Research and saved artifacts remain available for a later resume.

Pricing in `worker/config.json` is used only for the local estimate. Review it whenever model pricing changes.

## Offline feed smoke test

This exercises the real discovery command with an unreachable local feed. Feed failure is a warning, the command writes an empty candidate file, and Claude is not called because there are no candidates:

```bash
WORKER_FEEDS_JSON='["http://127.0.0.1:9/unreachable"]' npm run worker:discover
```

## systemd timer

Templates live in `worker/systemd/`. The timer runs daily at 08:00 in `America/Chicago` and uses the mandatory environment file `%h/.config/novique-worker/env`. Set `NOVIQUE_WORKER_DIR` in that file to the repository checkout. See `worker/systemd/README.md` for ship-ceremony install, validation, and rollback notes.
