/**
 * api/client.ts
 * 核心 HTTP Client 封装。
 *
 * 职责：
 * - 持有 BasicAuth 凭证（username + password），自动在每个请求中注入 Authorization header
 * - 统一封装 GET / POST / PUT / DELETE / 多部分表单（postForm）
 * - 将后端 4xx/5xx 响应解析并抛出 ApiError，供上层业务逻辑统一捕获
 * - baseUrl 优先使用构造参数；服务端读取 API_BASE_URL，客户端读取 NEXT_PUBLIC_API_BASE_URL
 * - 若未配置，默认空字符串（相对路径）
 */

import type { ErrorResponse } from "./types";

// ─────────────────────────────────────────────
// ApiError：包含后端返回的结构化错误信息
// ─────────────────────────────────────────────

export class ApiError extends Error {
  /** HTTP 状态码 */
  readonly status: number;
  /** 后端业务错误码（如 "UNAUTHORIZED"），网络错误时为 "NETWORK_ERROR" */
  readonly code: string;
  /** 后端附加细节，可能为 null */
  readonly details: unknown | null;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details ?? null;
  }
}

// ─────────────────────────────────────────────
// ApiClient：主 HTTP 客户端类
// ─────────────────────────────────────────────

export interface ApiClientOptions {
  username: string;
  password: string;
  /** API 根地址，例如 "https://api.example.com"；不传时读取环境变量或使用相对路径 */
  baseUrl?: string;
}

/**
 * 解析 API 根地址：
 * - 1) 显式传参（优先级最高）
 * - 2) 服务端：API_BASE_URL -> NEXT_PUBLIC_API_BASE_URL
 * - 3) 客户端：NEXT_PUBLIC_API_BASE_URL
 * - 4) 默认空字符串（相对路径）
 */
function resolveApiBaseUrl(baseUrl?: string): string {
  if (typeof baseUrl === "string") {
    return baseUrl;
  }

  if (typeof process === "undefined") {
    return "";
  }

  // 浏览器侧只能读取 NEXT_PUBLIC_ 前缀变量
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  }

  // 服务端可读取私有变量，未配置时回退到 NEXT_PUBLIC_ 变量
  return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
}

export class ApiClient {
  private readonly baseUrl: string;
  /** BasicAuth 凭证的 base64 编码，形如 "dXNlcjpwYXNz" */
  private readonly authHeader: string;

  constructor({ username, password, baseUrl }: ApiClientOptions) {
    // 统一解析 API 根地址（显式传参 > 环境变量 > 相对路径）
    this.baseUrl = resolveApiBaseUrl(baseUrl);

    // 在浏览器环境使用 btoa，Node.js 环境使用 Buffer.from
    const credentials = `${username}:${password}`;
    this.authHeader =
      typeof btoa !== "undefined"
        ? `Basic ${btoa(credentials)}`
        : `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  // ─── 内部工具方法 ─────────────────────────────

  /** 构建完整 URL，处理末尾斜杠 */
  private url(path: string): string {
    const base = this.baseUrl.endsWith("/")
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    return `${base}${path}`;
  }

  /** 构建公共 Headers */
  private headers(extra?: HeadersInit): Headers {
    const h = new Headers(extra);
    h.set("Authorization", this.authHeader);
    return h;
  }

  /**
   * 处理响应：
   * - 2xx：返回解析好的 JSON 对象（泛型 T）
   * - 其他：尝试解析 ErrorResponse 并抛出 ApiError
   * - 下载接口（返回文件流）不经过此方法，直接由调用方处理 Response 对象
   */
  private async handleJson<T>(res: Response): Promise<T> {
    if (res.ok) {
      // 部分接口（如 202）可能返回空 body
      const text = await res.text();
      return text ? (JSON.parse(text) as T) : ({} as T);
    }
    await this.throwApiError(res);
    // 上方 throwApiError 必定抛出，此行仅满足 TypeScript 控制流分析
    throw new Error("unreachable");
  }

  /** 解析后端错误响应体并抛出 ApiError */
  private async throwApiError(res: Response): Promise<never> {
    let errBody: Partial<ErrorResponse> = {};
    try {
      const text = await res.text();
      if (text) {
        errBody = JSON.parse(text) as Partial<ErrorResponse>;
      }
    } catch {
      // body 不是 JSON，忽略解析错误
    }
    throw new ApiError(
      res.status,
      errBody.code ?? `HTTP_${res.status}`,
      errBody.message ?? res.statusText,
      errBody.details
    );
  }

  // ─── 公开 HTTP 方法 ───────────────────────────

  /** GET 请求，自动解析 JSON 响应 */
  async get<T>(path: string): Promise<T> {
    const res = await fetch(this.url(path), {
      method: "GET",
      headers: this.headers({ "Content-Type": "application/json" }),
    });
    return this.handleJson<T>(res);
  }

  /** POST 请求（JSON body），自动解析 JSON 响应 */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.url(path), {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleJson<T>(res);
  }

  /** PUT 请求（JSON body），自动解析 JSON 响应 */
  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.url(path), {
      method: "PUT",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleJson<T>(res);
  }

  /** DELETE 请求，自动解析 JSON 响应 */
  async delete<T>(path: string): Promise<T> {
    const res = await fetch(this.url(path), {
      method: "DELETE",
      headers: this.headers(),
    });
    return this.handleJson<T>(res);
  }

  /**
   * POST 请求（multipart/form-data）。
   * 注意：不手动设置 Content-Type，让 fetch 自动添加 boundary。
   * @returns 自动解析 JSON 响应
   */
  async postForm<T>(path: string, formData: FormData): Promise<T> {
    // 只注入 Authorization，不设置 Content-Type（fetch 自动处理 multipart boundary）
    const h = new Headers();
    h.set("Authorization", this.authHeader);
    const res = await fetch(this.url(path), {
      method: "POST",
      headers: h,
      body: formData,
    });
    return this.handleJson<T>(res);
  }

  /**
   * GET 请求，返回原始 Response 供调用方处理文件下载流。
   * 若响应非 2xx，同样抛出 ApiError。
   */
  async getDownload(path: string): Promise<Response> {
    const res = await fetch(this.url(path), {
      method: "GET",
      headers: this.headers(),
    });
    if (!res.ok) {
      await this.throwApiError(res);
    }
    return res;
  }

  /**
   * GET 请求，携带 URL 查询参数（key-value 对象），自动解析 JSON 响应。
   * undefined 值会自动过滤，不拼入 query string。
   */
  async getWithParams<T>(
    path: string,
    params: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const query = searchParams.toString();
    const fullPath = query ? `${path}?${query}` : path;
    return this.get<T>(fullPath);
  }
}

// ─────────────────────────────────────────────
// 工厂函数：简化 ApiClient 的创建
// ─────────────────────────────────────────────

/**
 * 工厂函数，使用用户名和密码创建 ApiClient 实例。
 * baseUrl 可选，不传时自动读取环境变量：
 * - 服务端：API_BASE_URL（优先）或 NEXT_PUBLIC_API_BASE_URL
 * - 客户端：NEXT_PUBLIC_API_BASE_URL
 *
 * @example
 * const api = createApiClient("admin", "password123");
 * const profile = await api.get<UserProfileResponse>("/api/user/profile");
 */
export function createApiClient(
  username: string,
  password: string,
  baseUrl?: string
): ApiClient {
  return new ApiClient({ username, password, baseUrl });
}
