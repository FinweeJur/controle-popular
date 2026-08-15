import { readFileSync } from "node:fs";
import path from "node:path";

import { ehTipoPessoal, precisaRedigirResumo } from "./triagem";

/**
 * Biblioteca das Assessorias Técnicas Independentes do Paraopeba — o que as
 * ATIs **publicaram** (cartilhas, boletins, jornais, produtos do plano de
 * trabalho, documentos técnicos, vídeos, rádio).
 *
 * Gerado por `scripts/coletar-biblioteca-ati.py`, lido no BUILD.
 *
 * ═══ NÃO CONFUNDIR COM `/paraopeba/documentos` ═══
 *
 * `documentos.ts` é o acervo do **processo judicial** — petição, laudo,
 * decisão —, vindo do índice Solr da Plataforma Brumadinho UFMG. Isto aqui é
 * o que as assessorias produziram **para as pessoas atingidas**: material de
 * comunicação e de formação, não peça processual. As duas coisas têm autoria,
 * finalidade e risco diferentes, e por isso vivem em telas separadas.
 *
 * ═══ METADADO E LINK, NUNCA O ARQUIVO ═══
 *
 * Cada item guarda título, data, tipo, tema, qual ATI produziu e a URL da
 * página do item **no site da própria ATI**. Nenhum PDF é baixado, copiado ou
 * reservido. É o mesmo veredito que `docs/FONTES-BRUMADINHO-UFMG.md` já
 * registrou para acervo de terceiro — "linkar, não copiar" — e aqui ele é
 * ainda mais direto: nenhuma das duas fontes declara licença de uso, e sem
 * declaração expressa a obra é de direitos reservados (Lei 9.610/98, art. 7º).
 *
 * Por isso também **não existe campo de resumo**. Nem a API da AEDAS nem a
 * página do Guaicuy publicam um `excerpt`; escrever um seria este portal
 * resumindo obra de terceiro e assinando embaixo. Título e link são citação,
 * o resto não é.
 *
 * ═══ A TRIAGEM DE DADO PESSOAL RODA AQUI, NO BUILD ═══
 *
 * A trava geral que varreria todo dado ingerido ainda não existe. A régua que
 * existe é `triagem.ts` — escrita pela frente Paraopeba, testada, em
 * TypeScript. O coletor em Python deliberadamente **não** a reimplementa (duas
 * cópias da mesma regra divergem, que é a razão de `triagem.ts` existir), e
 * por isso ela é aplicada na leitura: item apontado não entra em
 * `BIBLIOTECA_ATI` e vira contagem em `COBERTURA_BIBLIOTECA`.
 *
 * `precisaRedigirResumo` é usada aqui como veto de item, não como redação de
 * resumo — e isso é coerente, não um desvio: um item sem resumo cujo TÍTULO
 * dispara a régua não tem nada a redigir. Ou o título é publicável, ou o item
 * inteiro sai. Não há meio-termo quando o título é o único texto.
 */

/** As quatro organizações medidas. Só as duas primeiras têm acervo aqui. */
export type AtiBiblioteca = "aedas" | "guaicuy" | "nacab" | "adai";

export interface ItemBiblioteca {
  id: string;
  ati: AtiBiblioteca;
  fonte_id: string;
  titulo: string;
  /** ISO `yyyy-mm-dd`. `null` quando a fonte não publicou data. */
  data: string | null;
  /** Rótulo do tipo, como a própria fonte o nomeia. */
  tipo: string;
  /** Temas/eixos declarados pela fonte. Vazio quando ela não classifica. */
  temas: string[];
  /** Recortes do Paraopeba em que a fonte encaixou o item. */
  colecoes: string[];
  /** Página do item no site da ATI — nunca o arquivo. */
  url: string;
  /** Autoria declarada pela fonte. `null` = a fonte não declarou. */
  autoria: string | null;
}

export interface FonteBiblioteca {
  id: string;
  ati: AtiBiblioteca;
  nome: string;
  site: string;
  regioes: string;
  /** Licença declarada pela fonte — ou a constatação de que não há. */
  licenca: string;
  metodo: string;
  itens: number;
}

export interface BibliotecaAti {
  gerado_em: string;
  fontes: FonteBiblioteca[];
  /** O que o acervo sabe que NÃO cobre — exibido na tela, não só aqui. */
  ficou_de_fora: string;
  itens: ItemBiblioteca[];
}

interface ArquivoBruto extends Omit<BibliotecaAti, "itens"> {
  itens: ItemBiblioteca[];
}

