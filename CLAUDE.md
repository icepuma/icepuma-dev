# icepuma.dev

Terminal-based portfolio website built with Astro, TypeScript, and Tailwind CSS.

## Key Files

- `src/components/Terminal.astro` - Main terminal UI
- `src/utils/terminal-commands.ts` - Command definitions
- `src/utils/terminal-autocomplete.ts` - TAB completion
- `src/utils/theme.ts` - Theme management
- `src/data/movies.json` - Letterboxd movie data
- `scripts/fetch-letterboxd-movies.py` - Fetch movie data

## Commands

```bash
# Development
bun run dev

# Build (includes lint, format, typecheck)
bun run build

# Testing
bun run test       # Run tests with dot reporter (non-blocking)
bun run test:ui    # Interactive test UI

# Data Updates
uv run scripts/fetch-letterboxd-movies.py
```

## Conventions

- Use tabs for indentation
- Run `bun run build` before committing
- Test new features with Playwright