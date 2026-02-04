#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use std::sync::Mutex;
use tauri::api::process::{Command, CommandEvent, CommandChild};

struct BackendProcess(Mutex<Option<CommandChild>>);

impl BackendProcess {
  fn new() -> Self {
    Self(Mutex::new(None))
  }

  fn set(&self, child: CommandChild) {
    if let Ok(mut guard) = self.0.lock() {
      *guard = Some(child);
    }
  }

  fn take(&self) -> Option<CommandChild> {
    if let Ok(mut guard) = self.0.lock() {
      return guard.take();
    }
    None
  }
}

fn main() {
  tauri::Builder::default()
    .manage(commands::AuthorizedDirs::new())
    .manage(BackendProcess::new())
    .setup(|app| {
      if let Some(data_dir) = tauri::api::path::app_data_dir(&app.config()) {
        app.state::<commands::AuthorizedDirs>().add(data_dir);
      }
      let port = std::env::var("BACKEND_PORT").unwrap_or_else(|_| "5000".to_string());
      let backend_state = app.state::<BackendProcess>();
      let (mut child, mut rx) = Command::new_sidecar("backend/ArasBackend")
        .map_err(|err| err.to_string())?
        .args(["--urls", &format!("http://localhost:{port}")])
        .spawn()
        .map_err(|err| err.to_string())?;

      backend_state.set(child);
      tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
          if let CommandEvent::Error(error) = event {
            eprintln!("[BACKEND] sidecar error: {error}");
          }
        }
      });
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
    .on_window_event(|event| {
      if matches!(event.event(), tauri::WindowEvent::Destroyed) {
        let app = event.window().app_handle();
        if let Some(child) = app.state::<BackendProcess>().take() {
          let _ = child.kill();
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
