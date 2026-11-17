import { notFound } from "next/navigation";
import { Aviso, Botao, BotaoLink } from "@/components/ui";
import { BotaoImprimir } from "@/components/imprimir";
import { DocumentoDeclaracao } from "@/components/declaracao";
import { obterSessao } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { urlSite } from "@/lib/site";
import { data } from "@/lib/formato";
import type { ConteudoDeclaracao, TipoDeclaracao } from "@/lib/declaracoes";
import { anularDeclaracao } from "../acoes";

export const metadata = { title: "Declaração" };

export default async function Declaracao({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const s = await obterSessao(); // encarregados também veem as dos seus educandos (RLS)
  const supabase = await supabaseServidor();
  const { data: d } = await supabase.from("declaracoes").select("*, matriculas(aluno_id)").eq("id", id).maybeSingle();
  if (!d) notFound();
  const pode = ["admin", "secretaria"].includes(s.perfil.papel);
  const alunoId = (d.matriculas as { aluno_id: string } | null)?.aluno_id;

  return (
    <>
      <div className="nao-imprimir mb-4 flex flex-wrap items-center justify-between gap-3">
        {s.perfil.papel !== "encarregado" && alunoId ? <BotaoLink href={`/alunos/${alunoId}`} variante="secundario">Voltar à ficha</BotaoLink> : <span />}
        <BotaoImprimir rotulo="Imprimir / guardar PDF" />
      </div>
      <div className="nao-imprimir"><Aviso ok={sp.ok} erro={sp.erro} /></div>
      {d.anulada_em && (
        <p className="nao-imprimir mb-4 rounded-md bg-vermelho-claro px-4 py-3 text-sm text-vermelho">
          Anulada em {data(d.anulada_em)}: {d.motivo_anulacao}
        </p>
      )}
      <DocumentoDeclaracao
        tipo={d.tipo as TipoDeclaracao}
        c={d.conteudo as ConteudoDeclaracao}
        finalidade={d.finalidade}
        codigo={d.codigo}
        emitida_em={d.emitida_em}
        emitida_por_nome={d.emitida_por_nome}
        urlVerificacao={`${await urlSite()}/verificar/${d.codigo}`}
        anulada={!!d.anulada_em}
      />
      {pode && !d.anulada_em && (
        <details className="nao-imprimir mx-auto mt-6 max-w-[210mm]">
          <summary className="cursor-pointer text-sm text-vermelho">Anular esta declaração</summary>
          <form action={anularDeclaracao.bind(null, id)} className="mt-3 flex flex-wrap gap-2">
            <input name="motivo" required placeholder="Motivo (ex.: dados errados, aluno transferido)" className="campo max-w-md" />
            <Botao variante="perigo">Anular</Botao>
          </form>
        </details>
      )}
    </>
  );
}
