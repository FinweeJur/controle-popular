// Conferência dos polos do interior contra o catálogo IBGE, e geração do
// inventário versionado em apps/web/data/polos-interior-ibge.json.
//
// O catálogo vem da API oficial (servicodados.ibge.gov.br) — é a conferência
// "ao vivo" que o runbook exige: código IBGE nunca digitado à mão, casa por
// NOME NORMALIZADO + UF, e todo polo ambíguo ou não encontrado fica de fora
// do inventário e é reportado. Código errado entraria sem erro e o ETL
// popularia outra cidade em silêncio.
//
// Uso (fora da CI, com rede):
//   node scripts/gerar-polos-interior.cjs
//   node scripts/gerar-inventario-polos.cjs
const fs = require("fs");
const path = require("path");
const RAIZ = path.resolve(__dirname, "..");

const CATALOGO_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios";

const POLOS_POR_REGIAO = {
  norte: [
    ["Santarém", "PA"], ["Marabá", "PA"], ["Parintins", "AM"], ["Ji-Paraná", "RO"],
    ["Araguaína", "TO"], ["Cruzeiro do Sul", "AC"], ["Santana", "AP"],
    ["Ananindeua", "PA"], ["Castanhal", "PA"], ["Itaituba", "PA"], ["Altamira", "PA"],
    ["Tucuruí", "PA"], ["Paragominas", "PA"], ["Cametá", "PA"], ["Abaetetuba", "PA"],
    ["Redenção", "PA"], ["Manacapuru", "AM"], ["Itacoatiara", "AM"], ["Tefé", "AM"],
    ["Cacoal", "RO"], ["Vilhena", "RO"], ["Gurupi", "TO"],
  ],
  nordeste: [
    ["Feira de Santana", "BA"], ["Vitória da Conquista", "BA"], ["Campina Grande", "PB"],
    ["Caruaru", "PE"], ["Petrolina", "PE"], ["Mossoró", "RN"], ["Arapiraca", "AL"],
    ["Parnaíba", "PI"], ["Imperatriz", "MA"], ["Itabaiana", "SE"], ["Juazeiro", "BA"],
    ["Barreiras", "BA"], ["Alagoinhas", "BA"], ["Ilhéus", "BA"], ["Itabuna", "BA"],
    ["Jequié", "BA"], ["Camaçari", "BA"], ["Lauro de Freitas", "BA"], ["Paulo Afonso", "BA"],
    ["Juazeiro do Norte", "CE"], ["Sobral", "CE"], ["Crato", "CE"], ["Iguatu", "CE"],
    ["Quixadá", "CE"], ["Crateús", "CE"], ["Cajazeiras", "PB"], ["Patos", "PB"],
    ["Sousa", "PB"], ["Guarabira", "PB"], ["Garanhuns", "PE"], ["Vitória de Santo Antão", "PE"],
    ["Serra Talhada", "PE"], ["Araripina", "PE"], ["Ouricuri", "PE"], ["Pesqueira", "PE"],
    ["Caicó", "RN"], ["Pau dos Ferros", "RN"], ["Currais Novos", "RN"], ["Ceará-Mirim", "RN"],
    ["Macaíba", "RN"], ["Coruripe", "AL"], ["Palmeira dos Índios", "AL"], ["União dos Palmares", "AL"],
    ["Floriano", "PI"], ["Picos", "PI"],
  ],
  "centro-oeste": [
    ["Anápolis", "GO"], ["Rio Verde", "GO"], ["Rondonópolis", "MT"], ["Sinop", "MT"],
    ["Dourados", "MS"], ["Três Lagoas", "MS"], ["Corumbá", "MS"], ["Aparecida de Goiânia", "GO"],
    ["Catalão", "GO"], ["Itumbiara", "GO"], ["Jataí", "GO"], ["Luziânia", "GO"],
    ["Águas Lindas de Goiás", "GO"], ["Valparaíso de Goiás", "GO"], ["Formosa", "GO"],
    ["Várzea Grande", "MT"], ["Cáceres", "MT"], ["Tangará da Serra", "MT"], ["Lucas do Rio Verde", "MT"],
    ["Mineiros", "GO"],
  ],
  sudeste: [
    ["Campinas", "SP"], ["Ribeirão Preto", "SP"], ["Santos", "SP"], ["São José dos Campos", "SP"],
    ["Uberlândia", "MG"], ["Juiz de Fora", "MG"], ["Niterói", "RJ"], ["Campos dos Goytacazes", "RJ"],
    ["Volta Redonda", "RJ"], ["Serra", "ES"], ["Linhares", "ES"], ["Sorocaba", "SP"],
    ["Jundiaí", "SP"], ["Bauru", "SP"], ["Presidente Prudente", "SP"], ["Marília", "SP"],
    ["Araraquara", "SP"], ["São José do Rio Preto", "SP"], ["Franca", "SP"], ["Limeira", "SP"],
    ["Piracicaba", "SP"], ["Taubaté", "SP"], ["Guarulhos", "SP"], ["Osasco", "SP"],
    ["Santo André", "SP"], ["São Bernardo do Campo", "SP"], ["São Caetano do Sul", "SP"],
    ["Diadema", "SP"], ["Mauá", "SP"], ["Carapicuíba", "SP"], ["Uberaba", "MG"],
    ["Contagem", "MG"], ["Montes Claros", "MG"], ["Governador Valadares", "MG"],
    ["Divinópolis", "MG"], ["Ipatinga", "MG"], ["Sete Lagoas", "MG"], ["Poços de Caldas", "MG"],
    ["Varginha", "MG"], ["Patos de Minas", "MG"], ["Pouso Alegre", "MG"], ["Barbacena", "MG"],
    ["Teófilo Otoni", "MG"], ["Passos", "MG"], ["Araxá", "MG"], ["Nova Friburgo", "RJ"],
    ["Petrópolis", "RJ"], ["Macaé", "RJ"], ["Duque de Caxias", "RJ"], ["São Gonçalo", "RJ"],
  ],
  sul: [
    ["Londrina", "PR"], ["Maringá", "PR"], ["Ponta Grossa", "PR"], ["Cascavel", "PR"],
    ["Joinville", "SC"], ["Blumenau", "SC"], ["Itajaí", "SC"], ["Chapecó", "SC"],
    ["Caxias do Sul", "RS"], ["Pelotas", "RS"], ["Santa Maria", "RS"], ["Passo Fundo", "RS"],
    ["Foz do Iguaçu", "PR"], ["Guarapuava", "PR"], ["Umuarama", "PR"], ["Paranavaí", "PR"],
    ["Apucarana", "PR"], ["Toledo", "PR"], ["Campo Mourão", "PR"], ["São José dos Pinhais", "PR"],
    ["Araucária", "PR"], ["São José", "SC"], ["Criciúma", "SC"], ["Lages", "SC"],
    ["Jaraguá do Sul", "SC"], ["Balneário Camboriú", "SC"], ["Brusque", "SC"], ["Tubarão", "SC"],
    ["Canoas", "RS"], ["Novo Hamburgo", "RS"], ["São Leopoldo", "RS"], ["Rio Grande", "RS"],
    ["Santa Cruz do Sul", "RS"], ["Erechim", "RS"], ["Palhoça", "SC"],
  ],
};

