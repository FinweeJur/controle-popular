/**
 * Tipos do acervo de memória das resistências — a base do bloco
 * "Já aconteceu aqui" do portal (ver `camadas.ts` e `guardas.ts`).
 *
 * Papel no portal: descrever, em um só lugar, o formato de um verbete de
 * memória (país, região, UF ou município) e a fonte que o sustenta. O
 * desenho vem do plano `docs/planos/PLANO-MEMORIA-RESISTENCIAS.md`, que
 * evolve a copy de `lib/memoria-cidades.ts` para as quatro camadas.
 *
 * Fonte oficial das regras de negócio: AGENTS.md §7 (regra editorial:
 * nada de insinuação, luto com registro próprio, lacuna é informação) e
 * §8 (as seis qualidades). A fonte de cada verbete é sempre pública, com
 * link direto — verbete sem fonte fechada não publica.
 *
 * Decisão técnica herdada do plano: o município se casa pelo CÓDIGO IBGE,
 * nunca pelo nome (a grafia diverge entre tabelas oficiais — armadilha já
 * paga no repositório). O slug da rota é só chave de renderização.
 */

/** Degraus da escada: do mais específico (município) ao mais amplo (país). */
export type NivelMemoria = "pais" | "regiao" | "uf" | "municipio";

/**
 * Vocabulário de luta do plano. Cada tipo é uma faceta de busca e um
 * rótulo por extenso (cor nunca é o único canal — §8).
 */
export type TipoLuta =
  | "revolta"
  | "resistencia"
  | "greve"
  | "quilombo"
  | "indigena"
  | "campo"
  | "direitos"
  | "anistia";

/** Avisos editoriais gravados no próprio verbete, por segurança. */
export type GuardaMemoria = "reverente" | "sem-humor" | "so-com-fonte";

/** Tom da copy (gramática do PLANO-COPY-VOZ). */
export type TomMemoria = "principio" | "coragem" | "alegria" | "luto";

/**
 * Fonte pública no formato ABNT simplificado, com botão "Fonte" (§8).
 * `url` é sempre o link direto e específico conferido na coleta; link
 * solto para home page genérica só quando não existe página canônica.
 */
export interface Fonte {
  /** Autor do documento ou instituição que assina, em ABNT. */
  autor: string;
  /** Título da obra, documento ou matéria. */
  titulo: string;
  /** Ano de publicação, em texto (ex.: "2014"). */
  ano: string;
  /** Link direto e conferido na coleta. */
  url: string;
  /** Instituição responsável pela publicação. */
  orgao: string;
}

/**
 * Um marco de memória. `resumo` é 1-2 frases em português direto; o
 * sujeito é quem lutou, nunca vítima decorativa (princípio do plano).
 */
export interface VerbeteMemoria {
  nivel: NivelMemoria;
  /** "br" | "sudeste" | "mg" | "3106200" (código IBGE de 7 dígitos). */
  chave: string;
  /** Título curto do marco (ex.: "Diretas Já"). */
  titulo: string;
  /** Período consolidado (ex.: "1983-1984"). */
  periodo: string;
  /** 1-2 frases; o modelo, se houver, só embrulha — o dado vem da fonte. */
  resumo: string;
  /** Ao menos um tipo de luta. */
  tipo: TipoLuta[];
  /** Lugar nomeado quando o fato é localizado. */
  lugar?: string;
  /** Uma ou mais fontes; a primeira é a mais local e mais oficial. */
  fonte: Fonte[];
  guarda?: GuardaMemoria;
  tom?: TomMemoria;
}

/** Resultado da escada: o verbete achado e o nível em que foi achado. */
export interface ResultadoMemoria {
  verbete: VerbeteMemoria;
  nivel: NivelMemoria;
}

/**
 * As quatro camadas já indexadas por chave. `ufPorMunicipio` e
 * `regiaoPorUf` são os degraus da escada: permitem subir de um código
 * IBGE para a UF e da UF para a macrorregião sem consultar o banco.
 */
