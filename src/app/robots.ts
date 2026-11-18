import type { MetadataRoute } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gwdigitalcompany.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/blog", "/escolas", "/escola/", "/funcionalidades/", "/registar"],
      // Área privada das escolas e páginas de verificação individuais: fora dos motores de busca
      disallow: [
        "/painel", "/alunos", "/turmas", "/notas", "/faltas", "/boletins", "/financas", "/declaracoes",
        "/comunicados", "/equipa", "/configuracoes", "/conta", "/portal", "/plataforma", "/configurar",
        "/verificar/", "/api/", "/auth/",
      ],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
