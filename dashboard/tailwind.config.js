/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
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
        // Custom schwarz-lila Theme
        'dark-bg': '#0a0a0f',
        'dark-surface': '#1a1a2e',
        'purple-primary': '#8b5cf6',
        'purple-secondary': '#a855f7',
        'purple-accent': '#c084fc',
        'neon-purple': '#e879f9',
        'dark-text': '#e2e8f0',
        'dark-muted': '#64748b',
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(139, 92, 246, 0.8)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "gradient": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "neon-flicker": {
          "0%, 100%": { textShadow: "0 0 10px #e879f9, 0 0 20px #e879f9, 0 0 30px #e879f9" },
          "50%": { textShadow: "0 0 8px #e879f9, 0 0 16px #e879f9, 0 0 24px #e879f9" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "border-pulse": {
          "0%, 100%": { borderColor: "rgba(139, 92, 246, 0.2)" },
          "50%": { borderColor: "rgba(139, 92, 246, 0.5)" },
        },
        "progress": {
          "0%": { width: "100%" },
          "100%": { width: "0%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "slide-in": "slide-in 0.5s ease-out",
        "glow": "glow 2s ease-in-out infinite",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "bounce-slow": "bounce-slow 2s ease-in-out infinite",
        "gradient": "gradient 3s ease infinite",
        "neon-flicker": "neon-flicker 1.5s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "border-pulse": "border-pulse 2s ease-in-out infinite",
        "progress": "progress linear",
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        'gradient-neon': 'linear-gradient(45deg, #8b5cf6, #a855f7, #c084fc, #e879f9)',
        'mesh-purple': 'radial-gradient(at 27% 37%, hsla(271, 91%, 65%, 1) 0px, transparent 0%), radial-gradient(at 97% 21%, hsla(271, 91%, 65%, 1) 0px, transparent 50%), radial-gradient(at 52% 99%, hsla(271, 91%, 65%, 1) 0px, transparent 50%), radial-gradient(at 10% 29%, hsla(271, 91%, 65%, 1) 0px, transparent 50%), radial-gradient(at 97% 96%, hsla(271, 91%, 65%, 1) 0px, transparent 50%), radial-gradient(at 33% 50%, hsla(271, 91%, 65%, 1) 0px, transparent 50%), radial-gradient(at 79% 53%, hsla(271, 91%, 65%, 1) 0px, transparent 50%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(139, 92, 246, 0.6)',
        'neon-strong': '0 0 40px rgba(139, 92, 246, 0.8)',
        'purple-glow': '0 10px 25px -5px rgba(139, 92, 246, 0.3)',
        'green-glow': '0 0 20px rgba(34, 197, 94, 0.6)',
        'red-glow': '0 0 20px rgba(239, 68, 68, 0.6)',
        'yellow-glow': '0 0 20px rgba(234, 179, 8, 0.6)',
        'blue-glow': '0 0 20px rgba(59, 130, 246, 0.6)',
      },
    },
  },
  plugins: [],
} 