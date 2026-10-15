# 免费角色与动作资源核查

日期：2026-10-15。问题：替换 ActionDBG 的几何角色，优先卡通低多边形、骨骼与战斗动作齐全、可随 GitHub Pages 发布的免费资源。用户已选择低多边形路线。

## 访问与证据

本次无可用的原生网页搜索工具，使用已配置 Tavily 的 basic 搜索，三组查询各最多四条结果；没有请求生成式答案或深度抓取。随后直接读取作者 GitHub 仓库、许可及 GLB 数据；未访问 Reddit，不宣称社区共识。

| 来源 | 证据类型与通道 | 核查结果／限制 |
| --- | --- | --- |
| [KayKit Adventurers 固定提交](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/tree/672074b73ba276876a19e8816ecdc5241817ab47) | Git 直接读取，作者仓库／源文件 | README 声明角色已绑定和动画化，免费个人及商业使用，CC0；GLB 实际骨骼及剪辑另行检查 |
| [原始许可](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/blob/672074b73ba276876a19e8816ecdc5241817ab47/LICENSE.txt) | Git 直接读取，许可正文 | 明确 CC0、允许个人／教育／商业使用；署名非强制，本项目仍记录作者 Kay Lousberg |
| [KayKit 作者页面](https://kaylousberg.com/game-assets/characters-adventurers) | Tavily 搜索摘录 | 当前页面提及 5 个基础角色；直接 HTTP 读取失败。与固定仓库 README 数量不一致，不混用不同版本内容 |
| [Quaternius Animated Knight](https://quaternius.com/packs/knightcharacter.html) | Tavily 搜索摘录 | 标为 CC0、FBX／OBJ／Blend，包含骑士与配件；直接 HTTP 读取失败，未下载验证。格式转换与动作整合成本高于已拿到的 KayKit GLB，保留备选 |
| [Blender LPM skill](https://github.com/ozanzeng/blender-LPM-skill) | GitHub Topics 的 Tavily 摘录 | 描述为低多边形、调色板纹理、Blender 脚本建模；本轮未读取技能正文／许可证，也未安装或验证，不能认定支持完整骨骼战斗角色 |

三个搜索方向分别为 KayKit 免费剑盾 GLB、Quaternius 免费动画骑士、Blender 低多边形角色建模技能。搜索摘录只用于发现资源；实际选用资产的许可和结构由固定作者仓库确认。

## 选用与实测结构

采用 Knight 与 Barbarian，分别为己方剑盾骑士、敌方斧盾蛮族。两者来自同一套骨骼／动作，不跨库重定向。原 README 写 75 个动作，两个原始 GLB 实际各有 76 个动画条目；检查到挥砍、刺击、举盾、持续格挡、格挡受击、普通受击、死亡、庆祝。

原文件分别为 3,659,532 和 3,613,268 字节，包含 15／13 个网格和约 6,952／6,543 个三角形（含所有互斥配件）；贴图嵌入 GLB。原始文件保存在临时检出目录，不作为游戏依赖。

本项目保留 12 个所需剪辑并移除不再引用的二进制数据，准备后为 866,052 和 820,124 字节，合计约 1.69 MB。网格、贴图和所保留关键帧的字节不变；哈希、选择列表、固定提交见 [资产来源清单](../../public/assets/characters/kaykit/source.json)，原许可随资产发布。运行时只展示单手武器和一面盾。

## 技能路线判断

项目已有 `.agents/skills/threejs-3d-generator/`，负责 Tripo 生成／绑定／动画接口及 Three.js 接入；本次只读取其技能与导入参考，确认 GLB、根运动和骨骼检查要求。`TRIPO_API_KEY` 在本环境缺失，未调用模型生成服务；生成服务不能视为本次免费替换的前提。

本次不必安装新建模技能。现成 CC0 资产能直接提供比静态生成模型更完整的首版动作。若后续追求原创角色，再单独评估可离线运行的 Blender 建模／绑定流程；不能把“能生成低多边形网格”当成“已支持自然挥剑、格挡与受击”。

实际接入、运行表现与限制记录在[角色功能验收](../features/animated-characters/verification.md)。模型下载成功和静态骨骼检查不代表动画质量已通过；应以真实输入、连续动作和手机画布检查为准。
