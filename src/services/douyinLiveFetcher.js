import { fetch } from '@tauri-apps/plugin-http';
import WebSocket from '@tauri-apps/plugin-websocket';
import { resolveResource } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';
import md5 from 'js-md5';
import './sign.js';
import ProtobufParser from './protobufParser.js';

/**
 * 抖音直播间数据抓取类
 */
export class DouyinLiveWebFetcher {
  constructor(liveId, options = {}) {
    this.liveId = liveId;
    this.liveUrl = "https://live.douyin.com/";
    this.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    this._ttwid = null;
    this._roomId = null;
    this.ws = null;
    this.heartbeatTimer = null;
    this.protobufParser = new ProtobufParser();
    this.messageCallbacks = new Map();
    this.isConnected = false;
    
    // 配置选项
    this.options = {
      enableChat: true,
      enableGift: true,
      enableLike: true,
      enableMember: true,
      enableSocial: true,
      enableStats: true,
      ...options
    };
  }

  /**
   * 开始抓取
   */
  async start() {
    try {
      console.log(`开始连接直播间: ${this.liveId}`);
      await this._connectWebSocket();
      this.isConnected = true;
      console.log('直播间连接成功');
    } catch (error) {
      console.error('启动失败:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * 停止抓取
   */
  stop() {
    console.log('停止连接直播间');
    this.isConnected = false;
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      this.ws.disconnect();
      this.ws = null;
    }
  }

  /**
   * 添加消息回调
   */
  on(messageType, callback) {
    if (!this.messageCallbacks.has(messageType)) {
      this.messageCallbacks.set(messageType, []);
    }
    this.messageCallbacks.get(messageType).push(callback);
  }

  /**
   * 移除消息回调
   */
  off(messageType, callback) {
    if (this.messageCallbacks.has(messageType)) {
      const callbacks = this.messageCallbacks.get(messageType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 触发消息回调
   */
  _emit(messageType, data) {
    if (this.messageCallbacks.has(messageType)) {
      const callbacks = this.messageCallbacks.get(messageType);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`消息回调错误 (${messageType}):`, error);
        }
      });
    }
  }

  /**
   * 获取ttwid
   */
  async getTtwid() {
    if (this._ttwid) {
      return this._ttwid;
    }

    try {
      const response = await fetch(this.liveUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent
        }
      });

      const cookieHeader = response.headers.get('set-cookie');
      if (cookieHeader) {
        const ttwid = this._parseCookieValue(cookieHeader, 'ttwid');
        if (ttwid) {
          this._ttwid = ttwid;
          return ttwid;
        }
      }
    } catch (error) {
      console.error('获取ttwid错误:', error);
    }
    
