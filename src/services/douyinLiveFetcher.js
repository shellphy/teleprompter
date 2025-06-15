import {fetch} from '@tauri-apps/plugin-http';
import WebSocket from '@tauri-apps/plugin-websocket';
import {resolveResource} from '@tauri-apps/api/path';
import {readTextFile} from '@tauri-apps/plugin-fs';
import protobuf from 'protobufjs';
import md5 from 'js-md5';
import pako from 'pako';

function generateMsToken(length = 107) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=_';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function generateSignature(wss) {
    try {
        // 按照Python版本的签名生成逻辑
        const params = [
            'live_id', 'aid', 'version_code', 'webcast_sdk_version',
            'room_id', 'sub_room_id', 'sub_channel_id', 'did_rule',
            'user_unique_id', 'device_platform', 'device_type', 'ac',
            'identity'
        ];

        const url = new URL(wss);
        const wssParams = new URLSearchParams(url.search);
        const wssMap = {};

        wssParams.forEach((value, key) => {
            wssMap[key] = value;
        });

        const tplParams = params.map(param => `${param}=${wssMap[param] || ''}`);
        const paramStr = tplParams.join(',');
        const md5Param = md5(paramStr);

        try {
            const { get_sign } = await import('./sign.js');
            const signature = get_sign(md5Param);
            return signature;
        } catch (signError) {
            console.warn('sign.js调用失败，使用备用签名:', signError);
            // 备用签名方案
            return md5(paramStr + Date.now());
        }
    } catch (error) {
        console.error('生成签名失败:', error);
        return '';
    }
}

function decompressGzip(data) {
    try {
        return pako.inflate(data);
    } catch (error) {
        console.error('gzip解压失败:', error);
        console.log('解压失败，返回原始数据');
        return data;
    }
}

/**
 * 抖音直播间数据抓取器
 */
export class DouyinLiveFetcher {
    constructor(liveId) {
        this.liveId = liveId;
        this.liveUrl = 'https://live.douyin.com/';
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this._ttwid = null;
        this._roomId = null;
        this.ws = null;
        this.root = null;
        
        // 消息解析器映射
        this.messageHandlers = {
            'WebcastChatMessage': this._parseChatMsg.bind(this),
            'WebcastGiftMessage': this._parseGiftMsg.bind(this),
            'WebcastLikeMessage': this._parseLikeMsg.bind(this),
            'WebcastMemberMessage': this._parseMemberMsg.bind(this),
            'WebcastSocialMessage': this._parseSocialMsg.bind(this),
            'WebcastRoomUserSeqMessage': this._parseRoomUserSeqMsg.bind(this),
            'WebcastFansclubMessage': this._parseFansclubMsg.bind(this),
            'WebcastControlMessage': this._parseControlMsg.bind(this),
            'WebcastEmojiChatMessage': this._parseEmojiChatMsg.bind(this),
            'WebcastRoomStatsMessage': this._parseRoomStatsMsg.bind(this),
            'WebcastRoomMessage': this._parseRoomMsg.bind(this),
            'WebcastRoomRankMessage': this._parseRankMsg.bind(this),
            'WebcastRoomStreamAdaptationMessage': this._parseRoomStreamAdaptationMsg.bind(this)
        };
    }

