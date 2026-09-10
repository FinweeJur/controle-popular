#!/usr/bin/env node

/**
 * 🤖 Cross-check PDF vs API — Caso Real de Verificação
 * 
 * Compara dados extraídos de PDF oficial com a API do PNCP
 * para detectar discrepâncias no valor de contratos.
 * 
 * Caso: Pregão Eletrônico nº 006/2026 do TCEMG
 * 
 * Uso:
 *   npx tsx bots/crosscheck-pdf-api.mts --pdf /tmp/teste-pncp.pdf --processo "006/2026"
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO_DIR = resolve(RAIZ, "docs/audit");

interface DadosPdf {
  numeroProcesso: string;
  objeto: string;
  valorEstimado: number | null;
  valorHomologado: number | null;
  dataAbertura: string | null;
  orgao: string;
}

interface DadosApi {
  numeroControlePncp: string;
  objeto: string;
  valorEstimado: number | null;
  valorHomologado: number | null;
  dataPublicacao: string | null;
  orgao: string;
}

interface ResultadoCrosscheck {
  processo: string;
  dadosPdf: DadosPdf | null;
  dadosApi: DadosApi | null;
  discrepanciaValor: number | null;
  discrepanciaPercentual: number | null;
  confiabilidade: number;
  status: "consistente" | "alerta" | "crítico";
  observacoes: string[];
  recomendacao: string | null;
}

import { execSync } from "node:child_process";

/**
 * Extrai informações do PDF do TCEMG
 * Esta função usa pdftotext + regex para extrair dados
 */
function extrairPdfConteudo(caminhoPdf: string): string {
  try {
    return execSync(`pdftotext "${caminhoPdf}" -`, { encoding: "utf8", timeout: 10000 }).toString();
  } catch {
    return "";
  }
}

/**
 * Busca dados de um processo específico na API do PNCP
 */
async function buscarApiPnpc(processo: string): Promise<DadosApi | null> {
  // Endpoint real do PNCP
  const BASE = "https://pncp.gov.br/api/consulta/v1";
  
  // O PNCP usa numeroControlePNCP no formato: CNPJ-0000000/ANO
  // Para buscar um processo específico, usamos a busca
  const url = `${BASE}/contratacoes/publicacao?palavraChave=${encodeURIComponent(processo)}`;
  
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)" }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const registro = data?.data?.[0];
    
    if (!registro) return null;
    
    return {
      numeroControlePncp: registro.numeroControlePNCP ?? null,
      objeto: registro.objetoCompra ?? null,
      valorEstimado: registro.valorTotalEstimado ?? null,
      valorHomologado: registro.valorTotalHomologado ?? null,
      dataPublicacao: registro.dataPublicacaoPncp ?? null,
      orgao: registro.orgaoEntidade?.razaoSocial ?? null,
    };
  } catch (e) {
    console.error("Erro na API do PNCP:", (e as Error).message);
    return null;
  }
}

/**
 * Extrai dados do PDF do TCEMG
 */
function extrairDadosPdf(texto: string, processo: string): DadosPdf | null {
  // Padrão para valor: "VALOR TOTAL" seguido de R$ X.XXX,XX
  const valorMatch = texto.match(/VALOR\s+TOTAL\s*[\s\S]{0,500}R?\s*\$?\s*([\d.,]+)/i);
  // Buscar "Processo de Compra"
  const processoMatch = texto.match(/PROCESSO\s+DE\s+COMPRA[^\n]*n.?\s*([\d.\/-]+)/i) ||
                        texto.match(/PREG[ÃA]O[^\n]*ELETR[ÔO]NIC[^\n]*N.?\s*([\d.\/-]+)/i);
  // Buscar objeto
  const objetoMatch = texto.match(/OBJETO:\s*\n\s*([^\n]+(?:\n[^\n]+){0,3})/i);
  
  // Extrair valores numéricos
  const valores = texto.match(/[\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{2})?/g);
  const valoresNumericos = valores?.filter(v => v.includes(",") || v.includes(".")).map(v => {
    const cleaned = v.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned);
  }).filter(v => v > 1000) || [];
  
  return {
    numeroProcesso: processo || "não informado",
    objeto: objetoMatch?.[1]?.slice(0, 200)?.trim() || "não extraído",
    valorEstimado: valoresNumericos[0] || null,
    valorHomologado: valoresNumericos[1] || valoresNumericos[0] || null,
    dataAbertura: texto.match(/dia\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1] || null,
    orgao: "TCEMG - Tribunal de Contas do Estado de Minas Gerais",
  };
}

