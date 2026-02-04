#[tauri::command]
pub fn ping() -> String {
  "tauri-ready".to_string()
}
