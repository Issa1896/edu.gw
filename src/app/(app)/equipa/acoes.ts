"use server";

import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { exigirPapel, GESTAO } from "@/lib/sessao";
import { texto } from "@/lib/formato";

export async function convidar(fd: FormData) {
  const s = await exigirPapel(...GESTAO);
  const papel = texto(fd, "papel") ?? "professor";
  if (s.perfil.papel !== "admin" && ["admin", "financeiro"].includes(papel)) {
    redirect("/equipa?erro=" + encodeURIComponent("Só a direção pode convidar membros da direção ou tesouraria."));
  }
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("convites").upsert(
    { escola_id: s.escola.id, email: texto(fd, "email")!.toLowerCase(), nome: texto(fd, "nome")!, papel },
    { onConflict: "escola_id,email" },
  );
  redirect("/equipa?" + (error ? "erro=" + encodeURIComponent(error.message) : "ok=" + encodeURIComponent("Convite criado. A pessoa deve criar conta em edu.gw com este email.")));
}

export async function cancelarConvite(id: string) {
  await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  await supabase.from("convites").delete().eq("id", id);
  redirect("/equipa");
}

export async function alterarMembro(userId: string, fd: FormData) {
  const s = await exigirPapel("admin");
  if (userId === s.userId) redirect("/equipa?erro=" + encodeURIComponent("Não pode alterar o seu próprio papel."));
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("perfis").update({ papel: texto(fd, "papel")!, ativo: fd.get("ativo") === "on" }).eq("user_id", userId);
  redirect("/equipa?" + (error ? "erro=" + encodeURIComponent(error.message) : "ok=" + encodeURIComponent("Membro atualizado.")));
}
