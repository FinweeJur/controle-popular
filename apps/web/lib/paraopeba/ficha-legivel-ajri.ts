import {
  AUTOR_AUDITORIA_AJRI,
  TEMA_AJRI_LABEL,
  type DocumentoAuditoriaAjri,
  type InstrumentoAjri,
  type TemaAjri,
  type TipoDocumentoAjri,
} from "./auditoria-ajri";

/**
 * A **ficha legível** de um documento da auditoria socioambiental (AJRI):
 * o que ele é, quando, sobre o quê e de onde vem — em linguagem comum, para
 * quem não é técnico.
 *
 * ═══ O QUE ESTE ARQUIVO É, E O QUE ELE NÃO É ═══
 *
 * É **tradução de metadado**, e só. Nenhuma frase daqui é uma leitura do
 * conteúdo do documento: os 467 PDFs continuam na fonte oficial, nenhum foi
 * baixado, e `descricao` — que é texto da própria AECOM — continua exibida
 * inteira, sem edição, ao lado da ficha. A ficha não substitui a descrição
 * original nem o link para a fonte.
 *
 * **Conclusões e recomendações do auditor não estão aqui, e não podem estar.**
 * Medido nas 467 descrições: `conclus` aparece em **0**, `recomenda` em **4**,
 * `não conformidade` em **1**, `apontamento` e `destaque crítico` em **0**. O
 * veredito do auditor está dentro do PDF, e chegar até ele é outra fase, com
 * outra ordem de operações obrigatória (baixar → extrair → varrer dado pessoal
 * → só então resumir) — ver `docs/PLANO-ESPELHO-PDF-AJRI.md` §6.
 *
 * ═══ POR QUE NENHUM MODELO DE LINGUAGEM ═══
 *
 * Pedido explícito do dono: o que der para extrair do metadado é melhor que
 * rodar modelo. E aqui dá: os 467 documentos têm `descricao` (0 vazias,
 * mediana de 346 caracteres), `codigo` de 8 segmentos em 467/467,
 * `instrumento`, `tipo`, `temas`, `data` e `disciplina`. Uma frase montada
 * destes campos é **determinística, testável e igual em toda releitura** — as
 * três coisas que um resumo de modelo não é, e que num portal de transparência
 * são o que separa informação de afirmação. É o mesmo princípio que o eixo
 * Congresso já aplica ("o LLM não decide o rótulo; a rubrica é determinística").
 *
 * ═══ O VOCABULÁRIO FOI LEVANTADO DO ACERVO, NÃO INVENTADO ═══
 *
 * Cada glosa abaixo tem, no comentário, a contagem de quantos dos documentos
 * daquele grupo trazem a expressão no próprio texto da AECOM. Onde a evidência
 * não bastou, não há glosa — é o caso das disciplinas `CB`, `CM` e `M2`
 * (1 documento cada, de 2019).
 *
 * ═══ POR QUE ISTO É SÓ DO ACERVO DA AUDITORIA ═══
 *
 * A pergunta "a mesma função não serve ao clipping e à biblioteca?" foi feita e
 * a resposta, medida nos arquivos, é **não** — e forçar um formato comum
 * estragaria os dois:
 *
 * · `clipping.ts`, `clipping-ati.ts` e `clipping-ij.ts` **já têm campo
 *   `resumo`**, escrito por quem monta o painel-fonte. Sobrepor uma frase
 *   montada por este portal a um resumo humano que já existe não acrescenta
 *   nada e confunde quem fala.
 * · `biblioteca.ts` não tem `instrumento`, e seus `tipo`/`temas` são **rótulo
 *   livre de cada fonte**, não taxonomia fechada — o Guaicuy sequer classifica
 *   por tema (`temas: []`). Não há vocabulário para traduzir. E a ausência de
 *   resumo ali é decisão travada em `biblioteca.test.ts`: nenhuma das fontes
 *   publica `excerpt`, então qualquer texto descritivo teria sido escrito por
 *   este portal sobre obra de terceiro.
 *
 * O que dá para reaproveitar é o **método**, não o código: levantar o
 * vocabulário do próprio acervo, medir a evidência de cada glosa, e não
 * imprimir o que a fonte não sustenta.
 */