const VAZIO: BibliotecaAti = {
  gerado_em: "",
  fontes: [],
  ficou_de_fora: "",
  itens: [],
};

/**
 * `true` quando o item não pode ser publicado.
 *
 * Duas portas, as mesmas de `documentos.ts`, na mesma ordem: o TIPO ser de
 * natureza pessoal (documento de identificação, comprovante, declaração), ou
 * o TÍTULO disparar a régua de dado pessoal (CPF válido, iniciais de vítima,
 * contato pessoal). `resumo: null` porque este acervo não tem resumo — a
 * régua então avalia só o título, que é exatamente o que existe para avaliar.
 */
export function ehItemBloqueadoPelaTriagem(item: ItemBiblioteca): boolean {
  if (ehTipoPessoal(item.tipo)) return true;
  return precisaRedigirResumo({
    tipo: item.tipo,
    titulo: item.titulo,
    resumo: null,
    temas: item.temas,
  });
}

/**
 * Lê o acervo gravado pelo coletor e aplica a triagem.
 *
 * ⚠️ Arquivo ausente devolve vazio em vez de quebrar o build, pelo mesmo
 * motivo de `radar.ts`: um `git clone` antes da primeira coleta não pode
 * derrubar a publicação do site inteiro por causa de uma seção. Quem lê
 * `gerado_em: ""` sabe que a coleta não rodou, e a tela diz isso em palavras.
 */
function ler(): { dados: BibliotecaAti; barrados: ItemBiblioteca[] } {
  let bruto: ArquivoBruto;
  try {
    const caminho = path.join(process.cwd(), "data", "biblioteca-ati.json");
    bruto = JSON.parse(readFileSync(caminho, "utf-8")) as ArquivoBruto;
  } catch {
    return { dados: VAZIO, barrados: [] };
  }

  const barrados = bruto.itens.filter(ehItemBloqueadoPelaTriagem);
  const publicaveis = bruto.itens.filter((i) => !ehItemBloqueadoPelaTriagem(i));
  return { dados: { ...bruto, itens: publicaveis }, barrados };
}

const LIDO = ler();

/** Acervo já triado — é este array, e só ele, que qualquer tela pode exibir. */
export const BIBLIOTECA_ATI: ItemBiblioteca[] = LIDO.dados.itens;

export const FONTES_BIBLIOTECA: FonteBiblioteca[] = LIDO.dados.fontes;

/**
 * Números medidos do que foi de fato publicado, nunca digitados.
 *
 * `barradosPelaTriagem` sai na tela mesmo valendo zero: "a régua rodou e não
 * achou nada" e "a régua não rodou" são estados diferentes, e só o primeiro
 * merece confiança. Um contador escondido quando é zero apaga essa diferença.
 */
export const COBERTURA_BIBLIOTECA = {
  geradoEm: LIDO.dados.gerado_em,
  publicados: BIBLIOTECA_ATI.length,
  barradosPelaTriagem: LIDO.barrados.length,
  ficouDeFora: LIDO.dados.ficou_de_fora,
  /** Período real coberto pelo acervo — a tela rotula por ele, não por "hoje". */
  periodo: (() => {
    const datas = BIBLIOTECA_ATI.map((i) => i.data).filter((d): d is string => Boolean(d)).sort();
    return { de: datas[0] ?? "", ate: datas[datas.length - 1] ?? "" };
  })(),
} as const;

/** Rótulo curto de cada ATI — mesmo vocabulário de `clipping-ati.ts`. */
export const ATI_BIBLIOTECA_LABEL: Record<AtiBiblioteca, string> = {
  aedas: "AEDAS",
  guaicuy: "Guaicuy",
  nacab: "NACAB",
  adai: "ADAI",
};

/** Tipos presentes no acervo, em ordem de frequência medida. */
export function tiposDaBiblioteca(itens: ItemBiblioteca[] = BIBLIOTECA_ATI): string[] {
  const contagem = new Map<string, number>();
  for (const i of itens) contagem.set(i.tipo, (contagem.get(i.tipo) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt")).map(([t]) => t);
}

/** Temas presentes no acervo, em ordem de frequência medida. */
export function temasDaBiblioteca(itens: ItemBiblioteca[] = BIBLIOTECA_ATI): string[] {
  const contagem = new Map<string, number>();
  for (const i of itens) for (const t of i.temas) contagem.set(t, (contagem.get(t) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt")).map(([t]) => t);
}
