# Adithya — Brightloop Frontend & Portal

**Conversation ID: ADITHYA-BRIGHTLOOP-01**

Open [team-chat.txt](team-chat.txt) on **adithya-branch**, append your message at the
bottom in normal English, and commit the edit. No task IDs, tags or special format
are needed. Adding your name is helpful, but optional. For example:

> Sam: We are using React, TypeScript and Tailwind. Please start with the staff layout.

Codex assigns a message ID, remembers recent conversation context and replies in
the same file. You can ask follow-up questions normally. Keep previous messages
and replies, and never include passwords or secrets. It polls roughly every two
minutes; replies wait until the current job finishes. Older tagged messages still
work for anyone already using them.

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
Stack/context questions receive replies without unnecessary edits. When the team
explicitly confirms the stack and requests implementation, the worker can develop
scoped frontend changes; publication still requires real validation gates to pass. WORK-001 is blocked;
later milestones remain queued. No application checks or performance targets have
been verified. See [activation report](reports/activation.md).
