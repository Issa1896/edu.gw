import { redirect } from "next/navigation";
import { Aviso, Botao, Campo, Marca } from "@/components/ui";
import { supabaseServidor } from "@/lib/supabase/server";
import { REGIOES } from "@/lib/tipos";
import { sair } from "@/app/(auth)/acoes";
import { criarEscola } from "./acoes";

export const metadata = { title: "Registar escola" };

export default async function Configurar({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data: perfil } = await supabase.from("perfis").select("user_id").eq("user_id", user.id).maybeSingle();
  if (perfil) redirect("/painel");

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <Marca />
      <h1 className="mt-8 font-titulo text-2xl font-bold">Registar a sua escola</h1>
      <p className="mt-2 text-sm text-suave">
        Sessão iniciada como <strong>{user.email}</strong>. Se é professor, funcionário ou encarregado,
        não precisa de registar escola: peça à direção que envie um convite para este email e volte a entrar.
      </p>
      <div className="mt-6 rounded-lg border border-linha bg-superficie p-6">
        <Aviso erro={sp.erro} />
        <form action={criarEscola} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Campo rotulo="Nome da escola"><input name="nome" className="campo" required placeholder="Ex.: Liceu Kwame Nkrumah" /></Campo></div>
          <Campo rotulo="Região">
            <select name="regiao" className="campo" defaultValue="SAB">
              {Object.entries(REGIOES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Tipo">
            <select name="tipo" className="campo" defaultValue="privada">
              <option value="publica">Pública</option>
              <option value="privada">Privada</option>
              <option value="comunitaria">Comunitária</option>
              <option value="confessional">Confessional</option>
              <option value="autogestao">Autogestão</option>
            </select>
          </Campo>
          <Campo rotulo="O seu nome (direção)"><input name="admin" className="campo" required /></Campo>
          <Campo rotulo="Telefone"><input name="telefone" className="campo" inputMode="tel" placeholder="+245 9xx xxx xxx" /></Campo>
          <p className="text-xs text-suave sm:col-span-2">
            Criamos automaticamente o ano letivo atual (outubro a julho), as classes da 1.ª à 12.ª e as disciplinas mais comuns. Pode alterar tudo depois.
          </p>
          <div className="sm:col-span-2"><Botao className="w-full">Criar escola</Botao></div>
        </form>
      </div>
      <form action={sair} className="mt-4 text-center"><button className="text-sm text-suave hover:underline">Sair</button></form>
    </main>
  );
}
