// ══════════════════════════════════════════════════════════════════════════════
//  Chahua Code Animator - Main Renderer Script
// ! ══════════════════════════════════════════════════════════════════════════════
// !  บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// !  Repository: https://github.com/chahuadev/chahua-code-animator.git
// !  Version: 1.0.0
// !  License: MIT
// !  Contact: chahuadev@gmail.com
// ! ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
//                         State Management
// ══════════════════════════════════════════════════════════════════════════════

const state = {
    currentFile: null,
    fileContent: null,
    fileHash: null,
    selectedStyle: 'rain',
    settings: {
        speed: 1.0,
        blockSize: 10,
        linesPerBlock: 24,
        syntaxHighlight: true,
        showLineNumbers: false
    }
};

// ══════════════════════════════════════════════════════════════════════════════
//                         DOM Elements
// ══════════════════════════════════════════════════════════════════════════════

const elements = {
    dropZone: document.getElementById('dropZone'),
    selectFileBtn: document.getElementById('selectFileBtn'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileMeta: document.getElementById('fileMeta'),
    securityBadge: document.getElementById('securityBadge'),
    
    styleCards: document.querySelectorAll('.style-card'),
    
    speedSlider: document.getElementById('speedSlider'),
    speedValue: document.getElementById('speedValue'),
    blockSizeSlider: document.getElementById('blockSizeSlider'),
    blockSizeValue: document.getElementById('blockSizeValue'),
    linesSlider: document.getElementById('linesSlider'),
    linesValue: document.getElementById('linesValue'),
    syntaxHighlight: document.getElementById('syntaxHighlight'),
    showLineNumbers: document.getElementById('showLineNumbers'),
    
    previewBtn: document.getElementById('previewBtn'),
    playBtn: document.getElementById('playBtn'),
    previewContent: document.getElementById('previewContent'),
    previewStats: document.getElementById('previewStats'),
    previewArea: document.getElementById('previewArea'),
    mainContent: document.getElementById('mainContent'),
    sidebar: document.getElementById('sidebarPanel'),
    sidebarResizer: document.getElementById('sidebarResizer'),
    
    securityStatsBtn: document.getElementById('securityStatsBtn'),
    exportLogBtn: document.getElementById('exportLogBtn'),
    securityModal: document.getElementById('securityModal'),
    closeSecurityModal: document.getElementById('closeSecurityModal'),
    securityStatsContent: document.getElementById('securityStatsContent'),
    
    toastContainer: document.getElementById('toastContainer')
};

const SIDEBAR_DIMENSIONS = {
    min: Number.parseInt(elements.sidebarResizer?.getAttribute('aria-valuemin') || '260', 10),
    max: Number.parseInt(elements.sidebarResizer?.getAttribute('aria-valuemax') || '560', 10),
    default: Number.parseInt(elements.sidebarResizer?.getAttribute('aria-valuenow') || '380', 10)
};

// ══════════════════════════════════════════════════════════════════════════════
//                         Utility Functions
// ══════════════════════════════════════════════════════════════════════════════

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const title = document.createElement('div');
    title.className = 'toast-title';
    title.textContent = 'chahua-code-animator';

    const body = document.createElement('div');
    body.className = 'toast-message';
    body.textContent = message;

    toast.appendChild(title);
    toast.appendChild(body);
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatHash(hash) {
    if (!hash) return '';
    return hash.substring(0, 8) + '...' + hash.substring(hash.length - 8);
}

function getSidebarWidth() {
    const raw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'));
    return Number.isFinite(raw) ? raw : SIDEBAR_DIMENSIONS.default;
}

function setSidebarWidth(width) {
    const clamped = Math.min(Math.max(width, SIDEBAR_DIMENSIONS.min), SIDEBAR_DIMENSIONS.max);
    document.documentElement.style.setProperty('--sidebar-width', `${clamped}px`);
    if (elements.sidebarResizer) {
        elements.sidebarResizer.setAttribute('aria-valuenow', String(Math.round(clamped)));
    }
    return clamped;
}

function initSidebarResizer() {
    if (!elements.sidebarResizer || !elements.mainContent) {
        return;
    }

    let isResizing = false;
    let activePointerId = null;

    const updateWidthFromClientX = (clientX) => {
        const bounds = elements.mainContent.getBoundingClientRect();
        const proposedWidth = clientX - bounds.left;
        return setSidebarWidth(proposedWidth);
    };

    const stopResizing = (pointerId) => {
        if (!isResizing) {
            return;
        }
        if (pointerId !== undefined && activePointerId !== null && pointerId !== activePointerId) {
            return;
        }
        isResizing = false;
        elements.mainContent.classList.remove('resizing');
        document.body.classList.remove('sidebar-resizing');
        if (activePointerId !== null) {
            elements.sidebarResizer.releasePointerCapture(activePointerId);
            activePointerId = null;
        }
    };

    elements.sidebarResizer.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        isResizing = true;
        activePointerId = event.pointerId;
        elements.sidebarResizer.setPointerCapture(activePointerId);
        elements.sidebarResizer.focus();
        elements.mainContent.classList.add('resizing');
        document.body.classList.add('sidebar-resizing');
        updateWidthFromClientX(event.clientX);
    });

    elements.sidebarResizer.addEventListener('pointermove', (event) => {
        if (!isResizing || event.pointerId !== activePointerId) {
            return;
        }
        updateWidthFromClientX(event.clientX);
    });

    elements.sidebarResizer.addEventListener('pointerup', (event) => {
        stopResizing(event.pointerId);
    });

    elements.sidebarResizer.addEventListener('pointercancel', (event) => {
        stopResizing(event.pointerId);
    });

    window.addEventListener('blur', () => stopResizing());

    elements.sidebarResizer.addEventListener('dblclick', () => {
        setSidebarWidth(SIDEBAR_DIMENSIONS.default);
    });

    elements.sidebarResizer.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            const step = event.key === 'ArrowLeft' ? -16 : 16;
            setSidebarWidth(getSidebarWidth() + step);
        } else if (event.key === 'Home') {
            event.preventDefault();
            setSidebarWidth(SIDEBAR_DIMENSIONS.min);
        } else if (event.key === 'End') {
            event.preventDefault();
            setSidebarWidth(SIDEBAR_DIMENSIONS.max);
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setSidebarWidth(SIDEBAR_DIMENSIONS.default);
        }
    });

    setSidebarWidth(getSidebarWidth());
}

