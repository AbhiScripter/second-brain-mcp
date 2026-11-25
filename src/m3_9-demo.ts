import { loadStore, saveLearningSource, saveStore } from "./brain.ts";
import { KnowledgeCore, fixedProjectStorePath } from "./mcp-core.ts";

const path = fixedProjectStorePath("m2");
const saved = await loadStore(path);
const result = saveLearningSource(saved, { approved: true, confirmation: "APPROVE_SAVE_LEARNING_SOURCE", url: "https://www.youtube.com/watch?v=RZC4x6g7Zsk", title: "M3.9 bookmark-only demo", tags: ["youtube", "bookmark"], project: "Second Brain", userNote: "Bookmark only; no transcript has been supplied.", addedAt: new Date().toISOString() });
await saveStore(path, saved);
const matches = await new KnowledgeCore({ read: async () => saved }).documentsAndLinks("RZC4x6g7Zsk");
console.log(JSON.stringify({ saved: { sourceId: result.source.id, status: result.ingestionStatus, duplicate: result.duplicate, citation: result.citation }, retrieved: matches }, null, 2));
