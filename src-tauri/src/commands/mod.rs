/// Tauri 命令处理模块

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 未来可以在这里添加更多命令
/*
#[tauri::command]
pub async fn get_users() -> Result<Vec<User>, String> {
    // 获取用户列表的逻辑
    todo!()
}

#[tauri::command]
pub async fn create_user(name: String, email: String) -> Result<User, String> {
    // 创建用户的逻辑
    todo!()
}
*/ 