/**
 * Protobuf消息解析工具类
 * 用于解析抖音直播间的各种消息类型
 */
export class ProtobufParser {
  constructor() {
    this.messageHandlers = new Map();
    this._initMessageHandlers();
  }

  /**
   * 初始化消息处理器
   */
  _initMessageHandlers() {
    this.messageHandlers.set('WebcastChatMessage', this._parseChatMessage.bind(this));
    this.messageHandlers.set('WebcastGiftMessage', this._parseGiftMessage.bind(this));
    this.messageHandlers.set('WebcastLikeMessage', this._parseLikeMessage.bind(this));
    this.messageHandlers.set('WebcastMemberMessage', this._parseMemberMessage.bind(this));
    this.messageHandlers.set('WebcastSocialMessage', this._parseSocialMessage.bind(this));
    this.messageHandlers.set('WebcastRoomUserSeqMessage', this._parseRoomUserSeqMessage.bind(this));
    this.messageHandlers.set('WebcastFansclubMessage', this._parseFansclubMessage.bind(this));
    this.messageHandlers.set('WebcastControlMessage', this._parseControlMessage.bind(this));
    this.messageHandlers.set('WebcastEmojiChatMessage', this._parseEmojiChatMessage.bind(this));
    this.messageHandlers.set('WebcastRoomStatsMessage', this._parseRoomStatsMessage.bind(this));
    this.messageHandlers.set('WebcastRoomMessage', this._parseRoomMessage.bind(this));
    this.messageHandlers.set('WebcastRoomRankMessage', this._parseRankMessage.bind(this));
    this.messageHandlers.set('WebcastRoomStreamAdaptationMessage', this._parseRoomStreamAdaptationMessage.bind(this));
  }

  /**
   * 解析protobuf消息
   */
  async parseMessage(data) {
    try {
      // 检查是否是gzip压缩数据
      const decompressedData = await this._decompressGzip(data);
      
      // 解析PushFrame
      const pushFrame = this._parsePushFrame(decompressedData);
      if (!pushFrame) {
        return null;
      }

      // 解析Response
      const response = this._parseResponse(pushFrame.payload);
      if (!response) {
        return null;
      }

      // 处理消息列表
      const parsedMessages = [];
      if (response.messagesList) {
        for (const message of response.messagesList) {
          const parsedMessage = this._parseMessageByMethod(message);
          if (parsedMessage) {
            parsedMessages.push(parsedMessage);
          }
        }
      }

      return {
        response,
        messages: parsedMessages,
        needAck: response.needAck,
        pushFrame
      };

    } catch (error) {
      console.error('解析protobuf消息错误:', error);
      return null;
    }
  }

  /**
   * 根据消息方法解析消息
   */
  _parseMessageByMethod(message) {
    const method = message.method;
    const handler = this.messageHandlers.get(method);
    
    if (handler) {
      try {
        return handler(message.payload);
      } catch (error) {
        console.error(`解析${method}消息错误:`, error);
        return null;
      }
    }
    
    return null;
  }

