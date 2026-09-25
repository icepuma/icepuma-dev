---
name: "icepuma.dev"
description: "A project-first personal homepage in the Braun register: one receiver built from real data, quiet printed panels, and a hyper-realistic knob for the theme."
colors:
  light-background: "#e5e4df"
  light-surface: "#f4f3ef"
  light-surface-hover: "#fbfaf7"
  light-foreground: "#1a1a19"
  light-muted-foreground: "#5c5b56"
  light-primary: "#ad3d0c"
  light-signal: "#e85a20"
  light-lamp: "#27903f"
  light-rule: "#d5d3cc"
  light-rule-strong: "#b3b1a9"
  light-window: "#161615"
  light-lcd: "#c3c8b8"
  light-lcd-ink: "#1d211b"
  dark-background: "#111110"
  dark-surface: "#1b1b1a"
  dark-surface-hover: "#242423"
  dark-foreground: "#ecebe5"
  dark-muted-foreground: "#a3a199"
  dark-primary: "#ff8b52"
  dark-signal: "#ff7a3d"
  dark-lamp: "#45d06c"
  dark-rule: "#2a2a28"
  dark-rule-strong: "#43433f"
  dark-window: "#0a0a09"
  dark-lcd: "#0d0f0d"
  dark-lcd-ink: "#ffcf9a"
typography:
  display:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(2.75rem, 1.3rem + 6vw, 5.5rem)"
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: "-0.045em"
  section-title:
    fontFamily: "Archivo"
    fontSize: "clamp(1.75rem, 1.3rem + 1.6vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Archivo"
    fontSize: "1.25rem"
    fontWeight: 600
    letterSpacing: "-0.02em"
  statement:
    fontFamily: "Archivo"
    fontSize: "clamp(1.375rem, 1.05rem + 1.2vw, 1.875rem)"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Archivo"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  legend:
    fontFamily: "Archivo"
    fontSize: "0.6875rem–0.8125rem"
    fontWeight: 500
spacing:
  control-min: "44px"
  gutter: "clamp(1rem, 4vw, 3rem)"
  content-max: "75rem"
  radius-lg: "16px: the receiver, panels, day slots"
  radius-md: "10px: keys and the scale window"
  radius-sm: "6px: the display and tags"
  knob: "6rem phone, 6.5rem from 30rem, 7rem from 48rem"
components:
  receiver:
    backgroundColor: "var(--surface)"
    parts: "tuning scale behind black glass, clock display, speaker grille, theme knob"
  knob:
    material: "spun aluminium face, knurled grip, engraved signal indicator"
    detents: "Light -60°, Auto 0°, Dark 60°"
  key:
    backgroundColor: "var(--key-face)"
    size: "32px cap, 44px target"
  section-button:
    size: "15px round cap above a 12px lowercase legend, 44px target"
    lit: "var(--signal)"
  panel:
    backgroundColor: "var(--surface)"
    radius: "16px"
  panel-arrow:
    size: "16px printed arrow in a 20px corner"
    lit: "var(--signal)"
  lamp:
    size: "6–8px"
    lit: "var(--lamp)"
---

# Design System: icepuma.dev

## Overview

A project-first homepage in the **Braun register**: the product language of Dieter Rams and Dietrich Lubs, from the SK 4 to the ET 66. Warm grey paper, white and anthracite bodies, black print, one signal orange, one green pilot lamp. The page is a catalogue with a single product on it.

That product is the **receiver** in the hero. Its waveband is the week: the tuning scale is the real open-source schedule, the needle is now in Berlin, the display reads the Berlin clock, and the knob beside the speaker grille switches the theme. Everything below it is quieter: printed panels, a keypad for the stack, a row of day slots for the calendar.

The site is inspired by Braun's design language. It reproduces no Braun logo, product name, or trademark, and every instrument measures something real.

**Key characteristics:** less, but better; one object; one signal colour; printed data; physical light; controls that behave like controls.

## Colors

Two grounds, black print, and two signals, defined in `src/styles/tokens.css`. The file is tagged so `tests/contrast.test.ts` can measure every palette, including the no-JS system copy and the more-contrast overrides.

- **Paper** (`#e5e4df`) and **Braun black** (`#111110`) are the grounds; **surface** (`#f4f3ef` / `#1b1b1a`) is the body of every panel and of the receiver, a white device or an anthracite one.
- **Print** (`#1a1a19` / `#ecebe5`) and **grey print** (`#5c5b56` / `#a3a199`) carry every word. Data (destinations, categories, days, genres, handles) is grey print, never a hue.
- **Signal orange** (`--signal`) is the one accent: the needle, the knob's indicator, the lit detent, the latched key's lamp, a panel's lit arrow, the Today tag. As text it is `--primary` (`#ad3d0c` / `#ff8b52`), used only on hover and focus.
- **Pilot green** (`--lamp`) is a lamp, never text: the current section and today.
- **Window** and **LCD** tokens colour the receiver's black glass and its display; **key** and **metal** tokens are materials and are not measured.

### Named Rules

