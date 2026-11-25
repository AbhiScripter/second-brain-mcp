# Second Brain MCP

`v0.5.0-alpha` is a local, source-backed MCP server for preserving approved learning material and retrieving exact evidence without a hosted database or paid model.

## Capabilities

- Approval-gated learning-source and transcript ingestion.
- Deterministic Hindi/English/Hinglish lexical expansion.
- Exact chunk citations and paginated source ranges.
- JSON persistence, atomic writes, locking, backups, and idempotent processing.

Implemented tools: `search_knowledge`, `get_person_timeline`, `get_meeting_context`, `get_project_decisions`, `find_documents_and_links`, `fetch_source`, `get_runtime_diagnostics`, `search_transcript_chunks`, `get_source_range`, `save_learning_source`, `request_transcript_acquisition`, `process_authorized_transcript`, and `process_authorized_transcript_file`.

## Quick start

```sh
npm ci
cp .env.example .env
export MCP_STORE_PATH=/absolute/path/to/store.json
npm test
npm run mcp
```

Use `node --experimental-strip-types src/mcp-server.ts` in a stdio MCP client. For ChatGPT Desktop or Codex, configure the same command and environment variable, then start a new conversation and call `get_runtime_diagnostics`.

## Evidence workflow

1. Save an approved source or request approved transcript acquisition.
2. Process an authorized transcript locally.
3. Use `search_transcript_chunks` with a source ID for excerpts, offsets, relevance, and pagination.
4. Use `get_source_range` to inspect any cited span.

## Architecture

`MCP client → stdio server → atomic local JSON store → source/chunk/knowledge graph`.

See [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), and [ROADMAP.md](ROADMAP.md). This alpha does not implement live WhatsApp delivery, audio transcription, visual intelligence, vector search, or autonomous continuous learning.
