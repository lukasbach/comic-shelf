use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS comics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    path TEXT NOT NULL UNIQUE,
                    title TEXT NOT NULL,
                    artist TEXT,
                    series TEXT,
                    issue TEXT,
                    cover_image_path TEXT,
                    page_count INTEGER NOT NULL DEFAULT 0,
                    is_favorite INTEGER NOT NULL DEFAULT 0,
                    view_count INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS comic_pages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    comic_id INTEGER NOT NULL,
                    page_number INTEGER NOT NULL,
                    file_path TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    thumbnail_path TEXT,
                    is_favorite INTEGER NOT NULL DEFAULT 0,
                    view_count INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
                    UNIQUE(comic_id, page_number)
                );

                CREATE TABLE IF NOT EXISTS index_paths (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    path TEXT NOT NULL,
                    pattern TEXT NOT NULL DEFAULT '{artist}/{series}/{issue}',
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_last_opened_at",
            sql: "
                ALTER TABLE comics ADD COLUMN last_opened_at TEXT;
                ALTER TABLE comic_pages ADD COLUMN last_opened_at TEXT;
            ",
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            SqlBuilder::default()
                .add_migrations("sqlite:comic-viewer.db", get_migrations())
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
