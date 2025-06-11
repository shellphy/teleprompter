<template>
  <div class="page-container">
    <div class="content-wrapper">
      <!-- 左侧区域：热门话题 -->
      <div class="left-column">
        <el-card class="box-card hot-topics">
          <template #header>
            <div class="card-header">
              <span>热门话题</span>
              <el-button type="primary" @click="generateHotTopics">
                AI生成热门话题
              </el-button>
            </div>
          </template>
          <div class="card-content">
            <el-scrollbar>
              <div class="topics-list">
                <div v-for="(topic, index) in hotTopics" :key="index" class="topic-item">
                  <div class="topic-content">
                    <el-tag size="medium" type="success" class="topic-tag">热门</el-tag>
                    <span class="topic-text">{{ topic.content }}</span>
                  </div>
                  <div class="topic-actions">
                    <el-tooltip content="添加到我的话题" placement="top">
                      <el-button type="primary" circle @click="addToMyTopics(topic)">
                        <el-icon><el-icon-plus /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
                <div v-if="hotTopics.length === 0" class="empty-message">
                  暂无热门话题，点击"AI生成热门话题"按钮生成
                </div>
              </div>
            </el-scrollbar>
          </div>
        </el-card>
      </div>

      <!-- 右侧区域：我的话题和禁止话题 -->
      <div class="right-column">
        <!-- 我的话题区域 -->
        <el-card class="box-card my-topics">
          <template #header>
            <div class="card-header">
              <span>我的话题</span>
              <el-button type="primary" @click="showAddTopicDialog">
                添加话题
              </el-button>
            </div>
          </template>
          <div class="card-content">
            <el-scrollbar>
              <div class="topics-list">
                <div v-for="(topic, index) in customTopics" :key="index" class="topic-item">
                  <div class="topic-content">
                    <el-tag 
                      size="medium" 
                      :type="topic.enabled ? 'primary' : 'info'" 
                      class="topic-tag"
                    >
                      {{ topic.enabled ? '已启用' : '已关闭' }}
                    </el-tag>
                    <span class="topic-text">{{ topic.content }}</span>
                  </div>
                  <div class="topic-actions">
                    <el-tooltip :content="topic.enabled ? '关闭话题' : '启用话题'" placement="top">
                      <el-button 
                        :type="topic.enabled ? 'warning' : 'success'" 
                        circle 
                        @click="toggleTopicStatus(topic, 'custom')"
                      >
                        <el-icon>
                          <el-icon-open v-if="!topic.enabled" />
                          <el-icon-turn-off v-else />
                        </el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="编辑" placement="top">
                      <el-button type="primary" circle @click="editTopic(topic)">
                        <el-icon><el-icon-edit /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                      <el-button type="danger" circle @click="deleteTopic(topic, 'custom')">
                        <el-icon><el-icon-delete /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
                <div v-if="customTopics.length === 0" class="empty-message">
                  暂无我的话题，可以从热门话题添加或点击"添加话题"按钮创建
                </div>
              </div>
            </el-scrollbar>
          </div>
        </el-card>

        <!-- 禁止话题区域 -->
        <el-card class="box-card forbidden-topics">
          <template #header>
            <div class="card-header">
              <span>禁止话题</span>
              <el-button type="danger" @click="showAddForbiddenDialog">
                添加禁止话题
              </el-button>
            </div>
          </template>
          <div class="card-content">
            <el-scrollbar>
              <div class="topics-list">
                <div v-for="(topic, index) in forbiddenTopics" :key="index" class="topic-item">
                  <div class="topic-content">
                    <el-tag 
                      size="medium" 
                      :type="topic.enabled ? 'danger' : 'info'" 
                      class="topic-tag"
                    >
                      {{ topic.enabled ? '已启用' : '已关闭' }}
                    </el-tag>
                    <span class="topic-text">{{ topic.content }}</span>
                  </div>
                  <div class="topic-actions">
                    <el-tooltip :content="topic.enabled ? '关闭禁止' : '启用禁止'" placement="top">
                      <el-button 
                        :type="topic.enabled ? 'warning' : 'danger'" 
                        circle 
                        @click="toggleTopicStatus(topic, 'forbidden')"
                      >
                        <el-icon>
                          <el-icon-open v-if="!topic.enabled" />
                          <el-icon-turn-off v-else />
                        </el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="编辑" placement="top">
                      <el-button type="primary" circle @click="editForbiddenTopic(topic)">
                        <el-icon><el-icon-edit /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                      <el-button type="danger" circle @click="deleteTopic(topic, 'forbidden')">
                        <el-icon><el-icon-delete /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
                <div v-if="forbiddenTopics.length === 0" class="empty-message">
                  暂无禁止话题，点击"添加禁止话题"按钮添加
                </div>
              </div>
            </el-scrollbar>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 添加自定义话题对话框 -->
    <el-dialog v-model="addTopicDialogVisible" title="添加自定义话题" width="500px">
      <el-form :model="newTopic" label-width="80px">
        <el-form-item label="话题内容">
          <el-input 
            v-model="newTopic.content" 
            type="textarea" 
            :rows="4"
            placeholder="请输入话题内容"
          ></el-input>
        </el-form-item>
        <el-form-item label="话题标签">
          <el-input 
            v-model="newTopic.tag" 
            placeholder="请输入标签，用于分类（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addTopicDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCustomTopic">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加禁止话题对话框 -->
    <el-dialog v-model="addForbiddenDialogVisible" title="添加禁止话题" width="500px">
      <el-form :model="newForbiddenTopic" label-width="80px">
        <el-form-item label="话题内容">
          <el-input 
            v-model="newForbiddenTopic.content" 
            type="textarea" 
            :rows="4"
            placeholder="请输入禁止话题内容"
          ></el-input>
        </el-form-item>
        <el-form-item label="禁止原因">
          <el-input 
            v-model="newForbiddenTopic.reason" 
            type="textarea"
            :rows="2"
            placeholder="请输入禁止原因（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addForbiddenDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveForbiddenTopic">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus as ElIconPlus,
  Edit as ElIconEdit,
  Delete as ElIconDelete,
  Open as ElIconOpen,
  TurnOff as ElIconTurnOff
} from '@element-plus/icons-vue';