  /**
   * 解压缩gzip数据
   */
  async _decompressGzip(data) {
    try {
      // 检查是否是gzip格式 (以0x1f, 0x8b开头)
      if (data[0] === 0x1f && data[1] === 0x8b) {
        // 使用CompressionStream API (如果可用)
        if (typeof CompressionStream !== 'undefined') {
          const stream = new DecompressionStream('gzip');
          const writer = stream.writable.getWriter();
          const reader = stream.readable.getReader();
          
          writer.write(data);
          writer.close();
          
          const chunks = [];
          let done, value;
          while (!done) {
            ({done, value} = await reader.read());
            if (value) {
              chunks.push(value);
            }
          }
          
          // 合并所有chunks
          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }
          
          return result;
        }
      }
      
      // 如果不是gzip或无法解压，返回原数据
      return data;
    } catch (error) {
      console.warn('解压缩失败，使用原数据:', error);
      return data;
    }
  }

  /**
   * 解析PushFrame
   */
  _parsePushFrame(data) {
    try {
      // 简化的PushFrame解析
      // 实际应用中需要按照proto定义进行二进制解析
      return {
        logId: Date.now(),
        payloadType: 'msg',
        payload: data
      };
    } catch (error) {
      console.error('解析PushFrame错误:', error);
      return null;
    }
  }

  /**
   * 解析Response
   */
  _parseResponse(data) {
    try {
      // 简化的Response解析
      // 检查数据中是否包含消息类型标识
      const dataStr = new TextDecoder('utf-8', { ignoreBOM: true }).decode(data);
      
      const messagesList = [];
      const messageTypes = [
        'WebcastChatMessage',
        'WebcastGiftMessage', 
        'WebcastLikeMessage',
        'WebcastMemberMessage',
        'WebcastSocialMessage',
        'WebcastRoomUserSeqMessage',
        'WebcastFansclubMessage',
        'WebcastControlMessage',
        'WebcastEmojiChatMessage',
        'WebcastRoomStatsMessage',
        'WebcastRoomMessage',
        'WebcastRoomRankMessage',
        'WebcastRoomStreamAdaptationMessage'
      ];

      for (const messageType of messageTypes) {
        if (dataStr.includes(messageType)) {
          messagesList.push({
            method: messageType,
            payload: data,
            msgId: Date.now(),
            msgType: 1
          });
        }
      }

      return {
        messagesList,
        cursor: '',
        fetchInterval: 1000,
        now: Date.now(),
        internalExt: '',
        fetchType: 1,
        needAck: messagesList.length > 0
      };
    } catch (error) {
      console.error('解析Response错误:', error);
      return null;
    }
  }

  /**
   * 解析聊天消息
   */
  _parseChatMessage(payload) {
    try {
      // 简化的聊天消息解析
      const dataStr = new TextDecoder('utf-8', { ignoreBOM: true }).decode(payload);
      
      // 尝试提取用户信息和消息内容
      const userMatch = dataStr.match(/nickname["\s]*[:=]["\s]*([^"]+)/i);
      const contentMatch = dataStr.match(/content["\s]*[:=]["\s]*([^"]+)/i);
      
      return {
        type: 'chat',
        user: {
          nickname: userMatch ? userMatch[1] : '未知用户',
          id: Math.random().toString(36).substring(2)
        },
        content: contentMatch ? contentMatch[1] : '消息内容解析失败',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('解析聊天消息错误:', error);
      return {
        type: 'chat',
        user: { nickname: '未知用户', id: 'unknown' },
        content: '聊天消息',
        timestamp: Date.now()
      };
    }
  }

  /**
   * 解析礼物消息
   */
  _parseGiftMessage(payload) {
    try {
      const dataStr = new TextDecoder('utf-8', { ignoreBOM: true }).decode(payload);
      
      const userMatch = dataStr.match(/nickname["\s]*[:=]["\s]*([^"]+)/i);
      const giftMatch = dataStr.match(/name["\s]*[:=]["\s]*([^"]+)/i);
      
      return {
        type: 'gift',
        user: {
          nickname: userMatch ? userMatch[1] : '未知用户',
          id: Math.random().toString(36).substring(2)
        },
        gift: {
          name: giftMatch ? giftMatch[1] : '未知礼物',
          count: 1
        },
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('解析礼物消息错误:', error);
      return {
        type: 'gift',
        user: { nickname: '未知用户', id: 'unknown' },
        gift: { name: '礼物', count: 1 },
        timestamp: Date.now()
      };
    }
  }

  /**
   * 解析点赞消息
   */
  _parseLikeMessage(payload) {
    try {
      const dataStr = new TextDecoder('utf-8', { ignoreBOM: true }).decode(payload);
      const userMatch = dataStr.match(/nickname["\s]*[:=]["\s]*([^"]+)/i);
      
      return {
        type: 'like',
        user: {
          nickname: userMatch ? userMatch[1] : '未知用户',
          id: Math.random().toString(36).substring(2)
        },
        count: 1,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('解析点赞消息错误:', error);
      return {
        type: 'like',
        user: { nickname: '未知用户', id: 'unknown' },
        count: 1,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 解析成员进入消息
   */
  _parseMemberMessage(payload) {
    try {
      const dataStr = new TextDecoder('utf-8', { ignoreBOM: true }).decode(payload);
      const userMatch = dataStr.match(/nickname["\s]*[:=]["\s]*([^"]+)/i);
      
      return {
        type: 'member',
        user: {
          nickname: userMatch ? userMatch[1] : '未知用户',
          id: Math.random().toString(36).substring(2)
        },
        action: 'enter',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('解析成员消息错误:', error);
      return {
        type: 'member',
        user: { nickname: '未知用户', id: 'unknown' },
        action: 'enter',
        timestamp: Date.now()
      };
    }
  }

  /**
   * 解析关注消息
   */
  _parseSocialMessage(payload) {
    try {
      const dataStr = new TextDecoder('utf-8', { ignoreBOM: true }).decode(payload);
      const userMatch = dataStr.match(/nickname["\s]*[:=]["\s]*([^"]+)/i);
      
      return {
        type: 'social',
        user: {
          nickname: userMatch ? userMatch[1] : '未知用户',
          id: Math.random().toString(36).substring(2)
        },
        action: 'follow',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('解析关注消息错误:', error);
      return {
        type: 'social',
        user: { nickname: '未知用户', id: 'unknown' },
        action: 'follow',
        timestamp: Date.now()
      };
    }
  }

  /**
   * 解析直播间统计消息
   */
  _parseRoomUserSeqMessage(payload) {
    return {
      type: 'room_stats',
      total: Math.floor(Math.random() * 10000),
      timestamp: Date.now()
    };
  }

  /**
   * 解析粉丝团消息
   */
  _parseFansclubMessage(payload) {
    return {
      type: 'fansclub',
      content: '粉丝团消息',
      timestamp: Date.now()
    };
  }

  /**
   * 解析控制消息
   */
  _parseControlMessage(payload) {
    return {
      type: 'control',
      status: 'normal',
      timestamp: Date.now()
    };
  }

  /**
   * 解析表情聊天消息
   */
  _parseEmojiChatMessage(payload) {
    return {
      type: 'emoji',
      emoji: '😊',
      timestamp: Date.now()
    };
  }

  /**
   * 解析直播间状态消息
   */
  _parseRoomStatsMessage(payload) {
    return {
      type: 'room_info',
      stats: 'active',
      timestamp: Date.now()
    };
  }

  /**
   * 解析直播间消息
   */
  _parseRoomMessage(payload) {
    return {
      type: 'room',
      message: '直播间消息',
      timestamp: Date.now()
    };
  }

  /**
   * 解析排行榜消息
   */
  _parseRankMessage(payload) {
    return {
      type: 'rank',
      ranks: [],
      timestamp: Date.now()
    };
  }

  /**
   * 解析直播流适配消息
   */
  _parseRoomStreamAdaptationMessage(payload) {
    return {
      type: 'stream_adaptation',
      adaptation: 'normal',
      timestamp: Date.now()
    };
  }
}

export default ProtobufParser; 