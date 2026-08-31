/**
 * Hermes Agent — Auditor de Segurança Defensiva e Integridade de Dados
 *
 * Realiza verificações defensivas de postura de segurança, headers/CSP,
 * conformidade com as regras de dados, limites de bundle do Cloudflare
 * e varredura de privacidade (CPF mod-11).
 */

import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RELATORIO_DESTINO = path.join(
  RAIZ,
  "docs",
  "relatorios-automacao",
  "hermes-auditoria-seguranca.json"
);

export interface ItemAuditoria {
  categoria: "seguranca" | "privacidade" | "cloudflare" | "qualidade_dados";
  item: string;
  status: "APROVADO" | "ALERTA" | "FALHA";
  detalhes: string;
}

export function auditarCspEHeaders(): ItemAuditoria[] {
  const itens: ItemAuditoria[] = [];
  const nextConfigPath = path.join(RAIZ, "apps", "web", "next.config.ts");
  const headersPublicPath = path.join(RAIZ, "apps", "web", "public", "_headers");

  if (!existsSync(nextConfigPath)) {
    itens.push({
      categoria: "seguranca",
      item: "next.config.ts",
      status: "FALHA",
      detalhes: "Arquivo next.config.ts não encontrado.",
    });
    return itens;
  }

  const nextConfigConteudo = readFileSync(nextConfigPath, "utf-8");

  // 1. Verificar se CSP está em Report-Only
  if (nextConfigConteudo.includes("Content-Security-Policy-Report-Only")) {
    itens.push({
      categoria: "seguranca",
      item: "CSP Report-Only",
      status: "APROVADO",
      detalhes: "CSP está configurado em modo Report-Only conforme política de observação.",
    });
  } else {
    itens.push({
      categoria: "seguranca",
      item: "CSP Report-Only",
      status: "ALERTA",
      detalhes: "Cabeçalho CSP Report-Only não localizado em next.config.ts.",
    });
  }

  // 2. Verificar Headers de Segurança (HSTS, X-Frame, Nosniff)
  const temHsts = nextConfigConteudo.includes("Strict-Transport-Security");
  const temNoSniff = nextConfigConteudo.includes("X-Content-Type-Options");
  const temFrameOptions = nextConfigConteudo.includes("X-Frame-Options");

  if (temHsts && temNoSniff && temFrameOptions) {
    itens.push({
      categoria: "seguranca",
      item: "Headers de Proteção Básica (HSTS/Nosniff/Frame)",
      status: "APROVADO",
      detalhes: "HSTS, X-Content-Type-Options e X-Frame-Options devidamente declarados.",
    });
  } else {
    itens.push({
      categoria: "seguranca",
      item: "Headers de Proteção Básica",
      status: "FALHA",
      detalhes: "Um ou mais headers básicos (HSTS, Nosniff, Frame-Options) ausentes.",
    });
  }

  // 3. Verificar espelhamento em public/_headers
  if (existsSync(headersPublicPath)) {
    const headersPublicConteudo = readFileSync(headersPublicPath, "utf-8");
    if (headersPublicConteudo.includes("Strict-Transport-Security")) {
      itens.push({
        categoria: "seguranca",
        item: "Espelhamento public/_headers",
        status: "APROVADO",
        detalhes: "public/_headers configurado para garantir proteção nos Static Assets do Worker.",
      });
    }
  }

  return itens;
}

export function auditarSegredosEVazamentos(): ItemAuditoria[] {
  const itens: ItemAuditoria[] = [];

  // Padrões de segredos óbvios que nunca devem estar em repositório
  const padroesSegredo = [
    /AKIA[0-9A-Z]{16}/, // AWS Access Key
    /ghp_[0-9a-zA-Z]{36}/, // GitHub Personal Token
    /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/, // Chaves Privadas
    /postgres:\/\/[^:]+:[^@]+@/, // URLs de banco com senha exposta
  ];

  const arquivosChecar = [
    "apps/web/next.config.ts",
    "apps/web/lib/fontes/registry.ts",
    "scripts/rotina-coletas.mts",
  ];

  let vazamentoEncontrado = false;
  for (const rel of arquivosChecar) {
    const p = path.join(RAIZ, rel);
    if (!existsSync(p)) continue;
    const txt = readFileSync(p, "utf-8");
    for (const re of padroesSegredo) {
      if (re.test(txt)) {
        vazamentoEncontrado = true;
        itens.push({
          categoria: "seguranca",
          item: `Varredura de Segredos em ${rel}`,
          status: "FALHA",
          detalhes: `Padrão de segredo/token potencial detectado no arquivo: ${re.source}`,
        });
      }
    }
  }

  if (!vazamentoEncontrado) {
    itens.push({
      categoria: "seguranca",
      item: "Varredura Estática de Segredos",
      status: "APROVADO",
      detalhes: "Nenhum token ou chave de credencial identificado nos arquivos críticos.",
    });
  }

  return itens;
}

