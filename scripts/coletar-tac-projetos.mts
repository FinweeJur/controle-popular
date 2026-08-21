/**
 * Gera `apps/web/lib/ambiental/tac-projetos.ts` a partir da captura do painel
 * Power BI de execução dos projetos de TAC ambiental de Minas Gerais.
 *
 * ═══ O QUE É ESTE DADO ═══
 *
 * Projetos custeados por mineradoras dentro de Termos de Ajustamento de Conduta
 * (TAC) ambientais, com o valor previsto e o executado ANO A ANO, o órgão
 * responsável e a situação. É a peça central do acompanhamento de acordo
 * ambiental: dá para ver quem prometeu quanto, para qual órgão, e o que de fato
 * saiu do papel.
 *
 * ═══ POR QUE A FONTE É UMA CAPTURA, E NÃO UMA API ═══
 *
 * O painel não expõe endpoint documentado: o que existe é a consulta semântica
 * que o próprio Power BI faz ao carregar (`querydata`). A captura fica em
 * `X:\DevCoder\_lote-ambiental\saida\_tacs_projetos.json`, fora do repo, como
 * todo material de trabalho de uso único. Recapturar quando quiser atualizar.
 *
 * ═══ O FORMATO DSR, E POR QUE ELE ENGANA ═══
 *
 * A resposta vem no formato DSR do Power BI, que comprime de três formas ao
 * mesmo tempo, e ignorar qualquer uma produz dado errado com cara de certo:
 *
 * 1. **Dicionário de valores internados** (`ValueDicts.D0..D4`): a célula traz
 *    um ÍNDICE inteiro, não o texto. Ler o índice como valor daria "Projeto 0".
 * 2. **Máscara de repetição `R`**: bit ligado na posição i significa "a coluna i
 *    vale o mesmo da linha anterior". Sem expandir, 848 linhas viram um punhado
 *    de linhas completas e centenas de linhas quase vazias.
 * 3. **Máscara de nulo `Ø`**: bit ligado significa nulo — e é DIFERENTE de zero.
 *    "Sem relato" não é "relato vazio", e nulo em valor não é R$ 0,00.
 *
 * A ordem importa: para cada coluna, primeiro `R`, depois `Ø`, e só então
 * consumir o próximo item de `C`. Trocar a ordem desalinha o array inteiro a
 * partir da primeira linha com máscara — e o desalinhamento é silencioso,
 * porque os tipos continuam plausíveis.
 *
 * ═══ ARMADILHA DE TIPO, MEDIDA ═══
 *
 * As colunas de valor vêm ora `number`, ora **string** com a precisão inteira do
 * double (`"806830.5820000004"`) — o Power BI faz isso quando o número não faz
 * round-trip limpo em JSON. Medido nesta captura: 23 strings em Valor Previsto e
 * 4 em Valor Executado. Somar sem converter lança `TypeError` no melhor caso e
 * concatena string no pior.
 *
 * ═══ A ARMADILHA EDITORIAL, QUE É A MAIS GRAVE ═══
 *
 * O plano vai de 2022 a 2029; a execução só é reportada até 2025. Dividir o
 * executado total pelo previsto total dá **40,8%** e sugere atraso — mas está
 * comparando o que foi feito com um plano que ainda tem três anos pela frente.
 * Na janela já decorrida (até 2025) a razão é **64,7%**.
 *
 * Por isso este script NUNCA emite um percentual solto. Emite os dois, cada um
 * com a janela explícita no nome do campo, e a série ano a ano — para a tela
 * poder mostrar honestamente. Um número sozinho aqui seria dois dados
 * verdadeiros implicando um terceiro, falso.
 *
 * Uso:
 *   npx tsx scripts/coletar-tac-projetos.mts            # grava
 *   npx tsx scripts/coletar-tac-projetos.mts --seco     # só mede, não grava
 *   npx tsx scripts/coletar-tac-projetos.mts --fonte=CAMINHO/outro.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FONTE_PADRAO = resolve("X:\\DevCoder\\_lote-ambiental\\saida\\_tacs_projetos.json");
const DESTINO = resolve(RAIZ, "apps/web/lib/ambiental/tac-projetos.ts");

const SO_MEDIR = process.argv.includes("--seco");
const FONTE =
  process.argv.find((a) => a.startsWith("--fonte="))?.slice("--fonte=".length) ?? FONTE_PADRAO;

const abortar = (msg: string): never => {
  console.error(`[tac-projetos] ABORT: ${msg}`);
  process.exit(1);
};

if (!existsSync(FONTE)) abortar(`fonte não encontrada: ${FONTE}`);

/** Aceita number ou a string de precisão cheia do Power BI. Recusa o resto. */
function numero(v: unknown, onde: string): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return abortar(`valor não numérico em ${onde}: ${JSON.stringify(v)}`);
}

