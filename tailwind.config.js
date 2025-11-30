/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-primary': '#00A9FF',
                'brand-secondary': '#A0E9FF',
                'dark-bg': '#121212',
                'dark-surface': '#1e1e1e',
                'dark-card': '#2a2a2a',
                'dark-text': '#e0e0e0',
                'dark-text-secondary': '#a0a0a0',
            }
        },
    },
    plugins: [],
}
