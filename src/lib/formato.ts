const fcfa = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 });

export function dinheiro(valor: number | null | undefined) {
  return `${fcfa.format(valor ?? 0)} FCFA`;
}

export const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function data(d: string | null | undefined) {
  if (!d) return "—";
  const [a, m, dia] = d.slice(0, 10).split("-");
  return `${dia}/${m}/${a}`;
}

export function mesAno(d: string | null | undefined) {
  if (!d) return "—";
  const [a, m] = d.slice(0, 7).split("-");
  return `${MESES[Number(m) - 1]} ${a}`;
}

/** Meses letivos (1.º dia de cada mês) entre o início e o fim do ano letivo. */
export function mesesLetivos(inicio: string, fim: string) {
  const out: string[] = [];
  const [ai, mi] = inicio.split("-").map(Number);
  const [af, mf] = fim.split("-").map(Number);
  let a = ai, m = mi;
  while (a < af || (a === af && m <= mf)) {
    out.push(`${a}-${String(m).padStart(2, "0")}-01`);
    m++;
    if (m > 12) { m = 1; a++; }
  }
  return out;
}

export function nota(n: number | string | null | undefined) {
  if (n === null || n === undefined || n === "") return "—";
  const v = Number(n);
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ",");
}

export function idade(nasc: string | null) {
  if (!nasc) return null;
  const h = new Date();
  const d = new Date(nasc);
  let i = h.getFullYear() - d.getFullYear();
  if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) i--;
  return i;
}

export function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function texto(fd: FormData, k: string) {
  const v = fd.get(k);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}
