import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/live-room'
  },
  {
    path: '/live-room',
    name: 'LiveRoom',
    component: () => import('../views/LiveRoom.vue')
  },
  {
    path: '/topics',
    name: 'Topics',
    component: () => import('../views/Topics.vue')
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: () => import('../views/Knowledge.vue')
  },
  {
    path: '/models',
    name: 'Models',
    component: () => import('../views/Models.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 