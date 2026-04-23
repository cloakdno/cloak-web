/**
 * api/system.ts
 * 系统信息接口封装。
 * 对应后端：GET /api/system/expiry
 */

import type { ApiClient } from "./client";
import type { SystemExpiryResponse } from "./types";

/**
 * 查询服务过期信息。
 * 该接口不需要 BasicAuth。
 *
 * @returns 服务过期状态，包含是否过期、剩余时间等信息
 */
export async function getSystemExpiry(
  client: ApiClient
): Promise<SystemExpiryResponse> {
  return client.get<SystemExpiryResponse>("/api/system/expiry");
}
