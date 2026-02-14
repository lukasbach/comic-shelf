use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::io::Cursor;
use std::io::Read;
use std::path::{Path, PathBuf};

use image::codecs::jpeg::JpegEncoder;
use image::imageops::FilterType;
use image::GenericImageView;
use lopdf::Document;
use serde::Serialize;
use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};
use unrar::Archive;
use zip::ZipArchive;

const IMAGE_EXTENSIONS: [&str; 6] = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
const ARCHIVE_EXTENSIONS: [&str; 2] = ["cbz", "cbr"];
const PDF_EXTENSION: &str = "pdf";
const THUMBNAIL_MAX_SIZE: u32 = 300;
const THUMBNAIL_JPEG_QUALITY: u8 = 80;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ComicCandidate {
    path: String,
    title: String,
    source_type: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ImagePageEntry {
    file_path: String,
    file_name: String,
    page_number: i64,
}

fn to_forward_slash_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn extension_of(path: &Path) -> Option<String> {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|s| s.to_ascii_lowercase())
}

fn is_image_file(path: &Path) -> bool {
    extension_of(path)
        .map(|ext| IMAGE_EXTENSIONS.contains(&ext.as_str()))
        .unwrap_or(false)
}

fn is_archive_file(path: &Path) -> bool {
    extension_of(path)
        .map(|ext| ARCHIVE_EXTENSIONS.contains(&ext.as_str()))
        .unwrap_or(false)
}

fn is_pdf_file(path: &Path) -> bool {
    extension_of(path)
        .map(|ext| ext == PDF_EXTENSION)
        .unwrap_or(false)
}

fn natural_cmp(a: &str, b: &str) -> Ordering {
    a.to_ascii_lowercase().cmp(&b.to_ascii_lowercase())
}

fn is_image_entry_name(path: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    IMAGE_EXTENSIONS.iter().any(|ext| lower.ends_with(&format!(".{}", ext)))
}

fn walk_for_candidates(dir: &Path, out: &mut Vec<ComicCandidate>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| format!("Failed to read dir {}: {e}", dir.display()))?;
    let mut contains_images = false;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read dir entry in {}: {e}", dir.display()))?;
        let path = entry.path();
        if path.is_dir() {
            walk_for_candidates(&path, out)?;
            continue;
        }

        if path.is_file() {
            if is_image_file(&path) {
                contains_images = true;
            } else if is_pdf_file(&path) {
                let title = path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("PDF")
                    .to_string();
                out.push(ComicCandidate {
                    path: to_forward_slash_path(&path),
                    title,
                    source_type: "pdf".to_string(),
                });
            } else if is_archive_file(&path) {
                let title = path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("Archive")
                    .to_string();
                out.push(ComicCandidate {
                    path: to_forward_slash_path(&path),
                    title,
                    source_type: "archive".to_string(),
                });
            }
        }
    }

    if contains_images {
        let title = dir
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("Comic")
            .to_string();
        out.push(ComicCandidate {
            path: to_forward_slash_path(dir),
            title,
            source_type: "image".to_string(),
        });
    }

    Ok(())
}

fn ensure_thumb_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;
    let thumb_dir = app_data.join("thumbnails");
    if !thumb_dir.exists() {
        fs::create_dir_all(&thumb_dir)
            .map_err(|e| format!("Failed to create thumbnail dir {}: {e}", thumb_dir.display()))?;
    }
    Ok(thumb_dir)
}

fn write_resized_thumbnail_bytes(bytes: &[u8], target_path: &Path) -> Result<(), String> {
    let image = image::load_from_memory(bytes).map_err(|e| format!("Failed to decode image bytes: {e}"))?;
    let (width, height) = image.dimensions();
    let scale = (THUMBNAIL_MAX_SIZE as f32 / width as f32)
        .min(THUMBNAIL_MAX_SIZE as f32 / height as f32)
        .min(1.0);
    let target_w = ((width as f32) * scale).round() as u32;
    let target_h = ((height as f32) * scale).round() as u32;

    let resized = image.resize(target_w.max(1), target_h.max(1), FilterType::Lanczos3);
    let mut encoded = Vec::new();
    let mut encoder = JpegEncoder::new_with_quality(&mut encoded, THUMBNAIL_JPEG_QUALITY);
    encoder
        .encode_image(&resized)
        .map_err(|e| format!("Failed to encode thumbnail jpeg: {e}"))?;

    fs::write(target_path, encoded)
        .map_err(|e| format!("Failed to write thumbnail {}: {e}", target_path.display()))
}

