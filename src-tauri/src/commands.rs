use serde_json::Value;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::api::dialog::blocking::FileDialogBuilder;
use tauri::api::path::app_data_dir;
use tauri::AppHandle;

pub struct AuthorizedDirs(Mutex<HashSet<PathBuf>>);

impl AuthorizedDirs {
  pub fn new() -> Self {
    Self(Mutex::new(HashSet::new()))
  }

  pub fn add(&self, path: PathBuf) {
    if let Ok(mut guard) = self.0.lock() {
      guard.insert(path);
    }
  }

  pub fn is_authorized(&self, path: &Path) -> bool {
    if let Ok(guard) = self.0.lock() {
      return guard.iter().any(|dir| path.starts_with(dir));
    }
    false
  }
}

fn resolve_safe_path(base_dir: &Path, relative_path: &str, auth: &AuthorizedDirs) -> Result<PathBuf, String> {
  if relative_path.is_empty() {
    return Err("ERR_INVALID_ARGS".to_string());
  }

  let normalized = Path::new(relative_path);
  if normalized.is_absolute() || normalized.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
    return Err("ERR_TRAVERSAL_DETECTED".to_string());
  }

  let canonical_base = base_dir
    .canonicalize()
    .unwrap_or_else(|_| base_dir.to_path_buf());

  if !auth.is_authorized(&canonical_base) {
    return Err("ERR_UNAUTHORIZED_BASE".to_string());
  }

  let target_path = canonical_base.join(normalized);
  let canonical_target = if target_path.exists() {
    target_path
      .canonicalize()
      .unwrap_or_else(|_| target_path.clone())
  } else if let Some(parent) = target_path.parent() {
    parent
      .canonicalize()
      .unwrap_or_else(|_| parent.to_path_buf())
      .join(target_path.file_name().unwrap_or_default())
  } else {
    target_path.clone()
  };

  if !canonical_target.starts_with(&canonical_base) && canonical_target != canonical_base {
    return Err("ERR_TRAVERSAL_DETECTED".to_string());
  }

  Ok(canonical_target)
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
  let base = app_data_dir(&app.config())
    .ok_or_else(|| "ERR_NO_APP_DATA".to_string())?
    .join("Settings");
  Ok(base.join("settings.json"))
}

#[tauri::command]
pub fn ping() -> String {
  "tauri-ready".to_string()
}

#[tauri::command]
pub fn pick_folder(app: AppHandle, auth: tauri::State<'_, AuthorizedDirs>) -> Result<Option<String>, String> {
  let folder = FileDialogBuilder::new().pick_folder();
  if let Some(path) = folder.as_ref() {
    let resolved = path
      .canonicalize()
      .unwrap_or_else(|_| path.to_path_buf());
    auth.add(resolved);
  }
  Ok(folder.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn read_file(
  base_dir: String,
  relative_path: String,
  auth: tauri::State<'_, AuthorizedDirs>,
) -> Result<String, String> {
  let base = PathBuf::from(base_dir);
  let safe_path = resolve_safe_path(&base, &relative_path, &auth)?;
  fs::read_to_string(safe_path).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn write_file(
  base_dir: String,
  relative_path: String,
  data: Value,
  auth: tauri::State<'_, AuthorizedDirs>,
) -> Result<(), String> {
  let base = PathBuf::from(base_dir);
  let safe_path = resolve_safe_path(&base, &relative_path, &auth)?;
  let payload = serde_json::to_string_pretty(&data).map_err(|err| err.to_string())?;
  if let Some(parent) = safe_path.parent() {
    fs::create_dir_all(parent).map_err(|err| err.to_string())?;
  }
  fs::write(safe_path, payload).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn list_json_files(
  base_dir: String,
  relative_path: String,
  auth: tauri::State<'_, AuthorizedDirs>,
) -> Result<Vec<String>, String> {
  let base = PathBuf::from(base_dir);
  let safe_base = resolve_safe_path(&base, &relative_path, &auth)?;
  let entries = fs::read_dir(safe_base).map_err(|err| err.to_string())?;
  let mut files = Vec::new();
  for entry in entries {
    let entry = entry.map_err(|err| err.to_string())?;
    let path = entry.path();
    if path.extension().and_then(|ext| ext.to_str()) == Some("json") {
      if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
        let joined = Path::new(&relative_path).join(name);
        files.push(joined.to_string_lossy().to_string());
      }
    }
  }
  Ok(files)
}

#[tauri::command]
pub fn delete_file(
  base_dir: String,
  relative_path: String,
  auth: tauri::State<'_, AuthorizedDirs>,
) -> Result<(), String> {
  let base = PathBuf::from(base_dir);
  let safe_path = resolve_safe_path(&base, &relative_path, &auth)?;
  fs::remove_file(safe_path).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn settings_read(app: AppHandle) -> Result<Value, String> {
  let path = settings_path(&app)?;
  if !path.exists() {
    return Ok(Value::Object(Default::default()));
  }
  let contents = fs::read_to_string(path).map_err(|err| err.to_string())?;
  serde_json::from_str(&contents).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn settings_write(app: AppHandle, data: Value) -> Result<bool, String> {
  let path = settings_path(&app)?;
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|err| err.to_string())?;
  }
  let payload = serde_json::to_string_pretty(&data).map_err(|err| err.to_string())?;
  fs::write(path, payload).map_err(|err| err.to_string())?;
  Ok(true)
}
