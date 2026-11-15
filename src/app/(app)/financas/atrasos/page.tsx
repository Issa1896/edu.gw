import Link from "next/link";
import { Cabecalho, Campo, Etiqueta, Tabela, Vazio } from "@/components/ui";
import { BotaoImprimir } from "@/components/imprimir";
import { exigirPapel, FINANCAS } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { dinheiro, mesAno } from "@/lib/formato";
import { matriculasFinanceiras, mesesVencidos, propinaDevida } from "@/lib/financas";

export const metadata = { title: "Propinas em atraso" };

export default async function Atrasos({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel(...FINANCAS);
  if (!s.ano) return <Cabecalho titulo="Propinas em atraso" subtitulo="Defina primeiro o ano letivo atual." />;
  const supabase = await supabaseServidor();
  const [mats, { data: turmas }] = await Promise.all([
    matriculasFinanceiras(s.ano.id, sp.turma || undefined),
    supabase.from("turmas").select("id, nome").eq("ano_letivo_id", s.ano.id).order("nome"),
  ]);
  const { data: pags } = await supabase.from("pagamentos").select("matricula_id, mes_referencia").eq("tipo", "propina").in("matricula_id", mats.map((m) => m.id));
  const pagos = new Set((pags ?? []).map((p) => `${p.matricula_id}|${p.mes_referencia}`));
  const meses = mesesVencidos(s.ano);

  const linhas = mats
    .map((m) => {
      const v = propinaDevida(m);
      const falta = v > 0 ? meses.filter((mes) => !pagos.has(`${m.id}|${mes}`)) : [];
      return { m, v, falta, total: falta.length * v };
    })
    .filter((l) => l.falta.length > 0)
    .sort((a, b) => b.falta.length - a.falta.length);
  const total = linhas.reduce((t, l) => t + l.total, 0);

  return (
    <>
      <Cabecalho titulo="Propinas em atraso" subtitulo={`${linhas.length} alunos · ${dinheiro(total)} por cobrar`} acoes={<BotaoImprimir rotulo="Imprimir lista" />} />
      <form className="nao-imprimir mb-4 flex items-end gap-3">
        <Campo rotulo="Turma">
          <select name="turma" defaultValue={sp.turma ?? ""} className="campo">
            <option value="">Todas</option>
            {(turmas ?? []).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </Campo>
        <button className="rounded-md border border-linha bg-superficie px-4 py-2 text-sm font-semibold hover:bg-superficie-2">Filtrar</button>
      </form>
      {linhas.length === 0 ? <Vazio titulo="Nenhuma propina vencida por pagar." /> : (
        <Tabela>
          <thead><tr><th>Turma</th><th>Aluno</th><th>Meses em falta</th><th className="text-right">Valor</th><th className="nao-imprimir" /></tr></thead>
          <tbody>
            {linhas.map(({ m, falta, total }) => (
              <tr key={m.id}>
                <td>{m.turmas.nome}</td>
                <td>{m.alunos.nome}</td>
                <td>
                  <Etiqueta tom={falta.length >= 3 ? "perigo" : "aviso"}>{falta.length}</Etiqueta>{" "}
                  <span className="text-xs text-suave">{falta.map((f) => mesAno(f).slice(0, 3)).join(", ")}</span>
                </td>
                <td className="text-right tabular-nums">{dinheiro(total)}</td>
                <td className="nao-imprimir"><Link href={`/financas/pagamento?matricula=${m.id}`} className="text-verde hover:underline">Cobrar</Link></td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}
