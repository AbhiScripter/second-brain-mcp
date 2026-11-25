import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { citationFor, documentLinks, emptyStore, findPeople, loadStore, meetingHistory, projectDecisions, saveStore } from "../src/brain.ts";
import { ingestSignedWebhook, signatureFor, verifyGet, type WhatsAppPayload } from "../src/whatsapp.ts";
const secret = "synthetic-local-secret";
const payload: WhatsAppPayload = { object: "whatsapp_business_account", entry: [{ changes: [{ value: { messages: [
  { id: "wamid.synthetic-meeting-1", from: "15550001111", timestamp: "1795424400", type: "text", text: { body: "Meeting: Example project review\nParticipants: ExampleUser, DemoPeer\nProject: ExampleProject\nDecision: Use a local source-backed pilot.\nFollow-up: ExampleUser will review the tracker.\nLogic: Preserve original evidence.\nhttps://example.invalid/example-project-tracker" } },
  { id: "wamid.synthetic-document-1", from: "15550001111", timestamp: "1795424460", type: "document", document: { id: "media.synthetic-pdf", mime_type: "application/pdf", caption: "Example project brief" } },
  { id: "wamid.synthetic-voice-1", from: "15550001111", timestamp: "1795424520", type: "audio", audio: { id: "media.synthetic-audio", mime_type: "audio/ogg" } }
] } }] }] };
const raw = JSON.stringify(payload); const store = emptyStore();
assert.deepEqual(verifyGet({ "hub.mode": "subscribe", "hub.verify_token": "token", "hub.challenge": "challenge" }, "token"), { status: 200, body: "challenge" }); assert.equal(verifyGet({}, "token").status, 403);
assert.equal(ingestSignedWebhook(store, raw, "sha256=bad", secret).status, 401); assert.equal(ingestSignedWebhook(store, "not-json", signatureFor("not-json", secret), secret).status, 400); const result = ingestSignedWebhook(store, raw, signatureFor(raw, secret), secret); assert.deepEqual({ status: result.status, accepted: result.accepted, duplicates: result.duplicates }, { status: 200, accepted: 3, duplicates: 0 });
assert.equal(ingestSignedWebhook(store, raw, signatureFor(raw, secret), secret).duplicates, 3); assert.equal(findPeople(store, "ExampleUser").length, 1); assert.equal(meetingHistory(store, "ExampleUser")[0].name, "Example project review"); assert.equal(projectDecisions(store, "ExampleProject")[0].name, "Use a local source-backed pilot."); assert.match(documentLinks(store)[0].name, /example-project-tracker/); const textSource = store.sources.find(s => s.external?.externalId === "wamid.synthetic-meeting-1")!; assert.match(citationFor(store, textSource.id)!, /external:wamid.synthetic-meeting-1/); assert.equal(store.sources.find(s => s.kind === "whatsapp_voice")!.attachments?.[0].transcriptionStatus, "not_requested");
assert.equal(textSource.occurredAt, "2026-11-23T09:00:00.000Z"); const dir = await mkdtemp(join(tmpdir(), "whatsapp-test-")); const path = join(dir, "store.json"); await saveStore(path, store); const restored = await loadStore(path); assert.equal(restored.processedEventIds.length, 3); assert.equal(restored.webhookReceipts.filter(r => r.status === "duplicate").length, 3);
console.log("PASS: GET verification, HMAC signatures, WhatsApp deduplication, persistence, graph relationships, retrieval, citations, deferred attachments");
