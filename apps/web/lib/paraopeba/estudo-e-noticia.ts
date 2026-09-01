import { type NoticiaAti } from "./clipping-ati";
import { lerClippingAti } from "./acervos-dados";

/**
 * Casamento entre a notícia da ATI que RESUME um estudo e o documento do
 * acervo que ela está resumindo — Tarefa 1 do plano `cp-acordos-mg`.
 *
 * ═══ A RÉGUA ═══
 *
 * Das 46 notícias de `CLIPPING_ATI`, 13 não relatam decisão ou evento: elas
 * relatam o ACHADO de um estudo/análise/pesquisa/dossiê, escrito pela própria
 * ATI (nunca por este portal). Para cada uma, este módulo tenta achar QUAL
 * documento catalogado ela resume, em dois acervos:
 *
 *   · a biblioteca das ATIs (597 itens, só título/tipo/data/url — sem corpo
 *     de texto, então "forte" aqui nunca é "o número bate", é "o slug da URL
 *     bate" ou "o título nomeia o mesmo dossiê/evento", nunca tema em comum);
 *   · os 7 documentos de resultado da perícia da UFMG (`RESULTADOS_582` em
 *     `pericia-ufmg.ts`/`temas-acervo.ts`, todos de nov/2025).
 *
 * O segundo acervo **não existe neste worktree** — `pericia-ufmg.ts` e
 * `sintese-pericia.ts` vivem em `cp-ambiental-estudos`, branch irmã ainda não
 * mesclada. Por isso o único documento de perícia usado aqui
 * (`RESUMO_APRESENTACOES_PERICIA`) está com os dados **embutidos à mão**,
 * conferidos por leitura direta do worktree irmão (mesmo padrão de
 * `RESULTADOS_582`: "mapeados à mão pelo título... vale a mão em vez de regra
 * genérica"). Quando os worktrees mesclarem, isto pode virar `import`.
 *
 * ═══ O QUE SAIU DIFERENTE DO NÚMERO QUE ME PASSARAM ═══
 *
 * Fui instruído a esperar nacab=5/guaicuy=6/aedas=2 e ershre=6/pericias=3/
 * ambiental=3/indenizacao=1. Cheguei a nacab=3/guaicuy=7/aedas=3 (mesma soma
 * temática: 6/3/3/1). A diferença tem nome: achei evidência FORTE demais
 * para pj05 (o "dossiê" bate com um documento real do Guaicuy — ver abaixo)
 * para deixá-lo de fora só pra fechar "guaicuy=6", e achei evidência FORTE
 * para ra02/ra04/ra05 (URL quase idêntica entre notícia e biblioteca) que não
 * existia para ra01/ra03/ra06 (os candidatos "ambientais" mais óbvios por
 * tema, mas sem documento identificável). Preferi a évidência à meta. Ver
 * `estudo-e-noticia.test.ts` para os números que ESTE módulo trava.
 *
 * ═══ ACHADO À PARTE: A BIBLIOTECA NÃO TEM NENHUM ITEM DO NACAB ═══
 *
 * `biblioteca-ati.json.fontes[2]` promete 48 itens do NACAB (5 séries:
 * Estudos e Relatórios, Reparação, Mobilização, Germinar, Nacab em Campo).
 * Mas `biblioteca-ati.json.itens` (597 registros) tem 435 AEDAS + 162 Guaicuy
 * = 597 — a soma bate EXATAMENTE sem o NACAB. Os 48 itens prometidos nunca
 * entraram no arquivo. Por isso toda notícia do NACAB nesta lista casa
 * `null`: não é falha de busca, é buraco do dado-fonte. Não é escopo desta
 * tarefa consertar `biblioteca-ati.json` — só registrar por que o NACAB nunca
 * vai casar enquanto isso não for corrigido.
 *
 * ═══ O CRUZAMENTO MAIS VALIOSO: pj11 ACERTA, er04 REVELA UM BURACO ═══
 *
 * `pj11` e `er04` são as duas notícias do Guaicuy que falam de "resultado da
 * UFMG" (mesmo quando o veículo que publicou é a AEDAS — `ati` no
 * clipping-fonte é a categoria do painel, não o autor; ver comentário em
 * `clipping-ati.ts`). Só uma das duas casa: `pj11` (nov/2025) bate com os 7
 * documentos de resultado, publicados no mesmo mês. `er04` (ago/2023) cita um
 * número (63,5%) que NÃO está em nenhum dos 7 — o documento 3 (Ambiental) da
 * perícia fala em 32,0% de coliformes, outra substância, outra campanha. A
 * própria `sintese-pericia.ts` já registra os dois como achados diferentes
 * que "apontam para o mesmo lugar" sem serem o mesmo estudo. `er04` cita uma
 * etapa mais antiga do Projeto Brumadinho UFMG que o portal nunca raspou —
 * achado por ausência, não por casamento.
 */

