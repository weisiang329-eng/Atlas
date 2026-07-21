# Atlas — Working Methodology

How work moves from "an idea" to "live and documented". Binding for everyone
working in this repo, human or agent.

Companion files: `CLAUDE.md` (rules), `docs/CODEBASE-MAP.md` (where things
live), `tasks/HANDOFF.md` (current state).

---

## 1. The loop

```
task → worktree + branch → npm install → implement → verify → PR
     → CI green → review → merge → deploy → update docs → remove worktree
```

No step is optional. A change that skips verification or documentation is not
finished, however correct the code is.

## 2. One worktree per task

Every task that touches code gets its own worktree and branch:

```bash
cd C:/Users/User/Desktop/Atlas
git worktree add ../Atlas-worktrees/<task-slug> -b <type>/<task-slug> main
cd ../Atlas-worktrees/<task-slug>
npm install                      # MANDATORY — see §3
```

Conventions:

- Worktrees live in `Desktop/Atlas-worktrees/`, one folder per task.
- Branch name mirrors the folder: `feat/…`, `fix/…`, `docs/…`, `refactor/…`.
- One task per worktree. Never mix two efforts in one tree.

Why: a worktree is a **self-contained handoff unit**. "Take over
`Atlas-worktrees/aurora-sweep`" transfers the branch, the working state, and
the task in one sentence. Parallel tasks never block each other, and abandoning
one is a `git worktree remove`, not an archaeology exercise.

When the PR merges:

```bash
git worktree remove ../Atlas-worktrees/<task-slug>
git worktree prune
```

## 3. A fresh worktree has no dependencies — install first

npm workspace links do **not** carry into a new worktree. Until `npm install`
completes there, every typecheck, build and test fails in ways that look like
code errors.

**Run `npm install` immediately after `git worktree add` and wait for it to
finish before doing anything else.**

> **This is the single most expensive mistake made in this project so far.**
> On 2026-07-21 two delegated agents were each given a fresh worktree without
> dependencies. Both completed ~95% of their code changes, then hung
> permanently on a build that could never succeed. ~80 minutes were lost, and
> the work had to be recovered by hand from the worktrees. See §7.

## 4. Delegating work

Delegation is allowed, but **unsupervised delegation is not**.

- Check on delegated work **at least every 15 minutes**.
- Check **progress**, not liveness: newest file mtime, `git status` count,
  whether a PR exists. A quiet process is a stopped process.
- No progress for ~20 minutes → take over. The work already on disk is usually
  nearly complete; recover it rather than restarting.
- Prefer working in a known-good environment for anything that needs a build.
- **Never report delegated work as "in progress" without having just checked.**

## 5. Verification — observation, not intention

Before any claim of completion:

| Layer | Gate |
| --- | --- |
| API | `npm run typecheck` **and** `npm run db:test` (PGlite, real assertions) |
| Web | `npm run typecheck` **and** `npm run build` (static export must emit every page) |
| UI | Load the real page. Check rendered DOM/screenshot at **375×812 and 1440** |
| API behaviour | `curl` the endpoint, read the body and status |
| Deploy | Fetch the **live** URL and confirm the new thing is present |

Deploy-specific traps, both hit for real on 2026-07-21:

- The API base URL is **baked in at build time**. A build without
  `NEXT_PUBLIC_API_BASE_URL` ships a site with no live data. Verify:
  `grep -rl "atlas-api" apps/web/out/_next/static/chunks/`
- `wrangler pages deploy` without `--branch=main` publishes a **preview**
  alias, not production. The main URL will not change.

Report faithfully. If a gate failed or was skipped, say so with the output.

## 6. PRs, review, merge

- One PR per task. The description says **what changed, why, and how it was
  verified** — the verification section is not decoration.
- Merge only on green CI. Never merge red, never bypass hooks.
- Direct commits to `main` are a defect, even when the change is correct.
- Docs that the change made stale are updated **in the same PR**.
- After merge: remove the worktree, then deploy if the change is user-visible.

## 7. Post-mortems live in the repo

When something goes materially wrong, the fix includes a written record so the
next person cannot repeat it. Format: what happened, why, cost, and the
concrete rule that now prevents it.

**2026-07-21 — two delegated agents died silently.**
*What:* two agents were dispatched into fresh worktrees to do the Aurora
frontend work. Both stopped after ~35 minutes with all code written but no
commit, no PR, and no error surfaced.
*Why:* their worktrees had no `node_modules`, so `npm run build` — their final
gate — could never pass. They retried into a dead end.
*Cost:* ~80 minutes of wall-clock, plus manual recovery of both branches.
*Now prevented by:* §3 (install before work) and §4 (15-minute supervision
cadence, progress-not-liveness checks, take over after 20 minutes silent).

## 8. Handoff readiness

Assume you vanish mid-task and a stranger continues tomorrow.

- Every milestone = a repo doc + a PR. Never leave work only in a local tree
  or in chat.
- `tasks/HANDOFF.md` is updated in the same PR that changes project state.
- Decisions get written down **with their reasoning** — especially deliberate
  trade-offs and things that look wrong but are intentional (e.g. the
  Cloudflare Access policy is currently `Bypass` on purpose).
- Deferred work is recorded as an explicit, findable item — never "we'll
  remember".

## 9. Definition of done

- [ ] Task had its own worktree + branch, with dependencies installed
- [ ] CI green: `db:test`, both typechecks, web build
- [ ] Result **observed** — page loaded / endpoint hit / live URL fetched
- [ ] Checked at 375×812 and 1440 if UI changed
- [ ] PR opened, described, reviewed, merged
- [ ] `HANDOFF.md` + any stale doc updated in the same PR
- [ ] Worktree removed and pruned
- [ ] Deployed and verified live, if user-visible
