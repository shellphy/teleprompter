import { createApp } from "vue";
import App from "./App.vue";
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './assets/styles/index.css';
import { resolveResource } from '@tauri-apps/api/path';
import { fetch } from '@tauri-apps/plugin-http';
import WebSocket from '@tauri-apps/plugin-websocket';
import { readTextFile } from '@tauri-apps/plugin-fs';

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.mount("#app");


// http请求示范
// try {
//   const response = await fetch('https://live.douyin.com/', {
//     method: 'GET',
//     timeout: 30
//   })
//   console.log(response)
// } catch (error) {
//   console.log(error)
// }

// // websocket请求示范
// try {
//   const ws = await WebSocket.connect('ws://127.0.0.1:8080');
//   ws.addListener((msg) => {
//     console.log('Received Message:', msg);
//   });
//   await ws.send('Hello World!');
//   await ws.disconnect();
// } catch (error) {
//   console.log(error)
// }


// 读取抖音proto文件
try {
  const resourcePath = await resolveResource('assets/douyin.proto')
  const data = await readTextFile(resourcePath)
  console.log('✓ 成功读取proto文件，文件大小:', data.length)
} catch (error) {
  console.log('✗ 读取proto文件失败:', error)
}

// 测试抖音直播间抓取
async function testDouyinLive() {
  try {
    // 动态导入模块
    const { DouyinLiveFetcher } = await import('./services/douyinLiveFetcher.js');
    
    // 创建抓取器实例，使用一个示例直播间ID
    // 注意：这里需要替换为实际的直播间ID
    const liveId = '141559866040'; // 示例ID，实际使用时需要替换
    const fetcher = new DouyinLiveFetcher(liveId);
    
    console.log('✓ 开始测试抖音直播间数据抓取...');
    
    // 添加事件监听器
    fetcher.on('chat', (data) => {
      console.log('💬 聊天消息:', data);
    });
    
    fetcher.on('gift', (data) => {
      console.log('🎁 礼物消息:', data);
    });
    
    fetcher.on('like', (data) => {
      console.log('👍 点赞消息:', data);
    });
    
    fetcher.on('member', (data) => {
      console.log('👥 进场消息:', data);
    });
    
    fetcher.on('social', (data) => {
      console.log('❤️ 关注消息:', data);
    });

    fetcher.on('close', (data) => {
      console.log('🔌 WebSocket连接关闭:', data);
    });
    
    fetcher.on('stats', (data) => {
      console.log('📊 统计消息:', data);
    });
    
    fetcher.on('roomEnd', (data) => {
      console.log('🔚 直播结束:', data);
    });
    
    // 首先检查房间状态
    const roomStatus = await fetcher.getRoomStatus();
    if (roomStatus) {
      console.log('✓ 房间状态检查完成:', roomStatus);
      
      if (roomStatus.isLive) {
        console.log('✓ 直播间正在进行中，开始连接...');
        // 启动抓取
        await fetcher.start();
        
        // 运行10秒后停止测试
        setTimeout(() => {
          console.log('⏰ 测试时间结束，停止连接...');
          fetcher.stop();
        }, 10000);
      } else {
        console.log('⚠️ 直播间已结束，无法进行测试');
      }
    } else {
      console.log('✗ 无法获取房间状态');
    }
    
  } catch (error) {
    console.error('✗ 测试抖音直播抓取失败:', error);
  }
}

// 延迟5秒后开始测试，确保页面加载完成
setTimeout(testDouyinLive, 5000);

