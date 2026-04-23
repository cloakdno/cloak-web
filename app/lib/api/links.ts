/**
 * api/links.ts
 * 短链管理接口封装。
 * 对应后端接口：
 *   POST   /api/links/convert              - 单链接转换
 *   POST   /api/links/batch               - 批量转换链接
 *   GET    /api/links/{code}              - 查询短链详情
 *   DELETE /api/links/{code}              - 删除短链
 *   PUT    /api/links/{code}/original-url - 修改短链原始链接
 *   PUT    /api/links/{code}/response-mode - 修改短链响应模式
 *
 * 全部接口均需要 BasicAuth（由 ApiClient 自动注入）。
 */

import type { ApiClient } from "./client";
import type {
  ConvertSingleLinkRequest,
  SingleLinkConvertResponse,
  BatchHideRequest,
  BatchHideResponse,
  LinkDetailResponse,
  MessageResponse,
  UpdateOriginalURLRequest,
  LinkOriginalURLUpdateResponse,
  UpdateResponseModeRequest,
  LinkResponseModeUpdateResponse,
} from "./types";

/**
 * 单链接转换。
 * 传入原始 URL，返回对应短链信息及转换记录 ID。
 * 若同一原始链接已转换过，后端可能返回已有短链（created: false）。
 *
 * @param req 包含原始 URL 和可选响应模式的请求体
 * @returns 转换结果，包含短码、短链 URL、是否新建等信息
 */
export async function convertSingleLink(
  client: ApiClient,
  req: ConvertSingleLinkRequest
): Promise<SingleLinkConvertResponse> {
  return client.post<SingleLinkConvertResponse>("/api/links/convert", req);
}

/**
 * 批量转换链接。
 * 一次性传入多个原始 URL，后端逐一转换并返回每条的结果。
 * 单条转换失败不影响其他条（失败项 fail_cause 非空）。
 *
 * @param req 包含 URL 列表和可选响应模式的请求体
 * @returns 批量转换结果列表
 */
export async function batchConvertLinks(
  client: ApiClient,
  req: BatchHideRequest
): Promise<BatchHideResponse> {
  return client.post<BatchHideResponse>("/api/links/batch", req);
}

/**
 * 查询短链详情。
 * 根据短码查询对应短链的详细信息，包含访问次数。
 *
 * @param code 短链短码（6 位字母数字）
 * @returns 短链详情
 */
export async function getLinkDetail(
  client: ApiClient,
  code: string
): Promise<LinkDetailResponse> {
  return client.get<LinkDetailResponse>(`/api/links/${encodeURIComponent(code)}`);
}

/**
 * 删除短链。
 * 根据短码删除对应的短链记录，操作不可撤销。
 *
 * @param code 短链短码
 * @returns 包含成功消息的响应
 */
export async function deleteLink(
  client: ApiClient,
  code: string
): Promise<MessageResponse> {
  return client.delete<MessageResponse>(`/api/links/${encodeURIComponent(code)}`);
}

/**
 * 修改短链原始链接。
 * 更新短码对应的原始 URL，不改变短码本身。
 *
 * @param code 短链短码
 * @param req 包含新原始 URL 的请求体
 * @returns 更新后的短码、新原始链接和更新时间
 */
export async function updateLinkOriginalUrl(
  client: ApiClient,
  code: string,
  req: UpdateOriginalURLRequest
): Promise<LinkOriginalURLUpdateResponse> {
  return client.put<LinkOriginalURLUpdateResponse>(
    `/api/links/${encodeURIComponent(code)}/original-url`,
    req
  );
}

/**
 * 修改短链响应模式。
 * 将指定短链切换为 redirect（302 重定向）或 proxy（服务端代理）模式。
 *
 * @param code 短链短码
 * @param req 包含新响应模式的请求体
 * @returns 更新后的短码、原始链接、响应模式和更新时间
 */
export async function updateLinkResponseMode(
  client: ApiClient,
  code: string,
  req: UpdateResponseModeRequest
): Promise<LinkResponseModeUpdateResponse> {
  return client.put<LinkResponseModeUpdateResponse>(
    `/api/links/${encodeURIComponent(code)}/response-mode`,
    req
  );
}
