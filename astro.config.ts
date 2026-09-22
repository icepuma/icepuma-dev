import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
	site: import.meta.env.DEV ? "http://localhost:4321" : "https://icepuma.dev",
	output: "static",
	fonts: [
		{
			provider: fontProviders.google(),
			name: "IBM Plex Sans",
			cssVariable: "--font-plex",
			weights: [400, 500, 600],
			styles: ["normal"],
			subsets: ["latin"],
			display: "swap",
		},
		{
			provider: fontProviders.google(),
			name: "Chakra Petch",
			cssVariable: "--font-chakra",
			weights: [600],
			styles: ["normal"],
			subsets: ["latin"],
			display: "swap",
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-jetbrains",
			weights: [400, 500],
			styles: ["normal"],
			subsets: ["latin"],
			display: "swap",
			fallbacks: ["ui-monospace", "monospace"],
		},
	],
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