// 话题数据
const hotTopics = ref([
  { id: 1, content: '最近热播的电视剧《人生若如初相见》有哪些看点？', tag: '娱乐' },
  { id: 2, content: '现在年轻人为什么都喜欢做副业？', tag: '社会' },
  { id: 3, content: '如何看待近期的科技行业发展趋势？', tag: '科技' },
  { id: 4, content: '夏季如何做好皮肤防晒工作？', tag: '美妆' },
  { id: 5, content: '直播间有没有喜欢旅游的朋友？最近有什么好的旅游目的地推荐？', tag: '旅游' }
]);

const customTopics = ref([
  { id: 1, content: '分享一下你最近买的最满意的一款护肤品', tag: '互动', enabled: true },
  { id: 2, content: '你们平时用什么方法缓解工作压力？', tag: '生活', enabled: false }
]);

const forbiddenTopics = ref([
  { id: 1, content: '政治敏感话题', reason: '可能引发争议', enabled: true },
  { id: 2, content: '竞品比较和负面评价', reason: '违反平台规定', enabled: true },
  { id: 3, content: '价格投诉和纠纷', reason: '应通过官方客服渠道解决', enabled: false }
]);

// 对话框控制
const addTopicDialogVisible = ref(false);
const addForbiddenDialogVisible = ref(false);
const isEditing = ref(false);
const editingTopicId = ref(null);

// 新话题表单数据
const newTopic = reactive({
  content: '',
  tag: ''
});

const newForbiddenTopic = reactive({
  content: '',
  reason: ''
});

// 显示添加话题对话框
const showAddTopicDialog = () => {
  isEditing.value = false;
  newTopic.content = '';
  newTopic.tag = '';
  addTopicDialogVisible.value = true;
};

// 显示添加禁止话题对话框
const showAddForbiddenDialog = () => {
  isEditing.value = false;
  newForbiddenTopic.content = '';
  newForbiddenTopic.reason = '';
  addForbiddenDialogVisible.value = true;
};

// 添加热门话题到我的话题
const addToMyTopics = (topic) => {
  // 检查是否已经存在
  const exists = customTopics.value.some(t => t.content === topic.content);
  if (exists) {
    ElMessage.warning('该话题已在我的话题列表中');
    return;
  }

  const newId = customTopics.value.length > 0 
    ? Math.max(...customTopics.value.map(t => t.id)) + 1 
    : 1;

  customTopics.value.push({
    id: newId,
    content: topic.content,
    tag: topic.tag,
    enabled: true
  });

  ElMessage.success('话题已添加到我的话题');
};

// 切换话题状态
const toggleTopicStatus = (topic, type) => {
  if (type === 'custom') {
    const index = customTopics.value.findIndex(t => t.id === topic.id);
    if (index !== -1) {
      customTopics.value[index].enabled = !customTopics.value[index].enabled;
      ElMessage.success(`话题已${customTopics.value[index].enabled ? '启用' : '关闭'}`);
    }
  } else if (type === 'forbidden') {
    const index = forbiddenTopics.value.findIndex(t => t.id === topic.id);
    if (index !== -1) {
      forbiddenTopics.value[index].enabled = !forbiddenTopics.value[index].enabled;
      ElMessage.success(`禁止话题已${forbiddenTopics.value[index].enabled ? '启用' : '关闭'}`);
    }
  }
};

