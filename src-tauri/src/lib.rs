use std::cmp::Ordering;
use std::cmp;
use regex::Regex;
use std::collections::hash_map::DefaultHasher;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::hash::{Hash, Hasher};
use std::io::Cursor;
use std::io::Read;
use std::path::{Path, PathBuf};

use image::codecs::jpeg::JpegEncoder;
use image::imageops::FilterType;
use image::GenericImageView;
use lopdf::Document;
use num_cpus;
use rayon::prelude::*;
use serde::Serialize;
use tauri::AppHandle;
use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};
use unrar::Archive;
use zip::ZipArchive;

const IMAGE_EXTENSIONS: [&str; 6] = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
const ARCHIVE_EXTENSIONS: [&str; 2] = ["cbz", "cbr"];
const PDF_EXTENSION: &str = "pdf";
const THUMBNAIL_MAX_SIZE: u32 = 300;
const THUMBNAIL_JPEG_QUALITY: u8 = 80;
const INDEXING_PROGRESS_EVENT: &str = "indexing-progress";

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

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct IndexingErrorPayload {
    path: String,
    message: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct IndexedPagePayload {
    page_number: i64,
    file_path: String,
    file_name: String,
    source_type: String,
    source_path: String,
    archive_entry_path: Option<String>,
    pdf_page_number: Option<i64>,
    thumbnail_path: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct IndexedComicPayload {
    path: String,
    title: String,
    source_type: String,
    artist: Option<String>,
    series: Option<String>,
    issue: Option<String>,
    cover_image_path: Option<String>,
    page_count: i64,
    pages: Vec<IndexedPagePayload>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BuildIndexPayloadResult {
    comics: Vec<IndexedComicPayload>,
    active_comic_paths: Vec<String>,
    errors: Vec<IndexingErrorPayload>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct IndexingProgressEventPayload {
    base_path: String,
    total_comics: i64,
    current_comic: i64,
    current_path: String,
    percentage: f64,
    current_task: String,
}

#[derive(Default)]
struct PatternMetadata {
    artist: Option<String>,
    series: Option<String>,
    issue: Option<String>,
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
    let mut a_chars = a.chars().peekable();
    let mut b_chars = b.chars().peekable();

    loop {
        match (a_chars.peek(), b_chars.peek()) {
            (Some(a_char), Some(b_char)) => {
                if a_char.is_ascii_digit() && b_char.is_ascii_digit() {
                    let mut a_num = 0u64;
                    while let Some(&c) = a_chars.peek() {
                        if let Some(digit) = c.to_digit(10) {
                            a_num = a_num * 10 + digit as u64;
                            a_chars.next();
                        } else {
                            break;
                        }
                    }

                    let mut b_num = 0u64;
                    while let Some(&c) = b_chars.peek() {
                        if let Some(digit) = c.to_digit(10) {
                            b_num = b_num * 10 + digit as u64;
                            b_chars.next();
                        } else {
                            break;
                        }
                    }

                    if a_num != b_num {
                        return a_num.cmp(&b_num);
                    }
                } else {
                    let a_c = a_chars.next().unwrap();
                    let b_c = b_chars.next().unwrap();
                    let a_lower = a_c.to_ascii_lowercase();
                    let b_lower = b_c.to_ascii_lowercase();
                    if a_lower != b_lower {
                        return a_lower.cmp(&b_lower);
                    }
                }
            }
            (None, None) => break,
            (None, Some(_)) => return Ordering::Less,
            (Some(_), None) => return Ordering::Greater,
        }
    }
    a.to_ascii_lowercase().cmp(&b.to_ascii_lowercase()).then_with(|| a.cmp(b))
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

fn normalize_path_string(path: &str) -> String {
    path.replace('\\', "/")
}

fn hash_path(path: &str) -> String {
    let mut hasher = DefaultHasher::new();
    normalize_path_string(path)
        .to_ascii_lowercase()
        .hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

fn ensure_indexed_thumb_root(app: &AppHandle) -> Result<PathBuf, String> {
    let thumb_root = ensure_thumb_dir(app)?;
    let indexed_root = thumb_root.join("indexed");
    if !indexed_root.exists() {
        fs::create_dir_all(&indexed_root).map_err(|e| {
            format!(
                "Failed to create indexed thumbnail dir {}: {e}",
                indexed_root.display()
            )
        })?;
    }
    Ok(indexed_root)
}

fn ensure_indexed_thumb_comic_dir(app: &AppHandle, comic_path: &str) -> Result<PathBuf, String> {
    let indexed_root = ensure_indexed_thumb_root(app)?;
    let comic_hash = hash_path(comic_path);
    let comic_dir = indexed_root.join(comic_hash);
    if !comic_dir.exists() {
        fs::create_dir_all(&comic_dir).map_err(|e| {
            format!(
                "Failed to create indexed comic thumbnail dir {}: {e}",
                comic_dir.display()
            )
        })?;
    }
    Ok(comic_dir)
}

fn emit_indexing_progress(
    app: &AppHandle,
    base_path: &str,
    total_comics: usize,
    current_comic: usize,
    current_path: &str,
    current_task: &str,
) {
    let percentage = if total_comics == 0 {
        0.0
    } else {
        ((current_comic as f64) / (total_comics as f64) * 100.0).clamp(0.0, 100.0)
    };

    let payload = IndexingProgressEventPayload {
        base_path: base_path.to_string(),
        total_comics: total_comics as i64,
        current_comic: current_comic as i64,
        current_path: current_path.to_string(),
        percentage,
        current_task: current_task.to_string(),
    };

    if let Err(error) = app.emit(INDEXING_PROGRESS_EVENT, payload) {
        eprintln!("[Indexing][Rust] Failed to emit progress event: {error}");
    }
}

fn generate_indexed_thumbnail_from_bytes(
    app: &AppHandle,
    image_bytes: &[u8],
    comic_path: &str,
    page_number: i64,
) -> Result<String, String> {
    let comic_dir = ensure_indexed_thumb_comic_dir(app, comic_path)?;
    let thumb_path = comic_dir.join(format!("{}.jpg", page_number));
    if thumb_path.exists() {
        println!(
            "[Indexing][Rust][Thumbnail] Reusing cached thumbnail for '{}' page {}",
            comic_path, page_number
        );
        return Ok(to_forward_slash_path(&thumb_path));
    }

    println!(
        "[Indexing][Rust][Thumbnail] Generating thumbnail for '{}' page {}",
        comic_path, page_number
    );
    write_resized_thumbnail_bytes(image_bytes, &thumb_path)?;
    println!(
        "[Indexing][Rust][Thumbnail] Generated thumbnail for '{}' page {} -> {}",
        comic_path,
        page_number,
        to_forward_slash_path(&thumb_path)
    );
    Ok(to_forward_slash_path(&thumb_path))
}

fn get_relative_path(base_path: &Path, target_path: &Path) -> String {
    if let Ok(relative) = target_path.strip_prefix(base_path) {
        return to_forward_slash_path(relative);
    }
    to_forward_slash_path(target_path)
}

fn extract_metadata(relative_path: &str, pattern: &str) -> Option<PatternMetadata> {
    let mut metadata = PatternMetadata::default();
    let normalized_pattern = pattern.replace('\\', "/");
    let segments: Vec<&str> = normalized_pattern
        .split('/')
        .filter(|segment| !segment.is_empty())
        .collect();

    let mut regex_str = String::from("^");
    let mut skip_next_slash = false;
    let mut capture_names = Vec::new();

    for (i, segment) in segments.iter().enumerate() {
        if i > 0 && !skip_next_slash {
            regex_str.push('/');
        }
        skip_next_slash = false;

        if *segment == "**" {
            if i < segments.len() - 1 {
                regex_str.push_str("(?:.*/)?");
                skip_next_slash = true;
            } else {
                regex_str.push_str(".*");
            }
        } else {
            let mut last_idx = 0;
            for (start, _) in segment.match_indices('{') {
                regex_str.push_str(&regex::escape(&segment[last_idx..start]));
                if let Some(end_offset) = segment[start..].find('}') {
                    let end = start + end_offset;
                    let var_name = &segment[start + 1..end];
                    let capture_name = match var_name {
                        "artist" | "author" => "artist",
                        "series" => "series",
                        "issue" => "issue",
                        _ => var_name,
                    };
                    regex_str.push_str("([^/]+?)");
                    capture_names.push(capture_name);
                    last_idx = end + 1;
                }
            }
            regex_str.push_str(&regex::escape(&segment[last_idx..]));
        }
    }
    regex_str.push('$');

    if let Ok(re) = Regex::new(&regex_str) {
        if let Some(caps) = re.captures(relative_path) {
            for (i, name) in capture_names.iter().enumerate() {
                if let Some(m) = caps.get(i + 1) {
                    match *name {
                        "artist" => metadata.artist = Some(m.as_str().to_string()),
                        "series" => metadata.series = Some(m.as_str().to_string()),
                        "issue" => metadata.issue = Some(m.as_str().to_string()),
                        _ => {}
                    }
                }
            }
            return Some(metadata);
        }
    }

    None
}

fn list_image_pages_internal(comic_dir: &Path) -> Result<Vec<ImagePageEntry>, String> {
    if !comic_dir.exists() || !comic_dir.is_dir() {
        return Err(format!("Comic path is not a directory: {}", comic_dir.display()));
    }

    let entries = fs::read_dir(comic_dir)
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

fn read_all_archive_image_entries_with_bytes(path: &str) -> Result<Vec<(String, Vec<u8>)>, String> {
    let archive_path = PathBuf::from(path);
    let ext = extension_of(&archive_path).unwrap_or_default();

    if ext == "cbz" {
        let file = fs::File::open(&archive_path)
            .map_err(|e| format!("Failed to open CBZ archive {}: {e}", archive_path.display()))?;
        let mut archive = ZipArchive::new(file)
            .map_err(|e| format!("Failed to read CBZ archive {}: {e}", archive_path.display()))?;

        let mut entries: Vec<(String, Vec<u8>)> = Vec::new();
        for idx in 0..archive.len() {
            let mut file = archive
                .by_index(idx)
                .map_err(|e| format!("Failed to read CBZ entry at index {}: {e}", idx))?;
            if !file.is_file() {
                continue;
            }

            let name = file.name().replace('\\', "/");
            if !is_image_entry_name(&name) {
                continue;
            }

            let mut bytes = Vec::new();
            file.read_to_end(&mut bytes)
                .map_err(|e| format!("Failed to read CBZ image entry {}: {e}", name))?;
            entries.push((name, bytes));
        }

        entries.sort_by(|a, b| natural_cmp(&a.0, &b.0));
        return Ok(entries);
    }

    if ext == "cbr" {
        let mut archive = Archive::new(path)
            .open_for_processing()
            .map_err(|e| format!("Failed to open CBR for processing {}: {e}", archive_path.display()))?;

        let mut entries: Vec<(String, Vec<u8>)> = Vec::new();

        loop {
            let Some(before_file) = archive
                .read_header()
                .map_err(|e| format!("Failed reading CBR header {}: {e}", archive_path.display()))?
            else {
                break;
            };

            let name = before_file.entry().filename.to_string_lossy().replace('\\', "/");
            if is_image_entry_name(&name) {
                let (data, next_archive) = before_file
                    .read()
                    .map_err(|e| format!("Failed reading CBR image entry {}: {e}", name))?;
                entries.push((name, data));
                archive = next_archive;
            } else {
                archive = before_file
                    .skip()
                    .map_err(|e| format!("Failed skipping CBR entry while collecting images: {e}"))?;
            }
        }

        entries.sort_by(|a, b| natural_cmp(&a.0, &b.0));
        return Ok(entries);
    }

    Err(format!("Unsupported archive extension for file: {}", archive_path.display()))
}

fn build_pages_for_candidate(
    app: &AppHandle,
    base_path: &str,
    total_comics: usize,
    current_comic: usize,
    comic_path: &str,
    source_type: &str,
) -> Result<Vec<IndexedPagePayload>, String> {
    if source_type == "image" {
        let entries = list_image_pages_internal(Path::new(comic_path))?;
        // Pre-create comic thumbnail directory once to avoid contention in parallel loop
        ensure_indexed_thumb_comic_dir(app, comic_path)?;

        return entries
            .into_par_iter()
            .map(|entry| {
                let task = format!(
                    "Generating image thumbnail for page {} ({})",
                    entry.page_number, entry.file_name
                );
                emit_indexing_progress(app, base_path, total_comics, current_comic, comic_path, &task);
                println!(
                    "[Indexing][Rust][Thumbnail] Processing image source '{}' page {}",
                    entry.file_path, entry.page_number
                );
                let bytes = fs::read(PathBuf::from(entry.file_path.clone())).map_err(|e| {
                    format!("Failed to read source image for thumbnail generation: {e}")
                })?;
                let thumbnail_path =
                    generate_indexed_thumbnail_from_bytes(app, &bytes, comic_path, entry.page_number)?;

                Ok(IndexedPagePayload {
                    page_number: entry.page_number,
                    file_path: entry.file_path.clone(),
                    file_name: entry.file_name,
                    source_type: "image".to_string(),
                    source_path: entry.file_path,
                    archive_entry_path: None,
                    pdf_page_number: None,
                    thumbnail_path: Some(thumbnail_path),
                })
            })
            .collect();
    }

    if source_type == "pdf" {
        let page_count = count_pdf_pages(comic_path.to_string())?;
        for page_number in 1..=page_count {
            let task = format!(
                "Preparing PDF page {} metadata (thumbnail generated in frontend)",
                page_number
            );
            emit_indexing_progress(
                app,
                base_path,
                total_comics,
                current_comic,
                comic_path,
                &task,
            );
            println!(
                "[Indexing][Rust][Thumbnail] PDF page {} for '{}' has no Rust thumbnail (frontend fallback)",
                page_number,
                comic_path
            );
        }
        return Ok((1..=page_count)
            .map(|page_number| IndexedPagePayload {
                page_number,
                file_path: normalize_path_string(comic_path),
                file_name: format!("page-{}.pdf", page_number),
                source_type: "pdf".to_string(),
                source_path: normalize_path_string(comic_path),
                archive_entry_path: None,
                pdf_page_number: Some(page_number),
                thumbnail_path: None,
            })
            .collect());
    }

    let entries = read_all_archive_image_entries_with_bytes(comic_path)?;
    // Pre-create comic thumbnail directory once to avoid contention in parallel loop
    ensure_indexed_thumb_comic_dir(app, comic_path)?;

    entries
        .into_par_iter()
        .enumerate()
        .map(|(idx, (entry_path, bytes))| {
            let page_number = (idx + 1) as i64;
            let task = format!(
                "Generating archive thumbnail for page {} ({})",
                page_number, entry_path
            );
            emit_indexing_progress(app, base_path, total_comics, current_comic, comic_path, &task);
            println!(
                "[Indexing][Rust][Thumbnail] Processing archive entry '{}' in '{}' as page {}",
                entry_path, comic_path, page_number
            );
            let thumbnail_path =
                generate_indexed_thumbnail_from_bytes(app, &bytes, comic_path, page_number)?;
            let file_name = Path::new(&entry_path)
                .file_name()
                .and_then(|segment| segment.to_str())
                .unwrap_or(&entry_path)
                .to_string();

            Ok(IndexedPagePayload {
                page_number,
                file_path: normalize_path_string(comic_path),
                file_name,
                source_type: "archive".to_string(),
                source_path: normalize_path_string(comic_path),
                archive_entry_path: Some(entry_path),
                pdf_page_number: None,
                thumbnail_path: Some(thumbnail_path),
            })
        })
        .collect()
}

fn build_index_payload_for_path_impl(
    app: &AppHandle,
    base_path: &str,
    pattern: &str,
) -> Result<BuildIndexPayloadResult, String> {
    println!(
        "[Indexing][Rust] Starting payload build for base path '{}' with pattern '{}'",
        base_path, pattern
    );
    let candidates = scan_comic_candidates(base_path.to_string())?;
    let total_candidates = candidates.len();
    println!(
        "[Indexing][Rust] Found {} candidate comics in '{}'",
        total_candidates,
        base_path
    );
    let base_path_buf = PathBuf::from(base_path);
    let mut comics = Vec::new();
    let mut active_comic_paths = Vec::new();
    let mut errors = Vec::new();

    for (index, candidate) in candidates.into_iter().enumerate() {
        let comic_path = candidate.path.clone();
        let current_comic = index + 1;
        emit_indexing_progress(
            app,
            base_path,
            total_candidates,
            current_comic,
            &comic_path,
            "Scanning comic source",
        );
        println!(
            "[Indexing][Rust] [{}/{}] Processing '{}' (type: {})",
            current_comic,
            total_candidates,
            comic_path,
            candidate.source_type
        );
        let relative_path = get_relative_path(&base_path_buf, Path::new(&comic_path));
        let metadata = match extract_metadata(&relative_path, pattern) {
            Some(m) => m,
            None => {
                println!(
                    "[Indexing][Rust] Skipping '{}' (does not match pattern '{}')",
                    comic_path, pattern
                );
                continue;
            }
        };

        match build_pages_for_candidate(
            app,
            base_path,
            total_candidates,
            current_comic,
            &comic_path,
            &candidate.source_type,
        ) {
            Ok(pages) => {
                if pages.is_empty() {
                    emit_indexing_progress(
                        app,
                        base_path,
                        total_candidates,
                        current_comic,
                        &comic_path,
                        "Skipping comic with no pages",
                    );
                    println!(
                        "[Indexing][Rust] Skipping '{}' (no pages discovered)",
                        comic_path
                    );
                    continue;
                }

                let cover_image_path = pages.first().map(|page| page.file_path.clone());
                active_comic_paths.push(comic_path.clone());
                comics.push(IndexedComicPayload {
                    path: comic_path.clone(),
                    title: candidate.title,
                    source_type: candidate.source_type,
                    artist: metadata.artist,
                    series: metadata.series,
                    issue: metadata.issue,
                    cover_image_path,
                    page_count: pages.len() as i64,
                    pages,
                });
                emit_indexing_progress(
                    app,
                    base_path,
                    total_candidates,
                    current_comic,
                    &comic_path,
                    "Finished comic payload generation",
                );
                println!(
                    "[Indexing][Rust] Indexed '{}' with {} pages",
                    comic_path,
                    comics.last().map(|comic| comic.page_count).unwrap_or(0)
                );
            }
            Err(message) => {
                emit_indexing_progress(
                    app,
                    base_path,
                    total_candidates,
                    current_comic,
                    &comic_path,
                    "Failed while generating comic payload",
                );
                eprintln!(
                    "[Indexing][Rust] Failed '{}': {}",
                    comic_path,
                    message
                );
                errors.push(IndexingErrorPayload {
                    path: comic_path,
                    message,
                });
            }
        }
    }

    println!(
        "[Indexing][Rust] Completed payload build for '{}': indexed={}, errors={}",
        base_path,
        comics.len(),
        errors.len()
    );
    emit_indexing_progress(
        app,
        base_path,
        total_candidates,
        total_candidates,
        base_path,
        "Completed Rust indexing payload",
    );

    Ok(BuildIndexPayloadResult {
        comics,
        active_comic_paths,
        errors,
    })
}

#[tauri::command]
async fn build_index_payload_for_path(
    app: AppHandle,
    base_path: String,
    pattern: String,
) -> Result<BuildIndexPayloadResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        build_index_payload_for_path_impl(&app, &base_path, &pattern)
    })
    .await
    .map_err(|error| format!("Failed to join indexing task: {error}"))?
}

#[tauri::command]
async fn get_comic_pages(
    app: AppHandle,
    base_path: String,
    total_comics: usize,
    current_comic: usize,
    comic_path: String,
    source_type: String,
) -> Result<Vec<IndexedPagePayload>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        build_pages_for_candidate(
            &app,
            &base_path,
            total_comics,
            current_comic,
            &comic_path,
            &source_type,
        )
    })
    .await
    .map_err(|error| format!("Failed to join indexing task: {error}"))?
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
    list_image_pages_internal(Path::new(&comic_dir_path))
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

#[tauri::command]
fn cleanup_indexed_thumbnails(app: AppHandle, active_comic_paths: Vec<String>) -> Result<(), String> {
    let indexed_root = ensure_indexed_thumb_root(&app)?;
    if !indexed_root.exists() {
        return Ok(());
    }

    let active_hashes: HashSet<String> = active_comic_paths.iter().map(|path| hash_path(path)).collect();
    let entries = fs::read_dir(&indexed_root)
        .map_err(|e| format!("Failed to read indexed thumbnail root {}: {e}", indexed_root.display()))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let folder = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or_default()
            .to_string();

        if !active_hashes.contains(&folder) {
            fs::remove_dir_all(&path).map_err(|e| {
                format!(
                    "Failed to remove orphan indexed thumbnail dir {}: {e}",
                    path.display()
                )
            })?;
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
                    pattern TEXT NOT NULL DEFAULT '{author}/**/{series}',
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
        Migration {
            version: 5,
            description: "add_bookmark_page",
            sql: "
                ALTER TABLE comics ADD COLUMN bookmark_page INTEGER;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "add_indexing_status",
            sql: "
                ALTER TABLE comics ADD COLUMN indexing_status TEXT NOT NULL DEFAULT 'completed';
                ALTER TABLE comics ADD COLUMN indexing_error TEXT;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "create_galleries_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS galleries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS gallery_pages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    gallery_id INTEGER NOT NULL,
                    comic_page_id INTEGER NOT NULL,
                    added_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE,
                    FOREIGN KEY (comic_page_id) REFERENCES comic_pages(id) ON DELETE CASCADE,
                    UNIQUE(gallery_id, comic_page_id)
                );
            ",
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let num_threads = cmp::max(8, num_cpus::get());
    println!("[Indexing][Rust] Initializing thread pool with {} threads", num_threads);
    let _ = rayon::ThreadPoolBuilder::new()
        .num_threads(num_threads)
        .build_global();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            scan_comic_candidates,
            build_index_payload_for_path,
            get_comic_pages,
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
            cleanup_indexed_thumbnails,
        ])
        .plugin(
            SqlBuilder::default()
                .add_migrations("sqlite:comic-shelf.db", get_migrations())
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
