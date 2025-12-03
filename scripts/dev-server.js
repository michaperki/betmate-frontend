#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const env = {
  ...process.env,
  BROWSERSLIST_IGNORE_OLD_DATA: '1',
};

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const child = spawn(npmCmd, ['run', 'dev:webpack'], {
  cwd: path.resolve(__dirname, '..'),
  env,
  stdio: 'inherit',
  shell: isWindows, // Windows needs a shell for npm.cmd under spawn
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
