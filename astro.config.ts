import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";
import db from "@astrojs/db";

export default defineConfig({
    output: "server",
    integrations: [preact(), /*tailwind(),*/ db()],
    experimental: {
        actions: true,
    },
});
