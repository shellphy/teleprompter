<template>
  <div class="page-container">
    <div class="page-header">
      <h1>模型管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="openCloudConfigDialog">配置云端模型</el-button>
        <el-button type="success" @click="openChatModelDialog">导入本地对话模型</el-button>
        <el-button type="info" @click="openVectorModelDialog">导入本地向量模型</el-button>
        <el-button type="warning" @click="openTtsModelDialog">导入本地语音模型</el-button>
        <el-button type="primary" @click="openVoiceRecordingDialog">录制语音样本</el-button>
      </div>
    </div>

    <div class="content-area">
      <div class="welcome-card">
        <h2>欢迎使用AI直播助手</h2>
        <p>请使用右上角的按钮来配置您的AI模型。您可以选择云端模型或导入本地模型来开始使用。</p>
        <div v-if="cloudConfig.apiKey" class="status-info">
          <el-tag type="success">MiniMax API 已配置</el-tag>
        </div>
      </div>
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

    <!-- 云端模型配置对话框 -->
    <el-dialog
      v-model="showCloudConfigDialog"
      title="配置云端模型"
      width="60%"
    >
      <div class="cloud-config-container">
        <div class="platform-intro">
          <h3>MiniMax AI平台</h3>
          <el-alert
            title="关于MiniMax"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>MiniMax是一家专注于通用人工智能技术的公司，提供高质量的大语言模型和多模态AI服务。通过MiniMax API，您可以获得：</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>强大的自然语言理解和生成能力</li>
                <li>多模态内容处理（文本、语音、图像）</li>
                <li>高效稳定的云端服务</li>
                <li>灵活的API调用方式</li>
              </ul>
              <p>请访问 <a href="https://api.minimax.chat/" target="_blank" style="color: #409eff;">MiniMax官网</a> 获取您的API Key。</p>
            </template>
          </el-alert>
        </div>
        
        <el-form :model="cloudConfig" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="API Key">
            <el-input 
              v-model="cloudConfig.apiKey" 
              placeholder="请输入您的MiniMax API Key"
              show-password
            />
          </el-form-item>
        </el-form>
        
      </div>
      <template #footer>
        <el-button @click="showCloudConfigDialog = false">取消</el-button>
        <el-button type="info" @click="testApiKey" :loading="isTestingApiKey">
          {{ isTestingApiKey ? '测试中...' : '测试连接' }}
        </el-button>
        <el-button type="primary" @click="saveCloudConfig" :loading="isSavingConfig">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话模型对话框 -->
    <el-dialog
      v-model="showChatModelDialog"
      title="导入对话模型"
      width="50%"
    >
      <div class="import-dialog-container">
        <el-alert
          title="导入本地对话模型"
          type="info"
          description="请选择您要导入的对话模型文件（支持 .gguf, .bin 格式）"
          :closable="false"
          show-icon
        />
        <div class="import-actions" style="margin-top: 20px;">
          <el-button type="primary" @click="selectChatModelFile">选择文件</el-button>
          <input ref="chatFileInput" type="file" style="display: none" accept=".gguf,.bin">
        </div>
      </div>
      <template #footer>
        <el-button @click="showChatModelDialog = false">取消</el-button>
        <el-button type="primary">导入</el-button>
      </template>
    </el-dialog>

    <!-- 导入语音模型对话框 -->
    <el-dialog
      v-model="showTtsModelDialog"
      title="导入语音模型"
      width="50%"
    >
      <div class="import-dialog-container">
        <el-alert
          title="导入本地语音模型"
          type="info"
          description="请选择您要导入的语音合成模型文件（支持 .pth, .onnx 格式）"
          :closable="false"
          show-icon
        />
        <div class="import-actions" style="margin-top: 20px;">
          <el-button type="primary" @click="selectTtsModelFile">选择文件</el-button>
          <input ref="ttsFileInput" type="file" style="display: none" accept=".pth,.onnx">
        </div>
      </div>
      <template #footer>
        <el-button @click="showTtsModelDialog = false">取消</el-button>
        <el-button type="primary">导入</el-button>
      </template>
    </el-dialog>

    <!-- 导入向量模型对话框 -->
    <el-dialog
      v-model="showVectorModelDialog"
      title="导入向量模型"
      width="50%"
    >
      <div class="import-dialog-container">
        <el-alert
          title="导入本地向量模型"
          type="info"
          description="请选择您要导入的向量模型文件（支持 .gguf, .onnx 格式）"
          :closable="false"
          show-icon
        />
        <div class="import-actions" style="margin-top: 20px;">
          <el-button type="primary" @click="selectVectorModelFile">选择文件</el-button>
          <input ref="vectorFileInput" type="file" style="display: none" accept=".gguf,.onnx">
        </div>
      </div>
      <template #footer>
        <el-button @click="showVectorModelDialog = false">取消</el-button>
        <el-button type="primary">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  ElButton, 
  ElDialog,
  ElAlert,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTag
} from 'element-plus';
import SettingService from '@/services/settingService';
import type { SettingApi } from '@/types/api';

