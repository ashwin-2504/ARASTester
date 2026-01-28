const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const net = require("net");

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
};

/**
 * Format a log message with timestamp and source tag
 */
function log(source, level, message) {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });

  const sourceColors = {
    VITE: colors.yellow,
    ELECTRON: colors.blue,
    RUNNER: colors.cyan,
  };

  const levelConfig = {
    info: { color: colors.cyan, prefix: "[INFO]   " },
    success: { color: colors.green, prefix: "[OK]     " },
    warn: { color: colors.yellow, prefix: "[WARN]   " },
    error: { color: colors.red, prefix: "[ERROR]  " },
    debug: { color: colors.gray, prefix: "[DEBUG]  " },
  };

  const srcColor = sourceColors[source] || colors.white;
  const { color, prefix } = levelConfig[level] || levelConfig.info;

  console.log(
    `${colors.gray}[${timestamp}]${colors.reset} ${srcColor}[${source}]${colors.reset} ${color}${prefix}${colors.reset} ${color}${message}${colors.reset}`,
  );
}

/**
 * Print a decorative banner
 */
function printBanner() {
  console.log("");
  console.log(
    `${colors.cyan}${colors.bold}╔════════════════════════════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bold}║          🚀 ARAS Tester Development Environment            ║${colors.reset}`,
  );
  console.log(
    `${colors.cyan}${colors.bold}╚════════════════════════════════════════════════════════════╝${colors.reset}`,
  );
  console.log("");
}

/**
 * Find a free port using the OS native assignment (port 0)
 */
async function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref(); // Don't let this server prevent exit

    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });

    server.on("error", (err) => {
      reject(err);
    });
  });
}

printBanner();
log("RUNNER", "info", "Starting development environment...");

// Resolve paths to executables directly to avoid shell wrappers
const electronPath = path.join(
  __dirname,
  "node_modules",
  "electron",
  "dist",
  "electron.exe",
);

// Variables to hold process references
let viteProcess = null;
let electronProcess = null;

// Globals for ports
let VITE_PORT = 5173;
let BACKEND_PORT = 5000;
const POLLING_INTERVAL = 100; // ms
const MAX_RETRIES = 100; // 100 * 100ms = 10 seconds

function waitForVite(retryCount = 0) {
  if (retryCount >= MAX_RETRIES) {
    log("RUNNER", "error", "Timeout waiting for Vite server!");
    cleanup();
    process.exit(1);
    return;
  }

  const req = http.get(`http://localhost:${VITE_PORT}`, (res) => {
    if (res.statusCode === 200) {
      log("RUNNER", "success", "Vite server responded 200 OK!");
      log(
        "RUNNER",
        "info",
        "Waiting 500ms debounce to ensure bundle stability...",
      );

      setTimeout(() => {
        log("RUNNER", "success", "Vite is stable. Launching Electron...");
        startElectron();
      }, 500);
    } else {
      log("RUNNER", "info", `Vite responded ${res.statusCode}, waiting...`);
      setTimeout(() => waitForVite(retryCount + 1), POLLING_INTERVAL);
    }
  });

  req.on("error", (err) => {
    if (retryCount % 10 === 0) {
      log("RUNNER", "info", `Waiting for Vite server on port ${VITE_PORT}...`);
    }
    setTimeout(() => waitForVite(retryCount + 1), POLLING_INTERVAL);
  });

  req.end();
}

