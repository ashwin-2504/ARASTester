const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  pickFolder: () => ipcRenderer.invoke("dialog:pickFolder"),
  readFile: (baseDir, relativePath) =>
    ipcRenderer.invoke("fs:readFile", baseDir, relativePath),
  writeFile: (baseDir, relativePath, data) =>
    ipcRenderer.invoke("fs:writeFile", baseDir, relativePath, data),
  listJsonFiles: (baseDir, relativePath) =>
    ipcRenderer.invoke("fs:listJsonFiles", baseDir, relativePath),

  // NEW: delete file (needed for deletePlan)
  deleteFile: (baseDir, relativePath) =>
    ipcRenderer.invoke("fs:deleteFile", baseDir, relativePath),

  // Settings API
  settings: {
    read: () => ipcRenderer.invoke("settings:read"),
    write: (data) => ipcRenderer.invoke("settings:write", data),
  },
});