// 保存自定义话题
const saveCustomTopic = () => {
  if (!newTopic.content.trim()) {
    ElMessage.warning('话题内容不能为空');
    return;
  }
  
  if (isEditing.value) {
    const index = customTopics.value.findIndex(item => item.id === editingTopicId.value);
    if (index !== -1) {
      customTopics.value[index] = {
        ...customTopics.value[index],
        content: newTopic.content,
        tag: newTopic.tag
      };
      ElMessage.success('话题更新成功');
    }
  } else {
    const newId = customTopics.value.length > 0 
      ? Math.max(...customTopics.value.map(t => t.id)) + 1 
      : 1;
    
    customTopics.value.push({
      id: newId,
      content: newTopic.content,
      tag: newTopic.tag,
      enabled: true // 新添加的话题默认启用
    });
    ElMessage.success('话题添加成功');
  }
  
  addTopicDialogVisible.value = false;
};

// 保存禁止话题
const saveForbiddenTopic = () => {
  if (!newForbiddenTopic.content.trim()) {
    ElMessage.warning('话题内容不能为空');
    return;
  }
  
  if (isEditing.value) {
    const index = forbiddenTopics.value.findIndex(item => item.id === editingTopicId.value);
    if (index !== -1) {
      forbiddenTopics.value[index] = {
        ...forbiddenTopics.value[index],
        content: newForbiddenTopic.content,
        reason: newForbiddenTopic.reason
      };
      ElMessage.success('禁止话题更新成功');
    }
  } else {
    const newId = forbiddenTopics.value.length > 0 
      ? Math.max(...forbiddenTopics.value.map(t => t.id)) + 1 
      : 1;
    
    forbiddenTopics.value.push({
      id: newId,
      content: newForbiddenTopic.content,
      reason: newForbiddenTopic.reason,
      enabled: true // 新添加的禁止话题默认启用
    });
    ElMessage.success('禁止话题添加成功');
  }
  
  addForbiddenDialogVisible.value = false;
};

// 编辑自定义话题
const editTopic = (topic) => {
  isEditing.value = true;
  editingTopicId.value = topic.id;
  newTopic.content = topic.content;
  newTopic.tag = topic.tag || '';
  addTopicDialogVisible.value = true;
};

// 编辑禁止话题
const editForbiddenTopic = (topic) => {
  isEditing.value = true;
  editingTopicId.value = topic.id;
  newForbiddenTopic.content = topic.content;
  newForbiddenTopic.reason = topic.reason || '';
  addForbiddenDialogVisible.value = true;
};

// 删除话题
const deleteTopic = (topic, type) => {
  ElMessageBox.confirm(
    '确定要删除这个话题吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      if (type === 'hot') {
        hotTopics.value = hotTopics.value.filter(item => item.id !== topic.id);
      } else if (type === 'custom') {
        customTopics.value = customTopics.value.filter(item => item.id !== topic.id);
      } else if (type === 'forbidden') {
        forbiddenTopics.value = forbiddenTopics.value.filter(item => item.id !== topic.id);
      }
      ElMessage.success('删除成功');
    })
    .catch(() => {
      // 取消删除
    });
};

// 使用AI生成热门话题
const generateHotTopics = () => {
  // 模拟AI生成话题
  setTimeout(() => {
    const aiGeneratedTopics = [
      { content: '618购物节你们都准备买什么好物？', tag: '购物' },
      { content: '如何看待近期的职场"静默辞职"现象？', tag: '职场' },
      { content: '夏季穿搭有什么好的建议？', tag: '时尚' }
    ];
    
    const newId = hotTopics.value.length > 0 
      ? Math.max(...hotTopics.value.map(t => t.id)) + 1 
      : 1;
    
    aiGeneratedTopics.forEach((topic, index) => {
      hotTopics.value.push({
        id: newId + index,
        content: topic.content,
        tag: topic.tag
      });
    });
    
    ElMessage.success('AI已生成3个热门话题');
  }, 1000);
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
  overflow: hidden;
}

.left-column {
  width: 500px;
  margin-right: 20px;
}

.right-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hot-topics {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
  overflow: hidden;
}

.hot-topics:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.my-topics, .forbidden-topics {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
  overflow: hidden;
}

.my-topics:hover, .forbidden-topics:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.box-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-content {
  flex: 1;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 0 10px;
  border-bottom: 1px solid #ebeef5;
  background: #f9fafb;
  flex-shrink: 0;
}

.topics-list {
  padding: 10px 0;
}

.topic-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.topic-item:last-child {
  border-bottom: none;
}

.topic-content {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.topic-tag {
  margin-right: 10px;
  flex-shrink: 0;
}

.topic-text {
  flex: 1;
  white-space: normal;
  word-break: break-word;
}

.topic-actions {
  display: flex;
  gap: 8px;
  margin-left: 10px;
}

.empty-message {
  padding: 20px;
  text-align: center;
  color: #909399;
}
</style> 