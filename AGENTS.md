# icepuma.dev

Personal portfolio website built with Astro, TypeScript, and Tailwind CSS v4, in the Stand Alone Complex register: a calm cyberbrain HUD with cyan for interaction, amber for recorded data, one cut corner, and a week dial built from real data.

## Key Files

### Components
- `src/components/Nav.astro` - Six always-visible section links
- `src/components/ThemeSwitcher.astro` - Tri-state theme button (sun / crescent / display), starts the theme scan
- `src/components/SectionHeading.astro` - Section title, tick scale, Japanese sub-label, intro
- `src/components/ExternalLink.astro` - New-tab link; `panel` adds the frame, brackets, and endpoint rings
- `src/components/WeekDial.astro` - The hero's week dial, built from the calendar collection

### Layouts
- `src/layouts/MinimalLayout.astro` - Base layout, fonts, metadata, pre-paint theme script, once-per-visit boot flag

### Utilities
- `src/utils/theme.ts` - Theme state, persistence, view transitions, theme scan line
- `src/utils/navigation.ts` - Scroll spy, back to top, header scroll state, touch attention lock
- `src/utils/schedule.ts` - Berlin weekday and clock, week angle (pure)
- `src/utils/dial.ts` - Dial geometry used at build time (pure)
- `src/utils/decode.ts` - Text decode frames and the aria-hidden decode mask
- `src/utils/hud.ts` - Today marker, minute clock and now tick, readout decode, dial tilt

### Data
- `src/content/projects/*.md` - Six projects (name, url, order)
- `src/content/stack/stack.yaml` - Seven categories, 21 tools
- `src/content/calendar/schedule.yaml` - Seven weekly entries; also drives the dial
- `src/content/socials/links.yaml` - Four social links
- `src/pages/index.astro` - The page itself, including the eight music channels

### Styling
- `src/styles/tokens.css` - Colour tokens for both themes, tagged for the contrast test
- `src/styles/global.css` - Base, layout, components, motion, and preference queries

## Commands

```bash
# Development
bun run dev

# Build (includes lint, format, typecheck)
bun run build

# Tests (run the build first; the content tests read dist/index.html)
bun test
```

## Theme System

The site uses a CSS variable-based theme system with Tailwind CSS v4:

1. **CSS Variables**: hex tokens in `tokens.css` for both grounds, plus a no-JS system copy and more-contrast overrides
2. **Theme Switching**: `data-theme` (resolved light/dark) and `data-theme-choice` (light/dark/system) on the HTML element
3. **Semantic Roles**: `background`, `surface`, `surface-hover`, `foreground`, `muted-foreground`, `primary` (interaction), `accent` (recorded data), `rule`, `rule-strong`, `ring`, `grid-mark`
4. **Palette**: two signals — cold cyan for interaction and presence, warm amber for recorded data — with no alarm red, because the page has no alert state

### Colour Usage

```css
/* Use semantic roles, never raw hex */
bg-background          /* page ground */
text-foreground        /* primary text */
text-muted-foreground  /* descriptions, intros, labels */
text-primary           /* links, current state, today */
text-accent            /* destinations, categories, days, genres, handles */
border-rule-strong     /* panel frames and chips */
```

Keep cyan and amber in their lanes: cyan is never data, amber is never an action, and every colour change comes with a shape change. See `DESIGN.md` for the full system.

## Conventions

- Use tabs for indentation
- Run `bun run build` before committing (includes linting and formatting)
- Change colour tokens only in `tokens.css`; `tests/contrast.test.ts` measures every palette
- Keep the content-test hooks (`project-row`, `stack-link`, `calendar-row`, bare `<h3>` and `<dt>`, nothing hidden inside `<nav>`)
- Utilities must not touch the DOM at import time; the tests load them into a fake `window` and `document`
- Keep components small and focused
- Prefer Astro components over framework components for static content
