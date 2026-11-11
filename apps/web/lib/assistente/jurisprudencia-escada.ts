/**
 * @file jurisprudencia-escada.ts
 * @description Degrau de CONTAGEM da jurisprudência: responde "quantos casos
 * de dano moral no Rio Doce?" com número medido, fonte e link para a lista.
 *
 * Papel no portal:
 * O assistente respondia "não reconheci um destino" e "nenhum documento com
 * esse termo" a perguntas de contagem, porque a busca dele cobria o índice de
 * documentos (leis e proposições), não o acervo de jurisprudência. Este módulo
 * fecha essa lacuna sem inventar número e sem mandar prosa para o modelo.
 *
 * Fonte dos dados:
 * `data/jurisprudencia-casos.json`, medido pela rotina de coleta do portal e
 * auditável no rodapé de `/jurisprudencia`. A data da medição viaja na
 * resposta (`geradoEm`) e aparece no texto.
 *
 * Decisões técnicas (e por que):
 * - **A contagem mora em uma tabela compacta, não no JSON de 58 MB.** Este
 *   módulo é importado por componentes de cliente (`SeuNono`, `ChatbotIa`,
 *   `/assistente`). Importar o acervo bruto aqui colocaria 58 MB no chunk do
 *   navegador — o mesmo modo de falha do `.cache` de 35,5 MiB que travou o
 *   deploy em 15/08 (AGENTS §5.1). O arquivo
 *   `jurisprudencia-contagens.json` guarda só total, polo e resultado por
 *   frente e por tema (~dezenas de KB), gerado por
 *   `scripts/gerar-contagens-jurisprudencia.mts`.
 * - **O teste recomputa tudo do acervo.** `medirContagens()` lê os casos e
 *   produz exatamente a tabela compacta; `jurisprudencia-escada.test.ts`
 *   compara os dois. Se a coleta mudar o acervo, o teste fica vermelho e
 *   obriga a regerar — número velho não passa calado.
 * - **Tema é rótulo do acervo, não sinônimo inventado.** Cada tema curado
 *   lista rótulos que existem em `caso.temas`; a contagem usa igualdade sem
 *   acento e sem caixa, a MESMA regra do filtro `tema` da página (ver
 *   `lib/jurisprudencia.ts`). Assim o número do cartão e a lista do link
 *   mostram o mesmo conjunto.
 * - **Só responde quando há sinal de contagem E um desastre nomeado.** Sem os
 *   dois, devolve `null` e a pergunta segue a escada/RAG — contar o acervo
 *   inteiro por engano seria pior que não responder.
 * - **"Polo vencedor" é quem ganhou a decisão, não quem processou.** O campo
 *   `polo` do acervo já é o vencedor (medido em 10/11/2026, ver
 *   `app/jurisprudencia/rotulos.tsx`); o texto diz isso em palavra comum
 *   porque a confusão é a leitura errada mais provável.
 */

import { semAcento } from "../busca/normalizar";
import contagensJson from "./jurisprudencia-contagens.json";
import type { CasoJurisprudencia } from "../jurisprudencia";

/** Frentes do acervo que o assistente sabe contar. `sumula` fica de fora. */
export type FrenteJurisprudencia = "riodoce" | "brumadinho" | "itatiaiaucu" | "dh" | "penal";

/** O que a pergunta pediu, depois de normalizada. */
export interface InterpretacaoJurisprudencial {
  frente: FrenteJurisprudencia;
  /** Id do tema curado (ex.: "dano moral"). Ausente = a frente inteira. */
  tema?: string;
  querContagem: boolean;
}

/** Contagem de um recorte: total e as duas quebras que o cartão mostra. */
export interface ContagemJurisprudencia {
  total: number;
  porPolo: Record<string, number>;
  porResultado: Record<string, number>;
}

/** Contagem de um tema dentro de uma frente. */
export interface ContagemTema extends ContagemJurisprudencia {
  /** Rótulo do acervo que o filtro `tema` da página recebe na URL. */
  rotulo: string;
}

/** Contagem de uma frente inteira, com os temas que têm caso. */
export interface ContagemFrente extends ContagemJurisprudencia {
  temas: Record<string, ContagemTema>;
}

export interface ArquivoContagens {
  geradoEm: string;
  fonte: string;
  frentes: Record<FrenteJurisprudencia, ContagemFrente>;
}

