/**
 * Prova de isolamento entre cidades.
 *
 *   npx tsx --env-file=.env.local scripts/isolamento-cidades.mts
 *
 * O RISCO Nº 1 do plano de migração é este: um call-site que esqueça o
 * filtro de cidade mostra dado de Betim numa página de outra cidade — sem
 * erro, sem log, só o número errado na tela. Foi por isso que
 * `ID_MUNICIPIO_DEFAULT` foi DELETADA em vez de virar valor padrão.
 *
 * O teste chama TODA função pública de `lib/betim` com o código de uma
 * cidade que não tem uma linha sequer no banco, e exige que cada uma
 * devolva vazio. Qualquer função que ainda carregue a cidade por dentro
 * responderia com os dados de Betim, e aparece aqui como VAZAMENTO.
 *
 * Não insere nada em `municipios`: o código de BH só é usado como
 * argumento de leitura. A prova de que as ROTAS nascem para uma cidade
 * nova é outra, e está no commit que criou `app/[municipio]`.
 */
import fs from "node:fs";
import { comoIdMunicipio } from "../lib/db/queries/municipios.js";
import { getCaixaDisponivel } from "../lib/betim/caixa.js";
import { getObras } from "../lib/betim/obras.js";
import { getSocialData } from "../lib/betim/social.js";
import { getComerciosEssenciais } from "../lib/betim/comercios.js";
import { fetchIndicadores } from "../lib/betim/indicadores.js";
import { getSegurancaData } from "../lib/betim/seguranca.js";
import { getVerbasAnalytics } from "../lib/betim/verbas.js";
import { getEducacaoResumo } from "../lib/betim/educacao.js";
import { fetchPostosAnp } from "../lib/betim/postos.js";
import { getServidores } from "../lib/betim/servidores.js";
import { getNotaTransparenciaData } from "../lib/betim/notaTransparencia.js";
import { fetchClassificados } from "../lib/betim/classificados.js";
import { fetchZapEstabelecimentos } from "../lib/betim/zap.js";
import { fetchAnunciosAtivos } from "../lib/betim/anuncios.js";
import { getConveniosFederais } from "../lib/betim/convenios.js";
import { getLegislacao } from "../lib/betim/legislacao.js";
import { getDespesasPorFuncao } from "../lib/betim/despesas.js";
import { getTemasCamara, getTemasPrefeitura } from "../lib/betim/temas.js";
import {
  fetchContatosUteis,
  fetchColetaLixo,
  fetchFarmaciasPlantao,
} from "../lib/betim/servicos.js";
import { fetchProposicoes, getSituacoesDisponiveis } from "../lib/betim/proposicoes.js";
import { getGruposEconomicos } from "../lib/betim/grupos.js";
import { getComissoesAtuais } from "../lib/betim/comissoes.js";
import { getNoticias } from "../lib/betim/noticias.js";
import { getAgroData } from "../lib/betim/agro.js";
import {
  getParaopebaData,
  getObrasParaopebaMenosConcluidas,
} from "../lib/betim/paraopeba.js";
import { montarContexto } from "../lib/betim/chat.js";
import { getVisaoGeral } from "../lib/betim/prefeitura.js";
import { fetchContratos, fetchContratosForExport } from "../lib/betim/contratos.js";
import { getSaudeData, getSaudeTendencias } from "../lib/betim/saude.js";
import {
  getVereadores,
  getRankingVereadores,
  getAtividadeRecenteCamara,
} from "../lib/betim/vereadores.js";

const BETIM = comoIdMunicipio("3106705");
/**
 * Código com o FORMATO de IBGE (7 dígitos, prefixo de UF inexistente) que
 * nunca vai ser atendido por este portal.
 *
 * Era `3106200` — Belo Horizonte. A escolha fazia sentido enquanto BH era
 * hipotética e deixou de fazer no dia em que BH virou uma linha de
 * `municipios` com dado real: a partir daí toda consulta passaria a
 * responder com o dado LEGÍTIMO de BH e o teste acusaria vazamento em massa.
 * Um sentinela que depende de uma cidade continuar não existindo tem prazo
 * de validade — este não tem.
 */
const VAZIA = comoIdMunicipio("9999999");

let vazamentos = 0;
let conferidos = 0;

/**
 * `betim` tem de trazer dado (senão o teste passaria por a consulta estar
 * quebrada dos dois lados) e `outra` tem de vir vazio.
 */
function conferir(nome: string, betim: number, outra: number) {
  conferidos++;
  if (betim === 0) {
    console.log(`INCONCLUSIVO  ${nome} — Betim também veio vazio, nada a provar`);
    return;
  }
  if (outra !== 0) {
    vazamentos++;
    console.log(`VAZAMENTO     ${nome} — Betim ${betim}, cidade vazia ${outra}`);
    return;
  }
  console.log(`isolado       ${nome} (Betim ${betim})`);
}

