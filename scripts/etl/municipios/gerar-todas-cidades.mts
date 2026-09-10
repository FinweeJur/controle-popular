#!/usr/bin/env node
/**
 * 🚀 Batch — Gera rotas e fatias para todos estados faltando
 *
 * Percorre todos os 27 estados e cria:
 * 1. Fatias em apps/web/public/municipios/{uf}/
 * 2. Route em apps/web/app/cidades/{uf}/page.tsx (a partir do template SP)
 *
 * Uso: npx tsx scripts/etl/municipios/gerar-todas-cidades.mts
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Reimplement fatiar locally to avoid @/ path issues in .mts
function fatiar<T>(linhas: T[], { orcamentoBytes = 2 * 1024 * 1024 }: { orcamentoBytes?: number } = {}) {
  const fatias: T[][] = [];
  const linhasPorFatia: number[] = [];
  const bytesPorFatia: number[] = [];
  const avisos: string[] = [];
  let atual: T[] = [];
  let bytesAtual = 2;
  const fechar = () => {
    if (atual.length === 0) return;
    fatias.push(atual);
    linhasPorFatia.push(atual.length);
    bytesPorFatia.push(bytesAtual);
    atual = [];
    bytesAtual = 2;
  };
  for (const row of linhas) {
    const bytes = Buffer.byteLength(JSON.stringify(row), "utf8");
    if (bytes + 2 > orcamentoBytes) { fechar(); fatias.push([row]); linhasPorFatia.push(1); bytesPorFatia.push(bytes + 2); avisos.push("Linha > orçamento"); continue; }
    const sep = atual.length > 0 ? 1 : 0;
    if (bytesAtual + sep + bytes > orcamentoBytes) fechar();
    atual.push(row);
    bytesAtual += (atual.length > 1 ? 1 : 0) + bytes;
  }
  fechar();
  return { manifesto: { total: linhas.length, fatias: fatias.length, linhasPorFatia, bytesPorFatia, orcamentoBytes, avisos }, fatias };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const DATA_DIR = path.join(ROOT, "apps/web/data");
const PUBLIC_DIR = path.join(ROOT, "apps/web/public/municipios");
const APP_CIDADES_DIR = path.join(ROOT, "apps/web/app/cidades");

// Template: SP
const TEMPLATE_UF = "sp";
const ESTADOS: { uf: string; nome: string; sigla: string; populacao: string; codigoIbge: string }[] = [
  { uf: "ac", nome: "Acre", sigla: "AC", populacao: "1,0M", codigoIbge: "12" },
  { uf: "al", nome: "Alagoas", sigla: "AL", populacao: "3,4M", codigoIbge: "27" },
  { uf: "am", nome: "Amazonas", sigla: "AM", populacao: "4,3M", codigoIbge: "13" },
  { uf: "ap", nome: "Amapá", sigla: "AP", populacao: "830K", codigoIbge: "16" },
  { uf: "ce", nome: "Ceará", sigla: "CE", populacao: "9,3M", codigoIbge: "23" },
  { uf: "df", nome: "Distrito Federal", sigla: "DF", populacao: "3,2M", codigoIbge: "53" },
  { uf: "es", nome: "Espírito Santo", sigla: "ES", populacao: "4,1M", codigoIbge: "32" },
  { uf: "go", nome: "Goiás", sigla: "GO", populacao: "7,2M", codigoIbge: "52" },
  { uf: "ma", nome: "Maranhão", sigla: "MA", populacao: "7,3M", codigoIbge: "21" },
  { uf: "mt", nome: "Mato Grosso", sigla: "MT", populacao: "3,8M", codigoIbge: "51" },
  { uf: "ms", nome: "Mato Grosso do Sul", sigla: "MS", populacao: "2,8M", codigoIbge: "50" },
  { uf: "mg", nome: "Minas Gerais", sigla: "MG", populacao: "20,2M", codigoIbge: "31" },
  { uf: "pa", nome: "Pará", sigla: "PA", populacao: "8,7M", codigoIbge: "15" },
  { uf: "pb", nome: "Paraíba", sigla: "PB", populacao: "4,1M", codigoIbge: "25" },
  { uf: "pr", nome: "Paraná", sigla: "PR", populacao: "11,4M", codigoIbge: "41" },
  { uf: "pe", nome: "Pernambuco", sigla: "PE", populacao: "9,9M", codigoIbge: "26" },
  { uf: "pi", nome: "Piauí", sigla: "PI", populacao: "3,3M", codigoIbge: "22" },
  { uf: "rj", nome: "Rio de Janeiro", sigla: "RJ", populacao: "16,7M", codigoIbge: "33" },
  { uf: "rn", nome: "Rio Grande do Norte", sigla: "RN", populacao: "3,4M", codigoIbge: "24" },
  { uf: "rs", nome: "Rio Grande do Sul", sigla: "RS", populacao: "10,8M", codigoIbge: "43" },
  { uf: "ro", nome: "Rondônia", sigla: "RO", populacao: "1,8M", codigoIbge: "11" },
  { uf: "rr", nome: "Roraima", sigla: "RR", populacao: "570K", codigoIbge: "14" },
  { uf: "sc", nome: "Santa Catarina", sigla: "SC", populacao: "7,6M", codigoIbge: "42" },
  { uf: "sp", nome: "São Paulo", sigla: "SP", populacao: "46,7M", codigoIbge: "35" },
  { uf: "se", nome: "Sergipe", sigla: "SE", populacao: "2,3M", codigoIbge: "28" },
  { uf: "to", nome: "Tocantins", sigla: "TO", populacao: "1,6M", codigoIbge: "17" },
  { uf: "ba", nome: "Bahia", sigla: "BA", populacao: "15,1M", codigoIbge: "29" },
];

// Função: lê dados do estado
function lerDados(uf: string) {
  const fp = path.join(DATA_DIR, `municipios-${uf}.json`);
  if (!existsSync(fp)) throw new Error(`Arquivo ${fp} não encontrado`);
  return JSON.parse(readFileSync(fp, "utf-8"));
}

// Função: fatiar e salvar
function fatiarSalvar(uf: string, dados: any[]) {
  const publicDir = path.join(PUBLIC_DIR, uf);
  mkdirSync(publicDir, { recursive: true });
  const indice = fatiar(dados, { orcamentoBytes: 500 * 1024 });
  const manifesto = {
    total: indice.manifesto.total,
    fatias: indice.manifesto.fatias,
    linhasPorFatia: indice.manifesto.linhasPorFatia,
    bytesPorFatia: indice.manifesto.bytesPorFatia,
    orcamentoBytes: indice.manifesto.orcamentoBytes,
    avisos: indice.manifesto.avisos,
  };
  writeFileSync(path.join(publicDir, "manifesto.json"), JSON.stringify(manifesto));
  indice.fatias.forEach((fatia, i) => {
    writeFileSync(path.join(publicDir, `${i}.json`), JSON.stringify(fatia));
  });
  return indice.manifesto.fatias;
}

// Função: criar page.tsx a partir do template
function criarPage(uf: string, estado: typeof ESTADOS[0], count: number) {
  const appDir = path.join(APP_CIDADES_DIR, uf);
  mkdirSync(appDir, { recursive: true });
  let template = readFileSync(path.join(APP_CIDADES_DIR, TEMPLATE_UF, "page.tsx"), "utf-8");
  template = template
    .replace(/"sp"/g, `"${uf}"`)
    .replace(/"SP"/g, `"${estado.sigla}"`)
    .replace(/`SP`/g, `\`${estado.sigla}\``)
    .replace(/ UF=35/g, ` UF=${estado.codigoIbge}`)
    .replace(/645 cidades/g, `${count} cidades`)
    .replace(/46,7M/g, estado.populacao)
    .replace(/46\.7/g, estado.populacao.replace(",", "."))
    .replace(/São Paulo/g, estado.nome)
    .replace(/são paulo/gi, estado.nome.toLowerCase());
  writeFileSync(path.join(appDir, "page.tsx"), template);
}

// Main
const jaNavegados = new Set(
  ESTADOS.filter(e => existsSync(path.join(APP_CIDADES_DIR, e.uf, "page.tsx"))).map(e => e.uf),
);

console.log("=== GERANDO ROTAS FALTANTES ===");
for (const estado of ESTADOS) {
  if (jaNavegados.has(estado.uf)) {
    console.log(`⏭️  ${estado.sigla} já tem route`);
    continue;
  }
  try {
    const dados = lerDados(estado.uf);
    const fatias = fatiarSalvar(estado.uf, dados);
    criarPage(estado.uf, estado, dados.length);
    console.log(`✅ ${estado.sigla}: ${dados.length} cidades → ${fatias} fatia(s)`);
  } catch (e) {
    console.log(`❌ ${estado.sigla}: ${e.message}`);
  }
}
const totalRoutes = ESTADOS.filter(e => existsSync(path.join(APP_CIDADES_DIR, e.uf, "page.tsx"))).length;
console.log(`\n📊 Routes criadas: ${totalRoutes}/${ESTADOS.length} estados`);
console.log("🎯 Execução concluída!");
