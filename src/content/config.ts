import { defineCollection, z } from "astro:content";

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

export const collections = { movies };
