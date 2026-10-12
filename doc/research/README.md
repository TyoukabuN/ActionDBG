# Community Research Handoff

Continue documentation research in the Codex desktop client using the tools actually available there. The cloud shell's access limits do not establish that desktop browser or web-search tools have the same limits.

## Entry points

- [Game vision](../design/protoTypeImages.md): original gameplay ideas and unresolved alternatives.
- [Agent guidelines review](../design/agent-guidelines-review.md): rationale for the project rules and original access limitations.
- [Search provider tests](community-search-provider-test.md): initial failures and later authenticated Tavily/Exa results.
- [Community research skill](../../.agents/skills/community-research/SKILL.md): evidence collection and review workflow.
- [Project agent instructions](../../AGENTS.md): development scope, skill routing, architecture, and validation requirements.

## Verified cloud capabilities

Tavily returned relevant Reddit links and brief excerpts. Exa returned relevant GitHub PR text and some comments. Neither retrieved the tested Reddit original post. No native Exa plugin or browser tool was callable in the tested cloud session. Credentials are configured outside the repository; they are not included in Git and must not be assumed to transfer to a desktop environment.

The user supplied a desktop-client test report indicating successful Reddit page reads through its web tools and its browser after user-completed verification. That report is supplied evidence, not an independently repeated desktop test by the cloud agent.

## Next desktop task

Use `$community-research` to complete the Reddit portion of the AGENTS.md review. Read a small, relevant sample from r/threejs, r/gamedev, and r/gamedesign using accessible web/browser tools. Use GitHub and official documentation to verify technical claims; the Three.js forum is an optional source whose access has not been tested here.

Record original links, dates, actual post/comment passages, tool channels, and counterexamples. Prioritize playable prototype scope, frame timing and hidden-tab behavior, meaningful gameplay tests, and card-combat decision windows. Distinguish current technical facts from design opinions. Update the existing review record and add only durable project rules to AGENTS.md; do not implement the game as part of this documentation task.

If access remains blocked, retain the verified GitHub-based guidance and explicitly leave Reddit coverage incomplete. Do not treat snippets as complete discussion evidence or repeat API setup merely to complete this review.
