import md5 from 'js-md5';
import pako from 'pako';

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
        console.log('MD5参数:', md5Param);
        
        // 尝试导入sign.js中的get_sign函数
        try {
            const { get_sign } = await import('./sign.js');
            const signature = get_sign(md5Param);
            console.log('签名生成成功:', signature.substring(0, 20) + '...');
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

/**
 * 解压gzip数据 - 完全按照Python版本逻辑
 * @param {Uint8Array} data - 压缩数据
 * @returns {Uint8Array} 解压后的数据
 */
export function decompressGzip(data) {
    try {
        const decompressed = pako.inflate(data);
        console.log('✅ gzip解压成功，原始大小:', data.length, '解压后大小:', decompressed.length);
        return decompressed;
    } catch (error) {
        console.error('✗ gzip解压失败:', error);
        console.log('📦 解压失败，返回原始数据');
        return data;
    }
}

