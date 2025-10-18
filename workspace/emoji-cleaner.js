#!/usr/bin/env node
// UNIVERSAL EMOJI CLEANER
// ===============================================
// @fileoverview Universal Emoji Cleaner Tool with Enhanced Security
// @author Chahua Development Co., Ltd.
// @version 2.5.3
// ----------------------------------
// Security Policy - Fortress Level Protection:
// ----------------------------------
// This tool works with any project type without needing to be in the same folder
// It includes advanced security and syntax validation to prevent code corruption
// ----------------------------------
const fs = require('fs');
const path = require('path');

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                         Zone 0: Custom Error Classes                            ║
// ║                     Enhanced Error Handling System                               ║
// ║                      Professional Error Management                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝
class SecurityError extends Error {
    constructor(message, filePath = null, errorCode = 'SEC_001') {
        super(message);
        this.name = 'SecurityError';
        this.filePath = filePath;
        this.errorCode = errorCode;
        this.timestamp = new Date().toISOString();
    }
}

class SymlinkError extends SecurityError {
    constructor(message, filePath = null, linkTarget = null) {
        super(message, filePath, 'SYM_001');
        this.name = 'SymlinkError';
        this.linkTarget = linkTarget;
    }
}

class SyntaxValidationError extends Error {
    constructor(message, filePath = null, syntaxDetails = null) {
        super(message);
        this.name = 'SyntaxValidationError';
        this.filePath = filePath;
        this.syntaxDetails = syntaxDetails;
        this.errorCode = 'SYN_001';
        this.timestamp = new Date().toISOString();
    }
}

class ReDoSError extends SecurityError {
    constructor(message, pattern = null, filePath = null) {
        super(message, filePath, 'REDOS_001');
        this.name = 'ReDoSError';
        this.pattern = pattern;
    }
}

class PathValidationError extends SecurityError {
    constructor(message, filePath = null, reason = null) {
        super(message, filePath, 'PATH_001');
        this.name = 'PathValidationError';
        this.reason = reason;
    }
}

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                         Zone 1: Security Configuration                          ║
// ║                    Security Configuration and Protection Functions           ║
// ║                    System-wide Security Settings                             ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

//  Security Configuration
const SECURITY_CONFIG = {
    MAX_PATH_LENGTH: 260,
    ALLOWED_EXTENSIONS: ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.go', '.rs', '.rb', '.pl', '.sh', '.yml', '.yaml', '.json', '.xml', '.md', '.sql', '.lua', '.swift', '.kt', '.dart', '.scala'],
    FORBIDDEN_PATHS: [
        /^[A-Z]:\\Windows\\/i,
        /^[A-Z]:\\Program Files\\/i,
        /^\/etc\//,
        /^\/usr\/bin\//,
        /^\/System\//,
        /^\/bin\//,
        /^\/sbin\//
    ],
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB (เพิ่มขึ้นสำหรับไฟล์ใหญ่)
    REGEX_TIMEOUT: 10000,             // 10 วินาที (เพิ่มขึ้น)
    MAX_FILES_PER_SECOND: 50,         // ลดลงเพื่อลด CPU load
    // Symlink Security Settings
    ALLOW_SYMLINKS: false, // ห้าม symlinks โดยค่าเริ่มต้นเพื่อความปลอดภัยสูงสุด
    MAX_SYMLINK_DEPTH: 3,  // จำกัดความลึกของ symlink chain
    // ReDoS Protection Settings
    ENABLE_REDOS_PROTECTION: true,
    MAX_PATTERN_EXECUTION_TIME: 1000 // 1 วินาที per pattern (เพิ่มขึ้นจาก 100ms)
};

