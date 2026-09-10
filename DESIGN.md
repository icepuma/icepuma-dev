---
name: "icepuma.dev"
description: "A minimal, project-first personal homepage in the Stand Alone Complex register."
colors:
  light-background: "#edf1f0"
  light-surface: "#e1e6e4"
  light-foreground: "#11181a"
  light-muted-foreground: "#4f5d5b"
  light-primary: "#0a6376"
  light-accent: "#8a5a10"
  light-rule: "#c7cfcd"
  light-rule-strong: "#98a3a1"
  dark-background: "#070d0f"
  dark-surface: "#0f191c"
  dark-foreground: "#dbe7e8"
  dark-muted-foreground: "#8fa3a6"
  dark-primary: "#5ad2e6"
  dark-accent: "#e8a94f"
  dark-rule: "#1b272a"
  dark-rule-strong: "#324146"
typography:
  display:
    fontFamily: "IBM Plex Sans Condensed, IBM Plex Sans, sans-serif"
    fontSize: "clamp(2.25rem, 5.6vw, 4.75rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "IBM Plex Sans Condensed, IBM Plex Sans, sans-serif"
    fontSize: "clamp(1.25rem, 2.2vw, 1.75rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  music-title:
    fontFamily: "IBM Plex Sans Condensed, IBM Plex Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  bio:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(1.125rem, 1.7vw, 1.375rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.01em"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  description:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  metadata:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  caption:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
  brand:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
  navigation:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
  calendar-label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.02em"
spacing:
  control-min: "44px"
  page-gutter: "3rem"
  page-gutter-compact: "2.5rem"
  section-gap: "1.5rem"
  section-block-min: "2.5rem"
  section-block-max: "4.5rem"
  desktop-rail: "11rem"
  desktop-column-gap: "3rem"
  register-bracket: "10px"
  control-mark: "7px"
  step-micro: "0.125rem"
  step-xs: "0.25rem"
  step-sm: "0.5rem"
  step-md: "0.75rem"
  step-lg: "1.5rem"
components:
  control:
    textColor: "var(--muted-foreground)"
    size: "{spacing.control-min}"
  control-active:
    backgroundColor: "var(--surface)"
    textColor: "var(--primary)"
    size: "{spacing.control-min}"
  theme-group:
    backgroundColor: "var(--surface)"
    padding: "2px"
  theme-selected:
    backgroundColor: "var(--background)"
    textColor: "var(--primary)"
    size: "{spacing.control-min}"
  register-frame:
    textColor: "var(--primary)"
    size: "{spacing.register-bracket}"
  project-row:
    textColor: "var(--foreground)"
    padding: "1.25rem 0.75rem"
  destination:
    textColor: "var(--accent)"
---

# Design System: icepuma.dev

## Overview

A minimal homepage in the **Stand Alone Complex** register: an instrument panel for one person's work, not a terminal and not a tribute. The page reads as a disciplined public-security tool — every register bracketed, every value measured, nothing decorative — and the world lives in the palette, the geometry, and the state, never in invented lore or borrowed art.

The colour system carries two signals with fixed meanings: **cold cyan is interaction**, **warm amber is recorded data**. Red is deliberately absent: in the franchise red is an alarm, and this page has no alarm state, so the token was left out rather than spent as decoration. The light theme is the sterile institutional daylight of a government office; the dark theme is the green-cast night city, lit by amber interiors and cyan screens.

Every section is a **register**, and the register the reader is in acquires a bracket reticle while the others stay unframed. Nothing on the page animates on its own: every movement is a response to the reader.

**Key characteristics:** two-signal palette, no alarm red; ruled registers with a moving reticle; condensed display against a humanist body and a monospace data layer; flat, sharp, and free of shadows, cards, and invented content.

## Colors

Two grounds (institutional daylight, night city) and two signals, all in `src/styles/global.css`. `--ring` matches `--primary` and `--primary-foreground` matches the page background.

### Primary

