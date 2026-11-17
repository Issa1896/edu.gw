import Link from "next/link";
import { BotaoLink, Marca } from "@/components/ui";
import { Assistente } from "@/components/assistente";

/** Moldura das páginas públicas: cabeçalho, rodapé e assistente de vendas. */
export function Site({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-linha bg-papel/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href="/"><Marca /></Link>
          <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
            <Link href="/blog" className="rounded-md px-3 py-2 hover:bg-superficie-2">Blog</Link>
            <Link href="/verificar" className="hidden rounded-md px-3 py-2 hover:bg-superficie-2 sm:inline">Verificar declaração</Link>
            <BotaoLink href="/entrar" variante="secundario">Entrar</BotaoLink>
            <BotaoLink href="/registar" className="hidden sm:inline-flex">Registar escola</BotaoLink>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-linha">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-8 text-xs text-suave">
          <span>© {new Date().getFullYear()} edu.gw · GW Digital Company</span>
          <span className="flex gap-4">
            <Link href="/blog" className="hover:underline">Blog</Link>
            <Link href="/verificar" className="hover:underline">Verificar declaração</Link>
          </span>
        </div>
      </footer>
      <Assistente modo="publico" />
    </>
  );
}