#[tauri::command]
fn scan_comic_candidates(base_path: String) -> Result<Vec<ComicCandidate>, String> {
    let base = PathBuf::from(base_path);
    if !base.exists() || !base.is_dir() {
        return Err(format!("Base path is not a readable directory: {}", base.display()));
    }

    let mut candidates = Vec::new();
    walk_for_candidates(&base, &mut candidates)?;
    candidates.sort_by(|a, b| natural_cmp(&a.path, &b.path));
    Ok(candidates)
}

#[tauri::command]
fn list_image_pages(comic_dir_path: String) -> Result<Vec<ImagePageEntry>, String> {
    let comic_dir = PathBuf::from(comic_dir_path);
    if !comic_dir.exists() || !comic_dir.is_dir() {
        return Err(format!("Comic path is not a directory: {}", comic_dir.display()));
    }

    let entries = fs::read_dir(&comic_dir)
        .map_err(|e| format!("Failed to read comic dir {}: {e}", comic_dir.display()))?;
    let mut files: Vec<PathBuf> = entries
        .filter_map(Result::ok)
        .map(|e| e.path())
        .filter(|p| p.is_file() && is_image_file(p))
        .collect();

    files.sort_by(|a, b| {
        let aa = a.file_name().and_then(|s| s.to_str()).unwrap_or_default();
        let bb = b.file_name().and_then(|s| s.to_str()).unwrap_or_default();
        natural_cmp(aa, bb)
    });

    Ok(files
        .iter()
        .enumerate()
        .map(|(idx, path)| ImagePageEntry {
            file_path: to_forward_slash_path(path),
            file_name: path
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or_default()
                .to_string(),
            page_number: (idx + 1) as i64,
        })
        .collect())
}

#[tauri::command]
fn read_binary_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(PathBuf::from(path)).map_err(|e| format!("Failed to read binary file: {e}"))
}

#[tauri::command]
fn count_pdf_pages(path: String) -> Result<i64, String> {
    let mut cursor = Cursor::new(fs::read(PathBuf::from(path)).map_err(|e| format!("Failed to read pdf: {e}"))?);
    let doc = Document::load_from(&mut cursor).map_err(|e| format!("Failed to parse pdf document: {e}"))?;
    Ok(doc.get_pages().len() as i64)
}

#[tauri::command]
fn list_archive_image_entries(path: String) -> Result<Vec<String>, String> {
    let archive_path = PathBuf::from(path.clone());
    let ext = extension_of(&archive_path).unwrap_or_default();

    if ext == "cbz" {
        let file = fs::File::open(&archive_path)
            .map_err(|e| format!("Failed to open CBZ archive {}: {e}", archive_path.display()))?;
        let mut archive = ZipArchive::new(file)
            .map_err(|e| format!("Failed to read CBZ archive {}: {e}", archive_path.display()))?;

        let mut names = Vec::new();
        for idx in 0..archive.len() {
            let file = archive
                .by_index(idx)
                .map_err(|e| format!("Failed to read CBZ entry at index {}: {e}", idx))?;
            if !file.is_file() {
                continue;
            }
            let name = file.name().replace('\\', "/");
            if is_image_entry_name(&name) {
                names.push(name);
            }
        }
        names.sort_by(|a, b| natural_cmp(a, b));
        return Ok(names);
    }

    if ext == "cbr" {
        let mut names = Vec::new();
        let listed = Archive::new(&path)
            .open_for_listing()
            .map_err(|e| format!("Failed to open CBR for listing {}: {e}", archive_path.display()))?;

        for header in listed {
            let header = header.map_err(|e| format!("Failed reading CBR header {}: {e}", archive_path.display()))?;
            let name = header.filename.to_string_lossy().replace('\\', "/");
            if is_image_entry_name(&name) {
                names.push(name);
            }
        }

        names.sort_by(|a, b| natural_cmp(a, b));
        return Ok(names);
    }

    Err(format!("Unsupported archive extension for file: {}", archive_path.display()))
}

