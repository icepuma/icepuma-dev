import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: import.meta.env.DEV ? "http://localhost:4321" : "https://icepuma.dev",
	output: "static",
	vite: { plugins: [tailwindcss()] },
});
