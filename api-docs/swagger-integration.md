# Swagger 接入说明

## 1. 访问地址

服务启动后可访问：

- Swagger UI: `/swagger/index.html`
- OpenAPI JSON: `/swagger/doc.json`

## 2. 鉴权方式

除注册类接口（当前项目暂无公开注册接口）外，`/api/**` 默认要求 `BasicAuth`。

Swagger 页面中点击 `Authorize`，按如下格式填写：

- Username: 你的用户名
- Password: 你的密码

## 3. 完整接口目录

说明：

- 标记为“是”的接口需要 BasicAuth。
- `/:code` 为短链访问入口，不走 BasicAuth，但会经过服务过期拦截。

### 3.1 health

- GET /health（鉴权：否）
  - 功能：健康检查

### 3.2 system

- GET /api/system/expiry（鉴权：否）
  - 功能：查询服务过期信息

### 3.3 user

- GET /api/user/profile（鉴权：是）
  - 功能：获取当前用户资料
- POST /api/user/update-username（鉴权：是）
  - 功能：修改当前用户名
- POST /api/user/update-password（鉴权：是）
  - 功能：修改当前用户密码

### 3.4 links

- POST /api/links/convert（鉴权：是）
  - 功能：单链接转换
- POST /api/links/batch（鉴权：是）
  - 功能：批量转换链接
- GET /api/links/{code}（鉴权：是）
  - 功能：查询短链详情
- PUT /api/links/{code}/original-url（鉴权：是）
  - 功能：修改原始链接
- PUT /api/links/{code}/response-mode（鉴权：是）
  - 功能：修改响应模式
- DELETE /api/links/{code}（鉴权：是）
  - 功能：删除短链
- GET /{code}（鉴权：否）
  - 功能：访问短链（重定向或代理）

### 3.5 batch-text

- POST /api/batch-text/batch（鉴权：是）
  - 功能：提交批量文本转换任务
- GET /api/batch-text/{id}（鉴权：是）
  - 功能：查询任务详情
- GET /api/batch-text/{id}/download（鉴权：是）
  - 功能：下载转换后的文本
- PUT /api/batch-text/{id}/response-mode（鉴权：是）
  - 功能：切换任务下全部短链响应模式（异步，202）
- DELETE /api/batch-text/{id}（鉴权：是）
  - 功能：删除任务及关联数据（异步，202）

### 3.6 document-file

- POST /api/document-file/batch（鉴权：是）
  - 功能：上传文件并提交转换任务（multipart/form-data）
- GET /api/document-file/{id}/download（鉴权：是）
  - 功能：下载转换结果文件
- PUT /api/document-file/{id}/response-mode（鉴权：是）
  - 功能：切换任务下全部短链响应模式（异步，202）
- DELETE /api/document-file/{id}（鉴权：是）
  - 功能：删除任务及关联数据（异步，202）

### 3.7 conversions

- GET /api/conversions（鉴权：是）
  - 功能：分页查询转换记录（返回 single_link / batch_text / document_file 三类详情）
- GET /api/conversions/search（鉴权：是）
  - 功能：按关键词分页搜索转换记录（返回结构与 /api/conversions 一致）

## 4. 请求与响应示例

### 4.1 修改用户名

请求：POST /api/user/update-username

```json
{
  "username": "new_name"
}
```

成功响应：

```json
{
  "profile": {
    "id": 1,
    "username": "new_name",
    "total_links": 12,
    "registered_days": 25,
    "created_at": "2026-01-01T12:00:00Z",
    "updated_at": "2026-04-23T08:30:00Z"
  }
}
```

### 4.2 单链接转换

请求：POST /api/links/convert

```json
{
  "url": "https://example.com/article/1001",
  "response_mode": "redirect"
}
```

成功响应：

```json
{
  "code": "a1b2c3",
  "short_url": "https://your-domain/a1b2c3",
  "original_url": "https://example.com/article/1001",
  "response_mode": "redirect",
  "conversion_record_id": 101,
  "created": true,
  "created_at": "2026-04-23T08:30:00Z",
  "updated_at": "2026-04-23T08:30:00Z"
}
```

### 4.3 文档文件转换（multipart）

请求字段：

- file：待转换文本文件
- response_mode：可选，`redirect` 或 `proxy`

成功响应：

```json
{
  "conversion_id": 88,
  "file_id": 15,
  "status": "processing",
  "message": "任务已提交"
}
```

