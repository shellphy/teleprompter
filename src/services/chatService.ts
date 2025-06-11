import { pyInvoke, Channel } from "tauri-plugin-pytauri-api";

export type ChatType = 'balanced' | 'topic' | 'product';

export interface ChatMessage {
  content: string;
  timestamp: number;
}

export class ChatService {
  private currentChannel: Channel<string> | null = null;
  private running = false;
  private timeoutId: NodeJS.Timeout | null = null;
  
  /**
   * 开始AI闲聊
   * @param type 聊天类型
   * @param onMessage 接收消息的回调函数
   * @param onComplete 单次聊天完成的回调函数
   */
  async startChat(
    type: ChatType,
    onMessage: (message: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (this.running) {
      await this.stopChat();
    }
    
    this.running = true;
    await this.performChat(type, onMessage, onComplete);
  }
  
  /**
   * 停止AI闲聊
   */
  async stopChat(): Promise<void> {
    this.running = false;
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.currentChannel) {
      // 清理channel
      this.currentChannel = null;
    }
  }
  
  /**
   * 执行单次聊天
   */
  private async performChat(
    type: ChatType,
    onMessage: (message: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (!this.running) return;
    
    try {
      const channel = new Channel<string>();
      this.currentChannel = channel;
      
      let fullMessage = '';
      
      // 监听消息流
      channel.addJsonListener((msg) => {
        if (!this.running) return;
        
        fullMessage += msg;
        onMessage(fullMessage);
      });
      
      // 调用Python后端
      await pyInvoke("commonChat", {
        channel: channel,
        type: type
      });
      
      // 单次聊天完成
      if (onComplete) {
        onComplete();
      }
      
      // 等待5秒后继续下一轮
      if (this.running) {
        this.timeoutId = setTimeout(() => {
          this.performChat(type, onMessage, onComplete);
        }, 5000);
      }
      
    } catch (error) {
      console.error('聊天服务错误:', error);
      
      // 发生错误时也要继续循环（如果还在运行状态）
      if (this.running) {
        this.timeoutId = setTimeout(() => {
          this.performChat(type, onMessage, onComplete);
        }, 5000);
      }
    }
  }
  
  /**
   * 检查是否正在运行
   */
  isRunning(): boolean {
    return this.running;
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): { isRunning: boolean; hasTimeout: boolean } {
    return {
      isRunning: this.running,
      hasTimeout: this.timeoutId !== null
    };
  }
}

// 导出单例实例
export const chatService = new ChatService(); 