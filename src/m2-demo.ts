import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { citationFor, documentLinks, findPeople, loadStore, meetingHistory, projectDecisions, saveStore } from "./brain.ts";
import { ingestSignedWebhook, signatureFor, type WhatsAppPayload } from "./whatsapp.ts";
const root = join(dirname(fileURLToPath(import.meta.url)), ".."); const path = join(root, "m2-demo-data", "store.json"); const secret = "demo-only-secret";
const payload: WhatsAppPayload = { object: "whatsapp_business_account", entry: [{ changes: [{ value: { messages: [{ id: "wamid.demo-meeting-1", from: "15550002222", timestamp: "1795424400", type: "text", text: { body: "Meeting: Example project review\nParticipants: ExampleUser\nProject: ExampleProject\nDecision: Use a local source-backed pilot.\nhttps://example.invalid/example-project-tracker" } }] } }] }] };
const raw = JSON.stringify(payload); const store = await loadStore(path); const result = ingestSignedWebhook(store, raw, signatureFor(raw, secret), secret); await saveStore(path, store);
const person = findPeople(store, "ExampleUser")[0]; const meeting = meetingHistory(store, "ExampleUser")[0]; const decision = projectDecisions(store, "ExampleProject")[0]; const link = documentLinks(store)[0]; const source = store.sources.find(s => s.external?.externalId === "wamid.demo-meeting-1")!;
console.log(JSON.stringify({ webhook: result, person: person?.name, meeting: meeting?.name, decision: decision?.name, originalLink: link?.name, citation: citationFor(store, source.id) }, null, 2));
