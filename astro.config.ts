import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
	site: import.meta.env.DEV ? "http://localhost:4321" : "https://icepuma.dev",
	output: "static",
	integrations: [
		mdx({
			optimize: true,
		}),
		sitemap({
			changefreq: "weekly",
			priority: 0.7,
			filter: (page) => !page.includes("/drafts/"),
		}),
	],
	vite: { plugins: [tailwindcss()] },
	prefetch: {
		prefetchAll: true,
		defaultStrategy: "viewport",
	},
	scopedStyleStrategy: "where",
});
