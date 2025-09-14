# VIA – Remaining Tasks to Fully Functional

This file lists the final fixes and verifications to get a smooth, reliable end‑to‑end flow: Dribbble image inspiration → prompt → HTML snippet → live preview → saved outputs.

Required to run (manual)
- Set keys in `.env` at repo root (exact names):
  - `FIRECRAWL_API_KEY=...`
  - `OPENROUTER_API_KEY=...`
- Or store via commands in the Extension Dev Host:
  - “VIA: Set Firecrawl API Key”
  - “VIA: Set OpenRouter API Key”
- Build the extension subproject: `cd extension && npm install && npm run compile`
- Launch (F5). The dev host is already configured to load `extension/`.

Critical fixes (do these next)
- Fix “Open Results Folder” to use `globalState` instead of a non‑existent `getContext` getter.
  - Write: `writer.ts` already calls `setContext('via.lastResultsFolder', dir)`; add a parallel `context.globalState.update('via.lastResultsFolder', dir)` when saving.
  - Read: change the command handler to `context.globalState.get('via.lastResultsFolder')`.
  - Files to touch:
    - `extension/src/writer.ts` (on save, also update `globalState` via a callback or an exported helper)
    - `extension/src/extension.ts:173` (replace `getContext` call)

Quality/robustness (recommended)
- Dribbble search resilience:
  - Add a fallback when zero results: try `https://dribbble.com/shots/popular?tags=<term>` or retry with a simpler query.
  - Increase `waitFor` or add a second scrape if first HTML has no `<img>` matches.
  - File: `extension/src/firecrawl.ts:23`
- Gallery UX:
  - Add a “Refresh” button to re‑run scrape on the same query.
  - Show a small toast when 0 results are found with tips to broaden the query.
  - File: `extension/src/galleryPanel.ts:14`
- OpenRouter fallback/provider parity:
  - Implement OpenAI provider path (currently throws if selected).
  - File: `extension/src/llm.ts:52`
- Logging & settings:
  - Gate console logs behind a `via.debug` boolean setting.
  - Files: `extension/src/extension.ts:12`, `extension/src/firecrawl.ts:18`

Validation checklist
- Keys present and spelled correctly in `.env` (note it’s `FIRECRAWL_API_KEY`, with “L”).
- F5 launches the Extension Dev Host; “Hello World Preview” view is visible.
- Run “VIA: Inspire & Design (Firecrawl)”, enter a prompt (e.g., “finance dashboard”).
- Gallery shows 10–20 images; select a few and Generate.
- Sidebar updates to show the generated snippet (a single `<section>` with inline `<style>`).
- Files exist under `via_output/<timestamp>/` and VS Code opens the generated file.
- “VIA: Open Results Folder” opens the last folder after the `globalState` fix.

Packaging (when ready)
- Package the extension for distribution (optional):
  - Install vsce: `npm i -g @vscode/vsce`
  - From `extension/`: `vsce package`
  - This produces a `.vsix` you can install in VS Code.

Notes
- Engine compatibility: `extension/package.json` targets VS Code `^1.85.0`, which provides `fetch` in the extension host for the OpenRouter call.
- Compliance: Use Dribbble images as inspiration, don’t re‑host them; all links remain to the original CDN URLs.
