/**
 * Formato do arquivo em que a coleta do ComunicaBR é gravada
 * (`apps/web/data/comunicabr-<uf>.json`), e o codec que entra e sai dele.
 *
 * ═══ POR QUE O ARQUIVO NÃO É O OBJETO ACHATADO, DIRETO ═══
 *
 * Porque não caberia. Medido em 15/08/2026 com a resposta real de Betim,
 * serializar `MunicipioComunicaBR` como está dá **121.497 bytes por
 * município** — quase o tamanho do JSON bruto da API (124.792 bytes). Vezes
 * os 853 municípios de Minas: **99 MiB** num arquivo do repositório. O maior
 * arquivo de dados que o portal tem hoje é `risco-climatico.json`, com 2,9 MiB.
 *
 * ═══ A MEDIÇÃO QUE DEFINIU O FORMATO: A ESTRUTURA É NACIONAL ═══
 *
 * Sondei seis municípios de portes deliberadamente diferentes — Belo
 * Horizonte, Betim, Contagem, Araçuaí, Diamantina e Senhora de Oliveira. Os
 * seis vieram com **14 categorias com conteúdo, 66 subindicadores, 204 itens
 * e 32 séries**, com os MESMOS títulos na MESMA ordem: um único esqueleto
 * distinto entre os seis. O que varia entre eles é só quanto disso tem valor
 * — 117 em BH, 105 em Betim, 76 em Senhora de Oliveira.
 *
 * Ou seja: **o texto é nacional e o número é municipal.** Repetir "Equipes
 * eSF e eAP com custeio federal:" 853 vezes é pagar 853 vezes por uma
 * informação que não varia. Daí o formato:
 *
 * - `rotulos`  — dicionário único de strings; todo o resto são índices.
 * - `esqueletos` — a estrutura (categoria → subindicador → item → série),
 *   guardada uma vez e apontada por `municipio.esq`.
 * - `municipio.v` — **só os itens que têm valor**, esparsos, como
 *   `[posiçãoNoEsqueleto, valor, valorBruto]`.
 *
 * Item ausente da lista é item vazio — e é assim que a lacuna fica barata de
 * guardar sem deixar de ser contável: `expandirMunicipio` reconstitui os 204
 * itens, com `valor: null` onde a fonte não publicou. A tela continua podendo
 * dizer "89 dos 204 vieram vazios" com o mesmo objeto de sempre.
 *
 * ═══ A TRAVA QUE IMPEDE O DESALINHAMENTO ═══
 *
 * Formato posicional erra feio quando a estrutura muda: o valor da saúde vira
 * valor da educação, com aparência de dado bom. Por isso o esqueleto **não é
 * um só, é uma lista**. `impressaoDoEsqueleto()` gera a assinatura da
 * estrutura de cada município; assinatura nova vira esqueleto novo em vez de
 * ser encaixada à força na antiga. Se o ComunicaBR reorganizar um indicador
 * amanhã, o arquivo fica maior — nunca errado.
 *
 * `expandirMunicipio()` devolve exatamente o `MunicipioComunicaBR` que
 * `lerRespostaComunicaBR()` produziria, e o teste de ida-e-volta é o que
 * garante isso. Tela nenhuma precisa conhecer este formato.
 */
import {
  type CategoriaComunicaBR,
  type CoberturaComunicaBR,
  type DadoGeral,
  type ItemComunicaBR,
  type MunicipioComunicaBR,
  type SerieComunicaBR,
  type SubIndicadorComunicaBR,
  medirCobertura,
} from "./indicadores";

/** Índice no dicionário de rótulos. `-1` é o `null` deste formato. */
type Rotulo = number;

const NULO: Rotulo = -1;

/**
 * `[titulo, nivel, monetario, fonte, fonteHerdada, referencia]` — o que não
 * varia de município para município.
 *
 * A `fonte` do item entra aqui, e não só a do subindicador, porque **4 das 21
 * siglas de ministério de Betim só existem no nível do item** (MDIC, MEMP, MM
 * e MPS). Guardar procedência só no nível de cima apagaria essas quatro — e a
 * procedência declarada é justamente o que faz esta fonte valer.
 */