export interface CamadasMemoria {
  pais: Record<string, VerbeteMemoria[]>;
  regiao: Record<string, VerbeteMemoria[]>;
  uf: Record<string, VerbeteMemoria[]>;
  municipio: Record<string, VerbeteMemoria[]>;
  /** Código IBGE (7 dígitos) → chave de UF em minúsculas. */
  ufPorMunicipio?: Record<string, string>;
  /** Chave de UF → chave de macrorregião. */
  regiaoPorUf?: Record<string, string>;
}

/**
 * Uma entrada do calendário de lutas (a base da "Mística do Dia" da home,
 * `app/components/MisticaDoDia.tsx`). Indexada por `diaMes` no formato
 * "MM-DD".
 *
 * DECISÃO TÉCNICA: a fonte entra por REFERÊNCIA (autor + órgão + url),
 * não como objeto completo repetido por entrada. São centenas de entradas
 * e a ficha ABNT completa repetida inflaria o módulo — e este módulo é
 * lido no cliente pela home. `referenciaAbnt()` em `mistica.ts` monta a
 * citação a partir destes campos.
 *
 * `resumo` e `lugar` são opcionais: a listagem do blog traz o fato e a
 * data, não o corpo do post — inventar contexto é proibido.
 */
export interface EntradaCalendario {
  /** Dia e mês no formato "MM-DD" (ex.: "05-01"). */
  diaMes: string;
  /** Ano do FATO, em texto; vazio = a fonte não datou (o fato não se perde). */
  ano: string;
  /** O fato em uma frase curta. */
  titulo: string;
  /**
   * Título CURTO (nome de acontecimento, ex.: "Revolta da Balaiada"),
   * proposto na revisão assistida e aplicado pela curadoria
   * (`lib/memoria/correcoes.ts`). A tela prefere este ao `titulo` longo;
   * ausente = usa o `titulo`.
   */
  tituloCurto?: string;
  /** Contexto adicional, quando a fonte traz. */
  resumo?: string;
  /** Ao menos um tipo de luta. */
  tipo: TipoLuta[];
  /** Lugar nomeado, quando a fonte diz. */
  lugar?: string;
  /** Autor que assina a fonte, em ABNT (ex.: "SEFERIAN, Gustavo"). */
  autor: string;
  /** Órgão/veículo da fonte (ex.: "Aos que virão — Calendário Insurgente"). */
  orgao: string;
  /**
   * Data da FONTE para a citação ABNT (ex.: "23 ago. 2020" no post;
   * "2009" no Calendário do MST) — dado do dev em 29/09/2026.
   */
  fonteData: string;
  /** Link direto e conferido; ausente quando a fonte é documento sem URL. */
  url?: string;
  /**
   * Citação CURTA no formato do dev `(Obra, Autor, Data)` — ex.:
   * "Calendário Histórico das Trabalhadoras/es, MST, 2009" e
   * "Calendário Insurgente, Blog Aos que Virão, 2020" (30/09/2026).
   * O autor aqui é a FONTE/obra, nunca a pessoa que assina. Quando
   * ausente, `fonteCurta()` em `mistica.ts` monta pelas outras pistas.
   */
  fonteCurta?: string;
  /**
   * `true` = o fato veio sem data no original e foi posto neste dia para
   * não deixá-lo vazio (regra do dev 29/09/2026). A tela avisa.
   */
  semData?: boolean;
}

/**
 * A copy legada do painel municipal (`app/[municipio]/page.tsx`): a
 * memória (marco local ou `null`) e a cultura viva da cidade. Mantida
 * por compatibilidade enquanto a camada município migra para verbete.
 */
export interface MemoriaCidade {
  /** Marco local com fonte fechada; `null` = o cartão só mostra cultura. */
  memoria: string | null;
  /** Cultura viva - o que continua acontecendo na cidade. */
  cultura: string;
}
