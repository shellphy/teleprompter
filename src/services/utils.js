import md5 from 'js-md5';

/**
 * 生成随机的msToken字符串
 * @param {number} length - 字符串长度，默认107
 * @returns {string} 随机字符串
 */
export function generateMsToken(length = 107) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=_';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 生成签名
 * @param {string} wss - WebSocket URL
 * @returns {Promise<string>} 签名
 */
export async function generateSignature(wss) {
    try {
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
        
        // 导入sign.js中的get_sign函数
        const { get_sign } = await import('./sign.js');
        
        return get_sign(md5Param);
    } catch (error) {
        console.error('生成签名失败:', error);
        return '';
    }
}

/**
 * 解压gzip数据
 * @param {ArrayBuffer} data - 压缩数据
 * @returns {ArrayBuffer} 解压后的数据
 */
export function decompressGzip(data) {
    // 在浏览器环境中，我们需要使用CompressionStream API或第三方库
    // 这里简化处理，实际应用中可能需要polyfill
    try {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(data);
        writer.close();
        
        return reader.read().then(({value}) => value);
    } catch (error) {
        console.error('解压gzip失败:', error);
        return data;
    }
}

/**
 * 字节数组转字符串
 * @param {Uint8Array} bytes - 字节数组
 * @returns {string} 字符串
 */
export function bytesToString(bytes) {
    return new TextDecoder('utf-8').decode(bytes);
}

/**
 * 字符串转字节数组
 * @param {string} str - 字符串
 * @returns {Uint8Array} 字节数组
 */
export function stringToBytes(str) {
    return new TextEncoder().encode(str);
}

/**
 * 获取当前时间戳
 * @returns {number} 时间戳
 */
export function getTimestamp() {
    return Date.now();
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} Promise
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
} 