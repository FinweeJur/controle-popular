/**
 * Coletor da execução financeira do Acordo de Brumadinho auditada pela FGV,
 * para os 26 municípios da Bacia do Paraopeba.
 *
 * Grava `apps/web/lib/paraopeba/execucao-fgv.ts`. Não toca em banco: são
 * duas requisições GET sem autenticação e um arquivo TypeScript.
 *
 * Uso:
 *   npx tsx scripts/coletar-execucao-fgv.mts            # baixa e grava
 *   npx tsx scripts/coletar-execucao-fgv.mts --seco     # mede e não grava
 *   npx tsx scripts/coletar-execucao-fgv.mts --pausa 3000
 *
 * ═══ POR QUE ESTE SCRIPT É MANUAL, E NUNCA ENTRA EM CI ═══
 *
 * `https://www18.fgv.br/robots.txt` responde, medido em 15/08/2026:
 *
 *     User-Agent: *
 *     Disallow: /
 *
 * O host inteiro pede para não ser rastreado. Isso NÃO é a mesma coisa que
 * "o dado é fechado" — a própria página `dados-abertos.html` do projeto diz
 * "Salve os dados deste portal em planilha", e o portal oficial do Governo
 * de MG linka a FGV como a auditoria do Acordo. Mas é uma manifestação
 * explícita do servidor, e a regra da casa é ser educado com ele.
 *
 * A conciliação adotada, e o motivo de cada parte:
 *
 * - **duas requisições, não um rastreamento.** Este script não segue link
 *   nenhum: pede dois JSON de caminho fixo, os mesmos dois que o navegador
 *   de qualquer visitante pede ao abrir a página de informações financeiras.
 * - **rodado à mão, quando o dono quiser.** Nada de agendador, nada de CI.
 *   A referência do relatório muda uma vez por mês (medido: 20/07/2026 na
 *   coleta de 15/08/2026), então recoletar mais que isso não traz dado novo.
 * - **User-Agent que diz quem é** e pausa configurável entre as duas.
 * - **canal aberto se incomodar:** a própria FGV publica
 *   `projetorioparaopeba@fgv.br` no rodapé. Se a automação virar rotina, o
 *   caminho certo é pedir autorização por ali antes, não aumentar a
 *   frequência e esperar.
 *
 * ═══ TRÊS ARMADILHAS MEDIDAS NESTES DOIS ARQUIVOS ═══
 *
 * 1. **O município mora numa célula mesclada.** Em `Síntese Mun.por
 *    Projeto` (483 linhas), **424 não têm a chave `Município`**: o nome só
 *    aparece na PRIMEIRA linha do bloco de cada cidade e as seguintes
 *    herdam. Ler linha a linha sem propagar o último nome joga fora 88% do
 *    acervo; ler e deixar vazio ainda pior, porque atribui projeto a
 *    ninguém. Aqui há propagação explícita (`municipioCorrente`) e uma
 *    trava: nenhuma linha de projeto pode sair sem município.
 *
 * 2. **Linha de rodapé disfarçada de município.** No mesmo array, o campo
 *    `Município` também carrega `"<Nome> Total"` (subtotal do bloco),
 *    `"Total Geral"`, `"Observações:"` e cinco notas de rodapé numeradas.
 *    Contar `length` daria 483 "projetos" e 59 "municípios" — os números
 *    reais são 450 e 26. O filtro está em `ehLinhaDeRodape`.
 *
 * 3. **"Todos os Municípios de Minas Gerais" não é município.** Em
 *    `01_status_projetos.json` aparece como 27º nome entre os 26 da bacia.
 *    É o rótulo dos projetos de alcance estadual. Entra como está, num
 *    campo próprio (`estadual`), e nunca vira linha de cidade — casar por
 *    nome sem essa checagem inventa uma cidade no mapa.
 *
 * E uma quarta, de tipo: a MESMA coluna vem ora como número JS, ora como
 * string no formato americano (`"90,878,377.86 "`, com espaço rígido no
 * fim). `numero()` trata os dois e **aborta** no que não for nenhum dos
 * dois — em vez de gravar `NaN` e deixar a tela mostrar "R$ NaN".
 *
 * ═══ O QUE NÃO É COLETADO, E POR QUÊ ═══
 *
 * `02_projetos_andamento.json` (1,35 MB) traz avanço físico planejado ×
 * executado. Ficou de fora **desta** coleta porque repete o array inteiro
 * de avanço em cada linha de município: 499 linhas carregam 6.933 entradas
 * para 428 pares (projeto, município) distintos. É dado bom, mas exige
 * deduplicação própria e uma tela própria — ver
 * `docs/FONTES-PRO-BRUMADINHO-E-FGV.md`.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AGENTE = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)";
const BASE = "https://www18.fgv.br/projetorioparaopeba/library/json";
const SAIDA = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../apps/web/lib/paraopeba/execucao-fgv.ts",
);

/** Rótulo que a FGV usa para projeto de alcance estadual, não para uma cidade. */
const ROTULO_ESTADUAL = "Todos os Municípios de Minas Gerais";

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Argumentos {
  seco: boolean;
  pausa: number;
}

