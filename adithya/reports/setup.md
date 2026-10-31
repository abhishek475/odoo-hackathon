# Local agent setup — 31 October 2026

## What this repository contains

The only committed project file was the initial README (`23a7361`). No frontend
framework, source, API client, routes, application tests or build configuration
were available. The provided Brightloop assignment is Engineer 3's frontend and
portal scope; it does not authorize inventing the team's backend or replacing an
unknown app stack. The nine milestones have been installed, not implemented.

The previous nested `hackathon_codex_agent_v2/hackathon_codex_agent` directory was
consolidated into `adithya`. The earlier branch restriction `adithya-branch` was
replaced with the owner's requested `test-branch`. A local branch was created at
the initial commit; the open checkout remains main. A read-only GitHub branch
query found only remote main. No commits, remote branches, messages, pushes or
application code were published by this setup.

## Files intended for Git sharing

| File | Purpose and changes |
| --- | --- |
| `.gitignore` | Excludes the entire Python supervisor, config, runtime, worker checkout, bytecode and environment secrets. The ignore rules were verified with `git check-ignore`. No force-add is needed. |
| `AGENTS.md` | Repository guidance for Engineer 3 scope, preserving teammate code, test-branch-only development, honest validation and per-file explanations. |
| `adithya/README.md` | Teammate entry point: where to send questions/tasks, where reports live and current setup limitations. |
| `adithya/my-work.md` | The supplied Engineer 3 assignment, copied intact, including ordered WORK 001–009, UI requirements, backend dependencies and acceptance criteria. |
| `adithya/team-chat.txt` | Shared append-only message channel with documented task/question formats. No sample implementation task will accidentally execute. |
| `adithya/reports/setup.md` | This inventory, design rationale, validation evidence and current blockers. Future task reports explain their own application changes. |

Python does not need to be on GitHub: this owner's laptop runs it locally. The
channel and reports must be on test-branch for teammates to see and edit them.
The owner subsequently authorized a one-time publication of these shared files
to test-branch. Automatic worker execution and automatic pushes remain disabled.

## Private local files (ignored; never add to Git)

| File | Purpose and behavior |
| --- | --- |
| `adithya/automation/agent.py` | Sequential supervisor, process lock, structured JSON log formatter, offline dry run, startup controls, one owner milestone at a time, scoped worker prompts, validation gates, substantive-change detection, changed-file manifest/report creation and verified review notifications. Questions are prioritized after the active task and use read-only execution. |
| `adithya/automation/task_manager.py` | Supports `[WORK ID]`, `[TASK ID][Name]`, `[QUESTION ID][Name]` and older `[TEAMMATE][TASK ID]` forms. Excludes agent replies, deduplicates IDs, atomically persists queue/outbox and blocks interrupted running work on restart. Use new IDs for follow-ups. |
| `adithya/automation/chat_monitor.py` | Fetches remote channel, queues new requests and persists acknowledgements. Publishes via detached temporary worktrees with bounded normal-push retries and marker deduplication, preserving concurrent GitHub edits. Failed notifications remain queued. |
| `adithya/automation/codex_runner.py` | Fixes pipe deadlock by writing combined stdout/stderr directly to local files. Input is file-backed too. Polls chat while subprocesses run. On timeout/interruption terminates the process group with TERM, escalating to KILL after five seconds. Temporary prompts are removed afterward. |
| `adithya/automation/git_manager.py` | Uses trusted supervisor Git commands, detached isolated worktree, exact repository ownership check, strict test-branch destination, fetch/rebase/check/push retry loop, protected-file checks and bounded AI conflict handling. Never resets or force-pushes. No remote main merge/push path exists. |
| `adithya/automation/config.json` | test-branch destination, manual main integration, absolute private worktree path, 120-second polling, 1800-second Codex timeout, 300-second check timeout, three Git retries, dry_run true and auto_push false. Application checks deliberately empty until the actual app is available. |
| `adithya/automation/requirements.txt` | Documents Python standard-library-only implementation; no pip install needed. Git and Codex are external CLI requirements. |
| `adithya/automation/start.sh` | Starts supervisor with nohup and local log redirection, independent of the VS Code window. Duplicate execution is rejected by the Python file lock. |
| `adithya/automation/stop.sh` | Requests graceful stop; lets active task finish and preserves work. |
| `adithya/automation/status.sh` | Displays persistent queue, pause status and execution lock status. |
| `adithya/automation/pause.sh` | Prevents new tasks while leaving monitoring active; current task finishes. |
| `adithya/automation/resume.sh` | Clears pause flag; does not start a stopped process. |
| `adithya/automation/README.md` | Full local setup, publication boundaries, approval gates, foreground/detached commands, log paths, retry/recovery procedures and operational limits. |
| `adithya/automation/tests/test_parser.py` | Parser, deduplication, legacy format, question format and agent-reply exclusion tests. |
| `adithya/automation/tests/test_worker.py` | Real temporary-repository concurrent update/rebase retry tests, subprocess large-output/failure/timeout tests, in-flight chat queueing, interrupted task recovery, branch restrictions, disabled push gate, review notification rules and safe/unsafe conflict tests. Codex conflict edits are mocked. |
| `adithya/automation/archive/legacy-notes.md` | Preserved original README for reference; describes the older starter, not current configuration. |
| `adithya/automation/archive/legacy-work.md` | Preserved original placeholder assignment; inactive. |
| `adithya/automation/archive/legacy-chat.txt` | Preserved original sample request; inactive. |
| `adithya/automation/archive/legacy-gitignore.txt` | Preserved original starter ignore rules; inactive. |