interface LinhaTac {
  projeto: string;
  mineradora: string;
  orgao: string;
  ano: number;
  status: string;
  previsto: number | null;
  executado: number | null;
  relato: string | null;
}

const bruto = JSON.parse(readFileSync(FONTE, "utf8"));

// ─── Validação de CONTEÚDO, nunca de status HTTP ───────────────────────────
// A captura pode ter vindo de uma consulta que o servidor recusou: o Power BI
// responde 200 com um `odata.error` embutido (foi o que aconteceu com a
// consulta de contas bancárias, `CouldNotResolveSemanticQueryDefinition`).
const resultado = bruto?.results?.[0]?.result?.data;
if (!resultado) abortar("captura sem `results[0].result.data` — consulta falhou?");
if (JSON.stringify(resultado).includes("odata.error")) {
  abortar("a captura contém `odata.error` — o painel recusou esta consulta; recapture");
}

const colunas: string[] = (resultado.descriptor?.Select ?? []).map((s: { Name: string }) =>
  s.Name.includes(".") ? s.Name.slice(s.Name.indexOf(".") + 1) : s.Name,
);
const ESPERADAS = [
  "Projeto",
  "Mineradora",
  "Órgão/Instituição",
  "Ano",
  "Status",
  "Valor Previsto",
  "Valor Executado",
  "Breve relato da situação",
];
if (colunas.length !== ESPERADAS.length) {
  abortar(`esperava ${ESPERADAS.length} colunas, achei ${colunas.length}: ${colunas.join(" | ")}`);
}

const ds = resultado.dsr?.DS?.[0];
if (!ds) abortar("captura sem `dsr.DS[0]`");
const dicts: Record<string, unknown[]> = ds.ValueDicts ?? {};
const linhasBrutas: Record<string, unknown>[] = ds.PH?.[0]?.DM0 ?? [];
if (linhasBrutas.length === 0) abortar("nenhuma linha em `PH[0].DM0`");

// O schema só vem na PRIMEIRA linha; `DN` diz qual dicionário interna a coluna.
const schema = (linhasBrutas[0].S ?? []) as { N: string; T: number; DN?: string }[];
if (schema.length !== colunas.length) {
  abortar(`schema com ${schema.length} colunas, descriptor com ${colunas.length}`);
}
const dictDaColuna = schema.map((c) => c.DN);

// A chave da máscara de nulo é um caractere não-ASCII ("Ø"). Descobrir em vez de
// cravar: cravar o byte errado faz TODO nulo virar valor da linha anterior.
const chaveNulo =
  Object.keys(linhasBrutas[0]).find((k) => k !== "S" && k !== "C" && k !== "R") ?? "\u00d8";

const linhas: LinhaTac[] = [];
let anterior: unknown[] = new Array(colunas.length).fill(null);

for (const [i, cru] of linhasBrutas.entries()) {
  const repetir = Number(cru.R ?? 0);
  const nulos = Number(cru[chaveNulo] ?? 0);
  const valores = (cru.C ?? []) as unknown[];
  let proximo = 0;
  const saida: unknown[] = [];

  for (let col = 0; col < colunas.length; col++) {
    if ((repetir >> col) & 1) {
      saida.push(anterior[col]);
    } else if ((nulos >> col) & 1) {
      saida.push(null);
    } else {
      if (proximo >= valores.length) {
        abortar(`linha ${i}: acabaram os valores de C antes da coluna ${col} (${colunas[col]})`);
      }
      let v = valores[proximo++];
      const dn = dictDaColuna[col];
      // Índice inteiro vira o texto do dicionário. String literal fica como está
      // (o DSR às vezes manda o valor cru quando ele ainda não está no dict).
      if (dn && typeof v === "number") {
        const tabela = dicts[dn];
        if (!tabela) abortar(`linha ${i}: coluna ${colunas[col]} cita dicionário ${dn} inexistente`);
        if (v < 0 || v >= tabela.length) {
          abortar(`linha ${i}: índice ${v} fora do dicionário ${dn} (${tabela.length} itens)`);
        }
        v = tabela[v];
      }
      saida.push(v);
    }
  }
  if (proximo !== valores.length) {
    abortar(`linha ${i}: sobraram ${valores.length - proximo} valores em C — máscaras desalinhadas`);
  }
  anterior = saida;

  linhas.push({
    projeto: String(saida[0] ?? ""),
    mineradora: String(saida[1] ?? ""),
    orgao: String(saida[2] ?? ""),
    ano: Number(saida[3]),
    status: String(saida[4] ?? ""),
    previsto: numero(saida[5], `linha ${i} / Valor Previsto`),
    executado: numero(saida[6], `linha ${i} / Valor Executado`),
    relato: saida[7] === null || saida[7] === undefined ? null : String(saida[7]),
  });
}

