<script setup>
import { ref, computed } from "vue";
import { RouterView, useRoute } from 'vue-router'
import { 
  VideoCamera as IconVideoCamera,
  Files as IconFiles,
  Monitor as IconMonitor,
  ChatLineRound as IconChatLineRound
} from '@element-plus/icons-vue'
import { 
  ElContainer, 
  ElAside, 
  ElMain, 
  ElMenu, 
  ElMenuItem, 
  ElIcon 
} from 'element-plus'

const isCollapse = ref(false)
const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<template>
  <ElContainer class="app-container">
    <ElAside width="var(--sidebar-width)" class="sidebar">
      <div class="logo-container">
        直播助手
      </div>
      <ElMenu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapse"
        background-color="#ffffff"
        text-color="var(--text-color)"
        active-text-color="var(--primary-color)"
        router
      >
        <ElMenuItem index="/live-room" route="/live-room">
          <ElIcon><IconVideoCamera /></ElIcon>
          <span>直播间</span>
        </ElMenuItem>
        <ElMenuItem index="/topics" route="/topics">
          <ElIcon><IconChatLineRound /></ElIcon>
          <span>话题库</span>
        </ElMenuItem>
        <ElMenuItem index="/knowledge" route="/knowledge">
          <ElIcon><IconFiles /></ElIcon>
          <span>知识库</span>
        </ElMenuItem>
        <ElMenuItem index="/models" route="/models">
          <ElIcon><IconMonitor /></ElIcon>
          <span>智能引擎</span>
        </ElMenuItem>
      </ElMenu>
    </ElAside>
    <ElMain class="main-content">
      <RouterView />
    </ElMain>
  </ElContainer>
</template>

<style scoped>
/* 应用特定样式可以在这里添加 */
</style>
