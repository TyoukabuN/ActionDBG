# 社区搜索服务商测试

## 范围

2026-10-12，在 Codex Cloud 终端测试候选搜索端点的 Reddit 发现能力。当时无可调用原生网页搜索／浏览器。配置未声明服务商密钥要求，检查的五个变量都缺失：`TAVILY_API_KEY`、`EXA_API_KEY`、`BRAVE_API_KEY`、`BRAVE_SEARCH_API_KEY`、`SERPAPI_API_KEY`。未读取或打印值。

## 实际结果

| 服务商 | 探测 | 观察结果 | 搜索质量 |
| --- | --- | --- | --- |
| Tavily | 未认证 POST `api.tavily.com/search`，Reddit 查询，上限 3 | 代理隧道 403 失败 | 未执行（NOT_RUN） |
| Exa | 未认证 POST `api.exa.ai/search`，Reddit 域名过滤，上限 3 | 代理隧道 403 失败 | 未执行（NOT_RUN） |
| Brave Search | 未认证 GET 网页搜索，`site:reddit.com/r/threejs`，数量 3 | 代理隧道 403 失败 | 未执行（NOT_RUN） |
| SerpApi | 未认证 GET Google 搜索端点，Reddit 查询，上限 3 | 代理隧道 403 失败 | 未执行（NOT_RUN） |

这些是不带凭据的连通性／认证诊断，没有到达服务商认证响应，没有完成已验证搜索、确认收费或返回帖子。因此不能据此排名质量，也不能断言服务商拒绝该环境。

