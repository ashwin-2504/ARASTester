import { contextBridge, ipcRenderer, OpenDialogReturnValue } from "electron";

// Define the API implementation strictly matching IPCApi in global.d.ts
// Note: We cannot import IPCApi from renderer/types/global.d.ts easily in commonjs context without setup, 
// so we ensure structural compatibility or define it here too if shared types were available.
// For now, we rely on the implementation matching the declaration.

contextBridge.exposeInMainWorld("api", {
  pickFolder: (): Promise<OpenDialogReturnValue> => ipcRenderer.invoke("dialog:pickFolder"),
  
  readFile: (baseDir: string, relativePath: string): Promise<string> =>
    ipcRenderer.invoke("fs:readFile", baseDir, relativePath),
    
  writeFile: (baseDir: string, relativePath: string, data: unknown): Promise<void> =>
    ipcRenderer.invoke("fs:writeFile", baseDir, relativePath, data),
    
  listJsonFiles: (baseDir: string, relativePath: string): Promise<string[]> =>
    ipcRenderer.invoke("fs:listJsonFiles", baseDir, relativePath),

  deleteFile: (baseDir: string, relativePath: string): Promise<void> =>
    ipcRenderer.invoke("fs:deleteFile", baseDir, relativePath),

  // Settings API
  settings: {
    read: (): Promise<Record<string, unknown>> => ipcRenderer.invoke("settings:read"),
    write: (data: Record<string, unknown>): Promise<boolean> => ipcRenderer.invoke("settings:write", data),
  },
});