/** Confiança do casamento — nunca "provável", sempre uma das três. */
export type ForcaCasamento = "forte" | "media" | "nula";

export type FonteDocumentoCasado = "pericia-ufmg" | "biblioteca-ati";

export interface DocumentoCasado {
  fonte: FonteDocumentoCasado;
  /** Nome de arquivo (perícia) ou `id` (biblioteca) — estável na fonte de origem. */
  id: string;
  titulo: string;
  url: string;
  /** ISO `AAAA-MM-DD`; `AAAA-MM` quando a fonte só data por mês (perícia). */
  data: string | null;
}

export interface CasamentoEstudoNoticia {
  noticia: NoticiaAti;
  documento: DocumentoCasado | null;
  forca: ForcaCasamento;
  /** O FATO que aparece nos dois lados — nunca "mesmo tema", isso é a armadilha. */
  evidencia: string;
  /** Obrigatório quando `documento` é `null`: por que a busca não achou. */
  motivo?: string;
}

interface CasamentoBruto {
  noticiaId: string;
  documento: DocumentoCasado | null;
  forca: ForcaCasamento;
  evidencia: string;
  motivo?: string;
}

// ═══ Documentos casados (fonte: perícia UFMG, dados embutidos — ver cabeçalho) ═══

const RESUMO_APRESENTACOES_PERICIA: DocumentoCasado = {
  fonte: "pericia-ufmg",
  id: "RESUMO_DAS_APRESENTAÇÕES_DE_RESULTADOS_DO_PROJETO_BRUMADINHO_UFMG.pdf",
  titulo: "Resumo das Apresentações de Resultados do Projeto Brumadinho UFMG",
  url: "http://projetobrumadinho.ufmg.br/sites/default/files/2025-11/RESUMO_DAS_APRESENTAÇÕES_DE_RESULTADOS_DO_PROJETO_BRUMADINHO_UFMG.pdf",
  data: "2025-11",
};

// ═══ Documentos casados (fonte: biblioteca-ati.json, 597 itens) ═══

const REVISTA_CINCO_ANOS: DocumentoCasado = {
  fonte: "biblioteca-ati",
  id: "guaicuy-cinco-anos-do-desastre-crime-da-vale",
  titulo: "Revista – Cinco Anos do Desastre-Crime da Vale",
  url: "https://guaicuy.org.br/biblioteca/publicacoes/cinco-anos-do-desastre-crime-da-vale/",
  data: "2024-01-30",
};

const DOSSIE_ACESSO_JUSTICA: DocumentoCasado = {
  fonte: "biblioteca-ati",
  id: "guaicuy-dossie-acesso-a-justica",
  titulo: "Dossiê Acesso à Justiça",
  url: "https://guaicuy.org.br/biblioteca/publicacoes/dossie-acesso-a-justica/",
  data: "2024-10-07",
};