/** O cartão que a escada e a página `/assistente` exibem. */
export interface RespostaJurisprudencial extends ContagemJurisprudencia {
  texto: string;
  frente: FrenteJurisprudencia;
  /** Nome humano da frente, para o título "Jurisprudência: <frente>". */
  frenteNome: string;
  /** Nome humano do tema reconhecido, quando houver. */
  tema?: string;
  /** Rótulo exato do acervo usado na contagem e no link. */
  rotuloTema?: string;
  link: string;
  linkPainel: string;
  fonte: string;
  geradoEm: string;
}

const CONTAGENS = contagensJson as unknown as ArquivoContagens;

/** Rótulo humano de cada frente. O título do cartão usa este texto. */
export const NOMES_FRENTE_JURISPRUDENCIA: Record<FrenteJurisprudencia, string> = {
  riodoce: "Rio Doce",
  brumadinho: "Brumadinho",
  itatiaiaucu: "Itatiaiaçu (Serra Azul)",
  dh: "Direitos humanos",
  penal: "Penal",
};

const FRENTES: FrenteJurisprudencia[] = [
  "riodoce",
  "brumadinho",
  "itatiaiaucu",
  "dh",
  "penal",
];

/**
 * Nomes pelos quais a pergunta chama cada desastre.
 *
 * A ordem importa: a PRIMEIRA frente que casa responde. "Brumadinho" não
 * aparece em nenhuma expressão do Rio Doce, e vice-versa, mas uma pergunta que
 * cite os dois desastres precisa de uma escolha estável — e estável é a ordem
 * desta tabela, não a ordem das palavras na frase.
 */
const APELIDOS_FRENTE: { frente: FrenteJurisprudencia; termos: string[] }[] = [
  { frente: "riodoce", termos: ["rio doce", "mariana", "fundao", "samarco"] },
  { frente: "brumadinho", termos: ["brumadinho", "paraopeba"] },
  { frente: "itatiaiaucu", termos: ["itatiaiacu", "serra azul"] },
  { frente: "dh", termos: ["direitos humanos", "direito humano"] },
  { frente: "penal", termos: ["penal", "penais", "criminal", "criminais", "crime", "crimes"] },
];

/** Sinal explícito de contagem. "quantos" é o mais comum; "número de" vem escrito. */
const SINAL_CONTAGEM = /\b(quantos|quantas|quantidade de|numero de|contagem|total de)\b/;

/**
 * Temas curados, extraídos de `caso.temas` do próprio acervo.
 *
 * `rotulos` são os rótulos que EXISTEM no dado, escritos sem acento e em
 * minúsculo (a comparação é nessa forma). Vários por tema porque a coleta
 * gravou o mesmo assunto com mais de uma grafia — "auxílio emergencial" e
 * "auxílio financeiro emergencial", por exemplo. A tabela compacta guarda,
 * por frente, o rótulo com mais casos; o link usa esse rótulo, então a lista
 * não contradiz o número.
 *
 * `aliases` são as palavras que a PESSOA usa. Só apontam para um tema desta
 * tabela; nunca criam tema novo.
 */
