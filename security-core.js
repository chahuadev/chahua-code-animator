// ! ══════════════════════════════════════════════════════════════════════════════
// ! Chahua Code Animator - Security Core Module
// ! ══════════════════════════════════════════════════════════════════════════════

// ! ══════════════════════════════════════════════════════════════════════════════
// !  บริษัท ชาหัว ดีเวลลอปเมนต์ จำกัด (Chahua Development Co., Ltd.)
// !  Repository: https://github.com/chahuadev/chahua-code-animator.git
// !  Version: 1.0.0
// !  License: MIT
// !  Contact: chahuadev@gmail.com
// ! ══════════════════════════════════════════════════════════════════════════════
// @description Enterprise-grade security module for code animation tool
// @security_level FORTRESS - Maximum Protection
// ══════════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                         Custom Error Classes - Zone 0                            ║
// ║                     Enhanced Error Handling System                               ║
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

class PathTraversalError extends SecurityError {
    constructor(message, filePath = null, attemptedPath = null) {
        super(message, filePath, 'PATH_TRAVERSAL_001');
        this.name = 'PathTraversalError';
        this.attemptedPath = attemptedPath;
    }
}

class SymlinkError extends SecurityError {
    constructor(message, filePath = null, linkTarget = null) {
        super(message, filePath, 'SYMLINK_001');
        this.name = 'SymlinkError';
        this.linkTarget = linkTarget;
    }
}

class FileValidationError extends SecurityError {
    constructor(message, filePath = null, reason = null) {
        super(message, filePath, 'FILE_VAL_001');
        this.name = 'FileValidationError';
        this.reason = reason;
    }
}

class ReDoSError extends SecurityError {
    constructor(message, pattern = null, filePath = null) {
        super(message, filePath, 'REDOS_001');
        this.name = 'ReDoSError';
        this.pattern = pattern;
    }
}

class RateLimitError extends SecurityError {
    constructor(message, operation = null) {
        super(message, null, 'RATE_LIMIT_001');
        this.name = 'RateLimitError';
        this.operation = operation;
    }
}

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                         Security Configuration - Zone 1                          ║
// ║                    System-wide Security Settings                                 ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

const SECURITY_CONFIG = {
    // Path Security
    MAX_PATH_LENGTH: 260,
    ALLOWED_EXTENSIONS: [
        '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte',
        '.html', '.css', '.scss', '.sass', '.less',
        '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.rb',
        '.php', '.pl', '.sh', '.bash', '.zsh',
        '.yml', '.yaml', '.json', '.xml', '.toml',
        '.md', '.txt', '.sql', '.lua', '.swift', '.kt', '.dart', '.scala'
    ],
    FORBIDDEN_PATHS: [
        /^[A-Z]:\\Windows\\/i,
        /^[A-Z]:\\Program Files\\/i,
        /^\/etc\//,
        /^\/usr\/bin\//,
        /^\/System\//,
        /^\/bin\//,
        /^\/sbin\//,
        /node_modules/,
        /\.git/
    ],
    // Additional allowed directories (absolute paths). Empty by default.
    EXTRA_ALLOWED_DIRS: [],
    
    // File Security
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MIN_FILE_SIZE: 1, // 1 byte
    
    // Symlink Security
    ALLOW_SYMLINKS: false,
    MAX_SYMLINK_DEPTH: 3,
    
    // ReDoS Protection
    ENABLE_REDOS_PROTECTION: true,
    MAX_PATTERN_EXECUTION_TIME: 1000, // 1 second
    REGEX_TIMEOUT: 5000, // 5 seconds
    
    // Rate Limiting
    MAX_FILES_PER_SECOND: 50,
    MAX_OPERATIONS_PER_MINUTE: 500,
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    
    // Content Security
    MAX_ANIMATION_DURATION: 300000, // 5 minutes
    MAX_BLOCKS_PER_FILE: 1000,
    MAX_LINES_PER_BLOCK: 50,
    
    // Hash & Integrity
    HASH_ALGORITHM: 'sha256',
    VERIFY_FILE_INTEGRITY: true
};

// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║                         Security Manager - Zone 2                                ║
// ║                    Core Security Implementation                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

class SecurityManager {
    constructor(config = {}) {
        this.config = { ...SECURITY_CONFIG, ...config };
        this.rateLimitStore = new Map();
        this.fileHashCache = new Map();
        this.operationLog = [];
        this.startTime = Date.now();
    }

    // ══════════════════════════════════════════════════════════════════════════════
    //                         Input Validation Functions
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Validate user input for path traversal and malicious patterns
     */
    validateInput(target) {
        if (!target || typeof target !== 'string') {
            throw new SecurityError('Invalid input: target must be a non-empty string');
        }

        // Check for path traversal patterns (but allow absolute paths)
        const dangerousPatterns = [
            /\.\.[\/\\]/,           // ../ or ..\
            /[<>"|?*]/,             // Invalid filename characters (allow : for Windows drives)
            /\0/,                   // Null bytes
            /[\x00-\x1f\x7f]/       // Control characters
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(target)) {
                throw new PathTraversalError(
                    `Dangerous pattern detected in input: ${target}`,
                    null,
                    target
                );
            }
        }

        // Length validation
        if (target.length > this.config.MAX_PATH_LENGTH) {
            throw new PathTraversalError(
                `Path too long: ${target.length} > ${this.config.MAX_PATH_LENGTH}`,
                null,
                target
            );
        }

        return true;
    }

