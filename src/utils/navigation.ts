export function initBackToTop() {
	for (const link of document.querySelectorAll<HTMLAnchorElement>(
		"[data-back-to-top]",
	)) {
		link.addEventListener("click", (event) => {
			if (
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			)
				return;
			event.preventDefault();
			document
				.querySelector<HTMLAnchorElement>(".brand")
				?.focus({ preventScroll: true });
			window.history.replaceState(
				null,
				"",
				`${window.location.pathname}${window.location.search}`,
			);
			window.scrollTo({
				top: 0,
				left: 0,
				behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
					? "instant"
					: "smooth",
			});
		});
	}
}

export function initSectionNavigation() {
	const header = document.querySelector<HTMLElement>(".site-header");
	const sections = Array.from(
		document.querySelectorAll<HTMLAnchorElement>(".nav-link"),
	)
		.map((link) => {
			const id = link.hash.slice(1);
			const section = id ? document.getElementById(id) : null;
			return section ? { link, section } : null;
		})
		.filter((item): item is { link: HTMLAnchorElement; section: HTMLElement } =>
			Boolean(item),
		);

	if (!sections.length) return;

	let frame = 0;
	let current: HTMLAnchorElement | null = null;
	let currentSection: HTMLElement | null = null;

	function update() {
		frame = 0;
		// Include the anchor's scroll padding (16px), margin (24px), and rounding.
		const marker = (header?.getBoundingClientRect().bottom ?? 0) + 48;
		const documentHeight = document.documentElement.scrollHeight;
		const atEnd =
			documentHeight > window.innerHeight &&
			window.scrollY + window.innerHeight >= documentHeight;
		let next = atEnd ? sections[sections.length - 1].link : sections[0].link;

		if (!atEnd) {
			for (const item of sections) {
				if (item.section.getBoundingClientRect().top > marker) break;
				next = item.link;
			}
		}

		if (next === current) return;
		const entry = sections.find((item) => item.link === next) ?? null;
		current?.removeAttribute("aria-current");
		currentSection?.removeAttribute("data-current");
		next.setAttribute("aria-current", "location");
		entry?.section.setAttribute("data-current", "");
		current = next;
		currentSection = entry?.section ?? null;
	}

	function schedule() {
		if (!frame) frame = window.requestAnimationFrame(update);
	}

	window.addEventListener("scroll", schedule, { passive: true });
	window.addEventListener("resize", schedule, { passive: true });
	schedule();
}
export function initHeaderState() {
	let frame = 0;
	let scrolled = false;

	function update() {
		frame = 0;
		const next = window.scrollY > 8;
		if (next === scrolled) return;
		scrolled = next;
		const root = document.documentElement;
		if (next) {
			root.setAttribute("data-scrolled", "");
		} else {
			root.removeAttribute("data-scrolled");
		}
	}

	function schedule() {
		if (!frame) frame = window.requestAnimationFrame(update);
	}

	window.addEventListener("scroll", schedule, { passive: true });
	schedule();
}

// Touch screens have no hover, so the panel the reader settles on takes the
// lock-on instead: the one under a reading line 30% down the viewport, once
// scrolling has stopped. One panel at a time, and nothing on hover devices.
export function initAttentionLock() {
	const Observer = window.IntersectionObserver;
	const panels = Array.from(
		document.querySelectorAll<HTMLElement>(".hud-panel"),
	);
	if (typeof Observer !== "function" || !panels.length) return;
	const hover = window.matchMedia("(hover: hover)");
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const inBand = new Set<Element>();
	let sighted: Element | null = null;
	let idle = 0;

	function settle() {
		idle = 0;
		const next =
			hover.matches || reducedMotion.matches
				? null
				: (panels.find((panel) => inBand.has(panel)) ?? null);
		if (next === sighted) return;
		sighted?.removeAttribute("data-sighted");
		next?.setAttribute("data-sighted", "");
		sighted = next;
	}

	function schedule() {
		window.clearTimeout(idle);
		idle = window.setTimeout(settle, 150);
	}

	const observer = new Observer(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) inBand.add(entry.target);
				else inBand.delete(entry.target);
			}
			schedule();
		},
		{ rootMargin: "-30% 0px -69% 0px" },
	);
	for (const panel of panels) observer.observe(panel);
	window.addEventListener("scroll", schedule, { passive: true });
}
