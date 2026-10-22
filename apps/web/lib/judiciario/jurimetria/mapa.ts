/**
 * Mapa do acervo de jurimetria do TJMG.
 *
 * O mapa é a camada que o LLM lê antes de consultar: quais temas existem,
 * com que palavras a pessoa os pede, quais normas e danos os cruzam, quantas
 * decisões cada um tem e quais casos-guia abrem a conversa. Ele é derivado do
 * índice e do contrato, não escrito à mão por tema.
 *
 * Fonte: acórdãos do TJMG e taxonomia PNAB/PEAB. O mapa não afirma resultado:
 * só conta o que está no acervo e aponta a rota.
 */

import { DANOS, NORMAS, ROTAS_JURIMETRIA, TEMAS, rotaDoDano, rotaDaNorma } from "./taxonomia";
import { construirIndice } from "./indice";
import { normalizarTexto, slugificar } from "./normalizar";
import type {
  CoberturaMapa,
  ConfiancaJurimetria,
  DecisaoJurimetria,
  EntradaMapa,
  FacetaMapa,
  MapaJurimetria,
  ResultadoJurimetria,
  TemaMapa,
} from "./tipos";

const ROTULOS_RESULTADO: Record<ResultadoJurimetria, string> = {
  favoravel: "Favorável ao atingido",
  desfavoravel: "Desfavorável ao atingido",
  parcial: "Parcialmente favorável",
  indeterminado: "Indeterminado",
  nao_classificado: "Não classificado",
};

function cobertura(decisoes: readonly DecisaoJurimetria[]): CoberturaMapa {
  const porResultado: Record<ResultadoJurimetria, number> = {
    favoravel: 0,
    desfavoravel: 0,
    parcial: 0,
    indeterminado: 0,
    nao_classificado: 0,
  };
  const porConfianca: Record<ConfiancaJurimetria, number> = { alta: 0, media: 0, baixa: 0 };
  let comInteiroTeor = 0;
  let semFonte = 0;

  for (const decisao of decisoes) {
    porResultado[decisao.resultado] += 1;
    porConfianca[decisao.confianca] += 1;
    if (decisao.fonte === "pdf") comInteiroTeor += 1;
    if (!decisao.urlEspelho) semFonte += 1;
  }

  return {
    total: decisoes.length,
    comInteiroTeor,
    semFonte,
    porResultado,
    porConfianca,
  };
}

function rankGuia(decisao: DecisaoJurimetria): number {
  const confianca: Record<ConfiancaJurimetria, number> = { alta: 3, media: 2, baixa: 1 };
  return (
    (decisao.resultado === "nao_classificado" ? 0 : 2) +
    (decisao.fonte === "pdf" ? 2 : 0) +
    confianca[decisao.confianca] +
    (decisao.urlEspelho ? 1 : 0) +
    (decisao.ementa.length > 300 ? 1 : 0)
  );
}

function casosGuia(ids: readonly string[], porId: ReadonlyMap<string, DecisaoJurimetria>): string[] {
  const decisoes = ids.map((id) => porId.get(id)).filter((d): d is DecisaoJurimetria => Boolean(d));
  const classificadas = decisoes.filter((d) => d.resultado !== "nao_classificado");
  const base = classificadas.length > 0 ? classificadas : decisoes;
  return base
    .sort((a, b) => {
      const rank = rankGuia(b) - rankGuia(a);
      if (rank !== 0) return rank;
      return (b.dataJulgamento ?? "").localeCompare(a.dataJulgamento ?? "");
    })
    .slice(0, 3)
    .map((d) => d.id);
}

function facetasDeContagem(
  contagens: ReadonlyMap<string, number>,
  rotulo: (slug: string) => string,
  rota?: (slug: string) => string
): FacetaMapa[] {
  return [...contagens.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([slug, contagem]) => ({
      slug,
      label: rotulo(slug),
      contagem,
      ...(rota ? { rota: rota(slug) } : {}),
    }));
}

function contarMapa(mapa: ReadonlyMap<string, readonly string[]>): Map<string, number> {
  const contagens = new Map<string, number>();
  for (const [slug, ids] of mapa) contagens.set(slug, ids.length);
  return contagens;
}

export function construirMapa(entrada: readonly DecisaoJurimetria[], meta: EntradaMapa): MapaJurimetria {
  const indice = construirIndice(entrada);
  const decisoes = indice.decisoes;
  const temas: TemaMapa[] = TEMAS.map((tema) => {
    const ids = indice.porTema.get(tema.slug) ?? [];
    return {
      ...tema,
      decisoes: ids.length,
      rota: ROTAS_JURIMETRIA.tema(tema.slug),
      casosGuia: casosGuia(ids, indice.porId),
    };
  });

  const normas = facetasDeContagem(
    contarMapa(indice.porNorma),
    (slug) => NORMAS.find((norma) => norma.id === slug)?.label ?? slug,
    rotaDaNorma
  );
  const danos = facetasDeContagem(
    contarMapa(indice.porDano),
    (slug) => DANOS.find((dano) => dano.id === slug)?.label ?? slug,
    rotaDoDano
  );
  const comarcas = facetasDeContagem(contarMapa(indice.porComarca), (slug) => slug);
  const resultados = facetasDeContagem(
    contarMapa(indice.porResultado),
    (slug) => ROTULOS_RESULTADO[slug as ResultadoJurimetria] ?? slug
  );
  const anos = [...indice.porAno.entries()]
    .map(([ano, ids]) => ({ slug: ano, label: ano, contagem: ids.length }))
    .sort((a, b) => Number(b.slug) - Number(a.slug));

  return {
    geradoEm: meta.geradoEm,
    fonte: meta.fonte,
    cobertura: cobertura(decisoes),
    temas,
    normas,
    danos,
    comarcas,
    resultados,
    anos,
  };
}

/**
 * Resumo curto do mapa para o prompt do chat de domínio.
 *
 * O modelo recebe os temas, as contagens, as palavras-chave e a rota; não
 * recebe as 5 mil ementas. A ferramenta `consultar` é quem busca as decisões.
 */
export function resumoDoMapa(mapa: MapaJurimetria): string {
  const linhas = [
    `Mapa da jurimetria do TJMG: ${mapa.cobertura.total} decisões; ` +
      `${mapa.cobertura.comInteiroTeor} com inteiro teor; ${mapa.cobertura.semFonte} sem fonte oficial.`,
    "Temas:",
  ];
  for (const tema of mapa.temas) {
    linhas.push(
      `- ${tema.slug} | ${tema.label} | ${tema.decisoes} decisões | ` +
        `palavras: ${tema.palavrasChave.slice(0, 8).join(", ")} | ` +
        `relacionados: ${tema.relacionados.join(", ") || "nenhum"} | rota: ${tema.rota}`
    );
  }
  linhas.push(
    "Use as ferramentas de consulta por tema, norma, dano, comarca, ano e resultado. " +
      "Não responda por memória e não invente número."
  );
  return linhas.join("\n");
}

/** Atalho de rota para a página de um tema. */
export function rotaDoTema(slug: string): string {
  return ROTAS_JURIMETRIA.tema(slug);
}

/** Atalho de rota para uma decisão. */
export function rotaDaDecisao(id: string): string {
  return ROTAS_JURIMETRIA.decisao(id);
}

/** Normaliza um rótulo de comarca para o slug usado na rota. */
export function slugDeComarca(comarca: string): string {
  return slugificar(normalizarTexto(comarca));
}