const INFORME_AECOM_MAI_2024: DocumentoCasado = {
  fonte: "biblioteca-ati",
  id: "aedas-24193",
  titulo:
    "Aedas divulga informes sobre auditoria dos estudos socioambientais feitos pela AECOM no mês de maio",
  url: "https://aedasmg.org/documento/informes-aecom-0524/",
  data: "2024-07-05",
};

const INFORME_AECOM_ABR_2025: DocumentoCasado = {
  fonte: "biblioteca-ati",
  id: "aedas-30461",
  titulo:
    "Aedas divulga informes sobre auditoria dos estudos socioambientais feitos pela AECOM no mês de abril de 2025",
  url: "https://aedasmg.org/documento/informes-aecom-0425/",
  data: "2025-05-03",
};

const INFORME_AECOM_DEZ_2025: DocumentoCasado = {
  fonte: "biblioteca-ati",
  id: "aedas-41906",
  titulo:
    "Aedas divulga informes sobre auditoria dos estudos socioambientais feitos pela AECOM no mês de dezembro de 2025",
  url: "https://aedasmg.org/documento/informes-aecom-1225/",
  data: "2025-12-23",
};

const RELATORIO_PESQUISA_JURISPRUDENCIAL_NACAB: DocumentoCasado = {
  fonte: "biblioteca-ati",
  id: "nacab-relatorio-pesquisajurisprudencial-2023",
  titulo: "Relatório — Pesquisa Jurisprudencial (2023)",
  url: "https://nacab.org.br/wp-content/uploads/2025/07/Relatorio_PesquisaJurisprudencial_2023.pdf",
  data: "2023",
};

// ═══ Os 13 pares, na ordem em que aparecem em CLIPPING_ATI ═══