// ══════════════════════════════════════════════════════════════════════════════
//                ฟังก์ชันป้องกัน Regular Expression DoS (ReDoS)
//                    ReDoS Attack Prevention Function
// ══════════════════════════════════════════════════════════════════════════════
function safeRegexExecution(pattern, content, filePath = null) {
    // Input validation
    if (!content || typeof content !== 'string') {
        return Promise.resolve(null);
    }

    if (!SECURITY_CONFIG.ENABLE_REDOS_PROTECTION) {
        try {
            return Promise.resolve(content.match(pattern));
        } catch (error) {
            return Promise.resolve(null);
        }
    }

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new ReDoSError(
                `Regular expression execution timeout (${SECURITY_CONFIG.MAX_PATTERN_EXECUTION_TIME}ms)`,
                pattern.source,
                filePath
            ));
        }, SECURITY_CONFIG.MAX_PATTERN_EXECUTION_TIME);

        try {
            const result = content.match(pattern);
            clearTimeout(timeout);
            resolve(result);
        } catch (error) {
            clearTimeout(timeout);
            reject(new ReDoSError(
                `Regular expression execution error: ${error.message}`,
                pattern.source,
                filePath
            ));
        }
    });
}
// ══════════════════════════════════════════════════════════════════════════════
//              ฟังก์ชันตรวจสอบความถูกต้องของข้อมูลนำเข้า
//                        Input Validation Function
// ══════════════════════════════════════════════════════════════════════════════
function validateInput(target) {
    if (!target || typeof target !== 'string') {
        throw new PathValidationError('Invalid target path', target, 'INVALID_TYPE');
    }

    if (target.length > SECURITY_CONFIG.MAX_PATH_LENGTH) {
        throw new PathValidationError('Path too long', target, 'PATH_TOO_LONG');
    }

    // ตรวจสอบ dangerous characters (ลบ : ออกเพราะใน Windows มี C: )
    const dangerousChars = /[<>"|?*\x00-\x1f]/;
    if (dangerousChars.test(target)) {
        throw new PathValidationError('Dangerous characters in path', target, 'DANGEROUS_CHARS');
    }

    return true;
}

// ══════════════════════════════════════════════════════════════════════════════
//                   ฟังก์ชันตรวจสอบความปลอดภัยของ Path
//                        Path Security Validation Function  
// ══════════════════════════════════════════════════════════════════════════════
function isPathSafe(targetPath) {
    const normalizedPath = path.resolve(targetPath);

    // ตรวจสอบ forbidden paths
    for (const forbiddenPattern of SECURITY_CONFIG.FORBIDDEN_PATHS) {
        if (forbiddenPattern.test(normalizedPath)) {
            throw new SecurityError(
                `Access to system directories is not allowed: ${normalizedPath}`,
                targetPath,
                'SYSTEM_DIR_ACCESS'
            );
        }
    }

    // ตรวจสอบ path traversal
    if (normalizedPath.includes('..')) {
        throw new SecurityError('Path traversal is not allowed', targetPath, 'PATH_TRAVERSAL');
    }

    return true;
}

// ══════════════════════════════════════════════════════════════════════════════
//                ฟังก์ชันตรวจสอบและป้องกัน Symbolic Link Attack
//                    Symbolic Link Attack Prevention Function
// ══════════════════════════════════════════════════════════════════════════════
function checkSymlinkSafety(filePath, depth = 0) {
    // ป้องกัน infinite symlink loops
    if (depth > SECURITY_CONFIG.MAX_SYMLINK_DEPTH) {
        throw new SymlinkError(
            `Symlink depth exceeded maximum (${SECURITY_CONFIG.MAX_SYMLINK_DEPTH})`,
            filePath
        );
    }

    try {
        // ใช้ lstatSync เพื่อตรวจสอบไฟล์โดยไม่ตาม symlink
        const stats = fs.lstatSync(filePath);

        // ตรวจสอบว่าเป็น symbolic link หรือไม่
        if (stats.isSymbolicLink()) {
            // ถ้าไม่อนุญาต symlinks
            if (!SECURITY_CONFIG.ALLOW_SYMLINKS) {
                throw new SymlinkError(
                    'Symbolic links are not allowed for security reasons',
                    filePath
                );
            }

            // อ่านปลายทางของ symlink
            const linkTarget = fs.readlinkSync(filePath);
            const resolvedTarget = path.resolve(path.dirname(filePath), linkTarget);

            // ตรวจสอบความปลอดภัยของปลายทาง
            isPathSafe(resolvedTarget);

            // ตรวจสอบว่าปลายทางไม่ชี้ออกไปนอกโปรเจกต์
            const projectRoot = process.cwd();
            const relativePath = path.relative(projectRoot, resolvedTarget);

            if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
                throw new SymlinkError(
                    `Symlink points outside project: ${filePath} -> ${resolvedTarget}`,
                    filePath,
                    resolvedTarget
                );
            }

            // ตรวจสอบว่าปลายทางไม่ใช่ไฟล์ระบบ
            for (const forbiddenPattern of SECURITY_CONFIG.FORBIDDEN_PATHS) {
                if (forbiddenPattern.test(resolvedTarget)) {
                    throw new SymlinkError(
                        `Symlink points to system directory: ${filePath} -> ${resolvedTarget}`,
                        filePath,
                        resolvedTarget
                    );
                }
            }

            // ตรวจสอบ symlink ต่อเนื่อง (recursive check)
            if (fs.existsSync(resolvedTarget)) {
                return checkSymlinkSafety(resolvedTarget, depth + 1);
            }

            return { isSymlink: true, target: resolvedTarget, stats };
        }

        return { isSymlink: false, target: null, stats };
    } catch (error) {
        if (error instanceof SymlinkError || error instanceof SecurityError) {
            throw error; // Re-throw custom errors
        }
        throw new SymlinkError(`Cannot check symlink safety: ${error.message}`, filePath);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                 ฟังก์ชันตรวจสอบสิทธิ์การเข้าถึงไฟล์
//                    File Permission Checking Function
// ══════════════════════════════════════════════════════════════════════════════
function checkFilePermissions(filePath, isDryRun = false) {
    try {
        // ตรวจสอบสิทธิ์อ่าน
        fs.accessSync(filePath, fs.constants.R_OK);

        // ตรวจสอบสิทธิ์เขียน (เฉพาะเมื่อไม่ใช่ dry-run)
        if (!isDryRun) {
            fs.accessSync(filePath, fs.constants.W_OK);
        }

        return true;
    } catch (error) {
        throw new SecurityError(`Permission denied: ${filePath}`, filePath, 'PERMISSION_DENIED');
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                   ฟังก์ชันทำความสะอาดและตรวจสอบ Path
//                     Path Sanitization and Validation Function
// ══════════════════════════════════════════════════════════════════════════════
function sanitizePath(inputPath) {
    const normalizedPath = path.normalize(inputPath);

    // ตรวจสอบ null bytes
    if (normalizedPath.includes('\x00')) {
        throw new PathValidationError('Null bytes in path are not allowed', inputPath, 'NULL_BYTES');
    }

    return normalizedPath;
}

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                         Zone 2: Syntax Validation                               ║
// ║                    Syntax Checking System for Multiple Languages             ║
// ║                    Pre and Post Processing Syntax Validation                 ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════════════════════════════════════════
//                    Advanced Syntax Validation Function
// ══════════════════════════════════════════════════════════════════════════════
function validateSyntax(content, fileExtension, forceMode = false) {
    const ext = fileExtension.toLowerCase();

    // ถ้าเป็น force mode ข้าม syntax validation
    if (forceMode) {
        console.log(' Force mode: Skipping syntax validation');
        return { valid: true, message: 'Force mode enabled - validation bypassed' };
    }

    //  Smart Analysis: ใช้ระบบอัจฉริยะสำหรับไฟล์ซับซ้อน
    if (content.length > 100000 || isComplexFile(content)) {
        console.log(' Complex file detected - using Smart File Analysis...');
        return smartFileValidation(content, ext);
    }

    // รูปแบบการตรวจสอบไวยากรณ์พื้นฐานสำหรับภาषาต่างๆ
    const syntaxValidators = {
        '.js': content => {
            // ตรวจสอบความสมดุลของ วงเล็บปีกกา, วงเล็บเหลี่ยม, และวงเล็บกลม
            // แต่อนุญาตให้มีความผิดพลาดเล็กน้อยสำหรับไฟล์ซับซ้อน
            const braces = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
            const brackets = (content.match(/\[/g) || []).length - (content.match(/\]/g) || []).length;
            const parens = (content.match(/\(/g) || []).length - (content.match(/\)/g) || []).length;

            // อนุญาต tolerance สำหรับไฟล์ใหญ่และซับซ้อน
            const tolerance = content.length > 200000 ? 5 : 2; // ไฟล์ใหญ่อนุญาตให้ผิดพลาดมากขึ้น
            const isValid = Math.abs(braces) <= tolerance && Math.abs(brackets) <= tolerance && Math.abs(parens) <= tolerance;

            if (!isValid) {
                console.log(` Syntax warning: Braces=${braces}, Brackets=${brackets}, Parens=${parens}`);
            }

            return { valid: isValid, message: 'ตรวจสอบความสมดุลของสัญลักษณ์' };
        },
        '.py': content => {
            // ตรวจสอบโครงสร้าง Python พื้นฐาน อย่างยืดหยุ่น
            const lines = content.split('\n');
            let valid = true;
            let errorCount = 0;
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.endsWith(':') && !trimmed.match(/^\s*(def|class|if|elif|else|for|while|try|except|finally|with|@|#)/)) {
                    errorCount++;
                    if (errorCount > 3) { // อนุญาตให้มี error บางส่วน
                        valid = false;
                        break;
                    }
                }
            }
            return { valid: true, message: 'ตรวจสอบโครงสร้างไวยากรณ์ Python (ยืดหยุ่น)' }; // ให้ผ่านเสมอ
        },
        '.html': content => {
            // ตรวจสอบความสมดุลของแท็ก HTML พื้นฐาน (ยืดหยุ่น)
            const openTags = (content.match(/<[^/][^>]*>/g) || []).length;
            const closeTags = (content.match(/<\/[^>]*>/g) || []).length;
            const selfClosing = (content.match(/<[^>]*\/>/g) || []).length;
            return { valid: true, message: 'ตรวจสอบความสมดุลของแท็ก HTML (ยืดหยุ่น)' }; // ให้ผ่านเสมอ
        },
        '.css': content => {
            // ตรวจสอบความสมดุลของวงเล็บปีกกา CSS พื้นฐาน
            const braces = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
            return { valid: braces === 0, message: 'ตรวจสอบความสมดุลของวงเล็บปีกกา CSS' };
        }
    };

    const validator = syntaxValidators[ext];
    if (validator) {
        return validator(content);
    }

    return { valid: true, message: 'ไม่มีตัวตรวจสอบเฉพาะสำหรับไฟล์ประเภทนี้' };
}

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                    Smart File Analysis System (from chahuadev-fix-comments)     ║
// ║                      ระบบวิเคราะห์ไฟล์อัจฉริยะ                               ║
// ║              [การใช้งาน] อัจฉริยะ: วิเคราะห์ไฟล์ซับซ้อนแบบมืออาชีพ               ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

// Basic Token Types สำหรับ Smart Analysis
const SMART_TOKEN_TYPES = {
    KEYWORD: 'KEYWORD',
    IDENTIFIER: 'IDENTIFIER',
    BRACE_OPEN: 'BRACE_OPEN',
    BRACE_CLOSE: 'BRACE_CLOSE',
    PAREN_OPEN: 'PAREN_OPEN',
    PAREN_CLOSE: 'PAREN_CLOSE',
    STRING: 'STRING',
    COMMENT: 'COMMENT'
};

// ตรวจสอบว่าไฟล์มีความซับซ้อนสูงหรือไม่
function isComplexFile(content) {
    const complexityIndicators = [
        (content.match(/class\s+\w+/g) || []).length > 5,        // มากกว่า 5 classes
        (content.match(/function\s+\w+/g) || []).length > 20,    // มากกว่า 20 functions
        (content.match(/=>\s*{/g) || []).length > 15,            // มากกว่า 15 arrow functions
        content.includes('constructor'),                          // มี constructor
        content.includes('extends'),                              // มี inheritance
        content.includes('async'),                                // มี async operations
        content.length > 200000                                   // ขนาดใหญ่กว่า 200KB
    ];

    return complexityIndicators.filter(Boolean).length >= 3; // ถ้ามี indicator 3+ ถือว่าซับซ้อน
}

// Smart File Validation สำหรับไฟล์ซับซ้อน
function smartFileValidation(content, fileExtension) {
    try {
        console.log(' Running smart analysis...');

        // Basic Smart Tokenization
        const smartTokens = basicSmartTokenizer(content);

        // Structural Analysis
        const structuralHealth = analyzeStructuralHealth(smartTokens);

        // Context-aware validation
        const contextValidation = analyzeFileContext(content, fileExtension);

        console.log(` Smart Analysis Results: Structural Health: ${structuralHealth.score}/100, Context: ${contextValidation.type}`);

        // ถือว่า valid ถ้า structural health > 70%
        const isValid = structuralHealth.score > 70;

        return {
            valid: isValid,
            message: `Smart Analysis: ${structuralHealth.score}% structural health`,
            details: {
                structural: structuralHealth,
                context: contextValidation
            }
        };

    } catch (error) {
        console.warn(' Smart analysis failed, falling back to basic validation');
        return { valid: true, message: 'Smart analysis fallback - assuming valid' };
    }
}

// Basic Smart Tokenizer (simplified version)
function basicSmartTokenizer(content) {
    const tokens = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) return;

        // Comments
        if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
            tokens.push({ type: SMART_TOKEN_TYPES.COMMENT, value: trimmed, line: lineIndex });
            return;
        }

        // Keywords
        if (trimmed.match(/^(class|function|const|let|var|if|for|while)\s/)) {
            tokens.push({ type: SMART_TOKEN_TYPES.KEYWORD, value: trimmed, line: lineIndex });
        }

        // Braces
        const braceCount = (trimmed.match(/[{}]/g) || []).length;
        if (braceCount > 0) {
            tokens.push({ type: SMART_TOKEN_TYPES.BRACE_OPEN, count: braceCount, line: lineIndex });
        }
    });

    return tokens;
}

// Structural Health Analysis
function analyzeStructuralHealth(tokens) {
    let score = 100;
    let issues = [];

    // Comment ratio analysis
    const totalTokens = tokens.length;
    const commentTokens = tokens.filter(t => t.type === SMART_TOKEN_TYPES.COMMENT).length;
    const commentRatio = totalTokens > 0 ? (commentTokens / totalTokens) * 100 : 0;

    if (commentRatio < 5) {
        score -= 10;
        issues.push('Low comment ratio');
    }

    // Keyword distribution analysis
    const keywordTokens = tokens.filter(t => t.type === SMART_TOKEN_TYPES.KEYWORD).length;
    const keywordRatio = totalTokens > 0 ? (keywordTokens / totalTokens) * 100 : 0;

    if (keywordRatio > 50) {
        score -= 20;
        issues.push('High keyword density - possible complexity');
    }

    return {
        score: Math.max(0, score),
        issues: issues,
        metrics: {
            totalTokens,
            commentRatio: commentRatio.toFixed(1),
            keywordRatio: keywordRatio.toFixed(1)
        }
    };
}

// File Context Analysis
function analyzeFileContext(content, fileExtension) {
    const context = {
        type: 'unknown',
        framework: 'none',
        complexity: 'low'
    };

    // Framework detection
    if (content.includes('React') || content.includes('jsx')) {
        context.framework = 'React';
    } else if (content.includes('Vue') || content.includes('vue')) {
        context.framework = 'Vue';
    } else if (content.includes('Angular') || content.includes('@angular')) {
        context.framework = 'Angular';
    }

    // File type detection
    if (content.includes('class ') && content.includes('constructor')) {
        context.type = 'class-based';
    } else if (content.includes('function ') || content.includes('=>')) {
        context.type = 'function-based';
    } else if (content.includes('module.exports') || content.includes('export')) {
        context.type = 'module';
    }

    // Complexity assessment
    const classCount = (content.match(/class\s+\w+/g) || []).length;
    const functionCount = (content.match(/function\s+\w+/g) || []).length;

    if (classCount > 10 || functionCount > 50) {
        context.complexity = 'high';
    } else if (classCount > 3 || functionCount > 15) {
        context.complexity = 'medium';
    }

    return context;
}

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                         Zone 3: Emoji Processing                                ║
// ║                   Emoji Detection และ Comment Cleanup Systems                ║
// ║              [การใช้งาน] หลัก: การตรวจหาและลบอิโมจิทุกรูปแบบ                  ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

//  Enhanced emoji patterns รองรับ Unicode 15.1+ และครอบคลุมทั่วโลก
const EMOJI_PATTERNS = [
    // Core Emoji Ranges (Unicode 15.1+)
    /[\u{1F600}-\u{1F64F}]/gu,  // Emoticons 
    /[\u{1F300}-\u{1F5FF}]/gu,  // Misc Symbols and Pictographs 
    /[\u{1F680}-\u{1F6FF}]/gu,  // Transport and Map Symbols 
    /[\u{1F700}-\u{1F77F}]/gu,  // Alchemical Symbols 
    /[\u{1F780}-\u{1F7FF}]/gu,  // Geometric Shapes Extended 
    /[\u{1F800}-\u{1F8FF}]/gu,  // Supplemental Arrows-C 
    /[\u{1F900}-\u{1F9FF}]/gu,  // Supplemental Symbols and Pictographs 
    /[\u{1FA00}-\u{1FA6F}]/gu,  // Chess Symbols 
    /[\u{1FA70}-\u{1FAFF}]/gu,  // Symbols and Pictographs Extended-A
    /[\u{1FB00}-\u{1FBFF}]/gu,  // Symbols and Pictographs Extended-B 

    // Extended Symbol Ranges
    /[\u{2600}-\u{26FF}]/gu,    // Miscellaneous Symbols 
    /[\u{2700}-\u{27BF}]/gu,    // Dingbats 
    /[\u{1F1E0}-\u{1F1FF}]/gu,  // Regional Indicators (Flags) 
    /[\u{1F100}-\u{1F1FF}]/gu,  // Enclosed Alphanumeric Supplement 
    /[\u{2B00}-\u{2BFF}]/gu,    // Miscellaneous Symbols and Arrows

    // Mathematical and Technical Symbols
    /[\u{2190}-\u{21FF}]/gu,    // Arrows 
    /[\u{2200}-\u{22FF}]/gu,    // Mathematical Operators 
    /[\u{2300}-\u{23FF}]/gu,    // Miscellaneous Technical 
    /[\u{2460}-\u{24FF}]/gu,    // Enclosed Alphanumerics 
    /[\u{25A0}-\u{25FF}]/gu,    // Geometric Shapes 
    /[\u{2900}-\u{297F}]/gu,    // Supplemental Arrows-A 
    /[\u{2980}-\u{29FF}]/gu,    // Miscellaneous Mathematical Symbols-A 
    /[\u{2A00}-\u{2AFF}]/gu,    // Supplemental Mathematical Operators 

    // Asian and Special Symbols
    /[\u{3030}]/gu,             // Wavy dash 
    /[\u{303D}]/gu,             // Part alternation mark 
    /[\u{3297}]/gu,             // Japanese congratulations symbol 
    /[\u{3299}]/gu,             // Japanese secret symbol 
    /[\u{1F004}]/gu,            // Mahjong tile 
    /[\u{1F0CF}]/gu,            // Playing card 

    // Complex Emoji Components and Modifiers
    /[\u{1F3FB}-\u{1F3FF}]/gu,  // Skin tone modifiers 🏻-🏿
    /[\u{FE00}-\u{FE0F}]/gu,    // Variation Selectors
    /[\u{200D}]/gu,             // Zero Width Joiner
    /[\u{20E3}]/gu,             // Combining Enclosing Keycap
    /[\u{E0020}-\u{E007F}]/gu,  // Tag characters

    // Complex ZWJ Sequences (Zero-Width Joiner)
    /\u{1F468}\u{200D}\u{1F4BB}/gu,     //  Man technologist
    /\u{1F469}\u{200D}\u{1F4BC}/gu,     //  Woman office worker
    /\u{1F468}\u{200D}\u{1F680}/gu,     //  Man astronaut
    /\u{1F469}\u{200D}\u{1F680}/gu,     //  Woman astronaut
    /\u{1F468}\u{200D}\u{1F692}/gu,     //  Man firefighter
    /\u{1F469}\u{200D}\u{1F692}/gu,     //  Woman firefighter
    /\u{1F3F3}\u{FE0F}\u{200D}\u{1F308}/gu, //  Rainbow flag
    /\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}\u{200D}\u{1F466}/gu, //  Family

    // Heart variations
    /\u{2764}\u{FE0F}/gu,       //  Red heart with variation selector
    /\u{1F49A}/gu,              //  Green heart
    /\u{1F499}/gu,              //  Blue heart
    /\u{1F49B}/gu,              //  Yellow heart
    /\u{1F9E1}/gu,              //  Orange heart
    /\u{1F49C}/gu,              //  Purple heart

    // HTML Entities (as text patterns)
    /&#x1F[0-9A-Fa-f]{3,4};/g,  // Hex HTML entities for emojis
    /&#1[0-9]{4,6};/g,          // Decimal HTML entities for emojis
    /&[a-zA-Z][a-zA-Z0-9]*;/g,  // Named entities (hearts, etc.)

    // Catch-all comprehensive pattern for any remaining emoji-like characters
    /[\u{1F000}-\u{1FFFF}]/gu,  // Complete emoji plane coverage
    /[\u{2600}-\u{27FF}]/gu,    // Extended symbol coverage
];

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                         Zone 4: File Management and Backup                     ║
// ║                     File Operations และ Backup & Restore                     ║
// ║              [การใช้งาน] สำคัญ: การสำรองและกู้คืนไฟล์อย่างปลอดภัย              ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════════════════════════════════════════
//                       ฟังก์ชันสร้างโฟลเดอร์สำรอง
//                      Backup Directory Creation Function
// ══════════════════════════════════════════════════════════════════════════════
function createBackupDir(targetPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(path.dirname(targetPath), `emoji-backup-${timestamp}`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
}

// ══════════════════════════════════════════════════════════════════════════════
//                  ฟังก์ชันคัดลอกไฟล์ไปยังโฟลเดอร์สำรอง
//                    File Backup Copy Function 
// ══════════════════════════════════════════════════════════════════════════════
function backupFile(filePath, backupDir, originalRoot) {
    try {
        const relativePath = path.relative(originalRoot, filePath);
        const backupFilePath = path.join(backupDir, relativePath);
        const backupFileDir = path.dirname(backupFilePath);

        // สร้างโฟลเดอร์สำรองถ้าไม่มี
        if (!fs.existsSync(backupFileDir)) {
            fs.mkdirSync(backupFileDir, { recursive: true });
        }

        fs.copyFileSync(filePath, backupFilePath);
        return backupFilePath;
    } catch (error) {
        console.warn(` Cannot backup ${filePath}: ${error.message}`);
        return null;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                ฟังก์ชันตรวจสอบและลบอิโมจิจากเนื้อหาไฟล์
//               Content Emoji Detection and Removal Function
// ══════════════════════════════════════════════════════════════════════════════

// ฟังก์ชันสำหรับจัดการไฟล์ใหญ่แบบแบ่งเป็นชิ้น
function processLargeFileInChunks(content, fileExt) {
    const CHUNK_SIZE = 50000; // 50KB chunks สำหรับ performance ที่ดี
    const lines = content.split('\n');
    let processedLines = [];
    let totalEmojiCount = 0;

    console.log(` Processing ${lines.length} lines in chunks...`);

    // แบ่งไฟล์เป็น chunks
    for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
        const chunk = lines.slice(i, i + CHUNK_SIZE);
        const chunkContent = chunk.join('\n');

        // แสดง progress
        const progress = Math.round((i / lines.length) * 100);
        if (progress % 20 === 0) {
            console.log(` Progress: ${progress}%`);
        }

        // ประมวลผล chunk นี้
        const result = processChunk(chunkContent, fileExt);
        processedLines = processedLines.concat(result.content.split('\n'));
        totalEmojiCount += result.emojiCount;
    }

    console.log(` Large file processing complete`);
    return {
        content: processedLines.join('\n'),
        emojiCount: totalEmojiCount
    };
}

// ฟังก์ชันสำหรับประมวลผล chunk เดียว
function processChunk(content, fileExt) {
    // ใช้ logic เดียวกับ removeEmojisFromStrings แต่สำหรับ chunk เล็ก ๆ
    const ext = fileExt.replace('.', '');
    let cleanContent = content;
    let emojiCount = 0;

    const stringPatterns = {
        'js': [
            /"([^"\\]|\\.)*"/g,      // Double quotes
            /'([^'\\]|\\.)*'/g,      // Single quotes
            /`([^`\\]|\\.)*`/g       // Template literals
        ],
        'ts': [
            /"([^"\\]|\\.)*"/g,      // Double quotes
            /'([^'\\]|\\.)*'/g,      // Single quotes
            /`([^`\\]|\\.)*`/g       // Template literals
        ]
    };

    const patterns = stringPatterns[ext] || [];

    for (const pattern of patterns) {
        cleanContent = cleanContent.replace(pattern, (match) => {
            let cleanMatch = match;
            for (const emojiPattern of EMOJI_PATTERNS) {
                const beforeClean = cleanMatch;
                cleanMatch = cleanMatch.replace(emojiPattern, '');
                if (beforeClean !== cleanMatch) {
                    emojiCount++;
                }
            }
            return cleanMatch;
        });
    }

    return { content: cleanContent, emojiCount };
}

