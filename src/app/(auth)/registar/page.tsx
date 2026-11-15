import Link from "next/link";
import { Aviso, Botao, Campo } from "@/components/ui";
import { registar } from "../acoes";

export const metadata = { title: "Criar conta" };

export default async function Registar({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-lg font-semibold">Criar conta</h1>
      <p className="mb-4 text-sm text-suave">
        Para registar uma escola nova, ou para aceitar o convite que a sua escola enviou para este email.
      </p>
      <Aviso erro={sp.erro} />
      <form action={registar} className="space-y-4">
        <Campo rotulo="Email"><input className="campo" type="email" name="email" required autoComplete="email" /></Campo>
        <Campo rotulo="Palavra-passe" ajuda="Mínimo de 8 caracteres.">
          <input className="campo" type="password" name="senha" minLength={8} required autoComplete="new-password" />
        </Campo>
        <Botao className="w-full">Criar conta</Botao>
      </form>
      <p className="mt-4 text-center text-sm">Já tem conta? <Link href="/entrar" className="text-verde hover:underline">Entrar</Link></p>
    </>
  );
}
