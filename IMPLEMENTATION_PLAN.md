# M1 local vertical slice

## Read-only baseline

- Existing vault inspected: only `SECOND BRAIN/Welcome.md`; it is untouched.
- Existing repository inspected: separate Python/Groq prototype; it is untouched.
- This POC is isolated here and uses only synthetic data. It has no network calls, credentials, deployment, WhatsApp, Obsidian writes, or paid services.

## Implemented

1. File-backed authoritative records: immutable source originals, typed entities, evidence-linked relations, and append-only ingest/dedup history.
2. Deterministic sample extractor for a meeting note plus spreadsheet URL; no model makes claims.
3. Content-hash duplicate detection, citation-only answer output, append-only source revision snapshots, Markdown rendering, and copy backup.
4. Tests verify source preservation, deduplication, record links, citations, restore/load, backup, and export.

## Deferred by design

Database migrations/Postgres, authentication/ACLs, secure media storage, WhatsApp webhooks, MCP/API surface, automatic extraction, two-way Obsidian reconciliation, real data ingestion, and all external APIs are later milestones requiring approval.
