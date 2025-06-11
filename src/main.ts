import { createApp } from "vue";
import App from "./App.vue";
import router from './router';
import ElementPlus from 'element-plus';
import { pyInvoke, Channel } from "tauri-plugin-pytauri-api";
import 'element-plus/dist/index.css';
import './assets/styles/index.css';

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.mount("#app");

async function commonChat() {
    const channel = new Channel<string>();
    channel.addJsonListener((msg) => console.log(msg))
    await pyInvoke("commonChat", {
        channel: channel,
        type: 1
    });
}

commonChat();
