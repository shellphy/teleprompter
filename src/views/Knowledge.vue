<template>
  <div class="page-container">
    <div class="content-wrapper">
      <div class="knowledge-layout">
        <!-- 左侧分类管理区 -->
        <div class="category-panel">
          <div class="panel-header">
            <h3>知识库分类</h3>
            <el-button type="primary" @click="showCategoryDialog = true">
              <el-icon><Plus /></el-icon>添加分类
            </el-button>
          </div>
          <el-tree
            :data="categories"
            :props="{ label: 'name' }"
            highlight-current
            @node-click="handleCategorySelect"
          >
            <template #default="{ node, data }">
              <div class="category-item">
                <span>{{ node.label }}</span>
                <span class="doc-count">({{ data.count || 0 }})</span>
                <div class="category-actions">
                  <el-icon @click.stop="editCategory(data)"><Edit /></el-icon>
                  <el-icon @click.stop="confirmDeleteCategory(data)"><Delete /></el-icon>
                </div>
              </div>
            </template>
          </el-tree>
        </div>

        <!-- 右侧文档管理区 -->
        <div class="document-panel">
          <!-- 工具栏区域 - 重新布局 -->
          <div class="toolbar">
            <!-- 上传按钮 - 放在最左侧 -->
            <el-upload
              class="upload-area"
              :limit="1"
              accept=".docx"
              :auto-upload="true"
              :show-file-list="false"
              :http-request="handleFileUpload"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>上传Word文档
              </el-button>
            </el-upload>
            
            <!-- 搜索框 - 放在中间 -->
            <div class="search-box">
              <el-input
                v-model="searchQuery"
                placeholder="搜索文档"
                prefix-icon="Search"
                clearable
                @input="searchDocuments"
              />
            </div>
            
            <!-- 快速匹配 - 直接显示输入框 -->
            <div class="match-input">
              <div class="match-input-container">
                <el-input
                  v-model="testMessage"
                  placeholder="输入直播间消息进行匹配"
                  size="default"
                  clearable
                >
                  <template #append>
                    <el-button :loading="isMatching" @click="testMatch">
                      <el-icon><Connection /></el-icon>匹配测试
                    </el-button>
                  </template>
                </el-input>
              </div>
            </div>
          </div>

          <!-- 文档列表 -->
          <div class="documents-table-container">
            <el-table 
              :data="filteredDocuments" 
              style="width: 100%" 
              class="documents-table"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="name" label="文档名称" min-width="260" />
              <el-table-column prop="categoryName" label="所属分类" width="180" />
              <el-table-column prop="uploadTime" label="上传时间" width="200" />
              <el-table-column prop="status" label="索引状态" width="150">
                <template #default="scope">
                  <el-tag :type="getStatusType(scope.row.status)">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" fixed="right">
                <template #default="scope">
                  <el-button link type="danger" @click="confirmDeleteDocument(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 批量操作和分页 -->
          <div class="table-footer">
            <div class="batch-actions">
              <el-button 
                type="danger" 
                :disabled="selectedDocuments.length === 0" 
                @click="confirmBatchDelete"
              >
                <el-icon><Delete /></el-icon>批量删除
              </el-button>
              <span v-if="selectedDocuments.length > 0" class="selection-info">
                已选择 {{ selectedDocuments.length }} 项
              </span>
            </div>
            <el-pagination
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="totalDocuments"
              :page-size="pageSize"
              :page-sizes="[10, 20, 30, 50]"
              :current-page="currentPage"
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 分类对话框 -->
    <el-dialog
      v-model="showCategoryDialog"
      :title="editingCategory ? '编辑分类' : '添加分类'"
      width="30%"
    >
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCategoryDialog = false">取消</el-button>
          <el-button type="primary" @click="saveCategory">确认</el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 确认删除对话框 -->
    <el-dialog
      v-model="showDeleteConfirm"
      title="确认删除"
      width="30%"
    >
      <div>{{ deleteConfirmMessage }}</div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteConfirm = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 匹配结果抽屉 -->
    <el-drawer
      v-model="showMatchDrawer"
      title="匹配结果"
      direction="rtl"
      size="50%"
    >
      <template #header>
        <div class="drawer-header">
          <h4 class="drawer-title">匹配结果</h4>
          <div class="drawer-subtitle">
            <el-tag type="success" v-if="matchResult.length > 0">找到 {{ matchResult.length }} 条匹配</el-tag>
            <el-tag type="info" v-else>未找到匹配</el-tag>
          </div>
        </div>
      </template>
      
      <div class="match-drawer-content">
        <!-- 搜索内容显示 -->
        <div class="search-query-display">
          <div class="search-label">搜索内容:</div>
          <div class="search-text">{{ testMessage }}</div>
        </div>
        
        <!-- 匹配结果列表 -->
        <div v-if="matchResult.length > 0" class="match-items">
          <div v-for="(result, index) in matchResult" :key="index" class="match-item">
            <div class="match-item-header">
              <div class="match-title">{{ result.title }}</div>
              <div class="match-category">
                <el-tag effect="plain">{{ result.category || '未分类' }}</el-tag>
              </div>
            </div>
            <div class="match-content">{{ result.content }}</div>
          </div>
        </div>
        
        <!-- 无匹配结果显示 -->
        <div v-else class="no-match-result">
          <el-empty description="未找到匹配结果" :image-size="80">
            <template #description>
              <p>没有找到与您输入内容相关的产品信息</p>
            </template>
          </el-empty>
        </div> 
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  ElCard, ElButton, ElTree, ElInput, ElUpload, ElTable, ElTableColumn, 
  ElTag, ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElPagination,
  ElIcon, ElTooltip, ElMessage, ElDrawer, ElEmpty
} from 'element-plus';
import { 
  Plus, Edit, Delete, Upload, Search, Connection, 
  QuestionFilled, Close
} from '@element-plus/icons-vue';

