import assert from "node:assert/strict";
import { emptyStore, type LearningRecord } from "../src/brain.ts";
import { KnowledgeCore } from "../src/mcp-core.ts";
const source = { id: "source_synthetic_multilingual", kind: "youtube_transcript" as const, original: "ग्राफ क्यू एल एपीआई को flexible query देता है। वेबहुक event पर callback भेजता है। रिप्लिकेशन copies रखता है। एसीआईडी consistency के लिए है। बेस eventual consistency को स्वीकार करता है। काफ्का मैसेज क्यू के लिए उपयोग होता है।", occurredAt: "2026-01-01T00:00:00.000Z", contentHash: "synthetic", revision: 1, versions: [] };
const store = emptyStore(); store.sources.push(source); const record: LearningRecord = { sourceId: source.id, ingestionStatus: "ingested_transcript", summary: [], concepts: [], examples: [], claims: [], followUpQuestions: [], segments: [{ id: "chunk_0001", text: source.original, sourceStart: 0, sourceEnd: source.original.length }] }; store.learningRecords.push(record); const core = new KnowledgeCore({ read: async () => store });
for (const query of ["GraphQL", "webhooks", "replication", "ACID", "BASE", "Kafka"]) { const result = await core.searchChunks(query, source.id); assert.equal(result.status, "ok", query); assert.match(result.data.hits[0].citation, /chunk_0001/); }
console.log("PASS: English terminology retrieves Hindi/Hinglish evidence with exact chunk citations");
