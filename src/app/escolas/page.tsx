import Link from "next/link";
import { Site } from "@/components/site";
import { Vazio } from "@/components/ui";
import { supabaseServidor } from "@/lib/supabase/server";
import { data } from "@/lib/formato";
import { REGIOES } from "@/lib/tipos";

export const metadata = { title: "Escolas", alternates: { canonical: "/escolas" }, description: "Notícias e informações das escolas que usam o edu.gw na Guiné-Bissau." };
export const revalidate = 300;

type E = { slug: string; nome: string; regiao: string; tipo: string; descricao: string | null; noticias: number; ultima: string | null };

export default async function Escolas({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const supabase = await supabaseServidor();
  const { data: lista } = await supabase.rpc("escolas_publicas");
  let escolas = (lista ?? []) as E[];
  if (sp.regiao) escolas = escolas.filter((e) => e.regiao === sp.regiao);
  if (sp.q) { const q = sp.q.toLowerCase(); escolas = escolas.filter((e) => e.nome.toLowerCase().includes(q)); }

  return (
    <Site>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-titulo text-4xl font-bold">Escolas</h1>
        <p className="mt-2 text-suave">Acompanhe as notícias e avisos das escolas: calendário, provas, reuniões, eventos.</p>
        <form className="mt-6 flex flex-wrap gap-2">
          <input name="q" defaultValue={sp.q} placeholder="Procurar escola" className="campo max-w-xs" />
          <select name="regiao" defaultValue={sp.regiao ?? ""} className="campo max-w-[14rem]">
            <option value="">Todas as regiões</option>
            {Object.entries(REGIOES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="rounded-md border border-linha bg-superficie px-4 text-sm font-semibold hover:bg-superficie-2">Filtrar</button>
        </form>
        <div className="mt-8">
          {escolas.length === 0 ? <Vazio titulo="Nenhuma escola encontrada" /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {escolas.map((e) => (
                <Link key={e.slug} href={`/escola/${e.slug}`} className="rounded-lg border border-linha bg-superficie p-5 hover:border-verde">
                  <p className="text-xs font-semibold uppercase tracking-wide text-verde">{REGIOES[e.regiao] ?? e.regiao}</p>
                  <h2 className="mt-1 text-lg font-semibold">{e.nome}</h2>
                  {e.descricao && <p className="mt-2 line-clamp-2 text-sm text-suave">{e.descricao}</p>}
                  <p className="mt-3 text-xs text-suave">{e.noticias} notícia(s){e.ultima && ` · última a ${data(e.ultima)}`}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </Site>
  );
}
