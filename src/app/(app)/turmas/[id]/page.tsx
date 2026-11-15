import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso, Botao, BotaoLink, Cabecalho, Campo, Cartao, Tabela, Vazio } from "@/components/ui";
import { exigirPapel } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { idade } from "@/lib/formato";
import { TURNOS } from "@/lib/tipos";
import { atribuirProfessores, atualizarTurma, numerarAlunos, removerDisciplina } from "../acoes";

export const metadata = { title: "Turma" };

type TD = { id: string; disciplina_id: string; professor_id: string | null; disciplinas: { nome: string } };
type M = { id: string; numero_turma: number | null; bolsa_percentagem: number; alunos: { id: string; numero: string; nome: string; genero: string | null; data_nascimento: string | null } };

export default async function Turma({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const s = await exigirPapel("admin", "secretaria", "professor");
  const gere = s.perfil.papel !== "professor";
  const supabase = await supabaseServidor();

  const { data: t } = await supabase
    .from("turmas")
    .select("*, classes(nome), turma_disciplinas(id, disciplina_id, professor_id, disciplinas(nome)), matriculas(id, numero_turma, bolsa_percentagem, estado, alunos(id, numero, nome, genero, data_nascimento))")
    .eq("id", id)
    .maybeSingle();
  if (!t) notFound();

  const [{ data: equipa }, { data: disciplinas }] = await Promise.all([
    supabase.from("perfis").select("user_id, nome, papel").in("papel", ["professor", "admin", "secretaria"]).eq("ativo", true).order("nome"),
    supabase.from("disciplinas").select("id, nome").order("nome"),
  ]);
  const nomeEquipa = Object.fromEntries((equipa ?? []).map((p) => [p.user_id, p.nome]));
  const tds = (t.turma_disciplinas as TD[]).sort((a, b) => a.disciplinas.nome.localeCompare(b.disciplinas.nome));
  const alunos = ((t.matriculas as (M & { estado: string })[]).filter((m) => m.estado === "ativa"))
    .sort((a, b) => (a.numero_turma ?? 999) - (b.numero_turma ?? 999) || a.alunos.nome.localeCompare(b.alunos.nome, "pt"));
  const livres = (disciplinas ?? []).filter((d) => !tds.some((x) => x.disciplina_id === d.id));

  return (
    <>
      <Aviso ok={sp.ok} erro={sp.erro} />
      <Cabecalho
        titulo={`Turma ${t.nome}`}
        subtitulo={`${t.classes.nome} · ${TURNOS[t.turno]} · ${alunos.length}/${t.capacidade} alunos${t.diretor_turma ? ` · DT: ${nomeEquipa[t.diretor_turma] ?? "—"}` : ""}`}
        acoes={<>
          <BotaoLink href={`/boletins?turma=${id}`} variante="secundario">Pauta e boletins</BotaoLink>
          <BotaoLink href={`/faltas?turma=${id}`} variante="secundario">Chamada</BotaoLink>
        </>}
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Cartao titulo="Alunos" acao={gere && alunos.length > 0 && (
            <form action={numerarAlunos.bind(null, id)}><Botao variante="fantasma">Numerar por ordem alfabética</Botao></form>
          )}>
            {alunos.length === 0 ? <Vazio titulo="Sem alunos matriculados">{gere && <Link href="/alunos/novo" className="text-verde hover:underline">Matricular aluno</Link>}</Vazio> : (
              <Tabela>
                <thead><tr><th>N.º</th><th>Nome</th><th>G</th><th>Idade</th><th>Bolsa</th></tr></thead>
                <tbody>
                  {alunos.map((m) => (
                    <tr key={m.id}>
                      <td className="tabular-nums text-suave">{m.numero_turma ?? "—"}</td>
                      <td><Link href={`/alunos/${m.alunos.id}`} className="text-verde hover:underline">{m.alunos.nome}</Link></td>
                      <td>{m.alunos.genero ?? "—"}</td>
                      <td className="tabular-nums">{idade(m.alunos.data_nascimento) ?? "—"}</td>
                      <td className="tabular-nums">{m.bolsa_percentagem ? `${m.bolsa_percentagem}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
            )}
          </Cartao>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Cartao titulo="Disciplinas e professores">
            {gere ? (
              <form action={atribuirProfessores.bind(null, id)} className="space-y-3">
                {tds.map((td) => (
                  <div key={td.id} className="grid grid-cols-[1fr_1.2fr] items-center gap-2 text-sm">
                    <span className="font-medium">{td.disciplinas.nome}</span>
                    <select name={`prof_${td.id}`} defaultValue={td.professor_id ?? ""} className="campo py-1.5">
                      <option value="">Sem professor</option>
                      {(equipa ?? []).map((p) => <option key={p.user_id} value={p.user_id}>{p.nome}</option>)}
                    </select>
                  </div>
                ))}
                {livres.length > 0 && (
                  <Campo rotulo="Acrescentar disciplina">
                    <select name="nova_disciplina" className="campo" defaultValue="">
                      <option value="">—</option>
                      {livres.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                    </select>
                  </Campo>
                )}
                <Botao className="w-full">Guardar</Botao>
                {(equipa ?? []).length === 0 && <p className="ajuda">Convide professores em Equipa para os poder atribuir.</p>}
              </form>
            ) : (
              <ul className="divide-y divide-linha text-sm">
                {tds.map((td) => <li key={td.id} className="flex justify-between py-2"><span>{td.disciplinas.nome}</span><span className="text-suave">{td.professor_id ? nomeEquipa[td.professor_id] : "—"}</span></li>)}
              </ul>
            )}
            {gere && tds.length > 0 && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-suave">Remover disciplina da turma</summary>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tds.map((td) => (
                    <form key={td.id} action={removerDisciplina.bind(null, id, td.id)}>
                      <button className="rounded-full border border-linha px-3 py-1 text-xs hover:border-vermelho hover:text-vermelho">✕ {td.disciplinas.nome}</button>
                    </form>
                  ))}
                </div>
              </details>
            )}
          </Cartao>

          {gere && (
            <Cartao titulo="Dados da turma">
              <form action={atualizarTurma.bind(null, id)} className="space-y-3">
                <Campo rotulo="Nome"><input name="nome" defaultValue={t.nome} className="campo" required /></Campo>
                <div className="grid grid-cols-2 gap-3">
                  <Campo rotulo="Turno">
                    <select name="turno" defaultValue={t.turno} className="campo">{Object.entries(TURNOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  </Campo>
                  <Campo rotulo="Capacidade"><input type="number" name="capacidade" defaultValue={t.capacidade} className="campo" /></Campo>
                </div>
                <Campo rotulo="Sala"><input name="sala" defaultValue={t.sala ?? ""} className="campo" /></Campo>
                <Campo rotulo="Diretor(a) de turma">
                  <select name="diretor_turma" defaultValue={t.diretor_turma ?? ""} className="campo">
                    <option value="">—</option>
                    {(equipa ?? []).map((p) => <option key={p.user_id} value={p.user_id}>{p.nome}</option>)}
                  </select>
                </Campo>
                <Botao variante="secundario" className="w-full">Guardar</Botao>
              </form>
            </Cartao>
          )}
        </div>
      </div>
    </>
  );
}
