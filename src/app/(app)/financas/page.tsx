import Link from "next/link";
import { Aviso, Botao, BotaoLink, Cabecalho, Cartao, Estatistica, Tabela } from "@/components/ui";
import { exigirPapel, FINANCAS } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data, dinheiro, hojeISO, mesAno } from "@/lib/formato";
import { matriculasFinanceiras, mesesVencidos, propinaDevida } from "@/lib/financas";
import { METODOS } from "@/lib/tipos";
import { guardarPrecos } from "./acoes";

export const metadata = { title: "Propinas" };

export default async function Financas({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel(...FINANCAS);
  const supabase = await supabaseServidor();
  const editaPrecos = ["admin", "financeiro"].includes(s.perfil.papel);
  if (!s.ano) return <Cabecalho titulo="Propinas" subtitulo="Defina primeiro o ano letivo atual." />;

  const [mats, { data: pags }, { data: classes }] = await Promise.all([
    matriculasFinanceiras(s.ano.id),
    supabase.from("pagamentos").select("id, valor, metodo, tipo, mes_referencia, data_pagamento, numero_recibo, matricula_id, matriculas!inner(ano_letivo_id, alunos(nome))").eq("matriculas.ano_letivo_id", s.ano.id).order("numero_recibo", { ascending: false }),
    supabase.from("classes").select("id, nome, propina_mensal, taxa_matricula").order("ordem"),
  ]);
  const pagamentos = (pags ?? []) as unknown as { id: string; valor: number; metodo: string; tipo: string; mes_referencia: string | null; data_pagamento: string; numero_recibo: number; matricula_id: string; matriculas: { alunos: { nome: string } } }[];

  const meses = mesesVencidos(s.ano);
  const pagos = new Set(pagamentos.filter((p) => p.tipo === "propina").map((p) => `${p.matricula_id}|${p.mes_referencia}`));
  let esperado = 0, emFalta = 0, devedores = 0;
  for (const m of mats) {
    const v = propinaDevida(m);
    if (v <= 0) continue;
    esperado += v * meses.length;
    const falta = meses.filter((mes) => !pagos.has(`${m.id}|${mes}`)).length;
    emFalta += falta * v;
    if (falta > 0) devedores++;
  }
  const recebido = pagamentos.reduce((t, p) => t + p.valor, 0);
  const mesAtual = hojeISO().slice(0, 7);
  const doMes = pagamentos.filter((p) => p.data_pagamento.startsWith(mesAtual)).reduce((t, p) => t + p.valor, 0);
  const porMetodo = Object.entries(pagamentos.reduce<Record<string, number>>((acc, p) => ((acc[p.metodo] = (acc[p.metodo] ?? 0) + p.valor), acc), {})).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <Aviso ok={sp.ok} erro={sp.erro} />
      <Cabecalho titulo="Propinas e pagamentos" subtitulo={`Ano letivo ${s.ano.nome} · valores em FCFA`}
        acoes={<><BotaoLink href="/financas/atrasos" variante="secundario">Em atraso</BotaoLink><BotaoLink href="/financas/pagamento">Registar pagamento</BotaoLink></>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Estatistica rotulo="Recebido no ano" valor={dinheiro(recebido)} tom="sucesso" />
        <Estatistica rotulo={`Recebido em ${mesAno(mesAtual + "-01")}`} valor={dinheiro(doMes)} />
        <Estatistica rotulo="Propinas vencidas por cobrar" valor={dinheiro(emFalta)} detalhe={`${devedores} alunos com meses em falta`} tom={emFalta ? "perigo" : "sucesso"} />
        <Estatistica rotulo="Taxa de cobrança" valor={esperado ? `${Math.round(((esperado - emFalta) / esperado) * 100)}%` : "—"} detalhe={`${meses.length} meses vencidos`} tom="aviso" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Cartao titulo="Últimos pagamentos">
            {pagamentos.length === 0 ? <p className="text-sm text-suave">Ainda sem pagamentos registados.</p> : (
              <Tabela>
                <thead><tr><th>Recibo</th><th>Data</th><th>Aluno</th><th>Referente a</th><th>Método</th><th className="text-right">Valor</th></tr></thead>
                <tbody>
                  {pagamentos.slice(0, 25).map((p) => (
                    <tr key={p.id}>
                      <td><Link href={`/financas/recibo/${p.id}`} className="text-verde hover:underline">{p.numero_recibo}</Link></td>
                      <td>{data(p.data_pagamento)}</td>
                      <td><Link href={`/financas/pagamento?matricula=${p.matricula_id}`} className="hover:underline">{p.matriculas.alunos.nome}</Link></td>
                      <td>{p.tipo === "propina" ? mesAno(p.mes_referencia) : p.tipo}</td>
                      <td>{METODOS[p.metodo]}</td>
                      <td className="text-right tabular-nums">{dinheiro(p.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
            )}
          </Cartao>
        </div>
        <div className="space-y-6">
          <Cartao titulo="Por método de pagamento">
            {porMetodo.length === 0 ? <p className="text-sm text-suave">—</p> : (
              <ul className="space-y-2 text-sm">
                {porMetodo.map(([m, v]) => (
                  <li key={m}>
                    <div className="flex justify-between"><span>{METODOS[m]}</span><span className="tabular-nums">{dinheiro(v)}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-superficie-2"><div className="h-1.5 rounded-full bg-verde" style={{ width: `${(v / recebido) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
          <Cartao titulo="Tabela de propinas">
            <form action={guardarPrecos}>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-suave"><th className="pb-2 font-medium">Classe</th><th className="pb-2 font-medium">Mensal</th><th className="pb-2 font-medium">Matrícula</th></tr></thead>
                <tbody>
                  {(classes ?? []).map((c) => (
                    <tr key={c.id}>
                      <td className="py-1 pr-2">{c.nome}<input type="hidden" name="classe" value={c.id} /></td>
                      <td className="py-1 pr-2"><input name={`p_${c.id}`} type="number" min={0} step={500} defaultValue={c.propina_mensal} disabled={!editaPrecos} className="campo py-1 tabular-nums" /></td>
                      <td className="py-1"><input name={`t_${c.id}`} type="number" min={0} step={500} defaultValue={c.taxa_matricula} disabled={!editaPrecos} className="campo py-1 tabular-nums" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {editaPrecos && <Botao variante="secundario" className="mt-3 w-full">Guardar preços</Botao>}
            </form>
          </Cartao>
        </div>
      </div>
    </>
  );
}
