import { supabaseServidor } from "@/lib/supabase/server";
import type { Sessao } from "@/lib/sessao";
import { alunosDaTurma } from "@/lib/atribuicoes";
import { boletins, situacao } from "@/lib/avaliacao";
import { matriculasFinanceiras, mesesVencidos, propinaDevida } from "@/lib/financas";
import { hojeISO, mesAno } from "@/lib/formato";

/**
 * Ferramentas de consulta do assistente. Todas usam o cliente Supabase da
 * pessoa autenticada, por isso as regras de segurança (RLS) aplicam-se: um
 * professor não vê propinas, um encarregado só vê os seus educandos, etc.
 */
export const FERRAMENTAS = [
  {
    name: "resumo_escola",
    description: "Números gerais da escola no ano letivo atual: alunos ativos (por género), turmas, faltas de hoje e, se o utilizador tiver acesso às finanças, propinas vencidas por cobrar e recebido no mês.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "listar_turmas",
    description: "Lista as turmas do ano letivo atual com classe, turno e número de alunos ativos.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "procurar_aluno",
    description: "Procura alunos pelo nome (ou parte) ou n.º de processo e devolve turma, estado, médias por disciplina, faltas e, se permitido, propinas em falta.",
    input_schema: { type: "object", properties: { nome: { type: "string", description: "Nome, parte do nome ou n.º de processo" } }, required: ["nome"], additionalProperties: false },
  },
  {
    name: "propinas_em_atraso",
    description: "Alunos com propinas vencidas por pagar, com meses e valor em FCFA. Opcionalmente filtrado por turma (ex.: '7.ª A' ou '7A').",
    input_schema: { type: "object", properties: { turma: { type: "string" } }, additionalProperties: false },
  },
  {
    name: "pauta_turma",
    description: "Notas de uma turma: média geral e número de negativas por aluno, e média de cada disciplina. Opcionalmente de um trimestre (1, 2 ou 3); sem trimestre usa a média anual.",
    input_schema: { type: "object", properties: { turma: { type: "string" }, trimestre: { type: "integer", enum: [1, 2, 3] } }, required: ["turma"], additionalProperties: false },
  },
  {
    name: "faltas",
    description: "Alunos com mais faltas (total e injustificadas), na escola inteira ou numa turma, opcionalmente desde uma data (AAAA-MM-DD).",
    input_schema: { type: "object", properties: { turma: { type: "string" }, desde: { type: "string" } }, additionalProperties: false },
  },
] as const;

const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const FIN = ["admin", "secretaria", "financeiro"];

async function encontrarTurma(s: Sessao, nome: string) {
  const supabase = await supabaseServidor();
  const { data } = await supabase.from("turmas").select("id, nome").eq("ano_letivo_id", s.ano?.id ?? "");
  const alvo = norm(nome);
  return (data ?? []).find((t) => norm(t.nome) === alvo) ?? (data ?? []).find((t) => norm(t.nome).includes(alvo)) ?? null;
}

async function atrasos(s: Sessao, turmaId?: string) {
  const supabase = await supabaseServidor();
  const mats = await matriculasFinanceiras(s.ano!.id, turmaId);
  const { data: pags } = await supabase.from("pagamentos").select("matricula_id, mes_referencia").eq("tipo", "propina").in("matricula_id", mats.map((m) => m.id));
  const pagos = new Set((pags ?? []).map((p) => `${p.matricula_id}|${p.mes_referencia}`));
  const meses = mesesVencidos(s.ano!);
  return mats
    .map((m) => {
      const v = propinaDevida(m);
      const falta = v > 0 ? meses.filter((x) => !pagos.has(`${m.id}|${x}`)) : [];
      return { matricula_id: m.id, aluno: m.alunos.nome, turma: m.turmas.nome, meses_em_falta: falta.map(mesAno), valor_fcfa: falta.length * v };
    })
    .filter((x) => x.meses_em_falta.length > 0)
    .sort((a, b) => b.valor_fcfa - a.valor_fcfa);
}

