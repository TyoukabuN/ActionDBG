# 战斗镜头与漫画分镜技能研究

研究日期：2026-10-15。范围：查找与审查技能，分析当前镜头实现，提出下一轮实验建议。未安装候选技能、运行其脚本、生成付费媒体或修改游戏代码。本报告中的推荐来自源码适配分析，不代表已通过 ActionDBG 实测。

## 问题与项目条件

玩家认为当前镜头仍缺少力度，希望战斗像有漫画分镜的演出。项目使用 Three.js／TypeScript，双方独立回合，屏幕与键盘即时出牌，玩家右肩常驻机位，反击有近景与斜向黑边；需要兼顾桌面、手机竖屏和降低动态效果。

研究重点是景别、调度、动作连续性、切点和节奏，同时保留实时取景与输入可读性。仅能解释相机 API 的技能不足以单独指导这轮设计。

## 方法与证据边界

当前会话无可调用的原生网页搜索／浏览器工具。使用已配置的 Exa API 做 3 次 GitHub 限域搜索，每次 5 条、正文上限 3,500 字符；Tavily 做 1 次 Reddit 限域 basic 搜索，4 条、禁用生成答案。两类搜索都成功返回相关链接。随后通过 GitHub 原始文件直接读取候选技能及相关参考，读取许可，并用 `git ls-remote` 获取提交号。下表主要候选又从固定提交读取，确认与分支读取内容一致。未执行外部辅助脚本。

