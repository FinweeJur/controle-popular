/**
 * Conversao e formatacao de unidades do portal civico.
 *
 * ═══ O QUE É ═══
 *
 * Camada unica de conversao entre unidades (tempo, comprimento, moeda,
 * energia, massa, volume, area, escala). Existe porque cada pagina formatava
 * no proprio componente: `Intl.NumberFormat` solto, `valor / 1e6` na maos.
 * Numero errado é dano (AGENTS.md §1) — conversao espalhada multiplica
 * a chance de erro.
 *
 * Fonte: `docs/planos/PLANO-CI-RAG-INGESTAO-UNIDADES.md`, Pilar 2.
 *
 * ═══ DECISÕES TÉCNICAS ═══
 *
 * - Tabela declarativa `FATORES` (dados, nao logica imperativa): adicionar
 *   unidade é acrescentar linha, nao escrever `if`. Auditoria olha os fatores.
 * - Zero dependencia nova: stdlib `Intl.NumberFormat` para formatacao.
 * - Busca transitiva limitada a 1 nivel (de → intermediario → para) —
 *   cobre a tabela real sem grafo completo (YAGNI).
 * - Moeda usa cambio fixo de referencia (Pilar 2b troca por PTAX do dia).
 */

const FATORES: Record<string, Record<string, Record<string, number>>> = {
  tempo: {
    segundo: { minuto: 1 / 60, hora: 1 / 3600, dia: 1 / 86400, semana: 1 / 604800, mes: 1 / 2592000, ano: 1 / 31536000, decada: 1 / 315360000 },
    minuto: { segundo: 60, hora: 1 / 60, dia: 1 / 1440, ano: 1 / 525600 },
    hora: { segundo: 3600, minuto: 60, dia: 1 / 24, ano: 1 / 8760 },
    dia: { segundo: 86400, minuto: 1440, hora: 24, semana: 1 / 7, mes: 1 / 30, ano: 1 / 365, decada: 1 / 3650 },
    semana: { dia: 7, hora: 168, ano: 1 / 52 },
    mes: { dia: 30, hora: 720, ano: 1 / 12 },
    ano: { dia: 365, semana: 52, mes: 12, decada: 1 / 10, seculo: 1 / 100 },
    decada: { ano: 10, dia: 3650 },
    seculo: { ano: 100, decada: 10 },
  },
  comprimento: {
    metro: { quilometro: 1 / 1000, centimetro: 100, milimetro: 1000, milha: 1 / 1609.34, pe: 1 / 0.3048, jarda: 1 / 0.9144 },
    quilometro: { metro: 1000, milha: 1 / 1.60934, pe: 3280.84 },
    milha: { quilometro: 1.60934, metro: 1609.34 },
    pe: { metro: 0.3048, centimetro: 30.48 },
    jarda: { metro: 0.9144 },
    quadra: { metro: 110, quilometro: 0.11 },
  },
  moeda: {
    // fatores estaticos (cambio fixo de referencia); atualizacao via API no Pilar 2b
    real: { dolar: 1 / 5.5, euro: 1 / 6.0, yuan: 1 / 0.76, libra: 1 / 7.0 },
    dolar: { real: 5.5, euro: 1 / 1.09, yuan: 7.24, libra: 1 / 1.27 },
    euro: { real: 6.0, dolar: 1.09 },
    yuan: { real: 0.76, dolar: 1 / 7.24 },
    libra: { real: 7.0, dolar: 1.27 },
  },
  energia: {
    watt: { quilowatt: 1 / 1000, megawatt: 1 / 1e6, gigawatt: 1 / 1e9, cavaloVapor: 1 / 745.7 },
    quilowatt: { watt: 1000, megawatt: 1 / 1000 },
    megawatt: { quilowatt: 1000, gigawatt: 1 / 1000 },
    gigawatt: { megawatt: 1000 },
    cavaloVapor: { watt: 745.7, quilowatt: 0.7457 },
  },
  massa: {
    quilograma: { tonelada: 1 / 1000, grama: 1000, libra: 2.20462 },
    tonelada: { quilograma: 1000, libra: 2204.62 },
    libra: { quilograma: 0.453592, grama: 453.592 },
  },
  volume: {
    litro: { metroCubico: 1 / 1000, mililitro: 1000, galao: 1 / 3.785 },
    metroCubico: { litro: 1000 },
    galao: { litro: 3.785 },
  },
  area: {
    metroQuadrado: { quilometroQuadrado: 1 / 1e6, hectare: 1 / 10000, alqueire: 1 / 24200 },
    hectare: { metroQuadrado: 10000, alqueire: 1 / 2.42 },
    alqueire: { hectare: 2.42, metroQuadrado: 24200 },
    quilometroQuadrado: { hectare: 100, metroQuadrado: 1e6 },
  },
  escala: {
    unidade: { mil: 1 / 1e3, milhao: 1 / 1e6, bilhao: 1 / 1e9, trilhao: 1 / 1e12 },
    mil: { unidade: 1e3, milhao: 1 / 1e3 },
    milhao: { unidade: 1e6, mil: 1e3, bilhao: 1 / 1e3 },
    bilhao: { unidade: 1e9, milhao: 1e3, trilhao: 1 / 1e3 },
    trilhao: { unidade: 1e12, bilhao: 1e3 },
  },
};

