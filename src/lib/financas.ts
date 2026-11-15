import { supabaseServidor } from "@/lib/supabase/server";
import { hojeISO, mesesLetivos } from "@/lib/formato";
import type { AnoLetivo } from "@/lib/tipos";

export type MatFin = {
  id: string; bolsa_percentagem: number; numero_turma: number | null;
  alunos: { id: string; nome: string; numero: string };
  turmas: { id: string; nome: string; classes: { propina_mensal: number; taxa_matricula: number } };
};

export function propinaDevida(m: MatFin) {
  return Math.round((m.turmas.classes.propina_mensal * (100 - m.bolsa_percentagem)) / 100);
}

/** Meses letivos já vencidos (até ao mês corrente, inclusive). */
export function mesesVencidos(ano: AnoLetivo) {
  const atual = hojeISO().slice(0, 7) + "-01";
  return mesesLetivos(ano.inicio, ano.fim).filter((m) => m <= atual);
}

export async function matriculasFinanceiras(anoId: string, turmaId?: string) {
  const supabase = await supabaseServidor();
  let q = supabase
    .from("matriculas")
    .select("id, bolsa_percentagem, numero_turma, alunos(id, nome, numero), turmas(id, nome, classes(propina_mensal, taxa_matricula))")
    .eq("ano_letivo_id", anoId)
    .eq("estado", "ativa");
  if (turmaId) q = q.eq("turma_id", turmaId);
  const { data } = await q;
  return ((data ?? []) as unknown as MatFin[]).sort(
    (a, b) => a.turmas.nome.localeCompare(b.turmas.nome, "pt", { numeric: true }) || a.alunos.nome.localeCompare(b.alunos.nome, "pt"),
  );
}
