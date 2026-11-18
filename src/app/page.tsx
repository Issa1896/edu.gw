import Link from "next/link";
import { BotaoLink } from "@/components/ui";
import { Site } from "@/components/site";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";
import { FUNCIONALIDADES } from "@/lib/funcionalidades";



export const metadata = { alternates: { canonical: "/" } };

export default async function Inicio() {
  const supabase = await supabaseServidor();
  const { data: artigos } = await supabase.from("artigos").select("slug, titulo, resumo, publicado_em").eq("publicado", true).order("publicado_em", { ascending: false }).limit(3);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "GW Digital Company", url: "https://gwdigitalcompany.com", logo: "https://gwdigitalcompany.com/icons/icon.svg" },
      {
        "@type": "SoftwareApplication",
        name: "edu.gw",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web, Android, iOS",
        inLanguage: "pt",
        areaServed: { "@type": "Country", name: "Guiné-Bissau" },
        description: "Sistema de gestão escolar para escolas da Guiné-Bissau: matrículas, notas, faltas, boletins, propinas em FCFA, declarações digitais e portal do encarregado.",
        url: "https://gwdigitalcompany.com",
        publisher: { "@type": "Organization", name: "GW Digital Company" },
      },
    ],
  };
  return (
    <Site>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:pt-20">
        <div className="mb-6 flex h-1.5 w-24 overflow-hidden rounded-full" aria-hidden>
          <span className="flex-1 bg-vermelho" /><span className="flex-1 bg-amarelo" /><span className="flex-1 bg-verde" />
        </div>
        <h1 className="max-w-3xl font-titulo text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          A secretaria da sua escola, organizada e no telemóvel.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-suave">
          edu.gw é um sistema de gestão escolar pensado para a realidade da Guiné-Bissau: classes da 1.ª à 12.ª,
          notas de 0 a 20 por trimestre, propinas em FCFA com pagamentos móveis, e leve o suficiente para redes lentas.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <BotaoLink href="/registar">Começar agora</BotaoLink>
          <BotaoLink href="/entrar" variante="secundario">Já tenho conta</BotaoLink>
        </div>
      </section>
      <section id="funcionalidades" className="scroll-mt-4 border-t border-linha bg-superficie">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-6 font-titulo text-2xl font-bold">O que o edu.gw faz pela sua escola</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FUNCIONALIDADES.map((f) => (
              <Link key={f.slug} href={`/funcionalidades/${f.slug}`} className="group rounded-lg border border-linha bg-papel p-5 transition hover:border-verde hover:bg-superficie">
                <h3 className="font-semibold group-hover:text-verde">{f.titulo}</h3>
                <p className="mt-2 text-sm text-suave">{f.resumo}</p>
                <p className="mt-3 text-sm font-medium text-verde">Saber mais →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {(artigos ?? []).length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-titulo text-2xl font-bold">Do nosso blog</h2>
            <Link href="/blog" className="text-sm font-medium text-verde hover:underline">Ver todos</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {artigos!.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="rounded-lg border border-linha bg-superficie p-5 hover:border-verde">
                <p className="text-xs text-suave">{data(a.publicado_em)}</p>
                <h3 className="mt-1 font-semibold">{a.titulo}</h3>
                {a.resumo && <p className="mt-2 line-clamp-3 text-sm text-suave">{a.resumo}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
    </Site>
  );
}
