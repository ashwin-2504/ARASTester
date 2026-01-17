const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const red = '\x1b[31m';
const reset = '\x1b[0m';

console.log(`${cyan}Starting development environment...${reset}`);

// Resolve paths to executables directly to avoid shell wrappers
// This ensures we get actual PIDs and can kill processes reliably
const electronPath = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
const vitePath = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');

// Variables to hold process references
let viteProcess = null;
let electronProcess = null;

// Start Vite
console.log(`${cyan}Starting Vite...${reset}`);
// Run: node path/to/vite.js
viteProcess = spawn('node', [vitePath], {
  stdio: 'inherit',
  shell: false,
  cwd: __dirname
});

viteProcess.on('error', (err) => {
  console.error(`${red}Failed to start Vite:${reset}`, err);
});

// Wait for Vite to be ready
console.log(`${cyan}Waiting for Vite server...${reset}`);

setTimeout(() => {
  console.log(`${green}Starting Electron...${reset}`);

  // Run: path/to/electron.exe . --dev
  electronProcess = spawn(electronPath, ['.', '--dev'], {
    stdio: 'inherit',
    shell: false,
    cwd: __dirname
  });

  electronProcess.on('close', (code) => {
    console.log(`${cyan}Electron process exited with code ${code}${reset}`);
    exitHandler();
  });

  electronProcess.on('error', (err) => {
    console.error(`${red}Failed to start Electron:${reset}`, err);
    cleanup();
    process.exit(1);
  });

}, 3000); // Wait 3 seconds for Vite to spin up

function cleanup() {
  console.log(`${cyan}Cleaning up processes...${reset}`);

  if (electronProcess) {
    try {
      console.log('Killing Electron...');
      // SIGINT lets Electron close gracefully (runs 'will-quit')
      electronProcess.kill('SIGINT');
      // If it hangs, the OS usually cleans up when parent node dies? 
      // Not always on Windows. 
    } catch (e) { console.error(e); }
  }

  if (viteProcess) {
    try {
      console.log('Killing Vite...');
      viteProcess.kill();
    } catch (e) { console.error(e); }
  }
}

function exitHandler() {
  cleanup();
  process.exit();
}

// Handle termination signals
process.on('SIGINT', () => {
  console.log(`\n${red}Received SIGINT (Ctrl+C). Terminating...${reset}`);
  exitHandler();
});

process.on('SIGTERM', () => {
  console.log(`\n${red}Received SIGTERM. Terminating...${reset}`);
  exitHandler();
});
