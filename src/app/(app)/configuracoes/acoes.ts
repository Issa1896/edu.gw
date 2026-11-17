"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServidor } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/sessao";
import { texto } from "@/lib/formato";
import { slugificar } from "@/lib/markdown";

const ok = (m: string) => redirect("/configuracoes?ok=" + encodeURIComponent(m));
const erro = (m: string) => redirect("/configuracoes?erro=" + encodeURIComponent(m));

export async function guardarEscola(fd: FormData) {
  const s = await exigirPapel("admin");
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("escolas").update({
    nome: texto(fd, "nome")!, sigla: texto(fd, "sigla"), tipo: texto(fd, "tipo") ?? "privada", regiao: texto(fd, "regiao") ?? "SAB",
    setor: texto(fd, "setor"), morada: texto(fd, "morada"), telefone: texto(fd, "telefone"), email: texto(fd, "email"),
    nif: texto(fd, "nif"), diretor: texto(fd, "diretor"), nota_minima: Number(texto(fd, "nota_minima") ?? 10),
  }).eq("id", s.escola.id);
  revalidatePath("/", "layout");
  if (error) erro(error.message);
  ok("Dados da escola guardados.");
}

export async function novoAno(fd: FormData) {
  const s = await exigirPapel("admin");
  const supabase = await supabaseServidor();
  const atual = fd.get("atual") === "on";
  if (atual) await supabase.from("anos_letivos").update({ atual: false }).eq("escola_id", s.escola.id);
  const { error } = await supabase.from("anos_letivos").insert({
    escola_id: s.escola.id, nome: texto(fd, "nome")!, inicio: texto(fd, "inicio")!, fim: texto(fd, "fim")!, atual,
  });
  revalidatePath("/", "layout");
  if (error) erro(error.message);
  ok("Ano letivo criado.");
}

export async function tornarAtual(id: string) {
  const s = await exigirPapel("admin");
  const supabase = await supabaseServidor();
  await supabase.from("anos_letivos").update({ atual: false }).eq("escola_id", s.escola.id);
  await supabase.from("anos_letivos").update({ atual: true }).eq("id", id);
  revalidatePath("/", "layout");
  ok("Ano letivo atual alterado.");
}

export async function novaDisciplina(fd: FormData) {
  const s = await exigirPapel("admin");
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("disciplinas").insert({ escola_id: s.escola.id, nome: texto(fd, "nome")!, sigla: texto(fd, "sigla") });
  if (error) erro(error.code === "23505" ? "Essa disciplina já existe." : error.message);
  ok("Disciplina adicionada.");
}

export async function apagarDisciplina(id: string) {
  await exigirPapel("admin");
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("disciplinas").delete().eq("id", id);
  if (error) erro(error.message);
  ok("Disciplina removida.");
}

export async function guardarPaginaPublica(fd: FormData) {
  const s = await exigirPapel("admin");
  const supabase = await supabaseServidor();
  const slug = slugificar(texto(fd, "slug") ?? s.escola.sigla ?? s.escola.nome);
  if (!slug) erro("Indique o endereço da página.");
  const { error } = await supabase.from("escolas").update({
    slug, pagina_publica: fd.get("pagina_publica") === "on", descricao: texto(fd, "descricao"),
  }).eq("id", s.escola.id);
  if (error) erro(error.code === "23505" ? "Esse endereço já está a ser usado por outra escola." : error.message);
  revalidatePath(`/escola/${slug}`);
  revalidatePath("/escolas");
  ok("Página pública atualizada.");
}
