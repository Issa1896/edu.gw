import Link from "next/link";
import { BotaoLink, Cabecalho, Etiqueta, Tabela, Vazio } from "@/components/ui";
import { exigirPapel, EQUIPA } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { idade } from "@/lib/formato";
import { ESTADOS_MATRICULA } from "@/lib/tipos";

export const metadata = { title: "Alunos" };

type Linha = {
  id: string; numero: string; nome: string; genero: string | null; data_nascimento: string | null;
  matriculas: { estado: string; ano_letivo_id: string; turma_id: string; turmas: { nome: string } | null }[];
};

export default async function Alunos({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel(...EQUIPA);
  const supabase = await supabaseServidor();
  const pode = ["admin", "secretaria"].includes(s.perfil.papel);

  let q = supabase
    .from("alunos")
    .select("id, numero, nome, genero, data_nascimento, matriculas(estado, ano_letivo_id, turma_id, turmas(nome))")
    .order("nome")
    .limit(500);
  if (sp.q) q = q.or(`nome.ilike.%${sp.q.replace(/[%,()]/g, "")}%,numero.ilike.%${sp.q.replace(/[%,()]/g, "")}%`);
  const [{ data }, { data: turmas }] = await Promise.all([
    q,
    supabase.from("turmas").select("id, nome").eq("ano_letivo_id", s.ano?.id ?? "").order("nome"),
  ]);

  let alunos = ((data ?? []) as unknown as Linha[]).map((a) => ({ ...a, atual: a.matriculas.find((m) => m.ano_letivo_id === s.ano?.id) }));
  if (sp.turma) alunos = alunos.filter((a) => a.atual?.turma_id === sp.turma);
  if (sp.sem === "1") alunos = alunos.filter((a) => !a.atual);

  return (
    <>
      <Cabecalho titulo="Alunos" subtitulo={`${alunos.length} resultado(s)`} acoes={pode && <BotaoLink href="/alunos/novo">Nova matrícula</BotaoLink>} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Procurar por nome ou n.º" className="campo max-w-xs" />
        <select name="turma" defaultValue={sp.turma ?? ""} className="campo max-w-[12rem]">
          <option value="">Todas as turmas</option>
          {(turmas ?? []).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="sem" value="1" defaultChecked={sp.sem === "1"} /> Sem matrícula este ano</label>
        <button className="rounded-md border border-linha bg-superficie px-3 text-sm font-medium hover:bg-superficie-2">Filtrar</button>
      </form>
      {alunos.length === 0 ? (
        <Vazio titulo="Nenhum aluno encontrado">{pode && <BotaoLink href="/alunos/novo">Registar o primeiro aluno</BotaoLink>}</Vazio>
      ) : (
        <Tabela>
          <thead><tr><th>N.º</th><th>Nome</th><th>Turma</th><th>Género</th><th>Idade</th><th>Estado</th></tr></thead>
          <tbody>
            {alunos.map((a) => (
              <tr key={a.id}>
                <td className="tabular-nums text-suave">{a.numero}</td>
                <td><Link href={`/alunos/${a.id}`} className="font-medium text-verde hover:underline">{a.nome}</Link></td>
                <td>{a.atual?.turmas?.nome ?? "—"}</td>
                <td>{a.genero ?? "—"}</td>
                <td className="tabular-nums">{idade(a.data_nascimento) ?? "—"}</td>
                <td>
                  {a.atual ? (
                    <Etiqueta tom={a.atual.estado === "ativa" ? "sucesso" : "aviso"}>{ESTADOS_MATRICULA[a.atual.estado]}</Etiqueta>
                  ) : <Etiqueta>Sem matrícula</Etiqueta>}
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}
