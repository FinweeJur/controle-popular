import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { TemaAjri } from "./auditoria-ajri";
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
  /**
   * Macro-categoria enxuta derivada do `tipo` — formato do material, não
   * assunto. Usada para filtrar a biblioteca sem expor o vocabulário cru das
   * três fontes. Gerada por `scripts/classificar-biblioteca-ati-macro.py`.
   */
  macro_categoria: string;
  /**
   * Tags legíveis sobre o assunto do documento, extraídas do título por regras
   * de palavra-chave. Independente de `temas` (declarado pela fonte) e de
   * `temas_ajri_inferred` (ponte técnica para a análise integrada).
   */
  tags: string[];
  /**
   * Temas/eixos declarados pela fonte. Vazio quando ela não classifica — é o
   * caso do Guaicuy, que não tem taxonomia temática na biblioteca. Vazio aqui
   * significa "a fonte não classificou", nunca "o portal não soube ler".
   */
  temas: string[];
  /**
   * Temas inferidos por regras de palavra-chave no título, quando a fonte não
   * declara tema. Só existe para Guaicuy, NACAB e os boletins da AEDAS que
   * chegam vazios. A UI deve rotular como inferido — o portal não atribui o
   * mesmo peso de um tema declarado pela própria ATI.
   */
  temas_ajri_inferred?: TemaAjri[];
  /**
   * Origem declarada pela fonte: produção própria, produção de parceiros,
   * documento legal/público. Separada de `temas` de propósito — é uma
   * afirmação sobre AUTORIA, não sobre assunto, e misturar as duas num filtro
   * só faz o seletor responder duas perguntas ao mesmo tempo.
   */
  origem: string | null;
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

const ARQUIVO_BIBLIOTECA = "biblioteca-ati.json";

interface LidoBiblioteca {
  dados: BibliotecaAti;
  barrados: ItemBiblioteca[];
}

let lido: LidoBiblioteca | undefined;
let emVoo: Promise<LidoBiblioteca> | null = null;

async function ler(): Promise<LidoBiblioteca> {
  if (lido) return lido;
  if (emVoo) return emVoo;
  emVoo = (async () => {
    let bruto: ArquivoBruto;
    try {
      let texto: string;
      try {
        const { env } = await getCloudflareContext({ async: true });
        if (!env.ASSETS) throw new Error("sem ASSETS");
        const resp = await env.ASSETS.fetch(
          new URL(`http://assets.local/data/${ARQUIVO_BIBLIOTECA}`)
        );
        if (!resp.ok) throw new Error(`ASSETS.fetch devolveu ${resp.status}`);
        texto = await resp.text();
      } catch {
        // Fallback dev/teste/build local: tenta ler de public/data
        let caminho: string;
        try {
          const esteArquivo = fileURLToPath(import.meta.url);
          caminho = path.resolve(path.dirname(esteArquivo), "..", "..", "..", "public", "data", ARQUIVO_BIBLIOTECA);
          texto = readFileSync(caminho, "utf-8");
        } catch {
          caminho = path.resolve(process.cwd(), "public", "data", ARQUIVO_BIBLIOTECA);
          texto = readFileSync(caminho, "utf-8");
        }
      }
      bruto = JSON.parse(texto) as ArquivoBruto;
    } catch {
      const vazio: LidoBiblioteca = { dados: VAZIO, barrados: [] };
      lido = vazio;
      return vazio;
    }

    const barrados = bruto.itens.filter(ehItemBloqueadoPelaTriagem);
    const publicaveis = bruto.itens.filter((i) => !ehItemBloqueadoPelaTriagem(i));
    const resultado: LidoBiblioteca = {
      dados: { ...bruto, itens: publicaveis },
      barrados,
    };
    lido = resultado;
    return resultado;
  })();
  return emVoo;
}

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

/** Acervo já triado — é este array, e só ele, que qualquer tela pode exibir. */
export async function bibliotecaAti(): Promise<ItemBiblioteca[]> {
  return (await ler()).dados.itens;
}

export async function fontesBiblioteca(): Promise<FonteBiblioteca[]> {
  return (await ler()).dados.fontes;
}

/**
 * Números medidos do que foi de fato publicado, nunca digitados.
 *
 * `barradosPelaTriagem` sai na tela mesmo valendo zero: "a régua rodou e não
 * achou nada" e "a régua não rodou" são estados diferentes, e só o primeiro
 * merece confiança. Um contador escondido quando é zero apaga essa diferença.
 */
export async function coberturaBiblioteca(): Promise<{
  geradoEm: string;
  publicados: number;
  barradosPelaTriagem: number;
  ficouDeFora: string;
  periodo: { de: string; ate: string };
}> {
  const { dados, barrados } = await ler();
  const itens = dados.itens;
  const datas = itens.map((i) => i.data).filter((d): d is string => Boolean(d)).sort();
  return {
    geradoEm: dados.gerado_em,
    publicados: itens.length,
    barradosPelaTriagem: barrados.length,
    ficouDeFora: dados.ficou_de_fora,
    /** Período real coberto pelo acervo — a tela rotula por ele, não por "hoje". */
    periodo: { de: datas[0] ?? "", ate: datas[datas.length - 1] ?? "" },
  };
}

/** Rótulo curto de cada ATI — mesmo vocabulário de `clipping-ati.ts`. */
export const ATI_BIBLIOTECA_LABEL: Record<AtiBiblioteca, string> = {
  aedas: "AEDAS",
  guaicuy: "Guaicuy",
  nacab: "NACAB",
  adai: "ADAI",
};

/** Tipos presentes no acervo, em ordem de frequência medida. */
export function tiposDaBiblioteca(itens: ItemBiblioteca[]): string[] {
  const contagem = new Map<string, number>();
  for (const i of itens) contagem.set(i.tipo, (contagem.get(i.tipo) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt")).map(([t]) => t);
}

/** Temas presentes no acervo, em ordem de frequência medida. */
export function temasDaBiblioteca(itens: ItemBiblioteca[]): string[] {
  const contagem = new Map<string, number>();
  for (const i of itens) for (const t of i.temas) contagem.set(t, (contagem.get(t) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt")).map(([t]) => t);
}

/** Macro-categorias presentes no acervo, em ordem de frequência medida. */
export function macrosDaBiblioteca(itens: ItemBiblioteca[]): string[] {
  const contagem = new Map<string, number>();
  for (const i of itens) contagem.set(i.macro_categoria, (contagem.get(i.macro_categoria) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt")).map(([t]) => t);
}

/** Tags presentes no acervo, em ordem de frequência medida. */
export function tagsDaBiblioteca(itens: ItemBiblioteca[]): string[] {
  const contagem = new Map<string, number>();
  for (const i of itens) for (const t of i.tags) contagem.set(t, (contagem.get(t) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt")).map(([t]) => t);
}

/**
 * Quantos itens de cada ATI têm tema declarado.
 *
 * Existe para a tela poder dizer, em números, que o filtro de tema só alcança
 * parte do acervo — em vez de deixar o usuário concluir que o Guaicuy não
 * publica nada sobre saúde quando ele apenas não etiqueta por assunto.
 */
export function comTemaPorAti(itens: ItemBiblioteca[]): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const i of itens) if (i.temas.length > 0) contagem[i.ati] = (contagem[i.ati] ?? 0) + 1;
  return contagem;
}
