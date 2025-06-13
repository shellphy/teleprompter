import {pyInvoke} from "tauri-plugin-pytauri-api";

/**
 * 话题数据类型定义
 */
export interface Topic {
  id: number;
  name: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * API响应类型定义
 */
export interface TopicListResponse {
  topics: Topic[];
}

export interface BlockListResponse {
  blocks: Block[];
}

export interface HotTopicsResponse {
  topics: string[];
}

/**
 * 话题相关的API服务
 */
export class TopicService {
  
  /**
   * 获取我的话题列表
   */
  static async getTopicList(): Promise<Topic[]> {
      const response = await pyInvoke<TopicListResponse>("getTopicList", {});
      return response.topics;
  }

  /**
   * 添加话题
   */
  static async addTopic(name: string): Promise<Topic> {
    return await pyInvoke<Topic>("addTopic", {
        name
      });
  }

  /**
   * 移除话题
   */
  static async removeTopic(topicId: number) {
      await pyInvoke<ArrayBuffer>("removeTopic", {
        topicId
      });
  }

  /**
   * 启用话题
   */
  static async enableTopic(topicId: number) {
      await pyInvoke<ArrayBuffer>("enableTopic", {
        topicId
      });
  }

  /**
   * 禁用话题
   */
  static async disableTopic(topicId: number) {
      await pyInvoke<ArrayBuffer>("disableTopic", {
        topicId
      });
      return true; // 如果没有抛出异常，就认为操作成功
  }

  /**
   * 更新话题
   */
  static async updateTopic(topicId: number, name: string) {
      await pyInvoke<ArrayBuffer>("updateTopic", {
        topicId,
        name
      });
  }

  /**
   * 通过AI生成热门话题
   */
  static async generateHotTopicByAI(): Promise<string[]> {
      const response = await pyInvoke<HotTopicsResponse>("generateHotTopicByAI", {});
      return response.topics;
  }

  /**
   * 获取屏蔽话题列表
   */
  static async getBlocksList(): Promise<Block[]> {
      const response = await pyInvoke<BlockListResponse>("getBlocksList", {});
      return response.blocks;
  }

  /**
   * 添加屏蔽话题
   */
  static async addBlock(name: string): Promise<Block> {
    return await pyInvoke<Block>("addBlock", {
        name
      });
  }

  /**
   * 移除屏蔽话题
   */
  static async removeBlock(name: string) {
      await pyInvoke<ArrayBuffer>("removeBlock", {
        name
      });
  }

  /**
   * 更新屏蔽话题
   */
  static async updateBlock(blockId: number, name: string) {
      await pyInvoke<ArrayBuffer>("updateBlock", {
        blockId,
        name
      });
  }
}

// 导出默认实例
export default TopicService; 