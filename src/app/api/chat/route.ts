import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";
import { obterSessao } from "@/lib/sessao";
import { NOMES_PAPEL } from "@/lib/tipos";
import { promptInterno, promptPublico } from "@/lib/ia/prompts";
import { FERRAMENTAS, executarFerramenta } from "@/lib/ia/ferramentas";

export const runtime = "nodejs";
export const maxDuration = 60;

const LIMITE_PUBLICO_IP = 25;     // mensagens por visitante por dia
const LIMITE_PUBLICO_TOTAL = 600; // teto diário do site inteiro (controla o custo)
const LIMITE_INTERNO = 80;        // mensagens por utilizador por dia

type Bloco = { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> };
type Msg = { role: "user" | "assistant"; content: string | Bloco[] | Record<string, unknown>[] };

function erro(msg: string, status = 400) {
  return NextResponse.json({ erro: msg }, { status });
}

async function claude(body: Record<string, unknown>) {
  const r = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", max_tokens: 1024, ...body }),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return (await r.json()) as { content: Bloco[]; stop_reason: string };
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return erro("O assistente ainda não está ativo. A equipa está a configurá-lo.", 503);
  }

  let corpo: { mensagens?: { role: string; content: string }[]; modo?: string };
  try { corpo = await req.json(); } catch { return erro("Pedido inválido."); }

  const historico: Msg[] = (corpo.mensagens ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 2000) }));
  if (!historico.length || historico[historico.length - 1].role !== "user") return erro("Escreva uma pergunta.");
  while (historico[0]?.role === "assistant") historico.shift();

  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  const interno = corpo.modo === "interno" && !!user;

  // Limites de uso
  if (interno) {
    const { data: ok, error } = await supabase.rpc("registar_uso_chat", { p_chave: `u:${user!.id}`, p_limite: LIMITE_INTERNO });
    if (error) return erro("O assistente está temporariamente indisponível.", 503);
    if (!ok) return erro("Atingiu o limite de perguntas de hoje. Volte amanhã.", 429);
  } else {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconhecido";
    const chave = "ip:" + createHash("sha256").update(ip + (process.env.ANTHROPIC_API_KEY ?? "").slice(-8)).digest("hex").slice(0, 32);
    const [a, b] = await Promise.all([
      supabase.rpc("registar_uso_chat", { p_chave: chave, p_limite: LIMITE_PUBLICO_IP }),
      supabase.rpc("registar_uso_chat", { p_chave: "publico-total", p_limite: LIMITE_PUBLICO_TOTAL }),
    ]);
    if (a.error || b.error) return erro("O assistente está temporariamente indisponível.", 503);
    if (!a.data || !b.data) return erro("Muitas perguntas por hoje. Tente amanhã ou registe a sua escola.", 429);
  }

  try {
    if (!interno) {
      const r = await claude({ system: promptPublico(), messages: historico });
      return NextResponse.json({ resposta: r.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim() });
    }

    const s = await obterSessao();
    const system = promptInterno(s.perfil.nome, NOMES_PAPEL[s.perfil.papel], s.escola.nome, s.ano?.nome ?? null);
    const mensagens: Msg[] = [...historico];
    for (let volta = 0; volta < 6; volta++) {
      const r = await claude({ system, tools: FERRAMENTAS, messages: mensagens });
      if (r.stop_reason !== "tool_use") {
        return NextResponse.json({ resposta: r.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim() });
      }
      mensagens.push({ role: "assistant", content: r.content });
      const resultados = await Promise.all(
        r.content.filter((b) => b.type === "tool_use").map(async (b) => {
          let saida: unknown;
          try { saida = await executarFerramenta(s, b.name!, b.input ?? {}); }
          catch (e) { saida = { erro: "Falha ao consultar os dados.", detalhe: String(e).slice(0, 200) }; }
          return { type: "tool_result", tool_use_id: b.id, content: JSON.stringify(saida).slice(0, 30000) };
        }),
      );
      mensagens.push({ role: "user", content: resultados });
    }
    return NextResponse.json({ resposta: "A pergunta exigiu demasiadas consultas. Tente ser mais específico (por exemplo, indique a turma)." });
  } catch (e) {
    console.error("edu.gw assistente:", e);
    return erro("O assistente não conseguiu responder agora. Tente de novo dentro de momentos.", 502);
  }
}
