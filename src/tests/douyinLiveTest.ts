async function testDouyinLive() {
  try {
    // 动态导入模块
    const { DouyinLiveFetcher } = await import('../services/douyinLiveFetcher.js');
    
    // 创建抓取器实例，使用一个示例直播间ID
    // 注意：这里需要替换为实际的直播间ID
    const liveId = '489788578491';
    const fetcher = new DouyinLiveFetcher(liveId);
    
    console.log('开始测试抖音直播间数据抓取...');
    
    // 添加事件监听器
    fetcher.on('chat', (data: any) => {
      console.log('聊天消息:', data);
    });
    
    fetcher.on('gift', (data: any) => {
      console.log('礼物消息:', data);
    });
    
    fetcher.on('like', (data: any) => {
      console.log('点赞消息:', data);
    });
    
    fetcher.on('member', (data: any) => {
      console.log('进场消息:', data);
    });
    
    fetcher.on('social', (data: any) => {
      console.log('关注消息:', data);
    });

    fetcher.on('close', (data: any) => {
      console.log('WebSocket连接关闭:', data);
    });
    
    fetcher.on('stats', (data: any) => {
      console.log('统计消息:', data);
    });
    
    fetcher.on('roomEnd', (data: any) => {
      console.log('直播结束:', data);
    });
    
    const roomStatus = await fetcher.getRoomStatus();
    if (roomStatus) {
      console.log('房间状态检查完成:', roomStatus);
      if (roomStatus.isLive) {
        console.log('直播间正在进行中，开始连接...');
        await fetcher.start();
        setTimeout(() => {
          console.log('测试时间结束，停止连接...');
          fetcher.stop();
        }, 10000);
      } else {
        console.log('直播间已结束，无法进行测试');
      }
    } else {
      console.log('无法获取房间状态');
    }
  } catch (error) {
    console.error('测试抖音直播抓取失败:', error);
  }
}

// 运行完整测试
export async function runDouyinTests() {
  console.log('开始抖音直播测试...');
  setTimeout(testDouyinLive, 5000);
}
