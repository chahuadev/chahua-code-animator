# Workspace Usage Guide

This guide explains where the Chahua Code Animator desktop app expects your source files to live and how to switch between development and packaged builds without tripping security checks.

## Why the `workspace` folder matters

The renderer only loads files that pass security-core validation. One key rule is that files must live inside a trusted **workspace** directory. Keeping all inputs in that folder guarantees consistent paths for both the renderer and the security layer.

## Development builds (`npm start` / `electron .`)

- Default workspace: `<repo-root>/workspace`
- Recommended workflow:
  1. Copy or write the Markdown / code files you want to animate into the `workspace` folder at the project root.
  2. Use **Browse Files** or drag-and-drop from that folder into the File Selection panel.
  3. The hint inside the app will display the absolute development path so you can confirm you are in the right place.

## Packaged desktop app (zipped folder or installer)

Depending on how you distribute the build, you may see one or more workspace locations:

| Distribution | Primary workspace path |
| --- | --- |
| Portable zip / unpacked folder | `Chahua Code Animator\workspace` (next to the executable) |
| Windows installer (MSIX/NSIS) | `%LOCALAPPDATA%\Programs\Chahua Code Animator\workspace` |
| Per-user fallback | `%APPDATA%\Chahua Code Animator\workspace` (electron `userData` path) |

Tips:

- The app automatically creates the per-user workspace if the packaged directory is read-only. Use the **Open workspace folder** shortcut in the File Selection panel to jump directly to the active location.
- You can move Markdown or code samples into any detected workspace. All discovered paths are listed in the File Selection guidance so you can choose the one that suits your deployment scenario.

## Using the File Selection panel

1. Click **Open workspace folder** to open the currently active directory in Explorer/Finder.
2. Follow the bilingual quick-start steps to copy files into the correct workspace for your build.
3. Use **Browse Files** or drag-and-drop from that folder. Files outside the workspace will be rejected to prevent accidental traversal.
4. Need more detail? Click **Usage guide (EN)** or the Thai equivalent to reopen this document from within the app.

## Troubleshooting

- **"Security Error" toast when loading a file** – confirm the file extension is allowed and that the file lives inside one of the workspace paths above.
- **Workspace path feels hidden** – use the **Open workspace folder** shortcut; it always targets the active workspace for the current session.
- **Packaged build cannot write to `Program Files`** – the app falls back to the per-user `%APPDATA%` workspace automatically; copy files there instead.

Keeping your assets inside the workspace ensures predictable, safe behaviour across every version of the desktop app.