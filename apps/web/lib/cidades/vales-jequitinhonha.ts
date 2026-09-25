/**
 * lib/cidades/vales-jequitinhonha.ts
 *
 * Módulo de inteligência territorial e catálogo dos 55 municípios do Vale do Jequitinhonha (MG).
 * Consolida dados oficiais de localidades (IBGE), contratos públicos (PNCP),
 * minerais críticos (Lítio / ANM), comunidades tradicionais (Quilombolas, Geraizeiros, Vazanteiros)
 * e recursos hídricos da bacia hidrográfica do Rio Jequitinhonha.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export type SubRegiaoJequitinhonha =
  | "Alto Jequitinhonha"
  | "Médio Jequitinhonha"
  | "Baixo Jequitinhonha";

export interface MunicipioJequitinhonha {
  id_ibge7: string;
  id_ibge6: string;
  nome: string;
  sub_regiao: SubRegiaoJequitinhonha;
  polo_regional: string;
  tem_litio: boolean;
  tem_comunidades_tradicionais: boolean;
  tipo_comunidade: string[];
  bacia_principal: string;
  tags: string[];
  link_pncp: string;
  link_transparencia: string;
}

export interface CatalogoJequitinhonha {
  total_cidades: number;
  sub_regioes: SubRegiaoJequitinhonha[];
  populacao_total_estimada: number;
  bioma_predominante: string;
  bacia_hidrografica: string;
  atualizado_em: string;
  fonte: string;
  municipios: MunicipioJequitinhonha[];
}

export interface EstatisticasJequitinhonha {
  totalCidades: number;
  totalLitio: number;
  totalTradicionais: number;
  populacaoTotal: number;
  municipiosPorSubregiao: Record<SubRegiaoJequitinhonha, number>;
  tiposComunidades: string[];
  baciasPrincipais: string[];
  polosRegionais: string[];
}

/**
 * Mapeamento de compatibilidade para códigos legados ou rascunhos com dígito verificador incorreto.
 * Garante que buscas externas ou documentos antigos resolvam para o município oficial correspondente.
 */
const ALIAS_IBGE_LEGADO: Record<string, string> = {
  // Alto Jequitinhonha
  "3153303": "3153301", // Presidente Kubitschek
  "3162577": "3125507", // São Gonçalo do Rio Preto
  "3166107": "3165909", // Senador Modestino Gonçalves
  "3113107": "3113503", // Carbonita
  "3171156": "3171071", // Veredinha

  // Médio Jequitinhonha
  "3115904": "3116100", // Chapada do Norte
  "3134905": "3135456", // Jenipapo de Minas
  "3135357": "3136520", // José Gonçalves de Minas
  "3141407": "3141405", // Medina
  "3152131": "3152170", // Ponto dos Volantes
  "3171602": "3171600", // Virgem da Lapa
  "3141803": "3141801", // Minas Novas
  "3169705": "3169703", // Turmalina
  "3138353": "3138351", // Leme do Prado
  "3148709": "3148707", // Pedra Azul
  "3109808": "3102704", // Cachoeira de Pajeú
  "3117207": "3117009", // Comercinho

  // Baixo Jequitinhonha
  "3105301": "3105202", // Bandeira
  "3125507_BAIXO": "3125606", // Felisburgo
  "3134509": "3134707", // Jacinto
  "3136405": "3136504", // Jordânia
  "3140854": "3140555", // Mata Verde
  "3143155": "3143153", // Monte Formoso
  "3146703": "3146750", // Palmópolis
  "3155100": "3155108", // Rio do Prado
  "3156801": "3156601", // Rubim
  "3157106": "3157104", // Salto da Divisa
  "3158104": "3158102", // Santa Maria do Salto
  "3159003": "3160306", // Santo Antônio do Jacinto
};

let cacheCatalogo: CatalogoJequitinhonha | null = null;

function resolverCaminhoJson(): string {
  const caminhos = [
    path.resolve(process.cwd(), "data", "vales-jequitinhonha.json"),
    path.resolve(process.cwd(), "apps", "web", "data", "vales-jequitinhonha.json"),
    path.resolve(__dirname, "..", "..", "data", "vales-jequitinhonha.json"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) return c;
  }
  return caminhos[0];
}

/** Carrega o catálogo completo dos 55 municípios do Vale do Jequitinhonha com cache em memória. */
export function obterCatalogoJequitinhonha(): CatalogoJequitinhonha {
  if (cacheCatalogo) return cacheCatalogo;

  const jsonPath = resolverCaminhoJson();
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo vales-jequitinhonha.json não encontrado em: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  cacheCatalogo = JSON.parse(raw) as CatalogoJequitinhonha;
  return cacheCatalogo;
}