// ══════════════════════════════════════════════════════════════════════════════
//                         File Operations
// ══════════════════════════════════════════════════════════════════════════════

async function handleFileSelect() {
    try {
        const result = await window.electronAPI.openFileDialog();
        
        if (result.canceled) {
            return;
        }
        
        if (result.success) {
            await loadFile(result.filePath);
        } else {
            showToast('Failed to select file', 'error');
        }
    } catch (error) {
        console.error('File selection error:', error);
        showToast('Error selecting file: ' + error.message, 'error');
    }
}

async function loadFile(filePath) {
    try {
        showToast('Loading file...', 'info');
        
        // Read file with security validation
        const result = await window.electronAPI.readFile(filePath);
        
        if (!result.success) {
            showToast(`Security Error: ${result.error}`, 'error');
            return;
        }
        
        // Update state
        state.currentFile = result.filePath;
        state.fileContent = result.content;
        state.fileHash = result.hash;
        
        // Update UI
        updateFileInfo(result);
        updatePreview();
        enableButtons();
        
        showToast('File loaded successfully ', 'success');
        
    } catch (error) {
        console.error('File load error:', error);
        showToast('Failed to load file: ' + error.message, 'error');
    }
}

function updateFileInfo(fileData) {
    elements.fileName.textContent = fileData.fileName;
    elements.fileMeta.textContent = `${formatFileSize(fileData.size)} • ${fileData.extension}`;
    
    // Show security badge
    const badgeHTML = `
        <svg width="12" height="12" fill="currentColor">
            <path d="M6 1L2 3V6C2 8.5 3.5 11 6 12C8.5 11 10 8.5 10 6V3L6 1Z"/>
        </svg>
        Verified • ${formatHash(fileData.hash)}
    `;
    elements.securityBadge.innerHTML = badgeHTML;
    
    // Show file info panel
    elements.fileInfo.classList.add('active');
}

