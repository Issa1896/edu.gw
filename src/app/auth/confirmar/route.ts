import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const seguir = url.searchParams.get("seguir") ?? "/painel";
  if (code) {
    const supabase = await supabaseServidor();
    await supabase.auth.exchangeCodeForSession(code);
  }
  const destino = seguir.startsWith("/") && !seguir.startsWith("//") ? seguir : "/painel";
  return NextResponse.redirect(new URL(destino, url.origin));
}
