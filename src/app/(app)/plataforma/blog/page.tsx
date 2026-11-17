import Link from "next/link";
import { redirect } from "next/navigation";
import { Aviso, BotaoLink, Cabecalho, Etiqueta, Tabela, Vazio } from "@/components/ui";
import { obterSessao } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";

export const metadata = { title: "Blog · Plataforma" };

export default async function GestaoBlog({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await obterSessao();
  if (!s.plataformaAdmin) redirect("/painel");
  const supabase = await supabaseServidor();
  const { data: artigos } = await supabase.from("artigos").select("id, slug, titulo, categoria, publicado, publicado_em, atualizado_em").order("atualizado_em", { ascending: false });

  return (
    <>
      <Cabecalho titulo="Blog" subtitulo="Artigos públicos em gwdigitalcompany.com/blog (equipa GW Digital)." acoes={<>
        <BotaoLink href="/blog" variante="secundario" target="_blank">Ver blog</BotaoLink>
        <BotaoLink href="/plataforma/blog/novo">Novo artigo</BotaoLink>
      </>} />
      <Aviso ok={sp.ok} erro={sp.erro} />
      {(artigos ?? []).length === 0 ? <Vazio titulo="Ainda não escreveu artigos"><BotaoLink href="/plataforma/blog/novo">Escrever o primeiro</BotaoLink></Vazio> : (
        <Tabela>
          <thead><tr><th>Título</th><th>Categoria</th><th>Estado</th><th>Atualizado</th></tr></thead>
          <tbody>
            {artigos!.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/plataforma/blog/${a.id}`} className="font-medium text-verde hover:underline">{a.titulo}</Link><br /><span className="text-xs text-suave">/blog/{a.slug}</span></td>
                <td>{a.categoria}</td>
                <td>{a.publicado ? <Etiqueta tom="sucesso">Publicado {data(a.publicado_em)}</Etiqueta> : <Etiqueta tom="aviso">Rascunho</Etiqueta>}</td>
                <td>{data(a.atualizado_em)}</td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}
