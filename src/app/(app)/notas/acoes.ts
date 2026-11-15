"use server";

import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/sessao";

export async function guardarNotas(fd: FormData) {
  const s = await exigirPapel("admin", "secretaria", "professor");
  const supabase = await supabaseServidor();
  const turma = String(fd.get("turma"));
  const disciplina = String(fd.get("disciplina"));
  const trimestre = Number(fd.get("trimestre"));
  const voltar = `/notas?turma=${turma}&disciplina=${disciplina}&trimestre=${trimestre}`;

  const gravar: { escola_id: string; matricula_id: string; disciplina_id: string; trimestre: number; nota: number }[] = [];
  const apagar: string[] = [];
  for (const [k, v] of fd.entries()) {
    if (!k.startsWith("n_")) continue;
    const mat = k.slice(2);
    const bruto = String(v).trim().replace(",", ".");
    if (bruto === "") { apagar.push(mat); continue; }
    const n = Number(bruto);
    if (Number.isNaN(n) || n < 0 || n > 20) redirect(voltar + "&erro=" + encodeURIComponent(`Nota inválida: "${v}". Use valores de 0 a 20.`));
    gravar.push({ escola_id: s.escola.id, matricula_id: mat, disciplina_id: disciplina, trimestre, nota: Math.round(n * 10) / 10 });
  }

  if (gravar.length) {
    const { error } = await supabase.from("notas").upsert(gravar, { onConflict: "matricula_id,disciplina_id,trimestre" });
    if (error) redirect(voltar + "&erro=" + encodeURIComponent(error.message.includes("row-level") ? "Não tem permissão para lançar notas nesta disciplina." : error.message));
  }
  if (apagar.length) {
    await supabase.from("notas").delete().in("matricula_id", apagar).eq("disciplina_id", disciplina).eq("trimestre", trimestre);
  }
  redirect(voltar + "&ok=" + encodeURIComponent(`${gravar.length} nota(s) guardada(s).`));
}

export async function abrirNotas(fd: FormData) {
  const [t, d] = String(fd.get("td")).split("|");
  redirect(`/notas?turma=${t}&disciplina=${d}&trimestre=${fd.get("trimestre")}`);
}
