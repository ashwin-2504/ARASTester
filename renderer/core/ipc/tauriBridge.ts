type ApiSettings = {
  read: () => Promise<Record<string, unknown>>;
  write: (settings: Record<string, unknown>) => Promise<boolean>;
};

type OpenDialogResult = {
  canceled: boolean;
  filePaths: string[];
};

type ApiBridge = {
  pickFolder: () => Promise<OpenDialogResult>;
  readFile: (baseDir: string, relativePath: string) => Promise<string>;
  writeFile: (baseDir: string, relativePath: string, data: unknown) => Promise<void>;
  listJsonFiles: (baseDir: string, relativePath: string) => Promise<string[]>;
  deleteFile: (baseDir: string, relativePath: string) => Promise<void>;
  settings: ApiSettings;
};

function isTauriRuntime() {
  return typeof window !== "undefined" && !!(window as TauriWindow).__TAURI__;
}

type TauriInvoke = <T = unknown>(
  command: string,
  args?: Record<string, unknown>,
) => Promise<T>;

type TauriWindow = Window & { __TAURI__?: { invoke: TauriInvoke } };

function getTauriInvoke(): TauriInvoke {
  const tauriWindow = window as TauriWindow;
  const invoke = tauriWindow.__TAURI__?.invoke;
  if (!invoke) {
    throw new Error("Tauri invoke is not available.");
  }
  return invoke;
}

function buildTauriApi(): ApiBridge {
  const invoke = getTauriInvoke();
  return {
    pickFolder: async () => {
      const folder = await invoke<string | null>("pick_folder");
      if (!folder) {
        return { canceled: true, filePaths: [] };
      }
      return { canceled: false, filePaths: [folder] };
    },
    readFile: (baseDir, relativePath) =>
      invoke("read_file", { baseDir, relativePath }),
    writeFile: (baseDir, relativePath, data) =>
      invoke("write_file", { baseDir, relativePath, data }),
    listJsonFiles: (baseDir, relativePath) =>
      invoke("list_json_files", { baseDir, relativePath }),
    deleteFile: (baseDir, relativePath) =>
      invoke("delete_file", { baseDir, relativePath }),
    settings: {
      read: () => invoke("settings_read"),
      write: (settings) => invoke("settings_write", { data: settings }),
    },
  };
}

export function ensureTauriBridge() {
  if (!isTauriRuntime()) {
    return;
  }

  if (!window.api) {
    window.api = buildTauriApi();
  }
}

ensureTauriBridge();
