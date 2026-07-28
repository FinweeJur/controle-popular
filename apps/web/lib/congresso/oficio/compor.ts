import { labelDoDireito, type AnaliseItem } from "@/lib/congresso/rubrica";
import type { Analise, Autor, Proposicao } from "@/lib/congresso/proposicoes";

/**
 * Composição do ofício — determinística, SEM LLM.
 *
 * Esta é a decisão de desenho mais importante do módulo: o documento sai
 * completo e formalmente correto usando apenas fatos já verificados que
 * estão no banco — identificação da proposição, ementa, situação e órgão
 * atual, autoria, e os `analise_itens` com dispositivo legal e citação
 * literal. O modelo de linguagem, quando disponível, só reescreve os
 * parágrafos num português mais fluido (`revisarOficio`, em `revisar.ts`),
 * e é opcional em todos os caminhos.
 *
 * Por que assim: um ofício é um documento que a pessoa vai ASSINAR e
 * mandar para um parlamentar. Um LLM que inventa um artigo de lei aqui
 * não produz um texto ruim — produz um texto que constrange quem assinou.
 * Toda afirmação jurídica do documento vem de um item de análise que já
 * passou pela validação da rubrica.
 */

export type TipoDocumento = "apoio" | "repudio" | "vista" | "comentario";

export interface Destinatario {
  nome: string;
  cargo: string; // "Presidente da CCJC", "Deputado(a) Federal — membro da CCJC"
  email: string | null;
  partido?: string | null;
  uf?: string | null;
  /**
   * Vem pré-marcado no formulário. Só a mesa diretora da comissão (poucas
   * pessoas, concretas, é quem decide a pauta) — nunca o autor do PL:
   * pedir para o autor aprovar o próprio projeto não faz sentido, e uma
   * lista de dezenas de titulares pré-marcada arrisca virar disparo em
   * massa sem o usuário perceber. Ver `sugerirDestinatarios`.
   */
  destaque?: boolean;
}

export interface Remetente {
  nome: string;
  qualificacao?: string; // "cidadã", "Coletivo X", "Sindicato Y"
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
  /** Assunto do e-mail, quando o usuário optar por mandar por e-mail. */
  assunto: string;
}

const ROTULO_TIPO: Record<TipoDocumento, string> = {
  apoio: "manifestação de apoio",
  repudio: "manifestação de repúdio",
  vista: "pedido de vista",
  comentario: "comentário técnico",
};

const PEDIDO: Record<TipoDocumento, string> = {
  apoio:
    "Diante do exposto, venho respeitosamente manifestar apoio à proposição e solicitar a Vossa Excelência que se posicione favoravelmente à sua aprovação.",
  repudio:
    "Diante do exposto, venho respeitosamente manifestar oposição à proposição e solicitar a Vossa Excelência que se posicione pela sua rejeição.",
  vista:
    "Diante do exposto, e considerando a relevância da matéria, solicito a Vossa Excelência que requeira vista da proposição, de modo a permitir exame mais detido antes da deliberação.",
  comentario:
    "Encaminho as considerações acima a título de contribuição ao exame da matéria, permanecendo à disposição para os esclarecimentos que Vossa Excelência entender necessários.",
};

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function porExtenso(data: Date): string {
  return `${data.getDate()} de ${MESES[data.getMonth()]} de ${data.getFullYear()}`;
}

/**
 * Vocativo. Usa a forma inclusiva por padrão — de propósito.
 *
 * O tratamento formal em português flexiona em gênero ("Excelentíssimo
 * Senhor Deputado" / "Excelentíssima Senhora Deputada"), mas o banco não
 * guarda o gênero de ninguém: a API da Câmara expõe o campo, e decidimos
 * não coletar dado pessoal que não é necessário (mesma regra do CPF).
 * Adivinhar pelo nome erraria com pessoas reais num documento oficial que
 * alguém vai assinar. A forma com "(a)" é usada correntemente na
 * correspondência parlamentar e nunca erra; quem quiser a forma flexionada
 * edita no campo de tratamento antes de exportar.
 */
export function vocativo(d: Destinatario, tratamento?: string): string {
  if (tratamento?.trim()) return `${tratamento.trim()},`;
  return `Excelentíssimo(a) Senhor(a) ${d.cargo} ${d.nome},`;
}

