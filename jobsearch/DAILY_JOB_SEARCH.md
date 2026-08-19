# Daily Job Search — scan prompt

`jobsearch/run.sh` fetches the listings first (`fetch-jobs.js`, real Chrome), then hands
this file to `claude -p` verbatim. Edit here to change scoring or output; edit
`fetch-jobs.js` to change what gets searched.

---

## CONTEXT

You are running the daily remote-job scan for Matt Graf.

- Working directory: `/Users/mattgraf/dev/srv/my-custom-tailwind-resume`.
- **The listings are already fetched.** Read `jobsearch/state/candidates.json`. It holds
  `{ ranAt, themes, boards, jobs }` — every job already deduped, already filtered to
  plausible titles, each with a `description` pulled from the real posting page.
  Do not scrape, do not call a job-board tool, do not invent listings. That file is the
  entire universe of jobs for this run.
- **The résumé is the source of truth for scoring: read `resume-data.js` first**, every
  run, before scoring anything. One career history in three targeted versions —
  `coldfusion`, `full-stack`, `staff-engineer`. Never score from memory or from
  yesterday's run.
- Slack target: channel `C0BS3963X24` (`#jmgdevteam` job-search channel).

## GOAL

Score every job in `candidates.json`, and post to Slack channel `C0BS3963X24` the ones he
is **80–100% fit** for — each with a ready-to-paste prompt for tailoring the résumé to
that posting.

## STEPS

1. Read `resume-data.js`. Note which of the three versions fits which kind of role.
2. Read `jobsearch/state/candidates.json`.
3. Apply the hard gates. Drop, don't score, anything that trips one.
4. Score what survives, 0–100, using the rubric below.
5. Keep everything at **80 or above**, highest first.
6. Write the full report to `jobsearch/reports/<YYYY-MM-DD>.md` — every job you scored,
   including the ones below 80 with a one-line reason, so the rubric can be audited.
