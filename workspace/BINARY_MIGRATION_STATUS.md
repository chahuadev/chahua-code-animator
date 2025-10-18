# Chahuadev Sentinel — Binary Migration Status Report

**Last Updated:** 18 October 2025  
**Author:** GitHub Copilot (AI Programming Assistant)

---

## 1. Project Overview
The "Binary-First Refactor" initiative ensures that Chahuadev Sentinel transmits rule identifiers and severity levels as binary values from the rule layer all the way to the central ErrorHandler. Only the ErrorHandler may translate these binary codes into human-readable text. Since early 2025, shared constant registries have been introduced and adopted across the primary application stack.

---

## 2. Step-by-Step Execution Plan
Each phase below includes checkboxes to indicate status (`[x]` completed, `[ ]` pending).

### Phase 1: Establish Shared Constants (Complete)
- [x] Introduce `src/constants/rule-constants.js` with bitmasks, numeric IDs, slugs, and helpers such as `resolveRuleSlug`, `coerceRuleId`
- [x] Introduce `src/constants/severity-constants.js` with binary rule/error severities and coercion helpers

### Phase 2: Migrate Key Rules to Shared Constants (Complete)
- [x] Update `src/rules/MUST_HANDLE_ERRORS.js` to consume `RULE_IDS`, `RULE_SEVERITY_FLAGS`, and canonical slugs
- [x] Update `src/rules/NO_CONSOLE.js` to align with the binary-first metadata contract

### Phase 3: Upgrade Aggregation Layer and CLI (Complete)
- [x] Refactor `src/rules/validator.js` to normalize binary IDs/severities and enrich rule metadata prior to reporting
- [x] Refactor `cli.js` to coerce rule and severity payloads into binary form before CLI reporting

### Phase 4: Audit All Rule Modules (Complete)
- [x] Revisit `src/rules/BINARY_AST_ONLY.js` to guarantee all metadata relies on shared constants
- [x] Revisit `src/rules/NO_EMOJI.js` to guarantee all metadata relies on shared constants
- [x] Revisit `src/rules/NO_HARDCODE.js` to guarantee all metadata relies on shared constants
- [x] Revisit `src/rules/NO_INTERNAL_CACHING.js` to guarantee all metadata relies on shared constants
- [x] Revisit `src/rules/NO_MOCKING.js` to guarantee all metadata relies on shared constants
- [x] Revisit `src/rules/NO_SILENT_FALLBACKS.js` to guarantee all metadata relies on shared constants
- [x] Revisit `src/rules/NO_STRING.js` to guarantee all metadata relies on shared constants
- [x] Revisit `src/rules/STRICT_COMMENT_STYLE.js` to guarantee all metadata relies on shared constants
- [x] Confirm no rule still references literal IDs or severity strings

### Phase 5: Rebuild ErrorHandler as the Translation Layer (In Progress)

> **Update 18 October 2025:**
> - Finalised the hierarchical domain catalog in `src/error-handler/error-catalog.js`, allowing downstream callers to resolve domain codes, slugs, and descriptions directly from normalized payloads.
> - Extended bilingual metadata (recommended actions, retry/fatal guidance) for Syntax and Type dictionaries in `src/error-handler/error-dictionary.js`; remaining categories stay on the roadmap.
> - Upgraded `src/error-handler/error-normalizer.js` to surface domain descriptors, severity metadata, and recommended actions for every normalized error, including fallback flows.
> - `src/rules/validator.js` now raises binary-only system payloads (with `sourceCode`, `severityCode`, `errorCode`) whenever parser bootstrapping or per-rule evaluation fails, backstopping Phase 5.3 intake requirements.
> - Extracted the console rendering layer into `src/error-handler/error-renderer.js` so `ErrorHandler.js` now focuses on intake and transport orchestration.
> - Next milestone: enforce the binary-only `handleError({ kind, code, severityCode, ... })` contract, migrate all callers, and finish metadata coverage for the remaining dictionary families before expanding regression tests.

