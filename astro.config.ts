// @ts-check
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	site: import.meta.env.DEV ? "http://localhost:4321" : "https://icepuma.dev",

	adapter: cloudflare({
		imageService: "compile",
		platformProxy: {
			enabled: true,
		},
	}),

	output: "static",

	vite: {
		plugins: [tailwindcss()],
	},
});
