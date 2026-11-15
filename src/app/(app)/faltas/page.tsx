import { Aviso, Botao, Cabecalho, Campo, Cartao, Etiqueta, Tabela, Vazio } from "@/components/ui";
import { exigirPapel } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { alunosDaTurma, atribuicoes } from "@/lib/atribuicoes";
import { data as fmtData, hojeISO } from "@/lib/formato";
import { abrirChamada, guardarChamada } from "./acoes";

export const metadata = { title: "Faltas" };

export default async function Faltas({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel("admin", "secretaria", "professor");
  const supabase = await supabaseServidor();
  const gere = s.perfil.papel !== "professor";
  const lista = await atribuicoes(s);

  // Turmas disponíveis: gestão vê todas; professor as suas + as que dirige
  const { data: todasTurmas } = await supabase.from("turmas").select("id, nome, diretor_turma").eq("ano_letivo_id", s.ano?.id ?? "").order("nome");
  const turmas = (todasTurmas ?? []).filter((t) => gere || t.diretor_turma === s.userId || lista.some((a) => a.turma_id === t.id));
  const turma = turmas.find((t) => t.id === sp.turma);
  const discDaTurma = lista.filter((a) => a.turma_id === turma?.id);
  const disciplina = discDaTurma.find((d) => d.disciplina_id === sp.disciplina) ?? null;
  const podeDiaria = gere || turma?.diretor_turma === s.userId;
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(sp.data ?? "") ? sp.data : hojeISO();

  let alunos: Awaited<ReturnType<typeof alunosDaTurma>> = [];
  const marcadas: Record<string, { justificada: boolean; motivo: string | null }> = {};
  const totais: Record<string, { t: number; i: number }> = {};
  if (turma && (disciplina || podeDiaria)) {
    alunos = await alunosDaTurma(turma.id);
    const ids = alunos.map((a) => a.id);
    let q = supabase.from("faltas").select("matricula_id, justificada, motivo").in("matricula_id", ids).eq("data", dia);
    q = disciplina ? q.eq("disciplina_id", disciplina.disciplina_id) : q.is("disciplina_id", null);
    const [{ data: hoje }, { data: todas }] = await Promise.all([q, supabase.from("faltas").select("matricula_id, justificada").in("matricula_id", ids)]);
    for (const f of hoje ?? []) marcadas[f.matricula_id] = f;
    for (const f of todas ?? []) { const x = (totais[f.matricula_id] ??= { t: 0, i: 0 }); x.t++; if (!f.justificada) x.i++; }
  }

  return (
    <>
      <Cabecalho titulo="Faltas e chamada" subtitulo="Registe a chamada por disciplina, ou a chamada diária (diretor de turma)." />
      <Aviso ok={sp.ok} erro={sp.erro} />
      {turmas.length === 0 ? <Vazio titulo="Sem turmas disponíveis" /> : (
        <form action={abrirChamada} className="mb-6 flex flex-wrap items-end gap-3">
          <Campo rotulo="Turma">
            <select name="turma" defaultValue={turma?.id ?? ""} className="campo" required>
              <option value="" disabled>Escolha…</option>
              {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </Campo>
          {turma && (
            <Campo rotulo="Disciplina">
              <select name="disciplina" defaultValue={disciplina?.disciplina_id ?? ""} className="campo">
                {podeDiaria && <option value="">Chamada diária</option>}
                {discDaTurma.map((d) => <option key={d.disciplina_id} value={d.disciplina_id}>{d.disciplina}</option>)}
              </select>
            </Campo>
          )}
          <Campo rotulo="Data"><input type="date" name="data" defaultValue={dia} max={hojeISO()} className="campo" /></Campo>
          <Botao variante="secundario">Abrir</Botao>
        </form>
      )}

      {turma && alunos.length > 0 && (
        <Cartao titulo={`${turma.nome} · ${disciplina?.disciplina ?? "Chamada diária"} · ${fmtData(dia)}`}>
          <form action={guardarChamada}>
            <input type="hidden" name="turma" value={turma.id} />
            <input type="hidden" name="disciplina" value={disciplina?.disciplina_id ?? ""} />
            <input type="hidden" name="data" value={dia} />
            <Tabela>
              <thead><tr><th className="w-12">N.º</th><th>Aluno</th><th className="w-20 text-center">Faltou</th><th className="w-24 text-center">Justificada</th><th>Motivo</th><th className="w-28">Total no ano</th></tr></thead>
              <tbody>
                {alunos.map((a) => {
                  const m = marcadas[a.id];
                  const tot = totais[a.id];
                  return (
                    <tr key={a.id}>
                      <td className="tabular-nums text-suave">{a.numero_turma ?? "—"}<input type="hidden" name="mat" value={a.id} /></td>
                      <td>{a.alunos.nome}</td>
                      <td className="text-center"><input type="checkbox" name="falta" value={a.id} defaultChecked={!!m} className="h-5 w-5 accent-[rgb(var(--vermelho))]" aria-label={`Falta de ${a.alunos.nome}`} /></td>
                      <td className="text-center"><input type="checkbox" name="just" value={a.id} defaultChecked={m?.justificada} className="h-5 w-5 accent-[rgb(var(--verde))]" /></td>
                      <td><input name={`motivo_${a.id}`} defaultValue={m?.motivo ?? ""} className="campo py-1" placeholder="Doença, luto…" /></td>
                      <td>{tot ? <Etiqueta tom={tot.i >= 10 ? "perigo" : tot.i >= 5 ? "aviso" : "neutro"}>{tot.t} ({tot.i} inj.)</Etiqueta> : <span className="text-suave">0</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Tabela>
            <div className="mt-4"><Botao>Guardar chamada</Botao></div>
          </form>
        </Cartao>
      )}
    </>
  );
}
