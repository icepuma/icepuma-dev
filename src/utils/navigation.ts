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
