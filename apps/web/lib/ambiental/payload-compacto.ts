/**
 * Compactação do corpus de legislação ambiental para atravessar a fronteira
 * servidor → cliente.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * `/ambiental/legislacao` entrega o corpus inteiro como props de um componente
 * de cliente, e isso é serializado no payload da rota. Em 15/08/2026, ao
 * carregar as 8.940 normas federais numa tabela que tinha 6.378, o
 * `legislacao.cache` chegou a **35,5 MiB** — e o Cloudflare Workers recusa
 * asset acima de **25 MiB**. O `cf:deploy` morreu; o build tinha passado com
 * exit 0 e 3.872 páginas, porque o build não sabe nada sobre isto.
 *
 * O diagnóstico está em `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`, e o número que
 * decidiu o conserto é este: as ementas somam ~4,7 MiB de texto e geravam
 * 35,5 MiB de cache. **Não era volume de dado, era custo de entrega.**
 *
 * ═══ O QUE ESTE MÓDULO FAZ, E POR QUE CADA COISA ═══
 *
 * 1. **Tupla em vez de objeto.** Um array de 15.318 objetos repete os 13 nomes
 *    de campo 15.318 vezes — ~1,9 MiB só de chave. A tupla não repete nada; a
 *    ordem é o contrato, fixado em `ORDEM` e coberto por teste.
 *
 * 2. **Dicionário para vocabulário fechado.** `situacao` tem 11 valores
 *    distintos e um deles é `"NÃO CONSTA REVOGAÇÃO EXPRESSA"`, escrito por
 *    extenso em 3.816 linhas. `tipo` tem 53, `orgao` 174, `fonte` 5. Guardar
 *    o índice em vez do texto troca dezenas de bytes por um.
 *
 * 3. **Prefixo de link em dicionário.** 4.077 links começam em
 *    `https://www.siam.mg.gov.br/` e 3.425 em `https://pesquisa.in.gov.br/`.
 *    O prefixo vira índice; sobra o resto do caminho.
 *
 * 4. **`chaveDedup` vira id de grupo.** Este é o único que muda de natureza, e
 *    de propósito. A tela nunca MOSTRA a chave: ela agrupa por
 *    `esfera||chaveDedup` para dizer "também consta em". Só a igualdade
 *    importa. Mandar um inteiro no lugar da string resolve — e evita o que
 *    seria a alternativa óbvia e errada: reconstruir a chave no cliente
 *    reimplementando `normalizar_tipo`/`normalizar_numero` de
 *    `etl/apis/_legislacao_ambiental.py` em TypeScript. Duas implementações da
 *    mesma normalização divergem no primeiro caso de borda, e a divergência
 *    apareceria como um "também consta em" que some sem ninguém entender.
 *
 *    Só recebem id os grupos com **mais de uma fonte** — grupo de um nunca
 *    produz dica na tela, então mandar id para ele seria pagar por nada.
 *
 * ═══ O QUE ESTE MÓDULO NÃO É ═══
 *
 * Não é a solução do problema, é o que cabe hoje. A resposta durável é servir
 * a busca do índice estático fatiado que o repo já tem
 * (`public/busca-indice/**`, `lib/busca/indice.ts`), e ela resolve junto o
 * `sp/educacao.cache`, que já estava em 21 MiB sem ninguém ter mexido nele.
 * Enquanto isso não vem, **este módulo é um teto móvel, não um conserto**: se
 * o corpus dobrar de novo, ele estoura igual.
 */
import type {
  FonteLegislacaoAmbiental,
  LegislacaoAmbientalRow,
} from "@/lib/db/queries/legislacao-ambiental";
import type { EsferaLegislacao } from "@/lib/ambiental/legislacao-unificada";

/** A ordem É o contrato entre `compactar` e `expandir`. Mexer aqui sem mexer
 *  no teste de ida-e-volta troca campo em silêncio — que é exatamente o modo
 *  de falha que a tupla introduz em troca dos bytes que ela economiza. */
const ORDEM = [
  "fonte", "esfera", "situacao", "tipo", "numero", "ano",
  "ementa", "data", "orgao", "linkPrefixo", "linkResto", "dedup",
  "temas", "tags",
] as const;

type Indice = number | null;
type LinhaCompacta = [
  Indice, Indice, Indice, Indice, string | null, number | null,
  string | null, string | null, Indice, Indice, string | null, Indice,
  number[], number[],
];

