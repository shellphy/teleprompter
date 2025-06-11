<template>
  <div class="page-container">
    <div class="models-container">
      <!-- 检索引擎管理 -->
      <el-card class="model-card">
        <template #header>
          <div class="card-header">
            <h3>语义检索引擎</h3>
            <div class="model-status">
              <el-tag type="success" v-if="retrievalModelStatus">已导入</el-tag>
              <el-tag type="info" v-if="!retrievalModelStatus">未导入</el-tag>
              <el-button 
                type="primary" 
                @click="importRetrievalModel"
                v-if="!retrievalModelStatus">
                导入模型
              </el-button>
              <el-button 
                type="primary" 
                @click="openRetrievalCloudDialog"
                v-if="!retrievalModelStatus">
                云端模型
              </el-button>
              <el-button 
                type="danger" 
                @click="removeRetrievalModel"
                v-if="retrievalModelStatus">
                移除模型
              </el-button>
            </div>
          </div>
        </template>
        <div class="card-content">
          <div class="model-description">
            <p>语义检索引擎能够理解知识库内容，帮助您在直播过程中快速获取相关信息。通过深度语义理解，能够精准匹配粉丝提问与知识库内容，提升直播互动效率。</p>
            <div class="compact-requirements">
              <p class="requirements-title">模型选择：</p>
              <div class="requirements-content">
                本地模型对电脑硬件配置有一定要求，如果您的设备性能有限，建议选择云端模型。
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 语音合成引擎管理 -->
      <el-card class="model-card">
        <template #header>
          <div class="card-header">
            <h3>声音克隆引擎</h3>
            <div class="model-status">
              <el-tag type="success" v-if="ttsModelStatus">已导入</el-tag>
              <el-tag type="info" v-if="!ttsModelStatus">未导入</el-tag>
              <el-button 
                type="primary" 
                @click="importTtsModel"
                v-if="!ttsModelStatus">
                导入模型
              </el-button>
              <el-button 
                type="primary" 
                @click="openTtsCloudDialog"
                v-if="!ttsModelStatus">
                云端模型
              </el-button>
              <el-button 
                type="primary" 
                @click="openVoiceRecordingDialog" 
                v-if="ttsModelStatus">
                {{ hasRecording ? '更新录音' : '录制语音' }}
              </el-button>
              <el-button 
                type="danger" 
                @click="removeTtsModel"
                v-if="ttsModelStatus">
                移除模型
              </el-button>
            </div>
          </div>
        </template>
        <div class="card-content">
          <div class="model-description">
            <p>声音克隆引擎可以模仿您的声音，将文字转换为语音。只需录制10秒左右的语音样本，AI就能学习您独特的音色和语调，为直播提供自然流畅的语音输出。</p>
            <div class="compact-requirements">
              <p class="requirements-title">模型选择：</p>
              <div class="requirements-content">
                本地模型对电脑硬件配置有一定要求，如果您的设备性能有限，建议选择云端模型。
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 对话模型管理 -->
      <el-card class="model-card">
        <template #header>
          <div class="card-header">
            <h3>对话引擎</h3>
            <div class="model-status">
              <el-tag type="success" v-if="chatModelStatus">已导入</el-tag>
              <el-tag type="info" v-if="!chatModelStatus">未导入</el-tag>
              <el-button 
                type="primary" 
                @click="importChatModel"
                v-if="!chatModelStatus">
                导入模型
              </el-button>
              <el-button 
                type="primary" 
                @click="openChatCloudDialog"
                v-if="!chatModelStatus">
                云端模型
              </el-button>
              <el-button 
                type="danger" 
                @click="removeChatModel"
                v-if="chatModelStatus">
                移除模型
              </el-button>
            </div>
          </div>
        </template>
        <div class="card-content">
          <div class="model-description">
            <p>对话引擎能够与粉丝自然交流，根据话题库生成有趣内容，并结合知识库快速回答问题。全程在本地运行，保护您的隐私和数据安全。</p>
            <div class="compact-requirements">
              <p class="requirements-title">模型选择：</p>
              <div class="requirements-content">
                本地模型对电脑硬件配置有一定要求，如果您的设备性能有限，建议选择云端模型。
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 录制语音对话框 -->
    <el-dialog
      v-model="showVoiceRecordingDialog"
      title="录制语音样本"
      width="50%"
    >
      <div class="voice-recording-container">
        <div class="voice-recording-info">
          <el-alert
            title="声音克隆录音"
            type="info"
            description="请清晰地朗读下方文本，录制至少10秒钟的语音样本，以便AI学习您的声音特征。"
            :closable="false"
            show-icon
          />
        </div>
        
        <div class="sample-text-container">
          <p class="sample-text">请朗读以下文本：</p>
          <div class="sample-content">欢迎来到我的直播间，今天我们将一起分享一些有趣的内容，希望大家喜欢。</div>
        </div>
        
        <div class="recording-actions">
          <el-button 
            :type="isRecording ? 'danger' : 'primary'" 
            @click="isRecording ? stopRecording() : startRecording()">
            {{ isRecording ? '结束录制' : '开始录制' }}
          </el-button>
          <el-button 
            type="success"
            v-if="hasRecording"
            @click="testVoiceClone">
            测试效果
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 检索引擎云端配置对话框 -->
    <el-dialog
      v-model="showRetrievalCloudDialog"
      title="配置检索引擎云端模型"
      width="50%"
    >
      <div class="cloud-config-container">
        <el-alert
          title="云端模型配置"
          type="info"
          description="使用云端模型可以获得更好的性能，无需本地算力支持。"
          :closable="false"
          show-icon
        />
        <el-form :model="retrievalCloudConfig" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="API Key">
            <el-input 
              v-model="retrievalCloudConfig.apiKey" 
              placeholder="请输入您的API Key"
              show-password
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showRetrievalCloudDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRetrievalCloudConfig">确定</el-button>
      </template>
    </el-dialog>

    <!-- 语音合成云端配置对话框 -->
    <el-dialog
      v-model="showTtsCloudDialog"
      title="配置声音克隆云端模型"
      width="50%"
    >
      <div class="cloud-config-container">
        <el-alert
          title="云端模型配置"
          type="info"
          description="使用云端模型可以获得更好的性能，无需本地算力支持。"
          :closable="false"
          show-icon
        />
        <el-form :model="ttsCloudConfig" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="API Key">
            <el-input 
              v-model="ttsCloudConfig.apiKey" 
              placeholder="请输入您的API Key"
              show-password
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showTtsCloudDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTtsCloudConfig">确定</el-button>
      </template>
    </el-dialog>

    <!-- 对话引擎云端配置对话框 -->
    <el-dialog
      v-model="showChatCloudDialog"
      title="配置对话引擎云端模型"
      width="50%"
    >
      <div class="cloud-config-container">
        <el-alert
          title="云端模型配置"
          type="info"
          description="使用云端模型可以获得更好的性能，无需本地算力支持。"
          :closable="false"
          show-icon
        />
        <el-form :model="chatCloudConfig" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="API Key">
            <el-input 
              v-model="chatCloudConfig.apiKey" 
              placeholder="请输入您的API Key"
              show-password
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showChatCloudDialog = false">取消</el-button>
        <el-button type="primary" @click="saveChatCloudConfig">确定</el-button>
      </template>
    </el-dialog>

    <!-- 隐藏的文件输入 -->
    <input ref="retrievalFileInput" type="file" style="display: none" @change="handleRetrievalFileSelect" accept=".gguf,.onnx">
    <input ref="ttsFileInput" type="file" style="display: none" @change="handleTtsFileSelect" accept=".pth,.onnx">
    <input ref="chatFileInput" type="file" style="display: none" @change="handleChatFileSelect" accept=".gguf,.bin">
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { 
  ElCard, 
  ElButton, 
  ElTag, 
  ElDialog,
  ElAlert,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage
} from 'element-plus';

