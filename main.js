// ══════════════════════════════════════════════════════════════════════════════
//  บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
//  Chahua Code Animator - Main Process
//  Version: 1.0.0
// ══════════════════════════════════════════════════════════════════════════════

// ! ══════════════════════════════════════════════════════════════════════════════
// !  บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// !  Repository: https://github.com/chahuadev/chahua-code-animator.git
// !  Version: 1.1.0
// !  License: MIT
// !  Contact: chahuadev@gmail.com
// ! ══════════════════════════════════════════════════════════════════════════════

import { app, BrowserWindow, ipcMain, dialog, screen, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SecurityManager } from './security-core.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const securityManager = new SecurityManager({
    ALLOW_SYMLINKS: false,
    VERIFY_FILE_INTEGRITY: true,
    EXTRA_ALLOWED_DIRS: []
});

let mainWindow;
let animationWindow;

// Per-user workspace (created under Electron's userData path)
let userWorkspace;
let workspaceCandidates = [];

const workspaceGuides = {
    en: path.join(__dirname, 'docs', 'en', 'WORKSPACE_GUIDE.md'),
    th: path.join(__dirname, 'docs', 'th', 'WORKSPACE_GUIDE.md')
};

const workspaceGuideUrls = {
    en: 'https://github.com/chahuadev/chahua-code-animator/blob/main/docs/en/WORKSPACE_GUIDE.md',
    th: 'https://github.com/chahuadev/chahua-code-animator/blob/main/docs/th/WORKSPACE_GUIDE.md'
};

function isDirectoryWritable(targetPath) {
    try {
        fs.accessSync(targetPath, fs.constants.W_OK);
        return true;
    } catch (error) {
        return false;
    }
}

function gatherWorkspaceCandidates() {
    const candidates = [];
    const seen = new Set();
    const isPackaged = app.isPackaged;

    const register = (targetPath, options = {}) => {
        if (!targetPath) {
            return;
        }

        const resolved = path.resolve(targetPath);
        if (seen.has(resolved)) {
            return;
        }
        seen.add(resolved);

        const record = {
            path: resolved,
            label: options.label || 'Workspace',
            type: options.type || 'general',
            priority: options.priority ?? 50,
            createIfMissing: Boolean(options.createIfMissing)
        };

        record.exists = fs.existsSync(resolved);
        record.writable = record.exists ? isDirectoryWritable(resolved) : false;
        candidates.push(record);
    };

    const projectWorkspace = path.join(__dirname, 'workspace');
    register(projectWorkspace, {
        label: 'Project Workspace',
        type: 'project',
        priority: isPackaged ? 80 : 10
    });

    const distWorkspace = path.join(__dirname, 'dist', 'workspace');
    register(distWorkspace, {
        label: 'Distribution Workspace',
        type: 'dist',
        priority: 40
    });

    if (process.resourcesPath) {
        register(path.join(process.resourcesPath, 'workspace'), {
            label: 'Resources Workspace',
            type: 'resources',
            priority: 20
        });
    }

    const execDir = path.dirname(process.execPath);
    register(path.join(execDir, 'workspace'), {
        label: 'Executable Workspace',
        type: 'runtime',
        priority: 25
    });

    if (process.platform === 'win32') {
        const programInstallPath = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Chahua Code Animator');
        register(path.join(programInstallPath, 'workspace'), {
            label: 'Installed Workspace',
            type: 'installed',
            priority: 30
        });
    }

    try {
        const userDataDir = app.getPath('userData');
        register(path.join(userDataDir, 'workspace'), {
            label: 'User Data Workspace',
            type: 'user',
            priority: isPackaged ? 5 : 15,
            createIfMissing: true
        });
    } catch (error) {
        console.warn('[Workspace] Unable to resolve userData path:', error.message);
    }

    return candidates.sort((a, b) => a.priority - b.priority);
}

