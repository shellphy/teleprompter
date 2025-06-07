use pyo3::prelude::*;
use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
            // i.e., `context_factory` function of python binding
            |_args, _kwargs| Ok(tauri_generate_context()),
            // i.e., `builder_factory` function of python binding
            |_args, _kwargs| {
                let migrations = vec![
                    // Define your migrations here
                    Migration {
                        version: 1,
                        description: "create_initial_tables",
                        sql: "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);",
                        kind: MigrationKind::Up,
                    }
                ];

                let builder = tauri::Builder::default()
                    .plugin(tauri_plugin_opener::init())
                    .plugin(
                        tauri_plugin_sql::Builder::default()
                        .add_migrations("sqlite:grove.db", migrations)
                        .build())
                    .invoke_handler(tauri::generate_handler![greet]);
                Ok(builder)
            },
        )
    }
}