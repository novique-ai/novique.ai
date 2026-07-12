# systemd templates

These user-unit templates are shipped for the clay-blade ship ceremony. They are not installed by application development work.

## Install at ship ceremony

1. Create `%h/.config/novique-worker/env` with mode `0600`. Include `NOVIQUE_WORKER_DIR` as the checked-out repository path, plus the required API variables documented in `worker/README.md`.
2. Copy both templates to `%h/.config/systemd/user/` with mode `0644`.
3. Use the fleet's approved service-install wrapper to reload user units and enable `novique-content-worker.timer`.
4. Validate the timer schedule, run the service once, and inspect its journal before declaring the install complete.

The environment file is mandatory. Missing files or required variables intentionally fail the unit instead of creating a partial run.

### Break-glass (manual only)

Direct `systemctl` is outside the normal IDE execution interface. If the ship ceremony explicitly authorizes manual activation, the operator may run:

```bash
systemctl --user daemon-reload
systemctl --user enable --now novique-content-worker.timer
systemctl --user start novique-content-worker.service
systemctl --user status novique-content-worker.service --no-pager
systemctl --user list-timers novique-content-worker.timer --no-pager
```

Rollback disables the timer and removes the two installed unit files; the in-repo templates remain unchanged.
