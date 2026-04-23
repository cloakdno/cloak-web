/**
 * api/health.ts
 * 健康检查接口封装。
 * 对应后端：GET /health
 */

import type { ApiClient } from "./client";

/** GET /health 响应：{ "status": "ok" } */
export type HealthResponse = Record<string, string>;

/**
 * 健康检查。
 * 该接口不需要 BasicAuth，但 ApiClient 仍会注入，服务端会忽略多余的 Authorization。
 *
 * @returns 包含服务状态的键值对，通常为 { status: "ok" }
 */
export async function checkHealth(client: ApiClient): Promise<HealthResponse> {
  return client.get<HealthResponse>("/health");
}