    // 如果无法获取，生成一个默认值
    this._ttwid = this._generateDefaultTtwid();
    return this._ttwid;
  }

  /**
   * 获取房间ID
   */
  async getRoomId() {
    if (this._roomId) {
      return this._roomId;
    }

    const url = this.liveUrl + this.liveId;
    const ttwid = await this.getTtwid();
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Cookie': `ttwid=${ttwid}; msToken=${this._generateMsToken()}`
        }
      });

      const text = await response.text();
      const match = text.match(/roomId\\":\\"(\d+)\\"/);
      
      if (match && match[1]) {
        this._roomId = match[1];
        return this._roomId;
      } else {
        throw new Error('无法找到roomId');
      }
    } catch (error) {
      console.error('获取roomId错误:', error);
      throw error;
    }
  }

  /**
   * 获取直播间状态
   */
  async getRoomStatus() {
    const roomId = await this.getRoomId();
    const ttwid = await this.getTtwid();
    
    const url = `https://live.douyin.com/webcast/room/web/enter/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=web_live&cookie_enabled=true&screen_width=1536&screen_height=864&browser_language=zh-CN&browser_platform=Win32&browser_name=Edge&browser_version=133.0.0.0&web_rid=${this.liveId}&room_id_str=${roomId}&enter_source=&is_need_double_stream=false&insert_task_id=&live_reason=&msToken=&a_bogus=`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Cookie': `ttwid=${ttwid}`
        }
      });

      const data = await response.json();
      if (data.data) {
        const roomStatus = data.data.room_status;
        const user = data.data.user;
        const userId = user?.id_str;
        const nickname = user?.nickname;
        
        console.log(`【${nickname}】[${userId}]直播间：${roomStatus === 0 ? '正在直播' : '已结束'}`);
        return roomStatus;
      }
    } catch (error) {
      console.error('获取直播间状态错误:', error);
    }
    
    return null;
  }

  /**
   * 连接WebSocket
   */
  async _connectWebSocket() {
    const roomId = await this.getRoomId();
    const ttwid = await this.getTtwid();
    
    const wss = `wss://webcast5-ws-web-hl.douyin.com/webcast/im/push/v2/?app_name=douyin_web&version_code=180800&webcast_sdk_version=1.0.14-beta.0&update_version_code=1.0.14-beta.0&compress=gzip&device_platform=web&cookie_enabled=true&screen_width=1536&screen_height=864&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0%20(Windows%20NT%2010.0;%20Win64;%20x64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/126.0.0.0%20Safari/537.36&browser_online=true&tz_name=Asia/Shanghai&cursor=d-1_u-1_fh-7392091211001140287_t-1721106114633_r-1&internal_ext=internal_src:dim|wss_push_room_id:${roomId}|wss_push_did:7319483754668557238|first_req_ms:1721106114541|fetch_time:1721106114633|seq:1|wss_info:0-1721106114633-0-0|wrds_v:7392094459690748497&host=https://live.douyin.com&aid=6383&live_id=1&did_rule=3&endpoint=live_pc&support_wrds=1&user_unique_id=7319483754668557238&im_path=/webcast/im/fetch/&identity=audience&need_persist_msg_count=15&insert_task_id=&live_reason=&room_id=${roomId}&heartbeatDuration=0`;

    const signature = this._generateSignature(wss);
    const finalWss = wss + `&signature=${signature}`;

    try {
      this.ws = await WebSocket.connect(finalWss);
      
      this.ws.addListener((message) => {
        this._wsOnMessage(message);
      });

      console.log('【√】WebSocket连接成功');
      this._sendHeartbeat();
      
    } catch (error) {
      console.error('WebSocket连接错误:', error);
      throw error;
    }
  }

  /**
   * 发送心跳包
   */
  _sendHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      try {
        if (this.ws) {
          // 创建心跳包
          const heartbeat = this._createPushFrame('hb');
          await this.ws.send(heartbeat);
          console.log('【√】发送心跳包');
        }
      } catch (error) {
        console.error('【X】心跳包发送错误:', error);
        this.stop();
      }
    }, 5000);
  }

  /**
   * 处理WebSocket消息
   */
  async _wsOnMessage(message) {
    try {
      // 获取消息数据
      let data;
      if (message.data instanceof ArrayBuffer) {
        data = new Uint8Array(message.data);
      } else if (typeof message.data === 'string') {
        data = new TextEncoder().encode(message.data);
      } else {
        data = message.data;
      }

      // 使用protobuf解析器解析消息
      const parsedResult = await this.protobufParser.parseMessage(data);
      if (parsedResult) {
        await this._handleParsedMessages(parsedResult);
      }
      
    } catch (error) {
      console.error('处理WebSocket消息错误:', error);
    }
  }

  /**
   * 处理解析后的消息
   */
  async _handleParsedMessages(parsedResult) {
    try {
      const { response, messages, needAck, pushFrame } = parsedResult;
      
      // 发送ACK确认
      if (needAck && this.ws) {
        try {
          const ackFrame = this._createAckFrame(pushFrame.logId, response.internalExt);
          await this.ws.send(ackFrame);
        } catch (error) {
          console.warn('发送ACK失败:', error);
        }
      }

      // 处理各种消息类型
      for (const message of messages) {
        await this._handleMessage(message);
      }
      
    } catch (error) {
      console.error('处理解析消息错误:', error);
    }
  }

  /**
   * 处理单个消息
   */
  async _handleMessage(message) {
    try {
      const messageType = message.type;
      
      // 根据配置决定是否处理该类型消息
      if (!this._shouldProcessMessage(messageType)) {
        return;
      }

      // 输出消息到控制台
      this._logMessage(message);
      
      // 触发相应的回调
      this._emit(messageType, message);
      this._emit('message', message); // 通用消息回调
      
    } catch (error) {
      console.error('处理消息错误:', error);
    }
  }

  /**
   * 检查是否应该处理该类型消息
   */
  _shouldProcessMessage(messageType) {
    const typeMap = {
      'chat': 'enableChat',
      'gift': 'enableGift',
      'like': 'enableLike',
      'member': 'enableMember',
      'social': 'enableSocial',
      'room_stats': 'enableStats'
    };
    
    const configKey = typeMap[messageType];
    return configKey ? this.options[configKey] : true;
  }

  /**
   * 输出消息日志
   */
  _logMessage(message) {
    switch (message.type) {
      case 'chat':
        console.log(`【聊天消息】[${message.user.id}]${message.user.nickname}: ${message.content}`);
        break;
      case 'gift':
        console.log(`【礼物消息】${message.user.nickname} 送出了 ${message.gift.name}x${message.gift.count}`);
        break;
      case 'like':
        console.log(`【点赞消息】${message.user.nickname} 点了${message.count}个赞`);
        break;
      case 'member':
        console.log(`【进场消息】${message.user.nickname} 进入了直播间`);
        break;
      case 'social':
        console.log(`【关注消息】${message.user.nickname} 关注了主播`);
        break;
      case 'room_stats':
        console.log(`【统计消息】当前观看人数: ${message.total}`);
        break;
      case 'fansclub':
        console.log(`【粉丝团消息】${message.content}`);
        break;
      case 'control':
        console.log(`【控制消息】状态: ${message.status}`);
        if (message.status === 'ended') {
          console.log('直播间已结束');
          this.stop();
        }
        break;
      default:
        console.log(`【${message.type}消息】`, message);
    }
  }

  /**
   * 生成签名
   */
  _generateSignature(wss) {
    try {
      const params = [
        'live_id', 'aid', 'version_code', 'webcast_sdk_version',
        'room_id', 'sub_room_id', 'sub_channel_id', 'did_rule',
        'user_unique_id', 'device_platform', 'device_type', 'ac',
        'identity'
      ];

      const urlParams = new URLSearchParams(wss.split('?')[1]);
      const paramValues = params.map(p => `${p}=${urlParams.get(p) || ''}`);
      const paramStr = paramValues.join(',');
      
      const md5Hash = md5(paramStr);
      
      // 调用sign.js中的get_sign函数
      if (typeof get_sign === 'function') {
        return get_sign(md5Hash);
      } else {
        console.warn('签名函数不可用，使用默认签名');
        return 'default_signature';
      }
    } catch (error) {
      console.error('生成签名错误:', error);
      return 'error_signature';
    }
  }

  /**
   * 生成msToken
   */
  _generateMsToken(length = 107) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成默认ttwid
   */
  _generateDefaultTtwid() {
    return '1|' + Date.now() + '|' + Math.random().toString(36).substring(2);
  }

  /**
   * 解析Cookie值
   */
  _parseCookieValue(cookieHeader, name) {
    const regex = new RegExp(`${name}=([^;]+)`);
    const match = cookieHeader.match(regex);
    return match ? match[1] : null;
  }

  /**
   * 创建PushFrame
   */
  _createPushFrame(payloadType, payload = null, logId = null) {
    // 简化的PushFrame创建
    // 在实际应用中，您需要根据proto定义创建正确的二进制数据
    const frame = {
      payloadType: payloadType,
      payload: payload,
      logId: logId || Date.now()
    };
    
    // 转换为二进制数据
    return new Uint8Array(JSON.stringify(frame).split('').map(c => c.charCodeAt(0)));
  }
}

export default DouyinLiveWebFetcher; 