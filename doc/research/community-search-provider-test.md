# Community Search Provider Test

## Scope

On 2026-10-12, tested the candidate search endpoints for Reddit discovery from this Codex Cloud shell. No native web search or browser tool was callable in this session. Configuration contained no provider secret requirements, and all five checked variable names were missing: `TAVILY_API_KEY`, `EXA_API_KEY`, `BRAVE_API_KEY`, `BRAVE_SEARCH_API_KEY`, and `SERPAPI_API_KEY`. Values were not read or printed.

## Actual results

| Provider | Probe | Observed result | Search quality |
| --- | --- | --- | --- |
| Tavily | Unauthenticated POST to `api.tavily.com/search`, Reddit-focused query, limit 3 | Proxy tunnel failed with 403 | NOT_RUN |
| Exa | Unauthenticated POST to `api.exa.ai/search`, Reddit domain filter, limit 3 | Proxy tunnel failed with 403 | NOT_RUN |
| Brave Search | Unauthenticated GET to web search, `site:reddit.com/r/threejs`, count 3 | Proxy tunnel failed with 403 | NOT_RUN |
| SerpApi | Unauthenticated GET to Google search endpoint, Reddit query, limit 3 | Proxy tunnel failed with 403 | NOT_RUN |

These were connectivity/authentication diagnostics without credentials. They did not reach a provider authentication response, execute a verified search, incur a confirmed provider charge, or return posts. They cannot support a quality ranking or an assertion that the provider rejects this environment.

