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

const STORAGE_KEYS = {
    typing: 'cca.settings.typing.v1',
    presentation: 'cca.settings.presentation.v1'
};

const DEFAULT_TYPING_SETTINGS = {
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

const DEFAULT_PRESENTATION_SETTINGS = {
    autoLoop: false,
    speed: 1.0,
    playbackMode: 'loop',
    perSlideDuration: 6,
    summaryMode: 'condensed',
    stageTheme: 'default',
    tooltipDetail: 'full',
    agendaDensity: 'comfortable',
    showProgressBadge: true
};

const state = {
    currentFile: null,
    fileContent: null,
    fileHash: null,
    selectedStyle: 'typing',
    typingSettings: { ...DEFAULT_TYPING_SETTINGS },
    presentationSettings: { ...DEFAULT_PRESENTATION_SETTINGS }
};

function loadPersistedSettings() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    try {
        const storedTyping = window.localStorage.getItem(STORAGE_KEYS.typing);
        if (storedTyping) {
            const parsed = JSON.parse(storedTyping);
            state.typingSettings = { ...DEFAULT_TYPING_SETTINGS, ...parsed };
        }
    } catch (error) {
        console.warn('Failed to restore typing settings:', error);
        state.typingSettings = { ...DEFAULT_TYPING_SETTINGS };
    }

    try {
        const storedPresentation = window.localStorage.getItem(STORAGE_KEYS.presentation);
        if (storedPresentation) {
            const parsed = JSON.parse(storedPresentation);
            state.presentationSettings = { ...DEFAULT_PRESENTATION_SETTINGS, ...parsed };
        }
    } catch (error) {
        console.warn('Failed to restore presentation settings:', error);
        state.presentationSettings = { ...DEFAULT_PRESENTATION_SETTINGS };
    }
}

function persistSettings(mode) {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    try {
        if (mode === 'typing') {
            window.localStorage.setItem(STORAGE_KEYS.typing, JSON.stringify(state.typingSettings));
        } else if (mode === 'presentation') {
            window.localStorage.setItem(STORAGE_KEYS.presentation, JSON.stringify(state.presentationSettings));
        }
    } catch (error) {
        console.warn('Failed to persist settings:', error);
    }
}

const PRESENTATION_STYLE = 'presentation';

function getSettingsForStyle(style) {
    return style === PRESENTATION_STYLE ? state.presentationSettings : state.typingSettings;
}

function getActiveSettings() {
    return getSettingsForStyle(state.selectedStyle);
}

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
    workspaceHint: document.querySelector('.workspace-hint'),
    workspacePrimaryPathSlots: document.querySelectorAll('[data-workspace-primary-path]'),
    workspaceDevPathSlots: document.querySelectorAll('[data-workspace-dev-path]'),
    workspacePackagedPathSlots: document.querySelectorAll('[data-workspace-packaged-path]'),
    workspaceUserPathSlots: document.querySelectorAll('[data-workspace-user-path]'),
    openWorkspaceFolderBtn: document.getElementById('openWorkspaceFolderBtn'),
    openWorkspaceGuideEnBtn: document.getElementById('openWorkspaceGuideEn'),
    openWorkspaceGuideThBtn: document.getElementById('openWorkspaceGuideTh'),
    toggleWorkspaceHelpBtn: document.getElementById('toggleWorkspaceHelp'),
    workspaceHelpContent: document.getElementById('workspaceHelpContent'),
    
    styleCards: document.querySelectorAll('.style-card'),
    typingSettingsPanel: document.querySelector('[data-settings-panel="typing"]'),
    presentationSettingsPanel: document.querySelector('[data-settings-panel="presentation"]'),

    typingSpeedSlider: document.getElementById('typingSpeedSlider'),
    typingSpeedValue: document.getElementById('typingSpeedValue'),
    typingBlockSizeSlider: document.getElementById('typingBlockSizeSlider'),
    typingBlockSizeValue: document.getElementById('typingBlockSizeValue'),
    typingLinesSlider: document.getElementById('typingLinesSlider'),
    typingLinesValue: document.getElementById('typingLinesValue'),
    typingFontFamilySelect: document.getElementById('typingFontFamilySelect'),
    typingWrapWidthSlider: document.getElementById('typingWrapWidthSlider'),
    typingWrapWidthValue: document.getElementById('typingWrapWidthValue'),
    typingPaddingSlider: document.getElementById('typingPaddingSlider'),
    typingPaddingValue: document.getElementById('typingPaddingValue'),
    typingCursorSpeedSlider: document.getElementById('typingCursorSpeedSlider'),
    typingCursorSpeedValue: document.getElementById('typingCursorSpeedValue'),
    typingSyntaxHighlight: document.getElementById('typingSyntaxHighlight'),
    typingShowLineNumbers: document.getElementById('typingShowLineNumbers'),
    typingHighlightCurrentLine: document.getElementById('typingHighlightCurrentLine'),
    typingHighContrast: document.getElementById('typingHighContrast'),
    typingAutoLoop: document.getElementById('typingAutoLoop'),
    typingStartAssembled: document.getElementById('typingStartAssembled'),
    resetTypingSettingsBtn: document.getElementById('resetTypingSettingsBtn'),

    presentationSpeedSlider: document.getElementById('presentationSpeedSlider'),
    presentationSpeedValue: document.getElementById('presentationSpeedValue'),
    presentationSlideDelaySlider: document.getElementById('presentationSlideDelaySlider'),
    presentationSlideDelayValue: document.getElementById('presentationSlideDelayValue'),
    presentationPlaybackMode: document.getElementById('presentationPlaybackMode'),
    presentationAutoLoop: document.getElementById('presentationAutoLoop'),
    presentationSummaryMode: document.getElementById('presentationSummaryMode'),
    presentationStageTheme: document.getElementById('presentationStageTheme'),
    presentationTooltipDetail: document.getElementById('presentationTooltipDetail'),
    presentationAgendaDensity: document.getElementById('presentationAgendaDensity'),
    presentationShowProgress: document.getElementById('presentationShowProgress'),
    resetPresentationSettingsBtn: document.getElementById('resetPresentationSettingsBtn'),
    
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