7. Take the **top 5** by score (that day's cap) and add each as a row to the Notion
   tracker (see below).
8. Send one Slack message **per matched job** (those same top 5) to channel `C0BS3963X24`
   via the Slack MCP (`slack_send_message`) — one message each, highest first, each linking
   its Notion row.
   If Slack is unavailable, say so at the top of the report file and do not fail the run.

The seen-jobs ledger (`jobsearch/state/seen.json`) is maintained by the fetcher. Do not
edit it.

## NOTION TRACKER

Append the day's **top 5** matches as pages in the **Daily Job Scan — Matches** database
(`data_source_id: 969e2ded-008d-48ac-8924-c56854d54cba`, under the "LinkedIn Tracking —
Keep-Current Plan" page) via the Notion MCP (`notion-create-pages`). Set: `Role`, `Score`,
`Company`, `Board`, `Location`, `Comp`, `Résumé` (the version), `Stage` = `To review`,
`date:Scanned:start` = today, `userDefined:URL` = apply URL (that key exactly), `Why` =
the one-line overlap. Put the score breakdown and the Tailor prompt in the page body. Skip
a match already in the tracker (same company + role). If Notion is unavailable, note it in
the report and keep going — don't fail the run.

## HARD GATES — drop, do not score

- Not fully remote. "Hybrid", "remote-eligible", "3 days onsite", "must relocate", or a
  named metro he'd have to live in all fail. Remote-anywhere-in-US passes.
- Outside the US, or requires work authorization he doesn't have.
- Requires an active security clearance ("Citizens Only" alone is fine; a clearance is not).
  `fetch-jobs.js` already drops these from `candidates.json` after reading the description,
  but keep the gate as a backstop for anything phrased in a way the filter missed.
- Junior, entry-level, intern, or non-engineering.
- A primary stack he has not shipped: Java, .NET/C#, Python, Go, Ruby, PHP, Kotlin,
  Scala, Rust, mobile (iOS/Android/React Native), Salesforce/ServiceNow/SAP, data
  science / ML, embedded/firmware, hardware or electrical engineering, SRE/DevOps-only.
  **Exception:** a ColdFusion role that also asks for Java is fine — CF runs on the JVM.
- The description is empty or too thin to judge. Say so in the report; don't guess.

## RUBRIC — score 0–100

| Dimension | Max | What earns it |
|---|---|---|
| Core stack overlap | 40 | ColdFusion/CFML, Node.js, NestJS, TypeScript, React, AWS (Lambda / CDK / API Gateway / AppSync), SQL Server / MySQL / PostgreSQL / MongoDB. |
| Seniority match | 20 | Senior / Lead / Staff / Principal individual-contributor work. |
| Domain fit | 15 | Legacy modernization or monolith-to-services, healthcare / HIPAA, payments or recurring billing, events / registration, B2B SaaS. |
| Logistics | 15 | Fully remote US, full-time or a long-term contract, no unusual travel or timezone demand. |
| Clean requirements | 10 | Few unmatched must-haves. |

**Scoring rules that stop false 90s:**

- Core stack above **30/40** requires the posting to name Node.js, NestJS, TypeScript, or
  ColdFusion as a **primary** requirement — in the responsibilities or the required
  qualifications, not in a "nice to have" list and not as one item in a ten-language
  laundry list.
- Seniority above **15/20** requires the posting to name the level. A "Senior" role whose
  requirements read like three years of experience scores mid-range, not high.
- Domain fit is **0** when the domain is one he has never worked in. Do not award partial
  credit for "it's software too".
- Clean requirements: subtract for each large unmatched must-have — deep Kubernetes,
  Kafka, Terraform-only shops, ML pipelines, a degree or certification he doesn't hold.
  Three of those and the dimension is 0.
- Big-tech infrastructure roles (compilers, distributed storage, search ranking, ad
  systems) are not his background regardless of title. Score them honestly — usually
  below 80.

**Calibration anchors:**

- **95–100** — CFML or Node/NestJS is *the* stack, level matches, fully remote US, and
  the domain is one he's shipped. Apply today.
- **85–94** — Backend Node/TypeScript is primary, level matches, remote US, domain neutral.
- **80–84** — Real overlap but partial: React/TypeScript-heavy with lighter backend, or
  a Node backend with one significant unfamiliar requirement.
- **Below 80** — Not reported. Most jobs land here. That is the rubric working.

**Before sending:** if more than half the jobs you're reporting score 90+, or if more
than about a fifth of the candidate pool cleared 80, re-score. You are being generous.

## OUTPUT — Slack channel (one message per job)

Plain Slack markdown. No preamble, no commentary about the process, jobs only.
Send a **separate `slack_send_message` per matched job**, highest score first, so each
posting lands as its own message. Cap the run at the **top 5**; if more cleared 80, follow
the last one with a single line: `+<n> more in today's report`. Each message:

```
*<score>% — <Title> @ <Company>*
<board> · <remote/location> · posted <when> · <comp or "not listed">
Why: <the concrete overlap that earned the score — name the technologies>
Gap: <one line, or "none material">
Résumé: <coldfusion | full-stack | staff-engineer>
Tailor: <paste-ready prompt — see below>
Posting: <apply url>
Find: <search url — see below>
Notion row: <url returned by notion-create-pages for this job>
```

**The `Find:` line** is the reliable link. Board deep links rot — Dice `/job-detail/`
URLs are login-gated (a logged-out browser gets "doesn't exist"), and Indeed `rc/clk`
links are session-tokened. So always include a search link that resolves for anyone:
`https://www.google.com/search?q=` + URL-encoded `"<Title>" <Company> <board>`. Put this
same `Find` URL in the Notion row body too, labelled **Find**, alongside the raw posting.
Keep `Posting:` as the direct link for when he's already signed in to the board.

If nothing cleared 80, send one message: `No 80%+ matches today — scanned <N>.`

### The `Tailor:` line

One sentence he can paste straight into Claude to retarget the résumé. It must be
specific to *this* posting — never a template. Name the version to start from, the two
or three things to pull forward, the language to mirror, and what to cut. Shape:

> Tailor my `<version>` résumé for `<Title>` at `<Company>`: lead the summary with
> `<the posting's headline need>`; promote `<specific bullet or employer from resume-data.js>`
> above `<what it should outrank>`; mirror their wording for `<their term>` → `<his term>`;
> cut `<what's irrelevant here>`. Use only what's already in resume-data.js — invent nothing.

Everything it names must exist in `resume-data.js`. If the posting gives you nothing
specific to work with, say `Tailor: use <version> as-is — posting is too generic to target.`

## CONSTRAINTS

- Write only under `jobsearch/reports/`. Never edit `resume-data.js`, `docs/`,
  `jobsearch/state/seen.json`, or anything else in the repo.
- Never apply to a job, never send email, never contact a recruiter. Report only.
- Never invent a listing, score, salary, posted date, or résumé fact. Missing field →
  `not listed`.
- If `boards.<name>.ok` is false in `candidates.json`, name that board as failed in the
  Slack header and report the others. A partial scan beats a failed run.
