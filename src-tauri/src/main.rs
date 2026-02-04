#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
  tauri::Builder::default()
    .manage(commands::AuthorizedDirs::new())
    .setup(|app| {
      if let Some(data_dir) = tauri::api::path::app_data_dir(&app.config()) {
        app.state::<commands::AuthorizedDirs>().add(data_dir);
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::ping,
      commands::pick_folder,
      commands::read_file,
      commands::write_file,
      commands::list_json_files,
      commands::delete_file,
      commands::settings_read,
      commands::settings_write,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
