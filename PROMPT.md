# edge-native-boilerplate — AI Agent / Maintainer Notes

This repository is a long-term backend boilerplate for **Cloudflare Workers (V8 isolates)**.

Start here:

- `backend/PROMPT.md` — operating guide and architecture
- `/.cto/STATUS.md` — what has been implemented
- `/.cto/CHECKLIST.md` — tracked checklist

## Non-negotiables

- Edge-native only (Web APIs)
- No Node.js compatibility flags
- Functional programming style (avoid classes)
- No `any`
- All request boundaries validated
- Provider-agnostic core logic where practical

## Local development

Local dev must not require Wrangler login.

```bash
bun install
bun run dev
```

This runs the backend via **Miniflare** using `backend/.dev.vars`.