function updatePreview() {
    if (!state.fileContent) return;
    
    const lines = state.fileContent.split('\n');
    const totalLines = lines.length;
    const blocks = Math.ceil(totalLines / state.settings.linesPerBlock);
    
    // Create preview
    let previewHTML = '<div class="code-preview">';
    previewHTML += '<pre style="font-size: 0.875rem; color: #cbd5e1; line-height: 1.5;">';
    
    // Show first 20 lines
    const previewLines = lines.slice(0, 20);
    if (state.settings.syntaxHighlight) {
        previewHTML += highlightCode(previewLines.join('\n'));
    } else {
        previewHTML += previewLines.join('\n');
    }
    
    if (totalLines > 20) {
        previewHTML += `\n\n... ${totalLines - 20} more lines ...`;
    }
    
    previewHTML += '</pre></div>';
    
    elements.previewContent.innerHTML = previewHTML;
    elements.previewStats.innerHTML = ` ${totalLines} lines • ${blocks} blocks • ${state.selectedStyle} style`;
}

function highlightCode(code) {
    return code
        .replace(/&/g, '')
        .replace(/</g, '')
        .replace(/>/g, '')
        .replace(/(\/\/[^\n]*)/g, '<span style="color: #6b7280;">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6b7280;">$1</span>')
        .replace(/([\'\"][^\'\"]*[\'\"])/g, '<span style="color: #10b981;">$1</span>')
        .replace(/\b(class|function|const|let|var|if|else|switch|case|return|throw|try|catch|async|await|for|while|do|break|continue|new|this|super|extends|import|export|from|default|public|private|protected|static)\b/g, '<span style="color: #8b5cf6;">$1</span>')
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color: #f59e0b;">$1</span>');
}

function enableButtons() {
    elements.previewBtn.disabled = false;
    elements.playBtn.disabled = false;
}

// ══════════════════════════════════════════════════════════════════════════════
//                         Drag & Drop
// ══════════════════════════════════════════════════════════════════════════════

elements.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropZone.classList.add('drag-over');
});

elements.dropZone.addEventListener('dragleave', () => {
    elements.dropZone.classList.remove('drag-over');
});

elements.dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    const file = files[0];
    await loadFile(file.path);
});

// ══════════════════════════════════════════════════════════════════════════════
//                         Event Listeners
// ══════════════════════════════════════════════════════════════════════════════

// File Selection
elements.selectFileBtn.addEventListener('click', handleFileSelect);

// Style Selection
elements.styleCards.forEach(card => {
    card.addEventListener('click', () => {
        elements.styleCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.selectedStyle = card.dataset.style;
        
        if (state.fileContent) {
            updatePreview();
        }
        
        showToast(`Animation style: ${card.querySelector('.style-name').textContent}`, 'info');
    });
});

// Settings
elements.speedSlider.addEventListener('input', (e) => {
    state.settings.speed = parseFloat(e.target.value);
    elements.speedValue.textContent = state.settings.speed.toFixed(1) + 'x';
});

elements.blockSizeSlider.addEventListener('input', (e) => {
    state.settings.blockSize = parseInt(e.target.value);
    elements.blockSizeValue.textContent = state.settings.blockSize + 'px';
});

elements.linesSlider.addEventListener('input', (e) => {
    state.settings.linesPerBlock = parseInt(e.target.value);
    elements.linesValue.textContent = state.settings.linesPerBlock;
    
    if (state.fileContent) {
        updatePreview();
    }
});

