import { Botao, Campo } from "@/components/ui";
import { recuperar } from "../acoes";

export const metadata = { title: "Recuperar acesso" };

export default function Recuperar() {
  return (
    <>
      <h1 className="mb-4 text-lg font-semibold">Recuperar acesso</h1>
      <form action={recuperar} className="space-y-4">
        <Campo rotulo="Email da conta"><input className="campo" type="email" name="email" required /></Campo>
        <Botao className="w-full">Enviar link</Botao>
      </form>
    </>
  );
}
