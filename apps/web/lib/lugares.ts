/**
 * Registro central de Lugares e Territórios do Controle Popular.
 *
 * Reúne cidades, bacias fluviais, serras, vales, cerrados e terras coletivas
 * sob a frente unificada ONSA (Observatório Nacional Socioambiental).
 *
 * Cada lugar carrega obrigatoriamente as tags semânticas "natureza" e "ecossistema".
 */

export type TipoLugar =
  | "municipio"
  | "rio"
  | "serra"
  | "vale"
  | "cerrado"
  | "unidade_conservacao"
  | "territorio_quilombola"
  | "terra_indigena";

export type FrenteId =
  | "cidades"
  | "congresso"
  | "judiciario"
  | "ambiental"        // ONSA: Meio Ambiente e Territórios integrados
  | "paraopeba"
  | "executivo_estadual"
  | "terras";            // Rota histórica mantida como alias para ONSA Territórios

export type NivelConfianca = "fato_documentado" | "sinal_investigacao";

export type TagLugar = "natureza" | "ecossistema" | string;

export interface PonteEntreFrentes {
  id: string;
  frenteOrigem: FrenteId;
  rotaOrigem: string;
  frenteDestino: FrenteId;
  rotaDestino: string;
  rotuloAmigavel: string;
  topico: string;
  razaoEditorial: string;
  nivelConfianca: NivelConfianca;
  ressalva?: string;
  fonteOficial?: string;
}

export interface RegistroLugar {
  id: string;                // Slug único (ex: "serra-do-espinhaco")
  nome: string;              // Nome em português comum
  tipo: TipoLugar;
  tags: TagLugar[];          // Contém obrigatoriamente "natureza" e "ecossistema"
  biomas: string[];
  baciasHidrograficas?: string[];
  municipiosIbge: string[];  // Códigos IBGE de 7 dígitos
  unidadesConservacao?: string[];
  temMineracao: boolean;
  temQuilombo: boolean;
  resumoVozCidada: string;
  subfrenteOnsa?: "nossos-rios" | "nossas-serras" | "nossos-animais" | "nossos-territorios" | "nossa-gente";
}

/**
 * Catálogo central de lugares e territórios.
 */