- **Instrument Cyan** (#0a6376 light / #5ad2e6 dark): links, focus rings, the active section label, the register reticle, and the WebGL inspection rings. Interaction and live state only.

### Secondary

- **Register Amber** (#8a5a10 light / #e8a94f dark): recorded data and classification — project destinations, stack categories, calendar days, music genres. Never used for an action, so the page keeps exactly one action colour.

### Neutral

- **Institutional White** (#edf1f0) and **Studio Night** (#070d0f): the two grounds; the light ground is a cool grey-white and the dark ground is a green-cast near-black, never a blue-black slate.
- **Surface** (#e1e6e4 / #0f191c): hover tint, theme bank, and the active navigation chip.
- **Graphite** (#11181a / #dbe7e8): primary text.
- **Steel** (#4f5d5b / #8fa3a6): descriptions, introductions, handles, footer.
- **Rule** (#c7cfcd / #1b272a) and **Rule Strong** (#98a3a1 / #324146): hairlines and control edges.

### Named Rules

**The Two-Signal Rule.** Cyan means "you can act or you are here"; amber means "this is recorded data". Neither ever takes the other's job.

**The No-Alarm Rule.** No red is defined, because the page has no alert state. A future surface that gains one adds the token then.

## Typography

**Display Font:** IBM Plex Sans Condensed (with IBM Plex Sans fallback)
**Body Font:** IBM Plex Sans
**Label/Mono Font:** JetBrains Mono

**Character:** Condensed caps give names the compression of a title card; a humanist sans carries prose; a monospace carries data. The three roles never swap.

### Hierarchy

- **Display** (600, clamp(2.25rem, 5.6vw, 4.75rem), 1.02): the identity name only, uppercase, tracking -0.01em — condensed faces need less negative tracking than the Plex Sans default.
- **Headline** (600, clamp(1.25rem, 2.2vw, 1.75rem), 1.25): project names.
- **Music title** (600, 1.125rem, 1.4): playlist titles.
- **Bio** (400, clamp(1.125rem, 1.7vw, 1.375rem), 1.6): the About paragraph at 58ch.
- **Body** (400, 1rem, 1.6): prose; descriptions use 0.9375rem at 58ch (projects) and 65ch (music).
- **Label** (400, 0.6875–0.75rem, 0.08em, uppercase): navigation, section labels, categories, days, genres, footer — all JetBrains Mono, all sharing one tracking value.

### Named Rules

**The Mono-Is-Data Rule.** Monospace marks anything that is measured, addressed, or classified. Section labels are instrument labels; prose is never set in mono.

**The Two-Tracking Rule.** The whole page uses two letter-spacing values: -0.01em for display and titles, 0.08em for uppercase mono labels. Nothing invents a third.

**The Type Scale Rule.** Six small steps (11, 12, 13, 14, 15, 16px) carry every label and paragraph, and three fluid clamps carry the display, project titles, and the bio. No other sizes exist; the 18px playlist title is the last fixed step of the ramp. Four line-heights cover the page: 1.02 display, 1.25 titles, 1.4 small titles, 1.6 everything textual.

## Layout

The page is at most 1120px wide with 24px side gutters, 20px at 560px and below. Every section link is visible at all times. Below 768px section labels sit above content; at 768px and above the page uses an 11rem label rail with a 3rem column gap and sticky labels. The header is sticky at every width, one row at 1024px and above, with a ResizeObserver publishing its measured height as `--header-height`.

Projects run as a **register line**: below 768px the copy stacks and the real destination sits under the description; at 768px and above the row is three columns — copy, the destination in its own 12rem column, and the inspected endpoint. Music uses two columns at 896px and above, Calendar becomes a seven-cell strip at the same width, and Stack and Social use two columns at 768px.

### Named Rules

**The Register Rule.** A section is a register: a rail label, content, and — while it is being read — a bracket reticle. No other container is introduced.

**The Spacing Scale Rule.** Every gap, padding, and margin comes from one scale: 0.125, 0.25, 0.375, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, and 3rem, plus the section block clamp. Related text pairs sit 0.5rem apart (title to description), label-to-content pairs 0.75rem, and list rows all share one rhythm: 1.25rem of block padding at rest and 1.5rem on desktop for the two content rows.

## Elevation & Depth

There are no shadows. Depth comes from ground, rule, and state: the two grounds, the hairline rules, the sticky header's separate layer (94% fill, 16px backdrop blur, opaque fallback and a no-blur path for reduced transparency and forced colors), and the reticle. Rows are flat at rest and take a surface tint only on hover or keyboard focus.

### Motion

Motion is a state language, not decoration, and it is deliberately quiet. Two easings carry everything: `--motion-ease` (out-quint, `cubic-bezier(0.22, 1, 0.36, 1)`) for feedback and state, and `--motion-acquire` (out-expo, `cubic-bezier(0.16, 1, 0.3, 1)`) for acquisition. Acquisition runs 180ms, feedback and release 120–180ms, presses 80ms. Only transform, opacity, and state colours animate, and every animation is removed under reduced motion.

**The Acquire-Release Rule.** Anything that arrives (reticle, label hairline, theme palette) uses out-expo and the longer duration; anything that leaves uses out-quint at roughly three-fifths of it.

**The No Ambient Motion Rule.** Nothing animates without the reader. There is no load animation, no scroll-reveal, and no loop; every movement answers a scroll, hover, focus, press, or theme choice, and no element animates twice for the same reason.

### Named Rules

**The Flat Register Rule.** If something needs separating, it gets a rule, a ground change, or space — never elevation.

## Shapes

Everything is square. Controls keep two 7px corner marks that align on hover, focus, press, or selection. Registers use four 10px L-brackets drawn as eight gradient bars on one pseudo-element, so the frame costs no markup and never touches the text. The only circles are the round arrow endpoints and the WebGL inspection rings.

### Named Rules

**The Reticle Rule.** Only the register being read is bracketed. The top pair of brackets lands, the bottom pair follows 50ms later, and release is faster than acquire.

## Components

- **Navigation** — six direct section links, no numbers and no collapsed menu. The current link carries `aria-current="location"` and a surface chip. The matching section label turns cyan and its register acquires the reticle. Hover underlines; focus stays visible.
- **Theme control** — one tri-state button: each press advances Light → Dark → System and back. The glyph for the current mode (sun, crescent, display) is shown while the other two sit stacked behind it, crossfading over 180ms, so the button never changes size and the correct glyph is already painted before first paint. It is a 44×44 control, flat at rest and cyan with the shared corner marks on hover, focus, or press. Its accessible name carries both state and action — "Color theme: System. Switch to Light theme." — and a polite live region speaks only after a press, never on load. System is the default; saved choices survive reloads and blocked storage. Explicit changes crossfade for 180ms through a native view transition when the resolved palette changes; startup and reduced motion are immediate.
- **Register reticle** — four 10px cyan L-brackets, drawn as gradient bars on two pseudo-elements at the section frame. At rest each pair sits 2px outside its edge at opacity 0; while `[data-current]` is set, the top pair settles in over 180ms out-expo and the bottom pair follows 40ms later, and release takes 120ms out-quint. Nothing is drawn below 768px.
- **Label lock-on** — the active register's rail label turns cyan and a 1px hairline draws from the left beneath it, 180ms in and 120ms out.
- **Theme change** — a 180ms crossfade of the two palettes, and nothing more. Startup, reduced motion, and unsupported browsers switch instantly.
- **Header hairline** — once the page has scrolled past 8px a 1px rule fades in at the header's bottom edge over 180ms, confirming the header is floating over content.
- **Control feedback** — shared controls have 44px minimum targets, a 2px focus ring at 4px offset, corner marks that align on hover, focus, press, or selection, a 3px arrow shift (inspection arrows stay centred), and a 1px press translation over 80ms. Control transitions are owned by `.control` alone at 180ms.
- **Icon set** — every icon is an authored SVG path on a 20-unit grid at 1.5px stroke with round caps and joins, drawn in `currentColor`: the external arrow (16px), the theme sun, crescent, and display (20px), and the back-to-top arrow. No glyphs, emoji, or icon fonts are ever used, and an icon never carries meaning the accessible name does not.
- **Inspection endpoint** — Projects, Music, and Social reserve a surface around the external arrow. On fine-pointer hover one shared WebGL2 canvas draws segmented rings with a 0.7-second acquisition sweep, pointer tilt, and a 0.55-second press pulse; the alpha cap is 0.78 in both themes, DPR is capped at 1.5, the backing buffer at 1536 × 512. The canvas sits behind the arrow, never overlaps copy, and is replaced by static SVG rings for keyboard focus, touch, reduced motion or transparency, forced colors, and unavailable or lost WebGL2. Scroll, blur, hidden pages, and theme changes clear it.
- **Project register line** — the destination is the project's real hostname and path, printed in amber in its own column; no invented labels or numbers.
- **Stack, Calendar, Social** — 21 verified tool links with visible arrows and 44px targets; a seven-cell week strip whose links omit arrows and keep a 72px minimum height; a four-row contact sheet. All entries keep their data order.
- **Without JavaScript** — every section link, project, tool, day, channel, and contact stays visible; theme controls stay hidden; the register reticle simply does not run; CSS follows the system colour preference.
- **Reduced motion** — transforms, transitions, view animations, smooth scrolling, and every canvas path are removed. **Forced colors** outlines selected controls and keeps the sticky header opaque.

## Do's and Don'ts

### Do:

- **Do** keep every control at a 44px minimum target and every action on cyan.
- **Do** keep recorded data on amber: destinations, categories, days, genres.
- **Do** let the reticle follow the reader and nothing else carry it.
- **Do** keep copy, URLs, collection order, section anchors, and the single static page unchanged.
- **Do** measure contrast in both themes before shipping any token change.
- **Do** honour reduced motion, forced colors, reduced transparency, more-contrast preference, and no-JavaScript reading.
- **Do** keep motion to transform, opacity, and state colour, and give every arrival a faster exit.
- **Do** keep the page free of ambient animation: if the reader did nothing, nothing should move.

### Don't:

- **Don't** add cards, radii, shadows, gradients-as-decoration, or a second framing device.
- **Don't** use cyan for data or amber for actions.
- **Don't** add alarm red until the page has a real alert state.
- **Don't** reproduce franchise art, marks, on-screen text, or character references, and don't invent case numbers, timestamps, or other fictional data.
- **Don't** drift the grounds toward blue-black slate (dark) or warm cream (light), and don't set prose in mono.
