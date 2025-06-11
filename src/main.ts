import { createApp } from "vue";
import App from "./App.vue";
import router from './router';
import ElementPlus from 'element-plus';
import { invoke } from "@tauri-apps/api/core";
import { pyInvoke } from "tauri-plugin-pytauri-api";
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

interface TestMiniMaxApiKeyResponse {
    success: boolean;
    failureReason: string | null;
}

async function testMiniMaxApiKey() {
    const rs = await pyInvoke<TestMiniMaxApiKeyResponse>("testMiniMaxApiKey", {
        apiKey: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLoib7nv5Tpo54iLCJVc2VyTmFtZSI6IuiJvue_lOmjniIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxODEwNTMwOTYxMjcyNjA3NjIyIiwiUGhvbmUiOiIxODk5NTU0MzEyMCIsIkdyb3VwSUQiOiIxODEwNTMwOTYxMjY4NDEzMjUzIiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiIiwiQ3JlYXRlVGltZSI6IjIwMjUtMDYtMTEgMTY6NTQ6MzUiLCJUb2tlblR5cGUiOjEsImlzcyI6Im1pbmltYXgifQ.COzkuveSUckUXHOqsS-LUbLwUO2RBb5n45C_w4erYhRr18uUjXBPbHA7R-sMHBwd_9cXp9-01lT0RF6CVpNS5YmpcdwL_KtGhf2ZjXJgZlFsPhhPJv04BykyKDKwetdMuLMWRp6n_ZJG8wofwYXoU5Aj5CLVobEOZlY8mJhH4vlGByBFlij2LxIuWcS63fOX056-MFal4cLbO0vegtrs0Z1Vfz9v78JgJ5UHbTkUA3wWKg97YVJ4UfaMDmSnnjfM2U8nqKEfRyMdG4OP4eIArDzm9I5ViuKeNLYmVxDq7klPrndJuIf2VVq0hQ7lZTCqBCK9IQVDXBovscNwS_Ckow",
    });
    console.log(rs);
}

greet();
testMiniMaxApiKey();