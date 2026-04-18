/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
    theme: {
        extend: {
            fontFamily: {
                display: ["'Cormorant Garamond'", "serif"],
                body: ["'EB Garamond'", "serif"],
                ui: ["'Josefin Sans'", "sans-serif"],
                script: ["'Pinyon Script'", "cursive"],
            },
            colors: {
                // Porcelain Luxury palette (remapped tokens for backwards compatibility)
                walnut: "#2D2420",      // deep text (for text-walnut on light surfaces)
                walnutSoft: "#F5EFE6",  // secondary cream
                obsidian: "#2D2420",    // deep text / footer / modal scrim
                gold: "#B07D62",        // primary terracotta (replaces all gold)
                antique: "#B07D62",     // merged to terracotta
                bronze: "#9C8878",      // muted label
                ivory: "#2D2420",       // deep headings text (was light ivory, now dark)
                sage: "#8FA98C",        // secondary sage accent
                berry: "#B07D62",       // merged to terracotta
                ceramic: "#FFFFFF",     // pure card white
                // New tokens (explicit Porcelain palette)
                terracotta: "#B07D62",
                terracottaDark: "#8F6048",
                cream: "#F5EFE6",
                sageTint: "#EEF2EC",
                blush: "#E8CFC4",
                deepText: "#2D2420",
                bodyText: "#5C4A3A",
                mutedLabel: "#9C8878",
                borderWarm: "#E0D4C8",
                porcelain: "#FDFAF6",
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
