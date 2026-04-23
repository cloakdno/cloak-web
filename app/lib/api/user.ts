/**
 * api/user.ts
 * 用户相关接口封装。
 * 对应后端接口：
 *   GET  /api/user/profile          - 获取当前用户资料
 *   POST /api/user/update-username  - 修改当前用户名
 *   POST /api/user/update-password  - 修改当前用户密码
 *
 * 全部接口均需要 BasicAuth（由 ApiClient 自动注入）。
 */

import type { ApiClient } from "./client";
import type {
  UserProfileResponse,
  UpdateUsernameRequest,
  UpdateUsernameResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
} from "./types";

/**
 * 获取当前登录用户的资料信息。
 * BasicAuth 鉴权身份即为查询目标用户。
 *
 * @returns 用户资料，包含 id、用户名、注册天数、链接总数等
 */
export async function getUserProfile(
  client: ApiClient
): Promise<UserProfileResponse> {
  return client.get<UserProfileResponse>("/api/user/profile");
}

/**
 * 修改当前用户名。
 * 若新用户名已被占用，后端将返回 409 Conflict，ApiClient 会抛出 ApiError。
 *
 * @param req 包含新用户名的请求体
 * @returns 修改成功后的完整用户资料
 */
export async function updateUsername(
  client: ApiClient,
  req: UpdateUsernameRequest
): Promise<UpdateUsernameResponse> {
  return client.post<UpdateUsernameResponse>("/api/user/update-username", req);
}

/**
 * 修改当前用户密码。
 * 旧密码错误时后端返回 400 Bad Request。
 *
 * @param req 包含旧密码和新密码的请求体
 * @returns 包含成功消息的响应
 */
export async function updatePassword(
  client: ApiClient,
  req: UpdatePasswordRequest
): Promise<UpdatePasswordResponse> {
  return client.post<UpdatePasswordResponse>("/api/user/update-password", req);
}
