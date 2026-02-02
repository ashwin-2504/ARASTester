export {};

export interface IPCApi {
  pickFolder: () => Promise<Electron.OpenDialogReturnValue>;
  readFile: (baseDir: string, relativePath: string) => Promise<string>;
  writeFile: (baseDir: string, relativePath: string, data: unknown) => Promise<void>;
  listJsonFiles: (baseDir: string, relativePath: string) => Promise<string[]>;
  deleteFile: (baseDir: string, relativePath: string) => Promise<void>;
  settings: {
    read: () => Promise<Record<string, unknown>>;
    write: (settings: Record<string, unknown>) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    api: IPCApi;
  }
}
