/**
 * api/index.ts
 * 统一导出 API 层的全部类型、工具类和接口函数。
 *
 * 使用示例：
 *   import { createApiClient, getUserProfile, ApiError } from "@/app/lib/api";
 *
 *   const api = createApiClient("admin", "secret");
 *   try {
 *     const profile = await getUserProfile(api);
 *   } catch (err) {
 *     if (err instanceof ApiError) {
 *       console.error(err.status, err.code, err.message);
 *     }
 *   }
 */

// ─── 核心 Client ─────────────────────────────
export { ApiClient, ApiError, createApiClient } from "./client";
export type { ApiClientOptions } from "./client";

// ─── 全量类型定义 ────────────────────────────
export type {
  // 通用
  ResponseMode,
  ConversionStatus,
  ConversionType,
  ErrorResponse,
  MessageResponse,
  // system
  SystemExpiryResponse,
  // user
  UserProfileResponse,
  UpdateUsernameRequest,
  UpdateUsernameResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  // links
  ConvertSingleLinkRequest,
  SingleLinkConvertResponse,
  BatchHideRequest,
  BatchHideItemResponse,
  BatchHideResponse,
  LinkDetailResponse,
  UpdateOriginalURLRequest,
  LinkOriginalURLUpdateResponse,
  UpdateResponseModeRequest,
  LinkResponseModeUpdateResponse,
  // batch-text
  BatchTextConvertRequest,
  BatchTextSubmitResponse,
  BatchTextDetailResponse,
  BatchTextUpdateResponseModeRequest,
  BatchTextConversionDetailResponse,
  // document-file
  DocumentFileSubmitResponse,
  DocumentFileUpdateResponseModeRequest,
  DocumentFileUpdateResponseModeResponse,
  DocumentFileConversionDetailResponse,
  StoredFile,
  SingleLinkConversionDetailResponse,
  // conversions
  ConversionPageParams,
  ConversionSearchParams,
  ConversionRecordItemResponse,
  ConversionPageResponse,
} from "./types";

// ─── health ──────────────────────────────────
export { checkHealth } from "./health";
export type { HealthResponse } from "./health";

// ─── system ──────────────────────────────────
export { getSystemExpiry } from "./system";

// ─── user ────────────────────────────────────
export { getUserProfile, updateUsername, updatePassword } from "./user";

// ─── links ───────────────────────────────────
export {
  convertSingleLink,
  batchConvertLinks,
  getLinkDetail,
  deleteLink,
  updateLinkOriginalUrl,
  updateLinkResponseMode,
} from "./links";

// ─── batch-text ──────────────────────────────
export {
  submitBatchTextConvert,
  getBatchTextDetail,
  deleteBatchText,
  downloadBatchText,
  updateBatchTextResponseMode,
} from "./batch-text";

// ─── document-file ───────────────────────────
export {
  submitDocumentFileConvert,
  deleteDocumentFile,
  downloadDocumentFile,
  updateDocumentFileResponseMode,
} from "./document-file";

// ─── conversions ─────────────────────────────
export { listConversions, searchConversions } from "./conversions";

// ─── mapper（API 响应 → UI 类型转换） ─────────
export {
  mapSingleLinkConvertResponse,
  mapConversionRecordToShortLink,
  mapBatchHideItemResponse,
  enrichLinkWithDetail,
} from "./mapper";
