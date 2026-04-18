/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
    theme: {
        extend: {
            fontFamily: {
                display: ["'Cormorant Garamond'", "serif"],
                editorial: ["'Italiana'", "'Cormorant Garamond'", "serif"],
                body: ["'EB Garamond'", "serif"],
                ui: ["'Josefin Sans'", "sans-serif"],
                script: ["'Pinyon Script'", "cursive"],
            },
            colors: {
                // Teal Atelier palette (remapped tokens for backwards compatibility)
                walnut: "#1A2E2E",      // deep text (was used for text on light)
                walnutSoft: "#EEF5F4",  // sage mist secondary
                obsidian: "#1A2E2E",    // atelier dark / footer / modal scrim
                gold: "#2A7E7C",        // PRIMARY TEAL (replaces all terracotta)
                antique: "#2A7E7C",     // merged to teal
                bronze: "#7A9E9C",      // muted teal label
                ivory: "#1A2E2E",       // deep headings text on light
                sage: "#7A9E9C",        // muted teal
                berry: "#C4A35A",       // ANTIQUE GOLD — prices/accent labels
                ceramic: "#FFFFFF",     // pure card white
                // New Teal Atelier tokens (explicit)
                teal: "#2A7E7C",
                tealDeep: "#1E5C5A",
                tealWash: "#E6F4F3",
                tealBorder: "#C8DEDD",
                sageMist: "#EEF5F4",
                parchment: "#FAF8F4",
                atelierDark: "#1A2E2E",
                antiqueGold: "#C4A35A",
                terracotta: "#B07D62",  // reserved for gift card accent ONLY
                terracottaDark: "#1E5C5A",  // remapped to deep teal for hover states
                cream: "#FAF8F4",
                blush: "#E6F4F3",
                deepText: "#1A2E2E",
                bodyText: "#3D5C5A",
                mutedLabel: "#7A9E9C",
                borderWarm: "#C8DEDD",
                porcelain: "#FFFFFF",
                // shadcn tokens (kept for components)
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
                "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
                "gold-pulse": {
                    "0%,100%": { boxShadow: "0 0 0 0 rgba(176,125,98,0.35)" },
                    "50%": { boxShadow: "0 0 24px 4px rgba(176,125,98,0.35)" },
                },
                "soft-float": {
                    "0%,100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-6px)" },
                },
                "terracotta-glow": {
                    "0%,100%": { boxShadow: "0 4px 16px rgba(176,125,98,0.18)" },
                    "50%": { boxShadow: "0 8px 32px rgba(176,125,98,0.32)" },
                },
                "blur-reveal": {
                    "0%": { opacity: "0", filter: "blur(10px)", transform: "translateY(10px)" },
                    "100%": { opacity: "1", filter: "blur(0px)", transform: "translateY(0)" },
                },
                "scale-in": {
                    "0%": { opacity: "0", transform: "scale(0.94)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                "arc-draw": { "0%": { strokeDashoffset: "300" }, "100%": { strokeDashoffset: "0" } },
                "fade-up": {
                    "0%": { opacity: "0", transform: "translateY(14px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "float-up": {
                    "0%": { transform: "translateY(0)", opacity: "0.2" },
                    "100%": { transform: "translateY(-80px)", opacity: "0" },
                },
                marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "gold-pulse": "gold-pulse 2.4s ease-in-out infinite",
                "float-up": "float-up 6s linear infinite",
                marquee: "marquee 40s linear infinite",
                "soft-float": "soft-float 4s ease-in-out infinite",
                "terracotta-glow": "terracotta-glow 2.8s ease-in-out infinite",
                "blur-reveal": "blur-reveal 700ms cubic-bezier(0.22,1,0.36,1) both",
                "scale-in": "scale-in 500ms cubic-bezier(0.22,1,0.36,1) both",
                "fade-up": "fade-up 600ms cubic-bezier(0.22,1,0.36,1) both",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
