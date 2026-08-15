/**
 * ComunicaBR (`comunicabr.presidencia.gov.br`) — leitura da resposta de
 * `/api/v2/indicadores?codigo_ibge=…`, achatada em itens comparáveis.
 *
 * Este arquivo é **só parsing**: recebe o JSON já baixado, não faz rede. Quem
 * baixa é `scripts/coletar-comunicabr.mts`. A separação existe porque as três
 * armadilhas desta API são de INTERPRETAÇÃO, não de transporte — e erro de
 * interpretação só se prende com teste sobre resposta gravada.
 *
 * ═══ O QUE ESTA FONTE É, E O QUE ELA NÃO É ═══
 *
 * O ComunicaBR é **comunicação do governo federal sobre a própria atuação**.
 * Não é execução orçamentária auditada, e não substitui o Portal da
 * Transparência nem o SIAFI — o próprio portal remete a eles. O valor aqui é
 * ser um **índice de para onde olhar**, com uma vantagem rara: cada
 * subindicador declara o ministério de origem no campo `fonte` (medi **17
 * siglas distintas** nesse nível em Betim, e mais 4 que só aparecem no nível
 * do item — MDIC, MEMP, MM e MPS). Por isso `fonte` é campo obrigatório do
 * item achatado e a tela deve citá-lo: o número tem dono declarado, e quem
 * publica não precisa inventar procedência.
 *
 * ═══ AS TRÊS ARMADILHAS, TODAS MEDIDAS EM 15/08/2026 ═══
 *
 * As três se disfarçam de sucesso — respondem HTTP 200 —, e foi assim que uma
 * medição anterior concluiu que "o valor municipal não vem pela API".
 *
 * 1. **O código IBGE desta API tem 6 dígitos, não 7.** Betim é `310670`, não
 *    `3106200`. Com 7 dígitos a API responde **200 com 102,8 KB** — 17
 *    categorias, 66 subindicadores, 132 itens e **zero** com valor —, e o
 *    único sinal de que a consulta não achou município é `nome_ibge: null`
 *    em todas as categorias. Daí `lerRespostaComunicaBR` recusar por
 *    `nome_ibge`, e nunca por status. Ver `MOTIVOS_RECUSA.municipio_inexistente`.
 *
 * 2. **O valor temático não mora em `indicador.<chave>.descricao`.** Aquela
 *    forma — dicionário de chaves com `descricao` — existe **só** na categoria
 *    `dados-gerais` (população, eleitorado, gentílico: 13 campos, 10 com valor
 *    em Betim). Em todas as outras 17 categorias `indicador` é um objeto com
 *    `subIndicadores[]`, e o valor está em `subIndicadores[].items[].valor`.
 *    Generalizar a forma de `dados-gerais` para as demais foi o erro que
 *    contou zero onde havia 60 itens com valor.
 *
 * 3. **Há um TERCEIRO nível.** `items[].sub_items[]` traz mais 72 registros em
 *    Betim, **45 deles com valor** (ex.: Saúde → Equipes de Saúde → eSF/eAP →
 *    "Equipes eSF e eAP com custeio federal: 113"). Parar em `items[]` perde
 *    mais dado do que a soma das duas armadilhas anteriores. O achatamento
 *    desce os dois níveis e marca qual é qual em `nivel`.
 *
 *    **E ela produziu uma lacuna falsa no próprio plano.** `docs/PLANO-2026-08-15.md`
 *    registra que `mulheres` tem "20 itens e zero com valor" em Betim. É
 *    verdade no primeiro nível — e falso no município: os `sub_items` de
 *    `mulheres` são 24, com **18 valores**. O mesmo vale para
 *    `desenvolvimento-produtivo` (0 de 6 no nível 1, mas 12 de 14 abaixo) e
 *    `minha-casa-minha-vida` (0 de 3, e 1 de 5 abaixo). Contar lacuna sem
 *    descer inventa lacuna, que é o espelho do erro que inventou fartura.
 *    Vazias em Betim nos DOIS níveis, medido: `infraestrutura` (2 itens) e
 *    `governo-digital` (7).
 *
 * (A quarta, que é do coletor e não daqui: `&categoria=` e `&categorias=` são
 * aceitos e **ignorados** — com `&categoria=saude` voltam as 18 categorias.
 * O único filtro que filtra é `&tema=`, que devolve 2.)
 *
 * ═══ O GRÁFICO TEM TRÊS FORMAS, NÃO UMA ═══
 *
 * `subIndicadores[].grafico` medido em Betim: 22 objetos com `dados[]` (série
 * simples), 3 objetos com `series[].dados[]` (múltiplas linhas), 7 ARRAYS de
 * gráficos e 34 arrays vazios. Quem só lê `grafico.dados` acha 22 séries onde
 * há 32. `normalizarSeries` devolve sempre a mesma forma para as três.
 */