function lerArgumentos(argv: string[]): Argumentos {
  const seco = argv.includes("--seco");
  const i = argv.indexOf("--pausa");
  const pausa = i >= 0 ? Number(argv[i + 1]) : 1500;
  if (!Number.isFinite(pausa) || pausa < 0) throw new Error(`--pausa inválida: ${argv[i + 1]}`);
  return { seco, pausa };
}

/**
 * Os arquivos vêm com BOM UTF-8 (`EF BB BF`). `res.json()` do Node engasga
 * nele — por isso o texto é lido cru e o BOM removido à mão antes do parse.
 */
async function baixarJson(nome: string): Promise<Record<string, unknown>> {
  const url = `${BASE}/${nome}.json`;
  const res = await fetch(url, { headers: { "User-Agent": AGENTE, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${nome}: HTTP ${res.status}`);
  const texto = (await res.text()).replace(/^﻿/, "");
  return JSON.parse(texto) as Record<string, unknown>;
}

/**
 * Converte o valor monetário aceitando as DUAS formas em que a FGV publica
 * a mesma coluna. Aborta no que não for nenhuma — `NaN` silencioso vira
 * "R$ NaN" na tela e ninguém descobre pela contagem.
 */
function numero(bruto: unknown, onde: string): number {
  if (typeof bruto === "number" && Number.isFinite(bruto)) return bruto;
  if (typeof bruto === "string") {
    // Formato americano com separador de milhar: "90,878,377.86 " (o espaço
    // do fim é U+00A0, não U+0020 — `trim()` do JS pega os dois).
    const limpo = bruto.replace(/ /g, " ").trim().replace(/,/g, "").replace(/%$/, "");
    const n = Number(limpo);
    if (Number.isFinite(n)) return n;
  }
  throw new Error(`valor não numérico em ${onde}: ${JSON.stringify(bruto)}`);
}

/** Nome de município como a FGV grava — com espaço rígido colado no fim. */
function limparNome(bruto: unknown): string {
  return String(bruto ?? "")
    .replace(/ /g, " ")
    .trim();
}

/**
 * Distingue linha de dado de linha de layout de planilha. Sem isto, o
 * `Total Geral` e as cinco notas de rodapé viram "municípios".
 */
function ehLinhaDeRodape(nome: string): boolean {
  return (
    nome === "" ||
    nome === "Total Geral" ||
    nome === "Observações:" ||
    nome.endsWith(" Total") ||
    /^\d\)/.test(nome)
  );
}

interface MunicipioBruto {
  municipio: string;
  acordoInicial: number;
  acordoAtual: number;
  empenhosAutorizados: number;
  saldoTeto: number;
}

interface ProjetoBruto {
  municipio: string;
  projeto: string;
  empenhoNominal: number;
  empenhoAtualizado: number;
  executado: number;
  saldo: number;
  nivelExecucao: number;
}

interface EspecialBruto {
  projeto: string;
  empenhoNominal: number;
  empenhoAtualizado: number;
  executado: number;
  saldo: number;
  nivelExecucao: number;
}

interface StatusBruto {
  idFdi: string;
  projeto: string;
  municipios: string[];
  estadual: boolean;
  anexo: string;
  fluxo: string;
  status: string;
}

function extrairMunicipios(linhas: Record<string, unknown>[]): MunicipioBruto[] {
  const fora: MunicipioBruto[] = [];
  for (const l of linhas) {
    const nome = limparNome(l["Município"]);
    if (ehLinhaDeRodape(nome)) continue;
    fora.push({
      municipio: nome,
      acordoInicial: numero(l["Valor do Acordo Inicial (R$) (1)"], `${nome}/inicial`),
      acordoAtual: numero(l["Valor do Acordo Atual (R$) (2) "], `${nome}/atual`),
      empenhosAutorizados: numero(
        l["Total de Empenhos Autorizados Atualizados (R$) (3)"],
        `${nome}/empenhos`,
      ),
      saldoTeto: numero(l["Saldo Teto Considerando a Reserva (R$) (4)"], `${nome}/saldo`),
    });
  }
  return fora;
}

function extrairProjetos(linhas: Record<string, unknown>[]): ProjetoBruto[] {
  const fora: ProjetoBruto[] = [];
  // ⚠️ A célula do município é MESCLADA na planilha de origem: só a primeira
  // linha de cada bloco traz a chave. Sem esta variável, 424 das 483 linhas
  // sairiam sem cidade.
  let municipioCorrente = "";
  for (const l of linhas) {
    if ("Município" in l) {
      const nome = limparNome(l["Município"]);
      if (ehLinhaDeRodape(nome)) {
        // Subtotal do bloco (`"Betim Total"`) fecha a cidade corrente; nota
        // de rodapé também. Zerar aqui evita que o rodapé do arquivo herde
        // o último município e vire projeto fantasma de Três Marias.
        municipioCorrente = "";
        continue;
      }
      municipioCorrente = nome;
    }
    const projeto = limparNome(l["Projeto"]);
    if (!projeto) continue;
    if (!municipioCorrente) {
      throw new Error(`linha de projeto sem município corrente: ${projeto}`);
    }
    fora.push({
      municipio: municipioCorrente,
      projeto,
      empenhoNominal: numero(l["Empenho Autorizado Nominal  (R$) (1)"], `${projeto}/nominal`),
      empenhoAtualizado: numero(
        l["Empenho Autorizado Atualizado (R$) (2)"],
        `${projeto}/atualizado`,
      ),
      executado: numero(l["Execução Atualizada (R$) (3)"], `${projeto}/executado`),
      saldo: numero(
        l["Saldo Empenhado Autorizado Atualizado Menos Executado (R$) (4)"],
        `${projeto}/saldo`,
      ),
      nivelExecucao: numero(l["Nível da Execução (5)"], `${projeto}/nivel`),
    });
  }
  return fora;
}

function extrairEspeciais(linhas: Record<string, unknown>[]): EspecialBruto[] {
  const fora: EspecialBruto[] = [];
  for (const l of linhas) {
    const projeto = limparNome(l["Projeto"]);
    if (ehLinhaDeRodape(projeto)) continue;
    fora.push({
      projeto,
      empenhoNominal: numero(l["Empenho Autorizado Nominal (R$) (1)"], `${projeto}/nominal`),
      empenhoAtualizado: numero(
        l["Empenho Autorizado Atualizado (R$) (2)"],
        `${projeto}/atualizado`,
      ),
      executado: numero(l["Execução Atualizada (R$) (3)"], `${projeto}/executado`),
      saldo: numero(
        l["Saldo Empenhado Autorizado Atualizado Menos Executado (R$) (4)"],
        `${projeto}/saldo`,
      ),
      nivelExecucao: numero(l["Percentual de Execução (5)"], `${projeto}/percentual`),
    });
  }
  return fora;
}

function extrairStatus(linhas: Record<string, unknown>[]): StatusBruto[] {
  return linhas.map((l) => {
    const bruto = limparNome(l["Municipios"]);
    const partes = bruto
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    // ⚠️ "Todos os Municípios de Minas Gerais" é rótulo de alcance, não
    // cidade. Fica num booleano próprio e sai da lista de municípios.
    const estadual = partes.includes(ROTULO_ESTADUAL);
    return {
      idFdi: limparNome(l["ID FDI"]),
      projeto: limparNome(l["Projeto"]),
      municipios: partes.filter((m) => m !== ROTULO_ESTADUAL),
      estadual,
      anexo: limparNome(l["Anexo"]),
      fluxo: limparNome(l["Pacote de Resposta Rápida ou Fluxo Ordinário"]),
      status: limparNome(l["Status"]),
    };
  });
}

function ts(v: string): string {
  return JSON.stringify(v);
}

function gerarArquivo(dados: {
  referenciaRelatorio: string;
  ultimaAtualizacaoFinanceiro: string;
  coletadoEm: string;
  municipios: MunicipioBruto[];
  projetos: ProjetoBruto[];
  especiais: EspecialBruto[];
  status: StatusBruto[];
  totalGeral: MunicipioBruto | null;
}): string {
  const l: string[] = [];
  l.push(`// GERADO por \`scripts/coletar-execucao-fgv.mts\` a partir dos dois JSON`);
  l.push(`// públicos da auditoria da FGV (\`www18.fgv.br/projetorioparaopeba\`).`);
  l.push(`// Não editar à mão: rode o script de novo.`);
  l.push(`//`);
  l.push(`// A FGV é a auditora independente do Acordo Judicial de Reparação de`);
  l.push(`// Brumadinho (R$ 37,6 bi, 04/02/2021), nomeada pelo Juízo da 2ª Vara da`);
  l.push(`// Fazenda Pública. Estes números são a execução dos Anexos I.3 e I.4 —`);
  l.push(`// a parte do Acordo que vira projeto dentro de cada município da bacia.`);
  l.push(`//`);
  l.push(`// ⚠️ ISTO NÃO É O ACORDO INTEIRO. São R$ 5,48 bi de acordo atualizado`);
  l.push(`// nos 26 municípios, contra os R$ 37,6 bi do Acordo todo: mobilidade,`);
  l.push(`// segurança hídrica, fortalecimento do serviço público e reparação`);
  l.push(`// socioambiental correm por fora, sob gestão do Estado, e a FGV não os`);
  l.push(`// audita aqui. Somar este total com o do Acordo inventa dinheiro.`);
  l.push(`//`);
  l.push(`// ⚠️ "Executado" é desembolso do projeto, não obra pronta. O avanço`);
  l.push(`// FÍSICO mora em outro arquivo da FGV, que esta coleta não traz —`);
  l.push(`// \`docs/FONTES-PRO-BRUMADINHO-E-FGV.md\` explica por quê.`);
  l.push(``);
  l.push(`/** Um dos 26 municípios da Bacia do Paraopeba cobertos pelo Anexo I.3/I.4. */`);
  l.push(`export interface MunicipioExecucaoFgv {`);
  l.push(`  municipio: string;`);
  l.push(`  /** Valor destinado ao município no texto original do Acordo (R$). */`);
  l.push(`  acordoInicial: number;`);
  l.push(`  /** O mesmo valor corrigido pelo IPCA desde 04/02/2021 (R$). */`);
  l.push(`  acordoAtual: number;`);
  l.push(`  /** Já reservado para projetos com ordem de início autorizada (R$). */`);
  l.push(`  empenhosAutorizados: number;`);
  l.push(`  /** Sobra disponível, já descontada a reserva de 25% da FGV (R$). */`);
  l.push(`  saldoTeto: number;`);
  l.push(`}`);
  l.push(``);
  l.push(`/** Uma linha (município × projeto) da síntese financeira da FGV. */`);
  l.push(`export interface ProjetoExecucaoFgv {`);
  l.push(`  municipio: string;`);
  l.push(`  projeto: string;`);
  l.push(`  empenhoNominal: number;`);
  l.push(`  empenhoAtualizado: number;`);
  l.push(`  /** Valor efetivamente despendido — desembolso, não obra entregue. */`);
  l.push(`  executado: number;`);
  l.push(`  saldo: number;`);
  l.push(`  /** Percentual de execução sobre o empenho atualizado (0 a 100). */`);
  l.push(`  nivelExecucao: number;`);
  l.push(`}`);
  l.push(``);
  l.push(`/** Projeto especial: fora do rateio por município, sob gestão estadual. */`);
  l.push(`export interface ProjetoEspecialFgv {`);
  l.push(`  projeto: string;`);
  l.push(`  empenhoNominal: number;`);
  l.push(`  empenhoAtualizado: number;`);
  l.push(`  executado: number;`);
  l.push(`  saldo: number;`);
  l.push(`  nivelExecucao: number;`);
  l.push(`}`);
  l.push(``);
  l.push(`/** Situação declarada de cada projeto, por município alcançado. */`);
  l.push(`export interface StatusProjetoFgv {`);
  l.push(`  /** Identificador do projeto na FGV — repete entre municípios. */`);
  l.push(`  idFdi: string;`);
  l.push(`  projeto: string;`);
  l.push(`  /** Só municípios de verdade — o rótulo estadual sai daqui. */`);
  l.push(`  municipios: string[];`);
  l.push(`  /** \`true\` quando o projeto alcança todo o estado, não só a bacia. */`);
  l.push(`  estadual: boolean;`);
  l.push(`  anexo: string;`);
  l.push(`  fluxo: string;`);
  l.push(`  status: string;`);
  l.push(`}`);
  l.push(``);
  l.push(`/**`);
  l.push(` * Datas que a própria FGV declara nos arquivos. Rotular a tela por elas,`);
  l.push(` * nunca por "hoje": o relatório é mensal e a coleta é manual.`);
  l.push(` */`);
  l.push(`export const REFERENCIA_EXECUCAO_FGV = {`);
  l.push(`  /** \`dataAtualizacaoRelatorio\` do arquivo de status (dd/mm/aaaa). */`);
  l.push(`  relatorio: ${ts(dados.referenciaRelatorio)},`);
  l.push(`  /** Data que o arquivo financeiro declara no próprio menu. */`);
  l.push(`  financeiro: ${ts(dados.ultimaAtualizacaoFinanceiro)},`);
  l.push(`  /** Quando este portal baixou (aaaa-mm-dd). */`);
  l.push(`  coletadoEm: ${ts(dados.coletadoEm)},`);
  l.push(`  fonte: "FGV — Projeto Rio Paraopeba",`);
  l.push(`  url: "https://www18.fgv.br/projetorioparaopeba/acompanhamento-saldo-municipios.html",`);
  l.push(`} as const;`);
  l.push(``);
  if (dados.totalGeral) {
    l.push(`/**`);
    l.push(` * A linha "Total Geral" da própria FGV — guardada como ela vem, para a`);
    l.push(` * tela poder conferir a soma em vez de somar por conta própria (e para`);
    l.push(` * a diferença aparecer, se um dia houver).`);
    l.push(` */`);
    l.push(`export const TOTAL_EXECUCAO_FGV = {`);
    l.push(`  acordoInicial: ${dados.totalGeral.acordoInicial},`);
    l.push(`  acordoAtual: ${dados.totalGeral.acordoAtual},`);
    l.push(`  empenhosAutorizados: ${dados.totalGeral.empenhosAutorizados},`);
    l.push(`  saldoTeto: ${dados.totalGeral.saldoTeto},`);
    l.push(`} as const;`);
    l.push(``);
  }
  l.push(`export const MUNICIPIOS_EXECUCAO_FGV: MunicipioExecucaoFgv[] = [`);
  for (const m of dados.municipios) {
    l.push(
      `  { municipio: ${ts(m.municipio)}, acordoInicial: ${m.acordoInicial}, acordoAtual: ${m.acordoAtual}, empenhosAutorizados: ${m.empenhosAutorizados}, saldoTeto: ${m.saldoTeto} },`,
    );
  }
  l.push(`];`);
  l.push(``);
  l.push(`export const PROJETOS_EXECUCAO_FGV: ProjetoExecucaoFgv[] = [`);
  for (const p of dados.projetos) {
    l.push(
      `  { municipio: ${ts(p.municipio)}, projeto: ${ts(p.projeto)}, empenhoNominal: ${p.empenhoNominal}, empenhoAtualizado: ${p.empenhoAtualizado}, executado: ${p.executado}, saldo: ${p.saldo}, nivelExecucao: ${p.nivelExecucao} },`,
    );
  }
  l.push(`];`);
  l.push(``);
  l.push(`export const PROJETOS_ESPECIAIS_FGV: ProjetoEspecialFgv[] = [`);
  for (const e of dados.especiais) {
    l.push(
      `  { projeto: ${ts(e.projeto)}, empenhoNominal: ${e.empenhoNominal}, empenhoAtualizado: ${e.empenhoAtualizado}, executado: ${e.executado}, saldo: ${e.saldo}, nivelExecucao: ${e.nivelExecucao} },`,
    );
  }
  l.push(`];`);
  l.push(``);
  l.push(`export const STATUS_PROJETOS_FGV: StatusProjetoFgv[] = [`);
  for (const s of dados.status) {
    const muns = `[${s.municipios.map(ts).join(", ")}]`;
    l.push(
      `  { idFdi: ${ts(s.idFdi)}, projeto: ${ts(s.projeto)}, municipios: ${muns}, estadual: ${s.estadual}, anexo: ${ts(s.anexo)}, fluxo: ${ts(s.fluxo)}, status: ${ts(s.status)} },`,
    );
  }
  l.push(`];`);
  l.push(``);
  return l.join("\n");
}

async function main() {
  const { seco, pausa } = lerArgumentos(process.argv.slice(2));

  const saldo = await baixarJson("03_saldo_dos_municipios");
  await dormir(pausa);
  const status = await baixarJson("01_status_projetos");

  // ⚠️ Nunca validar pelo status HTTP. Um 200 com esqueleto vazio é o modo
  // clássico de falhar de portal de governo — a checagem é de CONTEÚDO.
  const geral = saldo["Síntese Municípios Geral"] as Record<string, unknown>[] | undefined;
  const porProjeto = saldo["Síntese Mun.por Projeto"] as Record<string, unknown>[] | undefined;
  const especiaisBrutos = saldo["Síntese Projetos Especiais"] as
    | Record<string, unknown>[]
    | undefined;
  const statusBrutos = status["Status Projetos"] as Record<string, unknown>[] | undefined;
  if (!geral?.length || !porProjeto?.length || !especiaisBrutos?.length || !statusBrutos?.length) {
    throw new Error("arquivo respondeu, mas veio sem um dos quatro blocos esperados");
  }

  const municipios = extrairMunicipios(geral);
  // `extrairMunicipios` descarta "Total Geral" junto com o resto do rodapé —
  // recuperado aqui à parte, porque a tela precisa do total DECLARADO pela
  // FGV, não de uma soma feita por nós.
  const totalLinha = geral.find((l) => limparNome(l["Município"]) === "Total Geral");
  const total = totalLinha
    ? {
        municipio: "Total Geral",
        acordoInicial: numero(totalLinha["Valor do Acordo Inicial (R$) (1)"], "total/inicial"),
        acordoAtual: numero(totalLinha["Valor do Acordo Atual (R$) (2) "], "total/atual"),
        empenhosAutorizados: numero(
          totalLinha["Total de Empenhos Autorizados Atualizados (R$) (3)"],
          "total/empenhos",
        ),
        saldoTeto: numero(
          totalLinha["Saldo Teto Considerando a Reserva (R$) (4)"],
          "total/saldo",
        ),
      }
    : null;

  const projetos = extrairProjetos(porProjeto);
  const especiais = extrairEspeciais(especiaisBrutos);
  const situacoes = extrairStatus(statusBrutos);

  // Travas de sanidade: o Acordo alcança 26 municípios da bacia. Se virar
  // 25 ou 30, a fonte mudou de forma e a tela não pode publicar às cegas.
  if (municipios.length < 20 || municipios.length > 40) {
    throw new Error(`contagem de municípios fora do esperado: ${municipios.length}`);
  }
  const semMunicipio = projetos.filter((p) => !p.municipio);
  if (semMunicipio.length) throw new Error(`${semMunicipio.length} projetos sem município`);
  const cidadesDosProjetos = new Set(projetos.map((p) => p.municipio));
  const cidadesDaSintese = new Set(municipios.map((m) => m.municipio));
  for (const c of cidadesDosProjetos) {
    if (!cidadesDaSintese.has(c)) throw new Error(`projeto em município fora da síntese: ${c}`);
  }

  const menu = (saldo["MENU "] ?? saldo["MENU"]) as Record<string, unknown>[] | undefined;
  const ultimaFinanceiro = (menu ?? [])
    .map((x) => limparNome(Object.values(x)[0]))
    .find((t) => /\d{2}\/\d{2}\/\d{4}/.test(t));

  console.log(`[execucao-fgv] municipios=${municipios.length}`);
  console.log(`[execucao-fgv] projetos_municipio=${projetos.length}`);
  console.log(`[execucao-fgv] projetos_especiais=${especiais.length}`);
  console.log(`[execucao-fgv] linhas_status=${situacoes.length}`);
  console.log(`[execucao-fgv] ids_distintos=${new Set(situacoes.map((s) => s.idFdi)).size}`);
  console.log(`[execucao-fgv] relatorio=${limparNome(status["dataAtualizacaoRelatorio"])}`);
  console.log(`[execucao-fgv] financeiro=${ultimaFinanceiro ?? "(não declarado)"}`);
  console.log(`[execucao-fgv] total_declarado=${total?.acordoAtual ?? "(ausente)"}`);

  if (seco) {
    console.log("[execucao-fgv] --seco: nada gravado");
    return;
  }

  const conteudo = gerarArquivo({
    referenciaRelatorio: limparNome(status["dataAtualizacaoRelatorio"]),
    ultimaAtualizacaoFinanceiro: (ultimaFinanceiro ?? "").replace(/^Última atualização em\s*/i, ""),
    coletadoEm: new Date().toISOString().slice(0, 10),
    municipios,
    projetos,
    especiais,
    status: situacoes,
    totalGeral: total,
  });
  writeFileSync(SAIDA, conteudo, "utf-8");
  console.log(`[execucao-fgv] gravado ${SAIDA} (${conteudo.length} bytes)`);
}

main().catch((e) => {
  console.error(`[execucao-fgv] ABORT: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