export function auditarLimitesCloudflare(): ItemAuditoria[] {
  const itens: ItemAuditoria[] = [];
  const LIMITE_ARQUIVO_BYTES = 25 * 1024 * 1024; // 25 MiB

  const pastasDados = [
    path.join(RAIZ, "apps", "web", "data"),
    path.join(RAIZ, "apps", "web", "public", "data"),
  ];

  let totalVerificados = 0;
  let arquivoAcimaLimite = false;

  for (const pasta of pastasDados) {
    if (!existsSync(pasta)) continue;
    const arquivos = readdirSync(pasta);
    for (const arq of arquivos) {
      const p = path.join(pasta, arq);
      const st = statSync(p);
      if (st.isFile()) {
        totalVerificados++;
        if (st.size > LIMITE_ARQUIVO_BYTES) {
          arquivoAcimaLimite = true;
          itens.push({
            categoria: "cloudflare",
            item: `Limite de 25 MiB: ${arq}`,
            status: "FALHA",
            detalhes: `Arquivo possui ${(st.size / 1024 / 1024).toFixed(2)} MiB, excedendo o teto do Cloudflare.`,
          });
        }
      }
    }
  }

  if (!arquivoAcimaLimite) {
    itens.push({
      categoria: "cloudflare",
      item: "Teto de 25 MiB do Cloudflare Workers",
      status: "APROVADO",
      detalhes: `Todos os ${totalVerificados} arquivos de dados em data/ e public/data/ estão dentro do limite.`,
    });
  }

  return itens;
}

export function auditarPrivacidadeCpf(): ItemAuditoria[] {
  const scriptVarredura = path.join(RAIZ, "scripts", "checar-dado-pessoal-em-dado.py");
  if (!existsSync(scriptVarredura)) {
    return [
      {
        categoria: "privacidade",
        item: "Script de Varredura de CPF",
        status: "FALHA",
        detalhes: "Script checar-dado-pessoal-em-dado.py não encontrado.",
      },
    ];
  }

  const r = spawnSync("python", [scriptVarredura], {
    cwd: RAIZ,
    encoding: "utf-8",
  });

  if (r.status === 0) {
    return [
      {
        categoria: "privacidade",
        item: "Varredura Mod-11 de CPF nos Acervos",
        status: "APROVADO",
        detalhes: "Todos os arquivos de dados foram escaneados com ZERO CPFs de pessoas físicas encontrados.",
      },
    ];
  } else {
    return [
      {
        categoria: "privacidade",
        item: "Varredura Mod-11 de CPF nos Acervos",
        status: "FALHA",
        detalhes: `Falha na verificação de dados pessoais: ${r.stderr || r.stdout}`,
      },
    ];
  }
}

export function auditarQualidadePaginas(): ItemAuditoria[] {
  const itens: ItemAuditoria[] = [];

  const paginasVerificar = [
    "apps/web/app/ambiental/barragens/sigbm/page.tsx",
    "apps/web/app/ambiental/ibama/page.tsx",
    "apps/web/app/ambiental/decisoes-lai/page.tsx",
  ];

  for (const rel of paginasVerificar) {
    const p = path.join(RAIZ, rel);
    if (!existsSync(p)) {
      itens.push({
        categoria: "qualidade_dados",
        item: `5 Regras: ${rel}`,
        status: "FALHA",
        detalhes: "Página não encontrada no repositório.",
      });
      continue;
    }

    const txt = readFileSync(p, "utf-8");
    const temGrafico = txt.includes("Grafico") || txt.includes("Svg");
    const temCartoes = txt.includes("CartoesResumo") || txt.includes("itensCartoes");
    const temRessalva = txt.includes("Nota") || txt.includes("Ressalva") || txt.includes("segurança");

    if (temGrafico && temCartoes && temRessalva) {
      itens.push({
        categoria: "qualidade_dados",
        item: `5 Regras de Qualidade: ${path.basename(path.dirname(p))}`,
        status: "APROVADO",
        detalhes: "Página atende às regras: Gráfico SVG inline, Cartões de Topo, e Ressalva Editorial.",
      });
    } else {
      itens.push({
        categoria: "qualidade_dados",
        item: `5 Regras de Qualidade: ${path.basename(path.dirname(p))}`,
        status: "ALERTA",
        detalhes: "Possível ausência de Gráfico SVG ou Cartões de Topo na página.",
      });
    }
  }

  return itens;
}

export async function executarAuditoriaHermes(): Promise<{
  geradoEm: string;
  agente: string;
  totalVerificacoes: number;
  aprovados: number;
  alertas: number;
  falhas: number;
  itens: ItemAuditoria[];
}> {
  console.log("🛡️  [Hermes Agent] Iniciando auditoria de segurança defensiva e integridade de dados...");

  const itens: ItemAuditoria[] = [
    ...auditarCspEHeaders(),
    ...auditarSegredosEVazamentos(),
    ...auditarLimitesCloudflare(),
    ...auditarPrivacidadeCpf(),
    ...auditarQualidadePaginas(),
  ];

  const aprovados = itens.filter((i) => i.status === "APROVADO").length;
  const alertas = itens.filter((i) => i.status === "ALERTA").length;
  const falhas = itens.filter((i) => i.status === "FALHA").length;

  for (const item of itens) {
    const icone = item.status === "APROVADO" ? "✓" : item.status === "ALERTA" ? "⚠️" : "❌";
    console.log(`  ${icone} [${item.categoria.toUpperCase()}] ${item.item}: ${item.detalhes}`);
  }

  const relatorio = {
    geradoEm: new Date().toISOString(),
    agente: "Hermes Agent Security & Data Auditor",
    totalVerificacoes: itens.length,
    aprovados,
    alertas,
    falhas,
    itens,
  };

  mkdirSync(path.dirname(RELATORIO_DESTINO), { recursive: true });
  writeFileSync(RELATORIO_DESTINO, JSON.stringify(relatorio, null, 2), "utf-8");
  console.log(`\n✓ [Hermes Agent] Relatório salvo em: ${RELATORIO_DESTINO}`);
  console.log(`  Resultado: ${aprovados} Aprovados, ${alertas} Alertas, ${falhas} Falhas\n`);

  return relatorio;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  executarAuditoriaHermes().catch(console.error);
}
