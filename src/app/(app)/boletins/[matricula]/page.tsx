import { notFound } from "next/navigation";
import { Boletim } from "@/components/boletim";
import { BotaoImprimir } from "@/components/imprimir";
import { obterSessao } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { boletins } from "@/lib/avaliacao";

export const metadata = { title: "Boletim" };

export default async function BoletimAluno({ params }: { params: Promise<{ matricula: string }> }) {
  const { matricula } = await params;
  const s = await obterSessao(); // encarregados também acedem (RLS limita aos seus educandos)
  const supabase = await supabaseServidor();
  const { data: m } = await supabase
    .from("matriculas")
    .select("id, numero_turma, turma_id, alunos(nome, numero), turmas(nome, classes(nome)), anos_letivos(nome)")
    .eq("id", matricula)
    .maybeSingle();
  if (!m) notFound();
  const mm = m as unknown as { id: string; numero_turma: number | null; turma_id: string; alunos: { nome: string; numero: string }; turmas: { nome: string; classes: { nome: string } }; anos_letivos: { nome: string } };
  const d = await boletins([mm.id], mm.turma_id);

  return (
    <>
      <div className="nao-imprimir mb-4 flex justify-end"><BotaoImprimir rotulo="Imprimir boletim" /></div>
      <Boletim escola={s.escola} ano={mm.anos_letivos.nome} turma={mm.turmas.nome} classe={mm.turmas.classes.nome}
        aluno={mm.alunos} numero={mm.numero_turma} linhas={d.porMat[mm.id]} faltas={d.faltasPor[mm.id]} />
    </>
  );
}
