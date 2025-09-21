## Airtable MCP — Copilot instructions (concise)

This repository implements an MCP server for Airtable with both JavaScript and TypeScript entry points. These notes orient an AI coding agent to be productive quickly and safely.

Core facts
- Entry points: `airtable_simple.js` (dev), `airtable_simple_production.js` (production), and TypeScript build output in `dist/` (see `package.json` scripts).
- Required credentials: `AIRTABLE_TOKEN` and `AIRTABLE_BASE_ID` (or CLI flags `--token` and `--base`). See `.env` loading at top of `airtable_simple.js` and `airtable_simple_production.js`.
- Default runtime: HTTP MCP server listening on port 8010 (configurable via `PORT`/`HOST` in production file).

Big-picture architecture
- Single-process Node.js MCP server exposing JSON-RPC endpoints at `/mcp` (see request handling in `airtable_simple.js`).
- Two flavors: simple/dev implementation (`airtable_simple.js`) and hardened production implementation (`airtable_simple_production.js`) — prefer changing business logic in `airtable_simple.js` when prototyping and mirror hardened changes into production file with extra validation/rate-limiting/sanitization.
- Tools & Prompts: both files declare `tools` and `prompts` schemas inline (search for `TOOLS_SCHEMA`, `PROMPTS_SCHEMA`, or the `tools` array in `airtable_simple.js`). Use these as the canonical tool definitions when adding or modifying tools.

Developer workflows & commands
- Install: `npm install` (see `package.json`).
- Run dev JS: `node airtable_simple.js --token YOUR_TOKEN --base YOUR_BASE_ID` or set `AIRTABLE_TOKEN`/`AIRTABLE_BASE_ID` in `.env`.
- Run production binary: `npm start` runs `airtable_simple_production.js` (also `npm run start:ts` for built TypeScript binary in `dist/`).
- TypeScript: `npm run build` produces `dist/`. Typecheck only: `npm run test:types`.
- Tests: JS integration tests exist (e.g., `test_v1.6.0_comprehensive.sh`, `test_mcp_comprehensive.js`). Common pattern: start the server then run the test script. See README `Testing` section for exact sequences.

Project-specific conventions
- CLI first, env fallback: prefer implementing CLI `--token`/`--base` flags; code already uses `process.env` as fallback.
- Synchronous tool schemas: tools are defined as JSON schema objects returned from `tools/list` — when adding a tool, update the tool list returned for `tools/list` and implement matching handling in `tools/call`.
- Limit batch sizes to 10 for Airtable operations (existing enforcement in `batch_*` tools). Follow same limits when adding new batch operations.
- Logging: use existing `log()` helpers and `LOG_LEVEL` env var. Production file adds `TRACE` level and structured metadata.

Integration points & external dependencies
- Airtable REST API via standard HTTPS calls — calls go to `https://api.airtable.com/v0/...` (see `callAirtableAPI` in both files).
- Optional Smithery/Claude integration: examples in `README.md` and `CLAUDE_INTEGRATION.md` show how MCP is started via `npx` and `@smithery/cli`.
- Tests may expect a live Airtable token & base. Many tests are integration tests — mock carefully or run against a dedicated test base.

When editing code — quick checklist
- Update both `airtable_simple.js` and `airtable_simple_production.js` where behavior differs (validate inputs in production file).
- Update tool/prompts schema returned in `tools/list` and `prompts/list` handlers.
- Keep batch limits and input sanitization consistent with existing helpers (see `sanitizeInput`, `validateUrl`, rate limiting in production file).
- Add or update examples in `examples/` and documentation links in `README.md`.

Where to look first (priority)
1. `airtable_simple.js` — canonical, readable implementation with request handling and tool implementations.
2. `airtable_simple_production.js` — security, rate-limiting, and production patterns.
3. `README.md` and `CLAUDE_INTEGRATION.md` — run/test instructions and integrations.
4. `package.json` — available npm scripts (`start`, `build`, `test:types`, `test:ts`).
5. `examples/` — sample configs (Claude/Smithery) and usage patterns.

Examples to copy/use
- Add a new tool "foo":
  - Add schema entry to the `tools` array returned in `tools/list` (match shape used for `list_records`).
  - Implement a `tools/call` branch that accepts `params` and calls `callAirtableAPI`.

Avoid
- Changing the MCP JSON-RPC framing or the `/mcp` endpoint shape — tests and clients expect this exact protocol.
- Increasing batch limits beyond 10 without updating all callers and tests.

If unsure, ask for clarification and point to the minimal reproducer (specific file and line range). After changes, run `npm run test:types` and the JS integration script(s) from README to verify.

Questions or gaps you should confirm with a human
- Whether a change should be prototyped in `airtable_simple.js` only or also mirrored into `airtable_simple_production.js`.
- Whether tests should run against a live Airtable test base or use mocked responses.
