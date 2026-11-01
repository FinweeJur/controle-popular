#!/usr/bin/env node
/**
 * scripts/exportar-direitos-globais-r2.mts
 *
 * Exportador de dados e manifesto para RAG e R2 das Frentes B (África) e C (Ásia / ONU).
 * 1. Exporta datasets estruturados em JSON para X:\DevCoder\_dados\ (fora do repo Git).
 * 2. Mapeia links de PDFs oficiais (Corte Africana, ACHPR, ONU) com chaves R2 e hash sha256.
 * 3. Emite o manifesto documental para o RAG em apps/web/public/data/documentos-rag/.
 * 4. Atualiza apps/web/data/documentos-espelho-r2.json.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { PAISES_AFRICA } from "../apps/web/lib/direitos-globais/africa/paises.js";
import { TRATADOS_UA, ADESAO_UA } from "../apps/web/lib/direitos-globais/africa/tratados-ua.js";
import { CASOS_AFRICANOS } from "../apps/web/lib/direitos-globais/africa/casos-corte-africana.js";
import { RECOMENDACOES_ACHPR } from "../apps/web/lib/direitos-globais/africa/recomendacoes-achpr.js";

import { PAISES_ASIA } from "../apps/web/lib/direitos-globais/asia/paises.js";
import { INSTRUMENTOS_REGIONAIS_ASIA } from "../apps/web/lib/direitos-globais/asia/tratados-regionais.js";
import { ORGAOS_TRATADOS_ONU, ADESAO_ONU_ASIA } from "../apps/web/lib/direitos-globais/onu/orgaos-tratados.js";
import { RECOMENDACOES_ONU_ASIA } from "../apps/web/lib/direitos-globais/onu/recomendacoes-upr.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DADOS_DIR = "X:\\DevCoder\\_dados";
const RAG_DIR = path.join(RAIZ, "apps", "web", "public", "data", "documentos-rag");
const MAPA_R2 = path.join(RAIZ, "apps", "web", "data", "documentos-espelho-r2.json");

function gerarHashUrl(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function assegurarDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  console.log("=== Exportando Acervos de Direitos Globais (África, Ásia e ONU) ===");

  // 1. Assegurar diretórios locais em _dados
  assegurarDir(path.join(DADOS_DIR, "africa"));
  assegurarDir(path.join(DADOS_DIR, "asia"));
  assegurarDir(path.join(DADOS_DIR, "onu"));
  assegurarDir(RAG_DIR);

  // 2. Gravar JSONs brutos em X:\DevCoder\_dados\
  const acervoAfrica = {
    metadata: {
      fonte: "União Africana (au.int), Corte Africana (african-court.org) e Comissão ACHPR (achpr.org)",
      dataAcesso: new Date().toISOString().slice(0, 10),
      totalPaises: PAISES_AFRICA.length,
      totalTratados: TRATADOS_UA.length,
      totalCasos: CASOS_AFRICANOS.length,
      totalRecomendacoes: RECOMENDACOES_ACHPR.length,
    },
    paises: PAISES_AFRICA,
    tratados: TRATADOS_UA,
    adesao: ADESAO_UA,
    casos: CASOS_AFRICANOS,
    recomendacoes: RECOMENDACOES_ACHPR,
  };

  const acervoAsia = {
    metadata: {
      fonte: "Constitute Project, ASEAN (asean.org) e AICHR",
      dataAcesso: new Date().toISOString().slice(0, 10),
      totalPaises: PAISES_ASIA.length,
      instrumentos: INSTRUMENTOS_REGIONAIS_ASIA.length,
    },
    paises: PAISES_ASIA,
    instrumentosRegionais: INSTRUMENTOS_REGIONAIS_ASIA,
  };

  const acervoOnu = {
    metadata: {
      fonte: "OHCHR (tbinternet.ohchr.org), UHRI e UPR Info",
      dataAcesso: new Date().toISOString().slice(0, 10),
      totalOrgaos: ORGAOS_TRATADOS_ONU.length,
      totalRecomendacoes: RECOMENDACOES_ONU_ASIA.length,
    },
    orgaosTratados: ORGAOS_TRATADOS_ONU,
    adesaoAsia: ADESAO_ONU_ASIA,
    recomendacoes: RECOMENDACOES_ONU_ASIA,
  };

  fs.writeFileSync(
    path.join(DADOS_DIR, "africa", "acervo-africa.json"),
    JSON.stringify(acervoAfrica, null, 2),
    "utf-8"
  );
  console.log("✓ Exportado X:\\DevCoder\\_dados\\africa\\acervo-africa.json");

  fs.writeFileSync(
    path.join(DADOS_DIR, "asia", "acervo-asia.json"),
    JSON.stringify(acervoAsia, null, 2),
    "utf-8"
  );
  console.log("✓ Exportado X:\\DevCoder\\_dados\\asia\\acervo-asia.json");

  fs.writeFileSync(
    path.join(DADOS_DIR, "onu", "acervo-onu.json"),
    JSON.stringify(acervoOnu, null, 2),
    "utf-8"
  );
  console.log("✓ Exportado X:\\DevCoder\\_dados\\onu\\acervo-onu.json");

  // 3. Gerar Manifesto para o RAG documental
  const itensRag = [
    // Casos da Corte e Comissão Africana
    ...CASOS_AFRICANOS.map((c) => ({
      id: `africa-caso-${c.numero.replace(/[^a-zA-Z0-9]/g, "-")}`,
      titulo: `${c.tribunal}: ${c.partes}`,
      fonte: c.tribunal,
      jurisdicao: "Regional Africana",
      pais: c.pais,
      ano: Number(c.data.slice(0, 4)),
      data: c.data,
      tipo: "jurisprudencia",
      tema: c.temaPrincipal,
      url: c.url,
      resumo: c.resumoOficial,
      artigos: c.artigos,
      reparacoes: c.reparacoes,
      cumprimento: c.cumprimento,
    })),
    // Recomendações ACHPR
    ...RECOMENDACOES_ACHPR.map((r, i) => ({
      id: `achpr-rec-${r.pais.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${i + 1}`,
      titulo: `ACHPR: ${r.documento} (${r.pais})`,
      fonte: "Comissão Africana dos Direitos Humanos e dos Povos",
      jurisdicao: "Regional Africana",
      pais: r.pais,
      ano: Number(r.data.slice(0, 4)),
      data: r.data,
      tipo: "recomendacao",
      tema: r.tema,
      url: r.url,
      resumo: r.texto,
      status: r.status,
      evidencia: r.evidencia,
    })),
    // Recomendações ONU
    ...RECOMENDACOES_ONU_ASIA.map((u, i) => ({
      id: `onu-rec-${u.pais.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${i + 1}`,
      titulo: `${u.orgao}: ${u.documento} (${u.pais})`,
      fonte: `ONU / ${u.orgao}`,
      jurisdicao: "Sistema Universal ONU",
      pais: u.pais,
      ano: Number(u.data.slice(0, 4)),
      data: u.data,
      tipo: "recomendacao_upr",
      tema: u.tema,
      url: u.url,
      resumo: u.texto,
      status: u.status,
      evidencia: u.evidencia,
    })),
  ];

  const manifestoRag = {
    versao: "1.0.0",
    dataGeracao: new Date().toISOString(),
    totalItens: itensRag.length,
    documentos: itensRag,
  };

  fs.writeFileSync(
    path.join(RAG_DIR, "manifesto-direitos-globais.json"),
    JSON.stringify(manifestoRag, null, 2),
    "utf-8"
  );
  console.log(`✓ Gerado Manifesto RAG com ${itensRag.length} documentos em apps/web/public/data/documentos-rag/manifesto-direitos-globais.json`);

  // 4. Atualizar mapa de espelhamento R2
  let mapaR2: Record<string, any> = {};
  if (fs.existsSync(MAPA_R2)) {
    try {
      mapaR2 = JSON.parse(fs.readFileSync(MAPA_R2, "utf-8"));
    } catch {
      mapaR2 = {};
    }
  }

  let novosLinks = 0;
  for (const item of itensRag) {
    if (item.url && !mapaR2[item.url]) {
      const hash = gerarHashUrl(item.url);
      const prefixo = item.jurisdicao.includes("Africana") ? "africa" : "onu";
      const chaveR2 = `fontes/${prefixo}/${hash}.pdf`;

      mapaR2[item.url] = {
        urlR2: `https://fontes.controlepopular.com.br/${chaveR2}`,
        chaveR2,
        sha256: crypto.createHash("sha256").update(item.url).digest("hex"),
        dataCadastro: new Date().toISOString(),
        status: "mapeado",
        titulo: item.titulo,
        pais: item.pais,
      };
      novosLinks++;
    }
  }

  fs.writeFileSync(MAPA_R2, JSON.stringify(mapaR2, null, 2), "utf-8");
  console.log(`✓ Atualizado apps/web/data/documentos-espelho-r2.json (+${novosLinks} novos links mapeados para R2)`);
  console.log("=== Concluído com sucesso! ===");
}

main().catch((err) => {
  console.error("Erro na exportação:", err);
  process.exit(1);
});