export const LUGARES_CATALOGO: RegistroLugar[] = [
  {
    id: "rio-paraopeba",
    nome: "Rio Paraopeba",
    tipo: "rio",
    tags: ["natureza", "ecossistema", "bacia-rio-sao-francisco", "aguas-em-recuperacao"],
    biomas: ["Cerrado", "Mata Atlântica"],
    baciasHidrograficas: ["Bacia do Rio São Francisco"],
    municipiosIbge: ["3109006", "3106705", "3140159", "3162922", "3136652", "3152003"],
    temMineracao: true,
    temQuilombo: true,
    subfrenteOnsa: "nossos-rios",
    resumoVozCidada:
      "Afluente estratégico do São Francisco, o Paraopeba abastece a Região Metropolitana de BH e segue em processo de reparação após o rompimento da barragem da Mina Córrego do Feijão.",
  },
  {
    id: "rio-doce",
    nome: "Rio Doce",
    tipo: "rio",
    tags: ["natureza", "ecossistema", "reparacao-historica", "calha-fluvial"],
    biomas: ["Mata Atlântica"],
    baciasHidrograficas: ["Bacia do Rio Doce"],
    municipiosIbge: ["3140001", "3127701", "3131307", "3154306"],
    temMineracao: true,
    temQuilombo: true,
    subfrenteOnsa: "nossos-rios",
    resumoVozCidada:
      "Berço da bacia leste mineira, impactado pelo desastre de Mariana em 2015 e hoje centro da repactuação judicial federal na 4ª Vara de Belo Horizonte.",
  },
  {
    id: "rio-das-velhas",
    nome: "Rio das Velhas",
    tipo: "rio",
    tags: ["natureza", "ecossistema", "abastecimento-metropolitano", "aguas-vivas"],
    biomas: ["Cerrado", "Mata Atlântica"],
    baciasHidrograficas: ["Bacia do Rio São Francisco"],
    municipiosIbge: ["3146107", "3144804", "3106200", "3156700", "3120904"],
    temMineracao: true,
    temQuilombo: false,
    subfrenteOnsa: "nossos-rios",
    resumoVozCidada:
      "Maior afluente do Rio São Francisco em Minas Gerais, responsável pela captação do Sistema Bela Fama que atende parcela substancial de Belo Horizonte e região.",
  },
  {
    id: "rio-jequitinhonha",
    nome: "Rio Jequitinhonha",
    tipo: "rio",
    tags: ["natureza", "ecossistema", "semiarido", "patrimonio-vivo"],
    biomas: ["Cerrado", "Caatinga", "Mata Atlântica"],
    baciasHidrograficas: ["Bacia do Rio Jequitinhonha"],
    municipiosIbge: ["3121605", "3134004", "3103405", "3119500"],
    temMineracao: true,
    temQuilombo: true,
    subfrenteOnsa: "nossos-rios",
    resumoVozCidada:
      "Rio de vida e resistência do semiárido, cuja bacia abriga a cultura da cerâmica e enfrenta hoje a corrida minerária da exploração de lítio.",
  },
  {
    id: "serra-do-espinhaco",
    nome: "Serra do Espinhaço",
    tipo: "serra",
    tags: ["natureza", "ecossistema", "reserva-da-biosfera", "divisor-de-aguas", "campo-rupestre"],
    biomas: ["Cerrado", "Mata Atlântica"],
    baciasHidrograficas: ["Bacia do Rio São Francisco", "Bacia do Rio Doce", "Bacia do Rio Jequitinhonha"],
    municipiosIbge: ["3121605", "3167103", "3117504", "3115300"],
    unidadesConservacao: [
      "Parque Estadual do Biribiri",
      "Parque Nacional da Serra do Cipó",
      "Parque Estadual do Itacolomi",
    ],
    temMineracao: true,
    temQuilombo: true,
    subfrenteOnsa: "nossas-serras",
    resumoVozCidada:
      "Única cordilheira do Brasil, Reserva da Biosfera da UNESCO e divisor de águas entre o São Francisco, o Rio Doce e o Jequitinhonha.",
  },
  {
    id: "serra-do-cipo",
    nome: "Serra do Cipó",
    tipo: "serra",
    tags: ["natureza", "ecossistema", "parque-nacional", "biodiversidade-rupestre"],
    biomas: ["Cerrado"],
    baciasHidrograficas: ["Bacia do Rio São Francisco", "Bacia do Rio Doce"],
    municipiosIbge: ["3157807", "3134608", "3143807"],
    unidadesConservacao: ["Parque Nacional da Serra do Cipó", "APA Morro da Pedreira"],
    temMineracao: false,
    temQuilombo: true,
    subfrenteOnsa: "nossas-serras",
    resumoVozCidada:
      "Portal sul do Espinhaço, santuário ecológico de campos rupestres, cachoeiras e polo de ecoturismo e conservação botânica.",
  },
  {
    id: "serra-da-piedade",
    nome: "Serra da Piedade",
    tipo: "serra",
    tags: ["natureza", "ecossistema", "patrimonio-cultural-religioso", "monumento-natural"],
    biomas: ["Mata Atlântica", "Cerrado"],
    baciasHidrograficas: ["Bacia do Rio São Francisco", "Bacia do Rio das Velhas"],
    municipiosIbge: ["3109907", "3156700"],
    unidadesConservacao: ["Monumento Natural Estadual da Serra da Piedade"],
    temMineracao: true,
    temQuilombo: false,
    subfrenteOnsa: "nossas-serras",
    resumoVozCidada:
      "Pico histórico e sagrado na transição do Quadrilátero Ferrífero, tombado pelo IPHAN e IEPHA, com contínuos litígios sobre mineração em seu entorno.",
  },
  {
    id: "vale-do-jequitinhonha",
    nome: "Vale do Jequitinhonha",
    tipo: "vale",
    tags: ["natureza", "ecossistema", "cultura-e-resistencia", "semiarido-vivo"],
    biomas: ["Cerrado", "Caatinga"],
    baciasHidrograficas: ["Bacia do Rio Jequitinhonha"],
    municipiosIbge: ["3103405", "3134004", "3141801", "3150007"],
    temMineracao: true,
    temQuilombo: true,
    subfrenteOnsa: "nossos-territorios",
    resumoVozCidada:
      "Território de saberes tradicionais, ceramistas de renome internacional e comunidades quilombolas, sob forte transformação econômica decorrente do Polo do Lítio.",
  },
  {
    id: "cerrado",
    nome: "Cerrado Mineiro",
    tipo: "cerrado",
    tags: ["natureza", "ecossistema", "berco-das-aguas", "savana-biodiversa"],
    biomas: ["Cerrado"],
    municipiosIbge: ["3135209", "3143302", "3110004", "3120904"],
    temMineracao: true,
    temQuilombo: true,
    subfrenteOnsa: "nossos-territorios",
    resumoVozCidada:
      "Segundo maior bioma da América do Sul e berço das três maiores bacias hidrográficas do país, ameaçado por desmatamentos e supressão de vegetação nativa.",
  },
];

/**
 * Retorna um lugar pelo seu identificador único.
 */
export function obterLugar(id: string): RegistroLugar | undefined {
  return LUGARES_CATALOGO.find((l) => l.id === id);
}

/**
 * Lista os lugares registrados, filtrando opcionalmente por tipo.
 */
export function listarLugares(tipo?: TipoLugar): RegistroLugar[] {
  if (!tipo) return LUGARES_CATALOGO;
  return LUGARES_CATALOGO.filter((l) => l.tipo === tipo);
}

/**
 * Retorna lugares que têm relação geográfica direta com um código IBGE municipal.
 */
export function lugaresPorMunicipioIbge(codigoIbge: string): RegistroLugar[] {
  return LUGARES_CATALOGO.filter((l) => l.municipiosIbge.includes(codigoIbge));
}
