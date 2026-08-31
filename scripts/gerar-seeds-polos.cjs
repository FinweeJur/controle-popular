// Gera os seeds 0083-0087 (polos do interior, um por região) a partir do
// inventário conferido em apps/web/data/polos-interior-ibge.json.
//
// O QUE ENTRA NO SEED (conferido):
//   - id_municipio (IBGE 7d, conferido na API — nunca por nome)
//   - nome, uf, datasus_6dig, estado_municipios_count (do catálogo IBGE)
//   - dominio/branding derivados do nome oficial
//   - fontes com TODAS as guardas de MG em false (paraopeba, citrolandia,
//     links_uteis_mg, rotas_legadas) — fora de MG nenhuma se aplica
//   - ativo = false (a rota nasce do banco; nada vai ao ar até ETL rodar)
//
// O QUE FICA DE FORA (pendência explícita, coluna NULL — CNPJ errado é
// pior que ausente, ver runbook-cidade-nova.md):
//   - cnpj_prefeitura: conferir no PNCP/Interlegis por polo antes de ativar
//   - camara_sistema/coletor/host: identificar o fornecedor da câmara por
//     cidade (SAPL? SysSolution? nenhum?) antes de escrever coletor
//   - lat/lng: conferir na fonte oficial por polo (a API de localidades
//     não traz coordenadas)
//
// Uso (fora da CI):
//   node scripts/gerar-seeds-polos.cjs
const fs = require("fs");
const path = require("path");
const RAIZ = path.resolve(__dirname, "..");

const REGIAO_PARA_SUFIXO = {
  Norte: "norte",
  Nordeste: "nordeste",
  "Centro-Oeste": "centro-oeste",
  Sudeste: "sudeste",
  Sul: "sul",
};
const REGIAO_PARA_TITULO = {
  Norte: "Norte",
  Nordeste: "Nordeste",
  "Centro-Oeste": "Centro-Oeste",
  Sudeste: "Sudeste",
  Sul: "Sul",
};

function slugDoNome(nome) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapaJson(v) {
  // Os seeds existentes escrevem o JSON como literal de string com cast
  // explícito: `'{"nome_portal": ...}'::jsonb`.
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
}

function linhaSql(polo, municipiosPorUf) {
  const slug = slugDoNome(polo.nome);
  const fontes = {
    datasus_6dig: polo.datasus_6dig,
    estado_municipios_count: municipiosPorUf[polo.uf] ?? null,
    // Guardas de MG — fora de MG, nenhuma se aplica. Ausência é lida como
    // "tem", então o false explícito é obrigatório (ver runbook).
    paraopeba: false,
    citrolandia: false,
    links_uteis_mg: false,
    rotas_legadas: false,
  };
  return [
    "(",
    `  '${polo.id_municipio}', '${polo.nome.replace(/'/g, "''")}', '${polo.uf}', NULL, NULL, NULL,`,
    `  'controlepopular.br/${slug}',`,
    `  ${escapaJson({ nome_portal: `Controle Popular ${polo.nome}` })},`,
    `  ${escapaJson(fontes)},`,
    "  false",
    ")",
  ].join("\n");
}

const inventario = JSON.parse(fs.readFileSync(path.join(RAIZ, "apps", "web", "data", "polos-interior-ibge.json"), "utf8"));
const municipiosPorUf = inventario.municipios_por_uf ?? {};

const porRegiao = {};
for (const p of inventario.polos) {
  (porRegiao[p.regiao] ||= []).push(p);
}

const CABECALHO = (regiao, numero, qtd) => `-- Migration ${numero}: Semeia os ${qtd} polos do interior da região ${REGIAO_PARA_TITULO[regiao]}.
--
-- Códigos IBGE de 7 dígitos e datasus_6dig CONFERIDOS na API do IBGE
-- (inventário apps/web/data/polos-interior-ibge.json; ver
-- scripts/gerar-polos-interior.cjs). Nenhum código foi digitado à mão:
-- cada polo casa por nome normalizado + UF e ambíguo fica de fora.
--
-- ═══ PENDÊNCIAS EXPLÍCITAS (por polo, antes de ATIVAR) ═══
--   - cnpj_prefeitura é NULL de propósito: conferir no PNCP/Interlegis
--     por cidade (CNPJ errado é pior que ausente — faz o ETL coletar
--     contrato de outro ente em silêncio)
--   - camara_sistema/camara_coletor/camara_host: identificar o fornecedor
--     da câmara (SAPL? SysSolution? nenhum?) antes de escrever coletor
--   - lat/lng: conferir na fonte oficial por polo
--   - ativo = false até o ETL rodar pelo menos uma vez para a cidade
--     (runbook-cidade-nova.md, checklist resumido)
--
-- Fontes regionais de MG ("paraopeba", "citrolandia", "links_uteis_mg",
-- "rotas_legadas") são explicitamente desligadas (false): esta região não
-- é MG e ausência de chave é lida como "tem" (ver temFonte()).

INSERT INTO municipios (
  id_municipio, nome, uf, cnpj_prefeitura, lat, lng, dominio, branding, fontes, ativo
) VALUES
`;

const ORDEM = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
const NUMEROS = { Norte: "0083", Nordeste: "0084", "Centro-Oeste": "0085", Sudeste: "0086", Sul: "0087" };

for (const regiao of ORDEM) {
  const polos = porRegiao[regiao] ?? [];
  polos.sort((a, b) => a.id_municipio.localeCompare(b.id_municipio));
  const numero = NUMEROS[regiao];
  const sufixo = REGIAO_PARA_SUFIXO[regiao];
  const blocos = polos.map((p) => linhaSql(p, municipiosPorUf));
  const sql = [
    CABECALHO(regiao, numero, polos.length),
    blocos.join(",\n"),
    "",
    "ON CONFLICT (id_municipio) DO UPDATE SET",
    "  nome = EXCLUDED.nome,",
    "  uf = EXCLUDED.uf,",
    "  cnpj_prefeitura = EXCLUDED.cnpj_prefeitura,",
    "  lat = EXCLUDED.lat,",
    "  lng = EXCLUDED.lng,",
    "  dominio = EXCLUDED.dominio,",
    "  branding = EXCLUDED.branding,",
    "  fontes = EXCLUDED.fontes,",
    "  ativo = EXCLUDED.ativo;",
    "",
  ].join("\n");
  const caminho = path.join(RAIZ, "supabase", "betim", "migrations", `${numero}_seed_polos_${sufixo}.sql`);
  fs.writeFileSync(caminho, sql);
  console.log(`gerado ${path.basename(caminho)} (${polos.length} polos)`);
}