Accessible official GitHub sources were also inspected: [Exa SDK](https://github.com/exa-labs/exa-py/blob/master/exa_py/api.py), [Brave MCP README](https://github.com/brave/brave-search-mcp-server/blob/main/README.md), and [SerpApi SDK README](https://github.com/serpapi/google-search-results-python/blob/master/README.md). Two guessed Tavily SDK source paths returned 404; Tavily authentication details were not verified from those paths. Use its current documentation before an authenticated integration.

## Configuration prepared

Saved an additive environment draft allowing `api.tavily.com` and declaring `TAVILY_API_KEY` as an environment secret bound only to that destination. Existing Reddit domains and network presets were preserved. No secret value was supplied and no other provider key was requested. The tool confirmed the draft was saved and requires publication; this does not establish runtime application or successful search.

The user subsequently published the changes. The restored machine had the named credential present and saved binding configured for `api.tavily.com`. Authenticated searches succeeded. Tavily remains the first tested candidate, not a verified best provider against the untested alternatives.

## Authenticated follow-up

Consulted the official [Tavily SDK README](https://github.com/tavily-ai/tavily-python/blob/master/README.md) and [client source](https://github.com/tavily-ai/tavily-python/blob/master/tavily/tavily.py). The working source branch was `master`, explaining the earlier guessed `main` path failures. The SDK confirms Bearer authentication. The docs website remained proxy-blocked and the API's guessed OpenAPI route returned 404; neither was used as evidence of API capability.

Performed three basic searches, each capped at three results, with generated answers disabled; performed one basic extraction request. Keys were used only in the in-memory authorization header, and no credential values were saved or logged. No advanced crawling was enabled. Account billing was not inspected.

| Operation | Observed result | Conclusion |
| --- | --- | --- |
| Reddit domain search: `Three.js browser game performance frame rate optimization` | HTTP 200, three relevant r/threejs links with short excerpts | PASS for discovery/excerpts; not full-post or comment verification |
| GitHub domain search: `mrdoob three.js Timer visibilitychange game` | HTTP 200, three irrelevant user profiles | Search worked technically but failed relevance |
| Refined query: `site:github.com/mrdoob/three.js three.js Timer` | HTTP 200, three repository results, including animation code using Timer | PASS for repository discovery; one example checked against raw source |
| Basic extraction of one Reddit result | HTTP 200, zero results, one `Failed to fetch url` entry | FAIL for original-content extraction |
| Direct shell read of that Reddit URL | HTTP 200 containing a challenge/block page | SITE_BLOCKED, not a successful post read |

Representative returned Reddit sources, all classified as provider excerpts:

- [Performance optimization question](https://www.reddit.com/r/threejs/comments/1fnr61p/is_there_a_way_to_reduce_lagoptimize_performance): excerpt mentions polygon reduction and mesh merging. This is a lead for investigation, not proof those techniques suit this project's bottleneck.
- [Frame drops on Android](https://www.reddit.com/r/threejs/comments/1s3gzho/how_i_eliminated_frame_drops_on_android_not_happy): short excerpt mentions effects/CSS filters. Full context and comments were unavailable.
- [Browser versus native performance](https://www.reddit.com/r/threejs/comments/18gl8ho/how_does_threejs_performance_compare_to_native): excerpt identifies a cross-platform game question, but supplies no measured answer.

The useful GitHub hit was [the Three.js animation-retargeting example](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_animation_retargeting.html). A direct read of its official raw source confirmed `timer.connect(document)`, `timer.update()`, and `timer.getDelta()` usage. The link is mutable.

These results justify a skill workflow for discovery, query refinement, and evidence classification. They do not establish Reddit consensus or justify new AGENTS.md performance rules based on unread comments. Existing rules to profile representative play remain appropriate.

## Skill delivered

Added `.agents/skills/community-research/` with an instruction file, Codex interface metadata, and provider guidance, and registered it in root `AGENTS.md`. The skill uses available native tools first and optional provider APIs second. It explicitly distinguishes snippet discovery, original content, user-supplied excerpts, and blocked access; it does not install a crawler or promise Reddit API access.

Documentation checks cover required files, frontmatter, local links, and whitespace. Tavily and Exa authenticated discovery are verified for the outcomes below; Reddit original-content access is still blocked. Brave and SerpApi remain untested with credentials.

## Exa authenticated follow-up

After a subsequent user publication, `EXA_API_KEY` was present and authenticated calls to `api.exa.ai` succeeded. No Exa plugin tool was callable in this cloud session; these tests used direct HTTPS with an in-memory `x-api-key` header, not the installed plugin.

Made three search requests capped at three results each and one contents request. Search text was limited to 2,500–3,500 characters per result; contents text to 4,000. No bulk crawl was performed and account billing was not inspected.

| Operation | Observed result | Conclusion |
| --- | --- | --- |
| Same Reddit performance query used for Tavily, `includeDomains: ["reddit.com"]` | HTTP 200, zero results | EMPTY; no Reddit discovery verified |
| Same refined GitHub Timer query used for Tavily, `includeDomains: ["github.com"]` | HTTP 200, three relevant PR results with descriptions and some comments | PASS for provider-delivered GitHub content |
| Broader Reddit `site:` query without explicit domain filter | HTTP 200, MDN/Wikipedia/CRAN results, no Reddit results | Failed domain relevance; `site:` alone did not enforce the requested community |
| `/contents` for the same Reddit post tested with Tavily | HTTP 200, zero results; source status `error`, code 403, tag `SOURCE_NOT_AVAILABLE` | FAIL for source content retrieval |

Relevant GitHub results were [Global: Replace Clock with Timer](https://github.com/mrdoob/three.js/pull/32793), [Clock: Deprecated module](https://github.com/mrdoob/three.js/pull/32798), and [Added THREE.Timer](https://github.com/mrdoob/three.js/pull/17912/files). These are provider-delivered PR excerpts, not direct verification of full timelines. Historical proposals must not be mistaken for the current Timer API.

For this small sample, route Reddit discovery to Tavily and GitHub PR discussion discovery to Exa, with direct upstream code checks where possible. Tavily's GitHub hits included examples, while Exa's hits included relevant PRs and richer text. This is not a controlled benchmark of overall coverage, latency, cost, or freshness; request parameters and output depth differed. Neither provider supplied the tested Reddit original post, so full community-review coverage remains limited.