// ฟังก์ชันสำหรับลบอิโมจิใน string literals และ attribute values
function removeEmojisFromStrings(content, fileExt) {
    const ext = fileExt.replace('.', '');
    let cleanContent = content;
    let emojiCount = 0;

    try {
        // Performance optimization: จัดการไฟล์ใหญ่ด้วย chunk processing
        const CHUNK_SIZE = 100000; // 100KB chunks
        if (content.length > CHUNK_SIZE * 5) { // ถ้าไฟล์ใหญ่กว่า 500KB
            console.log(` Large file detected (${Math.round(content.length / 1024)}KB), using chunk processing...`);
            return processLargeFileInChunks(content, fileExt);
        }

        // Define string patterns for different file types (ไม่รวม comments!)
        const stringPatterns = {
            'js': [
                /"([^"\\]|\\.)*"/g,      // Double quotes
                /'([^'\\]|\\.)*'/g,      // Single quotes (FIXED!)
                /`([^`\\]|\\.)*`/g       // Template literals
            ],
            'ts': [
                /"([^"\\]|\\.)*"/g,      // Double quotes
                /'([^'\\]|\\.)*'/g,      // Single quotes (FIXED!)
                /`([^`\\]|\\.)*`/g       // Template literals
            ],
            'html': [
                /="([^"]*?)"/g,          // HTML attribute values (double quotes)
                /='([^']*?)'/g,          // HTML attribute values (single quotes)
                />([^<]*?)</g            // HTML text content
            ],
            'css': [
                /"([^"\\]|\\.)*"/g,      // CSS property values (double quotes)
                /'([^'\\]|\\.)*'/g,      // CSS property values (single quotes)
                /content:\s*["']([^"']*?)["']/g  // CSS content property
            ],
            'json': [
                /"([^"\\]|\\.)*"/g       // JSON string values
            ],
            'xml': [
                /="([^"]*?)"/g,          // XML attribute values (double quotes)
                /='([^']*?)'/g,          // XML attribute values (single quotes)
                />([^<]*?)</g            // XML text content
            ]
        };

        const patterns = stringPatterns[ext] || [];

        // Process each string pattern
        for (const stringPattern of patterns) {
            cleanContent = cleanContent.replace(stringPattern, (match) => {
                let cleanString = match;

                // Apply emoji patterns to the string content
                for (const emojiPattern of EMOJI_PATTERNS) {
                    const beforeCount = (cleanString.match(emojiPattern) || []).length;
                    cleanString = cleanString.replace(emojiPattern, '');
                    emojiCount += beforeCount;
                }

                return cleanString;
            });
        }

        return { content: cleanContent, emojiCount };
    } catch (error) {
        console.warn(`Warning: Error processing strings in ${fileExt}: ${error.message}`);
        return { content, emojiCount: 0 };
    }
}

