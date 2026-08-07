/**
 * Presença e coerência — os dois fatores que DESCONTAM a pontuação de quem
 * legisla. Compartilhado entre os eixos Cidades e Congresso.
 *
 * NÃO mora em `lib/betim/` nem em `lib/congresso/` de propósito: a régua —
 * desconto só na parte positiva, "não medido" nunca é 1,0 silencioso, sem
 * fidelidade partidária — é a MESMA nos dois eixos, só a fonte da presença
 * muda (votação nominal nas câmaras municipais, folha de ponto oficial no
 * Congresso). Duplicar este arquivo por zona arriscaria a mesma deriva que
 * `congresso/rubrica/rubrica.json` evita ao ser lido pelos dois lados em vez
 * de copiado.
 *
 * Até aqui o ranking media só o que a pessoa APRESENTA (`vereadores.ts`,
 * `PESO_PROPOSICAO`). Isso premiava quem protocola muito e comparece pouco, e
 * não distinguia quem vota para ampliar direito de quem vota para restringir.
 * Este módulo é a outra metade, e ele só desconta — nunca acrescenta ponto.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * A DECISÃO CENTRAL: O DESCONTO INCIDE SÓ SOBRE A PARTE POSITIVA
 * ═══════════════════════════════════════════════════════════════════════
 *
 *     pontuação = (soma do que é positivo × fPresença × fCoerência)
 *                 + (soma do que é negativo, INTACTA)
 *
 * Multiplicar a pontuação inteira seria o caminho óbvio e estaria errado. A
 * pontuação pode ser NEGATIVA desde que projeto reducionista passou a
 * subtrair: um vereador com −100 pontos e 50% de faltas viraria −50, ou seja,
 * FALTAR O TERIA PROMOVIDO no ranking. É a mesma armadilha do teto de baixo
 * teor, onde substituir o peso em vez de aplicar `Math.min` transformava a
 * punição em promoção — punição que aumenta a nota é pior que punição
 * nenhuma.
 *
 * Com o desconto sobre a parte positiva a leitura fica exata: falta e
 * incoerência descontam o que a pessoa CONSTRUIU, e nunca amenizam o que ela
 * RETIROU.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * NÃO MEDIDO É 1,0, E NUNCA UM DESCONTO
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Onde a fonte não sustenta a medida, o fator é 1,0 e `medido` é `false`. É
 * a mesma regra que manteve `sem_ementa` fora da penalidade de baixo teor:
 * cobrar do vereador uma falha do NOSSO raspador é a pior coisa que um portal
 * de transparência pode fazer com o nome de uma pessoa. Hoje isso desliga a
 * presença em São Paulo inteiro e a coerência em Belo Horizonte inteiro — e a
 * tela tem de dizer isso, e não desenhar um traço mudo.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O QUE ESTE MÓDULO SE RECUSA A MEDIR
 * ═══════════════════════════════════════════════════════════════════════
 *
 * **Fidelidade partidária não entra na nota.** É perfeitamente medível com o
 * dado que já temos, e pontuá-la seria um erro de mérito: premiar quem vota
 * com a bancada rebaixa exatamente o parlamentar que rompe com o próprio
 * partido para defender um direito. Ela é exibida como informação e não toca
 * a pontuação.
 *
 * **Coerência com "projeto eleitoral" não existe como dado.** O TSE publica
 * plano de governo apenas de candidato MAJORITÁRIO; vereador e deputado, que
 * concorrem no proporcional, não registram programa. Não há o que cruzar, e
 * inventar um proxy (o programa do partido) só devolveria fidelidade
 * partidária com outro nome.
 *
 * **Gasto atípico não entra na nota.** Ver `gastosAtipicos()` em
 * `lib/db/queries/betim.ts`: o dado sustenta "olhe para isto", não "isto é
 * irregular".
 */
import {
  classificarDia,
  classificarVoto,
  fonteDeclaraAusencia,
  normalizarRotulo,
} from "@/lib/presenca/vocabulario";

// ── Presença ────────────────────────────────────────────────────────────

