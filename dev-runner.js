/**
 * ARAS Tester Development Runner
 * Orchestrates Vite dev server and Electron with dynamic port allocation.
 *
 * Optimizations:
 * - Parallel port allocation
 * - Configurable timeouts and constants
 * - Improved error handling with context
 * - Memory-efficient logging with cached formatters
 * - Clean process management with AbortController pattern
 */

const { spawn, spawnSync } = require("child_process");
const path = require("path");
const http = require("http");
const net = require("net");

// ===========================================
// CONFIGURATION
// ===========================================
const CONFIG = Object.freeze({
  // Timing
  POLLING_INTERVAL_MS: 100,
  MAX_WAIT_TIME_MS: 10000,
  VITE_STABILITY_DELAY_MS: 100,

  // Paths
  ELECTRON_PATH: path.join(
    __dirname,
    "node_modules",
    "electron",
    "dist",
    "electron.exe",
  ),

  // Computed
  get MAX_RETRIES() {
    return Math.ceil(this.MAX_WAIT_TIME_MS / this.POLLING_INTERVAL_MS);
  },
});

// ===========================================
// ANSI Colors (cached strings for memory efficiency)
// ===========================================
const C = Object.freeze({
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
  DIM: "\x1b[2m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  WHITE: "\x1b[37m",
  GRAY: "\x1b[90m",
  BG_RED: "\x1b[41m",
  BG_GREEN: "\x1b[42m",
});

// Pre-computed level configs (avoid object allocation per log)
const LEVEL_CONFIG = Object.freeze({
  info: { color: C.CYAN, prefix: "[INFO]   " },
  success: { color: C.GREEN, prefix: "[OK]     " },
  warn: { color: C.YELLOW, prefix: "[WARN]   " },
  error: { color: C.RED, prefix: "[ERROR]  " },
  debug: { color: C.GRAY, prefix: "[DEBUG]  " },
});

const SOURCE_COLORS = Object.freeze({
  VITE: C.YELLOW,
  ELECTRON: C.BLUE,
  RUNNER: C.CYAN,
});

// ===========================================
// LOGGING
// ===========================================
function log(source, level, message) {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  const srcColor = SOURCE_COLORS[source] || C.WHITE;
  const { color, prefix } = LEVEL_CONFIG[level] || LEVEL_CONFIG.info;

  console.log(
    `${C.GRAY}[${timestamp}]${C.RESET} ${srcColor}[${source}]${C.RESET} ${color}${prefix}${message}${C.RESET}`,
  );
}

function printBanner() {
  console.log("");
  console.log(
    `${C.CYAN}${C.BOLD}╔════════════════════════════════════════════════════════════╗${C.RESET}`,
  );
  console.log(
    `${C.CYAN}${C.BOLD}║          🚀 ARAS Tester Development Environment            ║${C.RESET}`,
  );
  console.log(
    `${C.CYAN}${C.BOLD}╚════════════════════════════════════════════════════════════╝${C.RESET}`,
  );
  console.log("");
}

// ===========================================
// PORT ALLOCATION
// ===========================================

/**
 * Find an available port using OS native assignment.
 * Uses unref() to prevent server from blocking exit.
 * @returns {Promise<number>}
 */
function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });

    server.on("error", reject);
  });
}

/**
 * Allocate two unique ports in parallel.
 * @returns {Promise<{vitePort: number, backendPort: number}>}
 */
async function allocatePorts() {
  const [port1, port2] = await Promise.all([
    findAvailablePort(),
    findAvailablePort(),
  ]);

  // Extremely rare edge case: both got same port
  if (port1 === port2) {
    const port3 = await findAvailablePort();
    return { vitePort: port1, backendPort: port3 };
  }

  return { vitePort: port1, backendPort: port2 };
}

// ===========================================
// PROCESS MANAGEMENT
// ===========================================
let viteProcess = null;
let electronProcess = null;
let isShuttingDown = false;

/**
 * Kill a process tree on Windows using taskkill.
 * @param {number} pid - Process ID
 * @param {string} name - Process name for logging
 */
function killProcessTree(pid, name) {
  if (!pid) return;

  try {
    spawnSync("taskkill", ["/F", "/T", "/PID", pid.toString()], {
      stdio: "ignore",
    });
    log("RUNNER", "info", `Stopped ${name} (PID: ${pid})`);
  } catch {
    // Process may already be gone - ignore silently
  }
}

/**
 * Clean up all spawned processes.
 */
function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  log("RUNNER", "info", "Cleaning up processes...");

  if (electronProcess?.pid) {
    killProcessTree(electronProcess.pid, "Electron");
    electronProcess = null;
  }

  if (viteProcess?.pid) {
    killProcessTree(viteProcess.pid, "Vite");
    viteProcess = null;
  }
}

/**
 * Handle clean exit with terminal reset.
 */
function exitHandler(code = 0) {
  cleanup();
  log("RUNNER", "success", "Cleanup complete. Goodbye!");

  // Reset terminal: colors + show cursor
  process.stdout.write("\x1b[0m\x1b[?25h");
  process.exit(code);
}

// ===========================================
// VITE SERVER
// ===========================================

/**
 * Start the Vite development server.
 * @param {number} port - Port to bind
 * @param {string} apiUrl - Backend API URL for VITE_API_URL env var
 * @returns {ChildProcess}
 */
