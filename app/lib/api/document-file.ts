/**
 * api/document-file.ts
 * 文档文件转换任务接口封装。
 * 对应后端接口：
 *   POST   /api/document-file/batch              - 上传文件并提交转换任务（multipart/form-data）
 *   DELETE /api/document-file/{id}              - 删除任务（异步，202）
 *   GET    /api/document-file/{id}/download     - 下载转换结果文件（二进制）
 *   PUT    /api/document-file/{id}/response-mode - 切换全部短链响应模式（异步，202）
 *
 * 全部接口均需要 BasicAuth（由 ApiClient 自动注入）。
 */

import type { ApiClient } from "./client";
import type {
  ResponseMode,
  DocumentFileSubmitResponse,
  DocumentFileUpdateResponseModeRequest,
  DocumentFileUpdateResponseModeResponse,
  MessageResponse,
} from "./types";

/**
 * 上传文本文件并提交文档转换任务。
 * 使用 multipart/form-data 传输，最大文件大小 10MB。
 * 后端识别文件内容中的链接并异步转换为短链。
 *
 * @param file 待转换的文本文件对象（File 或 Blob）
 * @param responseMode 可选的响应模式，不传则使用服务端默认值
 * @returns 提交结果，包含 conversion_id、file_id 和任务状态
 */
export async function submitDocumentFileConvert(
  client: ApiClient,
  file: File | Blob,
  responseMode?: ResponseMode
): Promise<DocumentFileSubmitResponse> {
  const formData = new FormData();
  // 文件字段名与后端约定一致（swagger 中为 "file"）
  formData.append("file", file);
  if (responseMode !== undefined) {
    formData.append("response_mode", responseMode);
  }
  return client.postForm<DocumentFileSubmitResponse>(
    "/api/document-file/batch",
    formData
  );
}

/**
 * 删除文档转换任务。
 * 异步删除任务及其所有关联数据，后端返回 202 Accepted。
 *
 * @param id 任务 ID
 * @returns 包含成功消息的响应
 */
export async function deleteDocumentFile(
  client: ApiClient,
  id: number
): Promise<MessageResponse> {
  return client.delete<MessageResponse>(`/api/document-file/${id}`);
}

/**
 * 下载文档转换结果文件。
 * 后端返回二进制文件流（application/octet-stream），此处返回原始 Response 对象。
 * 调用方可通过 response.blob() 获取文件内容并触发浏览器下载。
 *
 * @param id 任务 ID
 * @returns 原始 fetch Response 对象（2xx 已保证，非 2xx 会抛出 ApiError）
 *
 * @example
 * const resp = await downloadDocumentFile(client, 15);
 * const blob = await resp.blob();
 * const url = URL.createObjectURL(blob);
 * const a = document.createElement("a");
 * a.href = url; a.download = "result.txt"; a.click();
 * URL.revokeObjectURL(url);
 */
export async function downloadDocumentFile(
  client: ApiClient,
  id: number
): Promise<Response> {
  return client.getDownload(`/api/document-file/${id}/download`);
}

/**
 * 切换文档转换任务下全部短链的响应模式。
 * 后端异步处理并返回 202 Accepted。
 *
 * @param id 任务 ID
 * @param req 包含新响应模式的请求体
 * @returns 包含 conversion_id、response_mode 和消息的响应
 */
export async function updateDocumentFileResponseMode(
  client: ApiClient,
  id: number,
  req: DocumentFileUpdateResponseModeRequest
): Promise<DocumentFileUpdateResponseModeResponse> {
  return client.put<DocumentFileUpdateResponseModeResponse>(
    `/api/document-file/${id}/response-mode`,
    req
  );
}
