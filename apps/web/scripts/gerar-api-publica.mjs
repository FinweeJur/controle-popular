/**
 * gerar-api-publica.mjs — emite a API pública estática do portal em
 * `public/api/v1/`, a partir dos acervos que o portal JÁ publica.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE ═══
 *
 * O portal sempre serviu dado aberto — `public/data/*.json` é buscado pelo
 * próprio front — mas sem contrato, catálogo ou documentação. Este gerador
 * transforma esses acervos numa API de verdade, no modelo do
 * foco-cidadao.com.br/docs: spec OpenAPI em rota fixa, endpoint de status que
 * lista os endpoints, leitura sem chave. Tudo ESTÁTICO: funciona nos dois
 * alvos de build (Worker e export) e o cache é da CDN, sem custo de runtime.
 *
 * ═══ A RESSALVA VIAJA NO CONTRATO ═══
 *
 * Cada dataset do manifesto carrega `fonte`, `medido_em` e `ressalvas`. Quando
 * o bundle de origem já declara esses campos (os agregados SIRENEJud
 * declaram), o manifesto puxa de lá; quando não declara, a ressalva fica
 * escrita aqui — número sem ressalva não entra na API, pelo mesmo motivo que
 * não entra na tela.
 *
 * ═══ O QUE FICA DE FORA, DE PROPÓSITO ═══
 *
 * - DataJud: a licença do CNJ (cláusulas 3.8/3.9) veda distribuir derivado —
 *   ver docs/06-fontes/FONTES.md. A consulta ao vivo em /api/datajud é
 *   backend de UI, não API pública.
 * - Clippings (clipping-*.json): mudam todo dia; API versionada com dado
 *   efêmero promete estabilidade que não existe.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync,
         writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const WEB = join(AQUI, "..");
const PUBLIC_DATA = join(WEB, "public", "data");
const REPO = join(WEB, "..", "..");
const ETL_DADOS = join(REPO, "etl", "betim", "dados");
const GLOBO_DADOS = join(WEB, "public", "terras", "globo", "dados");
const SAIDA = join(WEB, "public", "api", "v1");

/** Catálogo v1. `arquivo` é relativo a public/data/, salvo `origem` absoluta. */
const DATASETS = [
  {
    id: "comarcas-mg",
    arquivo: "comarcas-mg.json",
    titulo: "Comarcas de Minas Gerais",
    descricao: "Comarcas e unidades judiciárias de MG, com código IBGE do município-sede.",
    fonte: "TJMG / Defensoria Pública de MG",
    url_fonte: "https://www.tjmg.jus.br/",
    ressalvas: ["cobertura limitada a Minas Gerais"],
  },
  {
    id: "estabelecimentos-prisionais-mg",
    arquivo: "estabelecimentos-mg.json",
    titulo: "Estabelecimentos prisionais de MG (CNIEP)",
    descricao: "Unidades prisionais de MG com inspeções do CNJ/CNIEP.",
    fonte: "CNIEP / Geopresídios — CNJ",
    url_fonte: "https://cniep.cnj.jus.br/",
    ressalvas: ["cobertura limitada a Minas Gerais"],
  },
  {
    id: "decisoes-cge-mg",
    arquivo: "decisoes-cge.json",
    titulo: "Decisões de recurso de LAI da CGE-MG",
    descricao: "Decisões de recursos de acesso à informação em MG, 2020–2026.",
    fonte: "Controladoria-Geral do Estado de MG",
    url_fonte: "https://www.mg.gov.br/cge",
    ressalvas: ["coleta por sondagem — o portal de origem não tem API de listagem"],
  },
  {
    id: "convenios-ambientais-mg",
    arquivo: "convenios-ambientais-mg.json",
    titulo: "Convênios ambientais com municípios de MG",
    descricao: "Convênios estaduais (CGE) e federais (Transferegov) com recorte ambiental.",
    fonte: "dados.mg.gov.br (CGE) + Transferegov/dETRU (repositorio.dados.gov.br)",
    url_fonte: "https://dados.mg.gov.br/dataset/convenios-saida",
    ressalvas: ["a união estadual+federal segue critérios diferentes em cada fonte"],
  },
  {
    id: "repasse-brumadinho-mg",
    arquivo: "repasse-brumadinho-mg.json",
    titulo: "Repasse do acordo de Brumadinho por município de MG",
    descricao: "Valores do acordo judicial distribuídos aos 853 municípios.",
    fonte: "Acordo judicial de reparação de Brumadinho (TJMG)",
    url_fonte: "https://brumadinho.tjmg.jus.br/",
    ressalvas: [
      "827 das 853 cidades de MG não têm relação com a bacia do Paraopeba: receber o repasse NÃO significa ter sido atingida pelo rompimento",
    ],
  },
  {
    id: "biblioteca-ati",
    arquivo: "biblioteca-ati.json",
    titulo: "Biblioteca das ATIs do Paraopeba",
    descricao: "Metadados e links das publicações das Assessorias Técnicas Independentes.",
    fonte: "AEDAS, Guaicuy, ADAI (sites oficiais)",
    url_fonte: "https://aedas.org.br/",
    ressalvas: ["só metadado e link — nenhuma fonte declara licença de reprodução"],
  },
  {
    id: "tac-projetos",
    arquivo: "tac-projetos.json",
    titulo: "TACs ambientais de MG",
    descricao: "Termos de Ajustamento de Conduta do GTAC/Semad-MG.",
    fonte: "GTAC — Semad-MG (EcoSistemas)",
    url_fonte: "https://ecosistemas.meioambiente.mg.gov.br/gtac/",
    ressalvas: [],
  },
  {
    id: "documentos-paraopeba",
    arquivo: "documentos-paraopeba.json",
    titulo: "Documentos do processo de Brumadinho por município",
    descricao: "Catálogo de documentos do processo judicial, agregado por município.",
    fonte: "TJMG — processo do rompimento da barragem de Brumadinho",
    url_fonte: "https://brumadinho.tjmg.jus.br/",
    ressalvas: ["conta de documentos, nunca o teor — o texto fica na fonte"],
  },
  {
    id: "municipios-mg-comunicabr",
    arquivo: "comunicabr-31.json",
    titulo: "Diários oficiais dos 853 municípios de MG (ComunicaBR)",
    descricao: "Índice de publicações de diário oficial por município, formato compactado.",
    fonte: "ComunicaBR / IBGE",
    url_fonte: "https://comunicabr.org/",
    ressalvas: [
      "formato compactado (esqueleto + rótulos internados) — ver apps/web/lib/comunicabr/arquivo.ts",
    ],
  },
  {
    id: "risco-climatico-mg",
    arquivo: "risco-climatico.json",
    titulo: "Risco climático por município de MG",
    descricao: "Indicadores de risco climático municipal.",
    fonte: "AdaptaBrasil / INMET",
    url_fonte: "https://adaptabrasil.mcti.gov.br/",
    ressalvas: [],
  },
  {
    id: "resumo-auditoria-ajri",
    arquivo: "resumo-ajri.json",
    titulo: "Resumo da auditoria AJRI (Brumadinho)",
    descricao: "Catálogo dos 467 documentos da auditoria independente do rompimento.",
    fonte: "Auditoria AJRI (AECOM) — portal Rails",
    url_fonte: "https://auditoriabr.adai.ong.br/",
    ressalvas: [
      "catálogo e link apenas: os PDFs da fonte levam marca-d'água com CPF do solicitante e não são republicados",
    ],
  },
  {
    id: "sirenejud-mg",
    origem: join(ETL_DADOS, "sirenejud-mg.json"),
    titulo: "Processos ambientais do Judiciário — MG (SIRENEJud)",
    descricao: "Agregado por município de MG: contagens, situação e tempo de tramitação.",
    fonte: "SIRENEJud — CNJ/CNMP (Res. Conjunta 8/2021)",
    url_fonte: "https://sirenejud.cnj.jus.br/home",
    ressalvas: [], // puxadas do próprio bundle quando presente
  },
  {
    id: "sirenejud-brasil",
    origem: join(ETL_DADOS, "sirenejud-brasil.json"),
    titulo: "Processos ambientais do Judiciário — Brasil (SIRENEJud)",
    descricao: "Agregado nacional por UF e tribunal.",
    fonte: "SIRENEJud — CNJ/CNMP (Res. Conjunta 8/2021)",
    url_fonte: "https://sirenejud.cnj.jus.br/home",
    ressalvas: [],
  },
  {
    id: "globo-proveniencia",
    origem: join(GLOBO_DADOS, "proveniencia.json"),
    titulo: "Proveniência das camadas do globo 3D",
    descricao: "Manifesto 'de onde vem o dado' de cada camada do mapa (sha256, feições, origem).",
    fonte: "Controle Popular — pipeline do globo",
    url_fonte: "https://controlepopular.com.br/funcaosocialterra/mapa",
    ressalvas: [],
  },
];

