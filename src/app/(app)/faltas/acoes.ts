"use server";

import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/sessao";

export async function abrirChamada(fd: FormData) {
  const turma = String(fd.get("turma") ?? "");
  const disciplina = String(fd.get("disciplina") ?? "");
  redirect(`/faltas?turma=${turma}&disciplina=${disciplina}&data=${fd.get("data")}`);
}

export async function guardarChamada(fd: FormData) {
  const s = await exigirPapel("admin", "secretaria", "professor");
  const supabase = await supabaseServidor();
  const turma = String(fd.get("turma"));
  const disciplina = String(fd.get("disciplina") || "") || null;
  const dia = String(fd.get("data"));
  const voltar = `/faltas?turma=${turma}&disciplina=${disciplina ?? ""}&data=${dia}`;
  const todas = fd.getAll("mat").map(String);
  const faltou = new Set(fd.getAll("falta").map(String));
  const justif = new Set(fd.getAll("just").map(String));

  const marcar = todas.filter((m) => faltou.has(m)).map((m) => ({
    escola_id: s.escola.id, matricula_id: m, disciplina_id: disciplina, data: dia,
    justificada: justif.has(m), motivo: String(fd.get(`motivo_${m}`) ?? "").trim() || null, registado_por: s.userId,
  }));
  const limpar = todas.filter((m) => !faltou.has(m));

  if (marcar.length) {
    const { error } = await supabase.from("faltas").upsert(marcar, { onConflict: "matricula_id,disciplina_id,data" });
    if (error) redirect(voltar + "&erro=" + encodeURIComponent(error.message.includes("row-level") ? "Não tem permissão para registar faltas nesta turma/disciplina." : error.message));
  }
  if (limpar.length) {
    let q = supabase.from("faltas").delete().in("matricula_id", limpar).eq("data", dia);
    q = disciplina ? q.eq("disciplina_id", disciplina) : q.is("disciplina_id", null);
    await q;
  }
  redirect(voltar + "&ok=" + encodeURIComponent(`Chamada guardada: ${marcar.length} falta(s).`));
}
