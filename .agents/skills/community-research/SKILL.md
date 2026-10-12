---
name: community-research
description: Research Reddit and GitHub discussions, compare development approaches, and review project guidance using traceable evidence. Use for community research, game-development recommendations, and source-backed reviews of AGENTS.md or design documents.
---

# Community Research

Produce actionable, source-backed recommendations for the current project. Communicate in Chinese and write repository research artifacts in English unless the user requests otherwise. Search and reading are the default scope; do not post, vote, message, create accounts, or change project code unless requested.

## 1. Establish the question

- Read applicable `AGENTS.md`, the current design, and relevant source before searching. For ActionDBG, begin with `doc/design/protoTypeImages.md`.
- Define the decision being researched, constraints, target technology versions, and what evidence would change the recommendation.
- For a small review, start with 3–5 focused queries and at most 10 results per query. Expand only to resolve a specific gap. Prefer a few relevant sources over a large link dump.
- Separate discovery of development techniques from authoritative policy questions. Use official sources for API access, authentication, pricing, and platform rules.

## 2. Discover available access

Inventory callable web search/browser tools first. A desktop client, cloud web tool, and shell request can use different networks; do not assume results transfer between them.

Use this order, selecting the first route that actually works:

1. Available native web search and page-reading tools.
2. A configured search API: Tavily by default for a new setup; Exa, Brave Search, or SerpApi if already available or specifically requested. See [provider guidance](references/providers.md).
3. Direct reads of accessible public GitHub documentation, code, issues, and discussions, and permitted Reddit pages.
4. User-supplied excerpts with original links and provenance. Label them as supplied evidence, not independently fetched pages.

Check configuration metadata and required environment variable presence before asking for credentials. Report only `SET`/`MISSING`; never print values, dump the environment, read unrelated credential files, or include credentials in URLs or reports. Use supported proxy-backed HTTPS secret bindings only on their allowed destination. Do not move credentials into another header or local file just because a placeholder appears in the process.

When API setup is needed, preserve known network rules and add only the selected provider's destination and secret requirement through supported environment configuration. Explain what was saved, whether it is applied, and what remains untested. Do not install a game-runtime dependency to perform agent research.

## 3. Search and read

Combine topic, concrete problem, technology, and community. Example queries:

```text
site:reddit.com/r/threejs browser game frame time performance
site:reddit.com/r/gamedev prototype scope playable loop
site:github.com/mrdoob/three.js visibility timer game
site:github.com AGENTS.md game testing
```

Use provider domain filters when supported and validate each returned host/path; `site:` text alone is not a guaranteed restriction. Search for opposing experiences and failure cases, not just endorsement. Prefer original threads, maintainer responses, actual code, reproducible issues, and recent version-relevant evidence.

Open the useful results when possible. Classify each record as `search_snippet`, `post_body`, `comment_body`, `official_document`, `source_code`, or `user_supplied_excerpt`, and record delivery channel separately (direct, provider-delivered, or supplied by the user). Provider text may include post/comment content, but coverage and freshness need checking; do not imply an independent original-page read. Search summaries and generated answers are discovery aids, not evidence that the original page or comments were read.

For each useful source record its URL, title, access date, publication/update date when available, evidence type, relevant passage or concise paraphrase, and limitation. For GitHub code, record a commit/permalink when obtainable; otherwise state that the branch link is mutable. Deduplicate reposts and syndicated copies.

Do not equate popularity with correctness or call a small sample a community consensus. Check technical recommendations against current upstream code/docs and project constraints. An anecdote can motivate an experiment; it does not prove a general performance claim.

## 4. Handle access failures

- Inspect the response type and content, not just the status. HTTP 200 containing a CAPTCHA, login form, or block page is not a successful content read.
- Distinguish proxy tunnel rejection, site HTTP rejection, invalid credentials, rate limits, malformed responses, empty results, and inaccessible original content.
- For 401/403, diagnose configuration and authentication before one meaningful retry. Do not retry unchanged requests repeatedly.
- For 429, respect `Retry-After`; use bounded retries and avoid blocking waits over 60 seconds. Handle provider timeouts/5xx with at most two retries when appropriate.
- Do not bypass CAPTCHA, rotate identities/IPs to evade blocks, or use undocumented mirrors as an access workaround. A user may complete a supported interactive verification themselves.
- Reddit Data API use requires checking current official approval requirements; choosing a script application or buying a search API does not establish Reddit authorization. Search results do not guarantee complete comments, current/deleted content, or licensed bulk access.
- If one community is unavailable, complete research on available sources and mark coverage incomplete. Do not invent missing posts or claim cross-community validation.

## 5. Validate an API before recommending it

Read current official endpoint, authentication, and response documentation. Run a small authorized real search only when a usable credential is present. Keep defaults inexpensive; do not enable deep crawling or extra paid enrichment without need.

Use one Reddit-focused query and one known public GitHub target. Inspect returned URLs and source excerpts for relevance, duplication, and freshness. Attempt one representative original-page read using a supported route. Record whether the provider supplied snippets, full post text, comments, or none. An authentication probe alone does not validate search quality.

Keep these outcomes distinct: `PASS` (relevant real results verified), `EMPTY`, `AUTH_REQUIRED`, `NETWORK_BLOCKED`, `SITE_BLOCKED`, `RATE_LIMITED`, and `NOT_RUN`. Recommend a provider provisionally when no successful authenticated comparison exists.

## 6. Deliver research and scoped changes

Write a concise report under `doc/research/` or the task's existing documentation location. Include:

1. Question, scope, methods, and actual access channels.
2. Source table with evidence types and dates.
3. Findings separated into observed facts, community opinions, project-specific inferences, and unresolved questions.
4. Recommendations ranked by relevance, evidence strength, and implementation cost.
5. Provider/test outcomes, coverage gaps, and verification not performed.

When asked to review or edit `AGENTS.md`, map each recommendation to a concrete issue and make only durable, actionable rules. Keep URLs, provider test logs, and research history in the report. Preserve project scope: procedural visuals, small playable slices, and GitHub Pages do not become premium graphics, a backend, or a universal physics framework because an external guide recommends them.

Check links, final diff, and existing changes. Documentation-only tasks do not require unrelated application builds. Finish with what changed, evidence used, checks run, and exact remaining blockers. Commit, push, or publish only within the user's authorized scope.
