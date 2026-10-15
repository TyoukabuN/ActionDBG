# cinematic-director 来源与安装记录

- 安装日期：2026-10-15。
- 上游：https://github.com/wuwangzhang1216/DirectorSKILL
- 固定提交：`c65ae0d14457053efb1e354c7e7f7e120d97fad1`。
- 技能元数据版本：`2.1.0`。
- 许可证：MIT，Copyright (c) 2026 wangzhang-wu；原文保留于 `cinematic-director/LICENSE`。
- 安装位置：`.agents/skills/cinematic-director/`。

从固定提交收录 50 个文件：技能正文、完整参考资料与模板、README、变更记录、贡献说明、评估材料及许可证。仅省略上游仓库的 `.github/` 工作流、`.gitignore` 和 `.markdownlint.json`。所有收录文件均与固定提交逐字节比对一致，未改写上游正文。未嵌套 Git 仓库，未使用 submodule，未执行上游评估或其他工具。

本项目使用其导演、动作调度、分镜、连续性与剪辑指导来设计实时 3D 卡牌演出；具体适配边界写在根目录 `AGENTS.md`。安装不增加游戏运行依赖、不启用视频生成接口、不配置密钥，也不代表任何卡牌演出已经实现。

后续更新先检出指定上游提交，对照本记录核实差异，保留本地适配说明与许可证，再更新固定提交和文件比对结果。不要直接跟随浮动分支覆盖。可用 `$cinematic-director` 点名技能；宿主的自动发现可能需要新会话，当前会话也可直接读取该路径下的 `SKILL.md`。
