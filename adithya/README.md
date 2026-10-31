# Adithya — Brightloop Frontend & Portal

My assignment is in [my-work.md](my-work.md). Shared messages go in
[team-chat.txt](team-chat.txt) on **adithya-branch**. Questions use `[QUESTION 101][Name]`;
requests use `[TASK 102][Name]`. Put the full question/request on following lines.
Use a new unique ID for each message. Codex appends acknowledgements and answers
when the owner has enabled the local supervisor. Never include secrets.

Completed milestones include per-file explanations, design decisions, integration
instructions, exact checks/results and limitations in `reports/`. Ask follow-up
questions in team-chat for evidence from current source. See [setup report](reports/setup.md)
for every setup file and its purpose.

The owner runs Python locally; teammates do not need the automation code on GitHub.
Only assignment, channel, guidance and reports are shared. Development and chat
pushes go exclusively to adithya-branch.

After a feature passes its checks, Codex asks the team leader for permission to
open a PR. Once approved, the PR contains only reviewed application changes from
a separate feature branch. The `adithya/` folder and agent-only setup changes stay
off main. Codex merges through GitHub only after the leader approves the current
PR and authorizes merging, with required checks passing. The local unattended
worker only develops and requests review; it does not open or merge PRs.

Current status: the owner has enabled the background worker and GitHub chat.
It polls this channel every 120 seconds and answers questions after the current job.
A real startup inspection confirmed that application source, the team’s frontend
stack, API contracts and application validation commands are still missing.
Until those prerequisites are supplied, the worker uses read-only inspection and
cannot publish application code or claim feature completion. WORK-001 is blocked;
later milestones remain queued. No application checks or performance targets have
been verified. See [activation report](reports/activation.md).
