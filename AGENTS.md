# icepuma.dev

Personal portfolio website built with Astro, TypeScript, and Tailwind CSS v4, in the Stand Alone Complex register: cyan for interaction, amber for recorded data, bracketed register frames.

## Key Files

### Components
- `src/components/Nav.astro` - Six always-visible section links
- `src/components/ThemeSwitcher.astro` - Tri-state theme button (sun / crescent / display)
- `src/components/SectionHeading.astro` - Rail label and section introduction
- `src/components/ExternalLink.astro` - New-tab link with the inspected endpoint

### Layouts
- `src/layouts/MinimalLayout.astro` - Base layout, fonts, metadata, pre-paint theme script

### Utilities
- `src/utils/theme.ts` - Theme state, persistence, view transitions
- `src/utils/navigation.ts` - Scroll spy, back to top, header scroll state, register reticle state
- `src/utils/refractive-light.ts` - Hover orchestration for the inspection display
- `src/utils/refractive-renderer.ts` - WebGL2 segment-ring renderer

### Data
- `src/content/projects/*.md` - Six projects (name, url, order)
- `src/content/stack/stack.yaml` - Seven categories, 21 tools
- `src/content/calendar/schedule.yaml` - Seven weekly entries
- `src/content/socials/links.yaml` - Four social links
- `src/pages/index.astro` - The page itself, including the eight music channels

### Styling
- `src/styles/global.css` - Design tokens, register frames, all component CSS

## Commands

```bash
# Development
bun run dev

# Build (includes lint, format, typecheck)
bun run build

# Tests (run the build first; the content test reads dist/index.html)
bun test
```

## Theme System

The site uses a CSS variable-based theme system with Tailwind CSS v4:

1. **CSS Variables**: hex tokens defined in `global.css` for both grounds
2. **Theme Switching**: `data-theme` (resolved light/dark) and `data-theme-choice` (light/dark/system) on the HTML element
3. **Semantic Roles**: `background`, `surface`, `foreground`, `muted-foreground`, `primary` (interaction), `accent` (recorded data), `rule`, `rule-strong`, `ring`
4. **Palette**: the Stand Alone Complex two-signal system — cold cyan for interaction, warm amber for data — with no alarm red, because the page has no alert state

### Colour Usage

```css
/* Use semantic roles, never raw hex */
bg-background          /* page ground */
text-foreground        /* primary text */
text-muted-foreground  /* descriptions, intros, handles */
text-primary           /* links, active state, reticle */
text-accent            /* destinations, categories, days, genres */
border-rule            /* hairlines */
```

Keep cyan and amber in their lanes: cyan is never data, amber is never an action. See `DESIGN.md` for the full system.

## Conventions

- Use tabs for indentation
- Run `bun run build` before committing (includes linting and formatting)
- Measure contrast in both themes before changing any token
- Keep components small and focused
- Prefer Astro components over framework components for static content
