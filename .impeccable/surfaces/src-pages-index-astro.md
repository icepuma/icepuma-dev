---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/styles/global.css","src/styles/tokens.css","src/components/Receiver.astro","src/components/TuningScale.astro","src/components/ThemeKnob.astro","src/components/SectionHeading.astro","src/components/ExternalLink.astro","src/components/Nav.astro","src/layouts/MinimalLayout.astro"]
---

# Homepage

Mode: experience. The "Braun receiver" redesign governs this surface: a Braun-inspired interface with micro-interactions and a hyper-realistic knob to switch themes, first-class light and dark themes, every screen size from 320px phones up. Every content item, destination, and anchor is kept. No raster assets are needed.

## Direction contract

THESIS: One receiver on a catalogue page, less but better, built from the real schedule and the Berlin clock.

OWN-WORLD: Warm grey paper and Braun black grounds; white and anthracite bodies; black and grey print; one signal orange for now and for action and one green pilot lamp for "on"; Archivo alone; soft rectangles and circles; push-button keys; a punched grille; black glass over the scale; a seven-segment display; small German sub-labels (Projekte, Profil, Technische Daten, Wochenplan, Musik, Kontakt).

STORY: Meet the name and the receiver tuned to today, then read the projects, the bio, the stack, the week, the music, and the social links.

FIRST VIEWPORT: A sticky header with all six keys (two rows on phones, where the brand row scrolls away; one row from 48rem) above the name, the role, and the receiver. On desktop the first row of projects starts inside 1280×800.

USER DECISIONS: A Braun-inspired interface, micro-interactions, and a hyper-realistic knob for the theme. Earlier standing direction still holds: no custom logos, no decorative numbers, no slide indicators, no separator lines, navigation always visible, working Back to top.

## Interaction set

- The knob: three detents (Light, Auto, Dark). Labels and arrow keys change its radios; a drag turns it with stiction near each detent and give past the end stops, then springs into place on release; a tap advances one position. Its sheen follows a mouse, it presses 1% into the panel while held, and Android phones feel a haptic tick per detent.
- A theme change spreads out from under the knob as a disc with a band of concentric rings at its edge.
- Keys sink under a press and spring back; the current section's key stays latched with an orange lamp; section lamps light while read.
- Panels lift on hover and press down under a click; the arrow printed in their corner runs out and an orange one slides in. A touch reader gets the lift on the panel under a reading line once scrolling stops.
- The scale takes a ghost needle under a mouse and lights the day and station beneath it.
- Once per visit the receiver powers on: a segment test on the display and the needle tuning in with a small overshoot.

## Research interpretation

The receiver, keys, grille, display, and knob are an original interpretation of Braun's design language under Dieter Rams and Dietrich Lubs: neutral bodies with one functional accent, quiet printed legends, a linear tuning scale with an orange pointer, a punched speaker grille, knurled aluminium knobs, and a seven-segment display. No Braun logo, product name, model number, or other mark is reproduced, and every instrument shows real data.