/**
 * Encaixa a ementa no meio de uma frase.
 *
 * Ementa oficial sempre começa com verbo maiúsculo — "Altera a Lei nº
 * 10.708...", "Dispõe sobre...". Concatenada crua depois de "que", sai
 * "...que Altera a Lei", com maiúscula no meio da frase. Achado no smoke
 * test contra as 30 ementas reais do benchmark; passaria despercebido com
 * fixture inventada.
 *
 * A minúscula só é aplicada quando a segunda letra é minúscula: protege
 * sigla ("CLT", "PEC") e nome próprio em caixa alta, que devem ficar como
 * estão.
 */
function encaixarNaFrase(ementa: string): string {
  const texto = ementa.trim().replace(/\.$/, "");
  if (texto.length < 2) return texto;
  const primeira = texto[0];
  const segunda = texto[1];
  if (primeira === primeira.toUpperCase() && segunda === segunda.toLowerCase()) {
    return primeira.toLowerCase() + texto.slice(1);
  }
  return texto;
}

function descreverAutoria(autores: Autor[]): string {
  if (autores.length === 0) return "";
  const primeiro = autores[0];
  const nome = `${primeiro.nome}${primeiro.partido ? ` (${primeiro.partido}${primeiro.uf ? `/${primeiro.uf}` : ""})` : ""}`;
  if (autores.length === 1) return `de autoria d${primeiro.nome?.endsWith("a") ? "e" : "e"} ${nome}`;
  return `de autoria de ${nome} e outros ${autores.length - 1} parlamentares`;
}

/**
 * Um trecho de ementa citado como ação: "cria a Bolsa Cuidador...",
 * "assegura reconhecimento previdenciário...". Ementas brasileiras são
 * escritas como lista de orações paralelas de verbo ("Institui X, cria Y,
 * assegura Z"), então o trecho de um item quase sempre já É uma dessas
 * orações — dá para reencadear vários com "e" sem reescrever nada, só
 * ajustando a primeira letra para entrar depois de "ao".
 */
function comoOracao(trecho: string): string {
  const t = trecho.trim().replace(/\.$/, "");
  if (t.length < 2) return t;
  const seg = t[1];
  return seg === seg.toLowerCase() ? t[0].toLowerCase() + t.slice(1) : t;
}

const GRAU_PESO: Record<string, number> = { estrutural: 3, moderado: 2, marginal: 1 };

interface GrupoDireito {
  direito: string;
  direcao: "amplia" | "restringe";
  itens: AnaliseItem[];
}

function agruparPorDireito(itens: AnaliseItem[]): GrupoDireito[] {
  const mapa = new Map<string, GrupoDireito>();
  for (const item of itens) {
    if (item.direcao !== "amplia" && item.direcao !== "restringe") continue;
    const chave = `${item.direito}:${item.direcao}`;
    const g = mapa.get(chave);
    if (g) g.itens.push(item);
    else mapa.set(chave, { direito: item.direito, direcao: item.direcao, itens: [item] });
  }
  return [...mapa.values()].sort(
    (a, b) =>
      b.itens.reduce((s, i) => s + Math.abs(i.peso ?? 0), 0) -
      a.itens.reduce((s, i) => s + Math.abs(i.peso ?? 0), 0)
  );
}

/**
 * Um parágrafo-argumento por direito afetado, não um parágrafo por item.
 *
 * A versão anterior gerava um bloco mecânico por item — "A proposição
 * amplia o direito a X, com fundamento em Y, atingindo Z. Alcance W." — e
 * quando dois itens caíam no mesmo direito (comum: uma lei cria o
 * benefício, outra assegura o efeito colateral dele), o mesmo parágrafo se
 * repetia quase palavra por palavra. Isso é o que ficava "muito
 * genérico": o documento parecia gerado por template porque, naquele
 * ponto, era só um template. Agrupar por direito e reencadear os trechos
 * como uma frase só produz o argumento de verdade — o que a proposição
 * FAZ e por que isso importa — em vez de repetir a mesma abertura.
 */
function paragrafoDoGrupo(g: GrupoDireito): Bloco {
  const dispositivos = [...new Set(g.itens.map((i) => i.dispositivo))].join("; ");
  const oracoes = g.itens
    .map((i) => i.trecho)
    .filter((t): t is string => Boolean(t))
    .map(comoOracao);
  const titulares = [...new Set(g.itens.flatMap((i) => i.titulares ?? []))];
  const grauMax = g.itens.reduce(
    (max, i) => ((GRAU_PESO[i.grau] ?? 0) > (GRAU_PESO[max] ?? 0) ? i.grau : max),
    g.itens[0].grau
  );
  const verbo = g.direcao === "amplia" ? "amplia" : "restringe";

  const acao = oracoes.length > 0 ? `, ao ${oracoes.join("; e ao ")}` : "";
  const quem = titulares.length > 0 ? `, atingindo ${titulares.join(", ")}` : "";

  // "grau", não "forma": os valores de grau ("moderado", "estrutural",
  // "marginal") são adjetivos masculinos na rubrica — "de forma moderado"
  // é erro de concordância. "grau" concorda com todos os três sem
  // precisar flexionar nada.
  return {
    tipo: "paragrafo",
    texto:
      `A proposição ${verbo}, em grau ${grauMax}, o direito a ` +
      `${labelDoDireito(g.direito).toLowerCase()} (${dispositivos})${acao}${quem}.`,
  };
}