// ─── Travas de sanidade, antes de gravar qualquer coisa ────────────────────
const anos = [...new Set(linhas.map((l) => l.ano))].sort((a, b) => a - b);
if (anos.some((a) => !Number.isInteger(a) || a < 2019 || a > 2040)) {
  abortar(`ano fora de faixa plausível: ${anos.join(", ")}`);
}
if (linhas.some((l) => l.projeto === "" || l.mineradora === "")) {
  abortar("há linha sem projeto ou sem mineradora — decodificação desalinhou");
}
const statusVistos = [...new Set(linhas.map((l) => l.status))].sort();
if (statusVistos.length === 0 || statusVistos.length > 12) {
  abortar(`situações demais ou de menos (${statusVistos.length}) — provável desalinhamento`);
}

const soma = (f: (l: LinhaTac) => number | null, filtro: (l: LinhaTac) => boolean = () => true) =>
  linhas.filter(filtro).reduce((t, l) => t + (f(l) ?? 0), 0);

const previstoTotal = soma((l) => l.previsto);
const executadoTotal = soma((l) => l.executado);
if (previstoTotal <= 0) abortar("previsto total é zero — nada a publicar");

/** Último ano em que a fonte reporta QUALQUER execução. É o que define a janela
 *  honesta de comparação: além dele, "0 executado" quer dizer "ainda não
 *  reportado", não "não executado". */
const ultimoAnoComExecucao = Math.max(
  ...linhas.filter((l) => (l.executado ?? 0) > 0).map((l) => l.ano),
);
const previstoAteExecucao = soma((l) => l.previsto, (l) => l.ano <= ultimoAnoComExecucao);

const porAno = anos.map((ano) => ({
  ano,
  previsto: soma((l) => l.previsto, (l) => l.ano === ano),
  executado: soma((l) => l.executado, (l) => l.ano === ano),
}));

const porMineradora = [...new Set(linhas.map((l) => l.mineradora))]
  .map((mineradora) => ({
    mineradora,
    previsto: soma((l) => l.previsto, (l) => l.mineradora === mineradora),
    executado: soma((l) => l.executado, (l) => l.mineradora === mineradora),
  }))
  .sort((a, b) => b.previsto - a.previsto);

const porStatus = statusVistos.map((status) => ({
  status,
  projetos: new Set(linhas.filter((l) => l.status === status).map((l) => l.projeto)).size,
}));

/**
 * A unidade natural de leitura é o CONTRATO (projeto × mineradora), não a
 * célula ano-a-ano: 106 linhas em vez de 848. É isto que a página mostra, e é
 * por isso que ela não precisa carregar o array inteiro — 848 linhas com o
 * texto de relato pesam 297 KiB, e a página de servidor tem teto de Worker.
 *
 * `relato` aqui é o do ANO MAIS RECENTE que tem relato: a fonte reescreve o
 * texto a cada atualização, então o mais novo é o que descreve a situação
 * atual. Concatenar todos repetiria o mesmo parágrafo várias vezes.
 */
// Agrupa por Map, nunca por chave de texto que precise de `split` depois: nome
// de projeto tem espaco, hifen e barra, entao o split reparte no lugar errado —
// e o defeito aparece como "mineradora" contendo meia frase do projeto.
const contratos = new Map<string, LinhaTac[]>();
for (const l of linhas) {
  const chave = JSON.stringify([l.projeto, l.mineradora]);
  if (!contratos.has(chave)) contratos.set(chave, []);
  contratos.get(chave)!.push(l);
}

