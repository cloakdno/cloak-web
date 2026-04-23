/**
 * api/types.ts
 * 全部后端 API 的 Request / Response TypeScript 类型定义。
 * 严格对应 api-docs/swagger.json 中的 definitions 节，使用 camelCase 字段名
 * （HTTP 层使用 snake_case，Client 内部不做转换，此处保持与后端一致的 snake_case）。
 */

// ─────────────────────────────────────────────
// 通用枚举
// ─────────────────────────────────────────────

/** 短链响应模式：redirect（302 重定向）或 proxy（服务端代理） */
export type ResponseMode = "redirect" | "proxy";

/** 转换任务状态（对应 model.ConversionStatus） */
export type ConversionStatus = "success" | "failed" | "processing";

/** 转换记录类型（对应 response.ConversionRecordItemResponse.conversion_type） */
export type ConversionType = "single_link" | "batch_text" | "document_file";

// ─────────────────────────────────────────────
// 通用响应
// ─────────────────────────────────────────────

/** 统一错误响应体（对应 response.ErrorResponse） */
export interface ErrorResponse {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  details: unknown | null;
}

/** 纯消息响应（对应 response.MessageResponse） */
export interface MessageResponse {
  message: string;
}

// ─────────────────────────────────────────────
// system
// ─────────────────────────────────────────────

/** GET /api/system/expiry 响应（对应 response.SystemExpiryResponse） */
export interface SystemExpiryResponse {
  /** 配置的过期 Unix 时间戳（秒），0 表示永不过期 */
  expiry_timestamp: number;
  /** 过期时间的人类可读格式（RFC3339），永不过期时为空字符串 */
  expiry_time_formatted: string;
  /** 是否已过期 */
  is_expired: boolean;
  /** 是否永不过期 */
  never_expires: boolean;
  /** 剩余秒数；已过期或永不过期时为 0 */
  remaining_seconds: number;
}

// ─────────────────────────────────────────────
// user
// ─────────────────────────────────────────────

/** GET /api/user/profile 响应（对应 response.UserProfileResponse） */
export interface UserProfileResponse {
  id: number;
  username: string;
  total_links: number;
  registered_days: number;
  created_at: string;
  updated_at: string;
}

/** POST /api/user/update-username 请求体（对应 request.UpdateUsernameRequest） */
export interface UpdateUsernameRequest {
  username: string;
}

/** POST /api/user/update-username 响应（对应 response.UpdateUsernameResponse） */
export interface UpdateUsernameResponse {
  profile: UserProfileResponse;
}

/** POST /api/user/update-password 请求体（对应 request.UpdatePasswordRequest） */
export interface UpdatePasswordRequest {
  old_password: string;
  new_password: string;
}

/** POST /api/user/update-password 响应（对应 response.UpdatePasswordResponse） */
export interface UpdatePasswordResponse {
  message: string;
}

// ─────────────────────────────────────────────
// links（单链接 & 批量链接）
// ─────────────────────────────────────────────

/** POST /api/links/convert 请求体（对应 request.ConvertSingleLinkRequest） */
export interface ConvertSingleLinkRequest {
  url: string;
  /** 可选，不传则使用服务端默认值 */
  response_mode?: ResponseMode;
}

/** POST /api/links/convert 响应（对应 response.SingleLinkConvertResponse） */
export interface SingleLinkConvertResponse {
  code: string;
  short_url: string;
  original_url: string;
  response_mode: ResponseMode;
  conversion_record_id: number;
  /** 是否新建（false 表示复用已有短链） */
  created: boolean;
  created_at: string;
  updated_at: string;
}

/** POST /api/links/batch 请求体（对应 request.BatchHideRequest） */
export interface BatchHideRequest {
  urls: string[];
  /** 可选 */
  response_mode?: ResponseMode;
}

/** 批量转换结果中的单条记录（对应 response.BatchHideItemResponse） */
export interface BatchHideItemResponse {
  input_url: string;
  code: string;
  short_url: string;
  response_mode: ResponseMode;
  /** 是否新建 */
  created: boolean;
  /** 转换失败时的错误原因，成功时为空字符串 */
  fail_cause: string;
}

/** POST /api/links/batch 响应（对应 response.BatchHideResponse） */
export interface BatchHideResponse {
  items: BatchHideItemResponse[];
}

/** GET /api/links/{code} 响应（对应 response.LinkDetailResponse） */
export interface LinkDetailResponse {
  id: number;
  code: string;
  original_url: string;
  response_mode: ResponseMode;
  visit_count: number;
  created_at: string;
  updated_at: string;
}

/** PUT /api/links/{code}/original-url 请求体（对应 request.UpdateOriginalURLRequest） */
export interface UpdateOriginalURLRequest {
  original_url: string;
}

/** PUT /api/links/{code}/original-url 响应（对应 response.LinkOriginalURLUpdateResponse） */
export interface LinkOriginalURLUpdateResponse {
  code: string;
  original_url: string;
  updated_at: string;
}

