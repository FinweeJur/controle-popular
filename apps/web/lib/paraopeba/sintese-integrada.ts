import {
  TEMA_AJRI_LABEL,
  TEMA_AJRI_ORDEM,
  type TemaAjri,
} from "./auditoria-ajri";
import { bibliotecaAti, type AtiBiblioteca, type ItemBiblioteca } from "./biblioteca";
import { CASAMENTOS_ESTUDO_NOTICIA, type CasamentoEstudoNoticia, type DocumentoCasado } from "./estudo-e-noticia";
import { ESTUDOS_PERICIA_COM_TEMA, RESULTADOS_PERICIA, type EstudoPericiaComTema } from "./pericia-ufmg";
import { lerSinteseAjri } from "./sintese-ajri-dados";

/** Sinônimo — dado agora no loader server-only. */
const SINTESE_AJRI = lerSinteseAjri();
import { temasAjriDoItemBiblioteca } from "./temas-ati";

/**
 * A análise integrada de `/paraopeba/analise` — cruza os 16 eixos temáticos
 * da síntese da auditoria AECOM (`sintese-ajri.ts`) com o que a perícia
 * judicial da UFMG mediu (`temas-acervo.ts`/`pericia-ufmg.ts`) e com o que as
 * ATIs publicaram sobre o mesmo assunto (`temas-ati.ts`), sempre mantendo as
 * três vozes IDENTIFICADAS E SEPARADAS — nunca fundidas num parágrafo só.
 *
 * ═══ A PONTE QUE FALTAVA: EIXO (TEXTO LIVRE) → TemaAjri (VOCABULÁRIO FECHADO) ═══
 *
 * `sintese-ajri.ts` tem 16 eixos com TÍTULO EM TEXTO LIVRE (gerado de um
 * `.md`), não um `TemaAjri`. `temas-acervo.ts` e `temas-ati.ts` já ligam
 * perícia e biblioteca das ATIs a `TemaAjri` — o vocabulário fechado de 25
 * temas que a própria AECOM usa para marcar os 467 documentos do acervo
 * (`auditoria-ajri.ts`). Faltava o elo do meio. `EIXO_PARA_TEMA_AJRI`, abaixo,
 * é esse elo: para cada um dos 16 títulos, quais `TemaAjri` descrevem O MESMO
 * EIXO TÉCNICO — a mesma régua que `temas-ati.ts` já aplica ("nunca por
 * aparecerem juntos com frequência ou por 'parecerem' relacionados").
 *
 * Nem todo eixo ganha um `TemaAjri`. Dois motivos, os mesmos que
 * `temas-ati.ts` já usa para deixar entrada `[]`:
 *
 *  · **Sem equivalente no vocabulário de 25 temas da AECOM** — "Buscas por
 *    vítimas" e "Regularização fundiária, desapropriação e liberação de
 *    áreas" não têm tema correspondente (conferido: nenhum dos 25 `TemaAjri`
 *    descreve o mesmo assunto). É o próprio vocabulário da auditoria que não
 *    tem essa caixa — não uma omissão deste módulo.
 *  · **Eixo de PROCESSO/META, não de assunto técnico** — "Pendências em
 *    aberto", "Recomendações da AECOM", "Desafios estruturais", "Análises
 *    numéricas e estatísticas" e "Avanços e conclusões positivas" descrevem
 *    COMO a auditoria acompanha (o quê foi prometido, quantas vezes foi
 *    adiado, se o veredito foi satisfatório), atravessando dezenas de
 *    assuntos técnicos ao mesmo tempo — igual ao "Gestão" e ao "Projetos
 *    Comunitários" que `temas-ati.ts` deixa sem mapa pelo mesmo motivo.
 *
 * Quando um eixo fica sem `TemaAjri`, `cobertura.temTemaAjri` é `false` e
 * `quaisFaltam` diz que a ponte não existe — frase DIFERENTE de "as outras
 * fontes não cobrem isso". As duas coisas parecem a mesma frase e não são: a
 * primeira é limite deste cruzamento, a segunda seria uma afirmação sobre o
 * que a perícia e as ATIs escreveram. Confundir as duas é a mesma armadilha
 * de insinuação que `AGENTS.md` (seção "regra editorial") já veta.
 *
 * ═══ CO-OCORRÊNCIA TEMÁTICA NÃO É CAUSALIDADE ═══
 *
 * Auditoria e perícia (ou ATI) falarem do mesmo `TemaAjri` dentro de um eixo
 * não quer dizer que uma respondeu à outra, que os números concordam, ou que
 * qualquer uma comentou o achado da outra. `SINTESE_PERICIA` (em
 * `sintese-pericia.ts`) já registra isso com rigor para a perícia como um
 * todo: "a perícia mede o dano já ocorrido... a auditoria mede o andamento
 * das obras... as duas quase nunca falam do mesmo objeto". Este módulo NÃO
 * reabre essa comparação — ele só diz "estes documentos usam a mesma
 * etiqueta temática", que é uma afirmação bem mais fraca e cada trecho
 * continua rotulado com a fonte que o escreveu.
 *
 * ═══ O QUE `EIXO_PARA_TEMA_AJRI` NÃO CAPTURA, E POR QUE ISSO VIRA DADO ═══
 *
 * Dois `TemaAjri` concentram a MAIOR fatia do que perícia e ATIs marcam, e
 * nenhum dos dois vira eixo aqui:
 *
 *  · `plano-de-reparacao` — 106 dos 238 itens com tema da biblioteca das ATIs
 *    (medido 21/08/2026; a maioria vem do rótulo livre mais genérico do
 *    acervo, "Socioambiental Paraopeba", 103 itens) e 10 dos 21 documentos
 *    com tema da perícia (as 9 "Apresentação para as partes" + o resumo
 *    geral). É o "eixo guarda-chuva": tudo cabe, nada se distingue.
 *  · `programas-de-compensacao` — 63 itens da biblioteca e 3 documentos da
 *    perícia (o de impacto socioeconômico e dois materiais didáticos).
 *  · `frentes-emergenciais` — 11 itens da biblioteca, 0 da perícia.
 *
 * Nenhum dos 16 eixos de `sintese-ajri.ts` é "sobre" esses três `TemaAjri`
 * especificamente — eles atravessam a síntese inteira sem virar um eixo
 * próprio. `temasSemEixo()`, abaixo, mede isso: quantos documentos de cada
 * fonte carregam um `TemaAjri` que nenhum dos 16 eixos usa. É achado por
 * ausência do PRÓPRIO cruzamento, não do acervo — e por isso vira uma seção
 * própria da página, não fica escondido.
 */

