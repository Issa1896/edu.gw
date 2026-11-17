import Link from "next/link";
import { Site } from "@/components/site";
import { CorpoDeclaracao, dataExtenso } from "@/components/declaracao";
import { supabaseServidor } from "@/lib/supabase/server";
import { REGIOES } from "@/lib/tipos";
import { TIPOS_DECLARACAO, type ConteudoDeclaracao, type TipoDeclaracao } from "@/lib/declaracoes";

export const metadata = { title: "Verificação de declaração", robots: { index: false } };

type Res = { codigo: string; tipo: TipoDeclaracao; escola: string; regiao: string; emitida_em: string; anulada_em: string | null; motivo_anulacao: string | null; conteudo: ConteudoDeclaracao } | null;

export default async function Verificacao({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc("verificar_declaracao", { p_codigo: codigo.slice(0, 20) });
  const d = data as Res;

  return (
    <Site>
      <main className="mx-auto max-w-3xl px-4 py-12">
        {!d ? (
          <div className="rounded-lg border-2 border-vermelho bg-vermelho-claro p-6">
            <p className="text-lg font-bold text-vermelho">✕ Declaração não encontrada</p>
            <p className="mt-2 text-sm">Não existe nenhuma declaração emitida pelo edu.gw com o código <strong className="font-mono">{codigo.toUpperCase()}</strong>. Confirme o código ou contacte a escola.</p>
          </div>
        ) : d.anulada_em ? (
          <div className="rounded-lg border-2 border-vermelho bg-vermelho-claro p-6">
            <p className="text-lg font-bold text-vermelho">✕ Declaração ANULADA pela escola</p>
            <p className="mt-2 text-sm">Anulada em {dataExtenso(d.anulada_em)}{d.motivo_anulacao && <> — motivo: {d.motivo_anulacao}</>}. Não é válida.</p>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-verde bg-verde-claro p-6">
            <p className="text-lg font-bold text-verde">✓ Declaração autêntica e válida</p>
            <p className="mt-2 text-sm">Emitida por <strong>{d.escola}</strong> ({REGIOES[d.regiao] ?? d.regiao}) em {dataExtenso(d.emitida_em)}. Compare o texto abaixo com o documento que recebeu.</p>
          </div>
        )}
        {d && (
          <section className="mt-8 rounded-lg border border-linha bg-superficie p-6">
            <p className="text-xs uppercase tracking-wide text-suave">Código {d.codigo}</p>
            <h1 className="mt-1 font-titulo text-2xl font-bold">{TIPOS_DECLARACAO[d.tipo].nome}</h1>
            <div className="mt-6"><CorpoDeclaracao tipo={d.tipo} c={d.conteudo} /></div>
          </section>
        )}
        <p className="mt-8 text-sm"><Link href="/verificar" className="text-verde hover:underline">Verificar outro código</Link></p>
      </main>
    </Site>
  );
}