function syncTypingSettingsUI() {
    const settings = state.typingSettings;

    if (elements.typingSpeedSlider) {
        elements.typingSpeedSlider.value = settings.speed;
        elements.typingSpeedValue.textContent = settings.speed.toFixed(1) + 'x';
    }

    if (elements.typingBlockSizeSlider) {
        elements.typingBlockSizeSlider.value = settings.blockSize;
        elements.typingBlockSizeValue.textContent = settings.blockSize + 'px';
    }

    if (elements.typingLinesSlider) {
        elements.typingLinesSlider.value = settings.linesPerBlock;
        elements.typingLinesValue.textContent = settings.linesPerBlock;
    }

    if (elements.typingFontFamilySelect) {
        elements.typingFontFamilySelect.value = settings.fontFamily;
    }

    if (elements.typingWrapWidthSlider) {
        elements.typingWrapWidthSlider.value = settings.wrapWidth;
        elements.typingWrapWidthValue.textContent = settings.wrapWidth + 'vw';
    }

    if (elements.typingPaddingSlider) {
        elements.typingPaddingSlider.value = settings.bottomPadding;
        elements.typingPaddingValue.textContent = settings.bottomPadding + 'px';
    }

    if (elements.typingCursorSpeedSlider) {
        elements.typingCursorSpeedSlider.value = settings.cursorBlinkSpeed;
        elements.typingCursorSpeedValue.textContent = settings.cursorBlinkSpeed.toFixed(1) + 's';
    }

    if (elements.typingSyntaxHighlight) {
        elements.typingSyntaxHighlight.checked = settings.syntaxHighlight;
    }
    if (elements.typingShowLineNumbers) {
        elements.typingShowLineNumbers.checked = settings.showLineNumbers;
    }
    if (elements.typingHighlightCurrentLine) {
        elements.typingHighlightCurrentLine.checked = settings.highlightCurrentLine;
    }
    if (elements.typingHighContrast) {
        elements.typingHighContrast.checked = settings.highContrast;
    }
    if (elements.typingAutoLoop) {
        elements.typingAutoLoop.checked = settings.autoLoop;
    }
    if (elements.typingStartAssembled) {
        elements.typingStartAssembled.checked = settings.startAssembled;
    }
}