/** Sigla do ministério, como o próprio ComunicaBR a declara ("MS", "MEC"). */
export type FonteMinisterio = string;

/** Um ponto da série histórica, já normalizado das três formas de `grafico`. */
export interface PontoSerie {
  /** Rótulo do eixo como a fonte o escreve — quase sempre o ano ("2026"). */
  ano: string;
  valor: number;
}

export interface SerieComunicaBR {
  /** Nome da linha ("Médicos em atuação", "Municípios"). */
  nome: string;
  monetario: boolean;
  pontos: PontoSerie[];
}

/**
 * Um item achatado — a unidade que a tela exibe e que a cobertura conta.
 *
 * `valor` é a string **já formatada pela fonte** ("R$ 306,9 mi", "52");
 * `valorBruto` é o número. Guardo os dois porque a formatação monetária
 * abreviada da fonte é parte da mensagem dela, e refazê-la aqui inventaria
 * arredondamento que o governo não publicou.
 */
export interface ItemComunicaBR {
  categoria: string;
  /** Título do subindicador que contém o item ("Mais Médicos"). */
  subindicador: string;
  titulo: string;
  /** `null` = a fonte não publicou valor para este município. É dado, não erro. */
  valor: string | null;
  valorBruto: number | null;
  monetario: boolean;
  /** Ministério declarado. Herdado do subindicador quando o item não declara. */
  fonte: FonteMinisterio | null;
  /** `true` quando `fonte` veio do subindicador, não do próprio item. */
  fonteHerdada: boolean;
  /** Corte temporal declarado ("Dados até maio/2026"). */
  referencia: string | null;
  /** 1 = `items[]`; 2 = `items[].sub_items[]`. */
  nivel: 1 | 2;
}

export interface SubIndicadorComunicaBR {
  titulo: string;
  valor: string | null;
  valorBruto: number | null;
  monetario: boolean;
  fonte: FonteMinisterio | null;
  referencia: string | null;
  series: SerieComunicaBR[];
  itens: ItemComunicaBR[];
}

export interface CategoriaComunicaBR {
  /** Chave da fonte ("saude", "minha-casa-minha-vida"). */
  categoria: string;
  subindicadores: SubIndicadorComunicaBR[];
  itens: ItemComunicaBR[];
  /** Quantos dos `itens` vieram sem valor. Vai para a tela, não fica aqui. */
  itensVazios: number;
}

/** Campo de `dados-gerais` — a única categoria com valor em `descricao`. */
export interface DadoGeral {
  chave: string;
  titulo: string;
  valor: string | number | null;
  /** "numero" | "moeda" | "porcentagem" | "legenda", como a fonte declara. */
  unidade: string | null;
}

export interface MunicipioComunicaBR {
  /** 6 dígitos, como esta API os usa. */
  codigoIbge: number;
  /** "Betim/MG", como a fonte escreve. */
  nomeIbge: string;
  dadosGerais: DadoGeral[];
  categorias: CategoriaComunicaBR[];
  cobertura: CoberturaComunicaBR;
}

