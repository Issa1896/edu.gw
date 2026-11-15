import { Aviso, Botao, Cabecalho, Campo, Cartao, Tabela, Vazio } from "@/components/ui";
import { exigirPapel } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { alunosDaTurma, atribuicoes } from "@/lib/atribuicoes";
import { nota } from "@/lib/formato";
import { abrirNotas, guardarNotas } from "./acoes";

export const metadata = { title: "Notas" };

export default async function Notas({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel("admin", "secretaria", "professor");
  const lista = await atribuicoes(s);
  const sel = lista.find((a) => a.turma_id === sp.turma && a.disciplina_id === sp.disciplina);
  const trimestre = [1, 2, 3].includes(Number(sp.trimestre)) ? Number(sp.trimestre) : 1;

  let alunos: Awaited<ReturnType<typeof alunosDaTurma>> = [];
  let existentes: Record<string, Record<number, number>> = {};
  if (sel) {
    const supabase = await supabaseServidor();
    alunos = await alunosDaTurma(sel.turma_id);
    const { data } = await supabase.from("notas").select("matricula_id, trimestre, nota").eq("disciplina_id", sel.disciplina_id).in("matricula_id", alunos.map((a) => a.id));
    existentes = {};
    for (const n of data ?? []) (existentes[n.matricula_id] ??= {})[n.trimestre] = Number(n.nota);
  }
  const minima = Number(s.escola.nota_minima);

  return (
    <>
      <Cabecalho titulo="Lançamento de notas" subtitulo="Escala de 0 a 20 valores, por trimestre." />
      <Aviso ok={sp.ok} erro={sp.erro} />
      {lista.length === 0 ? (
        <Vazio titulo="Sem disciplinas atribuídas">A secretaria atribui professores às disciplinas em cada turma.</Vazio>
      ) : (
        <form className="mb-6 flex flex-wrap items-end gap-3">
          <Campo rotulo="Turma e disciplina">
            <select name="td" className="campo min-w-[16rem]" defaultValue={sel ? `${sel.turma_id}|${sel.disciplina_id}` : ""} required>
              <option value="" disabled>Escolha…</option>
              {lista.map((a) => <option key={a.turma_id + a.disciplina_id} value={`${a.turma_id}|${a.disciplina_id}`}>{a.turma} — {a.disciplina}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Trimestre">
            <select name="trimestre" className="campo" defaultValue={trimestre}>
              <option value={1}>1.º trimestre</option><option value={2}>2.º trimestre</option><option value={3}>3.º trimestre</option>
            </select>
          </Campo>
          <Botao variante="secundario" formAction={abrirNotas}>Abrir</Botao>
        </form>
      )}

      {sel && (
        <Cartao titulo={`${sel.turma} · ${sel.disciplina} · ${trimestre}.º trimestre`}>
          {alunos.length === 0 ? <p className="text-sm text-suave">Sem alunos matriculados nesta turma.</p> : (
            <form action={guardarNotas}>
              <input type="hidden" name="turma" value={sel.turma_id} />
              <input type="hidden" name="disciplina" value={sel.disciplina_id} />
              <input type="hidden" name="trimestre" value={trimestre} />
              <Tabela>
                <thead><tr><th className="w-12">N.º</th><th>Aluno</th>{[1, 2, 3].filter((t) => t !== trimestre).map((t) => <th key={t} className="w-16">{t}.º T</th>)}<th className="w-28">Nota {trimestre}.º T</th></tr></thead>
                <tbody>
                  {alunos.map((a) => (
                    <tr key={a.id}>
                      <td className="tabular-nums text-suave">{a.numero_turma ?? "—"}</td>
                      <td>{a.alunos.nome}</td>
                      {[1, 2, 3].filter((t) => t !== trimestre).map((t) => {
                        const v = existentes[a.id]?.[t];
                        return <td key={t} className={`tabular-nums ${v !== undefined && v < minima ? "text-vermelho" : "text-suave"}`}>{nota(v)}</td>;
                      })}
                      <td>
                        <input
                          name={`n_${a.id}`}
                          defaultValue={existentes[a.id]?.[trimestre]?.toString().replace(".", ",") ?? ""}
                          inputMode="decimal"
                          pattern="^(20([.,]0)?|1?[0-9]([.,][0-9])?)$"
                          title="Nota de 0 a 20"
                          className="campo w-20 py-1 text-center tabular-nums"
                          aria-label={`Nota de ${a.alunos.nome}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
              <div className="mt-4 flex items-center gap-4">
                <Botao>Guardar notas</Botao>
                <span className="text-xs text-suave">Deixe em branco para apagar. Notas abaixo de {minima} aparecem a vermelho.</span>
              </div>
            </form>
          )}
        </Cartao>
      )}
    </>
  );
}