/** Taxa a partir da qual não há desconto nenhum. */
export const PRESENCA_ALVO = 0.9;
/** Taxa em que o desconto chega ao máximo. */
export const PRESENCA_PISO = 0.5;
/** O fator nunca desce daqui: metade do que a pessoa construiu continua
 *  valendo. Faltar muito é grave e não apaga o que foi protocolado. */
export const PRESENCA_FATOR_MIN = 0.5;
/** Abaixo disto a taxa é ruído, não medida. Uma câmara com 6 votações
 *  coletadas diria "faltou em 50%" sobre 3 ausências. */
export const PRESENCA_MIN_OPORTUNIDADES = 20;

// ── Coerência ───────────────────────────────────────────────────────────

export const COERENCIA_ALVO = 0.8;
export const COERENCIA_PISO = 0.4;
/** Desconto mais brando que o da presença, de propósito. Presença é fato
 *  bruto ("compareceu ou não"); coerência é fato medido contra uma RÉGUA
 *  EDITORIAL — a rubrica garantista × reducionista, publicada em
 *  `/metodologia` e contestável por quem discorda dela. Quanto mais a medida
 *  depende de julgamento nosso, menos ela deve mexer no nome de alguém. */
export const COERENCIA_FATOR_MIN = 0.7;
/** Mínimo de votos COM direção de direitos para haver veredito. Com 4 votos,
 *  um único voto discordante viraria 75% e derrubaria a pessoa. */
export const COERENCIA_MIN_VOTOS = 5;

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Rampa linear entre PISO e ALVO, achatada em `fatorMin`.
 *
 * Rampa e não degrau: com faixas ("≥90% não desconta, 89% desconta 20%") um
 * ponto percentual a menos derrubaria alguém vários lugares, e a diferença
 * entre 89% e 90% não é real — é uma sessão a mais no numerador.
 */
function rampa(taxa: number, piso: number, alvo: number, fatorMin: number): number {
  return fatorMin + (1 - fatorMin) * clamp01((taxa - piso) / (alvo - piso));
}

/**
 * Um fator de desconto, sempre acompanhado do porquê.
 *
 * `medido: false` NÃO é o mesmo que `taxa: 1`. Uma tela que só recebesse o
 * número não teria como distinguir "compareceu a tudo" de "não temos como
 * saber", e acabaria elogiando quem nunca foi medido.
 */
export interface FatorAtuacao {
  fator: number;
  medido: boolean;
  taxa: number | null;
  /** Denominador — o tamanho da amostra que sustenta (ou não) a taxa. */
  base: number;
  /** Por que não foi medido. `null` quando foi. */
  motivo: string | null;
}

const NAO_MEDIDO = (motivo: string, base = 0): FatorAtuacao => ({
  fator: 1,
  medido: false,
  taxa: null,
  base,
  motivo,
});

/** Uma célula de `contagemDeVotosPorVereador`. */
export interface LinhaVoto {
  vereador_id: string | null;
  voto: string | null;
  origem: string | null;
  qtd: number;
}

export interface Presenca extends FatorAtuacao {
  compareceu: number;
  ausente: number;
  /** Presente e não registrou voto. Não é falta — e não é participação. */
  semVotar: number;
}

/**
 * Taxa de comparecimento de um vereador, a partir de como ele consta nas
 * votações nominais.
 *
 * ═══ NÃO É "DIAS TRABALHADOS", E A DIFERENÇA IMPORTA ═══
 *
 * Nenhuma das três câmaras municipais publica folha de ponto. O que existe é
 * o registro do painel por votação, do qual se deriva "esteve na votação".
 * Um vereador pode passar o dia em comissão e faltar ao plenário; esta medida
 * não vê isso. A tela chama o que ela é — "presença em votações" — e o
 * Congresso, que TEM folha de ponto oficial, usa outra fonte
 * (`congresso.presencas_plenario`).
 *
 * ═══ QUEM PRESIDE NÃO ENTRA NA CONTA ═══
 *
 * 'Presidência' e 'Artigo 17' saem do numerador E do denominador: quem
 * preside a sessão não vota por regra regimental. Contá-los como falta
 * puniria a pessoa por ter sido eleita para a Mesa; contá-los como presença
 * inflaria a taxa de quem preside muito.
 */
