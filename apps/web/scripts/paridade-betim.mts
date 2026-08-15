import fs from "node:fs";
import { neon } from "@neondatabase/serverless";
import { comoIdMunicipio } from "../lib/db/queries/municipios.js";
import * as q from "../lib/db/queries/betim.js";
import { getCaixaDisponivel } from "../lib/betim/caixa.js";
import { getObras } from "../lib/betim/obras.js";
import { getSocialData } from "../lib/betim/social.js";
import { getComerciosEssenciais } from "../lib/betim/comercios.js";
import { fetchIndicadores } from "../lib/betim/indicadores.js";
import { getSegurancaData } from "../lib/betim/seguranca.js";
import { getVerbasAnalytics } from "../lib/betim/verbas.js";
import { getEducacaoResumo, listarEscolasDoMunicipio } from "../lib/betim/educacao.js";
import { fetchPostosAnp } from "../lib/betim/postos.js";
import { getServidores } from "../lib/betim/servidores.js";
import { getNotaTransparenciaData } from "../lib/betim/notaTransparencia.js";
import { fetchClassificados } from "../lib/betim/classificados.js";
import { fetchZapEstabelecimentos } from "../lib/betim/zap.js";
import { fetchAnunciosAtivos } from "../lib/betim/anuncios.js";
import { getConveniosFederais } from "../lib/betim/convenios.js";
import { getLegislacao } from "../lib/betim/legislacao.js";
import { getDespesasPorFuncao } from "../lib/betim/despesas.js";
import { getTemasCamara, getTemasPrefeitura, getTemasVereador } from "../lib/betim/temas.js";
import {
  fetchContatosUteis,
  fetchColetaLixo,
  fetchFarmaciasPlantao,
} from "../lib/betim/servicos.js";
import { fetchProposicoes, getSituacoesDisponiveis } from "../lib/betim/proposicoes.js";
import { getGruposEconomicos } from "../lib/betim/grupos.js";
import { getComissoesAtuais, getParticipacoesByVereador } from "../lib/betim/comissoes.js";
import { getNoticias, getNoticiaBySlug } from "../lib/betim/noticias.js";
import { getAgroData } from "../lib/betim/agro.js";
import {
  getParaopebaData,
  getObrasParaopebaMenosConcluidas,
} from "../lib/betim/paraopeba.js";
import { montarContexto } from "../lib/betim/chat.js";
import { formatCurrencyBRL, formatNumberBR } from "../lib/betim/format.js";
import { getVisaoGeral } from "../lib/betim/prefeitura.js";
import {
  fetchContratos,
  fetchContratosForExport,
  CONTRATOS_PAGE_SIZE,
} from "../lib/betim/contratos.js";
import { getSaudeData, getSaudeTendencias } from "../lib/betim/saude.js";
import {
  getVereadores,
  getVereadorBySlug,
  getRankingVereadores,
  getProposicoesByVereador,
  getDiariasByVereador,
  getDoacoesSummary,
  getBensCandidato,
  getAtividadeRecenteCamara,
  PESO_PROPOSICAO,
} from "../lib/betim/vereadores.js";