type ItemEsqueleto = [Rotulo, 1 | 2, 0 | 1, Rotulo, 0 | 1, Rotulo];

/** `[nome, monetario, anos[]]` — os rótulos do eixo; os valores são municipais. */
type SerieEsqueleto = [Rotulo, 0 | 1, Rotulo[]];

interface SubIndicadorEsqueleto {
  /** Título do subindicador. */
  t: Rotulo;
  /** Ministério declarado ("MS"). */
  f: Rotulo;
  /** Corte temporal declarado ("Dados até maio/2026"). */
  r: Rotulo;
  m: 0 | 1;
  i: ItemEsqueleto[];
  e: SerieEsqueleto[];
}

interface CategoriaEsqueleto {
  c: Rotulo;
  s: SubIndicadorEsqueleto[];
}

export interface Esqueleto {
  cat: CategoriaEsqueleto[];
}

/** `[posição no esqueleto, valor formatado pela fonte, valor bruto]`. */
type ValorEsparso = [number, string, number | null];

export interface MunicipioCompacto {
  /** Código IBGE de 6 dígitos — o que ESTA API usa. */
  cod: number;
  /** "Betim/MG", como a fonte escreve. */
  nome: string;
  /** Índice em `ArquivoComunicaBR.esqueletos`. */
  esq: number;
  /** Cadastro (`dados-gerais`): `[chave, titulo, valor, unidade]`. */
  g: [Rotulo, Rotulo, string | number | null, Rotulo][];
  /** Itens COM valor. Posição ausente = item vazio. */
  v: ValorEsparso[];
  /** Valores do próprio subindicador (4 dos 66 em Betim). */
  sv: ValorEsparso[];
  /**
   * Pontos das séries, na ordem do esqueleto: `sp[i][j]` é o valor do ano
   * `esqueleto.serie[i].anos[j]`. Comprimento conferido pelo esqueleto —
   * série de tamanho diferente gera esqueleto diferente, nunca truncamento.
   */
  sp: number[][];
}

/** Município que respondeu 200 e ainda assim não trouxe município. */
export interface RecusaComunicaBR {
  codigo: number;
  /** Nome vindo de `/api/v1/municipios/{uf}`, para o relatório saber quem é. */
  nome: string;
  motivo: string;
  detalhe: string;
}

export interface ArquivoComunicaBR {
  gerado_em: string;
  /** Código IBGE de 2 dígitos da UF (MG = 31). */
  uf: number;
  fonte: string;
  /** Ressalva de origem — viaja junto do dado, não fica só no docs. */
  ressalva: string;
  /** Segundos de relógio da coleta, medidos pelo coletor. */
  duracao_s: number;
  rotulos: string[];
  esqueletos: Esqueleto[];
  municipios: MunicipioCompacto[];
  recusados: RecusaComunicaBR[];
}

/** Acumula rótulos sem repetir. Um por arquivo, compartilhado pela UF toda. */
export class Dicionario {
  private readonly indice = new Map<string, number>();
  readonly rotulos: string[];

  constructor(rotulos: string[] = []) {
    this.rotulos = rotulos;
    for (const [i, r] of rotulos.entries()) this.indice.set(r, i);
  }

  pos(rotulo: string | null): Rotulo {
    if (rotulo === null) return NULO;
    const achado = this.indice.get(rotulo);
    if (achado !== undefined) return achado;
    const novo = this.rotulos.length;
    this.rotulos.push(rotulo);
    this.indice.set(rotulo, novo);
    return novo;
  }
}

function rotuloDe(rotulos: string[], i: Rotulo): string | null {
  return i === NULO ? null : (rotulos[i] ?? null);
}

/**
 * Assinatura da ESTRUTURA de um município — tudo que o esqueleto guarda, e
 * nada do que é municipal.
 *
 * É o que separa "mesmo formulário, outras respostas" de "outro formulário".
 * Inclui os anos das séries de propósito: um município a que falte 2023 tem
 * série de tamanho diferente, e encaixá-la na posição alheia poria o valor de
 * um ano no rótulo de outro.
 */
