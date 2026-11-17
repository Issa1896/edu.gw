"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServidor } from "@/lib/supabase/server";
import { obterSessao } from "@/lib/sessao";
import { texto } from "@/lib/formato";
import { slugificar } from "@/lib/markdown";

async function exigirPlataforma() {
  const s = await obterSessao();
  if (!s.plataformaAdmin) redirect("/painel");
  return s;
}

export async function guardarArtigo(id: string | null, fd: FormData) {
  const s = await exigirPlataforma();
  const supabase = await supabaseServidor();
  const titulo = texto(fd, "titulo")!;
  const capa = texto(fd, "capa_url");
  const dados = {
    titulo,
    slug: slugificar(texto(fd, "slug") ?? titulo) || `artigo-${Date.now()}`,
    resumo: texto(fd, "resumo"),
    categoria: texto(fd, "categoria") ?? "Novidades",
    capa_url: capa && /^https:\/\//.test(capa) ? capa : null,
    corpo: String(fd.get("corpo") ?? ""),
    autor_nome: texto(fd, "autor_nome") ?? s.perfil.nome,
    publicado: fd.get("publicado") === "on",
  };
  const r = id
    ? await supabase.from("artigos").update(dados).eq("id", id).select("id").single()
    : await supabase.from("artigos").insert(dados).select("id").single();
  if (r.error) {
    const msg = r.error.code === "23505" ? "Já existe um artigo com esse endereço (slug)." : r.error.message;
    redirect(`/plataforma/blog/${id ?? "novo"}?erro=` + encodeURIComponent(msg));
  }
  revalidatePath("/blog");
  revalidatePath(`/blog/${dados.slug}`);
  revalidatePath("/");
  redirect(`/plataforma/blog/${r.data!.id}?ok=` + encodeURIComponent(dados.publicado ? "Artigo publicado." : "Rascunho guardado."));
}

export async function apagarArtigo(id: string) {
  await exigirPlataforma();
  const supabase = await supabaseServidor();
  await supabase.from("artigos").delete().eq("id", id);
  revalidatePath("/blog");
  redirect("/plataforma/blog?ok=" + encodeURIComponent("Artigo apagado."));
}
