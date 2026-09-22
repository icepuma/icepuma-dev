---
name: "icepuma.dev"
description: "A project-first personal homepage in the Stand Alone Complex register: a calm cyberbrain HUD built from real data."
colors:
  light-background: "#eaf0ef"
  light-surface: "#f1f5f4"
  light-surface-hover: "#e6eff0"
  light-foreground: "#0e1b1e"
  light-muted-foreground: "#4a5d61"
  light-primary: "#006a7d"
  light-accent: "#94510a"
  light-rule: "#c3cfce"
  light-rule-strong: "#8fa0a0"
  light-grid-mark: "#cfd9d8"
  dark-background: "#060e11"
  dark-surface: "#0d1c21"
  dark-surface-hover: "#132b31"
  dark-foreground: "#d8e8ea"
  dark-muted-foreground: "#8ea6aa"
  dark-primary: "#57d6ea"
  dark-accent: "#f0ab4a"
  dark-rule: "#17292e"
  dark-rule-strong: "#2a454c"
  dark-grid-mark: "#17292e"
typography:
  display:
    fontFamily: "Chakra Petch, IBM Plex Sans, sans-serif"
    fontSize: "clamp(2.25rem, 1.2rem + 5.2vw, 4.75rem)"
    fontWeight: 600
    lineHeight: 0.95
    textTransform: "uppercase"
  section-title:
    fontFamily: "Chakra Petch, IBM Plex Sans, sans-serif"
    fontSize: "clamp(1.75rem, 1.35rem + 1.4vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1
    textTransform: "uppercase"
  title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  statement:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(1.375rem, 1.1rem + 1vw, 1.75rem)"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-0.01em"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.04em"
  japanese:
    fontFamily: "Hiragino Sans, Yu Gothic UI, Noto Sans JP, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
spacing:
  control-min: "44px"
  gutter: "clamp(1rem, 4vw, 3rem)"
  content-max: "75rem"
  panel-cut: "12px"
  bracket: "12px"
  control-mark: "7px"
  section-scale: "9rem"
components:
  project-panel:
    backgroundColor: "var(--surface)"
    borderColor: "var(--rule-strong)"
    shape: "one 12px cut corner, top right"
  panel:
    backgroundColor: "var(--surface)"
    borderColor: "var(--rule-strong)"
  chip:
    borderColor: "var(--rule-strong)"
    size: "32px visual, 44px target"
  today-tag:
    backgroundColor: "var(--primary)"
    textColor: "var(--primary-foreground)"
  destination:
    textColor: "var(--accent)"
---

# Design System: icepuma.dev

## Overview

A project-first homepage in the **Stand Alone Complex** register: a calm cyberbrain HUD over one person's work. Thin-line instruments, bilingual register labels, cyan for what you can act on, amber for what is recorded. The page leans into the franchise through its interface language, not through its art: nothing here is a reproduced mark, character, or line of on-screen text, and every instrument measures something real.

The first viewport carries the one bold object, the **week dial**: a ring whose rim ticks every hour of the week, whose arcs are the days of the real open-source schedule, and whose cyan tick is now in Berlin. Everything below it is quieter: ruled panels, a spec-sheet stack, a duty-roster calendar.

**Key characteristics:** two signals and no red; one cut corner; a dial built from data; bilingual section labels; motion that answers the reader or runs once; generous contrast in both themes.

## Colors

Two grounds and two signals, defined in `src/styles/tokens.css`. The file is tagged so `tests/contrast.test.ts` can measure every palette, including the no-JS system copy and the more-contrast overrides.

- **Night dive** (`#060e11`) and **daylight briefing** (`#eaf0ef`) are the two grounds. The dark ground is a teal-black; the light ground is cool, flat paper with no glare.
- **Surface** (`#0d1c21` / `#f1f5f4`) fills panels; **surface-hover** (`#132b31` / `#e6eff0`) is the lit panel.
- **Instrument cyan** (`#57d6ea` / `#006a7d`) is interaction and presence: links, focus, the current section, the today tag, the now tick.
- **Register amber** (`#f0ab4a` / `#94510a`) is recorded data: destinations, categories, days, genres, handles, the week arcs.
- **Rule** and **rule-strong** draw hairlines and panel frames. Panel frames always use rule-strong; plain rule disappears on the dark ground.

