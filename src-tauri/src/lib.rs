use pyo3::prelude::*;

// 模块声明
pub mod migrations;
pub mod commands;

// 重新导出常用功能
pub use commands::*;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

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
            // i.e., `context_factory` function of python binding
            |_args, _kwargs| Ok(tauri_generate_context()),
            // i.e., `builder_factory` function of python binding
            |_args, _kwargs| {
                let migrations = migrations::get_all_migrations();

                let builder = tauri::Builder::default()
                    .plugin(tauri_plugin_opener::init())
                    .plugin(
                        tauri_plugin_sql::Builder::default()
                            .add_migrations("sqlite:grove.db", migrations)
                            .build()
                    )
                    .invoke_handler(tauri::generate_handler![
                        commands::greet
                    ]);
                Ok(builder)
            },
        )
    }
}