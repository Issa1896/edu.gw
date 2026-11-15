export type Papel = "admin" | "secretaria" | "professor" | "financeiro" | "encarregado";

export type Escola = {
  id: string;
  nome: string;
  sigla: string | null;
  tipo: string;
  regiao: string;
  setor: string | null;
  morada: string | null;
  telefone: string | null;
  email: string | null;
  nif: string | null;
  diretor: string | null;
  moeda: string;
  nota_minima: number;
};

export type Perfil = {
  user_id: string;
  escola_id: string;
  papel: Papel;
  nome: string;
  telefone: string | null;
  ativo: boolean;
};

export type AnoLetivo = { id: string; nome: string; inicio: string; fim: string; atual: boolean };

export const NOMES_PAPEL: Record<Papel, string> = {
  admin: "Direção",
  secretaria: "Secretaria",
  professor: "Professor(a)",
  financeiro: "Tesouraria",
  encarregado: "Encarregado(a) de educação",
};

export const REGIOES: Record<string, string> = {
  SAB: "Setor Autónomo de Bissau",
  BAF: "Bafatá",
  BIO: "Biombo",
  BOL: "Bolama/Bijagós",
  CAC: "Cacheu",
  GAB: "Gabú",
  OIO: "Oio",
  QUI: "Quinara",
  TOM: "Tombali",
};

export const TURNOS: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };

export const METODOS: Record<string, string> = {
  numerario: "Numerário",
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  transferencia: "Transferência bancária",
  outro: "Outro",
};

export const ESTADOS_MATRICULA: Record<string, string> = {
  ativa: "Ativa",
  transferida: "Transferida",
  desistente: "Desistente",
  concluida: "Concluída",
};