### Named Rules

**The Two-Signal Rule.** Cyan means "you can act here" or "this is now"; amber means "this is recorded". As text, cyan only ever sits on links and controls. Cyan and amber are nearly the same brightness, so every colour change is paired with a shape change (brackets, a frame, an underline).

**The No-Alarm Rule.** No red is defined, because the page has no alert state.

**The One-Fill Rule.** The Today tag is the only solid cyan fill on the page.

**The Measured-Palette Rule.** Every text token clears 4.5:1 on background, surface, and surface-hover in both themes and both contrast modes; the contrast test fails the build otherwise.

**The Glow Rule.** Glow is dark-mode only, on lines only (today's arc), never on text, and off under reduced transparency or more contrast.

## Typography

- **Chakra Petch 600**, uppercase only: the name, section titles, and the dial's day. Its cut corners echo the panel chamfer.
- **IBM Plex Sans** for everything read: titles at 600, prose at 400, the About statement at a larger size.
- **JetBrains Mono** for data and chrome: navigation, readouts, destinations, categories, days, genres, handles. Never below 12px except the phone nav at 320px (11px), never tracked wider than 0.04em.
- **Japanese sub-labels** in the system Japanese face at 13px, weight 500: 開発, 経歴, 使用技術, 週間予定, 音楽, 連絡先. They are `lang="ja"` and `aria-hidden`, because the English heading is the name.

### Named Rules

**The Uppercase-Display Rule.** Chakra Petch appears in capitals only; mixed-case identifiers like `intar.dev` stay in Plex.

**The Tracking Rule.** No letter-spacing above 0.04em, anywhere.

## Layout

The page is at most 75rem wide with fluid gutters that respect safe-area insets. It is mobile first:

- **Header**: sticky. Below 40rem it has two rows (brand and theme, then all six links on one row, sized to their words, about 96px in total); from 40rem it is one row. Below 320px or at high zoom the links wrap; they are never truncated or scrolled.
- **Hero**: the identity, then live readouts and the dial. Below 48rem a small dial sits beside the stacked readouts; from 48rem the dial takes the right column at up to 20rem.
- **Projects**: one, two (40rem), then three (64rem) columns of equal-height panels.
- **Stack**: tonal category bands, label column from 48rem. **Calendar**: rows, then a seven-cell strip from 48rem. **Music**: two columns from 48rem. **Social**: two columns from 30rem.

### Named Rules

**The No-Separator Rule.** No full-width rules divide the page. Separation comes from space, tonal bands, and panel frames; the section scale is short and attached to its title.

**The Always-Visible-Nav Rule.** All six links are visible at every width. No menu, no numbers, no sliding indicator.

## Elevation & Depth

No shadows. Depth comes from the grounds, panel frames, and state. The sticky header has its own layer (88% fill with a 16px backdrop blur on a pseudo-element, opaque without blur for reduced transparency and forced colours). A hairline fades in under it once the page scrolls. The hero has a faint "+" registration grid centred on the dial, at or below 1.3:1 against the ground, and a soft cyan wash in dark mode.

### Motion

Motion is a state language and deliberately scarce.

- **At rest nothing moves.** The clock and the now tick change once a minute; there are no seconds and no blinking.
- **Once per visit** the dial draws itself in (about 900ms) and the live readouts resolve with a short decode. It never replays, and it is skipped when the reader arrives on an anchor or through history.
- **Scroll** drives two things, both CSS scroll-driven and static where unsupported: the section scale draws in as its section arrives, and the dial's inner ring turns up to 45° as the hero leaves.
- **Hover and focus** take 160–240ms, colour and underline 120–180ms, a press under 200ms, the theme iris 400ms.
- Two easings: `--ease-out` (out-quint) for feedback and `--ease-acquire` (out-expo) for arrivals. Anything that arrives uses the longer acquire; anything that leaves is faster.

**The Answer-or-Once Rule.** Every movement answers the reader (scroll, hover, focus, press, theme choice) or runs once per visit. Nothing loops.

**The Budget Rule.** At most two effects per hover plus the press, at most two animations at once, nothing travels more than 8px.

**The One-Decode Rule.** Text scrambles in exactly one place: the hero's live readouts, as the data arrives. The mask is `aria-hidden`; the real text never changes.

## Shapes

Square everywhere except one cut: **project panels carry a single 12px chamfer at the top right**, drawn by clipping a frame layer and a fill layer inset 1px (the inner cut is 0.59px shorter, so the diagonal stays one pixel). The link itself is never clipped, so focus survives. Small controls keep two 7px corner marks. Panels take 12px lock-on brackets outside their frame. Every ring on the page, from the dial to the link endpoints, shares one stroke and dash rhythm.

### Named Rules

**The One-Cut Rule.** Only project panels are chamfered. Chips, cells, tags, and buttons stay square.

## Components

- **Navigation** — six direct links. The current one carries `aria-current="location"`, a surface chip, and its corner marks; the reticle moves from link to link in place and never slides. Hover underlines in cyan.
- **Theme control** — one tri-state button, Light → Dark → System, with the glyph for the current mode crossfading in place. Its accessible name states the mode and the next action; a live region speaks only after a press. A palette change from the button opens as a circular iris from the button's centre over 400ms; without an origin it crossfades for 180ms; reduced motion and unsupported browsers switch instantly.
- **Week dial** — inline SVG, `aria-hidden`, built at build time from `schedule.yaml`: 168 hour ticks with long midnight ticks, seven week arcs (weekdays amber, days off dashed and muted, today cyan), one inner ring that turns with scroll, crosshair ticks, and today's day in the centre. JavaScript marks today and places the now tick at `(day·24 + hour + minute/60) / 168 · 360°` in Berlin time. Fine pointers tilt it by at most 4°. Below 48rem the minor ticks and the day labels hide.
- **Readouts** — `BERLIN hh:mm CET/CEST` and `TODAY <focus>`, built from the calendar row. Rendered hidden and revealed by JavaScript; without JavaScript there is no clock and no placeholder.
- **Section heading** — the English title, a short tick scale that turns cyan while its section is current, the Japanese sub-label, and the intro.
- **Project panel** — title, description, and the amber destination (breaking only after slashes) above a ringed endpoint. Hover and focus lock on: three brackets snap in and the endpoint rings spin in. Focus also turns the frame cyan at 2px, following the cut.
- **Music and social panels** — square panels; hover and focus bring four brackets.
- **Stack chips** — 32px square hairline chips with 44px targets; hover and focus change colour and border only.
- **Calendar** — a duty roster. Today gets a cyan frame, `aria-current="date"` on its day, and the Today tag; days off are hatched beside the word, never behind it.
- **Touch attention lock** — on devices without hover, once scrolling stops, the panel under a reading line 30% down the viewport takes the brackets, one panel at a time.
- **Without JavaScript** — every section link, project, tool, day, channel, and contact stays visible; the theme button and readouts stay hidden; CSS follows the system colour preference.
- **Reduced motion** — every state change stays, instantly; rotation, draw-in, iris, decode, and tilt are gone. **Forced colours** — no clipping, system borders, Highlight focus. **More contrast** — stronger text and rules, no glow.

## Do's and Don'ts

### Do:

- **Do** keep every control at a 44px target and every action on cyan.
- **Do** keep recorded data on amber, and pair every colour change with a shape change.
- **Do** build instruments from real data: the schedule, the Berlin clock, the real destinations.
- **Do** keep copy, URLs, collection order, section anchors, and the single static page unchanged.
- **Do** run `bun test` after any token change; the contrast test measures both themes.
- **Do** honour reduced motion, forced colours, reduced transparency, more contrast, and no-JavaScript reading.

### Don't:

- **Don't** add section numbers, wide tracking, sliding indicators, separator lines, or a custom logo.
- **Don't** chamfer anything but project panels, or glow anything but lines.
- **Don't** scramble text anywhere but the live readouts, and never scramble Japanese.
- **Don't** reproduce franchise art, marks, on-screen text, or character references, and don't invent case numbers, timestamps, statuses, stamps, or redactions.
- **Don't** put text in a band around a ring or an emblem in its centre.
