# 适合当前 ActionDBG 原型的技能

审查日期：2026-10-13。范围：候选发现与来源审查，不安装、不修改玩法。

## 项目适配

ActionDBG 已使用原生 Three.js、严格 TypeScript、Vite、DOM 卡牌 HUD、确定性战斗状态机和 Playwright。当时遭遇采用固定保留手牌，无抽牌／弃牌，反击链受限，具有双时钟和背后斜视战斗镜头。近期需要更强的游戏视觉方向、可读反馈及视觉／行为试玩。架构协作流程已有 `adaptive-project-development` 与 `sol-luna-dev`。

## 推荐来源

| 候选 | 有用职责 | 适配与限制 |
| --- | --- | --- |
| [OpenAI Game Studio: three-webgl-game](https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/plugins/game-studio/skills/three-webgl-game/SKILL.md) | 原生 TS／Vite／Three.js 运行时、明确镜头、模拟／渲染分离、DOM HUD | 技术栈高度匹配。遭遇确需物理或正式模型之前，不加 Rapier 或 GLB 加载 |
| [OpenAI Game Studio: game-ui-frontend](https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/plugins/game-studio/skills/game-ui-frontend/SKILL.md) | 游戏主题视觉、战斗区域保护、情境 HUD、折叠次要面板 | 适合减少仪表盘感。需调整稀疏探索 HUD 和移动默认：卡牌／AP／意图不可缺，当时原型仅桌面 |
| [OpenAI Game Studio: game-playtest](https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/plugins/game-studio/skills/game-playtest/SKILL.md) | 实际输入浏览器 QA、WebGL 必须审图、问题复现／严重度 | 高度匹配；复用 Playwright，不增加第二套测试系统 |
| [Three.js Game Skills](https://github.com/majidmanzarpour/threejs-game-skills) | 游戏界面、手感、图形评价及 QA | 仍是合适社区方案：优先 `threejs-game-ui-designer`、`threejs-gameplay-systems`、`threejs-qa-release`。仅在要求视觉精修时评分，不自动触发付费资产生成 |
| [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | 有意识的字体、视觉身份、主题布局与评价 | 可作为 HTML／CSS 卡牌／HUD 美术指导。不是战斗规则或 3D 动画技能，避免营销网页布局 |
| [Card Game](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/genres/card-game/SKILL.md) 与[效果结算参考](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/genres/card-game/references/effect-resolution.md) | 卡牌数据、原子费用／目标验证、明确效果顺序与触发 | 有选择地引用领域知识。强制牌库／抽牌／弃牌循环与固定手牌 PRD 冲突；只采用相关规则，不套完整模板或 Godot／Unity 依赖 |
| [Yuki001 game-architect](https://github.com/Yuki001/game-dev-skills/blob/main/skills/game-architect/SKILL.md) | 原型与数据／领域架构差异、时间／技能／效果系统知识 | 后续扩展可参考；属于领域知识而非工作流程。保留已有治理，不为单场遭遇引入 DDD／模块框架 |

## 下一步最佳组合

选择一套主要实现／QA 技能，避免方向冲突：

1. **当前界面／场景迭代：** Game Studio 的 `three-webgl-game`、`game-ui-frontend`、`game-playtest`。总入口默认 2D Phaser，因此明确路由到既有原生 Three.js。
2. **行动手感与专项图形迭代：** 已有 Three.js Game Skills。其玩法参考将反馈视为状态传达，覆盖起手／接触、缓动、命中和镜头响应。视觉反馈时间与决策时间分开；命中停顿不能意外暂停或消耗决策窗口。
3. **卡牌规则扩展：** 有选择地阅读 Card Game 效果结算参考，沿用 PRD／设计流程。抽牌／弃牌、目标框架和更多阶段必须先成为获批准需求。

`frontend-design` 是补充专家，不是另一套导演。首轮视觉任务应明确战斗想象、配色／字体尺度、大而可读的费用、近玩家／远对手镜头、持续决策信息和可折叠日志。在试玩中评价，不只接受静态截图。

## 已检查来源与排除项

发现阶段使用三次 Exa GitHub 搜索（每次五条）与一次 Tavily Reddit 搜索（四条），有用候选直接读取上游 GitHub 原始文件。未运行候选辅助脚本，也无基准证明技能改善游戏。

- OpenAI 插件检查于提交 `0722921d5542fc593105c27bd52630babd8b8c2a`。Game Studio 清单标明作者 OpenAI、版本 0.1.2、MIT 许可和技能目录；已读主入口、Three.js、界面、试玩技能及 HUD 参考。属于第一方补充，不代表社区背书。
- 当时 [openai/skills README](https://github.com/openai/skills/blob/main/README.md) 明确标记弃用并指向 `openai/plugins`。旧 `develop-web-game` 在历史版本 `82d2c5b4` 可读，当前 main 路径 404。优先验证过的 Game Studio，不复制过期镜像。
- 已读上游 Three.js 界面／图形技能及玩法 `game-feel.md`；Anthropic frontend-design 与 Apache-2.0 许可；Card Game、效果参考及根 Apache-2.0 许可；Game Architect 技能及原型设计参考。未固定提交的分支链接可变。
- 未选 [Jeffallan game-developer](https://github.com/Jeffallan/claude-skills/blob/main/skills/game-developer/SKILL.md)：Unity／Unreal、ECS、联网、池化及跨平台性能要求不适合本浏览器原型。
- 未选 [Claude Code Game Studios team-combat](https://github.com/Donchitos/Claude-Code-Game-Studios/blob/main/.claude/skills/team-combat/SKILL.md)：大量代理协作及重复阶段／写入确认与已有治理重叠，阻碍小步迭代。
- [full-statck-skills threejs-camera](https://github.com/full-statck-skills/threejs-skills/blob/main/skills/threejs-camera/SKILL.md) 是有用技术参考，但不确定演出构图或战斗界面方向；可选，不作主技能。
- [alton47/threejs-skills](https://github.com/alton47/threejs-skills) 只审查 README。其自称官方未独立证实；广泛 API 覆盖不证明玩法指导更好。

Reddit 发现返回 [Three.js 技能系统讨论](https://www.reddit.com/r/claudeskills/comments/1u7qdf6/threejs_game_director_skill_system_for_codex) 和相关 AI 游戏开发帖子。只有服务商摘要，部分夹杂无关导航。未验证完整帖子／评论或可靠社区态度，不用于技能排名或共识声明。

## 安装影响

发现阶段未安装技能／插件。随后完整九技能 Three.js Game Skills 包以版本 `8286774b22a2566bf894dbc825825c16921866af` 安装到 `.agents/skills/`，见[来源记录](../../.agents/skills/threejs-game-skills-source.md)。Game Studio 及其他候选未安装。Game Studio 技能引用同级技能和插件 `../../references/`，单独复制 SKILL.md 会破坏路径。优先完整受支持插件包；制作项目本地分发时，需有意保留／调整所有引用资源。保留上游来源／许可和现有技能。

插件源码审查不能证明它在此云端对话可调用。API、浏览器工具和付费生成是独立能力。候选必须通过实际限定范围实现／试玩才能证明对 ActionDBG 的实用价值。
