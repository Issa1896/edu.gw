import { redirect } from "next/navigation";
import { Cabecalho, Etiqueta, Tabela, Vazio } from "@/components/ui";
import { obterSessao } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";
import { NOMES_PAPEL, type Papel } from "@/lib/tipos";

export const metadata = { title: "Cadastros · Plataforma", robots: { index: false } };

type C = { user_id: string; email: string; criado_em: string; ultimo_acesso: string | null; confirmado: boolean; nome: string | null; papel: Papel | null; ativo: boolean | null; escola: string | null };

export default async function Cadastros({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await obterSessao();
  if (!s.plataformaAdmin) redirect("/painel");
  const supabase = await supabaseServidor();
  const { data: cad } = await supabase.rpc("plataforma_cadastros");
  let lista = (cad ?? []) as C[];
  if (sp.q) { const q = sp.q.toLowerCase(); lista = lista.filter((c) => [c.email, c.nome, c.escola].some((v) => v?.toLowerCase().includes(q))); }
  if (sp.papel === "sem") lista = lista.filter((c) => !c.papel);
  else if (sp.papel) lista = lista.filter((c) => c.papel === sp.papel);

  return (
    <>
      <Cabecalho titulo="Todos os cadastros" subtitulo={`${lista.length} conta(s)`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Email, nome ou escola" className="campo max-w-xs" />
        <select name="papel" defaultValue={sp.papel ?? ""} className="campo max-w-[14rem]">
          <option value="">Todos os papéis</option>
          {Object.entries(NOMES_PAPEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          <option value="sem">Sem escola</option>
        </select>
        <button className="rounded-md border border-linha bg-superficie px-4 text-sm font-semibold hover:bg-superficie-2">Filtrar</button>
      </form>
      {lista.length === 0 ? <Vazio titulo="Nenhum cadastro encontrado" /> : (
        <Tabela>
          <thead><tr><th>Nome / email</th><th>Escola</th><th>Papel</th><th>Criada</th><th>Último acesso</th><th>Estado</th></tr></thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.user_id}>
                <td><span className="font-medium">{c.nome ?? "—"}</span><br /><a href={`mailto:${c.email}`} className="text-xs text-verde hover:underline">{c.email}</a></td>
                <td>{c.escola ?? <span className="text-suave">—</span>}</td>
                <td>{c.papel ? NOMES_PAPEL[c.papel] : <span className="text-suave">—</span>}</td>
                <td className="whitespace-nowrap">{data(c.criado_em)}</td>
                <td className="whitespace-nowrap">{data(c.ultimo_acesso)}</td>
                <td className="space-x-1 whitespace-nowrap">
                  {!c.confirmado && <Etiqueta tom="aviso">Email por confirmar</Etiqueta>}
                  {!c.papel && <Etiqueta tom="aviso">Sem escola</Etiqueta>}
                  {c.ativo === false && <Etiqueta tom="perigo">Inativo</Etiqueta>}
                  {c.confirmado && c.papel && c.ativo !== false && <Etiqueta tom="sucesso">Ativo</Etiqueta>}
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}