// 分类数据 - 添加更多分类以测试滚动
const categories = ref([
  { id: 1, name: '服装', count: 12 },
  { id: 2, name: '美妆', count: 8 },
  { id: 3, name: '电子产品', count: 15 },
  { id: 4, name: '食品', count: 6 },
  { id: 5, name: '家居', count: 9 },
  { id: 6, name: '母婴', count: 7 },
  { id: 7, name: '运动户外', count: 11 },
  { id: 8, name: '数码', count: 14 },
  { id: 9, name: '宠物用品', count: 5 },
  { id: 10, name: '图书', count: 10 },
  { id: 11, name: '汽车用品', count: 4 },
  { id: 12, name: '珠宝首饰', count: 8 },
  { id: 13, name: '箱包', count: 6 },
  { id: 14, name: '玩具', count: 7 },
  { id: 15, name: '医药保健', count: 9 }
]);

// 文档数据 - 添加更多文档以测试分页
const generateDocs = () => {
  const docs = [];
  const categories = ['服装', '美妆', '电子产品', '食品', '家居', '母婴', '运动户外', '数码'];
  const status = ['processed', 'processing', 'unprocessed'];
  
  for (let i = 1; i <= 50; i++) {
    const categoryIndex = Math.floor(Math.random() * 8);
    const statusIndex = Math.floor(Math.random() * 3);
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const doc = {
      id: i,
      name: `产品说明${i}.docx`,
      categoryId: categoryIndex + 1,
      categoryName: categories[categoryIndex],
      uploadTime: date.toLocaleString(),
      status: status[statusIndex],
      tags: statusIndex === 0 ? ['标签1', '标签2', '标签3'].slice(0, Math.floor(Math.random() * 3) + 1) : []
    };
    
    docs.push(doc);
  }
  
  return docs;
};

const documents = ref(generateDocs());

// 状态管理
const searchQuery = ref('');
const selectedCategoryId = ref(null);
const selectedDocuments = ref([]);
const showCategoryDialog = ref(false);
const editingCategory = ref(false);
const categoryForm = ref({ name: '', parentId: null });
const showPreviewDialog = ref(false);
const currentDocument = ref(null);
const previewContent = ref('');
const showDeleteConfirm = ref(false);
const deleteConfirmMessage = ref('');
const deleteType = ref(''); // 'document', 'category', 'batch'
const deleteId = ref(null);
const testMessage = ref('');
const matchResult = ref([]);
const showMatchDrawer = ref(false);
const isMatching = ref(false);
const selectedMatch = ref(null);
const showMatchDetailDialog = ref(false);
const generatedPrompt = ref('');

// 分页
const currentPage = ref(1);
const pageSize = ref(10);
const totalDocuments = ref(documents.value.length);

// 计算属性
const filteredDocuments = computed(() => {
  let filtered = documents.value;
  
  // 按分类筛选
  if (selectedCategoryId.value) {
    filtered = filtered.filter(doc => doc.categoryId === selectedCategoryId.value);
  }
  
  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(doc => 
      doc.name.toLowerCase().includes(query) || 
      doc.categoryName.toLowerCase().includes(query)
    );
  }
  
  // 分页 - 只是为了UI展示效果，实际上后端会处理分页
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  
  // 先计算总数
  totalDocuments.value = filtered.length;
  
  // 再返回当前页的数据
  return filtered.slice(start, end);
});

// 方法
const handleCategorySelect = (data) => {
  selectedCategoryId.value = data.id;
};

