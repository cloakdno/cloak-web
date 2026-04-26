# Cloak Web

Cloak Web 是一个**短链接管理系统的前端控制台**，使用 Next.js 构建。核心功能是将原始 URL 转换为短链接（"隐藏"原始链接），支持单链接、批量文本、文档文件三种转换方式。

## 快速启动

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看效果。

## 核心技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.x | 全栈 React 框架，使用 App Router |
| **React** | 19.x | UI 框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Tailwind CSS** | 4.x | 原子化样式 |
| **Framer Motion** | 12.x | 动画效果 |
| **Lucide React** | 1.x | 图标库 |
| **react-hot-toast** | 2.x | Toast 通知 |

## 目录结构

```
cloak-web/
├── app/                          # Next.js App Router 根目录
│   ├── layout.tsx                # 全局布局（字体、Toast、lang="zh-CN"）
│   ├── page.tsx                  # 首页，直接渲染 <CloakDashboard />
│   ├── globals.css               # 全局样式
│   │
│   ├── components/
│   │   ├── toast-provider.tsx    # react-hot-toast 全局 Provider
│   │   └── cloak-ui/             # 核心 UI 功能模块（主体）
│   │       ├── App.tsx           # 根组件（管理全局状态）
│   │       ├── CloakDashboard.tsx# 导出入口，标记 "use client"
│   │       ├── index.ts          # 对外导出
│   │       ├── mock.ts           # 开发用模拟数据
│   │       ├── types/            # 前端内部类型（ShortLink、ConversionGroup 等）
│   │       ├── utils/
│   │       │   └── shortlink.ts  # URL 提取、短链生成等工具函数
│   │       └── components/       # 各功能子组件
│   │           ├── LoginPage.tsx         # 登录页
│   │           ├── Header.tsx            # 顶栏（用户信息、设置）
│   │           ├── TabSwitcher.tsx       # 三种转换模式切换标签
│   │           ├── SingleConvert.tsx     # 单链接转换
│   │           ├── BatchConvert.tsx      # 批量文本转换
│   │           ├── FileConvert.tsx       # 文档文件转换
│   │           ├── HistoryTable.tsx      # 历史记录表格（分页/搜索）
│   │           ├── EditModal.tsx         # 编辑短链弹窗
│   │           ├── BatchViewModal.tsx    # 批量结果查看弹窗
│   │           ├── ChangePasswordModal.tsx  # 修改密码弹窗
│   │           ├── ChangeUsernameModal.tsx  # 修改用户名弹窗
│   │           ├── UserManageModal.tsx   # 用户管理弹窗
│   │           └── FormatTip.tsx         # 输入格式提示
│   │
│   └── lib/
│       └── api/                  # 后端 API 封装层
│           ├── client.ts         # ApiClient 类（HTTP 封装 + BasicAuth）
│           ├── types.ts          # 所有 API 请求/响应类型（对应 swagger）
│           ├── mapper.ts         # API 响应 → 前端 UI 类型转换
│           ├── index.ts          # 统一导出
│           ├── health.ts         # GET /api/health
│           ├── system.ts         # GET /api/system/expiry
│           ├── user.ts           # 用户 profile / 改密 / 改用户名
│           ├── links.ts          # 单链接 CRUD
│           ├── batch-text.ts     # 批量文本任务
│           ├── document-file.ts  # 文档文件任务
│           └── conversions.ts    # 历史记录分页/搜索
│
├── api-docs/                     # 后端 API 文档（swagger.json/yaml）
├── public/                       # 静态资源
├── next.config.ts                # Next.js 配置
├── Dockerfile                    # 容器化部署
└── package.json
```

## 架构设计

### 认证方式

采用 **HTTP Basic Auth**（用户名 + 密码）。`ApiClient` 在初始化时将凭证 base64 编码，每次请求自动添加 `Authorization` 头。凭证通过 `localStorage` 持久化（key: `cloak-auth-user`）。

### API 层分层设计

```
App.tsx（业务逻辑）
  ↓ 调用
lib/api/links.ts, batch-text.ts, ...（功能模块函数）
  ↓ 调用
lib/api/client.ts（ApiClient，底层 fetch 封装）
  ↓ 调用
后端 REST API
```

- `ApiError` 类统一封装后端 4xx/5xx 错误（含 `status`、`code`、`message`、`details`）
- `mapper.ts` 负责将后端 snake_case 响应转换为前端 UI 类型

### 三种转换模式

| 模式 | 说明 | API |
|------|------|-----|
| **单链接** (single) | 输入单个 URL → 获得短链 | `POST /api/links/convert` |
| **批量文本** (batch) | 粘贴含多个 URL 的文本，批量替换 | `POST /api/batch-text/batch`（轮询状态）|
| **文件转换** (file) | 上传文档，文档内所有 URL 被替换 | `POST /api/document-file/batch`（轮询状态）|

批量/文件模式为**异步任务**，前端每 3 秒轮询一次，最多轮询 40 次（约 2 分钟）。

### 代理模式

每个短链支持两种响应模式：

- **redirect**：返回 302 跳转
- **proxy**：服务端代理转发

## 后端 API 环境变量

通过环境变量（`.env*` 文件）配置后端 API 地址：

```bash
# 客户端（浏览器侧，必须使用 NEXT_PUBLIC_ 前缀）
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# 服务端（Server Components / Route Handlers，优先级更高）
API_BASE_URL=http://localhost:8080
```

`baseUrl` 优先级：

1. 显式传参（最高优先级）
2. 服务端：`API_BASE_URL` → `NEXT_PUBLIC_API_BASE_URL`
3. 客户端：`NEXT_PUBLIC_API_BASE_URL`
4. 默认空字符串（相对路径）