export function calcularPresenca(
  idMunicipio: string,
  linhas: LinhaVoto[]
): Presenca {
  if (!fonteDeclaraAusencia(idMunicipio)) {
    return {
      ...NAO_MEDIDO(
        "A fonte desta câmara registra apenas quem votou — não declara quem " +
          "faltou. Deduzir a falta de quem não aparece confundiria ausência " +
          "com votação simbólica e com falha da nossa coleta."
      ),
      compareceu: 0,
      ausente: 0,
      semVotar: 0,
    };
  }

  let compareceu = 0;
  let ausente = 0;
  let semVotar = 0;
  for (const l of linhas) {
    // `voto_contrario` é anotação de dissidência em votação simbólica de SP,
    // não registro de painel: não prova comparecimento.
    if (l.origem === "voto_contrario") continue;
    switch (classificarVoto(l.voto)) {
      case "registrou_voto":
        compareceu += l.qtd;
        break;
      case "presente_sem_votar":
        // Presente e não registrou. Conta como comparecimento — a pessoa
        // estava lá. A omissão dela é outra crítica, e tem número próprio.
        compareceu += l.qtd;
        semVotar += l.qtd;
        break;
      case "ausente":
        ausente += l.qtd;
        break;
      // 'nao_e_voto' (presidência) e 'desconhecida' ficam fora dos dois
      // lados. Rótulo que ninguém catalogou não é prova de ausência.
      default:
        break;
    }
  }

  const base = compareceu + ausente;
  if (base < PRESENCA_MIN_OPORTUNIDADES) {
    return {
      ...NAO_MEDIDO(
        `Só ${base} votações nominais coletadas para esta pessoa — abaixo das ` +
          `${PRESENCA_MIN_OPORTUNIDADES} necessárias para a taxa dizer algo.`,
        base
      ),
      compareceu,
      ausente,
      semVotar,
    };
  }

  const taxa = compareceu / base;
  return {
    fator: rampa(taxa, PRESENCA_PISO, PRESENCA_ALVO, PRESENCA_FATOR_MIN),
    medido: true,
    taxa,
    base,
    motivo: null,
    compareceu,
    ausente,
    semVotar,
  };
}

// ── Presença por dia (Congresso) ───────────────────────────────────────

/** Uma célula de `presencaDiasDoParlamentar`. */
export interface LinhaPresencaDia {
  situacao_dia: string | null;
  sessoes_total: number | null;
  sessoes_presente: number | null;
}

export interface PresencaDias extends FatorAtuacao {
  diasPresente: number;
  diasFalta: number;
  /** Fora do numerador E do denominador — ver o porquê na doc da função. */
  diasJustificada: number;
  sessoesPresente: number;
  sessoesTotal: number;
}

/**
 * Presença do Congresso, a partir da folha de ponto oficial
 * (`congresso.presencas_plenario`) — dois números, não um.
 *
 * ═══ "DIAS TRABALHADOS" É O QUE DESCONTA A NOTA ═══
 *
 * `diasPresente / (diasPresente + diasFalta)` usa a MESMA rampa e os MESMOS
 * limiares de `calcularPresenca` (votação municipal): as duas são a versão
 * de cada eixo para "esteve lá", e tratá-las com réguas diferentes tornaria
 * as notas de Cidades e Congresso incomparáveis por um motivo que não é
 * sobre a pessoa, é sobre a fórmula.
 *
 * `diasJustificada` fica FORA dos dois lados da fração, e não é meia-medida:
 * um dia de missão autorizada ou licença não é "menos falta", é fato
 * diferente de falta. Incluí-lo no denominador puniria quem tirou licença-
 * maternidade com uma taxa mais baixa que quem simplesmente não apareceu.
 *
 * ═══ "SESSÕES" É UM SEGUNDO NÚMERO, SÓ INFORMATIVO ═══
 *
 * `sessoesPresente / sessoesTotal` soma as sessões (ordinária +
 * extraordinárias) dos MESMOS dias que entram no denominador de dias — não
 * de todos os dias coletados. É mais fino que "dias": um deputado pode
 * constar como `Presença` no dia (esteve na sessão principal) e ainda faltar
 * a uma extraordinária do mesmo dia, e é isso que o número de sessões
 * mostra e o de dias não. NÃO entra no fator de desconto — dobraria a
 * punição pelo mesmo fato que "dias" já descontou.
 */