/**
 * A ponte. Comentário ao lado de cada entrada registra a régua aplicada —
 * mesmo padrão de `temas-ati.ts`. As 16 chaves são os 16 `titulo` reais de
 * `SINTESE_AJRI.eixos`; a asserção logo abaixo trava isso contra deriva do
 * gerador (se o `.md`-fonte reescrever um título, o build avisa aqui, não
 * silenciosamente devolve `[]` para o eixo inteiro).
 */
export const EIXO_PARA_TEMA_AJRI: Record<string, TemaAjri[]> = {
  "Fornecimento e captação de água": [
    "sistema-de-abastecimento-de-agua",
    "seguranca-hidrica",
    "agua-potavel",
  ],
  // a Nova Captação é obra de abastecimento; o risco de "volume morto" nos
  // reservatórios é segurança hídrica; a conformidade da água entregue por
  // caminhão-pipa (achado citado no próprio eixo) é água potável.

  Fauna: ["fauna"],

  "Flora e vegetação": ["flora"],

  "Saúde humana e risco ecológico": [
    "risco-saude-publica",
    "risco-ecologico",
    "risco-meio-ambiente",
    "agua-potavel",
    "seguranca-do-alimento",
  ],
  // ERSHRE cobre risco à saúde E risco ecológico (os dois nomeados no título
  // do eixo); "risco-meio-ambiente" é a etiqueta que o documento 3 da
  // perícia (ambiental) recebe ao lado de "qualidade-da-agua" — aqui entra
  // só a metade de risco, a outra metade mora no eixo 8; água potável por
  // caminhão-pipa é a frente deste eixo medida continuamente (mesmo achado
  // do eixo 1, ligação intencional — `SINTESE_AJRI.transversais` já regsitra
  // isso em pelo menos 3 eixos); segurança do alimento vem do achado sobre
  // medo de contaminação de peixe/alimento.

  "Manejo e remoção de rejeitos": ["manejo-de-rejeitos", "dragagem"],
  // dragagem é método central e citado ao longo do eixo inteiro (Marco Zero,
  // dragagem do rio, teste de rota alternativa), não um detalhe de passagem.

  "Buscas por vítimas": [],
  // nenhum dos 25 TemaAjri descreve busca por vítima/corpo — o vocabulário
  // da própria AECOM não tem essa caixa (a auditoria tem escopo ambiental e
  // de engenharia, como o próprio eixo já admite). Reforça a fragilidade
  // que `SINTESE_AJRI.fragilidades` já aponta para este eixo.

  "Inspeções de campo e monitoramento técnico": [
    "seguranca-das-estruturas-remanescentes",
    "sistemas-de-contencao",
  ],
  // prismas, fator de segurança do Aterro de Nível, estabilidade das
  // barragens remanescentes — o eixo é sobre monitorar a integridade
  // estrutural, o mesmo assunto dos dois temas.

  "Qualidade da água do rio Paraopeba e sedimentos": [
    "qualidade-da-agua",
    "solos-e-sedimentos",
    "agua-potavel",
  ],
  // o título já nomeia água e sedimento; água potável entra pela mesma
  // ligação transversal do eixo 1/4 (`SINTESE_AJRI.transversais` cita este
  // eixo nominalmente como um dos três).

  "Pendências em aberto e recorrentes": [],
  // eixo de PROCESSO (o que ainda falta resolver, em qualquer assunto) —
  // atravessa a síntese inteira, não é ele mesmo um assunto técnico.

  "Análises numéricas e estatísticas agregadas": [],
  // eixo de MÉTODO (crítica estatística a estudos de outros eixos) — uma
  // menção pontual a "água subterrânea" (estudo hidrogeológico reprovado)
  // não basta para equivaler o eixo inteiro a `agua-subterranea`: o resto do
  // eixo fala de produtividade de questionário e cálculo de linha de base,
  // outro assunto.

  "Recomendações da AECOM": [],
  // eixo de PROCESSO (placar de recomendações, em qualquer assunto).

  "Desafios estruturais": [],
  // mistura fragilidade de consultoria, prazo de transferência de dado e o
  // impasse institucional Vale×COPASA — nenhum TemaAjri cobre esse recorte
  // (que é sobre GOVERNANÇA do processo, não sobre um assunto técnico).

  "Atrasos e descumprimentos de prazo": ["cronograma"],
  // único eixo de processo com equivalente direto: o título já É a
  // definição de `cronograma` ("Cronograma" no rótulo da AECOM).

  "Avanços e conclusões positivas": [],
  // eixo de VEREDITO (o que recebeu "Satisfatório", em qualquer assunto).

  "Regularização fundiária, desapropriação e liberação de áreas": [],
  // nenhum dos 25 TemaAjri cobre posse de terra/desapropriação. Achado que
  // ecoa `temas-ati.ts`: lá "Regularização fundiária" também nunca virou
  // programa nomeado ("aparece em só um documento do acervo inteiro") — as
  // duas fontes, por caminhos independentes, concordam que este é o assunto
  // mais mal-etiquetado do corpus inteiro.

  "Participação social: atingidos, lideranças e povos e comunidades tradicionais":
    ["comunicacao-e-relacionamento", "peabp"],
  // comunicação/relacionamento com atingidos é o próprio assunto do eixo;
  // PEABP ("Programa de Educação Ambiental de Brumadinho e Bacia do Rio
  // Paraopeba", ver `ficha-legivel-ajri.ts`) é o programa de educação
  // ambiental voltado às comunidades — mesma frente de engajamento.
} as const;