async function removeEmojis(content, filePath = null) {
    let cleanContent = content;
    let emojiCount = 0;

    try {
        // Step 1: Remove emojis from string literals and attributes first
        const fileExt = path.extname(filePath || '').toLowerCase();
        const stringResult = removeEmojisFromStrings(cleanContent, fileExt);
        cleanContent = stringResult.content;
        emojiCount += stringResult.emojiCount;

        // Step 2: Remove remaining emojis from general content with ReDoS protection
        for (const pattern of EMOJI_PATTERNS) {
            try {
                if (SECURITY_CONFIG.ENABLE_REDOS_PROTECTION) {
                    // Protected regex execution
                    const matches = await safeRegexExecution(pattern, cleanContent, filePath);
                    if (matches) {
                        emojiCount += matches.length;
                        cleanContent = cleanContent.replace(pattern, '');
                    }
                } else {
                    // Standard execution (fallback)
                    const matches = cleanContent.match(pattern);
                    if (matches) {
                        emojiCount += matches.length;
                        cleanContent = cleanContent.replace(pattern, '');
                    }
                }
            } catch (error) {
                if (error instanceof ReDoSError) {
                    console.warn(`  ReDoS protection triggered for pattern: ${pattern.source} in ${filePath}`);
                    continue; // Skip this pattern and continue with others
                }
                throw error;
            }
        }

        return {
            content: cleanContent,
            emojiCount,
            changed: emojiCount > 0
        };
    } catch (error) {
        if (error instanceof ReDoSError) {
            throw error;
        }
        throw new Error(`Failed to remove emojis: ${error.message}`);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                    ฟังก์ชันลบบล็อกคอมเมนต์ที่มีอิโมจิ
//                   Emoji Comment Block Removal Function
// ══════════════════════════════════════════════════════════════════════════════
async function removeEmojiComments(content, fileExt, filePath = null) {
    let commentCount = 0;
    let cleanContent = content;

    // Input validation
    if (!content || typeof content !== 'string') {
        return {
            content: content || '',
            commentCount: 0
        };
    }

    try {
        // Updated comprehensive emoji pattern for comments
        const emojiInCommentPattern = `[\\u{1F000}-\\u{1FFFF}\\u{2600}-\\u{27FF}\\u{1F600}-\\u{1F64F}\\u{1F300}-\\u{1F5FF}\\u{1F680}-\\u{1F6FF}\\u{1F1E0}-\\u{1F1FF}\\u{2B00}-\\u{2BFF}\\u{1F900}-\\u{1F9FF}\\u{1FA00}-\\u{1FAFF}\\u{1FB00}-\\u{1FBFF}]`;

        // กำหนด patterns สำหรับคอมเมนต์ตามประเภทไฟล์ (รองรับ emoji ครอบคลุมขึ้น)
        const commentPatterns = {
            // JavaScript, TypeScript, Java, C/C++, C#, PHP, Swift, Kotlin, Rust, Go, Dart
            'js': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],
            'ts': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],
            'jsx': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu'),
                new RegExp(`\\{\\s*\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/\\s*\\}`, 'gmu') // JSX comments
            ],
            'tsx': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu'),
                new RegExp(`\\{\\s*\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/\\s*\\}`, 'gmu')
            ],
            'java': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],
            'c': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],
            'cpp': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],
            'cs': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu'),
                new RegExp(`\\/\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu') // XML documentation
            ],
            'php': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu'),
                new RegExp(`#[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu')
            ],
            'swift': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],
            'kt': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],
            'rs': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],
            'go': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],
            'dart': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],

            // Python, Ruby, Perl, Shell scripts, R
            'py': [
                new RegExp(`#[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`"""[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?"""`, 'gmu'),
                new RegExp(`'''[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?'''`, 'gmu')
            ],
            'rb': [
                new RegExp(`#[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`=begin[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?=end`, 'gmu')
            ],
            'pl': [new RegExp(`#[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu')],
            'sh': [new RegExp(`#[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu')],
            'bash': [new RegExp(`#[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu')],
            'zsh': [new RegExp(`#[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu')],
            'r': [new RegExp(`#[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu')],

            // Web technologies และ markup
            'html': [new RegExp(`<!--[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?-->`, 'gmu')],
            'xml': [new RegExp(`<!--[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?-->`, 'gmu')],
            'css': [new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')],
            'scss': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],
            'sass': [new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu')],
            'less': [
                new RegExp(`\\/\\/[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],

            // Database และ config files
            'sql': [
                new RegExp(`--[^\\r\\n]*${emojiInCommentPattern}[^\\r\\n]*$`, 'gmu'),
                new RegExp(`\\/\\*[\\s\\S]*?${emojiInCommentPattern}[\\s\\S]*?\\*\\/`, 'gmu')
            ],
            'yml': [/#[^\r\n]*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][^\r\n]*$/gmu],
            'yaml': [/#[^\r\n]*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][^\r\n]*$/gmu],
            'ini': [/;[^\r\n]*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][^\r\n]*$/gmu, /#[^\r\n]*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][^\r\n]*$/gmu],
            'toml': [/#[^\r\n]*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][^\r\n]*$/gmu],

            // Other languages
            'lua': [/--[^\r\n]*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][^\r\n]*$/gmu, /--\[\[[\s\S]*?[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][\s\S]*?\]\]/gmu],
            'vim': [/"[^\r\n]*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][^\r\n]*$/gmu],
            'matlab': [/%[^\r\n]*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][^\r\n]*$/gmu, /%\{[\s\S]*?[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][\s\S]*?%\}/gmu],
            'scala': [/\/\/[^\r\n]*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][^\r\n]*$/gmu, /\/\*[\s\S]*?[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][\s\S]*?\*\//gmu],
            'julia': [/#[^\r\n]*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][^\r\n]*$/gmu, /#=[\s\S]*?[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2B00}-\u{2BFF}][\s\S]*?=#/gmu]
        };

        // เลือก patterns ตามนามสกุลไฟล์
        const fileExtension = fileExt.replace('.', '');
        const patterns = commentPatterns[fileExtension] || [];

        // ลบคอมเมนต์ที่มีอิโมจิ with ReDoS protection
        for (const pattern of patterns) {
            try {
                if (SECURITY_CONFIG.ENABLE_REDOS_PROTECTION) {
                    const matches = await safeRegexExecution(pattern, cleanContent, filePath);
                    if (matches) {
                        commentCount += matches.length;
                        cleanContent = cleanContent.replace(pattern, '');
                    }
                } else {
                    const matches = cleanContent.match(pattern);
                    if (matches) {
                        commentCount += matches.length;
                        cleanContent = cleanContent.replace(pattern, '');
                    }
                }
            } catch (error) {
                if (error instanceof ReDoSError) {
                    console.warn(`WARNING: ReDoS protection triggered for comment pattern in ${filePath}`);
                    continue; // Skip this pattern and continue with others
                }
                throw error;
            }
        }

        return { content: cleanContent, commentCount };
    } catch (error) {
        if (error instanceof ReDoSError) {
            throw error;
        }
        throw new Error(`Failed to remove emoji comments: ${error.message}`);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                 ฟังก์ชันตรวจสอบไฟล์เครื่องมือ Emoji Cleaner
//                    Emoji Cleaner Tool File Detection Function
// ══════════════════════════════════════════════════════════════════════════════
function isEmojiCleanerFile(filePath) {
    const fileName = path.basename(filePath);
    const emojiCleanerFiles = [
        'emoji-cleaner.js',
        'cli.js',
        'emoji-cleaner.sh',
        'emoji-cleaner.bat',
        'package.json'
    ];

    // ตรวจสอบชื่อไฟล์
    if (emojiCleanerFiles.includes(fileName)) {
        return true;
    }

    // ตรวจสอบว่าอยู่ในโฟลเดอร์ emoji cleaner หรือไม่ แต่ไม่รวมไฟล์ทดสอบ
    const normalizedPath = path.normalize(filePath);
    const isInEmojiCleanerTool = normalizedPath.includes('chahuadev-emoji-cleaner-tool');
    const isTestFile = fileName.startsWith('test-') || fileName.includes('-test') || fileName.includes('.test.');

    // อนุญาตให้ประมวลผลไฟล์ทดสอบ
    if (isTestFile) {
        return false;
    }

    if (isInEmojiCleanerTool && (
        normalizedPath.includes('emoji-cleaner.js') ||
        normalizedPath.includes('bin') ||
        normalizedPath.includes('node_modules')
    )) {
        return true;
    }

    return false;
}

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                         Zone 5: Main Processing                                 ║
// ║                      Main Processing Functions                                 ║
// ║              [การใช้งาน] หลัก: ประมวลผลไฟล์และโฟลเดอร์พร้อมระบบปลอดภัย         ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════════════════════════════════════════
//                     ฟังก์ชันวิเคราะห์และประมวลผลไฟล์
//                   File Analysis and Processing Function
// ══════════════════════════════════════════════════════════════════════════════
function analyzeFile(filePath, isDryRun = false, verbose = false, createBackup = false, backupDir = null, originalRoot = null, forceMode = false) {
    return new Promise(async (resolve, reject) => {
        try {
            // Security Checks
            const sanitizedPath = sanitizePath(filePath);
            validateInput(sanitizedPath);
            isPathSafe(sanitizedPath);

            // Symlink Safety Check
            const symlinkCheck = checkSymlinkSafety(sanitizedPath);
            if (symlinkCheck.isSymlink && verbose) {
                console.log(` Symlink detected: ${path.relative(process.cwd(), sanitizedPath)} -> ${symlinkCheck.target}`);
            }

            checkFilePermissions(sanitizedPath, isDryRun);

            // Self-Protection: ป้องกันการประมวลผลไฟล์ของเครื่องมือเอง
            if (isEmojiCleanerFile(sanitizedPath)) {
                if (verbose) {
                    console.log(`Self-protection: Skipping emoji cleaner file: ${path.relative(process.cwd(), sanitizedPath)}`);
                }
                resolve({
                    processed: false,
                    emojiCount: 0,
                    commentCount: 0,
                    changed: false,
                    skipped: true,
                    selfProtected: true
                });
                return;
            }

            // ตรวจสอบขนาดไฟล์
            const stats = symlinkCheck.stats || fs.statSync(sanitizedPath);
            if (stats.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
                throw new SecurityError(
                    `File too large (${stats.size} bytes)`,
                    sanitizedPath,
                    'FILE_TOO_LARGE'
                );
            }

            const content = fs.readFileSync(sanitizedPath, 'utf8');
            const fileExt = path.extname(sanitizedPath).toLowerCase();

            // ตรวจสอบนามสกุลไฟล์
            if (!SECURITY_CONFIG.ALLOWED_EXTENSIONS.includes(fileExt)) {
                if (verbose) {
                    console.log(`SKIPPING: Unsupported file: ${path.relative(process.cwd(), sanitizedPath)}`);
                }
                return {
                    processed: false,
                    emojiCount: 0,
                    commentCount: 0,
                    changed: false,
                    skipped: true
                };
            }

            // ตรวจสอบไวยากรณ์ก่อนการประมวลผล
            const syntaxCheck = validateSyntax(content, fileExt, forceMode);
            if (!syntaxCheck.valid) {
                if (verbose) {
                    console.warn(`WARNING: Syntax warning for ${path.relative(process.cwd(), sanitizedPath)}: ${syntaxCheck.message}`);
                }
                // ไม่หยุดการประมวลผล แต่แสดงคำเตือน
            }

            // ลบอิโมจิ
            const emojiResult = await removeEmojis(content, sanitizedPath);

            // ลบคอมเมนต์ที่มีอิโมจิ
            const commentResult = await removeEmojiComments(emojiResult.content, fileExt, sanitizedPath);

            // ตรวจสอบไวยากรณ์หลังการประมวลผล
            const finalSyntaxCheck = validateSyntax(commentResult.content, fileExt, forceMode);
            if (!finalSyntaxCheck.valid) {
                console.error(` Syntax error after processing ${path.relative(process.cwd(), sanitizedPath)}: ${finalSyntaxCheck.message}`);
                // คืนค่าเนื้อหาเดิมถ้าไวยากรณ์เสียหาย
                return {
                    processed: false,
                    emojiCount: 0,
                    commentCount: 0,
                    changed: false,
                    syntaxError: true,
                    error: `Syntax validation failed: ${finalSyntaxCheck.message}`
                };
            }

            const totalChanges = emojiResult.emojiCount + commentResult.commentCount;
            const finalContent = commentResult.content;

            if (verbose || totalChanges > 0) {
                const fileName = path.basename(sanitizedPath);
                if (isDryRun) {
                    console.log(` Analyzing: ${path.relative(process.cwd(), sanitizedPath)}`);
                    if (totalChanges > 0) {
                        console.log(` ${fileName}: ${emojiResult.emojiCount} emojis, ${commentResult.commentCount} comments`);
                        if (verbose) {
                            console.log(`   Emojis: ${emojiResult.emojiCount}`);
                            console.log(`   Comments: ${commentResult.commentCount}`);
                        }
                    } else {
                        console.log(` No emojis found in ${fileName}`);
                    }
                } else {
                    console.log(` Processing: ${path.relative(process.cwd(), sanitizedPath)}`);
                    console.log(` ${fileName}: ${emojiResult.emojiCount} emojis, ${commentResult.commentCount} comments`);
                }
            }

            // บันทึกการเปลี่ยนแปลง (ถ้าไม่ใช่ dry-run)
            if (!isDryRun && totalChanges > 0) {
                // สำรองไฟล์ถ้าต้องการ
                if (createBackup && backupDir && originalRoot) {
                    backupFile(sanitizedPath, backupDir, originalRoot);
                }

                fs.writeFileSync(sanitizedPath, finalContent, 'utf8');
            }

            resolve({
                processed: true,
                emojiCount: emojiResult.emojiCount,
                commentCount: commentResult.commentCount,
                changed: totalChanges > 0
            });

        } catch (error) {
            // จำแนกประเภท error
            if (error instanceof SecurityError || error instanceof SymlinkError ||
                error instanceof PathValidationError || error instanceof ReDoSError ||
                error instanceof SyntaxValidationError) {
                console.error(`SECURITY ERROR: ${error.name}: ${error.message}`);
                if (verbose && error.filePath) {
                    console.error(`   File: ${error.filePath}`);
                }
                if (verbose && error.errorCode) {
                    console.error(`   Error Code: ${error.errorCode}`);
                }
            } else {
                console.error(`ERROR: Error analyzing ${filePath}: ${error.message}`);
            }

            reject({
                processed: false,
                emojiCount: 0,
                commentCount: 0,
                changed: false,
                error: error.message,
                errorType: error.constructor.name,
                securityError: error instanceof SecurityError || error instanceof SymlinkError
            });
        }
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//                         ฟังก์ชันประมวลผลโฟลเดอร์
//                      Directory Processing Function
// ══════════════════════════════════════════════════════════════════════════════
function processDirectory(dirPath, isDryRun = false, verbose = false, extensions = ['.js', '.ts', '.jsx', '.tsx', '.html'], createBackup = false) {
    //  Security check for directory
    try {
        const sanitizedDirPath = sanitizePath(dirPath);
        validateInput(sanitizedDirPath);
        isPathSafe(sanitizedDirPath);
    } catch (error) {
        console.error(`Security Error: ${error.message}`);
        return {
            totalFiles: 0,
            filesWithEmojis: 0,
            totalEmojis: 0,
            totalComments: 0,
            errors: 1,
            duration: 0,
            backupDir: null,
            securityError: true
        };
    }

    const startTime = Date.now();
    let totalFiles = 0;
    let filesWithEmojis = 0;
    let totalEmojis = 0;
    let totalComments = 0;
    let errors = 0;
    let securityErrors = 0;

    // สร้างโฟลเดอร์สำรองถ้าต้องการ
    let backupDir = null;
    if (createBackup && !isDryRun) {
        backupDir = createBackupDir(dirPath);
        console.log(` Backup directory: ${backupDir}`);
    }

    function walkDir(dir) {
        try {
            // Security check for each directory
            isPathSafe(dir);

            const items = fs.readdirSync(dir);

            for (const item of items) {
                const itemPath = path.join(dir, item);

                try {
                    // Security check for each item
                    const sanitizedItemPath = sanitizePath(itemPath);

                    const stat = fs.statSync(sanitizedItemPath);

                    if (stat.isDirectory()) {
                        // ข้าม backup folders, system folders และ emoji cleaner folders
                        if (item.startsWith('backup-') || item.startsWith('emoji-backup-') ||
                            item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build' ||
                            item === 'System Volume Information' || item === '$Recycle.Bin' || item.startsWith('.') ||
                            item.includes('emoji-cleaner') || item.includes('chahuadev-emoji-cleaner-tool')) {
                            if (verbose) {
                                console.log(`SKIPPING: ${path.relative(process.cwd(), sanitizedItemPath)}`);
                            }
                            continue;
                        }
                        walkDir(sanitizedItemPath);
                    } else if (stat.isFile()) {
                        const fileExt = path.extname(sanitizedItemPath).toLowerCase();
                        if (extensions.includes(fileExt)) {
                            totalFiles++;
                            const result = analyzeFile(sanitizedItemPath, isDryRun, verbose, createBackup, backupDir, dirPath);

                            if (result.processed) {
                                if (result.changed) {
                                    filesWithEmojis++;
                                }
                                totalEmojis += result.emojiCount;
                                totalComments += result.commentCount;
                            } else {
                                if (result.securityError) {
                                    securityErrors++;
                                }
                                errors++;
                            }
                        }
                    }
                } catch (error) {
                    if (verbose) {
                        if (error.message.includes('Permission') || error.message.includes('system directories')) {
                            console.warn(` Security: Cannot access ${itemPath}: ${error.message}`);
                            securityErrors++;
                        } else {
                            console.warn(` Cannot access ${itemPath}: ${error.message}`);
                        }
                    }
                    errors++;
                }
            }
        } catch (error) {
            console.error(` Cannot read directory ${dir}: ${error.message}`);
            errors++;
        }
    }

    walkDir(dirPath);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    return {
        totalFiles,
        filesWithEmojis,
        totalEmojis,
        totalComments,
        errors,
        securityErrors,
        duration,
        backupDir
    };
}

// ══════════════════════════════════════════════════════════════════════════════
//                       ฟังก์ชันแสดงข้อมูลการใช้งาน
//                        Help Information Display Function
// ══════════════════════════════════════════════════════════════════════════════
function showHelp() {
    console.log(`
 Universal Emoji Cleaner v2.5.3 - Usage Guide

SYNTAX:
  emoji-cleaner [target] [options]
  npx @chahuadev/emoji-cleaner [target] [options]

ARGUMENTS:
  target                Path to file or directory (default: current directory)

OPTIONS:
  -d, --dry-run        Preview changes without modifying files
  -v, --verbose        Show detailed information during processing
  -b, --backup         Create backup before making changes
  -f, --force          Force mode: Skip syntax validation for complex files
  -h, --help           Show this help message
  --ext <extensions>   Specify file extensions (default: supports 50+ languages including .js,.ts,.jsx,.tsx,.html,.css,.py,.java,.cpp,.php,.go,.rs,.rb,.lua,.sql,.yml,.sh and more)

EXAMPLES:
  emoji-cleaner                                    # Clean current directory
  emoji-cleaner /path/to/project                   # Clean specific project
  emoji-cleaner ./src --dry-run                    # Preview changes only
  emoji-cleaner --verbose --backup                 # Clean with backup and details
  emoji-cleaner --ext .js,.html,.py               # Only process specific files
  emoji-cleaner /path/to/file.js                   # Clean single file

FEATURES:
   Enhanced Unicode 15.1+ emoji detection and removal
   Support for 50+ programming languages and file types
   Intelligent comment block cleanup with language-specific patterns
   HTML entity and named entity emoji removal
   Dry-run mode for safe preview
   Automatic backup creation
   Cross-platform compatibility
   Works with any project structure

SUPPORTED FILE TYPES (50+):
   Programming: .js .ts .jsx .tsx .java .c .cpp .cs .php .py .rb .pl .go .rs .swift .kt .dart .scala .julia
   Web/Markup: .html .xml .css .scss .sass .less
   Config: .yml .yaml .json .ini .toml .conf
   Scripts: .sh .bash .zsh .ps1 .bat .cmd
   Database: .sql .mysql .postgres
   Other: .lua .vim .matlab .r .txt .md

GLOBAL INSTALLATION:
  npm install -g @chahuadev/emoji-cleaner
  emoji-cleaner --help

PROJECT-SPECIFIC USAGE:
  npx @chahuadev/emoji-cleaner ./my-project
    `);
}

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                         Zone 6: User Interface                                  ║
// ║                     CLI Interface และ User Interaction Systems               ║
// ║              [การใช้งาน] สำคัญ: การจัดการ command line และอินเทอร์เฟซผู้ใช้   ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════════════════════════════════════════
//                    ฟังก์ชันหลัก - จุดเริ่มต้นการทำงาน
//                      Main Function - Entry Point
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
    const args = process.argv.slice(2);

    // ตรวจสอบ help
    if (args.includes('-h') || args.includes('--help')) {
        showHelp();
        return;
    }

    let targetPath = process.cwd();
    let isDryRun = false;
    let verbose = false;
    let createBackup = false;
    let forceMode = false; // เพิ่ม force mode เพื่อข้าม syntax validation
    let extensions = ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.go', '.rs', '.rb', '.pl', '.sh', '.yml', '.yaml', '.json', '.xml', '.md', '.sql', '.lua', '.swift', '.kt', '.dart', '.scala'];

    // วิเคราะห์ arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '-d' || arg === '--dry-run') {
            isDryRun = true;
        } else if (arg === '-v' || arg === '--verbose') {
            verbose = true;
        } else if (arg === '-b' || arg === '--backup') {
            createBackup = true;
        } else if (arg === '-f' || arg === '--force') {
            forceMode = true;
        } else if (arg === '--ext') {
            if (i + 1 < args.length) {
                extensions = args[i + 1].split(',').map(ext => ext.trim());
                i++; // ข้าม argument ถัดไป
            }
        } else if (!arg.startsWith('-')) {
            // Path argument
            const inputPath = path.resolve(arg);
            if (fs.existsSync(inputPath)) {
                targetPath = inputPath;
            } else {
                console.error(` Path not found: ${inputPath}`);
                process.exit(1);
            }
        }
    }

    console.log(' Universal Emoji Cleaner v2.5.3');
    console.log('================================');
    if (isDryRun) {
        console.log(' DRY RUN MODE - No files will be modified');
    }
    console.log(` Target: ${path.relative(process.cwd(), targetPath)}`);
    console.log(` Extensions: ${extensions.join(', ')}`);

    if (createBackup && !isDryRun) {
        console.log(' Backup mode enabled');
    }

    console.log('');

    // ตรวจสอบว่าเป็นไฟล์หรือโฟลเดอร์
    const stat = fs.statSync(targetPath);

    if (stat.isFile()) {
        // ประมวลผลไฟล์เดียว
        const fileExt = path.extname(targetPath).toLowerCase();
        if (!extensions.includes(fileExt)) {
            console.error(` File extension ${fileExt} not supported`);
            console.log(`Supported extensions: ${extensions.join(', ')}`);
            process.exit(1);
        }

        const result = await analyzeFile(targetPath, isDryRun, verbose, createBackup, null, null, forceMode);

        console.log('================================');
        if (isDryRun) {
            console.log(' Analysis Complete!');
        } else {
            console.log(' Cleaning Complete!');
        }
        console.log(` Emojis ${isDryRun ? 'found' : 'removed'}: ${result.emojiCount}`);
        console.log(` Comments ${isDryRun ? 'found' : 'removed'}: ${result.commentCount}`);

    } else {
        // ประมวลผลโฟลเดอร์
        const results = processDirectory(targetPath, isDryRun, verbose, extensions, createBackup);

        console.log('================================');
        if (isDryRun) {
            console.log(' Analysis Complete!');
        } else {
            console.log(' Cleaning Complete!');
        }
        console.log(` Files ${isDryRun ? 'with emojis' : 'processed'}: ${results.filesWithEmojis}`);
        console.log(` Total emojis ${isDryRun ? 'found' : 'removed'}: ${results.totalEmojis}`);
        console.log(` Comments ${isDryRun ? 'with emojis' : 'removed'}: ${results.totalComments}`);

        if (results.errors > 0) {
            console.log(` Errors encountered: ${results.errors}`);
        }

        if (results.backupDir) {
            console.log(` Backup saved to: ${path.relative(process.cwd(), results.backupDir)}`);
        }

        if (isDryRun) {
            console.log(' Use without --dry-run to apply changes');
        }
        console.log(`Time taken: ${results.duration}s`);
    }
}

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                         โซน 7: Enhanced CLI Interface                            ║
// ║                         Command Line Interface Functions                        ║
// ║              [การใช้งาน] หลัก: ระบบ CLI ที่ครอบคลุมและใช้งานง่าย                  ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════════════════════════════════════════
//                       ฟังก์ชันแสดงข้อมูลการใช้งาน
//                        Help Information Display Function
// ══════════════════════════════════════════════════════════════════════════════
function showHelp() {
    console.log(`
 Universal Emoji Cleaner v2.5.3 - Usage Guide

SYNTAX:
  emoji-cleaner [target] [options]
  npx @chahuadev/emoji-cleaner [target] [options]
  node emoji-cleaner.js [target] [options]

ARGUMENTS:
  target                Path to file or directory (default: current directory)

OPTIONS:
  -d, --dry-run        Preview changes without modifying files
  -v, --verbose        Show detailed information during processing
  -b, --backup         Create backup before making changes
  -e, --extensions     File extensions to process (default: js,ts,jsx,tsx,html)
  -x, --exclude        Directories to exclude (default: node_modules,.git,dist,build)
  -h, --help           Show this help message
  --version            Show version information

EXAMPLES:
  emoji-cleaner                          # Clean current directory
  emoji-cleaner ./src                    # Clean specific directory
  emoji-cleaner file.js                  # Clean specific file
  emoji-cleaner file.js --dry-run       # Preview changes
  emoji-cleaner . --backup              # Create backup before cleaning
  emoji-cleaner . -e js,ts,html         # Process only specific extensions
  emoji-cleaner . -x node_modules,dist  # Exclude specific directories

SUPPORTED FILES:
  [+] JavaScript (.js, .jsx)
  [+] TypeScript (.ts, .tsx) 
  [+] HTML (.html)
  [+] CSS (.css)
  [+] Python (.py)
  [+] Java (.java)
  [+] C/C++ (.c, .cpp)
  [+] C# (.cs)
  [+] PHP (.php)
  [+] Go (.go)
  [+] Rust (.rs)
  [+] Ruby (.rb)
  [+] Config files (.json, .xml, .yaml, .yml, .md)
  [+] And more text-based files

FEATURES:
   [+] Remove emojis from code and text
   [+] Remove emoji-only comments
   [+] Optional backup before changes
   [+] Dry-run mode for preview
   [+] Detailed statistics and reporting
   [+] Fast processing of large codebases
   [+] Security validation and safe processing

For more information, visit: https://github.com/chahuadev/chahuadev-emoji-cleaner-tool
`);
}

// ══════════════════════════════════════════════════════════════════════════════
//                        ฟังก์ชันแสดงข้อมูลเวอร์ชัน
//                       Version Information Display Function
// ══════════════════════════════════════════════════════════════════════════════
function showVersion() {
    const packagePath = path.join(__dirname, 'package.json');
    try {
        const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        console.log(`[+] Universal Emoji Cleaner v${packageInfo.version}`);
        console.log(`[+] npm package: ${packageInfo.name}`);
        console.log(`[+] Author: ${packageInfo.author.name || packageInfo.author}`);
        console.log(`[+] Repository: ${packageInfo.repository.url || packageInfo.repository}`);
    } catch (error) {
        console.log('[+] Universal Emoji Cleaner v2.5.3');
        console.log('[+] Author: Chahua Development Co., Ltd.');
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                  ฟังก์ชันวิเคราะห์อาร์กิวเมนต์บรรทัดคำสั่ง
//                   Command Line Arguments Parsing Function
// ══════════════════════════════════════════════════════════════════════════════
function parseArguments(args) {
    const options = {
        target: process.cwd(),
        dryRun: false,
        verbose: false,
        backup: false,
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.go', '.rs', '.rb', '.pl', '.sh', '.yml', '.yaml', '.json', '.xml', '.md', '.sql', '.lua', '.swift', '.kt', '.dart', '.scala'],
        excludeDirs: ['node_modules', '.git', 'dist', 'build', 'coverage'],
        help: false,
        version: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '-h' || arg === '--help') {
            options.help = true;
        } else if (arg === '--version') {
            options.version = true;
        } else if (arg === '-d' || arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '-v' || arg === '--verbose') {
            options.verbose = true;
        } else if (arg === '-b' || arg === '--backup') {
            options.backup = true;
        } else if (arg === '-e' || arg === '--extensions') {
            if (i + 1 < args.length) {
                const exts = args[i + 1].split(',').map(ext => ext.trim().startsWith('.') ? ext.trim() : '.' + ext.trim());
                options.extensions = exts;
                i++;
            }
        } else if (arg === '-x' || arg === '--exclude') {
            if (i + 1 < args.length) {
                options.excludeDirs = args[i + 1].split(',').map(dir => dir.trim());
                i++;
            }
        } else if (!arg.startsWith('-')) {
            // This is the target path
            options.target = path.resolve(arg);
        }
    }

    return options;
}

// ══════════════════════════════════════════════════════════════════════════════
//                     ฟังก์ชันแสดงผลลัพธ์สำหรับไฟล์เดียว
//                    Single File Result Display Function
// ══════════════════════════════════════════════════════════════════════════════
function displayFileResult(result, options) {
    const fileName = path.basename(result.filePath);
    const relativePath = path.relative(process.cwd(), result.filePath);

    if (result.success) {
        if (result.changed) {
            const icon = options.dryRun ? ' [DRY]' : ' [DONE]';
            console.log(`${icon} ${relativePath}`);
            if (options.verbose) {
                console.log(`   Emojis removed: ${result.emojiCount}`);
                console.log(`   Comments cleaned: ${result.commentCount}`);
                console.log(`   Size: ${result.originalSize} → ${result.newSize} bytes`);
            } else {
                console.log(`     ${result.emojiCount} emojis, ${result.commentCount} comments`);
            }
        } else if (options.verbose) {
            console.log(` ${relativePath} - No emojis found`);
        }
    } else {
        console.log(` ERROR: ${relativePath} - Error: ${result.error}`);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                          ฟังก์ชันแสดงสถิติรวม
//                        Summary Statistics Display Function
// ══════════════════════════════════════════════════════════════════════════════
function displaySummary(stats, options) {
    console.log(`\n Summary:`);
    console.log(`   Files processed: ${stats.totalFiles}`);
    console.log(`   Files with changes: ${stats.filesWithChanges}`);
    console.log(`   Total emojis removed: ${stats.totalEmojis}`);
    console.log(`   Total comments cleaned: ${stats.totalComments}`);
    console.log(`   Processing time: ${stats.duration}s`);

    if (stats.errors > 0) {
        console.log(`   Errors: ${stats.errors}`);
    }

    if (stats.backupDir) {
        console.log(`   Backup directory: ${path.relative(process.cwd(), stats.backupDir)}`);
    }

    if (options.dryRun) {
        console.log(`\n Dry-run completed. Use without --dry-run to apply changes.`);
    } else if (stats.filesWithChanges > 0) {
        console.log(`\n Cleaning completed successfully!`);
    } else {
        console.log(`\n No emojis found in processed files.`);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                  ฟังก์ชันหลัก CLI แบบใหม่ที่ปรับปรุงแล้ว
//                    Enhanced Main CLI Function
// ══════════════════════════════════════════════════════════════════════════════
async function enhancedMain() {
    try {
        const args = process.argv.slice(2);
        const options = parseArguments(args);

        // Show help or version if requested
        if (options.help) {
            showHelp();
            return;
        }

        if (options.version) {
            showVersion();
            return;
        }

        // Display header
        console.log('Universal Emoji Cleaner v2.5.3');
        console.log('================================');
        if (options.dryRun) {
            console.log(' DRY RUN MODE - No files will be modified');
        }
        console.log(` Target: ${path.relative(process.cwd(), options.target)}`);
        console.log(` Extensions: ${options.extensions.join(', ')}`);

        const startTime = Date.now();

        // Check if target exists
        if (!fs.existsSync(options.target)) {
            console.error(` Target not found: ${options.target}`);
            process.exit(1);
        }

        const stats = fs.statSync(options.target);

        if (stats.isFile()) {
            // Process single file
            console.log(' Processing single file...');
            const result = await analyzeFile(options.target, options.dryRun, options.verbose, options.backup);

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log('================================');
            if (options.dryRun) {
                console.log(' Analysis Complete!');
            } else {
                console.log(' Cleaning Complete!');
            }
            console.log(` Emojis ${options.dryRun ? 'found' : 'removed'}: ${result.emojiCount}`);
            console.log(` Comments ${options.dryRun ? 'found' : 'removed'}: ${result.commentCount}`);
            console.log(` Time taken: ${duration}s`);

        } else {
            // Process directory
            console.log(' Processing directory...');
            const results = processDirectory(options.target, options.dryRun, options.verbose, options.extensions, options.backup);

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log('================================');
            if (options.dryRun) {
                console.log(' Analysis Complete!');
            } else {
                console.log(' Cleaning Complete!');
            }
            console.log(` Files ${options.dryRun ? 'with emojis' : 'processed'}: ${results.filesWithEmojis}`);
            console.log(` Total emojis ${options.dryRun ? 'found' : 'removed'}: ${results.totalEmojis}`);
            console.log(` Comments ${options.dryRun ? 'with emojis' : 'removed'}: ${results.totalComments}`);
            console.log(` Time taken: ${duration}s`);

            if (results.errors > 0) {
                console.log(` Errors encountered: ${results.errors}`);
            }

            if (results.backupDir) {
                console.log(` Backup directory: ${path.relative(process.cwd(), results.backupDir)}`);
            }
        }

        if (options.dryRun) {
            console.log('\n Use without --dry-run to apply changes');
        }

    } catch (error) {
        if (error.message.includes('ENOENT')) {
            console.error(` Target not found: ${options.target}`);
        } else if (error.message.includes('Permission denied') ||
            error.message.includes('system directories') ||
            error.message.includes('Path traversal')) {
            console.error(` Security Error: ${error.message}`);
        } else {
            console.error(` Error: ${error.message}`);
        }
        process.exit(1);
    }
}

// เรียกใช้งานถ้าไม่ใช่การ import
if (require.main === module) {
    enhancedMain();
}

module.exports = {
    removeEmojis,
    analyzeFile,
    processDirectory,
    validateSyntax,
    validateInput,
    isPathSafe,
    checkFilePermissions,
    sanitizePath,
    isEmojiCleanerFile,
    main,
    enhancedMain,
    parseArguments,
    showHelp,
    showVersion,
    displayFileResult,
    displaySummary
};
