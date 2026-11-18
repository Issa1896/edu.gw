import type { MetadataRoute } from "next";
import { supabasePublico } from "@/lib/supabase/publico";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gwdigitalcompany.com").replace(/\/$/, "");
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixas: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/escolas`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/registar`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/verificar`, changeFrequency: "yearly", priority: 0.4 },
  ];
  try {
    const supabase = supabasePublico();
    const [{ data: artigos }, { data: escolas }] = await Promise.all([
      supabase.from("artigos").select("slug, atualizado_em").eq("publicado", true).order("publicado_em", { ascending: false }).limit(1000),
      supabase.rpc("escolas_publicas"),
    ]);
    const lista = (escolas ?? []) as { slug: string; ultima: string | null }[];
    const noticias = await Promise.all(
      lista.slice(0, 200).map(async (e) => {
        const { data } = await supabase.rpc("escola_publica", { p_slug: e.slug, p_limite: 50 });
        const ns = ((data as { noticias?: { id: string; publicado_em: string }[] } | null)?.noticias ?? []);
        return ns.map((n) => ({ url: `${SITE}/escola/${e.slug}/${n.id}`, lastModified: n.publicado_em, changeFrequency: "monthly" as const, priority: 0.5 }));
      }),
    );
    return [
      ...fixas,
      ...(artigos ?? []).map((a) => ({ url: `${SITE}/blog/${a.slug}`, lastModified: a.atualizado_em, changeFrequency: "monthly" as const, priority: 0.7 })),
      ...lista.map((e) => ({ url: `${SITE}/escola/${e.slug}`, lastModified: e.ultima ?? undefined, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...noticias.flat(),
    ];
  } catch {
    return fixas;
  }
}