> **Update 18 October 2025 (Helper Rollout):**
> - Added `src/error-handler/error-emitter.js` with `createSystemPayload` and `emitSecurityNotice` helpers so callers no longer craft raw payloads or string severities inline.
> - Expanded `error-catalog.js` and `error-dictionary.js` with a dedicated Security category, new runtime codes (uncaught exception, unhandled rejection, process warnings, report failures), and bilingual metadata for each entry.
> - Rewired `setupGlobalErrorHandlers` and the `SecurityMiddleware` bootstrap path to consume the new helpers, beginning the systematic migration away from the legacy two-argument `handleError` signature.
> - Opened bilingual issue ledgers (`docs/en/BINARY_MIGRATION_ISSUES.md`, `docs/th/BINARY_MIGRATION_ISSUES.md`) to capture migration blockers and outstanding caller updates as they are discovered.

> **Update 17 October 2025:**
> - Removed direct `errorHandler` usage from all rule modules (`src/rules/*.js`) so the rule layer now emits binary metadata only, preparing the Binary Intake Layer.
> - Introduced diagnostic error codes **1008 / 1009** for tokenizer instrumentation. These now escalate as CRITICAL incidents by design, forcing the pipeline to halt whenever binary grammar hydration fails; additional safeguards are required to keep operational visibility without blocking valid scans.
> - Latest CLI run (`node cli src\`) now passes after adding integrity assertions to `PureBinaryTokenizer.loadGrammarSections`. Telemetry-only notices are routed through the new `telemetry-recorder` channel, keeping CRITICAL 1008/1009 guarded while removing the generic code `500` chatter from the CLI transcript.
> - Next milestone: promote the Error Catalog into a hierarchical, metadata-aware classification system (domains ➝ categories ➝ individual codes) so downstream automation can infer retry/fatal policies without bespoke logic.

#### 5.1 Design 4-Layer Architecture
- [ ] Design new error notification architecture with 4 distinct layers:
  - **Layer 1: Binary Intake** - Accept errors as binary codes (ruleId, severityCode, errorCode)
  - **Layer 2: Normalization** - Transform binary  complete metadata (slug, name, description)
  - **Layer 3: Rendering** - Generate output (Markdown, JSON, plain text) from normalized data
  - **Layer 4: Transport** - Deliver to destinations (file, stream, console, external services)

#### 5.2 Create Error Catalog and Normalization Helpers
- [x] Create `src/error-handler/error-catalog.js` to centralize:
  - Error source types and binary codes (VALIDATOR, PARSER, CLI, SYSTEM)
  - Error category mappings (6 main categories):
   1. **Syntax Errors (1001-1099)**: Grammar/syntax violations
     - UNEXPECTED_TOKEN, MISSING_SEMICOLON, UNMATCHED_BRACKETS
     - INVALID_ASSIGNMENT, DUPLICATE_PARAMETER, UNEXPECTED_END_OF_INPUT
     - GRAMMAR_RULE_MISSING (grammar index lacks rule definition)
    2. **Type Errors (2001-2099)**: Data type mismatches
       - IS_NOT_A_FUNCTION, CANNOT_READ_PROPERTY_OF_NULL_OR_UNDEFINED
       - INVALID_TYPE_ARGUMENT, OPERATOR_CANNOT_BE_APPLIED
    3. **Reference Errors (3001-3099)**: Variable/reference issues
       - IS_NOT_DEFINED, TDZ_ACCESS (Temporal Dead Zone)
    4. **Runtime Errors (4001-4099)**: Execution-time failures
       - STACK_OVERFLOW, OUT_OF_MEMORY, NULL_POINTER_EXCEPTION
    5. **Logical Errors (5001-5099)**: Logic and best practice violations
       - UNHANDLED_PROMISE_REJECTION, INFINITE_LOOP, UNREACHABLE_CODE
       - VARIABLE_SHADOWING, USE_BEFORE_DEFINE, MAGIC_NUMBER
    6. **File System Errors (6001-6099)**: File operation failures
       - FILE_NOT_FOUND, FILE_READ_ERROR, FILE_WRITE_ERROR, PERMISSION_DENIED
   7. **Security Enforcement (7001-7099)**: Intrusion responses, rate limiting, and policy violations
     - UNKNOWN_VIOLATION, SUSPICIOUS_PATTERN, RATE_LIMIT_TRIGGERED, PATH_TRAVERSAL_BLOCKED, SECURITY_MODULE_FAILURE
  - Default error messages and templates
  - Severity level descriptions
- [x] Create `src/error-handler/error-dictionary.js` as "Error Code Dictionary":
  - Map error codes (binary)  human-readable messages
  - Store explanation (root cause description) for each error
  - Store fix suggestions (resolution steps) for each error
  - Support both Thai and English languages
  - Cover all 6 error code categories:
    - **RULE_ERROR_DICTIONARY**: for rule violations (10 rules)
    - **SYNTAX_ERROR_DICTIONARY**: for syntax errors (1001-1099)
    - **TYPE_ERROR_DICTIONARY**: for type errors (2001-2099)
    - **REFERENCE_ERROR_DICTIONARY**: for reference errors (3001-3099)
    - **RUNTIME_ERROR_DICTIONARY**: for runtime errors (4001-4099)
    - **LOGICAL_ERROR_DICTIONARY**: for logical errors (5001-5099)
    - **FILE_SYSTEM_ERROR_DICTIONARY**: for file system errors (6001-6099)
  - Example structure:
    ```javascript
    export const SYNTAX_ERROR_DICTIONARY = {
      [SYNTAX_ERROR_CODES.UNEXPECTED_TOKEN]: {
        message: {
          th: "พบ Token ที่ไม่คาดคิด",
          en: "Unexpected token found"
        },
        explanation: {
          th: "Parser พบ token ที่ไม่คาดหวังในตำแหน่งนี้",
          en: "Parser encountered unexpected token at this position"
        },
        fix: {
          th: "ตรวจสอบ syntax หา typo หรือเครื่องหมายที่หายไป",
          en: "Check syntax for typos or missing characters"
        },
        category: "SYNTAX_ERROR",
        severity: ERROR_SEVERITY_FLAGS.HIGH
      }
  }
  ```
- [x] Create `src/error-handler/error-normalizer.js` with transformation functions:
  - `normalizeRuleError(ruleId, severityCode, context)` - transform rule violations
  - `normalizeSystemError(errorCode, severityCode, context)` - transform system errors
  - `resolveErrorSource(sourceCode)` - convert source type binary  label
  - `resolveErrorMessage(errorCode, language)` - lookup message from error-dictionary
  - `enrichErrorContext(normalizedError)` - add complete context information
  - `createFallbackError(unknownError)` - create safe fallback for unknown errors
  - Persist `filePath` and detailed location (line/column spans) for downstream renderers

#### 5.3 Refactor ErrorHandler.js as Binary Intake Layer (In Progress)
- [x] Route all `handleError` calls through `error-normalizer.js` so dictionary metadata resolves from binary IDs before logging/streaming
- [x] Introduce centralized payload helpers (`createSystemPayload`, `emitSecurityNotice`) and adopt them for global Node process hooks plus the Security middleware bootstrap path
- [ ] Update `handleError(error, context)` signature so external callers provide **only** binary identifiers and structured metadata (no string severities accepted)
  ```javascript
  handleError({
    ruleId: number,           // from RULE_IDS
    severityCode: number,     // from RULE_SEVERITY_FLAGS
    errorCode: number,        // from ERROR_CODES (if applicable)
    sourceCode: number,       // validator/parser/cli/system
    filePath: string,
    position: object,
    context: object
  })
  ```
- [ ] Harden validation so non-binary severity strings are rejected early and surfaced as configuration faults
- [x] Move tokenizer/grammar success instrumentation off `handleError` (or assign dedicated non-error codes) so the CLI transcript stops showing "Unknown error code" entries
- [x] Add smoke test that runs `node cli src\` and asserts no MID/LOW-severity instrumentation is routed through the aggressive handler
- [x] Refactor `error-catalog.js` to introduce hierarchical domains and helper utilities for code composition (domain ➝ family ➝ code)
- [ ] Extend `error-dictionary.js` entries with contextual metadata (fatality, retry guidance, recommended actions) and thread it through the normalizer *(Syntax + Type complete; other families pending)*
- [ ] Update `error-normalizer.js` to capture external standards (HTTP codes, Node errno) and attach the new metadata/domain descriptors to normalized payloads *(Domain descriptors now emitted; external standards still pending)*
- [ ] Refactor `ErrorHandler.js` signature to a binary-only intake contract and migrate every call site (validator, grammars, security, extension, etc.) to the new structured payload
- [ ] Convert remaining security, extension, grammar, and CLI callers to the payload helpers and log blockers in the bilingual issue ledgers
- [ ] Finish Renderer separation by moving remaining console helpers and ensuring transport functions only receive normalized errors
- [x] Resolve 1008/1009 CRITICAL failures by repairing GrammarIndex hydration and section flattening before declaring the intake layer stable

#### 5.4 Create Rendering Layer
- [ ] Create `src/error-handler/error-renderer.js` with functions:
  - `renderMarkdownReport(normalizedErrors)` - generate full Markdown report
  - `renderConsoleSummary(normalizedErrors)` - generate CLI summary
  - `renderJSONReport(normalizedErrors)` - generate JSON output
  - `renderErrorDetail(normalizedError)` - generate single error detail
  - `formatCodeSnippet(filePath, position, context)` - format code block
- [ ] Renderer must display complete information:
  - Rule slug and name (TH/EN)
  - Severity label and binary code
  - Error source and context
  - Code snippet with line numbers
  - Stack trace (if available)

#### 5.5 Update Transport Layer
- [ ] Update `error-log-stream.js` to accept normalized error objects
- [ ] Add function `writeMarkdownReport(filePath, content)` for atomic report writing
- [ ] Add function `appendErrorLog(logPath, normalizedError)` for append-mode logging
- [ ] Support multiple output formats (markdown, json, plain text)
- [ ] Add error retry and fallback mechanisms for file writing

#### 5.6 Fallback and Error Recovery
- [ ] Create fallback constants in error-catalog:
  - `UNKNOWN_RULE` (binary: 0, slug: 'UNKNOWN_RULE')
  - `UNKNOWN_SEVERITY` (binary: 0, slug: 'UNKNOWN_SEVERITY')
  - `UNKNOWN_SOURCE` (binary: 0, slug: 'UNKNOWN_SOURCE')
- [ ] Add safe fallback at every point that may encounter invalid binary code
- [ ] Log warnings when using fallback values to detect bugs
- [ ] Prevent ErrorHandler crashes with try-catch and fallback logic

#### 5.7 Integration and Testing
- [ ] Add unit tests for each layer:
  - `error-normalizer.test.js` - test binary  metadata transformation
  - `error-renderer.test.js` - test output format generation
  - `error-catalog.test.js` - test catalog data integrity
- [ ] Add integration tests:
  - Test end-to-end flow: binary input  file output
  - Test fallback scenarios
  - Test concurrent error handling
- [ ] Add regression tests to prevent breaking changes

### Phase 6: Tooling & Test Automation (Not Started)
- [ ] Produce a checklist or script to validate metadata consistency across rules  validator  CLI  ErrorHandler
- [ ] Add a binary-first test plan or automated suite covering the entire pipeline
- [ ] Establish regression suites for Markdown reports and CLI output

---

## 3. Repository-Wide File Register & Status
The following checklist inventories every file in the repository, grouped by folder, to track Binary-First readiness.


### Root Level
- [x] `.gitignore`
- [ ] `cli-config.json`
- [x] `cli.js`
- [ ] `extension-wrapper.js`
- [ ] `LICENSE`
- [ ] `package.json`
- [ ] `README.md`

### `docs/`
- [ ] `docs/ARCHITECTURE_VISION.md`
- [ ] `docs/ARCHITECTURE.md`
- [ ] `docs/BINARY_MIGRATION_STATUS.md` (index file; see Thai/English editions below)
- [ ] `docs/BLANK_PAPER_ARCHITECTURE.md`
- [ ] `docs/CODE_OF_CONDUCT.md`
- [ ] `docs/COLLABORATION.md`
- [ ] `docs/COMMIT_GUIDELINES.md`
- [ ] `docs/CONTRIBUTING.md`
- [ ] `docs/GOVERNANCE.md`
- [ ] `docs/QUANTUM_BINARY_ARCHITECTURE.md`
- [ ] `docs/RELEASE_PROCESS.md`
- [ ] `docs/TOKENIZER_FLOW.md`
- [ ] `docs/ZONE_LINE_NUMBERS.md`
- [ ] `docs/ระบบการไหล-Chahuadev-Sentinel.md`
- [ ] `docs/หน้าที่ไฟล์.md`

#### `docs/architecture/`
- [ ] `docs/architecture/BASE_GRAMMAR_DELTA_ARCHITECTURE.md`

### `logs/`
- [ ] `logs/errors/file-reports/` (verify logging once ErrorHandler refactor lands)

### `src/`
- [ ] `src/extension-config.json`
- [ ] `src/extension.js`

#### `src/constants/`
- [x] `src/constants/rule-constants.js`  **Central Binary Rule Constants Hub**
- [x] `src/constants/severity-constants.js`  **Central Severity Constants Hub**

> **Important Note**: `src/constants/` is the central folder for all constants.  
> Other files **must NOT** create their own constants - they must import from `src/constants/` only.

#### `src/error-handler/`
- [ ] `src/error-handler/error-handler-config.js`
- [ ] `src/error-handler/error-log-stream.js`
- [ ] `src/error-handler/ErrorHandler.js`

#### `src/grammars/`
- [ ] `src/grammars/index.d.ts`
- [ ] `src/grammars/index.js`
- [ ] `src/grammars/docs/CHANGELOG.md`

##### `src/grammars/shared/`
- [ ] `src/grammars/shared/binary-prophet.js`
- [ ] `src/grammars/shared/binary-scout.js`
- [ ] `src/grammars/shared/constants.js`
- [ ] `src/grammars/shared/enhanced-binary-parser.js`
- [ ] `src/grammars/shared/grammar-index.js`
- [ ] `src/grammars/shared/parser-config.json`
- [ ] `src/grammars/shared/pure-binary-parser.js`
- [ ] `src/grammars/shared/tokenizer-helper.js`

###### `src/grammars/shared/configs/`
- [ ] `src/grammars/shared/configs/quantum-architecture.json`
- [ ] `src/grammars/shared/configs/unicode/unicode-identifier-ranges.json`

###### `src/grammars/shared/grammars/`
- [ ] `src/grammars/shared/grammars/java.grammar.json`
- [ ] `src/grammars/shared/grammars/javascript.grammar.json`
- [ ] `src/grammars/shared/grammars/jsx.grammar.json`
- [ ] `src/grammars/shared/grammars/typescript.grammar.json`

#### `src/rules/`
- [x] `src/rules/BINARY_AST_ONLY.js`
- [x] `src/rules/MUST_HANDLE_ERRORS.js`
- [x] `src/rules/NO_CONSOLE.js`
- [x] `src/rules/NO_EMOJI.js`
- [x] `src/rules/NO_HARDCODE.js`
- [x] `src/rules/NO_INTERNAL_CACHING.js`
- [x] `src/rules/NO_MOCKING.js`
- [x] `src/rules/NO_SILENT_FALLBACKS.js`
- [x] `src/rules/NO_STRING.js`
- [x] `src/rules/STRICT_COMMENT_STYLE.js`
- [x] `src/rules/validator.js`

> **Note**: All rules import constants from `src/constants/rule-constants.js` and `src/constants/severity-constants.js` only.  
> No local constants allowed in this folder.

#### `src/security/`
- [ ] `src/security/error-handlers.json`
- [ ] `src/security/rate-limit-store-factory.js`
- [ ] `src/security/security-config.js`
- [ ] `src/security/security-defaults.json`
- [ ] `src/security/security-manager.js`
- [ ] `src/security/security-middleware.js`
- [ ] `src/security/suspicious-patterns.json`

> Note: `[x]` marks files already migrated to the binary-first contract (subject to ongoing review). `[ ]` marks files pending migration or awaiting verification.

---

## 4. Formal TODO Register
### Immediate Actions (Week 42, 2025)
- [ ] Migrate the remaining `handleError` call sites (`src/security/security-manager.js`, `src/security/security-middleware.js`, `src/security/rate-limit-store-factory.js`, `src/grammar/shared/*.js`, `src/extension.js`) to `createSystemPayload` / `emitSecurityNotice`, validating parity via CLI smoke tests.
- [ ] Update `ErrorHandler.handleError` to accept structured payload objects only, reject legacy signatures at runtime, and document the contract in `README.md` and `docs/th หน้าที่ไฟล์.md`.
- [ ] Extend `error-dictionary.js` metadata (recommended actions, `canRetry`, `isFatal`) for Logical, File System, Security, and remaining families, then thread the data through `error-normalizer.js` outputs.
- [ ] Add Jest unit coverage for `error-emitter.js` covering severity coercion, context sanitisation, fallback error selection, and security tagging.

### Near-Term Enhancements
- [ ] Harden severity validation inside `error-normalizer.js` and `ErrorHandler.js` so string severities or unknown codes fail fast with SECURITY catalogue entries.
- [ ] Teach `error-normalizer.js` to map HTTP status codes and Node `errno` values into the new domain descriptors, logging classification telemetry where matching fails.
- [ ] Finalise transport separation by moving console helpers out of `ErrorHandler.js`, ensuring renderers receive fully normalised objects only.
- [ ] Publish operational guidance in both `docs/en/BINARY_MIGRATION_STATUS.md` and `docs/th/BINARY_MIGRATION_STATUS.md` once the helper migration is complete (update issue ledgers accordingly).

### Supporting Activities
- [ ] Implement regression tests for `error-log-stream.js` and the Markdown report writer once the transport layer refactor lands.
- [ ] Automate repository tree generation (script or CI check) to keep Appendix A synchronized with future file additions.
- [ ] Schedule a documentation review to align bilingual terminology after ErrorHandler contract changes (target Week 44, 2025).

---

## 5. Known Issues & Blockers
- **ISS-2025-10-18-01 — Legacy Callers:** Several modules still issue two-argument `handleError` calls, preventing enforcement of the structured payload contract. Track remediation progress in the bilingual issue ledgers and block the signature change until migrations are complete.
- **ISS-2025-10-18-02 — Helper Test Gap:** `error-emitter.js` lacks automated coverage. Add Jest suites before rolling the helpers across the remaining modules.
- **Schema Drift Risk:** Security catalogue entries rely on manual updates; missing metadata triggers fallback rendering. Integrate metadata completion into the TODOs above and verify before expanding regression suites.

---

## 6. Risks & Mitigations
- **ErrorHandler migration complexity:** This is the final pipeline hop; maintain backups and code reviews when refactoring.
- **Metadata divergence:** Missing slugs or severity codes will cause reports to fall back to `UNKNOWN_*`; emphasize validation tooling.
- **Large, multi-file edits:** Prefer incremental commits to simplify rollbacks and code review.

---

## 7. Appendix
- **Key Artifacts:**
  - `src/constants/rule-constants.js`
  - `src/constants/severity-constants.js`
  - `src/rules/*.js`
  - `src/rules/validator.js`
  - `cli.js`
  - `src/error-handler/ErrorHandler.js`
- **Latest Status:** `src/error-handler/ErrorHandler.js` has been reverted to its pre-refactor version; the redesign must restart under Phase 5

---
## Appendix A: Repository Tree & File Roles
```
Chahuadev-Sentinel/
├─ .git/ — Git metadata (version history, refs, hooks)
├─ .gitignore — Ignore rules for local Git operations
├─ .vscode/
│  └─ launch.json — VS Code launch configurations for debugging
├─ .vscodeignore — Exclusion list when packaging the VS Code extension
├─ cli-config.json — CLI feature flags and runtime configuration
├─ cli.js — Entry point for the Sentinel CLI tool
├─ docs/
│  ├─ en/ — English documentation set
│  │  ├─ ARCHITECTURE.md — High-level system architecture guide
│  │  ├─ ARCHITECTURE_VISION.md — Long-term architectural vision statement
│  │  ├─ BINARY_MIGRATION_ISSUES.md — English issue ledger for the binary migration
│  │  ├─ BINARY_MIGRATION_STATUS.md — English migration status (this document)
│  │  ├─ CODE_OF_CONDUCT.md — Contributor code of conduct
│  │  ├─ COLLABORATION.md — Collaboration practices and communication norms
│  │  ├─ COMMIT_GUIDELINES.md — Commit message and review policy
│  │  ├─ CONTRIBUTING.md — Contribution workflow and onboarding steps
│  │  ├─ GOVERNANCE.md — Project governance model and decision making
│  │  ├─ MIGRATION_GUIDE.md — English migration checklist and guidance
│  │  └─ RELEASE_PROCESS.md — Release preparation and deployment process
│  └─ th/ — Thai documentation set
│     ├─ ARCHITECTURE_VISION.md — วิสัยทัศน์สถาปัตยกรรม (Thai)
│     ├─ BINARY_MIGRATION_ISSUES.md — สมุดบันทึกปัญหาสำหรับการย้ายเป็นไบนารี (Thai)
│     ├─ BINARY_MIGRATION_STATUS.md — สถานะการย้ายเป็นไบนารี (Thai)
│     ├─ BLANK_PAPER_ARCHITECTURE.md — ร่างสถาปัตยกรรมฉบับกระดาษเปล่า (Thai)
│     ├─ MIGRATION_GUIDE.md — คู่มือการย้ายระบบ (Thai)
│     ├─ QUANTUM_BINARY_ARCHITECTURE.md — เอกสารสถาปัตยกรรมควอนตัม (Thai)
│     ├─ TOKENIZER_FLOW.md — ลำดับงานของตัวตัดคำ (Thai)
│     ├─ ZONE_LINE_NUMBERS.md — อ้างอิงหมายเลขบรรทัดโซน (Thai)
│     ├─ ระบบการไหล-Chahuadev-Sentinel.md — ผังการไหลของระบบ Sentinel
│     └─ หน้าที่ไฟล์.md — สรุปหน้าที่ไฟล์ในภาษาไทย
├─ extension-wrapper.js — Bridge helper for packaging the VS Code extension
├─ LICENSE — MIT license text for the repository
├─ logo.png — Project logo asset
├─ logs/
│  ├─ cli-run.txt — Transcript of the latest CLI execution
│  ├─ errors/ — Centralised error logs and per-file reports
│  │  ├─ centralized-errors.log — Aggregated error log stream
│  │  ├─ critical-errors.log — Extract of critical severity incidents
│  │  └─ file-reports/ — Markdown-style reports per source file
│  │     ├─ binary-scout.js.log — Error report for binary-scout parser helper
│  │     ├─ grammar-index.js.log — Error report for grammar index loader
│  │     ├─ index.js.log — Error report for grammar entry point
│  │     ├─ pure-binary-parser.js.log — Error report for pure binary parser
│  │     ├─ tokenizer-helper.js.log — Error report for tokenizer helper
│  │     └─ validator.js.log — Error report for validator engine
│  ├─ security.log — Security middleware activity log
│  └─ telemetry/
│     └─ telemetry.log — Telemetry notice stream
├─ package.json — Node package manifest and scripts
├─ README.md — Project overview and primary documentation hub
├─ src/ — Application and extension source code
│  ├─ constants/
│  │  ├─ rule-constants.js — Canonical rule IDs, slugs, and helpers
│  │  └─ severity-constants.js — Binary severity flags and coercion utilities
│  ├─ error-handler/
│  │  ├─ error-catalog.js — Domain/category metadata and binary error codes
│  │  ├─ error-dictionary.js — Bilingual dictionary entries for error codes
│  │  ├─ error-emitter.js — Helper functions that create structured error payloads
│  │  ├─ error-handler-config.js — Configuration constants for the handler
│  │  ├─ error-log-stream.js — File streaming utilities for error reports
│  │  ├─ error-normalizer.js — Binary-to-metadata transformation logic
│  │  ├─ error-renderer.js — Console and report rendering helpers
│  │  ├─ ErrorHandler.js — Centralised error intake class
│  │  └─ telemetry-recorder.js — Helper for routing telemetry notices
│  ├─ extension-config.json — VS Code extension configuration manifest
│  ├─ extension.js — VS Code extension activation entry point
│  ├─ grammars/
│  │  ├─ docs/
│  │  │  └─ CHANGELOG.md — Grammar package changelog
│  │  ├─ index.d.ts — Type definitions for grammar exports
│  │  ├─ index.js — Aggregated grammar utilities entry point
│  │  └─ shared/
│  │     ├─ binary-prophet.js — Heuristic predictor for grammar ambiguities
│  │     ├─ binary-scout.js — Grammar reconnaissance helper
│  │     ├─ configs/
│  │     │  ├─ quantum-architecture.json — Quantum grammar architecture spec
│  │     │  └─ unicode/
│  │     │     └─ unicode-identifier-ranges.json — Unicode identifier ranges used by the tokenizer
│  │     ├─ constants.js — Shared grammar constants and lookups
│  │     ├─ enhanced-binary-parser.js — Enhanced parser implementation
│  │     ├─ grammar-index.js — Registry and loader for grammars
│  │     ├─ grammars/
│  │     │  ├─ java.grammar.json — Java grammar definition
│  │     │  ├─ javascript.grammar.json — JavaScript grammar definition
│  │     │  ├─ jsx.grammar.json — JSX grammar definition
│  │     │  └─ typescript.grammar.json — TypeScript grammar definition
│  │     ├─ parser-config.json — Parser configuration metadata
│  │     ├─ pure-binary-parser.js — Core binary parser implementation
│  │     ├─ tokenizer-binary-config.json — Binary tokenizer configuration
│  │     └─ tokenizer-helper.js — Tokenizer orchestration helpers
│  ├─ rules/
│  │  ├─ BINARY_AST_ONLY.js — Enforces binary AST-only parsing rule
│  │  ├─ MUST_HANDLE_ERRORS.js — Rule requiring explicit error handling
│  │  ├─ NO_CONSOLE.js — Rule forbidding console usage
│  │  ├─ NO_EMOJI.js — Rule prohibiting emojis in code
│  │  ├─ NO_HARDCODE.js — Rule preventing hardcoded values
│  │  ├─ NO_INTERNAL_CACHING.js — Rule banning hidden internal caches
│  │  ├─ NO_MOCKING.js — Rule disallowing mocking in production code paths
│  │  ├─ NO_SILENT_FALLBACKS.js — Rule forbidding silent fallbacks
│  │  ├─ NO_STRING.js — Rule enforcing binary identifiers over strings
│  │  ├─ STRICT_COMMENT_STYLE.js — Rule ensuring comment style consistency
│  │  └─ validator.js — Validation engine orchestrating all rules
│  └─ security/
│     ├─ error-handlers.json — Security error handler configuration mapping
│     ├─ rate-limit-store-factory.js — Factory for rate limit storage backends
│     ├─ security-config.js — High-level security middleware configuration
│     ├─ security-defaults.json — Default security policy values
│     ├─ security-manager.js — Core security orchestration logic
│     ├─ security-middleware.js — VS Code security middleware entry point
│     └─ suspicious-patterns.json — Pattern list for intrusion detection
└─ tests/
  └─ cli-smoke.test.js — Smoke test validating CLI execution path
```
> This document tracks the Binary-First migration program. Please update this file with the current date and author when further changes are made.
