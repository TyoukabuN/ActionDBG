# 正式牌面：验证记录

日期：2026-10-15；分支：`main`；基线：`0a2bb76`；本记录随牌面修改一起提交。上游：[需求](prd.md)、[实现计划](implementation-plan.md)。

## 实现与审查

- 已安装固定版本 `frontend-design`，读取其实际内容，并结合现有 `threejs-game-ui-designer` 执行。
- `src/main.ts` 只调整牌面结构、说明关联与图片回退；保留原按钮标识、事件、规则数据和状态切换。
- `src/style.css` 使用有固定行预算的卡框，含左上费用、深色标题、插画、类型、效果、状态与快捷键；清理旧卡牌断点规则。窄屏原生横滑，鼠标悬停抬升仅用于精细指针。
- 四张原创 WebP 共 412,406 字节，来源、提示与摘要保存在 `public/assets/cards/source.json`。不增加依赖、不增加 Three.js 场景对象、不调用运行时服务。
- 主线程先确定方案并审查实际差异；局部实现使用 `gpt-6-luna` 工作线程，技能所写的旧 `gpt-5.6-luna` 当前不可用。两轮有界实现后，主线程完成字体、边距、窄屏行高、悬停约束修正与最终验证。

## 验收证据

浏览器：容器内 Chromium、Playwright、软件 WebGL。手机是触摸模拟环境，不代表真机性能验证。

| 验收 | 结果 | 实际证据 |
| --- | --- | --- |
| AC-001 | PASS | 1280×800、1440×900 截图及 DOM 边界检查；四牌同屏、标题与效果完整，结束回合底边分别为 767、863 像素。 |
| AC-002 | PASS | 390×844、320×740 可横向滚动到完整反击牌，页面无横向溢出；390×844 结束回合高 44 像素、底边 808 像素。320×740 需向下滚动，底边 798 像素，符合小屏可滚动约定。另检查 844×390、650×900、740×390。 |
| AC-003 | PASS | 现有浏览器用例覆盖鼠标／数字键入队、手机点击连续入队、手机反击、旧序列模式；最终布局再次运行两项手机用例。额外阻断全部四张插画，确认符号回退、规则文字、按键出牌及触摸入队正常。 |
| AC-004 | PASS | 类型检查、42 项单元测试、生产构建；生产预览基础路径下四张图片成功解码，正常页面无新增脚本或控制台错误。 |

七种视口均检查：图片解码、牌面子区块完整落在卡框内、规则／状态无内部截断、页面无横向溢出。额外检查键盘操作后焦点轮廓可见、减少动态偏好下过渡时长生效，以及“演出中／等待执行”文字的边界。阻断图片场景中预期的网络失败与应用脚本错误分开处理。

临时验证脚本和截图目录：`/tmp/actiondbg-cards-20261015/`，包含 `check-layout.mjs`、`check-fallback.mjs`、`layout.json`、修改前后截图及失败回退截图。临时证据不作为仓库资源提交；本记录保存结果和关键尺寸。

## 命令与结果

- `npm run typecheck`：PASS。
- `npm test`：PASS，3 文件、42 项。
- `npm run build`：PASS。最终主脚本 695.79 kB，gzip 183.32 kB；仍有既存的超过 500 kB 提示。
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser -- tests/browser/duel.spec.ts --grep 'queue history|portrait touch plays|continuous card input'`：PASS，4 项，2.1 分钟，第一版布局。
- 最终调整后：`CHROMIUM_PATH=/usr/bin/chromium npm run test:browser -- tests/browser/duel.spec.ts --grep 'portrait touch plays|continuous card input.*portrait touch'`：PASS，2 项，52.3 秒。
- 最终 `node /tmp/actiondbg-cards-20261015/check-layout.mjs`：PASS，7 种视口。
- 最终 `node /tmp/actiondbg-cards-20261015/check-fallback.mjs`：PASS。首轮焦点检查直接在触摸后调用程序化聚焦，没有进入键盘焦点模式；修正验证步骤为先按 Tab 后复验通过，产品代码无需变更。
- 文档中文与本地链接检查、`git diff --check`：PASS。

## 限制

- 未对整套浏览器场景和角色动作再次全量回归；战斗代码未改，复用了既有规则单元测试，重点复验本次影响的交互。
- 没有真机 Safari 或 Android 设备测量；窄屏及横屏可能需要纵向滚动。
- GitHub Actions API 返回 Forbidden，在线 Pages 请求被当前网络阻挡，因此 CI 和本次线上部署状态均为 NOT RUN，不能以本地构建成功替代部署成功。
