import { readFileSync } from "node:fs";
import path from "node:path";

import {
  type ArquivoComunicaBR,
  type CoberturaUF,
  expandirArquivo,
  medirCoberturaUF,
} from "./arquivo";
import type { MunicipioComunicaBR, SerieComunicaBR } from "./indicadores";

/**
 * O acervo do ComunicaBR já coletado (`data/comunicabr-31.json`), lido no
 * BUILD e servido às telas de `/dados/comunicabr`.
 *
 * ═══ POR QUE ARQUIVO, E NÃO BANCO ═══
 *
 * Mesmo motivo de `lib/clima/risco.ts`: a Neon está em HTTP 402 e o egress do
 * banco é o gargalo do projeto. Este dado não tem junção com nada — é uma
 * coleta de 853 requisições HTTP gravada de uma vez (632 s, 15/08/2026) — e
 * versionado dá diff legível quando o governo federal muda um número.
 *
 * ⚠️ **Nunca percorra `arquivo.municipios[].itens`**: o arquivo é compactado
 * com rótulos internados e esqueleto único (366 rótulos, 1 esqueleto para os
 * 853 municípios), e a travessia ingênua devolve ZERO itens com cara de coleta
 * falhada — aconteceu na primeira conferência, está registrado em
 * `docs/COMUNICABR-COLETA-MG.md`. A entrada é `expandirArquivo()`, e é a única
 * que este módulo usa.
 *
 * ═══ AS DUAS ESPÉCIES DE VAZIO, QUE É O QUE ESTE MÓDULO EXISTE PARA SEPARAR ═══
 *
 * **61%** dos itens de Minas vieram vazios (106.446 de 174.012) — e não os
 * "39%" que `docs/COMUNICABR-COLETA-MG.md` escreve: 39% é a fatia COM valor
 * (67.566 de 174.012), invertida no documento. Nenhum número desta camada é
 * digitado; a razão é calculada na tela, e foi assim que a inversão apareceu.
 *
 * Publicar só os 67.566 com valor faria a cobertura parecer completa — quem olhasse
 * "educação" numa cidade não saberia se o programa não existe ali ou se o dado
 * não foi publicado.
 *
 * E "vazio" não é uma coisa só. Medido sobre o arquivo inteiro, não sobre
 * amostra (`municipiosComCategoriaZerada`, em `arquivo.ts`):
 *
 * | categoria                 | itens/cidade | cidades zeradas |
 * |---------------------------|-------------:|----------------:|
 * | governo-digital           |            7 |     **853/853** |
 * | meio-ambiente             |            5 |         727/853 |
 * | infraestrutura            |            2 |         727/853 |
 * | minha-casa-minha-vida     |            8 |         163/853 |
 * | renegociacao-dividas      |            6 |          81/853 |
 * | agricultura               |            8 |          17/853 |
 * | desenvolvimento-produtivo |           20 |           7/853 |
 * | cultura                   |            4 |           1/853 |
 * | mulheres                  |           44 |    zero de 853! |
 *
 * A primeira linha é afirmação sobre o PORTAL FEDERAL: `governo-digital` não
 * tem valor em município nenhum de Minas. Dizer isso como se fosse lacuna da
 * cidade acusaria 853 prefeituras de algo que é do governo federal. A última
 * linha é o espelho: `mulheres` tem 26.952 itens vazios em MG e ainda assim
 * não zera em cidade nenhuma — contar item vazio sem contar cidade zerada
 * inventaria uma lacuna que não existe.
 *
 * ⚠️ **Divergência com a amostra de 5 municípios do docs, e por que o número
 * daqui é o que vale.** `docs/COMUNICABR-COLETA-MG.md` registra `mulheres`,
 * `desenvolvimento-produtivo`, `minha-casa-minha-vida` e `governo-digital`
 * como "zeradas em TODOS os municípios testados". Aquela medição foi feita
 * contra a API ao vivo em 5 cidades e no PRIMEIRO nível de `items[]`; o
 * arquivo desce também os `sub_items[]` (a armadilha 3 de `indicadores.ts`), e
 * lá `mulheres` tem valor nas 853. Das quatro, só `governo-digital` se
 * confirma como lacuna da fonte na UF inteira. Esta tela usa a contagem do
 * arquivo — 853 municípios, não 5 — porque medir a lacuna por amostra foi
 * justamente o erro que o §N4 do plano registra ter cometido duas vezes.
 *
 * ═══ ENTREGA: SERVIDOR, NUNCA PROPS DE CLIENTE ═══
 *
 * `docs/HANDOFF-PAYLOAD-LEGISLACAO.md` mede o estrago: `/ambiental/legislacao`
 * passou 15.318 normas (4,7 MiB de texto) como props de componente de cliente
 * e gerou um `.cache` de **35,5 MiB** — 7,5× de inflação, porque o payload vai
 * embutido duas vezes (HTML e RSC flight) e cada linha repete o nome de todos
 * os campos. O teto da Cloudflare é 25 MiB por asset, e o deploy do portal
 * está travado nisso.
 *
 * Aqui são 174.012 itens: o mesmo desenho travaria o deploy numa escala pior.
 * Daí a regra deste módulo e das telas que o consomem: **o acervo inteiro só é
 * lido no servidor**; a página de uma cidade renderiza só os 204 itens dela, e
 * o único dado que chega ao cliente é a lista de cidades para o filtro de
 * busca — em array de arrays, sem nome de campo repetido 853 vezes.
 */