#[tauri::command]
fn read_archive_image_entry(path: String, entry_path: String) -> Result<Vec<u8>, String> {
    let archive_path = PathBuf::from(path.clone());
    let ext = extension_of(&archive_path).unwrap_or_default();

    if ext == "cbz" {
        let file = fs::File::open(&archive_path)
            .map_err(|e| format!("Failed to open CBZ archive {}: {e}", archive_path.display()))?;
        let mut archive = ZipArchive::new(file)
            .map_err(|e| format!("Failed to read CBZ archive {}: {e}", archive_path.display()))?;
        let mut file = archive
            .by_name(&entry_path)
            .map_err(|e| format!("Failed to find CBZ entry {}: {e}", entry_path))?;
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes)
            .map_err(|e| format!("Failed to read CBZ entry {}: {e}", entry_path))?;
        return Ok(bytes);
    }

    if ext == "cbr" {
        let mut archive = Archive::new(&path)
            .open_for_processing()
            .map_err(|e| format!("Failed to open CBR for processing {}: {e}", archive_path.display()))?;

        loop {
            let Some(before_file) = archive
                .read_header()
                .map_err(|e| format!("Failed reading CBR header {}: {e}", archive_path.display()))?
            else {
                break;
            };

            let current_name = before_file.entry().filename.to_string_lossy().replace('\\', "/");
            if current_name == entry_path {
                let (data, _after_read) = before_file
                    .read()
                    .map_err(|e| format!("Failed reading CBR entry {}: {e}", entry_path))?;
                return Ok(data);
            }

            archive = before_file
                .skip()
                .map_err(|e| format!("Failed skipping CBR entry while searching {}: {e}", entry_path))?;
        }

        return Err(format!("CBR entry not found: {}", entry_path));
    }

    Err(format!("Unsupported archive extension for file: {}", archive_path.display()))
}

#[tauri::command]
fn read_archive_image_entries_batch(path: String, entry_paths: Vec<String>) -> Result<Vec<Vec<u8>>, String> {
    if entry_paths.is_empty() {
        return Ok(Vec::new());
    }

    let archive_path = PathBuf::from(path.clone());
    let ext = extension_of(&archive_path).unwrap_or_default();

    if ext == "cbz" {
        let file = fs::File::open(&archive_path)
            .map_err(|e| format!("Failed to open CBZ archive {}: {e}", archive_path.display()))?;
        let mut archive = ZipArchive::new(file)
            .map_err(|e| format!("Failed to read CBZ archive {}: {e}", archive_path.display()))?;

        let mut output = Vec::with_capacity(entry_paths.len());
        for entry_path in &entry_paths {
            let mut file = archive
                .by_name(entry_path)
                .map_err(|e| format!("Failed to find CBZ entry {}: {e}", entry_path))?;
            let mut bytes = Vec::new();
            file.read_to_end(&mut bytes)
                .map_err(|e| format!("Failed to read CBZ entry {}: {e}", entry_path))?;
            output.push(bytes);
        }
        return Ok(output);
    }

    if ext == "cbr" {
        let requested: HashSet<String> = entry_paths.iter().cloned().collect();
        let mut found: HashMap<String, Vec<u8>> = HashMap::new();

        let mut archive = Archive::new(&path)
            .open_for_processing()
            .map_err(|e| format!("Failed to open CBR for processing {}: {e}", archive_path.display()))?;

        loop {
            let Some(before_file) = archive
                .read_header()
                .map_err(|e| format!("Failed reading CBR header {}: {e}", archive_path.display()))?
            else {
                break;
            };

            let current_name = before_file.entry().filename.to_string_lossy().replace('\\', "/");
            if requested.contains(&current_name) {
                let (data, next_archive) = before_file
                    .read()
                    .map_err(|e| format!("Failed reading CBR entry {}: {e}", current_name))?;
                found.insert(current_name, data);
                archive = next_archive;
            } else {
                archive = before_file
                    .skip()
                    .map_err(|e| format!("Failed skipping CBR entry while batch reading: {e}"))?;
            }
        }

        let mut output = Vec::with_capacity(entry_paths.len());
        for entry_path in &entry_paths {
            let data = found
                .remove(entry_path)
                .ok_or_else(|| format!("CBR entry not found: {}", entry_path))?;
            output.push(data);
        }
        return Ok(output);
    }

    Err(format!("Unsupported archive extension for file: {}", archive_path.display()))
}

