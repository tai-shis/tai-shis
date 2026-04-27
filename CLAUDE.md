# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite exists.

## Stack

- **Next.js 16.2.4** (App Router) — this is a cutting-edge version; check `node_modules/next/dist/docs/` before using APIs you haven't verified
- **React 19.2.4** with TypeScript
- **Tailwind CSS v4** — configuration lives in `globals.css` via `@theme inline`, not `tailwind.config.js`; import syntax is `@import "tailwindcss"` not the v3 directives

## Architecture

Personal portfolio site. All source lives under `app/`.

**Layout shell** (`app/layout.tsx`): Loads 5 fonts (Geist Sans, Geist Mono, Space Mono, GitSans, AberMono), wraps every page in a centered `max-w-3xl` column with `<Nav>` on top and `<Footer>` on bottom.

**Design language**: TUI (terminal UI) aesthetic. Everything is built from `Panel` — a bordered card with a floating label in the top-left border. The `.tui-panel` CSS class defines the base; `Panel` applies it plus hover state that shifts the border to `border-accent` (purple). Use `Panel` for any new content sections.

**CSS variables** (defined in `globals.css`, exposed to Tailwind via `@theme inline`):
- `background`, `foreground`, `border`, `border-accent`, `border-subtle`, `muted`, `surface`
- Use these via Tailwind classes like `text-muted`, `border-border-accent`, `bg-surface`

**Components**:
- `panel.tsx` — base UI primitive, takes `name` (the floating label) and `className`
- `me.tsx` — ASCII figlet banner + bio chips; fetches figlet font from unpkg at runtime; cycles random verbs via `AnimatedVerb`
- `animated-verb.tsx` — typewriter → scan → idle animation state machine
- `copy-email.tsx` — clipboard copy with CSS sparkle burst animation (`.sparkle` class in globals.css)
- `footer.tsx` — server component; reads `VERCEL_GIT_COMMIT_SHA` in prod, falls back to `execSync git rev-parse HEAD` locally
- `nav.tsx` — client component (uses `usePathname`); routes defined in a local array

**Pages**: `/projects`, `/resume`, `/hobbies` are stubs — their `page.tsx` files exist but render empty `<main>` elements.

## Deployment

Deployed on Vercel. `VERCEL_GIT_COMMIT_SHA` env var is set automatically in that environment and used by the footer.