### 4.4 修改密码

请求：POST /api/user/update-password

```json
{
  "old_password": "old_pass",
  "new_password": "new_pass"
}
```

成功响应：

```json
{
  "message": "密码修改成功"
}
```

### 4.5 转换记录分页（三态详情）

请求：GET /api/conversions?page=1&size=20

成功响应（示例）：

```json
{
  "items": [
    {
      "id": 101,
      "link_id": 201,
      "batch_text_conversion_id": null,
      "uploaded_file_id": null,
      "conversion_type": "single_link",
      "single_link": {
        "id": 201,
        "code": "single01",
        "original_url": "https://single.example.com",
        "response_mode": "redirect",
        "visit_count": 0,
        "created_at": "2026-04-24T14:30:00Z",
        "updated_at": "2026-04-24T14:30:00Z"
      },
      "created_at": "2026-04-24T14:30:00Z",
      "updated_at": "2026-04-24T14:30:00Z"
    },
    {
      "id": 102,
      "link_id": 202,
      "batch_text_conversion_id": 12,
      "uploaded_file_id": null,
      "conversion_type": "batch_text",
      "batch_text": {
        "id": 12,
        "source_text": "",
        "converted_text": "",
        "recognized_link_count": 1,
        "status": "success",
        "total_visit_count": 0,
        "response_mode": "redirect",
        "created_at": "2026-04-24T14:10:00Z",
        "updated_at": "2026-04-24T14:31:00Z",
        "download_url": "http://localhost:9000/api/batch-text/12/download"
      },
      "created_at": "2026-04-24T14:31:00Z",
      "updated_at": "2026-04-24T14:31:00Z"
    },
    {
      "id": 103,
      "link_id": 203,
      "batch_text_conversion_id": null,
      "uploaded_file_id": 30,
      "conversion_type": "document_file",
      "document_file": {
        "id": 20,
        "file_id": 30,
        "converted_file_id": 31,
        "recognized_link_count": 1,
        "status": "success",
        "total_visit_count": 0,
        "response_mode": "redirect",
        "created_at": "2026-04-24T14:20:00Z",
        "updated_at": "2026-04-24T14:32:00Z",
        "download_url": "http://localhost:9000/api/document-file/20/download",
        "uploaded_file": {
          "id": 30,
          "file_name": "source.txt",
          "save_directory": "storage/uploads/source_xxx.txt",
          "file_type": "text/plain",
          "file_size": 128,
          "created_at": "2026-04-24T14:20:00Z",
          "updated_at": "2026-04-24T14:20:00Z"
        }
      },
      "created_at": "2026-04-24T14:32:00Z",
      "updated_at": "2026-04-24T14:32:00Z"
    }
  ],
  "page": 1,
  "size": 20,
  "next_page": 0,
  "prev_page": 0,
  "has_next": false,
  "has_prev": false,
  "total": 3
}
```

### 4.6 转换记录字段策略（前端必读）

- 批量文本任务提交接口 `POST /api/batch-text/batch`：每个任务仅写入 1 条 `conversion_records` 记录。
- 转换列表接口 `GET /api/conversions` 与 `GET /api/conversions/search`：
  - 列表项根对象是 `conversion_records` 的扁平字段：`id`、`link_id`、`batch_text_conversion_id`、`uploaded_file_id`、`created_at`、`updated_at`。
  - `single_link.created_at`、`single_link.updated_at`、`single_link.visit_count` 与数据库 `links` 保持一致。
  - `items.created_at`、`items.updated_at` 表示 `conversion_records` 记录时间，不等同于 `single_link` 内的时间字段。
  - `batch_text.created_at`、`batch_text.updated_at`、`batch_text.total_visit_count`、`batch_text.recognized_link_count`、`batch_text.status`、`batch_text.response_mode` 与数据库 `batch_text_conversions` 保持一致。
  - `batch_text.source_text` 固定返回空字符串 `""`。
  - `batch_text.converted_text` 固定返回空字符串 `""`。
- 设计目的：避免在分页列表中返回超大文本，降低接口响应体积，提升页面加载速度。

字段迁移说明：

- 旧：`batch_text.conversion_id`
- 新：`batch_text.id`
- 旧：`items.conversion_record_id`
- 新：`items.id`（对应 `conversion_records.id`）

## 5. 统一错误响应格式

