"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServidor } from "@/lib/supabase/server";
import { exigirPapel, GESTAO } from "@/lib/sessao";
import { texto } from "@/lib/formato";

export async function criarTurma(fd: FormData) {
  const s = await exigirPapel(...GESTAO);
  if (!s.ano) redirect("/turmas?erro=" + encodeURIComponent("Defina o ano letivo atual em Configurações."));
  const supabase = await supabaseServidor();
  const { data: t, error } = await supabase.from("turmas").insert({
    escola_id: s.escola.id, ano_letivo_id: s.ano!.id, classe_id: texto(fd, "classe_id")!, nome: texto(fd, "nome")!,
    turno: texto(fd, "turno") ?? "manha", sala: texto(fd, "sala"), capacidade: Number(texto(fd, "capacidade") ?? 45),
  }).select("id").single();
  if (error) redirect("/turmas?erro=" + encodeURIComponent(error.code === "23505" ? "Já existe uma turma com esse nome." : error.message));

  // Atribui todas as disciplinas escolhidas
  const discs = fd.getAll("disciplinas").map(String);
  if (discs.length) {
    await supabase.from("turma_disciplinas").insert(discs.map((d) => ({ escola_id: s.escola.id, turma_id: t!.id, disciplina_id: d })));
  }
  revalidatePath("/turmas");
  redirect(`/turmas/${t!.id}?ok=` + encodeURIComponent("Turma criada. Atribua agora os professores."));
}

export async function atualizarTurma(id: string, fd: FormData) {
  await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("turmas").update({
    nome: texto(fd, "nome")!, turno: texto(fd, "turno") ?? "manha", sala: texto(fd, "sala"),
    capacidade: Number(texto(fd, "capacidade") ?? 45), diretor_turma: texto(fd, "diretor_turma"),
  }).eq("id", id);
  if (error) redirect(`/turmas/${id}?erro=` + encodeURIComponent(error.message));
  redirect(`/turmas/${id}?ok=` + encodeURIComponent("Turma atualizada."));
}

export async function atribuirProfessores(id: string, fd: FormData) {
  const s = await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  for (const [k, v] of fd.entries()) {
    if (!k.startsWith("prof_")) continue;
    const tdId = k.slice(5);
    await supabase.from("turma_disciplinas").update({ professor_id: v ? String(v) : null }).eq("id", tdId);
  }
  const nova = texto(fd, "nova_disciplina");
  if (nova) await supabase.from("turma_disciplinas").insert({ escola_id: s.escola.id, turma_id: id, disciplina_id: nova });
  redirect(`/turmas/${id}?ok=` + encodeURIComponent("Disciplinas e professores guardados."));
}

export async function removerDisciplina(turmaId: string, tdId: string) {
  await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  await supabase.from("turma_disciplinas").delete().eq("id", tdId);
  redirect(`/turmas/${turmaId}`);
}

export async function numerarAlunos(turmaId: string) {
  await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  const { data } = await supabase.from("matriculas").select("id, alunos(nome)").eq("turma_id", turmaId).eq("estado", "ativa");
  const ordenadas = ((data ?? []) as unknown as { id: string; alunos: { nome: string } }[])
    .sort((a, b) => a.alunos.nome.localeCompare(b.alunos.nome, "pt"));
  await Promise.all(ordenadas.map((m, i) => supabase.from("matriculas").update({ numero_turma: i + 1 }).eq("id", m.id)));
  redirect(`/turmas/${turmaId}?ok=` + encodeURIComponent("Alunos numerados por ordem alfabética."));
}
