import Link from "next/link";
import { Aviso, Botao, Campo } from "@/components/ui";
import { entrar } from "../acoes";

export const metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="mb-4 text-lg font-semibold">Entrar</h1>
      <Aviso ok={sp.ok} erro={sp.erro === "inativo" ? "A sua conta foi desativada pela direção da escola." : sp.erro} />
      <form action={entrar} className="space-y-4">
        <input type="hidden" name="seguir" value={sp.seguir ?? ""} />
        <Campo rotulo="Email"><input className="campo" type="email" name="email" required autoComplete="email" /></Campo>
        <Campo rotulo="Palavra-passe"><input className="campo" type="password" name="senha" required autoComplete="current-password" /></Campo>
        <Botao className="w-full">Entrar</Botao>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/recuperar" className="text-verde hover:underline">Esqueci a palavra-passe</Link>
        <Link href="/registar" className="text-verde hover:underline">Criar conta</Link>
      </div>
    </>
  );
}
