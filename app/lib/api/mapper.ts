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

type UiSource = "single" | "batch" | "file";
type UiStatus = "converting" | "done";

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
 * 将后端 conversion_type 映射到前端来源标签。
 */
function normalizeSource(record: ConversionRecordItemResponse): UiSource {
  if (record.conversion_type === "batch_text") return "batch";
  if (record.conversion_type === "document_file") return "file";
  return "single";
}

/**
 * 历史记录中的任务状态仅在 batch_text/document_file 详情里提供：
 * processing 映射为 converting，其余状态按已完成展示。
 */
function normalizeStatus(record: ConversionRecordItemResponse): UiStatus {
  const status =
    record.conversion_type === "batch_text"
      ? record.batch_text?.status
      : record.conversion_type === "document_file"
        ? record.document_file?.status
        : undefined;

  return status === "processing" ? "converting" : "done";
}

/**
 * 优先按任务级 ID 分组，缺失时回退到 conversion_record_id，避免错误折叠。
 */
function resolveBatchId(record: ConversionRecordItemResponse): string {
  if (record.conversion_type === "batch_text" && record.batch_text?.id) {
    return `batch-text-${record.batch_text.id}`;
  }
  if (record.conversion_type === "document_file" && record.document_file?.id) {
    return `document-file-${record.document_file.id}`;
  }
  return `record-${record.id}`;
}

/**
 * 统一抽取历史记录在 UI 里需要展示的核心字段。
 * 最新 conversions 接口对单链和任务型记录采用不同结构：
 * - single_link：短链信息放在 single_link 详情里
 * - batch_text / document_file：列表返回任务详情，不再返回逐条短链字段
 */
function resolveDisplayFields(record: ConversionRecordItemResponse): {
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  proxyMode: ProxyMode;
  taskId?: number;
  convertedText?: string;
  fileName?: string;
  totalVisitCount?: number;
} {
  if (record.conversion_type === "batch_text" && record.batch_text) {
    return {
      originalUrl: record.batch_text.source_text || `批量任务 #${record.batch_text.id}`,
      shortCode: "",
      shortUrl: "",
      proxyMode: normalizeProxyMode(record.batch_text.response_mode),
      taskId: record.batch_text.id,
      convertedText: record.batch_text.converted_text,
      totalVisitCount: record.batch_text.total_visit_count,
    };
  }

  if (record.conversion_type === "document_file" && record.document_file) {
    return {
      originalUrl:
        record.document_file.uploaded_file?.file_name ||
        `文件任务 #${record.document_file.id}`,
      shortCode: "",
      shortUrl: "",
      proxyMode: normalizeProxyMode(record.document_file.response_mode),
      taskId: record.document_file.id,
      fileName: record.document_file.uploaded_file?.file_name,
      totalVisitCount: record.document_file.total_visit_count,
    };
  }

  return {
    originalUrl: record.single_link?.original_url || "",
    shortCode: record.single_link?.code || "",
    shortUrl: record.single_link?.code ? record.single_link.code : "",
    proxyMode: normalizeProxyMode(record.single_link?.response_mode),
    totalVisitCount: record.single_link?.visit_count,
  };
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
 * - 最新 conversions 接口使用 id 作为转换记录主键
 * - 单链记录的短链信息位于 single_link；批量/文件记录仅返回任务级详情
 * - batchId 统一由任务 ID 或记录 ID 派生，供前端表格分组使用
 * 
 * @param apiResp API 历史记录项
 * @returns 前端 ShortLink
 */
export function mapConversionRecordToShortLink(
  apiResp: ConversionRecordItemResponse
): ShortLink {
  const source = normalizeSource(apiResp);
  const status = normalizeStatus(apiResp);
  const batchId = resolveBatchId(apiResp);
  const displayFields = resolveDisplayFields(apiResp);
  const recognizedLinkCount =
    apiResp.batch_text?.recognized_link_count ??
    apiResp.document_file?.recognized_link_count;

  return {
    id: String(apiResp.id),
    originalUrl: displayFields.originalUrl,
    shortCode: displayFields.shortCode,
    shortUrl: displayFields.shortUrl,
    createdAt: parseTimestamp(apiResp.created_at),
    updatedAt: parseTimestamp(apiResp.updated_at),
    source,
    visits: [],
    batchId,
    recognizedLinkCount,
    totalVisitCount: displayFields.totalVisitCount,
    taskId: displayFields.taskId,
    convertedText: displayFields.convertedText,
    fileName: displayFields.fileName,
    status,
    proxyMode: displayFields.proxyMode,
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
