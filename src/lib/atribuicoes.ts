import { supabaseServidor } from "@/lib/supabase/server";
import type { Sessao } from "@/lib/sessao";

export type Atribuicao = { turma_id: string; turma: string; disciplina_id: string; disciplina: string };

/** Turmas/disciplinas que o utilizador pode lançar (professor: as suas; gestão: todas). */
export async function atribuicoes(s: Sessao): Promise<Atribuicao[]> {
  const supabase = await supabaseServidor();
  let q = supabase
    .from("turma_disciplinas")
    .select("turma_id, disciplina_id, turmas!inner(nome, ano_letivo_id), disciplinas(nome)")
    .eq("turmas.ano_letivo_id", s.ano?.id ?? "");
  if (s.perfil.papel === "professor") q = q.eq("professor_id", s.userId);
  const { data } = await q;
  return ((data ?? []) as unknown as { turma_id: string; disciplina_id: string; turmas: { nome: string }; disciplinas: { nome: string } }[])
    .map((r) => ({ turma_id: r.turma_id, turma: r.turmas.nome, disciplina_id: r.disciplina_id, disciplina: r.disciplinas.nome }))
    .sort((a, b) => a.turma.localeCompare(b.turma, "pt", { numeric: true }) || a.disciplina.localeCompare(b.disciplina, "pt"));
}

export async function alunosDaTurma(turmaId: string) {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("matriculas")
    .select("id, numero_turma, alunos(nome, numero)")
    .eq("turma_id", turmaId)
    .eq("estado", "ativa");
  return ((data ?? []) as unknown as { id: string; numero_turma: number | null; alunos: { nome: string; numero: string } }[])
    .sort((a, b) => (a.numero_turma ?? 999) - (b.numero_turma ?? 999) || a.alunos.nome.localeCompare(b.alunos.nome, "pt"));
}