const porProjeto = [...contratos.values()]
  .map((doContrato) => {
    const { projeto, mineradora } = doContrato[0];
    const comRelato = doContrato.filter((l) => l.relato).sort((a, b) => b.ano - a.ano);
    const anosComPrevisto = doContrato.filter((l) => (l.previsto ?? 0) > 0).map((l) => l.ano);
    return {
      projeto,
      mineradora,
      orgao: doContrato[0].orgao,
      // A situação é atributo do ANO, não do contrato — descoberto porque a
      // trava abaixo disparou. Em 105 dos 106 contratos ela é a mesma nos oito
      // anos, mas em "Plataforma de Monitoramento Geoespacial" / Minerita o
      // único ano com dinheiro (2025, R$ 3 mi) diz "Em execução" e os sete anos
      // vazios dizem "Não Iniciado" — ou seja, "Não Iniciado" é o preenchimento
      // padrão de célula sem valor, não um julgamento sobre o contrato.
      // Por isso a situação do contrato vem do ano mais recente QUE TEM
      // dinheiro previsto; sem nenhum, cai para a do último ano.
      status: (doContrato.filter((l) => (l.previsto ?? 0) > 0).sort((a, b) => b.ano - a.ano)[0] ??
        [...doContrato].sort((a, b) => b.ano - a.ano)[0]).status,
      previsto: doContrato.reduce((t, l) => t + (l.previsto ?? 0), 0),
      executado: doContrato.reduce((t, l) => t + (l.executado ?? 0), 0),
      anoInicial: anosComPrevisto.length ? Math.min(...anosComPrevisto) : null,
      anoFinal: anosComPrevisto.length ? Math.max(...anosComPrevisto) : null,
      relato: comRelato[0]?.relato ?? null,
    };
  })
  .sort((a, b) => b.previsto - a.previsto);

// Situação varia dentro do contrato é ESPERADO em pequeno número (ver o
// comentário acima), mas variar em muitos seria sinal de desalinhamento da
// decodificação — que é falha silenciosa. Avisa sempre, aborta se virar regra.
const contratosComSituacaoMista = [...contratos.values()].filter(
  (doContrato) => new Set(doContrato.map((l) => l.status)).size > 1,
);
if (contratosComSituacaoMista.length > 0) {
  console.log(
    `[tac-projetos] ${contratosComSituacaoMista.length} de ${contratos.size} contrato(s) com situação que muda ao longo dos anos:`,
  );
  for (const c of contratosComSituacaoMista.slice(0, 5)) {
    console.log(
      `[tac-projetos]   · ${c[0].mineradora} — ${c[0].projeto.slice(0, 50)} (${[...new Set(c.map((l) => l.status))].join(" → ")})`,
    );
  }
}
if (contratosComSituacaoMista.length > contratos.size * 0.25) {
  abortar(
    `${contratosComSituacaoMista.length} de ${contratos.size} contratos com situação mista — ` +
      `acima de 25% isso não é característica da fonte, é decodificação desalinhada`,
  );
}

const projetos = new Set(linhas.map((l) => l.projeto)).size;
const combinacoes = new Set(linhas.map((l) => `${l.projeto}\u0000${l.mineradora}`)).size;