function syncPresentationSettingsUI() {
    const settings = state.presentationSettings;

    if (elements.presentationSpeedSlider) {
        elements.presentationSpeedSlider.value = settings.speed;
        elements.presentationSpeedValue.textContent = settings.speed.toFixed(1) + 'x';
    }

    if (elements.presentationSlideDelaySlider) {
        elements.presentationSlideDelaySlider.value = settings.perSlideDuration;
        elements.presentationSlideDelayValue.textContent = `${settings.perSlideDuration}s`;
    }

    if (elements.presentationPlaybackMode) {
        elements.presentationPlaybackMode.value = settings.playbackMode;
    }

    if (elements.presentationAutoLoop) {
        elements.presentationAutoLoop.checked = settings.autoLoop;
    }

    if (elements.presentationSummaryMode) {
        elements.presentationSummaryMode.value = settings.summaryMode;
    }

    if (elements.presentationStageTheme) {
        elements.presentationStageTheme.value = settings.stageTheme;
    }

    if (elements.presentationTooltipDetail) {
        elements.presentationTooltipDetail.value = settings.tooltipDetail;
    }

    if (elements.presentationAgendaDensity) {
        elements.presentationAgendaDensity.value = settings.agendaDensity;
    }

    if (elements.presentationShowProgress) {
        elements.presentationShowProgress.checked = settings.showProgressBadge;
    }
}

function updateSettingsPanelState() {
    const isPresentation = state.selectedStyle === PRESENTATION_STYLE;

    if (elements.typingSettingsPanel) {
        const active = !isPresentation;
        elements.typingSettingsPanel.classList.toggle('active', active);
        elements.typingSettingsPanel.setAttribute('aria-disabled', active ? 'false' : 'true');
    }

    if (elements.presentationSettingsPanel) {
        const active = isPresentation;
        elements.presentationSettingsPanel.classList.toggle('active', active);
        elements.presentationSettingsPanel.setAttribute('aria-disabled', active ? 'false' : 'true');
    }
}

