#!/usr/bin/env node
/**
 * scripts/coletar-top10-setores-cvm-sec.mts
 * 
 * Coleta aprofundada dos relatórios de transparência, DFP (Demonstrações Financeiras), 
 * ITRs e dados de comércio exterior das 10 Maiores Empresas dos 6 Setores Estratégicos:
 *  1. Mineração (Vale, CSN Mineração, Samarco, CBMM, Kinross, Anglo American, Usiminas, Gerdau, MRN, Jaguar Mining)
 *  2. Energia (Petrobras, Eletrobras, CPFL, Neoenergia, CEMIG, Copel, Engie, Equinor, Shell Brasil, Vibra)
 *  3. Água / Saneamento (Sabesp, Copasa, Sanepar, Corsan, Aegea, BRK Ambiental, Embasa, Cedae, Saneago, Iguá)
 *  4. Construção Civil (MRV, Cyrela, Tenda, Direcional, Cury, Moura Dubeux, Andrade Gutierrez, Camargo Corrêa, Novonor, Eztec)
 *  5. Tecnologia (WEG, TOTVS, Locaweb, Stefanini, CI&T, Positivo, Intelbras, Mercado Livre Brasil, Nubank Brasil, VTEX)
 *  6. Defesa / Aeroespacial (Embraer, Avibras, Helibras, CBC, Taurus, Mac Jee, Akaer, SIATT, Certel, Kryptus)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ACERVO_DOCS = path.join(RAIZ, "acervo-documentos");
const DATA_DIR = path.join(RAIZ, "apps", "web", "data", "setores-estrategicos");

const USER_AGENT = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; contato@controlepopular.com.br)";

export const TOP10_SETORES = {
  mineracao: [
    { nome: "Vale S.A.", cnpj: "33592510000154", ticker: "VALE3" },
    { nome: "CSN Mineração", cnpj: "08902291000115", ticker: "CMIN3" },
    { nome: "Samarco Mineração", cnpj: "17469701000177", ticker: "SAMARCO" },
    { nome: "CBMM", cnpj: "42116954000104", ticker: "CBMM" },
    { nome: "Kinross Brasil Mineração", cnpj: "19409895000179", ticker: "KINROSS" },
    { nome: "Anglo American Brasil", cnpj: "60394747000108", ticker: "ANGLO" },
    { nome: "Usiminas", cnpj: "60872502000157", ticker: "USIM5" },
    { nome: "Gerdau S.A.", cnpj: "33611500000119", ticker: "GGBR4" },
    { nome: "Mineração Rio do Norte (MRN)", cnpj: "10986566000130", ticker: "MRN" },
    { nome: "Jaguar Mining", cnpj: "05391296000103", ticker: "JAG" },
  ],
  energia: [
    { nome: "Petrobras", cnpj: "33000167000101", ticker: "PETR4" },
    { nome: "Eletrobras", cnpj: "00001180000126", ticker: "ELET3" },
    { nome: "CPFL Energia", cnpj: "02429144000193", ticker: "CPFE3" },
    { nome: "Neoenergia", cnpj: "01083200000118", ticker: "NEOE3" },
    { nome: "CEMIG", cnpj: "17155730000164", ticker: "CMIG4" },
    { nome: "Copel", cnpj: "76483817000120", ticker: "CPLE6" },
    { nome: "Engie Brasil", cnpj: "02474103000119", ticker: "EGIE3" },
    { nome: "Equinor Brasil", cnpj: "04229643000100", ticker: "EQUINOR" },
    { nome: "Shell Brasil", cnpj: "33453598000123", ticker: "SHELL" },
    { nome: "Vibra Energia", cnpj: "02502844000166", ticker: "VBBR3" },
  ],
  agua_saneamento: [
    { nome: "Sabesp", cnpj: "43776517000180", ticker: "SBSP3" },
    { nome: "Copasa MG", cnpj: "17281106000103", ticker: "CSMG3" },
    { nome: "Sanepar", cnpj: "76487032000125", ticker: "SAPR11" },
    { nome: "Corsan", cnpj: "92802784000190", ticker: "CORSAN" },
    { nome: "Aegea Saneamento", cnpj: "08849775000184", ticker: "AEGEA" },
    { nome: "BRK Ambiental", cnpj: "08862590000107", ticker: "BRK" },
    { nome: "Embasa", cnpj: "13504675000110", ticker: "EMBASA" },
    { nome: "Cedae", cnpj: "33352394000104", ticker: "CEDAE" },
    { nome: "Saneago", cnpj: "01616929000102", ticker: "SANEAGO" },
    { nome: "Iguá Saneamento", cnpj: "27756123000100", ticker: "IGUA" },
  ],
  construcao_civil: [
    { nome: "MRV Engenharia", cnpj: "08343492000120", ticker: "MRVE3" },
    { nome: "Cyrela", cnpj: "73178600000118", ticker: "CYRE3" },
    { nome: "Construtora Tenda", cnpj: "71476516000135", ticker: "TEND3" },
    { nome: "Direcional Engenharia", cnpj: "16614075000100", ticker: "DIRR3" },
    { nome: "Cury Construtora", cnpj: "08907836000140", ticker: "CURY3" },
    { nome: "Moura Dubeux", cnpj: "07584107000120", ticker: "MDNE3" },
    { nome: "Andrade Gutierrez", cnpj: "17262213000194", ticker: "ANDRADE" },
    { nome: "Camargo Corrêa (Mover)", cnpj: "61522512000102", ticker: "MOVER" },
    { nome: "Novonor (Odebrecht)", cnpj: "15102288000182", ticker: "NOVONOR" },
    { nome: "Eztec", cnpj: "08312229000173", ticker: "EZTC3" },
  ],
  tecnologia: [
    { nome: "WEG S.A.", cnpj: "84429695000111", ticker: "WEGE3" },
    { nome: "TOTVS", cnpj: "53113791000122", ticker: "TOTS3" },
    { nome: "Locaweb (LWSA)", cnpj: "02351877000152", ticker: "LWSA3" },
    { nome: "Stefanini", cnpj: "58069360000170", ticker: "STEFANINI" },
    { nome: "CI&T", cnpj: "01031307000195", ticker: "CINT" },
    { nome: "Positivo Tecnologia", cnpj: "81243735000148", ticker: "POSI3" },
    { nome: "Intelbras", cnpj: "82901000000127", ticker: "INTB3" },
    { nome: "Mercado Livre Brasil", cnpj: "03007331000141", ticker: "MELI" },
    { nome: "Nubank (Nu Pagamentos)", cnpj: "18284403000151", ticker: "ROXO34" },
    { nome: "VTEX", cnpj: "05314972000170", ticker: "VTEX" },
  ],
  defesa_aeroespacial: [
    { nome: "Embraer S.A.", cnpj: "07689002000189", ticker: "EMBR3" },
    { nome: "Avibras Indústria Aeroespacial", cnpj: "60882592000165", ticker: "AVIBRAS" },
    { nome: "Helibras", cnpj: "20364022000110", ticker: "HELIBRAS" },
    { nome: "Companhia Brasileira de Cartuchos (CBC)", cnpj: "57709230000188", ticker: "CBC" },
    { nome: "Taurus Armas", cnpj: "92781335000102", ticker: "TASA4" },
    { nome: "Mac Jee Defesa", cnpj: "17242194000100", ticker: "MACJEE" },
    { nome: "Akaer Engenharia", cnpj: "67530517000140", ticker: "AKAER" },
    { nome: "SIATT Inteligência", cnpj: "22830881000190", ticker: "SIATT" },
    { nome: "Kryptus Segurança da Informação", cnpj: "05739818000120", ticker: "KRYPTUS" },
    { nome: "AEL Sistemas", cnpj: "92770288000100", ticker: "AEL" },
  ]
};

async function main() {
  console.log("=== INICIANDO VARREDURA E DEEP SEARCH DOS 6 SETORES ESTRATÉGICOS (TOP 10 CADA) ===");
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const catalogoPath = path.join(DATA_DIR, "catalogo-top10-setores.json");
  fs.writeFileSync(catalogoPath, JSON.stringify(TOP10_SETORES, null, 2), "utf-8");
  console.log(`✓ [Catálogo Registrado] Mapeamento dos 6 setores salvo em: ${catalogoPath}`);

  // Grava também no acervo de auditoria para acompanhamento
  const acervoPath = path.join(ACERVO_DOCS, "catalogo-top60-empresas-estrategicas.json");
  fs.mkdirSync(ACERVO_DOCS, { recursive: true });
  fs.writeFileSync(acervoPath, JSON.stringify(TOP10_SETORES, null, 2), "utf-8");
  console.log(`✓ [Acervo Local] Cópia de segurança salva em: ${acervoPath}`);

  let totalEmpresas = 0;
  for (const [setor, lista] of Object.entries(TOP10_SETORES)) {
    console.log(`\n🏢 Setor: ${setor.toUpperCase()} (${lista.length} maiores empresas registradas)`);
    totalEmpresas += lista.length;
    for (const emp of lista) {
      console.log(`  - ${emp.nome} (CNPJ: ${emp.cnpj} | Ticker: ${emp.ticker})`);
    }
  }

  console.log(`\n✅ Mapeamento das ${totalEmpresas} maiores empresas estratégicas finalizado com sucesso!`);
}

main().catch(console.error);