console.log(`[tac-projetos] fonte: ${FONTE}`);
console.log(`[tac-projetos] linhas: ${linhas.length} (${combinacoes} projeto×mineradora × ${anos.length} anos)`);
console.log(`[tac-projetos] projetos: ${projetos} · mineradoras: ${porMineradora.length} · órgãos: ${new Set(linhas.map((l) => l.orgao)).size}`);
console.log(`[tac-projetos] anos: ${anos[0]}–${anos[anos.length - 1]} · execução reportada até ${ultimoAnoComExecucao}`);
console.log(`[tac-projetos] previsto total  R$ ${previstoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log(`[tac-projetos] executado       R$ ${executadoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log(`[tac-projetos]   = ${((executadoTotal / previstoTotal) * 100).toFixed(1)}% do plano inteiro (até ${anos[anos.length - 1]})`);
console.log(`[tac-projetos]   = ${((executadoTotal / previstoAteExecucao) * 100).toFixed(1)}% da janela já decorrida (até ${ultimoAnoComExecucao})`);

if (SO_MEDIR) process.exit(0);

const s = (t: unknown) => JSON.stringify(t);

const conteudo = `/**
 * Execução dos projetos de TAC ambiental de Minas Gerais, ano a ano, por
 * mineradora e por órgão. ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por \`scripts/coletar-tac-projetos.mts\` a partir da captura do painel
 * Power BI (fora do repo). Para regenerar, ver o cabeçalho daquele script — ele
 * documenta o formato DSR e as três compressões que enganam quem lê direto.
 *
 * ═══ COMO NÃO MENTIR COM ESTES NÚMEROS ═══
 *
 * O plano vai até ${anos[anos.length - 1]}; a fonte só reporta execução até
 * **${ultimoAnoComExecucao}**. Por isso existem DOIS percentuais aqui, e nenhum
 * deles é "o" percentual:
 *
 * · \`percentualDoPlanoInteiro\` (${((executadoTotal / previstoTotal) * 100).toFixed(1)}%) — executado ÷ previsto ${anos[0]}–${anos[anos.length - 1]}.
 *   Parece atraso, mas compara o feito com um plano que ainda tem anos pela frente.
 * · \`percentualDaJanelaDecorrida\` (${((executadoTotal / previstoAteExecucao) * 100).toFixed(1)}%) — executado ÷ previsto até ${ultimoAnoComExecucao}.
 *   É a comparação justa, e é a que deve encabeçar qualquer texto.
 *
 * Nos anos posteriores a ${ultimoAnoComExecucao}, \`executado: 0\` significa
 * **"ainda não reportado"**, não "nada foi feito". Escrever a segunda coisa
 * seria afirmar o que o dado não diz.
 *
 * \`relato\` é texto DA FONTE, transcrito sem edição — não é obra deste portal.
 */

export interface LinhaTacAmbiental {
  projeto: string;
  mineradora: string;
  /** Órgão ou instituição responsável pela execução (SUTAF, IEF, URAS…). */
  orgao: string;
  ano: number;
  status: string;
  /** Em reais. \`null\` = a fonte não informa (diferente de zero). */
  previsto: number | null;
  executado: number | null;
  /** Texto da fonte sobre a situação, quando há. */
  relato: string | null;
}

/** Uma linha por projeto × mineradora × ano. */
export const TAC_PROJETOS: LinhaTacAmbiental[] = ${s(linhas)};

/**
 * Contagens e totais medidos do array acima — importe ISTO em página de
 * servidor, nunca o array (regra de payload: ver docs/ARQUITETURA.md).
 */
export const COBERTURA_TAC_PROJETOS = {
  linhas: ${linhas.length},
  projetos: ${projetos},
  combinacoesProjetoMineradora: ${combinacoes},
  mineradoras: ${porMineradora.length},
  orgaos: ${new Set(linhas.map((l) => l.orgao)).size},
  anoInicial: ${anos[0]},
  anoFinal: ${anos[anos.length - 1]},
  /** Último ano em que a fonte reporta execução — a janela honesta termina aqui. */
  ultimoAnoComExecucao: ${ultimoAnoComExecucao},
  previstoTotal: ${previstoTotal},
  executadoTotal: ${executadoTotal},
  previstoAteUltimoAnoComExecucao: ${previstoAteExecucao},
  percentualDoPlanoInteiro: ${Number(((executadoTotal / previstoTotal) * 100).toFixed(1))},
  percentualDaJanelaDecorrida: ${Number(((executadoTotal / previstoAteExecucao) * 100).toFixed(1))},
} as const;

/** Série ano a ano — é o que permite mostrar o plano sem achatar o tempo. */
export const TAC_POR_ANO = ${s(porAno)} as const;

/** Quem prometeu quanto. Ordenado por previsto, do maior para o menor. */
export const TAC_POR_MINERADORA = ${s(porMineradora)} as const;

/** Projetos distintos em cada situação declarada pela fonte. */
export const TAC_POR_STATUS = ${s(porStatus)} as const;

export interface ContratoTacAmbiental {
  projeto: string;
  mineradora: string;
  orgao: string;
  status: string;
  /** Soma de todos os anos, em reais. */
  previsto: number;
  executado: number;
  /** Primeiro e último ano COM valor previsto — a janela real do contrato. */
  anoInicial: number | null;
  anoFinal: number | null;
  /** Relato mais recente da fonte sobre este contrato, quando há. */
  relato: string | null;
}

/**
 * A unidade de leitura da tela: um contrato por linha (projeto × mineradora),
 * ${porProjeto.length} no total — contra ${linhas.length} células ano-a-ano. É este que a
 * página de servidor importa; \`TAC_PROJETOS\` só faz sentido para quem for
 * montar série temporal, e pesa o suficiente para nunca entrar numa página de
 * servidor (ver a regra de payload em docs/ARQUITETURA.md).
 */
export const TAC_POR_PROJETO: ContratoTacAmbiental[] = ${s(porProjeto)};
`;

writeFileSync(DESTINO, conteudo, "utf8");

const relido = readFileSync(DESTINO, "utf8");
if (relido !== conteudo) abortar("arquivo gravado e relido não batem");
if (relido.includes("\uFFFD")) abortar("mojibake no arquivo gravado");

console.log(
  `[tac-projetos] gravado: ${DESTINO} (${(Buffer.byteLength(conteudo, "utf8") / 1024).toFixed(1)} KiB)`,
);
