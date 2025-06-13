<template>
  <div class="page-container">
    <div class="content-wrapper">
      <!-- 左侧区域：热门话题 -->
      <div class="left-column">
        <el-card class="box-card hot-topics">
          <template #header>
            <div class="card-header">
              <span>热门话题</span>
              <el-button type="primary" @click="generateHotTopics" :loading="isGeneratingHotTopics">
                {{ isGeneratingHotTopics ? 'AI正在生成热门话题' : 'AI生成热门话题' }}
              </el-button>
            </div>
          </template>
          <div class="card-content">
            <el-scrollbar>
              <div>
                <div v-for="(topic, index) in hotTopics" :key="index" class="topic-item">
                  <div class="topic-content">
                    <span class="topic-text">{{ topic.content }}</span>
                  </div>
                  <div class="topic-actions">
                    <el-tooltip content="添加到我的话题" placement="top">
                      <el-button type="primary" circle @click="addToMyTopics(topic)">
                        <el-icon>
                          <el-icon-plus/>
                        </el-icon>
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
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>我的话题</span>
              <el-button type="primary" @click="showAddTopicDialog">
                添加话题
              </el-button>
            </div>
          </template>
          <div class="card-content">
            <el-scrollbar height="320px">
              <div>
                <div v-for="(topic, index) in customTopics" :key="index" class="topic-item">
                  <div class="topic-content">
                    <el-tag
                        size="small"
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
                          <el-icon-open v-if="!topic.enabled"/>
                          <el-icon-turn-off v-else/>
                        </el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="编辑" placement="top">
                      <el-button type="primary" circle @click="editTopic(topic)">
                        <el-icon>
                          <el-icon-edit/>
                        </el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                      <el-button type="danger" circle @click="deleteTopic(topic, 'custom')">
                        <el-icon>
                          <el-icon-delete/>
                        </el-icon>
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

         禁止话题区域
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>禁止话题</span>
              <el-button type="danger" @click="showAddForbiddenDialog">
                添加禁止话题
              </el-button>
            </div>
          </template>
          <div class="card-content">
            <el-scrollbar height="320px">
              <div>
                <div v-for="(topic, index) in forbiddenTopics" :key="index" class="topic-item">
                  <div class="topic-content">
                    <span class="topic-text">{{ topic.content }}</span>
                  </div>
                  <div class="topic-actions">
                    <el-tooltip content="编辑" placement="top">
                      <el-button type="primary" circle @click="editForbiddenTopic(topic)">
                        <el-icon>
                          <el-icon-edit/>
                        </el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                      <el-button type="danger" circle @click="deleteTopic(topic, 'forbidden')">
                        <el-icon>
                          <el-icon-delete/>
                        </el-icon>
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
import {ref, reactive, onMounted} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {
  Plus as ElIconPlus,
  Edit as ElIconEdit,
  Delete as ElIconDelete,
  Open as ElIconOpen,
  TurnOff as ElIconTurnOff
} from '@element-plus/icons-vue';
import TopicService from '@/services/topicService';

// 话题数据
const hotTopics = ref([]);
const customTopics = ref([]);
const forbiddenTopics = ref([]);

// 对话框控制
const addTopicDialogVisible = ref(false);
const addForbiddenDialogVisible = ref(false);
const isEditing = ref(false);
const editingTopicId = ref(null);

// 新话题表单数据
const newTopic = reactive({
  content: ''
});

const newForbiddenTopic = reactive({
  content: ''
});

// 加载状态
const isLoadingTopics = ref(false);
const isLoadingBlocks = ref(false);
const isGeneratingHotTopics = ref(false);

// 页面挂载时加载数据
onMounted(async () => {
  await loadTopics();
  await loadBlocks();
});

// 加载话题列表
const loadTopics = async () => {
  isLoadingTopics.value = true;
  try {
    const topics = await TopicService.getTopicList();
    customTopics.value = topics.map(topic => ({
      id: topic.id,
      content: topic.name,
      enabled: topic.enabled
    }));
  } catch (error) {
    ElMessage.error('加载话题列表失败');
    console.error('加载话题列表失败:', error);
  } finally {
    isLoadingTopics.value = false;
  }
};

// 加载屏蔽话题列表
const loadBlocks = async () => {
  isLoadingBlocks.value = true;
  try {
    const blocks = await TopicService.getBlocksList();
    forbiddenTopics.value = blocks.map(block => ({
      id: block.id,
      content: block.name,
      enabled: true // 屏蔽话题默认启用
    }));
  } catch (error) {
    ElMessage.error('加载屏蔽话题列表失败');
    console.error('加载屏蔽话题列表失败:', error);
  } finally {
    isLoadingBlocks.value = false;
  }
};

// 显示添加话题对话框
const showAddTopicDialog = () => {
  isEditing.value = false;
  newTopic.content = '';
  addTopicDialogVisible.value = true;
};

// 显示添加禁止话题对话框
const showAddForbiddenDialog = () => {
  isEditing.value = false;
  newForbiddenTopic.content = '';
  addForbiddenDialogVisible.value = true;
};

// 添加热门话题到我的话题
const addToMyTopics = async (topic) => {
  try {
    const newTopic = await TopicService.addTopic(topic.content);
    customTopics.value.push({
      id: newTopic.id,
      content: newTopic.name,
      enabled: newTopic.enabled
    });
    ElMessage.success('话题已添加到我的话题');
  } catch (error) {
    ElMessage.error('添加话题失败');
    console.error('添加话题失败:', error);
  }
};

