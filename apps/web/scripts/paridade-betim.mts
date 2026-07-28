import fs from "node:fs";
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

process.exit(0);
