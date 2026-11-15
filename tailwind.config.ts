import type { Config } from "tailwindcss";

const cor = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        papel: cor("papel"),
        superficie: cor("superficie"),
        "superficie-2": cor("superficie-2"),
        linha: cor("linha"),
        tinta: cor("tinta"),
        suave: cor("suave"),
        verde: { DEFAULT: cor("verde"), forte: cor("verde-forte"), claro: cor("verde-claro") },
        amarelo: { DEFAULT: cor("amarelo"), claro: cor("amarelo-claro") },
        vermelho: { DEFAULT: cor("vermelho"), claro: cor("vermelho-claro") },
        "sobre-verde": cor("sobre-verde"),
      },
      fontFamily: {
        sans: ["var(--fonte-sans)", "system-ui", "sans-serif"],
        titulo: ["var(--fonte-titulo)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
