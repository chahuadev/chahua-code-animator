// ══════════════════════════════════════════════════════════════════════════════
//  Chahua Code Animator - Presentation Utilities
//  Markdown ➜ Slide Data Transformation Helpers
// ══════════════════════════════════════════════════════════════════════════════
// ! ══════════════════════════════════════════════════════════════════════════════
// !  บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// !  Repository: https://github.com/chahuadev/chahua-code-animator.git
// !  Version: 1.1.0
// !  License: MIT
// !  Contact: chahuadev@gmail.com
// ! ══════════════════════════════════════════════════════════════════════════════

(function () {
    'use strict';

    const MAX_ITEMS_PER_BLOCK = 4;
    const MAX_BLOCKS_PER_SLIDE = 2;
    const MAX_ITEMS_PER_SLIDE = 8;
    const MAX_AGENDA_ITEMS_PER_SLIDE = 5;

    const ITEM_LENGTH_LIMITS = {
        paragraph: 180,
        quote: 220,
        checkbox: 120,
        bullet: 120,
        numbered: 120,
        default: 140
    };

    const ITEM_WORD_LIMITS = {
        paragraph: 28,
        quote: 34,
        checkbox: 18,
        bullet: 18,
        numbered: 18,
        default: 20
    };

    function escapeHtml(source) {
        if (!source) {
            return '';
        }
        return source
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeHeading(raw) {
        if (!raw) {
            return '';
        }
        return raw
            .replace(/^#+\s*/, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/^[-*]\s*/, '')
            .replace(/\s+-+\s+/g, ' — ')
            .trim()
            .replace(/\s*[:：]\s*$/, '');
    }

    function stripInlineMarkdown(text) {
        if (!text) {
            return '';
        }
        return text
            .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/__(.+?)__/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/_(.+?)_/g, '$1')
            .replace(/~~(.+?)~~/g, '$1')
            .replace(/<(?:.|\n)*?>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function condenseText(text, limit, wordLimit) {
        if (!text) {
            return '';
        }
        let cleaned = text.replace(/\s+/g, ' ').trim();
        if (!cleaned) {
            return '';
        }
        if (!Number.isFinite(limit) || limit <= 0) {
            return cleaned;
        }
        const originalLength = cleaned.length;
        let truncated = false;

        if (Number.isFinite(wordLimit) && wordLimit > 0) {
            const words = cleaned.split(/\s+/);
            if (words.length > wordLimit) {
                cleaned = words.slice(0, wordLimit).join(' ');
                truncated = true;
            }
        }

        if (cleaned.length <= limit) {
            return truncated ? `${cleaned}…` : cleaned;
        }

        truncated = true;
        const boundaries = ['. ', '! ', '? ', '。', '！', '？', '; ', ': ', ' และ ', ', ', ' – ', ' — ', ' - ', ' → '];
        let cutoff = -1;

        boundaries.forEach(boundary => {
            const idx = cleaned.lastIndexOf(boundary, limit);
            if (idx >= Math.floor(limit * 0.5) && idx > cutoff) {
                cutoff = idx + (boundary.trim().length ? boundary.length - 1 : 0);
            }
        });

        if (cutoff === -1) {
            cutoff = cleaned.lastIndexOf(' ', limit);
        }

        if (cutoff === -1) {
            cutoff = limit;
        }

        let result = cleaned.slice(0, cutoff).trim().replace(/[,:;、，\-–—]+$/, '').trim();
        if (!result) {
            result = cleaned.slice(0, limit).trim();
        }

        if (truncated || originalLength > result.length) {
            return result + '…';
        }
        return result;
    }

    function compactItem(item) {
        if (!item || typeof item.text !== 'string') {
            return item;
        }
        const limit = ITEM_LENGTH_LIMITS[item.type] || ITEM_LENGTH_LIMITS.default;
        const wordLimit = ITEM_WORD_LIMITS[item.type] || ITEM_WORD_LIMITS.default;
        const plain = stripInlineMarkdown(item.text);
        const condensed = condenseText(plain, limit, wordLimit);
        return {
            ...item,
            text: condensed,
            fullText: plain
        };
    }

    function compactItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }
        return items.map(item => compactItem({ ...item }));
    }

    function chunkArray(array, size) {
        if (!Array.isArray(array) || array.length === 0) {
            return [];
        }
        if (!Number.isFinite(size) || size <= 0) {
            return [array.slice()];
        }
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    function formatInlineMarkdown(text) {
        if (!text) {
            return '';
        }
        let formatted = escapeHtml(text);
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');
        formatted = formatted.replace(/`([^`]+?)`/g, '<code>$1</code>');
        formatted = formatted.replace(/~~(.+?)~~/g, '<del>$1</del>');
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="md-link" data-href="$2">$1</span>');
        return formatted;
    }

    function pushParagraph(target, text) {
        if (!target) {
            return;
        }
        const trimmed = text.trim();
        if (!trimmed) {
            return;
        }
        const lastItem = target.items[target.items.length - 1];
        if (lastItem && lastItem.type === 'paragraph') {
            lastItem.text += ' ' + trimmed;
        } else {
            target.items.push({ type: 'paragraph', text: trimmed });
        }
    }

    function pushQuote(target, text) {
        if (!target) {
            return;
        }
        const cleaned = text.replace(/^>\s?/, '').trim();
        if (!cleaned) {
            return;
        }
        const lastItem = target.items[target.items.length - 1];
        if (lastItem && lastItem.type === 'quote') {
            lastItem.text += ' ' + cleaned;
        } else {
            target.items.push({ type: 'quote', text: cleaned });
        }
    }

    function pushCheckbox(target, text, checked) {
        if (!target) {
            return;
        }
        target.items.push({ type: 'checkbox', text: text.trim(), checked: !!checked });
    }

    function pushBullet(target, text, kind) {
        if (!target) {
            return;
        }
        target.items.push({ type: kind || 'bullet', text: text.trim() });
    }

    function parseMarkdown(markdown) {
        const lines = markdown.split(/\r?\n/);
        const meta = {
            title: '',
            subtitle: '',
            rawTitle: '',
            lastUpdated: '',
            author: ''
        };
        const sections = [];
        const checkboxCounts = { total: 0, completed: 0 };

        let currentSection = null;
        let currentSubsection = null;
        let insideCodeBlock = false;

        const sectionForItem = () => currentSubsection || currentSection;

        for (const rawLine of lines) {
            const line = rawLine.replace(/\t/g, '    ');
            const trimmed = line.trim();

            if (trimmed.startsWith('```')) {
                insideCodeBlock = !insideCodeBlock;
                continue;
            }

            if (insideCodeBlock) {
                continue;
            }

            if (!trimmed) {
                continue;
            }

            if (/^#\s+/.test(trimmed)) {
                const headingText = normalizeHeading(trimmed);
                if (!meta.title) {
                    meta.rawTitle = headingText;
                    if (headingText.includes('—')) {
                        const parts = headingText.split('—');
                        meta.title = parts[0].trim();
                        meta.subtitle = parts.slice(1).join('—').trim();
                    } else if (headingText.includes(':')) {
                        const parts = headingText.split(':');
                        meta.title = parts[0].trim();
                        meta.subtitle = parts.slice(1).join(':').trim();
                    } else {
                        meta.title = headingText;
                    }
                } else {
                    // Treat as new section
                    currentSection = {
                        title: headingText,
                        items: [],
                        subsections: []
                    };
                    sections.push(currentSection);
                    currentSubsection = null;
                }
                continue;
            }

            const lastUpdatedMatch = trimmed.match(/^\*\*Last Updated:\*\*\s*(.+)$/i);
            if (lastUpdatedMatch) {
                meta.lastUpdated = lastUpdatedMatch[1].trim();
                continue;
            }

            const authorMatch = trimmed.match(/^\*\*Author:\*\*\s*(.+)$/i);
            if (authorMatch) {
                meta.author = authorMatch[1].trim();
                continue;
            }

            if (/^##\s+/.test(trimmed)) {
                currentSection = {
                    title: normalizeHeading(trimmed),
                    items: [],
                    subsections: []
                };
                sections.push(currentSection);
                currentSubsection = null;
                continue;
            }

            if (/^###\s+/.test(trimmed)) {
                if (!currentSection) {
                    currentSection = {
                        title: normalizeHeading(trimmed),
                        items: [],
                        subsections: []
                    };
                    sections.push(currentSection);
                }
                currentSubsection = {
                    title: normalizeHeading(trimmed),
                    items: []
                };
                currentSection.subsections.push(currentSubsection);
                continue;
            }

            if (/^---+$/.test(trimmed)) {
                // horizontal rule => ignore for slides
                continue;
            }

            const checkboxMatch = trimmed.match(/^[-*]\s*\[( |x|X)\]\s*(.+)$/);
            if (checkboxMatch) {
                const checked = checkboxMatch[1].toLowerCase() === 'x';
                pushCheckbox(sectionForItem(), checkboxMatch[2], checked);
                checkboxCounts.total += 1;
                if (checked) {
                    checkboxCounts.completed += 1;
                }
                continue;
            }

            const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
            if (bulletMatch) {
                pushBullet(sectionForItem(), bulletMatch[1], 'bullet');
                continue;
            }

            const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
            if (numberedMatch) {
                pushBullet(sectionForItem(), numberedMatch[1], 'numbered');
                continue;
            }

            if (trimmed.startsWith('>')) {
                pushQuote(sectionForItem(), trimmed);
                continue;
            }

            pushParagraph(sectionForItem(), trimmed);
        }

        return { meta, sections, checkboxCounts };
    }

    function sectionHasCheckbox(section) {
        if (!section) {
            return false;
        }
        const hasInItems = (section.items || []).some(item => item.type === 'checkbox');
        const hasInSub = (section.subsections || []).some(sub =>
            (sub.items || []).some(item => item.type === 'checkbox')
        );
        return hasInItems || hasInSub;
    }

    function determineSlideType(section) {
        const title = (section.title || '').toLowerCase();
        if (sectionHasCheckbox(section)) {
            return 'checklist';
        }
        if (title.includes('risk') || title.includes('blocker')) {
            return 'risks';
        }
        if (title.includes('todo') || title.includes('next step') || title.includes('action')) {
            return 'todo';
        }
        if (title.includes('overview')) {
            return 'overview';
        }
        if (title.includes('plan')) {
            return 'plan';
        }
        return 'content';
    }

    function cloneBlock(block) {
        return {
            heading: block.heading,
            items: block.items.map(item => ({ ...item }))
        };
    }

    function chunkBlockItems(block) {
        if (!block || !(block.items || []).length) {
            return [];
        }
        if (block.items.length <= MAX_ITEMS_PER_BLOCK) {
            return [cloneBlock(block)];
        }
        const chunks = [];
        for (let i = 0; i < block.items.length; i += MAX_ITEMS_PER_BLOCK) {
            const slice = block.items.slice(i, i + MAX_ITEMS_PER_BLOCK);
            const suffix = i === 0 ? '' : ` (ต่อ ${Math.floor(i / MAX_ITEMS_PER_BLOCK) + 1})`;
            chunks.push({
                heading: block.heading ? block.heading + suffix : null,
                items: slice.map(item => ({ ...item }))
            });
        }
        return chunks;
    }

    function buildBlocks(section) {
        const blocks = [];
        const subsections = section.subsections || [];
        if (subsections.length) {
            subsections.forEach(sub => {
                if (!(sub.items || []).length) {
                    return;
                }
                const baseBlock = {
                    heading: sub.title,
                    items: compactItems(sub.items)
                };
                blocks.push(...chunkBlockItems(baseBlock));
            });
        }

        if ((section.items || []).length) {
            const base = {
                heading: null,
                items: compactItems(section.items)
            };
            blocks.push(...chunkBlockItems(base));
        }

        return blocks;
    }

    function splitBlocksIntoSlides(section, slideType) {
        const blocks = buildBlocks(section);
        if (!blocks.length) {
            return [{ type: slideType, title: section.title, blocks: [] }];
        }

        const slides = [];
        let currentBlocks = [];
        let itemCount = 0;

        const flush = () => {
            if (!currentBlocks.length) {
                return;
            }
            const titleSuffix = slides.length === 0 ? '' : ` (ต่อ ${slides.length + 1})`;
            slides.push({
                type: slideType,
                title: section.title + titleSuffix,
                blocks: currentBlocks.map(block => ({
                    heading: block.heading,
                    items: block.items.map(item => ({ ...item }))
                }))
            });
            currentBlocks = [];
            itemCount = 0;
        };

        blocks.forEach(block => {
            const blockItemCount = Math.max(block.items.length, 1);
            const wouldExceedItems = itemCount + blockItemCount > MAX_ITEMS_PER_SLIDE;
            const wouldExceedBlocks = currentBlocks.length >= MAX_BLOCKS_PER_SLIDE;

            if (wouldExceedItems || wouldExceedBlocks) {
                flush();
            }

            currentBlocks.push(block);
            itemCount += blockItemCount;
        });

        flush();
        return slides;
    }

    function buildPresentationModel(markdown) {
        const parsed = parseMarkdown(markdown);
        const slides = [];
        const meta = parsed.meta;

        slides.push({
            type: 'title',
            title: meta.title || 'Chahua Presentation',
            subtitle: meta.subtitle || 'Auto-generated from Markdown',
            meta: {
                lastUpdated: meta.lastUpdated,
                author: meta.author
            }
        });

        if ((parsed.sections || []).length) {
            const agendaItems = parsed.sections
                .map(section => section.title)
                .filter(Boolean)
                .map(title => condenseText(stripInlineMarkdown(title), 68, 12));
            if (agendaItems.length) {
                const agendaChunks = chunkArray(agendaItems, MAX_AGENDA_ITEMS_PER_SLIDE);
                agendaChunks.forEach((chunk, index) => {
                    slides.push({
                        type: 'agenda',
                        title: index === 0 ? 'Agenda' : `Agenda (ต่อ ${index + 1})`,
                        items: chunk
                    });
                });
            }
        }

        if (parsed.checkboxCounts.total > 0) {
            slides.push({
                type: 'progress',
                title: 'Progress Overview',
                completed: parsed.checkboxCounts.completed,
                total: parsed.checkboxCounts.total
            });
        }

        (parsed.sections || []).forEach(section => {
            const slideType = determineSlideType(section);
            const sectionSlides = splitBlocksIntoSlides(section, slideType);
            sectionSlides.forEach(slide => slides.push(slide));
        });

        return {
            meta,
            slides,
            checkboxCounts: parsed.checkboxCounts
        };
    }

    window.presentationUtils = {
        parseMarkdown,
        buildPresentationModel,
        formatInline: formatInlineMarkdown,
        escapeHtml
    };
})();
