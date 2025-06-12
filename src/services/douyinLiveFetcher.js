import { fetch } from '@tauri-apps/plugin-http';
import WebSocket from '@tauri-apps/plugin-websocket';
import { resolveResource } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';
import protobuf from 'protobufjs';
import { generateMsToken, generateSignature, delay } from './utils.js';

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
            console.log('✓ Protobuf 初始化成功');
        } catch (error) {
            console.error('✗ Protobuf 初始化失败:', error);
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
            console.error('✗ 获取ttwid失败:', error);
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
                timeout: 30
            });

            const html = await response.text();
            const match = html.match(/roomId\\":\\"(\d+)\\"/);
            
            if (match && match[1]) {
                this._roomId = match[1];
                console.log(`✓ 获取到房间ID: ${this._roomId}`);
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
                
                const statusText = roomStatus === 0 ? '正在直播' : '已结束';
                console.log(`✓ 【${nickname}】[${userId}]直播间：${statusText}`);
                
                return {
                    roomStatus,
                    userId,
                    nickname,
                    isLive: roomStatus === 0
                };
            }
        } catch (error) {
            console.error('✗ 获取房间状态失败:', error);
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
            console.error('✗ 启动失败:', error);
            throw error;
        }
    }

    /**
     * 停止连接
     */
    stop() {
        if (this.ws) {
            this.ws.disconnect();
            this.ws = null;
            console.log('✓ WebSocket连接已断开');
        }
    }

    /**
     * 连接WebSocket
     */
    async _connectWebSocket() {
        const roomId = await this.getRoomId();
        const ttwid = await this.getTtwid();
        
        let wss = `wss://webcast5-ws-web-hl.douyin.com/webcast/im/push/v2/?app_name=douyin_web&version_code=180800&webcast_sdk_version=1.0.14-beta.0&update_version_code=1.0.14-beta.0&compress=gzip&device_platform=web&cookie_enabled=true&screen_width=1536&screen_height=864&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0%20(Windows%20NT%2010.0;%20Win64;%20x64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/126.0.0.0%20Safari/537.36&browser_online=true&tz_name=Asia/Shanghai&cursor=d-1_u-1_fh-7392091211001140287_t-1721106114633_r-1&internal_ext=internal_src:dim|wss_push_room_id:${roomId}|wss_push_did:7319483754668557238|first_req_ms:1721106114541|fetch_time:1721106114633|seq:1|wss_info:0-1721106114633-0-0|wrds_v:7392094459690748497&host=https://live.douyin.com&aid=6383&live_id=1&did_rule=3&endpoint=live_pc&support_wrds=1&user_unique_id=7319483754668557238&im_path=/webcast/im/fetch/&identity=audience&need_persist_msg_count=15&insert_task_id=&live_reason=&room_id=${roomId}&heartbeatDuration=0`;
        
        // 生成签名
        const signature = await generateSignature(wss);
        wss += `&signature=${signature}`;
        
        try {
            console.log('✓ 正在连接WebSocket...');
            this.ws = await WebSocket.connect(wss);
            
            // 设置事件监听器
            this.ws.addListener(this._onMessage.bind(this));
            
            console.log('✓ WebSocket连接成功');
            
            // 开始发送心跳
            this._startHeartbeat();
            
        } catch (error) {
            console.error('✗ WebSocket连接失败:', error);
            throw error;
        }
    }

    /**
     * 开始心跳
     */
    _startHeartbeat() {
        setInterval(async () => {
            if (this.ws) {
                try {
                    const PushFrame = this.root.lookupType('douyin.PushFrame');
                    const heartbeat = PushFrame.create({ payloadType: 'hb' });
                    const buffer = PushFrame.encode(heartbeat).finish();
                    
                    await this.ws.send(Array.from(buffer));
                    console.log('✓ 发送心跳包');
                } catch (error) {
                    console.error('✗ 心跳包发送失败:', error);
                }
            }
        }, 5000);
    }

    /**
     * 消息处理
     */
    async _onMessage(message) {
        try {
            // 解析PushFrame
            const PushFrame = this.root.lookupType('douyin.PushFrame');
            const Response = this.root.lookupType('douyin.Response');
            
            // message.data是Uint8Array
            const frame = PushFrame.decode(new Uint8Array(message.data));
            
            if (frame.payload) {
                // 解压gzip数据
                let payload = frame.payload;
                
                // 如果是gzip压缩的数据，需要先解压
                // 这里简化处理，实际可能需要检查compression标志
                try {
                    const response = Response.decode(payload);
                    
                    // 发送ack确认
                    if (response.needAck) {
                        const ack = PushFrame.create({
                            logId: frame.logId,
                            payloadType: 'ack',
                            payload: Buffer.from(response.internalExt || '', 'utf-8')
                        });
                        const ackBuffer = PushFrame.encode(ack).finish();
                        await this.ws.send(Array.from(ackBuffer));
                    }
                    
                    // 处理消息列表
                    if (response.messagesList && response.messagesList.length > 0) {
                        for (const msg of response.messagesList) {
                            await this._handleMessage(msg);
                        }
                    }
                } catch (decodeError) {
                    console.error('✗ 解析Response失败:', decodeError);
                }
            }
        } catch (error) {
            console.error('✗ 消息处理失败:', error);
        }
    }

    /**
     * 处理单个消息
     */
    async _handleMessage(message) {
        try {
            const method = message.method;
            const handler = this.messageHandlers[method];
            
            if (handler && message.payload) {
                await handler(message.payload);
            }
        } catch (error) {
            console.error(`✗ 处理消息失败 [${message.method}]:`, error);
        }
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
            
            console.log(`【聊天消息】[${userId}]${userName}: ${content}`);
            
            // 触发自定义事件
            this._emit('chat', {
                userId,
                userName,
                content,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析聊天消息失败:', error);
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
            
            console.log(`【礼物消息】${userName} 送出了 ${giftName}x${giftCount}`);
            
            this._emit('gift', {
                userName,
                giftName,
                giftCount,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析礼物消息失败:', error);
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
            
            console.log(`【点赞消息】${userName} 点了${count}个赞`);
            
            this._emit('like', {
                userName,
                count,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析点赞消息失败:', error);
        }
    }

    /**
     * 解析进入直播间消息
     */
    _parseMemberMsg(payload) {
        try {
            const MemberMessage = this.root.lookupType('douyin.MemberMessage');
            const message = MemberMessage.decode(payload);
            
            const userName = message.user?.nickName || '未知用户';
            const userId = message.user?.id || '';
            const gender = message.user?.gender === 1 ? '男' : '女';
            
            console.log(`【进场消息】[${userId}][${gender}]${userName} 进入了直播间`);
            
            this._emit('member', {
                userId,
                userName,
                gender,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析进场消息失败:', error);
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
            
            console.log(`【关注消息】[${userId}]${userName} 关注了主播`);
            
            this._emit('social', {
                userId,
                userName,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析关注消息失败:', error);
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
            
            console.log(`【统计消息】当前观看人数: ${current}, 累计观看人数: ${totalPv}`);
            
            this._emit('stats', {
                current,
                totalPv,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析统计消息失败:', error);
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
            
            console.log(`【粉丝团消息】${content}`);
            
            this._emit('fansclub', {
                content,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析粉丝团消息失败:', error);
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
                console.log('【控制消息】直播间已结束');
                this.stop();
                
                this._emit('roomEnd', {
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('✗ 解析控制消息失败:', error);
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
            
            console.log(`【表情消息】${user} 发送了表情: ${defaultContent} (ID: ${emojiId})`);
            
            this._emit('emoji', {
                user,
                emojiId,
                defaultContent,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析表情消息失败:', error);
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
            
            console.log(`【房间统计消息】${displayLong}`);
            
            this._emit('roomStats', {
                displayLong,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析房间统计消息失败:', error);
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
            
            console.log(`【房间消息】房间ID: ${roomId}`);
            
            this._emit('room', {
                roomId,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析房间消息失败:', error);
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
            
            console.log(`【排行榜消息】排行榜数据:`, ranksList);
            
            this._emit('rank', {
                ranksList,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析排行榜消息失败:', error);
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
            
            console.log(`【流适配消息】适配类型: ${adaptationType}`);
            
            this._emit('streamAdaptation', {
                adaptationType,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('✗ 解析流适配消息失败:', error);
        }
    }

    /**
     * 事件发射器（简单实现）
     */
    _emit(eventType, data) {
        // 这里可以实现事件监听机制
        // 用户可以通过 fetcher.on('chat', callback) 来监听事件
        if (this.eventHandlers && this.eventHandlers[eventType]) {
            this.eventHandlers[eventType].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`✗ 事件处理器执行失败 [${eventType}]:`, error);
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