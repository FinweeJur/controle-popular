/**
 * ═══ SÉRIE ANUAL DA MINERAÇÃO EM MG — FASE 3 DO PLANO DE CAVAS ═══
 *
 * ═══ O QUE ESTE MÓDULO FAZ ═══
 *
 * É a parte pensante (e testada) da Fase 3: transforma a série anual de
 * primeira detecção de mineração em:
 *
 *  1. **Δ de área por ano** — quanto de área mapeada apareceu naquele ano;
 *  2. **estado da janela** — `ativa` / `estavel` / `encerrada` pelo critério
 *     de 24 meses escrito no plano;
 *  3. **os três estados editoriais** da cruzamento ANM;
 *  4. **cartões de topo** com agregados medidos (AGENTS § 8, regra 4).
 *
 * ═══ DE ONDE VÊM OS NÚMEROS ═══
 *
 * `apps/web/data/cavas-serie-mineracao-mg.json` — camada `pto:mining_age` do
 * Monitor da Mineração (MapBiomas), coletada em 29/09/2026 por
 * `scripts/etl/cavas/fase3-mineracao-mg.py`. Cada linha da fonte é **um
 * polígono** com o ano da primeira detecção e a área **em hectares**
 * (unidade conferida com shoelace projetado: razão 0,943). Resolução 30 m.
 *
 * ═══ DECISÕES NÃO TRIVIAIS ═══
 *
 * - **O ano de 1985 é o teto da série**, não um ano em que "tudo começou":
 *   ali cabe o que já existia antes. Ele entra na soma acumulada mas nunca
 *   como pico de crescimento.
 * - **`dentro_sigmine=false` significa "fora de todo polígono ANM"** — é o
 *   que sustenta a frase "sem cadastro ANM na área". Não é ausência de
 *   mineração, é ausência de cadastro (regra editorial § 7).
 * - **Estado só com série suficiente:** série vazia não vira `encerrada`,
 *   vira `sem_dado` — lacuna é informação (§ 7).
 */

/** Uma linha da série anual publicada no JSON de dados. */
export interface LinhaSerie {
  ano: number;
  /** polígonos cuja primeira detecção foi neste ano */
  qtd: number;
  /** hectares mapeados pela primeira vez neste ano */
  area: number;
  /** hectares destes que ficam fora de todo polígono ANM */
  area_fora_sigmine: number;
  qtd_fora: number;
  /** hectares acumulados do início da série até este ano */
  acumulado: number;
  /** hectares novos neste ano (Δ da série) */
  delta_area: number;
  /** crescimento percentual da área do ano sobre o anterior; null no 1º ano */
  delta_pct: number | null;
}

/** Os três estados editoriais da Fase 3. */
export type EstadoCava = "em_operacao" | "indicio_processual" | "sem_cadastro_anm";

/** O estado da janela: a mineração da área ainda se moveu? */
export type EstadoJanela = "ativa" | "estavel" | "encerrada" | "sem_dado";

/**
 * Fonte oficial para conferir um processo da ANM.
 *
 * Mesma URL de `lib/terras/alertas.ts` (`FONTE_ANM_PROCESSOS`), copiada de
 * propósito: este módulo é puro e vai para o bundle do cliente, enquanto
 * `alertas.ts` lê GeoJSON com `fs` — importar dali aqui quebraria o build.
 * Não existe parâmetro de URL que pré-preencha a busca (checado ao vivo em
 * 13/08): a página é um formulário e o campo se chama NUP.
 */
export const FONTE_ANM_PROCESSOS =
  "https://sistemas.anm.gov.br/SCM/Extra/site/admin/pesquisarProcessos.aspx";

/**
 * Uma cava da amostra datada de 120 (`cavas-estados-mg.json`).
 *
 * `bbox` é `[minLon, minLat, maxLon, maxLat]` com o buffer de 80 m do critério
 * do MapBiomas — é dele que sai o centro usado no link de localização.
 */
export interface ItemAmostra {
  id: number;
  ano_primeira_deteccao: string;
  area: string;
  dentro_sigmine: boolean;
  estado: EstadoCava;
  frase: string;
  fases: string[];
  processos: string[];
  bbox: number[] | null;
}

/** Centro do bbox de uma cava, em `[lon, lat]`, para link de localização. */
export function centroBBox(bbox: readonly number[] | null): [number, number] | null {
  if (!bbox || bbox.length < 4) return null;
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
}

/** Fases em que a ANM autoriza extração (mesma lista do coletor da Fase 1). */
export const FASES_EXTRATIVAS: readonly string[] = [
  "CONCESSÃO DE LAVRA",
  "LAVRA GARIMPEIRA",
  "REGISTRO DE EXTRAÇÃO",
  "PERMISSÃO DE LAVRA GARIMPEIRA",
];