// 录制语音相关状态
const isRecording = ref(false);
const recordingTime = ref(0);
const hasRecording = ref(false);
const showVoiceRecordingDialog = ref(false);

// 对话框状态
const showCloudConfigDialog = ref(false);
const showChatModelDialog = ref(false);
const showTtsModelDialog = ref(false);
const showVectorModelDialog = ref(false);

// 配置数据
const cloudConfig = ref<SettingApi.CloudConfig>({ apiKey: '' });

// 加载状态
const isTestingApiKey = ref(false);
const isSavingConfig = ref(false);

// 文件输入引用
const chatFileInput = ref<HTMLInputElement | null>(null);
const ttsFileInput = ref<HTMLInputElement | null>(null);
const vectorFileInput = ref<HTMLInputElement | null>(null);

// 页面挂载时加载已保存的配置
onMounted(async () => {
  await loadSavedConfig();
});

// 加载已保存的配置
const loadSavedConfig = async () => {
  try {
    const response = await SettingService.getMiniMaxApiKey();
    if (response.apiKey) {
      cloudConfig.value.apiKey = response.apiKey;
    }
  } catch (error) {
    // 如果没有保存的配置，忽略错误
    console.log('没有找到已保存的API Key配置');
  }
};

// 测试API Key
const testApiKey = async () => {
  if (!cloudConfig.value.apiKey.trim()) {
    ElMessage.error('请先输入API Key');
    return;
  }
  
  isTestingApiKey.value = true;
  try {
    const response = await SettingService.testMiniMaxApiKey(cloudConfig.value.apiKey);
    
    if (response.success) {
      ElMessage.success('API Key 测试成功！');
    } else {
      ElMessage.error(`API Key 测试失败：${response.failureReason || '未知错误'}`);
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '测试API Key时发生错误');
    console.error('测试API Key错误:', error);
  } finally {
    isTestingApiKey.value = false;
  }
};

// 录制语音相关方法
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

// 对话框打开方法
const openCloudConfigDialog = () => {
  showCloudConfigDialog.value = true;
};

const openChatModelDialog = () => {
  showChatModelDialog.value = true;
};

const openTtsModelDialog = () => {
  showTtsModelDialog.value = true;
};

const openVectorModelDialog = () => {
  showVectorModelDialog.value = true;
};

// 配置保存方法
const saveCloudConfig = async () => {
  if (!cloudConfig.value.apiKey.trim()) {
    ElMessage.error('请输入有效的API Key');
    return;
  }

  isSavingConfig.value = true;
  try {
    const result = await SettingService.validateAndSaveMiniMaxApiKey(cloudConfig.value.apiKey);
    
    if (result.success) {
      ElMessage.success(result.message);
      showCloudConfigDialog.value = false;
    } else {
      ElMessage.error(`API Key无效：${result.message}`);
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存配置时发生错误');
    console.error('保存配置错误:', error);
  } finally {
    isSavingConfig.value = false;
  }
};

// 文件选择方法
const selectChatModelFile = () => {
  chatFileInput.value?.click();
};

const selectTtsModelFile = () => {
  ttsFileInput.value?.click();
};

const selectVectorModelFile = () => {
  vectorFileInput.value?.click();
};
</script>

<style scoped>
.page-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  height: 100vh;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e6e6e6;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.content-area {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.welcome-card {
  text-align: center;
  padding: 40px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 600px;
}

.welcome-card h2 {
  margin-bottom: 15px;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.welcome-card p {
  margin-bottom: 25px;
  color: #666;
  font-size: 16px;
  line-height: 1.6;
}

.status-info {
  margin-top: 20px;
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
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 12px;
  font-weight: 500;
  line-height: 1.5;
}

.recording-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* 云端配置对话框样式 */
.cloud-config-container {
  padding: 0 0 10px 0;
}

.platform-intro {
  margin-bottom: 20px;
}

.platform-intro h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 20px;
}

.platform-intro ul {
  color: #666;
}

.platform-intro li {
  margin-bottom: 5px;
}



/* 导入对话框样式 */
.import-dialog-container {
  padding: 0 0 10px 0;
}

.import-actions {
  text-align: center;
}
</style> 