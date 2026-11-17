import Link from "next/link";
import { Marca } from "@/components/ui";
import { Navegacao, type ItemNav } from "@/components/navegacao";
import { obterSessao } from "@/lib/sessao";
import { NOMES_PAPEL, type Papel } from "@/lib/tipos";
import { sair } from "@/app/(auth)/acoes";
import { Assistente } from "@/components/assistente";

const MENU: (ItemNav & { papeis: Papel[] })[] = [
  { href: "/painel", rotulo: "Painel", papeis: ["admin", "secretaria", "professor", "financeiro"] },
  { href: "/portal", rotulo: "Os meus educandos", papeis: ["encarregado"] },
  { href: "/alunos", rotulo: "Alunos", papeis: ["admin", "secretaria", "professor", "financeiro"] },
  { href: "/turmas", rotulo: "Turmas", papeis: ["admin", "secretaria", "professor"] },
  { href: "/notas", rotulo: "Notas", papeis: ["admin", "secretaria", "professor"] },
  { href: "/faltas", rotulo: "Faltas", papeis: ["admin", "secretaria", "professor"] },
  { href: "/boletins", rotulo: "Boletins e pautas", papeis: ["admin", "secretaria", "professor"] },
  { href: "/financas", rotulo: "Propinas", papeis: ["admin", "secretaria", "financeiro"] },
  { href: "/declaracoes", rotulo: "Declarações", papeis: ["admin", "secretaria", "financeiro"] },
  { href: "/comunicados", rotulo: "Comunicados", papeis: ["admin", "secretaria", "professor", "financeiro", "encarregado"] },
  { href: "/equipa", rotulo: "Equipa", papeis: ["admin", "secretaria"] },
  { href: "/configuracoes", rotulo: "Configurações", papeis: ["admin"] },
];

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const s = await obterSessao();
  const itens = MENU.filter((m) => m.papeis.includes(s.perfil.papel)).map(({ href, rotulo }) => ({ href, rotulo }));
  if (s.plataformaAdmin) itens.push({ href: "/plataforma/blog", rotulo: "Blog (GW Digital)" });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="nao-imprimir border-b border-linha bg-superficie lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 px-4 py-4 lg:block">
          <Link href="/"><Marca /></Link>
          <p className="truncate text-xs text-suave lg:mt-3" title={s.escola.nome}>{s.escola.nome}</p>
          {s.ano && <p className="hidden text-xs text-suave lg:block">Ano letivo {s.ano.nome}</p>}
        </div>
        <div className="px-2 pb-2 lg:px-3">
          <Navegacao itens={itens} />
        </div>
        <div className="hidden border-t border-linha px-4 py-4 text-sm lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <Link href="/conta" className="block font-medium hover:underline">{s.perfil.nome}</Link>
          <p className="text-xs text-suave">{NOMES_PAPEL[s.perfil.papel]}</p>
          <form action={sair}><button className="mt-2 text-xs text-vermelho hover:underline">Sair</button></form>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
        <footer className="nao-imprimir mt-12 flex items-center justify-between border-t border-linha pt-4 text-xs text-suave lg:hidden">
          <Link href="/conta">{s.perfil.nome} · {NOMES_PAPEL[s.perfil.papel]}</Link>
          <form action={sair}><button className="text-vermelho">Sair</button></form>
        </footer>
      </main>
      <Assistente modo="interno" />
    </div>
  );
}
