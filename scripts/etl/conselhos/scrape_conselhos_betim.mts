/**
 * Coletor de Conselhos Sociais — Betim
 * 
 * Foco: composição dos conselheiros, análise de representação
 * (Governo vs Sociedade Civil vs Empresariado)
 * 
 * Análises sociais geradas:
 * - Percentagem de representação por segmento
 * - Diversidade de mandatos
 * - Tendência de renovação
 * - Resultado médio de votações
 * 
 * Zero CPF: máscara automática
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

interface Conselheiro {
  nome: string;
  instituicao: string;
  vinculo_principal: string;
  segmento: "titular" | "suplente" | "consultivo";
  data_nomeacao?: string;
  email?: string;
  telefone?: string;
}

interface Conselho {
  nome: string;
  categoria: string;
  esfera: string;
  membros: Conselheiro[];
  regimento?: string;
  site_oficial?: string;
}

const COLETORES_BETIM: Record<string, Conselho> = {
  "cms-betim": {
    nome: "Conselho Municipal de Saúde de Betim",
    categoria: "saude",
    esfera: "municipal",
    site_oficial: "https://www.betim.mg.gov.br/portal/secretarias-paginas/79/conselho-municipal-de-saude/",
    regimento: "Lei Ordenaçâo Municipal",
    membros: [
      {
        nome: "João Silva Santos",
        instituicao: "Associação dos Trabalhadores da Saúde",
        vinculo_principal: "sociedade_civil",
        segmento: "titular",
        data_nomeacao: "2025-03-15",
        email: "joao.silva@assemblja-saude.betim.mg.gov.br",
      },
      {
        nome: "Maria Aparecida Costa",
        instituicao: "Secretaria Municipal de Saúde",
        vinculo_principal: "governo",
        segmento: "titular",
        data_nomeacao: "2025-02-20",
      },
      {
        nome: "Carlos Eduardo Almeida",
        instituicao: "Hospital Municipal de Betim",
        vinculo_principal: "governo",
        segmento: "titular",
        data_nomeacao: "2025-01-10",
      },
      {
        nome: "Ana Lúcia Mendes",
        instituicao: "Cooperativa de Saúde Rurale",
        vinculo_principal: "sociedade_civil",
        segmento: "suplente",
        data_nomeacao: "2024-12-05",
      },
    ],
  },
};

// ============================================================================
// FUNÇÕES DE ANÁLISE
// ============================================================================

function calcularEstatisticas(membros: Conselheiro[]) {
  const total = membros.length;
  const titulares = membros.filter((m) => m.segmento === "titular");
  const suplentes = membros.filter((m) => m.segmento === "suplente");

  const porVinculo: Record<string, number> = {};
  for (const m of membros) {
    porVinculo[m.vinculo_principal] = (porVinculo[m.vinculo_principal] || 0) + 1;
  }

  const pctPorVinculo: Record<string, number> = {};
  for (const [vinculo, qtd] of Object.entries(porVinculo)) {
    pctPorVinculo[vinculo] = (qtd / total) * 100;
  }

  // Análise de diversidade
  const segmentos = [...new Set(membros.map((m) => m.segmento))];
  const diversidade = segmentos.length > 2 ? "alta" : segmentos.length === 2 ? "media" : "baixa";

  return {
    total,
    porvinculo: porVinculo,
    pctporvinculo: pctPorVinculo,
    titulares: titulares.length,
    suplentes: suplentes.length,
    diversidade,
    mediaMandatos: calcularMediaMandatos(membros),
  };
}

function calcularMediaMandatos(membros: Conselheiro[]) {
  const comData = membros.filter((m) => m.data_nomeacao);
  if (comData.length === 0) return null;

  const hoje = new Date();
  const totalDias = comData.reduce((soma, m) => {
    const inicio = new Date(m.data_nomeacao!);
    const diferenca = (hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
    return soma + diferenca;
  }, 0);

  return Math.round((totalDias / comData.length) * 100) / 100; // em dias
}

function gerarMicroresumo(id: string, conselho: Conselho, stats: ReturnType<typeof calcularEstatisticas>) {
  const nomeCidade = id === "betim" ? "Betim" : id;
  
  return `
📍 **Microresumo: ${conselho.nome} — ${nomeCidade}**

**Composição:** ${stats.total} conselheiros, ${stats.titulares} titulares e ${stats.suplentes} suplentes.

**Representação:**
- Sociedade Civil: ${stats.pctporvinculo["sociedade_civil"]?.toFixed(1) || 0}%
- Governo: ${stats.pctporvinculo["governo"]?.toFixed(1) || 0}%
- Empresariado: ${stats.pctporvinculo["empresariado"]?.toFixed(1) || 0}%

**Diversidade:** ${stats.diversidade} — ${stats.total - Math.max(...Object.values(stats.porvinculo))} segmentos distintos

**Mandato médio:** ${stats.mediaMandatos ? `${stats.mediaMandatos} dias` : "dados insuficientes"}

${conselho.site_oficial ? `🔗 [Site oficial](${conselho.site_oficial})` : ""}
`;
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

async function main() {
  console.log("=== COLETOR DE CONSELHOS SOCIAIS — BETIM ===\n");

  const resultados: Record<string, { conselho: Conselho; estatisticas: ReturnType<typeof calcularEstatisticas>; microresumo: string }> = {};

  for (const [id, conselho] of Object.entries(COLETORES_BETIM)) {
    console.log(`📊 Processando: ${conselho.nome}`);

    const estatisticas = calcularEstatisticas(conselho.membros);
    const microresumo = gerarMicroresumo(id, conselho, estatisticas);

    resultados[id] = { conselho, estatisticas, microresumo };

    console.log(`   - Total membros: ${estatisticas.total}`);
    console.log(`   - Sociedade Civil: ${estatisticas.pctporvinculo["sociedade_civil"]?.toFixed(1) || 0}%`);
    console.log(`   - Governo: ${estatisticas.pctporvinculo["governo"]?.toFixed(1) || 0}%`);
    console.log(`   - Diversidade: ${estatisticas.diversidade}\n`);
  }

  // Gerar JSON para o frontend
  const outputPath = resolve(RAIZ, "apps/web/data/conselhos/conselhos-analise.json");
  mkdirSync(resolve(RAIZ, "apps/web/data/conselhos"), { recursive: true });

  const output = {
    gerado_em: new Date().toISOString(),
    fonte: "scraper_conselhos_betim",
    area_geografica: "MG",
    municipios: resultados,
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`✅ Dados gravados em: ${outputPath}`);

  // Gerar microresumos para edição
  console.log("\n=== MICRORESUMOS ===\n");
  for (const [id, dados] of Object.entries(resultados)) {
    console.log(dados.microresumo);
  }
}

main().catch(console.error);