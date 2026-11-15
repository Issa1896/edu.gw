import { Aviso, Botao, Cabecalho, Campo, Cartao } from "@/components/ui";
import { obterSessao } from "@/lib/sessao";
import { NOMES_PAPEL } from "@/lib/tipos";
import { guardarPerfil, mudarSenha } from "./acoes";

export const metadata = { title: "A minha conta" };

export default async function Conta({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await obterSessao();
  return (
    <>
      <Cabecalho titulo="A minha conta" subtitulo={`${s.email} · ${NOMES_PAPEL[s.perfil.papel]} · ${s.escola.nome}`} />
      <Aviso ok={sp.ok} erro={sp.erro} />
      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <Cartao titulo="Perfil">
          <form action={guardarPerfil} className="space-y-3">
            <Campo rotulo="Nome"><input name="nome" defaultValue={s.perfil.nome} className="campo" required /></Campo>
            <Campo rotulo="Telefone"><input name="telefone" defaultValue={s.perfil.telefone ?? ""} className="campo" /></Campo>
            <Botao>Guardar</Botao>
          </form>
        </Cartao>
        <Cartao titulo="Palavra-passe">
          <form action={mudarSenha} className="space-y-3">
            <Campo rotulo="Nova palavra-passe"><input type="password" name="senha" minLength={8} className="campo" required autoComplete="new-password" /></Campo>
            <Campo rotulo="Confirmar"><input type="password" name="confirmar" minLength={8} className="campo" required autoComplete="new-password" /></Campo>
            <Botao variante="secundario">Alterar</Botao>
          </form>
        </Cartao>
      </div>
    </>
  );
}
