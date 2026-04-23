/**
 * api/batch-text.ts
 * 批量文本转换任务接口封装。
 * 对应后端接口：
 *   POST   /api/batch-text/batch              - 提交批量文本转换任务
 *   GET    /api/batch-text/{id}              - 查询任务详情
 *   DELETE /api/batch-text/{id}             - 删除任务（异步，202）
 *   GET    /api/batch-text/{id}/download    - 下载转换后的文本文件
 *   PUT    /api/batch-text/{id}/response-mode - 切换全部短链响应模式（异步，202）
 *
 * 全部接口均需要 BasicAuth（由 ApiClient 自动注入）。
 */

import type { ApiClient } from "./client";
import type {
  BatchTextConvertRequest,
  BatchTextSubmitResponse,
  BatchTextDetailResponse,
  BatchTextUpdateResponseModeRequest,
  MessageResponse,
} from "./types";

/**
 * 提交批量文本转换任务。
 * 后端会识别 source_text 中的所有链接并逐一转换为短链，任务异步处理。
 *
 * @param req 包含源文本和可选响应模式的请求体
 * @returns 提交结果，包含 conversion_id 和任务状态
 */
export async function submitBatchTextConvert(
  client: ApiClient,
  req: BatchTextConvertRequest
): Promise<BatchTextSubmitResponse> {
  return client.post<BatchTextSubmitResponse>("/api/batch-text/batch", req);
}

/**
 * 查询批量文本转换任务详情。
 * 返回源文本、转换后文本、识别的链接数、访问总次数和任务状态。
 *
 * @param id 任务 ID（提交时由后端返回）
 * @returns 任务详情
 */
export async function getBatchTextDetail(
  client: ApiClient,
  id: number
): Promise<BatchTextDetailResponse> {
  return client.get<BatchTextDetailResponse>(`/api/batch-text/${id}`);
}

/**
 * 删除批量文本转换任务。
 * 异步删除任务及其所有关联数据，后端返回 202 Accepted。
 * 注意：删除成功后 handleJson 会将 202 视为 ok（非 2xx 范围），内部处理正确。
 *
 * @param id 任务 ID
 * @returns 包含成功消息的响应
 */
export async function deleteBatchText(
  client: ApiClient,
  id: number
): Promise<MessageResponse> {
  return client.delete<MessageResponse>(`/api/batch-text/${id}`);
}

/**
 * 下载批量文本转换结果文件。
 * 后端返回转换后的纯文本内容（text/plain），此处返回原始 Response 对象。
 * 调用方可通过 response.text() 获取文本内容，或 response.blob() 处理下载。
 *
 * @param id 任务 ID
 * @returns 原始 fetch Response 对象（2xx 已保证，非 2xx 会抛出 ApiError）
 */
export async function downloadBatchText(
  client: ApiClient,
  id: number
): Promise<Response> {
  return client.getDownload(`/api/batch-text/${id}/download`);
}

/**
 * 切换批量文本任务下全部短链的响应模式。
 * 后端异步处理并返回 202 Accepted。
 *
 * @param id 任务 ID
 * @param req 包含新响应模式的请求体
 * @returns 包含成功消息的响应
 */
export async function updateBatchTextResponseMode(
  client: ApiClient,
  id: number,
  req: BatchTextUpdateResponseModeRequest
): Promise<MessageResponse> {
  return client.put<MessageResponse>(
    `/api/batch-text/${id}/response-mode`,
    req
  );
}