const searchDocuments = () => {
  // 重置页码
  currentPage.value = 1;
};

const handleFileUpload = (options) => {
  const file = options.file;
  // 这里应该调用后端 API 上传文件
  // 模拟上传成功
  ElMessage.success(`文件 ${file.name} 上传成功`);
  
  // 添加到文档列表
  const newDoc = {
    id: documents.value.length + 1,
    name: file.name,
    categoryId: selectedCategoryId.value || 1, // 默认分类
    categoryName: getCategoryName(selectedCategoryId.value || 1),
    uploadTime: new Date().toLocaleString(),
    status: 'unprocessed',
    tags: []
  };
  
  documents.value.push(newDoc);
  totalDocuments.value = documents.value.length;
};

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.name : '未分类';
};

const getStatusType = (status) => {
  switch (status) {
    case 'processed': return 'success';
    case 'processing': return 'warning';
    case 'unprocessed': return 'info';
    default: return 'info';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'processed': return '已处理';
    case 'processing': return '处理中';
    case 'unprocessed': return '未处理';
    default: return '未知';
  }
};

const confirmDeleteDocument = (doc) => {
  deleteType.value = 'document';
  deleteId.value = doc.id;
  deleteConfirmMessage.value = `确定要删除文档 "${doc.name}" 吗？`;
  showDeleteConfirm.value = true;
};

const editCategory = (category) => {
  editingCategory.value = true;
  categoryForm.value = { 
    id: category.id,
    name: category.name, 
    parentId: category.parentId 
  };
  showCategoryDialog.value = true;
};

const confirmDeleteCategory = (category) => {
  deleteType.value = 'category';
  deleteId.value = category.id;
  deleteConfirmMessage.value = `确定要删除分类 "${category.name}" 吗？分类下的所有文档也将被删除。`;
  showDeleteConfirm.value = true;
};

const saveCategory = () => {
  if (editingCategory.value) {
    // 更新分类
    const index = categories.value.findIndex(c => c.id === categoryForm.value.id);
    if (index !== -1) {
      categories.value[index].name = categoryForm.value.name;
    }
  } else {
    // 添加新分类
    const newCategory = {
      id: categories.value.length + 1,
      name: categoryForm.value.name,
      parentId: categoryForm.value.parentId,
      count: 0
    };
    categories.value.push(newCategory);
  }
  
  showCategoryDialog.value = false;
  editingCategory.value = false;
  categoryForm.value = { name: '', parentId: null };
  ElMessage.success(editingCategory.value ? '分类更新成功' : '分类添加成功');
};

const confirmDelete = () => {
  if (deleteType.value === 'document') {
    // 删除单个文档
    documents.value = documents.value.filter(doc => doc.id !== deleteId.value);
    ElMessage.success('文档删除成功');
  } else if (deleteType.value === 'category') {
    // 删除分类
    categories.value = categories.value.filter(c => c.id !== deleteId.value);
    // 删除分类下的文档
    documents.value = documents.value.filter(doc => doc.categoryId !== deleteId.value);
    ElMessage.success('分类及其下的文档删除成功');
  } else if (deleteType.value === 'batch') {
    // 批量删除
    documents.value = documents.value.filter(doc => !selectedDocuments.value.includes(doc.id));
    selectedDocuments.value = [];
    ElMessage.success('批量删除成功');
  }
  
  showDeleteConfirm.value = false;
  totalDocuments.value = documents.value.length;
};

const confirmBatchDelete = () => {
  if (selectedDocuments.value.length === 0) return;
  
  deleteType.value = 'batch';
  deleteConfirmMessage.value = `确定要删除选中的 ${selectedDocuments.value.length} 个文档吗？`;
  showDeleteConfirm.value = true;
};