export const TEMAS_JURISPRUDENCIA: {
  id: string;
  nome: string;
  rotulos: string[];
  aliases: string[];
}[] = [
  {
    id: "dano moral",
    nome: "dano moral",
    rotulos: ["dano moral"],
    aliases: ["dano moral", "danos morais"],
  },
  {
    id: "dano material",
    nome: "dano material",
    rotulos: ["dano material", "danos materiais"],
    aliases: ["dano material", "danos materiais"],
  },
  {
    id: "auxilio emergencial",
    nome: "auxílio emergencial",
    rotulos: [
      "auxilio emergencial",
      "auxilio financeiro emergencial",
      "prestacao emergencial",
      "prestacao mensal emergencial",
    ],
    aliases: ["auxilio emergencial", "auxilio financeiro emergencial", "afe", "prestacao emergencial"],
  },
  {
    id: "prescricao",
    nome: "prescrição",
    rotulos: [
      "prescricao",
      "prazo prescricional",
      "interrupcao da prescricao",
      "suspensao do prazo prescricional",
    ],
    aliases: ["prescricao", "prescricao do prazo", "prazo prescricional"],
  },
  {
    id: "onus sucumbenciais",
    nome: "honorários e custas",
    rotulos: ["onus sucumbenciais", "honorarios advocaticios", "honorarios sucumbenciais"],
    aliases: ["honorarios", "honorario", "custas", "sucumbencia", "sucumbenciais"],
  },
  {
    id: "legitimidade",
    nome: "legitimidade",
    rotulos: [
      "legitimidade passiva ad causam",
      "legitimidade passiva",
      "legitimidade ativa",
      "legitimidade ativa e passiva",
      "ilegitimidade passiva",
      "ilegitimidade ativa",
    ],
    aliases: ["legitimidade", "ilegitimidade"],
  },
  {
    id: "pericia",
    nome: "perícia",
    rotulos: ["prova pericial", "pericia", "laudo pericial"],
    aliases: ["pericia", "prova pericial", "laudo pericial"],
  },
  {
    id: "nexo causal",
    nome: "nexo causal",
    rotulos: ["nexo causal", "nexo de causalidade", "causalidade adequada"],
    aliases: ["nexo causal", "nexo de causalidade"],
  },
  {
    id: "coisa julgada",
    nome: "coisa julgada",
    rotulos: ["coisa julgada", "coisa julgada material"],
    aliases: ["coisa julgada"],
  },
  {
    id: "tap",
    nome: "TAP",
    rotulos: ["tap"],
    aliases: ["tap", "termo de ajustamento de conduta"],
  },
  {
    id: "lucros cessantes",
    nome: "lucros cessantes",
    rotulos: ["lucros cessantes"],
    aliases: ["lucros cessantes", "lucro cessante"],
  },
  {
    id: "dano ambiental",
    nome: "dano ambiental",
    rotulos: ["dano ambiental"],
    aliases: ["dano ambiental", "danos ambientais"],
  },
  {
    id: "onus da prova",
    nome: "ônus da prova",
    rotulos: ["onus da prova", "inversao do onus da prova", "distribuicao dinamica do onus da prova"],
    aliases: ["onus da prova", "inversao do onus"],
  },
  {
    id: "litigancia predatoria",
    nome: "litigância predatória",
    rotulos: ["litigancia predatoria"],
    aliases: ["litigancia predatoria", "litigancia de ma-fe", "ma-fe"],
  },
  {
    id: "residencia",
    nome: "residência",
    rotulos: ["residencia"],
    aliases: ["residencia", "comprovacao de residencia"],
  },
  {
    id: "documentacao",
    nome: "documentação",
    rotulos: ["documentacao"],
    aliases: ["documentacao"],
  },
  {
    id: "pesca",
    nome: "pesca",
    rotulos: ["pesca", "pesca amadora", "pesca de subsistencia"],
    aliases: ["pesca", "pescador", "pescadores"],
  },
  {
    id: "ptr",
    nome: "PTR",
    rotulos: ["ptr"],
    aliases: ["ptr", "programa de transferencia de renda"],
  },
  {
    id: "prova testemunhal",
    nome: "prova testemunhal",
    rotulos: ["prova testemunhal"],
    aliases: ["prova testemunhal", "testemunhal"],
  },
  {
    id: "responsabilidade civil",
    nome: "responsabilidade civil",
    rotulos: ["responsabilidade civil", "responsabilidade civil objetiva"],
    aliases: ["responsabilidade civil", "responsabilidade objetiva"],
  },
];

/** Rótulo humano do polo vencedor. "indeterminado" é ausência de classificação. */
const NOMES_POLO: Record<string, string> = {
  empresa: "empresa (ré)",
  atingido: "atingido (autor)",
  parcial: "parcial",
  indeterminado: "não classificado",
  reu: "réu (defesa)",
  mp: "Ministério Público (acusação)",
};

/** Forma de comparação de rótulo: sem acento, sem caixa, sem espaço nas pontas. */
function chaveRotulo(texto: string): string {
  return semAcento(texto ?? "").trim();
}

/**
 * Monta a tabela compacta a partir do acervo inteiro.
 *
 * É a função que o gerador chama e a que o teste usa para conferir a tabela
 * publicada — uma implementação só, para não existirem dois números.
 *
 * Passa por cada tema de cada caso uma vez e acumula por (frente, tema,
 * rótulo). No fim, para cada tema e frente, fica o rótulo com mais casos:
 * é ele que a URL consegue reproduzir por igualdade exata.
 */
