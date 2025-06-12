use pyo3::prelude::*;
use refinery::embed_migrations;
use rusqlite::Connection;
use std::error::Error;
use tauri::Manager;

// 模块声明
pub mod commands;

// 重新导出常用功能
pub use commands::*;

// 嵌入迁移文件
embed_migrations!("migrations");

/// 初始化数据库，设置 WAL 模式并运行迁移
fn initialize_database(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn Error>> {
    let db_path = app_handle.path().app_local_data_dir()?.join("grove.db");

    // 确保目录存在
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    // 打开数据库连接并初始化
    let mut conn = Connection::open(&db_path)?;
    migrations::runner().run(&mut conn)?;

    Ok(())
}

pub fn tauri_generate_context() -> tauri::Context {
    tauri::generate_context!()
}

#[pymodule(gil_used = false)]
#[pyo3(name = "ext_mod")]
pub mod ext_mod {
    use super::*;

    #[pymodule_init]
    fn init(module: &Bound<'_, PyModule>) -> PyResult<()> {
        pytauri::pymodule_export(
            module,
            |_args, _kwargs| Ok(tauri_generate_context()),
            |_args, _kwargs| {
                let builder = tauri::Builder::default()
                    .plugin(tauri_plugin_websocket::init())
                    .plugin(tauri_plugin_fs::init())
                    .plugin(tauri_plugin_http::init())
                    .plugin(tauri_plugin_opener::init())
                    .setup(|app| {
                        initialize_database(app.handle())?;
                        Ok(())
                    })
                    .invoke_handler(tauri::generate_handler![commands::greet]);
                Ok(builder)
            },
        )
    }
}
