import { notFound } from "next/navigation";
import { Boletim } from "@/components/boletim";
import { BotaoImprimir } from "@/components/imprimir";
import { exigirPapel } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { alunosDaTurma } from "@/lib/atribuicoes";
import { boletins } from "@/lib/avaliacao";

export const metadata = { title: "Boletins da turma" };

export default async function BoletinsTurma({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await exigirPapel("admin", "secretaria", "professor");
  const supabase = await supabaseServidor();
  const { data: t } = await supabase.from("turmas").select("nome, classes(nome)").eq("id", id).maybeSingle();
  if (!t) notFound();
  const alunos = await alunosDaTurma(id);
  const d = await boletins(alunos.map((a) => a.id), id);
  const classe = (t.classes as unknown as { nome: string }).nome;
  return (
    <>
      <div className="nao-imprimir mb-4 flex items-center justify-between">
        <p className="text-sm text-suave">{alunos.length} boletins · uma página A4 por aluno</p>
        <BotaoImprimir rotulo="Imprimir todos" />
      </div>
      <div className="space-y-8 print:space-y-0">
        {alunos.map((a) => (
          <Boletim key={a.id} escola={s.escola} ano={s.ano?.nome ?? ""} turma={t.nome} classe={classe}
            aluno={a.alunos} numero={a.numero_turma} linhas={d.porMat[a.id]} faltas={d.faltasPor[a.id]} />
        ))}
      </div>
    </>
  );
}