/**
 * Fundamentação: no máximo 3 parágrafos-argumento, um por direito — não
 * um por item de análise. É o corte que o usuário pediu: 2-3 parágrafos
 * sobre a importância ou os motivos, não a lista inteira de achados.
 */
function fundamentacao(itens: AnaliseItem[], tipo: TipoDocumento): Bloco[] {
  const relevantes = itens.filter((i) => (i.peso ?? 0) !== 0);
  if (relevantes.length === 0) return [];

  // Num ofício de apoio, os itens que restringem direitos enfraqueceriam o
  // próprio pedido — mas omiti-los seria esconder do signatário o que ele
  // está assinando. Solução: os itens da direção contrária entram, mas
  // num parágrafo de ressalva curto, ao final.
  const direcaoPrincipal = tipo === "repudio" ? "restringe" : "amplia";
  const grupos = agruparPorDireito(relevantes);
  const alinhados = grupos.filter((g) => g.direcao === direcaoPrincipal);
  const contrarios = grupos.filter((g) => g.direcao !== direcaoPrincipal);

  const principais = alinhados.length > 0 ? alinhados : grupos;
  const blocos = principais.slice(0, 3).map(paragrafoDoGrupo);

  // Citação literal só do argumento mais forte — não uma por item, que é
  // parte do que tornava o documento repetitivo.
  const trechoForte = principais[0]?.itens[0]?.trecho;
  if (trechoForte) blocos.splice(1, 0, { tipo: "citacao", texto: trechoForte });

  if (contrarios.length > 0) {
    const lista = contrarios
      .slice(0, 2)
      .map((g) => `${labelDoDireito(g.direito).toLowerCase()}`)
      .join(" e ");
    blocos.push({
      tipo: "paragrafo",
      texto: `Registre-se que a mesma proposição, em sentido oposto, afeta ${lista}.`,
    });
  }

  return blocos;
}

