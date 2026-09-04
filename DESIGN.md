---
name: "icepuma.dev"
description: "A minimal, project-first personal homepage."
colors:
  light-background: "#f2f5f8"
  light-surface: "#e5edf5"
  light-foreground: "#182b40"
  light-muted-foreground: "#52667b"
  light-primary: "#005f80"
  dark-background: "#0b121b"
  dark-surface: "#142332"
  dark-foreground: "#e3ecf5"
  dark-muted-foreground: "#9baec2"
  dark-primary: "#8bdcff"
typography:
  display:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(2rem, 5.2vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(1.25rem, 2.2vw, 1.75rem)"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  bio:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(1.125rem, 1.7vw, 1.375rem)"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.01em"
  music-title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.45
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
  compact-brand:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.02em"
  compact-theme-label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.625rem"
    fontWeight: 400
spacing:
  control-min: "44px"
  page-gutter: "3rem"
  page-gutter-compact: "2.5rem"
  section-gap: "1.75rem"
  section-block-min: "2.5rem"
  section-block-max: "4.5rem"
  desktop-rail: "11rem"
  desktop-column-gap: "3rem"
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
  project-row:
    textColor: "var(--foreground)"
    padding: "1.25rem 0.75rem"
---

# Design System: icepuma.dev

## Overview

A minimal homepage inspired by Stand Alone Complex. Always-visible section links identify the current section without a sliding indicator. Unnumbered content, large uppercase identity type, and bright cyan control marks carry the visual identity. The brand is plain text; there are no custom logos or decorative illustrations.

## Colors

Use the semantic variables in `src/styles/global.css`. The frontmatter records both palettes. `--ring` matches `--primary`; `--primary-foreground` matches the page background. Use the surface color to group theme controls and to show hover, focus, and press states. The selected theme uses the page background inside the group.

## Typography

IBM Plex Sans supplies headings and body text through the Astro Fonts API. The built site serves the font locally. JetBrains Mono supplies navigation, section labels, genres, theme controls, and footer text through the existing Fontsource package.

The uppercase identity name scales from 32px to 72px. Project names scale from 20px to 28px. Row descriptions use 15px text; projects have a 58ch maximum width and music has a 65ch maximum width. The bio uses 18–22px text with a 58ch maximum width. Section headings use 13px uppercase JetBrains Mono at weight 500 with 0.08em tracking.

Supporting text uses the 16px body step for identity metadata, 14px for social handles, 13px for section introductions and the brand, and 12px for navigation and calendar days. At 560px and below, the brand uses 12px, social handles use 13px, and theme labels use 10px. These smaller labels retain the shared 44px control targets. Music titles use 18px.

## Layout

The page is at most 1120px wide, with 24px side gutters. At 560px and below, use 20px gutters and two rows of three navigation links. Above 560px, the six links share a row. Every section link is visible without opening a menu.

Below 768px, section labels sit above content. At 768px, use an 11rem label rail, a 3rem column gap, sticky section labels, a two-column stack list, and a two-column social list. Stack categories remain semantic definition-list terms with wrapped tool lists. The header remains sticky at every width. It uses one row at 1024px and above; smaller layouts place navigation below the brand and theme controls. A ResizeObserver keeps the scroll padding aligned with the actual header height; CSS supplies a no-script fallback. Section anchor offsets keep headings below it.

Use content-sized sections, a 1.75rem internal gap, and vertical padding from 2.5rem to 4.5rem. The identity block uses 2–3rem above and 1–1.5rem below to bring Projects closer. At 896px and above, Calendar is a seven-column week strip and Music is a two-column list. Below that width, both use a single reading column. Keep all entries in their data order.

## Elevation & Depth

Use spacing and typography to separate sections and entries. The sticky header uses a separate background layer with a 94% fill and 16px backdrop blur so navigation stays clear as content passes behind it. Use an opaque fallback without blur support, with reduced transparency, or in forced-colors mode. Rows remain flat at rest; their surface tint fades in on hover and keyboard focus. The design has no separator lines or shadows.

## Shapes

Controls have sharp corners. Their two 7px corner marks use 1px blue borders and align with the control edge on hover, focus, press, or selection.

## Research interpretation

The endpoint inspection is an original interaction treatment. It does not reproduce art, characters, symbols, or text from the franchise. It takes only three interaction cues: localized information density, a bounded display that responds to a nearby point, and a brief acquisition pass.

[Mamoru Oshii's official interview](https://theghostintheshell.jp/en/feature/interview02_1) describes the 1995 film as an information-dense future and notes that cables made cyberbrain connections visible. A [licensed *Stand Alone Complex* episode image from TELASA](https://www.telasa.jp/videos/114068) is a reference for displays tied to a concrete task and screen location. The [Production I.G 1995 still gallery](https://www.production-ig.co.jp/works/ghost-in-the-shell/steels/02.html) is an optional reference for thermoptic interference. The site translates these qualities into segmented inspection rings around a real link endpoint; it does not copy visual assets from those sources.

## Components

- All 21 Stack tools link to verified official sites, documentation, or upstream repositories. Use compact text links without visible arrows, with a 44px minimum target, shared corner feedback, visible focus, and accessible new-tab text. Keep tool names, category order, and the existing collection schema.
- Shared controls have at least 44px targets and a 2px focus ring with a 4px offset. Projects, Music, and Social reserve a separate endpoint around their external-link arrow. On fine-pointer hover, one shared WebGL2 canvas draws segmented inspection rings in that endpoint. A 0.7-second acquisition sweep resolves into the rings, pointer position changes their tilt around the fixed centre, and a press sends one 0.55-second pulse. The arrow and rings share the same centre in every state. The alpha cap is 0.78 in both themes. The canvas stays behind the arrow, adds no movement to DOM text or hit areas, and never overlaps link copy.
- Arrows without an inspection display move 3px right and up. Inspection arrows stay centred. A press moves the entire control down 1px, including its arrow and rings. Use `cubic-bezier(0.22, 1, 0.36, 1)`, 180–200ms transitions, and an 80ms press response. Background and text color use the same 180ms feedback timing.
- Navigation uses six direct section links without numbers, a sliding indicator, or a collapsed menu. The current section has `aria-current="location"` and a stable surface highlight. Hover adds a fine underline; keyboard focus remains visible. Light, Dark, and System buttons form one compact surface group, with a 2px inset and at least 44px targets. They use `aria-pressed`. System is the default; saved choices survive reloads and blocked storage does not stop switching.
- Project rows show the real external destination as hostname and path below each description. This string comes from the project URL, rather than an invented label.
- Music is one static list of all eight channels, with no page controls or decorative row numbers. Wide layouts use two columns, with each genre below its title. The week strip keeps the day above its linked project and shows both weekend Off entries. Its links omit arrows and keep a minimum 72px height, hover feedback, and visible keyboard focus.
- With JavaScript off, section links remain visible, theme controls stay hidden, all music remains visible, and CSS follows the system color preference. The header stays sticky. Back to top links open the homepage; with JavaScript, they explicitly scroll to zero, remove the hash, and focus the brand without another scroll. Modified clicks retain native behavior.
- Explicit theme changes use a 180ms native view crossfade when supported and when the resolved palette changes. Startup, reduced motion, and unsupported browsers apply the theme directly.
- The inspection renderer initializes on the first eligible hover, completes its acquisition pass in 0.7 seconds, and stops drawing after the pointer leaves and the endpoint fades. It uses one context, DPR at most 1.5, and a backing buffer no larger than 1536 × 512. The same 0.78 alpha cap applies in light and dark themes because the display stays inside the reserved arrow endpoint.
- Each inspected link contains static SVG segmented rings for keyboard focus, touch press, reduced motion, and unavailable WebGL2. Touch/coarse pointers, reduced transparency, forced colors, unsupported WebGL2, and lost contexts use this CSS feedback. Scroll, blur, hidden pages, and theme changes clear the canvas; a restored context can restart on a later hover.
- Reduced-motion CSS removes transforms, transitions, view animations, and smooth scrolling. Forced-colors mode outlines selected controls. External links have visible arrows except in the horizontal calendar; all retain accessible new-tab text.

Keyboard and accessibility-tree checks passed. A live VoiceOver session and OS reduced-motion emulation were not run; see the local validation record in `.impeccable/review/validation.md`.