function startElectron() {
  log("RUNNER", "info", "Starting Electron...");

  // Pass dynamic ports to Electron env
  electronProcess = spawn(electronPath, [".", "--dev"], {
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
    cwd: __dirname,
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: "true",
      VITE_PORT: VITE_PORT.toString(),
      BACKEND_PORT: BACKEND_PORT.toString(),
    },
  });

  electronProcess.stdout.on("data", (data) => {
    process.stdout.write(data);
  });

  let stderrBuffer = "";

  electronProcess.stderr.on("data", (data) => {
    stderrBuffer += data.toString();
    let newlineIndex;
    while ((newlineIndex = stderrBuffer.indexOf("\n")) !== -1) {
      const line = stderrBuffer.slice(0, newlineIndex + 1);
      stderrBuffer = stderrBuffer.slice(newlineIndex + 1);
      if (
        !line.includes("Request Autofill.enable failed") &&
        !line.includes("Request Autofill.setAddresses failed") &&
        !line.includes("DevTools listening on")
      ) {
        process.stderr.write(line);
      }
    }
  });

  electronProcess.on("close", (code) => {
    log(
      "ELECTRON",
      code === 0 ? "info" : "warn",
      `Process exited with code ${code}`,
    );
    exitHandler();
  });

  electronProcess.on("error", (err) => {
    log("ELECTRON", "error", `Failed to start: ${err.message}`);
    cleanup();
    process.exit(1);
  });
}

// ===========================================
// MAIN STARTUP SEQUENCE
// ===========================================
(async () => {
  try {
    // 1. Find Open Ports (OS Assigned)
    BACKEND_PORT = await findAvailablePort();
    VITE_PORT = await findAvailablePort();

    // Safety check: ensure they are different (extremely unlikely but possible)
    if (VITE_PORT === BACKEND_PORT) {
      VITE_PORT = await findAvailablePort();
    }

    log("RUNNER", "info", `Allocated Backend Port: ${BACKEND_PORT}`);
    log("RUNNER", "info", `Allocated Vite Port:    ${VITE_PORT}`);

    // 2. Start Vite (Frontend)
    // Pass VITE_API_URL so the frontend knows where to find the backend
    log("RUNNER", "info", `Starting Vite dev server...`);

    // Use npx to run vite, which handles finding the executable in node_modules
    viteProcess = spawn(
      "npx.cmd", // Use npx.cmd on Windows, npx on Linux/Mac (but user is on Windows)
      ["vite", "--port", VITE_PORT.toString(), "--strictPort"],
      {
        stdio: "inherit",
        shell: true,
        cwd: __dirname,
        env: {
          ...process.env,
          // This tells the frontend where the backend live (so API client works)
          VITE_API_URL: `http://localhost:${BACKEND_PORT}`,
        },
      },
    );

    viteProcess.on("error", (err) => {
      log("VITE", "error", `Failed to start: ${err.message}`);
    });

    // 3. Wait for Vite, then start Electron
    waitForVite();
  } catch (error) {
    log("RUNNER", "error", `Startup failed: ${error.message}`);
    process.exit(1);
  }
})();

const { execSync } = require("child_process");

/**
 * Robustly kill a process tree
 */
function killTree(pid, name) {
  try {
    if (process.platform === "win32") {
      // /F = force, /T = tree (child processes), /PID = specific process logic
      execSync(`taskkill /F /T /PID ${pid}`);
    } else {
      process.kill(pid, "SIGKILL");
    }
    log("RUNNER", "info", `Stopped ${name} (PID: ${pid})`);
  } catch (e) {
    // Process might already be gone
    // log("RUNNER", "warn", `Failed to stop ${name}: ${e.message}`);
  }
}

function cleanup() {
  log("RUNNER", "info", "Cleaning up processes...");

  if (electronProcess) {
    killTree(electronProcess.pid, "Electron");
  }

  if (viteProcess) {
    killTree(viteProcess.pid, "Vite");
  }
}

function exitHandler() {
  cleanup();
  log("RUNNER", "success", "Cleanup complete. Goodbye!");

  // Reset terminal: \x1b[0m (reset colors), \x1b[?25h (show cursor)
  process.stdout.write("\x1b[0m\x1b[?25h");

  process.exit();
}

// Handle termination signals
process.on("SIGINT", () => {
  console.log(""); // New line after ^C
  log("RUNNER", "warn", "Received SIGINT (Ctrl+C). Terminating...");
  exitHandler();
});

process.on("SIGTERM", () => {
  log("RUNNER", "warn", "Received SIGTERM. Terminating...");
  exitHandler();
});
