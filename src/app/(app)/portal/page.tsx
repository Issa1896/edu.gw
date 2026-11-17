import Link from "next/link";
import { BotaoLink, Cabecalho, Cartao, Estatistica, Tabela, Vazio } from "@/components/ui";
import { exigirPapel } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { boletins, situacao } from "@/lib/avaliacao";
import { dinheiro, mesAno, nota } from "@/lib/formato";
import { mesesVencidos, propinaDevida, type MatFin } from "@/lib/financas";
import { TIPOS_DECLARACAO, type TipoDeclaracao } from "@/lib/declaracoes";

export const metadata = { title: "Os meus educandos" };

export default async function Portal() {
  const s = await exigirPapel("encarregado");
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("matriculas")
    .select("id, bolsa_percentagem, numero_turma, turma_id, alunos(id, nome, numero), turmas(id, nome, classes(propina_mensal, taxa_matricula))")
    .eq("ano_letivo_id", s.ano?.id ?? "")
    .eq("estado", "ativa");
  const mats = (data ?? []) as unknown as (MatFin & { turma_id: string })[];
  const minima = Number(s.escola.nota_minima);

  return (
    <>
      <Cabecalho titulo="Os meus educandos" subtitulo={`${s.escola.nome} · Ano letivo ${s.ano?.nome ?? "—"}`} />
      {mats.length === 0 && <Vazio titulo="Ainda não há educandos associados à sua conta">Contacte a secretaria da escola.</Vazio>}
      <div className="space-y-8">
        {await Promise.all(mats.map(async (m) => {
          const [b, { data: pags }, { data: decls }] = await Promise.all([
            boletins([m.id], m.turma_id),
            supabase.from("pagamentos").select("id, tipo, mes_referencia, numero_recibo, valor").eq("matricula_id", m.id).order("numero_recibo", { ascending: false }),
            supabase.from("declaracoes").select("id, tipo, codigo, emitida_em").eq("matricula_id", m.id).is("anulada_em", null).order("emitida_em", { ascending: false }),
          ]);
          const linhas = b.porMat[m.id];
          const sit = situacao(linhas, minima);
          const f = b.faltasPor[m.id];
          const pagos = new Set((pags ?? []).filter((p) => p.tipo === "propina").map((p) => p.mes_referencia));
          const devido = propinaDevida(m);
          const emFalta = s.ano && devido > 0 ? mesesVencidos(s.ano).filter((x) => !pagos.has(x)) : [];
          return (
            <section key={m.id}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-titulo text-xl font-bold">{m.alunos.nome} <span className="text-base font-normal text-suave">· {m.turmas.nome}</span></h2>
                <BotaoLink href={`/boletins/${m.id}`} variante="secundario">Ver boletim</BotaoLink>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Estatistica rotulo="Média geral" valor={nota(sit.media)} detalhe={sit.texto} tom={sit.aprovado === false ? "perigo" : "sucesso"} />
                <Estatistica rotulo="Faltas" valor={f?.t ?? 0} detalhe={`${f?.j ?? 0} justificadas`} tom={(f?.t ?? 0) - (f?.j ?? 0) >= 5 ? "aviso" : "neutro"} />
                <Estatistica rotulo="Propinas em falta" valor={emFalta.length ? dinheiro(emFalta.length * devido) : "Em dia"} detalhe={emFalta.map((x) => mesAno(x)).join(", ") || undefined} tom={emFalta.length ? "perigo" : "sucesso"} />
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Tabela>
                    <thead><tr><th>Disciplina</th><th>1.º T</th><th>2.º T</th><th>3.º T</th><th>Média</th></tr></thead>
                    <tbody>
                      {linhas.map((l) => (
                        <tr key={l.disciplina_id}>
                          <td>{l.disciplina}</td>
                          {[l.t1, l.t2, l.t3, l.media].map((v, i) => <td key={i} className={`tabular-nums ${v !== null && v < minima ? "text-vermelho" : ""} ${i === 3 ? "font-semibold" : ""}`}>{nota(v)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </Tabela>
                </div>
                <div className="space-y-4">
                {(decls ?? []).length > 0 && (
                  <Cartao titulo="Declarações">
                    <ul className="divide-y divide-linha text-sm">
                      {decls!.map((d) => (
                        <li key={d.id} className="py-1.5"><Link href={`/declaracoes/${d.id}`} className="text-verde hover:underline">{TIPOS_DECLARACAO[d.tipo as TipoDeclaracao].nome}</Link> <span className="text-xs text-suave">· {d.codigo}</span></li>
                      ))}
                    </ul>
                  </Cartao>
                )}
                <Cartao titulo="Recibos">
                  {(pags ?? []).length === 0 ? <p className="text-sm text-suave">Sem pagamentos.</p> : (
                    <ul className="divide-y divide-linha text-sm">
                      {pags!.slice(0, 10).map((p) => (
                        <li key={p.id} className="flex justify-between py-1.5">
                          <Link href={`/financas/recibo/${p.id}`} className="text-verde hover:underline">N.º {p.numero_recibo} · {p.tipo === "propina" ? mesAno(p.mes_referencia) : p.tipo}</Link>
                          <span className="tabular-nums">{dinheiro(p.valor)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Cartao>
                </div>
              </div>
            </section>
          );
        }))}
      </div>
    </>
  );
}
