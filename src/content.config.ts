import { defineCollection, z } from "astro:content";
import { file, glob } from "astro/loaders";

const projects = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
	schema: z.object({
		name: z.string(),
		url: z.string().url(),
		order: z.number(),
	}),
});

const stack = defineCollection({
	loader: file("src/content/stack/stack.yaml"),
	schema: z.object({
		category: z.string(),
		items: z.array(z.string()),
	}),
});

const calendar = defineCollection({
	loader: file("src/content/calendar/schedule.yaml"),
	schema: z.object({
		day: z.string(),
		focus: z.string(),
		url: z.string().url().optional(),
	}),
});

const socials = defineCollection({
	loader: file("src/content/socials/links.yaml"),
	schema: z.object({
		platform: z.string(),
		handle: z.string(),
		url: z.string().url(),
	}),
});

export const collections = { projects, stack, calendar, socials };
