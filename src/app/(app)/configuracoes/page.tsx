import { Aviso, Botao, Cabecalho, Campo, Cartao, Etiqueta } from "@/components/ui";
import { exigirPapel } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";
import { REGIOES } from "@/lib/tipos";
import { apagarDisciplina, guardarEscola, novaDisciplina, novoAno, tornarAtual } from "./acoes";

export const metadata = { title: "Configurações" };

export default async function Configuracoes({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel("admin");
  const supabase = await supabaseServidor();
  const [{ data: anos }, { data: disciplinas }] = await Promise.all([
    supabase.from("anos_letivos").select("*").order("inicio", { ascending: false }),
    supabase.from("disciplinas").select("*").order("nome"),
  ]);
  const e = s.escola;
  const prox = new Date().getFullYear();

  return (
    <>
      <Cabecalho titulo="Configurações" />
      <Aviso ok={sp.ok} erro={sp.erro} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Dados da escola" className="lg:row-span-2">
          <form action={guardarEscola} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Campo rotulo="Nome"><input name="nome" defaultValue={e.nome} className="campo" required /></Campo></div>
            <Campo rotulo="Sigla"><input name="sigla" defaultValue={e.sigla ?? ""} className="campo" /></Campo>
            <Campo rotulo="Tipo">
              <select name="tipo" defaultValue={e.tipo} className="campo">
                <option value="publica">Pública</option><option value="privada">Privada</option><option value="comunitaria">Comunitária</option>
                <option value="confessional">Confessional</option><option value="autogestao">Autogestão</option>
              </select>
            </Campo>
            <Campo rotulo="Região">
              <select name="regiao" defaultValue={e.regiao} className="campo">{Object.entries(REGIOES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </Campo>
            <Campo rotulo="Setor"><input name="setor" defaultValue={e.setor ?? ""} className="campo" /></Campo>
            <div className="sm:col-span-2"><Campo rotulo="Morada"><input name="morada" defaultValue={e.morada ?? ""} className="campo" /></Campo></div>
            <Campo rotulo="Telefone"><input name="telefone" defaultValue={e.telefone ?? ""} className="campo" /></Campo>
            <Campo rotulo="Email"><input type="email" name="email" defaultValue={e.email ?? ""} className="campo" /></Campo>
            <Campo rotulo="NIF"><input name="nif" defaultValue={e.nif ?? ""} className="campo" /></Campo>
            <Campo rotulo="Diretor(a)" ajuda="Aparece nos boletins."><input name="diretor" defaultValue={e.diretor ?? ""} className="campo" /></Campo>
            <Campo rotulo="Nota mínima de aprovação" ajuda="Escala 0–20."><input type="number" name="nota_minima" min={0} max={20} step={0.5} defaultValue={e.nota_minima} className="campo" /></Campo>
            <div className="sm:col-span-2"><Botao>Guardar</Botao></div>
          </form>
        </Cartao>

        <Cartao titulo="Anos letivos">
          <ul className="mb-4 divide-y divide-linha text-sm">
            {(anos ?? []).map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span><strong>{a.nome}</strong> <span className="text-suave">{data(a.inicio)} – {data(a.fim)}</span></span>
                {a.atual ? <Etiqueta tom="sucesso">Atual</Etiqueta> : <form action={tornarAtual.bind(null, a.id)}><Botao variante="fantasma" className="py-1">Tornar atual</Botao></form>}
              </li>
            ))}
          </ul>
          <details>
            <summary className="cursor-pointer text-sm font-medium text-verde">Novo ano letivo</summary>
            <form action={novoAno} className="mt-3 grid gap-3 sm:grid-cols-3">
              <Campo rotulo="Nome"><input name="nome" defaultValue={`${prox}/${prox + 1}`} className="campo" required /></Campo>
              <Campo rotulo="Início"><input type="date" name="inicio" defaultValue={`${prox}-10-01`} className="campo" required /></Campo>
              <Campo rotulo="Fim"><input type="date" name="fim" defaultValue={`${prox + 1}-07-31`} className="campo" required /></Campo>
              <label className="flex items-center gap-2 text-sm sm:col-span-3"><input type="checkbox" name="atual" /> Tornar este o ano atual</label>
              <Botao variante="secundario" className="sm:col-span-3">Criar</Botao>
            </form>
          </details>
        </Cartao>

        <Cartao titulo="Disciplinas">
          <div className="mb-4 flex flex-wrap gap-2">
            {(disciplinas ?? []).map((d) => (
              <form key={d.id} action={apagarDisciplina.bind(null, d.id)} className="inline-flex items-center gap-1 rounded-full border border-linha px-3 py-1 text-sm">
                {d.nome}{d.sigla && <span className="text-suave"> · {d.sigla}</span>}
                <button className="ml-1 text-suave hover:text-vermelho" aria-label={`Remover ${d.nome}`} title="Remover">✕</button>
              </form>
            ))}
          </div>
          <form action={novaDisciplina} className="flex flex-wrap items-end gap-2">
            <Campo rotulo="Nova disciplina"><input name="nome" className="campo" required placeholder="Ex.: Língua Guineense (Kriol)" /></Campo>
            <Campo rotulo="Sigla"><input name="sigla" className="campo w-24" /></Campo>
            <Botao variante="secundario">Adicionar</Botao>
          </form>
        </Cartao>
      </div>
    </>
  );
}