function lerJson(caminho) {
  try {
    return JSON.parse(readFileSync(caminho, "utf8"));
  } catch {
    return null;
  }
}

function contarRegistros(json) {
  if (Array.isArray(json)) return json.length;
  if (json && typeof json === "object") {
    for (const chave of ["linhas", "municipios", "itens", "registros",
                         "dados", "documentos", "features"]) {
      if (Array.isArray(json[chave])) return json[chave].length;
    }
  }
  return null;
}

function main() {
  mkdirSync(join(SAIDA, "datasets"), { recursive: true });
  const entradas = [];
  const ausentes = [];

  for (const ds of DATASETS) {
    const origem = ds.origem ?? join(PUBLIC_DATA, ds.arquivo);
    if (!existsSync(origem)) {
      // Fonte opcional ainda não gerada (ex.: agregado do SIRENEJud antes da
      // primeira coleta): pula com aviso em vez de quebrar o prebuild.
      ausentes.push(ds.id);
      continue;
    }
    const destino = join(SAIDA, "datasets", `${ds.id}.json`);
    copyFileSync(origem, destino);
    const json = lerJson(origem);
    entradas.push({
      id: ds.id,
      titulo: ds.titulo,
      descricao: ds.descricao,
      fonte: ds.fonte,
      url_fonte: ds.url_fonte,
      endpoint: `/api/v1/datasets/${ds.id}.json`,
      bytes: statSync(destino).size,
      registros: contarRegistros(json),
      medido_em: json?.medido_em ?? json?.gerado_em ?? null,
      ressalvas: (Array.isArray(json?.ressalvas) && json.ressalvas.length
        ? json.ressalvas
        : ds.ressalvas),
    });
  }

  const geradoEm = new Date().toISOString();
  const manifesto = {
    versao: "v1",
    gerado_em: geradoEm,
    portal: "Controle Popular — https://controlepopular.com.br",
    documentacao: "/api",
    spec_openapi: "/api/openapi.yaml",
    licenca_codigo: "AGPL-3.0-or-later",
    datasets: entradas,
  };
  writeFileSync(join(SAIDA, "manifesto.json"),
                JSON.stringify(manifesto, null, 2));

  const status = {
    status: "ok",
    versao: "v1",
    gerado_em: geradoEm,
    endpoints: ["/api/v1/manifesto.json", "/api/v1/status.json",
                ...entradas.map((e) => e.endpoint)],
  };
  writeFileSync(join(SAIDA, "status.json"), JSON.stringify(status, null, 2));

  console.log(`api v1: ${entradas.length} datasets emitidos` +
    (ausentes.length ? `; ausentes (pulados): ${ausentes.join(", ")}` : ""));
}

main();
