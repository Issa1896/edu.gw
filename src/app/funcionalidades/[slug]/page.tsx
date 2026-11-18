import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Site } from "@/components/site";
import { BotaoLink } from "@/components/ui";
import { FUNCIONALIDADES, funcionalidade } from "@/lib/funcionalidades";

export function generateStaticParams() {
  return FUNCIONALIDADES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const f = funcionalidade((await params).slug);
  if (!f) return { title: "Funcionalidade não encontrada" };
  return { title: `${f.titulo} — gestão escolar`, description: f.resumo, alternates: { canonical: `/funcionalidades/${f.slug}` } };
}

export default async function PaginaFuncionalidade({ params }: { params: Promise<{ slug: string }> }) {
  const f = funcionalidade((await params).slug);
  if (!f) notFound();
  const i = FUNCIONALIDADES.indexOf(f);
  const seguinte = FUNCIONALIDADES[(i + 1) % FUNCIONALIDADES.length];

  return (
    <Site>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/#funcionalidades" className="text-sm text-verde hover:underline">← Todas as funcionalidades</Link>
        <div className="mb-6 mt-8 flex h-1.5 w-16 overflow-hidden rounded-full" aria-hidden>
          <span className="flex-1 bg-vermelho" /><span className="flex-1 bg-amarelo" /><span className="flex-1 bg-verde" />
        </div>
        <h1 className="font-titulo text-4xl font-bold leading-tight sm:text-5xl">{f.titulo}</h1>
        <p className="mt-4 max-w-2xl text-lg text-suave">{f.intro}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {f.pontos.map((p) => (
            <section key={p.titulo} className="rounded-lg border border-linha bg-superficie p-5">
              <h2 className="font-semibold">{p.titulo}</h2>
              <p className="mt-2 text-sm leading-relaxed text-suave">{p.texto}</p>
            </section>
          ))}
        </div>

        <p className="mt-8 text-sm"><span className="font-semibold">Quem usa: </span>{f.quem}</p>
        {f.pergunta && (
          <div className="mt-6 rounded-lg bg-amarelo-claro p-5 text-sm">
            <p className="font-semibold">{f.pergunta.p}</p>
            <p className="mt-1">{f.pergunta.r}</p>
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-linha bg-superficie p-6">
          <div>
            <p className="font-semibold">Pronto para organizar a sua escola?</p>
            <p className="text-sm text-suave">Crie a conta da escola em poucos minutos.</p>
          </div>
          <div className="flex gap-2">
            <BotaoLink href="/registar">Registar escola</BotaoLink>
            <BotaoLink href={`/funcionalidades/${seguinte.slug}`} variante="secundario">{seguinte.titulo} →</BotaoLink>
          </div>
        </div>
      </main>
    </Site>
  );
}
