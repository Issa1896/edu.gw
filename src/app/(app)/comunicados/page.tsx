import { Aviso, Botao, Cabecalho, Campo, Cartao, Etiqueta, Vazio } from "@/components/ui";
import { obterSessao } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";
import { apagar, publicar } from "./acoes";

export const metadata = { title: "Comunicados" };

const PUBLICOS: Record<string, string> = { todos: "Todos", professores: "Equipa", encarregados: "Encarregados", turma: "Turma" };

export default async function Comunicados({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await obterSessao();
  const supabase = await supabaseServidor();
  const gere = ["admin", "secretaria"].includes(s.perfil.papel);
  const [{ data: lista }, { data: turmas }] = await Promise.all([
    supabase.from("comunicados").select("*, turmas(nome)").order("publicado_em", { ascending: false }).limit(100),
    gere ? supabase.from("turmas").select("id, nome").eq("ano_letivo_id", s.ano?.id ?? "").order("nome") : Promise.resolve({ data: [] }),
  ]);

  return (
    <>
      <Cabecalho titulo="Comunicados" />
      <Aviso ok={sp.ok} erro={sp.erro} />
      <div className={`grid gap-6 ${gere ? "lg:grid-cols-3" : ""}`}>
        <div className="space-y-4 lg:col-span-2">
          {(lista ?? []).length === 0 ? <Vazio titulo="Sem comunicados" /> : lista!.map((c) => (
            <article key={c.id} className="rounded-lg border border-linha bg-superficie p-5">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{c.titulo}</h2>
                <div className="flex items-center gap-2 text-xs text-suave">
                  <Etiqueta>{c.publico === "turma" ? `Turma ${(c.turmas as { nome: string } | null)?.nome ?? ""}` : PUBLICOS[c.publico]}</Etiqueta>
                  {data(c.publicado_em)}
                </div>
              </header>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{c.corpo}</p>
              {gere && <form action={apagar.bind(null, c.id)} className="mt-3"><button className="text-xs text-vermelho hover:underline">Apagar</button></form>}
            </article>
          ))}
        </div>
        {gere && (
          <Cartao titulo="Novo comunicado">
            <form action={publicar} className="space-y-3">
              <Campo rotulo="Título"><input name="titulo" className="campo" required /></Campo>
              <Campo rotulo="Mensagem"><textarea name="corpo" rows={6} className="campo" required /></Campo>
              <Campo rotulo="Destinatários">
                <select name="publico" className="campo" defaultValue="todos">{Object.entries(PUBLICOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              </Campo>
              <Campo rotulo="Turma (se destinatário = Turma)">
                <select name="turma_id" className="campo" defaultValue=""><option value="">—</option>{(turmas ?? []).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select>
              </Campo>
              <Botao className="w-full">Publicar</Botao>
            </form>
          </Cartao>
        )}
      </div>
    </>
  );
}