export function calcularPresencaDias(linhas: LinhaPresencaDia[]): PresencaDias {
  let diasPresente = 0;
  let diasFalta = 0;
  let diasJustificada = 0;
  let sessoesPresente = 0;
  let sessoesTotal = 0;

  for (const l of linhas) {
    const c = classificarDia(l.situacao_dia);
    if (c === "justificada") {
      diasJustificada++;
      continue;
    }
    if (c === "desconhecida") continue; // rótulo novo, não catalogado ainda.
    if (c === "presente") diasPresente++;
    else diasFalta++;
    sessoesTotal += l.sessoes_total ?? 0;
    sessoesPresente += l.sessoes_presente ?? 0;
  }

  const base = diasPresente + diasFalta;
  if (base < PRESENCA_MIN_OPORTUNIDADES) {
    return {
      ...NAO_MEDIDO(
        `Só ${base} dias de plenário coletados para esta pessoa — abaixo dos ` +
          `${PRESENCA_MIN_OPORTUNIDADES} necessários para a taxa dizer algo.`,
        base
      ),
      diasPresente,
      diasFalta,
      diasJustificada,
      sessoesPresente,
      sessoesTotal,
    };
  }

  const taxa = diasPresente / base;
  return {
    fator: rampa(taxa, PRESENCA_PISO, PRESENCA_ALVO, PRESENCA_FATOR_MIN),
    medido: true,
    taxa,
    base,
    motivo: null,
    diasPresente,
    diasFalta,
    diasJustificada,
    sessoesPresente,
    sessoesTotal,
  };
}

// ── Coerência ───────────────────────────────────────────────────────────

/** Uma célula de `votosPorRotuloDeDireito`. */
export interface LinhaVotoRotulo {
  vereador_id: string | null;
  rotulo: string | null;
  voto: string | null;
  autor_id: string | null;
  qtd: number;
}

/** Direção que a rubrica atribuiu à matéria. */
const ROTULO_DIRECAO: Record<string, 1 | -1> = {
  garantista: 1,
  garantista_forte: 1,
  reducionista: -1,
  reducionista_forte: -1,
};

/** Como o vereador se posicionou: a favor (+1) ou contra (−1) a matéria. */
function direcaoDoVoto(voto: string | null): 1 | -1 | null {
  const v = normalizarRotulo(voto);
  if (v.startsWith("sim")) return 1;
  // "não votou" começa com "nao" e NÃO é voto contrário — testar antes.
  if (v.startsWith("nao votou")) return null;
  if (v.startsWith("nao")) return -1;
  return null;
}

export interface Coerencia extends FatorAtuacao {
  /** Votou a favor de matéria garantista ou contra reducionista. */
  coerentes: number;
  /** Votou contra matéria garantista ou a favor de reducionista. */
  incoerentes: number;
  /** Votou matéria analisada, mas sem direção (neutro/misto) — fora da
   *  conta, e exibido para o leitor saber o tamanho real da amostra. */
  semDirecao: number;
  /** O perfil da AUTORIA contradiz o perfil do VOTO. */
  contradizPropriaAutoria: boolean;
}

/**
 * Coerência do voto com direitos fundamentais — e com a própria autoria.
 *
 * ═══ A RÉGUA ═══
 *
 * Sobre as matérias que a rubrica classificou COM direção:
 *
 *   votou SIM  em garantista   → coerente
 *   votou NÃO  em garantista   → incoerente
 *   votou NÃO  em reducionista → coerente
 *   votou SIM  em reducionista → incoerente
 *
 * `neutro` e `misto` não têm direção a comparar e ficam fora dos dois lados —
 * `misto` de propósito: a rubrica devolve "misto" justamente quando os itens
 * apontam para lados opostos, e forçar um veredito ali seria escolher um dos
 * lados no lugar do leitor.
 *
 * Abstenção, "não votou" e ausência também ficam fora. Não são posição sobre
 * o mérito, e a ausência já é cobrada uma vez pelo fator de presença — cobrar
 * de novo aqui seria punir o mesmo fato duas vezes.
 *
 * ═══ AUTORIA × VOTO ═══
 *
 * A segunda régua que o desconto usa, e a que não depende de comparar a
 * pessoa com ninguém: quem PROTOCOLA projeto que amplia direito e VOTA para
 * restringir (ou o contrário) está em contradição consigo mesmo, não com o
 * partido nem com uma expectativa nossa. Só dispara com amostra dos DOIS
 * lados — a contradição precisa de duas afirmações, e uma delas não pode ser
 * um projeto solto.
 */
