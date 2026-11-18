import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Site } from "@/components/site";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";

export const revalidate = 120;

type N = { escola: string; slug: string; id: string; titulo: string; resumo: string | null; corpo: string; imagem_url: string | null; publicado_em: string };

async function noticia(slug: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc("noticia_publica", { p_slug: slug.slice(0, 80), p_id: id });
  return data as N | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  const { slug, id } = await params;
  const n = await noticia(slug, id);
  if (!n) return { title: "Notícia não encontrada" };
  return {
    title: `${n.titulo} · ${n.escola}`,
    alternates: { canonical: `/escola/${n.slug}/${n.id}` },
    description: n.resumo ?? n.corpo.slice(0, 160),
    openGraph: { title: n.titulo, description: n.resumo ?? n.corpo.slice(0, 160), type: "article", images: n.imagem_url ? [n.imagem_url] : undefined },
  };
}

export default async function Noticia({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const n = await noticia(slug, id);
  if (!n) notFound();
  const partilha = encodeURIComponent(`${n.titulo} — ${n.escola}`);
  return (
    <Site>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link href={`/escola/${n.slug}`} className="text-sm text-verde hover:underline">← {n.escola}</Link>
        <p className="mt-6 text-sm text-suave">{data(n.publicado_em)}</p>
        <h1 className="mt-1 font-titulo text-4xl font-bold leading-tight">{n.titulo}</h1>
        {n.resumo && <p className="mt-4 text-lg text-suave">{n.resumo}</p>}
        {n.imagem_url && /^https:\/\//.test(n.imagem_url) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.imagem_url} alt="" className="mt-8 w-full rounded-lg" />
        )}
        <article className="mt-8 whitespace-pre-line text-[17px] leading-relaxed">{n.corpo}</article>
        <div className="mt-10 flex flex-wrap gap-3 border-t border-linha pt-6 text-sm">
          <span className="text-suave">Partilhar:</span>
          <a href={`https://wa.me/?text=${partilha}%20https://gwdigitalcompany.com/escola/${n.slug}/${n.id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-verde hover:underline">WhatsApp</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=https://gwdigitalcompany.com/escola/${n.slug}/${n.id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-verde hover:underline">Facebook</a>
        </div>
      </main>
    </Site>
  );
}
