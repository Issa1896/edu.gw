import Link from "next/link";
import { redirect } from "next/navigation";
import { Cabecalho, Etiqueta, Tabela, Vazio } from "@/components/ui";
import { obterSessao } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";
import { REGIOES } from "@/lib/tipos";

export const metadata = { title: "Escolas · Plataforma", robots: { index: false } };

type E = { id: string; nome: string; regiao: string; tipo: string; telefone: string | null; email: string | null; criado_em: string; slug: string | null; pagina_publica: boolean; equipa: number; encarregados: number; alunos: number; matriculas_ativas: number; pagamentos: number; declaracoes: number; ultimo_acesso: string | null };

export default async function EscolasPlataforma() {
  const s = await obterSessao();
  if (!s.plataformaAdmin) redirect("/painel");
  const supabase = await supabaseServidor();
  const { data: esc } = await supabase.rpc("plataforma_escolas");
  const lista = (esc ?? []) as E[];

  return (
    <>
      <Cabecalho titulo="Todas as escolas" subtitulo={`${lista.length} escola(s) registada(s)`} />
      {lista.length === 0 ? <Vazio titulo="Ainda não há escolas" /> : (
        <Tabela>
          <thead><tr><th>Escola</th><th>Contacto</th><th className="text-right">Equipa</th><th className="text-right">Alunos</th><th className="text-right">Encarregados</th><th className="text-right">Pagamentos</th><th className="text-right">Declarações</th><th>Registo</th><th>Último acesso</th></tr></thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id}>
                <td>
                  <span className="font-medium">{e.nome}</span><br />
                  <span className="text-xs text-suave">{REGIOES[e.regiao] ?? e.regiao} · {e.tipo}</span>
                  {e.pagina_publica && e.slug && <> · <Link href={`/escola/${e.slug}`} target="_blank" className="text-xs text-verde hover:underline">página pública</Link></>}
                </td>
                <td className="text-xs">{e.telefone ?? "—"}<br />{e.email ?? ""}</td>
                <td className="text-right tabular-nums">{e.equipa}</td>
                <td className="text-right tabular-nums">{e.matriculas_ativas}<span className="text-xs text-suave"> / {e.alunos}</span></td>
                <td className="text-right tabular-nums">{e.encarregados}</td>
                <td className="text-right tabular-nums">{e.pagamentos}</td>
                <td className="text-right tabular-nums">{e.declaracoes}</td>
                <td className="whitespace-nowrap">{data(e.criado_em)}</td>
                <td className="whitespace-nowrap">{e.ultimo_acesso ? data(e.ultimo_acesso) : <Etiqueta tom="aviso">Nunca</Etiqueta>}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}
