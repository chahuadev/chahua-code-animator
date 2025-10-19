// ══════════════════════════════════════════════════════════════════════════════
//  บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
//  Chahua Code Animator - Main Process
//  Version: 1.0.0
// ══════════════════════════════════════════════════════════════════════════════

// ! ══════════════════════════════════════════════════════════════════════════════
// !  บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// !  Repository: https://github.com/chahuadev/chahua-code-animator.git
// !  Version: 1.0.0
// !  License: MIT
// !  Contact: chahuadev@gmail.com
// ! ══════════════════════════════════════════════════════════════════════════════

import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SecurityManager } from './security-core.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize security manager
const securityManager = new SecurityManager({
    ALLOW_SYMLINKS: false,
    VERIFY_FILE_INTEGRITY: true
});

let mainWindow;
let animationWindow;

// ══════════════════════════════════════════════════════════════════════════════
//                         Telemetry Helpers
// ══════════════════════════════════════════════════════════════════════════════

function recordAppLaunchTelemetry() {
    try {
        const telemetryDir = path.join(__dirname, 'workspace', 'telemetry');
        if (!fs.existsSync(telemetryDir)) {
            fs.mkdirSync(telemetryDir, { recursive: true });
        }

        const logFile = path.join(telemetryDir, 'first-run-log.json');
        let entries = [];

        if (fs.existsSync(logFile)) {
            try {
                const raw = fs.readFileSync(logFile, 'utf8');
                entries = JSON.parse(raw);
            } catch (parseError) {
                console.warn('[Telemetry] Existing log unreadable, resetting telemetry store.', parseError.message);
                entries = [];
            }
        }

        if (!Array.isArray(entries)) {
            entries = [];
        }

        const isFirstRun = entries.length === 0;
        entries.push({
            event: isFirstRun ? 'first-run' : 'app-launch',
            channel: process.env.CHAHAUA_LAUNCH_CHANNEL || 'desktop',
            timestamp: new Date().toISOString()
        });

        fs.writeFileSync(logFile, JSON.stringify(entries, null, 2));

        if (isFirstRun) {
            console.log('[Telemetry] First-run event recorded.');
        }
    } catch (error) {
        console.warn('[Telemetry] Unable to write first-run log:', error.message);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                         Window Management
// ══════════════════════════════════════════════════════════════════════════════

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        backgroundColor: '#0f172a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false
        },
    icon: path.join(__dirname, '..', 'logo.png'),
        title: 'Chahua Code Animator',
        show: false
    });

    mainWindow.loadFile('renderer/index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (process.env.NODE_ENV === 'development') {
            mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (animationWindow) {
            animationWindow.close();
        }
    });
}

function createAnimationWindow() {
    if (animationWindow) {
        animationWindow.focus();
        return;
    }

    const referenceBounds = mainWindow ? mainWindow.getBounds() : screen.getPrimaryDisplay().bounds;
    const display = screen.getDisplayMatching(referenceBounds);
    const { width: screenWidth, height: screenHeight } = display.workAreaSize;
    
    // ปรับขนาดให้พอดีในจอ - ลด 80 pixel เพื่อเผื่อขอบและ taskbar
    const targetWidth = Math.floor(screenWidth * 0.80);
    const targetHeight = Math.floor(screenHeight * 0.80);

    animationWindow = new BrowserWindow({
        width: targetWidth,
        height: targetHeight,
        minWidth: 700,
        minHeight: 450,
        backgroundColor: '#0f172a',
        resizable: true,
        autoHideMenuBar: true,
        useContentSize: true,
        frame: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true
        },
        parent: mainWindow,
        modal: false,
        title: 'Animation Preview',
        show: false
    });

    animationWindow.loadFile('renderer/animation.html');

    animationWindow.once('ready-to-show', () => {
        animationWindow.show();
        animationWindow.center();
    });

    animationWindow.on('closed', () => {
        animationWindow = null;
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//                         IPC Handlers - Secure Communication
// ══════════════════════════════════════════════════════════════════════════════

// File Selection Handler
ipcMain.handle('dialog:openFile', async () => {
    try {
        const workspaceDir = path.join(__dirname, 'workspace');
        
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            defaultPath: workspaceDir,
            filters: [
                { 
                    name: 'Code Files', 
                    extensions: securityManager.config.ALLOWED_EXTENSIONS.map(ext => ext.replace('.', ''))
                },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (result.canceled || result.filePaths.length === 0) {
            return { success: false, canceled: true };
        }

        return { 
            success: true, 
            filePath: result.filePaths[0]
        };
    } catch (error) {
        console.error('File dialog error:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
});

// Secure File Read Handler
ipcMain.handle('file:read', async (event, filePath) => {
    try {
        // Full security validation
        const result = await securityManager.secureReadFile(filePath);
        
        return {
            success: true,
            content: result.content,
            filePath: result.filePath,
            size: result.size,
            hash: result.hash,
            fileName: path.basename(result.filePath),
            extension: path.extname(result.filePath)
        };
    } catch (error) {
        console.error('Secure file read error:', error);
        
        return {
            success: false,
            error: error.message,
            errorType: error.name,
            errorCode: error.errorCode
        };
    }
});

// File Validation Handler
ipcMain.handle('file:validate', async (event, filePath) => {
    try {
        const validation = await securityManager.validateFile(filePath);
        
        return {
            success: true,
            valid: true,
            ...validation
        };
    } catch (error) {
        return {
            success: false,
            valid: false,
            error: error.message,
            errorType: error.name
        };
    }
});

// Animation Window Handler
ipcMain.handle('animation:open', async () => {
    try {
        createAnimationWindow();
        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
});

// Animation Data Transfer
ipcMain.handle('animation:transfer', async (event, animationData) => {
    try {
        if (!animationWindow) {
            throw new Error('Animation window not open');
        }

        // Validate animation data
        if (!animationData || !animationData.code) {
            throw new Error('Invalid animation data');
        }

        // Send to animation window
        animationWindow.webContents.send('animation:data', animationData);

        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
});

// Security Stats Handler
ipcMain.handle('security:getStats', async () => {
    try {
        const stats = securityManager.getSecurityStats();
        return { 
            success: true, 
            stats 
        };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
});

// Export Security Log
ipcMain.handle('security:exportLog', async () => {
    try {
        const log = securityManager.exportSecurityLog();
        
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Security Log',
            defaultPath: `security-log-${Date.now()}.json`,
            filters: [
                { name: 'JSON Files', extensions: ['json'] }
            ]
        });

        if (result.canceled) {
            return { success: false, canceled: true };
        }

        fs.writeFileSync(result.filePath, JSON.stringify(log, null, 2));

        return { 
            success: true, 
            filePath: result.filePath 
        };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
});

// ══════════════════════════════════════════════════════════════════════════════
//                         App Lifecycle
// ══════════════════════════════════════════════════════════════════════════════

app.whenReady().then(() => {
    recordAppLaunchTelemetry();
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Security: Disable web navigation
app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        event.preventDefault();
        console.warn('[SECURITY] Navigation blocked:', navigationUrl);
    });

    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        console.warn('[SECURITY] New window blocked:', navigationUrl);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    dialog.showErrorBox('Fatal Error', `An unexpected error occurred: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                     Chahua Code Animator v1.0.0                              ║
║              บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด                                ║
║                  Enterprise-Grade Security Enabled                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
