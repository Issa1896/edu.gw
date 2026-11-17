import type { ReactNode } from "react";

/**
 * Markdown mínimo e seguro (sem HTML bruto): títulos, parágrafos, listas,
 * citações, negrito, itálico, links e imagens https. Tudo vira elementos React,
 * por isso nada do texto é interpretado como HTML.
 */
function urlSegura(u: string) {
  return /^https:\/\//i.test(u) || u.startsWith("/");
}

function inline(texto: string, chave: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(texto))) {
    if (m.index > ultimo) out.push(texto.slice(ultimo, m.index));
    const k = `${chave}-${i++}`;
    if (m[1]) {
      // eslint-disable-next-line @next/next/no-img-element
      out.push(urlSegura(m[3]) ? <img key={k} src={m[3]} alt={m[2]} className="my-4 rounded-lg" loading="lazy" /> : m[2]);
    } else if (m[4]) {
      out.push(urlSegura(m[6])
        ? <a key={k} href={m[6]} className="text-verde underline" rel={m[6].startsWith("/") ? undefined : "noopener noreferrer"}>{m[5]}</a>
        : m[5]);
    } else if (m[7]) out.push(<strong key={k}>{m[8]}</strong>);
    else if (m[9]) out.push(<em key={k}>{m[10]}</em>);
    ultimo = re.lastIndex;
  }
  if (ultimo < texto.length) out.push(texto.slice(ultimo));
  return out;
}

export function Markdown({ texto }: { texto: string }) {
  const linhas = texto.replace(/\r\n/g, "\n").split("\n");
  const blocos: ReactNode[] = [];
  let i = 0;
  let n = 0;
  while (i < linhas.length) {
    const l = linhas[i];
    const k = `b${n++}`;
    if (!l.trim()) { i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(l);
    if (h) {
      const cls = ["", "mt-10 font-titulo text-3xl font-bold", "mt-8 font-titulo text-2xl font-bold", "mt-6 text-lg font-semibold"][h[1].length];
      const conteudo = inline(h[2], k);
      blocos.push(h[1].length === 1 ? <h2 key={k} className={cls}>{conteudo}</h2> : h[1].length === 2 ? <h2 key={k} className={cls}>{conteudo}</h2> : <h3 key={k} className={cls}>{conteudo}</h3>);
      i++; continue;
    }
    if (/^\s*[-*]\s+/.test(l) || /^\s*\d+[.)]\s+/.test(l)) {
      const ordenada = /^\s*\d+[.)]\s+/.test(l);
      const itens: ReactNode[] = [];
      while (i < linhas.length && (ordenada ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/).test(linhas[i])) {
        itens.push(<li key={`${k}-${itens.length}`}>{inline(linhas[i].replace(/^\s*([-*]|\d+[.)])\s+/, ""), `${k}-${itens.length}`)}</li>);
        i++;
      }
      blocos.push(ordenada
        ? <ol key={k} className="my-4 list-decimal space-y-1 pl-6">{itens}</ol>
        : <ul key={k} className="my-4 list-disc space-y-1 pl-6">{itens}</ul>);
      continue;
    }
    if (l.startsWith(">")) {
      const partes: string[] = [];
      while (i < linhas.length && linhas[i].startsWith(">")) { partes.push(linhas[i].replace(/^>\s?/, "")); i++; }
      blocos.push(<blockquote key={k} className="my-6 border-l-4 border-amarelo pl-4 italic text-suave">{inline(partes.join(" "), k)}</blockquote>);
      continue;
    }
    const partes: string[] = [];
    while (i < linhas.length && linhas[i].trim() && !/^(#{1,3}\s|>|\s*[-*]\s|\s*\d+[.)]\s)/.test(linhas[i])) { partes.push(linhas[i]); i++; }
    blocos.push(<p key={k} className="my-4">{inline(partes.join(" "), k)}</p>);
  }
  return <div className="text-[17px] leading-relaxed">{blocos}</div>;
}

export function slugificar(t: string) {
  return t
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
