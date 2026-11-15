"use server";

import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { texto } from "@/lib/formato";

export async function guardarPerfil(fd: FormData) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc("atualizar_meu_perfil", { p_nome: texto(fd, "nome"), p_telefone: texto(fd, "telefone") });
  redirect("/conta?" + (error ? "erro=" + encodeURIComponent(error.message) : "ok=" + encodeURIComponent("Perfil atualizado.")));
}

export async function mudarSenha(fd: FormData) {
  const senha = String(fd.get("senha") ?? "");
  if (senha.length < 8) redirect("/conta?erro=" + encodeURIComponent("A palavra-passe deve ter pelo menos 8 caracteres."));
  if (senha !== fd.get("confirmar")) redirect("/conta?erro=" + encodeURIComponent("As palavras-passe não coincidem."));
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.updateUser({ password: senha });
  redirect("/conta?" + (error ? "erro=" + encodeURIComponent(error.message) : "ok=" + encodeURIComponent("Palavra-passe alterada.")));
}
