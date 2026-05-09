# Union soul 

心迹档案是一个长期陪伴型 AI 平台 MVP，面向账号管理、充值、记忆体查看、提示词调试、社区模板导入与管理员审核流程。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- lucide-react
- 本地 mock 数据与 `localStorage` 状态持久化

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://127.0.0.1:3000`。

## 页面

- `/` 登录页
- `/home` 用户主页
- `/recharge` 充值页
- `/prompt-debug` 提示词调试页
- `/community` 社区模板页
- `/memory` 记忆查看页
- `/admin/templates` 管理员审核页

更多构建说明见 `docs/mvp-build-notes.md`。
