#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [, , platform = 'windows'] = process.argv;
const distDir = path.resolve('dist');
const telemetryDir = path.resolve('workspace', 'telemetry');
const metricsFile = path.join(telemetryDir, 'installer-metrics.json');

try {
    if (!fs.existsSync(distDir)) {
        console.error('[metrics] dist/ directory not found. Did you run the build?');
        process.exit(1);
    }

    if (!fs.existsSync(telemetryDir)) {
        fs.mkdirSync(telemetryDir, { recursive: true });
    }

    const artifacts = fs.readdirSync(distDir)
        .filter((file) => file.endsWith('.exe') || file.endsWith('.msi'))
        .map((file) => {
            const filePath = path.join(distDir, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                sizeBytes: stats.size,
                sizeMB: Number((stats.size / (1024 * 1024)).toFixed(2))
            };
        });

    const payload = {
        platform,
        timestamp: new Date().toISOString(),
        commit: process.env.COMMIT_HASH || null,
        artifacts
    };

    let log = [];
    if (fs.existsSync(metricsFile)) {
        try {
            const current = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
            if (Array.isArray(current)) {
                log = current;
            }
        } catch (error) {
            console.warn('[metrics] Existing metrics file unreadable, generating fresh log.', error.message);
        }
    }

    log.push(payload);
    fs.writeFileSync(metricsFile, JSON.stringify(log, null, 2));
    console.log(`[metrics] Recorded ${artifacts.length} installer artifacts for ${platform}.`);
} catch (error) {
    console.error('[metrics] Unable to record installer metrics:', error.message);
    process.exit(1);
}
