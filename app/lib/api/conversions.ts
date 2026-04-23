/**
 * api/conversions.ts
 * 历史转换记录接口封装。
 * 对应后端接口：
 *   GET /api/conversions        - 分页查询转换记录
 *   GET /api/conversions/search - 按关键词分页搜索转换记录
 *
 * 全部接口均需要 BasicAuth（由 ApiClient 自动注入）。
 */

import type { ApiClient } from "./client";
import type {
  ConversionPageParams,
  ConversionSearchParams,
  ConversionPageResponse,
} from "./types";

/**
 * 分页查询历史转换记录。
 * 按创建时间倒序返回，支持 page/size 分页参数。
 * 不传分页参数时使用服务端默认值（通常 page=1, size=20）。
 *
 * @param params 可选的分页参数 { page, size }
 * @returns 分页结果，包含记录列表及前/后页信息
 */
export async function listConversions(
  client: ApiClient,
  params?: ConversionPageParams
): Promise<ConversionPageResponse> {
  return client.getWithParams<ConversionPageResponse>("/api/conversions", {
    page: params?.page,
    size: params?.size,
  });
}

/**
 * 按关键词搜索转换记录。
 * 关键词匹配原始链接或短链 URL，支持分页。
 * keyword 为空时与 listConversions 行为相同。
 *
 * @param params 搜索参数 { keyword, page, size }
 * @returns 分页结果，包含命中记录列表及前/后页信息
 */
export async function searchConversions(
  client: ApiClient,
  params?: ConversionSearchParams
): Promise<ConversionPageResponse> {
  return client.getWithParams<ConversionPageResponse>("/api/conversions/search", {
    keyword: params?.keyword,
    page: params?.page,
    size: params?.size,
  });
}