export function medirContagens(
  casos: readonly CasoJurisprudencia[]
): Record<FrenteJurisprudencia, ContagemFrente> {
  const frentes = {} as Record<FrenteJurisprudencia, ContagemFrente>;
  for (const frente of FRENTES) {
    frentes[frente] = { total: 0, porPolo: {}, porResultado: {}, temas: {} };
  }
  const candidatos = new Map<string, ContagemJurisprudencia>();

  for (const caso of casos) {
    const frente = caso.frente as FrenteJurisprudencia;
    if (!frentes[frente]) continue;
    somar(frentes[frente], caso);

    const rotulos = new Set((caso.temas ?? []).map(chaveRotulo));
    for (const tema of TEMAS_JURISPRUDENCIA) {
      for (const rotulo of tema.rotulos) {
        if (!rotulos.has(rotulo)) continue;
        const chave = `${frente}\u0000${tema.id}\u0000${rotulo}`;
        const acumulado = candidatos.get(chave) ?? { total: 0, porPolo: {}, porResultado: {} };
        somar(acumulado, caso);
        candidatos.set(chave, acumulado);
      }
    }
  }

  for (const tema of TEMAS_JURISPRUDENCIA) {
    for (const frente of FRENTES) {
      let melhor: { rotulo: string; contagem: ContagemJurisprudencia } | null = null;
      for (const rotulo of tema.rotulos) {
        const contagem = candidatos.get(`${frente}\u0000${tema.id}\u0000${rotulo}`);
        if (!contagem) continue;
        if (!melhor || contagem.total > melhor.contagem.total) melhor = { rotulo, contagem };
      }
      if (!melhor) continue;
      frentes[frente].temas[tema.id] = { rotulo: melhor.rotulo, ...melhor.contagem };
    }
  }

  return frentes;
}

/** Soma um caso no balde. Polo e resultado vazios ganham nome legível. */
function somar(balde: ContagemJurisprudencia, caso: CasoJurisprudencia): void {
  balde.total += 1;
  const polo = chaveRotulo(caso.polo) || "indeterminado";
  const resultado = chaveRotulo(caso.resultado) || "nao consta";
  balde.porPolo[polo] = (balde.porPolo[polo] ?? 0) + 1;
  balde.porResultado[resultado] = (balde.porResultado[resultado] ?? 0) + 1;
}

/**
 * Lê a pergunta e devolve frente + tema, ou `null`.
 *
 * Devolve `null` — e a pergunta segue a escada — quando falta QUALQUER um dos
 * dois sinais: palavra de contagem e nome de desastre. Assim "quantos
 * vereadores Betim tem" e "o que é dano moral" não caem aqui.
 *
 * @param pergunta texto como a pessoa digitou.
 * @returns interpretação pronta para `responderJurisprudencia`, ou `null`.
 */
export function interpretarPerguntaJurisprudencial(
  pergunta: string
): InterpretacaoJurisprudencial | null {
  const q = chaveRotulo(pergunta ?? "");
  if (!q || !SINAL_CONTAGEM.test(q)) return null;

  const frente = APELIDOS_FRENTE.find((item) =>
    item.termos.some((termo) => contemTermo(q, termo))
  )?.frente;
  if (!frente) return null;

  const tema = temaDaPergunta(q);
  return { frente, tema: tema?.id, querContagem: true };
}

/**
 * Responde a pergunta de contagem com número do acervo, quebra e link.
 *
 * @param pergunta texto como a pessoa digitou.
 * @returns cartão pronto, ou `null` quando a pergunta não é de contagem sobre
 *          um dos desastres do acervo.
 */
export function responderJurisprudencia(pergunta: string): RespostaJurisprudencial | null {
  const interpretacao = interpretarPerguntaJurisprudencial(pergunta);
  if (!interpretacao) return null;

  const arquivo = CONTAGENS;
  const frente = arquivo.frentes[interpretacao.frente];
  const temaCurado = interpretacao.tema
    ? TEMAS_JURISPRUDENCIA.find((item) => item.id === interpretacao.tema)
    : undefined;
  const contagemTema = interpretacao.tema ? frente.temas[interpretacao.tema] : undefined;

  const contagem: ContagemJurisprudencia = temaCurado
    ? (contagemTema ?? { total: 0, porPolo: {}, porResultado: {} })
    : frente;
  const rotuloTema = temaCurado
    ? (contagemTema?.rotulo ?? temaCurado.rotulos[0])
    : undefined;
  const frenteNome = NOMES_FRENTE_JURISPRUDENCIA[interpretacao.frente];
  const linkPainel =
    interpretacao.frente === "penal" ? "/jurisprudencia/penal" : "/jurisprudencia";

  return {
    texto: montarTexto({
      pergunta,
      frente: interpretacao.frente,
      frenteNome,
      temaNome: temaCurado?.nome,
      contagem,
      geradoEm: arquivo.geradoEm,
    }),
    total: contagem.total,
    porPolo: contagem.porPolo,
    porResultado: contagem.porResultado,
    frente: interpretacao.frente,
    frenteNome,
    tema: temaCurado?.nome,
    rotuloTema,
    link: montarLink(interpretacao.frente, rotuloTema),
    linkPainel,
    fonte: arquivo.fonte,
    geradoEm: arquivo.geradoEm,
  };
}

