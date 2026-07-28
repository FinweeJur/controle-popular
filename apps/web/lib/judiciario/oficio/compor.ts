import type { Nomeacao, Vaga, Tribunal, Cadeira } from "@/lib/judiciario/tribunais";
import { rotuloCota, rotuloResultado, rotuloMotivoVacancia } from "@/lib/judiciario/rotulos";

/**
 * Composição do ofício — determinística, SEM LLM.
 *
 * Mesma disciplina do `/congresso` (`lib/oficio/compor.ts`), adaptada de
 * "proposição legislativa" para "nomeação/vaga de tribunal". O documento
 * sai completo e formalmente correto usando só fato já verificado que
 * está no banco — identificação da Mensagem, ementa, dispositivo da
 * vaga, resultado da sabatina. Nenhuma camada de LLM decide fato aqui.
 *
 * Por que assim: um ofício é um documento que a pessoa vai ASSINAR e
 * mandar a um senador ou à Presidência da República. Um LLM que inventa
 * um dispositivo aqui não produz um texto ruim — produz um texto que
 * constrange quem assinou. É a mesma lição que motivou o verificador em
 * `verificador.ts`.
 *
 * DOIS ANCORAS POSSÍVEIS, porque são dois momentos cívicos distintos:
 *   - `nomeacao`: há uma indicação em tramitação no Senado (ou já
 *     decidida) — o cidadão se manifesta sobre ELA (apoio/repúdio/vista).
 *   - `vaga`: uma cadeira está aberta e ainda SEM indicação — o cidadão
 *     cobra o preenchimento da autoridade competente.
 * `documentos.nomeacao_id` e `documentos.vaga_id` (schema, ambos
 * nullable) já preveem essa dualidade.
 */

export type TipoDocumento = "apoio" | "repudio" | "vista" | "comentario";

export interface Destinatario {
  nome: string;
  cargo: string;
  email: string | null;
}

export interface Remetente {
  nome: string;
  qualificacao?: string; // "cidadão", "coletivo X", "associação Y"
  cidade?: string;
  uf?: string;
  email?: string;
}

export interface Bloco {
  tipo: "local_data" | "vocativo" | "referencia" | "paragrafo" | "citacao" | "fecho" | "assinatura";
  texto: string;
}

export interface Oficio {
  titulo: string;
  destinatarios: Destinatario[];
  blocos: Bloco[];
  assunto: string;
}

const ROTULO_TIPO: Record<TipoDocumento, string> = {
  apoio: "manifestação de apoio",
  repudio: "manifestação de repúdio",
  vista: "pedido de vista",
  comentario: "comentário técnico",
};

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function porExtenso(data: Date): string {
  return `${data.getDate()} de ${MESES[data.getMonth()]} de ${data.getFullYear()}`;
}

/**
 * Vocativo sem flexão de gênero — mesma decisão e mesmo motivo do
 * /congresso: o banco não guarda gênero de ninguém (não é dado
 * necessário, mesma disciplina do CPF), e adivinhar pelo nome erraria
 * com pessoa real num documento que alguém vai assinar.
 */
export function vocativo(d: Destinatario, tratamento?: string): string {
  if (tratamento?.trim()) return `${tratamento.trim()},`;
  return `Excelentíssimo(a) Senhor(a) ${d.cargo},`;
}

const PEDIDO_NOMEACAO: Record<TipoDocumento, string> = {
  apoio:
    "Diante do exposto, venho respeitosamente manifestar apoio à indicação e solicitar a Vossa Excelência que se posicione favoravelmente à sua aprovação.",
  repudio:
    "Diante do exposto, venho respeitosamente manifestar oposição à indicação e solicitar a Vossa Excelência que se posicione pela sua rejeição.",
  vista:
    "Diante do exposto, e considerando a relevância da matéria, solicito a Vossa Excelência que requeira vista do processo de indicação, de modo a permitir exame mais detido antes da sabatina.",
  comentario:
    "Encaminho as considerações acima a título de contribuição ao exame da matéria, permanecendo à disposição para os esclarecimentos que Vossa Excelência entender necessários.",
};

const PEDIDO_VAGA: Record<TipoDocumento, string> = {
  apoio:
    "Diante do exposto, venho respeitosamente solicitar a Vossa Excelência que priorize o preenchimento desta vaga, dada a relevância da composição plena do tribunal para a prestação jurisdicional.",
  repudio:
    "Diante do exposto, venho respeitosamente manifestar preocupação com a demora no preenchimento desta vaga e solicitar a Vossa Excelência providências para saná-la.",
  vista:
    "Diante do exposto, solicito a Vossa Excelência informações sobre o andamento do processo de preenchimento desta vaga.",
  comentario:
    "Encaminho as considerações acima a título de contribuição ao acompanhamento da vaga em referência.",
};

