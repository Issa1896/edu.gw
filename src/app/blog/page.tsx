import Link from "next/link";
import { Site } from "@/components/site";
import { Vazio } from "@/components/ui";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";

export const metadata = { title: "Blog", description: "Novidades do edu.gw e ideias para a gestão das escolas da Guiné-Bissau." };
export const revalidate = 300;

export default async function Blog({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const supabase = await supabaseServidor();
  let q = supabase.from("artigos").select("slug, titulo, resumo, categoria, capa_url, autor_nome, publicado_em").eq("publicado", true).order("publicado_em", { ascending: false }).limit(60);
  if (sp.categoria) q = q.eq("categoria", sp.categoria);
  const { data: artigos } = await q;
  const categorias = Array.from(new Set((artigos ?? []).map((a) => a.categoria)));

  return (
    <Site>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-titulo text-4xl font-bold">Blog</h1>
        <p className="mt-2 text-suave">Novidades do edu.gw e ideias para a gestão das escolas da Guiné-Bissau.</p>
        {categorias.length > 1 && (
          <nav className="mt-6 flex flex-wrap gap-2 text-sm">
            <Link href="/blog" className={`rounded-full border px-3 py-1 ${!sp.categoria ? "border-verde bg-verde-claro text-verde" : "border-linha"}`}>Todos</Link>
            {categorias.map((c) => (
              <Link key={c} href={`/blog?categoria=${encodeURIComponent(c)}`} className={`rounded-full border px-3 py-1 ${sp.categoria === c ? "border-verde bg-verde-claro text-verde" : "border-linha"}`}>{c}</Link>
            ))}
          </nav>
        )}
        <div className="mt-8">
          {(artigos ?? []).length === 0 ? <Vazio titulo="Ainda não há artigos publicados" /> : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {artigos!.map((a) => (
                <Link key={a.slug} href={`/blog/${a.slug}`} className="group overflow-hidden rounded-lg border border-linha bg-superficie hover:border-verde">
                  {a.capa_url && /^https:\/\//.test(a.capa_url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.capa_url} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                  )}
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-verde">{a.categoria}</p>
                    <h2 className="mt-1 text-lg font-semibold group-hover:underline">{a.titulo}</h2>
                    {a.resumo && <p className="mt-2 line-clamp-3 text-sm text-suave">{a.resumo}</p>}
                    <p className="mt-3 text-xs text-suave">{data(a.publicado_em)}{a.autor_nome && ` · ${a.autor_nome}`}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </Site>
  );
}