export async function executarFerramenta(s: Sessao, nome: string, entrada: Record<string, unknown>): Promise<unknown> {
  if (!s.ano) return { erro: "A escola não tem ano letivo atual definido." };
  const supabase = await supabaseServidor();
  const veFinancas = FIN.includes(s.perfil.papel);

  switch (nome) {
    case "resumo_escola": {
      const hoje = hojeISO();
      const [{ data: mats }, { count: turmas }, { count: faltasHoje }] = await Promise.all([
        supabase.from("matriculas").select("id, alunos(genero)").eq("ano_letivo_id", s.ano.id).eq("estado", "ativa"),
        supabase.from("turmas").select("id", { count: "exact", head: true }).eq("ano_letivo_id", s.ano.id),
        supabase.from("faltas").select("id", { count: "exact", head: true }).eq("data", hoje),
      ]);
      const lista = (mats ?? []) as unknown as { alunos: { genero: string | null } | null }[];
      const r: Record<string, unknown> = {
        ano_letivo: s.ano.nome,
        alunos_ativos: lista.length,
        raparigas: lista.filter((m) => m.alunos?.genero === "F").length,
        rapazes: lista.filter((m) => m.alunos?.genero === "M").length,
        turmas,
        faltas_registadas_hoje: faltasHoje,
      };
      if (veFinancas) {
        const a = await atrasos(s);
        const { data: pagMes } = await supabase.from("pagamentos").select("valor").gte("data_pagamento", hoje.slice(0, 7) + "-01");
        r.alunos_com_propinas_em_atraso = a.length;
        r.propinas_vencidas_por_cobrar_fcfa = a.reduce((t, x) => t + x.valor_fcfa, 0);
        r.recebido_este_mes_fcfa = (pagMes ?? []).reduce((t, p) => t + p.valor, 0);
      } else r.financas = "sem acesso para este papel";
      return r;
    }

    case "listar_turmas": {
      const { data } = await supabase.from("turmas").select("nome, turno, sala, capacidade, classes(nome, ordem), matriculas(estado)").eq("ano_letivo_id", s.ano.id);
      return ((data ?? []) as unknown as { nome: string; turno: string; sala: string | null; capacidade: number; classes: { nome: string; ordem: number }; matriculas: { estado: string }[] }[])
        .sort((a, b) => a.classes.ordem - b.classes.ordem || a.nome.localeCompare(b.nome))
        .map((t) => ({ turma: t.nome, classe: t.classes.nome, turno: t.turno, sala: t.sala, alunos: t.matriculas.filter((m) => m.estado === "ativa").length, capacidade: t.capacidade }));
    }

    case "procurar_aluno": {
      const termo = String(entrada.nome ?? "").replace(/[%,()]/g, "").trim();
      if (termo.length < 2) return { erro: "Indique pelo menos 2 letras do nome." };
      const { data } = await supabase
        .from("alunos")
        .select("id, nome, numero, genero, data_nascimento, linguas, matriculas(id, estado, ano_letivo_id, turma_id, bolsa_percentagem, turmas(nome))")
        .or(`nome.ilike.%${termo}%,numero.ilike.%${termo}%`)
        .limit(5);
      type A = { id: string; nome: string; numero: string; genero: string | null; data_nascimento: string | null; linguas: string | null; matriculas: { id: string; estado: string; ano_letivo_id: string; turma_id: string; bolsa_percentagem: number; turmas: { nome: string } }[] };
      const lista = (data ?? []) as unknown as A[];
      if (!lista.length) return { resultado: "Nenhum aluno encontrado (ou sem permissão para o ver)." };
      return Promise.all(lista.map(async (a) => {
        const m = a.matriculas.find((x) => x.ano_letivo_id === s.ano!.id);
        const r: Record<string, unknown> = { nome: a.nome, processo: a.numero, genero: a.genero, nascimento: a.data_nascimento, linguas_em_casa: a.linguas };
        if (!m) return { ...r, matricula: "sem matrícula no ano atual" };
        r.turma = m.turmas.nome; r.estado = m.estado; r.bolsa_percentagem = m.bolsa_percentagem;
        const b = await boletins([m.id], m.turma_id);
        const sit = situacao(b.porMat[m.id], Number(s.escola.nota_minima));
        r.notas = b.porMat[m.id].filter((l) => l.media !== null).map((l) => ({ disciplina: l.disciplina, t1: l.t1, t2: l.t2, t3: l.t3, media: l.media }));
        r.media_geral = sit.media; r.situacao = sit.texto;
        r.faltas = b.faltasPor[m.id] ?? { t: 0, j: 0 };
        if (veFinancas) {
          const at = (await atrasos(s, m.turma_id)).find((x) => x.matricula_id === m.id);
          r.propinas_em_falta = at ? { meses: at.meses_em_falta, valor_fcfa: at.valor_fcfa } : "em dia";
        }
        return r;
      }));
    }

    case "propinas_em_atraso": {
      if (!veFinancas) return { erro: "Este papel não tem acesso às propinas." };
      let turmaId: string | undefined;
      if (entrada.turma) {
        const t = await encontrarTurma(s, String(entrada.turma));
        if (!t) return { erro: `Turma "${entrada.turma}" não encontrada.` };
        turmaId = t.id;
      }
      const a = await atrasos(s, turmaId);
      return { total_alunos: a.length, total_fcfa: a.reduce((t, x) => t + x.valor_fcfa, 0), alunos: a.slice(0, 40).map((x) => ({ aluno: x.aluno, turma: x.turma, meses_em_falta: x.meses_em_falta, valor_fcfa: x.valor_fcfa })), nota: a.length > 40 ? "Lista cortada aos 40 maiores valores." : undefined };
    }

    case "pauta_turma": {
      const t = await encontrarTurma(s, String(entrada.turma ?? ""));
      if (!t) return { erro: `Turma "${entrada.turma}" não encontrada.` };
      const tri = [1, 2, 3].includes(Number(entrada.trimestre)) ? Number(entrada.trimestre) : undefined;
      const alunos = await alunosDaTurma(t.id);
      if (!alunos.length) return { turma: t.nome, alunos: [] };
      const b = await boletins(alunos.map((a) => a.id), t.id);
      const minima = Number(s.escola.nota_minima);
      const val = (l: { t1: number | null; t2: number | null; t3: number | null; media: number | null }) => (tri ? [l.t1, l.t2, l.t3][tri - 1] : l.media);
      const porDisc = b.discs.map((d) => {
        const vs = alunos.map((a) => val(b.porMat[a.id].find((l) => l.disciplina_id === d.id)!)).filter((v): v is number => v !== null);
        return { disciplina: d.nome, media: vs.length ? Math.round((vs.reduce((x, y) => x + y, 0) / vs.length) * 10) / 10 : null, negativas: vs.filter((v) => v < minima).length, avaliados: vs.length };
      });
      return {
        turma: t.nome, periodo: tri ? `${tri}.º trimestre` : "média anual", nota_minima: minima,
        alunos: alunos.map((a) => { const sit = situacao(b.porMat[a.id], minima, tri); return { n: a.numero_turma, aluno: a.alunos.nome, media: sit.media, negativas: sit.negativas, situacao: sit.texto }; }),
        disciplinas: porDisc,
      };
    }

    case "faltas": {
      let q = supabase.from("faltas").select("justificada, matricula_id, matriculas!inner(turma_id, ano_letivo_id, alunos(nome), turmas(nome))").eq("matriculas.ano_letivo_id", s.ano.id);
      if (entrada.turma) {
        const t = await encontrarTurma(s, String(entrada.turma));
        if (!t) return { erro: `Turma "${entrada.turma}" não encontrada.` };
        q = q.eq("matriculas.turma_id", t.id);
      }
      if (typeof entrada.desde === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entrada.desde)) q = q.gte("data", entrada.desde);
      const { data } = await q.limit(5000);
      const mapa = new Map<string, { aluno: string; turma: string; total: number; injustificadas: number }>();
      for (const f of (data ?? []) as unknown as { justificada: boolean; matricula_id: string; matriculas: { alunos: { nome: string }; turmas: { nome: string } } }[]) {
        const x = mapa.get(f.matricula_id) ?? { aluno: f.matriculas.alunos.nome, turma: f.matriculas.turmas.nome, total: 0, injustificadas: 0 };
        x.total++; if (!f.justificada) x.injustificadas++;
        mapa.set(f.matricula_id, x);
      }
      const lista = [...mapa.values()].sort((a, b) => b.injustificadas - a.injustificadas || b.total - a.total);
      return { total_faltas: (data ?? []).length, alunos_com_faltas: lista.length, top: lista.slice(0, 25) };
    }
  }
  return { erro: `Ferramenta desconhecida: ${nome}` };
}