```json
{
  "timestamp": "2026-04-23T08:30:00Z",
  "status": 401,
  "code": "UNAUTHORIZED",
  "message": "缺少 BasicAuth 凭证",
  "details": null
}
```

## 6. 常见状态码

- `400`：请求体格式错误或参数非法
- `401`：鉴权失败或缺少鉴权信息
- `403`：服务过期或权限受限
- `404`：资源不存在
- `409`：资源冲突（如用户名已存在）
- `500`：服务内部错误
- `502`：代理访问上游失败

## 7. 文档更新命令

在项目根目录执行：

```bash
go run github.com/swaggo/swag/cmd/swag@latest init -g main.go -o docs --parseDependency --parseInternal
```

每次新增/修改 Swagger 注解后都应重新生成 docs。

## 8. 前端速查表（按页面场景）

### 8.1 应用启动

最小调用链：

1. GET /health
2. GET /api/system/expiry

处理建议：

- /health 非 200：提示服务不可用，停止后续请求。
- /api/system/expiry 返回 is_expired=true：前端进入受限态，禁用新增/编辑/删除按钮。

### 8.2 用户中心页

最小调用链：

1. GET /api/user/profile

操作链：

1. POST /api/user/update-username
2. POST /api/user/update-password

处理建议：

- 401：提示重新输入账号密码。
- 409（update-username）：提示用户名已存在。

### 8.3 单链接转换页

最小调用链：

1. POST /api/links/convert
2. GET /api/links/{code}（可选，用于刷新详情）

操作链：

1. PUT /api/links/{code}/original-url
2. PUT /api/links/{code}/response-mode
3. DELETE /api/links/{code}

处理建议：

- 404：短链不存在，前端从列表中移除该项。
- 400：优先展示 message，若存在 details 则透出字段级错误。

### 8.4 批量文本转换页

最小调用链：

1. POST /api/batch-text/batch
2. GET /api/batch-text/{id}
3. GET /api/batch-text/{id}/download（用户下载时触发）

异步操作链：

1. PUT /api/batch-text/{id}/response-mode（返回 202）
2. DELETE /api/batch-text/{id}（返回 202）

处理建议：

- 对 202 场景，前端应提示“请求已受理，后台处理中”。
- 对详情页可用轮询刷新状态（例如 2~5 秒一次，直到状态稳定）。

### 8.5 文档文件转换页

最小调用链：

1. POST /api/document-file/batch（multipart/form-data）
2. GET /api/document-file/{id}/download（用户下载时触发）

异步操作链：

1. PUT /api/document-file/{id}/response-mode（返回 202）
2. DELETE /api/document-file/{id}（返回 202）

处理建议：

- 上传前前端先做文件大小校验，限制 10MB 以内。
- 上传接口失败时，优先提示“文件格式/大小错误”，再展示后端 message。

### 8.6 转换记录列表页

最小调用链：

1. GET /api/conversions?page=1&size=20
2. GET /api/conversions/search?keyword=xxx&page=1&size=20（搜索时触发）

处理建议：

- 使用返回的 has_next、has_prev、next_page、prev_page 驱动分页控件。
- 搜索关键词变更时重置到第 1 页。
- `batch_text` 字段读取策略：`source_text` 与 `converted_text` 固定为空字符串，不要依赖该接口返回大文本内容。
- 若用户需要查看批量文本原文与转换结果，请跳转任务详情接口 `GET /api/batch-text/{id}` 或下载接口 `GET /api/batch-text/{id}/download`。
- 批量任务在 `conversion_records` 中仅有一条聚合记录，列表中不再按每个识别链接展开多条批量记录。
- 字段兼容迁移：`batch_text.conversion_id` 改为 `batch_text.id`，`items.conversion_record_id` 改为 `items.id`。
- 列表页建议缓存 `code`、`conversion_type`、`batch_text.id`、`batch_text.total_visit_count`、`batch_text.updated_at` 等轻量字段，避免缓存详情大文本。

### 8.7 鉴权请求头示例

除公开接口外，请求都应携带 BasicAuth。

示例（概念）：

- Authorization: Basic base64(username:password)

### 8.8 页面级错误处理建议

统一处理顺序：

1. 优先使用响应中的 message。
2. 若 details 存在且可读，追加展示 details。
3. 401：跳转登录或弹出重新认证。
4. 403：展示“服务已过期/禁止访问”。
5. 404：提示资源不存在并回退列表页。
6. 5xx：提示系统繁忙并允许重试。
