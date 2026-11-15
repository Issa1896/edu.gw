import Link from "next/link";
import { Aviso, Botao, Cabecalho, Campo, Cartao, Etiqueta, Tabela } from "@/components/ui";
import { exigirPapel, FINANCAS } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data, dinheiro, hojeISO, mesAno, mesesLetivos } from "@/lib/formato";
import { matriculasFinanceiras, propinaDevida } from "@/lib/financas";
import { METODOS } from "@/lib/tipos";
import { anularPagamento, escolherAluno, registarPagamento } from "../acoes";

export const metadata = { title: "Registar pagamento" };

export default async function Pagamento({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel(...FINANCAS);
  if (!s.ano) return <Cabecalho titulo="Registar pagamento" subtitulo="Defina primeiro o ano letivo atual." />;
  const supabase = await supabaseServidor();
  const mats = await matriculasFinanceiras(s.ano.id);
  const m = mats.find((x) => x.id === sp.matricula);
  const anula = ["admin", "financeiro"].includes(s.perfil.papel);

  const { data: pags } = m
    ? await supabase.from("pagamentos").select("*").eq("matricula_id", m.id).order("numero_recibo", { ascending: false })
    : { data: [] };
  const pagos = new Set((pags ?? []).filter((p) => p.tipo === "propina").map((p) => p.mes_referencia));
  const meses = mesesLetivos(s.ano.inicio, s.ano.fim);
  const mesAtual = hojeISO().slice(0, 7) + "-01";
  const mensal = m ? propinaDevida(m) : 0;

  return (
    <>
      <Cabecalho titulo="Registar pagamento" subtitulo={m ? `${m.alunos.nome} · ${m.turmas.nome}` : "Escolha o aluno"} />
      <Aviso ok={sp.ok} erro={sp.erro} />
      <form action={escolherAluno} className="mb-6 flex flex-wrap items-end gap-3">
        <Campo rotulo="Aluno">
          <select name="matricula" defaultValue={m?.id ?? ""} className="campo min-w-[20rem]" required>
            <option value="" disabled>Escolha o aluno…</option>
            {mats.map((x) => <option key={x.id} value={x.id}>{x.turmas.nome} — {x.alunos.nome} ({x.alunos.numero})</option>)}
          </select>
        </Campo>
        <Botao variante="secundario">Abrir</Botao>
      </form>

      {m && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Cartao titulo="Novo pagamento" className="lg:col-span-3">
            <form action={registarPagamento} className="space-y-4">
              <input type="hidden" name="matricula" value={m.id} />
              <div className="flex flex-wrap gap-4 text-sm">
                <span>Propina mensal: <strong>{dinheiro(m.turmas.classes.propina_mensal)}</strong></span>
                {m.bolsa_percentagem > 0 && <Etiqueta tom="aviso">Bolsa {m.bolsa_percentagem}% → {dinheiro(mensal)}</Etiqueta>}
              </div>
              <fieldset>
                <legend className="rotulo">Meses a pagar (propina)</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {meses.map((mes) => {
                    const pago = pagos.has(mes);
                    const vencido = mes <= mesAtual;
                    return (
                      <label key={mes} className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${pago ? "border-verde/40 bg-verde-claro text-verde" : vencido ? "border-vermelho/40" : "border-linha"}`}>
                        <input type="checkbox" name="meses" value={mes} disabled={pago} defaultChecked={!pago && mes === mesAtual} />
                        <span className="capitalize">{mesAno(mes).replace(/ \d{4}$/, "").slice(0, 3)}</span>
                        {pago && <span className="ml-auto text-xs">pago</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Tipo">
                  <select name="tipo" defaultValue="propina" className="campo">
                    <option value="propina">Propina (meses acima)</option>
                    <option value="matricula">Taxa de matrícula</option>
                    <option value="exame">Exame</option>
                    <option value="uniforme">Uniforme</option>
                    <option value="outro">Outro</option>
                  </select>
                </Campo>
                <Campo rotulo="Valor por mês (propina)"><input type="number" name="valor_mes" defaultValue={mensal || ""} min={1} className="campo tabular-nums" /></Campo>
                <Campo rotulo="Valor (outros tipos)" ajuda={m.turmas.classes.taxa_matricula ? `Taxa de matrícula: ${dinheiro(m.turmas.classes.taxa_matricula)}` : undefined}>
                  <input type="number" name="valor" min={1} className="campo tabular-nums" />
                </Campo>
                <Campo rotulo="Data"><input type="date" name="data_pagamento" defaultValue={hojeISO()} className="campo" /></Campo>
                <Campo rotulo="Método">
                  <select name="metodo" defaultValue="numerario" className="campo">{Object.entries(METODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                </Campo>
                <Campo rotulo="Referência da transação" ajuda="Obrigatória para Orange Money, MTN MoMo e transferência.">
                  <input name="referencia" className="campo" />
                </Campo>
              </div>
              <Campo rotulo="Observação"><input name="observacao" className="campo" /></Campo>
              <Botao>Registar e emitir recibo</Botao>
            </form>
          </Cartao>

          <Cartao titulo="Histórico" className="lg:col-span-2">
            {(pags ?? []).length === 0 ? <p className="text-sm text-suave">Sem pagamentos.</p> : (
              <Tabela>
                <thead><tr><th>Recibo</th><th>Referente</th><th className="text-right">Valor</th>{anula && <th />}</tr></thead>
                <tbody>
                  {pags!.map((p) => (
                    <tr key={p.id}>
                      <td><Link href={`/financas/recibo/${p.id}`} className="text-verde hover:underline">{p.numero_recibo}</Link><br /><span className="text-xs text-suave">{data(p.data_pagamento)}</span></td>
                      <td>{p.tipo === "propina" ? mesAno(p.mes_referencia) : p.tipo}<br /><span className="text-xs text-suave">{METODOS[p.metodo]}</span></td>
                      <td className="text-right tabular-nums">{dinheiro(p.valor)}</td>
                      {anula && <td><form action={anularPagamento.bind(null, p.id, m.id)}><button className="text-xs text-vermelho hover:underline">Anular</button></form></td>}
                    </tr>
                  ))}
                </tbody>
              </Tabela>
            )}
          </Cartao>
        </div>
      )}
    </>
  );
}
