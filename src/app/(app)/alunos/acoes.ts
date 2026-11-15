"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServidor } from "@/lib/supabase/server";
import { exigirPapel, GESTAO } from "@/lib/sessao";
import { texto } from "@/lib/formato";

function dadosAluno(fd: FormData) {
  return {
    nome: texto(fd, "nome")!,
    genero: texto(fd, "genero"),
    data_nascimento: texto(fd, "data_nascimento"),
    naturalidade: texto(fd, "naturalidade"),
    nacionalidade: texto(fd, "nacionalidade"),
    linguas: texto(fd, "linguas"),
    morada: texto(fd, "morada"),
    bi: texto(fd, "bi"),
    observacoes: texto(fd, "observacoes"),
  };
}

async function proximoNumero(escolaId: string) {
  const supabase = await supabaseServidor();
  const ano = new Date().getFullYear();
  const { count } = await supabase.from("alunos").select("id", { count: "exact", head: true }).eq("escola_id", escolaId);
  return `${ano}${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export async function matricularNovo(fd: FormData) {
  const s = await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  if (!s.ano) redirect("/alunos/novo?erro=" + encodeURIComponent("Defina primeiro o ano letivo atual."));

  let numero = texto(fd, "numero") ?? (await proximoNumero(s.escola.id));
  let aluno: { id: string } | null = null;
  for (let tentativa = 0; tentativa < 3 && !aluno; tentativa++) {
    const r = await supabase.from("alunos").insert({ escola_id: s.escola.id, numero, ...dadosAluno(fd) }).select("id").single();
    if (r.error?.code === "23505" && !texto(fd, "numero")) { numero = String(Number(numero) + 1); continue; }
    if (r.error) redirect("/alunos/novo?erro=" + encodeURIComponent(r.error.message));
    aluno = r.data;
  }
  if (!aluno) redirect("/alunos/novo?erro=" + encodeURIComponent("Não foi possível gerar o número de processo."));

  const nomeEnc = texto(fd, "enc_nome");
  if (nomeEnc) {
    const { data: enc } = await supabase.from("encarregados").insert({
      escola_id: s.escola.id, nome: nomeEnc, parentesco: texto(fd, "enc_parentesco"),
      telefone: texto(fd, "enc_telefone"), email: texto(fd, "enc_email"), profissao: texto(fd, "enc_profissao"),
    }).select("id").single();
    if (enc) await supabase.from("aluno_encarregados").insert({ aluno_id: aluno.id, encarregado_id: enc.id, escola_id: s.escola.id });
  }

  const turma = texto(fd, "turma_id");
  if (turma) {
    const { error } = await supabase.from("matriculas").insert({
      escola_id: s.escola.id, aluno_id: aluno.id, turma_id: turma, ano_letivo_id: s.ano!.id,
      bolsa_percentagem: Number(texto(fd, "bolsa") ?? 0),
    });
    if (error) redirect(`/alunos/${aluno.id}?erro=` + encodeURIComponent("Aluno criado, mas a matrícula falhou: " + error.message));
  }
  revalidatePath("/alunos");
  redirect(`/alunos/${aluno.id}?ok=` + encodeURIComponent("Aluno registado com sucesso."));
}

export async function editarAluno(id: string, fd: FormData) {
  await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("alunos").update({ numero: texto(fd, "numero")!, ...dadosAluno(fd) }).eq("id", id);
  if (error) redirect(`/alunos/${id}/editar?erro=` + encodeURIComponent(error.message));
  redirect(`/alunos/${id}?ok=` + encodeURIComponent("Dados atualizados."));
}

export async function matricular(alunoId: string, fd: FormData) {
  const s = await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  const turma = texto(fd, "turma_id");
  if (!s.ano || !turma) redirect(`/alunos/${alunoId}`);
  const { error } = await supabase.from("matriculas").insert({
    escola_id: s.escola.id, aluno_id: alunoId, turma_id: turma, ano_letivo_id: s.ano!.id,
    bolsa_percentagem: Number(texto(fd, "bolsa") ?? 0),
  });
  if (error) redirect(`/alunos/${alunoId}?erro=` + encodeURIComponent(error.message));
  redirect(`/alunos/${alunoId}?ok=` + encodeURIComponent("Matrícula efetuada."));
}

export async function atualizarMatricula(alunoId: string, matriculaId: string, fd: FormData) {
  await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("matriculas").update({
    turma_id: texto(fd, "turma_id")!,
    estado: texto(fd, "estado") ?? "ativa",
    bolsa_percentagem: Number(texto(fd, "bolsa") ?? 0),
  }).eq("id", matriculaId);
  if (error) redirect(`/alunos/${alunoId}?erro=` + encodeURIComponent(error.message));
  redirect(`/alunos/${alunoId}?ok=` + encodeURIComponent("Matrícula atualizada."));
}

export async function adicionarEncarregado(alunoId: string, fd: FormData) {
  const s = await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  const { data: enc, error } = await supabase.from("encarregados").insert({
    escola_id: s.escola.id, nome: texto(fd, "nome")!, parentesco: texto(fd, "parentesco"),
    telefone: texto(fd, "telefone"), email: texto(fd, "email"), profissao: texto(fd, "profissao"),
  }).select("id").single();
  if (error) redirect(`/alunos/${alunoId}?erro=` + encodeURIComponent(error.message));
  await supabase.from("aluno_encarregados").insert({ aluno_id: alunoId, encarregado_id: enc!.id, escola_id: s.escola.id });
  redirect(`/alunos/${alunoId}?ok=` + encodeURIComponent("Encarregado adicionado."));
}

export async function convidarEncarregado(alunoId: string, encarregadoId: string) {
  const s = await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  const { data: enc } = await supabase.from("encarregados").select("nome, email").eq("id", encarregadoId).single();
  if (!enc?.email) redirect(`/alunos/${alunoId}?erro=` + encodeURIComponent("Indique primeiro o email do encarregado."));
  const { error } = await supabase.from("convites").upsert(
    { escola_id: s.escola.id, email: enc!.email!.toLowerCase(), nome: enc!.nome, papel: "encarregado", encarregado_id: encarregadoId },
    { onConflict: "escola_id,email" },
  );
  if (error) redirect(`/alunos/${alunoId}?erro=` + encodeURIComponent(error.message));
  redirect(`/alunos/${alunoId}?ok=` + encodeURIComponent(`Acesso preparado. Peça a ${enc!.nome} que crie conta em edu.gw com o email ${enc!.email}.`));
}
