import Link from "next/link";
import { Aviso, Botao, Cabecalho, Campo, Cartao, Tabela, Vazio } from "@/components/ui";
import { exigirPapel } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { TURNOS } from "@/lib/tipos";
import { criarTurma } from "./acoes";

export const metadata = { title: "Turmas" };

type T = { id: string; nome: string; turno: string; sala: string | null; capacidade: number; classes: { nome: string; ordem: number }; matriculas: { estado: string }[] };

export default async function Turmas({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel("admin", "secretaria", "professor");
  const supabase = await supabaseServidor();
  const gere = s.perfil.papel !== "professor";
  const [{ data }, { data: classes }, { data: disciplinas }] = await Promise.all([
    supabase.from("turmas").select("id, nome, turno, sala, capacidade, classes(nome, ordem), matriculas(estado)").eq("ano_letivo_id", s.ano?.id ?? ""),
    supabase.from("classes").select("id, nome").order("ordem"),
    supabase.from("disciplinas").select("id, nome").order("nome"),
  ]);
  const turmas = ((data ?? []) as unknown as T[]).sort((a, b) => a.classes.ordem - b.classes.ordem || a.nome.localeCompare(b.nome));

  return (
    <>
      <Cabecalho titulo="Turmas" subtitulo={s.ano ? `Ano letivo ${s.ano.nome}` : "Sem ano letivo ativo"} />
      <Aviso ok={sp.ok} erro={sp.erro} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {turmas.length === 0 ? <Vazio titulo="Ainda não há turmas neste ano letivo" /> : (
            <Tabela>
              <thead><tr><th>Turma</th><th>Classe</th><th>Turno</th><th>Sala</th><th>Alunos</th></tr></thead>
              <tbody>
                {turmas.map((t) => {
                  const n = t.matriculas.filter((m) => m.estado === "ativa").length;
                  return (
                    <tr key={t.id}>
                      <td><Link href={`/turmas/${t.id}`} className="font-medium text-verde hover:underline">{t.nome}</Link></td>
                      <td>{t.classes.nome}</td>
                      <td>{TURNOS[t.turno]}</td>
                      <td>{t.sala ?? "—"}</td>
                      <td className={`tabular-nums ${n > t.capacidade ? "font-semibold text-vermelho" : ""}`}>{n}/{t.capacidade}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Tabela>
          )}
        </div>
        {gere && (
          <Cartao titulo="Nova turma">
            <form action={criarTurma} className="space-y-3">
              <Campo rotulo="Classe">
                <select name="classe_id" className="campo" required>
                  {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Nome da turma"><input name="nome" className="campo" required placeholder="Ex.: 7.ª A" /></Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo rotulo="Turno">
                  <select name="turno" className="campo">{Object.entries(TURNOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                </Campo>
                <Campo rotulo="Capacidade"><input type="number" name="capacidade" defaultValue={45} min={1} className="campo" /></Campo>
              </div>
              <Campo rotulo="Sala"><input name="sala" className="campo" /></Campo>
              <fieldset>
                <legend className="rotulo">Disciplinas</legend>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-linha p-2 text-sm">
                  {(disciplinas ?? []).map((d) => (
                    <label key={d.id} className="flex items-center gap-2"><input type="checkbox" name="disciplinas" value={d.id} /> {d.nome}</label>
                  ))}
                </div>
              </fieldset>
              <Botao className="w-full">Criar turma</Botao>
            </form>
          </Cartao>
        )}
      </div>
    </>
  );
}
