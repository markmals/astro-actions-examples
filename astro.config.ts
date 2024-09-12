import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import db from "@astrojs/db";

export default defineConfig({
    output: "server",
    integrations: [svelte(), db()],
});
