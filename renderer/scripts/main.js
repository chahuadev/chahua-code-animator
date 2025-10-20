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

const FONT_FAMILIES = {
    consolas: "'Consolas', 'Courier New', monospace",
    fira: "'Fira Code', 'Consolas', monospace",
    jetbrains: "'JetBrains Mono', 'Consolas', monospace",
    cascadia: "'Cascadia Code', 'Consolas', monospace"
};

const DEFAULT_SETTINGS = {
    speed: 1.0,
    blockSize: 10,
    linesPerBlock: 24,
    syntaxHighlight: true,
    showLineNumbers: false,
    fontFamily: 'consolas',
    wrapWidth: 70,
    bottomPadding: 140,
    cursorBlinkSpeed: 0.8,
    highlightCurrentLine: true,
    highContrast: false,
    autoLoop: false,
    startAssembled: false
};

const state = {
    currentFile: null,
    fileContent: null,
    fileHash: null,
    selectedStyle: 'typing',
    settings: { ...DEFAULT_SETTINGS }
};

const PRESENTATION_STYLE = 'presentation';

function isMarkdownPath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        return false;
    }
    return filePath.trim().toLowerCase().endsWith('.md');
}

function resolveFontFamily(key) {
    return FONT_FAMILIES[key] || FONT_FAMILIES.consolas;
}

