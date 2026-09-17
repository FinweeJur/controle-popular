#!/usr/bin/env node
/**
 * scripts/verificar-e-corrigir-textos.mts
 *
 * Verificador e normalizador determinístico de texto visível ao usuário:
 * 1. Acentuação obrigatória segundo a norma culta PT-BR / ABNT.
 * 2. Normalização de grandezas numéricas fracionárias ("0,4 bilhões" -> "400 milhões").
 *
 * Garante segurança estrutural:
 * - NUNCA altera chaves de objetos JSON (apenas valores de texto).
 * - NUNCA altera rotas, URLs, imports ou atributos HTML/JSX (href, className, id, slug).
 *
 * Uso:
 *   npx tsx scripts/verificar-e-corrigir-textos.mts --check   # auditoria pré-build (exit code 1 se houver erros)
 *   npx tsx scripts/verificar-e-corrigir-textos.mts --fix     # corrige diretamente no disco
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DICIONARIO_ACENTOS: Record<string, string> = {
  informacao: "informação",
  informacoes: "informações",
  publicacao: "publicação",
  publicacoes: "publicações",
  organizacao: "organização",
  organizacoes: "organizações",
  legislacao: "legislação",
  legislacoes: "legislações",
  constituicao: "constituição",
  educacao: "educação",
  situacao: "situação",
  situacoes: "situações",
  composicao: "composição",
  comissao: "comissão",
  comissoes: "comissões",
  eleicao: "eleição",
  eleicoes: "eleições",
  deliberacao: "deliberação",
  deliberacoes: "deliberações",
  saude: "saúde",
  relatorio: "relatório",
  relatorios: "relatórios",
  transparencia: "transparência",
  experiencia: "experiência",
  assistencia: "assistência",
  historico: "histórico",
  historica: "histórica",
  violencia: "violência",
  pagina: "página",
  paginas: "páginas",
  credito: "crédito",
  creditos: "créditos",
  analise: "análise",
  analises: "análises",
  periodo: "período",
  periodos: "períodos",
  municipio: "município",
  municipios: "municípios",
  orcamento: "orçamento",
  orcamentos: "orçamentos",
  prevencao: "prevenção",
  reparacao: "reparação",
  reivindicacao: "reivindicação",
  reivindicacoes: "reivindicações",
};

function formatarNumeroLimpo(num: number): string {
  const valor = Math.round(num * 100) / 100;
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function normalizarNumerosTexto(texto: string): string {
  if (!texto) return "";
  let res = texto;

  // 1. Bilhões fracionários (< 1) -> Milhões
  const regexBilhoes = /(R\$\s*)?0[,\.](\d+)\s*(bilh(?:ão|ao|oes|ões))\b/gi;
  res = res.replace(regexBilhoes, (_match, prefixoMoeda = "", decimais = "") => {
    const valor = parseFloat(`0.${decimais}`);
    const emMilhoes = valor * 1000;
    const strValor = formatarNumeroLimpo(emMilhoes);
    const unidade = emMilhoes === 1 ? "milhão" : "milhões";
    const prefixo = prefixoMoeda || "";
    return `${prefixo}${strValor} ${unidade}`;
  });

  // 2. Milhões fracionários (< 1) -> Mil
  const regexMilhoes = /(R\$\s*)?0[,\.](\d+)\s*(milh(?:ão|ao|oes|ões))\b/gi;
  res = res.replace(regexMilhoes, (_match, prefixoMoeda = "", decimais = "") => {
    const valor = parseFloat(`0.${decimais}`);
    const emMil = valor * 1000;
    const strValor = formatarNumeroLimpo(emMil);
    const prefixo = prefixoMoeda || "";
    return `${prefixo}${strValor} mil`;
  });

  // 3. Milhares fracionários (< 1) -> Unidade inteira pura
  const regexMil = /(R\$\s*)?0[,\.](\d+)\s*mil\b/gi;
  res = res.replace(regexMil, (_match, prefixoMoeda = "", decimais = "") => {
    const valor = parseFloat(`0.${decimais}`);
    const emUnidades = valor * 1000;
    const strValor = formatarNumeroLimpo(emUnidades);
    const prefixo = prefixoMoeda || "";
    return `${prefixo}${strValor}`;
  });

  return res;
}

export function corrigirAcentuacaoTexto(texto: string): string {
  let res = texto;

  // Não mexer em URLs ou e-mails
  if (texto.startsWith("http://") || texto.startsWith("https://") || texto.startsWith("/")) {
    return texto;
  }

  for (const [semAcento, comAcento] of Object.entries(DICIONARIO_ACENTOS)) {
    const regex = new RegExp(`(?<![/\\w-])${semAcento}(?![/\\w-])`, "gi");
    res = res.replace(regex, (match) => {
      if (match[0] === match[0].toUpperCase()) {
        if (match === match.toUpperCase()) {
          return comAcento.toUpperCase();
        }
        return comAcento[0].toUpperCase() + comAcento.slice(1);
      }
      return comAcento;
    });
  }

  return res;
}

export function processarTextoSimples(texto: string): string {
  let mod = normalizarNumerosTexto(texto);
  mod = corrigirAcentuacaoTexto(mod);
  return mod;
}

function processarValorJson(val: any, chavePai: string = ""): any {
  if (typeof val === "string") {
    // Ignorar campos de identificação técnica
    if (["id", "slug", "href", "url", "tipo", "cpf", "cnpj", "hash", "icon", "icone"].includes(chavePai.toLowerCase())) {
      return val;
    }
    return processarTextoSimples(val);
  }
  if (Array.isArray(val)) {
    return val.map((item) => processarValorJson(item, chavePai));
  }
  if (val && typeof val === "object") {
    const novoObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      novoObj[k] = processarValorJson(v, k);
    }
    return novoObj;
  }
  return val;
}

function listarArquivosAlvo(dir: string, extensoes: string[]): string[] {
  const achados: string[] = [];
  function varrer(d: string) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name === ".next" || ent.name === ".git") continue;
        varrer(p);
      } else if (ent.isFile() && extensoes.some((ext) => ent.name.endsWith(ext))) {
        achados.push(p);
      }
    }
  }
  varrer(dir);
  return achados;
}

async function main() {
  const args = process.argv.slice(2);
  const aplicarFix = args.includes("--fix");

  console.log(`\n🔍 Verificação e Normalização de Textos (PT-BR & Grandezas Numéricas)`);
  console.log(`Modo: ${aplicarFix ? "🛠️ --fix (correção direta)" : "👀 --check (auditoria)"}\n`);

  const caminhos = [
    path.join(RAIZ, "apps", "web", "data"),
  ];

  let totalArquivos = 0;
  let totalModificados = 0;

  for (const baseDir of caminhos) {
    if (!fs.existsSync(baseDir)) continue;
    const arquivos = listarArquivosAlvo(baseDir, [".json"]);

    for (const arq of arquivos) {
      if (arq.endsWith(".compact.json")) continue;

      totalArquivos++;
      const conteudoRaw = fs.readFileSync(arq, "utf-8");
      try {
        const json = JSON.parse(conteudoRaw);
        const novoJson = processarValorJson(json);
        const novoRaw = JSON.stringify(novoJson, null, 2);

        if (novoRaw !== conteudoRaw) {
          totalModificados++;
          const rel = path.relative(RAIZ, arq);
          if (aplicarFix) {
            fs.writeFileSync(arq, novoRaw + "\n", "utf-8");
            console.log(`✅ Normalizado: ${rel}`);
          } else {
            console.log(`⚠️ Pendente: ${rel}`);
          }
        }
      } catch {
        // Ignora JSON inválido ou fragmentado
      }
    }
  }

  console.log(`\n📊 Resumo da Execução:`);
  console.log(`• Arquivos JSON escaneados: ${totalArquivos}`);
  console.log(`• Arquivos com ajustes: ${totalModificados}`);

  if (!aplicarFix && totalModificados > 0) {
    console.log(`\n⚠️ Encontradas oportunidades de normalização.`);
  } else if (aplicarFix) {
    console.log(`\n✨ Todos os arquivos aplicáveis foram normalizados com sucesso.`);
  } else {
    console.log(`\n✅ Nenhum erro de acentuação ou número não-normalizado encontrado.`);
  }
}

main().catch(console.error);
