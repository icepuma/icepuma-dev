import type { RefractiveFrame } from "@/utils/refractive-renderer";
import { createRefractiveRenderer } from "@/utils/refractive-renderer";

export function initRefractiveLight() {
	const targets = document.querySelectorAll<HTMLElement>("[data-inspect-link]");
	const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const reducedTransparency = window.matchMedia(
		"(prefers-reduced-transparency: reduce)",
	);
	const forcedColors = window.matchMedia("(forced-colors: active)");
	const canCheckTransition =
		window.CSS?.supports("selector(:active-view-transition)") ?? false;
	const canvas = document.createElement("canvas");
	canvas.className = "refractive-light";
	canvas.setAttribute("aria-hidden", "true");

	let renderer: ReturnType<typeof createRefractiveRenderer> = null;
	let unavailable = false;
	let active: HTMLElement | null = null;
	let activeSurface: HTMLElement | null = null;
	let anchorBounds: DOMRect;
	let frameId = 0;
	let lastTime = 0;
	let wantedStrength = 0;
	let targetPoint: [number, number] = [0.5, 0.5];
	let pressTime = -1;
	let activationTime = 0;
	const frame: RefractiveFrame = {
		pointer: [0.5, 0.5],
		press: [0.5, 0.5],
		rippleAge: -1,
		strength: 0,
		time: 0,
		color: [0, 0, 0],
	};

	function allowed() {
		return (
			finePointer.matches &&
			!reducedMotion.matches &&
			!reducedTransparency.matches &&
			!forcedColors.matches &&
			!document.hidden &&
			(!canCheckTransition ||
				!document.documentElement.matches(":active-view-transition"))
		);
	}

	function clear() {
		if (frameId) window.cancelAnimationFrame(frameId);
		frameId = 0;
		lastTime = 0;
		pressTime = -1;
		activationTime = 0;
		wantedStrength = 0;
		frame.strength = 0;
		frame.time = 0;
		canvas.remove();
		activeSurface?.classList.remove("refractive-surface");
		activeSurface = null;
		active = null;
	}

	function schedule() {
		if (!frameId) frameId = window.requestAnimationFrame(draw);
	}

	function draw(time: number) {
		frameId = 0;
		if (!active || !renderer || !allowed()) {
			clear();
			return;
		}
		const elapsed = Math.min(lastTime ? time - lastTime : 16, 50);
		lastTime = time;
		const follow = 1 - Math.exp(-elapsed / 55);
		frame.pointer = [
			frame.pointer[0] + (targetPoint[0] - frame.pointer[0]) * follow,
			frame.pointer[1] + (targetPoint[1] - frame.pointer[1]) * follow,
		];
		frame.strength +=
			(wantedStrength - frame.strength) * (1 - Math.exp(-elapsed / 65));
		frame.time = Math.max(0, (time - activationTime) / 1000);
		frame.rippleAge = pressTime < 0 ? -1 : (time - pressTime) / 1000;
		renderer.draw(frame);

		if (!wantedStrength && frame.strength < 0.005) {
			clear();
			return;
		}
		const distance = Math.hypot(
			(targetPoint[0] - frame.pointer[0]) * anchorBounds.width,
			(targetPoint[1] - frame.pointer[1]) * anchorBounds.height,
		);
		if (
			frame.time < 0.7 ||
			distance > 0.25 ||
			Math.abs(wantedStrength - frame.strength) > 0.005 ||
			(frame.rippleAge >= 0 && frame.rippleAge < 0.55)
		)
			schedule();
	}

	function point(event: PointerEvent): [number, number] {
		return [
			Math.max(
				0,
				Math.min(
					1,
					(event.clientX - anchorBounds.left) / Math.max(1, anchorBounds.width),
				),
			),
			Math.max(
				0,
				Math.min(
					1,
					(event.clientY - anchorBounds.top) / Math.max(1, anchorBounds.height),
				),
			),
		];
	}

	function activate(
		element: HTMLElement,
		surface: HTMLElement,
		event: PointerEvent,
	) {
		if (event.pointerType === "touch" || !allowed() || unavailable)
			return false;
		if (active === element && activeSurface === surface) {
			wantedStrength = 1;
			targetPoint = point(event);
			schedule();
			return true;
		}
		clear();
		try {
			renderer ??= createRefractiveRenderer(canvas);
		} catch {
			unavailable = true;
		}
		if (!renderer) {
			unavailable = true;
			return false;
		}
		anchorBounds = element.getBoundingClientRect();
		const surfaceBounds = surface.getBoundingClientRect();
		if (
			anchorBounds.width <= 0 ||
			anchorBounds.height <= 0 ||
			surfaceBounds.width <= 0 ||
			surfaceBounds.height <= 0
		)
			return false;
		const primary = window
			.getComputedStyle(document.documentElement)
			.getPropertyValue("--primary")
			.trim();
		if (!/^#[\da-f]{6}$/i.test(primary)) return false;
		frame.color = [1, 3, 5].map(
			(offset) => Number.parseInt(primary.slice(offset, offset + 2), 16) / 255,
		) as [number, number, number];
		active = element;
		activeSurface = surface;
		targetPoint = point(event);
		frame.pointer = targetPoint;
		frame.rippleAge = -1;
		frame.time = 0;
		activationTime = window.performance.now();
		wantedStrength = 1;
		renderer.resize(
			surfaceBounds.width,
			surfaceBounds.height,
			window.devicePixelRatio,
		);
		surface.classList.add("refractive-surface");
		surface.append(canvas);
		schedule();
		return true;
	}

	for (const element of targets) {
		const surface = element.querySelector<HTMLElement>(
			"[data-inspection-surface]",
		);
		if (!surface) continue;
		element.addEventListener("pointerenter", (event) =>
			activate(element, surface, event),
		);
		element.addEventListener("pointermove", (event) =>
			activate(element, surface, event),
		);
		element.addEventListener("pointerleave", () => {
			if (active !== element) return;
			wantedStrength = 0;
			schedule();
		});
		element.addEventListener("pointerdown", (event) => {
			if (event.button !== 0 || !activate(element, surface, event)) return;
			frame.press = point(event);
			pressTime = window.performance.now();
			schedule();
		});
	}

	canvas.addEventListener("webglcontextlost", (event) => {
		event.preventDefault();
		clear();
		renderer?.dispose();
		renderer = null;
		unavailable = true;
	});
	canvas.addEventListener("webglcontextrestored", () => {
		unavailable = false;
	});
	for (const preference of [
		finePointer,
		reducedMotion,
		reducedTransparency,
		forcedColors,
	])
		preference.addEventListener("change", clear);
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", clear);
	window.addEventListener("theme-change", clear);
	window.addEventListener("blur", clear);
	window.addEventListener("resize", clear, { passive: true });
	document.addEventListener("scroll", clear, { passive: true, capture: true });
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) clear();
	});
	document.addEventListener("keydown", (event) => {
		if (event.key === "Tab") clear();
	});
	document.addEventListener(
		"pointerdown",
		(event) => {
			if (event.pointerType === "touch") clear();
		},
		{ passive: true },
	);
}
