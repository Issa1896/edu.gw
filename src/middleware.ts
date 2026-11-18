import { NextResponse, type NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    return await atualizarSessao(request);
  } catch (e) {
    console.error("edu.gw: erro no middleware", e);
    return NextResponse.next({ request });
  }
}

export const config = {
  // Corre em Node.js (e não no Edge), onde a biblioteca do Supabase funciona sem limitações.
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|og.png|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