const TITULOS_SINTESE = SINTESE_AJRI.eixos.map((e) => e.titulo);
const CHAVES_PONTE = Object.keys(EIXO_PARA_TEMA_AJRI);
if (TITULOS_SINTESE.length !== CHAVES_PONTE.length) {
  throw new Error(
    `sintese-integrada: EIXO_PARA_TEMA_AJRI tem ${CHAVES_PONTE.length} chaves, SINTESE_AJRI.eixos tem ${TITULOS_SINTESE.length}. O gerador de sintese-ajri.ts mudou um título — atualize a ponte.`
  );
}
for (const titulo of TITULOS_SINTESE) {
  if (!(titulo in EIXO_PARA_TEMA_AJRI)) {
    throw new Error(
      `sintese-integrada: eixo "${titulo}" não tem entrada em EIXO_PARA_TEMA_AJRI — o gerador de sintese-ajri.ts mudou o título deste eixo.`
    );
  }
}

/** Todo `TemaAjri` mapeado por ALGUM eixo — o complemento é o que `temasSemEixo()` mede. */
const TEMAS_MAPEADOS = new Set<TemaAjri>(Object.values(EIXO_PARA_TEMA_AJRI).flat());

/**
 * De qual acervo veio o documento de um `DocumentoCasado`, resolvendo os
 * `TemaAjri` reais. Para a biblioteca das ATIs, procura o item real (o
 * `DocumentoCasado` não carrega `temas`) e aplica `temasAjriDoItemBiblioteca`
 * — por isso itens do Guaicuy (que não declara tema livre, ver `biblioteca.ts`)
 * voltam `[]` mesmo quando o casamento é "forte": a força do casamento
 * notícia×estudo é uma coisa, ter `TemaAjri` para entrar num eixo é outra.
 * Para a perícia, casa pelo nome do arquivo — só existe UM casamento dessa
 * fonte no acervo hoje (`RESUMO_DAS_APRESENTAÇÕES...`, ligado a `pj11`).
 */
