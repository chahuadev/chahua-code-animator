# Chahua Code Animator *(active development – usable but not yet guaranteed 100% stable)*

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Markdown-driven presentation playback with secure file handling**

Chahua Code Animator converts status updates written in Markdown into polished slide decks or animated typing sequences. The current development sprint focuses on Presentation mode, summarising long reports into concise slides while keeping Typing mode available for code demos.

---

## Why teams use it

- **Two clear animation paths**
  - *Presentation:* Markdown → structured slides (title, agenda, progress, content blocks) with navigation HUD.
  - *Typing:* Character-by-character playback of source files with adjustable block size and speed.
- **Security-first ingestion** courtesy of `security-core.js` (path traversal guard, whitelist validation, symlink protection, rate limiting).
- **Actionable telemetry** – 40-slide benchmark deck renders in ~1.2s and now includes automatic text condensation. Settings coverage is ~70% for Presentation (tracked in the plan below).

See the active development roadmap in [`docs/en/PRESENTATION_MODE_STATUS.md`](docs/en/PRESENTATION_MODE_STATUS.md).

---

## Current status (19 Oct 2025)

| Area | Completion |
| --- | --- |
| Markdown parsing & slide generation | **100%** (title, agenda, progress, content, tooltips) |
| Presentation layout polish | **80%** (safe-frame refactor scheduled) |
| Settings panel separation | **70%** (Typing stable, Presentation refinements pending) |
| Browse Files alignment fix | in progress |

---

## Quick start

```powershell
git clone https://github.com/chahuadev/chahua-code-animator
cd chahua-code-animator
npm install
npm start
```

1. Load a Markdown status file (`docs/en/BINARY_MIGRATION_STATUS.md` works as a sample).
2. Pick **Presentation** or **Typing**. Presentation auto-summarises slides; Typing uses configurable speed/block settings.
3. Hit **Play Animation**. The Electron animation window opens with navigation controls and keyboard shortcuts.

For packaging, use `npm run build:win|mac|linux` as needed.

---

## Run from npm (CLI)

Install the animator without cloning the repo:

```powershell
# Global install (provides the `chahua-code-animator` command)
npm install -g @chahuadev/code-animator
chahua-code-animator --presentation

# One-off execution
npx @chahuadev/code-animator --presentation
```

The CLI launches the Electron app from the published package and tags telemetry as `npm-cli` for first-run metrics. Any additional arguments after the command are forwarded to the Electron process.

---

## Build installer (MSI / EXE)

Windows packaging uses Electron Builder. After running `npm install`:

```powershell
# Generate unsigned installer (.exe) and MSI bundle
npm run dist:win

# dist/ now contains commit-tagged artifacts, for example:
# ├─ Chahua Code Animator-1.0.0-win-x64-a1b2c3d.exe
# └─ Chahua Code Animator-1.0.0-win-x64-a1b2c3d.msi
```

Release checklist that runs after the command above:

1. Confirm both `.exe` and `.msi` are emitted (the build config enables NSIS `msi: true`).
2. Inspect the installer UI to verify the icon, product name, and version metadata.
3. Perform a smoke test install/uninstall on a clean Windows VM and capture screenshots/evidence.
4. Sign the artifacts with `signtool` (recommended before distribution) and re-run the smoke test.
5. Record installer size and first-run telemetry readings (see `workspace/telemetry/installer-metrics.json` and `workspace/telemetry/first-run-log.json`) in `docs/en/PRESENTATION_MODE_STATUS.md`.

> **Release gate:** Do not publish the MSI/EXE artifacts until Presentation mode and security tasks reach 100% completion per the status report.

---

## Core files

- `renderer/scripts/presentation-utils.js` – Markdown ➜ slide model builder.
- `renderer/scripts/animation.js` – Hosts `PresentationAnimation` and Typing engine.
- `renderer/scripts/main.js` – UI selector, settings sync, IPC bridge.
- `renderer/styles/animation.css` / `renderer/styles/main.css` – Presentation layout and control styling.
- `security-core.js` – Hardening checks for file ingestion.

---

## Metrics & results

- **Slides generated:** 40 verified from the current migration report.
- **Auto-condensed bullets:** Average length reduced by ~45% while tooltips preserve full text.
- **Performance:** Presentation window renders under 200 ms after model generation on a mid-tier laptop.
- **Safety:** All file loads pass traversal/symlink checks before rendering.

---

## Contributing & support

Pull requests that improve Presentation mode, safe-frame layout, or testing are welcome. Please review the [status report](docs/en/PRESENTATION_MODE_STATUS.md) before proposing changes to ensure alignment with the current plan.

- Email: chahuadev@gmail.com
- Issues: https://github.com/chahuadev/chahua-code-animator/issues

Licensed under the MIT License. See [LICENSE](LICENSE).

---

## Project policies & documents

- [Code of Conduct](docs/en/CODE_OF_CONDUCT.md)
- [Contributing Guide](docs/en/CONTRIBUTING.md)
- [Security Policy](docs/en/SECURITY_POLICY.md)
- [Support Guidelines](docs/en/SUPPORT.md)