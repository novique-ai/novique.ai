# Social system architecture and operations

## Architecture

The social system has three execution surfaces with Supabase as their shared durable boundary:

- **Control plane — Supabase:** campaigns, research/artifacts, approvals, social posts, OAuth accounts, publish attempts, queue leases, template probation, and metric snapshots. Row-level security protects operator-facing access; service-role credentials stay server-side.
- **Site — novique.ai:** `/admin/social` is the operator surface for accounts, editing, approvals, queueing, manual publishing, and metrics. Vercel callbacks persist OAuth transactions and the short publish executor calls the direct X, LinkedIn, and Meta adapters.
- **Worker — clay-blade:** the idempotent TypeScript worker performs discovery, planning, research, article generation, and fixed-window metric collection. It runs as a systemd user timer with its own mandatory environment file and never depends on an interactive shell.

## Approval gates

1. **G1 — weekly plan:** the worker proposes the week’s campaign set. An operator approves, rejects, or changes the selection in `/admin/social/approvals` before research and drafting proceed.
2. **G2 — canonical article:** generated articles enter the blog review flow as `pending_review`. The operator checks claims, sources, copy, and imagery; publishing the approved article triggers derivative fan-out.
3. **G3 — derivative probation:** each platform/template pair starts in probation. Its derivatives require post review until it reaches the configured clean-publish threshold (default five) or an operator explicitly trusts it. Trusted templates auto-queue future derivatives. A new or suspended template and a new image style return to review.

Native platform posts use the same G3 review path. Probation reduces repetitive review; it never bypasses G1 or G2 for canonical content.

## Operational runbook

### Approval inbox

Open `/admin/social/approvals` and work oldest pending items first:

- approve or reject the weekly plan (G1), adding selection notes when needed;
- review canonical articles in the blog editor (G2);
- compare post-review copy, hashtags, media, and platform preview before approving a probationary derivative (G3);
- approve template probation or image-style cards only after the examples are consistently acceptable.

An approved post review moves its post to `queued` and enqueues it immediately. A rejection leaves the post in draft with the decision context available for revision.

### `needs_review`

`needs_review` means a prior publish may have reached the platform but the executor lacks a trustworthy durable result. Do not retry blindly.

1. Open the post and identify the selected account and attempted platform.
2. Check the platform directly for the expected content/media and publication time.
3. If it exists, record/reconcile the platform result through the supported admin flow before any new attempt.
4. If it does not exist, return the post to a valid editable state, correct the cause, and publish manually once.

### Queue failures and dead-letter alerts

The publish-queue dispatcher (clay-blade timer → `/api/cron/process-social-queue`) claims due rows in bounded leases and retries retryable failures with 1-, 5-, and 25-minute backoff. At the configured maximum (three attempts by default), it removes the item from active processing, marks the post failed, and sends a Discord dead-letter alert. Treat the alert as requiring operator action: inspect `error_details`, account token status, and the matching publish-attempt ledger before requeueing. Ambiguous or stale `publishing` work is routed to `needs_review`, not automatically retried.

### Worker commands

Run from the repository root:

```bash
npm run worker:discover
npm run worker:plan
npm run worker:produce
npm run worker:run
npx tsx worker/index.ts metrics
npx tsx worker/index.ts metrics --digest
npm run worker:typecheck
```

The full environment contract and stage behavior are in [`worker/README.md`](../worker/README.md).

### systemd install on clay-blade

Installation is a ship-ceremony operation, not part of application development:

1. Create `%h/.config/novique-worker/env` with mode `0600`. Set `NOVIQUE_WORKER_DIR` to the checkout and add the required Supabase, Anthropic, token-encryption, research, alert, **and queue** variables (`CRON_SECRET`, `NOVIQUE_SITE_URL=https://www.novique.ai`).
2. Copy `worker/systemd/novique-content-worker.{service,timer}` and `novique-social-queue.{service,timer}` to `%h/.config/systemd/user/` with mode `0644`.
3. Use the fleet’s approved service-install wrapper to reload user units and enable **both** timers.
4. Validate schedules, run each service once, and inspect journals. Detail: [`worker/systemd/README.md`](../worker/systemd/README.md).

**Why clay-blade owns the 5-minute queue:** Vercel Hobby only allows daily cron jobs. The social queue dispatcher therefore runs on clay-blade (`novique-social-queue.timer`) and calls `GET /api/cron/process-social-queue` with `Authorization: Bearer $CRON_SECRET`. Do not reintroduce a `*/5` schedule in `vercel.json` without upgrading the Vercel plan.

## Ship checklist

- [ ] Apply social migrations in order: `007_oauth_transactions.sql`, `008_publish_engine.sql`, `009_content_campaigns.sql`, `010_metric_snapshots.sql`, then `011_hashtag_normalization.sql`. Do not infer order from other same-numbered CRM migrations.
- [ ] Create a **public** Supabase Storage bucket named `social-media`; Instagram must be able to fetch the published media URLs.
- [ ] Set project-level Vercel Preview and Production variables: `SOCIAL_TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`, `DISCORD_WEBHOOK_URL`, all required `TWITTER_*`, `LINKEDIN_*`, and `META_*` values, and `NEXT_PUBLIC_SITE_URL`.
- [ ] Run `npx tsx scripts/encrypt-social-tokens.ts` with the production encryption key available; verify no plaintext social tokens remain.
- [ ] Reconnect X and confirm the granted scope contains `offline.access`.
- [ ] Reconnect LinkedIn and confirm the granted scopes contain `openid` and `profile` plus the posting scopes required for the selected member/organization mode.
- [ ] Install and validate the worker systemd units on clay-blade with its `%h/.config/novique-worker/env` file.
- [ ] Verify one **manual** publish on each **allowed** connected platform (see Meta gate below). Confirm the platform URL, local `published` state, durable attempt, and media where applicable.

### Meta / Instagram / Facebook publish gate (STRICT)

Previous Instagram account restriction for “automated posting” — treat Facebook and Instagram as **operator-gated** until explicit re-approval:

1. **Do not** enable unattended/cron auto-publish to Facebook or Instagram.
2. **Do not** run cutover smoke publishes to Facebook or Instagram without an explicit human go-ahead in the cutover session.
3. Prefer proving the stack on **X and LinkedIn first** (manual publish + readback).
4. When Meta smoke is approved later: one human-initiated manual publish only, no burst, no queue fan-out, no retry storm; stop immediately on any restriction/warning.
5. Keep Meta app tokens/env staged if needed for OAuth reconnection, but leave FB/IG accounts disconnected or non-queued until the gate is lifted.

Cutover default: **X + LinkedIn only**. Facebook and Instagram remain blocked for publish smoke until the operator lifts this gate.

Migration 005 contains a historical `claude-3-haiku` comment. Migrations are immutable history, so the comment remains unchanged; active Claude defaults use the current `claude-haiku-4-5` alias.
