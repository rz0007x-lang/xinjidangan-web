# MindTrace Companion 第一版构建说明

项目中文名：心迹陪伴。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- lucide-react 图标
- 本地 mock 数据与 `localStorage` 状态持久化

## 页面范围

- `/`：登录页，模拟账号登录后进入用户主页。
- `/home`：用户主页，展示账号信息、余额、会员状态、快捷入口和记忆体切换。
- `/recharge`：账号级充值页，选择套餐后模拟支付成功并更新余额。
- `/prompt-debug`：提示词调试页，绑定当前记忆体，可编辑系统提示词、人设提示词，支持社区模板导入、mock 聊天和保存。
- `/community`：智能体模板社区，支持搜索、标签筛选、排序、上传模板、详情查看和导入到提示词调试。
- `/memory`：记忆查看页，绑定当前记忆体，提供日期条、只读记忆图谱、时间线和未来视图入口。
- `/admin/templates`：管理员审核页，支持查看全部模板、通过和拒绝，审核通过后模板出现在社区公开列表。

## 数据结构

当前版本在 `lib/types.ts` 中定义：

- `User`
- `MemorySpace`
- `PromptTemplate`
- `MemoryItem`
- `RechargePlan`
- `AuditStatus`
- `PromptDraft`

mock 数据集中在 `lib/mock-data.ts`，状态逻辑集中在 `lib/store.tsx`。

## 关键交互

- 登录后进入 `/home`。
- 当前记忆体为全局状态，影响 `/prompt-debug` 和 `/memory`。
- 充值为账号级功能，只更新用户余额，不绑定记忆体。
- 社区模板为账号级公共资源，公开社区只展示 `approved` 状态模板。
- 上传模板后状态为 `pending`，管理员通过后可在社区搜索和导入。
- 从社区导入模板会跳转到 `/prompt-debug?template=模板ID`，并写入当前记忆体的提示词草稿。
- 记忆页仅允许查看，编辑按钮禁用并提示“记忆编辑功能暂未开放”。

## 后续接接口建议

- 将 `lib/store.tsx` 中的状态更新函数替换为 API client 或 server actions。
- 将 `PromptTemplate.auditStatus` 接入管理员审核接口。
- 将当前记忆体 ID 放入用户偏好接口，避免只存在浏览器本地。
- 将提示词草稿按 `memorySpaceId` 持久化到后端。
- 记忆图谱未来可替换为图数据库或可视化库，但第一版保留轻量 SVG/CSS 实现。
