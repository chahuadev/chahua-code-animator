#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import electronBinary from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appDir = path.resolve(__dirname);
const userArgs = process.argv.slice(2);

const child = spawn(electronBinary, [appDir, ...userArgs], {
    stdio: 'inherit',
    env: {
        ...process.env,
        CHAHAUA_LAUNCH_CHANNEL: process.env.CHAHAUA_LAUNCH_CHANNEL || 'npm-cli'
    }
});

child.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
        return;
    }
    process.exit(code ?? 0);
});

child.on('error', (error) => {
    console.error('[CLI] Failed to launch Electron:', error.message);
    process.exit(1);
});