/** Rótulo que vai na tela de cada estado — o "porquê", não só a sigla. */
export const FRASES_ESTADO: Record<EstadoCava, string> = {
  em_operacao:
    "dentro de polígono ANM em fase que autoriza extrair na data da coleta",
  indicio_processual:
    "dentro de polígono ANM sem autorização de extração — conferir na ANM",
  sem_cadastro_anm:
    "fora de todo polígono ANM — o mapa enxerga mineração onde a ANM não tem cadastro",
};

/**
 * Classifica uma cava nos três estados editoriais da Fase 3.
 *
 * @param dentroSigmine a fonte já resolve o teste espacial
 *   (`dentro_sigmine`), com o buffer de 80 m do critério do MapBiomas —
 *   não refaça a geometria no navegador.
 * @param fases fases dos processos ANM que se sobrepõem à cava
 * @returns estado + frase pronta para a ficha
 */
export function classificarEstadoCava(
  dentroSigmine: boolean,
  fases: readonly string[]
): { estado: EstadoCava; frase: string } {
  if (!dentroSigmine) {
    return { estado: "sem_cadastro_anm", frase: FRASES_ESTADO.sem_cadastro_anm };
  }
  const autoriza = fases.some((f) =>
    FASES_EXTRATIVAS.includes((f ?? "").trim().toUpperCase())
  );
  const estado: EstadoCava = autoriza ? "em_operacao" : "indicio_processual";
  return { estado, frase: FRASES_ESTADO[estado] };
}

/**
 * Estado da janela (24 meses) de uma série anual.
 *
 * Critério do plano: a última detecção dentro da janela → `ativa`; cresceu
 * em alguma parte da série mas parou há mais tempo → `estavel`; sem nenhum
 * ano com área nova → `encerrada`. Série vazia nunca vira `encerrada`.
 *
 * @param serie linhas ordenadas por ano
 * @param hoje data de referência (passe sempre a data real de publicação)
 * @param janelaMeses tamanho da janela de "ainda se moveu"
 */
export function estadoDaSerie(
  serie: readonly LinhaSerie[],
  hoje: Date,
  janelaMeses = 24
): { estado: EstadoJanela; ultimoAno: number | null; explicacao: string } {
  if (serie.length === 0) {
    return { estado: "sem_dado", ultimoAno: null, explicacao: "sem série coletada" };
  }
  const ultimo = serie[serie.length - 1].ano;
  const limite = hoje.getFullYear() - Math.ceil(janelaMeses / 12);
  if (ultimo >= limite) {
    return {
      estado: "ativa",
      ultimoAno: ultimo,
      explicacao: `última detecção em ${ultimo}; janela de ${janelaMeses} meses termina em ${limite}`,
    };
  }
  const cresceu = serie.some((l) => l.delta_area > 0);
  return {
    estado: cresceu ? "estavel" : "encerrada",
    ultimoAno: ultimo,
    explicacao: `última detecção em ${ultimo}; janela de ${janelaMeses} meses termina em ${limite}`,
  };
}

/** Ano com mais área nova da série. O ano do teto (1985) nunca é pico. */
export function picoDeArea(serie: readonly LinhaSerie[]): number | null {
  const posTeto = serie.filter((l) => l.ano > Math.min(...serie.map((x) => x.ano)));
  if (posTeto.length === 0) return null;
  return posTeto.reduce((a, b) => (b.area > a.area ? b : a)).ano;
}

/**
 * Agregados dos cartões de topo (AGENTS § 8, regra 4): o número vem do dado,
 * medido e datado, nunca digitado à mão.
 */
export function cartoesTopo(serie: readonly LinhaSerie[]) {
  const poligonos = serie.reduce((s, l) => s + l.qtd, 0);
  const area = serie.reduce((s, l) => s + l.area, 0);
  const areaFora = serie.reduce((s, l) => s + l.area_fora_sigmine, 0);
  const ultimo = serie.length ? serie[serie.length - 1] : null;
  return {
    poligonos,
    /** hectares */
    area,
    /** hectares mapeados fora de todo polígono ANM */
    areaFora,
    qtdFora: serie.reduce((s, l) => s + l.qtd_fora, 0),
    /** série cobre `qtdAnos` anos, do `primeiroAno` ao `ultimoAno` */
    qtdAnos: serie.length,
    primeiroAno: serie.length ? serie[0].ano : null,
    ultimoAno: ultimo?.ano ?? null,
    /** hectares novos no último ano da série */
    ultimoDelta: ultimo?.delta_area ?? null,
    picoAno: picoDeArea(serie),
  };
}