// 检索引擎模型状态
const retrievalModelStatus = ref(false);
const retrievalModelInfo = ref(null);
const retrievalFileInput = ref(null);

// 语音合成引擎状态
const ttsModelStatus = ref(false);
const ttsModelInfo = ref(null);
const ttsFileInput = ref(null);
const isRecording = ref(false);
const recordingTime = ref(0);
const hasRecording = ref(false);
const showVoiceRecordingDialog = ref(false);

// 对话模型状态
const chatModelStatus = ref(false);
const chatModelInfo = ref(null);
const chatFileInput = ref(null);

// 云端配置对话框状态
const showRetrievalCloudDialog = ref(false);
const showTtsCloudDialog = ref(false);
const showChatCloudDialog = ref(false);

// 云端配置数据
const retrievalCloudConfig = ref({ apiKey: '' });
const ttsCloudConfig = ref({ apiKey: '' });
const chatCloudConfig = ref({ apiKey: '' });

// 文件大小格式化函数
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 检索引擎相关方法
const importRetrievalModel = () => {
  retrievalFileInput.value.click();
};

const handleRetrievalFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    retrievalModelInfo.value = {
      name: file.name,
      size: formatFileSize(file.size)
    };
    retrievalModelStatus.value = true;
  }
};

const removeRetrievalModel = () => {
  retrievalModelStatus.value = false;
  retrievalModelInfo.value = null;
};

