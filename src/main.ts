import { createApp } from "vue";
import App from "./App.vue";
import { invoke } from "@tauri-apps/api/core";
import { pyInvoke } from "tauri-plugin-pytauri-api";

createApp(App).mount("#app");

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