/**
 * O assunto de cada instrumento jurídico, em linguagem comum, escrito para
 * caber depois de "…sobre ".
 *
 * A frase de cada um é a redução da formulação DOMINANTE nas descrições do
 * próprio grupo — medido em 15/08/2026, uma expressão-chave por instrumento:
 *
 * | instrumento | expressão medida na `descricao` | acerto |
 * |---|---|---:|
 * | `aguas-e-seguranca-hidrica` | "Copasa" ou "Segurança Hídrica" | 84/84 |
 * | `estudo-de-risco` | "risco" | 82/82 |
 * | `seguranca-das-estruturas` | "estruturas" | 30/30 |
 * | `monitoramento` | "monitoramento" | 82/85 |
 * | `acoes-emergenciais` | "ações emergenciais" | 62/87 |
 * | `acordo-de-reparacao` | "Acordo Judicial" ou "reparação" | 53/93 |
 * | `estudo-da-producao-agropecuaria` | "produção agropecuária" ou "pescado" | 3/6 |
 *
 * Os dois piores (`acordo-de-reparacao`, 57%, e `estudo-da-producao-agropecuaria`,
 * 50%) não são glosa errada: são documentos cuja descrição é curta e específica
 * ("Nota Técnica referente à análise do Adendo do Projeto Executivo do Remanso
 * 3") e nem por isso deixa de estar sob aquele instrumento. A glosa descreve a
 * FRENTE de trabalho, que é o que o campo significa, não o texto de cada ficha.
 */
export const GLOSA_INSTRUMENTO_AJRI: Record<InstrumentoAjri, string> = {
  "acordo-de-reparacao": "o cumprimento das ações de reparação previstas no Acordo",
  "acoes-emergenciais": "as ações de emergência da Vale para conter os danos do rompimento",
  monitoramento: "o monitoramento da água e dos sedimentos e a distribuição de água potável",
  "aguas-e-seguranca-hidrica":
    "o restabelecimento das captações de água da Copasa e a segurança do abastecimento",
  "estudo-de-risco": "os estudos de risco à saúde das pessoas e ao meio ambiente",
  "seguranca-das-estruturas":
    "a segurança das estruturas que restaram e das barreiras que seguram o rejeito",
  "estudo-da-producao-agropecuaria":
    "o estudo da produção agropecuária e do pescado na bacia do rio Paraopeba",
};

/**
 * O que cada tipo É, em vez do rótulo do portal.
 *
 * A diferença entre os dois não é de nome, é **estrutural, e foi medida**:
 * dos 391 Relatórios, **386 (98,7%)** dizem na descrição "no período
 * compreendido entre…"; das 76 Notas Técnicas, **0 (zero)** dizem. Relatório é
 * balanço de um intervalo de tempo; Nota Técnica é parecer sobre uma peça
 * específica, fora do ciclo. É essa medição que autoriza a frase.
 */
export const GLOSA_TIPO_AJRI: Record<TipoDocumentoAjri, { oQueE: string; ressalva: string }> = {
  relatorio: {
    oQueE: "o balanço do trabalho de fiscalização da auditoria independente",
    ressalva: "",
  },
  "nota-tecnica": {
    oQueE: "a análise pontual da auditoria independente",
    ressalva: ", fora do ciclo dos relatórios",
  },
};

/**
 * A disciplina do código (`CO`, `ZZ`, `SH`, `FS`, `A2`…) traduzida — com a
 * evidência de cada uma no próprio texto das descrições daquele grupo:
 *
 * | disciplina | docs | expressão que aparece na descrição | acerto |
 * |---|---:|---|---:|
 * | `CO` | 84 | "Copasa" | **84/84** |
 * | `SH` | 82 | "Saúde Humana" | **82/82** |
 * | `A2` | 18 | "Anexo II.2" | **18/18** |
 * | `FS` | 6 | "produção agropecuária" ou "pescado" | 3/6 |
 * | `ZZ` | 274 | — (espalhada por 5 instrumentos) | — |
 * | `CB`, `CM`, `M2` | 1 cada | — | — |
 *
 * ⚠️ **`SH` é Saúde Humana, não Segurança Hídrica.** Os 82 documentos `SH`
 * dizem, todos, "Estudos de Avaliação de Risco à **Saúde Humana** e Risco
 * Ecológico"; quem cuida de segurança hídrica é a disciplina `CO`, das
 * captações da Copasa. Duas siglas parecidas para coisas diferentes é
 * exatamente o tipo de erro que uma glosa adivinhada cometeria.
 *
 * `CB`, `CM` e `M2` ficam de fora de propósito: são 1 documento cada, todos de
 * 2019, e o que se sabe deles está na própria descrição ("Barragem Capim
 * Branco", "Barragem Menezes II", "Visita de Campo") — que continua na tela.
 * Inventar o que a sigla significa a partir de um caso é adivinhação.
 */
