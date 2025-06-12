import { createApp } from "vue";
import App from "./App.vue";
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './assets/styles/index.css';
import { resolveResource } from '@tauri-apps/api/path';
import { fetch } from '@tauri-apps/plugin-http';
import WebSocket from '@tauri-apps/plugin-websocket';
import { readTextFile } from '@tauri-apps/plugin-fs';

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.mount("#app");


// http请求示范
try {
  const response = await fetch('https://live.douyin.com/', {
    method: 'GET',
    timeout: 30
  })
  console.log(response)
} catch (error) {
  console.log(error)
}

// websocket请求示范
try {
  const ws = await WebSocket.connect('ws://127.0.0.1:8080');
  ws.addListener((msg) => {
    console.log('Received Message:', msg);
  });
  await ws.send('Hello World!');
  await ws.disconnect();
} catch (error) {
  console.log(error)
}


// 读取抖音proto文件
try {
  const resourcePath = await resolveResource('assets/douyin.proto')
  const data = await readTextFile(resourcePath)
  console.log(data)
} catch (error) {
  console.log(error)
}

