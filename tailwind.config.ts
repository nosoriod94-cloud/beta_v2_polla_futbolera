import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pick-pop": {
          "0%":   { transform: "scale(1)" },
          "40%":  { transform: "scale(1.12)" },
          "70%":  { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)" },
        },
        "pts-float": {
          "0%":   { opacity: "0", transform: "translateY(0) scale(0.7)" },
          "30%":  { opacity: "1", transform: "translateY(-12px) scale(1.1)" },
          "70%":  { opacity: "1", transform: "translateY(-20px) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-30px) scale(0.9)" },
        },
        "lock-shake": {
          "0%":   { transform: "rotate(0deg)" },
          "20%":  { transform: "rotate(-6deg)" },
          "50%":  { transform: "rotate(5deg)" },
          "70%":  { transform: "rotate(-3deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "bar-fill": {
          "0%":   { width: "0%" },
          "100%": { width: "var(--bar-width)" },
        },
        "podium-rise": {
          "0%":   { opacity: "0", transform: "translateY(20px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "number-count": {
          "0%":   { opacity: "0", transform: "scale(0.5)" },
          "60%":  { transform: "scale(1.15)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "pick-pop":        "pick-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        "pts-float":       "pts-float 1.2s ease-out forwards",
        "lock-shake":      "lock-shake 0.4s ease-in-out",
        "fade-up":         "fade-up 0.4s ease-out both",
        "bar-fill":        "bar-fill 0.8s cubic-bezier(0.25,1,0.5,1) forwards",
        "podium-rise":     "podium-rise 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        "number-count":    "number-count 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
