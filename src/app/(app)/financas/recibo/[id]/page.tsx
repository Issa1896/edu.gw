import { notFound } from "next/navigation";
import { BotaoLink } from "@/components/ui";
import { BotaoImprimir } from "@/components/imprimir";
import { obterSessao } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data, dinheiro, mesAno } from "@/lib/formato";
import { METODOS, REGIOES } from "@/lib/tipos";

export const metadata = { title: "Recibo" };

const NOME_TIPO: Record<string, string> = { matricula: "Taxa de matrícula", exame: "Exame", uniforme: "Uniforme", outro: "Outro" };

export default async function Recibo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await obterSessao();
  const supabase = await supabaseServidor();
  const { data: p } = await supabase
    .from("pagamentos")
    .select("*, matriculas(id, alunos(nome, numero), turmas(nome), anos_letivos(nome))")
    .eq("id", id)
    .maybeSingle();
  if (!p) notFound();
  // Outros pagamentos registados na mesma operação (vários meses de uma vez)
  const { data: grupo } = await supabase.from("pagamentos").select("*").eq("matricula_id", p.matricula_id).eq("criado_em", p.criado_em).order("numero_recibo");
  const linhas = grupo?.length ? grupo : [p];
  const total = linhas.reduce((t, l) => t + l.valor, 0);
  const m = p.matriculas as unknown as { id: string; alunos: { nome: string; numero: string }; turmas: { nome: string }; anos_letivos: { nome: string } };
  const { data: autor } = p.registado_por ? await supabase.from("perfis").select("nome").eq("user_id", p.registado_por).maybeSingle() : { data: null };
  const numeros = linhas.map((l) => l.numero_recibo);

  return (
    <>
      <div className="nao-imprimir mb-4 flex justify-between">
        {s.perfil.papel !== "encarregado" ? <BotaoLink href={`/financas/pagamento?matricula=${m.id}`} variante="secundario">Voltar</BotaoLink> : <span />}
        <BotaoImprimir rotulo="Imprimir recibo" />
      </div>
      <article className="folha mx-auto max-w-[148mm] rounded-lg border border-linha bg-white p-8 text-[13px] text-black shadow-sm">
        <header className="flex items-start justify-between border-b-2 border-black pb-3">
          <div>
            <h1 className="text-base font-bold">{s.escola.nome}</h1>
            <p className="text-xs">{[s.escola.morada, REGIOES[s.escola.regiao]].filter(Boolean).join(" · ")}</p>
            <p className="text-xs">{[s.escola.telefone, s.escola.nif && `NIF ${s.escola.nif}`].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="text-right">
            <p className="font-titulo text-lg font-bold">Recibo</p>
            <p>N.º {numeros.length > 1 ? `${numeros[0]}–${numeros[numeros.length - 1]}` : numeros[0]}</p>
            <p>{data(p.data_pagamento)}</p>
          </div>
        </header>
        <p className="my-4">
          Recebemos de encarregado(a) de educação do(a) aluno(a) <strong>{m.alunos.nome}</strong> (processo n.º {m.alunos.numero}),
          turma {m.turmas.nome}, ano letivo {m.anos_letivos.nome}, a quantia de <strong>{dinheiro(total)}</strong>, referente a:
        </p>
        <table className="w-full border-collapse">
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id}>
                <td className="border-b border-neutral-300 py-1">{l.tipo === "propina" ? `Propina de ${mesAno(l.mes_referencia)}` : NOME_TIPO[l.tipo]}</td>
                <td className="border-b border-neutral-300 py-1 text-right tabular-nums">{dinheiro(l.valor)}</td>
              </tr>
            ))}
            <tr><td className="pt-2 font-bold">Total</td><td className="pt-2 text-right font-bold tabular-nums">{dinheiro(total)}</td></tr>
          </tbody>
        </table>
        <p className="mt-4 text-xs">Forma de pagamento: {METODOS[p.metodo]}{p.referencia && ` · Ref. ${p.referencia}`}</p>
        {p.observacao && <p className="text-xs">Obs.: {p.observacao}</p>}
        <footer className="mt-12 flex justify-between gap-8 text-xs">
          <p>Emitido por: {autor?.nome ?? "—"}</p>
          <div className="w-48 text-center"><div className="mb-1 border-t border-black" />A Tesouraria</div>
        </footer>
      </article>
    </>
  );
}