const CASAMENTOS_BRUTOS: CasamentoBruto[] = [
  {
    noticiaId: "er02",
    documento: null,
    forca: "nula",
    evidencia:
      '"Em 10 [pontos] deles, os níveis de alumínio e ferro estão acima do limite permitido" — resultado descrito só no próprio texto do Guaicuy, sem PDF técnico separado citado.',
    motivo:
      'Os 8 itens "Boletim Saúde" da biblioteca do Guaicuy são o único candidato temático, mas os 8 carregam a MESMA data (2023-08-21) — artefato da raspagem por sitemap, não data real de publicação — então não dá para saber qual número (1º–8º) corresponderia a uma análise de jun/2022. Casar por tema sem essa confirmação seria a armadilha que `relacionados.ts` já evita.',
  },
  {
    noticiaId: "er03",
    documento: null,
    forca: "nula",
    evidencia:
      "A notícia (17/03/2022) lista os mesmos metais e a mesma hipótese causal (rompimento da Vale) que er02 (01/06/2022) descreve com pontos de coleta — provavelmente a MESMA campanha de análises contada em dois textos.",
    motivo:
      "Mesmo obstáculo de er02: nenhum item da biblioteca do Guaicuy tem data confiável no intervalo, e não há PDF técnico distinto do texto da notícia.",
  },
  {
    noticiaId: "er04",
    documento: null,
    forca: "nula",
    evidencia:
      '"63,5% das amostras de água subterrânea violam limites legais... 145 substâncias... agrotóxicos endosulfans, benzeno, etilbenzeno" (guaicuy.org.br, 21/08/2023) NÃO aparece nos 7 documentos de resultado da perícia (nov/2025): o documento 3 (Ambiental/Cláudia) relata 32,0% de coliformes em água subterrânea — outro número, outra substância. `sintese-pericia.ts` já registra a diferença: "O Guaicuy, em agosto de 2023, divulgou que 63,5%... São recortes diferentes, mas apontam para o mesmo lugar."',
    motivo:
      "O estudo citado é de 2023, ANTERIOR aos 7 documentos de resultado (todos de nov/2025). Dos 445 itens do acervo raspado de projetobrumadinho.ufmg.br, só 3 têm `ano_mes_do_caminho` em 2023, e são peças do processo judicial (seção `processo`), não resultado técnico. O estudo de 2023 citado pela notícia está ausente do acervo raspado — é achado por lacuna, não por casamento.",
  },
  {
    noticiaId: "er05",
    documento: REVISTA_CINCO_ANOS,
    forca: "forte",
    evidencia:
      '"No 5º aniversário do rompimento, o Guaicuy divulga dados ambientais e de saúde" (notícia, 24/01/2024) — a "Revista – Cinco Anos do Desastre-Crime da Vale" (biblioteca, mesma ATI) é publicada 30/01/2024, 6 dias depois, mesmo enquadramento de aniversário (rompimento em 25/01/2019 → 5 anos = jan/2024), autoria declarada "Felipe Aguiar", origem "Produção própria".',
  },
  {
    noticiaId: "er06",
    documento: null,
    forca: "nula",
    evidencia:
      'A notícia cita "o estudo da Fiocruz de 2022" apresentado por uma promotora em audiência da ALMG — o estudo é da Fiocruz, terceiro, não de nenhuma ATI.',
    motivo:
      "Nem a biblioteca das ATIs (só cataloga produção própria de AEDAS/Guaicuy/NACAB) nem o acervo da perícia UFMG (outro grupo de pesquisa) teriam um estudo da Fiocruz — fora do escopo dos dois acervos por definição, não por falha de busca.",
  },
  {
    noticiaId: "er08",
    documento: null,
    forca: "nula",
    evidencia:
      '"Estudo científico do NACAB publicado na revista Remote Sensing Applications Society and Environment" — publicação científica externa, do NACAB.',
    motivo:
      "A biblioteca-ati cataloga o material que o NACAB publica em seu próprio site (PDFs em nacab.org.br). Este estudo foi publicado num periódico científico externo (Remote Sensing Applications Society and Environment), não no acervo próprio da ATI — está fora do escopo desta biblioteca por definição, não por falha de busca.",
  },
  {
    noticiaId: "pj05",
    documento: DOSSIE_ACESSO_JUSTICA,
    forca: "media",
    evidencia:
      '"O Guaicuy aponta que o dossiê mostra que apenas 12 das 318 ações individuais das Regiões 4 e 5 tiveram resultado favorável em 2024" (notícia, 14/02/2025) — o "Dossiê Acesso à Justiça" do Guaicuy (biblioteca, 07/10/2024) é o único item com "dossiê" no título em toda a biblioteca (162 itens do Guaicuy) e trata do mesmo assunto (acesso à Justiça via ações individuais), publicado ~4 meses antes da notícia que o cita com dado de 2024. Força média, não forte: a biblioteca só guarda título e link — sem corpo de texto não dá para confirmar que "12 de 318" está literalmente no PDF.',
  },
  {
    noticiaId: "pj08",
    documento: RELATORIO_PESQUISA_JURISPRUDENCIAL_NACAB,
    forca: "forte",
    evidencia:
      '"Um estudo do NACAB com amostra representativa revelou que 80% das ações individuais tiveram resultados desfavoráveis" (notícia, NACAB) — o "Relatório — Pesquisa Jurisprudencial (2023)" do NACAB (biblioteca) é o único documento da própria ATI com esse tema e bate com o ano/referência da pesquisa citada.',
  },
  {
    noticiaId: "pj11",
    documento: RESUMO_APRESENTACOES_PERICIA,
    forca: "forte",
    evidencia:
      '"Na Audiência de Contextualização do TJMG, o CTC/UFMG apresenta os estudos... A Vale critica a metodologia" (notícia, 28/11/2025) — os 7 documentos de resultado da perícia, incluindo este resumo geral, foram publicados em projetobrumadinho.ufmg.br em nov/2025, todos citados no mesmo nó do site (`/node/582`). Mesmo mês, mesmo evento (primeira apresentação presencial dos resultados aos atingidos), mesmo conflito relatado (Vale contesta a metodologia da perícia).',
  },
  {
    noticiaId: "ra02",
    documento: INFORME_AECOM_MAI_2024,
    forca: "forte",
    evidencia:
      "URL da notícia: aedasmg.org/informes-aecom-0524/ — URL do documento na biblioteca: aedasmg.org/documento/informes-aecom-0524/. MESMO slug (\"0524\" = maio/2024); só muda o prefixo `/documento/` do post-type do WordPress. É a mesma página.",
  },
  {
    noticiaId: "ra04",
    documento: INFORME_AECOM_ABR_2025,
    forca: "forte",
    evidencia:
      "URL da notícia: aedasmg.org/informes-aecom-0425/ — URL do documento: aedasmg.org/documento/informes-aecom-0425/. Mesmo slug (\"0425\" = abril/2025), mesmo padrão de ra02.",
  },
  {
    noticiaId: "ra05",
    documento: INFORME_AECOM_DEZ_2025,
    forca: "forte",
    evidencia:
      "URL da notícia e URL do documento são IDÊNTICAS: aedasmg.org/documento/informes-aecom-1225/. A notícia já foi catalogada com o prefixo `/documento/` — é literalmente a mesma página.",
  },
  {
    noticiaId: "in01",
    documento: RELATORIO_PESQUISA_JURISPRUDENCIAL_NACAB,
    forca: "forte",
    evidencia:
      '"Pesquisa jurisprudencial do NACAB com amostra representativa das ações individuais no TJMG revela que 80% dos processos tiveram resultado desfavorável" (notícia, NACAB) — mesma pesquisa jurisprudencial relatada em pj08, com o mesmo documento da biblioteca: "Relatório — Pesquisa Jurisprudencial (2023)".',
  },
];