const openRetrievalCloudDialog = () => {
  showRetrievalCloudDialog.value = true;
};

const saveRetrievalCloudConfig = () => {
  if (retrievalCloudConfig.value.apiKey.trim()) {
    retrievalModelStatus.value = true;
    retrievalModelInfo.value = {
      name: '云端检索模型',
      size: '云端服务'
    };
    showRetrievalCloudDialog.value = false;
  }
};

// 语音合成引擎相关方法
const importTtsModel = () => {
  ttsFileInput.value.click();
};

const handleTtsFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    ttsModelInfo.value = {
      name: file.name,
      size: formatFileSize(file.size)
    };
    ttsModelStatus.value = true;
  }
};

const removeTtsModel = () => {
  ttsModelStatus.value = false;
  ttsModelInfo.value = null;
  hasRecording.value = false;
};

const openTtsCloudDialog = () => {
  showTtsCloudDialog.value = true;
};

const saveTtsCloudConfig = () => {
  if (ttsCloudConfig.value.apiKey.trim()) {
    ttsModelStatus.value = true;
    ttsModelInfo.value = {
      name: '云端语音合成模型',
      size: '云端服务'
    };
    showTtsCloudDialog.value = false;
  }
};

const startRecording = () => {
  isRecording.value = true;
  recordingTime.value = 0;
  
  // 模拟录音计时
  const timer = setInterval(() => {
    recordingTime.value += 0.1;
    if (recordingTime.value >= 15) {
      clearInterval(timer);
      stopRecording();
    }
  }, 100);
};

const stopRecording = () => {
  isRecording.value = false;
  if (recordingTime.value >= 3) {
    hasRecording.value = true;
  }
};

const openVoiceRecordingDialog = () => {
  showVoiceRecordingDialog.value = true;
};

const testVoiceClone = () => {
  // 直接播放预设语音，无需任何UI反馈
  // 模拟播放音频
  const audio = new Audio(); // 假设这里会加载内置的音频
  audio.play();
};

// 对话模型相关方法
const importChatModel = () => {
  chatFileInput.value.click();
};

const handleChatFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    chatModelInfo.value = {
      name: file.name,
      size: formatFileSize(file.size)
    };
    chatModelStatus.value = true;
  }
};

const removeChatModel = () => {
  chatModelStatus.value = false;
  chatModelInfo.value = null;
};

const openChatCloudDialog = () => {
  showChatCloudDialog.value = true;
};

const saveChatCloudConfig = () => {
  if (chatCloudConfig.value.apiKey.trim()) {
    chatModelStatus.value = true;
    chatModelInfo.value = {
      name: '云端对话模型',
      size: '云端服务'
    };
    showChatCloudDialog.value = false;
  }
};
</script>

<style scoped>
.page-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  height: 1000px;
  overflow-y: auto;
}

.models-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.model-card {
  margin-bottom: 5px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.model-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-content {
  padding: 10px 0;
}

.model-description {
  margin-bottom: 15px;
}

.model-description p {
  line-height: 1.5;
  color: #555;
  margin-bottom: 10px;
}

.compact-requirements {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 10px;
}

.requirements-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}

.requirements-content {
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
}

.model-info {
  background-color: #e8f4f8;
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 10px;
  border-left: 4px solid #409eff;
}

.model-info p {
  margin: 2px 0;
  font-size: 0.9em;
}

.model-name {
  color: #333;
  font-weight: 600;
}

.model-size {
  color: #666;
}

/* 声音录制对话框样式 */
.voice-recording-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 0 10px 0;
}

.voice-recording-info {
  margin-bottom: 10px;
}

.sample-text-container {
  margin-bottom: 10px;
}

.sample-text {
  margin-bottom: 6px;
  color: #666;
}

.sample-content {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;
  font-weight: 500;
}

.recording-actions {
  display: flex;
  gap: 10px;
}

/* 云端配置对话框样式 */
.cloud-config-container {
  padding: 0 0 10px 0;
}
</style> 