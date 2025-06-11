import { createApp } from "vue";
import App from "./App.vue";
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './assets/styles/index.css';

import { fetch } from '@tauri-apps/plugin-http';

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.mount("#app");


console.log('hhh')
const response = await fetch('https://live.douyin.com/', {
    method: 'GET',
    timeout: 30
  })
console.log('aaa')
console.log(response)