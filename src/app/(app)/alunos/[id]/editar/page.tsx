import { notFound } from "next/navigation";
import { Aviso, Botao, BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { exigirPapel, GESTAO } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { CamposAluno } from "../../campos";
import { editarAluno } from "../../acoes";

export const metadata = { title: "Editar aluno" };

export default async function EditarAluno({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  const sp = await searchParams;
  await exigirPapel(...GESTAO);
  const supabase = await supabaseServidor();
  const { data: a } = await supabase.from("alunos").select("*").eq("id", id).maybeSingle();
  if (!a) notFound();
  return (
    <>
      <Cabecalho titulo={`Editar · ${a.nome}`} />
      <Aviso erro={sp.erro} />
      <form action={editarAluno.bind(null, id)} className="space-y-4">
        <Cartao><CamposAluno a={a} numeroObrigatorio /></Cartao>
        <div className="flex gap-2"><Botao>Guardar</Botao><BotaoLink href={`/alunos/${id}`} variante="secundario">Cancelar</BotaoLink></div>
      </form>
    </>
  );
}