/** PUT /api/links/{code}/response-mode 请求体（对应 request.UpdateResponseModeRequest） */
export interface UpdateResponseModeRequest {
  response_mode: ResponseMode;
}

/** PUT /api/links/{code}/response-mode 响应（对应 response.LinkResponseModeUpdateResponse） */
export interface LinkResponseModeUpdateResponse {
  code: string;
  original_url: string;
  response_mode: ResponseMode;
  updated_at: string;
}

// ─────────────────────────────────────────────
// batch-text（文本批量转换任务）
// ─────────────────────────────────────────────

/** POST /api/batch-text/batch 请求体（对应 request.BatchTextConvertRequest） */
export interface BatchTextConvertRequest {
  source_text: string;
  /** 可选 */
  response_mode?: ResponseMode;
}

/** POST /api/batch-text/batch 响应（对应 response.BatchTextSubmitResponse） */
export interface BatchTextSubmitResponse {
  conversion_id: number;
  status: string;
  message: string;
  recognized_link_count: number;
  conversion_record_count: number;
}

/** GET /api/batch-text/{id} 响应（对应 response.BatchTextDetailResponse） */
export interface BatchTextDetailResponse {
  id: number;
  source_text: string;
  converted_text: string;
  recognized_link_count: number;
  total_visit_count: number;
  response_mode: ResponseMode;
  status: ConversionStatus;
  created_at: string;
  updated_at: string;
}

/** PUT /api/batch-text/{id}/response-mode 请求体（对应 request.BatchTextUpdateResponseModeRequest） */
export interface BatchTextUpdateResponseModeRequest {
  response_mode: ResponseMode;
}

// ─────────────────────────────────────────────
// document-file（文档文件转换任务）
// ─────────────────────────────────────────────

/**
 * POST /api/document-file/batch 响应（对应 response.DocumentFileSubmitResponse）
 * 请求使用 multipart/form-data，参数为 file（File）+ response_mode（可选字符串）
 */
export interface DocumentFileSubmitResponse {
  conversion_id: number;
  file_id: number;
  status: string;
  message: string;
}

/** PUT /api/document-file/{id}/response-mode 请求体（对应 request.DocumentFileUpdateResponseModeRequest） */
export interface DocumentFileUpdateResponseModeRequest {
  response_mode: ResponseMode;
}

/** PUT /api/document-file/{id}/response-mode 响应（对应 response.DocumentFileUpdateResponseModeResponse） */
export interface DocumentFileUpdateResponseModeResponse {
  conversion_id: number;
  response_mode: ResponseMode;
  message: string;
}

/** 文件元数据（对应 model.StoredFile） */
export interface StoredFile {
  id: number;
  file_name: string;
  save_directory: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

/** 单链转换详情（对应 response.SingleLinkConversionDetailResponse） */
export interface SingleLinkConversionDetailResponse {
  id: number;
  code: string;
  original_url: string;
  response_mode: ResponseMode;
  visit_count: number;
  batch_text_conversion_id: number | null;
  document_file_conversion_id: number | null;
  created_at: string;
  updated_at: string;
}

/** 批量文本转换详情（对应 response.BatchTextConversionDetailResponse） */
export interface BatchTextConversionDetailResponse {
  id: number;
  source_text: string;
  converted_text: string;
  recognized_link_count: number;
  total_visit_count: number;
  response_mode: ResponseMode;
  status: ConversionStatus;
  download_url: string;
  last_total_visit_count_at: string;
  created_at: string;
  updated_at: string;
}

/** 文档文件转换详情（对应 response.DocumentFileConversionDetailResponse） */
export interface DocumentFileConversionDetailResponse {
  id: number;
  file_id: number;
  converted_file_id: number;
  recognized_link_count: number;
  total_visit_count: number;
  response_mode: ResponseMode;
  status: ConversionStatus;
  download_url: string;
  last_total_visit_count_at: string;
  uploaded_file: StoredFile;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// conversions（历史转换记录）
// ─────────────────────────────────────────────

/** 分页查询参数（GET /api/conversions 和 GET /api/conversions/search 公用） */
export interface ConversionPageParams {
  page?: number;
  size?: number;
}

/** GET /api/conversions/search 查询参数（在 ConversionPageParams 基础上追加关键词） */
export interface ConversionSearchParams extends ConversionPageParams {
  keyword?: string;
}

/** 转换记录单条数据（对应 response.ConversionRecordItemResponse） */
export interface ConversionRecordItemResponse {
  id: number;
  link_id: number;
  batch_text_conversion_id?: number | null;
  uploaded_file_id?: number | null;
  conversion_type: ConversionType;
  single_link?: SingleLinkConversionDetailResponse;
  batch_text?: BatchTextConversionDetailResponse;
  document_file?: DocumentFileConversionDetailResponse;
  created_at: string;
  updated_at: string;
}

/** 分页查询结果（对应 response.ConversionPageResponse） */
export interface ConversionPageResponse {
  items: ConversionRecordItemResponse[];
  page: number;
  size: number;
  total: number;
  has_prev: boolean;
  has_next: boolean;
  prev_page: number;
  next_page: number;
}
