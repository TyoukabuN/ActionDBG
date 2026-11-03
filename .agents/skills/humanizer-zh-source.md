# Humanizer-zh 来源与项目用法

- 上游：https://github.com/op7418/Humanizer-zh
- 固定提交：`f4518a8eab97b8bfebc66a89d34320a89bef6930`
- 安装日期：2026-11-03
- 本地文件：`humanizer-zh/SKILL.md`、`humanizer-zh/LICENSE`，均从该提交原样复制。
- 许可证：MIT，保留上游版权声明及完整条款。

本技能是供代理读取的中文编辑指导，不需要 npm 依赖、API Key 或运行时服务。安装在项目 `.agents/skills/`，不改用户全局配置。

编写或重写 `course/` 教材时读取技能，以自然、连贯的中文讲解为目标。保留概念、数值、数学前提、引用归属和不确定性；保护标题锚点、链接、代码、公式及表格数据。课程需要的学习目标、案例、练习和总结继续保留，不按词语黑名单机械删改。

教材讲解可从原有具体局面引入概念，再逐步推理；不得增加没有材料支持的真实经历、玩家反馈或学术结论。新写教材仍按课程大纲组织，技能负责语言编辑，不代替专业内容核实。

更新时核对上游技能和许可证差异，选择新的固定提交后替换两个文件并更新本记录。不自动跟踪主分支。文件哈希可用 `sha256sum .agents/skills/humanizer-zh/SKILL.md .agents/skills/humanizer-zh/LICENSE` 核对。