还检查了可访问官方 GitHub 来源：[Exa SDK](https://github.com/exa-labs/exa-py/blob/master/exa_py/api.py)、[Brave MCP README](https://github.com/brave/brave-search-mcp-server/blob/main/README.md)、[SerpApi SDK README](https://github.com/serpapi/google-search-results-python/blob/master/README.md)。两条推测的 Tavily SDK 路径返回 404，未验证其认证细节。认证集成前应查当前文档。

## 已准备配置

保存增量环境草案：允许 `api.tavily.com`，声明只绑定该目标的环境密钥 `TAVILY_API_KEY`。保留已有 Reddit 域名和网络预设。未提供密钥值，也未请求其他服务商密钥。工具确认草案已保存、需发布；不代表已应用到运行时或搜索成功。

随后用户发布修改。恢复后的机器具有对应凭据和 `api.tavily.com` 绑定，认证搜索成功。Tavily 是首个已测试候选，不是与未测试替代方案比较后的最佳服务商。

## 认证后续测试

查阅官方 [Tavily SDK README](https://github.com/tavily-ai/tavily-python/blob/master/README.md) 和[客户端源码](https://github.com/tavily-ai/tavily-python/blob/master/tavily/tavily.py)。可用分支为 `master`，解释此前猜测 `main` 路径失败。SDK 确认 Bearer 认证。文档站仍被代理阻止，猜测的 OpenAPI 路由 404，均未作为能力证据。

执行三次 basic 搜索，每次上限三条、禁用生成答案；一次 basic 提取。密钥仅用于内存认证头，未保存或记录值。未启用高级爬取，也未检查账户账单。

| 操作 | 观察结果 | 结论 |
| --- | --- | --- |
| Reddit 域名查询：`Three.js browser game performance frame rate optimization` | HTTP 200，三个相关 r/threejs 链接和短摘录 | 发现／摘录通过，非完整帖子或评论验证 |
| GitHub 域名查询：`mrdoob three.js Timer visibilitychange game` | HTTP 200，三个无关用户资料 | 技术搜索成功，相关性失败 |
| 改进查询：`site:github.com/mrdoob/three.js three.js Timer` | HTTP 200，三个仓库结果，含使用 Timer 的动画代码 | 仓库发现通过，一个示例对照原始源码 |
| 基础提取一条 Reddit 结果 | HTTP 200，零结果，一条 `Failed to fetch url` | 原文提取失败 |
| 终端直接读取同一 Reddit URL | HTTP 200，正文为挑战／拦截页 | 网站阻止（SITE_BLOCKED），不是成功读帖 |

代表性 Reddit 来源均分类为服务商摘录：

- [性能优化问题](https://www.reddit.com/r/threejs/comments/1fnr61p/is_there_a_way_to_reduce_lagoptimize_performance)：摘录提及减面和网格合并，只是研究线索，不证明适合本项目瓶颈。
- [Android 掉帧](https://www.reddit.com/r/threejs/comments/1s3gzho/how_i_eliminated_frame_drops_on_android_not_happy)：短摘录提及特效／CSS 滤镜，完整上下文和评论不可用。
- [浏览器与原生性能](https://www.reddit.com/r/threejs/comments/18gl8ho/how_does_threejs_performance_compare_to_native)：摘录是跨平台游戏问题，未提供测量答案。

有用 GitHub 结果为 [Three.js 动画重定向示例](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_animation_retargeting.html)。直接读取官方原始源码确认 `timer.connect(document)`、`timer.update()`、`timer.getDelta()` 用法；链接可变。

结果支持建立发现、查询改进和证据分类的技能流程，不证明 Reddit 共识，也不能根据未读评论加入 AGENTS.md 性能规则。现有代表性玩法性能分析规则仍适用。

## 已交付技能

新增 `.agents/skills/community-research/`，包含说明、Codex 界面元数据及服务商指导，并注册到根 `AGENTS.md`。技能优先可用原生工具，其次可选 API。明确区分摘要发现、原文、用户摘录和访问受限；不安装爬虫或保证 Reddit API 访问。

文档检查覆盖所需文件、前置元数据、本地链接和空白格式。以下 Tavily／Exa 认证发现结果已验证；Reddit 原文仍受阻。Brave／SerpApi 尚未带凭据测试。

## Exa 认证后续测试

用户后续发布后，`EXA_API_KEY` 存在，`api.exa.ai` 认证调用成功。云端会话没有可调用 Exa 插件工具；测试使用内存 `x-api-key` 头直接 HTTPS，而非已安装插件。

执行三次搜索，每次上限三条，以及一次正文请求。搜索每条文本限制 2,500–3,500 字符，正文限制 4,000。未批量爬取或检查账单。

| 操作 | 观察结果 | 结论 |
| --- | --- | --- |
| 与 Tavily 相同 Reddit 性能查询，`includeDomains: ["reddit.com"]` | HTTP 200，零结果 | 空（EMPTY），未验证 Reddit 发现 |
| 与 Tavily 相同改进 GitHub Timer 查询，`includeDomains: ["github.com"]` | HTTP 200，三个相关 PR，含描述和部分评论 | 服务商提供 GitHub 内容通过 |
| 更宽泛 Reddit `site:` 查询，无显式域名过滤 | HTTP 200，MDN／Wikipedia／CRAN，无 Reddit | 域名相关性失败；单靠 `site:` 未限定所需社区 |
| 对 Tavily 测试的同一 Reddit 帖请求 `/contents` | HTTP 200，零结果；来源状态 `error`、403、`SOURCE_NOT_AVAILABLE` | 来源正文提取失败 |

相关 GitHub 结果：[全局：用 Timer 替换 Clock](https://github.com/mrdoob/three.js/pull/32793)、[Clock：已弃用模块](https://github.com/mrdoob/three.js/pull/32798)、[新增 THREE.Timer](https://github.com/mrdoob/three.js/pull/17912/files)。它们是服务商 PR 摘录，非完整时间线的直接验证。历史提案不得当成当前 Timer API。

在这份小样本中，可用 Tavily 发现 Reddit，用 Exa 发现 GitHub PR 讨论，并尽可能直接核对上游代码。Tavily 的 GitHub 结果有示例，Exa 有相关 PR 和更丰富文本。这不是覆盖、延迟、费用或新鲜度的受控基准，因为请求参数与输出深度不同。两者都未提供测试 Reddit 原帖，完整社区审查仍有限。
