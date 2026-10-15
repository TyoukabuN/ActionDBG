# 卡牌视觉技能调研

日期：2026-10-15。问题：哪些技能适合把当前四个招式按钮做成接近《杀戮尖塔》信息层级的正式卡牌？范围是牌面与手牌呈现，不改牌库规则。

## 方法与证据

使用已配置 Tavily 基础搜索进行三组查询，各最多四条结果：`github SKILL.md card game UI design Slay the Spire`、`site:github.com/anthropics/skills frontend-design SKILL.md`、`site:github.com/gamedev-skills/awesome-gamedev-agent-skills card-game`。再从 GitHub 原始文件读取技能正文及许可证，并用 `git ls-remote` 获取固定提交。没有原生网页搜索工具；本次未访问 Reddit，不代表跨社区共识。

| 来源 | 证据及渠道 | 观察与局限 |
| --- | --- | --- |
| [Anthropic frontend-design](https://github.com/anthropics/skills/blob/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design/SKILL.md) | 源码正文；直接读取 GitHub | 要求按真实题材规划颜色、字体、布局，并截图自审；适合 HTML/CSS 牌面制作。通用网页建议需结合游戏约束。 |
| [frontend-design 许可证](https://github.com/anthropics/skills/blob/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design/LICENSE.txt) | 官方文件；直接读取 GitHub | Apache-2.0，已随技能原样保存。 |
| [Card Game](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd/skills/genres/card-game/SKILL.md) | 源码正文；直接读取 GitHub | 重点是卡牌数据、区域、抽洗牌、资源和效果队列；明确将手牌交互转交 UI 技能。适合以后扩展规则，不能据此认定它擅长牌面美术。 |
| [UiCard](https://github.com/ycarowr/UiCard) | 搜索摘要；Tavily 提供 | 发现有参考多款卡牌游戏的 UI 项目，但属 Unity C#，未读取源码与许可证，不纳入资产或实现。 |
| 项目现有 `threejs-game-ui-designer` | 本地技能及必读参考 | 覆盖 HUD、可用状态、响应式、安全区和触摸目标，与视觉技能互补。 |

来源访问日均为上述日期；除固定提交外，不对搜索结果展示的更新时间作独立保证。

## 结论与落地

安装并使用 `frontend-design`，与现有 UI 技能配合。没有安装侧重规则的 `card-game`，也未引入 Unity 依赖。技能来源与更新方式见 [来源记录](../../.agents/skills/frontend-design-source.md)。

项目选择：费用徽章、中文牌名、原创招式插画、类型窄条、旧纸效果区与底部状态。青铜卡框呼应竞技场材质；四张插画分别强调剑光、重击、盾牌和交叉兵刃。参考游戏的信息组织，图片与卡框自行制作；不添加尚无规则依据的稀有度、牌堆数量或装饰数值。

手机使用单排横滑手牌，保留一次点击出牌与结束回合按钮。可用状态不能只靠亮边或灰度，冷却和队列状态仍需中文。方案、实现和实际验证分别见 [需求](../features/card-presentation/prd.md)、[实现计划](../features/card-presentation/implementation-plan.md) 与后续验证记录。
