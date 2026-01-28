// main.js
const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");

// Disable the default menu
Menu.setApplicationMenu(null);
const fs = require("fs");
const path = require("path");

// ===========================================
// ANSI Color Codes for Terminal Output
// ===========================================
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  // Background
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
};

// Log level patterns to detect from backend output
const logPatterns = {
  error: /\b(error|exception|fail|fatal|critical)\b/i,
  warn: /\b(warn|warning|deprecated|caution)\b/i,
  success: /\b(success|completed|started|ready|listening|200|201|204)\b/i,
  debug: /\b(debug|trace|verbose)\b/i,
  info: /\b(info|information)\b/i,
};

/**
 * Parse a log line and return the appropriate color based on content
 */
function getLogColor(line) {
  const lowerLine = line.toLowerCase();

  // Priority order: error > warn > success > info > debug
  if (logPatterns.error.test(lowerLine)) {
    return { color: colors.red, prefix: "[ERROR]  " };
  }
  if (logPatterns.warn.test(lowerLine)) {
    return { color: colors.yellow, prefix: "[WARN]   " };
  }
  if (logPatterns.success.test(lowerLine)) {
    return { color: colors.green, prefix: "[OK]     " };
  }
  if (logPatterns.debug.test(lowerLine)) {
    return { color: colors.gray, prefix: "[DEBUG]  " };
  }
  if (logPatterns.info.test(lowerLine)) {
    return { color: colors.cyan, prefix: "[INFO]   " };
  }

  // Default: regular log
  return { color: colors.white, prefix: "[LOG]    " };
}

/**
 * Format and colorize a backend log line
 */
function formatBackendLog(data, isError = false) {
  const lines = data.toString().trim().split("\n");
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });

  lines.forEach((line) => {
    if (!line.trim()) return;

    const { color, prefix } = isError
      ? { color: colors.red, prefix: "[ERROR]  " }
      : getLogColor(line);

    const formattedLine = `${colors.gray}[${timestamp}]${colors.reset} ${colors.magenta}[BACKEND]${colors.reset} ${color}${prefix}${colors.reset} ${color}${line}${colors.reset}`;

    if (isError) {
      console.error(formattedLine);
    } else {
      console.log(formattedLine);
    }
  });
}

/**
 * Log a frontend message with color coding
 */
function logFrontend(level, message) {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  const levelColors = {
    info: { color: colors.cyan, prefix: "[INFO]   " },
    success: { color: colors.green, prefix: "[OK]     " },
    warn: { color: colors.yellow, prefix: "[WARN]   " },
    error: { color: colors.red, prefix: "[ERROR]  " },
    debug: { color: colors.gray, prefix: "[DEBUG]  " },
  };

  const { color, prefix } = levelColors[level] || levelColors.info;
  console.log(
    `${colors.gray}[${timestamp}]${colors.reset} ${colors.blue}[ELECTRON]${colors.reset} ${color}${prefix}${colors.reset} ${color}${message}${colors.reset}`,
  );
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    // autoHideMenuBar: true, // Hide the default menu bar
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#1E1F22",
  });

  // Check for dev mode
  const isDev = process.argv.includes("--dev");

  if (isDev) {
    const port = process.env.VITE_PORT || "5173";
    logFrontend(
      "info",
      `Running in development mode: Loading http://localhost:${port}`,
    );
    win.loadURL(`http://localhost:${port}`);
    // Open the DevTools by default in dev mode if desired
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

const { spawn } = require("child_process");

let backendProcess = null;

/**
 * Get the path to the backend executable
 * - Production: bundled in resources
 * - Development: pre-built Debug EXE
 */
function getBackendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend", "ArasBackend.exe");
  }
  return path.join(
    __dirname,
    "backend",
    "ArasBackend",
    "bin",
    "Debug",
    "net8.0",
    "win-x64",
    "ArasBackend.exe",
  );
}

/**
 * Start the backend process using pre-built EXE (faster than dotnet run)
 */
