import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso, Botao, BotaoLink, Cabecalho, Campo, Cartao, Etiqueta, Tabela } from "@/components/ui";
import { exigirPapel, EQUIPA } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data, dinheiro, idade, mesAno, nota } from "@/lib/formato";
import { ESTADOS_MATRICULA, METODOS } from "@/lib/tipos";
import { CamposEncarregado } from "../campos";
import { adicionarEncarregado, atualizarMatricula, convidarEncarregado, matricular } from "../acoes";
import { emitirDeclaracao } from "../../declaracoes/acoes";
import { TIPOS_DECLARACAO, type TipoDeclaracao } from "@/lib/declaracoes";

export const metadata = { title: "Ficha do aluno" };

type Enc = { principal: boolean; encarregados: { id: string; nome: string; parentesco: string | null; telefone: string | null; email: string | null; user_id: string | null } };
type Mat = { id: string; estado: string; bolsa_percentagem: number; data_matricula: string; ano_letivo_id: string; turma_id: string; turmas: { nome: string }; anos_letivos: { nome: string } };

export default async function FichaAluno({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const s = await exigirPapel(...EQUIPA);
  const supabase = await supabaseServidor();
  const gere = ["admin", "secretaria"].includes(s.perfil.papel);
  const financas = ["admin", "secretaria", "financeiro"].includes(s.perfil.papel);

  const { data: a } = await supabase
    .from("alunos")
    .select("*, aluno_encarregados(principal, encarregados(id, nome, parentesco, telefone, email, user_id)), matriculas(id, estado, bolsa_percentagem, data_matricula, ano_letivo_id, turma_id, turmas(nome), anos_letivos(nome))")
    .eq("id", id)
    .maybeSingle();
  if (!a) notFound();

  const mats = (a.matriculas as Mat[]).sort((x, y) => y.data_matricula.localeCompare(x.data_matricula));
  const atual = mats.find((m) => m.ano_letivo_id === s.ano?.id);
  const encs = a.aluno_encarregados as Enc[];

  const [{ data: turmas }, medias, faltas, pagamentos] = await Promise.all([
    supabase.from("turmas").select("id, nome").eq("ano_letivo_id", s.ano?.id ?? "").order("nome"),
    atual ? supabase.from("medias_disciplina").select("disciplina_id, t1, t2, t3, media").eq("matricula_id", atual.id) : Promise.resolve({ data: [] }),
    atual ? supabase.from("faltas").select("justificada").eq("matricula_id", atual.id) : Promise.resolve({ data: [] }),
    financas && atual ? supabase.from("pagamentos").select("*").eq("matricula_id", atual.id).order("data_pagamento", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const { data: disciplinas } = await supabase.from("disciplinas").select("id, nome");
  const emiteDecl = ["admin", "secretaria", "financeiro"].includes(s.perfil.papel);
  const { data: declaracoes } = emiteDecl
    ? await supabase.from("declaracoes").select("id, codigo, tipo, emitida_em, anulada_em, matricula_id").in("matricula_id", mats.map((m) => m.id)).order("emitida_em", { ascending: false })
    : { data: [] };
  const nomeDisc = Object.fromEntries((disciplinas ?? []).map((d) => [d.id, d.nome]));
  const totalFaltas = faltas.data?.length ?? 0;
  const injust = (faltas.data ?? []).filter((f: { justificada: boolean }) => !f.justificada).length;

  return (
    <>
      <Aviso ok={sp.ok} erro={sp.erro} />
      <Cabecalho
        titulo={a.nome}
        subtitulo={<>Processo n.º {a.numero}{atual && <> · {atual.turmas.nome}</>}{a.data_nascimento && <> · {idade(a.data_nascimento)} anos</>}</>}
        acoes={<>
          {gere && <BotaoLink href={`/alunos/${id}/editar`} variante="secundario">Editar dados</BotaoLink>}
          {atual && <BotaoLink href={`/boletins/${atual.id}`} variante="secundario">Boletim</BotaoLink>}
          {financas && atual && <BotaoLink href={`/financas/pagamento?matricula=${atual.id}`}>Registar pagamento</BotaoLink>}
        </>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Cartao titulo="Dados pessoais" className="lg:col-span-1">
          <dl className="space-y-2 text-sm">
            {[
              ["Género", a.genero === "F" ? "Feminino" : a.genero === "M" ? "Masculino" : "—"],
              ["Nascimento", data(a.data_nascimento)],
              ["Naturalidade", a.naturalidade ?? "—"],
              ["Nacionalidade", a.nacionalidade ?? "—"],
              ["Línguas em casa", a.linguas ?? "—"],
              ["BI / cédula", a.bi ?? "—"],
              ["Morada", a.morada ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><dt className="text-suave">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
          {a.observacoes && <p className="mt-4 rounded-md bg-amarelo-claro p-3 text-sm">{a.observacoes}</p>}
        </Cartao>

        <div className="space-y-6 lg:col-span-2">
          <Cartao titulo={`Matrícula ${s.ano?.nome ?? ""}`}>
            {atual ? (
              gere ? (
                <form action={atualizarMatricula.bind(null, id, atual.id)} className="grid items-end gap-4 sm:grid-cols-4">
                  <Campo rotulo="Turma">
                    <select name="turma_id" defaultValue={atual.turma_id} className="campo">
                      {(turmas ?? []).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                  </Campo>
                  <Campo rotulo="Estado">
                    <select name="estado" defaultValue={atual.estado} className="campo">
                      {Object.entries(ESTADOS_MATRICULA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </Campo>
                  <Campo rotulo="Bolsa (%)"><input type="number" name="bolsa" min={0} max={100} defaultValue={atual.bolsa_percentagem} className="campo" /></Campo>
                  <Botao variante="secundario">Atualizar</Botao>
                </form>
              ) : (
                <p className="text-sm">{atual.turmas.nome} · <Etiqueta tom="sucesso">{ESTADOS_MATRICULA[atual.estado]}</Etiqueta></p>
              )
            ) : gere ? (
              <form action={matricular.bind(null, id)} className="grid items-end gap-4 sm:grid-cols-3">
                <Campo rotulo="Turma">
                  <select name="turma_id" className="campo" required>
                    {(turmas ?? []).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </Campo>
                <Campo rotulo="Bolsa (%)"><input type="number" name="bolsa" min={0} max={100} defaultValue={0} className="campo" /></Campo>
                <Botao>Matricular</Botao>
              </form>
            ) : <p className="text-sm text-suave">Sem matrícula neste ano letivo.</p>}
            {mats.length > 1 && (
              <p className="mt-4 text-xs text-suave">
                Histórico: {mats.filter((m) => m !== atual).map((m) => `${m.anos_letivos.nome} — ${m.turmas.nome} (${ESTADOS_MATRICULA[m.estado]})`).join(" · ")}
              </p>
            )}
          </Cartao>

          {atual && (
            <Cartao titulo="Aproveitamento" acao={<span className="text-sm text-suave">{totalFaltas} faltas ({injust} injustificadas)</span>}>
              {(medias.data ?? []).length === 0 ? <p className="text-sm text-suave">Ainda sem notas lançadas.</p> : (
                <Tabela>
                  <thead><tr><th>Disciplina</th><th>1.º T</th><th>2.º T</th><th>3.º T</th><th>Média</th></tr></thead>
                  <tbody>
                    {(medias.data as { disciplina_id: string; t1: number; t2: number; t3: number; media: number }[]).map((m) => (
                      <tr key={m.disciplina_id}>
                        <td>{nomeDisc[m.disciplina_id]}</td>
                        <td className="tabular-nums">{nota(m.t1)}</td><td className="tabular-nums">{nota(m.t2)}</td><td className="tabular-nums">{nota(m.t3)}</td>
                        <td className={`font-semibold tabular-nums ${Number(m.media) < s.escola.nota_minima ? "text-vermelho" : "text-verde"}`}>{nota(m.media)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Tabela>
              )}
            </Cartao>
          )}

          <Cartao titulo="Encarregados de educação">
            {encs.length === 0 && <p className="mb-4 text-sm text-suave">Nenhum encarregado registado.</p>}
            <ul className="divide-y divide-linha">
              {encs.map(({ encarregados: e }) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">{e.nome} {e.parentesco && <span className="text-suave">({e.parentesco})</span>}</p>
                    <p className="text-suave">{[e.telefone, e.email].filter(Boolean).join(" · ") || "Sem contacto"}</p>
                  </div>
                  {e.user_id ? <Etiqueta tom="sucesso">Usa o portal</Etiqueta> : gere && e.email && (
                    <form action={convidarEncarregado.bind(null, id, e.id)}><Botao variante="fantasma">Dar acesso ao portal</Botao></form>
                  )}
                </li>
              ))}
            </ul>
            {gere && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-verde">Adicionar encarregado</summary>
                <form action={adicionarEncarregado.bind(null, id)} className="mt-4 space-y-4">
                  <CamposEncarregado />
                  <Botao variante="secundario">Adicionar</Botao>
                </form>
              </details>
            )}
          </Cartao>

          {emiteDecl && (
            <Cartao titulo="Declarações">
              {atual ? (
                <form action={emitirDeclaracao.bind(null, id, atual.id)} className="grid items-end gap-3 sm:grid-cols-[1.4fr_1fr_auto]">
                  <Campo rotulo="Tipo">
                    <select name="tipo" className="campo" defaultValue={s.perfil.papel === "financeiro" ? "quitacao" : "matricula"}>
                      {Object.entries(TIPOS_DECLARACAO).filter(([k]) => s.perfil.papel !== "financeiro" || k === "quitacao").map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}
                    </select>
                  </Campo>
                  <Campo rotulo="Finalidade (opcional)"><input name="finalidade" className="campo" placeholder="Ex.: efeitos de bolsa de estudo" /></Campo>
                  <Botao>Emitir</Botao>
                </form>
              ) : <p className="text-sm text-suave">Matricule o aluno no ano atual para emitir declarações.</p>}
              {(declaracoes ?? []).length > 0 && (
                <ul className="mt-4 divide-y divide-linha text-sm">
                  {declaracoes!.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                      <Link href={`/declaracoes/${d.id}`} className="text-verde hover:underline">{TIPOS_DECLARACAO[d.tipo as TipoDeclaracao].nome}</Link>
                      <span className="flex items-center gap-2 text-xs text-suave"><span className="font-mono">{d.codigo}</span> · {data(d.emitida_em)} {d.anulada_em && <Etiqueta tom="perigo">Anulada</Etiqueta>}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>
          )}

          {financas && atual && (
            <Cartao titulo="Pagamentos" acao={<Link className="text-sm text-verde hover:underline" href={`/financas/pagamento?matricula=${atual.id}`}>Registar</Link>}>
              {(pagamentos.data ?? []).length === 0 ? <p className="text-sm text-suave">Sem pagamentos neste ano.</p> : (
                <Tabela>
                  <thead><tr><th>Recibo</th><th>Data</th><th>Referente a</th><th>Método</th><th className="text-right">Valor</th></tr></thead>
                  <tbody>
                    {(pagamentos.data as { id: string; numero_recibo: number; data_pagamento: string; tipo: string; mes_referencia: string | null; metodo: string; valor: number }[]).map((p) => (
                      <tr key={p.id}>
                        <td><Link className="text-verde hover:underline" href={`/financas/recibo/${p.id}`}>N.º {p.numero_recibo}</Link></td>
                        <td>{data(p.data_pagamento)}</td>
                        <td>{p.tipo === "propina" ? `Propina de ${mesAno(p.mes_referencia)}` : p.tipo}</td>
                        <td>{METODOS[p.metodo]}</td>
                        <td className="text-right tabular-nums">{dinheiro(p.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Tabela>
              )}
            </Cartao>
          )}
        </div>
      </div>
    </>
  );
}
