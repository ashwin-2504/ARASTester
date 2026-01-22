const { spawn } = require("child_process");
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

printBanner();
log("RUNNER", "info", "Starting development environment...");

// Resolve paths to executables directly to avoid shell wrappers
// This ensures we get actual PIDs and can kill processes reliably
const electronPath = path.join(
  __dirname,
  "node_modules",
  "electron",
  "dist",
  "electron.exe",
);
const vitePath = path.join(__dirname, "node_modules", "vite", "bin", "vite.js");

// Variables to hold process references
let viteProcess = null;
let electronProcess = null;

// Start Vite
log("RUNNER", "info", "Starting Vite dev server...");
// Run: node path/to/vite.js
viteProcess = spawn("node", [vitePath], {
  stdio: "inherit",
  shell: false,
  cwd: __dirname,
});

viteProcess.on("error", (err) => {
  log("VITE", "error", `Failed to start: ${err.message}`);
});

// Wait for Vite to be ready
log("RUNNER", "info", "Waiting for Vite server (3s)...");

setTimeout(() => {
  log("RUNNER", "success", "Vite server should be ready!");
  log("RUNNER", "info", "Starting Electron...");

  // Run: path/to/electron.exe . --dev
  electronProcess = spawn(electronPath, [".", "--dev"], {
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
    cwd: __dirname,
    env: { ...process.env, ELECTRON_ENABLE_LOGGING: "true" },
  });

  electronProcess.stdout.on("data", (data) => {
    // Pass through Electron/Backend logs directly
    process.stdout.write(data);
  });

  let stderrBuffer = "";

  electronProcess.stderr.on("data", (data) => {
    stderrBuffer += data.toString();

    // Process line by line
    let newlineIndex;
    while ((newlineIndex = stderrBuffer.indexOf("\n")) !== -1) {
      const line = stderrBuffer.slice(0, newlineIndex + 1); // keep newline
      stderrBuffer = stderrBuffer.slice(newlineIndex + 1);

      // Filter out harmless DevTools errors
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
}, 3000); // Wait 3 seconds for Vite to spin up

function cleanup() {
  log("RUNNER", "info", "Cleaning up processes...");

  if (electronProcess) {
    try {
      log("RUNNER", "info", "Stopping Electron...");
      // SIGINT lets Electron close gracefully (runs 'will-quit')
      electronProcess.kill("SIGINT");
      // If it hangs, the OS usually cleans up when parent node dies?
      // Not always on Windows.
    } catch (e) {
      log("RUNNER", "error", `Failed to stop Electron: ${e.message}`);
    }
  }

  if (viteProcess) {
    try {
      log("RUNNER", "info", "Stopping Vite...");
      viteProcess.kill();
    } catch (e) {
      log("RUNNER", "error", `Failed to stop Vite: ${e.message}`);
    }
  }
}

function exitHandler() {
  cleanup();
  log("RUNNER", "success", "Cleanup complete. Goodbye!");
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