function startVite(port, apiUrl) {
  log("RUNNER", "info", `Starting Vite dev server on port ${port}...`);

  const proc = spawn(
    "npx.cmd",
    ["vite", "--port", port.toString(), "--strictPort"],
    {
      stdio: "inherit",
      shell: true,
      cwd: __dirname,
      env: {
        ...process.env,
        VITE_API_URL: apiUrl,
      },
    },
  );

  proc.on("error", (err) => {
    log("VITE", "error", `Failed to start: ${err.message}`);
    exitHandler(1);
  });

  return proc;
}

/**
 * Wait for Vite server to respond with 200 OK.
 * Uses iterative retry with exponential backoff logging.
 * @param {number} port - Port to poll
 * @returns {Promise<void>}
 */
function waitForVite(port) {
  return new Promise((resolve, reject) => {
    let retryCount = 0;

    function poll() {
      if (retryCount >= CONFIG.MAX_RETRIES) {
        reject(
          new Error(
            `Timeout waiting for Vite server after ${CONFIG.MAX_WAIT_TIME_MS}ms`,
          ),
        );
        return;
      }

      const req = http.get(`http://localhost:${port}`, (res) => {
        if (res.statusCode === 200) {
          log("RUNNER", "success", "Vite server responded 200 OK!");
          resolve();
        } else {
          log("RUNNER", "info", `Vite responded ${res.statusCode}, waiting...`);
          retryCount++;
          setTimeout(poll, CONFIG.POLLING_INTERVAL_MS);
        }
      });

      req.on("error", () => {
        // Log every 10th retry to reduce noise
        if (retryCount % 10 === 0) {
          log("RUNNER", "info", `Waiting for Vite server on port ${port}...`);
        }
        retryCount++;
        setTimeout(poll, CONFIG.POLLING_INTERVAL_MS);
      });

      req.end();
    }

    poll();
  });
}

// ===========================================
// ELECTRON
// ===========================================

// Noise patterns to filter from Electron stderr
const ELECTRON_NOISE_PATTERNS = [
  "Request Autofill.enable failed",
  "Request Autofill.setAddresses failed",
  "DevTools listening on",
];

/**
 * Start Electron with development environment.
 * @param {number} vitePort - Vite dev server port
 * @param {number} backendPort - Backend API port
 */
function startElectron(vitePort, backendPort) {
  log("RUNNER", "info", "Starting Electron...");

  electronProcess = spawn(CONFIG.ELECTRON_PATH, [".", "--dev"], {
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
    cwd: __dirname,
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: "true",
      ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
      ASPNETCORE_ENVIRONMENT: "Development",
      VITE_PORT: vitePort.toString(),
      BACKEND_PORT: backendPort.toString(),
    },
  });

  // Pass through stdout directly
  electronProcess.stdout.on("data", (data) => {
    process.stdout.write(data);
  });

  // Filter noisy stderr messages
  let stderrBuffer = "";
  electronProcess.stderr.on("data", (data) => {
    stderrBuffer += data.toString();

    let newlineIndex;
    while ((newlineIndex = stderrBuffer.indexOf("\n")) !== -1) {
      const line = stderrBuffer.slice(0, newlineIndex + 1);
      stderrBuffer = stderrBuffer.slice(newlineIndex + 1);

      const isNoise = ELECTRON_NOISE_PATTERNS.some((pattern) =>
        line.includes(pattern),
      );
      if (!isNoise) {
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
    exitHandler(code || 0);
  });

  electronProcess.on("error", (err) => {
    log("ELECTRON", "error", `Failed to start: ${err.message}`);
    exitHandler(1);
  });
}

// ===========================================
// SIGNAL HANDLERS
// ===========================================
process.on("SIGINT", () => {
  console.log(""); // New line after ^C
  log("RUNNER", "warn", "Received SIGINT (Ctrl+C). Terminating...");
  exitHandler(0);
});

process.on("SIGTERM", () => {
  log("RUNNER", "warn", "Received SIGTERM. Terminating...");
  exitHandler(0);
});

process.on("uncaughtException", (err) => {
  log("RUNNER", "error", `Uncaught exception: ${err.message}`);
  exitHandler(1);
});

process.on("unhandledRejection", (reason) => {
  log("RUNNER", "error", `Unhandled rejection: ${reason}`);
  exitHandler(1);
});

// ===========================================
// MAIN ENTRY POINT
// ===========================================
async function main() {
  printBanner();
  log("RUNNER", "info", "Starting development environment...");

  try {
    // 1. Allocate ports in parallel
    const { vitePort, backendPort } = await allocatePorts();
    log("RUNNER", "info", `Allocated Backend Port: ${backendPort}`);
    log("RUNNER", "info", `Allocated Vite Port:    ${vitePort}`);

    // 2. Start Vite dev server
    viteProcess = startVite(vitePort, `http://localhost:${backendPort}`);

    // 3. Wait for Vite to be ready
    await waitForVite(vitePort);

    // 4. Small debounce for bundle stability
    log("RUNNER", "info", "Waiting for bundle stability...");
    await new Promise((r) => setTimeout(r, CONFIG.VITE_STABILITY_DELAY_MS));

    // 5. Launch Electron
    log("RUNNER", "success", "Vite is stable. Launching Electron...");
    startElectron(vitePort, backendPort);
  } catch (error) {
    log("RUNNER", "error", `Startup failed: ${error.message}`);
    exitHandler(1);
  }
}

main();