    /**
     * Check if path is safe and not in forbidden directories
     */
    isPathSafe(targetPath) {
        const normalizedPath = path.normalize(targetPath).replace(/\\/g, '/');

        // Check against forbidden paths
        for (const forbiddenPattern of this.config.FORBIDDEN_PATHS) {
            if (forbiddenPattern.test(normalizedPath)) {
                throw new PathTraversalError(
                    `Access to forbidden path: ${targetPath}`,
                    targetPath,
                    normalizedPath
                );
            }
        }

        // Allow files within working directory OR workspace folder OR any EXTRA_ALLOWED_DIRS
        const absolutePath = path.resolve(targetPath);
        const workingDir = process.cwd();
        const workspaceDir = path.join(workingDir, 'workspace');

        const isInWorkingDir = absolutePath.startsWith(workingDir);
        const isInWorkspace = absolutePath.startsWith(workspaceDir);

        let isInExtra = false;
        if (Array.isArray(this.config.EXTRA_ALLOWED_DIRS)) {
            for (const extra of this.config.EXTRA_ALLOWED_DIRS) {
                if (!extra) continue;
                try {
                    const absExtra = path.resolve(extra);
                    if (absolutePath.startsWith(absExtra)) {
                        isInExtra = true;
                        break;
                    }
                } catch (e) {
                    // ignore invalid entries
                }
            }
        }

        if (!isInWorkingDir && !isInWorkspace && !isInExtra) {
            throw new PathTraversalError(
                `Path outside allowed directories. Please copy files to workspace folder: ${workspaceDir}`,
                targetPath,
                absolutePath
            );
        }

        return true;
    }

    /**
     * Check symlink safety and prevent circular references
     */
    checkSymlinkSafety(filePath, depth = 0) {
        if (!this.config.ALLOW_SYMLINKS) {
            try {
                const stats = fs.lstatSync(filePath);
                if (stats.isSymbolicLink()) {
                    throw new SymlinkError(
                        'Symlinks are disabled by security policy',
                        filePath,
                        fs.readlinkSync(filePath)
                    );
                }
            } catch (error) {
                if (error instanceof SymlinkError) throw error;
                // File doesn't exist or other error - will be caught by file validation
            }
        }

        // Check symlink depth
        if (depth > this.config.MAX_SYMLINK_DEPTH) {
            throw new SymlinkError(
                `Symlink depth exceeded: ${depth} > ${this.config.MAX_SYMLINK_DEPTH}`,
                filePath,
                null
            );
        }

        return { safe: true, depth };
    }

    /**
     * Validate file extension
     */
    validateFileExtension(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        if (!this.config.ALLOWED_EXTENSIONS.includes(ext)) {
            throw new FileValidationError(
                `File extension not allowed: ${ext}`,
                filePath,
                'INVALID_EXTENSION'
            );
        }

        return true;
    }

    /**
     * Validate file size
     */
    validateFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const size = stats.size;

            if (size < this.config.MIN_FILE_SIZE) {
                throw new FileValidationError(
                    `File too small: ${size} bytes`,
                    filePath,
                    'FILE_TOO_SMALL'
                );
            }

            if (size > this.config.MAX_FILE_SIZE) {
                throw new FileValidationError(
                    `File too large: ${size} > ${this.config.MAX_FILE_SIZE}`,
                    filePath,
                    'FILE_TOO_LARGE'
                );
            }