elements.syntaxHighlight.addEventListener('change', (e) => {
    state.settings.syntaxHighlight = e.target.checked;
    
    if (state.fileContent) {
        updatePreview();
    }
});

elements.showLineNumbers.addEventListener('change', (e) => {
    state.settings.showLineNumbers = e.target.checked;
});

// Preview Button
elements.previewBtn.addEventListener('click', () => {
    if (!state.fileContent) return;
    
    showToast('Quick preview mode', 'info');
    // TODO: Implement quick preview
});

// Play Button
elements.playBtn.addEventListener('click', async () => {
    if (!state.fileContent) return;
    
    try {
        showToast('Opening animation window...', 'info');
        
        // Open animation window
        const result = await window.electronAPI.openAnimation();
        
        if (!result.success) {
            showToast('Failed to open animation window', 'error');
            return;
        }
        
        // Transfer animation data
        setTimeout(async () => {
            const transferResult = await window.electronAPI.transferAnimationData({
                code: state.fileContent,
                fileName: state.currentFile,
                style: state.selectedStyle,
                settings: state.settings
            });
            
            if (transferResult.success) {
                showToast('Animation started!', 'success');
            } else {
                showToast('Failed to transfer data', 'error');
            }
        }, 1000);
        
    } catch (error) {
        console.error('Animation error:', error);
        showToast('Error: ' + error.message, 'error');
    }
});

// Security Stats
elements.securityStatsBtn.addEventListener('click', async () => {
    try {
        elements.securityModal.classList.add('active');
        elements.securityStatsContent.innerHTML = '<div class="stats-loading">Loading...</div>';
        
        const result = await window.electronAPI.getSecurityStats();
        
        if (result.success) {
            const stats = result.stats;
            
            let html = '<div style="font-family: monospace; font-size: 0.875rem;">';
            html += `<h3 style="margin-bottom: 1rem;">System Security Statistics</h3>`;
            html += `<p><strong>Total Operations:</strong> ${stats.totalOperations}</p>`;
            html += `<p><strong>Uptime:</strong> ${(stats.uptime / 1000).toFixed(2)}s</p>`;
            html += `<p><strong>Rate Limit Entries:</strong> ${stats.rateLimitEntries}</p>`;
            html += `<p><strong>Cached Hashes:</strong> ${stats.cachedHashes}</p>`;
            html += `<h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Security Configuration</h4>`;
            html += `<pre style="background: #0f172a; padding: 1rem; border-radius: 0.5rem; overflow: auto;">`;
            html += JSON.stringify(stats.config, null, 2);
            html += `</pre></div>`;
            
            elements.securityStatsContent.innerHTML = html;
        } else {
            elements.securityStatsContent.innerHTML = `<p style="color: #ef4444;">Error: ${result.error}</p>`;
        }
    } catch (error) {
        console.error('Security stats error:', error);
        elements.securityStatsContent.innerHTML = `<p style="color: #ef4444;">Error: ${error.message}</p>`;
    }
});

elements.closeSecurityModal.addEventListener('click', () => {
    elements.securityModal.classList.remove('active');
});

elements.securityModal.addEventListener('click', (e) => {
    if (e.target === elements.securityModal) {
        elements.securityModal.classList.remove('active');
    }
});

// Export Log
elements.exportLogBtn.addEventListener('click', async () => {
    try {
        showToast('Exporting security log...', 'info');
        
        const result = await window.electronAPI.exportSecurityLog();
        
        if (result.success) {
            showToast('Security log exported successfully ', 'success');
        } else if (!result.canceled) {
            showToast('Failed to export log', 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error: ' + error.message, 'error');
    }
});

// ══════════════════════════════════════════════════════════════════════════════
//                         Initialization
// ══════════════════════════════════════════════════════════════════════════════

initSidebarResizer();

console.log(' Chahua Code Animator initialized');
console.log(' Security: ENABLED');

// Welcome message
setTimeout(() => {
    showToast('Welcome to Chahua Code Animator! ', 'success');
}, 500);
