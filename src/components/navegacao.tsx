"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNav = { href: string; rotulo: string };

export function Navegacao({ itens }: { itens: ItemNav[] }) {
  const caminho = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {itens.map((i) => {
        const ativo = caminho === i.href || (caminho.startsWith(i.href + "/") && !itens.some((o) => o.href !== i.href && o.href.length > i.href.length && caminho.startsWith(o.href)));
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={ativo ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
              ativo ? "bg-verde text-sobre-verde" : "text-tinta hover:bg-superficie-2"
            }`}
          >
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
