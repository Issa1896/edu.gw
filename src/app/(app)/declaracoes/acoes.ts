"use server";

import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/sessao";
import { texto } from "@/lib/formato";
import { montarDeclaracao, TIPOS_DECLARACAO, type TipoDeclaracao } from "@/lib/declaracoes";

export async function emitirDeclaracao(alunoId: string, matriculaId: string, fd: FormData) {
  const s = await exigirPapel("admin", "secretaria", "financeiro");
  const tipo = texto(fd, "tipo") as TipoDeclaracao;
  if (!(tipo in TIPOS_DECLARACAO)) redirect(`/alunos/${alunoId}?erro=` + encodeURIComponent("Tipo de declaração inválido."));
  if (s.perfil.papel === "financeiro" && tipo !== "quitacao") redirect(`/alunos/${alunoId}?erro=` + encodeURIComponent("A tesouraria só emite declarações de quitação."));

  const r = await montarDeclaracao(matriculaId, tipo, s.escola);
  if (!r.ok) redirect(`/alunos/${alunoId}?erro=` + encodeURIComponent(r.erro));

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from("declaracoes").insert({
    escola_id: s.escola.id, matricula_id: matriculaId, tipo, finalidade: texto(fd, "finalidade"),
    conteudo: r.conteudo, emitida_por: s.userId, emitida_por_nome: s.perfil.nome,
  }).select("id").single();
  if (error) redirect(`/alunos/${alunoId}?erro=` + encodeURIComponent(error.message));
  redirect(`/declaracoes/${data!.id}`);
}

export async function anularDeclaracao(id: string, fd: FormData) {
  await exigirPapel("admin", "secretaria");
  const motivo = texto(fd, "motivo");
  if (!motivo) redirect(`/declaracoes/${id}?erro=` + encodeURIComponent("Indique o motivo da anulação."));
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("declaracoes").update({ anulada_em: new Date().toISOString(), motivo_anulacao: motivo }).eq("id", id).is("anulada_em", null);
  redirect(`/declaracoes/${id}?` + (error ? "erro=" + encodeURIComponent(error.message) : "ok=" + encodeURIComponent("Declaração anulada. A verificação pública passa a mostrá-la como inválida.")));
}