export function temasDoDocumentoCasado(
  doc: DocumentoCasado,
  itensAti: ItemBiblioteca[]
): TemaAjri[] {
  if (doc.fonte === "biblioteca-ati") {
    const item = itensAti.find((i) => i.id === doc.id);
    return item ? temasAjriDoItemBiblioteca(item) : [];
  }
  const encontrado = RESULTADOS_PERICIA.find((d) => d.nomeArquivo === doc.id);
  return encontrado?.temas ?? [];
}

export interface CoberturaEixo {
  /** `false` quando o eixo não tem `TemaAjri` equivalente — ver cabeçalho. */
  temTemaAjri: boolean;
  /** 1 (só a auditoria) a 3 (as três fontes). A auditoria SEMPRE conta: é
   *  ela que define o eixo. */
  fontesQueFalam: number;
  /**
   * O campo mais valioso da página. Frase pronta para a tela — já distingue
   * "a ponte não existe" (eixo sem TemaAjri) de "a ponte existe e ninguém
   * mais falou" (é pauta).
   */
  quaisFaltam: string[];
}

export interface EixoIntegrado {
  titulo: string;
  temasAjri: TemaAjri[];
  auditoria: { estadoGeral: string; numerosChave: string };
  pericia: { documentos: EstudoPericiaComTema[] };
  atis: { documentos: ItemBiblioteca[] };
  /** Casamentos estudo×notícia (forca "forte" ou "media") cujo documento
   *  citado cai neste eixo — a voz que a própria ATI escreveu sobre um
   *  estudo, não a voz deste portal. */
  vozAti: CasamentoEstudoNoticia[];
  cobertura: CoberturaEixo;
}

function coberturaDoEixo(temasAjri: TemaAjri[], docsPericia: number, docsAti: number): CoberturaEixo {
  if (temasAjri.length === 0) {
    return {
      temTemaAjri: false,
      fontesQueFalam: 1,
      quaisFaltam: [
        "perícia (UFMG) e ATIs — este eixo não tem TemaAjri equivalente no vocabulário de 25 temas da própria auditoria (ver EIXO_PARA_TEMA_AJRI); não é possível cruzar por tema, o que é diferente de dizer que as outras fontes não tratam do assunto",
      ],
    };
  }
  const faltam: string[] = [];
  if (docsPericia === 0) faltam.push("perícia (UFMG)");
  if (docsAti === 0) faltam.push("ATIs");
  return {
    temTemaAjri: true,
    fontesQueFalam: 1 + (docsPericia > 0 ? 1 : 0) + (docsAti > 0 ? 1 : 0),
    quaisFaltam: faltam,
  };
}

/**
 * Monta os 16 eixos integrados. Assíncrona porque `bibliotecaAti()` lê o
 * arquivo de dado (disco ou asset do Cloudflare) — mesma assinatura que
 * `/paraopeba/biblioteca` já usa. Chame uma vez por render de página de
 * servidor; o resultado (16 linhas, cada uma já filtrada) é pequeno o
 * bastante para virar prop do componente de cliente sem repetir o problema
 * dos 14,6 MB que `AGENTS.md` documenta — aqui não é o array inteiro de
 * nenhuma fonte, é o recorte por eixo.
 */
export async function sinteseIntegrada(): Promise<EixoIntegrado[]> {
  const itensAti = await bibliotecaAti();

  return SINTESE_AJRI.eixos.map((eixo) => {
    const temasAjri = EIXO_PARA_TEMA_AJRI[eixo.titulo] ?? [];
    const temaSet = new Set(temasAjri);

    const documentosPericia =
      temasAjri.length === 0
        ? []
        : ESTUDOS_PERICIA_COM_TEMA.filter((d) => d.temas.some((t) => temaSet.has(t)));

    const documentosAti =
      temasAjri.length === 0
        ? []
        : itensAti.filter((i) => temasAjriDoItemBiblioteca(i).some((t) => temaSet.has(t)));

    const vozAti =
      temasAjri.length === 0
        ? []
        : CASAMENTOS_ESTUDO_NOTICIA.filter((c) => {
            if (c.forca === "nula" || !c.documento) return false;
            return temasDoDocumentoCasado(c.documento, itensAti).some((t) => temaSet.has(t));
          });

    return {
      titulo: eixo.titulo,
      temasAjri,
      auditoria: { estadoGeral: eixo.estadoGeral, numerosChave: eixo.numerosChave },
      pericia: { documentos: documentosPericia },
      atis: { documentos: documentosAti },
      vozAti,
      cobertura: coberturaDoEixo(temasAjri, documentosPericia.length, documentosAti.length),
    };
  });
}

