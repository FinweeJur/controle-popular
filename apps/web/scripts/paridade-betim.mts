import fs from "node:fs";
import { neon } from "@neondatabase/serverless";
import { getCaixaDisponivel } from "../lib/betim/caixa.js";
import { getObras } from "../lib/betim/obras.js";
import { getSocialData } from "../lib/betim/social.js";
import { getComerciosEssenciais } from "../lib/betim/comercios.js";
import { fetchIndicadores } from "../lib/betim/indicadores.js";
import { getSegurancaData } from "../lib/betim/seguranca.js";
import { getVerbasAnalytics } from "../lib/betim/verbas.js";
import { getEducacaoData } from "../lib/betim/educacao.js";
import { fetchPostosAnp } from "../lib/betim/postos.js";
import { getServidores } from "../lib/betim/servidores.js";
import { getNotaTransparenciaData } from "../lib/betim/notaTransparencia.js";
import { fetchClassificados } from "../lib/betim/classificados.js";
import { fetchZapEstabelecimentos } from "../lib/betim/zap.js";
import { fetchAnunciosAtivos } from "../lib/betim/anuncios.js";
import { getConveniosFederais } from "../lib/betim/convenios.js";
import { getLegislacao } from "../lib/betim/legislacao.js";

const ID = "3106705"; // Betim
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
const ecN = await getEducacaoData(ID);
eq(`escolas (${ec.length} vs ${ecN.totalEscolas})`, ec.length, ecN.totalEscolas);

// postos
const po = await rest(`postos_anp?select=cnpj&id_municipio=eq.${ID}`);
const poN = await fetchPostosAnp(ID);
eq(`postos (${po.length} vs ${poN.rows.length})`, po.length, poN.rows.length);

// servidores: total do conjunto
const sv = await rest(`servidores?select=nome&id_municipio=eq.${ID}`);
const svN = await getServidores(ID, {});
eq(`servidores total (${sv.length} vs ${svN.total})`, sv.length, svN.total);

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
// `atos_oficiais.temas` NAO EXISTE (42703 no PostgREST): o ranking por area
// ja era vazio em producao, e continua.
const temasResp = await fetch(`${env("NEXT_PUBLIC_SUPABASE_URL")}/rest/v1/atos_oficiais?select=temas&limit=1`, {
  headers: { apikey: env("SUPABASE_SERVICE_ROLE_KEY"), Authorization: `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}` },
});
eq(`legislacao temas ausentes nos dois lados (HTTP ${temasResp.status})`,
   [temasResp.status === 400, 0], [true, lgN.temas.length]);

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
const limpar = async () => {
  for (const t of ["classificados", "zap_estabelecimentos", "anuncios"]) {
    await neonSql.query(`delete from ${t} where id::text like '${FIX}%'`);
  }
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
} finally {
  await limpar();
}
const sobrou = await neonSql.query(
  `select (select count(*) from classificados)::int
        + (select count(*) from zap_estabelecimentos)::int
        + (select count(*) from anuncios)::int as n`
);
eq(`fixtures removidas (${sobrou[0].n} linhas nas 3 tabelas)`, 0, sobrou[0].n);

process.exit(0);
