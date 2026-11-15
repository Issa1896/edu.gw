import { supabaseServidor } from "@/lib/supabase/server";

/** Regra de transição: média ≥ nota mínima em todas as disciplinas, admitindo até MAX_NEGATIVAS negativas. */
export const MAX_NEGATIVAS = 2;

export type LinhaBoletim = { disciplina_id: string; disciplina: string; t1: number | null; t2: number | null; t3: number | null; media: number | null };

export function situacao(linhas: LinhaBoletim[], minima: number, trimestre?: number) {
  const vals = linhas.map((l) => (trimestre ? (l as unknown as Record<string, number | null>)[`t${trimestre}`] : l.media)).filter((v): v is number => v !== null);
  if (vals.length === 0) return { media: null, negativas: 0, texto: "Sem avaliação", aprovado: null as boolean | null };
  const media = Math.round((vals.reduce((a, b) => a + Number(b), 0) / vals.length) * 10) / 10;
  const negativas = vals.filter((v) => Number(v) < minima).length;
  const aprovado = negativas <= MAX_NEGATIVAS;
  return { media, negativas, aprovado, texto: aprovado ? "Aprovado(a)" : "Não aprovado(a)" };
}

/** Dados de boletim para várias matrículas de uma vez. */
export async function boletins(matriculaIds: string[], turmaId: string) {
  const supabase = await supabaseServidor();
  const [{ data: tds }, { data: medias }, { data: faltas }] = await Promise.all([
    supabase.from("turma_disciplinas").select("disciplina_id, disciplinas(nome)").eq("turma_id", turmaId),
    supabase.from("medias_disciplina").select("matricula_id, disciplina_id, t1, t2, t3, media").in("matricula_id", matriculaIds),
    supabase.from("faltas").select("matricula_id, justificada").in("matricula_id", matriculaIds),
  ]);
  const discs = ((tds ?? []) as unknown as { disciplina_id: string; disciplinas: { nome: string } }[])
    .map((d) => ({ id: d.disciplina_id, nome: d.disciplinas.nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  const porMat: Record<string, LinhaBoletim[]> = {};
  for (const id of matriculaIds) {
    porMat[id] = discs.map((d) => {
      const m = (medias ?? []).find((x) => x.matricula_id === id && x.disciplina_id === d.id);
      const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
      return { disciplina_id: d.id, disciplina: d.nome, t1: n(m?.t1), t2: n(m?.t2), t3: n(m?.t3), media: n(m?.media) };
    });
  }
  const faltasPor: Record<string, { t: number; j: number }> = {};
  for (const f of faltas ?? []) { const x = (faltasPor[f.matricula_id] ??= { t: 0, j: 0 }); x.t++; if (f.justificada) x.j++; }
  return { discs, porMat, faltasPor };
}
