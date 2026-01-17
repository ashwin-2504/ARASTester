// main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true, // Hide the default menu bar
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Check for dev mode
  const isDev = process.argv.includes('--dev');

  if (isDev) {
    console.log('Running in development mode: Loading http://localhost:5173');
    win.loadURL('http://localhost:5173');
    // Open the DevTools by default in dev mode if desired
    // win.webContents.openDevTools();
  } else {
    // Load from dist folder (built by Vite)
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

const { spawn } = require('child_process');

let backendProcess = null;

function startBackend() {
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend/ArasBackend.exe')
    : path.join(__dirname, 'backend/ArasBackend/bin/Debug/net8.0/ArasBackend.exe');

  // In dev, we might want to run 'dotnet run' instead if the exe isn't built yet, 
  // but for simplicity let's assume the user builds it or we run the exe.
  // Actually, for dev experience, running 'dotnet run' is better if we want to avoid manual builds.
  // Let's try to spawn the exe directly for now as per the plan, but we need to make sure it exists.
  // Alternatively, we can spawn 'dotnet' with arguments.

  if (!app.isPackaged) {
    // Development mode: run using dotnet run
    backendProcess = spawn('dotnet', ['run', '--project', path.join(__dirname, 'backend/ArasBackend/ArasBackend.csproj'), '--urls', 'http://localhost:5000'], {
      cwd: path.join(__dirname, 'backend/ArasBackend')
    });
  } else {
    // Production mode: run the executable
    backendProcess = spawn(backendPath, ['--urls', 'http://localhost:5000']);
  }

  if (backendProcess) {
    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });
  }
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// ------------------------------------------
// DIALOG HANDLERS
// ------------------------------------------
ipcMain.handle("dialog:pickFolder", () => {
  return dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
});

// ------------------------------------------
// FILESYSTEM HANDLERS
// ------------------------------------------
ipcMain.handle("fs:readFile", (_, filePath) => {
  return fs.promises.readFile(filePath, "utf-8");
});

ipcMain.handle("fs:writeFile", (_, filePath, data) => {
  return fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
});

// NEW — LIST JSON FILES IN A FOLDER
ipcMain.handle("fs:listJsonFiles", async (_, folderPath) => {
  const items = await fs.promises.readdir(folderPath);

  return items
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(folderPath, f));
});

ipcMain.handle("fs:deleteFile", async (_, filePath) => {
  const fs = require("fs");
  return fs.promises.unlink(filePath);
});

// ------------------------------------------
// SETTINGS HANDLERS
// ------------------------------------------
ipcMain.handle("settings:read", async () => {
  const settingsPath = path.join(app.getPath("userData"), "Settings", "settings.json");
  try {
    const data = await fs.promises.readFile(settingsPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or error, return empty object
    return {};
  }
});

ipcMain.handle("settings:write", async (_, data) => {
  const settingsDir = path.join(app.getPath("userData"), "Settings");
  const settingsPath = path.join(settingsDir, "settings.json");

  try {
    await fs.promises.mkdir(settingsDir, { recursive: true });
    await fs.promises.writeFile(settingsPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to write settings:", error);
    return false;
  }
});