    /**
     * 初始化protobuf
     */
    async init() {
        try {
            const resourcePath = await resolveResource('assets/douyin.proto');
            const protoContent = await readTextFile(resourcePath);
            this.root = protobuf.parse(protoContent).root;
        } catch (error) {
            console.error('Protobuf 初始化失败:', error);
            throw error;
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
                },
                timeout: 30
            });
            const cookieHeader = response.headers.get('set-cookie');
            if (cookieHeader) {
                const ttwid = cookieHeader.match(/ttwid=([^;]+)/);
                if (ttwid) {
                    this._ttwid = ttwid[1];
                }
            }
            return this._ttwid;
        } catch (error) {
            console.error('获取ttwid失败:', error);
            return null;
        }
    }

    /**
     * 获取房间ID
     */
    async getRoomId() {
        if (this._roomId) {
            return this._roomId;
        }
        const ttwid = await this.getTtwid();
        const url = `${this.liveUrl}${this.liveId}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': this.userAgent,
                    'Cookie': `ttwid=${ttwid}&msToken=${generateMsToken()}; __ac_nonce=0123407cc00a9e438deb4`
                },
                timeout: 5
            });
            const html = await response.text();
            const match = html.match(/roomId\\":\\"(\d+)\\"/);
            if (match && match[1]) {
                this._roomId = match[1];
                return this._roomId;
            } else {
                throw new Error('未找到房间ID');
            }
        } catch (error) {
            console.error('✗ 获取房间ID失败:', error);
            throw error;
        }
    }

    /**
     * 获取房间状态
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
                    'Cookie': `ttwid=${ttwid};`
                },
                timeout: 30
            });

            const data = await response.json();
            if (data.data) {
                const roomStatus = data.data.room_status;
                const user = data.data.user;
                const userId = user.id_str;
                const nickname = user.nickname;

                return {
                    roomStatus,
                    userId,
                    nickname,
                    isLive: roomStatus === 0
                };
            }
        } catch (error) {
            console.error('获取房间状态失败:', error);
        }
        
        return null;
    }

    /**
     * 开始连接并监听
     */
    async start() {
        try {
            await this.init();
            await this.getRoomId();
            await this._connectWebSocket();
        } catch (error) {
            console.error('启动失败:', error);
            throw error;
        }
    }

    /**
     * 停止连接
     */
    stop() {
        // 清除心跳定时器
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        // 断开WebSocket连接
        if (this.ws) {
            this.ws.disconnect();
            this.ws = null;
        }
        
        console.log('抖音直播抓取已完全停止');
    }

    /**
     * 连接WebSocket
     */
    async _connectWebSocket() {
        const roomId = await this.getRoomId();
        const ttwid = await this.getTtwid();
        const userUniqueId = '7319483754668557238';
        let wssUrl = `wss://webcast5-ws-web-hl.douyin.com/webcast/im/push/v2/?app_name=douyin_web&version_code=180800&webcast_sdk_version=1.0.14-beta.0&update_version_code=1.0.14-beta.0&compress=gzip&device_platform=web&cookie_enabled=true&screen_width=1536&screen_height=864&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0%20(Windows%20NT%2010.0;%20Win64;%20x64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/126.0.0.0%20Safari/537.36&browser_online=true&tz_name=Asia/Shanghai&cursor=d-1_u-1_fh-7392091211001140287_t-1721106114633_r-1&internal_ext=internal_src:dim|wss_push_room_id:${roomId}|wss_push_did:${userUniqueId}|first_req_ms:1721106114541|fetch_time:1721106114633|seq:1|wss_info:0-1721106114633-0-0|wrds_v:7392094459690748497&host=https://live.douyin.com&aid=6383&live_id=1&did_rule=3&endpoint=live_pc&support_wrds=1&user_unique_id=${userUniqueId}&im_path=/webcast/im/fetch/&identity=audience&need_persist_msg_count=15&insert_task_id=&live_reason=&room_id=${roomId}&heartbeatDuration=0`;
        try {
            const signature = await generateSignature(wssUrl);
            if (signature) {
                wssUrl += `&signature=${encodeURIComponent(signature)}`;
            }
        } catch (error) {
            console.warn('签名生成失败:', error);
            this.stop()
            throw error;
        }
        
        try {
            this.ws = await WebSocket.connect(wssUrl, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Origin': 'https://live.douyin.com',
                    'Cookie': `ttwid=${ttwid}`
                }
            });
            
            // 设置消息监听器
            this.ws.addListener((message) => {
                this._onMessage(message);
            });

            // 开始发送心跳
            this._startHeartbeat();
        } catch (error) {
            console.error('WebSocket连接失败:', error);
            throw error;
        }
    }

    /**
     * 开始心跳
     */
    _startHeartbeat() {
        // 清除之前的定时器
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        
        this.heartbeatTimer = setInterval(async () => {
            if (this.ws) {
                try {
                    const PushFrame = this.root.lookupType('douyin.PushFrame');
                    const heartbeat = PushFrame.create({ payloadType: 'hb' });
                    const buffer = PushFrame.encode(heartbeat).finish();
                    
                    await this.ws.send(Array.from(buffer));
                } catch (error) {
                    console.error('心跳包发送失败:', error);
                }
            }
        }, 5000);
    }

    /**
     * 消息处理
     */
    async _onMessage(message) {
        try {
            // 处理不同类型的消息
            if (message.type === 'Close') {
                this._onClose();
                return;
            }
            
            if (message.type === 'Text') {
                return;
            }
            
            if (message.type !== 'Binary') {
                console.log('未知消息类型:', message.type);
                return;
            }
            
            // 解析Binary消息
            const PushFrame = this.root.lookupType('douyin.PushFrame');
            const Response = this.root.lookupType('douyin.Response');
            
            // message.data是number[]格式，转换为Uint8Array
            let data;
            if (Array.isArray(message.data)) {
                data = new Uint8Array(message.data);
            } else {
                console.warn('Binary消息格式错误:', typeof message.data);
                return;
            }
            const frame = PushFrame.decode(data);

            if (frame.payload) {
                try {
                    const decompressedPayload = decompressGzip(frame.payload);
                    const response = Response.decode(decompressedPayload);

                    // 返回直播间服务器链接存活确认消息，便于持续获取数据
                    if (response.needAck) {
                        const ack = PushFrame.create({
                            logId: frame.logId,
                            payloadType: 'ack',
                            payload: new TextEncoder().encode(response.internalExt || '')
                        });
                        const ackBuffer = PushFrame.encode(ack).finish();
                        await this.ws.send(Array.from(ackBuffer));
                    }
                    
                    // 处理消息列表
                    if (response.messagesList && response.messagesList.length > 0) {
                        for (const msg of response.messagesList) {
                            const method = msg.method;
                            const handler = this.messageHandlers[method];
                            if (handler && msg.payload) {
                                try {
                                    handler(msg.payload);
                                } catch (handlerError) {
                                    console.error(`处理消息失败 [${method}]:`, handlerError);
                                }
                            }
                        }
                    }
                } catch (decodeError) {
                    console.error('解析Response失败:', decodeError);
                }
            }
        } catch (error) {
            console.error('消息处理失败:', error);
        }
    }

    /**
     * 处理WebSocket连接关闭
     */
    _onClose() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        this._emit('close', {
            timestamp: Date.now()
        });
    }

    /**
     * 解析聊天消息
     */
    _parseChatMsg(payload) {
        try {
            const ChatMessage = this.root.lookupType('douyin.ChatMessage');
            const message = ChatMessage.decode(payload);
            const userName = message.user?.nickName || '未知用户';
            const userId = message.user?.id || '';
            const content = message.content || '';
            this._emit('chat', {
                userId,
                userName,
                content,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析聊天消息失败:', error);
        }
    }

    /**
     * 解析礼物消息
     */
    _parseGiftMsg(payload) {
        try {
            const GiftMessage = this.root.lookupType('douyin.GiftMessage');
            const message = GiftMessage.decode(payload);
            const userName = message.user?.nickName || '未知用户';
            const giftName = message.gift?.name || '未知礼物';
            const giftCount = message.comboCount || 1;
            this._emit('gift', {
                userName,
                giftName,
                giftCount,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析礼物消息失败:', error);
        }
    }

    /**
     * 解析点赞消息
     */
    _parseLikeMsg(payload) {
        try {
            const LikeMessage = this.root.lookupType('douyin.LikeMessage');
            const message = LikeMessage.decode(payload);
            const userName = message.user?.nickName || '未知用户';
            const count = message.count || 1;
            this._emit('like', {
                userName,
                count,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析点赞消息失败:', error);
        }
    }

    /**
     * 解析进入直播间消息
     */
    _parseMemberMsg(payload) {
        try {
            const MemberMessage = this.root.lookupType('douyin.MemberMessage');
            const message = MemberMessage.decode(payload);
            console.log('进入直播间消息:', message);
            const userName = message.user?.nickName || '未知用户';
            const userId = message.user?.id || '';
            const gender = message.user?.gender === 1 ? '男' : '女';
            this._emit('member', {
                userId,
                userName,
                gender,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析进场消息失败:', error);
        }
    }

    /**
     * 解析关注消息
     */
    _parseSocialMsg(payload) {
        try {
            const SocialMessage = this.root.lookupType('douyin.SocialMessage');
            const message = SocialMessage.decode(payload);
            const userName = message.user?.nickName || '未知用户';
            const userId = message.user?.id || '';
            this._emit('social', {
                userId,
                userName,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析关注消息失败:', error);
        }
    }

    /**
     * 解析直播间统计消息
     */
    _parseRoomUserSeqMsg(payload) {
        try {
            const RoomUserSeqMessage = this.root.lookupType('douyin.RoomUserSeqMessage');
            const message = RoomUserSeqMessage.decode(payload);
            const current = message.total || 0;
            const totalPv = message.totalPvForAnchor || 0;
            this._emit('stats', {
                current,
                totalPv,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析统计消息失败:', error);
        }
    }

    /**
     * 解析粉丝团消息
     */
    _parseFansclubMsg(payload) {
        try {
            const FansclubMessage = this.root.lookupType('douyin.FansclubMessage');
            const message = FansclubMessage.decode(payload);
            const content = message.content || '';
            this._emit('fansclub', {
                content,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析粉丝团消息失败:', error);
        }
    }

    /**
     * 解析控制消息
     */
    _parseControlMsg(payload) {
        try {
            const ControlMessage = this.root.lookupType('douyin.ControlMessage');
            const message = ControlMessage.decode(payload);
            if (message.status === 3) {
                this.stop();
                this._emit('roomEnd', {
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('解析控制消息失败:', error);
        }
    }

    /**
     * 解析表情聊天消息
     */
    _parseEmojiChatMsg(payload) {
        try {
            const EmojiChatMessage = this.root.lookupType('douyin.EmojiChatMessage');
            const message = EmojiChatMessage.decode(payload);
            const emojiId = message.emojiId || '';
            const user = message.user?.nickName || '未知用户';
            const defaultContent = message.defaultContent || '';
            this._emit('emoji', {
                user,
                emojiId,
                defaultContent,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析表情消息失败:', error);
        }
    }

    /**
     * 解析房间统计消息
     */
    _parseRoomStatsMsg(payload) {
        try {
            const RoomStatsMessage = this.root.lookupType('douyin.RoomStatsMessage');
            const message = RoomStatsMessage.decode(payload);
            const displayLong = message.displayLong || '';
            this._emit('roomStats', {
                displayLong,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析房间统计消息失败:', error);
        }
    }

    /**
     * 解析房间消息
     */
    _parseRoomMsg(payload) {
        try {
            const RoomMessage = this.root.lookupType('douyin.RoomMessage');
            const message = RoomMessage.decode(payload);
            const roomId = message.common?.roomId || '';
            this._emit('room', {
                roomId,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析房间消息失败:', error);
        }
    }

    /**
     * 解析排行榜消息
     */
    _parseRankMsg(payload) {
        try {
            const RoomRankMessage = this.root.lookupType('douyin.RoomRankMessage');
            const message = RoomRankMessage.decode(payload);
            const ranksList = message.ranksList || [];
            this._emit('rank', {
                ranksList,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析排行榜消息失败:', error);
        }
    }

    /**
     * 解析流适配消息
     */
    _parseRoomStreamAdaptationMsg(payload) {
        try {
            const RoomStreamAdaptationMessage = this.root.lookupType('douyin.RoomStreamAdaptationMessage');
            const message = RoomStreamAdaptationMessage.decode(payload);
            const adaptationType = message.adaptationType || '';
            this._emit('streamAdaptation', {
                adaptationType,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('解析流适配消息失败:', error);
        }
    }

    /**
     * 事件发射器
     */
    _emit(eventType, data) {
        // 这里可以实现事件监听机制
        // 可以通过 fetcher.on('chat', callback) 来监听事件
        if (this.eventHandlers && this.eventHandlers[eventType]) {
            this.eventHandlers[eventType].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`事件处理器执行失败 [${eventType}]:`, error);
                }
            });
        }
    }

    /**
     * 添加事件监听器
     */
    on(eventType, handler) {
        if (!this.eventHandlers) {
            this.eventHandlers = {};
        }
        if (!this.eventHandlers[eventType]) {
            this.eventHandlers[eventType] = [];
        }
        this.eventHandlers[eventType].push(handler);
    }

    /**
     * 移除事件监听器
     */
    off(eventType, handler) {
        if (this.eventHandlers && this.eventHandlers[eventType]) {
            const index = this.eventHandlers[eventType].indexOf(handler);
            if (index > -1) {
                this.eventHandlers[eventType].splice(index, 1);
            }
        }
    }
}