/**
 * Contagem do que veio e do que faltou.
 *
 * `itensVazios` existe para a tela poder dizer a verdade: publicar só o que
 * tem valor faria a cobertura parecer completa, e o silêncio da fonte sobre um
 * município é informação — some se não for contado. Em Betim são **99 itens
 * vazios de 204** (48%), e duas categorias inteiras sem um valor sequer nos
 * dois níveis: `infraestrutura` e `governo-digital`.
 */
export interface CoberturaComunicaBR {
  /**
   * Categorias TEMÁTICAS. Em Betim são 17 — o bloco `dados-gerais`, que é o
   * 18º da resposta, não entra: tem forma diferente e conteúdo de cadastro
   * (população, gentílico, prefeito), não de atuação do governo.
   */
  categorias: number;
  /** Categorias com pelo menos um subindicador. Em Betim: 14 de 17. */
  categoriasComConteudo: number;
  /**
   * Categorias com item e nenhum valor **em nenhum dos dois níveis**. Em
   * Betim: `infraestrutura` e `governo-digital`.
   */
  categoriasSemNenhumValor: string[];
  subindicadores: number;
  itens: number;
  itensComValor: number;
  itensVazios: number;
  /** Itens monetários COM valor — em Betim, 20 no primeiro nível. */
  itensMonetariosComValor: number;
  subindicadoresComSerie: number;
  /** Siglas de ministério distintas presentes na resposta, ordenadas. */
  fontes: FonteMinisterio[];
}

export const MOTIVOS_RECUSA = {
  /** O corpo não tem o envelope `data` com categorias. */
  resposta_ilegivel: "resposta_ilegivel",
  /**
   * `nome_ibge` nulo em toda a resposta. É o que a API devolve, com HTTP 200,
   * para código que ela não reconhece — inclusive o IBGE de 7 dígitos.
   */
  municipio_inexistente: "municipio_inexistente",
  /** `codigo_ibge` da resposta diferente do pedido. */
  codigo_divergente: "codigo_divergente",
} as const;

export type MotivoRecusa = (typeof MOTIVOS_RECUSA)[keyof typeof MOTIVOS_RECUSA];

export type LeituraComunicaBR =
  | { ok: true; municipio: MunicipioComunicaBR }
  | { ok: false; motivo: MotivoRecusa; detalhe: string };

/**
 * `true` só para código de 6 dígitos começando em UF válida (11–53).
 *
 * Guarda barata que evita a armadilha 1 antes da requisição: quem passar o
 * IBGE de 7 dígitos (`3106200`) é barrado aqui em vez de receber 102,8 KB de
 * esqueleto com cara de sucesso.
 */
export function ehCodigoIbgeComunicaBR(codigo: number): boolean {
  if (!Number.isInteger(codigo)) return false;
  if (codigo < 110000 || codigo > 539999) return false;
  return true;
}

function texto(v: unknown): string | null {
  if (typeof v === "string") return v.trim() === "" ? null : v;
  if (typeof v === "number") return String(v);
  return null;
}

