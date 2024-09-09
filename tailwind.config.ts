import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

export default {
    content: ["./src/**/*.{astro,tsx}"],
    plugins: [forms()],
} satisfies Config;
