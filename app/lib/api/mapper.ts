/**
 * api/mapper.ts
 * 将 API 响应（snake_case）映射为 UI 类型（camelCase）的适配层。
 * 
 * 职责：
 * - 处理字段名转换（snake_case ↔ camelCase）
 * - 处理类型转换（字符串日期 → 时间戳，响应模式 string → ProxyMode）
 * - 处理缺失字段的默认值（如 visits 暂为空数组，batchId 生成 UUID）
 * - 集中管理前后端契约变化的影响范围
 */

import type { ShortLink, ProxyMode } from "@/app/components/cloak-ui/types";
import type {
  SingleLinkConvertResponse,
  ConversionRecordItemResponse,
  BatchHideItemResponse,
  LinkDetailResponse,
} from "./types";

/**
 * 将 ISO 8601 日期字符串转换为 Unix 时间戳（毫秒）。
 * 若输入无效，返回当前时间戳。
 */
function parseTimestamp(dateStr: string): number {
  try {
    return new Date(dateStr).getTime();
  } catch {
    return Date.now();
  }
}

/**
 * 统一响应模式的类型转换。
 * 后端返回 "redirect" 或 "proxy"，UI 期望 ProxyMode。
 */
function normalizeProxyMode(mode: string | undefined): ProxyMode {
  if (mode === "proxy") return "proxy";
  return "redirect"; // 默认值
}

/**
 * 将单链转换 API 响应映射为 UI ShortLink。
 * 
 * 注意：
 * - id 使用 conversion_record_id，但前端需要字符串格式
 * - batchId 为单链接时由前端生成（假设调用方会提供或由 App 管理）
 * - visits 暂为空数组（后端暂无详细访问日志）
 * - status 固定为 'done'（若需转换中状态由调用方管理）
 * 
 * @param apiResp API 响应
 * @param batchId 关联的批次 ID（单链接时为对应的转换组 ID）
 * @param source 数据来源（'single' | 'batch' | 'file'）
 * @returns 前端 ShortLink
 */
export function mapSingleLinkConvertResponse(
  apiResp: SingleLinkConvertResponse,
  batchId: string,
  source: "single" | "batch" | "file" = "single"
): ShortLink {
  return {
    id: String(apiResp.conversion_record_id),
    originalUrl: apiResp.original_url,
    shortCode: apiResp.code,
    shortUrl: apiResp.short_url,
    createdAt: parseTimestamp(apiResp.created_at),
    source,
    visits: [], // 后端暂无详细日志，仅有 visit_count
    batchId,
    status: "done",
    proxyMode: normalizeProxyMode(apiResp.response_mode),
  };
}

/**
 * 将历史转换记录项映射为 UI ShortLink。
 * 
 * 注意：
 * - 后端在列表中使用 conversion_record_id 和 link_id，前端统一为 id（使用 conversion_record_id）
 * - 为了分页/分组，生成伪 batchId（基于时间或 hash），便于后续 groupLinksByBatch 分组
 * - visits 仍为空数组
 * 
 * @param apiResp API 历史记录项
 * @returns 前端 ShortLink
 */
export function mapConversionRecordToShortLink(
  apiResp: ConversionRecordItemResponse
): ShortLink {
  // 历史记录接口未返回真实 batch_id 时，必须为每条记录生成稳定且唯一的分组键。
  // 否则会被 HistoryTable 按 batchId 折叠，出现“后端 3 条，前端只显示 1 条”。
  const pseudoBatchId = `record-${apiResp.conversion_record_id}`;

  return {
    id: String(apiResp.conversion_record_id),
    originalUrl: apiResp.original_url,
    shortCode: apiResp.code,
    shortUrl: apiResp.short_url,
    createdAt: parseTimestamp(apiResp.created_at),
    source: "single", // 历史列表仅展示单链，批量/文件由具体业务确定
    visits: [],
    batchId: pseudoBatchId,
    status: "done",
    proxyMode: normalizeProxyMode(apiResp.response_mode),
  };
}

/**
 * 将批量转换单条失败项映射为 ShortLink（标记失败状态）。
 * 
 * 若 fail_cause 非空，status 应为 'done'（已完成，但失败了），
 * 失败标记由 UI 层通过 fail_cause 字段判断（此处不在 ShortLink 中存储）。
 * 
 * @param apiResp 批量转换项
 * @param batchId 关联的批次 ID
 * @returns 前端 ShortLink
 */
export function mapBatchHideItemResponse(
  apiResp: BatchHideItemResponse,
  batchId: string
): ShortLink {
  // 仅在转换成功时返回有效的 short_url/code
  const isSuccess = !apiResp.fail_cause || apiResp.fail_cause.length === 0;

  return {
    id: `batch-item-${batchId}-${apiResp.input_url}`, // 临时 ID，便于前端追踪
    originalUrl: apiResp.input_url,
    shortCode: isSuccess ? apiResp.code : "",
    shortUrl: isSuccess ? apiResp.short_url : "",
    createdAt: Date.now(),
    source: "batch",
    visits: [],
    batchId,
    status: "done",
    proxyMode: normalizeProxyMode(apiResp.response_mode),
  };
}

/**
 * 将短链详情 API 响应补充到 ShortLink（用于更新访问次数）。
 * 
 * @param existing 已有的 ShortLink
 * @param apiResp 后端短链详情
 * @returns 更新后的 ShortLink
 */
export function enrichLinkWithDetail(
  existing: ShortLink,
  apiResp: LinkDetailResponse
): ShortLink {
  return {
    ...existing,
    // 如后端提供了 visit_count，可在此处添加访问日志总数统计
    // 暂时仅更新 response_mode（若支持切换）
    proxyMode: normalizeProxyMode(apiResp.response_mode),
  };
}
