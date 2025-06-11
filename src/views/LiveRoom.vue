<template>
  <div class="page-container">
    <div class="content-wrapper">
      <!-- 左侧区域：连接控制和实时消息 -->
      <div class="left-column">
        <!-- 直播间连接区域 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>直播间连接</span>
              <el-tag :type="liveStatus === '已连接' ? 'success' : 'info'">{{ liveStatus || '未连接' }}</el-tag>
            </div>
          </template>
          <div class="card-content connection-content">
            <div class="connection-form">
              <el-input
                placeholder="请输入直播间ID"
                class="room-id-input"
                type="number"
                v-model="roomId"
              >
              </el-input>
              <el-button type="primary" @click="connectLiveRoom" :loading="isConnecting">
                {{ isConnected ? '重新连接' : '连接' }}
              </el-button>
            </div>
            <div class="stats-container">
              <div class="live-info">
                <div class="info-item">
                  <span class="label">直播间名称:</span>
                  <span class="value">{{ roomName || '东方甄选' }}</span>
                </div>
              </div>
              <div class="live-stats">
                <div class="stats-row">
                  <div class="stat-item">
                    <span class="label">在线观众:</span>
                    <span class="value">{{ viewerCount || 1258 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">累计观看:</span>
                    <span class="value">{{ totalViewCount || 5647 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">点赞数:</span>
                    <span class="value">{{ likeCount || 3245 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 聊天消息监控区域 -->
        <el-card class="box-card chat-monitor">
          <template #header>
            <div class="card-header">
              <span>聊天消息监控</span>
            </div>
          </template>
          <div class="card-content chat-content"> 
            <div class="chat-messages">
              <el-scrollbar ref="messagesScrollbar">
                <div class="message-list">
                  <!-- 消息示例 -->
                  <div v-for="(message, index) in sampleMessages" :key="index" 
                       class="message-item"
                       :class="[message.type, message.isKeyword ? 'keyword-match' : '']">
                    <template v-if="message.type === 'chat'">
                      <span class="user-name">{{ message.userName }}:</span>
                      <span class="message-content">{{ message.content }}</span>
                      <div class="message-actions">
                        <el-button size="mini" type="primary"
                                   @click="generateTeleprompter(message)" title="提词">提词</el-button>
                      </div>
                    </template>
                    <template v-else-if="message.type === 'gift'">
                      <span class="user-name">{{ message.userName }}</span>
                      <span class="message-content">赠送了 {{ message.giftCount }} 个 {{ message.giftName }}</span>
                    </template>
                    <template v-else-if="message.type === 'enter'">
                      <span class="user-name">{{ message.userName }}</span>
                      <span class="message-content">进入了直播间</span>
                    </template>
                    <template v-else-if="message.type === 'follow'">
                      <span class="user-name">{{ message.userName }}</span>
                      <span class="message-content">关注了主播</span>
                    </template>
                    <template v-else-if="message.type === 'like'">
                      <span class="user-name">{{ message.userName }}</span>
                      <span class="message-content">点了 {{ message.count }} 个赞</span>
                    </template>
                  </div>
                </div>
              </el-scrollbar>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧区域：提词生成 -->
      <div class="right-column">
        <!-- AI闲聊功能区 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>AI闲聊</span>
              <div class="header-controls">
                <el-select v-model="chatTopicSource" style="width: 110px" :disabled="chatMode">
                  <el-option label="平衡模式" value="balanced"></el-option>
                  <el-option label="偏重话题" value="topic"></el-option>
                  <el-option label="偏重产品" value="product"></el-option>
                </el-select>
                <el-switch 
                  v-model="chatMode" 
                  active-text="启用" 
                  inactive-text="关闭" 
                  inline-prompt 
                  active-color="#409EFF" />
                <el-switch v-model="autoChatSpeak" active-text="自动播放" inactive-text="手动播放" inline-prompt active-color="#67C23A" class="ml-10" />
                <el-button type="success" :disabled="!currentChat.content" class="ml-10">播放</el-button>
              </div>
            </div>
          </template>
          <div class="card-content teleprompter-content">
            <div class="active-prompt no-header">
              <div class="prompt-content">
                <el-input 
                  type="textarea" 
                  v-model="currentChat.content" 
                  placeholder="AI将根据直播间氛围自动生成闲聊内容..."
                  :rows="6"
                  resize="none"
                />
              </div>
            </div>
          </div>
        </el-card>

        <!-- 提词器功能区 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>AI提词</span>
              <div class="header-controls">
                <el-switch v-model="autoMode" active-text="自动提词" inactive-text="手动提词" inline-prompt active-color="#409EFF" />
              </div>
            </div>
          </template>
          <div class="card-content teleprompter-content">
            <div class="trigger-section">
              <div class="subsection-header">
                <h4>触发消息</h4>
                <div v-if="currentPrompt.relatedMessage">
                  <el-tooltip :content="currentPrompt.relatedMessage" placement="top" :show-after="500">
                    <el-tag type="success" class="ellipsis-tag">{{ currentPrompt.relatedMessage }}</el-tag>
                  </el-tooltip>
                </div>
                <span v-else class="empty-message-tag">暂无触发消息</span>
              </div>
            </div>

            <div class="active-prompt">
              <div class="subsection-header">
                <h4>当前提词内容</h4>
                <div class="play-controls">
                  <el-switch v-model="autoSpeak" active-text="自动播放" inactive-text="手动播放" inline-prompt active-color="#67C23A" />
                  <el-button type="success" :disabled="!currentPrompt.content">播放</el-button>
                </div>
              </div>
              <div class="prompt-content">
                <el-input 
                  type="textarea" 
                  v-model="currentPrompt.content" 
                  placeholder="AI将根据聊天消息和知识库匹配结果自动生成提词内容..."
                  :rows="6"
                  resize="none"
                />
              </div>
            </div>

            <div class="knowledge-match">
              <div class="subsection-header">
                <h4>知识库匹配结果</h4>
              </div>
              <div class="knowledge-container">
                <el-scrollbar>
                  <div v-if="currentKnowledge.length > 0" class="knowledge-items">
                    <div v-for="(item, index) in currentKnowledge" :key="index" class="knowledge-item">
                      <div class="knowledge-title">
                        <span>{{ item.title }}</span>
                      </div>
                      <div class="knowledge-content">{{ item.content }}</div>
                    </div>
                  </div>
                  <div v-else class="empty-message">暂无匹配结果</div>
                </el-scrollbar>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onUnmounted } from 'vue';
import { ElCard, ElInput, ElButton, ElTag, ElSwitch, ElScrollbar, ElMessage, ElSelect, ElOption } from 'element-plus';
import { chatService } from '@/services';

// 直播间连接状态
const roomId = ref('');
const roomName = ref('');
const liveStatus = ref('已连接');
const viewerCount = ref(0);
const totalViewCount = ref(0);
const likeCount = ref(0);
const isConnecting = ref(false);
const isConnected = ref(false);

// 聊天消息
const messagesScrollbar = ref(null);

// 示例消息
const sampleMessages = [
  { type: 'chat', userName: '用户8264', content: '这个护肤品适合敏感肌肤吗？', isKeyword: true },
  { type: 'enter', userName: '美丽达人' },
  { type: 'chat', userName: '时尚先锋', content: '主播用的什么香水啊，闻起来好香' },
  { type: 'gift', userName: '忠实粉丝', giftName: '爱心', giftCount: 5 },
  { type: 'chat', userName: '护肤达人', content: '这个面霜保湿效果怎么样？', isKeyword: true },
  { type: 'follow', userName: '新粉丝001' },
  { type: 'chat', userName: '购物狂', content: '有没有活动价格？想入手' },
  { type: 'like', userName: '静静观看', count: 10 },
  { type: 'chat', userName: '好奇宝宝', content: '这个产品成分是什么？适合油性皮肤吗？', isKeyword: true },
  { type: 'chat', userName: '理性消费', content: '可以详细介绍下这款护肤品的效果吗？' },
  { type: 'chat', userName: '用户8265', content: '这个护肤品适合敏感肌肤吗？' },
  { type: 'enter', userName: '美丽达人1' },
  { type: 'chat', userName: '时尚先锋1', content: '主播用的什么香水啊，闻起来好香' },
  { type: 'gift', userName: '忠实粉丝1', giftName: '爱心', giftCount: 5 },
  { type: 'chat', userName: '护肤达人1', content: '这个面霜保湿效果怎么样？' },
  { type: 'follow', userName: '新粉丝002' },
  { type: 'chat', userName: '购物狂1', content: '有没有活动价格？想入手' },
  { type: 'like', userName: '静静观看1', count: 10 },
  { type: 'chat', userName: '好奇宝宝1', content: '这个产品成分是什么？适合油性皮肤吗？' },
  { type: 'chat', userName: '理性消费1', content: '可以详细介绍下这款护肤品的效果吗？' },
];

// AI闲聊
const chatMode = ref(false);
const autoChatSpeak = ref(true);
const chatTopicSource = ref('balanced');

const currentChat = ref({
  content: '点击"启用"开始AI闲聊，系统将根据直播间氛围自动生成互动内容...'
});

// 监听内容来源变化
watch(chatTopicSource, (newValue) => {
  console.log(`内容来源已变更为: ${newValue}`);
  // 如果闲聊模式开启，重启聊天以应用新配置
  if (chatMode.value) {
    restartChatWithNewConfig();
  }
});

// 监听聊天模式开关
watch(chatMode, async (isEnabled) => {
  if (isEnabled) {
    await startAIChat();
  } else {
    await stopAIChat();
  }
});

// 开始AI闲聊
const startAIChat = async () => {
  try {
    await chatService.startChat(
      chatTopicSource.value,
      (message) => {
        // 更新当前闲聊内容
        currentChat.value.content = message;
      }
    );
  } catch (error) {
    console.error('启动AI闲聊失败:', error);
    chatMode.value = false; // 失败时关闭开关
  }
};

// 停止AI闲聊
const stopAIChat = async () => {
  try {
    await chatService.stopChat();
    currentChat.value.content = '点击"启用"开始AI闲聊，系统将根据直播间氛围自动生成互动内容...';
  } catch (error) {
    console.error('停止AI闲聊失败:', error);
  }
};

// 重启聊天以应用新配置
const restartChatWithNewConfig = async () => {
  if (chatService.isRunning()) {
    await stopAIChat();
    // 稍微延迟后重新启动，确保之前的聊天完全停止
    setTimeout(() => {
      startAIChat();
    }, 100);
  }
};

// 组件卸载时停止聊天
onUnmounted(() => {
  stopAIChat();
});

// 提词生成
const autoMode = ref(true);
const currentPrompt = ref({
  content: '这款面霜特别适合敏感肌肤使用，它采用温和配方，不含酒精、香料和色素等刺激成分。保湿效果很出色，能深层锁水24小时，有效改善肌肤干燥和紧绷感。它还添加了神经酰胺和透明质酸成分，可以修复受损皮肤屏障，减少过敏和泛红现象。目前正在进行618活动，原价298元，现在只需198元，是敏感肌肤朋友的不错选择。',
  relatedMessage: '这个护肤品适合敏感肌肤吗？'
});

// 知识库匹配结果
const currentKnowledge = ref([
  {
    type: '产品信息',
    title: '舒缓修护面霜',
    content: '温和配方，适合敏感肌肤，不含酒精、香料和色素等刺激成分，保湿效果持久，可修复皮肤屏障。',
    score: 95
  },
  {
    type: '活动信息',
    title: '618促销活动',
    content: '原价298元，活动价198元，限时优惠。',
    score: 85
  },
  {
    type: '成分解析',
    title: '核心成分功效',
    content: '含神经酰胺和透明质酸，深层锁水24小时，改善干燥和紧绷感。',
    score: 75
  },
]);

// 语音设置
const autoSpeak = ref(true);

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesScrollbar.value) {
      const scrollbarWrap = messagesScrollbar.value.$el.querySelector('.el-scrollbar__wrap');
      scrollbarWrap.scrollTop = scrollbarWrap.scrollHeight;
    }
  });
};

// 生成提词内容
const generateTeleprompter = (message) => {
  console.log('根据消息生成提词:', message);
  currentPrompt.value = {
    content: '根据用户问题，我们的产品......', // 实际应用中这里应该是AI生成的内容
    relatedMessage: message.content
  };
};

// 获取消息类型标签颜色
const getMessageTagType = (type) => {
  const typeMap = {
    'chat': 'primary',
    'gift': 'success',
    'enter': 'info',
    'follow': 'warning',
    'like': 'info'
  };
  return typeMap[type] || 'info';
};

// 获取消息类型名称
const getMessageTypeName = (type) => {
  const typeMap = {
    'chat': '聊天消息',
    'gift': '礼物消息',
    'enter': '进入消息',
    'follow': '关注消息',
    'like': '点赞消息'
  };
  return typeMap[type] || type;
};

// 连接直播间
const connectLiveRoom = () => {
  if (!roomId.value) {
    ElMessage.warning('请输入直播间ID');
    return;
  }
  
  isConnecting.value = true;
  
  // 模拟连接过程
  setTimeout(() => {
    isConnecting.value = false;
    isConnected.value = true;
    liveStatus.value = '正在直播';
    roomName.value = '抖音带货直播示例';
    viewerCount.value = 1258;
    totalViewCount.value = 5647;
    likeCount.value = 3245;
    
    ElMessage.success('成功连接到直播间');
  }, 1500);
};

// 根据类型返回tag类型
const getTagType = (type) => {
  const typeMap = {
    '产品信息': 'primary',
    '活动信息': 'warning',
    '成分解析': 'info',
    '使用方法': 'success',
    '注意事项': 'danger'
  };
  return typeMap[type] || 'info';
};
</script>

<style scoped>
.page-container {
  height: 1080px;
  padding: 20px 0;
  box-sizing: border-box;
}

.content-wrapper {
  width: 1300px;
  height: 1000px;
  margin: 0 auto;
  display: flex;
  gap: 20px;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 50%;
  height: 100%; /* 确保两列高度一致 */
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 50%;
  height: 100%;
}

.box-card {
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
  overflow: hidden;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.box-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  padding: 0 20px;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(to right, #f0f9ff, #ecf5ff);
  border-radius: 8px 8px 0 0;
}

.card-header span {
  font-size: 18px;
  font-weight: 600;
  color: #409EFF;
  letter-spacing: 0.5px;
  position: relative;
  padding-left: 12px;
}

.card-header span::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background-color: #409EFF;
  border-radius: 2px;
}

/* .card-content 是 el-card__body 的直接子元素，需要确保它正确应用 */
:deep(.el-card__body) {
  padding: 0 !important; /* 重置 el-card 的默认 padding */
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid #ebeef5;
  height: 46px;
  flex-shrink: 0;
  background: #f5f7fa;
  position: relative;
}

.section-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, #409EFF, transparent);
}