const handlePageChange = (page) => {
  currentPage.value = page;
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const testMatch = () => {
  if (!testMessage.value.trim()) {
    ElMessage.warning('请输入测试消息');
    return;
  }
  
  isMatching.value = true;
  
  // 模拟API调用延迟
  setTimeout(() => {
    // 根据测试消息内容进行简单匹配
    const query = testMessage.value.toLowerCase();
    
    if (query.includes('连衣裙') || query.includes('裙子') || query.includes('服装')) {
      matchResult.value = [
        {
          title: '夏季新款连衣裙详情',
          category: '服装',
          content: '这款连衣裙采用优质面料，透气凉爽，适合夏季穿着。提供S、M、L三个尺码，颜色有蓝色、粉色和白色可选。',
          score: 92,
          tags: ['连衣裙', '夏季', '新款', '女装']
        }
      ];
    } else if (query.includes('耳机') || query.includes('蓝牙') || query.includes('音乐')) {
      matchResult.value = [
        {
          title: '蓝牙耳机参数详情',
          category: '电子产品',
          content: '蓝牙5.0技术，续航时间长达8小时，防水防汗，适合运动使用。配备主动降噪技术，有效隔绝外界噪音。',
          score: 87,
          tags: ['蓝牙耳机', '降噪', '续航']
        }
      ];
    } else if (query.includes('护肤') || query.includes('面霜') || query.includes('敏感肌')) {
      matchResult.value = [
        {
          title: '温和保湿面霜',
          category: '美妆',
          content: '专为敏感肌肤设计的面霜，不含酒精和香料，温和不刺激。富含神经酰胺和透明质酸，深层滋润修护肌肤屏障。',
          score: 95,
          tags: ['面霜', '敏感肌', '保湿']
        },
        {
          title: '舒缓修护精华液',
          category: '美妆',
          content: '舒缓修护配方，减轻肌肤泛红和不适感。适合敏感和易过敏肌肤使用，可与其他护肤品搭配使用。',
          score: 78,
          tags: ['精华液', '修护', '舒缓']
        }
      ];
    } else {
      matchResult.value = [];
    }
    
    isMatching.value = false;
    showMatchDrawer.value = true;
  }, 1000);
};

const handleSelectionChange = (selection) => {
  selectedDocuments.value = selection.map(item => item.id);
};

onMounted(() => {
  // 初始化逻辑
});
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
  flex-direction: column;
  overflow: hidden;
}

.knowledge-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.category-panel {
  width: 280px;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  padding: 15px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
  overflow: hidden;
}

.category-panel:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

/* 树形控件容器 */
.category-panel .el-tree {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 0;
}

.document-panel {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  padding: 15px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
  overflow: hidden;
}

.document-panel:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

/* 工具栏区域 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.search-box {
  width: 250px;
  flex-shrink: 0;
}

.match-input {
  flex: 1;
  min-width: 0;
}

.match-input-container {
  width: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 0 10px;
  border-bottom: 1px solid #ebeef5;
  background: #f9fafb;
  flex-shrink: 0;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.5px;
  margin: 0;
}

.documents-table-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.documents-table {
  flex: 1;
  overflow: hidden;
}

.documents-table :deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

/* 确保表格即使显示大量数据也不会撑开容器 */
.documents-table :deep(.el-table__inner-wrapper) {
  height: 100%;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 10px;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
  min-height: 60px;
  box-sizing: border-box;
}

/* 分页组件样式 */
:deep(.el-pagination) {
  padding: 0;
  margin: 0;
  justify-content: flex-end;
}

/* 批量操作区域 */
.batch-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selection-info {
  font-size: 14px;
  color: #606266;
}

/* 分类项样式 */
.category-item {
  display: flex;
  align-items: center;
  width: 100%;
}

.doc-count {
  color: #909399;
  font-size: 12px;
  margin-left: 5px;
}

.category-actions {
  margin-left: auto;
  display: none;
}

.category-item:hover .category-actions {
  display: flex;
  gap: 5px;
}

/* 其他必要样式保持不变 */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
  background: #f9fafb;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.5px;
  margin: 0;
}

.drawer-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.match-drawer-content {
  padding: 10px;
}

.search-query-display {
  margin-bottom: 10px;
}

.search-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.search-text {
  font-size: 14px;
  color: #606266;
}

.match-items {
  margin-bottom: 10px;
}

.match-item {
  margin-bottom: 10px;
}

.match-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.match-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.match-category {
  font-size: 12px;
  color: #909399;
}

.match-content {
  font-size: 14px;
  color: #606266;
}

.match-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
}

.match-score {
  font-size: 12px;
  color: #909399;
}

.match-actions {
  display: flex;
  gap: 5px;
}

.no-match-result {
  padding: 20px;
}

.generated-prompt {
  margin-top: 10px;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.prompt-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.prompt-body {
  margin-bottom: 10px;
}

.prompt-footer {
  display: flex;
  justify-content: flex-end;
}

.match-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.detail-meta {
  font-size: 14px;
  color: #909399;
}

.detail-content {
  margin-bottom: 10px;
}

.detail-section {
  margin-bottom: 10px;
}

.match-reason {
  margin-bottom: 10px;
}

.keyword-chips {
  display: flex;
  gap: 5px;
}

.tag-list {
  margin-top: 10px;
}

.tag-item {
  margin-right: 5px;
}

.matching-tips {
  padding: 20px;
}

.tips-examples {
  margin-top: 10px;
}

.example-list {
  display: flex;
  gap: 10px;
}

.example-item {
  flex: 1;
}

.show-tips-dialog {
  padding: 20px;
}
</style> 