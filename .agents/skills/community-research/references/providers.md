# Search Provider Guidance

Provider capabilities, pricing, endpoints, and authentication can change. Read current official documentation before building a request. On 2026-10-12, Tavily authenticated search returned relevant Reddit links/excerpts and, after query refinement, relevant GitHub results. Exa authenticated search returned relevant GitHub PR text and some comments, but its Reddit domain search was empty. Both providers failed to fetch the tested Reddit post. Brave and SerpApi have not passed an authenticated test here.

| Provider | Official reference | Candidate search endpoint | Credential variable | Destination |
| --- | --- | --- | --- | --- |
| Tavily | [Documentation](https://docs.tavily.com/) | `POST https://api.tavily.com/search` | `TAVILY_API_KEY` | `api.tavily.com` |
| Exa | [Python SDK](https://github.com/exa-labs/exa-py) | `POST https://api.exa.ai/search` | `EXA_API_KEY` | `api.exa.ai` |
| Brave Search | [Official MCP server](https://github.com/brave/brave-search-mcp-server) | `GET https://api.search.brave.com/res/v1/web/search` | `BRAVE_API_KEY` | `api.search.brave.com` |
| SerpApi | [Search API](https://serpapi.com/search-api) | `GET https://serpapi.com/search.json` | `SERPAPI_API_KEY` | `serpapi.com` |

Prefer an already configured provider. In this small local test, Tavily was useful for Reddit discovery and short excerpts, while Exa was useful for GitHub PR/discussion text. Use that as a starting route, not a general quality ranking. Neither provided the tested Reddit post body. Brave and SerpApi are candidates for search-engine links/snippets; do not assume they supply complete Reddit threads.

## Tested Exa request

Use `x-api-key: <secure binding>` only in memory for `POST https://api.exa.ai/search`. A tested request is:

```json
{
  "query": "site:github.com/mrdoob/three.js three.js Timer",
  "includeDomains": ["github.com"],
  "numResults": 3,
  "contents": {"text": {"maxCharacters": 3500}}
}
```

Inspect `results[].url`, `title`, and `text`. Returned PR text can contain descriptions and comments, but it is provider-delivered content, potentially truncated or stale, not an independent verification of every comment or metadata field.

The Reddit query with `includeDomains: ["reddit.com"]` returned zero results. A follow-up using only `site:` in the query returned unrelated non-Reddit URLs. Always use explicit provider filters for required domains, validate every result host/path, and record empty coverage instead of silently substituting unrelated sources.

`POST /contents` with `ids: ["<known Reddit URL>"]` and `text.maxCharacters: 4000` returned HTTP 200 with no results and a per-source `SOURCE_NOT_AVAILABLE` / 403 error. Inspect `statuses[]` as well as `results[]`; HTTP-level success does not establish source availability. Prefer Tavily for Reddit discovery in this environment, and report original-content limits rather than repeatedly requesting the unavailable URL.

## Tested Tavily request

The official [Python client source](https://github.com/tavily-ai/tavily-python/blob/master/tavily/tavily.py) confirms Bearer authentication, `/search`, and domain filters. Use `Authorization: Bearer <secure binding>` in memory; never paste the key into commands. A small tested JSON body is:

```json
{
  "query": "Three.js browser game performance frame rate optimization",
  "include_domains": ["reddit.com"],
  "search_depth": "basic",
  "max_results": 3,
  "include_answer": false,
  "include_raw_content": false
}
```

Parse `results[].title`, `results[].url`, and `results[].content`. Classify contents conservatively as provider excerpts, not independently read posts or comments. `POST /extract` with `urls` and `extract_depth: "basic"` was tested once: HTTP 200 contained empty `results` and a `failed_results` entry. Inspect both arrays before declaring extraction success.

Broad GitHub filtering returned irrelevant user profiles. Refine with a repository path, such as `site:github.com/mrdoob/three.js three.js Timer`, and verify code against official raw source. Low relevance warrants query refinement, not acceptance of whatever the API returns.

For direct HTTP, keep keys in memory and supported secure bindings, never shell arguments, command history, or saved request URLs. Exa's inspected SDK uses `x-api-key`. Brave's official MCP server reads `BRAVE_API_KEY`; confirm HTTP header requirements in its API documentation. SerpApi's inspected SDK passes an `api_key` request parameter: ensure URL/error logging cannot expose it and verify that the environment secret mechanism supports this route before integrating. Do not assume a proxy-held secret is available as a raw value.

For each provider test, capture the query, time, status, result count, relevant URLs, evidence depth, and original-page accessibility. Do not store authentication headers or entire account responses. Save only the excerpts needed for the research and respect applicable content retention/deletion requirements.

Network additions require only the provider selected for use. Add documentation destinations only when needed. Do not broaden access to all domains or require four API keys for a single research task.
