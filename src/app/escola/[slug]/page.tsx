import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Site } from "@/components/site";
import { Vazio } from "@/components/ui";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";
import { REGIOES } from "@/lib/tipos";

export const revalidate = 120;

type Noticia = { id: string; titulo: string; resumo: string | null; inicio: string; imagem_url: string | null; publicado_em: string };
type Escola = { nome: string; sigla: string | null; tipo: string; regiao: string; setor: string | null; morada: string | null; telefone: string | null; email: string | null; diretor: string | null; descricao: string | null; slug: string; noticias: Noticia[] };

const TIPOS: Record<string, string> = { publica: "Escola pública", privada: "Escola privada", comunitaria: "Escola comunitária", confessional: "Escola confessional", autogestao: "Escola de autogestão" };

async function escola(slug: string) {
  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc("escola_publica", { p_slug: slug.slice(0, 80), p_limite: 50 });
  return data as Escola | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await escola((await params).slug);
  if (!e) return { title: "Escola não encontrada" };
  return { title: e.nome, description: e.descricao ?? `Notícias e avisos de ${e.nome}.`, alternates: { canonical: `/escola/${e.slug}` } };
}

export default async function PaginaEscola({ params }: { params: Promise<{ slug: string }> }) {
  const e = await escola((await params).slug);
  if (!e) notFound();
  const [destaque, ...resto] = e.noticias;

  return (
    <Site>
      <section className="border-b border-linha bg-superficie">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Link href="/escolas" className="text-sm text-verde hover:underline">← Escolas</Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-verde">{TIPOS[e.tipo] ?? "Escola"} · {REGIOES[e.regiao] ?? e.regiao}{e.setor && ` · ${e.setor}`}</p>
          <h1 className="mt-2 font-titulo text-4xl font-bold leading-tight sm:text-5xl">{e.nome}</h1>
          {e.descricao && <p className="mt-4 max-w-2xl text-lg text-suave">{e.descricao}</p>}
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {e.morada && <div><dt className="inline text-suave">Morada: </dt><dd className="inline">{e.morada}</dd></div>}
            {e.telefone && <div><dt className="inline text-suave">Telefone: </dt><dd className="inline"><a href={`tel:${e.telefone.replace(/\s/g, "")}`} className="text-verde hover:underline">{e.telefone}</a></dd></div>}
            {e.email && <div><dt className="inline text-suave">Email: </dt><dd className="inline"><a href={`mailto:${e.email}`} className="text-verde hover:underline">{e.email}</a></dd></div>}
            {e.diretor && <div><dt className="inline text-suave">Direção: </dt><dd className="inline">{e.diretor}</dd></div>}
          </dl>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-titulo text-2xl font-bold">Notícias e avisos</h2>
          <Link href="/entrar" className="text-sm text-verde hover:underline">Encarregado de educação? Entre para ver notas e propinas</Link>
        </div>
        {!destaque ? <Vazio titulo="Esta escola ainda não publicou notícias" /> : (
          <>
            <Link href={`/escola/${e.slug}/${destaque.id}`} className="group grid gap-6 overflow-hidden rounded-lg border border-linha bg-superficie hover:border-verde md:grid-cols-2">
              {destaque.imagem_url && /^https:\/\//.test(destaque.imagem_url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={destaque.imagem_url} alt="" className="h-full max-h-72 w-full object-cover" />
              )}
              <div className="p-6">
                <p className="text-xs text-suave">{data(destaque.publicado_em)}</p>
                <h3 className="mt-1 text-2xl font-semibold group-hover:underline">{destaque.titulo}</h3>
                <p className="mt-3 line-clamp-4 text-suave">{destaque.resumo ?? destaque.inicio}</p>
              </div>
            </Link>
            {resto.length > 0 && (
              <ul className="mt-6 divide-y divide-linha rounded-lg border border-linha bg-superficie">
                {resto.map((n) => (
                  <li key={n.id}>
                    <Link href={`/escola/${e.slug}/${n.id}`} className="flex gap-4 p-4 hover:bg-superficie-2">
                      <span className="w-24 shrink-0 text-xs text-suave">{data(n.publicado_em)}</span>
                      <span>
                        <span className="font-semibold">{n.titulo}</span>
                        <span className="mt-1 block line-clamp-2 text-sm text-suave">{n.resumo ?? n.inicio}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </Site>
  );
}
