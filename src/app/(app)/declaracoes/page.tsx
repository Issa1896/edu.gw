import Link from "next/link";
import { Cabecalho, Etiqueta, Tabela, Vazio } from "@/components/ui";
import { exigirPapel } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";
import { TIPOS_DECLARACAO, type TipoDeclaracao } from "@/lib/declaracoes";

export const metadata = { title: "Declarações" };

export default async function Declaracoes({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await exigirPapel("admin", "secretaria", "financeiro");
  const supabase = await supabaseServidor();
  let q = supabase.from("declaracoes").select("id, codigo, tipo, finalidade, conteudo, emitida_em, emitida_por_nome, anulada_em").order("emitida_em", { ascending: false }).limit(200);
  if (sp.tipo && sp.tipo in TIPOS_DECLARACAO) q = q.eq("tipo", sp.tipo);
  if (sp.codigo) q = q.eq("codigo", sp.codigo.trim().toUpperCase());
  const { data: lista } = await q;

  return (
    <>
      <Cabecalho titulo="Declarações" subtitulo="Emita declarações a partir da ficha de cada aluno (Alunos → nome do aluno)." />
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="tipo" defaultValue={sp.tipo ?? ""} className="campo max-w-xs">
          <option value="">Todos os tipos</option>
          {Object.entries(TIPOS_DECLARACAO).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}
        </select>
        <input name="codigo" defaultValue={sp.codigo} placeholder="Código" className="campo max-w-[10rem] font-mono uppercase" />
        <button className="rounded-md border border-linha bg-superficie px-3 text-sm font-medium hover:bg-superficie-2">Filtrar</button>
      </form>
      {(lista ?? []).length === 0 ? <Vazio titulo="Nenhuma declaração emitida" /> : (
        <Tabela>
          <thead><tr><th>Código</th><th>Aluno</th><th>Tipo</th><th>Emitida</th><th>Estado</th></tr></thead>
          <tbody>
            {lista!.map((d) => (
              <tr key={d.id}>
                <td><Link href={`/declaracoes/${d.id}`} className="font-mono text-verde hover:underline">{d.codigo}</Link></td>
                <td>{(d.conteudo as { aluno: { nome: string } }).aluno.nome}<br /><span className="text-xs text-suave">{(d.conteudo as { turma: string }).turma}</span></td>
                <td>{TIPOS_DECLARACAO[d.tipo as TipoDeclaracao].nome}{d.finalidade && <><br /><span className="text-xs text-suave">{d.finalidade}</span></>}</td>
                <td>{data(d.emitida_em)}<br /><span className="text-xs text-suave">{d.emitida_por_nome}</span></td>
                <td>{d.anulada_em ? <Etiqueta tom="perigo">Anulada</Etiqueta> : <Etiqueta tom="sucesso">Válida</Etiqueta>}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}