export function impressaoDoEsqueleto(m: MunicipioComunicaBR): string {
  const partes: string[] = [];
  for (const c of m.categorias) {
    partes.push(`C:${c.categoria}`);
    for (const s of c.subindicadores) {
      partes.push(`S:${s.titulo}|${s.fonte ?? ""}|${s.referencia ?? ""}|${s.monetario ? 1 : 0}`);
      for (const i of s.itens) {
        partes.push(`I:${i.titulo}|${i.nivel}|${i.monetario ? 1 : 0}|${i.fonte ?? ""}|${i.fonteHerdada ? 1 : 0}|${i.referencia ?? ""}`);
      }
      for (const e of s.series) partes.push(`E:${e.nome}|${e.monetario ? 1 : 0}|${e.pontos.map((p) => p.ano).join(",")}`);
    }
  }
  return partes.join("\n");
}

export function montarEsqueleto(m: MunicipioComunicaBR, dic: Dicionario): Esqueleto {
  return {
    cat: m.categorias.map((c) => ({
      c: dic.pos(c.categoria),
      s: c.subindicadores.map((s) => ({
        t: dic.pos(s.titulo),
        f: dic.pos(s.fonte),
        r: dic.pos(s.referencia),
        m: s.monetario ? 1 : 0,
        i: s.itens.map((i): ItemEsqueleto => [
          dic.pos(i.titulo),
          i.nivel,
          i.monetario ? 1 : 0,
          dic.pos(i.fonte),
          i.fonteHerdada ? 1 : 0,
          dic.pos(i.referencia),
        ]),
        e: s.series.map((e): SerieEsqueleto => [dic.pos(e.nome), e.monetario ? 1 : 0, e.pontos.map((p) => dic.pos(p.ano))]),
      })),
    })),
  };
}

/**
 * Compacta contra um esqueleto **já montado a partir deste mesmo município**
 * (mesma impressão). Guarda só o que é municipal: valores, séries e cadastro.
 */
export function compactarMunicipio(m: MunicipioComunicaBR, indiceEsqueleto: number, dic: Dicionario): MunicipioCompacto {
  const v: ValorEsparso[] = [];
  const sv: ValorEsparso[] = [];
  const sp: number[][] = [];
  let posItem = 0;
  let posSub = 0;

  for (const c of m.categorias) {
    for (const s of c.subindicadores) {
      if (s.valor !== null) sv.push([posSub, s.valor, s.valorBruto]);
      posSub++;
      for (const i of s.itens) {
        if (i.valor !== null) v.push([posItem, i.valor, i.valorBruto]);
        posItem++;
      }
      for (const e of s.series) sp.push(e.pontos.map((p) => p.valor));
    }
  }

  return {
    cod: m.codigoIbge,
    nome: m.nomeIbge,
    esq: indiceEsqueleto,
    g: m.dadosGerais.map((d) => [dic.pos(d.chave), dic.pos(d.titulo), d.valor, dic.pos(d.unidade)]),
    v,
    sv,
    sp,
  };
}

