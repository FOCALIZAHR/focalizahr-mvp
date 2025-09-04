/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
    // AGREGADO: Path específico para componentes de encuesta
    './src/components/survey/**/*.{js,ts,jsx,tsx}',
  ],
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
      colors: {
        // Sistema de diseño FocalizaHR
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
        // Colores específicos FocalizaHR
        focalizahr: {
          primary: "#22D3EE", // Cyan brillante
          secondary: "#A78BFA", // Violeta
          dark: "#0D1117", // Fondo oscuro
          surface: "#161B22", // Superficie oscura
          text: "#E6EDF3", // Texto claro
          "text-secondary": "#7D8590", // Texto secundario
        },
        // ✅ COLORES TREMOR CORPORATIVOS AGREGADOS
        'focalizahr-cyan': '#22D3EE',
        'focalizahr-purple': '#A78BFA',
        'focalizahr-slate': '#334155',
        'focalizahr-slate-600': '#475569',
        
        // 🎨 NUEVO: Colores específicos para sistema de encuestas premium
        'survey': {
          cyan: '#22D3EE',
          'cyan-light': '#22D3EE20',
          'cyan-dark': '#0891B2',
          purple: '#A78BFA',
          'purple-light': '#A78BFA20',
          'purple-dark': '#7C3AED',
        }
      },
      backgroundImage: {
        // Gradiente principal FocalizaHR
        'gradient-focalizahr': 'linear-gradient(90deg, #22D3EE 0%, #A78BFA 100%)',
        'gradient-focalizahr-dark': 'linear-gradient(90deg, #0891B2 0%, #7C3AED 100%)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // 🎯 NUEVO: Altura específica para header de encuestas
      spacing: {
        '15': '3.75rem', // 60px para header
      },
      // 💫 NUEVO: Sombras premium para encuestas
      boxShadow: {
        'survey-glow': '0 0 20px rgba(34, 211, 238, 0.15)',
        'survey-glow-lg': '0 0 40px rgba(34, 211, 238, 0.2)',
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
        "pulse-soft": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.8",
          },
        },
        "slide-in": {
          from: {
            transform: "translateX(-100%)",
          },
          to: {
            transform: "translateX(0)",
          },
        },
        
        // 🚀 NUEVO: Animaciones premium para encuestas
        'survey-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'survey-ripple': {
          '0%': { 
            transform: 'scale(1)', 
            opacity: '0.3' 
          },
          '100%': { 
            transform: 'scale(2)', 
            opacity: '0' 
          }
        },
        'survey-pulse': {
          '0%, 100%': { 
            opacity: '1',
            transform: 'scale(1)'
          },
          '50%': { 
            opacity: '0.8',
            transform: 'scale(1.05)'
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slide-in 0.3s ease-out",
        
        // 🎬 NUEVO: Animaciones de encuestas
        'survey-shimmer': 'survey-shimmer 2s ease-in-out infinite',
        'survey-ripple': 'survey-ripple 1.5s ease-out infinite',
        'survey-pulse': 'survey-pulse 2s ease-in-out infinite',
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}