export function comporOficio(params: {
  proposicao: Proposicao;
  analise: Analise | null;
  itens: AnaliseItem[];
  autores: Autor[];
  destinatarios: Destinatario[];
  remetente: Remetente;
  tipo: TipoDocumento;
  tratamento?: string;
  observacoes?: string;
  data?: Date;
}): Oficio {
  const {
    proposicao: p,
    analise,
    itens,
    autores,
    destinatarios,
    remetente,
    tipo,
    tratamento,
    observacoes,
  } = params;
  const data = params.data ?? new Date();

  const local = [remetente.cidade, remetente.uf].filter(Boolean).join("/") || "Brasil";
  const referencia = `Ref.: ${p.identificacao} — ${ROTULO_TIPO[tipo]}`;

  const blocos: Bloco[] = [
    { tipo: "local_data", texto: `${local}, ${porExtenso(data)}.` },
    { tipo: "vocativo", texto: vocativo(destinatarios[0] ?? { nome: "", cargo: "Parlamentar", email: null }, tratamento) },
    { tipo: "referencia", texto: referencia },
  ];

  // "Eu, " antes do nome é o que transforma "NOME, dirijo-me..." — um
  // sujeito solto sem transição, apontado como confuso — em uma abertura
  // de petição em primeira pessoa, que é como correspondência formal
  // brasileira normalmente se identifica.
  const quem = remetente.qualificacao
    ? `Eu, ${remetente.nome}, ${remetente.qualificacao},`
    : `Eu, ${remetente.nome},`;

  blocos.push({
    tipo: "paragrafo",
    texto:
      `${quem} dirijo-me a Vossa Excelência a respeito d${p.sigla_tipo === "PEC" ? "a" : "o"} ` +
      `${p.identificacao}${autores.length ? `, ${descreverAutoria(autores)}` : ""}, que ` +
      `${encaixarNaFrase(p.ementa ?? "")}.`,
  });

  // Onde a proposição tramita NÃO vira parágrafo próprio: quem recebe o
  // ofício é justamente o colegiado que já sabe disso — repetir o trâmite
  // de volta para ele é o tipo de enchimento processual que o usuário
  // pediu para cortar. A situação/órgão continua visível no site e na
  // linha de assunto do e-mail; aqui o espaço vai para o argumento.

  const fund = fundamentacao(itens, tipo);
  if (fund.length > 0) {
    blocos.push(...fund);
  } else {
    // Sem análise, o ofício continua válido — só não pode fingir uma
    // fundamentação que não tem. O signatário preenche.
    blocos.push({
      tipo: "paragrafo",
      texto:
        "A presente manifestação decorre do exame da proposição e de seu impacto sobre " +
        "os direitos das pessoas por ela alcançadas.",
    });
  }

  if (analise?.clausula_petrea) {
    blocos.push({
      tipo: "paragrafo",
      texto:
        "Cumpre destacar que a matéria toca direito protegido pelo art. 60, §4º, da " +
        "Constituição Federal, o que recomenda exame de constitucionalidade prévio à deliberação.",
    });
  }
  if (analise?.vedacao_retrocesso) {
    blocos.push({
      tipo: "paragrafo",
      texto:
        "Registre-se, ainda, que a proposição reduz patamar de proteção social já " +
        "alcançado, hipótese que atrai o princípio da vedação do retrocesso.",
    });
  }

  if (observacoes?.trim()) {
    blocos.push({ tipo: "paragrafo", texto: observacoes.trim() });
  }

  blocos.push({ tipo: "paragrafo", texto: PEDIDO[tipo] });
  blocos.push({ tipo: "fecho", texto: "Respeitosamente," });
  blocos.push({
    tipo: "assinatura",
    texto: [remetente.nome, remetente.qualificacao, remetente.email]
      .filter(Boolean)
      .join("\n"),
  });

  return {
    titulo: `${p.identificacao} — ${ROTULO_TIPO[tipo]}`,
    destinatarios,
    blocos,
    assunto: referencia,
  };
}

interface MembroComissao {
  nome: string | null;
  email: string | null;
  partido: string | null;
  uf: string | null;
  papel: string | null;
}

/**
 * Destinatários sugeridos, na ordem em que fazem diferença.
 *
 * Quem decide a proposição AGORA é o colegiado onde ela está parada — a
 * mesa diretora da comissão (presidência + vice-presidências), não o
 * autor. Pedir para o autor de um PL aprovar o próprio projeto não serve
 * para nada: ele já decidiu, é por isso que apresentou. Antes deste
 * módulo saber quem compõe a comissão, o autor era a ÚNICA opção
 * oferecida — o bug que motivou esta reescrita.
 *
 * Só a mesa vem com `destaque: true` (pré-marcada no formulário). Os
 * demais titulares e o(s) autor(es) entram na lista para quem quiser
 * ampliar o envio, mas não pré-marcados: uma comissão pode ter 60+
 * titulares, e pré-marcar todos arriscaria virar disparo em massa sem o
 * usuário perceber — o mesmo motivo pelo qual o envio de e-mail deste app
 * é opt-in em primeiro lugar.
 */
export function sugerirDestinatarios(
  p: Proposicao,
  autores: Autor[],
  membrosComissao: MembroComissao[] = []
): Destinatario[] {
  const lista: Destinatario[] = [];
  const naComissao = p.orgao_atual ? ` da ${p.orgao_atual}` : "";

  const mesa = membrosComissao.filter((m) => (m.papel ?? "").includes("Presidente"));
  for (const m of mesa) {
    if (!m.nome) continue;
    lista.push({
      nome: m.nome,
      cargo: `${m.papel}${naComissao}`,
      email: m.email,
      partido: m.partido,
      uf: m.uf,
      destaque: true,
    });
  }

  const titulares = membrosComissao.filter((m) => m.papel === "Titular").slice(0, 8);
  for (const m of titulares) {
    if (!m.nome) continue;
    lista.push({
      nome: m.nome,
      cargo: `Deputado(a) Federal — membro${naComissao}`,
      email: m.email,
      partido: m.partido,
      uf: m.uf,
    });
  }

  // Cortesia/conhecimento, nunca alvo primário — ver docstring.
  for (const a of autores.slice(0, 3)) {
    if (!a.nome) continue;
    lista.push({
      nome: a.nome,
      cargo: "Autor(a) do projeto",
      email: a.email,
      partido: a.partido,
      uf: a.uf,
    });
  }

  return lista;
}