export function expandirMunicipio(m: MunicipioCompacto, esqueleto: Esqueleto, rotulos: string[]): MunicipioComunicaBR {
  const valorDeItem = new Map(m.v.map(([p, valor, bruto]) => [p, { valor, bruto }]));
  const valorDeSub = new Map(m.sv.map(([p, valor, bruto]) => [p, { valor, bruto }]));
  let posItem = 0;
  let posSub = 0;
  let posSerie = 0;

  const categorias: CategoriaComunicaBR[] = esqueleto.cat.map((c) => {
    const categoria = rotuloDe(rotulos, c.c) ?? "";
    const itensDaCategoria: ItemComunicaBR[] = [];

    const subindicadores: SubIndicadorComunicaBR[] = c.s.map((s) => {
      const subindicador = rotuloDe(rotulos, s.t) ?? "";
      const fonteDoSub = rotuloDe(rotulos, s.f);
      const referenciaDoSub = rotuloDe(rotulos, s.r);
      const doSub = valorDeSub.get(posSub);
      posSub++;

      const itens: ItemComunicaBR[] = s.i.map(([titulo, nivel, mon, fonte, herdada, ref]) => {
        const achado = valorDeItem.get(posItem);
        posItem++;
        return {
          categoria,
          subindicador,
          titulo: rotuloDe(rotulos, titulo) ?? "",
          valor: achado?.valor ?? null,
          valorBruto: achado?.bruto ?? null,
          monetario: mon === 1,
          fonte: rotuloDe(rotulos, fonte),
          fonteHerdada: herdada === 1,
          referencia: rotuloDe(rotulos, ref),
          nivel,
        };
      });
      itensDaCategoria.push(...itens);

      const series: SerieComunicaBR[] = s.e.map(([nome, mon, anos]) => {
        const valores = m.sp[posSerie] ?? [];
        posSerie++;
        return {
          nome: rotuloDe(rotulos, nome) ?? "",
          monetario: mon === 1,
          pontos: anos.map((ano, j) => ({ ano: rotuloDe(rotulos, ano) ?? "", valor: valores[j] ?? 0 })),
        };
      });

      return {
        titulo: subindicador,
        valor: doSub?.valor ?? null,
        valorBruto: doSub?.bruto ?? null,
        monetario: s.m === 1,
        fonte: fonteDoSub,
        referencia: referenciaDoSub,
        series,
        itens,
      };
    });

    return {
      categoria,
      subindicadores,
      itens: itensDaCategoria,
      itensVazios: itensDaCategoria.filter((i) => i.valor === null).length,
    };
  });

  return {
    codigoIbge: m.cod,
    nomeIbge: m.nome,
    dadosGerais: m.g.map(
      ([chave, titulo, valor, unidade]): DadoGeral => ({
        chave: rotuloDe(rotulos, chave) ?? "",
        titulo: rotuloDe(rotulos, titulo) ?? "",
        valor,
        unidade: rotuloDe(rotulos, unidade),
      })
    ),
    categorias,
    cobertura: medirCobertura(categorias),
  };
}

/** Expande o arquivo inteiro. É por aqui que qualquer tela deve entrar. */
export function expandirArquivo(arq: ArquivoComunicaBR): MunicipioComunicaBR[] {
  return arq.municipios.flatMap((m) => {
    const esq = arq.esqueletos[m.esq];
    return esq === undefined ? [] : [expandirMunicipio(m, esq, arq.rotulos)];
  });
}

/**
 * Cobertura da UF inteira, somada a partir dos municípios.
 *
 * `municipiosSemNenhumValor` é a contagem que a tela precisa mais do que a
 * soma: município que respondeu e não trouxe um valor sequer é resposta, não
 * ausência — e some se só o total for publicado.
 */
export interface CoberturaUF {
  municipiosPedidos: number;
  municipiosComResposta: number;
  municipiosRecusados: number;
  municipiosSemNenhumValor: number;
  itens: number;
  itensComValor: number;
  itensVazios: number;
  /** Chave da categoria -> quantos itens vieram vazios na UF inteira. */
  vaziosPorCategoria: Record<string, number>;
  itensPorCategoria: Record<string, number>;
  fontes: string[];
}

export function medirCoberturaUF(
  municipios: MunicipioComunicaBR[],
  pedidos: number,
  recusados: number
): CoberturaUF {
  const vaziosPorCategoria: Record<string, number> = {};
  const itensPorCategoria: Record<string, number> = {};
  const fontes = new Set<string>();
  let itens = 0;
  let comValor = 0;
  let semNenhumValor = 0;

  for (const m of municipios) {
    const c: CoberturaComunicaBR = m.cobertura;
    itens += c.itens;
    comValor += c.itensComValor;
    if (c.itensComValor === 0) semNenhumValor++;
    for (const f of c.fontes) fontes.add(f);
    for (const cat of m.categorias) {
      itensPorCategoria[cat.categoria] = (itensPorCategoria[cat.categoria] ?? 0) + cat.itens.length;
      vaziosPorCategoria[cat.categoria] = (vaziosPorCategoria[cat.categoria] ?? 0) + cat.itensVazios;
    }
  }

  return {
    municipiosPedidos: pedidos,
    municipiosComResposta: municipios.length,
    municipiosRecusados: recusados,
    municipiosSemNenhumValor: semNenhumValor,
    itens,
    itensComValor: comValor,
    itensVazios: itens - comValor,
    vaziosPorCategoria,
    itensPorCategoria,
    fontes: [...fontes].sort((a, b) => a.localeCompare(b, "pt")),
  };
}
