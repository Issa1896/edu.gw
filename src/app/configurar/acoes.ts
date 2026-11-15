"use server";

import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { texto } from "@/lib/formato";

export async function criarEscola(fd: FormData) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc("criar_escola", {
    p_nome: texto(fd, "nome"),
    p_regiao: texto(fd, "regiao") ?? "SAB",
    p_tipo: texto(fd, "tipo") ?? "privada",
    p_nome_admin: texto(fd, "admin"),
    p_telefone: texto(fd, "telefone"),
  });
  if (error) redirect("/configurar?erro=" + encodeURIComponent(error.message));
  redirect("/painel?ok=" + encodeURIComponent("Escola criada. Comece por rever as classes, propinas e turmas."));
}
