export type RefractiveFrame = {
	pointer: readonly [number, number];
	time: number;
	press: readonly [number, number];
	rippleAge: number;
	strength: number;
	color: readonly [number, number, number];
};

const MAX_DPR = 1.5;
const MAX_WIDTH = 1536;
const MAX_HEIGHT = 512;

const vertexShader = `#version 300 es
out vec2 v_uv;

void main() {
	vec2 point = gl_VertexID == 0
		? vec2(-1.0, -1.0)
		: gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0);
	v_uv = point * 0.5 + 0.5;
	gl_Position = vec4(point, 0.0, 1.0);
}
`;

const fragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 out_color;

uniform vec2 u_css_size;
uniform vec2 u_pointer;
uniform float u_time;
uniform vec2 u_press;
uniform float u_ripple_age;
uniform float u_strength;
uniform vec3 u_color;

float ring(float distance, float radius, float width) {
	return 1.0 - smoothstep(width * 0.4, width, abs(distance - radius));
}

void main() {
	const float TAU = 6.283185;
	float size = max(min(u_css_size.x, u_css_size.y), 1.0);
	float entry = clamp(u_time / 0.7, 0.0, 1.0);
	float resolve = 1.0 - pow(1.0 - entry, 3.0);
	vec2 look = (u_pointer - 0.5) * vec2(1.0, -1.0);
	vec2 point = (v_uv - 0.5) * u_css_size;
	vec2 plane = point * vec2(1.0 + look.x * 0.08, 1.0 + look.y * 0.12);
	float radius = size * 0.35 * (1.0 + (1.0 - resolve) * 0.22);
	float distance = length(plane);
	float angle = distance > 0.0001 ? atan(plane.y, plane.x) : 0.0;
	float outerPhase = fract((angle + (1.0 - resolve) * 0.8 + 0.3) / TAU * 3.0);
	float outerSegments = smoothstep(0.08, 0.1, outerPhase) * (1.0 - smoothstep(0.76, 0.78, outerPhase));
	float innerPhase = fract((angle - (1.0 - resolve) * 1.1 - 0.15) / TAU * 2.0);
	float innerSegments = smoothstep(0.04, 0.07, innerPhase) * (1.0 - smoothstep(0.8, 0.83, innerPhase));
	float outer = ring(distance, radius, 1.0) * outerSegments;
	float inner = ring(distance, radius * 0.73, 0.85) * innerSegments;
	float tickPhase = abs(fract(angle / TAU * 24.0 + 0.5) - 0.5);
	float ticks = (1.0 - smoothstep(0.025, 0.065, tickPhase)) * ring(distance, radius + size * 0.065, size * 0.018);
	float scanAngle = entry * TAU - 3.141593;
	float scan = pow(max(cos(angle - scanAngle), 0.0), 36.0) * (1.0 - smoothstep(0.65, 1.0, entry));
	float scanEdge = ring(distance, radius - size * 0.03, size * 0.024) * scan;
	float pulse = 0.0;
	if (u_ripple_age >= 0.0) {
		float age = clamp(u_ripple_age / 0.55, 0.0, 1.0);
		vec2 pressDirection = (u_press - 0.5) * vec2(1.0, -1.0);
		float direction = length(pressDirection) > 0.0001 ? atan(pressDirection.y, pressDirection.x) : 0.0;
		pulse = ring(distance, radius * (0.73 + age * 0.55), 1.2) * (1.0 - age)
			* (0.55 + 0.45 * cos(angle - direction));
	}
	vec2 planeDirection = plane / max(distance, 0.001);
	vec2 lookDirection = look / max(length(look), 0.001);
	float highlight = 0.8 + 0.2 * max(dot(planeDirection, lookDirection), 0.0);
	float signal = outer + inner * 0.6 + ticks * 0.36 + scanEdge * 0.7 + pulse * 0.6;
	// The display lives beside the text; keep its centre clear for the link arrow.
	float clearCenter = smoothstep(size * 0.19, size * 0.23, distance);
	float alpha = min(0.78, signal * highlight) * clearCenter * clamp(u_strength, 0.0, 1.0);
	if (alpha < 0.001) discard;
	out_color = vec4(u_color * alpha, alpha);
}
`;

function compileShader(
	gl: WebGL2RenderingContext,
	type: number,
	source: string,
) {
	const shader = gl.createShader(type);
	if (!shader) return null;

	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	return shader;
}

function unit(value: number) {
	return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function createRefractiveRenderer(canvas: HTMLCanvasElement): {
	resize(width: number, height: number, dpr: number): void;
	draw(frame: RefractiveFrame): void;
	dispose(): void;
} | null {
	const gl = canvas.getContext("webgl2", {
		alpha: true,
		antialias: false,
		depth: false,
		premultipliedAlpha: true,
		preserveDrawingBuffer: false,
		stencil: false,
		powerPreference: "low-power",
	});
	if (!gl) return null;

	const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
	if (!vertex || !fragment) {
		if (vertex) gl.deleteShader(vertex);
		if (fragment) gl.deleteShader(fragment);
		return null;
	}

	const program = gl.createProgram();
	if (!program) {
		gl.deleteShader(vertex);
		gl.deleteShader(fragment);
		return null;
	}

	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		gl.deleteProgram(program);
		return null;
	}

	const cssSize = gl.getUniformLocation(program, "u_css_size");
	const pointer = gl.getUniformLocation(program, "u_pointer");
	const time = gl.getUniformLocation(program, "u_time");
	const press = gl.getUniformLocation(program, "u_press");
	const rippleAge = gl.getUniformLocation(program, "u_ripple_age");
	const strength = gl.getUniformLocation(program, "u_strength");
	const color = gl.getUniformLocation(program, "u_color");
	const vao = gl.createVertexArray();
	if (
		!cssSize ||
		!pointer ||
		!time ||
		!press ||
		!rippleAge ||
		!strength ||
		!color ||
		!vao
	) {
		if (vao) gl.deleteVertexArray(vao);
		gl.deleteProgram(program);
		return null;
	}

	gl.disable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);
	gl.useProgram(program);
	gl.uniform2f(cssSize, 1, 1);
	gl.bindVertexArray(null);

	let disposed = false;

	return {
		resize(width, height, dpr) {
			if (disposed) return;

			const cssWidth = Number.isFinite(width) ? Math.max(1, width) : 1;
			const cssHeight = Number.isFinite(height) ? Math.max(1, height) : 1;
			const requestedDpr = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
			const scale = Math.min(
				MAX_DPR,
				requestedDpr,
				MAX_WIDTH / cssWidth,
				MAX_HEIGHT / cssHeight,
			);
			const bufferWidth = Math.min(
				MAX_WIDTH,
				Math.max(1, Math.round(cssWidth * scale)),
			);
			const bufferHeight = Math.min(
				MAX_HEIGHT,
				Math.max(1, Math.round(cssHeight * scale)),
			);

			if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
				canvas.width = bufferWidth;
				canvas.height = bufferHeight;
			}

			gl.viewport(0, 0, bufferWidth, bufferHeight);
			gl.useProgram(program);
			gl.uniform2f(cssSize, cssWidth, cssHeight);
		},

		draw(frame) {
			if (disposed) return;

			gl.useProgram(program);
			gl.bindVertexArray(vao);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.uniform2f(pointer, unit(frame.pointer[0]), unit(frame.pointer[1]));
			gl.uniform1f(time, Number.isFinite(frame.time) ? frame.time : 0);
			gl.uniform2f(press, unit(frame.press[0]), unit(frame.press[1]));
			gl.uniform1f(
				rippleAge,
				Number.isFinite(frame.rippleAge) ? frame.rippleAge : -1,
			);
			gl.uniform1f(strength, unit(frame.strength));
			gl.uniform3f(
				color,
				unit(frame.color[0]),
				unit(frame.color[1]),
				unit(frame.color[2]),
			);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			gl.bindVertexArray(null);
		},

		dispose() {
			if (disposed) return;
			disposed = true;
			gl.deleteVertexArray(vao);
			gl.deleteProgram(program);
		},
	};
}
