const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const reset = '\x1b[0m';

console.log(`${cyan}Starting development environment...${reset}`);

// Start Vite server
const vite = spawn('npm', ['run', 'dev:server'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
});

// Wait for Vite to be ready (approximate)
// ideally we would parse stdout, but since we use inherit, we just wait a bit
console.log(`${cyan}Waiting for Vite server...${reset}`);

setTimeout(() => {
  console.log(`${green}Starting Electron...${reset}`);

  const electron = spawn('npm', ['run', 'dev:electron'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  electron.on('close', (code) => {
    console.log(`${cyan}Electron process exited with code ${code}${reset}`);
    vite.kill();
    process.exit(code);
  });

  electron.on('error', (err) => {
    console.error('Failed to start Electron:', err);
    vite.kill();
    process.exit(1);
  });

}, 3000); // Wait 3 seconds for Vite to spin up

// Handle script termination
process.on('SIGINT', () => {
  vite.kill();
  process.exit();
});
