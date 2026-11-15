import Link from "next/link";
import { BotaoLink, Cabecalho, Campo, Tabela, Vazio } from "@/components/ui";
import { BotaoImprimir } from "@/components/imprimir";
import { exigirPapel } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { alunosDaTurma } from "@/lib/atribuicoes";
import { boletins, MAX_NEGATIVAS, situacao } from "@/lib/avaliacao";
import { nota } from "@/lib/formato";

export const metadata = { title: "Boletins e pautas" };

export default async function Pautas({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel("admin", "secretaria", "professor");
  const supabase = await supabaseServidor();
  const { data: turmas } = await supabase.from("turmas").select("id, nome, classes(nome)").eq("ano_letivo_id", s.ano?.id ?? "").order("nome");
  const turma = (turmas ?? []).find((t) => t.id === sp.turma);
  const trimestre = [1, 2, 3].includes(Number(sp.trimestre)) ? Number(sp.trimestre) : undefined;
  const minima = Number(s.escola.nota_minima);

  const alunos = turma ? await alunosDaTurma(turma.id) : [];
  const dados = turma && alunos.length ? await boletins(alunos.map((a) => a.id), turma.id) : null;
  const valor = (l: { t1: number | null; t2: number | null; t3: number | null; media: number | null }) =>
    trimestre ? [l.t1, l.t2, l.t3][trimestre - 1] : l.media;

  return (
    <>
      <div className="nao-imprimir">
        <Cabecalho
          titulo="Boletins e pautas"
          subtitulo={`Aprovação: média ≥ ${minima} com até ${MAX_NEGATIVAS} disciplinas negativas.`}
          acoes={turma && alunos.length > 0 && <>
            <BotaoLink href={`/boletins/turma/${turma.id}`} variante="secundario">Todos os boletins da turma</BotaoLink>
            <BotaoImprimir rotulo="Imprimir pauta" />
          </>}
        />
        <form className="mb-6 flex flex-wrap items-end gap-3">
          <Campo rotulo="Turma">
            <select name="turma" defaultValue={turma?.id ?? ""} className="campo" required>
              <option value="" disabled>Escolha…</option>
              {(turmas ?? []).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Período">
            <select name="trimestre" defaultValue={sp.trimestre ?? ""} className="campo">
              <option value="">Final (média anual)</option>
              <option value="1">1.º trimestre</option><option value="2">2.º trimestre</option><option value="3">3.º trimestre</option>
            </select>
          </Campo>
          <button className="rounded-md border border-linha bg-superficie px-4 py-2 text-sm font-semibold hover:bg-superficie-2">Ver pauta</button>
        </form>
      </div>

      {!turma ? <Vazio titulo="Escolha uma turma para ver a pauta" /> : !dados ? <Vazio titulo="Turma sem alunos" /> : (
        <>
          <div className="mb-3 hidden print:block">
            <p className="text-xs uppercase">{s.escola.nome}</p>
            <h1 className="text-lg font-bold">Pauta {trimestre ? `do ${trimestre}.º trimestre` : "final"} · {turma.nome} · {s.ano?.nome}</h1>
          </div>
          <Tabela>
            <thead>
              <tr>
                <th>N.º</th><th>Aluno</th>
                {dados.discs.map((d) => <th key={d.id} className="text-center" title={d.nome}>{d.nome.split(" ").map((p) => p[0]).join("").slice(0, 4).toUpperCase()}</th>)}
                <th className="text-center">Média</th><th>Situação</th><th className="nao-imprimir" />
              </tr>
            </thead>
            <tbody>
              {alunos.map((a) => {
                const linhas = dados.porMat[a.id];
                const sit = situacao(linhas, minima, trimestre);
                return (
                  <tr key={a.id}>
                    <td className="tabular-nums text-suave">{a.numero_turma ?? "—"}</td>
                    <td className="whitespace-nowrap">{a.alunos.nome}</td>
                    {linhas.map((l) => {
                      const v = valor(l);
                      return <td key={l.disciplina_id} className={`text-center tabular-nums ${v !== null && v < minima ? "text-vermelho" : ""}`}>{nota(v)}</td>;
                    })}
                    <td className="text-center font-semibold tabular-nums">{nota(sit.media)}</td>
                    <td className={sit.aprovado === false ? "font-semibold text-vermelho" : sit.aprovado ? "text-verde" : "text-suave"}>{sit.texto}</td>
                    <td className="nao-imprimir"><Link href={`/boletins/${a.id}`} className="text-verde hover:underline">Boletim</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </Tabela>
          <p className="mt-2 text-xs text-suave">Legenda: {dados.discs.map((d) => `${d.nome.split(" ").map((p) => p[0]).join("").slice(0, 4).toUpperCase()} = ${d.nome}`).join(" · ")}</p>
        </>
      )}
    </>
  );
}
