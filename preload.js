"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Define the API implementation strictly matching IPCApi in global.d.ts
// Note: We cannot import IPCApi from renderer/types/global.d.ts easily in commonjs context without setup, 
// so we ensure structural compatibility or define it here too if shared types were available.
// For now, we rely on the implementation matching the declaration.
electron_1.contextBridge.exposeInMainWorld("api", {
    pickFolder: () => electron_1.ipcRenderer.invoke("dialog:pickFolder"),
    readFile: (baseDir, relativePath) => electron_1.ipcRenderer.invoke("fs:readFile", baseDir, relativePath),
    writeFile: (baseDir, relativePath, data) => electron_1.ipcRenderer.invoke("fs:writeFile", baseDir, relativePath, data),
    listJsonFiles: (baseDir, relativePath) => electron_1.ipcRenderer.invoke("fs:listJsonFiles", baseDir, relativePath),
    deleteFile: (baseDir, relativePath) => electron_1.ipcRenderer.invoke("fs:deleteFile", baseDir, relativePath),
    // Settings API
    settings: {
        read: () => electron_1.ipcRenderer.invoke("settings:read"),
        write: (data) => electron_1.ipcRenderer.invoke("settings:write", data),
    },
});
