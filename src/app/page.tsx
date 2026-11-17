import Link from "next/link";
import { BotaoLink } from "@/components/ui";
import { Site } from "@/components/site";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";

const MODULOS = [
  ["Matrículas e processos", "Ficha completa do aluno, encarregados, línguas faladas em casa, transferências e histórico por ano letivo."],
  ["Notas por trimestre", "Escala de 0 a 20, lançamento por turma e disciplina, médias automáticas e pautas prontas a afixar."],
  ["Faltas e assiduidade", "Chamada diária ou por disciplina, faltas justificadas e alertas de excesso."],
  ["Propinas em FCFA", "Mensalidades por classe, bolsas, recibos numerados, Orange Money e MTN MoMo, lista de atrasos."],
  ["Boletins imprimíveis", "Boletim trimestral e anual em A4, com assinatura da direção e do encarregado."],
  ["Portal do encarregado", "Pais e encarregados acompanham notas, faltas, pagamentos e comunicados pelo telemóvel."],
  ["Declarações digitais", "Declarações de matrícula, aproveitamento, conclusão e quitação, com código QR que qualquer pessoa pode verificar."],
  ["Assistente com IA", "Pergunte em português ou kriol: quem está em atraso, como lançar notas, como imprimir boletins."],
  ["Blog e novidades", "Dicas de gestão escolar e novidades do sistema, publicadas pela equipa edu.gw."],
];

export default async function Inicio() {
  const supabase = await supabaseServidor();
  const { data: artigos } = await supabase.from("artigos").select("slug, titulo, resumo, publicado_em").eq("publicado", true).order("publicado_em", { ascending: false }).limit(3);
  return (
    <Site>
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
      <section className="border-t border-linha bg-superficie">
        <div className="mx-auto grid max-w-6xl gap-px px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map(([t, d]) => (
            <div key={t} className="p-5">
              <h2 className="font-semibold">{t}</h2>
              <p className="mt-2 text-sm text-suave">{d}</p>
            </div>
          ))}
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
