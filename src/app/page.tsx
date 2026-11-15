import { BotaoLink, Marca } from "@/components/ui";

const MODULOS = [
  ["Matrículas e processos", "Ficha completa do aluno, encarregados, línguas faladas em casa, transferências e histórico por ano letivo."],
  ["Notas por trimestre", "Escala de 0 a 20, lançamento por turma e disciplina, médias automáticas e pautas prontas a afixar."],
  ["Faltas e assiduidade", "Chamada diária ou por disciplina, faltas justificadas e alertas de excesso."],
  ["Propinas em FCFA", "Mensalidades por classe, bolsas, recibos numerados, Orange Money e MTN MoMo, lista de atrasos."],
  ["Boletins imprimíveis", "Boletim trimestral e anual em A4, com assinatura da direção e do encarregado."],
  ["Portal do encarregado", "Pais e encarregados acompanham notas, faltas, pagamentos e comunicados pelo telemóvel."],
];

export default function Inicio() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Marca />
        <div className="flex gap-2">
          <BotaoLink href="/entrar" variante="secundario">Entrar</BotaoLink>
          <BotaoLink href="/registar">Registar escola</BotaoLink>
        </div>
      </header>
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
      <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-suave">© {new Date().getFullYear()} edu.gw · Bissau</footer>
    </main>
  );
}