**The One-Signal Rule.** Orange means "this is now" or "you are acting here". Green means "this is on". Nothing else has a hue.

**The Printed-Data Rule.** Recorded data is printed in grey, like the legends on a device. It never takes a colour.

**The Pair Rule.** Every colour change comes with a shape change: a key sinks, a panel lifts, a lamp glows, a detent tick lengthens.

**The Measured-Palette Rule.** Every text token clears 4.5:1 on background, surface, and surface-hover in both themes and both contrast modes; the scale print clears it on the window and the clock on the display; the needle, indicator, and lamps clear 3:1 as marks. The contrast test fails the build otherwise.

**The Night-Light Rule.** Glow exists only in the dark theme and only on light sources: the needle, the display's segments, the lamps, the scale's backlight. Never on body text, and off under more contrast.

## Typography

- **Archivo** only, in three weights, as Braun used one grotesque for everything. 600 for the name, section titles, and card titles, all tightly tracked; 400 for prose and the About statement; 500 for printed legends: keys, labels, the scale, the knob's positions.
- Legends are small (11–13px) and never tracked wider than 0.04em. The section buttons' legends are printed in lowercase, as Braun printed the legends under its receivers' buttons. Figures on the scale and in data are tabular.
- **German sub-labels** sit beside each section title in grey print, the way a Braun manual carries a second language: Projekte, Profil, Technische Daten, Wochenplan, Musik, Kontakt. They are `lang="de"` and `aria-hidden`, because the English heading is the name.

### Named Rules

**The One-Family Rule.** No second typeface, no monospace. Distinction comes from weight, size, and grey.

## Layout

The page is at most 75rem wide with fluid gutters that respect safe-area insets. It is mobile first:

- **Header**: sticky. Below 48rem it has two rows, the brand and then all six section buttons; the brand row scrolls away and only the buttons stay stuck, so anchors clear 50px, not 98. From 48rem it is one row and stays whole.
- **Hero**: the name, role, and location, then the receiver. From 64rem they sit side by side. Inside the receiver, the scale spans the width; below 30rem the readouts share a row and the knob sits centred under them, and from 30rem the readouts, the grille, and the knob share one row.
- **Projects**: one, two (40rem), then three (64rem) columns of panels.
- **Stack**: one keypad panel, the label column from 48rem. **Calendar**: rows, then seven day slots from 48rem. **Music**: two columns from 48rem. **Social**: two columns from 30rem.

### Named Rules

**The No-Separator Rule.** No rules divide the page. Separation comes from space and from objects resting on the paper.

**The Always-Visible-Nav Rule.** All six section buttons are visible at every width. No menu, no numbers, no sliding indicator: the current section's button lights in place.

## Elevation & Depth

Cards and keys are flat, round shapes on the paper with a hairline edge and no drawn thickness; only a hovered card lifts 2px and casts a soft shadow (`--shadow-lift`). The receiver is the exception: it is the one object with a body, a lit top edge and a soft shadow under it, and the scale window and the display sit behind glass that reflects the lamp softly across its top. A day off is an empty outlined slot. The sticky header has its own layer (86% fill with a 16px blur, opaque without blur), and a soft edge fades in under it once the page scrolls.

### Named Rules

**The Physical-Light Rule.** One lamp lights the page, from 12 o'clock and above: light comes from above and shadows fall down. On the knob the light belongs to the lamp, not to the knob. The spun face reflects it as one bright band through the centre, pointing at the lamp and darkest at right angles to it; its grooves are circles, so the band stays put while the knob turns and swings only as the viewer moves (the sheen). The grip is lit where it faces the lamp, and each knurl tooth on the flank that faces it. What is cut into the metal turns with the hand: the knurl, faint tool marks in the face, and the indicator, whose groove keeps its shade on the lamp's side.

## Motion

Motion is mechanical and deliberately scarce.

- **One spring.** A single damped spring with a 6% overshoot (`--spring`, a `linear()` curve) runs at three lengths: 240ms for keys, 380ms for the knob, 1300ms for the needle. Colour and opacity use `--ease-out`; crossfades use `--ease-in-out`.
- **Keys** sink 1.5px as they are pressed (70ms) and spring back. The section buttons darken under a press, and the current section's button lights as it is read; nothing slides.
- **Panels** lift on hover and press down under a click. The arrow printed in their corner runs out at the top right while a fresh one, in signal orange, slides in from the bottom left (380ms).
- **The knob** follows a drag, lagging near each detent and hurrying over the ridge between two, so a steady drag reads as a click; past an end stop it gives about 7° and comes back as soon as the hand does. Released, it springs into its detent, the knurl and the tool marks turning under the still reflection. A tap advances one position and swings back from Dark to Light (a finger may wobble 12px, a mouse 6px); a control-click is left to the context menu. Android phones get an 8ms haptic tick per detent. A press on the knob or its labels during a reveal ends the reveal and still counts.
- **The sheen** turns up to 12° toward a mouse as it crosses the page.
- **The theme change** spreads out from under the knob. The knob takes the new palette first and is seen springing into its detent the whole time; from its rim the new palette grows as a disc whose edge breaks into fine concentric rings, like the knob's spun face (600ms, `--ease-out`: fast out from under the knob, settling at the far corner). Without an origin, under reduced motion, or in forced colours it is a 240ms crossfade; unsupported browsers switch instantly. Colours change once, inside the reveal: every other transition is off while it runs. What turns on the knob does so on its own compositor layers, so repainting the page never holds the knob up.
- **The scale** takes a ghost needle under a mouse and lights the day and station beneath it.
- **Once per visit** the receiver powers on: the display lights every segment for 700ms and the needle tunes in from Monday, overshooting a little before it settles. Never on anchor or history arrival.
- **At rest nothing moves.** The clock and the needle change once a minute.

