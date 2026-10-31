# Agent activation — 31 October 2026

The owner explicitly enabled autonomous work and chat. The local configuration
now has dry_run=false and auto_push=true, with publication restricted to
adithya-branch. Private Python, configuration, logs and state remain ignored and
are not included in GitHub commits. PR creation and main merging still require
the separately documented team-leader approvals and interactive handoff.

## Live checks and findings

- Codex CLI was initially 0.142.5. Real task execution failed with an unsupported
  model error, including for a model advertised in its account model cache.
- `codex doctor --summary --ascii --no-color` verified configured authentication,
  reachable provider endpoints, healthy local state, and an available CLI update.
- The official `codex update` successfully installed 0.166.0. Authentication was
  preserved; the supervisor uses explicit model gpt-6.1-sol and restricted sandbox
  flags. No credentials were printed or committed.
- A subsequent real Codex run completed repository inspection for WORK-001. It
  found no frontend framework, application source, routes, API client, build or
  test setup. WORK-001 remains BLOCKED; no fake implementation was committed.
- An explicitly labelled owner startup-test question was posted to team-chat,
  then fetched/queued by the service, acknowledged on GitHub and answered by a
  real read-only Codex run. The answer explains Engineer 3 scope and missing
  prerequisites. No teammate identity was impersonated.
- Eighteen supervisor tests pass, including the earlier output, queue, Git retry,
  conflict and recovery coverage plus missing-check publication protection and
  team-leader permission wording. These are supervisor tests, not app validation.
- The initial nohup launch did not survive command-runner cleanup. The active
  worker is instead a verified running systemd user service named
  `adithya-hackathon-agent.service`. It holds the exclusive execution lock and
  logs privately. This transient service survives chat/terminal closure, but must
  be started again after reboot. The laptop must stay awake and online.

## Files changed for activation

| File | Change and reason |
| --- | --- |
| `adithya/README.md` | Replaces stale disabled status with actual live-chat status and clear implementation prerequisites. Shared. |
| `adithya/reports/activation.md` | This operational evidence and file inventory. Shared. |
| `adithya/automation/agent.py` | Allows live chat/inspection with missing app gates, enforces read-only mode while they are missing, and still rejects code publication unless real required checks pass. Uses an explicit account model and isolated checkout path. Flushes notifications after tasks, logs successful polling and final responses, and reloads local configuration each iteration. Local only. |
| `adithya/automation/codex_runner.py` | Gives child processes the checkout PWD and clears inherited session/thread IDs, while retaining sandbox controls. Keeps file-backed output and process-group timeout cleanup. Local only. |
| `adithya/automation/git_manager.py` | Uses the explicitly configured model and current CLI invocation for conflict resolution as well. Git destination and protected-file restrictions remain enforced. Local only. |
| `adithya/automation/config.json` | Enables approved execution/publication and specifies model gpt-6.1-sol. App checks remain unconfigured rather than replaced with artificial passing commands. Local only. |
| `adithya/automation/start.sh` | Prefers a persistent user systemd service when available, rejects duplicate starts, and falls back to nohup elsewhere. Local only. |
| `adithya/automation/README.md` | Adds actual activation, systemd controls, reboot limitation, CLI fix and prerequisite recovery instructions. Local only. |
| `adithya/automation/tests/test_worker.py` | Adds tests proving missing gates permit communication but cannot validate code, and review notifications request team-leader permission. Local only. |

## Next prerequisite

Engineer 3 needs the actual team app source and confirmed frontend stack, plus
Engineer 2's API contracts (authentication, roles, product/variant/template,
subscription lifecycle, customer invoices/payment and finance endpoints). The
frontend must consume authoritative backend financial values and access control.
Provide the project rather than asking the worker to guess a framework. Configure
real app gates locally, inspect the preserved worker checkout, then explicitly
retry WORK-001. Teammate questions can be answered while implementation is blocked.
