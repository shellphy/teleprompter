import { createApp } from "vue";
import App from "./App.vue";
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './assets/styles/index.css';

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.mount("#app");


interface Greeting {
    message: string;
}

async function greet() {
    const rsGreeting = await invoke<string>("greet", {
        name: "shellphy",
    });
    const pyGreeting = await pyInvoke<Greeting>("greet", {
        name: "shellphy",
    });
    console.log(rsGreeting + "\n" + pyGreeting.message);
}

greet();