export interface ResumoIntegrado {
  totalEixos: number;
  /** Eixos onde as três fontes falam. */
  comTresFontes: number;
  /** Eixos onde só a auditoria fala — a lista de pauta. */
  soAuditoria: number;
  /** Dos "só auditoria", quantos são por falta de TemaAjri (ponte
   *  estrutural) vs. quantos são ponte-que-existe-mas-ninguém-usou. */
  soAuditoriaSemPonte: number;
  soAuditoriaComPonteVazia: number;
}

/** Agregado para os cartões de topo — nunca dígite estes números, meça. */
export function resumoIntegrado(eixos: EixoIntegrado[]): ResumoIntegrado {
  const soAuditoria = eixos.filter((e) => e.cobertura.fontesQueFalam === 1);
  return {
    totalEixos: eixos.length,
    comTresFontes: eixos.filter((e) => e.cobertura.fontesQueFalam === 3).length,
    soAuditoria: soAuditoria.length,
    soAuditoriaSemPonte: soAuditoria.filter((e) => !e.cobertura.temTemaAjri).length,
    soAuditoriaComPonteVazia: soAuditoria.filter((e) => e.cobertura.temTemaAjri).length,
  };
}

export interface TemaOrfao {
  tema: TemaAjri;
  rotulo: string;
  documentosPericia: number;
  documentosAti: number;
}

/**
 * `TemaAjri` que perícia e/ou ATIs usam de verdade, mas que nenhum dos 16
 * eixos de `sintese-ajri.ts` cobre — o espelho de `quaisFaltam`: lá é "este
 * eixo não tem outra fonte", aqui é "esta fonte fala de algo que não virou
 * eixo". Ver a seção "O QUE `EIXO_PARA_TEMA_AJRI` NÃO CAPTURA" no cabeçalho
 * do arquivo — `plano-de-reparacao` e `programas-de-compensacao` são os
 * candidatos esperados, medidos aqui em vez de digitados.
 */
export async function temasSemEixo(): Promise<TemaOrfao[]> {
  const itensAti = await bibliotecaAti();
  return TEMA_AJRI_ORDEM.filter((t) => !TEMAS_MAPEADOS.has(t))
    .map((tema) => ({
      tema,
      rotulo: TEMA_AJRI_LABEL[tema],
      documentosPericia: ESTUDOS_PERICIA_COM_TEMA.filter((d) => d.temas.includes(tema)).length,
      documentosAti: itensAti.filter((i) => temasAjriDoItemBiblioteca(i).includes(tema)).length,
    }))
    .filter((t) => t.documentosPericia > 0 || t.documentosAti > 0);
}

/**
 * O caso citado na tarefa: `er04` (Guaicuy, 21/08/2023) descreve um estudo
 * de 2023 sobre água subterrânea da UFMG (63,5% das amostras fora do
 * limite) que NÃO está nos 445 itens raspados do acervo da perícia — achado
 * por lacuna, não por casamento. O objeto já existe, íntegro, dentro de
 * `CASAMENTOS_ESTUDO_NOTICIA`; isto só o localiza por id em vez de o portal
 * reescrever a evidência à mão (a mesma regra de "número medido, nunca
 * digitado" vale para texto que já existe em outro módulo).
 */
export const ESTUDO_AUSENTE_DO_ACERVO: CasamentoEstudoNoticia = (() => {
  const encontrado = CASAMENTOS_ESTUDO_NOTICIA.find((c) => c.noticia.id === "er04");
  if (!encontrado) {
    throw new Error(
      "sintese-integrada: notícia er04 não existe mais em CASAMENTOS_ESTUDO_NOTICIA — o achado de lacuna citado pela tarefa precisa de novo dono."
    );
  }
  return encontrado;
})();

// Só o TIPO sai daqui, nunca `ATI_BIBLIOTECA_LABEL` nem qualquer outro valor
// de `biblioteca.ts`: aquele módulo usa `node:fs`, e um re-export de VALOR
// arrastaria isso para o bundle do cliente (o mesmo cuidado que
// `BibliotecaClient.tsx` já documenta). Quem precisa do rótulo por sigla
// importa `ATI_BIBLIOTECA_LABEL` direto de `biblioteca.ts` no componente de
// SERVIDOR e passa por prop — nunca daqui.
export type { AtiBiblioteca, ItemBiblioteca };
