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
                // Natural Gold palette
                walnut: "#1B1810",
                walnutSoft: "#231F17",
                obsidian: "#1A1510",
                gold: "#C9A84C",
                antique: "#E8C97A",
                bronze: "#7A5C2E",
                ivory: "#F5EDD6",
                sage: "#B8C4A8",
                berry: "#5C2D3A",
                ceramic: "#FAF7F2",
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
                    "0%,100%": { boxShadow: "0 0 0 0 rgba(201,168,76,0.35)" },
                    "50%": { boxShadow: "0 0 24px 4px rgba(201,168,76,0.35)" },
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
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
