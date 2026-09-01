// Gera o catálogo das cidades estratégicas do portal em
// apps/web/data/cidades-estrategicas.json — a fonte única para o coletor
// por cidade (scripts/coletar-cidade.mts, Fase 2 do plano de automação).
//
// ═══ DE ONDE VEM CADA NÚMERO (nenhum código digitado à mão) ═══
//   - Capitais (27): parseadas das migrations de seed já conferidas
//       supabase/betim/migrations/0027_seed_bh_sp.sql (BH, SP)
//       supabase/betim/migrations/0082_seed_capitais_brasil.sql (25 capitais)
//     Códigos IBGE, CNPJs e hosts foram verificados ao vivo na época do seed
//     (PNCP/Interlegis/IBGE) — o parse reaproveita a conferência, não a refaz.
//   - Polos do interior (172): apps/web/data/polos-interior-ibge.json,
//     inventário conferido na API do IBGE por nome normalizado + UF
//     (scripts/gerar-polos-interior.cjs).
//
// Região das capitais é derivada da UF (tabela fixa abaixo). Campos que os
// seeds ainda não têm (cnpj_camara e fornecedor da câmara dos polos) saem
// null — CNPJ errado é pior que ausente (ver runbook-cidade-nova.md).
//
// Uso (fora da CI):
//   node scripts/gerar-cidades-estrategicas.cjs
const fs = require("fs");
const path = require("path");
const RAIZ = path.resolve(__dirname, "..");

const CAMINHO_SEED_BH_SP = path.join(RAIZ, "supabase", "betim", "migrations", "0027_seed_bh_sp.sql");
const CAMINHO_SEED_CAPITAIS = path.join(RAIZ, "supabase", "betim", "migrations", "0082_seed_capitais_brasil.sql");
const CAMINHO_INVENTARIO_POLOS = path.join(RAIZ, "apps", "web", "data", "polos-interior-ibge.json");
const DESTINO = path.join(RAIZ, "apps", "web", "data", "cidades-estrategicas.json");

const REGIAO_POR_UF = {
  AC: "Norte", AP: "Norte", AM: "Norte", PA: "Norte", RO: "Norte", RR: "Norte", TO: "Norte",
  AL: "Nordeste", BA: "Nordeste", CE: "Nordeste", MA: "Nordeste", PB: "Nordeste",
  PE: "Nordeste", PI: "Nordeste", RN: "Nordeste", SE: "Nordeste",
  DF: "Centro-Oeste", GO: "Centro-Oeste", MT: "Centro-Oeste", MS: "Centro-Oeste",
  ES: "Sudeste", MG: "Sudeste", RJ: "Sudeste", SP: "Sudeste",
  PR: "Sul", RS: "Sul", SC: "Sul",
};

