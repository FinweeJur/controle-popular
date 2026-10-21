/**
 * Normalização do acervo de jurimetria do TJMG.
 *
 * Recebe o que o exportador do repositório de origem entregou e devolve o
 * contrato do portal: tema canônico, resultado sem `pendente`, norma e dano
 * com id estável, data ISO e comarca sem variante de caixa.
 *
 * A regra editorial é a mesma do resto do portal: campo vazio não vira
 * categoria inventada. `pendente`, `n/d` e vazio viram `null` ou
 * `nao_classificado`, e a ausência continua visível no mapa.
 */

import { DANOS, NORMAS, temaCanonico } from "./taxonomia";
import type {
  ConfiancaJurimetria,
  DecisaoJurimetria,
  NexoJurimetria,
  ResultadoJurimetria,
} from "./tipos";

function chave(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function normalizarTexto(texto: string): string {
  return chave(texto);
}

export function slugificar(texto: string): string {
  return chave(texto).replace(/\s+/g, "-");
}

export function normalizarData(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const texto = valor.trim();
  if (!texto) return null;

  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  return null;
}

export function normalizarResultado(valor: string | null | undefined): ResultadoJurimetria {
  const t = normalizarTexto(valor ?? "");
  if (t === "desfavoravel") return "desfavoravel";
  if (t === "favoravel") return "favoravel";
  if (t === "parcial") return "parcial";
  if (t === "indeterminado") return "indeterminado";
  return "nao_classificado";
}

export function normalizarNexo(valor: string | null | undefined): NexoJurimetria {
  const t = normalizarTexto(valor ?? "");
  if (t === "afirmado") return "afirmado";
  if (t === "negado") return "negado";
  if (t === "misto") return "misto";
  if (t === "nao abordado") return "nao_abordado";
  return "nao_classificado";
}

export function normalizarComarca(valor: string | null | undefined): string | null {
  const t = normalizarTexto(valor ?? "");
  if (!t || t === "pendente" || t === "n d" || t === "nao informado") return null;

  const apelidos: Record<string, string> = {
    belo: "BELO HORIZONTE",
    "belo horizonte": "BELO HORIZONTE",
    brumadinho: "BRUMADINHO",
    betim: "BETIM",
    ibirite: "IBIRITÉ",
    "igarape": "IGARAPÉ",
    "mateus leme": "MATEUS LEME",
    "morada nova de minas": "MORADA NOVA DE MINAS",
    "para de minas": "PARÁ DE MINAS",
    pompeu: "POMPÉU",
    esmeraldas: "ESMERALDAS",
  };

  return apelidos[t] ?? (valor ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

export function normalizarValor(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  const texto = valor.trim();
  if (!texto || /^pendente$/i.test(texto)) return null;

  let limpo = texto.replace(/[^\d,.-]/g, "");
  if (limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  }
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

export function normalizarDanos(valor: string | null | undefined): string[] {
  const partes = (valor ?? "")
    .split(/[|;]/)
    .map((parte) => normalizarTexto(parte))
    .filter(Boolean);
  const ids = new Set<string>();
  for (const parte of partes) {
    const dano = DANOS.find((d) => d.termos.some((termo) => normalizarTexto(termo) === parte));
    if (dano) ids.add(dano.id);
  }
  return [...ids];
}

export function normalizarNormas(valor: string | null | undefined): string[] {
  const partes = (valor ?? "")
    .split(/[;|]/)
    .map((parte) => normalizarTexto(parte))
    .filter(Boolean);
  const ids = new Set<string>();
  for (const parte of partes) {
    const candidatas = NORMAS.filter((norma) =>
      norma.termos.some((termo) => {
        const t = normalizarTexto(termo);
        return t.length >= 3 && parte.includes(t);
      })
    ).sort((a, b) => {
      const maiorA = Math.max(...a.termos.map((t) => normalizarTexto(t).length));
      const maiorB = Math.max(...b.termos.map((t) => normalizarTexto(t).length));
      return maiorB - maiorA;
    });
    if (candidatas[0]) ids.add(candidatas[0].id);
  }
  return [...ids];
}

export function normalizarTemas(valor: string | string[] | null | undefined): string[] {
  const partes = Array.isArray(valor) ? valor : (valor ?? "").split(/[|;]/);
  const temas = new Set<string>();
  for (const parte of partes) {
    const canonico = temaCanonico(parte);
    if (canonico) temas.add(canonico);
  }
  return [...temas];
}

export function limparEmenta(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\s+/g, " ").trim();
}

export function idDaDecisao(dados: {
  numeroAcordao: string | null;
  processo: string;
  dataJulgamento: string | null;
  classe: string;
}): string {
  return [
    "tjmg",
    slugificar(dados.numeroAcordao ?? "sem-acordao"),
    slugificar(dados.processo || "sem-processo"),
    dados.dataJulgamento ?? "sem-data",
    slugificar(dados.classe || "sem-classe"),
  ].join(":");
}

function rankFonte(decisao: DecisaoJurimetria): number {
  const confianca: Record<ConfiancaJurimetria, number> = { alta: 3, media: 2, baixa: 1 };
  return (
    (decisao.fonte === "pdf" ? 10 : 0) +
    confianca[decisao.confianca] +
    (decisao.urlEspelho ? 1 : 0) +
    (decisao.arquivoTxt ? 1 : 0)
  );
}

function unicos<T>(valores: T[]): T[] {
  return [...new Set(valores)];
}

function fundir(a: DecisaoJurimetria, b: DecisaoJurimetria): DecisaoJurimetria {
  const preferida = rankFonte(b) > rankFonte(a) ? b : a;
  const outra = preferida === a ? b : a;
  return {
    ...preferida,
    id: a.id,
    temas: unicos([...a.temas, ...b.temas]),
    temasFonte: unicos([...a.temasFonte, ...b.temasFonte]),
    normas: unicos([...a.normas, ...b.normas]),
    normasBrutas: unicos([...a.normasBrutas, ...b.normasBrutas]),
    danos: unicos([...a.danos, ...b.danos]),
    ementa: preferida.ementa.length >= outra.ementa.length ? preferida.ementa : outra.ementa,
    urlEspelho: preferida.urlEspelho ?? outra.urlEspelho,
    arquivoTxt: preferida.arquivoTxt ?? outra.arquivoTxt,
    valorIndenizacao: preferida.valorIndenizacao ?? outra.valorIndenizacao,
    resultado:
      preferida.resultado === "nao_classificado" && outra.resultado !== "nao_classificado"
        ? outra.resultado
        : preferida.resultado,
    nexo:
      preferida.nexo === "nao_classificado" && outra.nexo !== "nao_classificado"
        ? outra.nexo
        : preferida.nexo,
  };
}

/**
 * Deduplica pela chave que o exportador consegue sustentar:
 * número do acórdão (quando existe), processo, data e classe.
 *
 * O mesmo acórdão pode aparecer em buscas de temas diferentes; nesse caso,
 * os temas são fundidos e a versão com PDF/confiança alta vence.
 */
export function deduplicarDecisoes(decisoes: readonly DecisaoJurimetria[]): DecisaoJurimetria[] {
  const porChave = new Map<string, DecisaoJurimetria>();
  for (const decisao of decisoes) {
    const chaveDecisao = [
      decisao.numeroAcordao ?? "sem-acordao",
      decisao.processo,
      decisao.dataJulgamento ?? "sem-data",
      decisao.classe,
    ]
      .map((parte) => normalizarTexto(parte))
      .join("|");
    const existente = porChave.get(chaveDecisao);
    porChave.set(chaveDecisao, existente ? fundir(existente, decisao) : decisao);
  }

  return [...porChave.values()].sort((a, b) => {
    const dataA = a.dataJulgamento ?? "";
    const dataB = b.dataJulgamento ?? "";
    if (dataA !== dataB) return dataB.localeCompare(dataA);
    return a.id.localeCompare(b.id);
  });
}

export interface InconsistenciaJurimetria {
  id: string;
  campo: string;
  detalhe: string;
}

/**
 * Auditoria barata do contrato. Não corrige nada: devolve a lista para o
 * exportador tratar antes de publicar.
 */
export function auditarDecisoes(decisoes: readonly DecisaoJurimetria[]): InconsistenciaJurimetria[] {
  const problemas: InconsistenciaJurimetria[] = [];
  const ids = new Set<string>();

  for (const decisao of decisoes) {
    if (!decisao.id) problemas.push({ id: decisao.id, campo: "id", detalhe: "vazio" });
    if (ids.has(decisao.id)) {
      problemas.push({ id: decisao.id, campo: "id", detalhe: "duplicado" });
    }
    ids.add(decisao.id);

    if (!decisao.ementa) {
      problemas.push({ id: decisao.id, campo: "ementa", detalhe: "vazia" });
    }
    if (decisao.temas.length === 0) {
      problemas.push({ id: decisao.id, campo: "temas", detalhe: "sem tema canônico" });
    }
    if (!decisao.urlEspelho) {
      problemas.push({ id: decisao.id, campo: "urlEspelho", detalhe: "sem fonte oficial" });
    } else if (!/^https?:\/\//i.test(decisao.urlEspelho)) {
      problemas.push({ id: decisao.id, campo: "urlEspelho", detalhe: "não é URL absoluta" });
    }
    if (decisao.resultado === "nao_classificado") {
      problemas.push({ id: decisao.id, campo: "resultado", detalhe: "não classificado" });
    }
  }

  return problemas;
}