export function calcularCoerencia(
  vereadorId: string,
  linhas: LinhaVotoRotulo[],
  /** Saldo da autoria: (garantistas − reducionistas) que a pessoa
   *  protocolou, e quantas peças com direção sustentam esse saldo. */
  autoria: { saldo: number; base: number } = { saldo: 0, base: 0 }
): Coerencia {
  let coerentes = 0;
  let incoerentes = 0;
  let semDirecao = 0;

  for (const l of linhas) {
    const dirMateria = ROTULO_DIRECAO[l.rotulo ?? ""];
    const dirVoto = direcaoDoVoto(l.voto);
    if (dirVoto === null) continue;
    if (!dirMateria) {
      semDirecao += l.qtd;
      continue;
    }
    if (dirMateria === dirVoto) coerentes += l.qtd;
    else incoerentes += l.qtd;
  }

  const base = coerentes + incoerentes;

  // A contradição consigo mesmo exige os dois lados com amostra. Sem isso,
  // um único projeto reducionista de um vereador que vota bem viraria
  // "contradiz a própria autoria" — acusação forte sobre evidência de uma
  // peça só.
  const perfilVoto = coerentes - incoerentes;
  const contradizPropriaAutoria =
    autoria.base >= 3 &&
    base >= COERENCIA_MIN_VOTOS &&
    autoria.saldo !== 0 &&
    perfilVoto !== 0 &&
    Math.sign(autoria.saldo) !== Math.sign(perfilVoto);

  if (base < COERENCIA_MIN_VOTOS) {
    return {
      ...NAO_MEDIDO(
        base === 0
          ? "Nenhuma matéria com direção de direitos analisada entre as que " +
              "esta pessoa votou."
          : `Só ${base} voto(s) em matéria com direção de direitos — abaixo ` +
              `dos ${COERENCIA_MIN_VOTOS} necessários para haver veredito.`,
        base
      ),
      coerentes,
      incoerentes,
      semDirecao,
      // Sem amostra de voto não há contradição a afirmar.
      contradizPropriaAutoria: false,
    };
  }

  const taxa = coerentes / base;
  let fator = rampa(taxa, COERENCIA_PISO, COERENCIA_ALVO, COERENCIA_FATOR_MIN);
  if (contradizPropriaAutoria) {
    // Desconto adicional pequeno e com PISO: contradizer a própria autoria é
    // um agravante do mesmo fato já contado acima, não um segundo fato.
    fator = Math.max(fator * 0.9, COERENCIA_FATOR_MIN);
  }

  return {
    fator,
    medido: true,
    taxa,
    base,
    motivo: null,
    coerentes,
    incoerentes,
    semDirecao,
    contradizPropriaAutoria,
  };
}

/**
 * Aplica os dois fatores a uma pontuação de produção legislativa.
 *
 * `positivo` e `negativo` chegam SEPARADOS porque é essa separação que
 * impede o desconto de promover quem tem saldo negativo — ver o bloco no
 * topo do arquivo. Somar os dois antes de chamar isto reintroduziria o bug.
 */
export function aplicarFatores(
  positivo: number,
  negativo: number,
  presenca: FatorAtuacao,
  coerencia: FatorAtuacao
): number {
  // Arredondado para INTEIRO de propósito. `PESO_PROPOSICAO` só produz
  // pontuação de produção inteira (peso × quantidade); os fatores são a
  // única fonte de casas decimais, e "630,283 pts" numa página pública lê
  // como imprecisão do site, não como precisão do cálculo — a terceira casa
  // decimal de um desconto de presença não é informação que o leitor usa.
  return Math.round(positivo * presenca.fator * coerencia.fator + negativo);
}
