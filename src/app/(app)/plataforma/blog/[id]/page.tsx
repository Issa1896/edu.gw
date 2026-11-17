import { notFound, redirect } from "next/navigation";
import { Aviso, Botao, BotaoLink, Cabecalho, Campo, Cartao } from "@/components/ui";
import { obterSessao } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { apagarArtigo, guardarArtigo } from "../acoes";

export const metadata = { title: "Editar artigo" };

const CATEGORIAS = ["Novidades", "Gestão escolar", "Pedagogia", "Tecnologia na educação", "Guia do edu.gw"];

export default async function EditarArtigo({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const s = await obterSessao();
  if (!s.plataformaAdmin) redirect("/painel");
  const novo = id === "novo";
  const supabase = await supabaseServidor();
  const { data: a } = novo ? { data: null } : await supabase.from("artigos").select("*").eq("id", id).maybeSingle();
  if (!novo && !a) notFound();

  return (
    <>
      <Cabecalho titulo={novo ? "Novo artigo" : "Editar artigo"} acoes={a?.publicado && <BotaoLink href={`/blog/${a.slug}`} variante="secundario" target="_blank">Ver publicado</BotaoLink>} />
      <Aviso ok={sp.ok} erro={sp.erro} />
      <form action={guardarArtigo.bind(null, novo ? null : id)} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Campo rotulo="Título"><input name="titulo" defaultValue={a?.titulo} required className="campo text-lg font-semibold" /></Campo>
          <Campo rotulo="Resumo" ajuda="Aparece na lista do blog e quando o link é partilhado (WhatsApp, Facebook)."><textarea name="resumo" rows={2} defaultValue={a?.resumo ?? ""} className="campo" /></Campo>
          <Campo rotulo="Texto" ajuda="Formatação: ## Título, **negrito**, *itálico*, - lista, > citação, [texto](https://link), ![descrição](https://imagem.jpg)">
            <textarea name="corpo" rows={22} defaultValue={a?.corpo ?? ""} className="campo font-mono text-sm leading-6" />
          </Campo>
        </div>
        <div className="space-y-4">
          <Cartao titulo="Publicação">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="publicado" defaultChecked={a?.publicado ?? false} className="h-4 w-4" /> Publicado (visível a todos)</label>
              <Campo rotulo="Categoria">
                <select name="categoria" defaultValue={a?.categoria ?? "Novidades"} className="campo">{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select>
              </Campo>
              <Campo rotulo="Endereço (slug)" ajuda="Vazio = gerado a partir do título."><input name="slug" defaultValue={a?.slug ?? ""} className="campo" placeholder="como-organizar-matriculas" /></Campo>
              <Campo rotulo="Imagem de capa (link https)"><input name="capa_url" defaultValue={a?.capa_url ?? ""} className="campo" placeholder="https://…" /></Campo>
              <Campo rotulo="Autor"><input name="autor_nome" defaultValue={a?.autor_nome ?? s.perfil.nome} className="campo" /></Campo>
              <Botao className="w-full">Guardar</Botao>
            </div>
          </Cartao>
        </div>
      </form>
      {!novo && (
        <form action={apagarArtigo.bind(null, id)} className="mt-6">
          <button className="text-sm text-vermelho hover:underline">Apagar artigo</button>
        </form>
      )}
    </>
  );
}
