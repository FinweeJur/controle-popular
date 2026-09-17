#!/usr/bin/env node
/**
 * scripts/baixar-planos-governo.mts
 *
 * Coletor oficial de Planos de Governo registrados no TSE (DivulgaCandContas)
 * para os candidatos eleitos das cidades e estados monitorados pelo portal.
 *
 * Funcionalidades:
 * - Consulta metadados da Justiça Eleitoral (TSE).
 * - Baixa os PDFs das propostas de governo para `documentos-site/planos-governo/`.
 * - Calcula hash SHA-256 para integridade e auditoria cidadã.
 * - Registra metadados estruturados em `apps/web/data/gestao/planos-governo-eleitos.json`.
 *
 * Uso:
 *   npx tsx scripts/baixar-planos-governo.mts                    # baixa todos os catalogados
 *   npx tsx scripts/baixar-planos-governo.mts --limite 2        # piloto (apenas os 2 primeiros)
 *   npx tsx scripts/baixar-planos-governo.mts --dry-run         # apenas lista URLs e metadados
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR_DOCS = path.join(RAIZ, "documentos-site", "planos-governo");
const ARQUIVO_DESTINO = path.join(RAIZ, "apps", "web", "data", "gestao", "planos-governo-eleitos.json");

const UA = "controlepopular-planos-governo/0.1 (portal civico de transparencia; contato: contato@controlepopular.com.br)";
const PAUSA_MS = 500;

interface AlvoPlanoGoverno {
  id: string;
  ente: string;
  tipo: "estado" | "municipio";
  uf: string;
  gestor: string;
  cargo: "Governador" | "Prefeito";
  partido: string;
  anoEleicao: number;
  idEleicaoTse: string;
  sqCandidatoTse: string;
  urlPropostaTse: string;
}

/**
 * Catálogo dos governantes eleitos nos estados e cidades polo estratégicas.
 */
const ALVOS_PLANOS: AlvoPlanoGoverno[] = [
  {
    id: "governo-mg-zema",
    ente: "Minas Gerais",
    tipo: "estado",
    uf: "MG",
    gestor: "Romeu Zema",
    cargo: "Governador",
    partido: "NOVO",
    anoEleicao: 2022,
    idEleicaoTse: "2040602022",
    sqCandidatoTse: "130001612450",
    urlPropostaTse: "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/arquivo/2022/2040602022/130001612450/5",
  },
  {
    id: "governo-sp-tarcisio",
    ente: "São Paulo",
    tipo: "estado",
    uf: "SP",
    gestor: "Tarcísio de Freitas",
    cargo: "Governador",
    partido: "REPUBLICANOS",
    anoEleicao: 2022,
    idEleicaoTse: "2040602022",
    sqCandidatoTse: "250001614210",
    urlPropostaTse: "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/arquivo/2022/2040602022/250001614210/5",
  },
  {
    id: "prefeitura-bh-fuad",
    ente: "Belo Horizonte",
    tipo: "municipio",
    uf: "MG",
    gestor: "Fuad Noman",
    cargo: "Prefeito",
    partido: "PSD",
    anoEleicao: 2024,
    idEleicaoTse: "2045202024",
    sqCandidatoTse: "130002130104",
    urlPropostaTse: "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/arquivo/2024/2045202024/130002130104/5",
  },
  {
    id: "prefeitura-betim-heron",
    ente: "Betim",
    tipo: "municipio",
    uf: "MG",
    gestor: "Heron Guimarães",
    cargo: "Prefeito",
    partido: "UNIÃO",
    anoEleicao: 2024,
    idEleicaoTse: "2045202024",
    sqCandidatoTse: "130002134560",
    urlPropostaTse: "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/arquivo/2024/2045202024/130002134560/5",
  },
  {
    id: "prefeitura-campinas-dario",
    ente: "Campinas",
    tipo: "municipio",
    uf: "SP",
    gestor: "Dário Saadi",
    cargo: "Prefeito",
    partido: "REPUBLICANOS",
    anoEleicao: 2024,
    idEleicaoTse: "2045202024",
    sqCandidatoTse: "250002140500",
    urlPropostaTse: "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/arquivo/2024/2045202024/250002140500/5",
  },
];

function pausar(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function baixarPdf(url: string, destino: string): Promise<{ ok: boolean; status: number; bytes: number; hash: string }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      return { ok: false, status: res.status, bytes: 0, hash: "" };
    }

    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, buffer);

    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    return { ok: true, status: res.status, bytes: buffer.length, hash };
  } catch (err) {
    return { ok: false, status: 0, bytes: 0, hash: "" };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limiteArg = args.find((a) => a.startsWith("--limite"));
  const limite = limiteArg ? parseInt(limiteArg.split("=")[1] || args[args.indexOf(limiteArg) + 1], 10) : undefined;

  console.log("\n📥 Coletor de Planos de Governo dos Candidatos Eleitos (TSE)");
  console.log(`Modo: ${dryRun ? "🔍 --dry-run (apenas consulta)" : "💾 download ativo"}`);
  if (limite) console.log(`Limite aplicado: ${limite} registros`);

  const alvos = limite ? ALVOS_PLANOS.slice(0, limite) : ALVOS_PLANOS;
  const resultados: any[] = [];

  for (let i = 0; i < alvos.length; i++) {
    const alvo = alvos[i];
    console.log(`\n[${i + 1}/${alvos.length}] ${alvo.cargo}: ${alvo.gestor} (${alvo.ente}-${alvo.uf})`);
    console.log(`• URL TSE: ${alvo.urlPropostaTse}`);

    const nomeArquivo = `${alvo.id}.pdf`;
    const caminhoLocal = path.join(DIR_DOCS, alvo.anoEleicao.toString(), alvo.uf.toLowerCase(), nomeArquivo);
    const relLocal = path.relative(RAIZ, caminhoLocal);

    if (dryRun) {
      resultados.push({
        ...alvo,
        caminhoRelativo: relLocal,
        statusDownload: "dry-run",
      });
      continue;
    }

    console.log(`• Baixando para: ${relLocal}`);
    const res = await baixarPdf(alvo.urlPropostaTse, caminhoLocal);

    if (res.ok) {
      console.log(`  ✅ Download concluído: ${(res.bytes / 1024).toFixed(1)} KB (SHA-256: ${res.hash.slice(0, 16)}...)`);
      resultados.push({
        ...alvo,
        caminhoRelativo: relLocal,
        tamanhoBytes: res.bytes,
        sha256: res.hash,
        dataColeta: new Date().toISOString(),
        statusDownload: "concluido",
      });
    } else {
      console.log(`  ⚠️ Falha no download direto da API do TSE (HTTP ${res.status}). Registrando metadados.`);
      resultados.push({
        ...alvo,
        caminhoRelativo: relLocal,
        statusDownload: "pendente-tse",
        dataTentativa: new Date().toISOString(),
      });
    }

    await pausar(PAUSA_MS);
  }

  fs.mkdirSync(path.dirname(ARQUIVO_DESTINO), { recursive: true });
  fs.writeFileSync(ARQUIVO_DESTINO, JSON.stringify(resultados, null, 2) + "\n", "utf-8");
  console.log(`\n📄 Índice de planos de governo gravado em: ${path.relative(RAIZ, ARQUIVO_DESTINO)}`);
  console.log("✅ Processamento finalizado.");
}

main().catch(console.error);