export const GLOSA_DISCIPLINA_AJRI: Record<string, string> = {
  CO: "as captações de água da Copasa",
  SH: "o risco à saúde humana e o risco ecológico",
  FS: "a segurança do alimento",
  A2: "o Anexo II.2, as obrigações de fazer da Vale",
};

/**
 * Glosa de tema — **só onde o rótulo do portal é sigla**, e só quando o
 * próprio acervo a expande.
 *
 * `PEABP` é o único caso: 18 documentos carregam o tema, e o rótulo do portal
 * é a sigla nua. A expansão está escrita numa descrição da própria AECOM
 * ("…Programa de Educação Ambiental de Brumadinho e Bacia do Rio Paraopeba
 * (PEABP)"), então não é invenção deste portal — é leitura do acervo.
 *
 * Os outros 24 rótulos já são frases em português ("Qualidade da Água",
 * "Manejo de Rejeitos") e não ganham nada com paráfrase.
 */
export const GLOSA_TEMA_AJRI: Partial<Record<TemaAjri, string>> = {
  peabp: "Programa de Educação Ambiental de Brumadinho e Bacia do Rio Paraopeba",
};

/**
 * De onde vem — constante para os 467, porque `autor` é constante no acervo
 * (conferido registro a registro na geração, ver `AUTOR_AUDITORIA_AJRI`).
 *
 * Fica na ficha, e não só no topo da página, porque a ficha é a unidade que as
 * pessoas copiam, imprimem e compartilham — o mesmo motivo pelo qual o crédito
 * já está em cada card.
 */
export const PROCEDENCIA_AJRI = `${AUTOR_AUDITORIA_AJRI}, a auditoria independente prevista no Acordo Judicial de Reparação Integral de R$ 37,6 bilhões — não é documento da Vale nem das instituições de justiça, é o parecer de quem verifica os dois.`;

const MES_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/**
 * `2026-07-31` → `31 de julho de 2026`.
 *
 * Lê os dígitos Y-M-D direto, sem `new Date`, pela mesma razão registrada em
 * `lib/betim/format.ts`: `new Date("2026-07-31")` é meia-noite UTC e, formatada
 * em fuso UTC-3, volta um dia — bug confirmado em produção em 21/07/2026.
 *
 * Mora aqui, e não em `format.ts`, porque é o único consumidor: `format.ts` é
 * arquivo compartilhado por várias frentes, e acrescentar função lá para um uso
 * só troca zero benefício por risco de conflito de merge.
 */
export function dataPorExtensoBR(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!m) return "—";
  const [, ano, mes, dia] = m;
  const nome = MES_PT[Number(mes) - 1];
  if (!nome) return "—";
  return `${Number(dia)} de ${nome} de ${ano}`;
}

const SEM_ACENTO = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const NUMERO_DO_MES: Record<string, number> = Object.fromEntries(
  MES_PT.map((nome, i) => [SEM_ACENTO(nome), i + 1])
);

/**
 * Uma data solta dentro da frase de período: `14/04/2020` ou
 * `16 [de junho] [de 2026]` — mês e ano opcionais, porque a AECOM escreve
 * "entre 16 de maio **a** 15 de junho de 2026" e omite o que se repete.
 */
const DATA =
  String.raw`(?:(\d{1,2})\/(\d{1,2})\/(\d{4})|(\d{1,2})(?:\s+de\s+([a-zA-Zçãéíóúô]+))?(?:\s+de\s+(\d{4}))?)`;

/**
 * A conjunção entre as duas datas. `até|ao|à|a|e` nessa ordem — alternativa
 * mais longa primeiro, senão `a` casaria o começo de `até` e a expressão
 * quebraria. E ela é **opcional**: em 2 documentos a AECOM simplesmente
 * esqueceu a conjunção ("entre 16 de outubro de 2025 15 de novembro de 2025").
 */