function numero(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * `valorBruto` só vale quando existe `valor`. **Zero sem `valor` é o
 * preenchimento padrão da API, não uma medida de zero.**
 *
 * Medido nos 270 registros de Betim (66 subindicadores + 132 itens + 72
 * sub_items): 109 têm `valor` e `valorBruto` não-nulo; 61 não têm `valor` e
 * trazem `valorBruto: 0`; 100 não têm nem um nem outro. **Nenhum** registro
 * tem `valor` sem `valorBruto`. Ou seja, os 61 zeros acompanham exatamente os
 * casos em que a própria fonte se recusou a exibir número — "Estados: —" numa
 * transferência a município. Republicá-los como zero seria o portal afirmando
 * "R$ 0,00 repassado" onde o governo disse "não se aplica".
 */
function parDeValor(valor: unknown, bruto: unknown): { valor: string | null; valorBruto: number | null } {
  const v = texto(valor);
  return { valor: v, valorBruto: v === null ? null : numero(bruto) };
}

/**
 * Reduz as três formas de `grafico` a uma só.
 *
 * Forma A (`{tipo:"simples", nome, dados:[{descricao, valor}]}`) — 22 em Betim.
 * Forma B (`{tipo:"multiplo", series:[{nome, dados:[{ano, valor}]}]}`) — 3.
 * Forma C: **array** de A e/ou B — 7 com conteúdo e 34 vazios.
 *
 * O rótulo do eixo muda de nome entre A (`descricao`) e B (`ano`), e cai em
 * `anoOrdenacao` quando nenhum dos dois vem. Séries sem ponto nenhum não
 * entram: uma linha vazia num gráfico é ruído com aparência de dado.
 */
export function normalizarSeries(grafico: unknown): SerieComunicaBR[] {
  if (grafico == null) return [];
  if (Array.isArray(grafico)) return grafico.flatMap((g) => normalizarSeries(g));
  if (typeof grafico !== "object") return [];

  const g = grafico as Record<string, unknown>;
  const monetario = g.monetario === true;

  const pontosDe = (dados: unknown): PontoSerie[] => {
    if (!Array.isArray(dados)) return [];
    return dados.flatMap((p) => {
      const d = p as Record<string, unknown>;
      const valor = numero(d.valor);
      if (valor === null) return [];
      const ano = texto(d.ano) ?? texto(d.descricao) ?? texto(d.anoOrdenacao);
      if (ano === null) return [];
      return [{ ano, valor }];
    });
  };

  if (Array.isArray(g.series)) {
    return (g.series as unknown[]).flatMap((s) => {
      const serie = s as Record<string, unknown>;
      const pontos = pontosDe(serie.dados);
      if (pontos.length === 0) return [];
      return [{ nome: texto(serie.nome) ?? "", monetario: serie.monetario === true || monetario, pontos }];
    });
  }

  const pontos = pontosDe(g.dados);
  if (pontos.length === 0) return [];
  return [{ nome: texto(g.nome) ?? "", monetario, pontos }];
}

/** Achata `items[]` e, dentro deles, `sub_items[]` (a armadilha 3). */
function acharItens(
  categoria: string,
  subindicador: string,
  fonteDoSub: string | null,
  referenciaDoSub: string | null,
  items: unknown
): ItemComunicaBR[] {
  if (!Array.isArray(items)) return [];
  const saida: ItemComunicaBR[] = [];
  for (const bruto of items) {
    if (bruto == null || typeof bruto !== "object") continue;
    const it = bruto as Record<string, unknown>;
    const fontePropria = texto(it.fonte);
    saida.push({
      categoria,
      subindicador,
      titulo: texto(it.titulo) ?? "",
      ...parDeValor(it.valor, it.valorBruto),
      monetario: it.monetario === true,
      fonte: fontePropria ?? fonteDoSub,
      fonteHerdada: fontePropria === null && fonteDoSub !== null,
      referencia: texto(it.referencia) ?? referenciaDoSub,
      nivel: 1,
    });
    for (const subBruto of Array.isArray(it.sub_items) ? it.sub_items : []) {
      if (subBruto == null || typeof subBruto !== "object") continue;
      const si = subBruto as Record<string, unknown>;
      const fonteDoSubItem = texto(si.fonte);
      // Herança em cascata: o sub_item herda do item que o contém, e este do
      // subindicador. `fonteHerdada` é a mesma regra nos dois níveis — "este
      // registro não declarou a sua fonte" —, senão a tela precisaria de duas
      // leituras diferentes do mesmo campo.
      const fonte = fonteDoSubItem ?? fontePropria ?? fonteDoSub;
      saida.push({
        categoria,
        subindicador,
        titulo: texto(si.titulo) ?? "",
        ...parDeValor(si.valor, si.valorBruto),
        monetario: si.monetario === true,
        fonte,
        fonteHerdada: fonteDoSubItem === null && fonte !== null,
        referencia: texto(si.referencia) ?? referenciaDoSub,
        nivel: 2,
      });
    }
  }
  return saida;
}

/**
 * `dados-gerais` — a categoria de forma diferente, e a razão do erro 2.
 *
 * Aqui `indicador` é um dicionário `chave -> {titulo, descricao, unidade}` e
 * `descricao` guarda mesmo o valor (população 431.433, gentílico "betinense").
 * Em nenhuma outra categoria isso vale.
 */
function lerDadosGerais(indicador: unknown): DadoGeral[] {
  if (indicador == null || typeof indicador !== "object") return [];
  return Object.entries(indicador as Record<string, unknown>).flatMap(([chave, bruto]) => {
    if (bruto == null || typeof bruto !== "object") return [];
    const campo = bruto as Record<string, unknown>;
    const valor = campo.descricao;
    return [
      {
        chave,
        titulo: texto(campo.titulo) ?? chave,
        valor: typeof valor === "number" || typeof valor === "string" ? valor : null,
        unidade: texto(campo.unidade),
      },
    ];
  });
}

/**
 * Lê a resposta de `/api/v2/indicadores` e devolve o município achatado, ou a
 * recusa com motivo.
 *
 * **Nunca confie no status 200 desta API** — ela responde 200 para município
 * inexistente. A validação que vale é `nome_ibge`, e é a que roda aqui.
 * `codigoPedido` é opcional e, quando informado, ainda confere se a resposta
 * é do município que se pediu.
 */
export function lerRespostaComunicaBR(bruto: unknown, codigoPedido?: number): LeituraComunicaBR {
  if (bruto == null || typeof bruto !== "object") {
    return { ok: false, motivo: MOTIVOS_RECUSA.resposta_ilegivel, detalhe: "corpo nao e objeto" };
  }
  const envelope = (bruto as Record<string, unknown>).data;
  if (envelope == null || typeof envelope !== "object") {
    return { ok: false, motivo: MOTIVOS_RECUSA.resposta_ilegivel, detalhe: "sem envelope data" };
  }

  // `data` chega como objeto de chaves numéricas ("0".."17"), não como array.
  const blocos = Object.values(envelope as Record<string, unknown>).filter(
    (b): b is Record<string, unknown> => b != null && typeof b === "object"
  );
  if (blocos.length === 0) {
    return { ok: false, motivo: MOTIVOS_RECUSA.resposta_ilegivel, detalhe: "data sem categorias" };
  }

  const nomes = blocos.map((b) => texto(b.nome_ibge)).filter((n): n is string => n !== null);
  if (nomes.length === 0) {
    return {
      ok: false,
      motivo: MOTIVOS_RECUSA.municipio_inexistente,
      detalhe: `nome_ibge nulo nas ${blocos.length} categorias — a API responde 200 assim`,
    };
  }
  const nomeIbge = nomes[0];

  const codigos = blocos.map((b) => numero(b.codigo_ibge)).filter((c): c is number => c !== null);
  // O esqueleto usa `codigo_ibge` para numerar a categoria (2..18); só aceito
  // como código do município o que for código de município de verdade.
  const codigoIbge = codigos.find((c) => ehCodigoIbgeComunicaBR(c)) ?? codigoPedido ?? 0;
  if (codigoPedido !== undefined && codigoIbge !== codigoPedido) {
    return {
      ok: false,
      motivo: MOTIVOS_RECUSA.codigo_divergente,
      detalhe: `pedi ${codigoPedido}, veio ${codigoIbge}`,
    };
  }

  let dadosGerais: DadoGeral[] = [];
  const categorias: CategoriaComunicaBR[] = [];

  for (const bloco of blocos) {
    const categoria = texto(bloco.categoria) ?? "";
    const indicador = bloco.indicador;
    const subBrutos =
      indicador != null && typeof indicador === "object"
        ? (indicador as Record<string, unknown>).subIndicadores
        : undefined;

    if (!Array.isArray(subBrutos)) {
      // Sem `subIndicadores` só existe `dados-gerais`. Qualquer outra
      // categoria nessa forma é mudança de contrato, e some silenciosamente
      // se não for tratada — por isso o `else` não descarta, ignora só o que
      // já sei ser diferente.
      if (categoria === "dados-gerais") dadosGerais = lerDadosGerais(indicador);
      continue;
    }

    const subindicadores: SubIndicadorComunicaBR[] = [];
    const itensDaCategoria: ItemComunicaBR[] = [];

    for (const s of subBrutos) {
      if (s == null || typeof s !== "object") continue;
      const sub = s as Record<string, unknown>;
      const titulo = texto(sub.titulo) ?? "";
      const fonte = texto(sub.fonte);
      const referencia = texto(sub.referencia);
      const itens = acharItens(categoria, titulo, fonte, referencia, sub.items);
      itensDaCategoria.push(...itens);
      subindicadores.push({
        titulo,
        ...parDeValor(sub.valor, sub.valorBruto),
        monetario: sub.monetario === true,
        fonte,
        referencia,
        series: normalizarSeries(sub.grafico),
        itens,
      });
    }

    categorias.push({
      categoria,
      subindicadores,
      itens: itensDaCategoria,
      itensVazios: itensDaCategoria.filter((i) => i.valor === null).length,
    });
  }

  return {
    ok: true,
    municipio: {
      codigoIbge,
      nomeIbge,
      dadosGerais,
      categorias,
      cobertura: medirCobertura(categorias),
    },
  };
}

/** Conta o que veio e o que faltou. Número de tela sai daqui, nunca digitado. */
export function medirCobertura(categorias: CategoriaComunicaBR[]): CoberturaComunicaBR {
  const itens = categorias.flatMap((c) => c.itens);
  const comValor = itens.filter((i) => i.valor !== null);
  const fontes = new Set<string>();
  for (const c of categorias) {
    for (const s of c.subindicadores) if (s.fonte) fontes.add(s.fonte);
    for (const i of c.itens) if (i.fonte) fontes.add(i.fonte);
  }
  return {
    categorias: categorias.length,
    categoriasComConteudo: categorias.filter((c) => c.subindicadores.length > 0).length,
    categoriasSemNenhumValor: categorias
      .filter((c) => c.itens.length > 0 && c.itens.every((i) => i.valor === null))
      .map((c) => c.categoria),
    subindicadores: categorias.reduce((a, c) => a + c.subindicadores.length, 0),
    itens: itens.length,
    itensComValor: comValor.length,
    itensVazios: itens.length - comValor.length,
    itensMonetariosComValor: comValor.filter((i) => i.monetario).length,
    subindicadoresComSerie: categorias.reduce(
      (a, c) => a + c.subindicadores.filter((s) => s.series.length > 0).length,
      0
    ),
    fontes: [...fontes].sort((a, b) => a.localeCompare(b, "pt")),
  };
}

/**
 * Ressalva que TEM de acompanhar qualquer exibição destes números.
 *
 * Fica aqui, e não só no docs, porque texto que mora longe do dado é texto que
 * a próxima tela esquece de copiar.
 */
export const RESSALVA_COMUNICABR =
  "Números publicados pelo ComunicaBR, portal de comunicação do governo federal " +
  "sobre a própria atuação. Cada item cita o ministério que declarou o dado. " +
  "Não é execução orçamentária auditada: para isso, Portal da Transparência e SIAFI.";
