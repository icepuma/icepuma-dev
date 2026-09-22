const DECODE_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DECODE_LOWER = "abcdefghjkmnpqrstuvwxyz";
const DECODE_DIGITS = "0123456789";

function decodeGlyph(character: string, random: () => number) {
	const glyphs = /[0-9]/.test(character)
		? DECODE_DIGITS
		: /[a-z]/.test(character)
			? DECODE_LOWER
			: /[A-Z]/.test(character)
				? DECODE_UPPER
				: "";
	if (!glyphs) return character;
	return glyphs[Math.floor(random() * glyphs.length)] ?? character;
}

// Resolves text left to right. Unresolved letters and digits borrow a random
// glyph of the same kind; everything else (spaces, colons, dots) holds still,
// so a monospace line never changes width.
export function decodeFrame(
	text: string,
	progress: number,
	random: () => number,
) {
	const characters = Array.from(text);
	const resolved = Math.floor(
		Math.min(1, Math.max(0, progress)) * characters.length,
	);
	return characters
		.map((character, index) =>
			index < resolved ? character : decodeGlyph(character, random),
		)
		.join("");
}

// The host keeps its real text for assistive technology; the scramble is
// drawn by an aria-hidden mask that is removed when the text resolves.
export function decodeOnce(host: HTMLElement, duration = 300) {
	if (host.hasAttribute("data-decoding")) return false;
	if (
		document.hidden ||
		window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
		window.matchMedia("(forced-colors: active)").matches
	)
		return false;
	const text = host.textContent ?? "";
	if (!text.trim()) return false;

	const mask = document.createElement("span");
	mask.className = "decode-mask";
	mask.setAttribute("aria-hidden", "true");
	mask.textContent = decodeFrame(text, 0, Math.random);
	host.setAttribute("data-decoding", "");
	host.append(mask);

	let start: number | undefined;
	let drawn = Number.NEGATIVE_INFINITY;
	const step = (time: number) => {
		start ??= time;
		const progress = Math.min(1, (time - start) / duration);
		if (progress >= 1) {
			mask.remove();
			host.removeAttribute("data-decoding");
			return;
		}
		// About 30 updates a second reads as scanning rather than flicker.
		if (time - drawn >= 33) {
			drawn = time;
			mask.textContent = decodeFrame(
				text,
				1 - (1 - progress) ** 2,
				Math.random,
			);
		}
		window.requestAnimationFrame(step);
	};
	window.requestAnimationFrame(step);
	return true;
}