const RE_PERIODO = new RegExp(
  String.raw`per[ií]odo\s+compreendido\s+entre\s+${DATA}\s*(?:até|ao|à|a|e)?\s+${DATA}`,
  "i"
);

/** Um intervalo em ISO, as duas pontas presentes e na ordem certa. */
export interface PeriodoExaminadoAjri {
  /** ISO `yyyy-mm-dd`. */
  de: string;
  /** ISO `yyyy-mm-dd`. */
  ate: string;
  /** "de 23 de junho de 2026 a 21 de julho de 2026" — pronto para a tela. */
  frase: string;
}

const iso = (ano: number, mes: number, dia: number) =>
  `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

/**
 * O **período que o documento examinou**, extraído da `descricao` — que é o
 * único lugar do acervo onde ele existe. Não confundir com `data`, que é a
 * publicação: o relatório de 31/07/2026 audita 23/06 a 21/07/2026.
 *
 * ═══ COBERTURA MEDIDA, EM 15/08/2026 ═══
 *
 * · **386 dos 467** (82,7%) trazem a frase "no período compreendido entre…";
 * · deles, **386/386 (100%)** são lidos por esta função;
 * · **1** é descartado pela guarda de ordem — ver abaixo. Sobram **385**
 *   (82,4% do acervo) com período na ficha;
 * · os 81 sem a frase são **76 Notas Técnicas** (todas — nota técnica não
 *   cobre intervalo) e **5 Relatórios** antigos, entre eles o "Relatório
 *   Preliminar" e as três visitas de 2019.
 *
 * ═══ A GUARDA DE ORDEM, E POR QUE ELA DESCARTA EM VEZ DE CONSERTAR ═══
 *
 * Um documento diz "entre 13 de dezembro de 2020 e 24 de janeiro de 2020" —
 * o fim vem ANTES do começo, e o ano do fim é claramente um erro de digitação
 * da fonte (deveria ser 2021). Corrigir seria este portal reescrevendo o texto
 * da AECOM com base num palpite; imprimir seria publicar um intervalo
 * impossível. A função devolve `null`, a ficha omite o período, e a descrição
 * original — que continua na tela — mostra a frase como ela é.
 */
export function periodoExaminadoAjri(descricao: string): PeriodoExaminadoAjri | null {
  const m = RE_PERIODO.exec(descricao);
  if (!m) return null;
  const [, dA, mA, aA, diaA, mesA, anoA, dB, mB, aB, diaB, mesB, anoB] = m;

  const parte = (
    diaBarra?: string,
    mesBarra?: string,
    anoBarra?: string,
    dia?: string,
    mes?: string,
    ano?: string
  ) => {
    if (diaBarra) return { dia: Number(diaBarra), mes: Number(mesBarra), ano: Number(anoBarra) };
    if (!dia) return null;
    return {
      dia: Number(dia),
      mes: mes ? NUMERO_DO_MES[SEM_ACENTO(mes)] : undefined,
      ano: ano ? Number(ano) : undefined,
    };
  };

  const inicio = parte(dA, mA, aA, diaA, mesA, anoA);
  const fim = parte(dB, mB, aB, diaB, mesB, anoB);
  /** O FIM tem que estar completo: é dele que o começo herda o que faltar. */
  if (!inicio || !fim || !fim.mes || !fim.ano) return null;

  const mesInicio = inicio.mes ?? fim.mes;
  if (!mesInicio) return null;
  /** "entre 16 de dezembro a 15 de janeiro de 2026" começa no ano anterior. */
  const anoInicio = inicio.ano ?? (mesInicio > fim.mes ? fim.ano - 1 : fim.ano);

  const de = iso(anoInicio, mesInicio, inicio.dia);
  const ate = iso(fim.ano, fim.mes, fim.dia);
  if (de > ate) return null;

  return { de, ate, frase: `de ${dataPorExtensoBR(de)} a ${dataPorExtensoBR(ate)}` };
}

/**
 * O número do documento, tirado do **código** (`…-RP-PM-0084-2026` → 84), e só
 * para Relatórios.
 *
 * ═══ POR QUE DO CÓDIGO, E NÃO DA DESCRIÇÃO ═══
 *
 * O código tem 8 segmentos em **467/467** e o sequencial é numérico em
 * 467/467 — a descrição traz um número em só 319. Onde os dois existem, batem
 * em **317 de 319**; e as **2** divergências são justamente o motivo de não
 * confiar no texto: são Notas Técnicas que CITAM a nota técnica de outro órgão
 * ("referente às respostas VALE à Nota Técnica nº 52/2025 **da SEMAD**"). Ler o
 * número da descrição publicaria o número da SEMAD como se fosse da AECOM.
 *
 * ═══ POR QUE SÓ RELATÓRIO ═══
 *
 * Nas Notas Técnicas o sequencial é contador interno, não identidade pública:
 * **4 pares** repetem o mesmo sequencial dentro do mesmo projeto, disciplina e
 * tipo, e nenhuma das 76 descrições se autonumera. Um "nº 4" na tela sugeriria
 * uma numeração que a fonte não sustenta.
 */
export function numeroDoRelatorioAjri(doc: DocumentoAuditoriaAjri): number | null {
  if (doc.tipo !== "relatorio") return null;
  const seq = doc.codigo.split("-")[6];
  if (!seq || !/^\d+$/.test(seq)) return null;
  const n = Number(seq);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * O complemento de disciplina — e ele quase nunca aparece, de propósito.
 *
 * ═══ A MEDIÇÃO QUE DECIDE ISSO ═══
 *
 * A disciplina é **redundante com o instrumento em 449 dos 467** (96,1%):
 * `CO` só existe em `aguas-e-seguranca-hidrica` (84/84), `SH` só em
 * `estudo-de-risco` (82/82), `FS` só em `estudo-da-producao-agropecuaria`
 * (6/6), e `ZZ` é a disciplina genérica. Repetir "…sobre os estudos de risco
 * à saúde das pessoas (risco à saúde humana e risco ecológico)" é dizer a
 * mesma coisa duas vezes na mesma frase.
 *
 * Sobra **um** caso em que ela informa: dentro de `acordo-de-reparacao`
 * convivem `ZZ` (75 documentos, o Anexo II.1) e `A2` (18, o Anexo II.2) — dois
 * anexos diferentes do mesmo Acordo, e o instrumento sozinho não os separa.
 * São esses 18 que ganham complemento.
 */
const DISCIPLINAS_QUE_ESCLARECEM = new Set(["A2"]);

function complementoDaDisciplina(doc: DocumentoAuditoriaAjri): string {
  if (!DISCIPLINAS_QUE_ESCLARECEM.has(doc.disciplina)) return "";
  const glosa = GLOSA_DISCIPLINA_AJRI[doc.disciplina];
  if (!glosa) return "";
  return `, na parte que trata d${glosa}`;
}

export interface FichaLegivelAjri {
  /** Uma frase de linguagem comum: o que este documento é. */
  oQueE: string;
  /** A data de publicação, por extenso. */
  quando: string;
  /** O intervalo que o documento examinou, quando a fonte o declara. */
  periodoExaminado: PeriodoExaminadoAjri | null;
  /** Os temas com o rótulo humano — sigla expandida onde o acervo expande. */
  sobreOQue: string[];
  /** Quem escreveu e sob que mandato. Constante no acervo. */
  deOndeVem: string;
  /** O número do Relatório; `null` nas Notas Técnicas. */
  numero: number | null;
}

/**
 * Monta a ficha legível de um documento. **Pura**: mesma entrada, mesma saída,
 * sem rede, sem relógio, sem modelo.
 */
export function fichaLegivelAjri(doc: DocumentoAuditoriaAjri): FichaLegivelAjri {
  const numero = numeroDoRelatorioAjri(doc);
  const abertura =
    doc.tipo === "relatorio" ? (numero ? `Relatório nº ${numero}` : "Relatório") : "Nota técnica";

  const tipo = GLOSA_TIPO_AJRI[doc.tipo];
  const oQueE = `${abertura} — ${tipo.oQueE} sobre ${GLOSA_INSTRUMENTO_AJRI[doc.instrumento]}${complementoDaDisciplina(doc)}${tipo.ressalva}.`;

  const sobreOQue = doc.temas.map((t) => GLOSA_TEMA_AJRI[t] ?? TEMA_AJRI_LABEL[t]);

  return {
    oQueE,
    quando: dataPorExtensoBR(doc.data),
    periodoExaminado: periodoExaminadoAjri(doc.descricao),
    sobreOQue,
    deOndeVem: PROCEDENCIA_AJRI,
    numero,
  };
}