export type CorpusCompacto = {
  /** Dicionários dos campos de vocabulário fechado. */
  d: {
    fonte: string[];
    esfera: string[];
    situacao: string[];
    tipo: string[];
    orgao: string[];
    link: string[];
    tema: string[];
    tag: string[];
  };
  /** Uma tupla por norma, na ordem de `ORDEM`. */
  l: LinhaCompacta[];
  /** Quantas normas — para o consumidor conferir sem expandir tudo. */
  n: number;
};

const RE_PREFIXO_LINK = /^https?:\/\/[^/]+\//;

class Dicionario {
  private readonly indices = new Map<string, number>();
  readonly valores: string[] = [];

  indexar(v: string | null | undefined): Indice {
    if (v === null || v === undefined) return null;
    const achado = this.indices.get(v);
    if (achado !== undefined) return achado;
    const i = this.valores.length;
    this.valores.push(v);
    this.indices.set(v, i);
    return i;
  }
}

/** Roda no SERVIDOR, durante o build. */
export function compactar(linhas: LegislacaoAmbientalRow[]): CorpusCompacto {
  const fonte = new Dicionario();
  const esfera = new Dicionario();
  const situacao = new Dicionario();
  const tipo = new Dicionario();
  const orgao = new Dicionario();
  const link = new Dicionario();
  const tema = new Dicionario();
  const tag = new Dicionario();

  // Grupos de dedup: só interessa quem tem MAIS DE UMA fonte. A chave inclui
  // a esfera porque é assim que a tela agrupa — estadual e nacional nunca
  // devem se misturar, mesmo que a chave textual coincida.
  const porChave = new Map<string, Set<string>>();
  for (const l of linhas) {
    if (!l.chaveDedup) continue;
    const k = `${l.esfera}||${l.chaveDedup}`;
    const s = porChave.get(k) ?? new Set<string>();
    s.add(l.fonte);
    porChave.set(k, s);
  }
  const idDoGrupo = new Map<string, number>();
  for (const [k, fontes] of porChave) {
    if (fontes.size > 1) idDoGrupo.set(k, idDoGrupo.size);
  }

  const l = linhas.map((r): LinhaCompacta => {
    const url = r.linkPdf ?? null;
    const m = url ? url.match(RE_PREFIXO_LINK) : null;
    const chave = r.chaveDedup ? `${r.esfera}||${r.chaveDedup}` : null;
    const grupo = chave !== null ? idDoGrupo.get(chave) : undefined;
    return [
      fonte.indexar(r.fonte),
      esfera.indexar(r.esfera),
      situacao.indexar(r.situacao),
      tipo.indexar(r.tipo),
      r.numero,
      r.ano,
      r.ementa,
      r.data,
      orgao.indexar(r.orgao),
      m ? link.indexar(m[0]) : null,
      m ? url!.slice(m[0].length) : url,
      grupo === undefined ? null : grupo,
      r.temas.map((t) => tema.indexar(t) as number),
      r.tags.map((t) => tag.indexar(t) as number),
    ];
  });

  return {
    d: {
      fonte: fonte.valores, esfera: esfera.valores, situacao: situacao.valores,
      tipo: tipo.valores, orgao: orgao.valores, link: link.valores,
      tema: tema.valores, tag: tag.valores,
    },
    l,
    n: linhas.length,
  };
}

/** Roda no CLIENTE. Devolve exatamente a forma que a tela já consumia — menos
 *  `chaveDedup`, que vira o id de grupo prefixado (`"g12"`). A tela concatena
 *  `esfera||chaveDedup` para agrupar, e o id já é único por esfera, então o
 *  agrupamento continua idêntico sem tocar no componente. */
export function expandir(c: CorpusCompacto): LegislacaoAmbientalRow[] {
  const texto = (dic: string[], i: Indice) => (i === null ? null : dic[i]);
  return c.l.map((t) => {
    const prefixo = texto(c.d.link, t[9]);
    const resto = t[10];
    const linkPdf = resto === null ? null : prefixo === null ? resto : prefixo + resto;
    return {
      fonte: c.d.fonte[t[0] as number] as FonteLegislacaoAmbiental,
      esfera: texto(c.d.esfera, t[1]) as EsferaLegislacao,
      situacao: texto(c.d.situacao, t[2]),
      tipo: texto(c.d.tipo, t[3]),
      numero: t[4],
      ano: t[5],
      ementa: t[6],
      data: t[7],
      orgao: texto(c.d.orgao, t[8]),
      linkPdf,
      chaveDedup: t[11] === null ? null : `g${t[11]}`,
      temas: t[12].map((i) => c.d.tema[i]),
      tags: t[13].map((i) => c.d.tag[i]),
    } as LegislacaoAmbientalRow;
  });
}

export const _ORDEM_PARA_TESTE = ORDEM;
