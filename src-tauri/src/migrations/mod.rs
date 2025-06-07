use tauri_plugin_sql::{Migration, MigrationKind};

/// 定义迁移结构
struct MigrationDef {
    description: &'static str,
    sql: &'static str,
    is_up: bool, // true for Up, false for Down
}

/// 所有迁移定义（按时间顺序）
const MIGRATIONS: &[MigrationDef] = &[
    MigrationDef {
        description: "create_users_table",
        sql: "CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        );",
        is_up: true,
    },
    MigrationDef {
        description: "add_email_to_users",
        sql: "ALTER TABLE users ADD COLUMN email TEXT;",
        is_up: true,
    },
    MigrationDef {
        description: "create_posts_table",
        sql: "CREATE TABLE posts (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );",
        is_up: true,
    },
    // 在这里按时间顺序添加新的迁移
];

/// 获取所有迁移，按版本顺序排列
pub fn get_all_migrations() -> Vec<Migration> {
    MIGRATIONS
        .iter()
        .enumerate()
                 .map(|(index, migration_def)| Migration {
             version: (index + 1) as i64,
             description: migration_def.description,
             sql: migration_def.sql,
             kind: if migration_def.is_up { MigrationKind::Up } else { MigrationKind::Down },
         })
        .collect()
}

// 迁移管理说明：
//
// 这个方案直接在 Rust 代码中定义迁移，避免了文件系统和编译时包含的问题。
// 
// 优势：
// - 类型安全，编译时验证
// - 版本号自动管理
// - 避免文件哈希变化问题
// - 简单直接，无需额外配置
//
// 添加新迁移的步骤：
// 1. 在上面的 MIGRATIONS 数组末尾添加新的 MigrationDef
// 2. 版本号会自动根据在数组中的位置分配（从1开始）
//
// 示例：
// MigrationDef {
//     description: "add_avatar_to_users",
//     sql: "ALTER TABLE users ADD COLUMN avatar TEXT;",
//     is_up: true,
// },
// MigrationDef {
//     description: "remove_avatar_from_users", 
//     sql: "ALTER TABLE users DROP COLUMN avatar;",
//     is_up: false,
// }, 