// `comoIdMunicipio` é a saída deliberada da marca nominal de `IdMunicipio`.
// Existe exatamente para bordas como esta, onde o valor não vem da tabela
// `municipios` — ver o comentário do tipo em lib/db/queries/municipios.ts.
const ID = comoIdMunicipio("3106705"); // Betim
const t = fs.readFileSync("X:/DevCoder/betim-ai/.env", "utf8");
const env = (k: string) => t.match(new RegExp("^" + k + "=(.*)$", "m"))?.[1].trim().replace(/^["']|["']$/g, "") ?? "";

/** PostgREST corta em 1000 linhas sem erro — paginar sempre. */
async function rest(path: string) {
  const out: any[] = [];
  for (let de = 0; ; de += 1000) {
    const r = await fetch(`${env("NEXT_PUBLIC_SUPABASE_URL")}/rest/v1/${path}`, {
      headers: { apikey: env("SUPABASE_SERVICE_ROLE_KEY"), Authorization: `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}`, Range: `${de}-${de + 999}` },
    });
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
    const lote = (await r.json()) as any[];
    out.push(...lote);
    if (lote.length < 1000) return out;
  }
}
const eq = (n: string, a: unknown, b: unknown) =>
  console.log(JSON.stringify(a) === JSON.stringify(b) ? "IGUAL " : "DIFERE", n);

// caixa: os 2 anos mais recentes
const cx = (await rest(`caixa_disponivel?select=ano,valor&id_municipio=eq.${ID}&order=ano.desc&limit=2`)).slice(0, 2);
const cxN = await getCaixaDisponivel(ID);
eq(`caixa (${cx[0]?.ano}: ${cx[0]?.valor} vs ${cxN?.valor})`,
   { ano: cx[0]?.ano, valor: Number(cx[0]?.valor), anoAnterior: cx[1]?.ano ?? null, valorAnterior: cx[1] ? Number(cx[1].valor) : null },
   cxN);

// obras: total e soma
const ob = await rest(`obras?select=nome,situacao,valor,percentual_execucao&id_municipio=eq.${ID}`);
const obN = await getObras(ID);
eq(`obras (${ob.length} vs ${obN.total})`, ob.length, obN.total);
const somaS = ob.reduce((a, r) => a + (Number(r.valor) || 0), 0);
eq(`obras soma (${somaS.toFixed(2)} vs ${obN.valorTotal.toFixed(2)})`, Math.round(somaS), Math.round(obN.valorTotal));

// social: programas
const so = await rest(`beneficios_sociais?select=programa&id_municipio=eq.${ID}`);
const soN = await getSocialData(ID);
eq(`social programas (${new Set(so.map((r) => r.programa)).size} vs ${soN.programas.length})`,
   new Set(so.map((r) => r.programa)).size, soN.programas.length);

// comercios
const co = await rest(`comercios_essenciais?select=id&id_municipio=eq.${ID}`);
const coN = await getComerciosEssenciais(ID);
eq(`comercios (${co.length} vs ${coN.rows.length})`, co.length, coN.rows.length);

// indicadores: valor_numerico e numeric, valor e TEXT — nao converter
const nomes = ["pib", "pib_per_capita"];
const ind = await rest(`indicadores?select=nome,valor,valor_numerico&id_municipio=eq.${ID}&nome=in.(${nomes.join(",")})&order=ano_referencia.desc`);
const indN = await fetchIndicadores(ID, nomes);
eq(`indicadores pib (${ind.find((r) => r.nome === "pib")?.valor_numerico} vs ${indN["pib"]?.valor_numerico})`,
   Number(ind.find((r) => r.nome === "pib")?.valor_numerico), indN["pib"]?.valor_numerico);
eq(`indicadores valor e texto (${JSON.stringify(ind.find((r) => r.nome === "pib")?.valor)})`,
   ind.find((r) => r.nome === "pib")?.valor ?? null, indN["pib"]?.valor ?? null);

// seguranca
const sg = await rest(`seguranca_ocorrencias?select=ano&id_municipio=eq.${ID}`);
const sgN = await getSegurancaData(ID);
eq(`seguranca configurado (${sg.length} linhas)`, sg.length > 0, sgN.configured && sgN.ok);

// verbas: soma
const vb = await rest(`verbas_indenizatorias?select=valor&id_municipio=eq.${ID}`);
const vbN = await getVerbasAnalytics(ID);
const somaV = vb.reduce((a, r) => a + (Number(r.valor) || 0), 0);
eq(`verbas soma (${somaV.toFixed(2)} vs ${vbN.total.toFixed(2)})`, Math.round(somaV * 100), Math.round(vbN.total * 100));

// educacao: total de escolas
const ec = await rest(`escolas?select=id_inep&id_municipio=eq.${ID}`);
const ecN = await getEducacaoResumo(ID);
eq(`escolas (${ec.length} vs ${ecN.totalEscolas})`, ec.length, ecN.totalEscolas);

// postos
const po = await rest(`postos_anp?select=cnpj&id_municipio=eq.${ID}`);
const poN = await fetchPostosAnp(ID);
eq(`postos (${po.length} vs ${poN.rows.length})`, po.length, poN.rows.length);

// servidores: total do conjunto
const sv = await rest(`servidores?select=nome&id_municipio=eq.${ID}&order=nome.asc`);
const svN = await getServidores(ID, {});
eq(`servidores total (${sv.length} vs ${svN.total})`, sv.length, svN.total);

/**
 * ORDENACAO POR TEXTO — a verificacao que faltava.
 *
 * O banco do Neon foi criado com collation `C.UTF-8` (ordem de BYTE) e o
 * do Supabase usa collation linguistica. Com os MESMOS dados, `order by
 * nome` sai diferente: "Ética" vai para o fim da lista e "ANTÔNIO" para
 * depois de todos os "ANTONIO". Nao da erro, nao da log — so embaralha a
 * lista na tela, e numa lista paginada muda quem aparece em qual pagina.
 *
 * As comparacoes anteriores conferiam COUNT e SOMA, que sao invariantes a
 * ordem, entao nada disso aparecia. Estas conferem a SEQUENCIA.
 *
 * A correcao e `collate "pt-BR-x-icu"` (ver lib/db/ordem.ts), que
 * reproduz a ordem do Supabase exatamente.
 */
eq(`servidores em ordem pt-BR (${sv.length} nomes, pagina 1 de ${Math.ceil(sv.length / 50)})`,
   sv.slice(0, 50).map((r) => r.nome), svN.rows.map((r) => r.nome));
// A pagina 24 e onde a collation de byte comecava a divergir (linha 1.158).
eq(`servidores pagina 24 em ordem pt-BR`,
   sv.slice(1150, 1200).map((r) => r.nome),
   (await getServidores(ID, { page: 24 })).rows.map((r) => r.nome));
const es = await rest(`escolas?select=nome&id_municipio=eq.${ID}&order=nome.asc`);
// O `?? es.map(...)` que estava aqui comparava a fonte com ela mesma quando
// `escolas` vinha indefinido — ou seja, o check passava sem ter conferido nada.
// `listarEscolasDoMunicipio` devolve sempre um array, entao a comparacao e real.
eq(`escolas em ordem pt-BR (${es.length})`,
   es.map((r) => r.nome), (await listarEscolasDoMunicipio(ID)).map((e) => e.nome));
const pa = await rest(`postos_anp?select=razao_social&id_municipio=eq.${ID}&order=razao_social.asc`);
eq(`postos em ordem pt-BR (${pa.length})`,
   pa.map((r) => r.razao_social), (await fetchPostosAnp(ID)).rows.map((r) => r.razao_social));

// nota de transparencia
const nt = await rest(`nota_transparencia?select=poder,ano&id_municipio=eq.${ID}`);
const ntN = await getNotaTransparenciaData(ID);
eq(`nota transparencia (${nt.length} linhas)`, nt.length > 0, ntN.configured && ntN.ok);

// ---- bloco 2: classificados, zap, anuncios, convenios, legislacao ----

const HOJE = new Date().toISOString().slice(0, 10);

// classificados vigentes: mesmo conjunto de ids e mesmos precos.
// Comparado como CONJUNTO porque o Neon ganhou desempate por id e o
// PostgREST nao tinha nenhum — a ordem entre linhas de mesmo created_at
// era indefinida la, nao aqui.
const cl = await rest(
  `classificados?select=id,titulo,preco&id_municipio=eq.${ID}&aprovado=eq.true&expira_em=gte.${HOJE}`
);
const clN = await fetchClassificados(ID);
eq(`classificados (${cl.length} vs ${clN.rows.length})`,
   cl.map((r) => r.id).sort(), clN.rows.map((r) => r.id).sort());
eq(`classificados precos`,
   cl.map((r) => (r.preco == null ? null : Number(r.preco))).sort(),
   clN.rows.map((r) => r.preco).sort());

// classificados com filtro de categoria (exercita o `if (opts.categoria)`)
const catAlvo = (cl.length && (await rest(
  `classificados?select=categoria&id_municipio=eq.${ID}&aprovado=eq.true&limit=1`
))[0]?.categoria) || "imoveis";
const clC = await rest(
  `classificados?select=id&id_municipio=eq.${ID}&aprovado=eq.true&expira_em=gte.${HOJE}&categoria=eq.${catAlvo}`
);
const clCN = await fetchClassificados(ID, { categoria: catAlvo });
eq(`classificados categoria=${catAlvo} (${clC.length} vs ${clCN.rows.length})`, clC.length, clCN.rows.length);

// zap: nomes em ordem (order by nome asc dos dois lados)
const zp = await rest(
  `zap_estabelecimentos?select=id,nome,cliques&id_municipio=eq.${ID}&aprovado=eq.true&order=nome.asc`
);
const zpN = await fetchZapEstabelecimentos(ID);
eq(`zap (${zp.length} vs ${zpN.rows.length})`, zp.length, zpN.rows.length);
eq(`zap nomes em ordem`, zp.map((r) => r.nome), zpN.rows.map((r) => r.nome));

// zap filtrado por bairro (o caminho que /citrolandia usa)
const bairroAlvo = zp.find((r) => r.bairro)?.bairro ?? (await rest(
  `zap_estabelecimentos?select=bairro&id_municipio=eq.${ID}&bairro=not.is.null&limit=1`
))[0]?.bairro;
if (bairroAlvo) {
  const zpB = await rest(
    `zap_estabelecimentos?select=id&id_municipio=eq.${ID}&aprovado=eq.true&bairro=in.("${bairroAlvo}")`
  );
  const zpBN = await fetchZapEstabelecimentos(ID, { bairros: [bairroAlvo] });
  eq(`zap bairro=${bairroAlvo} (${zpB.length} vs ${zpBN.rows.length})`, zpB.length, zpBN.rows.length);
} else {
  console.log("PULOU  zap por bairro (nenhuma linha com bairro preenchido)");
}

// anuncios ativos hoje: mesmo conjunto, e premium na frente
const an = await rest(
  `anuncios?select=id,plano&id_municipio=eq.${ID}&ativo=eq.true&data_inicio=lte.${HOJE}&or=(data_fim.is.null,data_fim.gte.${HOJE})`
);
const anN = await fetchAnunciosAtivos(ID);
eq(`anuncios ativos (${an.length} vs ${anN.length})`,
   an.map((r) => r.id).sort(), anN.map((r) => r.id).sort());
eq(`anuncios premium primeiro`,
   true,
   anN.every((r, i) => i === 0 || r.plano !== "premium" || anN[i - 1].plano === "premium"));

// convenios: somas com centavos e o agrupamento por orgao
const cv = await rest(
  `convenios_federais?select=id,valor,valor_liberado,orgao_nome,convenente_nome,codigo&id_municipio=eq.${ID}`
);
const cvN = await getConveniosFederais(ID);
eq(`convenios (${cv.length} vs ${cvN.convenios.length})`, cv.length, cvN.convenios.length);
const somaC = cv.reduce((a, r) => a + (Number(r.valor) || 0), 0);
const somaL = cv.reduce((a, r) => a + (Number(r.valor_liberado) || 0), 0);
eq(`convenios valorTotal (${somaC.toFixed(2)} vs ${cvN.valorTotal.toFixed(2)})`,
   Math.round(somaC * 100), Math.round(cvN.valorTotal * 100));
eq(`convenios valorLiberado (${somaL.toFixed(2)} vs ${cvN.valorLiberadoTotal.toFixed(2)})`,
   Math.round(somaL * 100), Math.round(cvN.valorLiberadoTotal * 100));
eq(`convenios com a prefeitura`,
   cv.filter((r) => (r.convenente_nome ?? "").toUpperCase().includes("MUNICIPIO DE BETIM")).length,
   cvN.qtdComPrefeitura);
eq(`convenios orgaos distintos (${new Set(cv.map((r) => r.orgao_nome ?? "Sem órgão informado")).size} vs ${cvN.porOrgao.length})`,
   new Set(cv.map((r) => r.orgao_nome ?? "Sem órgão informado")).size, cvN.porOrgao.length);
// `codigo` era lida com comColunaOpcional; a coluna existe, entao tem de vir
eq(`convenios codigo preenchido (${cv.filter((r) => r.codigo).length})`,
   cv.filter((r) => r.codigo).length, cvN.convenios.filter((c) => c.codigo).length);
// maior valor primeiro
eq(`convenios ordenados por valor desc`, true,
   cvN.convenios.every((c, i) => i === 0 || c.valor <= cvN.convenios[i - 1].valor));

// legislacao: total, categorias e anos
const lg = await rest(`atos_oficiais?select=tipo,ano,data_publicacao&id_municipio=eq.${ID}`);
const lgN = await getLegislacao(ID);
eq(`legislacao total (${lg.length} vs ${lgN.total})`, lg.length, lgN.total);
eq(`legislacao categorias`,
   [...new Set(lg.map((r) => r.tipo).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
   lgN.categoriasDisponiveis);
eq(`legislacao anos`,
   [...new Set(lg.map((r) => r.ano).filter((a) => a != null))].sort((a, b) => b - a),
   lgN.anosDisponiveis);
// data_publicacao desc NULLS LAST dos dois lados
eq(`legislacao mais recente (${lg.map((r) => r.data_publicacao).filter(Boolean).sort().at(-1)})`,
   lg.map((r) => r.data_publicacao).filter(Boolean).sort().at(-1) ?? null,
   lgN.atos[0]?.dataPublicacao ?? null);
/**
 * `atos_oficiais.temas` (migration 0025) — antes esta comparacao provava
 * que a coluna NAO EXISTIA nos dois bancos e que o ranking por area era
 * vazio dos dois lados. A 0025 foi aplicada e as ementas classificadas com
 * `etl/temas.py`, entao agora prova o contrario: a coluna existe, o
 * ranking bate com a contagem feita a partir do PostgREST, e o filtro
 * `?tema=` filtra de verdade.
 */
const lgTemas = await rest(`atos_oficiais?select=tipo,temas&id_municipio=eq.${ID}`);
const contagemTemasS = new Map<string, number>();
for (const a of lgTemas) for (const t of a.temas ?? []) contagemTemasS.set(t, (contagemTemasS.get(t) ?? 0) + 1);
eq(`legislacao: ${lgTemas.filter((r) => (r.temas ?? []).length).length} de ${lgTemas.length} atos com tema`,
   lgTemas.filter((r) => (r.temas ?? []).length).length > 0, lgN.temas.length > 0);
eq(`legislacao ranking por area (${contagemTemasS.size} areas)`,
   [...contagemTemasS.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
   lgN.temas.map((t) => [t.tema, t.qtd]));
const temaLeg = lgN.temas[0]?.tema;
if (temaLeg) {
  eq(`legislacao filtro ?tema=${temaLeg}`,
     lgTemas.filter((r) => (r.temas ?? []).includes(temaLeg)).length,
     (await getLegislacao(ID, { tema: temaLeg })).atos.length);
}

// ---- bloco 3: despesas, temas, servicos, proposicoes, grupos ----

// despesas por funcao: a soma agora e SUM() no banco, e o filtro de
// FUNCOES_COFOG desceu para o SQL. Reproduzo os dois lados no JS a partir
// do PostgREST cru.
const FUNCOES = new Set((await import("../lib/betim/despesas.js")).FUNCOES_COFOG);
const dp = await rest(`despesas?select=ano,conta,valor&id_municipio=eq.${ID}&estagio=eq.Despesas%20Pagas`);
const dpN = await getDespesasPorFuncao(ID);
const anosS = [...new Set(dp.map((r) => r.ano))].sort((a, b) => b - a);
eq(`despesas anos (${anosS.join(",")} vs ${dpN.anosDisponiveis.join(",")})`, anosS, dpN.anosDisponiveis);
const porFuncaoS = new Map<string, number>();
for (const r of dp.filter((r) => r.ano === dpN.ano && FUNCOES.has(r.conta))) {
  porFuncaoS.set(r.conta, (porFuncaoS.get(r.conta) ?? 0) + Number(r.valor ?? 0));
}
const totalS = [...porFuncaoS.values()].reduce((a, b) => a + b, 0);
eq(`despesas total ${dpN.ano} (${totalS.toFixed(2)} vs ${dpN.total.toFixed(2)})`,
   Math.round(totalS * 100), Math.round(dpN.total * 100));
eq(`despesas funcoes (${porFuncaoS.size} vs ${dpN.funcoes.length})`, porFuncaoS.size, dpN.funcoes.length);
eq(`despesas maior funcao`,
   [...porFuncaoS.entries()].sort((a, b) => b[1] - a[1])[0]?.[0], dpN.funcoes[0]?.funcao);
eq(`despesas valor por funcao`,
   [...porFuncaoS.entries()].map(([f, v]) => [f, Math.round(v * 100)]).sort(),
   dpN.funcoes.map((f) => [f.funcao, Math.round(f.valor * 100)]).sort());

// temas: a contagem virou unnest + group by. Recomputo com o laco antigo.
const contarS = (linhas: any[]) => {
  const m = new Map<string, number>();
  for (const l of linhas) for (const t of l.temas ?? []) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};
const prop = await rest(`proposicoes?select=id,temas,situacao,ano,numero,vereador_id&id_municipio=eq.${ID}`);
const tcN = await getTemasCamara(ID);
eq(`temas camara (${contarS(prop).length} temas vs ${tcN.temas.length})`,
   contarS(prop), tcN.temas.map((t) => [t.tema, t.qtd]));
// `status` entra aqui porque o teste do chat, mais abaixo, conta os
// contratos ativos a partir DESTE conjunto. Sem a coluna, `r.status` era
// `undefined` e a contagem dava zero — o "DIFERE" era do teste, não do
// codigo (a terceira vez que isso acontece nesta migracao).
const ctr = await rest(`contratos?select=id,temas,valor_global,status&id_municipio=eq.${ID}`);
const tpN = await getTemasPrefeitura(ID);
eq(`temas prefeitura (${contarS(ctr).length} temas vs ${tpN.temas.length})`,
   contarS(ctr), tpN.temas.map((t) => [t.tema, t.qtd]));
const verAlvo = prop.find((r) => r.vereador_id)?.vereador_id;
if (verAlvo) {
  const tvN = await getTemasVereador(ID, verAlvo);
  eq(`temas de um vereador (${verAlvo.slice(0, 8)})`,
     contarS(prop.filter((r) => r.vereador_id === verAlvo)),
     tvN.temas.map((t) => [t.tema, t.qtd]));
}

// servicos
const ct = await rest(`contatos_uteis?select=nome,ordem&id_municipio=eq.${ID}&order=ordem.asc`);
const ctN = await fetchContatosUteis(ID);
eq(`contatos uteis (${ct.length} vs ${ctN.rows.length})`, ct.map((r) => r.nome), ctN.rows.map((r) => r.nome));

const cx2 = await rest(`coleta_lixo?select=bairro,tipo&id_municipio=eq.${ID}&order=bairro.asc`);
const cx2N = await fetchColetaLixo(ID);
eq(`coleta de lixo (${cx2.length} vs ${cx2N.rows.length})`, cx2.map((r) => r.bairro), cx2N.rows.map((r) => r.bairro));
const bairroColeta = cx2[0]?.bairro;
if (bairroColeta) {
  const cx2f = await rest(
    `coleta_lixo?select=bairro&id_municipio=eq.${ID}&bairro=ilike.*${encodeURIComponent(bairroColeta)}*`
  );
  eq(`coleta filtrada por bairro (${cx2f.length})`,
     cx2f.length, (await fetchColetaLixo(ID, bairroColeta)).rows.length);
}

const fm = await rest(
  `farmacias_plantao?select=id,nome&id_municipio=eq.${ID}&or=(h24.eq.true,and(plantao_inicio.lte.${HOJE},plantao_fim.gte.${HOJE}))&order=nome.asc`
);
const fmN = await fetchFarmaciasPlantao(ID);
eq(`farmacias de plantao (${fm.length} vs ${fmN.rows.length})`, fm.map((r) => r.nome), fmN.rows.map((r) => r.nome));

// proposicoes: total, primeira pagina e os filtros
const ppN = await fetchProposicoes(ID);
eq(`proposicoes total (${prop.length} vs ${ppN.total})`, prop.length, ppN.total);
eq(`proposicoes total e number, nao string`, "number", typeof ppN.total);
const ordemS = [...prop]
  .sort((a, b) => (b.ano ?? 0) - (a.ano ?? 0) || (b.numero ?? 0) - (a.numero ?? 0) || a.id.localeCompare(b.id))
  .slice(0, 30);
eq(`proposicoes 1a pagina em ordem`, ordemS.map((r) => r.id), ppN.rows.map((r) => r.id));
const pp2 = await fetchProposicoes(ID, { page: 2 });
eq(`proposicoes 2a pagina nao repete a 1a`,
   [], ppN.rows.map((r) => r.id).filter((id) => pp2.rows.some((r) => r.id === id)));
const sitAlvo = prop.find((r) => r.situacao)?.situacao;
if (sitAlvo) {
  eq(`proposicoes filtro situacao="${sitAlvo}"`,
     prop.filter((r) => r.situacao === sitAlvo).length,
     (await fetchProposicoes(ID, { situacao: sitAlvo })).total);
}
const temaAlvo = tcN.temas[0]?.tema;
if (temaAlvo) {
  eq(`proposicoes filtro tema="${temaAlvo}"`,
     prop.filter((r) => (r.temas ?? []).includes(temaAlvo)).length,
     (await fetchProposicoes(ID, { tema: temaAlvo })).total);
}
eq(`situacoes disponiveis`,
   [...new Set(prop.map((r) => r.situacao).filter(Boolean))].sort(),
   await getSituacoesDisponiveis(ID));

// grupos economicos: o denominador da concentracao era um laco paginado
const gr = await rest(
  `grupos_economicos?select=id,nome_grupo,cnpjs,valor_total_contratos&id_municipio=eq.${ID}&order=valor_total_contratos.desc`
);
const grN = await getGruposEconomicos(ID);
eq(`grupos (${gr.length} vs ${grN.grupos.length})`, gr.length, grN.grupos.length);
eq(`grupos valorTotal`,
   Math.round(gr.reduce((a, r) => a + Number(r.valor_total_contratos ?? 0), 0) * 100),
   Math.round(grN.valorTotal * 100));
eq(`grupos empresas distintas`,
   new Set(gr.flatMap((r) => r.cnpjs ?? [])).size, grN.totalEmpresas);
// A soma do municipio inteiro: e AQUI que o truncamento do PostgREST
// mordia. `ctr` acima ja veio paginado pelo rest().
eq(`grupos denominador = soma de ${ctr.length} contratos (${grN.valorTotalMunicipio.toFixed(2)})`,
   Math.round(ctr.reduce((a, r) => a + Number(r.valor_global ?? 0), 0) * 100),
   Math.round(grN.valorTotalMunicipio * 100));
eq(`grupos razao social veio de fornecedores`,
   true, grN.grupos.every((g) => g.empresas.every((e) => e.cnpj.length > 0)));

// ---- bloco 4: comissoes, noticias, agro, paraopeba, chat ----

// comissoes: o embed vereadores(...) do PostgREST virou inner join
const cm = await rest(`comissoes?select=id,nome,especial&id_municipio=eq.${ID}&order=nome.asc`);
const cmM = await rest(
  `comissao_membros?select=comissao_id,papel,vereadores(slug,nome_urna)&id_municipio=eq.${ID}&ativo=eq.true&comissao_id=not.is.null`
);
const cmN = await getComissoesAtuais(ID);
// Ordem, nao so conjunto: e aqui que a collation de byte punha "Ética" no
// fim da lista, depois de "Transportes".
eq(`comissoes em ordem pt-BR (${cm.length} vs ${cmN.rows.length})`,
   cm.map((r) => r.nome), cmN.rows.map((r) => r.nome));
const contarMembros = (c: any) =>
  (c.presidente ? 1 : 0) + (c.relator ? 1 : 0) + c.membros.length;
eq(`comissoes membros no total (${cmM.filter((m) => m.vereadores).length})`,
   cmM.filter((m) => m.vereadores && cm.some((c) => c.id === m.comissao_id)).length,
   cmN.rows.reduce((a, c) => a + contarMembros(c), 0));
eq(`comissoes presidentes`,
   cmM.filter((m) => m.papel === "Presidente" && m.vereadores && cm.some((c) => c.id === m.comissao_id)).length,
   cmN.rows.filter((c) => c.presidente).length);

const verComissao = cmM.find((m) => m.vereadores)?.comissao_id;
const verIdComissao = (await rest(
  `comissao_membros?select=vereador_id&id_municipio=eq.${ID}&vereador_id=not.is.null&limit=1`
))[0]?.vereador_id;
if (verIdComissao) {
  const pc = await rest(
    `comissao_membros?select=nome_comissao_bruto,ativo&id_municipio=eq.${ID}&vereador_id=eq.${verIdComissao}`
  );
  const pcN = await getParticipacoesByVereador(ID, verIdComissao);
  eq(`participacoes de um vereador (${pc.length})`,
     [pc.filter((r) => r.ativo).length, pc.filter((r) => !r.ativo).length],
     [pcN.andamento.length, pcN.finalizadas.length]);
}
void verComissao;

// noticias: fonte_externa_* EXISTEM (ao contrario de atos_oficiais.temas).
// Comparado como CONJUNTO: 3 noticias compartilham o mesmo `publicado_em`
// ao microssegundo e outras 4 tambem, entao a ordem entre elas era
// INDEFINIDA no PostgREST (sem desempate). O Neon tem `asc(id)` e sai
// sempre igual — a diferenca aqui e a armadilha 4 sendo corrigida, nao
// divergencia de dado.
const nc = await rest(`noticias?select=slug,titulo,fonte_externa_nome,publicado_em&id_municipio=eq.${ID}&order=publicado_em.desc`);
const ncN = await getNoticias(ID);
eq(`noticias (${nc.length} vs ${ncN.rows.length}; ${new Set(nc.map((r) => r.publicado_em)).size} timestamps distintos)`,
   nc.map((r) => r.slug).sort(), ncN.rows.map((r) => r.slug).sort());
eq(`noticias em ordem decrescente de data`,
   true, ncN.rows.every((r, i) => i === 0 || r.publicadoEm <= ncN.rows[i - 1].publicadoEm));
eq(`noticias: mesma ordem em duas leituras (empate deterministico)`,
   ncN.rows.map((r) => r.slug), (await getNoticias(ID)).rows.map((r) => r.slug));
eq(`noticias fonte_externa_nome preenchida em ${nc.filter((r) => r.fonte_externa_nome).length}`,
   nc.map((r) => r.fonte_externa_nome ?? null).sort(),
   ncN.rows.map((r) => r.fonteExternaNome).sort());
if (nc[0]) {
  const um = await getNoticiaBySlug(ID, nc[0].slug);
  eq(`noticia por slug (${nc[0].slug})`, nc[0].titulo, um?.titulo);
  eq(`noticia por slug traz o conteudo`, true, (um?.conteudoHtml?.length ?? 0) > 0);
  eq(`noticia por slug inexistente devolve null`, null, await getNoticiaBySlug(ID, "nao-existe-xyz"));
}

// agro: valor_producao_mil_reais x 1000, e o corte pelo ano mais recente
const ag = await rest(
  `producao_agropecuaria?select=categoria,produto,ano,quantidade,valor_producao_mil_reais&id_municipio=eq.${ID}`
);
const agN = await getAgroData(ID);
const lavourasS = ag.filter((r) => r.categoria.startsWith("lavoura_"));
const anoLavS = lavourasS.length ? Math.max(...lavourasS.map((r) => r.ano)) : null;
eq(`agro ano das lavouras (${anoLavS})`, anoLavS, agN.anoLavouras);
eq(`agro valor total das lavouras (mil reais x 1000)`,
   Math.round(
     lavourasS.filter((r) => r.ano === anoLavS)
       .reduce((a, r) => a + (Number(r.valor_producao_mil_reais ?? 0) * 1000), 0) * 100
   ),
   Math.round(agN.valorTotalLavouras * 100));
eq(`agro top lavouras e no maximo 8, maior valor primeiro`,
   true,
   agN.topLavouras.length <= 8 &&
     agN.topLavouras.every((r, i) => i === 0 || (r.valorProducaoReais ?? 0) <= (agN.topLavouras[i - 1].valorProducaoReais ?? 0)));
eq(`agro rebanhos (${ag.filter((r) => r.categoria === "rebanho" && r.ano === agN.anoRebanho && Number(r.quantidade)).length})`,
   ag.filter((r) => r.categoria === "rebanho" && r.ano === agN.anoRebanho && Number(r.quantidade)).length,
   agN.rebanhos.length);

// paraopeba
const pb = await rest(
  `paraopeba_iniciativas?select=id_fdi,titulo,valor_total,status,percentual_realizado&id_municipio=eq.${ID}&order=valor_total.desc`
);
const pbN = await getParaopebaData(ID);
eq(`paraopeba iniciativas (${pb.length} vs ${pbN.iniciativas.length})`, pb.length, pbN.iniciativas.length);
eq(`paraopeba maior valor primeiro`,
   true,
   pbN.iniciativas.every((r, i) => i === 0 || (r.valorTotal ?? 0) <= (pbN.iniciativas[i - 1].valorTotal ?? 0)));
const sl = await rest(`paraopeba_saldo_municipio?select=referencia,saldo_teto&id_municipio=eq.${ID}`);
eq(`paraopeba saldo (${sl[0]?.referencia})`,
   [sl[0]?.referencia ?? null, sl[0]?.saldo_teto == null ? null : Math.round(Number(sl[0].saldo_teto) * 100)],
   [pbN.saldo?.referencia ?? null, pbN.saldo?.saldoTeto == null ? null : Math.round(pbN.saldo.saldoTeto * 100)]);
const menos = await getObrasParaopebaMenosConcluidas(ID, 5);
const menosS = pb
  .filter((r) => r.status === "Em execução" && r.percentual_realizado != null)
  .sort((a, b) => Number(a.percentual_realizado) - Number(b.percentual_realizado))
  .slice(0, 5);
eq(`paraopeba 5 mais longe de concluir`, menosS.map((r) => r.id_fdi), menos.map((r) => r.idFdi));
/**
 * `percentual_planejado` (migration 0026) — a comparacao antiga provava
 * que a coluna nao existia. Aplicada e preenchida a partir da aba "Avanco
 * Fisico" da planilha da FGV, agora prova o "executado x planejado" que
 * era a razao de ser da 0026.
 */
const pbPlan = await rest(
  `paraopeba_iniciativas?select=id_fdi,percentual_realizado,percentual_planejado,produtos_previstos,produtos_entregues,link_publico,link_termo_compromisso&id_municipio=eq.${ID}`
);
eq(`paraopeba: ${pbPlan.filter((r) => r.percentual_planejado != null).length} de ${pbPlan.length} com planejado`,
   pbPlan.map((r) => [r.id_fdi, r.percentual_planejado == null ? null : Math.round(Number(r.percentual_planejado) * 100)]).sort(),
   pbN.iniciativas.map((r) => [r.idFdi, r.percentualPlanejado == null ? null : Math.round(r.percentualPlanejado * 100)]).sort());
const atrasadasS = pbPlan.filter(
  (r) => r.percentual_realizado != null && r.percentual_planejado != null &&
         Number(r.percentual_realizado) < Number(r.percentual_planejado)
).length;
eq(`paraopeba atrasadas (executado < planejado): ${atrasadasS}`,
   atrasadasS,
   pbN.iniciativas.filter((r) => r.percentualRealizado != null && r.percentualPlanejado != null &&
                                 r.percentualRealizado < r.percentualPlanejado).length);
/**
 * REGRESSAO MINHA: ao escrever a consulta do Paraopeba eu deixei de fora
 * cinco colunas que o select do PostgREST trazia — os contadores de
 * produtos e os DOIS LINKS (o "acesso direto ao termo de compromisso" pelo
 * qual esta fonte foi escolhida). `mapIniciativa` as lia e recebia
 * `undefined`. Nao dava erro: um `as RowIniciativa[]` cobria o buraco, e a
 * paridade so conferia contagem e ordem. Estas linhas conferem os CAMPOS.
 */
eq(`paraopeba produtos previstos/entregues por iniciativa`,
   pbPlan.map((r) => [r.id_fdi, r.produtos_previstos ?? null, r.produtos_entregues ?? null]).sort(),
   pbN.iniciativas.map((r) => [r.idFdi, r.produtosPrevistos ?? null, r.produtosEntregues ?? null]).sort());
eq(`paraopeba links publicos e de termo de compromisso`,
   pbPlan.map((r) => [r.id_fdi, r.link_publico ?? null, r.link_termo_compromisso ?? null]).sort(),
   pbN.iniciativas.map((r) => [r.idFdi, r.linkPublico ?? null, r.linkTermoCompromisso ?? null]).sort());
eq(`paraopeba: os links nao vem undefined (${pbPlan.filter((r) => r.link_publico).length} preenchidos)`,
   pbPlan.filter((r) => r.link_publico).length,
   pbN.iniciativas.filter((r) => r.linkPublico).length);

// chat: os numeros-ancora do contexto tem de bater com o banco
const ctxt = await montarContexto(ID, "contrato de merenda escolar");
const ativos = ctr.filter((r) => r.status === "ativo");
const somaAtivos = ativos.reduce((a, r) => a + Number(r.valor_global ?? 0), 0);
const vers = await rest(`vereadores?select=id&id_municipio=eq.${ID}&ativo=eq.true`);
// Comparado com os MESMOS formatadores do app, e nao com um Intl montado
// aqui: reproduzir a formatacao no teste so testa o teste — foi assim que
// esta linha "DIFERE" da primeira vez, por causa do espaco nao-separavel
// que o `style: "currency"` insere depois do "R$".
eq(`chat: contratos ativos no contexto (${ativos.length}, ${somaAtivos.toFixed(2)})`,
   true,
   ctxt.includes(
     `Contratos ativos da Prefeitura: ${formatNumberBR(ativos.length)}, somando ${formatCurrencyBRL(somaAtivos)}.`
   ));
eq(`chat: ${vers.length} vereadores no contexto`, true, ctxt.includes(`${vers.length} vereadores`));
eq(`chat: mesma pergunta da o mesmo contexto (ordem deterministica)`,
   ctxt, await montarContexto(ID, "contrato de merenda escolar"));

// ---- bloco 5: prefeitura, contratos, saude ----

// prefeitura: visao geral. O ano vem da despesa mais recente EM QUALQUER
// estagio (nao so "Despesas Pagas") — diferente de getDespesasPorFuncao.
const dpTodos = await rest(`despesas?select=ano,funcao,valor,estagio&id_municipio=eq.${ID}`);
const vgN = await getVisaoGeral(ID);
const anoVg = Math.max(...dpTodos.map((r) => r.ano));
eq(`prefeitura ano da visao geral (${anoVg})`, anoVg, vgN.ano);

const BLOCOS = new Set([
  "Despesas Exceto Intraorçamentárias", "Despesas Intraorçamentárias",
  "Despesas (Exceto Intraorçamentárias)", "Despesas (Intraorçamentárias)",
]);
const pagasDoAno = dpTodos.filter((r) => r.ano === anoVg && r.estagio === "Despesas Pagas");
const porFuncaoVg = new Map<string, number>();
let totalBlocos = 0;
for (const r of pagasDoAno) {
  const f = (r.funcao as string) || "Outros";
  if (BLOCOS.has(f)) { totalBlocos += Number(r.valor ?? 0); continue; }
  porFuncaoVg.set(f, (porFuncaoVg.get(f) ?? 0) + Number(r.valor ?? 0));
}
eq(`prefeitura despesa total (${totalBlocos.toFixed(2)} vs ${vgN.despesaTotal.toFixed(2)})`,
   Math.round(totalBlocos * 100), Math.round(vgN.despesaTotal * 100));
eq(`prefeitura top 8 funcoes`,
   [...porFuncaoVg.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
     .slice(0, 8).map(([f, v]) => [f, Math.round(v * 100)]),
   vgN.gastosPorFuncao.map((g) => [g.funcao, Math.round(g.valor * 100)]));

const rc = await rest(
  `receitas?select=valor&id_municipio=eq.${ID}&ano=eq.${anoVg}&estagio=eq.Receitas%20Brutas%20Realizadas&conta=ilike.TOTAL%20DAS%20RECEITAS*`
);
eq(`prefeitura receita total (${rc[0]?.valor})`,
   Math.round(Number(rc[0]?.valor ?? 0) * 100), Math.round(vgN.receitaTotal * 100));

// maiores fornecedores: o Map do JS virou GROUP BY. A chave e a mesma
// (CNPJ, ou o nome quando falta CNPJ).
const ctrForn = await rest(`contratos?select=fornecedor_nome,fornecedor_cnpj,valor_global&id_municipio=eq.${ID}`);
const porForn = new Map<string, number>();
for (const r of ctrForn) {
  const chave = r.fornecedor_cnpj ?? r.fornecedor_nome ?? "Fornecedor não identificado";
  porForn.set(chave, (porForn.get(chave) ?? 0) + Number(r.valor_global ?? 0));
}
eq(`prefeitura top 5 fornecedores (valores)`,
   [...porForn.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
     .slice(0, 5).map(([, v]) => Math.round(v * 100)),
   vgN.maioresFornecedores.map((f) => Math.round(f.valor * 100)));
eq(`prefeitura custo per capita = despesa / populacao`,
   Math.round((vgN.populacao > 0 ? vgN.despesaTotal / vgN.populacao : 0) * 100),
   Math.round(vgN.custoPerCapitaAno * 100));

// contratos: total, soma e alertas agora vem de tres `over ()` numa
// consulta so, em vez de uma segunda consulta que trazia todas as linhas.
const ctrN = await fetchContratos(ID);
eq(`contratos total (${ctr.length} vs ${ctrN.total})`, ctr.length, ctrN.total);
eq(`contratos total e number, nao string`, "number", typeof ctrN.total);
const somaCtr = ctr.reduce((a, r) => a + Number(r.valor_global ?? 0), 0);
eq(`contratos soma (${somaCtr.toFixed(2)} vs ${ctrN.sum.toFixed(2)})`,
   Math.round(somaCtr * 100), Math.round(ctrN.sum * 100));
const ctrAlerta = await rest(`contratos?select=id&id_municipio=eq.${ID}&alerta=eq.true`);
eq(`contratos com alerta (${ctrAlerta.length} vs ${ctrN.totalAlertas})`, ctrAlerta.length, ctrN.totalAlertas);
eq(`contratos 1a pagina tem ${CONTRATOS_PAGE_SIZE} linhas`, CONTRATOS_PAGE_SIZE, ctrN.rows.length);
const ctrOrdem = await rest(
  `contratos?select=id,data_assinatura&id_municipio=eq.${ID}&order=data_assinatura.desc.nullslast,id.asc&limit=25`
);
eq(`contratos 1a pagina em ordem`, ctrOrdem.map((r) => r.id), ctrN.rows.map((r) => r.id));
const ct2 = await fetchContratos(ID, { page: 2 });
eq(`contratos 2a pagina nao repete a 1a`,
   [], ctrN.rows.map((r) => r.id).filter((id) => ct2.rows.some((r) => r.id === id)));
// Pagina ALEM da ultima: sem linha, os `over ()` nao vem — e o total tem
// de continuar sendo o real, senao a paginacao se desenha errada.
const ctLonge = await fetchContratos(ID, { page: 9999 });
eq(`contratos pagina 9999: zero linhas mas total real (${ctr.length})`,
   [0, ctr.length], [ctLonge.rows.length, ctLonge.total]);
// Filtro que nao casa nada: ai zero e a resposta certa.
const ctNada = await fetchContratos(ID, { q: "zzzz-nao-existe-zzzz" });
eq(`contratos filtro sem resultado: tudo zero`, [0, 0, 0],
   [ctNada.rows.length, ctNada.total, ctNada.sum]);
const anoCtr = ctr.length ? (await rest(`contratos?select=ano&id_municipio=eq.${ID}&ano=not.is.null&limit=1`))[0]?.ano : null;
if (anoCtr) {
  const ctrAno = await rest(`contratos?select=id&id_municipio=eq.${ID}&ano=eq.${anoCtr}`);
  eq(`contratos filtro ano=${anoCtr} (${ctrAno.length})`,
     ctrAno.length, (await fetchContratos(ID, { ano: String(anoCtr) })).total);
}
const temaCtr = tpN.temas[0]?.tema;
if (temaCtr) {
  eq(`contratos filtro tema=${temaCtr}`,
     ctr.filter((r) => (r.temas ?? []).includes(temaCtr)).length,
     (await fetchContratos(ID, { tema: temaCtr })).total);
}
const expN = await fetchContratosForExport(ID, {});
eq(`contratos export traz tudo (${ctr.length})`, ctr.length, expN.rows.length);

// saude
const est = await rest(`saude_estabelecimentos?select=profissionais_count&id_municipio=eq.${ID}`);
const inte = await rest(`saude_internacoes?select=ano,carater,qtd,obitos&id_municipio=eq.${ID}`);
const arbo = await rest(`arboviroses?select=doenca,ano,casos,nivel_alerta&id_municipio=eq.${ID}`);
const mort = await rest(`mortalidade?select=ano,grupo_causa,obitos&id_municipio=eq.${ID}`);
const sdN = await getSaudeData(ID);
eq(`saude estabelecimentos (${est.length} vs ${sdN.totalEstabelecimentos})`, est.length, sdN.totalEstabelecimentos);
eq(`saude profissionais somados`,
   est.reduce((a, r) => a + (r.profissionais_count ?? 0), 0), sdN.totalProfissionais);
const anosInt = [...new Set(inte.map((r) => r.ano))].sort((a, b) => b - a).slice(0, 6);
eq(`saude anos de internacao (${anosInt.join(",")})`, anosInt, sdN.internacoesPorAno.map((i) => i.ano));
eq(`saude internacoes do ano mais recente`,
   inte.filter((r) => r.ano === anosInt[0]).reduce((a, r) => a + r.qtd, 0),
   sdN.internacoesPorAno[0]?.qtdTotal);
const anoArbo = Math.max(...arbo.map((r) => r.ano));
eq(`saude arboviroses do ano ${anoArbo}`,
   new Set(arbo.filter((r) => r.ano === anoArbo).map((r) => r.doenca)).size, sdN.arboviroses.length);
const anoMort = Math.max(...mort.map((r) => r.ano));
eq(`saude ano de mortalidade (${anoMort})`, anoMort, sdN.anoMortalidade);
eq(`saude top 5 causas de obito`,
   mort.filter((r) => r.ano === anoMort).sort((a, b) => b.obitos - a.obitos).slice(0, 5).map((r) => r.obitos),
   sdN.topCausasMortalidade.map((c) => c.obitos));
const stN = await getSaudeTendencias(ID);
eq(`saude tendencias configurado`, true, stN.configured);
eq(`saude dengue: no maximo 8 semanas, em ordem crescente`,
   true,
   stN.dengueUltimasSemanas.length <= 8 &&
     stN.dengueUltimasSemanas.every((s, i) => i === 0 || s.semana >= stN.dengueUltimasSemanas[i - 1].semana - 53));

// ---- bloco 6: vereadores ----

const vr = await rest(
  `vereadores?select=id,slug,nome,nome_urna,partido,biografia&id_municipio=eq.${ID}&ativo=eq.true&order=nome_urna.asc`
);
const vrN = await getVereadores(ID);
eq(`vereadores em ordem pt-BR (${vr.length} vs ${vrN.rows.length})`,
   vr.map((r) => r.nome_urna), vrN.rows.map((r) => r.nome_urna));
// `biografia` (0017) EXISTE: e um dos casos em que o comColunaOpcional
// nunca chegou a usar o fallback.
eq(`vereadores biografia preenchida em ${vr.filter((r) => r.biografia).length}`,
   vr.map((r) => r.biografia ?? null), vrN.rows.map((r) => r.biografia ?? null));

const slugAlvo = vr[0]?.slug as string;
const umN = await getVereadorBySlug(ID, slugAlvo);
eq(`vereador por slug (${slugAlvo})`, vr[0]?.nome, umN.row?.nome);
eq(`vereador por slug inexistente devolve null`,
   null, (await getVereadorBySlug(ID, "nao-existe-xyz")).row);

/**
 * RANKING — a comparacao mais importante deste bloco.
 *
 * O ranking era montado sobre TODAS as 2.733 proposicoes trazidas em
 * paginas de 1000; agora vem de um `group by`. O comentario do codigo
 * antigo registra que, quando a tabela passou de 487 para 2.731 linhas, o
 * ranking somava so as primeiras mil e mostrava o 1o colocado ERRADO.
 * Aqui eu refaco a conta do zero, a partir do PostgREST paginado, e
 * comparo pontuacao por pontuacao.
 */
const propRank = await rest(`proposicoes?select=vereador_id,tipo&id_municipio=eq.${ID}`);
const rkN = await getRankingVereadores(ID);
const pontosS = new Map<string, number>();
const totaisS: Record<string, number> = {};
for (const p of propRank) {
  if (!p.tipo) continue;
  totaisS[p.tipo] = (totaisS[p.tipo] ?? 0) + 1;
  if (!p.vereador_id) continue;
  pontosS.set(p.vereador_id, (pontosS.get(p.vereador_id) ?? 0) + (PESO_PROPOSICAO[p.tipo] ?? 0));
}
eq(`ranking totais por tipo da Camara (${propRank.length} proposicoes)`,
   Object.entries(totaisS).sort(), Object.entries(rkN.totaisPorTipo).sort());
eq(`ranking pontuacao de cada vereador`,
   vr.map((v) => [v.id, pontosS.get(v.id) ?? 0]).sort(),
   rkN.rows.map((r) => [r.id, r.pontuacao]).sort());
eq(`ranking em ordem decrescente de pontuacao`,
   true, rkN.rows.every((r, i) => i === 0 || r.pontuacao <= rkN.rows[i - 1].pontuacao));
eq(`ranking 1o colocado (${rkN.rows[0]?.nome_urna}, ${rkN.rows[0]?.pontuacao} pontos)`,
   [...pontosS.entries()].sort((a, b) => b[1] - a[1])[0]?.[1], rkN.rows[0]?.pontuacao);
eq(`ranking: mesma ordem em duas leituras (empate deterministico)`,
   rkN.rows.map((r) => r.id), (await getRankingVereadores(ID)).rows.map((r) => r.id));

// dados por vereador: escolho quem tem mais proposicoes, para o teste
// tocar de fato os `count(*) over ()`.
const idComMais = [...pontosS.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as string;
if (idComMais) {
  const propV = await rest(`proposicoes?select=id&id_municipio=eq.${ID}&vereador_id=eq.${idComMais}`);
  const propVN = await getProposicoesByVereador(ID, idComMais);
  eq(`proposicoes do vereador: total ${propV.length}, ate 10 exibidas`,
     [propV.length, Math.min(10, propV.length)], [propVN.total, propVN.rows.length]);
  const di = await rest(`diarias?select=destino,valor&id_municipio=eq.${ID}&vereador_id=eq.${idComMais}`);
  eq(`diarias do vereador (${di.length})`, di.length, (await getDiariasByVereador(ID, idComMais)).rows.length);
}
// doacoes e bens: pego quem tiver linha, senao o teste nao prova nada
const idComDoacao = (await rest(`doacoes_campanha?select=vereador_id&id_municipio=eq.${ID}&limit=1`))[0]?.vereador_id;
if (idComDoacao) {
  const doa = await rest(`doacoes_campanha?select=valor&id_municipio=eq.${ID}&vereador_id=eq.${idComDoacao}`);
  const doaN = await getDoacoesSummary(ID, idComDoacao);
  eq(`doacoes do vereador (${doa.length} doadores)`, doa.length, doaN.total);
  eq(`doacoes soma (${doa.reduce((a, r) => a + Number(r.valor ?? 0), 0).toFixed(2)})`,
     Math.round(doa.reduce((a, r) => a + Number(r.valor ?? 0), 0) * 100), Math.round(doaN.soma * 100));
  eq(`doacoes em ordem decrescente de valor`,
     true, doaN.rows.every((r, i) => i === 0 || (r.valor ?? 0) <= (doaN.rows[i - 1].valor ?? 0)));
} else {
  console.log("PULOU  doacoes de campanha (tabela sem linha para Betim)");
}
const idComBens = (await rest(`bens_candidato?select=vereador_id&id_municipio=eq.${ID}&limit=1`))[0]?.vereador_id;
if (idComBens) {
  const bn = await rest(`bens_candidato?select=valor&id_municipio=eq.${ID}&vereador_id=eq.${idComBens}`);
  const bnN = await getBensCandidato(ID, idComBens);
  eq(`bens do vereador (${bn.length} itens)`, bn.length, bnN.total);
  eq(`bens soma (${bn.reduce((a, r) => a + Number(r.valor ?? 0), 0).toFixed(2)})`,
     Math.round(bn.reduce((a, r) => a + Number(r.valor ?? 0), 0) * 100), Math.round(bnN.soma * 100));
} else {
  console.log("PULOU  bens de candidato (tabela sem linha para Betim)");
}

/**
 * Atividade recente. O desempate e por ANO+NUMERO, nao por id: 4
 * requerimentos dividem a data 2026-07-15, e a Camara numera em sequencia,
 * entao "o ultimo" e o de maior numero. Por isso a consulta de referencia
 * aqui tambem ordena por numero — comparar contra um `order` so por data
 * seria comparar contra uma escolha arbitraria do PostgREST.
 */
const atN = await getAtividadeRecenteCamara(ID);
for (const [rotulo, filtro, campo] of [
  ["projeto de lei", `tipo=eq.projeto_lei`, "ultimoProjeto"],
  ["aprovado", `situacao=eq.Aprovado`, "ultimoAprovado"],
  ["requerimento", `tipo=eq.requerimento`, "ultimoRequerimento"],
] as const) {
  const esperado = (await rest(
    `proposicoes?select=numero,ano,data_apresentacao&id_municipio=eq.${ID}&${filtro}&order=data_apresentacao.desc.nullslast,ano.desc,numero.desc&limit=1`
  ))[0];
  const obtido = atN[campo] as { numero: number | null; ano: number | null } | null;
  eq(`atividade recente: ultimo ${rotulo} (${esperado?.data_apresentacao}, nº ${esperado?.numero})`,
     [esperado?.numero ?? null, esperado?.ano ?? null], [obtido?.numero ?? null, obtido?.ano ?? null]);
}

// REGRESSAO: a pagina do vereador chamava getVerbasAnalytics(row.id) com a
// assinatura nova, passando o uuid do vereador como idMunicipio. Compilava,
// e devolvia zero. Este teste falha se alguem reintroduzir a troca.
const verComVerbas = (await rest(`verbas_indenizatorias?select=vereador_id&id_municipio=eq.${ID}&limit=1`))[0]
  ?.vereador_id;
if (verComVerbas) {
  const certo = await getVerbasAnalytics(ID, verComVerbas);
  const trocado = await getVerbasAnalytics(comoIdMunicipio(verComVerbas), verComVerbas);
  eq(`verbas do vereador nao sao zero (${certo.total.toFixed(2)} em ${certo.totalRegistros} registros)`,
     true, certo.total > 0 && certo.totalRegistros > 0);
  eq(`verbas com os parametros trocados dariam zero — por isso o tipo nominal`,
     [0, 0], [trocado.total, trocado.totalRegistros]);
}

/**
 * FIXTURES — porque paridade sobre tabela vazia nao prova nada.
 *
 * `classificados`, `zap_estabelecimentos` e `anuncios` tem ZERO linhas nos
 * dois bancos, entao as comparacoes acima dizem so "a consulta roda". As
 * regras que elas deveriam provar (aprovado, expira_em, premium primeiro,
 * `data_fim` nula = sem prazo) ficariam sem teste nenhum — e sao
 * exatamente as que eu reescrevi ao traduzir o `.or()` do PostgREST.
 *
 * Entao: insere linhas conhecidas no Neon, verifica as regras, e apaga.
 * O Neon ainda nao serve producao (o cutover e a Fase 7) e as tres tabelas
 * estao vazias, entao a limpeza volta ao estado exato de antes. O delete
 * roda tambem NO COMECO, para nao deixar lixo se uma execucao anterior
 * morreu no meio.
 */
const neonSql = neon(process.env.DATABASE_URL!);
const FIX = "00000000-0000-4000-8000-0000000000";
const TABELAS_FIXTURE = [
  "classificados",
  "zap_estabelecimentos",
  "anuncios",
  "farmacias_plantao",
  "coleta_lixo",
];
const limpar = async () => {
  for (const t of TABELAS_FIXTURE) {
    await neonSql.query(`delete from ${t} where id::text like '${FIX}%'`);
  }
};
/**
 * As linhas dos testes de ESCRITA nascem com uuid gerado pelo banco, entao
 * nao da para reconhece-las pelo prefixo. O que as marca e o titulo/nome:
 * as tres tabelas estao vazias em producao, e o filtro por "Fixture" nao
 * alcanca dado real nem se um dia deixarem de estar.
 */
const limparEscritas = async () => {
  await limpar();
  await neonSql.query("delete from classificados where titulo like 'Fixture %'");
  await neonSql.query("delete from zap_estabelecimentos where nome like 'Fixture %'");
  await neonSql.query("delete from anuncios where nome_comercio like 'Fixture %'");
};
const dia = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

await limpar();
try {
  await neonSql.query(`insert into classificados (id, id_municipio, categoria, titulo, preco, aprovado, expira_em, created_at) values
    ('${FIX}01', '${ID}', 'imoveis',  'Casa fixture',   250000.50, true,  '${dia(30)}', '2020-01-03'),
    ('${FIX}02', '${ID}', 'veiculos', 'Carro fixture',  35000.00,  true,  '${dia(30)}', '2020-01-02'),
    ('${FIX}03', '${ID}', 'imoveis',  'Nao aprovado',   1.00,      false, '${dia(30)}', '2020-01-01'),
    ('${FIX}04', '${ID}', 'imoveis',  'Vencido',        1.00,      true,  '${dia(-1)}', '2020-01-04')`);

  const f = await fetchClassificados(ID);
  eq(`fixture classificados: so aprovado e no prazo`,
     ["Casa fixture", "Carro fixture"], f.rows.map((r) => r.titulo));
  eq(`fixture classificados: preco numeric vira number (250000.5)`,
     [250000.5, "number"], [f.rows[0]?.preco, typeof f.rows[0]?.preco]);
  eq(`fixture classificados: filtro de categoria`,
     ["Carro fixture"],
     (await fetchClassificados(ID, { categoria: "veiculos" })).rows.map((r) => r.titulo));
  eq(`fixture classificados: busca por titulo`,
     ["Casa fixture"],
     (await fetchClassificados(ID, { q: "casa" })).rows.map((r) => r.titulo));

  await neonSql.query(`insert into zap_estabelecimentos (id, id_municipio, nome, whatsapp, categoria, bairro, aprovado) values
    ('${FIX}11', '${ID}', 'Zeta fixture',  '5531999990001', 'pets',  'Citrolândia', true),
    ('${FIX}12', '${ID}', 'Alfa fixture',  '5531999990002', 'pets',  'Centro',      true),
    ('${FIX}13', '${ID}', 'Oculto fixture','5531999990003', 'pets',  'Centro',      false)`);

  const z = await fetchZapEstabelecimentos(ID);
  eq(`fixture zap: so aprovado, em ordem de nome`,
     ["Alfa fixture", "Zeta fixture"], z.rows.map((r) => r.nome));
  eq(`fixture zap: filtro de bairro`,
     ["Zeta fixture"],
     (await fetchZapEstabelecimentos(ID, { bairros: ["Citrolândia"] })).rows.map((r) => r.nome));
  eq(`fixture zap: busca por nome`,
     ["Alfa fixture"],
     (await fetchZapEstabelecimentos(ID, { q: "alfa" })).rows.map((r) => r.nome));

  await neonSql.query(`insert into anuncios (id, id_municipio, nome_comercio, plano, ativo, data_inicio, data_fim) values
    ('${FIX}21', '${ID}', 'Sem plano',     null,      true,  '${dia(-10)}', null),
    ('${FIX}22', '${ID}', 'Premium',       'premium', true,  '${dia(-10)}', null),
    ('${FIX}23', '${ID}', 'Basico',        'basico',  true,  '${dia(-10)}', '${dia(10)}'),
    ('${FIX}24', '${ID}', 'Prazo vencido', 'premium', true,  '${dia(-10)}', '${dia(-1)}'),
    ('${FIX}25', '${ID}', 'Desativado',    'premium', false, '${dia(-10)}', null),
    ('${FIX}26', '${ID}', 'Nao comecou',   'premium', true,  '${dia(10)}',  null)`);

  const a = await fetchAnunciosAtivos(ID);
  // `data_fim` nula = sem prazo: e o caso que o `.gte` puro do PostgREST
  // teria descartado, e a razao do `.or()` original.
  eq(`fixture anuncios: ativos hoje, premium primeiro`,
     ["Premium", "Sem plano", "Basico"].sort(),
     a.map((r) => r.nome_comercio).sort());
  eq(`fixture anuncios: premium na primeira posicao (plano nulo nao passa na frente)`,
     "Premium", a[0]?.nome_comercio);

  // `farmacias_plantao` e `coleta_lixo` tambem estao vazias. A regra da
  // primeira e a traducao do `.or(h24.eq.true, and(...))` do PostgREST —
  // uma farmacia 24h aparece SEM estar na escala, e uma na escala aparece
  // sem ser 24h.
  await neonSql.query(`insert into farmacias_plantao (id, id_municipio, nome, h24, plantao_inicio, plantao_fim, lat, lng) values
    ('${FIX}31', '${ID}', 'Alfa 24h',        true,  null,        null,        -19.96, -44.20),
    ('${FIX}32', '${ID}', 'Beta na escala',  false, '${dia(-2)}', '${dia(2)}', -19.97, -44.21),
    ('${FIX}33', '${ID}', 'Gama fora',       false, '${dia(-9)}', '${dia(-3)}', null,  null),
    ('${FIX}34', '${ID}', 'Delta sem data',  false, null,        null,        null,   null)`);

  const fx = await fetchFarmaciasPlantao(ID);
  eq(`fixture farmacias: 24h e escala vigente, em ordem de nome`,
     ["Alfa 24h", "Beta na escala"], fx.rows.map((r) => r.nome));
  eq(`fixture farmacias: lat/lng numeric viram number`,
     [-19.96, "number"], [fx.rows[0]?.lat, typeof fx.rows[0]?.lat]);

  await neonSql.query(`insert into coleta_lixo (id, id_municipio, bairro, tipo, dias_semana, horario) values
    ('${FIX}41', '${ID}', 'Centro',      'comum',    array['segunda','quarta'], '07:00'),
    ('${FIX}42', '${ID}', 'Alterosas',   'seletiva', array['terça'],            '08:00')`);

  const cx3 = await fetchColetaLixo(ID);
  eq(`fixture coleta: em ordem de bairro`, ["Alterosas", "Centro"], cx3.rows.map((r) => r.bairro));
  eq(`fixture coleta: filtro ilike por bairro`,
     ["Centro"], (await fetchColetaLixo(ID, "cent")).rows.map((r) => r.bairro));
  eq(`fixture coleta: dias_semana chega como array`,
     ["segunda", "quarta"], cx3.rows.find((r) => r.bairro === "Centro")?.dias_semana);
} finally {
  await limpar();
}
const sobrou = await neonSql.query(
  `select (select count(*) from classificados)::int
        + (select count(*) from zap_estabelecimentos)::int
        + (select count(*) from anuncios)::int
        + (select count(*) from farmacias_plantao)::int
        + (select count(*) from coleta_lixo)::int as n`
);
eq(`fixtures removidas (${sobrou[0].n} linhas nas ${TABELAS_FIXTURE.length} tabelas)`, 0, sobrou[0].n);

/**
 * ESCRITAS — testadas por ida e volta, nao por paridade.
 *
 * Nao da para comparar INSERT/UPDATE/DELETE contra o Supabase: escrever
 * nos dois bancos para conferir seria escrever em producao. Entao aqui o
 * teste e outro: executa a escrita no Neon, LE de volta pelo caminho
 * publico do app, e apaga. O que se prova e o que importa —
 *
 *   1. a linha nasce com o id_municipio da ROTA, nao com uma constante;
 *   2. update e delete nao alcancam linha de outra cidade;
 *   3. o contador de cliques nao perde contagem sob concorrencia.
 *
 * `OUTRA_CIDADE` e um codigo IBGE que NAO esta em `municipios`. Ele so
 * aparece em clausula WHERE, nunca num INSERT, entao nada e criado — e e
 * exatamente isso que prova que o filtro de cidade esta sendo aplicado.
 */
const OUTRA_CIDADE = comoIdMunicipio("3106200"); // Belo Horizonte, nao cadastrada

await limpar();
try {
  // --- INSERT carimba a cidade da rota ---
  const novoCl = await q.inserirClassificado(ID, {
    titulo: "Fixture escrita",
    descricao: "descricao de teste",
    categoria: "outros",
    preco: 1234.56,
    contato_whatsapp: "5531999990009",
    expira_em: dia(30),
  });
  const clGravado = (await neonSql.query(
    "select id_municipio, aprovado, preco::text from classificados where id = $1",
    [novoCl!.id]
  ))[0];
  eq(`escrita classificado: id_municipio da rota, nao constante`,
     [ID, false, "1234.56"],
     [clGravado.id_municipio, clGravado.aprovado, clGravado.preco]);
  eq(`escrita classificado: entra como PENDENTE, fora da listagem publica`,
     false, (await fetchClassificados(ID)).rows.some((r) => r.id === novoCl!.id));
  eq(`escrita classificado: aparece na fila de moderacao`,
     true,
     (await q.pendentesDeModeracao(ID))!.classificados.some((r) => r.id === novoCl!.id));

  const novoZap = await q.inserirZapEstabelecimento(ID, {
    nome: "Fixture escrita zap",
    whatsapp: "5531999990010",
    categoria: "outros",
    descricao: null,
    bairro: "Centro",
  });
  eq(`escrita zap: id_municipio da rota`,
     ID,
     (await neonSql.query("select id_municipio from zap_estabelecimentos where id = $1", [novoZap!.id]))[0].id_municipio);

  // --- moderacao respeita a cidade ---
  eq(`moderacao: aprovar de OUTRA cidade nao alcanca a linha`,
     null, await q.aprovarPendente(OUTRA_CIDADE, "zap_estabelecimentos", novoZap!.id));
  eq(`moderacao: e a linha continua pendente depois disso`,
     false,
     (await neonSql.query("select aprovado from zap_estabelecimentos where id = $1", [novoZap!.id]))[0].aprovado);
  eq(`moderacao: aprovar da cidade certa funciona`,
     true, (await q.aprovarPendente(ID, "zap_estabelecimentos", novoZap!.id)) !== null);
  eq(`moderacao: aprovado passa a aparecer na listagem publica`,
     true, (await fetchZapEstabelecimentos(ID)).rows.some((r) => r.id === novoZap!.id));
  // Rejeitar so alcanca pendente: este ja foi aprovado.
  eq(`moderacao: rejeitar NAO apaga cadastro ja aprovado e publico`,
     null, await q.rejeitarPendente(ID, "zap_estabelecimentos", novoZap!.id));
  eq(`moderacao: ele continua la`,
     1,
     (await neonSql.query("select count(*)::int n from zap_estabelecimentos where id = $1", [novoZap!.id]))[0].n);

  // --- cliques: atomico ---
  const CLIQUES = 10;
  const resultados = await Promise.all(
    Array.from({ length: CLIQUES }, () => q.incrementarCliquesZap(ID, novoZap!.id))
  );
  eq(`cliques: ${CLIQUES} incrementos simultaneos somam ${CLIQUES} (read-then-write perderia)`,
     CLIQUES,
     (await neonSql.query("select cliques from zap_estabelecimentos where id = $1", [novoZap!.id]))[0].cliques);
  eq(`cliques: todas as ${CLIQUES} chamadas confirmaram`, CLIQUES, resultados.filter(Boolean).length);
  eq(`cliques: de OUTRA cidade nao incrementa`,
     null, await q.incrementarCliquesZap(OUTRA_CIDADE, novoZap!.id));
  eq(`cliques: id inexistente nao incrementa`,
     null, await q.incrementarCliquesZap(ID, "00000000-0000-4000-8000-00000000ffff"));

  // --- anuncios: insert, patch e delete escopados por cidade ---
  const novoAn = await q.inserirAnuncio(ID, {
    nome_comercio: "Fixture anuncio",
    plano: "premium",
    banner_url: null,
    link: null,
    data_inicio: dia(-1),
    data_fim: null,
  });
  eq(`anuncio: nasce inativo e na cidade da rota`,
     [ID, false], [novoAn!.id_municipio, novoAn!.ativo]);
  eq(`anuncio: inativo nao aparece na home`,
     false, (await fetchAnunciosAtivos(ID)).some((r) => r.id === novoAn!.id));
  eq(`anuncio: patch de OUTRA cidade nao alcanca`,
     null, await q.atualizarAnuncio(OUTRA_CIDADE, novoAn!.id, { ativo: true }));
  eq(`anuncio: e continua inativo`,
     false,
     (await neonSql.query("select ativo from anuncios where id = $1", [novoAn!.id]))[0].ativo);
  eq(`anuncio: patch da cidade certa ativa`,
     true, (await q.atualizarAnuncio(ID, novoAn!.id, { ativo: true }))?.ativo);
  eq(`anuncio: ativo passa a aparecer na home`,
     true, (await fetchAnunciosAtivos(ID)).some((r) => r.id === novoAn!.id));
  eq(`anuncio: delete de OUTRA cidade nao alcanca`,
     null, await q.removerAnuncio(OUTRA_CIDADE, novoAn!.id));
  eq(`anuncio: delete da cidade certa remove`,
     true, (await q.removerAnuncio(ID, novoAn!.id)) !== null);
  eq(`anuncio: sumiu do banco`,
     0, (await neonSql.query("select count(*)::int n from anuncios where id = $1", [novoAn!.id]))[0].n);
} finally {
  await limparEscritas();
}
const sobrouEscrita = await neonSql.query(
  `select (select count(*) from classificados)::int
        + (select count(*) from zap_estabelecimentos)::int
        + (select count(*) from anuncios)::int as n`
);
eq(`fixtures de escrita removidas (${sobrouEscrita[0].n} linhas)`, 0, sobrouEscrita[0].n);

process.exit(0);
