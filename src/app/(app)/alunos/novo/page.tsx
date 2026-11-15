import { Aviso, Botao, Cabecalho, Campo, Cartao } from "@/components/ui";
import { exigirPapel, GESTAO } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { CamposAluno, CamposEncarregado } from "../campos";
import { matricularNovo } from "../acoes";

export const metadata = { title: "Nova matrícula" };

export default async function NovoAluno({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  const { data: turmas } = await supabase.from("turmas").select("id, nome, classes(ordem)").eq("ano_letivo_id", s.ano?.id ?? "").order("nome");

  return (
    <>
      <Cabecalho titulo="Nova matrícula" subtitulo={s.ano ? `Ano letivo ${s.ano.nome}` : undefined} />
      <Aviso erro={sp.erro} />
      <form action={matricularNovo} className="space-y-6">
        <Cartao titulo="Dados do aluno"><CamposAluno /></Cartao>
        <Cartao titulo="Encarregado de educação"><CamposEncarregado prefixo="enc_" /></Cartao>
        <Cartao titulo="Matrícula">
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo rotulo="Turma" ajuda={(turmas ?? []).length === 0 ? "Crie primeiro as turmas em Turmas." : undefined}>
              <select name="turma_id" className="campo" defaultValue="">
                <option value="">Registar sem matrícula</option>
                {(turmas ?? []).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Bolsa / desconto (%)" ajuda="0 = paga propina completa; 100 = isento.">
              <input type="number" name="bolsa" min={0} max={100} defaultValue={0} className="campo" />
            </Campo>
          </div>
        </Cartao>
        <Botao>Guardar matrícula</Botao>
      </form>
    </>
  );
}