Runtime files under `adithya/.runtime` are generated, not source. `state.json`
contains task/message state; `lock` prevents duplicate supervisors; `pid` is present
while running; `paused` and `stop` are control markers; logs capture subprocess
output locally; task `.md` files hold final worker answers. The offline demonstration
created a queue with nine milestones and no fabricated completion. Runtime is private
and ignored. The worker worktree is created only when approved live work starts.

## Why these choices

- Kept Python local because teammates need task context and reports, not access to
  your machine's supervisor, private configuration or runtime logs.
- Adapted the original Git workflow rather than maintaining competing workers.
- Used file-backed process output to remove the finite-pipe buffer deadlock while
  allowing the supervisor to keep polling. Validation and conflict subprocesses
  use the same runner.
- Kept Git publication in the supervisor and developer task execution in Codex's
  workspace-write sandbox. Questions use read-only mode.
- Require configured real lint/typecheck/tests/build gates and explicit enabling
  before live work; supervisor tests alone cannot validate an absent frontend.
- Record per-file explanations and actual check results in reports. Teammate
  questions are answered from repository evidence instead of guessed decisions.
- Do not auto-publish blocked/unfinished changes or claim a milestone because a
  Codex process exited successfully. No-code/whitespace-only output is not progress.

## Validation actually performed

- `codex exec --help`: verified installed noninteractive flags.
- `codex login status`: authenticated using ChatGPT.
- `git ls-remote --heads origin`: remote main only (performed read-only with network permission).
- `PYTHONPATH=adithya/automation python3 -B -m unittest discover -s adithya/automation/tests -v`: **16 tests passed**.
- Large-output test writes 4,000,000 bytes across stdout/stderr and queues a new
  teammate message while the simulated job runs; finishes without pipe deadlock.
- Git integration tests inject real concurrent remote commits into temporary bare
  repositories, verifying non-fast-forward retry, teammate content preservation
  and duplicate reply prevention. No real GitHub push was used for tests.
- `bash -n` on all five control scripts: passed.
- `python3 adithya/automation/agent.py --once --offline`: queued all nine milestones,
  selected WORK-001, executed no Codex calls, commits, worktrees or pushes.
- `git check-ignore` confirms Python/config/runtime excluded.

## Current blockers and practical limits

There is no frontend app or confirmed stack to extend yet. Actual backend contracts
and application validation gates are missing. At initial setup, remote test-branch and the shared channel had not been published;
the owner subsequently authorized their one-time publication. No unattended process is running. No application
feature, API integration, billing computation or performance SLA has been validated.

The subprocess and temporary-Git tests are not an end-to-end live Codex/GitHub run.
A workspace sandbox is not a guarantee against malicious repository content. AI
scope checks/conflict edits still need oversight. Git/network operations can delay
polling; there is no guarantee of instantaneous replies or hourly commits.
Interrupted/unpushed work requires owner inspection before explicit retry. Private
Python files must be backed up separately because a fresh clone will not include them.
