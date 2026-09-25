/**
 * lib/cidades/vales-mucuri.ts
 *
 * Módulo de inteligência territorial e catálogo dos 27 municípios do Vale do Mucuri (MG).
 * Consolida dados oficiais de localidades (IBGE), contratos públicos (PNCP),
 * terras e povos indígenas (FUNAI) e recursos hídricos.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export type PoloRegionalMucuri = "Teófilo Otoni" | "Nanuque";

export interface MunicipioMucuri {
  id_ibge7: string;
  id_ibge6: string;
  nome: string;
  polo_regional: PoloRegionalMucuri;
  tem_terras_indigenas: boolean;
  povo_indigena: string | null;
  bacia_principal: string;
  tags: string[];
  link_pncp: string;
  link_transparencia: string;
}

export interface CatalogoMucuri {
  total_cidades: number;
  polo_regional: string;
  bacia_hidrografica: string;
  bioma: string;
  atualizado_em: string;
  fonte: string;
  municipios: MunicipioMucuri[];
}

export interface EstatisticasMucuri {
  totalCidades: number;
  totalIndigenas: number;
  municipiosPorPolo: Record<PoloRegionalMucuri, number>;
  povosIndigenas: string[];
  baciasPrincipais: string[];
}

/**
 * Mapeamento de compatibilidade para códigos legados ou rascunhos com dígito verificador incorreto.
 * Garante que buscas externas ou documentos antigos continuem resolvendo para a cidade oficial.
 */
const ALIAS_IBGE_LEGADO: Record<string, string> = {
  "3168608": "3168606", // Teófilo Otoni
  "3110905": "3110806", // Campanário
  "3113206": "3113008", // Caraí
  "3115607": "3115458", // Catuji
  "3132404": "3132305", // Itaipé
  "3137502": "3137007", // Ladainha
  "3138908": "3138906", // Machacalis
  "3139203": "3139201", // Malacacheta
  "3144302": "3144300", // Nanuque
  "3144906": "3144904", // Nova Módica
  "3145309": "3145307", // Novo Cruzeiro
  "3145358": "3145356", // Novo Oriente de Minas
  "3146208": "3146206", // Ouro Verde de Minas
  "3148402": "3148509", // Pavão
  "3149509": "3150000", // Pescador
  "3152909": "3152402", // Poté
  "3157700": "3157658", // Santa Helena de Minas
  "3163609": "3163300", // São José do Divino
  "3166701": "3166709", // Serra dos Aimorés
  "3170307": "3170305", // Umburatiba
};

let cacheCatalogo: CatalogoMucuri | null = null;

function resolverCaminhoJson(): string {
  const caminhos = [
    path.resolve(process.cwd(), "data", "vales-mucuri.json"),
    path.resolve(process.cwd(), "apps", "web", "data", "vales-mucuri.json"),
    path.resolve(__dirname, "..", "..", "data", "vales-mucuri.json"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) return c;
  }
  return caminhos[0];
}

/** Carrega o catálogo completo dos 27 municípios do Vale do Mucuri com cache em memória. */
export function obterCatalogoMucuri(): CatalogoMucuri {
  if (cacheCatalogo) return cacheCatalogo;

  const jsonPath = resolverCaminhoJson();
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo vales-mucuri.json não encontrado em: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  cacheCatalogo = JSON.parse(raw) as CatalogoMucuri;
  return cacheCatalogo;
}

/** Retorna a lista dos 27 municípios do Vale do Mucuri. */
export function listarMunicipiosMucuri(): MunicipioMucuri[] {
  return obterCatalogoMucuri().municipios;
}

/**
 * Localiza município pelo código IBGE (7 ou 6 dígitos), com suporte a alias legado.
 */
export function obterMunicipioMucuriPorIbge(id: string): MunicipioMucuri | undefined {
  const termo = id.trim();
  const idNormalizado = ALIAS_IBGE_LEGADO[termo] || termo;
  const municipios = listarMunicipiosMucuri();

  return municipios.find(
    (m) =>
      m.id_ibge7 === idNormalizado ||
      m.id_ibge6 === idNormalizado ||
      m.id_ibge7 === termo ||
      m.id_ibge6 === termo
  );
}

/** Retorna apenas os municípios com presença oficial de terras indígenas (ex: Povo Maxakali). */
export function listarMunicipiosIndigenas(): MunicipioMucuri[] {
  return listarMunicipiosMucuri().filter((m) => m.tem_terras_indigenas);
}

/** Retorna os municípios vinculados a determinado polo regional (Teófilo Otoni ou Nanuque). */
export function listarMunicipiosPorPolo(polo: PoloRegionalMucuri): MunicipioMucuri[] {
  return listarMunicipiosMucuri().filter((m) => m.polo_regional === polo);
}

/**
 * Busca flexível de municípios por termo de busca (nome, código IBGE, bacia ou tags).
 */
export function buscarMunicipiosMucuri(termo: string): MunicipioMucuri[] {
  const normalizado = termo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!normalizado) return listarMunicipiosMucuri();

  return listarMunicipiosMucuri().filter((m) => {
    const nomeNorm = m.nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const baciaNorm = m.bacia_principal
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const tagsNorm = m.tags.map((t) =>
      t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    return (
      nomeNorm.includes(normalizado) ||
      baciaNorm.includes(normalizado) ||
      m.id_ibge7.includes(normalizado) ||
      m.id_ibge6.includes(normalizado) ||
      tagsNorm.some((t) => t.includes(normalizado))
    );
  });
}

/** Retorna estatísticas consolidadas do território do Mucuri. */
export function obterEstatisticasMucuri(): EstatisticasMucuri {
  const cat = obterCatalogoMucuri();
  const municipios = cat.municipios;

  const porPolo: Record<PoloRegionalMucuri, number> = {
    "Teófilo Otoni": 0,
    "Nanuque": 0,
  };

  const povosSet = new Set<string>();
  const baciasSet = new Set<string>();
  let totalIndigenas = 0;

  for (const m of municipios) {
    if (m.polo_regional in porPolo) {
      porPolo[m.polo_regional]++;
    }
    if (m.tem_terras_indigenas) {
      totalIndigenas++;
    }
    if (m.povo_indigena) {
      povosSet.add(m.povo_indigena);
    }
    if (m.bacia_principal) {
      baciasSet.add(m.bacia_principal);
    }
  }

  return {
    totalCidades: municipios.length,
    totalIndigenas,
    municipiosPorPolo: porPolo,
    povosIndigenas: Array.from(povosSet),
    baciasPrincipais: Array.from(baciasSet),
  };
}
