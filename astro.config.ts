import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import db from '@astrojs/db';

export default defineConfig({
    output: 'server',
    integrations: [react(), db()],
});