/** Tabela de um dominio: unidade origem → (unidade destino → fator). */
type Tabela = Record<string, Record<string, number>>;

/**
 * Fator direto de→para, ou `undefined` quando a tabela nao traz o par.
 * Funcao separada do `converter` porque o CodeScene mede complexidade
 * ciclomatica POR funcao (teto 9): com tudo num so corpo, `converter`
 * chegou a 11 (medido na CI de 15/10/2026). Quebrar em pecas com um
 * proposito cada e o proprio remedio indicado no Pilar 3 do plano.
 */
function fatorDireto(tabela: Tabela, de: string, para: string): number | undefined {
  return tabela[de]?.[para];
}

/**
 * Fator transitivo de 1 nivel: de → intermediario → para. Devolve o
 * primeiro caminho que fecha, no produto dos dois trechos.
 */
function fatorTransito(tabela: Tabela, de: string, para: string): number | undefined {
  for (const [intermediario, trecho] of Object.entries(tabela[de] ?? {})) {
    const fim = tabela[intermediario]?.[para];
    if (fim !== undefined) return trecho * fim;
  }
  return undefined;
}

/**
 * Converte valor entre unidades do mesmo dominio.
 *
 * Busca fator direto; se nao houver, tenta 1 nivel de transitividade
 * (de → intermediario → para). Lanca Error se nao houver caminho.
 */
export function converter(valor: number, de: string, para: string, dominio: string): number {
  if (de === para) return valor;
  const tabela = FATORES[dominio];
  const fator = tabela
    ? (fatorDireto(tabela, de, para) ?? fatorTransito(tabela, de, para))
    : undefined;
  if (fator === undefined) throw new Error(`Conversao ${dominio}:${de}→${para} nao encontrada`);
  return valor * fator;
}

const MOEDAS: Record<string, string> = {
  dolar: "USD",
  euro: "EUR",
  yuan: "CNY",
  libra: "GBP",
};

/**
 * Converte e formata em pt-BR com no maximo 2 casas decimais.
 * Dominio "moeda" usa estilo currency; a moeda sai da unidade destino
 * (dolar→USD, euro→EUR, yuan→CNY, libra→GBP, o resto BRL).
 */
export function formatar(valor: number, de: string, para: string, dominio: string): string {
  const n = converter(valor, de, para, dominio);
  const opcoes: Intl.NumberFormatOptions =
    dominio === "moeda"
      ? { style: "currency", currency: MOEDAS[para] ?? "BRL", maximumFractionDigits: 2 }
      : { maximumFractionDigits: 2 };
  return new Intl.NumberFormat("pt-BR", opcoes).format(n);
}
