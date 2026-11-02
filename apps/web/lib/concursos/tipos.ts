/**
 * ═══ CONCURSOS PÚBLICOS E CONTRATAÇÕES TEMPORÁRIAS — TIPAGENS OFICIAIS ═══
 *
 * O que é:
 *   Definições de tipos e interfaces TypeScript para o radar nacional de
 *   certames públicos (efetivos e PSS) no portal Controle Popular.
 *
 * Fonte oficial:
 *   Constituição Federal de 1988 (art. 37, II e IX), Lei Federal 8.112/1990,
 *   Lei Federal 8.745/1993, Diários Oficiais e bancas examinadoras oficiais.
 *
 * Por que foi feito assim:
 *   Garante coerência de tipos estritos entre o coletor Python, a camada de dados
 *   JSON, as funções puras de filtragem/ordenação e os componentes React da interface.
 */

export type Esfera = "Federal" | "Estadual" | "Municipal";

export type Poder =
  | "Executivo"
  | "Legislativo"
  | "Judiciário"
  | "Ministério Público"
  | "Tribunal de Contas"
  | "Defensoria Pública";

export type NaturezaJuridica =
  | "Administração Direta"
  | "Autarquia"
  | "Fundação Pública"
  | "Empresa Pública"
  | "Sociedade de Economia Mista";

export type ModalidadeConcurso =
  | "Concurso Efetivo"
  | "Processo Seletivo Simplificado (PSS)"
  | "Contratação Temporária";

export type Escolaridade =
  | "Fundamental"
  | "Médio"
  | "Técnico"
  | "Superior"
  | "Múltiplos Níveis";

export type StatusCertame =
  | "Previsto"
  | "Comissão Formada"
  | "Autorizado"
  | "Edital Publicado"
  | "Inscrições Abertas"
  | "Em Andamento"
  | "Homologado";

export interface ItemConcurso {
  id: string;
  orgao: string;
  nomeCompleto: string;
  esfera: Esfera;
  poder: Poder;
  natureza: NaturezaJuridica;
  modalidade: ModalidadeConcurso;
  uf: string;
  municipio: string;
  cargos: string[];
  escolaridade: Escolaridade;
  vagasImediatas: number;
  vagasCadastroReserva: number;
  remuneracaoInicial: string;
  remuneracaoNumMin: number;
  remuneracaoNumMax: number;
  banca: string;
  status: StatusCertame;
  periodoInscricao: string;
  taxaInscricao: string;
  dataProva: string;
  linkEdital: string;
  dataAtualizacao: string;
}

export interface ResumoConcursos {
  porEsfera: Record<string, number>;
  porPoder: Record<string, number>;
  porModalidade: Record<string, number>;
  porStatus: Record<string, number>;
  porUf: Record<string, number>;
}

export interface AcervoConcursos {
  atualizadoEm: string;
  totalCertames: number;
  totalVagasImediatas: number;
  totalVagasCadastroReserva: number;
  maiorRemuneracao: number;
  resumo: ResumoConcursos;
  itens: ItemConcurso[];
}

export interface FiltrosConcurso {
  busca: string;
  esfera: string;
  poder: string;
  modalidade: string;
  escolaridade: string;
  status: string;
  uf: string;
}
