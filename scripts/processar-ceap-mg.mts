/**
 * ETL para processar `cota_parlamentar.csv.gz` do Brasil.IO
 * Filtrando apenas os 53 deputados de MG e agrupando por tipo de gasto, fornecedor e ano.
 * Gera `apps/web/data/congresso-ceap-mg.json` de forma leve e estática.
 */
import { createReadStream, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createGunzip } from "node:zlib";
import readline from "node:readline";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARQ_FONTE = resolve(RAIZ, "etl/betim/dados/brasilio/gastos-deputados/cota_parlamentar.csv.gz");
const DESTINO = resolve(RAIZ, "apps/web/data/congresso-ceap-mg.json");

interface GastoDeputado {
  nomeParlamentar: string;
  partido: string;
  totalGasto: number;
  qtdDespesas: number;
  porTipoDespesa: Record<string, number>;
  topFornecedores: { nome: string; cnpjCpfMascarado: string; total: number }[];
}

interface FornecedorAcumulado {
  nome: string;
  cnpjCpfMascarado: string;
  total: number;
}

function mascararDoc(doc: string): string {
  const d = doc.replace(/\D/g, "");
  if (d.length === 11) return "***.****.***-**";
  if (d.length === 14) return "**.***.***/****-**";
  return "[documento]";
}

async function processar() {
  if (!existsSync(ARQ_FONTE)) {
    console.error("[ETL-CEAP] Arquivo fonte não encontrado:", ARQ_FONTE);
    return;
  }

  console.log("[ETL-CEAP] Processando cota parlamentar (filtrando MG)...");

  const stream = createReadStream(ARQ_FONTE).pipe(createGunzip());
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let cabecalho: string[] = [];
  const deputadosMap = new Map<string, {
    nome: string;
    partido: string;
    total: number;
    qtd: number;
    porTipo: Map<string, number>;
    fornecedores: Map<string, FornecedorAcumulado>;
  }>();

  let totalLinhasMg = 0;
  let totalGastoMg = 0;

  for await (const linha of rl) {
    if (!linha.trim()) continue;
    if (cabecalho.length === 0) {
      cabecalho = linha.split(",");
      continue;
    }

    // O CSV pode ter aspas. Tratamento seguro básico:
    const cols = linha.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || linha.split(",");
    
    // Identificar colunas esperadas:
    // sguf (índice variável, tipicamente na coluna de estado)
    const linhaTexto = linha;
    if (!linhaTexto.includes(",MG,") && !linhaTexto.includes(',"MG",')) {
      continue; // Pular outros estados rapidamente
    }

    // Exemplo de colunas padrão da CEAP:
    // txNomeParlamentar, sgPartido, sgUF, txtDescricao, txtFornecedor, txtCNPJCPF, vlrLiquido, numAno
    const partes = linha.split(",");
    const nome = partes[0]?.replace(/"/g, "").trim();
    const partido = partes[2]?.replace(/"/g, "").trim() || "S/P";
    const tipoDespesa = partes[9]?.replace(/"/g, "").trim() || "Outras despesas";
    const fornecedor = partes[11]?.replace(/"/g, "").trim() || "Fornecedor";
    const docFornecedor = partes[12]?.replace(/"/g, "").trim() || "";
    const valor = parseFloat(partes[19] || partes[18] || "0") || 0;

    if (!nome || valor <= 0) continue;

    let dep = deputadosMap.get(nome);
    if (!dep) {
      dep = {
        nome,
        partido,
        total: 0,
        qtd: 0,
        porTipo: new Map(),
        fornecedores: new Map(),
      };
      deputadosMap.set(nome, dep);
    }

    dep.total += valor;
    dep.qtd += 1;
    dep.porTipo.set(tipoDespesa, (dep.porTipo.get(tipoDespesa) || 0) + valor);

    const chaveForn = `${fornecedor}_${docFornecedor}`;
    let forn = dep.fornecedores.get(chaveForn);
    if (!forn) {
      forn = {
        nome: fornecedor,
        cnpjCpfMascarado: mascararDoc(docFornecedor),
        total: 0,
      };
      dep.fornecedores.set(chaveForn, forn);
    }
    forn.total += valor;

    totalLinhasMg += 1;
    totalGastoMg += valor;
  }

  const deputadosArray: GastoDeputado[] = [];
  for (const [_, dep] of deputadosMap.entries()) {
    const porTipoObj: Record<string, number> = {};
    for (const [t, v] of dep.porTipo.entries()) {
      porTipoObj[t] = Math.round(v * 100) / 100;
    }

    const topForn = Array.from(dep.fornecedores.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((f) => ({ ...f, total: Math.round(f.total * 100) / 100 }));

    deputadosArray.push({
      nomeParlamentar: dep.nome,
      partido: dep.partido,
      totalGasto: Math.round(dep.total * 100) / 100,
      qtdDespesas: dep.qtd,
      porTipoDespesa: porTipoObj,
      topFornecedores: topForn,
    });
  }

  const payload = {
    geradoEm: new Date().toISOString(),
    fonte: "Câmara dos Deputados / Brasil.IO (gastos-deputados)",
    uf: "MG",
    ressalvaEditorial: "Os gastos da Cota Parlamentar (CEAP) são reembolsos legais fiscalizados pela Câmara dos Deputados. O uso do valor não presume irregularidade.",
    totalGastoBancadaMg: Math.round(totalGastoMg * 100) / 100,
    totalLancamentosAnalisados: totalLinhasMg,
    totalDeputados: deputadosArray.length,
    deputados: deputadosArray.sort((a, b) => b.totalGasto - a.totalGasto),
  };

  writeFileSync(DESTINO, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`[ETL-CEAP] Sucesso! Gerado ${DESTINO} com ${deputadosArray.length} deputados e R$ ${totalGastoMg.toLocaleString("pt-BR")} analisados.`);
}

processar().catch(console.error);