/** O arquivo é por UF; MG (31) é a única coletada até 15/08/2026. */
const ARQUIVO = "comunicabr-31.json";

export interface MetaComunicaBR {
  uf: number;
  geradoEm: string;
  fonte: string;
  /** Ressalva de origem gravada pelo coletor — viaja junto do dado. */
  ressalva: string;
  duracaoS: number;
}

interface Acervo {
  meta: MetaComunicaBR;
  municipios: MunicipioComunicaBR[];
  cobertura: CoberturaUF;
  porCodigo: Map<string, MunicipioComunicaBR>;
}

/** `undefined` = ainda não tentei ler; `null` = tentei e não há arquivo. */
let cache: Acervo | null | undefined;

function acervo(): Acervo | null {
  if (cache !== undefined) return cache;
  try {
    const bruto = JSON.parse(
      readFileSync(path.join(process.cwd(), "data", ARQUIVO), "utf-8")
    ) as ArquivoComunicaBR;
    const municipios = expandirArquivo(bruto);
    cache = {
      meta: {
        uf: bruto.uf,
        geradoEm: bruto.gerado_em,
        fonte: bruto.fonte,
        ressalva: bruto.ressalva,
        duracaoS: bruto.duracao_s,
      },
      municipios,
      cobertura: medirCoberturaUF(
        municipios,
        bruto.municipios.length + bruto.recusados.length,
        bruto.recusados.length
      ),
      porCodigo: new Map(municipios.map((m) => [String(m.codigoIbge), m])),
    };
  } catch {
    // Arquivo ausente não derruba o build — mesma decisão de `lib/clima/risco.ts`:
    // um clone antes da primeira coleta não pode impedir a publicação do portal
    // inteiro por causa de uma seção. As telas devolvem `notFound()`/estado vazio.
    cache = null;
  }
  return cache;
}

export function metaComunicaBR(): MetaComunicaBR | null {
  return acervo()?.meta ?? null;
}

export function coberturaComunicaBR(): CoberturaUF | null {
  return acervo()?.cobertura ?? null;
}

export function municipioComunicaBR(codigo: string): MunicipioComunicaBR | null {
  return acervo()?.porCodigo.get(codigo) ?? null;
}

