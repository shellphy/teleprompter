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