// Captura cada tupla do INSERT: ('1200401', 'Rio Branco', 'AC', 'cnpj', lat, lng,
// 'dominio', '{branding}'::jsonb, '{fontes}'::jsonb, false)
const RE_TUPLA = /\(\s*'(\d{7})',\s*'([^']*)',\s*'([A-Z]{2})',\s*'(\d{14})',\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*),\s*'([^']*)',\s*'(\{[\s\S]*?\})'\s*::jsonb,\s*'(\{[\s\S]*?\})'\s*::jsonb,\s*(true|false)\s*\)/g;

function jsonbParaObjeto(literal) {
  // '{ "chave": "valor" }' → JSON.parse do conteúdo entre aspas simples
  return JSON.parse(literal.replace(/''/g, "'"));
}

function extrairCapitais(caminho) {
  const sql = fs.readFileSync(caminho, "utf8");
  const capitais = [];
  for (const m of sql.matchAll(RE_TUPLA)) {
    const [, id, nome, uf, cnpj, lat, lng, dominio, brandingLit, fontesLit, ativo] = m;
    const branding = jsonbParaObjeto(brandingLit) ?? {};
    const fontes = jsonbParaObjeto(fontesLit) ?? {};
    capitais.push({
      id_municipio: id,
      nome,
      uf,
      regiao: REGIAO_POR_UF[uf] ?? null,
      tipo: "capital",
      datasus_6dig: fontes.datasus_6dig ?? id.slice(0, 6),
      cnpj_prefeitura: cnpj,
      cnpj_camara: fontes.cnpj_camara ?? null,
      camara_sistema: fontes.camara_sistema ?? null,
      camara_coletor: fontes.camara_coletor ?? null,
      camara_host: fontes.camara_host ?? null,
      prefeitura_host: fontes.prefeitura_host ?? null,
      prefeitura_dados_abertos_api: fontes.prefeitura_dados_abertos_api ?? null,
      prefeitura_dados_abertos_host: fontes.prefeitura_dados_abertos_host ?? null,
      diario_oficial: fontes.diario_oficial ?? null,
      estado_municipios_count: fontes.estado_municipios_count ?? null,
      lat: Number(lat),
      lng: Number(lng),
      nome_portal: branding.nome_portal ?? null,
      slug: branding.slug ?? null,
      ativo: ativo === "true",
    });
  }
  return capitais;
}

function extrairPolos() {
  const inventario = JSON.parse(fs.readFileSync(CAMINHO_INVENTARIO_POLOS, "utf8"));
  return inventario.polos.map((p) => ({
    id_municipio: p.id_municipio,
    nome: p.nome,
    uf: p.uf,
    regiao: p.regiao,
    tipo: "polo-interior",
    datasus_6dig: p.datasus_6dig ?? p.id_municipio.slice(0, 6),
    cnpj_prefeitura: null, // pendência explícita: conferir no PNCP por polo
    cnpj_camara: null,
    camara_sistema: null,
    camara_coletor: null,
    camara_host: null,
    prefeitura_host: null,
    prefeitura_dados_abertos_api: null,
    prefeitura_dados_abertos_host: null,
    diario_oficial: null,
    estado_municipios_count: inventario.municipios_por_uf?.[p.uf] ?? null,
    lat: null,
    lng: null,
    nome_portal: `Controle Popular ${p.nome}`,
    slug: null,
    ativo: false, // até o ETL rodar pelo menos uma vez (runbook)
  }));
}

function main() {
  const capitais = [...extrairCapitais(CAMINHO_SEED_BH_SP), ...extrairCapitais(CAMINHO_SEED_CAPITAIS)];
  const polos = extrairPolos();
  const cidades = [...capitais, ...polos].sort((a, b) => a.id_municipio.localeCompare(b.id_municipio));

  // Sanidade: nenhum id repetido, nenhum nome repetido na mesma UF
  const ids = new Set(cidades.map((c) => c.id_municipio));
  const chaveNomeUf = new Set(cidades.map((c) => `${c.nome}/${c.uf}`));
  if (ids.size !== cidades.length) {
    console.error("ERRO: id_municipio duplicado no catálogo — abortando.");
    process.exit(1);
  }
  if (chaveNomeUf.size !== cidades.length) {
    console.error("ERRO: nome+UF duplicado no catálogo — abortando.");
    process.exit(1);
  }

  const porRegiao = {};
  const porTipo = {};
  for (const c of cidades) {
    porRegiao[c.regiao] = (porRegiao[c.regiao] || 0) + 1;
    porTipo[c.tipo] = (porTipo[c.tipo] || 0) + 1;
  }

  const payload = {
    gerado_em: new Date().toISOString().slice(0, 10),
    fonte: "seeds 0027/0082 (capitais conferidas) + polos-interior-ibge.json (172 polos conferidos no IBGE)",
    conferencia: "capitais parseadas das migrations de seed verificadas; polos do inventario IBGE por nome normalizado + UF",
    total: cidades.length,
    por_regiao: porRegiao,
    por_tipo: porTipo,
    cidades,
  };

  fs.writeFileSync(DESTINO, JSON.stringify(payload, null, 2));
  console.log("=== RESUMO DO CATALOGO DE CIDADES ESTRATEGICAS ===");
  console.log(`Total: ${cidades.length}`);
  console.log(`Por tipo: ${JSON.stringify(porTipo)}`);
  console.log(`Por regiao: ${JSON.stringify(porRegiao)}`);
  console.log(`Salvo: apps/web/data/cidades-estrategicas.json`);
}

main();
