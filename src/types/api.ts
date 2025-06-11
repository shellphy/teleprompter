/**
 * API响应的基础接口
 */
export interface BaseResponse {
  success: boolean;
  message?: string;
}

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
}

/**
 * 成功响应接口
 */
export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * 通用API响应类型
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * MiniMax相关的API类型
 */
export namespace MiniMaxApi {
  export interface TestApiKeyRequest {
    apiKey: string;
  }

  export interface TestApiKeyResponse {
    success: boolean;
    failureReason: string | null;
  }

  export interface GetApiKeyResponse {
    apiKey: string;
  }

  export interface SetApiKeyRequest {
    apiKey: string;
  }

  export interface SetApiKeyResponse {
    // 空响应对象
  }
}

/**
 * 配置管理相关类型
 */
export namespace SettingApi {
  export interface CloudConfig {
    apiKey: string;
  }

  export interface ValidationResult {
    success: boolean;
    message: string;
  }
} 