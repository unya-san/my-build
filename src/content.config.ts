import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { describe } from "astro:schema";

const works = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/works",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    technology: z.string(),
    thumbnail: z.string().optional(),
    gamePath: z.string().optional(),
  }),
});

export const collections = {
  works,
};
