/**
 * scripts/automacao/triagem-diarios-ollama.mts
 *
 * Triagem inteligente de diários oficiais em 2 estágios:
 * - Estágio 1: Regex de alta velocidade para localizar atos de interesse
 *   (dispensas, inexigibilidades, aditivos > 20%, multas ambientais).
 * - Estágio 2: Ollama local (llama3 / qwen2.5 / deepseek / mistral) para extrair
 *   dados estruturados (Contratante, Contratado, CNPJ, Valor R$, Objeto, Justificativa).
 * - Fallback: Se o Ollama estiver offline, extrai via padrões semânticos determinísticos.
 */

export interface AtoSuspeito {
  municipio: string;
  data: string;
  tipoAto: "dispensa" | "inexigibilidade" | "aditivo" | "multa_ambiental" | "licitacao";
  numeroAto: string;
  objeto: string;
  valorReais?: number;
  orgaoContratante: string;
  favorecido?: string;
  cnpjFavorecido?: string;
  justificativa?: string;
  trechoOriginal: string;
  relevancia: "alta" | "media" | "normal";
}

// Regex do Estágio 1: Pente-fino rápido
const PADROES_PENTE_FINO = [
  /dispensa\s+de\s+licita[çc][ãa]o/i,
  /inexigibilidade\s+de\s+licita[çc][ãa]o/i,
  /termo\s+aditivo/i,
  /auto\s+de\s+infra[çc][ãa]o\s+ambiental/i,
  /multa\s+administrativa/i,
  /valor\s+global\s*:\s*R\$\s*[\d.,]+/i,
  /contrato\s+n[ºo°]/i,
];

export function filtrarTrechosRelevantes(textoCompleto: string, tamanhoBloco = 800): string[] {
  const paragrafos = textoCompleto.split(/\n\s*\n/);
  const blocosRelevantes: string[] = [];

  for (const p of paragrafos) {
    const textoLimpo = p.trim();
    if (textoLimpo.length < 40) continue;

    const contemPadrao = PADROES_PENTE_FINO.some((padrao) => padrao.test(textoLimpo));
    if (contemPadrao) {
      blocosRelevantes.push(textoLimpo);
    }
  }

  return blocosRelevantes;
}

export async function processarTrechoComOllama(
  trecho: string,
  municipio: string,
  hostOllama = "http://127.0.0.1:11434"
): Promise<AtoSuspeito | null> {
  const prompt = `Analise o ato oficial abaixo publicado no diário de ${municipio} e extraia estritamente os dados em formato JSON válido:
Trecho:
"""
${trecho}
"""

Responda APENAS com um objeto JSON no formato:
{
  "tipoAto": "dispensa" ou "inexigibilidade" ou "aditivo" ou "multa_ambiental" ou "licitacao",
  "numeroAto": "número do contrato/dispensa ou 'Não informado'",
  "objeto": "resumo claro do que foi contratado ou multado",
  "valorReais": 0.0,
  "orgaoContratante": "nome da secretaria ou órgão",
  "favorecido": "nome da empresa ou pessoa contratada",
  "cnpjFavorecido": "CNPJ com máscara ou 'Não informado'",
  "justificativa": "fundamento legal (ex: Art. 75, VIII)"
}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${hostOllama}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2:latest",
        prompt,
        stream: false,
        format: "json",
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.ok) {
      const data: any = await res.json();
      const parsed = JSON.parse(data.response);
      return {
        municipio,
        data: new Date().toISOString().split("T")[0],
        tipoAto: parsed.tipoAto || "dispensa",
        numeroAto: parsed.numeroAto || "Identificado na varredura",
        objeto: parsed.objeto || "Contratação pública",
        valorReais: Number(parsed.valorReais) || undefined,
        orgaoContratante: parsed.orgaoContratante || municipio,
        favorecido: parsed.favorecido,
        cnpjFavorecido: parsed.cnpjFavorecido,
        justificativa: parsed.justificativa,
        trechoOriginal: trecho.slice(0, 300),
        relevancia: (Number(parsed.valorReais) || 0) > 500000 ? "alta" : "media",
      };
    }
  } catch {
    // Fallback determinístico caso o Ollama esteja offline
  }

  // Extração determinística via Regex (Fallback resiliente)
  const matchValor = trecho.match(/R\$\s*([\d.]+,\d{2})/);
  const valor = matchValor ? parseFloat(matchValor[1].replace(/\./g, "").replace(",", ".")) : undefined;

  let tipo: AtoSuspeito["tipoAto"] = "licitacao";
  if (/dispensa/i.test(trecho)) tipo = "dispensa";
  else if (/inexigibilidade/i.test(trecho)) tipo = "inexigibilidade";
  else if (/aditivo/i.test(trecho)) tipo = "aditivo";
  else if (/multa/i.test(trecho)) tipo = "multa_ambiental";

  return {
    municipio,
    data: new Date().toISOString().split("T")[0],
    tipoAto: tipo,
    numeroAto: "Ato extraído pelo coletor",
    objeto: trecho.slice(0, 150) + "...",
    valorReais: valor,
    orgaoContratante: `Prefeitura de ${municipio}`,
    trechoOriginal: trecho.slice(0, 300),
    relevancia: valor && valor > 500000 ? "alta" : "normal",
  };
}