const casos: [string, (id: typeof BETIM) => Promise<number>][] = [
  ["caixa", async (id) => ((await getCaixaDisponivel(id)) ? 1 : 0)],
  ["obras", async (id) => (await getObras(id)).total],
  ["social", async (id) => (await getSocialData(id)).programas.length],
  ["comercios", async (id) => (await getComerciosEssenciais(id)).rows.length],
  ["indicadores", async (id) => Object.keys(await fetchIndicadores(id, ["pib"])).length],
  ["seguranca", async (id) => ((await getSegurancaData(id)).ok ? 1 : 0)],
  ["verbas", async (id) => (await getVerbasAnalytics(id)).totalRegistros],
  ["educacao", async (id) => (await getEducacaoResumo(id)).totalEscolas],
  ["postos", async (id) => (await fetchPostosAnp(id)).rows.length],
  ["servidores", async (id) => (await getServidores(id, {})).total],
  ["notaTransparencia", async (id) => ((await getNotaTransparenciaData(id)).ok ? 1 : 0)],
  ["classificados", async (id) => (await fetchClassificados(id)).rows.length],
  ["zap", async (id) => (await fetchZapEstabelecimentos(id)).rows.length],
  ["anuncios", async (id) => (await fetchAnunciosAtivos(id)).length],
  ["convenios", async (id) => (await getConveniosFederais(id)).convenios.length],
  ["legislacao", async (id) => (await getLegislacao(id)).total],
  ["despesas", async (id) => (await getDespesasPorFuncao(id)).funcoes.length],
  ["temas da camara", async (id) => (await getTemasCamara(id)).temas.length],
  ["temas da prefeitura", async (id) => (await getTemasPrefeitura(id)).temas.length],
  ["contatos uteis", async (id) => (await fetchContatosUteis(id)).rows.length],
  ["coleta de lixo", async (id) => (await fetchColetaLixo(id)).rows.length],
  ["farmacias de plantao", async (id) => (await fetchFarmaciasPlantao(id)).rows.length],
  ["proposicoes", async (id) => (await fetchProposicoes(id)).total],
  ["situacoes de proposicoes", async (id) => (await getSituacoesDisponiveis(id)).length],
  ["grupos economicos", async (id) => (await getGruposEconomicos(id)).grupos.length],
  ["grupos: denominador", async (id) => (await getGruposEconomicos(id)).valorTotalMunicipio],
  ["comissoes", async (id) => (await getComissoesAtuais(id)).rows.length],
  ["noticias", async (id) => (await getNoticias(id)).rows.length],
  ["agro", async (id) => (await getAgroData(id)).topLavouras.length],
  ["paraopeba", async (id) => (await getParaopebaData(id)).iniciativas.length],
  ["paraopeba (home)", async (id) => (await getObrasParaopebaMenosConcluidas(id, 5)).length],
  // Medido em LINHAS de fato, não em caracteres: a primeira versão deste
  // teste comparou `.length` da string e acusou vazamento onde só havia o
  // cabeçalho "NÚMEROS DA CIDADE:". Nenhum número de Betim estava lá.
  [
    "chat: contexto",
    async (id) =>
      (await montarContexto(id, "contratos de saude"))
        .split("\n")
        .filter((l) => l.startsWith("- ")).length,
  ],
  ["prefeitura: despesa", async (id) => (await getVisaoGeral(id)).despesaTotal],
  ["prefeitura: receita", async (id) => (await getVisaoGeral(id)).receitaTotal],
  ["prefeitura: fornecedores", async (id) => (await getVisaoGeral(id)).maioresFornecedores.length],
  ["contratos", async (id) => (await fetchContratos(id)).total],
  ["contratos: soma", async (id) => (await fetchContratos(id)).sum],
  ["contratos: export", async (id) => (await fetchContratosForExport(id, {})).rows.length],
  ["saude: estabelecimentos", async (id) => (await getSaudeData(id)).totalEstabelecimentos],
  ["saude: internacoes", async (id) => (await getSaudeData(id)).internacoesPorAno.length],
  ["saude: tendencias", async (id) => (await getSaudeTendencias(id)).dengueUltimasSemanas.length],
  ["vereadores", async (id) => (await getVereadores(id)).rows.length],
  ["ranking", async (id) => (await getRankingVereadores(id)).rows.length],
  [
    "atividade recente",
    async (id) => ((await getAtividadeRecenteCamara(id)).ultimoProjeto ? 1 : 0),
  ],
];

for (const [nome, fn] of casos) {
  conferir(nome, await fn(BETIM), await fn(VAZIA));
}

console.log(
  `\n${conferidos} funcoes conferidas — ${vazamentos} vazamento(s) entre cidades.`
);
if (vazamentos > 0) {
  console.log(
    "Uma funcao que vaza ainda carrega a cidade por dentro: mostraria dado de\n" +
      "Betim na pagina de outra cidade, sem erro nenhum."
  );
}
void fs;
process.exit(vazamentos > 0 ? 1 : 0);
