import { pyInvoke } from "tauri-plugin-pytauri-api";
import type { MiniMaxApi, SettingApi } from "@/types/api";

/**
 * 设置相关的API服务
 */
export class SettingService {
  
  /**
   * 测试MiniMax API Key的有效性
   * @param apiKey - 要测试的API Key
   * @returns Promise<MiniMaxApi.TestApiKeyResponse>
   */
  static async testMiniMaxApiKey(apiKey: string): Promise<MiniMaxApi.TestApiKeyResponse> {
    try {
      const response = await pyInvoke<MiniMaxApi.TestApiKeyResponse>("testMiniMaxApiKey", {
        apiKey
      });
      return response;
    } catch (error) {
      console.error('测试API Key失败:', error);
      throw new Error('测试API Key时发生网络错误');
    }
  }

  /**
   * 获取已保存的MiniMax API Key
   * @returns Promise<MiniMaxApi.GetApiKeyResponse>
   */
  static async getMiniMaxApiKey(): Promise<MiniMaxApi.GetApiKeyResponse> {
    try {
      const response = await pyInvoke<MiniMaxApi.GetApiKeyResponse>("getMiniMaxApiKey", {});
      return response;
    } catch (error) {
      console.error('获取API Key失败:', error);
      throw new Error('获取API Key时发生错误');
    }
  }

  /**
   * 保存MiniMax API Key
   * @param apiKey - 要保存的API Key
   * @returns Promise<MiniMaxApi.SetApiKeyResponse>
   */
  static async setMiniMaxApiKey(apiKey: string): Promise<MiniMaxApi.SetApiKeyResponse> {
    try {
      const response = await pyInvoke<MiniMaxApi.SetApiKeyResponse>("setMiniMaxApiKey", {
        apiKey
      });
      return response;
    } catch (error) {
      console.error('保存API Key失败:', error);
      throw new Error('保存API Key时发生错误');
    }
  }

  /**
   * 验证并保存MiniMax API Key
   * 这是一个组合方法，会先测试API Key的有效性，然后保存
   * @param apiKey - 要验证并保存的API Key
   * @returns Promise<SettingApi.ValidationResult>
   */
  static async validateAndSaveMiniMaxApiKey(apiKey: string): Promise<SettingApi.ValidationResult> {
    try {
      // 先测试API Key
      const testResult = await this.testMiniMaxApiKey(apiKey);
      
      if (!testResult.success) {
        return {
          success: false,
          message: testResult.failureReason || '未知错误'
        };
      }

      // 如果测试成功，保存API Key
      await this.setMiniMaxApiKey(apiKey);
      
      return {
        success: true,
        message: '配置保存成功'
      };
    } catch (error) {
      console.error('验证并保存API Key失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
}

// 导出默认实例
export default SettingService; 