function startBackend() {
  const exePath = getBackendPath();

  // Check if EXE exists
  if (!fs.existsSync(exePath)) {
    console.log(
      `${colors.bgRed}${colors.white}${"=".repeat(60)}${colors.reset}`,
    );
    logFrontend("error", "Backend EXE not found!");
    logFrontend("warn", "Run: npm run build:backend");
    logFrontend("info", `Expected path: ${exePath}`);
    console.log(
      `${colors.bgRed}${colors.white}${"=".repeat(60)}${colors.reset}`,
    );
    return;
  }

  const port = process.env.BACKEND_PORT || "5000";
  logFrontend("info", `Starting backend from: ${exePath} on port ${port}`);
  backendProcess = spawn(exePath, ["--urls", `http://localhost:${port}`]);

  backendProcess.stdout.on("data", (data) => {
    formatBackendLog(data, false);
  });

  backendProcess.stderr.on("data", (data) => {
    formatBackendLog(data, true);
  });

  backendProcess.on("error", (err) => {
    logFrontend("error", `Failed to start backend: ${err.message}`);
  });

  backendProcess.on("exit", (code) => {
    const level = code === 0 ? "info" : "warn";
    logFrontend(level, `Backend process exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  // Show UI immediately
  // Start backend immediately (parallel to UI)
  console.log("Starting backend...");
  startBackend();

  // Show UI immediately
  createWindow();
});

app.on("will-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// ------------------------------------------
// SECURITY & FILESYSTEM UTILS
// ------------------------------------------
const authorizedDirs = new Set([path.resolve(app.getPath("userData"))]);

/**
 * Normalizes and validates a path to prevent directory traversal.
 * String-level rejection is an optimization; canonical containment is the authoritative security check.
 */
function resolveSafePath(baseDir, relativePath) {
  if (!baseDir || !relativePath) {
    throw new Error("ERR_INVALID_ARGS");
  }

  // 1. Fast rejection of obviously malicious relative paths
  const normalizedRelative = path.normalize(relativePath);
  if (
    path.isAbsolute(normalizedRelative) ||
    normalizedRelative.includes("..")
  ) {
    console.error(`[SECURITY] Blocked fast-fail traversal: ${relativePath}`);
    throw new Error("ERR_TRAVERSAL_DETECTED");
  }

  // 2. Resolve base directory and verify authorization
  const resolvedBase = path.resolve(baseDir);
  const canonicalBase = fs.existsSync(resolvedBase)
    ? fs.realpathSync(resolvedBase)
    : resolvedBase;

  // Check if the base directory is authorized
  let isAuthorized = false;
  for (const authDir of authorizedDirs) {
    if (canonicalBase.startsWith(authDir)) {
      isAuthorized = true;
      break;
    }
  }

  if (!isAuthorized) {
    console.error(`[SECURITY] Unauthorized base directory: ${canonicalBase}`);
    throw new Error("ERR_UNAUTHORIZED_BASE");
  }

  // 3. Resolve target path and verify containment
  const targetPath = path.resolve(canonicalBase, normalizedRelative);

  // TOCTOU Mitigation: Use realpath if the file exists
  let canonicalTarget;
  try {
    if (fs.existsSync(targetPath)) {
      canonicalTarget = fs.realpathSync(targetPath);
    } else {
      // For new files, check the parent directory
      const parentDir = path.dirname(targetPath);
      if (fs.existsSync(parentDir)) {
        canonicalTarget = path.join(
          fs.realpathSync(parentDir),
          path.basename(targetPath),
        );
      } else {
        canonicalTarget = targetPath;
      }
    }
  } catch (err) {
    canonicalTarget = targetPath;
  }

  // 4. Final containment check (must start with base + separator)
  const baseWithSep = canonicalBase.endsWith(path.sep)
    ? canonicalBase
    : canonicalBase + path.sep;
  if (
    !canonicalTarget.startsWith(baseWithSep) &&
    canonicalTarget !== canonicalBase
  ) {
    console.error(
      `[SECURITY] Traversal detected after canonicalization: ${canonicalTarget}`,
    );
    throw new Error("ERR_TRAVERSAL_DETECTED");
  }

  return canonicalTarget;
}

ipcMain.handle("dialog:pickFolder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = path.resolve(result.filePaths[0]);
    authorizedDirs.add(selectedPath);
  }
  return result;
});

// ------------------------------------------
// FILESYSTEM HANDLERS
// ------------------------------------------
ipcMain.handle("fs:readFile", (_, baseDir, relativePath) => {
  try {
    const safePath = resolveSafePath(baseDir, relativePath);
    return fs.promises.readFile(safePath, "utf-8");
  } catch (err) {
    console.error(`[FS] Error reading file: ${err.message}`);
    throw err;
  }
});

ipcMain.handle("fs:writeFile", (_, baseDir, relativePath, data) => {
  try {
    const safePath = resolveSafePath(baseDir, relativePath);
    return fs.promises.writeFile(safePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[FS] Error writing file: ${err.message}`);
    throw err;
  }
});

ipcMain.handle("fs:listJsonFiles", async (_, baseDir, relativePath = ".") => {
  try {
    const safeBase = resolveSafePath(baseDir, relativePath);
    const items = await fs.promises.readdir(safeBase);

    return items
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(relativePath, f)); // Return relative paths to the frontend
  } catch (err) {
    console.error(`[FS] Error listing files: ${err.message}`);
    throw err;
  }
});

ipcMain.handle("fs:deleteFile", async (_, baseDir, relativePath) => {
  try {
    const safePath = resolveSafePath(baseDir, relativePath);
    return fs.promises.unlink(safePath);
  } catch (err) {
    console.error(`[FS] Error deleting file: ${err.message}`);
    throw err;
  }
});

// ------------------------------------------
// SETTINGS HANDLERS
// ------------------------------------------
ipcMain.handle("settings:read", async () => {
  const settingsDir = path.resolve(app.getPath("userData"), "Settings");
  try {
    const settingsPath = resolveSafePath(settingsDir, "settings.json");
    const data = await fs.promises.readFile(settingsPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or error, return empty object
    return {};
  }
});

ipcMain.handle("settings:write", async (_, data) => {
  const settingsDir = path.resolve(app.getPath("userData"), "Settings");

  try {
    const settingsPath = resolveSafePath(settingsDir, "settings.json");
    await fs.promises.mkdir(settingsDir, { recursive: true });
    await fs.promises.writeFile(settingsPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to write settings:", error);
    return false;
  }
});
