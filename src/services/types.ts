// 抖音直播间相关类型定义

export interface ChatEventData {
    userId: string;
    userName: string;
    content: string;
    timestamp: number;
}

export interface GiftEventData {
    userName: string;
    giftName: string;
    giftCount: number;
    timestamp: number;
}

export interface LikeEventData {
    userName: string;
    count: number;
    timestamp: number;
}

export interface MemberEventData {
    userId: string;
    userName: string;
    gender: string;
    timestamp: number;
}

export interface SocialEventData {
    userId: string;
    userName: string;
    timestamp: number;
}

export interface StatsEventData {
    current: number;
    totalPv: number;
    timestamp: number;
}

export interface RoomEndEventData {
    timestamp: number;
}

export interface RoomStatus {
    roomStatus: number;
    userId: string;
    nickname: string;
    isLive: boolean;
}

export type EventHandler<T> = (data: T) => void;

export interface EventHandlers {
    chat?: EventHandler<ChatEventData>[];
    gift?: EventHandler<GiftEventData>[];
    like?: EventHandler<LikeEventData>[];
    member?: EventHandler<MemberEventData>[];
    social?: EventHandler<SocialEventData>[];
    stats?: EventHandler<StatsEventData>[];
    roomEnd?: EventHandler<RoomEndEventData>[];
    [key: string]: EventHandler<any>[] | undefined;
} 