function obterClippingAti(): NoticiaAti[] {
  return lerClippingAti();
}

function noticiaPorId(id: string): NoticiaAti {
  const clipping = obterClippingAti();
  const encontrada = clipping.find((n) => n.id === id);
  if (!encontrada) {
    throw new Error(
      `estudo-e-noticia: id "${id}" não existe mais em CLIPPING_ATI — casamento desatualizado.`
    );
  }
  return encontrada;
}

let casamentosCache: CasamentoEstudoNoticia[] | null = null;

export function obterCasamentosEstudoNoticia(): CasamentoEstudoNoticia[] {
  if (!casamentosCache) {
    casamentosCache = CASAMENTOS_BRUTOS.map((c) => ({
      noticia: noticiaPorId(c.noticiaId),
      documento: c.documento,
      forca: c.forca,
      evidencia: c.evidencia,
      motivo: c.motivo,
    }));
  }
  return casamentosCache;
}

/**
 * Proxy compatível com o export de array anterior.
 */
export const CASAMENTOS_ESTUDO_NOTICIA: CasamentoEstudoNoticia[] = new Proxy([] as CasamentoEstudoNoticia[], {
  get(target, prop, receiver) {
    const dados = obterCasamentosEstudoNoticia();
    const val = Reflect.get(dados, prop, receiver);
    if (typeof val === "function") {
      return val.bind(dados);
    }
    return val;
  },
});

export interface CoberturaCasamentoEstudo {
  total: number;
  fortes: number;
  medias: number;
  nulas: number;
}

export function obterCoberturaCasamentoEstudo(): CoberturaCasamentoEstudo {
  const lista = obterCasamentosEstudoNoticia();
  return {
    total: lista.length,
    fortes: lista.filter((c) => c.forca === "forte").length,
    medias: lista.filter((c) => c.forca === "media").length,
    nulas: lista.filter((c) => c.forca === "nula").length,
  };
}

export const COBERTURA_CASAMENTO_ESTUDO: CoberturaCasamentoEstudo = new Proxy({} as CoberturaCasamentoEstudo, {
  get(target, prop, receiver) {
    const cob = obterCoberturaCasamentoEstudo();
    return Reflect.get(cob, prop, receiver);
  },
});