/** Encaixa a ementa/dispositivo no meio de uma frase (minúscula inicial,
 * protegendo sigla e nome próprio em caixa alta). */
function encaixarNaFrase(texto: string): string {
  const t = texto.trim().replace(/\.$/, "");
  if (t.length < 2) return t;
  const [primeira, segunda] = [t[0], t[1]];
  if (primeira === primeira.toUpperCase() && segunda === segunda.toLowerCase()) {
    return primeira.toLowerCase() + t.slice(1);
  }
  return t;
}

function nomeDoIndicado(ementa: string | null): string | null {
  if (!ementa) return null;
  // "...o nome do Senhor FULANO DE TAL, para exercer..." / "...o nome
  // da Senhora CICRANA..." — a ementa oficial do Senado segue este
  // padrão de forma consistente (verificado contra 130 ementas reais na
  // F0/F2). Extração best-effort: se não casar, o ofício segue sem o
  // nome solto, sem quebrar.
  const m = ementa.match(
    /\bo nome (?:d[aoe]s?\s+)?(?:Senhor|Senhora|General(?:\s+de\s+\w+)?|Almirante(?:-de-\w+)?|Brigadeiro)?\s*([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú' -]{4,70}?)(?:,|\s+para\s+exercer)/
  );
  return m ? m[1].trim() : null;
}

function tituloTribunal(t: Pick<Tribunal, "sigla" | "nome">): string {
  return `${t.sigla ?? t.nome}`;
}

/**
 * "2026-04-29" → "29/04/2026", SEM passar por `new Date(iso)`.
 *
 * `new Date("2026-04-29")` é interpretado como **UTC meia-noite**; chamar
 * `.toLocaleDateString()` em cima formata no fuso LOCAL, que em qualquer
 * fuso negativo (Brasil, UTC-3) devolve o dia ANTERIOR. Achado ao rodar
 * o smoke test contra a data real do Senado: `data_deliberacao` de
 * "2026-04-29" (MSF 7/2026, a rejeição do Messias) saía como "28/04/2026"
 * no texto do ofício — um documento que a pessoa assina com a data
 * errada. `data_abertura`/`data_mensagem` do banco são sempre `date`
 * puro (sem hora), então extrair Y-M-D do texto evita o problema de vez,
 * em vez de rebalancear fuso.
 */
function formatarDataBR(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return isoDate;
  const [, ano, mes, dia] = m;
  return `${dia}/${mes}/${ano}`;
}

/** Dias corridos entre duas datas `AAAA-MM-DD`, sem passar por `Date` UTC. */
function diasEntre(isoInicio: string, isoFim: Date): number | null {
  const m = isoInicio.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [, ano, mes, dia] = m;
  // meio-dia UTC dos dois lados: elimina o risco de o fuso local empurrar
  // a meia-noite para o dia anterior/seguinte antes da subtração.
  const inicio = Date.UTC(+ano, +mes - 1, +dia, 12);
  const fim = Date.UTC(isoFim.getFullYear(), isoFim.getMonth(), isoFim.getDate(), 12);
  return Math.floor((fim - inicio) / 86_400_000);
}

/**
 * Ofício ancorado numa NOMEAÇÃO (indicação em tramitação ou já decidida).
 */
export function comporOficioNomeacao(params: {
  nomeacao: Nomeacao;
  tribunal: Tribunal;
  remetente: Remetente;
  tipo: TipoDocumento;
  tratamento?: string;
  observacoes?: string;
  data?: Date;
}): Oficio {
  const { nomeacao: n, tribunal, remetente, tipo, tratamento, observacoes } = params;
  const data = params.data ?? new Date();
  const local = [remetente.cidade, remetente.uf].filter(Boolean).join("/") || "Brasil";

  const indicado = nomeDoIndicado(n.senado_ementa);
  const identificacao = n.senado_identificacao ?? `indicação ao ${tituloTribunal(tribunal)}`;
  const referencia = `Ref.: ${identificacao} — ${ROTULO_TIPO[tipo]}`;

  // Destinatário natural de uma indicação em tramitação é a CCJ do
  // Senado (quem sabatina); sem uma tabela de senadores/comissões neste
  // schema (não existe — o Senado não é modelado aqui além das
  // Mensagens), o e-mail fica null e o campo é preenchível pelo usuário
  // antes de enviar. Não inventar destinatário específico sem fonte.
  const destinatarios = [
    { nome: "Comissão de Constituição, Justiça e Cidadania do Senado Federal", cargo: "Presidente da Comissão de Constituição, Justiça e Cidadania do Senado Federal", email: null },
  ];

  const quem = remetente.qualificacao ? `${remetente.nome}, ${remetente.qualificacao}` : remetente.nome;

  const blocos: Bloco[] = [
    { tipo: "local_data", texto: `${local}, ${porExtenso(data)}.` },
    { tipo: "vocativo", texto: vocativo(destinatarios[0], tratamento) },
    { tipo: "referencia", texto: referencia },
    {
      tipo: "paragrafo",
      texto:
        `${quem}, dirijo-me a Vossa Excelência a respeito d${identificacao.startsWith("MSF") ? "a" : "a"} ` +
        `${identificacao}${indicado ? `, que indica o Senhor(a) ${indicado}` : ""} para o cargo de ` +
        `Ministro(a) do ${tribunal.nome}.`,
    },
  ];

  if (n.dispositivo_vaga) {
    blocos.push({
      tipo: "paragrafo",
      texto: `A vaga em questão tem origem em ${n.dispositivo_vaga}${n.antecessor_nome ? `, decorrente de vacância na cadeira anteriormente ocupada por ${n.antecessor_nome}` : ""}.`,
    });
  }

  if (n.resultado) {
    blocos.push({
      tipo: "paragrafo",
      texto: `A indicação encontra-se com o seguinte resultado registrado: ${rotuloResultado(n.resultado)}${n.data_deliberacao ? `, em ${formatarDataBR(n.data_deliberacao)}` : ""}.`,
    });
  }

  if (n.senado_ementa) {
    blocos.push({ tipo: "citacao", texto: encaixarNaFrase(n.senado_ementa) });
  }

  if (observacoes?.trim()) {
    blocos.push({ tipo: "paragrafo", texto: observacoes.trim() });
  }

  blocos.push({ tipo: "paragrafo", texto: PEDIDO_NOMEACAO[tipo] });
  blocos.push({ tipo: "fecho", texto: "Respeitosamente," });
  blocos.push({
    tipo: "assinatura",
    texto: [remetente.nome, remetente.qualificacao, remetente.email].filter(Boolean).join("\n"),
  });

  return { titulo: `${identificacao} — ${ROTULO_TIPO[tipo]}`, destinatarios, blocos, assunto: referencia };
}

/**
 * Ofício ancorado numa VAGA aberta (com ou sem indicação ainda).
 */
export function comporOficioVaga(params: {
  vaga: Vaga;
  cadeira: Cadeira;
  tribunal: Tribunal;
  remetente: Remetente;
  tipo: TipoDocumento;
  tratamento?: string;
  observacoes?: string;
  data?: Date;
}): Oficio {
  const { vaga, cadeira, tribunal, remetente, tipo, tratamento, observacoes } = params;
  const data = params.data ?? new Date();
  const local = [remetente.cidade, remetente.uf].filter(Boolean).join("/") || "Brasil";

  const identificacao = `vaga da cadeira nº ${cadeira.numero ?? "s/n"} do ${tituloTribunal(tribunal)}`;
  const referencia = `Ref.: ${identificacao} (${rotuloCota(cadeira.cota)}) — ${ROTULO_TIPO[tipo]}`;

  const destinatarios = [
    { nome: "Presidência da República", cargo: "Presidente da República", email: null },
  ];

  const quem = remetente.qualificacao ? `${remetente.nome}, ${remetente.qualificacao}` : remetente.nome;

  const diasAberta = vaga.data_abertura ? diasEntre(vaga.data_abertura, data) : null;

  const blocos: Bloco[] = [
    { tipo: "local_data", texto: `${local}, ${porExtenso(data)}.` },
    { tipo: "vocativo", texto: vocativo(destinatarios[0], tratamento) },
    { tipo: "referencia", texto: referencia },
    {
      tipo: "paragrafo",
      texto:
        `${quem}, dirijo-me a Vossa Excelência a respeito d${identificacao.startsWith("v") ? "a" : "a"} ${identificacao}` +
        `${vaga.data_abertura ? `, aberta em ${formatarDataBR(vaga.data_abertura)}` : ""}` +
        `${vaga.motivo ? ` por ${rotuloMotivoVacancia(vaga.motivo)}` : ""}, ainda pendente de preenchimento` +
        `${diasAberta !== null && diasAberta > 0 ? `, há ${diasAberta} dias` : ""}.`,
    },
  ];

  if (cadeira.dispositivo) {
    blocos.push({
      tipo: "paragrafo",
      texto: `Trata-se de cadeira cuja origem é fixada por ${cadeira.dispositivo}.`,
    });
  }

  if (observacoes?.trim()) {
    blocos.push({ tipo: "paragrafo", texto: observacoes.trim() });
  }

  blocos.push({ tipo: "paragrafo", texto: PEDIDO_VAGA[tipo] });
  blocos.push({ tipo: "fecho", texto: "Respeitosamente," });
  blocos.push({
    tipo: "assinatura",
    texto: [remetente.nome, remetente.qualificacao, remetente.email].filter(Boolean).join("\n"),
  });

  return { titulo: `${identificacao} — ${ROTULO_TIPO[tipo]}`, destinatarios, blocos, assunto: referencia };
}
