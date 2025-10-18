# Binary Migration Issue Ledger (EN)

**Last Updated:** 18 October 2025  
**Maintainer:** GitHub Copilot (AI Programming Assistant)

| ID | Opened | Area | Description | Impact | Next Action | Status |
| --- | --- | --- | --- | --- | --- | --- |
| ISS-2025-10-18-01 | 18 Oct 2025 | Security & Extension Callers | Multiple modules (`src/security/security-manager.js`, `src/security/security-middleware.js`, `src/security/rate-limit-store-factory.js`, grammar helpers, `src/extension.js`) still invoke `errorHandler.handleError` directly with legacy two-argument payloads. | Prevents enforcing the binary-only intake contract and keeps string severity paths alive. | Migrate each module to use `createSystemPayload` / `emitSecurityNotice`, then rerun CLI smoke tests to confirm parity. | Open |
| ISS-2025-10-18-02 | 18 Oct 2025 | Payload Helpers | `src/error-handler/error-emitter.js` lacks regression tests to guarantee severity coercion, context sanitisation, and fallback code selection. | Future edits could silently reintroduce string severities or omit mandatory fields. | Add unit tests covering helper contracts and ensure Jest/JVM suites exercise both functions with mixed inputs. | Open |
