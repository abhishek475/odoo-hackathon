# Natural-language chat update

Conversation ID: **ADITHYA-BRIGHTLOOP-01**.

Teammates append normal English at the bottom of team-chat.txt on adithya-branch
and commit. Names are optional. The supervisor assigns CONV-0001, CONV-0002, etc.
No tags, IDs or task syntax are required. Existing tagged messages remain supported.
One GitHub edit containing several paragraphs is treated as one new message.
Corrections in subsequent edits receive a new ID; keep old messages/replies so
follow-ups have context. The worker receives recent conversation history, including
its previous answers, to interpret stack decisions and follow-up questions.

New human prose is detected by comparing the latest file with a persisted snapshot.
Bot output has explicit boundaries and is excluded, including examples of task
syntax inside replies. Snapshot, event fingerprint and sequence counter persist
across restarts, avoiding duplicate requests and response loops. Conversation data
remains lower-trust: it does not permit secrets, unrelated backend ownership or
bypassing the team-leader PR/main approval workflow.

Within Engineer 3 scope, teammates may provide the agreed tech stack and frontend
requirements in ordinary language. Questions/context receive concise replies
without unnecessary source changes. A confirmed stack plus an implementation
request permits scoped frontend development. Code publication still requires
actual validation gates to pass. Existing real package.json scripts can supply
missing gate commands; missing scripts are never invented as passing checks.

## File inventory

- `AGENTS.md`: records delegated project input, normal-language interaction and
  unchanged scope/approval restrictions.
- `adithya/README.md`: short teammate instructions with the stable conversation ID.
- `adithya/team-chat.txt`: simplified header and a labelled owner setup-test question
  written in ordinary English, without a task ID.
- `adithya/reports/natural-chat.md`: this explanation and validation record.
- Local `automation/task_manager.py`: persistent prose ingestion, fingerprints,
  automatic IDs, snapshot deduplication and recent conversation context.
- Local `automation/chat_monitor.py`: identifies prose, acknowledges assigned IDs
  and bounds generated replies so they cannot become new human requests.
- Local `automation/agent.py`: supplies conversation history, handles context-only
  replies without empty code commits, prioritizes teammate messages, accepts scoped
  stack decisions, and discovers only real project validation scripts.
- Local parser/worker tests: cover prose ingestion, IDs across restart, context,
  explicit-message compatibility, legacy bot replies, simultaneous human/bot
  additions, bot examples and real-script discovery without fake gates.

**29 automated supervisor tests passed.** The live normal-English setup question
was ingested as CONV-0001 and its answer was posted on GitHub, confirming the
conversation ID without manual task syntax. Replies did not create extra requests.
After acknowledging new stack decisions or a request to resume development, the
supervisor can requeue a prerequisite-blocked owner milestone only when the worker
checkout is clean. Git/push failures and preserved edits require inspection rather
than automatic retry. The worker continues as the same
background user service. Python/configuration/logs/state remain local and ignored.
Application implementation still depends on confirmed requirements and real checks;
no feature completion or API integration is claimed by this chat update.
