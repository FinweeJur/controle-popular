/**
 * @file apps/web/lib/direitos-globais/tipos-comuns.ts
 * @description Tipos de dados comuns e contratos para comparação internacional (África, Ásia e ONU).
 */

import type { TipoDireito } from "./tipos";

export type Status = "ratificado" | "assinado" | "nao" | "desconhecido";
export type StatusRecomendacao = "aceita" | "notada" | "parcial" | "cumprido" | "desconhecido" | Status;
export type Cumprimento = "cumprido" | "parcial" | "descumprido" | "desconhecido";

export interface Pais {
  nome: string;
  codigo: string; // ISO 3166-1 alpha-2 ou alpha-3
  regiao: string;
  subRegiao?: string;
  capital?: string;
  populacao?: number;
  notaTranscontinental?: string;
}

export interface Ratificacao {
  tratado: string;
  status: Status;
  ano: number | null;
  reservas?: string;
  fonte: string;
  url: string;
  dataAcesso: string;
}

export interface Caso {
  tribunal: string;
  numero: string;
  partes: string;
  data: string; // Formato YYYY-MM-DD
  artigos: string[];
  reparacoes: string[];
  cumprimento: Cumprimento;
  url: string;
  sha256?: string;
  resumoOficial?: string;
}

export interface Recomendacao {
  orgao: string; // ex: "UPR", "CEDAW", "CCPR", "ACHPR", "CAT", "CRPD"
  documento: string;
  sessao?: string;
  data: string; // Formato YYYY-MM-DD
  tema: TipoDireito | string;
  texto: string;
  status: StatusRecomendacao; // aceita / notada / parcial / cumprido
  evidencia: string | null;
  url: string;
  ciclo?: string;
  estadoRecomendante?: string;
}

export interface RotuloTema {
  id: TipoDireito;
  nome: string;
  descricao: string;
  artigoAfricano?: string;
  orgaoOnu?: string;
}

export const TEMAS_CATALOGO: readonly RotuloTema[] = [
  // 12 originais
  { id: "humanos", nome: "Direitos Humanos", descricao: "Garantias universais, civis e fundamentais de dignidade e integridade." },
  { id: "ambiental", nome: "Direito Ambiental", descricao: "Proteção de ecossistemas, equilíbrio ecológico e sustentabilidade." },
  { id: "mulheres", nome: "Direito das Mulheres", descricao: "Igualdade de gênero, prevenção à violência e autonomia.", artigoAfricano: "Protocolo de Maputo", orgaoOnu: "CEDAW/CSW" },
  { id: "natureza", nome: "Direito da Natureza", descricao: "Reconhecimento da natureza e bacias hidrográficas como sujeitos de direitos." },
  { id: "politicos", nome: "Direitos Políticos", descricao: "Participação democrática, voto, associação e manifestação pacífica." },
  { id: "criancas", nome: "Direitos das Crianças", descricao: "Prioridade absoluta, proteção integral e educação.", artigoAfricano: "Carta ACRWC", orgaoOnu: "CRC" },
  { id: "indigenas", nome: "Direitos Indígenas", descricao: "Autodeterminação, terras ancestrais, consulta prévia e identidade.", orgaoOnu: "EMRIP" },
  { id: "quilombolas", nome: "Direitos Quilombolas", descricao: "Titulação de territórios tradicionais e preservação cultural." },
  { id: "campesinos", nome: "Direitos Campesinos", descricao: "Agricultura familiar, sementes, acesso à terra e soberania alimentar." },
  { id: "coletivos", nome: "Direitos Coletivos", descricao: "Direitos difusos, defesa de comunidades e patrimônio comum." },
  { id: "atingidos_empreendimentos", nome: "Atingidos por Empreendimentos", descricao: "Proteção contra remoções forçadas e danos causados por grandes projetos.", orgaoOnu: "WG Business & Human Rights" },
  { id: "atingidos_barragens", nome: "Atingidos por Barragens", descricao: "Segurança de barramentos, mitigação, reparação integral e reassentamento justo." },
  // 12 novos
  { id: "povos", nome: "Direitos dos Povos", descricao: "Autodeterminação, direito ao desenvolvimento, paz, meio ambiente e recursos naturais.", artigoAfricano: "Carta Africana arts. 19–24", orgaoOnu: "EMRIP/Comitê de Descolonização" },
  { id: "idosos", nome: "Pessoas Idosas", descricao: "Dignidade, cuidado, autonomia, seguridade e combate ao etarismo.", artigoAfricano: "Protocolo da UA sobre Idosos", orgaoOnu: "OEWG / Plano de Madrid" },
  { id: "deficiencia", nome: "Pessoas com Deficiência", descricao: "Acessibilidade integral, inclusão social e capacidade jurídica plena.", artigoAfricano: "Protocolo da UA sobre Deficiência", orgaoOnu: "CRPD" },
  { id: "lgbtqia", nome: "Pessoas LGBTQIA+", descricao: "Não discriminação, proteção contra violência motivada por ódio e livre orientação." },
  { id: "migrantes_refugiados", nome: "Migrantes e Refugiados", descricao: "Não devolução (non-refoulement), acolhimento humanitário e direitos laborais.", artigoAfricano: "Convenção de Kampala", orgaoOnu: "CMW / UNHCR" },
  { id: "trabalho", nome: "Trabalho Digno", descricao: "Remuneração justa, liberdade sindical, proibição do trabalho escravo e infantil.", orgaoOnu: "OIT" },
  { id: "saude", nome: "Direito à Saúde", descricao: "Acesso universal aos serviços de saúde, medicamentos e vigilância sanitária.", orgaoOnu: "WHO / OMS" },
  { id: "educacao", nome: "Direito à Educação", descricao: "Ensino público gratuito, de qualidade, laico e acessível em todos os níveis.", orgaoOnu: "UNESCO" },
  { id: "moradia", nome: "Moradia Adequada", descricao: "Habitação segura, saneamento básico, regularização fundiária urbana e não remoção." },
  { id: "agua", nome: "Direito à Água e Saneamento", descricao: "Água potável acessível e esgotamento sanitário como direitos fundamentais." },
  { id: "terra_territorio", nome: "Terra e Território", descricao: "Função social da propriedade, reforma agrária e proteção contra grilagem." },
  { id: "memoria_verdade_justica", nome: "Memória, Verdade e Justiça", descricao: "Direito à verdade, responsabilização de violadores de direitos e memória histórica." },
];
