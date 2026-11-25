import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { emptyStore, loadStore, saveStore, type Store } from "./brain.ts";
const root = resolve(import.meta.dirname, ".."); const destination = resolve(root, "data/example-store/store.json");
if (existsSync(destination)) throw new Error(`Refusing to overwrite example destination: ${destination}`);
const inputs = [resolve(root, "data/store.json"), resolve(root, "m2-demo-data/store.json")]; const output = emptyStore();
const addUnique = <T extends { id: string }>(target: T[], values: T[]) => { for (const value of values) if (!target.some(item => item.id === value.id)) target.push(value); };
for (const path of inputs) { const store = await loadStore(path); addUnique(output.sources, store.sources); addUnique(output.entities, store.entities); addUnique(output.relations, store.relations); addUnique(output.history, store.history); addUnique(output.webhookReceipts, store.webhookReceipts); for (const eventId of store.processedEventIds) if (!output.processedEventIds.includes(eventId)) output.processedEventIds.push(eventId); for (const learning of store.learningRecords) if (!output.learningRecords.some(item => item.sourceId === learning.sourceId)) output.learningRecords.push(learning); for (const acquisition of store.transcriptAcquisitions) if (!output.transcriptAcquisitions.some(item => item.sourceId === acquisition.sourceId)) output.transcriptAcquisitions.push(acquisition); }
await saveStore(destination, output); console.log(JSON.stringify({ destination, sources: output.sources.length, learningRecords: output.learningRecords.length, acquisitions: output.transcriptAcquisitions.length }));
