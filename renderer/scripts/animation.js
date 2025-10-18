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
        .replace(/>/g, '&gt;');
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
        this.scrollThreshold = 140;
        this.textContainer = null;
        this.cursor = null;
        this.lineNumbersEl = null;
        this.currentText = '';
    }

    async start() {
        this.stopped = false;
        this.currentText = '';

        const { blockSize, showLineNumbers } = this.settings;

        if (showLineNumbers) {
            const wrapper = document.createElement('div');
            wrapper.className = 'assembled-code';
            wrapper.style.margin = '2rem auto 6rem';
            wrapper.style.maxWidth = 'min(70vw, 900px)';
            wrapper.style.fontSize = `${blockSize + 2}px`;
            wrapper.style.lineHeight = '1.6';

            this.lineNumbersEl = document.createElement('pre');
            this.lineNumbersEl.className = 'line-numbers';
            this.lineNumbersEl.textContent = '1';

            const codePane = document.createElement('pre');
            codePane.className = 'code-content';
            codePane.style.fontFamily = `'Consolas', monospace`;
            codePane.style.fontSize = `${blockSize + 2}px`;
            codePane.style.lineHeight = '1.6';
            codePane.style.margin = '0';
            codePane.style.padding = '0';
            codePane.style.whiteSpace = 'pre-wrap';
            codePane.style.wordBreak = 'break-word';
            codePane.style.background = 'transparent';

            this.textContainer = document.createElement('span');
            codePane.appendChild(this.textContainer);

            this.cursor = document.createElement('span');
            this.cursor.className = 'typing-cursor';
            codePane.appendChild(this.cursor);

            wrapper.appendChild(this.lineNumbersEl);
            wrapper.appendChild(codePane);

            this.container = wrapper;
        } else {
            const pre = document.createElement('pre');
            pre.style.cssText = `
                padding: 2rem;
                font-family: 'Consolas', monospace;
                font-size: ${blockSize + 2}px;
                color: #f1f5f9;
                line-height: 1.6;
                white-space: pre-wrap;
                max-width: min(70vw, 900px);
                margin: 2rem auto 6rem;
            `;

            this.textContainer = document.createElement('span');
            pre.appendChild(this.textContainer);

            this.cursor = document.createElement('span');
            this.cursor.className = 'typing-cursor';
            pre.appendChild(this.cursor);

            this.container = pre;
        }

        elements.container.appendChild(this.container);
        setScrollable(true);

        this.updateDisplay();

        const chars = this.code.split('');
        const delay = 50 / (this.settings.speed * 10); // 10x faster

        for (let i = 0; i < chars.length; i++) {
            if (this.stopped) break;
            
            const shouldFollow = this.shouldAutoScroll();
            this.currentText += chars[i];
            this.updateDisplay();

            if (shouldFollow) {
                this.scrollToCursor(this.cursor);
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        if (this.cursor) {
            this.cursor.remove();
            this.cursor = null;
        }
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
        cursor.scrollIntoView({ block: 'end', inline: 'nearest' });
    }

    pause() {
        this.stopped = true;
    }

    resume() {
        this.stopped = false;
    }

    stop() {
        this.stopped = true;
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.textContainer = null;
        this.lineNumbersEl = null;
        this.cursor = null;
        this.currentText = '';
        setScrollable(false);
    }

    updateDisplay() {
        if (!this.textContainer) {
            return;
        }

        const source = this.currentText;

        if (this.settings.syntaxHighlight) {
            this.textContainer.innerHTML = highlightCodeSnippet(source);
        } else {
            this.textContainer.textContent = source;
        }

        if (this.settings.showLineNumbers && this.lineNumbersEl) {
            this.lineNumbersEl.textContent = buildLineNumbers(source);
        }
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

    /*
    const animations = {
        rain: RainFallAnimation,
        typing: TypingAnimation,
        wave: WaveAnimation,
        particles: ParticlesAnimation
    };

    const AnimationClass = animations[data.style] || RainFallAnimation;
    */
    
    // Use only TypingAnimation with 10x speed
    const AnimationClass = TypingAnimation;
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