/**
 * Realiza cross-check entre PDF e API
 */
function realizarCrosscheck(dadosPdf: DadosPdf, dadosApi: DadosApi | null): ResultadoCrosscheck {
  const observacoes: string[] = [];
  let status: "consistente" | "alerta" | "crítico" = "consistente";
  let confiabilidade = 1.0;
  let discrepanciaValor: number | null = null;
  let discrepanciaPercentual: number | null = null;
  let recomendacao: string | null = null;
  
  if (!dadosApi) {
    observacoes.push("API do PNCP não retornou dados para este processo");
    status = "alerta";
    confiabilidade = 0.6;
    recomendacao = "Verificar manualmente no site pncp.gov.br";
  } else {
    // Cross-check de valores
    const valorPdf = dadosPdf.valorHomologado ?? dadosPdf.valorEstimado;
    const valorApi = dadosApi.valorHomologado ?? dadosApi.valorEstimado;
    
    if (valorPdf && valorApi) {
      discrepanciaValor = Math.abs(valorPdf - valorApi);
      discrepanciaPercentual = valorApi > 0 ? discrepanciaValor / valorApi : null;
      
      if (discrecanciaPercentual > 0.05) {
        status = "crítico";
        confiabilidade = 0.3;
        observacoes.push(
          `Discrepância CRÍTICA: PDF=${valorPdf.toLocaleString("pt-BR")}, ` +
          `API=${valorApi.toLocaleString("pt-BR")}, ` +
          `${(discrecanciaPercentual * 100).toFixed(2)}% de diferença`
        );
        recomendada = "Usar o valor da fonte ORIGINAL (PDF oficial)";
      } else if (discrepanciaPercentual > 0.01) {
        status = "alerta";
        confiabilidade = 0.7;
        observacoes.push(`Discrepância de ${(discrepanciaPercentual * 100).toFixed(2)}% — dentro da margem aceitável`);
        recomendacao = "Confirmar manualmente";
      } else {
        observacoes.push("Valores CONSISTENTES entre PDF e API");
      }
    }
    
    // Cross-check de objeto
    if (dadosPdf.objeto && dadosApi.objeto) {
      const similarity = similaridadeTexto(dadosPdf.objeto, dadosApi.objeto);
      if (similarity < 0.8) {
        observacoes.push(`Objetos divergentes (similaridade: ${(similarity * 100).toFixed(1)}%)`);
        if (status === "consistente") {
          status = "alerta";
          confiabilidade = 0.7;
        }
      }
    }
  }
  
  return {
    processo: dadosPdf.numeroProcesso,
    dadosPdf,
    dadosApi,
    discrepanciaValor,
    discrepanciaPercentual,
    confiabilidade,
    status,
    observacoes,
    recomendacao: recomendacao ?? null,
  };
}

