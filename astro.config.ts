import { defineConfig } from "astro/config";
import db from "@astrojs/db";
import lit from "@astrojs/lit";

export default defineConfig({
    output: "server",
    integrations: [lit(), db()],
});