/**
 * Lista enxuta para o índice e para o `generateStaticParams` — nome, código e
 * as duas contagens que a tela mostra ao lado de cada cidade.
 *
 * `nomeIbge` vem como "Betim/MG"; o sufixo sai daqui porque a página inteira
 * já é de Minas e repeti-lo 853 vezes é ruído (e bytes no payload do filtro).
 */
export interface ResumoMunicipio {
  codigo: string;
  nome: string;
  itens: number;
  comValor: number;
}

export function resumoDosMunicipios(): ResumoMunicipio[] {
  return (acervo()?.municipios ?? [])
    .map((m) => ({
      codigo: String(m.codigoIbge),
      nome: m.nomeIbge.replace(/\/[A-Z]{2}$/, ""),
      itens: m.cobertura.itens,
      comValor: m.cobertura.itensComValor,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
}

/**
 * Acima disto, a lacuna é lida como da FONTE e não da cidade.
 *
 * Não é limiar de gosto: se mais da metade dos municípios de um estado inteiro
 * vem zerada na mesma categoria, o que a ausência descreve é a publicação
 * federal, não a atuação de cada prefeitura. Abaixo dele a tela continua
 * dizendo o número de cidades zeradas — quem lê julga —, mas não afirma que a
 * lacuna é do governo federal.
 */
const LIMIAR_LACUNA_DA_FONTE = 0.5;

export type EspecieDeLacuna =
  /** A fonte publica o tema e não publica item NENHUM, em nenhuma cidade. */
  | "sem-item"
  /** Tem item, e nenhuma cidade da UF tem valor. Lacuna da fonte, sem ressalva. */
  | "fonte-em-toda-uf"
  /** Zerada na maioria das cidades — ainda é mais sobre a fonte que sobre a cidade. */
  | "fonte-na-maioria"
  /** Zerada em poucas cidades: aqui a ausência é específica desta cidade. */
  | "poucas-cidades";

export interface LacunaDeCategoria {
  categoria: string;
  especie: EspecieDeLacuna;
  /** Em quantas cidades a categoria veio com item e nenhum valor. */
  cidadesZeradas: number;
  /** Total de cidades com resposta (853 em MG). */
  cidades: number;
  itens: number;
  itensVazios: number;
}

function especie(cidadesZeradas: number, cidades: number, itens: number): EspecieDeLacuna {
  if (itens === 0) return "sem-item";
  if (cidades > 0 && cidadesZeradas === cidades) return "fonte-em-toda-uf";
  if (cidades > 0 && cidadesZeradas / cidades >= LIMIAR_LACUNA_DA_FONTE) return "fonte-na-maioria";
  return "poucas-cidades";
}

/**
 * Uma linha por categoria da fonte, com a lacuna classificada. Ordenada da
 * lacuna mais estrutural para a mais local — é a ordem em que a tela precisa
 * explicar, porque a primeira frase que o leitor lê é a que ele leva.
 */
export function lacunasDaUF(): LacunaDeCategoria[] {
  const c = coberturaComunicaBR();
  if (!c) return [];
  const cidades = c.municipiosComResposta;
  const ordem: Record<EspecieDeLacuna, number> = {
    "sem-item": 0,
    "fonte-em-toda-uf": 1,
    "fonte-na-maioria": 2,
    "poucas-cidades": 3,
  };
  return Object.keys(c.itensPorCategoria)
    .map((categoria): LacunaDeCategoria => {
      const itens = c.itensPorCategoria[categoria] ?? 0;
      const cidadesZeradas = c.municipiosComCategoriaZerada[categoria] ?? 0;
      return {
        categoria,
        especie: especie(cidadesZeradas, cidades, itens),
        cidadesZeradas,
        cidades,
        itens,
        itensVazios: c.vaziosPorCategoria[categoria] ?? 0,
      };
    })
    .sort(
      (a, b) =>
        ordem[a.especie] - ordem[b.especie] ||
        b.cidadesZeradas - a.cidadesZeradas ||
        b.itensVazios - a.itensVazios
    );
}

/** A classificação de UMA categoria, para a ficha da cidade consultar. */
export function lacunaDaCategoria(categoria: string): LacunaDeCategoria | null {
  return lacunasDaUF().find((l) => l.categoria === categoria) ?? null;
}

/**
 * ═══ O ZERO TAMBÉM VAZA PELO GRÁFICO, E ESTA É A TRAVA DO OUTRO LADO ═══
 *
 * `parDeValor()` anula o `valorBruto: 0` do ITEM, mas a série histórica não
 * passa por ele — e traz o mesmo preenchimento. Medido no acervo de Minas em
 * 15/08/2026: **75.293 dos 155.246 pontos de série valem zero** (48%), e
 * **16.603 das 39.238 séries são zero em todos os pontos**.
 *
 * Que aquilo é preenchimento, e não medida, está no caso que aparece nas 853
 * cidades: em "Transferências aos entes federados", o item *Estados* vem com
 * `valor: null` (não publicado) e o gráfico da mesma linha vem
 * `2023: 0 · 2024: 0 · 2025: 0 · 2026: 0`. Os dois dizem a mesma coisa — a
 * fonte não publicou o repasse a Estados — e só um deles dizia com um número.
 * Imprimir aquela série seria o portal afirmando "R$ 0,00 repassado" quatro
 * anos seguidos, em 853 cidades, que é o erro que a página inteira existe para
 * não cometer.
 *
 * Conferi se a própria API distingue: cada gráfico traz `permitirZero`, e o
 * campo é **`true` em todos os 46 gráficos de Betim** — constante, não informa
 * nada. Sem sinal da fonte, vale a regra que a fonte pratica na tela dela: ela
 * nunca exibe um zero. Aqui, então, ponto zero vira travessão e série zerada
 * inteira não é desenhada — a página diz que a série veio sem número, em vez de
 * desenhar uma linha de zeros com cara de medição.
 *
 * ⚠️ Para o coletor, quando alguém voltar a esta fonte: guardar o
 * `permitirZero` e o estado bruto do ponto permitiria distinguir zero medido de
 * zero de preenchimento **se** algum dia a API variar o campo. Hoje não varia.
 */
export function serieTemNumero(serie: SerieComunicaBR): boolean {
  return serie.pontos.some((p) => p.valor !== 0);
}

/**
 * Título humano da categoria. A fonte manda a chave sem acento
 * ("educacao", "minha-casa-minha-vida"), e imprimir a chave crua na tela
 * publicaria vocabulário de API para o leitor.
 *
 * Chave que não estiver aqui cai no fallback (hífen vira espaço, primeira
 * maiúscula) em vez de sumir: se o ComunicaBR criar uma categoria nova, ela
 * aparece com nome feio — nunca invisível.
 */
const TITULOS: Record<string, string> = {
  agricultura: "Agricultura",
  "balanca-comercial": "Balança comercial",
  cultura: "Cultura",
  "desenvolvimento-produtivo": "Desenvolvimento produtivo",
  educacao: "Educação",
  "governo-digital": "Governo digital",
  "igualdade-racial": "Igualdade racial",
  infraestrutura: "Infraestrutura",
  "meio-ambiente": "Meio ambiente",
  "minha-casa-minha-vida": "Minha Casa, Minha Vida",
  mulheres: "Mulheres",
  "protecao-social": "Proteção social",
  "renegociacao-dividas": "Renegociação de dívidas",
  saude: "Saúde",
  "seguranca-publica": "Segurança pública",
  "trabalho-e-renda": "Trabalho e renda",
  transferencias: "Transferências",
};

export function tituloDaCategoria(chave: string): string {
  const pronto = TITULOS[chave];
  if (pronto) return pronto;
  const cru = chave.replace(/-/g, " ");
  return cru.charAt(0).toUpperCase() + cru.slice(1);
}
