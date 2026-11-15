"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServidor } from "@/lib/supabase/server";
import { texto } from "@/lib/formato";

async function origem() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function entrar(fd: FormData) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: texto(fd, "email") ?? "",
    password: String(fd.get("senha") ?? ""),
  });
  if (error) redirect("/entrar?erro=" + encodeURIComponent("Email ou palavra-passe incorretos."));
  const seguir = texto(fd, "seguir");
  redirect(seguir && seguir.startsWith("/") && !seguir.startsWith("//") ? seguir : "/painel");
}

export async function registar(fd: FormData) {
  const senha = String(fd.get("senha") ?? "");
  if (senha.length < 8) redirect("/registar?erro=" + encodeURIComponent("A palavra-passe deve ter pelo menos 8 caracteres."));
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.signUp({
    email: texto(fd, "email") ?? "",
    password: senha,
    options: { emailRedirectTo: `${await origem()}/auth/confirmar` },
  });
  if (error) redirect("/registar?erro=" + encodeURIComponent(error.message));
  if (!data.session) redirect("/entrar?ok=" + encodeURIComponent("Conta criada. Confirme o seu email e depois entre."));
  redirect("/painel");
}

export async function recuperar(fd: FormData) {
  const supabase = await supabaseServidor();
  await supabase.auth.resetPasswordForEmail(texto(fd, "email") ?? "", {
    redirectTo: `${await origem()}/auth/confirmar?seguir=/conta`,
  });
  redirect("/entrar?ok=" + encodeURIComponent("Se o email existir, enviámos um link para redefinir a palavra-passe."));
}

export async function sair() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}
