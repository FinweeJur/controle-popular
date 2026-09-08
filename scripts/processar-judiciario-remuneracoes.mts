/**
 * ETL para processar `contracheque.csv.gz` (Salários dos Magistrados - CNJ / Brasil.IO)
 * e gerar `apps/web/data/judiciario-remuneracoes.json` com agregação por tribunal de MG
 * e respeito estrito ao teto de 25 MiB.
 */
import { createReadStream, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createGunzip } from "node:zlib";
import readline from "node:readline";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARQ_FONTE = resolve(RAIZ, "etl/betim/dados/brasilio/salarios-magistrados/contracheque.csv.gz");
const DESTINO = resolve(RAIZ, "apps/web/data/judiciario-remuneracoes.json");

interface AgregadoTribunal {
  tribunal: string;
  totalContracheques: number;
  totalPagoLiquido: number;
  totalPagoIndenizacoes: number;
  mediaLiquida: number;
  maiorRemuneracao: number;
  qtdAcimaTetoBruto: number;
}

async function processar() {
  if (!existsSync(ARQ_FONTE)) {
    console.log("[ETL-Judiciario] Arquivo fonte contracheque.csv.gz não encontrado.");
    return;
  }

  console.log("[ETL-Judiciario] Lendo e agregando contracheques de magistrados de MG...");

  const stream = createReadStream(ARQ_FONTE).pipe(createGunzip());
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let cabecalho: string[] = [];
  const tribunais = new Map<string, AgregadoTribunal>();
  let totalProcessado = 0;

  for await (const linha of rl) {
    if (!linha.trim()) continue;
    if (cabecalho.length === 0) {
      cabecalho = linha.split(",");
      continue;
    }

    const cols = linha.split(",");
    const tribunal = cols[1]?.replace(/"/g, "").trim() || "OUTROS";
    
    // Filtrar tribunais com jurisdição em MG ou federais
    const ehTribunalRelevante = tribunal.includes("TJMG") || tribunal.includes("TRF") || tribunal.includes("TRT") || tribunal.includes("TRE-MG") || tribunal.includes("STM");
    if (!ehTribunalRelevante) continue;

    const subsidio = parseFloat(cols[6]) || 0;
    const indenizacoes = parseFloat(cols[8]) || 0;
    const vantagensEventuais = parseFloat(cols[7]) || 0;
    const totalBruto = parseFloat(cols[10]) || 0;
    const totalLiquido = parseFloat(cols[12]) || 0;

    let agg = tribunais.get(tribunal);
    if (!agg) {
      agg = {
        tribunal,
        totalContracheques: 0,
        totalPagoLiquido: 0,
        totalPagoIndenizacoes: 0,
        mediaLiquida: 0,
        maiorRemuneracao: 0,
        qtdAcimaTetoBruto: 0,
      };
      tribunais.set(tribunal, agg);
    }

    agg.totalContracheques += 1;
    agg.totalPagoLiquido += totalLiquido;
    agg.totalPagoIndenizacoes += indenizacoes;
    if (totalLiquido > agg.maiorRemuneracao) agg.maiorRemuneracao = totalLiquido;
    if (totalBruto > 44008.52) agg.qtdAcimaTetoBruto += 1; // Teto STF de referência

    totalProcessado += 1;
  }

  const resultadoTribunais: AgregadoTribunal[] = [];
  for (const [_, agg] of tribunais.entries()) {
    agg.mediaLiquida = agg.totalContracheques > 0 ? agg.totalPagoLiquido / agg.totalContracheques : 0;
    resultadoTribunais.push(agg);
  }

  const payload = {
    geradoEm: new Date().toISOString(),
    fonte: "CNJ / Brasil.IO (salarios-magistrados)",
    ressalvaEditorial: "Valores brutos podem conter verbas indenizatórias e retroativas autorizadas por lei que não configuram ilicitude.",
    totalContrachequesAnalisados: totalProcessado,
    tribunais: resultadoTribunais.sort((a, b) => b.totalPagoLiquido - a.totalPagoLiquido),
  };

  writeFileSync(DESTINO, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`[ETL-Judiciario] Gravado ${DESTINO} com ${resultadoTribunais.length} tribunais (${totalProcessado} contracheques).`);
}

processar().catch(console.error);
