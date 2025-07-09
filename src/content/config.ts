import { defineCollection, z } from "astro:content";

const blog = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.coerce.date(),
		tags: z.array(z.string()).optional(),
		draft: z.boolean().optional(),
	}),
});

const movies = defineCollection({
	type: "data",
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			letterboxdUrl: z.string().url(),
			poster: image(),
			slug: z.string(),
		}),
});

export const collections = { blog, movies };
