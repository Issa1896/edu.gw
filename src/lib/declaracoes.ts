import { supabaseServidor } from "@/lib/supabase/server";
import { boletins, situacao } from "@/lib/avaliacao";
import { mesesVencidos, propinaDevida, type MatFin } from "@/lib/financas";
import type { AnoLetivo, Escola } from "@/lib/tipos";

export type TipoDeclaracao = "matricula" | "aproveitamento" | "conclusao" | "quitacao";

export const TIPOS_DECLARACAO: Record<TipoDeclaracao, { nome: string; descricao: string }> = {
  matricula: { nome: "Declaração de matrícula e frequência", descricao: "O aluno está matriculado e a frequentar a turma no ano letivo." },
  aproveitamento: { nome: "Declaração de aproveitamento", descricao: "Notas por trimestre e média de cada disciplina." },
  conclusao: { nome: "Declaração de conclusão de classe", descricao: "O aluno concluiu a classe com aproveitamento (só se aprovado)." },
  quitacao: { nome: "Declaração de quitação de propinas", descricao: "O aluno não tem propinas vencidas por pagar." },
};

/** Fotografia dos dados no momento da emissão — é isto que fica guardado e é verificado. */
export type ConteudoDeclaracao = {
  aluno: { nome: string; numero: string; data_nascimento: string | null; naturalidade: string | null; bi: string | null; genero: string | null };
  turma: string;
  classe: string;
  ano_letivo: string;
  escola: { nome: string; diretor: string | null; regiao: string; morada: string | null };
  notas?: { disciplina: string; t1: number | null; t2: number | null; t3: number | null; media: number | null }[];
  media_geral?: number | null;
  situacao?: string;
  propinas?: { meses_vencidos: number; meses_pagos: number; total_pago: number; ate: string | null };
};

type Mat = MatFin & {
  estado: string;
  turma_id: string;
  alunos: MatFin["alunos"] & { data_nascimento: string | null; naturalidade: string | null; bi: string | null; genero: string | null };
  turmas: MatFin["turmas"] & { classes: MatFin["turmas"]["classes"] & { nome: string } };
  anos_letivos: AnoLetivo;
};

export async function montarDeclaracao(
  matriculaId: string,
  tipo: TipoDeclaracao,
  escola: Escola,
): Promise<{ ok: true; conteudo: ConteudoDeclaracao } | { ok: false; erro: string }> {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("matriculas")
    .select("id, estado, bolsa_percentagem, numero_turma, turma_id, alunos(id, nome, numero, data_nascimento, naturalidade, bi, genero), turmas(id, nome, classes(nome, propina_mensal, taxa_matricula)), anos_letivos(*)")
    .eq("id", matriculaId)
    .maybeSingle();
  if (!data) return { ok: false, erro: "Matrícula não encontrada." };
  const m = data as unknown as Mat;

  const conteudo: ConteudoDeclaracao = {
    aluno: { nome: m.alunos.nome, numero: m.alunos.numero, data_nascimento: m.alunos.data_nascimento, naturalidade: m.alunos.naturalidade, bi: m.alunos.bi, genero: m.alunos.genero },
    turma: m.turmas.nome,
    classe: m.turmas.classes.nome,
    ano_letivo: m.anos_letivos.nome,
    escola: { nome: escola.nome, diretor: escola.diretor, regiao: escola.regiao, morada: escola.morada },
  };

  if (tipo === "matricula" && m.estado !== "ativa") {
    return { ok: false, erro: "A matrícula não está ativa; não é possível declarar frequência." };
  }

  if (tipo === "aproveitamento" || tipo === "conclusao") {
    const b = await boletins([m.id], m.turma_id);
    const linhas = b.porMat[m.id];
    const sit = situacao(linhas, Number(escola.nota_minima));
    if (linhas.every((l) => l.media === null)) return { ok: false, erro: "O aluno ainda não tem notas lançadas." };
    conteudo.notas = linhas.map(({ disciplina, t1, t2, t3, media }) => ({ disciplina, t1, t2, t3, media }));
    conteudo.media_geral = sit.media;
    conteudo.situacao = sit.texto;
    if (tipo === "conclusao") {
      if (linhas.some((l) => l.t3 === null)) return { ok: false, erro: "Faltam notas do 3.º trimestre; a conclusão só pode ser declarada no fim do ano." };
      if (!sit.aprovado) return { ok: false, erro: "O aluno não reúne condições de aprovação; não é possível declarar a conclusão." };
    }
  }

  if (tipo === "quitacao") {
    const { data: pags } = await supabase.from("pagamentos").select("tipo, mes_referencia, valor").eq("matricula_id", m.id);
    const pagos = new Set((pags ?? []).filter((p) => p.tipo === "propina").map((p) => p.mes_referencia));
    const vencidos = mesesVencidos(m.anos_letivos);
    const devido = propinaDevida(m);
    const emFalta = devido > 0 ? vencidos.filter((x) => !pagos.has(x)) : [];
    if (emFalta.length) return { ok: false, erro: `O aluno tem ${emFalta.length} mês(es) de propina por pagar.` };
    conteudo.propinas = {
      meses_vencidos: vencidos.length,
      meses_pagos: pagos.size,
      total_pago: (pags ?? []).reduce((t, p) => t + p.valor, 0),
      ate: vencidos[vencidos.length - 1] ?? null,
    };
  }

  return { ok: true, conteudo };
}