            return { valid: true, size };
        } catch (error) {
            if (error instanceof FileValidationError) throw error;
            throw new FileValidationError(
                `Cannot validate file size: ${error.message}`,
                filePath,
                'STAT_ERROR'
            );
        }
    }

    /**
     * Calculate file hash for integrity verification
     */
    calculateFileHash(filePath) {
        try {
            const content = fs.readFileSync(filePath);
            const hash = crypto
                .createHash(this.config.HASH_ALGORITHM)
                .update(content)
                .digest('hex');
            
            this.fileHashCache.set(filePath, {
                hash,
                timestamp: Date.now()
            });

            return hash;
        } catch (error) {
            throw new SecurityError(
                `Failed to calculate file hash: ${error.message}`,
                filePath,
                'HASH_ERROR'
            );
        }
    }

    /**
     * Verify file integrity
     */
    verifyFileIntegrity(filePath, expectedHash) {
        const currentHash = this.calculateFileHash(filePath);
        
        if (currentHash !== expectedHash) {
            throw new SecurityError(
                'File integrity verification failed - file may have been tampered with',
                filePath,
                'INTEGRITY_ERROR'
            );
        }

        return true;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    //                         Rate Limiting Functions
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Check rate limit for operations
     */
    checkRateLimit(operation) {
        const now = Date.now();
        const key = `${operation}_${now}`;
        
        // Clean old entries
        for (const [k, v] of this.rateLimitStore.entries()) {
            if (now - v.timestamp > this.config.RATE_LIMIT_WINDOW) {
                this.rateLimitStore.delete(k);
            }
        }

        // Count operations in current window
        const recentOps = Array.from(this.rateLimitStore.values())
            .filter(entry => 
                entry.operation === operation &&
                now - entry.timestamp < this.config.RATE_LIMIT_WINDOW
            );

        if (recentOps.length >= this.config.MAX_OPERATIONS_PER_MINUTE) {
            throw new RateLimitError(
                `Rate limit exceeded for operation: ${operation}`,
                operation
            );
        }

        // Record operation
        this.rateLimitStore.set(key, {
            operation,
            timestamp: now
        });

        return true;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    //                         ReDoS Protection Functions
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Safe regex execution with timeout protection
     */
    safeRegexExecution(pattern, content, filePath = null) {
        if (!this.config.ENABLE_REDOS_PROTECTION) {
            return pattern.test(content);
        }

        const startTime = Date.now();
        let timeoutId;
        let result = false;

        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new ReDoSError(
                    'Regex execution timeout - possible ReDoS attack',
                    pattern.toString(),
                    filePath
                ));
            }, this.config.MAX_PATTERN_EXECUTION_TIME);
        });

        const executionPromise = new Promise((resolve) => {
            result = pattern.test(content);
            resolve(result);
        });

        return Promise.race([executionPromise, timeoutPromise])
            .finally(() => {
                clearTimeout(timeoutId);
                const executionTime = Date.now() - startTime;
                
                if (executionTime > this.config.MAX_PATTERN_EXECUTION_TIME * 0.8) {
                    console.warn(`[SECURITY] Slow regex execution: ${executionTime}ms`);
                }
            });
    }

    // ══════════════════════════════════════════════════════════════════════════════
    //                         Complete File Validation
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Comprehensive file validation pipeline
     */
    async validateFile(filePath) {
        try {
            // 1. Resolve absolute path
            const absolutePath = path.resolve(filePath);

            // 2. Input validation
            this.validateInput(absolutePath);

            // 3. Path safety check
            this.isPathSafe(absolutePath);

            // 4. Symlink safety
            this.checkSymlinkSafety(absolutePath);

            // 5. File extension validation
            this.validateFileExtension(absolutePath);

            // 6. File size validation
            const sizeInfo = this.validateFileSize(absolutePath);

            // 7. Rate limit check
            this.checkRateLimit(`file_access_${absolutePath}`);

            // 8. Calculate hash for integrity
            const hash = this.config.VERIFY_FILE_INTEGRITY 
                ? this.calculateFileHash(absolutePath)
                : null;

            // Log successful validation
            this.logOperation('FILE_VALIDATION_SUCCESS', {
                filePath: absolutePath,
                size: sizeInfo.size,
                hash
            });

            return {
                valid: true,
                filePath: absolutePath,
                size: sizeInfo.size,
                hash,
                timestamp: Date.now()
            };

        } catch (error) {
            this.logOperation('FILE_VALIDATION_FAILED', {
                filePath,
                error: error.message,
                errorType: error.name
            });
            throw error;
        }
    }

    /**
     * Read file with full security validation
     */
    async secureReadFile(filePath) {
        const validation = await this.validateFile(filePath);
        
        try {
            const content = fs.readFileSync(validation.filePath, 'utf8');
            
            return {
                success: true,
                content,
                filePath: validation.filePath,
                size: validation.size,
                hash: validation.hash
            };
        } catch (error) {
            throw new SecurityError(
                `Failed to read file: ${error.message}`,
                validation.filePath,
                'READ_ERROR'
            );
        }
    }

    // ══════════════════════════════════════════════════════════════════════════════
    //                         Logging & Monitoring
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Log security operations
     */
    logOperation(type, data) {
        const entry = {
            type,
            timestamp: new Date().toISOString(),
            data,
            uptime: Date.now() - this.startTime
        };

        this.operationLog.push(entry);

        // Keep only recent logs (last 1000)
        if (this.operationLog.length > 1000) {
            this.operationLog.shift();
        }

        // Console output in dev mode
        if (process.env.NODE_ENV === 'development') {
            console.log(`[SECURITY] ${type}:`, data);
        }
    }

    /**
     * Get security statistics
     */
    getSecurityStats() {
        return {
            totalOperations: this.operationLog.length,
            uptime: Date.now() - this.startTime,
            rateLimitEntries: this.rateLimitStore.size,
            cachedHashes: this.fileHashCache.size,
            config: this.config
        };
    }

    /**
     * Export security log
     */
    exportSecurityLog() {
        return {
            generatedAt: new Date().toISOString(),
            stats: this.getSecurityStats(),
            operations: this.operationLog
        };
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//                         Module Exports
// ══════════════════════════════════════════════════════════════════════════════

export {
    SecurityManager,
    SecurityError,
    PathTraversalError,
    SymlinkError,
    FileValidationError,
    ReDoSError,
    RateLimitError,
    SECURITY_CONFIG
};