Reddit 证据只有服务商搜索摘录：代表性[电影式回合制战斗讨论](https://www.reddit.com/r/Games/comments/oelyfs/has_cinematic_turn_based_combat_been_done_yet/)直接读取返回 HTTP 200，但解析可见文本只有“Reddit”，没有帖子或评论；不能视为成功读帖。Tavily `/extract` 返回零结果和 `Failed to fetch url`。因此未验证其原帖上下文或评论，也不据此声称社区共识。

## 候选与适配

| 候选／直接来源 | 实际包含的指导 | 对 ActionDBG 的判断 | 许可与代价 |
| --- | --- | --- | --- |
| [cinematic-director](https://github.com/wuwangzhang1216/DirectorSKILL/blob/c65ae0d14457053efb1e354c7e7f7e120d97fad1/SKILL.md) | 景别／角度／镜头动机、先调度再构图、镜头表、连续性、剪辑与问题诊断，包含独立参考库 | **优先试用的分镜设计来源**。能要求每个镜头说明拍什么、为什么切、动作怎样结束，适合先设计重斩或反击的完整演出 | 已读 MIT 许可。原用途为电影／AI 视频，库较大；只取调度、镜头语言、剪辑与镜头表，保留引用结构，不套生成工作流 |
| [animation-craft](https://github.com/khanhhuyenngo985-sys/animation-craft/blob/ff0983e9f4419443cb99bb8eed5082fd6c34c499/SKILL.md) | 起手、动作、命中、反应、收势；场面调度、镜头／主体运动层级、关键帧审查 | **动作节拍补充**。帮助让镜头和挥剑、接触、受击、粒子成为同一段动作，减少只换机位的感觉 | 已读 MIT 许可。主要面向动画短片／AI 视频，需将时间和事件映射到真实游戏演出；不自动带来实时动画系统 |
| [camera-systems](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd/skills/disciplines/camera-systems/SKILL.md) | 跟随、前瞻、平滑、遮挡、多人取景、硬切重置、镜头混合 | **运行时辅助参考**。用于确保双方／接触点在画面内、竖屏不裁掉关键信息，区分平滑跟随与有意硬切 | 仓库 Apache-2.0 许可已读。示例主要为 Godot／Unity，需翻译为 Three.js；其重点是镜头系统，不是动作剪辑导演 |
| [storyboard-shot-design](https://github.com/nolanx-ai/nolanx.ai/blob/595d86364377f654e24ddf2c9e875496d85e8246/.nolanx/skills/storyboard-shot-design/SKILL.md) | 每镜时长、焦点、构图、机位／运动、情绪目的、前后衔接；反对重复英雄镜头 | **轻量镜头表备选**。正文短，适合快速建立一张牌的分镜草案，但深度弱于前述导演参考库 | 已读仓库 MIT 许可。位于 NolanX 自有技能体系，需要适配其代理元数据；不提供游戏实现 |
| [storyboard-builder](https://github.com/iamxoghks/skills/blob/a4160398c60cd780ca8ab98b9ce01f8a5e126b2e/skills/storyboard-builder/SKILL.md) | 从参考视频／脚本分析镜头、时间与姿态，输出逐镜图像和 16:9／9:16 安全构图说明 | **可视化预演时再用**。适合玩家先审阅分镜图；本轮运行时改善的直接性较低 | 已读仓库 MIT 许可。完整流程包含图像生成、HTML／PDF 和辅助脚本；默认模板有韩文／英文，需要本地化，不宜只复制主文件 |
| [threejs-camera](https://github.com/full-statck-skills/threejs-skills/blob/main/skills/threejs-camera/SKILL.md) | 投影、FOV、宽高比、near／far、立方体／多视图摄像机和投影矩阵更新 | **技术备查**。可防投影与宽高比错误，但该文件没有足够的战斗分镜／剪辑指导，优先级较低 | 文件标注 Apache-2.0；本行分支链接可变，未固定提交 |

以上是内容适配排序，不以星数为质量依据，也没有测出某技能比现有方案更能改善真人手感。

## 重点参考与实际内容

1. 导演参考库的[镜头语言](https://github.com/wuwangzhang1216/DirectorSKILL/blob/c65ae0d14457053efb1e354c7e7f7e120d97fad1/references/cinematic-language.md)：区分建立空间、关系、特写、细节、反应和余波等功能；说明过肩前景过大会遮挡关键动作；区分焦距、相机距离与透视的关系。已读相关镜头功能、景别、角度、运动和镜头透视章节，未全读整个参考库。
2. 同库的[调度](https://github.com/wuwangzhang1216/DirectorSKILL/blob/c65ae0d14457053efb1e354c7e7f7e120d97fad1/references/blocking-and-staging.md)：先确定身体在空间中怎样移动，再选择相机；距离变化与接触关系本身传达力量。已读原则、距离、力量构图及部分站位模式。
3. 同库的[剪辑](https://github.com/wuwangzhang1216/DirectorSKILL/blob/c65ae0d14457053efb1e354c7e7f7e120d97fad1/references/editing-and-assembly.md)：镜头长短要有对比；区分动作切、视线切、命中切等动机，强调前后镜头屏幕方向和主体位置连续。已读节奏、切点分类和硬切衔接部分。其 24fps、片长及生成预算示例只属于影视语境，不作为游戏的硬性时长规定。
4. 同库的[镜头表](https://github.com/wuwangzhang1216/DirectorSKILL/blob/c65ae0d14457053efb1e354c7e7f7e120d97fad1/assets/shot-plan-template.md)：每镜有用途、构图、调度起止、景别、镜头运动和衔接，并逐列检查方向与动作终态。完整模板含生成预算字段，游戏只需保留相关部分。
5. Animation Craft 的[动作镜头规则](https://github.com/khanhhuyenngo985-sys/animation-craft/blob/ff0983e9f4419443cb99bb8eed5082fd6c34c499/references/motion-rules.md)：一个主导动作、首帧可读、静止也是节拍、镜头服务可读性、命中必须有接触与余波，检查起始／动作峰值／命中／结束帧。已直接阅读全文。
6. Camera Systems 的[跟随与取景](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd/skills/disciplines/camera-systems/references/follow-and-framing.md)：多目标包围范围与留白、3D 后移／FOV 取景、镜头混合、硬切后重置平滑状态。已读相关段落；不会引入 Unity／Godot 或照搬其引擎 API。

这些都属于 `source_code`／技能文档的直接读取证据。Exa／Tavily 的摘要仅用于候选发现。

## 当前实现的可观察事实

依据 [src/camera.ts](../../src/camera.ts) 的源码审查：

- `POSES` 为每个阶段／动作提供一组固定世界坐标、目标、FOV 和倾角；几种行动确实有不同角度，不是完全固定镜头。
- 普通转换统一使用 `TRANSITION_SECONDS = 0.18` 与平滑插值，命中停留统一为 `IMPACT_HOLD_SECONDS = 0.34`。当前插值已经使用真实时间增量，不能误诊为按帧固定 lerp 的帧率依赖问题。
- 一张普通牌在行动期间主要对应一个机位；HP／格挡变化再切命中或反击机位，没有把起手、发力、接触、余势编成该牌独立的镜头段落。
- 没有按角色／武器接触点与屏幕占比自动建立分镜取景约束；竖屏主要沿原视线后退。镜头测试主要证明状态选择、暂停和重置，不证明剪辑节奏或真人感受到的冲击力。

项目推断：固定机位之间使用相近的过渡方式，可能使切镜更像短距离滑动；缺少动作节拍与接触关系配合，也可能限制命中力度。以上是代码分析，不是本次新录制的动态画面结论。把抖动、倾角、黑边再加大，不能单独验证这些问题已解决。

## 推荐的最小下一步

**先以 cinematic-director 做分镜设计，必要时引用 animation-craft 的动作节拍，使用既有 Three.js 游戏技能实现。** Camera Systems 在动态取景和过渡处按需补充，不需要一次安装全部候选。

先选择“重斩”或“反击”这一张牌，设计并验证一个完整小段落：

| 节拍 | 镜头职责 | 应明确的约束 |
| --- | --- | --- |
| 出牌／起手 | 读懂行动方向、蓄力和对手位置 | 稳定右肩或侧面关系镜头；不靠持续倾斜制造力度 |
| 发力 | 表现身体及武器的运动轨迹 | 相机跟随一个主导方向；可以有意硬切，不强制全部插值 |
| 接触／反制 | 清楚看到接触点与攻防关系改变 | 镜头、角色接触、火花／血液与实际结果同拍点；不以大幅抖动遮掩距离 |
| 反应／余势 | 让伤害或格挡结果有重量 | 可读的后坐／偏转及短暂收势，再回到可操作机位 |

这是拟议实验，不是已经批准的新时长或演出规格。起手／接触／收势的实际时长需结合现有动作重新设计；不得直接套影视技能里数秒一镜的默认值。竖屏分别检查双方、接触点和卡牌安全区；反击输入窗口保持稳定，不能因为镜头动得多而影响选牌。

验收应采集真实输入的连续动作，检查起始帧、发力峰值、接触帧与收势帧，再让玩家对比同一招式的旧／新版本。单张截图、分镜编号变化或技能安装成功，都不能作为镜头“带劲”的结论。

## 本轮结果

- 通过：3 次 Exa GitHub 与 1 次 Tavily Reddit 搜索，候选链接已检查；主要 GitHub 技能正文已直接读取并固定提交。
- 通过：读取主要候选的相关参考与许可，结合当前镜头源码分析差距。
- 未完成：Reddit 原帖／评论读取；不据摘录评价社区态度。
- 未执行：候选安装、辅助脚本、付费图像／视频生成、游戏实现、运行时比较或真人质量评测。
- 仅新增本研究档案；文档检查不需要运行游戏构建。后续安装应保留上游许可、固定版本和所需参考文件，不将影视生成工具链作为游戏运行依赖。
