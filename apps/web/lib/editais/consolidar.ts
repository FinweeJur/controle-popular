/**
 * @file Consolidação dos certames do radar de editais.
 *
 * O QUE FAZ: junta publicações que são o MESMO certame e transforma a
 * sequência em uma linha só, com `atualizacoes` (andamento). Sem isso, o
 * Diário Oficial publica "credenciamento", depois "inabilitação", depois
 * "resultado" e a página /editais mostra três linhas iguais — ou sete, quando
 * o extrator repete o mesmo trecho.
 *
 * CHAVE DO CERTAME:
 * - com número: órgão + número (dois chamamentos do mesmo órgão não se misturam);
 * - sem número: órgão + objeto normalizado (o credenciamento e a inabilitação
 *   do mesmo objeto são o mesmo certame em andamento).
 *
 * DEDUPE DENTRO DO GRUPO: mesma modalidade + mesmo título é repetição do mesmo
 * ato, não andamento novo. Fica a publicação mais recente; o resto some. Assim
 * as 7 cópias de "Publicada inabilitação" viram uma atualização.
 *
 * A função é pura (sem fs/rede) para rodar no script do radar e no teste.
 */
import type { AtualizacaoEdital, ItemEdital } from "./dados";

/** Normaliza para comparar: sem acento, minúsculo, espaço único. */
export function normalizarChave(texto: string): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Chave estável do certame entre publicações de dias diferentes. */
export function chaveCertame(item: ItemEdital): string {
  const orgao = normalizarChave(item.orgao);
  if (item.numero) return `${orgao}|numero:${normalizarChave(item.numero)}`;
  const objeto = normalizarChave(item.objeto).slice(0, 140);
  if (objeto) return `${orgao}|objeto:${objeto}`;
  return `${orgao}|titulo:${normalizarChave(item.titulo)}`;
}

/** Deduplica repetições do mesmo ato, mantendo a publicação mais recente. */
function atualizacoesDoGrupo(grupo: ItemEdital[]): ItemEdital[] {
  const porAto = new Map<string, ItemEdital>();
  for (const item of grupo) {
    const chave = `${normalizarChave(item.modalidade)}|${normalizarChave(item.titulo)}`;
    const atual = porAto.get(chave);
    if (!atual || item.dataPublicacao >= atual.dataPublicacao) {
      porAto.set(chave, item);
    }
  }
  return [...porAto.values()].sort((a, b) =>
    b.dataPublicacao.localeCompare(a.dataPublicacao)
  );
}

/** Converte o item mais recente + o andamento no registro consolidado. */
function montarConsolidado(grupo: ItemEdital[]): ItemEdital {
  const atualizacoes = atualizacoesDoGrupo(grupo);
  const maisRecente = atualizacoes[0] ?? grupo[0];
  const numero = grupo.find((item) => item.numero)?.numero ?? null;
  const objeto = maisRecente.objeto || grupo.find((item) => item.objeto)?.objeto || "";

  const andamento: AtualizacaoEdital[] = atualizacoes.map((item) => ({
    data: item.dataPublicacao,
    titulo: item.titulo,
    modalidade: item.modalidade,
    condicoesEPrazos: item.condicoesEPrazos,
    urlOficial: item.urlOficial,
    pagina: item.pagina ?? null,
    secao: item.secao ?? null,
  }));

  return {
    ...maisRecente,
    numero,
    objeto,
    slug: undefined,
    score: Math.max(...grupo.map((item) => item.score)),
    atualizacoes: andamento,
  };
}

/** Consolida a lista inteira, da publicação mais recente para a mais antiga. */
export function consolidarEditais(itens: ItemEdital[]): ItemEdital[] {
  const grupos = new Map<string, ItemEdital[]>();
  for (const item of itens) {
    const chave = chaveCertame(item);
    const grupo = grupos.get(chave);
    if (grupo) grupo.push(item);
    else grupos.set(chave, [item]);
  }

  return [...grupos.values()]
    .map(montarConsolidado)
    .sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao));
}