/** Retorna a lista dos 55 municípios do Vale do Jequitinhonha. */
export function listarMunicipiosJequitinhonha(): MunicipioJequitinhonha[] {
  return obterCatalogoJequitinhonha().municipios;
}

/**
 * Localiza município pelo código IBGE (7 ou 6 dígitos), com suporte a alias legado.
 */
export function obterMunicipioJequitinhonhaPorIbge(id: string): MunicipioJequitinhonha | undefined {
  const termo = id.trim();
  const idNormalizado = ALIAS_IBGE_LEGADO[termo] || termo;
  const municipios = listarMunicipiosJequitinhonha();

  return municipios.find(
    (m) =>
      m.id_ibge7 === idNormalizado ||
      m.id_ibge6 === idNormalizado ||
      m.id_ibge7 === termo ||
      m.id_ibge6 === termo
  );
}

/** Retorna os municípios produtores ou com reservas de lítio (Polo do Lítio / Vale do Lítio). */
export function listarMunicipiosLitio(): MunicipioJequitinhonha[] {
  return listarMunicipiosJequitinhonha().filter((m) => m.tem_litio);
}

/** Retorna os municípios com presença reconhecida de comunidades tradicionais (quilombolas, geraizeiros, vazanteiros). */
export function listarMunicipiosTradicionais(): MunicipioJequitinhonha[] {
  return listarMunicipiosJequitinhonha().filter((m) => m.tem_comunidades_tradicionais);
}

/** Retorna os municípios de determinada sub-região (Alto, Médio ou Baixo Jequitinhonha). */
export function listarPorSubregiao(subregiao: SubRegiaoJequitinhonha): MunicipioJequitinhonha[] {
  return listarMunicipiosJequitinhonha().filter((m) => m.sub_regiao === subregiao);
}

/**
 * Busca flexível de municípios por termo de busca (nome, código IBGE, bacia, tags ou comunidades).
 */
export function buscarMunicipiosJequitinhonha(termo: string): MunicipioJequitinhonha[] {
  const normalizado = termo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!normalizado) return listarMunicipiosJequitinhonha();

  return listarMunicipiosJequitinhonha().filter((m) => {
    const nomeNorm = m.nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const baciaNorm = m.bacia_principal
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const subNorm = m.sub_regiao
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const tagsNorm = m.tags.map((t) =>
      t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    const comNorm = m.tipo_comunidade.map((c) =>
      c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    return (
      nomeNorm.includes(normalizado) ||
      baciaNorm.includes(normalizado) ||
      subNorm.includes(normalizado) ||
      m.id_ibge7.includes(normalizado) ||
      m.id_ibge6.includes(normalizado) ||
      tagsNorm.some((t) => t.includes(normalizado)) ||
      comNorm.some((c) => c.includes(normalizado))
    );
  });
}

/** Retorna estatísticas consolidadas do território do Vale do Jequitinhonha. */
export function obterEstatisticasJequitinhonha(): EstatisticasJequitinhonha {
  const cat = obterCatalogoJequitinhonha();
  const municipios = cat.municipios;

  const porSub: Record<SubRegiaoJequitinhonha, number> = {
    "Alto Jequitinhonha": 0,
    "Médio Jequitinhonha": 0,
    "Baixo Jequitinhonha": 0,
  };

  const tiposSet = new Set<string>();
  const baciasSet = new Set<string>();
  const polosSet = new Set<string>();
  let totalLitio = 0;
  let totalTradicionais = 0;

  for (const m of municipios) {
    if (m.sub_regiao in porSub) {
      porSub[m.sub_regiao]++;
    }
    if (m.tem_litio) {
      totalLitio++;
    }
    if (m.tem_comunidades_tradicionais) {
      totalTradicionais++;
    }
    for (const tipo of m.tipo_comunidade) {
      tiposSet.add(tipo);
    }
    if (m.bacia_principal) {
      baciasSet.add(m.bacia_principal);
    }
    if (m.polo_regional) {
      polosSet.add(m.polo_regional);
    }
  }

  return {
    totalCidades: municipios.length,
    totalLitio,
    totalTradicionais,
    populacaoTotal: cat.populacao_total_estimada,
    municipiosPorSubregiao: porSub,
    tiposComunidades: Array.from(tiposSet).sort(),
    baciasPrincipais: Array.from(baciasSet).sort(),
    polosRegionais: Array.from(polosSet).sort(),
  };
}
