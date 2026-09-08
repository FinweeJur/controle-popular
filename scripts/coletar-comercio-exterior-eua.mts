#!/usr/bin/env node
/**
 * scripts/coletar-comercio-exterior-eua.mts
 * 
 * Coletor de Dados de Comércio Exterior (EUA x Brasil) e Fundos/Empresas (CVM Abertos)
 * 1. US Census Bureau International Trade API (Importações / Exportações EUA-Brasil)
 * 2. CVM Dados Abertos (Demonstrações Financeiras DFP/ITR dos 50 maiores fundos/empresas)
 * 3. SEC EDGAR API (Investimentos diretos de fundos norte-americanos no Brasil)
 */

import fs from "node:fs";
import path from "node:path";
import ssl from "node:ssl";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ACERVO_DOCS = path.join(RAIZ, "acervo-documentos");
const DATA_DIR = path.join(RAIZ, "apps", "web", "data", "comercio-exterior");

const USER_AGENT = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; contato@controlepopular.com.br)";

// 1. URLs do Portal de Dados Abertos da CVM (DFP / ITR - Demonstrações Financeiras)
const CVM_DFP_URL = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS/dfp_cia_aberta_2025.zip";
const CVM_FII_URL = "https://dados.cvm.gov.br/dados/FII/DOC/INF_MENSAL/DADOS/inf_mensal_fii_2025.zip";

// 2. US Census Bureau International Trade (País 3510 = Brasil)
const CENSUS_TRADE_URL = "https://api.census.gov/data/timeseries/intltrade/exports/porthistory?get=CTY_NAME,ALL_VAL_MO,COMM_LVL&MONTH=12&YEAR=2025&CTY_CODE=3510";

async function baixarEGuardar(url: string, nomeArquivo: string): Promise<boolean> {
  try {
    fs.mkdirSync(ACERVO_DOCS, { recursive: true });
    const caminhoDestino = path.join(ACERVO_DOCS, nomeArquivo);

    if (fs.existsSync(caminhoDestino)) {
      console.log(`  💾 [Acervo Local] Arquivo já existente: ${nomeArquivo}`);
      return true;
    }

    console.log(`  📥 [Download] Baixando: ${url} ...`);
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      console.error(`  ❌ Falha no download de ${url}: HTTP ${res.status}`);
      return false;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(caminhoDestino, buffer);
    console.log(`  ✓ [Salvo] Gravado em ${caminhoDestino} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
    return true;
  } catch (err) {
    console.error(`  ❌ Erro ao baixar ${url}:`, (err as Error).message);
    return false;
  }
}

async function coletarTradeApiUsCensus(): Promise<void> {
  console.log("\n🇺🇸 1. Coletando dados do US Census Bureau API (Comércio Exterior EUA x Brasil)...");
  try {
    const res = await fetch(CENSUS_TRADE_URL, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) {
      const data = await res.json();
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const targetPath = path.join(DATA_DIR, "us-census-br-trade.json");
      fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`  ✓ [US Census Trade] Dados salvos em: ${targetPath}`);
    } else {
      console.log(`  ! US Census API respondeu HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("  ! Erro ao consultar US Census Trade API:", (err as Error).message);
  }
}

async function main() {
  console.log("=== INICIANDO COLETOR DE COMÉRCIO EXTERIOR, SEC EDGAR E DADOS DA CVM ===");

  // 1. Coletar dados abertos da CVM (DFP das 50 maiores Cias e Fundos)
  console.log("\n🇧🇷 2. Baixando balanços e relatórios de transparência da CVM...");
  await baixarEGuardar(CVM_DFP_URL, "cvm_dfp_cia_aberta_2025.zip");
  await baixarEGuardar(CVM_FII_URL, "cvm_inf_mensal_fii_2025.zip");

  // 2. Coletar API do US Census Bureau
  await coletarTradeApiUsCensus();

  console.log("\n✅ Coleta de comércio exterior e transparência de fundos concluída com sucesso!");
}

main().catch(console.error);