const NOME_REGIAO = { norte: "Norte", nordeste: "Nordeste", "centro-oeste": "Centro-Oeste", sudeste: "Sudeste", sul: "Sul" };

function norm(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

async function baixarCatalogo() {
  const res = await fetch(CATALOGO_URL, {
    headers: { "User-Agent": "controlepopular-br/1.0 (coleta de referencia; contato via repositorio)" },
  });
  if (!res.ok) throw new Error(`IBGE respondeu ${res.status}`);
  return res.json();
}

async function main() {
  const catalogo = await baixarCatalogo();
  const porUf = new Map();
  for (const m of catalogo) {
    const uf = m.microrregiao?.mesorregiao?.UF?.sigla;
    if (!uf) continue;
    if (!porUf.has(uf)) porUf.set(uf, []);
    porUf.get(uf).push({ id: String(m.id).padStart(7, "0"), nome: m.nome });
  }

  const ORDEM = ["norte", "nordeste", "centro-oeste", "sudeste", "sul"];
  let total = 0, sem = [], amb = [];
  const res = {};
  for (const r of ORDEM) {
    const linhas = [];
    for (const [nome, uf] of POLOS_POR_REGIAO[r]) {
      const alvo = norm(nome);
      const cand = (porUf.get(uf) || []).filter((c) => norm(c.nome) === alvo);
      if (cand.length === 0) { sem.push(`${nome}/${uf}`); continue; }
      if (cand.length > 1) { amb.push(`${nome}/${uf}->${cand.map((c) => c.id).join(",")}`); continue; }
      linhas.push({ nome: cand[0].nome, uf, id: cand[0].id });
      total++;
    }
    res[r] = linhas;
  }

  console.log("=== RESUMO DA CONFERENCIA (IBGE) ===");
  ORDEM.forEach((r) => console.log(`${r.padEnd(14)}: ${res[r].length} polos casados`));
  console.log(`\nTotal casados: ${total}`);
  console.log(`Sem casamento (${sem.length}): ${sem.join(" | ")}`);
  console.log(`Ambiguos (${amb.length}): ${amb.join(" | ")}`);

  // Inventário versionado
  const out = [];
  for (const [k, v] of Object.entries(res)) {
    for (const p of v) out.push({ id_municipio: p.id, nome: p.nome, uf: p.uf, regiao: NOME_REGIAO[k], datasus_6dig: p.id.slice(0, 6) });
  }
  out.sort((a, b) => a.id_municipio.localeCompare(b.id_municipio));
  const porRegiao = {};
  for (const o of out) porRegiao[o.regiao] = (porRegiao[o.regiao] || 0) + 1;

  // Contagem de municípios por UF (do mesmo catálogo conferido) — alimenta
  // `fontes.estado_municipios_count` no seed, como nos seeds existentes.
  const municipiosPorUf = {};
  for (const m of catalogo) {
    const uf = m.microrregiao?.mesorregiao?.UF?.sigla;
    if (!uf) continue;
    municipiosPorUf[uf] = (municipiosPorUf[uf] || 0) + 1;
  }
  const payload = {
    gerado_em: "2026-08-31",
    fonte: "API IBGE /localidades/municipios (5571 municipios)",
    conferencia: "casa por nome normalizado + UF; ambiguidade ou ausencia = fora do inventario e reportado",
    total: out.length,
    por_regiao: porRegiao,
    municipios_por_uf: municipiosPorUf,
    polos: out,
  };
  fs.writeFileSync(path.join(RAIZ, "apps", "web", "data", "polos-interior-ibge.json"), JSON.stringify(payload, null, 2));
  console.log(`\nInventario salvo: apps/web/data/polos-interior-ibge.json (${out.length} polos)`);
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
