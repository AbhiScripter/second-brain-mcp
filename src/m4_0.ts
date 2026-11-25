import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { type MediaMetadata, type Store, type TranscriptAcquisition, type TranscriptMethod, ingestLongFormTranscript, ingestYouTubeLearning, normalizeYouTubeUrl, saveLearningSource } from "./brain.ts";

export interface ApprovedTranscriptProvider {
  id: string;
  acquire(request: { url: string; videoId: string; approved: true }): Promise<{ transcript: string; originUrl: string; redirectChain?: string[]; contentLength?: number; rightsStatus: "authorized" }>;
}
export interface AcquisitionRequest { approved: true; confirmation: "APPROVE_TRANSCRIPT_ACQUISITION"; url: string; requestedAt: string; method: TranscriptMethod; rightsStatus: "authorized" | "not_confirmed"; originUrl?: string; providerId?: string; title?: string; }
export interface ProcessTranscriptRequest extends Omit<AcquisitionRequest, "confirmation"> { confirmation: "APPROVE_TRANSCRIPT_PROCESSING"; transcript: string; format: "txt" | "srt" | "vtt"; }
export interface ProcessTranscriptFileRequest extends Omit<AcquisitionRequest, "confirmation"> { confirmation: "APPROVE_TRANSCRIPT_FILE_PROCESSING"; filePath: string; expectedSha256: string; chunkChars?: number; overlapChars?: number; }

const originFor = (method: TranscriptMethod): MediaMetadata["transcriptOrigin"] => ({ creator_link: "creator_provided_link", authorized_youtube_captions: "authorized_caption", approved_provider: "approved_provider", uploaded_file: "uploaded_file", authorized_audio: "authorized_audio" }[method]);
const MAX_TRANSCRIPT_CHARS = 200_000;
const isPrivateHost = (host: string) => host === "localhost" || host.endsWith(".local") || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) || host === "::1";
export function assertSafeOriginUrl(value: string, allowedHosts: readonly string[] = []): void { const url = new URL(value); const host = url.hostname.toLowerCase(); if (url.protocol !== "https:" || url.username || url.password || isPrivateHost(host)) throw new Error("Origin URLs must be public HTTPS URLs without credentials."); if (allowedHosts.length && !allowedHosts.includes(host)) throw new Error("Origin host is not on the approved allow-list."); }
const upsert = (store: Store, record: TranscriptAcquisition) => { store.transcriptAcquisitions = store.transcriptAcquisitions.filter(item => item.sourceId !== record.sourceId); store.transcriptAcquisitions.push(record); return record; };

