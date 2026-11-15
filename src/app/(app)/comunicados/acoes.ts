"use server";

import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { exigirPapel, GESTAO } from "@/lib/sessao";
import { texto } from "@/lib/formato";

export async function publicar(fd: FormData) {
  const s = await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  const publico = texto(fd, "publico") ?? "todos";
  const { error } = await supabase.from("comunicados").insert({
    escola_id: s.escola.id, titulo: texto(fd, "titulo")!, corpo: texto(fd, "corpo")!,
    publico, turma_id: publico === "turma" ? texto(fd, "turma_id") : null, autor_id: s.userId,
  });
  redirect("/comunicados?" + (error ? "erro=" + encodeURIComponent(error.message) : "ok=" + encodeURIComponent("Comunicado publicado.")));
}

export async function apagar(id: string) {
  await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  await supabase.from("comunicados").delete().eq("id", id);
  redirect("/comunicados");
}
