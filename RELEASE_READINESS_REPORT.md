# Release readiness — v0.5.0-alpha

## Status

Prepared locally; no commit, remote, GitHub repository, upload, or public release was created.

## Repository shape

Public candidates are `src/`, `test/`, `local-marketplace/`, `postman/specs/`, `scripts/`, `.github/workflows/ci.yml`, configuration examples, package metadata, and release documentation. `.gitignore` excludes stores, backups, exports, transcripts, milestone reports, logs, environment files, and machine-bound recovery/validation scripts.

## Privacy audit

The workspace had no prior Git repository or history. A dry-run add showed private data paths excluded. Public launcher/configuration examples use relative paths and `MCP_STORE_PATH`; no committed absolute personal path is intended. The canonical personal store was not written in this release pass. Before any first commit, run `git add -n .` and review the candidate list again.

## Verification

- `npm test`: passed through M4.2 within the command response window.
- `npm run test:m4_3`: passed in an isolated temporary store.
- `npm run test:multilingual`: passed for GraphQL, webhooks, replication, ACID, BASE, and Kafka English queries against synthetic Hindi/Hinglish evidence.
- OpenAPI syntax lint: passed.
- Generic stdio protocol validation: v0.5.0-alpha and all 13 tools against an ignored synthetic/demo store.
- Clean dependency installation: `npm ci --ignore-scripts` passed in an isolated temporary directory.

## Limitations

This alpha has deterministic lexical/alias retrieval, not semantic vector search. It does not implement live WhatsApp connectivity, audio transcription, visual intelligence, or continuous autonomous learning. ChatGPT Desktop must be refreshed separately after installation.

## License recommendation

Recommend **Apache-2.0** for explicit patent protection; no `LICENSE` file was added pending owner approval.

## Local next commands

```sh
git add -n .
git add .
git commit -m "release: prepare v0.5.0-alpha"
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
git tag -a v0.5.0-alpha -m "v0.5.0-alpha"
git push origin v0.5.0-alpha
```

Run those only after independently reviewing staged files, approving the license, and authorizing the GitHub push.