function similaridadeTexto(a: string, b: string): number {
  const palavrasA = new Set(a.toLowerCase().split(/\s+/));
  const palavrasB = new Set(b.toLowerCase().split(/\s+/));
  
  let intersecao = 0;
  for (const w of palavrasA) {
    if (palavrasB.has(w)) intersecao++;
  }
  
  const uniao = new Set([...palavrasA, ...palavrasB]).size;
  return uniao > 0 ? intersecao / uniao : 0;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const pdfIndex = args.indexOf("--pdf");
  const processoIndex = args.indexOf("--processo");
  
  const caminhoPdf = pdfIndex !== -1 ? args[pdfIndex + 1] : "/tmp/teste-pncp.pdf";
  const processo = processoIndex !== -1 ? args[processoIndex + 1] : "";
  
  console.log("═".repeat(60));
  console.log("🔄 Cross-check: PDF vs API do PNCP");
  console.log("═".repeat(60));
  console.log(`📄 PDF: ${caminhoPdf}`);
  console.log(`🎯 Processo: ${processo || "detectado do PDF"}`);
  console.log("");
  
  // 1. Extrair texto do PDF
  if (!existsSync(caminhoPdf)) {
    console.error(`❌ PDF não encontrado: ${caminhoPdf}`);
    process.exit(1);
  }
  
  console.log("📄 Extraindo texto do PDF...");
  const textoPdf = extrairPdfConteudo(caminhoPdf);
  if (!textoPdf || textoPdf.length < 100) {
    console.error("❌ Não foi possível extrair texto do PDF (pdftotext não disponível ou PDF em imagem)");
    process.exit(1);
  }
  console.log(`   Texto extraído: ${textoPdf.length} caracteres`);
  
  // 2. Extrair dados do PDF
  console.log("\n📊 Extraindo dados do PDF...");
  const dadosPdf = extrairDadosPdf(textoPdf, processo);
  console.log(`   Processo: ${dadosPdf.numeroProcesso}`);
  console.log(`   Valor estimado: ${dadosPdf.valorEstimado?.toLocaleString("pt-BR") ?? "N/A"}`);
  console.log(`   Valor homologado: ${dadosPdf.valorHomologado?.toLocaleString("pt-BR") ?? "N/A"}`);
  console.log(`   Órgão: ${dadosPdf.orgao}`);
  
  // 3. Buscar na API do PNCP
  console.log("\n🌐 Buscando dados na API do PNCP...");
  const dadosApi = await buscarApiPnpc(dadosPdf.numeroProcesso);
  if (dadosApi) {
    console.log(`   Processo PNCP: ${dadosApi.numeroControlePncp}`);
    console.log(`   Valor estimado: ${dadosApi.valorEstimado?.toLocaleString("pt-BR") ?? "N/A"}`);
    console.log(`   Valor homologado: ${dadosApi.valorHomologado?.toLocaleString("pt-BR") ?? "N/A"}`);
  } else {
    console.log("   ⚠️ API não retornou dados");
  }
  
  // 4. Realizar cross-check
  console.log("\n🔍 Realizando cross-check...");
  const resultado = realizarCrosscheck(dadosPdf, dadosApi);
  
  console.log(`\n📋 RESULTADO:`);
  console.log(`   Status: ${resultado.status.toUpperCase()}`);
  console.log(`   Confiabilidade: ${(resultado.confiabilidade * 100).toFixed(0)}%`);
  if (resultado.discrepanciaPercentual !== null) {
    console.log(`   Discrepância: ${(resultado.discrepanciaPercentual * 100).toFixed(2)}%`);
  }
  for (const obs of resultado.observacoes) {
    console.log(`   💬 ${obs}`);
  }
  if (resultado.recomendacao) {
    console.log(`   🎯 Recomendação: ${resultado.recomendacao}`);
  }
  
  // 5. Salvar resultado
  mkdirSync(DESTINO_DIR, { recursive: true });
  const relatorioPath = resolve(DESTINO_DIR, `crosscheck-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(relatorioPath, JSON.stringify(resultado, null, 2), "utf-8");
  console.log(`\n📄 Relatório salvo em: ${relatorioPath}`);
  
  // 6. Enviar notificação se configurado
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const DONO = process.env.TELEGRAM_CHAT_ID;
  if (TOKEN && DONO) {
    const texto = [
      `🔄 Cross-check ${processo || dadosPdf.numeroProcesso}`,
      ``,
      `Status: ${resultado.status.toUpperCase()}`,
      `Confiabilidade: ${(resultado.confiabilidade * 100).toFixed(0)}%`,
      ...resultado.observacoes.map(o => `• ${o}`),
      resultado.recomendacao ? `🔗 ${resultado.recomendacao}` : "",
    ].filter(Boolean).join("\n");
    
    try {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: DONO, text: texto }),
      });
      console.log("✅ Notificação enviada ao Telegram");
    } catch (e) {
      console.error("⚠️ Falha na notificação:", (e as Error).message);
    }
  }
}

main().catch(console.error);