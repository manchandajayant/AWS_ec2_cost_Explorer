// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
    darkMode: "class", // <-- crucial
    content: [
        "./app/**/*.{ts,tsx}",
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}", // adjust to your folders
    ],
    theme: {
        extend: {},
    },
    plugins: [],
} satisfies Config;
