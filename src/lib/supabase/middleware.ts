import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLICAS = ["/entrar", "/registar", "/recuperar", "/auth", "/blog", "/verificar", "/api/chat", "/escolas", "/escola/"];

export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const caminho = request.nextUrl.pathname;
  const publica = caminho === "/" || PUBLICAS.some((p) => caminho.startsWith(p));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) {
    // Sem configuração: mostra as páginas públicas em vez de derrubar o site.
    console.error("edu.gw: faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente.");
    return resposta;
  }

  let user = null;
  try {
    const supabase = createServerClient(url, chave, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
        },
      },
    });
    ({ data: { user } } = await supabase.auth.getUser());
  } catch (e) {
    console.error("edu.gw: falha ao validar a sessão no Supabase", e);
  }

  if (!user && !publica) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.search = "";
    destino.searchParams.set("seguir", caminho);
    return NextResponse.redirect(destino);
  }

  return resposta;
}
