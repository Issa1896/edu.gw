import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Site } from "@/components/site";
import { Markdown } from "@/lib/markdown";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";

export const revalidate = 300;

async function artigo(slug: string) {
  const supabase = await supabaseServidor();
  const { data: a } = await supabase.from("artigos").select("*").eq("slug", slug).eq("publicado", true).maybeSingle();
  return a;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await artigo((await params).slug);
  if (!a) return { title: "Artigo não encontrado" };
  return {
    title: a.titulo,
    description: a.resumo ?? undefined,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: { title: a.titulo, description: a.resumo ?? undefined, type: "article", images: a.capa_url ? [a.capa_url] : undefined },
  };
}

export default async function Artigo({ params }: { params: Promise<{ slug: string }> }) {
  const a = await artigo((await params).slug);
  if (!a) notFound();
  return (
    <Site>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/blog" className="text-sm text-verde hover:underline">← Blog</Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-verde">{a.categoria}</p>
        <h1 className="mt-2 font-titulo text-4xl font-bold leading-tight sm:text-5xl">{a.titulo}</h1>
        {a.resumo && <p className="mt-4 text-lg text-suave">{a.resumo}</p>}
        <p className="mt-4 text-sm text-suave">{data(a.publicado_em)}{a.autor_nome && ` · ${a.autor_nome}`}</p>
        {a.capa_url && /^https:\/\//.test(a.capa_url) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.capa_url} alt="" className="mt-8 w-full rounded-lg" />
        )}
        <article className="mt-8"><Markdown texto={a.corpo} /></article>
        <div className="mt-12 rounded-lg border border-linha bg-superficie p-6">
          <p className="font-semibold">Quer organizar a sua escola com o edu.gw?</p>
          <p className="mt-1 text-sm text-suave">Matrículas, notas, propinas e declarações num só lugar, no telemóvel.</p>
          <Link href="/registar" className="mt-4 inline-flex rounded-md bg-verde px-4 py-2 text-sm font-semibold text-sobre-verde">Registar escola</Link>
        </div>
      </main>
    </Site>
  );
}
