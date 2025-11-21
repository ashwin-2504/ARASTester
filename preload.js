const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  pickFolder: () => ipcRenderer.invoke("dialog:pickFolder"),
  readFile: (filePath) => ipcRenderer.invoke("fs:readFile", filePath),
  writeFile: (filePath, data) =>
    ipcRenderer.invoke("fs:writeFile", filePath, data),
  listJsonFiles: (folderPath) =>
    ipcRenderer.invoke("fs:listJsonFiles", folderPath),

  // NEW: delete file (needed for deletePlan)
  deleteFile: (filePath) => ipcRenderer.invoke("fs:deleteFile", filePath),

  // Settings API
  settings: {
    read: () => ipcRenderer.invoke("settings:read"),
    write: (data) => ipcRenderer.invoke("settings:write", data),
  },
});