**The Answer-or-Once Rule.** Every movement answers the reader (pointer, key, scroll, theme choice) or runs once per visit. Nothing loops and nothing blinks.

**The No-Sound Rule.** The knob clicks by shape and, where supported, by touch. It never plays a sound.

## Shapes

One scale of corners, round and flat: 16px on the receiver, panels, and day slots; 10px on keys and the scale window; 6px on the display and the Today tag; circles for the knob and the lamps. Panels carry no buttons of their own: the whole panel is the control, and its arrow is print. Every key is a 32px cap inside a 44px target.

## Components

- **Navigation** — a row of six round buttons with their names printed beneath in lowercase grey, the way a receiver lays out its source buttons (after the regie receivers' button rows). The current section's button is lit in signal orange and its name prints black; it carries `aria-current="location"`. The buttons share the row in equal columns on phones, one row down to 320px, and sit in even columns at the right from 48rem; columns are sized to the print, so large text wraps into even rows.
- **Receiver** — the hero object: the tuning scale behind black glass, the Berlin display, today's station, a punched speaker grille (from 30rem), and the theme knob. With JavaScript the readouts hold their place from the first paint, invisible until the clock arrives, so nothing moves; on phones they wrap onto two rows rather than overflow, and the knob is capped to the screen's width.
- **Tuning scale** — built at build time from `schedule.yaml`: 168 hour ticks, longer every six hours, longest at midnight, with a closing tick after Sunday; one station per run of days with the same focus, bracketed (a day off dashed); the day names beneath. Stations and days share a seven-column grid, so long names wrap inside their own band. JavaScript marks today's day (with an orange dot) and station, and places the needle at `(day·24 + hour + minute/60) / 168` of the width, in Berlin time. The whole scale is `aria-hidden`; the calendar carries the same data as text.
- **Display** — four seven-segment digits and a colon, drawn as SVG, with the unlit segments faintly visible and the lit ones casting a hairline shadow; a warm backlit reading at night. It is `aria-hidden`; the real time is in a visually hidden `<time>`, and the zone is printed beside the digits.
- **Theme knob** — a `fieldset` of three radios (Light, Auto, Dark) with a hidden legend; each printed position is the 44px label for its radio. Arrow keys and labels change the radios natively; a drag turns the knob through the detents and commits on release; a tap advances one position and swings back from Dark to Light. The checked radio sets the knob's angle through CSS, and an inline script checks the saved choice while the page parses, so the knob is already in its detent at first paint. A live region speaks the new theme after a change. Without JavaScript there is no knob.
- **Section heading** — a pilot lamp that lights while its section is read, the title, the German sub-label, and the intro.
- **Project, music, and social panels** — flat, round white or anthracite panels with a small grey arrow printed beside the title (at the right edge of the shorter social panels); on hover and focus it swaps for an orange one as the panel lifts.
- **Stack** — a keypad: one panel, a grey label per row, a key per tool.
- **Calendar** — seven day slots with a pilot lamp each; today's is lit and carries the orange Today tag, and days off are empty slots pressed into the page.
- **Without JavaScript** — every section, project, tool, day, channel, and contact stays visible; the knob and readouts are absent; CSS follows the system colour preference.
- **Reduced motion** — every state change stays, instantly, and the theme change crossfades; the springs, the power-on, and the sheen are gone. **Forced colours** — system borders, Highlight for the needle, the indicator, the lit detent, and the lamps; the knob becomes a bordered circle with its indicator. **More contrast** — stronger grey print and rules, no glow.

## Do's and Don'ts

### Do:

- **Do** keep every control at a 44px target and give every press a physical answer.
- **Do** keep orange for now and for action, green for lamps, and data in grey print.
- **Do** build instruments from real data: the schedule, the Berlin clock, the real destinations.
- **Do** keep copy, URLs, collection order, section anchors, and the single static page unchanged.
- **Do** run `bun test` after any token change; the contrast test measures both themes.
- **Do** honour reduced motion, forced colours, reduced transparency, more contrast, and no-JavaScript reading.

### Don't:

- **Don't** reproduce the Braun logo, product names, model numbers, or any other trademark.
- **Don't** add section numbers, separator lines, sliding indicators, or a custom logo.
- **Don't** add a second accent colour, colour data, or put glow on text.
- **Don't** loop, blink, or play sounds.
- **Don't** invent statuses, readings, or other fictional data for an instrument to show.
