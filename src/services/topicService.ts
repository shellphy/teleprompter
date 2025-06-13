import { pyInvoke } from "tauri-plugin-pytauri-api";

/**
 * 话题数据类型定义
 */
export interface Topic {
  id: number;
  name: string;
  enabled: boolean;
}

export interface Block {
  id: number;
  name: string;
}

/**
 * 话题相关的API服务
 */
export class TopicService {
  
  /**
   * 获取我的话题列表
   */
  static async getTopicList(): Promise<Topic[]> {
    try {
      const response = await pyInvoke<Topic[]>("getTopicList", {});
      return response;
    } catch (error) {
      console.error('获取话题列表失败:', error);
      throw new Error('获取话题列表时发生错误');
    }
  }

  /**
   * 添加话题
   */
  static async addTopic(name: string): Promise<Topic> {
    try {
      const response = await pyInvoke<Topic>("addTopic", {
        name
      });
      return response;
    } catch (error) {
      console.error('添加话题失败:', error);
      throw new Error('添加话题时发生错误');
    }
  }

  /**
   * 移除话题
   */
  static async removeTopic(topicId: number): Promise<boolean> {
    try {
      const response = await pyInvoke<boolean>("removeTopic", {
        topicId
      });
      return response;
    } catch (error) {
      console.error('移除话题失败:', error);
      throw new Error('移除话题时发生错误');
    }
  }

  /**
   * 启用话题
   */
  static async enableTopic(topicId: number): Promise<boolean> {
    try {
      const response = await pyInvoke<boolean>("enableTopic", {
        topicId
      });
      return response;
    } catch (error) {
      console.error('启用话题失败:', error);
      throw new Error('启用话题时发生错误');
    }
  }

  /**
   * 禁用话题
   */
  static async disableTopic(topicId: number): Promise<boolean> {
    try {
      const response = await pyInvoke<boolean>("disableTopic", {
        topicId
      });
      return response;
    } catch (error) {
      console.error('禁用话题失败:', error);
      throw new Error('禁用话题时发生错误');
    }
  }

  /**
   * 更新话题
   */
  static async updateTopic(topicId: number, name: string): Promise<boolean> {
    try {
      const response = await pyInvoke<boolean>("updateTopic", {
        topicId,
        name
      });
      return response;
    } catch (error) {
      console.error('更新话题失败:', error);
      throw new Error('更新话题时发生错误');
    }
  }

  /**
   * 通过AI生成热门话题
   */
  static async generateHotTopicByAI(): Promise<string[]> {
    try {
      const response = await pyInvoke<string[]>("generateHotTopicByAI", {});
      return response;
    } catch (error) {
      console.error('AI生成热门话题失败:', error);
      throw new Error('AI生成热门话题时发生错误');
    }
  }

  /**
   * 获取屏蔽话题列表
   */
  static async getBlocksList(): Promise<Block[]> {
    try {
      const response = await pyInvoke<Block[]>("getBlocksList", {});
      return response;
    } catch (error) {
      console.error('获取屏蔽话题列表失败:', error);
      throw new Error('获取屏蔽话题列表时发生错误');
    }
  }

  /**
   * 添加屏蔽话题
   */
  static async addBlock(name: string): Promise<Block> {
    try {
      const response = await pyInvoke<Block>("addBlock", {
        name
      });
      return response;
    } catch (error) {
      console.error('添加屏蔽话题失败:', error);
      throw new Error('添加屏蔽话题时发生错误');
    }
  }

  /**
   * 移除屏蔽话题
   */
  static async removeBlock(name: string): Promise<boolean> {
    try {
      const response = await pyInvoke<boolean>("removeBlock", {
        name
      });
      return response;
    } catch (error) {
      console.error('移除屏蔽话题失败:', error);
      throw new Error('移除屏蔽话题时发生错误');
    }
  }
}

// 导出默认实例
export default TopicService; 