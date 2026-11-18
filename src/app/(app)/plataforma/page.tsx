import Link from "next/link";
import { redirect } from "next/navigation";
import { BotaoLink, Cabecalho, Cartao, Estatistica } from "@/components/ui";
import { obterSessao } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";
import { NOMES_PAPEL, REGIOES, type Papel } from "@/lib/tipos";

export const metadata = { title: "Plataforma", robots: { index: false } };

type C = { user_id: string; email: string; criado_em: string; ultimo_acesso: string | null; confirmado: boolean; nome: string | null; papel: Papel | null; escola: string | null };
type E = { id: string; nome: string; regiao: string; criado_em: string; alunos: number; matriculas_ativas: number; ultimo_acesso: string | null };

export default async function Plataforma() {
  const s = await obterSessao();
  if (!s.plataformaAdmin) redirect("/painel");
  const supabase = await supabaseServidor();
  const [{ data: cad }, { data: esc }, { count: artigos }] = await Promise.all([
    supabase.rpc("plataforma_cadastros"),
    supabase.rpc("plataforma_escolas"),
    supabase.from("artigos").select("id", { count: "exact", head: true }),
  ]);
  const cadastros = (cad ?? []) as C[];
  const escolas = (esc ?? []) as E[];
  const semana = new Date(Date.now() - 7 * 864e5).toISOString();
  const novos = cadastros.filter((c) => c.criado_em >= semana).length;
  const semEscola = cadastros.filter((c) => !c.escola).length;
  const alunos = escolas.reduce((t, e) => t + Number(e.matriculas_ativas), 0);

  return (
    <>
      <Cabecalho titulo="Painel da plataforma" subtitulo="Visão de todas as escolas e cadastros do edu.gw (só a equipa GW Digital vê esta área)." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Estatistica rotulo="Contas criadas" valor={cadastros.length} detalhe={`${novos} nos últimos 7 dias`} tom="sucesso" />
        <Estatistica rotulo="Escolas registadas" valor={escolas.length} />
        <Estatistica rotulo="Alunos matriculados (todas)" valor={alunos} />
        <Estatistica rotulo="Contas sem escola" valor={semEscola} detalhe="Criaram conta mas não registaram escola nem aceitaram convite" tom={semEscola ? "aviso" : "neutro"} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Últimos cadastros" acao={<Link href="/plataforma/cadastros" className="text-sm text-verde hover:underline">Ver todos</Link>}>
          <ul className="divide-y divide-linha text-sm">
            {cadastros.slice(0, 8).map((c) => (
              <li key={c.user_id} className="flex justify-between gap-3 py-2">
                <span className="min-w-0"><span className="block truncate font-medium">{c.nome ?? c.email}</span><span className="block truncate text-xs text-suave">{c.escola ? `${c.escola} · ${NOMES_PAPEL[c.papel!]}` : "Sem escola"}</span></span>
                <span className="shrink-0 text-xs text-suave">{data(c.criado_em)}</span>
              </li>
            ))}
          </ul>
        </Cartao>
        <Cartao titulo="Escolas" acao={<Link href="/plataforma/escolas" className="text-sm text-verde hover:underline">Ver todas</Link>}>
          <ul className="divide-y divide-linha text-sm">
            {escolas.slice(0, 8).map((e) => (
              <li key={e.id} className="flex justify-between gap-3 py-2">
                <span className="min-w-0"><span className="block truncate font-medium">{e.nome}</span><span className="block text-xs text-suave">{REGIOES[e.regiao] ?? e.regiao} · {e.matriculas_ativas} alunos</span></span>
                <span className="shrink-0 text-xs text-suave">{data(e.criado_em)}</span>
              </li>
            ))}
          </ul>
        </Cartao>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <BotaoLink href="/plataforma/blog" variante="secundario">Gerir blog ({artigos ?? 0} artigos)</BotaoLink>
      </div>
    </>
  );
}
