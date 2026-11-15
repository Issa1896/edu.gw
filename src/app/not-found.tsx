import { BotaoLink } from "@/components/ui";

export default function NaoEncontrado() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="font-titulo text-5xl font-bold text-verde">404</p>
        <p className="mt-2 text-suave">Página não encontrada, ou não tem permissão para a ver.</p>
        <BotaoLink href="/painel" className="mt-6">Voltar ao início</BotaoLink>
      </div>
    </main>
  );
}
