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

### Development mode

```powershell
git clone https://github.com/chahuadev/chahua-code-animator
cd chahua-code-animator
npm install
npm start
```

1. Load a Markdown status file (e.g., `docs/en/PRESENTATION_MODE_STATUS.md`).
2. Pick **Presentation** or **Typing**:
   - *Presentation:* Auto-summarises Markdown into slides with structural headings, bullet lists, and progress indicators.
   - *Typing:* Character-by-character playback of raw source files with adjustable speed and block size.
3. Hit **Play Animation** to open the Electron playback window with navigation controls.

### Using the packaged application

After building with `npm run build:win`, the installers are located in `dist/`:

```powershell
# Install the .exe or .msi
& ".\dist\Chahua Code Animator-1.0.0-win-x64-{COMMIT_HASH}.exe"
```

Once installed, launch the app from the Start menu or desktop shortcut. The application automatically creates a `workspace/` folder on first run for storing user files.

### Keyboard shortcuts in Presentation mode

Once inside the playback window:

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> or <kbd>→</kbd> | Next slide |
| <kbd>←</kbd> or <kbd>Backspace</kbd> | Previous slide |
| <kbd>H</kbd> | Toggle info/help overlay |
| <kbd>R</kbd> | Reset to first slide |
| <kbd>Esc</kbd> | Close playback window |

### Keyboard shortcuts in Typing mode

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Play/pause animation |
| <kbd>→</kbd> | Scroll down block by block |
| <kbd>←</kbd> | Scroll up block by block |
| <kbd>R</kbd> | Reset animation |
| <kbd>Esc</kbd> | Close playback window |

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

## Build installer (MSI / EXE / Portable)

Windows packaging uses Electron Builder. After running `npm install`:

```powershell
# Generate installers (.exe NSIS, .exe Portable, .msi) with commit hash
npm run build:win

# dist/ now contains all installer formats:
# ├─ Chahua Code Animator-1.1.0-win-x64-a1b2c3d.exe (NSIS - Installer)
# ├─ Chahua Code Animator-1.1.0-win-x64-a1b2c3d.exe (Portable - Standalone)
# ├─ Chahua Code Animator-1.1.0-win-ia32-a1b2c3d.exe (NSIS - 32-bit)
# ├─ Chahua Code Animator-1.1.0-win-ia32-a1b2c3d.exe (Portable - 32-bit)
# ├─ Chahua Code Animator-1.1.0-win-x64-a1b2c3d.msi (MSI - 64-bit)
# └─ Chahua Code Animator-1.1.0-win-ia32-a1b2c3d.msi (MSI - 32-bit)
```

**Installer formats:**
- **NSIS (.exe):** Traditional Windows installer with setup wizard, registry entries, and uninstall support
- **Portable (.exe):** Standalone executable that runs without installation
- **MSI (.msi):** Windows Installer format for enterprise deployment and Group Policy integration

**Release checklist:**

1. ✅ Confirm all installer formats are generated (NSIS, Portable, MSI for x64 and ia32)
2. ✅ Inspect installer UIs (icons, product names, versions)
3. ✅ Smoke test: install/uninstall/run on clean Windows VMs (test at least x64 version)
4. ✅ Verify NSIS creates Start Menu shortcuts and desktop shortcuts
5. ✅ Verify MSI integrates with Windows Add/Remove Programs
6. ✅ (Optional) Sign artifacts with `signtool` and re-test
7. ✅ Record metrics in `workspace/telemetry/installer-metrics.json`

> **Note:** The `workspace/` folder is created automatically on first app launch. Ensure it exists in the installation directory for telemetry and user data storage.

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

**English (EN):**
- [Code of Conduct](docs/en/CODE_OF_CONDUCT.md)
- [Contributing Guide](docs/en/CONTRIBUTING.md)
- [Security Policy](docs/en/SECURITY_POLICY.md)
- [Support Guidelines](docs/en/SUPPORT.md)

**Thai (ไทย):**
- [Code of Conduct](docs/th/CODE_OF_CONDUCT.md)
- [Contributing Guide](docs/th/CONTRIBUTING.md)
- [Security Policy](docs/th/SECURITY_POLICY.md)
- [Support Guidelines](docs/th/SUPPORT.md)