.section-header h4 {
  margin: 0;
  font-size: 15px;
  color: #606266;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: flex;
  align-items: center;
}

.section-header h4::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #409EFF;
  margin-right: 8px;
}

.connection-content {
  padding: 15px;
}

.connection-form {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.room-id-input {
  width: 180px;
}

.stats-container {
  display: flex;
  flex-direction: column;
}

.live-info {
  margin-bottom: 10px;
}

.info-item {
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats-row {
  display: flex;
  gap: 20px;
}

.stat-item {
  flex: 1;
  white-space: nowrap;
}

.label {
  font-weight: bold;
  margin-right: 5px;
  color: #666;
}

/* 聊天监控区域样式 */
.chat-monitor {
  flex: 1; /* 改为flex: 1确保填充剩余空间 */
  display: flex;
  flex-direction: column;
}

.chat-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow: hidden;
  padding: 8px;
  box-sizing: border-box;
}

.chat-messages .el-scrollbar {
  height: 100%;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 5px; /* 避免内容紧贴滚动条 */
}

.message-item {
  padding: 6px 10px;
  border-radius: 6px;
  background-color: #f9f9f9;
  transition: all 0.2s ease;
  position: relative;
  margin-bottom: 6px;
}

.message-item:hover {
  transform: translateY(-2px);
}

.message-item.chat {
  background-color: #f0f9ff;
}

.message-item.gift {
  background-color: #fdf6ec;
}

.message-item.enter {
  background-color: #f0f9eb;
}

.message-item.follow {
  background-color: #f0f9eb;
}

.message-item.like {
  background-color: #ecf5ff;
}

.message-item.keyword-match {
  border-left: 3px solid #409eff;
  background-color: #ecf8ff;
}

.message-actions {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.user-name {
  font-weight: bold;
  margin-right: 5px;
  color: #303133;
}

.teleprompter-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 0;
}

/* 知识库匹配结果 */
.knowledge-match {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #ebeef5;
  margin-top: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.knowledge-container {
  flex: 1;
  overflow: hidden;
  border: none;
  border-radius: 0;
  padding: 0 15px;
  background: none;
  display: flex;
  flex-direction: column;
}

.knowledge-container .el-scrollbar {
  flex: 1;
}

.knowledge-items {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  gap: 12px;
}

.knowledge-item {
  padding: 12px 15px;
  border-radius: 8px;
  background-color: #f9f9f9;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.knowledge-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
  background-color: #f0f9ff;
}

.knowledge-item:last-child {
  margin-bottom: 0;
}

.knowledge-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: bold;
}

.knowledge-content {
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

/* 当前提词内容 */
.active-prompt {
  flex-shrink: 0;
  margin: 8px 0 0 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #ebeef5;
  background: #f3f7fa;
  box-shadow: 0 2px 8px 0 rgba(64,158,255,0.08);
}

.prompt-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  flex-shrink: 0;
  margin-bottom: 10px;
  width: 100%;
}

.trigger-message {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  min-width: 0; /* 确保flex项可以收缩 */
}

.ellipsis-tag {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.play-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.prompt-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 8px 15px;
}

.prompt-content :deep(.el-textarea__inner) {
  height: 118px !important;
  resize: none;
}

.prompt-controls {
  display: none; /* 隐藏不需要的容器 */
}

/* 空状态提示 */
.empty-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
}

/* 触发消息部分 */
.empty-message-tag {
  color: #909399;
  font-size: 13px;
}

/* 统一子标题样式 */
.subsection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  border-bottom: 1px solid #ebeef5;
  height: 38px;
  flex-shrink: 0;
  background: #f5f7fa;
}

.subsection-header h4 {
  margin: 0;
  font-size: 15px;
  color: #606266;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: flex;
  align-items: center;
}

.subsection-header h4::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #409EFF;
  margin-right: 8px;
}

.card-content {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 移除不再需要的样式 */
.trigger-content {
  display: none;
}

.trigger-section {
  flex-shrink: 0;
  border-bottom: 1px solid #ebeef5;
  background-color: #f9fafb;
  margin-bottom: 0;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.content-source-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.header-controls :deep(.el-select) {
  margin-right: 5px;
}

.ml-10 {
  margin-left: 10px;
}

.no-header {
  border-top: none;
  margin-top: 0;
}

/* 提词卡片整体设置为flex布局并占满高度 */
.right-column .box-card:last-child {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.right-column .box-card:last-child .card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

</style> 