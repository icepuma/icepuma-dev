# icepuma.dev

Personal portfolio website built with Astro, TypeScript, and Tailwind CSS v4, in the Braun register: warm grey paper, printed panels, one signal orange and one green pilot lamp, and a single receiver in the hero whose tuning scale is the real weekly schedule and whose knob switches the theme.

## Key Files

### Components
- `src/components/Nav.astro` - Six round section buttons with lowercase legends; the current section's button lights
- `src/components/Receiver.astro` - The hero object: scale window, Berlin display, today's station, grille, knob
- `src/components/TuningScale.astro` - The week as a waveband, built from the calendar collection
- `src/components/ThemeKnob.astro` - Three-radio selector drawn as a hyper-realistic knob; saved choice checked while parsing
- `src/components/SectionHeading.astro` - Pilot lamp, title, German sub-label, intro
- `src/components/ExternalLink.astro` - Link off the site, same tab; `panel` adds the corner arrow that swaps on hover

### Layouts
- `src/layouts/MinimalLayout.astro` - Base layout, font, metadata, pre-paint theme script, once-per-visit boot flag

### Utilities
- `src/utils/theme.ts` - Theme state, persistence, view transitions, the reveal from the knob
- `src/utils/knob.ts` - Knob detents and drag physics (pure), and the selector's pointer controller
- `src/utils/receiver.ts` - Today marker, minute clock, needle, display digits, scale tuning
- `src/utils/scale.ts` - Tuning scale geometry and stations, used at build time (pure)
- `src/utils/lcd.ts` - Seven-segment geometry and digits (pure)
- `src/utils/schedule.ts` - Berlin weekday and clock, week fraction (pure)
- `src/utils/navigation.ts` - Scroll spy, back to top, header scroll state

### Data
- `src/content/projects/*.md` - Six projects (name, url, order)
- `src/content/stack/stack.yaml` - Seven categories, 21 tools
- `src/content/calendar/schedule.yaml` - Seven weekly entries; also drives the tuning scale
- `src/content/socials/links.yaml` - Four social links
- `src/pages/index.astro` - The page itself, including the eight music channels

### Styling
- `src/styles/tokens.css` - Colour and material tokens for both themes, tagged for the contrast test
- `src/styles/global.css` - Base, layout, components, the knob, motion, and preference queries

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

1. **CSS Variables**: hex tokens in `tokens.css` for both grounds, plus a no-JS system copy and more-contrast overrides; key, metal, and shadow material tokens are not measured
2. **Theme Switching**: `data-theme` (resolved light/dark) and `data-theme-choice` (light/dark/system) on the HTML element; the knob's radios follow `data-theme-choice`
3. **Semantic Roles**: `background`, `surface`, `surface-hover`, `foreground`, `muted-foreground`, `primary` (orange text for hover and focus), `signal` (orange marks and fills), `lamp` (green pilot lamps), `rule`, `rule-strong`, `ring`, `window` (the scale's glass), `lcd`
4. **Palette**: one signal orange for now and for action, one green lamp for "on", and everything else in black and grey print

### Colour Usage

```css
/* Use semantic roles, never raw hex */
bg-background          /* page ground */
text-foreground        /* print */
text-muted-foreground  /* grey print: intros, labels, and all recorded data */
text-primary           /* orange text, on hover and focus only */
var(--signal)          /* the needle, the knob's indicator, a panel's lit arrow, the Today tag */
var(--lamp)            /* pilot lamps: the current section, today */
```

Keep orange for now and for action and green for lamps; data is grey print, never a hue. Every colour change comes with a shape change. See `DESIGN.md` for the full system.

## Conventions

- Use tabs for indentation
- Run `bun run build` before committing (includes linting and formatting)
- Change colour tokens only in `tokens.css`; `tests/contrast.test.ts` measures every palette
- Keep the content-test hooks (`project-row`, `stack-link`, `calendar-row`, `data-scale`, `data-lcd`, `data-theme-knob`, `data-live-*`, bare `<h3>` and `<dt>`, nothing hidden inside `<nav>`)
- Utilities must not touch the DOM at import time; the tests load them into a fake `window` and `document`
- Keep the knob's radios as the source of truth; the drawn knob only turns them
- Never reproduce Braun marks, product names, or model numbers; the site is inspired by the design language
- Keep components small and focused
- Prefer Astro components over framework components for static content