/** Data ISO vira dd/mm/aaaa — o formato que o leitor brasileiro confere. */
function formatarData(iso: string): string {
  const [ano, mes, dia] = (iso ?? "").slice(0, 10).split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

/** Monta o link da lista com o MESMO filtro que produziu a contagem. */
function montarLink(frente: FrenteJurisprudencia, rotuloTema?: string): string {
  // A página penal tem acervo e filtros próprios (tribunal, ano, q): `tema`
  // não é parâmetro dela, e mandar `frente=penal` para `/jurisprudencia`
  // devolveria lista vazia, porque a página de desastres esconde o penal.
  if (frente === "penal") return "/jurisprudencia/penal";
  const partes = [`frente=${encodeURIComponent(frente)}`];
  if (rotuloTema) partes.push(`tema=${encodeURIComponent(rotuloTema)}`);
  return `/jurisprudencia?${partes.join("&")}#lista`;
}

/** Texto do cartão: 3 ou 4 frases, caixa de frase, sem adjetivo não medido. */
function montarTexto(args: {
  pergunta: string;
  frente: FrenteJurisprudencia;
  frenteNome: string;
  temaNome?: string;
  contagem: ContagemJurisprudencia;
  geradoEm: string;
}): string {
  const { pergunta, frente, frenteNome, temaNome, contagem, geradoEm } = args;
  const perguntaChave = chaveRotulo(pergunta);
  const total = `${contagem.total.toLocaleString("pt-BR")} ${
    contagem.total === 1 ? "caso" : "casos"
  }`;
  const data = formatarData(geradoEm);
  const recorte = temaNome
    ? `da frente ${frenteNome} com o tema “${temaNome}”`
    : `da frente ${frenteNome}`;

  const abertura =
    contagem.total > 0
      ? `O acervo de jurisprudência do portal tem ${total} ${recorte}, medido em ${data}.`
      : `O acervo de jurisprudência do portal não tem caso ${recorte} na medição de ${data}.`;

  const polos = listarContagem(contagem.porPolo, NOMES_POLO);
  const vencedor =
    polos.length > 0
      ? `Polo vencedor é quem ganhou a decisão, não quem processou: ${polos}.`
      : "Polo vencedor é quem ganhou a decisão, não quem processou.";

  const duasLeituras = /favorav/.test(perguntaChave) && /atingid/.test(perguntaChave)
    ? `Lido como “favorável aos atingidos”, o recorte tem duas leituras: ${
        contagem.porPolo.atingido ?? 0
      } ${(contagem.porPolo.atingido ?? 0) === 1 ? "caso tem" : "casos têm"} o atingido como polo vencedor e ${
        contagem.porResultado.provido ?? 0
      } ${(contagem.porResultado.provido ?? 0) === 1 ? "tem" : "têm"} resultado provido.`
    : "";

  // A página penal filtra por tribunal, ano e processo — não por tema. Prometer
  // "mesmo filtro" ali seria falso quando a pergunta trouxe tema.
  const fecho =
    frente === "penal"
      ? "O link abre a lista da frente penal no portal."
      : "O link abre a lista com o mesmo filtro desta contagem.";

  return [abertura, vencedor, duasLeituras, fecho].filter(Boolean).join(" ");
}

/** "empresa (ré) 148; parcial 33" — do maior para o menor, sem percentual. */
function listarContagem(
  contagem: Record<string, number>,
  nomes: Record<string, string>
): string {
  return Object.entries(contagem)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([chave, n]) => `${nomes[chave] ?? chave} ${n.toLocaleString("pt-BR")}`)
    .join("; ");
}

/** Tema reconhecido na pergunta, com os aliases mais longos primeiro. */
function temaDaPergunta(q: string): { id: string; nome: string } | null {
  const aliases = TEMAS_JURISPRUDENCIA.flatMap((tema) =>
    tema.aliases.map((alias) => ({ alias: chaveRotulo(alias), tema }))
  ).sort((a, b) => b.alias.length - a.alias.length);

  const achado = aliases.find(({ alias }) => contemTermo(q, alias));
  return achado ? { id: achado.tema.id, nome: achado.tema.nome } : null;
}

/**
 * Testa palavra ou expressão inteira, não pedaço de palavra.
 *
 * `\b` é o que impede "afe" casar dentro de "afetado" e "tap" dentro de
 * "tapa". Hífen entra escapado porque "litigância de má-fé" é alias legítimo.
 */
function contemTermo(texto: string, termo: string): boolean {
  const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escapado}([^a-z0-9]|$)`).test(texto);
}
