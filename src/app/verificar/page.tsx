import { redirect } from "next/navigation";
import { Site } from "@/components/site";
import { Botao, Campo } from "@/components/ui";

export const metadata = { title: "Verificar declaração" };

async function procurar(fd: FormData) {
  "use server";
  const c = String(fd.get("codigo") ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  redirect(c ? `/verificar/${c}` : "/verificar");
}

export default function Verificar() {
  return (
    <Site>
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-titulo text-3xl font-bold">Verificar declaração</h1>
        <p className="mt-2 text-suave">Introduza o código impresso no rodapé da declaração, ou leia o código QR com a câmara do telemóvel.</p>
        <form action={procurar} className="mt-8 flex items-end gap-2">
          <div className="flex-1"><Campo rotulo="Código de verificação"><input name="codigo" required maxLength={12} className="campo font-mono text-lg uppercase tracking-widest" placeholder="EX.: 3F9A0C21B7" /></Campo></div>
          <Botao>Verificar</Botao>
        </form>
      </main>
    </Site>
  );
}
