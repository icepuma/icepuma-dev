---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/styles/global.css","src/components/ThemeSwitcher.astro","src/layouts/MinimalLayout.astro"]
---

# Homepage

Mode: experience. The approved plan and the subsequent request to remove numbering and tracking, fix Back to top, strengthen the GITS style, remove custom symbols, and keep navigation visible govern this design. Keep every existing content item and destination. Build the working page first. No raster assets are needed.

## Direction contract

THESIS: A minimal Stand Alone Complex homepage leads with the work and keeps all six navigation links visible while scrolling.

OWN-WORLD: Institutional daylight and green-cast night grounds; cyan for interaction and amber for recorded data with no alarm red; IBM Plex Sans Condensed for names, IBM Plex Sans for text, JetBrains Mono for data; 7px control corner marks and 10px register bracket reticles.

STORY: Read the projects, then the full bio, stack, weekly schedule, music, and social links.

FIRST VIEWPORT: A soft sticky header with all six visible links and grouped theme controls above a tighter identity block and project list. Project rows show their real destinations. Endpoint inspection stays beside the external arrow. No logos or separators.

FORM: The user's approved plan fixes the form and overrides selection. Seed 0acd6d7d returned a degraded assignment of 3; no challenger boards were available.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Motion and layout refinement

Each of the 21 Stack items links to its official site, documentation, or upstream repository. Compact text links retain the existing tool order and use the shared external-link component, without visible arrows and with 44px targets.

Explicit theme choices crossfade for 180ms; startup and reduced motion remain immediate. Row tint and text color fade for 180ms while arrows retain their small shift. Only the sticky header blurs its backdrop. At desktop width, section labels are sticky, Stack stays a semantic definition list with wrapped tool lists, and Social uses two columns. Wide screens show a week strip and two music columns; narrow screens keep a single reading column. Identity metadata uses 16px text. All content, destinations, and navigation stay available.

## Endpoint inspection

Projects, Music, and Social use an inspected external-link endpoint. The arrow gets its own reserved surface, so no display overlaps copy or changes a hit area. A single WebGL2 canvas draws two segmented rings around the arrow on a fine-pointer hover. It makes one 0.7-second acquisition sweep, settles into the rings, tilts around their fixed centre with the pointer, and sends one 0.55-second outward press pulse. The arrow stays at that shared centre during hover, focus, and press. The shader alpha is capped at 0.78 in both themes. The page is still at rest.

The inline SVG rings are the fallback for keyboard focus, touch press, reduced motion, and unavailable WebGL. They remain visible feedback, without a moving canvas. Shared CSS corner marks, arrow movement, and the stable `aria-current="location"` navigation highlight continue to work. There is no sliding indicator, divider, custom logo, sound, or background animation.

## Research interpretation

This is an original endpoint treatment, not a copy of an anime asset. It interprets localized information density and a short acquisition sequence from [Mamoru Oshii's official interview](https://theghostintheshell.jp/en/feature/interview02_1), a bounded interface reference from [the licensed *Stand Alone Complex* TELASA image](https://www.telasa.jp/videos/114068), and optional thermoptic-interference reference from the [Production I.G 1995 still gallery](https://www.production-ig.co.jp/works/ghost-in-the-shell/steels/02.html). It does not use character art, franchise symbols, copied screen text, or an imitation logo.

## Deepening pass (current)

The approved deepening keeps the world and the content and pushes the franchise's interface language into the layout itself:

- **Palette.** Instrument cyan is interaction (links, focus, active label, reticle, inspection rings); register amber is recorded data (destinations, categories, days, genres). No alarm red, because the page has no alert state. Light is institutional daylight; dark is the green-cast night city.
- **Typography.** IBM Plex Sans Condensed 600 for the identity name and project titles; IBM Plex Sans for prose; JetBrains Mono for data. The display face is an addition inside the pinned Plex family and is reversible in `astro.config.ts`.
- **Register reticle.** The section being read acquires four 10px cyan L-brackets and its rail label turns cyan, driven by the existing scroll spy; nothing is bracketed below 768px. Drawn as eight gradient bars on one pseudo-element, so no markup or text is touched.
- **No ambient motion.** The hero acquisition scan was removed; every movement now answers reader state only. Motion was also softened: a 180ms reticle acquire with a 40ms stagger and 120ms release, a 180ms label hairline, and a 180ms theme crossfade.
- **Projects as a register line.** At 768px and above the real destination occupies its own 12rem column; below it, it sits under the description as before.

Research for the pass: Oshii's Hong Kong setting and the "information deluge" theme, with the old and new coexisting, are recorded in [Ghost in the Shell (1995 film)](https://en.wikipedia.org/wiki/Ghost_in_the_Shell_(1995_film)); the series premise and the Stand Alone Complex are recorded in [Stand Alone Complex](https://en.wikipedia.org/wiki/Ghost_in_the_Shell:_Stand_Alone_Complex). No franchise asset, mark, or text is reproduced.