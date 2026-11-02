/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Cores VollonFit Rebrand (Preto, Vermelho e Branco)
        "vollon-black": "#0A0A0A",
        "vollon-card": "#141414",
        "vollon-card-elevated": "#1A1A1A",
        "vollon-border": "#2A2A2A",
        "vollon-red": "#E11D2E",
        "vollon-red-dark": "#9F0012",
        "vollon-red-accent": "#FF3B4A",
        "vollon-text": "#FFFFFF",
        "vollon-text-secondary": "#E5E5E5",
        "vollon-text-muted": "#A3A3A3",

        // Mapeamento dinâmico e compatibilidade com sistema existente
        "surface": "#0A0A0A",
        "background": "#0A0A0A",
        "surface-container": "#141414",
        "surface-container-low": "#101010",
        "surface-container-high": "#1A1A1A",
        "surface-container-highest": "#222222",
        "surface-container-lowest": "#050505",
        "surface-bright": "#2A2A2A",
        "surface-dim": "#0A0A0A",
        
        "primary": "rgb(var(--color-primary, 225 29 46) / <alpha-value>)",
        "primary-container": "rgb(var(--color-primary, 225 29 46) / <alpha-value>)",
        "primary-fixed": "#E11D2E",
        "primary-fixed-dim": "#9F0012",
        "surface-tint": "#E11D2E",
        
        "on-surface": "#FFFFFF",
        "on-background": "#FFFFFF",
        "on-primary": "#FFFFFF",
        "on-primary-container": "#FFFFFF",
        "on-surface-variant": "#A3A3A3",
        "outline": "#2A2A2A",
        "outline-variant": "#2A2A2A",

        "secondary": "#A3A3A3",
        "secondary-container": "#1A1A1A",
        "on-secondary": "#FFFFFF",
        "on-secondary-container": "#E5E5E5",

        "error": "#FF3B4A",
        "error-container": "#93000A",
        "on-error": "#FFFFFF",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "md": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.125rem", // ~18px
        "full": "9999px",
        "4xl": "2rem",
        "5xl": "3rem",
      },
      fontFamily: {
        "display": ["'Barlow Condensed'", "Montserrat", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "sans": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["'Barlow Condensed'", "sans-serif"],
        "headline-lg": ["'Barlow Condensed'", "sans-serif"],
        "headline-md": ["'Barlow Condensed'", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"],
        "data-display": ["'Barlow Condensed'", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        "headline-lg-mobile": ["28px", { "lineHeight": "32px", "fontWeight": "800" }],
        "headline-lg": ["36px", { "lineHeight": "40px", "letterSpacing": "0.02em", "fontWeight": "800" }],
        "label-caps": ["11px", { "lineHeight": "14px", "letterSpacing": "0.08em", "fontWeight": "700" }],
        "body-lg": ["18px", { "lineHeight": "26px", "fontWeight": "400" }],
        "body-md": ["15px", { "lineHeight": "22px", "fontWeight": "400" }],
        "headline-md": ["22px", { "lineHeight": "28px", "fontWeight": "800" }]
      }
    }
  },
  plugins: [],
}
