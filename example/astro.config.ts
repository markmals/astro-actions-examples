import { defineConfig } from "astro/config";
import solid from "@astrojs/solid-js";
import db from "@astrojs/db";

export default defineConfig({
    output: "server",
    integrations: [solid(), db()],
    experimental: { actions: true },
});