#[tauri::command]
fn generate_thumbnail_from_path(
    app: AppHandle,
    source_image_path: String,
    comic_id: i64,
    page_number: i64,
) -> Result<String, String> {
    let source_bytes = fs::read(PathBuf::from(source_image_path))
        .map_err(|e| format!("Failed to read source image: {e}"))?;
    generate_thumbnail_from_bytes(app, source_bytes, comic_id, page_number)
}

#[tauri::command]
fn generate_thumbnail_from_bytes(
    app: AppHandle,
    image_bytes: Vec<u8>,
    comic_id: i64,
    page_number: i64,
) -> Result<String, String> {
    let thumb_root = ensure_thumb_dir(&app)?;
    let comic_dir = thumb_root.join(comic_id.to_string());
    if !comic_dir.exists() {
        fs::create_dir_all(&comic_dir)
            .map_err(|e| format!("Failed to create comic thumbnail dir {}: {e}", comic_dir.display()))?;
    }

    let thumb_path = comic_dir.join(format!("{}.jpg", page_number));
    if thumb_path.exists() {
        return Ok(to_forward_slash_path(&thumb_path));
    }

    write_resized_thumbnail_bytes(&image_bytes, &thumb_path)?;
    Ok(to_forward_slash_path(&thumb_path))
}

#[tauri::command]
fn delete_thumbnails_for_comic(app: AppHandle, comic_id: i64) -> Result<(), String> {
    let thumb_root = ensure_thumb_dir(&app)?;
    let comic_dir = thumb_root.join(comic_id.to_string());
    if comic_dir.exists() {
        fs::remove_dir_all(&comic_dir)
            .map_err(|e| format!("Failed to remove comic thumbnail dir {}: {e}", comic_dir.display()))?;
    }
    Ok(())
}

#[tauri::command]
fn cleanup_orphan_thumbnails(app: AppHandle, active_comic_ids: Vec<i64>) -> Result<(), String> {
    let thumb_root = ensure_thumb_dir(&app)?;
    let active: std::collections::HashSet<String> = active_comic_ids.into_iter().map(|id| id.to_string()).collect();
    let entries = fs::read_dir(&thumb_root)
        .map_err(|e| format!("Failed to read thumbnail root {}: {e}", thumb_root.display()))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let folder = path.file_name().and_then(|s| s.to_str()).unwrap_or_default().to_string();
        if !active.contains(&folder) {
            fs::remove_dir_all(&path)
                .map_err(|e| format!("Failed to remove orphan thumbnail dir {}: {e}", path.display()))?;
        }
    }
    Ok(())
}

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
        Migration {
            version: 3,
            description: "add_is_viewed",
            sql: "
                ALTER TABLE comics ADD COLUMN is_viewed INTEGER NOT NULL DEFAULT 0;
                ALTER TABLE comic_pages ADD COLUMN is_viewed INTEGER NOT NULL DEFAULT 0;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_source_format_columns",
            sql: "
                ALTER TABLE comics ADD COLUMN source_type TEXT NOT NULL DEFAULT 'image';
                ALTER TABLE comic_pages ADD COLUMN source_type TEXT NOT NULL DEFAULT 'image';
                ALTER TABLE comic_pages ADD COLUMN source_path TEXT;
                ALTER TABLE comic_pages ADD COLUMN archive_entry_path TEXT;
                ALTER TABLE comic_pages ADD COLUMN pdf_page_number INTEGER;
                UPDATE comic_pages SET source_path = file_path WHERE source_path IS NULL;
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
        .invoke_handler(tauri::generate_handler![
            scan_comic_candidates,
            list_image_pages,
            read_binary_file,
            count_pdf_pages,
            list_archive_image_entries,
            read_archive_image_entry,
            read_archive_image_entries_batch,
            generate_thumbnail_from_path,
            generate_thumbnail_from_bytes,
            delete_thumbnails_for_comic,
            cleanup_orphan_thumbnails,
        ])
        .plugin(
            SqlBuilder::default()
                .add_migrations("sqlite:comic-viewer.db", get_migrations())
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
