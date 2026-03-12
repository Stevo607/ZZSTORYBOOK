# Magic Storybook

Magic Storybook is a browser-based app that creates personalized children’s stories with:
- AI-generated multi-page story text
- Per-page illustrations
- Read-aloud narration (TTS)
- Story continuation (new chapters)

## Quick Start

1. Serve the repo with a local web server (don’t open `index.html` via `file://`).
2. Open the app in your browser.
3. Select/provide a valid Gemini API key when prompted.
4. Enter story details and generate your book.

## Repository Layout

- `index.html` — active app implementation
- `metadata.json` — app metadata
- `archive/` — legacy files retained for reference
- `README_PROD.md` — production deployment and security guide

## Production & Security

For deployment architecture, backend proxy pattern, key management, rate limiting, and hardening checklist, see:

➡️ **[README_PROD.md](./README_PROD.md)**

## Status

This project is currently optimized for prototype/demo usage in-browser. Use the production guidance before public deployment.
