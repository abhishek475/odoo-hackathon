import { spawn } from 'node:child_process';

// Keep the existing package dev servers; shut both down when either exits.
const windows = process.platform === 'win32';
const children = ['backend', 'frontend'].map(folder => spawn(windows ? 'npm.cmd' : 'npm', ['--prefix', folder, 'run', 'dev'], { stdio: 'inherit', detached: !windows }));
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    try { if (!windows && child.pid) process.kill(-child.pid, 'SIGTERM'); else child.kill('SIGTERM'); }
    catch (error) { if (error.code !== 'ESRCH') console.error(error.message); }
  }
  process.exitCode = code;
}
for (const child of children) {
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => stop(code ?? 1));
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
