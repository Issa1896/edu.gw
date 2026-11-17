"use client";

import { useEffect, useRef, useState } from "react";

type M = { role: "user" | "assistant"; content: string };

const SUGESTOES = {
  publico: ["O que o edu.gw faz?", "Como registo a minha escola?", "Funciona sem boa internet?", "Quanto custa?"],
  interno: ["Quem tem propinas em atraso?", "Como emito uma declaração de matrícula?", "Qual a média da 7.ª A no 1.º trimestre?", "Quais alunos têm mais faltas?"],
};

const SAUDACAO = {
  publico: "Olá! Sou o assistente do edu.gw. Pergunte-me o que o sistema faz pela sua escola. Pode escrever em português ou kriol.",
  interno: "Olá! Posso explicar como usar o sistema e consultar os dados da escola (alunos, notas, faltas, propinas). O que precisa?",
};

export function Assistente({ modo }: { modo: "publico" | "interno" }) {
  const [aberto, setAberto] = useState(false);
  const [msgs, setMsgs] = useState<M[]>([]);
  const [texto, setTexto] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, aEnviar]);

  async function enviar(pergunta: string) {
    const p = pergunta.trim();
    if (!p || aEnviar) return;
    const novas: M[] = [...msgs, { role: "user", content: p }];
    setMsgs(novas);
    setTexto("");
    setAEnviar(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ modo, mensagens: novas }),
      });
      const j = (await r.json().catch(() => ({}))) as { resposta?: string; erro?: string };
      setMsgs([...novas, { role: "assistant", content: j.resposta || j.erro || "Não consegui responder. Tente de novo." }]);
    } catch {
      setMsgs([...novas, { role: "assistant", content: "Sem ligação à internet. Tente de novo quando a rede voltar." }]);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <div className="nao-imprimir fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {aberto && (
        <section
          role="dialog"
          aria-label="Assistente edu.gw"
          className="flex h-[min(560px,calc(100vh-6rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-linha bg-superficie shadow-xl"
        >
          <header className="flex items-center justify-between border-b border-linha bg-verde px-4 py-3 text-sobre-verde">
            <div>
              <p className="font-semibold">Assistente edu.gw</p>
              <p className="text-xs opacity-80">{modo === "interno" ? "Ajuda e consulta de dados" : "Tire as suas dúvidas"}</p>
            </div>
            <button onClick={() => setAberto(false)} className="rounded p-1 hover:bg-white/10" aria-label="Fechar">✕</button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            <p className="rounded-lg bg-superficie-2 px-3 py-2">{SAUDACAO[modo]}</p>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGESTOES[modo].map((s) => (
                  <button key={s} onClick={() => enviar(s)} className="rounded-full border border-linha px-3 py-1 text-xs hover:border-verde hover:text-verde">{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <p
                key={i}
                className={`whitespace-pre-line rounded-lg px-3 py-2 ${m.role === "user" ? "ml-8 bg-verde text-sobre-verde" : "mr-4 bg-superficie-2"}`}
              >
                {m.content.replace(/\*\*(.+?)\*\*/g, "$1")}
              </p>
            ))}
            {aEnviar && <p className="mr-4 animate-pulse rounded-lg bg-superficie-2 px-3 py-2 text-suave">A pensar…</p>}
            <div ref={fim} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); enviar(texto); }}
            className="flex gap-2 border-t border-linha p-3"
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={2000}
              placeholder="Escreva a sua pergunta…"
              className="campo py-1.5"
              aria-label="Pergunta"
            />
            <button disabled={aEnviar || !texto.trim()} className="rounded-md bg-verde px-3 text-sm font-semibold text-sobre-verde disabled:opacity-50">Enviar</button>
          </form>
          <p className="px-3 pb-2 text-[11px] text-suave">Respostas geradas por IA. Confirme dados importantes no sistema.</p>
        </section>
      )}
      <button
        onClick={() => setAberto((a) => !a)}
        className="flex items-center gap-2 rounded-full bg-verde px-4 py-3 text-sm font-semibold text-sobre-verde shadow-lg hover:bg-verde-forte"
        aria-expanded={aberto}
      >
        <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-amarelo text-[11px] font-bold text-tinta">?</span>
        {aberto ? "Fechar" : "Assistente"}
      </button>
    </div>
  );
}
