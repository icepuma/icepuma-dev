---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/styles/global.css","src/styles/tokens.css","src/components/WeekDial.astro","src/components/SectionHeading.astro","src/components/ExternalLink.astro","src/components/ThemeSwitcher.astro","src/layouts/MinimalLayout.astro"]
---

# Homepage

Mode: experience. The "Cyberbrain HUD" redesign governs this surface: lean clearly into Stand Alone Complex, with neat micro-interactions, first-class light and dark themes, every screen size from 320px phones up, pleasant to the eye, bold but not maxed out. Every content item, destination, and anchor is kept. No raster assets are needed.

## Direction contract

THESIS: A calm cyberbrain HUD over one person's work, anchored by a week dial built from the real schedule.

OWN-WORLD: Teal-black night and daylight-briefing grounds; cyan for interaction and presence and amber for recorded data, with no alarm red; Chakra Petch capitals for the name and section titles, IBM Plex Sans for text, JetBrains Mono for data; one 12px cut corner on project panels; lock-on brackets; small, decorative Japanese section labels (開発, 経歴, 使用技術, 週間予定, 音楽, 連絡先).

STORY: Meet the name and today's schedule on the dial, then read the projects, the bio, the stack, the week, the music, and the social links.

FIRST VIEWPORT: A sticky header with all six links visible (two rows on phones, one row from 40rem) above the name, the role, live Berlin readouts, and the week dial. On desktop the first row of projects is visible at 1280×720.

USER DECISIONS: The week dial as the hero; a compact sticky top bar on phones rather than a bottom dock; Japanese sub-labels. Earlier standing direction still holds: no custom logos, no decorative numbers, no slide indicators, no separator lines, navigation always visible, working Back to top.

## Interaction set

- Lock-on, graded by importance: project panels take three brackets and spinning endpoint rings; music and social take four brackets; stack chips and calendar cells change colour and border only. Hover runs only for mouse input.
- A touch attention lock gives the panel under a reading line 30% down the viewport its brackets once scrolling stops.
- The current navigation link keeps its corner marks; the reticle moves in place, never slides.
- A theme change from the button opens as a 400ms iris from its centre.
- The dial draws in once per visit; its inner ring turns with scroll; fine pointers tilt it by at most 4°; the now tick moves once a minute.
- The live readouts decode once as their data arrives: the only text scramble on the page, drawn on an aria-hidden mask.
- Section scales draw in as their sections arrive and turn cyan while current.

## Research interpretation

The dial, brackets, and bilingual labels are an original interpretation of the franchise's interface language: thin-line rings tied to a real target, dense real data on a strict grid, and short bilingual register labels. No franchise art, symbol, character, or on-screen text is reproduced; no ring carries text around it or an emblem in its centre; no statuses, file numbers, stamps, or redactions are invented. The WebGL inspection rings of the previous pass were replaced by SVG and CSS rings that echo the dial, work on touch, and cost no GPU context.
