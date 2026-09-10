#!/usr/bin/env node

/**
 * 🤖 Bot de Verificação de Dados — Cross-check automatizado
 * 
 * Verifica inconsistências entre fontes primárias e secundárias.
 * Detecta erros de valorização, códigos IBGE errados, duplicatas.
 * 
 * Uso:
 *   npx tsx bots/verifica-dados.mts --formato json --limiar 0.01
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = resolve(RAIZ, ".cache/verificacao");
const RELATÓRIO_DIR = resolve(RAIZ, "docs/audit");

// Configurações
const LIMIAR_ERRO = 0.01; // 1% de tolerância
const FORMATO_SAIDA = "json"; // json ou csv

interface Registro {
  processo_numero: string;
  id_municipio: string;
  nome_municipio: string;
  valor_total: number;
  fonte_principal: string;
  fonte_secundaria?: string;
  valor_secundario?: number;
  cnpj_credor?: string;
  data_publicacao?: string;
}

interface ResultadoVerificacao {
  processo_numero: string;
  id_municipio: string;
  valor_principal: number;
  valor_secundario: number;
  diferenca: number;
  diferenca_percentual: number;
  confiabilidade: number;
  status: "consistente" | "alerta" | "crítico";
  fonte_recomendada: string;
  observacoes: string[];
}

/**
 * Cross-check de valores entre duas fontes
 */
function crossCheckValor(registro: Registro): ResultadoVerificacao {
  const valor1 = registro.valor_total;
  const valor2 = registro.valor_secundario ?? 0;
  
  if (valor2 === 0) {
    return {
      processo_numero: registro.processo_numero,
      id_municipio: registro.id_municipio,
      valor_principal: valor1,
      valor_secundario: valor2,
      diferenca: 0,
      diferenca_percentual: 0,
      confiabilidade: 0.5, // Fonte única
      status: "alerta",
      fonte_recomendada: registro.fonte_principal,
      observacoes: ["Apenas uma fonte verificada"],
    };
  }
  
  const diferenca = Math.abs(valor1 - valor2);
  const diferencaPercentual = valor2 > 0 ? diferenca / valor2 : 1;
  
  let confiabilidade: number;
  let status: "consistente" | "alerta" | "crítico";
  let fonteRecomendada: string;
  const observacoes: string[] = [];
  
  if (diferencaPercentual <= LIMIAR_ERRO) {
    confiabilidade = 0.95;
    status = "consistente";
    fonteRecomendada = "Consenso entre fontes";
  } else if (diferencaPercentual <= 0.05) {
    confiabilidade = 0.75;
    status = "alerta";
    fonteRecomendada = valor1 > valor2 ? registro.fonte_secundaria! : registro.fonte_principal;
    observacoes.push(`Discrepância de ${(diferencaPercentual * 100).toFixed(2)}%`);
  } else {
    confiabilidade = 0.3;
    status = "crítico";
    fonteRecomendada = valor1 > valor2 ? registro.fonte_secundaria! : registro.fonte_principal;
    observacoes.push(`Erro crítico: diferença de ${(diferencaPercentual * 100).toFixed(2)}%`);
    observacoes.push("Verificar fonte original");
  }
  
  return {
    processo_numero: registro.processo_numero,
    id_municipio: registro.id_municipio,
    valor_principal: valor1,
    valor_secundario: valor2,
    diferenca,
    diferenca_percentual: diferencaPercentual,
    confiabilidade,
    status,
    fonte_recomendada: fonteRecomendada,
    observacoes,
  };
}

/**
 * Valida código IBGE
 */
function validarIbge(codigo: string, municipioEsperado: string): boolean {
  if (!codigo || !municipioEsperado) return false;
  
  const IBGE_PARA_NOME: Record<string, string> = {
    "3106705": "Betim",
    "3106200": "Belo Horizonte",
    "3121605": "Diamantina",
    "3103405": "Araçuaí",
    "3134004": "Itinga",
  };
  
  return IBGE_PARA_NOME[codigo]?.toLowerCase() === municipioEsperado.toLowerCase();
}

/**
 * Detecta duplicatas por processo
 */