function syncSettingsUI() {
    syncTypingSettingsUI();
    syncPresentationSettingsUI();
    updateSettingsPanelState();
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
    const settings = state.typingSettings;
    const blocks = Math.ceil(totalLines / settings.linesPerBlock);
    const wrapWidth = Math.min(Math.max(settings.wrapWidth || 70, 40), 120);
    const fontFamily = resolveFontFamily(settings.fontFamily);

    let previewHTML = `<div class="code-preview" style="font-family: ${fontFamily};">`;
    previewHTML += `<pre style="font-size: 0.875rem; color: #cbd5e1; line-height: 1.5; white-space: pre-wrap; max-width: min(${wrapWidth}vw, 900px);">`;

    const previewLines = lines.slice(0, 20);
    if (settings.syntaxHighlight) {
        previewHTML += highlightCode(previewLines.join('\n'));
    } else {
        previewHTML += escapeHtml(previewLines.join('\n'));
    }

    if (totalLines > 20) {
        previewHTML += `\n\n... ${totalLines - 20} more lines ...`;
    }

    previewHTML += '</pre></div>';

    elements.previewContent.innerHTML = previewHTML;
    elements.previewStats.innerHTML = ` ${totalLines} lines • ${blocks} blocks • wrap ${wrapWidth}vw`;
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
    const autoplayLabel = state.presentationSettings.autoLoop ? 'autoplay on' : 'autoplay off';
    elements.previewStats.innerHTML = ` ${slideTitles.length} slides • ${progressText} • ${autoplayLabel}`;
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

function setWorkspaceHelpVisibility(visible) {
    if (!elements.workspaceHelpContent || !elements.toggleWorkspaceHelpBtn) {
        return;
    }

    const content = elements.workspaceHelpContent;
    const toggle = elements.toggleWorkspaceHelpBtn;

    if (visible) {
        content.classList.remove('is-collapsed');
        content.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        toggle.textContent = 'Hide workspace quick start / ซ่อนวิธีใช้งาน';
    } else {
        content.classList.add('is-collapsed');
        content.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Show workspace quick start / แสดงวิธีใช้งาน';
    }

    toggle.dataset.visible = String(visible);
}

function toggleWorkspaceHelp() {
    if (!elements.workspaceHelpContent || !elements.toggleWorkspaceHelpBtn) {
        return;
    }

    const isVisible = elements.workspaceHelpContent.hidden === false;
    setWorkspaceHelpVisibility(!isVisible);
}

setWorkspaceHelpVisibility(false);

function applyWorkspacePath(nodes, value, fallback) {
    if (!nodes) {
        return;
    }

    const items = Array.isArray(nodes) ? nodes : Array.from(nodes);
    items.forEach((node) => {
        if (!node) {
            return;
        }
        node.textContent = value || fallback;
    });
}

function updateWorkspaceGuidance(info) {
    if (!info || info.success === false) {
        return;
    }

    const candidates = info.candidates || [];
    const primaryPath = info.activePath || (candidates.find(candidate => candidate.exists)?.path);

    applyWorkspacePath(elements.workspacePrimaryPathSlots, primaryPath, 'workspace/');

    const devCandidate = candidates.find(candidate => candidate.type === 'project');
    const packagedCandidate = candidates.find(candidate => ['resources', 'installed', 'runtime', 'dist'].includes(candidate.type) && candidate.exists)
        || candidates.find(candidate => ['resources', 'installed', 'runtime', 'dist'].includes(candidate.type));
    const userCandidate = candidates.find(candidate => candidate.type === 'user');

    applyWorkspacePath(elements.workspaceDevPathSlots, devCandidate?.path, 'workspace/');
    applyWorkspacePath(elements.workspacePackagedPathSlots, packagedCandidate?.path || primaryPath, 'workspace/');
    applyWorkspacePath(elements.workspaceUserPathSlots, userCandidate?.path, 'userData/workspace');

    if (elements.workspaceHint && primaryPath) {
        elements.workspaceHint.setAttribute('data-workspace-ready', 'true');
    }
}

async function hydrateWorkspacePanel() {
    if (!window.electronAPI || typeof window.electronAPI.getWorkspaceInfo !== 'function') {
        return;
    }

    try {
        const info = await window.electronAPI.getWorkspaceInfo();
        updateWorkspaceGuidance(info);
    } catch (error) {
        console.warn('Workspace info retrieval failed:', error);
    }
}

async function openWorkspaceFolderFromUI() {
    if (!window.electronAPI || typeof window.electronAPI.openWorkspaceFolder !== 'function') {
        showToast('Workspace shortcut unavailable in this build', 'warning');
        return;
    }

    try {
        const result = await window.electronAPI.openWorkspaceFolder();
        if (!result || result.success !== true) {
            throw new Error(result?.error || 'Unknown renderer bridge error');
        }
        showToast('Workspace folder opened in Explorer', 'success');
    } catch (error) {
        console.error('Workspace folder open error:', error);
        showToast('Failed to open workspace folder: ' + error.message, 'error');
    }
}

async function openWorkspaceGuide(language, successMessage) {
    try {
        if (!window.electronAPI || typeof window.electronAPI.openWorkspaceGuide !== 'function') {
            throw new Error('workspace:openGuide handler unavailable');
        }

        const result = await window.electronAPI.openWorkspaceGuide(language);
        if (!result || result.success !== true) {
            throw new Error(result?.error || 'Unknown renderer bridge error');
        }
        if (successMessage) {
            showToast(successMessage, 'info');
        }
    } catch (error) {
        console.error('Workspace guide open error:', error);
        const message = error?.message || '';
        if (/no handler/i.test(message) || /unavailable/i.test(message) || /guide not found/i.test(message)) {
            await openWorkspaceGuideOnline(language);
            return;
        }
        showToast('Failed to open workspace guide: ' + message, 'error');
    }
}

async function openWorkspaceGuideOnline(language) {
    try {
        if (!window.electronAPI || typeof window.electronAPI.openWorkspaceGuideOnline !== 'function') {
            throw new Error('Online guide bridge unavailable');
        }

        const result = await window.electronAPI.openWorkspaceGuideOnline(language);
        if (!result || result.success !== true) {
            throw new Error(result?.error || 'Unknown renderer bridge error');
        }
        showToast('Opened online workspace guide in browser', 'info');
    } catch (error) {
        console.error('Workspace guide online open error:', error);
        const fallbackUrl = language === 'th'
            ? 'https://github.com/chahuadev/chahua-code-animator/blob/main/docs/th/WORKSPACE_GUIDE.md'
            : 'https://github.com/chahuadev/chahua-code-animator/blob/main/docs/en/WORKSPACE_GUIDE.md';
        showToast('Guide unavailable locally. Open manually: ' + fallbackUrl, 'warning');
    }
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

if (elements.openWorkspaceFolderBtn) {
    elements.openWorkspaceFolderBtn.addEventListener('click', (event) => {
        event.preventDefault();
        void openWorkspaceFolderFromUI();
    });
}

if (elements.openWorkspaceGuideEnBtn) {
    elements.openWorkspaceGuideEnBtn.addEventListener('click', (event) => {
        event.preventDefault();
        void openWorkspaceGuide('en', 'Opened workspace guide (English)');
    });
}

if (elements.openWorkspaceGuideThBtn) {
    elements.openWorkspaceGuideThBtn.addEventListener('click', (event) => {
        event.preventDefault();
        void openWorkspaceGuide('th', 'เปิดคู่มือการใช้งานภาษาไทยแล้ว');
    });
}

if (elements.toggleWorkspaceHelpBtn) {
    elements.toggleWorkspaceHelpBtn.addEventListener('click', (event) => {
        event.preventDefault();
        toggleWorkspaceHelp();
    });
}

// Style Selection
elements.styleCards.forEach(card => {
    card.addEventListener('click', () => {
        elements.styleCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const nextStyle = card.dataset.style;
        state.selectedStyle = nextStyle;
        updateSettingsPanelState();
        
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

// Settings helpers
function refreshTypingPreviewIfActive() {
    if (state.selectedStyle !== PRESENTATION_STYLE && state.fileContent) {
        updatePreview();
    }
}

function refreshPresentationPreviewIfActive() {
    if (state.selectedStyle === PRESENTATION_STYLE && state.fileContent) {
        updatePreview();
    }
}

// Settings — Typing Mode
if (elements.typingSpeedSlider) {
    elements.typingSpeedSlider.addEventListener('input', (e) => {
        state.typingSettings.speed = parseFloat(e.target.value);
        elements.typingSpeedValue.textContent = state.typingSettings.speed.toFixed(1) + 'x';
        persistSettings('typing');
    });
}

if (elements.typingBlockSizeSlider) {
    elements.typingBlockSizeSlider.addEventListener('input', (e) => {
        state.typingSettings.blockSize = parseInt(e.target.value, 10);
        elements.typingBlockSizeValue.textContent = state.typingSettings.blockSize + 'px';
        persistSettings('typing');
    });
}

if (elements.typingLinesSlider) {
    elements.typingLinesSlider.addEventListener('input', (e) => {
        state.typingSettings.linesPerBlock = parseInt(e.target.value, 10);
        elements.typingLinesValue.textContent = state.typingSettings.linesPerBlock;
        persistSettings('typing');
        refreshTypingPreviewIfActive();
    });
}

if (elements.typingSyntaxHighlight) {
    elements.typingSyntaxHighlight.addEventListener('change', (e) => {
        state.typingSettings.syntaxHighlight = e.target.checked;
        persistSettings('typing');
        refreshTypingPreviewIfActive();
    });
}

if (elements.typingShowLineNumbers) {
    elements.typingShowLineNumbers.addEventListener('change', (e) => {
        state.typingSettings.showLineNumbers = e.target.checked;
        persistSettings('typing');
    });
}

if (elements.typingFontFamilySelect) {
    elements.typingFontFamilySelect.addEventListener('change', (e) => {
        state.typingSettings.fontFamily = e.target.value;
        persistSettings('typing');
        refreshTypingPreviewIfActive();
    });
}

if (elements.typingWrapWidthSlider && elements.typingWrapWidthValue) {
    elements.typingWrapWidthSlider.addEventListener('input', (e) => {
        state.typingSettings.wrapWidth = parseInt(e.target.value, 10);
        elements.typingWrapWidthValue.textContent = state.typingSettings.wrapWidth + 'vw';
        persistSettings('typing');
        refreshTypingPreviewIfActive();
    });
}

if (elements.typingPaddingSlider && elements.typingPaddingValue) {
    elements.typingPaddingSlider.addEventListener('input', (e) => {
        state.typingSettings.bottomPadding = parseInt(e.target.value, 10);
        elements.typingPaddingValue.textContent = state.typingSettings.bottomPadding + 'px';
        persistSettings('typing');
    });
}

if (elements.typingCursorSpeedSlider && elements.typingCursorSpeedValue) {
    elements.typingCursorSpeedSlider.addEventListener('input', (e) => {
        state.typingSettings.cursorBlinkSpeed = parseFloat(e.target.value);
        elements.typingCursorSpeedValue.textContent = state.typingSettings.cursorBlinkSpeed.toFixed(1) + 's';
        persistSettings('typing');
    });
}

if (elements.typingHighlightCurrentLine) {
    elements.typingHighlightCurrentLine.addEventListener('change', (e) => {
        state.typingSettings.highlightCurrentLine = e.target.checked;
        persistSettings('typing');
    });
}

if (elements.typingHighContrast) {
    elements.typingHighContrast.addEventListener('change', (e) => {
        state.typingSettings.highContrast = e.target.checked;
        persistSettings('typing');
    });
}

if (elements.typingAutoLoop) {
    elements.typingAutoLoop.addEventListener('change', (e) => {
        state.typingSettings.autoLoop = e.target.checked;
        persistSettings('typing');
    });
}

if (elements.typingStartAssembled) {
    elements.typingStartAssembled.addEventListener('change', (e) => {
        state.typingSettings.startAssembled = e.target.checked;
        persistSettings('typing');
    });
}

if (elements.resetTypingSettingsBtn) {
    elements.resetTypingSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.typingSettings = { ...DEFAULT_TYPING_SETTINGS };
        persistSettings('typing');
        syncTypingSettingsUI();
        refreshTypingPreviewIfActive();
        showToast('Typing settings reset to defaults', 'info');
    });
}

// Settings — Presentation Mode
if (elements.presentationSpeedSlider) {
    elements.presentationSpeedSlider.addEventListener('input', (e) => {
        state.presentationSettings.speed = parseFloat(e.target.value);
        elements.presentationSpeedValue.textContent = state.presentationSettings.speed.toFixed(1) + 'x';
        persistSettings('presentation');
        refreshPresentationPreviewIfActive();
    });
}

if (elements.presentationSlideDelaySlider) {
    elements.presentationSlideDelaySlider.addEventListener('input', (e) => {
        state.presentationSettings.perSlideDuration = parseInt(e.target.value, 10);
        elements.presentationSlideDelayValue.textContent = `${state.presentationSettings.perSlideDuration}s`;
        persistSettings('presentation');
    });
}

if (elements.presentationPlaybackMode) {
    elements.presentationPlaybackMode.addEventListener('change', (e) => {
        state.presentationSettings.playbackMode = e.target.value;
        persistSettings('presentation');
    });
}

if (elements.presentationAutoLoop) {
    elements.presentationAutoLoop.addEventListener('change', (e) => {
        state.presentationSettings.autoLoop = e.target.checked;
        persistSettings('presentation');
        refreshPresentationPreviewIfActive();
    });
}

if (elements.presentationSummaryMode) {
    elements.presentationSummaryMode.addEventListener('change', (e) => {
        state.presentationSettings.summaryMode = e.target.value;
        persistSettings('presentation');
    });
}

if (elements.presentationStageTheme) {
    elements.presentationStageTheme.addEventListener('change', (e) => {
        state.presentationSettings.stageTheme = e.target.value;
        persistSettings('presentation');
    });
}

if (elements.presentationTooltipDetail) {
    elements.presentationTooltipDetail.addEventListener('change', (e) => {
        state.presentationSettings.tooltipDetail = e.target.value;
        persistSettings('presentation');
    });
}

if (elements.presentationAgendaDensity) {
    elements.presentationAgendaDensity.addEventListener('change', (e) => {
        state.presentationSettings.agendaDensity = e.target.value;
        persistSettings('presentation');
    });
}

if (elements.presentationShowProgress) {
    elements.presentationShowProgress.addEventListener('change', (e) => {
        state.presentationSettings.showProgressBadge = e.target.checked;
        persistSettings('presentation');
        refreshPresentationPreviewIfActive();
    });
}

if (elements.resetPresentationSettingsBtn) {
    elements.resetPresentationSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.presentationSettings = { ...DEFAULT_PRESENTATION_SETTINGS };
        persistSettings('presentation');
        syncPresentationSettingsUI();
        refreshPresentationPreviewIfActive();
        showToast('Presentation settings reset to defaults', 'info');
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
            const payloadSettings = JSON.parse(JSON.stringify(getActiveSettings()));
            const transferResult = await window.electronAPI.transferAnimationData({
                code: state.fileContent,
                fileName: state.currentFile,
                style: state.selectedStyle,
                settings: payloadSettings
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
loadPersistedSettings();
syncSettingsUI();
void hydrateWorkspacePanel();
updateActionAvailability();

console.log(' Chahua Code Animator initialized');
console.log(' Security: ENABLED');

// Welcome message
setTimeout(() => {
    showToast('Welcome to Chahua Code Animator! ', 'success');
}, 500);