// 切换话题状态
const toggleTopicStatus = async (topic, type) => {
  try {
    let result;
    if (topic.enabled) {
      result = await TopicService.disableTopic(topic.id);
    } else {
      result = await TopicService.enableTopic(topic.id);
    }

    if (result) {
      const index = customTopics.value.findIndex(t => t.id === topic.id);
      if (index !== -1) {
        customTopics.value[index].enabled = !customTopics.value[index].enabled;
        ElMessage.success(`话题已${customTopics.value[index].enabled ? '启用' : '关闭'}`);
      }
    } else {
      ElMessage.error('切换话题状态失败');
    }
  } catch (error) {
    ElMessage.error('切换话题状态失败');
    console.error('切换话题状态失败:', error);
  }
};

// 保存自定义话题
const saveCustomTopic = async () => {
  if (!newTopic.content.trim()) {
    ElMessage.warning('话题内容不能为空');
    return;
  }

  try {
    if (isEditing.value) {
      const result = await TopicService.updateTopic(editingTopicId.value, newTopic.content);
      if (result) {
        const index = customTopics.value.findIndex(item => item.id === editingTopicId.value);
        if (index !== -1) {
          customTopics.value[index] = {
            ...customTopics.value[index],
            content: newTopic.content
          };
          ElMessage.success('话题更新成功');
        }
      } else {
        ElMessage.error('话题更新失败');
      }
    } else {
      const topic = await TopicService.addTopic(newTopic.content);
      customTopics.value.push({
        id: topic.id,
        content: topic.name,
        enabled: topic.enabled
      });
      ElMessage.success('话题添加成功');
    }

    addTopicDialogVisible.value = false;
  } catch (error) {
    ElMessage.error(isEditing.value ? '话题更新失败' : '话题添加失败');
    console.error('保存话题失败:', error);
  }
};

// 保存禁止话题
const saveForbiddenTopic = async () => {
  if (!newForbiddenTopic.content.trim()) {
    ElMessage.warning('话题内容不能为空');
    return;
  }

  try {
    if (isEditing.value) {
      const result = await TopicService.updateBlock(editingTopicId.value, newForbiddenTopic.content);
      if (result) {
        const index = forbiddenTopics.value.findIndex(item => item.id === editingTopicId.value);
        if (index !== -1) {
          forbiddenTopics.value[index] = {
            ...forbiddenTopics.value[index],
            content: newForbiddenTopic.content
          };
          ElMessage.success('禁止话题更新成功');
        }
      } else {
        ElMessage.error('禁止话题更新失败');
      }
    } else {
      const block = await TopicService.addBlock(newForbiddenTopic.content);
      forbiddenTopics.value.push({
        id: block.id,
        content: block.name,
        enabled: true
      });
      ElMessage.success('禁止话题添加成功');
    }

    addForbiddenDialogVisible.value = false;
  } catch (error) {
    ElMessage.error(isEditing.value ? '禁止话题更新失败' : '禁止话题添加失败');
    console.error('保存禁止话题失败:', error);
  }
};

// 编辑自定义话题
const editTopic = (topic) => {
  isEditing.value = true;
  editingTopicId.value = topic.id;
  newTopic.content = topic.content;
  addTopicDialogVisible.value = true;
};

// 编辑禁止话题
const editForbiddenTopic = (topic) => {
  isEditing.value = true;
  editingTopicId.value = topic.id;
  newForbiddenTopic.content = topic.content;
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
      .then(async () => {
        try {
          if (type === 'custom') {
            // 删除自定义话题
            const result = await TopicService.removeTopic(topic.id);
            if (result) {
              const index = customTopics.value.findIndex(t => t.id === topic.id);
              if (index !== -1) {
                customTopics.value.splice(index, 1);
                ElMessage.success('话题删除成功');
              }
            } else {
              ElMessage.error('话题删除失败');
            }
          } else if (type === 'forbidden') {
            // 删除禁止话题，使用name而不是id
            const result = await TopicService.removeBlock(topic.content);
            if (result) {
              const index = forbiddenTopics.value.findIndex(t => t.id === topic.id);
              if (index !== -1) {
                forbiddenTopics.value.splice(index, 1);
                ElMessage.success('禁止话题删除成功');
              }
            } else {
              ElMessage.error('禁止话题删除失败');
            }
          }
        } catch (error) {
          ElMessage.error('删除失败');
          console.error('删除话题失败:', error);
        }
      })
      .catch(() => {
        // 取消删除
      });
};

// 使用AI生成热门话题
const generateHotTopics = async () => {
  if (isGeneratingHotTopics.value) return; // 防止重复点击

  isGeneratingHotTopics.value = true;
  try {
    const aiTopics = await TopicService.generateHotTopicByAI();

    // 清空现有热门话题
    hotTopics.value = [];

    // 添加AI生成的话题
    aiTopics.forEach((topic, index) => {
      hotTopics.value.push({
        id: index + 1,
        content: topic,
        tag: '热门'
      });
    });

    ElMessage.success(`AI已生成${aiTopics.length}个热门话题`);
  } catch (error) {
    ElMessage.error(error)
  } finally {
    isGeneratingHotTopics.value = false;
  }
};
</script>

<style scoped>
.page-container {
  padding: 20px 0;
  box-sizing: border-box;
}

.content-wrapper {
  width: 1300px;
  height: 900px;
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

.box-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  flex-shrink: 0;
}

.topic-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
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