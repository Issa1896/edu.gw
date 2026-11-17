import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import type { AnoLetivo, Escola, Papel, Perfil } from "@/lib/tipos";

export type Sessao = {
  userId: string;
  email: string | null;
  perfil: Perfil;
  escola: Escola;
  ano: AnoLetivo | null;
  plataformaAdmin: boolean;
};

/** Sessão do utilizador autenticado, com perfil, escola e ano letivo atual. */
export const obterSessao = cache(async (): Promise<Sessao> => {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  let { data: perfil } = await supabase.from("perfis").select("*").eq("user_id", user.id).maybeSingle();
  if (!perfil) {
    const { data: aceitou } = await supabase.rpc("aceitar_convite");
    if (aceitou) {
      ({ data: perfil } = await supabase.from("perfis").select("*").eq("user_id", user.id).maybeSingle());
    }
  }
  if (!perfil) redirect("/configurar");
  if (!perfil.ativo) redirect("/entrar?erro=inativo");

  const [{ data: escola }, { data: ano }, { data: plat }] = await Promise.all([
    supabase.from("escolas").select("*").eq("id", perfil.escola_id).single(),
    supabase.from("anos_letivos").select("*").eq("atual", true).maybeSingle(),
    supabase.rpc("e_plataforma_admin"),
  ]);

  return { userId: user.id, email: user.email ?? null, perfil, escola: escola!, ano, plataformaAdmin: plat === true };
});

/** Garante que o utilizador tem um dos papéis; caso contrário volta ao painel. */
export async function exigirPapel(...papeis: Papel[]) {
  const s = await obterSessao();
  if (!papeis.includes(s.perfil.papel)) redirect(s.perfil.papel === "encarregado" ? "/portal" : "/painel");
  return s;
}

export const EQUIPA: Papel[] = ["admin", "secretaria", "professor", "financeiro"];
export const GESTAO: Papel[] = ["admin", "secretaria"];
export const FINANCAS: Papel[] = ["admin", "financeiro", "secretaria"];
