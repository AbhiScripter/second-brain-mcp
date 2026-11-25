# Architecture

The stdio MCP server is the public boundary. `brain.ts` owns source persistence, revisions, locking and atomic writes; `m4_0.ts` owns approval gates; `mcp-core.ts` provides read-only retrieval; `mcp-server.ts` registers the 13 tools. Sources retain raw text, chunks retain offsets/checksums, and knowledge records retain source evidence. No external datastore, model, or provider is required.

Retrieval is lexical first: English queries expand to Hindi/Hinglish aliases, score chunk matches, and return bounded excerpts plus `[source:start-end#chunk]`. Graph relations supply related entities. Embeddings are deliberately not enabled.