function escapeHtml(source) {
    return source
        .replace(/&/g, '')
        .replace(/</g, '')
        .replace(/>/g, '');
}

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
    fontFamilySelect: document.getElementById('fontFamilySelect'),
    wrapWidthSlider: document.getElementById('wrapWidthSlider'),
    wrapWidthValue: document.getElementById('wrapWidthValue'),
    paddingSlider: document.getElementById('paddingSlider'),
    paddingValue: document.getElementById('paddingValue'),
    cursorSpeedSlider: document.getElementById('cursorSpeedSlider'),
    cursorSpeedValue: document.getElementById('cursorSpeedValue'),
    highlightCurrentLine: document.getElementById('highlightCurrentLine'),
    highContrast: document.getElementById('highContrast'),
    autoLoop: document.getElementById('autoLoop'),
    startAssembled: document.getElementById('startAssembled'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    
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

function syncSettingsUI() {
    elements.speedSlider.value = state.settings.speed;
    elements.speedValue.textContent = state.settings.speed.toFixed(1) + 'x';

    elements.blockSizeSlider.value = state.settings.blockSize;
    elements.blockSizeValue.textContent = state.settings.blockSize + 'px';

    elements.linesSlider.value = state.settings.linesPerBlock;
    elements.linesValue.textContent = state.settings.linesPerBlock;

    elements.syntaxHighlight.checked = state.settings.syntaxHighlight;
    elements.showLineNumbers.checked = state.settings.showLineNumbers;
    if (elements.highlightCurrentLine) {
        elements.highlightCurrentLine.checked = state.settings.highlightCurrentLine;
    }
    if (elements.highContrast) {
        elements.highContrast.checked = state.settings.highContrast;
    }
    if (elements.autoLoop) {
        elements.autoLoop.checked = state.settings.autoLoop;
    }
    if (elements.startAssembled) {
        elements.startAssembled.checked = state.settings.startAssembled;
    }

    if (elements.fontFamilySelect) {
        elements.fontFamilySelect.value = state.settings.fontFamily;
    }

    if (elements.wrapWidthSlider) {
        elements.wrapWidthSlider.value = state.settings.wrapWidth;
    }
    if (elements.wrapWidthValue) {
        elements.wrapWidthValue.textContent = state.settings.wrapWidth + 'vw';
    }

    if (elements.paddingSlider) {
        elements.paddingSlider.value = state.settings.bottomPadding;
    }
    if (elements.paddingValue) {
        elements.paddingValue.textContent = state.settings.bottomPadding + 'px';
    }

    if (elements.cursorSpeedSlider) {
        elements.cursorSpeedSlider.value = state.settings.cursorBlinkSpeed;
    }
    if (elements.cursorSpeedValue) {
        elements.cursorSpeedValue.textContent = state.settings.cursorBlinkSpeed.toFixed(1) + 's';
    }
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
    updateActionAvailability();
        
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
    if (!state.fileContent) {
        return;
    }

    if (state.selectedStyle === PRESENTATION_STYLE) {
        updatePresentationPreview();
    } else {
        updateTypingPreview();
    }
}

function updateTypingPreview() {
    const lines = state.fileContent.split('\n');
    const totalLines = lines.length;
    const blocks = Math.ceil(totalLines / state.settings.linesPerBlock);
    const wrapWidth = Math.min(Math.max(state.settings.wrapWidth || 70, 40), 120);
    const fontFamily = resolveFontFamily(state.settings.fontFamily);

    let previewHTML = `<div class="code-preview" style="font-family: ${fontFamily};">`;
    previewHTML += `<pre style="font-size: 0.875rem; color: #cbd5e1; line-height: 1.5; white-space: pre-wrap; max-width: min(${wrapWidth}vw, 900px);">`;

    const previewLines = lines.slice(0, 20);
    if (state.settings.syntaxHighlight) {
        previewHTML += highlightCode(previewLines.join('\n'));
    } else {
        previewHTML += escapeHtml(previewLines.join('\n'));
    }

    if (totalLines > 20) {
        previewHTML += `\n\n... ${totalLines - 20} more lines ...`;
    }

    previewHTML += '</pre></div>';

    elements.previewContent.innerHTML = previewHTML;
    elements.previewStats.innerHTML = ` ${totalLines} lines • ${blocks} blocks • ${state.selectedStyle} style • wrap ${wrapWidth}vw`;
}

function updatePresentationPreview() {
    const utils = window.presentationUtils;

    if (!utils) {
        elements.previewContent.innerHTML = `<div class="presentation-preview-card error"><h4>Presentation module unavailable</h4><p>ไม่พบสคริปต์สำหรับประมวลผล Markdown โปรดรีเฟรชหน้าต่าง</p></div>`;
        elements.previewStats.innerHTML = ' Presentation mode unavailable';
        return;
    }

    if (!isMarkdownPath(state.currentFile)) {
        elements.previewContent.innerHTML = `
            <div class="presentation-preview-card warning">
                <h4>เลือกไฟล์ Markdown (.md)</h4>
                <p>โหมดพรีเซนเทชั่นจะสร้างสไลด์จากเอกสาร Markdown เท่านั้น โปรดเลือกไฟล์สถานะหรือรายงานที่ต้องการ</p>
            </div>`;
        elements.previewStats.innerHTML = ' Waiting for Markdown source';
        return;
    }

    try {
        const model = utils.buildPresentationModel(state.fileContent);
        const slideTitles = model.slides.map(slide => slide.title).filter(Boolean);
        const itemsToShow = slideTitles.slice(0, 6).map((title, index) => `
            <li>
                <span class="index">${index + 1}</span>
                <div class="title">${utils.formatInline(title)}</div>
            </li>`).join('');

        const remaining = Math.max(slideTitles.length - 6, 0);
        const extraNotice = remaining > 0 ? `<div class="preview-more">+${remaining} หัวข้อเพิ่มเติม</div>` : '';

        const completed = model.checkboxCounts.completed;
        const total = model.checkboxCounts.total;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        elements.previewContent.innerHTML = `
            <div class="presentation-preview-card">
                <header>
                    <h3>${utils.formatInline(model.meta.title || 'Chahua Presentation')}</h3>
                    <p class="subtitle">${utils.formatInline(model.meta.subtitle || 'Auto-generated slide deck')}</p>
                    <div class="meta">
                        ${model.meta.lastUpdated ? `<span><strong>Updated:</strong> ${utils.escapeHtml(model.meta.lastUpdated)}</span>` : ''}
                        ${model.meta.author ? `<span><strong>Author:</strong> ${utils.escapeHtml(model.meta.author)}</span>` : ''}
                    </div>
                </header>
                <section class="slides-outline">
                    <ol>${itemsToShow || '<li class="empty">ยังไม่มีหัวข้อที่สามารถสรุปได้</li>'}</ol>
                    ${extraNotice}
                </section>
                <footer>
                    <div class="progress-label">Task Progress</div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${percent}%;"></div></div>
                    <div class="progress-meta">${total > 0 ? `${completed}/${total} รายการเสร็จสิ้น (${percent}%)` : 'ไม่มีเช็คลิสต์ในเอกสารนี้'}</div>
                </footer>
            </div>`;

        const progressText = total > 0 ? `${completed}/${total} tasks done` : 'No tracked tasks';
        elements.previewStats.innerHTML = ` ${slideTitles.length} slides • ${progressText}`;
    } catch (error) {
        console.error('Presentation preview error:', error);
        elements.previewContent.innerHTML = `
            <div class="presentation-preview-card error">
                <h4>ไม่สามารถสร้างพรีวิวได้</h4>
                <p>${utils.escapeHtml(error.message)}</p>
            </div>`;
        elements.previewStats.innerHTML = ' Preview error';
    }
}

function highlightCode(code) {
    return code
    let escaped = escapeHtml(code);
    const overlays = [];

    const apply = (regex, className) => {
        escaped = escaped.replace(regex, (match) => {
            const token = `__HL__${overlays.length}__`;
            overlays.push({ token, value: `<span style="color: ${className};">${match}</span>` });
            return token;
        });
    };

    apply(/\/\*[\s\S]*?\*\//g, '#6b7280');
    apply(/\/\/[^\n]*/g, '#6b7280');
    apply(/('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/g, '#10b981');
    apply(/\b\d+(?:\.\d+)?\b/g, '#f59e0b');
    apply(/\b(class|function|const|let|var|if|else|switch|case|return|throw|try|catch|async|await|for|while|do|break|continue|new|this|super|extends|import|export|from|default|public|private|protected|static)\b/g, '#8b5cf6');

    overlays.forEach(({ token, value }) => {
        escaped = escaped.replace(token, value);
    });

    return escaped;
}

function updateActionAvailability() {
    const hasFile = !!state.fileContent;
    // Quick Preview button removed; play button controls animation start

    let canPlay = hasFile;
    if (state.selectedStyle === PRESENTATION_STYLE) {
        canPlay = canPlay && isMarkdownPath(state.currentFile);
    }

    elements.playBtn.disabled = !canPlay;
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
        const nextStyle = card.dataset.style;
        state.selectedStyle = nextStyle;
        
        if (state.fileContent) {
            updatePreview();
        }

        updateActionAvailability();

        if (nextStyle === PRESENTATION_STYLE && state.fileContent && !isMarkdownPath(state.currentFile)) {
            showToast('Presentation mode requires a Markdown (.md) file', 'warning');
        } else {
            showToast(`Animation style: ${card.querySelector('.style-name').textContent}`, 'info');
        }
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

if (elements.fontFamilySelect) {
    elements.fontFamilySelect.addEventListener('change', (e) => {
        state.settings.fontFamily = e.target.value;
        if (state.fileContent) {
            updatePreview();
        }
    });
}

if (elements.wrapWidthSlider && elements.wrapWidthValue) {
    elements.wrapWidthSlider.addEventListener('input', (e) => {
        state.settings.wrapWidth = parseInt(e.target.value, 10);
        elements.wrapWidthValue.textContent = state.settings.wrapWidth + 'vw';
        if (state.fileContent) {
            updatePreview();
        }
    });
}

if (elements.paddingSlider && elements.paddingValue) {
    elements.paddingSlider.addEventListener('input', (e) => {
        state.settings.bottomPadding = parseInt(e.target.value, 10);
        elements.paddingValue.textContent = state.settings.bottomPadding + 'px';
    });
}

if (elements.cursorSpeedSlider && elements.cursorSpeedValue) {
    elements.cursorSpeedSlider.addEventListener('input', (e) => {
        state.settings.cursorBlinkSpeed = parseFloat(e.target.value);
        elements.cursorSpeedValue.textContent = state.settings.cursorBlinkSpeed.toFixed(1) + 's';
    });
}

if (elements.highlightCurrentLine) {
    elements.highlightCurrentLine.addEventListener('change', (e) => {
        state.settings.highlightCurrentLine = e.target.checked;
    });
}

if (elements.highContrast) {
    elements.highContrast.addEventListener('change', (e) => {
        state.settings.highContrast = e.target.checked;
    });
}

if (elements.autoLoop) {
    elements.autoLoop.addEventListener('change', (e) => {
        state.settings.autoLoop = e.target.checked;
    });
}

if (elements.startAssembled) {
    elements.startAssembled.addEventListener('change', (e) => {
        state.settings.startAssembled = e.target.checked;
    });
}

if (elements.resetSettingsBtn) {
    elements.resetSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.settings = { ...DEFAULT_SETTINGS };
        syncSettingsUI();
        if (state.fileContent) {
            updatePreview();
        }
        showToast('Settings reset to defaults', 'info');
    });
}

// Quick Preview removed — no-op

// Play Button
elements.playBtn.addEventListener('click', async () => {
    if (!state.fileContent) return;
    if (state.selectedStyle === PRESENTATION_STYLE && !isMarkdownPath(state.currentFile)) {
        showToast('Presentation mode requires a Markdown (.md) file', 'error');
        return;
    }
    
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
syncSettingsUI();
updateActionAvailability();

console.log(' Chahua Code Animator initialized');
console.log(' Security: ENABLED');

// Welcome message
setTimeout(() => {
    showToast('Welcome to Chahua Code Animator! ', 'success');
}, 500);
