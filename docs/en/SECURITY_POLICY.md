# Security Policy

We take the security of Chahua Code Animator seriously. Thank you for helping us keep the community safe.

## Supported Versions
Security fixes target the latest main branch and tagged releases. Older versions are patched on a best-effort basis.

## Reporting a Vulnerability
- **Do not** open a public GitHub issue for security concerns.
- Email **security@chahuadev.com** (or `chahuadev@gmail.com` if the primary inbox is unavailable) with:
  - A detailed description of the vulnerability.
  - Steps to reproduce the issue.
  - Any proof-of-concept code or screenshots.
  - Suggested mitigations if you have them.
- For urgent matters, include "SECURITY" in the email subject line.

You will receive an acknowledgement within **48 hours**. We aim to provide a remediation plan or status update within **7 days**.

## Coordinated Disclosure
We request that you give us a reasonable window to investigate and release a fix before disclosing vulnerability details publicly. We will credit researchers in release notes unless you prefer to remain anonymous.

## Scope
- Core application code (`main.js`, `renderer/`, `security-core.js`).
- Build and packaging scripts (Electron Builder configuration, telemetry tooling).
- Published npm package (`@chahuadev/code-animator`).

Third-party dependencies should be reported upstream when possible. Let us know if you need help identifying the appropriate contact.

Thank you for helping us keep users and the wider community safe.