"use client";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg border border-vermelho/40 bg-vermelho-claro p-6">
      <h2 className="font-semibold text-vermelho">Algo correu mal</h2>
      <p className="mt-1 text-sm">Verifique a ligação à internet e tente de novo.</p>
      <button onClick={reset} className="mt-4 rounded-md bg-vermelho px-4 py-2 text-sm font-semibold text-sobre-verde">Tentar de novo</button>
    </div>
  );
}
