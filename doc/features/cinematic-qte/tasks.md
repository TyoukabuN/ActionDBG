# 演出式 QTE — 任务

所有任务依据 [PRD](prd.md)、[设计](design.md)与[计划](implementation-plan.md)。

- T-01 — 已验证（17 项 Combat 测试通过，主代理审查差异）：Combat 直接出牌模式及剩余决策时间恢复（AC-01–03）。修改范围：src/combat.ts、tests/combat.test.ts。不修改界面／渲染。验证原有及新增规则测试；声明的 API 无法满足有限状态转换时停止。
- T-02 — 已验证（7 项镜头测试通过，主代理修复已审查）：预设镜头导演与 Arena 集成（AC-04–05）。修改范围：src/camera.ts、src/scene.ts、tests/camera.test.ts。不修改 Combat／界面。验证分镜选择、暂停／重置／降低动态效果及类型；机位逻辑需要修改玩法时停止。
- T-03 — 已验证（8 项浏览器场景通过，受影响的反击场景重跑通过）：主代理集成 src/main.ts、src/style.css、tests/browser/duel.spec.ts（AC-01–05）及文档。验证屏幕／键盘即时出牌、队列兼容、时间、焦点与重试。
- T-04 — 已验证（已审查主代理差异、生产构建、浏览器回归及动作／布局证据）：最终差异审查、测试／构建／浏览器／动作证据及交付。不增加外部资产、依赖或 CI 变更。仅在实际检查后标记已验证。
