# Social test scope

`publishExecutor` idempotency is intentionally not unit-tested with a lightweight stub in WS7. Its decisions are interleaved with several durable Supabase compare-and-set chains (`social_posts`, `social_accounts`, and `social_publish_attempts`), token decryption/refresh, platform-client dispatch, and post-result reconciliation. A small mock would mostly test the mock’s fluent-query behavior and could conceal transaction or race errors.

The appropriate integration harness needs:

- an isolated Supabase/Postgres instance with migrations 005–011 applied;
- controllable platform-client fakes that can succeed, fail permanently, fail retryably, or return an ambiguous outcome;
- fixtures for started, unknown, failed, and succeeded attempts sharing an idempotency key;
- concurrent dispatch coverage for unique-key and compare-and-set races;
- assertions for adoption, retry, `needs_review`, and “platform succeeded/local write failed” recovery paths.

No executor refactor was made for this task.
