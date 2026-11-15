"use client";

export function BotaoImprimir({ rotulo = "Imprimir" }: { rotulo?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="nao-imprimir inline-flex items-center justify-center rounded-md bg-verde px-4 py-2 text-sm font-semibold text-sobre-verde hover:bg-verde-forte"
    >
      {rotulo}
    </button>
  );
}
