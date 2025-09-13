### Implementation Status — VIA (Firecrawl-only v1)

Last updated: 2025-09-13

Legend: ✅ Done · 🚧 In Progress · ⏳ Not Started · ⛔ Deferred

---

### Overview
- **Scope**: Firecrawl-only inspiration flow for Dribbble pages (no Dribbble API). Storage starts local; optional Supabase later via adapter swap.
- **Current codebase**: Baseline VS Code extension with a simple webview (`HelloWorldProvider`) and inline completion stub. No Firecrawl/LLM/storage wiring yet.

---

### Status by area

#### Foundation
- ✅ Repo cloned into local workspace
- ✅ Codebase audit completed (structure, build, debug)
- ✅ Detailed Firecrawl-only implementation plan authored
- ✅ Build/compile tooling present (`tsc`, launch config)
- ⏳ Replace/augment baseline webview with VIA gallery/results views

#### Configuration & Settings
- ✅ Add `package.json` contributes.configuration keys (e.g., `via.storage`, `via.firecrawlApiKey`, `via.llm.*`, optional Supabase keys)
- ✅ Wire `vscode.SecretStorage` commands for API keys (Firecrawl, LLM)
- ✅ OpenRouter key command; `.env` support via environment variables (OPENROUTER_API_KEY)
- ✅ `.env` loaded on activation; keys hydrated to SecretStorage if missing

#### Storage Layer
- ✅ `src/storage.ts` (StorageAdapter interface: projects, inspirations, generations)
- ✅ `src/storage.local.ts` (Local adapter: `.via/history.json` + memento)
- ⛔ `src/storage.supabase.ts` (Supabase adapter + SQL + RLS) — deferred until sync/share is needed

#### Firecrawl Integration
- ✅ `src/firecrawl.ts` client helper + `getShots(apiKey, query)` + page resolution
- ✅ Types shim added for SDK (`src/types/firecrawl-js.d.ts`)
- ✅ In-memory caching (10m TTL) + exponential backoff + gentle throttle

#### Gallery Webview (Selection UI)
- ✅ Gallery panel provider and HTML/CSS grid (checkbox select, open in browser)
- ✅ Message passing (generate)
- ⏳ Pagination & search refinements
- ✅ CSP tightened (no remote JS; allow https images)
- ✅ ToS notice inline beneath toolbar

#### LLM Integration (Multimodal)
- ✅ Minimal provider hookup (OpenAI) + settings (`via.llm.model`)
- ✅ Request assembly (text + up to ~6 image URLs)
- ⏳ Output parsing (style guide JSON + React+Tailwind code) — basic fenced block extraction implemented
- ✅ System prompt updated to instruct sequential tool usage (Firecrawl search→scrape already executed by host)
- ✅ OpenRouter provider supported (default), model `z-ai/glm-4.5-air:free`, key via SecretStorage or `OPENROUTER_API_KEY`

#### Writing Outputs
- ✅ Writer to create `via_output/<timestamp>/` with:
  - `STYLE_GUIDE.md`, `style-guide.json`
  - `code/` (Tailwind config, components)
- ✅ Open main files in new editor tabs; ⏳ “Copy to workspace” action
- ✅ Remember last results folder; command to open it

#### Compliance & UX Safeguards
- ⏳ Display ToS reminder (inspiration-only, no redistribution)
- ⏳ Respect robots/copyright; gentle scraping; throttle
- ⏳ Attribution links to shot and author in results view

#### History & Optional Views
- ⏳ (Optional) History tree: projects → generations → open
- ⛔ (Optional) One-shot “Sync local → Supabase” command — deferred

#### Testing
- ⏳ Unit tests: storage adapters, Firecrawl service (mock), LLM parser
- ⏳ Manual QA checklist (happy path, empty results, rate-limit, offline)

---

### What’s done (details)
- Repo setup and audit: `package.json`, `tsconfig.json`, `.vscode/launch.json`, `src/extension.ts`, `src/helloWorldProvider.ts` verified
- End-to-end plan documented (Firecrawl search → selection → LLM → outputs → storage)
- Config keys added; commands registered (`via.inspireAndDesign`, `via.openResultsFolder`)
- Local storage adapter, Firecrawl integration, gallery panel, LLM call, writer skeleton implemented

### What’s in progress
- SecretStorage for keys; pagination and error handling; compliance messaging; output parsing improvements
  - SecretStorage commands done; remaining: error handling/backoff; parser improvements

### What’s not started
- All concrete Firecrawl, LLM, storage, gallery, writer, compliance, and testing implementations listed above

---

### Risks / Blockers
- Firecrawl and LLM API keys must be provided (settings + SecretStorage)
- Dribbble ToS/copyright sensitivities — follow inspiration-only use; avoid re-hosting

---

### Immediate next steps
1) Add attribution in results view/output
2) Improve parser to persist tokens separately
3) Optional: add "Copy to workspace" action


