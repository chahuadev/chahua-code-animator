// ══════════════════════════════════════════════════════════════════════════════
//  Chahua Code Animator - Preload Script
//  Secure Bridge between Main and Renderer Processes
// ══════════════════════════════════════════════════════════════════════════════

// ! ══════════════════════════════════════════════════════════════════════════════
// !  บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// !  Repository: https://github.com/chahuadev/chahua-code-animator.git
// !  Version: 1.1.0
// !  License: MIT
// !  Contact: chahuadev@gmail.com
// ! ══════════════════════════════════════════════════════════════════════════════

const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of allowed channels
const ALLOWED_CHANNELS = {
    send: [
        'animation:data'
    ],
    invoke: [
        'dialog:openFile',
        'file:read',
        'file:validate',
        'animation:open',
        'animation:transfer',
        'security:getStats',
        'security:exportLog',
        'workspace:getInfo',
        'workspace:openFolder',
    'workspace:openGuide',
    'workspace:openGuideOnline'
    ],
    receive: [
        'animation:data'
    ]
};

// Validate channel name
function isValidChannel(channel, type) {
    return ALLOWED_CHANNELS[type]?.includes(channel);
}

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
    
    readFile: (filePath) => {
        if (typeof filePath !== 'string') {
            return Promise.reject(new Error('Invalid file path'));
        }
        return ipcRenderer.invoke('file:read', filePath);
    },
    
    validateFile: (filePath) => {
        if (typeof filePath !== 'string') {
            return Promise.reject(new Error('Invalid file path'));
        }
        return ipcRenderer.invoke('file:validate', filePath);
    },

    // Animation operations
    openAnimation: () => ipcRenderer.invoke('animation:open'),
    
    transferAnimationData: (data) => {
        if (!data || typeof data !== 'object') {
            return Promise.reject(new Error('Invalid animation data'));
        }
        return ipcRenderer.invoke('animation:transfer', data);
    },

    onAnimationData: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('animation:data', subscription);
        
        // Return unsubscribe function
        return () => {
            ipcRenderer.removeListener('animation:data', subscription);
        };
    },

    // Security operations
    getSecurityStats: () => ipcRenderer.invoke('security:getStats'),
    exportSecurityLog: () => ipcRenderer.invoke('security:exportLog'),

    // Workspace helpers
    getWorkspaceInfo: () => ipcRenderer.invoke('workspace:getInfo'),
    openWorkspaceFolder: () => ipcRenderer.invoke('workspace:openFolder'),
    openWorkspaceGuide: (language = 'en') => ipcRenderer.invoke('workspace:openGuide', language),
    openWorkspaceGuideOnline: (language = 'en') => ipcRenderer.invoke('workspace:openGuideOnline', language),

    // Utility
    getVersion: () => '1.0.0',
    getPlatform: () => process.platform
});

// Security logging
console.log('[PRELOAD] Secure context bridge initialized');
console.log('[PRELOAD] Available API methods:', Object.keys(window.electronAPI || {}));
