# 代理规范审查

## 范围与证据

根据 ActionDBG 设计、项目初始化说明、本地治理技能和公开可访问的 GitHub 来源，审查根目录 `AGENTS.md`。这是文档审查，未实现游戏、验证运行时、安装技能或部署。

GitHub 原始来源读取于 2026-10-12。链接跟随上游分支，可能变化。以下建议是项目具体结论，不代表社区共识。

曾通过 `www.reddit.com` 搜索 r/threejs 游戏／性能及 r/gamedev 原型／范围，并尝试 `old.reddit.com`、`reddit.com`。最初环境代理以 `403 Forbidden` 拒绝连接。用户发布域名允许列表修改后，环境恢复，请求收到 Reddit 自身的 “whoa there, pardner!” 拦截页。页面说明因网络策略阻止，建议登录或开发者凭据。JSON 和 HTML 搜索仍未返回讨论正文。没有读取或引用 Reddit 帖子／评论，Reddit 证据仍缺失，需要用户提供讨论正文或受支持的认证访问方式。该响应不说明需要继续增加环境允许域名。

## 来源与应用

| 来源 | 观察到的指导 | 对 ActionDBG 的应用 |
| --- | --- | --- |
| [AGENTS.md 格式仓库](https://github.com/agentsmd/agents.md/blob/main/README.md) | 独立项目说明，提供具体开发与测试指导 | 根说明保持可执行，审查历史移到本文 |
| [Three.js 游戏导演](https://github.com/majidmanzarpour/threejs-game-skills/blob/main/skills/threejs-game-director/SKILL.md) | 优先可玩循环；用户范围决定质量与验证深度 | 区分流水线验证与战斗切片；不强制高端图形工作 |
| [Three.js 玩法系统](https://github.com/majidmanzarpour/threejs-game-skills/blob/main/skills/threejs-gameplay-systems/SKILL.md) | 明确玩家行为、目标、压力、反馈、重试、确定性顺序和代表性遭遇 | 增加可玩增量标准、数据驱动平衡；先实现一场遭遇再扩内容 |
| [Three.js QA／发布](https://github.com/majidmanzarpour/threejs-game-skills/blob/main/skills/threejs-qa-release/SKILL.md) | 实际输入、推进、失败／重试、生产预览、限定视口检查；像素不证明玩法 | 强化行为浏览器检查；响应式不自动要求移动玩法 |
| [Three.js FPS 示例](https://github.com/mrdoob/three.js/blob/dev/examples/games_fps.html) | 限制帧增量、使用碰撞子步 | 按需选择时间步策略；示例是子步，不是普遍固定步长要求 |
| [Three.js Timer 实现](https://github.com/mrdoob/three.js/blob/dev/src/core/Timer.js) | 每次更新读取一次时间，可在可见性改变后重置计时 | 增加隐藏页暂停、恢复基线和模拟／决策双时钟策略 |
| [Vite 静态部署指南](https://github.com/vitejs/vite/blob/main/docs/guide/static-deploy.md) | 仓库 Pages 需要仓库基础路径；根站／自定义域名不同 | 标准部署保留 `/ActionDBG/`，测试构建资产 URL |

## 发现与修改

1. **核心循环验收不够明确。** 旧说明覆盖架构／构建，却不要求代表性可玩遭遇。增加限定范围的玩家行为、目标、压力、反馈和重试标准。移动演示仍保留较小验证目的。
2. **战斗时钟和事件链缺操作规则。** 增加显式转换、防重复触发、阶段链上限、致死行为和模拟驱动计时。平衡数值及未定手牌／牌库方案仍是设计决定。
3. **浏览器生命周期不完整。** 增加隐藏页暂停、持续输入清理、恢复计时、指针锁、音频解锁和共用资源归属，防止返回跳变、移动卡住及资源／监听泄漏。
4. **性能要求缺测量条件。** 增加视口／设备／帧时目标、代表性玩法测量、像素比限制和优化前分析。未加入无证据设备保证或随意的全局 FPS 要求。
5. **界面与输入太泛化。** 增加 HUD／场景输入隔离、操作发现性、可读资格反馈、键盘可操作 HTML 控件和桌面优先范围。
6. **构建成功易被误当玩法证明。** 增加战斗边界测试、注入时间／可复现随机、行为断言、生产预览，并区分视觉证据和玩法正确性。
7. **缺资产来源记录。** 增加第三方来源／许可／署名及生成资产可追溯性。

## 验证与剩余限制

- 审查本地文档／技能引用与 Markdown 格式。
- 修改仅涉及项目规范和本文，原有设计／技能文件未变。
- 当时仓库仍无应用清单、源码或测试；建议命令／检查是未来要求，不是已验证运行能力。
- 当时外部 Three.js 技能包未安装在 `.agents/skills/`，上游文件仅作为研究参考。
- 域名修改发布并重试后，直接 Reddit 读取仍阻止。后续 Tavily 提供短摘录，但 Tavily、Exa 都未提取原帖。完整帖子／评论审查仍缺，见[服务商测试](../research/community-search-provider-test.md)与[桌面交接](../research/README.md)。
