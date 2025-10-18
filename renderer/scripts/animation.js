// ══════════════════════════════════════════════════════════════════════════════
//  Chahua Code Animator - Animation Engine
//  Multi-style Animation System
// ══════════════════════════════════════════════════════════════════════════════

// ! ══════════════════════════════════════════════════════════════════════════════
// !  บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// !  Repository: https://github.com/chahuadev/chahua-code-animator.git
// !  Version: 1.0.0
// !  License: MIT
// !  Contact: chahuadev@gmail.com
// ! ══════════════════════════════════════════════════════════════════════════════

let animationData = null;
let currentAnimation = null;
let isPaused = false;
let animationEngine = null;

const elements = {
    container: document.getElementById('animationContainer'),
    infoOverlay: document.getElementById('infoOverlay')
};

function setScrollable(enabled) {
    document.body.classList.toggle('scroll-enabled', enabled);
    elements.container.classList.toggle('scroll-enabled', enabled);
    if (!enabled) {
        elements.container.scrollTop = 0;
    }
}

function escapeHtml(source) {
    return source
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function highlightCodeSnippet(code) {
    let escaped = escapeHtml(code);
    const placeholders = [];

    const apply = (regex, className) => {
        escaped = escaped.replace(regex, (match) => {
            const token = `__HL__${placeholders.length}__`;
            placeholders.push({ token, value: `<span class="${className}">${match}</span>` });
            return token;
        });
    };

    apply(/\/\*[\s\S]*?\*\//g, 'comment');
    apply(/\/\/[^\n]*/g, 'comment');
    apply(/('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/g, 'string');
    apply(/\b\d+(?:\.\d+)?\b/g, 'number');
    apply(/\b(class|function|const|let|var|if|else|switch|case|return|throw|try|catch|async|await|for|while|do|break|continue|new|this|super|extends|import|export|from|default|public|private|protected|static)\b/g, 'keyword');

    placeholders.forEach(({ token, value }) => {
        escaped = escaped.replace(token, value);
    });

    return escaped;
}

function buildLineNumbers(text) {
    const total = Math.max(text.split('\n').length, 1);
    const numbers = [];
    for (let i = 1; i <= total; i++) {
        numbers.push(String(i));
    }
    return numbers.join('\n');
}

const FONT_FAMILIES = {
    consolas: "'Consolas', 'Courier New', monospace",
    fira: "'Fira Code', 'Consolas', monospace",
    jetbrains: "'JetBrains Mono', 'Consolas', monospace",
    cascadia: "'Cascadia Code', 'Consolas', monospace"
};

function resolveFontFamily(key) {
    return FONT_FAMILIES[key] || FONT_FAMILIES.consolas;
}

function clampWrapWidth(value) {
    if (!Number.isFinite(value)) {
        return 70;
    }
    return Math.min(Math.max(value, 40), 120);
}

// ══════════════════════════════════════════════════════════════════════════════
//                         Animation Styles
// ══════════════════════════════════════════════════════════════════════════════

/*
class RainFallAnimation {
    constructor(code, settings) {
        this.code = code;
        this.settings = settings;
        this.blocks = [];
        this.engine = null;
        this.render = null;
        this.runner = null;
        this.animationFrameId = null;
        this.arrangeTimer = null;
        this.resizeHandler = null;
        this.assembledWrapper = null;
        this.stopped = false;
        this.visualUpdateActive = false;
    }

    async start() {
        this.stopped = false;
        this.visualUpdateActive = false;
        this.assembledWrapper = null;

        // Split code into chunks
        const lines = this.code.split('\n');
        const chunkSize = this.settings.linesPerBlock;
        const chunks = [];

        for (let i = 0; i < lines.length; i += chunkSize) {
            chunks.push(lines.slice(i, i + chunkSize).join('\n'));
        }

        // Setup Matter.js
        const { Engine, Render, Runner, Bodies, World } = Matter;

        this.engine = Engine.create();
        this.engine.gravity.y = 1.8 / this.settings.speed;

        this.render = Render.create({
            element: elements.container,
            engine: this.engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: 'transparent'
            }
        });

        this.resizeHandler = () => {
            if (!this.render) {
                return;
            }
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.render.canvas.width = width;
            this.render.canvas.height = height;
            this.render.options.width = width;
            this.render.options.height = height;
        };
        window.addEventListener('resize', this.resizeHandler);

        // Create floor and walls
        const floor = Bodies.rectangle(
            window.innerWidth / 2,
            window.innerHeight + 25,
            window.innerWidth,
            50,
            { isStatic: true, render: { visible: false } }
        );

        const leftWall = Bodies.rectangle(-25, window.innerHeight / 2, 50, window.innerHeight, {
            isStatic: true,
            render: { visible: false }
        });

        const rightWall = Bodies.rectangle(
            window.innerWidth + 25,
            window.innerHeight / 2,
            50,
            window.innerHeight,
            { isStatic: true, render: { visible: false } }
        );

        World.add(this.engine.world, [floor, leftWall, rightWall]);

        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        // Create and drop blocks
        this.buildBlocks(chunks);
        await this.dropBlocks();
    }

    buildBlocks(chunks) {
        const palettes = [
            '#fde68a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff',
            '#fca5a5', '#a7f3d0', '#c7d2fe', '#fecdd3', '#fde2ff'
        ];

        chunks.forEach((chunk, index) => {
            const block = document.createElement('div');
            block.className = 'code-block falling';
            block.textContent = chunk;
            block.style.background = palettes[index % palettes.length];
            block.style.fontSize = this.settings.blockSize + 'px';
            const maxWidth = Math.min(420, Math.max(220, window.innerWidth * 0.28));
            block.style.maxWidth = maxWidth + 'px';
            block.style.minWidth = '160px';
            block.style.position = 'absolute';
            block.style.opacity = '0';
            block.style.pointerEvents = 'none';

            elements.container.appendChild(block);

            const rect = block.getBoundingClientRect();
            const edgePadding = Math.min(Math.max(window.innerWidth * 0.1, 120), 260);
            const usableWidth = Math.max(window.innerWidth - edgePadding * 2, rect.width + 20);
            const startX = edgePadding + Math.random() * usableWidth;
            
            const body = Matter.Bodies.rectangle(
                startX,
                -100 - index * 120,
                rect.width,
                rect.height,
                {
                    restitution: 0.3,
                    friction: 0.1,
                    density: 0.01
                }
            );

            Matter.World.add(this.engine.world, body);

            this.blocks.push({ element: block, body });
        });
    }

    async dropBlocks() {
        for (let i = 0; i < this.blocks.length; i++) {
            if (this.stopped) {
                return;
            }
            this.blocks[i].element.style.opacity = '1';
            await new Promise(resolve => setTimeout(resolve, 120 / this.settings.speed));
        }

        // Animate block positions
        this.startVisualUpdate();

        if (this.arrangeTimer) {
            clearTimeout(this.arrangeTimer);
        }

        // Auto arrange after settling
        this.arrangeTimer = setTimeout(() => {
            if (!this.stopped) {
                this.arrange();
            }
        }, Math.max(1200, 3000 / this.settings.speed));
    }

    startVisualUpdate() {
        if (this.visualUpdateActive) {
            return;
        }

        const animate = () => {
            if (this.stopped || !this.visualUpdateActive) {
                return;
            }

            this.blocks.forEach(({ element, body }) => {
                if (!body) {
                    return;
                }
                element.style.transform = `translate3d(${body.position.x - element.offsetWidth / 2}px, ${body.position.y - element.offsetHeight / 2}px, 0) rotate(${body.angle}rad)`;
            });

            this.animationFrameId = requestAnimationFrame(animate);
        };

        this.visualUpdateActive = true;
        this.animationFrameId = requestAnimationFrame(animate);
    }

    arrange() {
        if (this.stopped) {
            return;
        }

        if (this.arrangeTimer) {
            clearTimeout(this.arrangeTimer);
            this.arrangeTimer = null;
        }

        this.visualUpdateActive = false;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.cleanupMatter();
        setScrollable(true);

        if (this.assembledWrapper) {
            this.assembledWrapper.remove();
            this.assembledWrapper = null;
        }

        this.assembledWrapper = document.createElement('div');
        this.assembledWrapper.className = 'assembled-wrapper';
        this.assembledWrapper.style.padding = '1.5rem 0 4rem';

        elements.container.appendChild(this.assembledWrapper);

        this.blocks.forEach((block) => {
            const { element } = block;
            element.classList.remove('falling');
            element.classList.add('assembled');
            element.style.position = 'relative';
            element.style.left = 'auto';
            element.style.top = 'auto';
            element.style.transform = 'none';
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
            element.style.margin = '0';
            element.style.minWidth = '0';
            element.style.maxWidth = 'unset';
            element.style.width = '100%';
            element.style.whiteSpace = 'pre-wrap';
            element.style.wordBreak = 'break-word';
            this.assembledWrapper.appendChild(element);
            block.body = null;
        });
    }

    cleanupMatter() {
        if (this.arrangeTimer) {
            clearTimeout(this.arrangeTimer);
            this.arrangeTimer = null;
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.runner) {
            Matter.Runner.stop(this.runner);
            this.runner = null;
        }
        if (this.render) {
            Matter.Render.stop(this.render);
            if (this.render.canvas && this.render.canvas.parentNode) {
                this.render.canvas.remove();
            }
            this.render = null;
        }
        if (this.engine) {
            Matter.World.clear(this.engine.world, false);
            Matter.Engine.clear(this.engine);
            this.engine = null;
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
    }

    pause() {
        if (this.runner) {
            Matter.Runner.stop(this.runner);
        }
        this.visualUpdateActive = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    resume() {
        if (this.stopped || this.assembledWrapper) {
            return;
        }
        if (this.runner && this.engine) {
            Matter.Runner.run(this.runner, this.engine);
        }
        this.startVisualUpdate();
    }

    stop() {
        this.stopped = true;
        this.visualUpdateActive = false;
        this.cleanupMatter();

        if (this.assembledWrapper) {
            this.assembledWrapper.remove();
            this.assembledWrapper = null;
        }

        this.blocks.forEach(({ element }) => element.remove());
        this.blocks = [];

        setScrollable(false);
    }
}
*/

class TypingAnimation {
    constructor(code, settings) {
        this.code = code;
        this.settings = settings;
        this.container = null;
        this.stopped = false;
        const approxLine = (this.settings.blockSize || 10) + 2;
        const fallbackPadding = Math.max(Math.round(approxLine * 3.5), 96);
        const customPadding = Number.isFinite(this.settings.bottomPadding) ? this.settings.bottomPadding : fallbackPadding;
        this.viewPadding = Math.max(customPadding, 40);
        this.scrollThreshold = Math.max(this.viewPadding, 120);
        this.textContainer = null;
        this.cursor = null;
        this.lineNumbersEl = null;
        this.currentText = '';
        this.wrapWidth = clampWrapWidth(this.settings.wrapWidth);
        this.fontFamily = resolveFontFamily(this.settings.fontFamily);
        this.loopTimer = null;
    }

    async start() {
        this.stopped = false;
        this.applyTheme();
        this.clearLoopTimer();
        this.setupContainer();

        this.currentText = this.settings.startAssembled ? this.code : '';
        this.updateDisplay();

        if (this.settings.startAssembled) {
            this.removeCursor();
            return;
        }

        await this.runTypingCycle();
    }

    shouldAutoScroll() {
        const scrollElement = document.scrollingElement || document.documentElement;
        if (!scrollElement) {
            return true;
        }
        const distanceFromBottom = scrollElement.scrollHeight - (scrollElement.scrollTop + scrollElement.clientHeight);
        return distanceFromBottom <= this.scrollThreshold;
    }

    scrollToCursor(cursor) {
        if (!cursor) {
            return;
        }
        const scrollElement = document.scrollingElement || document.documentElement;
        if (!scrollElement) {
            return;
        }

        const viewportHeight = window.innerHeight || scrollElement.clientHeight;
        const rect = cursor.getBoundingClientRect();

        if (rect.bottom > viewportHeight - this.viewPadding) {
            const delta = rect.bottom - (viewportHeight - this.viewPadding);
            scrollElement.scrollTop = Math.min(scrollElement.scrollTop + delta, scrollElement.scrollHeight - scrollElement.clientHeight);
        } else if (rect.top < this.viewPadding) {
            const delta = rect.top - this.viewPadding;
            scrollElement.scrollTop = Math.max(scrollElement.scrollTop + delta, 0);
        }
    }

    pause() {
        this.stopped = true;
        this.clearLoopTimer();
    }

    resume() {
        this.stopped = false;
    }

    stop() {
        this.stopped = true;
        this.clearLoopTimer();
        this.removeCursor();
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.textContainer = null;
        this.lineNumbersEl = null;
        this.currentText = '';
        setScrollable(false);
        document.body.classList.remove('high-contrast-theme');
    }

    updateDisplay() {
        if (!this.textContainer) {
            return;
        }

        const source = this.currentText;
        const useHighlight = !!this.settings.syntaxHighlight;
        const emphasizeLine = !!this.settings.highlightCurrentLine;

        if (useHighlight || emphasizeLine) {
            const lines = source.split('\n');
            const currentIndex = Math.max(lines.length - 1, 0);
            const htmlLines = lines.map((line, index) => {
                const content = useHighlight ? highlightCodeSnippet(line) : escapeHtml(line);
                const safeContent = content === '' ? '&nbsp;' : content;
                const lineClass = emphasizeLine && index === currentIndex ? 'code-line current-line' : 'code-line';
                return `<span class="${lineClass}">${safeContent}</span>`;
            });
            this.textContainer.innerHTML = htmlLines.join('\n');
        } else {
            this.textContainer.textContent = source;
        }

        if (this.settings.showLineNumbers && this.lineNumbersEl) {
            this.lineNumbersEl.textContent = buildLineNumbers(source);
        }
    }

    setupContainer() {
        const { blockSize, showLineNumbers } = this.settings;

        if (this.container) {
            this.container.remove();
        }

        this.textContainer = null;
        this.lineNumbersEl = null;
        this.cursor = null;

        if (showLineNumbers) {
            const wrapper = document.createElement('div');
            wrapper.className = 'assembled-code typing-layout';
            wrapper.style.margin = '2rem auto 6rem';
            wrapper.style.maxWidth = `min(${this.wrapWidth}vw, 1000px)`;
            wrapper.style.fontSize = `${blockSize + 2}px`;
            wrapper.style.lineHeight = '1.6';
            wrapper.style.fontFamily = this.fontFamily;

            this.lineNumbersEl = document.createElement('pre');
            this.lineNumbersEl.className = 'line-numbers';
            this.lineNumbersEl.textContent = '1';
            this.lineNumbersEl.style.fontFamily = this.fontFamily;
            this.lineNumbersEl.style.lineHeight = '1.6';

            const codePane = document.createElement('pre');
            codePane.className = 'code-content';
            codePane.style.fontFamily = this.fontFamily;
            codePane.style.fontSize = `${blockSize + 2}px`;
            codePane.style.lineHeight = '1.6';
            codePane.style.margin = '0';
            codePane.style.padding = '0';
            codePane.style.whiteSpace = 'pre-wrap';
            codePane.style.wordBreak = 'break-word';
            codePane.style.maxWidth = '100%';
            codePane.style.flex = '1';
            codePane.style.background = 'transparent';

            this.textContainer = document.createElement('span');
            codePane.appendChild(this.textContainer);

            wrapper.appendChild(this.lineNumbersEl);
            wrapper.appendChild(codePane);

            this.container = wrapper;
        } else {
            const pre = document.createElement('pre');
            pre.className = 'typing-plain';
            pre.style.cssText = `
                padding: 2rem;
                font-family: ${this.fontFamily};
                font-size: ${blockSize + 2}px;
                color: #f1f5f9;
                line-height: 1.6;
                white-space: pre-wrap;
                max-width: min(${this.wrapWidth}vw, 1000px);
                margin: 2rem auto 6rem;
            `;

            this.textContainer = document.createElement('span');
            pre.appendChild(this.textContainer);

            this.container = pre;
        }

        elements.container.appendChild(this.container);
        setScrollable(true);
        this.ensureCursor();
    }

    ensureCursor() {
        const parent = this.textContainer ? this.textContainer.parentNode : this.container;
        if (!parent) {
            return;
        }

        if (!this.cursor || !this.cursor.parentNode) {
            this.cursor = document.createElement('span');
            this.cursor.className = 'typing-cursor';
            parent.appendChild(this.cursor);
        }

        const blinkSpeed = Math.max(this.settings.cursorBlinkSpeed || 0.8, 0.2);
        this.cursor.style.animationDuration = `${blinkSpeed}s`;
    }

    removeCursor() {
        if (this.cursor && this.cursor.parentNode) {
            this.cursor.remove();
        }
        this.cursor = null;
    }

    async runTypingCycle() {
        const chars = this.code.split('');
        const speedFactor = Math.max(this.settings.speed || 1, 0.1);
        const delay = 50 / (speedFactor * 10);

        do {
            this.ensureCursor();

            for (let i = 0; i < chars.length; i++) {
                if (this.stopped) {
                    return;
                }

                const shouldFollow = this.shouldAutoScroll();
                this.currentText += chars[i];
                this.updateDisplay();

                if (shouldFollow) {
                    this.scrollToCursor(this.cursor);
                }

                await new Promise(resolve => setTimeout(resolve, delay));
            }

            this.removeCursor();

            if (!this.settings.autoLoop || this.stopped) {
                break;
            }

            await new Promise((resolve) => {
                const loopDelay = Math.max(600 / speedFactor, 250);
                this.loopTimer = setTimeout(() => {
                    this.loopTimer = null;
                    resolve();
                }, loopDelay);
            });

            if (this.stopped) {
                break;
            }

            this.currentText = '';
            this.updateDisplay();
            elements.container.scrollTop = 0;
            const scrollElement = document.scrollingElement || document.documentElement;
            if (scrollElement) {
                scrollElement.scrollTop = 0;
            }
        } while (!this.stopped && this.settings.autoLoop);
    }

    clearLoopTimer() {
        if (this.loopTimer) {
            clearTimeout(this.loopTimer);
            this.loopTimer = null;
        }
    }

    applyTheme() {
        document.body.classList.toggle('high-contrast-theme', !!this.settings.highContrast);
    }
}

class PresentationAnimation {
    constructor(markdown, settings) {
        this.markdown = markdown || '';
        this.settings = settings || {};
        this.model = null;
        this.wrapper = null;
        this.slideElements = [];
        this.nav = null;
        this.prevBtn = null;
        this.nextBtn = null;
        this.progressFill = null;
        this.counter = null;
        this.currentIndex = 0;
        this.autoTimer = null;
        this.keyHandler = null;
        this.onWrapperClick = null;
    }

    start() {
        const utils = window.presentationUtils;
        if (!utils) {
            this.showError('Presentation utilities not available.');
            return;
        }

        try {
            this.model = utils.buildPresentationModel(this.markdown);
        } catch (error) {
            console.error('Presentation parse error:', error);
            this.showError('ไม่สามารถประมวลผลไฟล์ Markdown สำหรับสไลด์ได้');
            return;
        }

        if (!this.model || !Array.isArray(this.model.slides) || this.model.slides.length === 0) {
            this.showError('ไม่พบข้อมูลที่สามารถสร้างสไลด์ได้');
            return;
        }

        document.body.classList.add('presentation-mode');
        elements.container.innerHTML = '';
        setScrollable(false);

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'presentation-wrapper';
        elements.container.appendChild(this.wrapper);

        this.slideElements = this.model.slides.map(slide => this.createSlideElement(slide));
        this.slideElements.forEach(slideElement => this.wrapper.appendChild(slideElement));

        this.buildNavigation();
        this.showSlide(0);
        this.attachEvents();
        this.startAutoPlay();
    }

    showError(message) {
        elements.container.innerHTML = `<div class="presentation-error">${escapeHtml(message)}</div>`;
        document.body.classList.remove('presentation-mode');
        setScrollable(true);
    }

    createSlideElement(slide) {
        const utils = window.presentationUtils;
        const slideEl = document.createElement('section');
        slideEl.className = `presentation-slide slide-${slide.type || 'content'}`;

        const inner = document.createElement('div');
        inner.className = 'slide-inner';
        slideEl.appendChild(inner);

        switch (slide.type) {
            case 'title': {
                inner.innerHTML = `
                    <div class="slide-badge">Chahua Code Animator</div>
                    <h1>${utils.formatInline(slide.title || 'Presentation')}</h1>
                    ${slide.subtitle ? `<p class="slide-subtitle">${utils.formatInline(slide.subtitle)}</p>` : ''}
                    <div class="slide-meta">
                        ${slide.meta?.author ? `<span><strong>Author:</strong> ${utils.escapeHtml(slide.meta.author)}</span>` : ''}
                        ${slide.meta?.lastUpdated ? `<span><strong>Updated:</strong> ${utils.escapeHtml(slide.meta.lastUpdated)}</span>` : ''}
                    </div>`;
                break;
            }
            case 'agenda': {
                const items = slide.items || [];
                const list = items.map((item, index) => `
                    <li>
                        <span class="index">${index + 1}</span>
                        <div>${utils.formatInline(item)}</div>
                    </li>`).join('');
                inner.innerHTML = `
                    <h2>${utils.formatInline(slide.title || 'Agenda')}</h2>
                    <ol class="slide-agenda">${list || '<li class="empty">ไม่มีหัวข้อในเอกสารนี้</li>'}</ol>`;
                break;
            }
            case 'progress': {
                const total = slide.total || 0;
                const completed = slide.completed || 0;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                inner.innerHTML = `
                    <h2>${utils.formatInline(slide.title || 'Progress')}</h2>
                    <div class="progress-summary">
                        <div class="metric">
                            <span class="value">${percent}%</span>
                            <span class="label">Complete</span>
                        </div>
                        <div class="metric">
                            <span class="value">${completed}</span>
                            <span class="label">Done</span>
                        </div>
                        <div class="metric">
                            <span class="value">${total}</span>
                            <span class="label">Total Tasks</span>
                        </div>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${percent}%;"></div></div>
                    <p class="progress-caption">${total > 0 ? `${completed} of ${total} milestones complete` : 'No tracked milestones yet'}</p>`;
                break;
            }
            default: {
                this.populateContentSlide(slide, inner);
            }
        }

        return slideEl;
    }

    populateContentSlide(slide, container) {
        const utils = window.presentationUtils;
        container.innerHTML = '';

        const title = document.createElement('h2');
        title.innerHTML = utils.formatInline(slide.title || 'Details');
        container.appendChild(title);

        const blocksContainer = document.createElement('div');
        blocksContainer.className = 'slide-blocks';

        const blocks = Array.isArray(slide.blocks) ? slide.blocks : [];
        if (!blocks.length) {
            const empty = document.createElement('p');
            empty.className = 'slide-empty';
            empty.textContent = 'ไม่มีข้อมูลสำหรับหัวข้อนี้';
            container.appendChild(empty);
            return;
        }

        blocks.forEach(block => {
            const blockEl = document.createElement('div');
            blockEl.className = 'slide-block';
            if (block.heading) {
                const heading = document.createElement('h3');
                heading.innerHTML = utils.formatInline(block.heading);
                blockEl.appendChild(heading);
            }
            this.renderBlockItems(blockEl, block.items || []);
            blocksContainer.appendChild(blockEl);
        });

        container.appendChild(blocksContainer);
    }

    renderBlockItems(blockEl, items) {
        const utils = window.presentationUtils;
        if (!items.length) {
            const empty = document.createElement('p');
            empty.className = 'block-empty';
            empty.textContent = '—';
            blockEl.appendChild(empty);
            return;
        }

        let listEl = null;
        let numberIndex = 0;

        const ensureList = () => {
            if (!listEl) {
                listEl = document.createElement('ul');
                listEl.className = 'slide-list';
                blockEl.appendChild(listEl);
            }
            return listEl;
        };

        const closeList = () => {
            listEl = null;
            numberIndex = 0;
        };

        items.forEach((item) => {
            if (item.type === 'paragraph') {
                closeList();
                const headingMatch = item.text.match(/^(#{3,6})\s+(.*)$/);
                if (headingMatch) {
                    const heading = document.createElement('h4');
                    heading.className = 'slide-subheading';
                    heading.innerHTML = utils.formatInline(headingMatch[2]);
                    if (item.fullText) {
                        heading.title = item.fullText;
                    }
                    blockEl.appendChild(heading);
                } else {
                    const paragraph = document.createElement('p');
                    paragraph.className = 'slide-paragraph';
                    paragraph.innerHTML = utils.formatInline(item.text);
                    if (item.fullText) {
                        paragraph.title = item.fullText;
                    }
                    blockEl.appendChild(paragraph);
                }
                return;
            }

            if (item.type === 'quote') {
                closeList();
                const quote = document.createElement('blockquote');
                quote.innerHTML = utils.formatInline(item.text);
                if (item.fullText) {
                    quote.title = item.fullText;
                }
                blockEl.appendChild(quote);
                return;
            }

            if (item.type !== 'checkbox' && item.type !== 'bullet' && item.type !== 'numbered') {
                closeList();
                const fallback = document.createElement('p');
                fallback.className = 'slide-paragraph';
                fallback.innerHTML = utils.formatInline(item.text);
                blockEl.appendChild(fallback);
                return;
            }

            const list = ensureList();
            const li = document.createElement('li');
            li.className = `item item-${item.type}`;

            const marker = document.createElement('span');
            marker.className = 'item-marker';

            if (item.type === 'checkbox') {
                marker.classList.add('checkbox');
                marker.classList.add(item.checked ? 'checked' : 'unchecked');
            } else if (item.type === 'numbered') {
                marker.classList.add('numbered');
                numberIndex += 1;
                marker.textContent = String(numberIndex);
            } else {
                marker.classList.add('bullet');
            }

            const body = document.createElement('div');
            body.className = 'item-text';
            body.innerHTML = utils.formatInline(item.text);
            if (item.fullText) {
                body.title = item.fullText;
            }

            li.appendChild(marker);
            li.appendChild(body);
            list.appendChild(li);
        });
    }

    buildNavigation() {
        this.nav = document.createElement('div');
        this.nav.className = 'presentation-nav';

        this.prevBtn = document.createElement('button');
        this.prevBtn.className = 'nav-btn prev';
        this.prevBtn.setAttribute('aria-label', 'Previous slide');
        this.prevBtn.innerHTML = '<span>&lsaquo;</span>';

        this.nextBtn = document.createElement('button');
        this.nextBtn.className = 'nav-btn next';
        this.nextBtn.setAttribute('aria-label', 'Next slide');
        this.nextBtn.innerHTML = '<span>&rsaquo;</span>';

        const info = document.createElement('div');
        info.className = 'nav-info';

        const progressBar = document.createElement('div');
        progressBar.className = 'nav-progress';
        this.progressFill = document.createElement('div');
        this.progressFill.className = 'nav-progress-fill';
        progressBar.appendChild(this.progressFill);

        this.counter = document.createElement('span');
        this.counter.className = 'nav-counter';

        info.appendChild(progressBar);
        info.appendChild(this.counter);

        this.nav.appendChild(this.prevBtn);
        this.nav.appendChild(info);
        this.nav.appendChild(this.nextBtn);

        elements.container.appendChild(this.nav);

        this.prevBtn.addEventListener('click', () => this.prevSlide(true));
        this.nextBtn.addEventListener('click', () => this.nextSlide(true));
    }

    showSlide(index) {
        if (index < 0 || index >= this.slideElements.length) {
            return;
        }

        this.slideElements.forEach((slide, idx) => {
            slide.classList.toggle('active', idx === index);
        });

        this.currentIndex = index;
        this.updateNavigation();
    }

    updateNavigation() {
        if (!this.nav) {
            return;
        }
        const total = this.slideElements.length;
        const percentage = total > 0 ? ((this.currentIndex + 1) / total) * 100 : 0;

        if (this.progressFill) {
            this.progressFill.style.width = `${percentage}%`;
        }

        if (this.counter) {
            this.counter.textContent = `Slide ${this.currentIndex + 1} / ${total}`;
        }

        const disableNav = total <= 1;
        if (this.prevBtn) {
            this.prevBtn.disabled = disableNav;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = disableNav;
        }
    }

    nextSlide(manual = false) {
        const total = this.slideElements.length;
        if (total === 0) {
            return;
        }

        if (this.currentIndex < total - 1) {
            this.showSlide(this.currentIndex + 1);
        } else {
            this.showSlide(0);
        }

        if (manual && this.settings.autoLoop) {
            this.restartAutoPlay();
        }
    }

    prevSlide(manual = false) {
        const total = this.slideElements.length;
        if (total === 0) {
            return;
        }

        if (this.currentIndex > 0) {
            this.showSlide(this.currentIndex - 1);
        } else {
            this.showSlide(total - 1);
        }

        if (manual && this.settings.autoLoop) {
            this.restartAutoPlay();
        }
    }

    startAutoPlay() {
        this.stopAutoPlay();
        if (!this.settings.autoLoop) {
            return;
        }
        if (!this.slideElements || this.slideElements.length <= 1) {
            return;
        }

        const speedFactor = Math.max(Number(this.settings.speed) || 1, 0.2);
        const interval = Math.max(5000 / speedFactor, 2500);

        this.autoTimer = setInterval(() => {
            this.nextSlide(false);
        }, interval);
    }

    stopAutoPlay() {
        if (this.autoTimer) {
            clearInterval(this.autoTimer);
            this.autoTimer = null;
        }
    }

    restartAutoPlay() {
        if (!this.settings.autoLoop) {
            return;
        }
        this.startAutoPlay();
    }

    attachEvents() {
        this.keyHandler = (event) => {
            if (event.defaultPrevented) {
                return;
            }
            if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
                event.preventDefault();
                this.nextSlide(true);
            } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
                event.preventDefault();
                this.prevSlide(true);
            } else if (event.key === 'Home') {
                event.preventDefault();
                this.showSlide(0);
                if (this.settings.autoLoop) {
                    this.restartAutoPlay();
                }
            } else if (event.key === 'End') {
                event.preventDefault();
                this.showSlide(this.slideElements.length - 1);
                if (this.settings.autoLoop) {
                    this.restartAutoPlay();
                }
            }
        };

        document.addEventListener('keydown', this.keyHandler);

        this.onWrapperClick = (event) => {
            if (event.target.closest('.presentation-nav') || event.target.closest('.slide-inner')) {
                return;
            }
            this.nextSlide(true);
        };

        if (this.wrapper) {
            this.wrapper.addEventListener('click', this.onWrapperClick);
        }
    }

    detachEvents() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }

        if (this.wrapper && this.onWrapperClick) {
            this.wrapper.removeEventListener('click', this.onWrapperClick);
        }
        this.onWrapperClick = null;
    }

    stop() {
        this.stopAutoPlay();
        this.detachEvents();

        if (this.nav) {
            this.nav.remove();
            this.nav = null;
        }

        if (this.wrapper) {
            this.wrapper.remove();
            this.wrapper = null;
        }

        this.slideElements = [];
        document.body.classList.remove('presentation-mode');
        setScrollable(false);
    }
}

/*
class WaveAnimation {
    constructor(code, settings) {
        this.code = code;
        this.settings = settings;
        this.blocks = [];
        this.stopped = false;
        this.wrapper = null;
    }

    async start() {
        const lines = this.code.split('\n');
        const chunkSize = this.settings.linesPerBlock;

        this.stopped = false;
        this.blocks = [];
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'assembled-wrapper';
        this.wrapper.style.padding = '2rem 0 4rem';
        elements.container.appendChild(this.wrapper);
        setScrollable(true);
        
        for (let i = 0; i < lines.length; i += chunkSize) {
            if (this.stopped) break;
            
            const chunk = lines.slice(i, i + chunkSize).join('\n');
            const block = document.createElement('div');
            block.className = 'code-block';
            block.textContent = chunk;
            block.style.position = 'relative';
            block.style.margin = '0 auto';
            block.style.transform = 'none';
            block.style.fontSize = this.settings.blockSize + 'px';
            block.style.animation = 'wave 2.2s ease-in-out infinite';
            block.style.animationDelay = (i / chunkSize) * 0.2 + 's';
            block.style.pointerEvents = 'none';

            this.wrapper.appendChild(block);
            this.blocks.push(block);
            
            await new Promise(resolve => setTimeout(resolve, 200 / this.settings.speed));
        }
    }

    pause() {
        this.stopped = true;
        this.blocks.forEach(block => {
            block.style.animationPlayState = 'paused';
        });
    }

    resume() {
        this.stopped = false;
        this.blocks.forEach(block => {
            block.style.animationPlayState = 'running';
        });
    }

    stop() {
        this.stopped = true;
        this.blocks.forEach(block => block.remove());
        this.blocks = [];
        if (this.wrapper) {
            this.wrapper.remove();
            this.wrapper = null;
        }
        setScrollable(false);
    }
}
*/

/*
class ParticlesAnimation {
    constructor(code, settings) {
        this.code = code;
        this.settings = settings;
        this.particles = [];
        this.stopped = false;
    }

    async start() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Create particles from code
        for (let i = 0; i < Math.min(this.code.length, 500); i++) {
            if (this.stopped) break;
            
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                left: ${centerX}px;
                top: ${centerY}px;
            `;
            
            elements.container.appendChild(particle);
            this.particles.push(particle);

            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 300;
            const duration = 1000 + Math.random() * 1000;

            const targetX = centerX + Math.cos(angle) * distance;
            const targetY = centerY + Math.sin(angle) * distance;

            particle.animate([
                { left: centerX + 'px', top: centerY + 'px', opacity: 1 },
                { left: targetX + 'px', top: targetY + 'px', opacity: 0 }
            ], {
                duration: duration / this.settings.speed,
                easing: 'ease-out'
            });

            if (i % 20 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50 / this.settings.speed));
            }
        }

        // Show final code after particles
        setTimeout(() => {
            if (!this.stopped) {
                this.showFinalCode();
            }
        }, 2000 / this.settings.speed);
    }

    showFinalCode() {
        const codeBlock = document.createElement('pre');
        codeBlock.style.cssText = `
            padding: 2rem;
            font-family: 'Consolas', monospace;
            font-size: ${this.settings.blockSize}px;
            color: #f1f5f9;
            opacity: 0;
            transition: opacity 1s ease;
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.6;
            max-width: min(90%, 95vw);
            margin: 2rem auto 6rem;
        `;
        codeBlock.textContent = this.code;
        elements.container.appendChild(codeBlock);
        setScrollable(true);

        setTimeout(() => {
            codeBlock.style.opacity = '1';
        }, 100);
    }

    pause() {
        this.stopped = true;
    }

    resume() {
        this.stopped = false;
    }

    stop() {
        this.stopped = true;
        this.particles.forEach(p => p.remove());
        elements.container.innerHTML = '';
        this.particles = [];
        setScrollable(false);
    }
}
*/

// ══════════════════════════════════════════════════════════════════════════════
//                         Animation Manager
// ══════════════════════════════════════════════════════════════════════════════

function startAnimation(data) {
    if (animationEngine) {
        animationEngine.stop();
        animationEngine = null;
    }

    elements.infoOverlay.classList.add('hidden');
    elements.container.innerHTML = '';
    setScrollable(false);

    isPaused = false;

    const animations = {
        typing: TypingAnimation,
        presentation: PresentationAnimation
        /*
        rain: RainFallAnimation,
        wave: WaveAnimation,
        particles: ParticlesAnimation
        */
    };

    const AnimationClass = animations[data.style] || TypingAnimation;
    animationEngine = new AnimationClass(data.code, data.settings);
    animationEngine.start();
}

// ══════════════════════════════════════════════════════════════════════════════
//                         Event Listeners
// ══════════════════════════════════════════════════════════════════════════════

// Receive animation data from main window
if (window.electronAPI) {
    window.electronAPI.onAnimationData((data) => {
        animationData = data;
        startAnimation(data);
    });
}

console.log(' Animation window ready');

