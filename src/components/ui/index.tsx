import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primario" | "secundario" | "perigo" | "fantasma";
const BOTAO_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde/40 disabled:opacity-60 disabled:cursor-not-allowed";
const VARIANTES: Record<Variante, string> = {
  primario: "bg-verde text-sobre-verde hover:bg-verde-forte",
  secundario: "border border-linha bg-superficie text-tinta hover:bg-superficie-2",
  perigo: "bg-vermelho text-sobre-verde hover:opacity-90",
  fantasma: "text-verde hover:bg-verde-claro",
};

export function Botao({ variante = "primario", className = "", ...p }: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={`${BOTAO_BASE} ${VARIANTES[variante]} ${className}`} {...p} />;
}

export function BotaoLink({ variante = "primario", className = "", ...p }: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={`${BOTAO_BASE} ${VARIANTES[variante]} ${className}`} {...p} />;
}

export function Cartao({ titulo, acao, children, className = "" }: { titulo?: ReactNode; acao?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-linha bg-superficie ${className}`}>
      {(titulo || acao) && (
        <header className="flex items-center justify-between gap-3 border-b border-linha px-4 py-3">
          <h2 className="text-base font-semibold">{titulo}</h2>
          {acao}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Cabecalho({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-titulo text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-suave">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

type Tom = "neutro" | "sucesso" | "aviso" | "perigo";
const TONS: Record<Tom, string> = {
  neutro: "bg-superficie-2 text-suave",
  sucesso: "bg-verde-claro text-verde",
  aviso: "bg-amarelo-claro text-tinta",
  perigo: "bg-vermelho-claro text-vermelho",
};
export function Etiqueta({ tom = "neutro", children }: { tom?: Tom; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONS[tom]}`}>{children}</span>;
}

export function Campo({ rotulo, ajuda, children }: { rotulo: string; ajuda?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="rotulo">{rotulo}</span>
      {children}
      {ajuda && <span className="ajuda block">{ajuda}</span>}
    </label>
  );
}

export function Estatistica({ rotulo, valor, detalhe, tom = "neutro" }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; tom?: Tom }) {
  const barra = { neutro: "bg-linha", sucesso: "bg-verde", aviso: "bg-amarelo", perigo: "bg-vermelho" }[tom];
  return (
    <div className="relative overflow-hidden rounded-lg border border-linha bg-superficie p-4">
      <span className={`absolute inset-x-0 top-0 h-1 ${barra}`} aria-hidden />
      <p className="text-sm text-suave">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-suave">{detalhe}</p>}
    </div>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-linha px-6 py-10 text-center">
      <p className="font-semibold">{titulo}</p>
      {children && <div className="mt-2 text-sm text-suave">{children}</div>}
    </div>
  );
}

export function Aviso({ ok, erro }: { ok?: string; erro?: string }) {
  if (!ok && !erro) return null;
  return (
    <div role="status" className={`mb-4 rounded-md px-4 py-3 text-sm font-medium ${erro ? "bg-vermelho-claro text-vermelho" : "bg-verde-claro text-verde"}`}>
      {erro ?? ok}
    </div>
  );
}

export function Marca({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-titulo text-xl font-bold ${className}`}>
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
        <rect width="64" height="64" rx="14" fill="#0B5D3B" />
        <path d="M14 20h22a6 6 0 0 1 6 6v22H20a6 6 0 0 1-6-6z" fill="#F7F5EF" />
        <path d="M42 26h8v22h-8z" fill="#F2C230" />
        <path d="M28 24l1.9 4.6 5 .4-3.8 3.2 1.2 4.8L28 34.5 23.7 37l1.2-4.8-3.8-3.2 5-.4z" fill="#1B1F1C" />
      </svg>
      <span>edu<span className="text-verde">.gw</span></span>
    </span>
  );
}

export function Tabela({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-linha bg-superficie">
      <table className="tabela">{children}</table>
    </div>
  );
}