/** Explicitly registered adapters are the only automatic provider boundary. No provider ships enabled. */
export class TranscriptAcquisitionService {
  private readonly providers: Map<string, ApprovedTranscriptProvider>;
  private readonly allowedOriginHosts: readonly string[];
  constructor(providers = new Map<string, ApprovedTranscriptProvider>(), allowedOriginHosts: readonly string[] = []) { this.providers = providers; this.allowedOriginHosts = allowedOriginHosts; }
  async request(store: Store, input: AcquisitionRequest): Promise<TranscriptAcquisition> {
    if (!input.approved || input.confirmation !== "APPROVE_TRANSCRIPT_ACQUISITION") throw new Error("Explicit approval is required before transcript acquisition.");
    if (input.originUrl) assertSafeOriginUrl(input.originUrl, this.allowedOriginHosts);
    const bookmark = saveLearningSource(store, { approved: true, confirmation: "APPROVE_SAVE_LEARNING_SOURCE", url: input.url, addedAt: input.requestedAt, title: input.title });
    const videoId = normalizeYouTubeUrl(input.url)!.videoId;
    if (input.rightsStatus !== "authorized") return upsert(store, { sourceId: bookmark.source.id, videoId, state: "permission_required", method: input.method, originUrl: input.originUrl, providerId: input.providerId, rightsStatus: "permission_required", requestedAt: input.requestedAt, detail: "No authorization was supplied; no captions, media, or provider were contacted." });
    if (input.method === "approved_provider" && (!input.providerId || !this.providers.has(input.providerId))) return upsert(store, { sourceId: bookmark.source.id, videoId, state: "unavailable", method: input.method, providerId: input.providerId, rightsStatus: "authorized", requestedAt: input.requestedAt, detail: "The approved provider is not configured locally." });
    return upsert(store, { sourceId: bookmark.source.id, videoId, state: input.originUrl ? "transcript_available" : "bookmarked", method: input.method, originUrl: input.originUrl, providerId: input.providerId, rightsStatus: "authorized", requestedAt: input.requestedAt, detail: input.originUrl ? "Authorized transcript source is available; submit its content for local processing." : "Authorized source selected; submit its transcript text or an approved adapter result for processing." });
  }
  async acquireFromProvider(store: Store, input: AcquisitionRequest): Promise<TranscriptAcquisition> {
    if (input.method !== "approved_provider" || !input.providerId || input.rightsStatus !== "authorized") throw new Error("An authorized, named approved provider is required.");
    const provider = this.providers.get(input.providerId); if (!provider) throw new Error("The approved provider is not configured locally.");
    const normalized = normalizeYouTubeUrl(input.url); if (!normalized) throw new Error("A canonicalizable YouTube URL is required.");
    const result = await provider.acquire({ url: input.url, videoId: normalized.videoId, approved: true });
    if (result.rightsStatus !== "authorized" || result.transcript.length > MAX_TRANSCRIPT_CHARS) throw new Error("Provider result lacks rights authorization or exceeds the local size limit.");
    for (const url of [result.originUrl, ...(result.redirectChain ?? [])]) assertSafeOriginUrl(url, this.allowedOriginHosts);
    if (result.contentLength !== undefined && result.contentLength > MAX_TRANSCRIPT_CHARS) throw new Error("Provider result exceeds the local size limit.");
    return this.process(store, { ...input, confirmation: "APPROVE_TRANSCRIPT_PROCESSING", transcript: result.transcript, format: "txt", originUrl: result.originUrl });
  }
  process(store: Store, input: ProcessTranscriptRequest): TranscriptAcquisition {
    if (!input.approved || input.confirmation !== "APPROVE_TRANSCRIPT_PROCESSING") throw new Error("Explicit approval is required before transcript processing.");
    if (input.rightsStatus !== "authorized") throw new Error("Rights authorization is required before processing.");
    if (input.originUrl) assertSafeOriginUrl(input.originUrl, this.allowedOriginHosts);
    if (input.transcript.length > MAX_TRANSCRIPT_CHARS) throw new Error("Transcript exceeds the local size limit.");
    const normalized = normalizeYouTubeUrl(input.url); if (!normalized) throw new Error("A canonicalizable YouTube URL is required.");
    const prior = store.sources.find(source => source.external?.system === "youtube" && source.external.externalId === normalized.videoId);
    const sourceId = prior?.id ?? saveLearningSource(store, { approved: true, confirmation: "APPROVE_SAVE_LEARNING_SOURCE", url: input.url, addedAt: input.requestedAt, title: input.title }).source.id;
    upsert(store, { sourceId, videoId: normalized.videoId, state: "processing", method: input.method, originUrl: input.originUrl, providerId: input.providerId, rightsStatus: "authorized", requestedAt: input.requestedAt, detail: `Processing authorized ${input.format.toUpperCase()} transcript locally.` });
    const output = ingestYouTubeLearning(store, { approved: true, url: input.url, transcript: input.transcript, receivedAt: input.requestedAt, title: input.title, transcriptOrigin: originFor(input.method) });
    return upsert(store, { sourceId: output.source.id, videoId: normalized.videoId, state: "studied", method: input.method, originUrl: input.originUrl, providerId: input.providerId, rightsStatus: "authorized", requestedAt: input.requestedAt, processedAt: input.requestedAt, detail: `Processed ${output.record?.segments.length ?? 0} exact timestamped segments; source revision ${output.source.revision}.` });
  }
  async processFile(store: Store, input: ProcessTranscriptFileRequest): Promise<TranscriptAcquisition> {
    if (!input.approved || input.confirmation !== "APPROVE_TRANSCRIPT_FILE_PROCESSING" || input.rightsStatus !== "authorized") throw new Error("Explicit processing approval and content authorization are required.");
    const path = await realpath(input.filePath); const metadata = await stat(path); if (!metadata.isFile()) throw new Error("Transcript path must be a regular file.");
    const transcript = await readFile(path, "utf8"); const checksum = createHash("sha256").update(transcript).digest("hex");
    if (checksum !== input.expectedSha256.toLowerCase()) throw new Error("Transcript checksum mismatch; no content was processed.");
    const normalized = normalizeYouTubeUrl(input.url); if (!normalized) throw new Error("A canonicalizable YouTube URL is required.");
    const existing = store.sources.find(s => s.external?.system === "youtube" && s.external.externalId === normalized.videoId); const sourceId = existing?.id ?? saveLearningSource(store, { approved: true, confirmation: "APPROVE_SAVE_LEARNING_SOURCE", url: input.url, addedAt: input.requestedAt, title: input.title }).source.id;
    upsert(store, { sourceId, videoId: normalized.videoId, state: "processing", method: input.method, rightsStatus: "authorized", requestedAt: input.requestedAt, detail: `Processing verified local TXT in resumable chunks from ${path}.` });
    try { const output = ingestLongFormTranscript(store, { approved: true, url: input.url, transcript, receivedAt: input.requestedAt, title: input.title, transcriptOrigin: originFor(input.method), checksum, filePath: path, chunkChars: input.chunkChars, overlapChars: input.overlapChars, method: input.method }); return upsert(store, { sourceId: output.source.id, videoId: normalized.videoId, state: "studied", method: input.method, rightsStatus: "authorized", requestedAt: input.requestedAt, processedAt: input.requestedAt, detail: `Verified and processed ${output.record.chunks?.length ?? 0} chunks with complete source coverage.` }); } catch (error) { return upsert(store, { sourceId, videoId: normalized.videoId, state: "unavailable", method: input.method, rightsStatus: "authorized", requestedAt: input.requestedAt, detail: `Processing failed without marking studied: ${(error as Error).message}` }); }
  }
}
