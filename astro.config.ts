import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import db from '@astrojs/db';

export default defineConfig({
    output: 'server',
    integrations: [vue(), db()],
});
