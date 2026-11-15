import { Aviso, Botao, Cabecalho, Campo, Cartao, Etiqueta, Tabela } from "@/components/ui";
import { exigirPapel, GESTAO } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";
import { NOMES_PAPEL, type Papel } from "@/lib/tipos";
import { alterarMembro, cancelarConvite, convidar } from "./acoes";

export const metadata = { title: "Equipa" };
const PAPEIS_EQUIPA: Papel[] = ["admin", "secretaria", "professor", "financeiro"];

export default async function Equipa({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel(...GESTAO);
  const admin = s.perfil.papel === "admin";
  const supabase = await supabaseServidor();
  const [{ data: membros }, { data: convites }] = await Promise.all([
    supabase.from("perfis").select("*").neq("papel", "encarregado").order("nome"),
    supabase.from("convites").select("*").is("aceite_em", null).neq("papel", "encarregado").order("criado_em", { ascending: false }),
  ]);

  return (
    <>
      <Cabecalho titulo="Equipa" subtitulo="Direção, secretaria, professores e tesouraria." />
      <Aviso ok={sp.ok} erro={sp.erro} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabela>
            <thead><tr><th>Nome</th><th>Papel</th><th>Estado</th>{admin && <th />}</tr></thead>
            <tbody>
              {(membros ?? []).map((m) => (
                <tr key={m.user_id}>
                  <td className="font-medium">{m.nome}{m.user_id === s.userId && <span className="text-suave"> (você)</span>}</td>
                  {admin && m.user_id !== s.userId ? (
                    <td colSpan={3}>
                      <form action={alterarMembro.bind(null, m.user_id)} className="flex flex-wrap items-center gap-3">
                        <select name="papel" defaultValue={m.papel} className="campo w-auto py-1">{PAPEIS_EQUIPA.map((p) => <option key={p} value={p}>{NOMES_PAPEL[p]}</option>)}</select>
                        <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="ativo" defaultChecked={m.ativo} /> Ativo</label>
                        <Botao variante="fantasma" className="py-1">Guardar</Botao>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td>{NOMES_PAPEL[m.papel as Papel]}</td>
                      <td><Etiqueta tom={m.ativo ? "sucesso" : "perigo"}>{m.ativo ? "Ativo" : "Inativo"}</Etiqueta></td>
                      {admin && <td />}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </Tabela>
          {(convites ?? []).length > 0 && (
            <Cartao titulo="Convites pendentes">
              <ul className="divide-y divide-linha text-sm">
                {convites!.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <span><strong>{c.nome}</strong> · {c.email} · {NOMES_PAPEL[c.papel as Papel]} <span className="text-suave">({data(c.criado_em)})</span></span>
                    <form action={cancelarConvite.bind(null, c.id)}><button className="text-xs text-vermelho hover:underline">Cancelar</button></form>
                  </li>
                ))}
              </ul>
            </Cartao>
          )}
        </div>
        <Cartao titulo="Convidar membro">
          <form action={convidar} className="space-y-3">
            <Campo rotulo="Nome"><input name="nome" className="campo" required /></Campo>
            <Campo rotulo="Email"><input type="email" name="email" className="campo" required /></Campo>
            <Campo rotulo="Papel">
              <select name="papel" className="campo" defaultValue="professor">
                {PAPEIS_EQUIPA.filter((p) => admin || !["admin", "financeiro"].includes(p)).map((p) => <option key={p} value={p}>{NOMES_PAPEL[p]}</option>)}
              </select>
            </Campo>
            <Botao className="w-full">Criar convite</Botao>
            <p className="ajuda">A pessoa cria conta com este email e entra automaticamente na escola com este papel.</p>
          </form>
        </Cartao>
      </div>
    </>
  );
}