function ensureUserWorkspace() {
    try {
        workspaceCandidates = gatherWorkspaceCandidates();

        for (const candidate of workspaceCandidates) {
            if (!candidate.exists && candidate.createIfMissing) {
                try {
                    fs.mkdirSync(candidate.path, { recursive: true });
                    candidate.exists = fs.existsSync(candidate.path);
                    candidate.writable = candidate.exists ? isDirectoryWritable(candidate.path) : false;
                } catch (error) {
                    console.warn(`[Workspace] Unable to create ${candidate.label} at ${candidate.path}:`, error.message);
                }
            }
        }

        let selected = workspaceCandidates.find(candidate => candidate.exists && candidate.writable)
            || workspaceCandidates.find(candidate => candidate.exists);

        if (!selected && workspaceCandidates.length > 0) {
            const fallbackCandidate = workspaceCandidates[0];
            try {
                fs.mkdirSync(fallbackCandidate.path, { recursive: true });
                fallbackCandidate.exists = fs.existsSync(fallbackCandidate.path);
                fallbackCandidate.writable = fallbackCandidate.exists ? isDirectoryWritable(fallbackCandidate.path) : false;
                if (fallbackCandidate.exists) {
                    selected = fallbackCandidate;
                }
            } catch (error) {
                console.warn('[Workspace] Fallback workspace creation failed:', error.message);
            }
        }

        if (!selected) {
            selected = {
                path: path.join(__dirname, 'workspace'),
                label: 'Fallback Workspace',
                type: 'fallback',
                exists: false,
                writable: false
            };
            try {
                fs.mkdirSync(selected.path, { recursive: true });
                selected.exists = fs.existsSync(selected.path);
                selected.writable = selected.exists ? isDirectoryWritable(selected.path) : false;
            } catch (error) {
                console.error('[Workspace] Critical failure creating fallback workspace:', error.message);
            }
            workspaceCandidates.push(selected);
        }

        userWorkspace = selected.path;

        if (!fs.existsSync(userWorkspace)) {
            fs.mkdirSync(userWorkspace, { recursive: true });
        }

        try {
            const keepFile = path.join(userWorkspace, '.keep');
            if (!fs.existsSync(keepFile)) {
                fs.writeFileSync(keepFile, '');
            }
        } catch (error) {
            console.warn('[Workspace] Unable to seed workspace keep file:', error.message);
        }

        const extraDirs = new Set(securityManager.config.EXTRA_ALLOWED_DIRS || []);
        workspaceCandidates.forEach(candidate => {
            if (candidate.exists) {
                extraDirs.add(candidate.path);
            }
        });
        extraDirs.add(userWorkspace);
        securityManager.config.EXTRA_ALLOWED_DIRS = Array.from(extraDirs);
    } catch (err) {
        console.warn('[Workspace] ensureUserWorkspace encountered an error:', err.message);
        userWorkspace = path.join(__dirname, 'workspace');
        if (!fs.existsSync(userWorkspace)) {
            try { fs.mkdirSync(userWorkspace, { recursive: true }); } catch (creationError) {
                console.error('[Workspace] Unable to create fallback workspace:', creationError.message);
            }
        }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                         Telemetry Helpers
// ══════════════════════════════════════════════════════════════════════════════

function recordAppLaunchTelemetry() {
    try {
        const telemetryDir = path.join(userWorkspace || path.join(__dirname, 'workspace'), 'telemetry');
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
        let workspaceDir = userWorkspace;
        if (!workspaceDir || !fs.existsSync(workspaceDir)) {
            const firstAvailable = workspaceCandidates.find(candidate => candidate.exists);
            workspaceDir = firstAvailable ? firstAvailable.path : path.join(__dirname, 'workspace');
        }
        
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            defaultPath: workspaceDir,
            title: 'Select Workspace File',
            message: `Browse for a file saved inside the workspace folder (${workspaceDir})`,
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

// Workspace helpers
ipcMain.handle('workspace:getInfo', async () => {
    try {
        const snapshot = workspaceCandidates.map(candidate => ({
            path: candidate.path,
            label: candidate.label,
            type: candidate.type,
            exists: fs.existsSync(candidate.path),
            writable: fs.existsSync(candidate.path) ? isDirectoryWritable(candidate.path) : candidate.writable
        }));

        const activePath = (userWorkspace && fs.existsSync(userWorkspace))
            ? userWorkspace
            : (snapshot.find(item => item.exists)?.path || userWorkspace || path.join(__dirname, 'workspace'));

        const guides = Object.fromEntries(Object.entries(workspaceGuides).map(([language, guidePath]) => [
            language,
            {
                path: guidePath,
                exists: fs.existsSync(guidePath)
            }
        ]));

        return {
            success: true,
            activePath,
            candidates: snapshot,
            isPackaged: app.isPackaged,
            guides
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('workspace:openFolder', async () => {
    try {
        const target = (userWorkspace && fs.existsSync(userWorkspace))
            ? userWorkspace
            : (workspaceCandidates.find(candidate => candidate.exists)?.path || userWorkspace);

        if (!target) {
            throw new Error('Workspace directory is not available yet.');
        }

        const result = await shell.openPath(target);
        if (result) {
            throw new Error(result);
        }

        return {
            success: true,
            path: target
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('workspace:openGuide', async (event, language = 'en') => {
    try {
        const langKey = typeof language === 'string' ? language.toLowerCase() : 'en';
        const guidePath = workspaceGuides[langKey] || workspaceGuides.en;

        if (!guidePath || !fs.existsSync(guidePath)) {
            throw new Error(`Guide not found for language: ${langKey}`);
        }

        const result = await shell.openPath(guidePath);
        if (result) {
            throw new Error(result);
        }

        return {
            success: true,
            path: guidePath
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('workspace:openGuideOnline', async (event, language = 'en') => {
    try {
        const langKey = typeof language === 'string' ? language.toLowerCase() : 'en';
        const targetUrl = workspaceGuideUrls[langKey] || workspaceGuideUrls.en;

        if (!targetUrl) {
            throw new Error(`Online guide not configured for language: ${langKey}`);
        }

        await shell.openExternal(targetUrl);

        return {
            success: true,
            url: targetUrl
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
    ensureUserWorkspace();
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