function detectarDuplicatas(registros: Registro[]): Set<string> {
  const processos = new Map<string, string[]>();
  
  for (const r of registros) {
    const key = `${r.processo_numero}-${r.cnpj_credor ?? ""}`;
    if (!processos.has(key)) processos.set(key, []);
    const m = processos.get(key);
    if (m) m.push(r.id_municipio);
  }
  
  const duplicatas = new Set<string>();
  processos.forEach((municipios, key) => {
    if (municipios.length > 1) {
      // Processo aparece em múltiplos municípios - possível duplicata
      duplicatas.add(key);
    }
  });
  
  return duplicatas;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const limiarIndex = args.indexOf("--limiar");
  const limiar = limiarIndex !== -1 ? parseFloat(args[limiarIndex + 1]) : LIMIAR_ERRO;
  
  console.log("═".repeat(60));
  console.log("🤖 Bot de Verificação de Dados");
  console.log("═".repeat(60));
  console.log(`Limiar de erro: ${(limiar * 100).toFixed(1)}%`);
  console.log(`Caminho raiz: ${RAIZ}\n`);

  // Criar diretórios
  mkdirSync(CACHE_DIR, { recursive: true });
  mkdirSync(RELATÓRIO_DIR, { recursive: true });

  // Carregar dados de exemplo (simulado)
  const dadosExemplo: Registro[] = [
    {
      processo_numero: "12345-67/2024",
      id_municipio: "3106705",
      nome_municipio: "Betim",
      valor_total: 900000000, // 900 milhões - ERRADO
      fonte_principal: "PNCP API",
      fonte_secundaria: "Diário Oficial PDF",
      valor_secundario: 900000, // 900 mil - CORRETO
      cnpj_credor: "12.345.678/0001-90",
      data_publicacao: "2024-06-15",
    },
    {
      processo_numero: "54321-89/2024",
      id_municipio: "3106200",
      nome_municipio: "Belo Horizonte",
      valor_total: 12500000,
      fonte_principal: "PNCP API",
      fonte_secundaria: "Diário Oficial PDF",
      valor_secundario: 12500000,
      cnpj_credor: "98.765.432/0001-23",
      data_publicacao: "2024-07-20",
    },
  ];

  // Processar verificações
  const resultados: ResultadoVerificacao[] = [];
  let contagem = { consistente: 0, alerta: 0, critico: 0 };

  for (const registro of dadosExemplo) {
    console.log(`Processando: ${registro.processo_numero}...`);
    
    // Cross-check de valor
    const resultado = crossCheckValor(registro);
    resultados.push(resultado);
    contagem[resultado.status]++;
    
    // Validação IBGE
    if (!validarIbge(registro.id_municipio, registro.nome_municipio)) {
      console.log(`  ⚠️  Aviso: códigos IBGE podem estar incorretos`);
    }
  }

  // Detectar duplicatas
  const duplicatas = detectarDuplicatas(dadosExemplo);
  if (duplicatas.size > 0) {
    console.log(`\n⚠️  ${duplicatas.size} possíveis duplicatas detectadas`);
  }

  // Gerar relatório
  const relatorio = {
    gerado_em: new Date().toISOString(),
    limiar_utilizado: limiar,
    total_registros: resultados.length,
    resumo: contagem,
    resultados,
    duplicatas_posiveis: Array.from(duplicatas),
    configuracao: {
      fonte_principal: "PNCP API",
      fonte_secundaria: "Diário Oficial PDF",
    },
  };

  const caminhoRelatorio = resolve(RELATÓRIO_DIR, `verificacao-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(caminhoRelatorio, JSON.stringify(relatorio, null, 2), "utf-8");

  console.log(`\n✅ Resultados: ${contagem.consistente} consistentes, ${contagem.alerta} alertas, ${contagem.critico} críticos`);
  console.log(`📄 Relatório salvo em: ${caminhoRelatorio}`);

  // Resumo para impressão
  console.log("\n" + "═".repeat(60));
  console.log("📊 RESUMO DOS RESULTADOS");
  console.log("═".repeat(60));
  
  for (const r of resultados) {
    const emoji = r.status === "consistente" ? "✅" : r.status === "alerta" ? "⚠️" : "❌";
    console.log(`${emoji} ${r.processo_numero}: ${r.status}`);
    console.log(`   Valor p/incipal: ${r.valor_principal.toLocaleString("pt-BR")}`);
    console.log(`   Valor secundário: ${r.valor_secundario.toLocaleString("pt-BR")}`);
    console.log(`   Diferença: ${(r.diferenca_percentual * 100).toFixed(2)}%`);
    console.log(`   Confiabilidade: ${(r.confiabilidade * 100).toFixed(0)}%`);
    console.log(`   Fonte: ${r.fonte_recomendada}`);
    console.log("");
  }
}

main().catch(console.error);