# systemd templates

These user-unit templates are shipped for the clay-blade ship ceremony. They are not installed by application development work.

## Units

| Unit | Cadence | Purpose |
| --- | --- | --- |
| `novique-content-worker.timer` | Daily 08:00 America/Chicago | Content discovery / plan / produce / metrics |
| `novique-social-queue.timer` | Every 5 minutes | Publish-queue dispatcher (Hobby-safe; Vercel Hobby forbids `*/5` crons) |

## Install at ship ceremony

1. Create `%h/.config/novique-worker/env` with mode `0600`. Include:
   - `NOVIQUE_WORKER_DIR` — checked-out repository path
   - API variables from `worker/README.md` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `SOCIAL_TOKEN_ENCRYPTION_KEY`, optional `BRAVE_API_KEY` / `DISCORD_WEBHOOK_URL`)
   - **Queue dispatcher:** `CRON_SECRET` (same as Vercel) and `NOVIQUE_SITE_URL=https://www.novique.ai`
2. Copy unit templates to `%h/.config/systemd/user/` with mode `0644`.
3. Use the fleet's approved service-install wrapper to reload user units and enable both timers.
4. Validate schedules, run each service once, and inspect journals before declaring the install complete.

The environment file is mandatory. Missing files or required variables intentionally fail the unit instead of creating a partial run.

Node is invoked via an absolute mise Node 22 path (user-manager `PATH` has no mise shims).

### Break-glass (manual only)

Direct `systemctl` is outside the normal IDE execution interface. If the ship ceremony explicitly authorizes manual activation, the operator may run:

```bash
systemctl --user daemon-reload
systemctl --user enable --now novique-content-worker.timer
systemctl --user enable --now novique-social-queue.timer
systemctl --user start novique-content-worker.service
systemctl --user start novique-social-queue.service
systemctl --user status novique-content-worker.service --no-pager
systemctl --user status novique-social-queue.service --no-pager
systemctl --user list-timers 'novique-*' --no-pager
```

Rollback disables both timers and removes the installed unit files; the in-repo templates remain unchanged.
