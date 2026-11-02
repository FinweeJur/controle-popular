/**
 * @file apps/web/lib/intercambio/tipos.ts
 * @description Modelo de dados para Departamentos de Intercâmbio Mundiais, Programas/Editais, Calendário Mensal e Cursos com Coordenadores.
 *
 * Papel no portal:
 *   Alimenta as zonas `/educacao` e `/universidades` com informações verificadas
 *   sobre mobilidade acadêmica internacional (Erasmus+, PILA, AUGM/Escala, Brafitec, Santander...),
 *   diretorias de relações internacionais em todos os continentes, calendário mês a mês
 *   e contatos institucionais de coordenações de cursos.
 *
 * Regras respeitadas (QUALIDADES-DA-INFORMACAO.md e AGENTS.md):
 *   1. Toda entidade possui link oficial verificado (`urlOficial` / `site`).
 *   2. Contatos são estritamente canais institucionais públicos declarados pela universidade.
 *   3. Zero dados pessoais sensíveis ou números de CPF.
 */

export type RegiaoMundial =
  | "Brasil"
  | "Lusófonos"
  | "América Latina"
  | "América do Norte"
  | "Europa"
  | "África"
  | "Ásia e China"
  | "Oceania";

export interface DepartamentoIntercambio {
  id: string;
  instituicao: string;
  nomeInstituicao: string;
  pais: string;
  regiao: RegiaoMundial;
  cidade: string;
  uf?: string;
  nomeDepartamento: string;
  responsavel: string;
  cargo: string;
  email: string;
  telefone?: string;
  site: string;
  endereco: string;
  programas: string[];
  fonteUrl: string;
  dataVerificacao: string;
}

export interface EditalProgramaIntercambio {
  id: string;
  sigla: string;
  nome: string;
  orgaoFinanciador: string;
  regiaoDestino: string;
  paisesParticipantes: string[];
  publicoAlvo: string;
  beneficios: string;
  valorBolsaAprox: string;
  requisitos: string[];
  formaInscricao: string;
  cicloChamadas: string;
  urlOficial: string;
  dataVerificacao: string;
}

export type CategoriaCalendario =
  | "intercambio"
  | "periodico_ciclico"
  | "edital_pesquisa";

export interface EventoCalendarioAcademico {
  id: string;
  mes: number; // 1 a 12
  nomeMes: string; // "Janeiro", "Fevereiro", ..., "Dezembro"
  categoria: CategoriaCalendario;
  titulo: string;
  instituicaoOuPrograma: string;
  paisOuRegiao: string;
  descricao: string;
  prazoOuPeriodo: string;
  publicoAlvo: string;
  linkOficial: string;
  gratuito: boolean; // Sem taxa ou com bolsa integral/parcial
  tags: string[];
}

export interface CursoCoordenador {
  id: string;
  instituicao: string;
  nomeInstituicao: string;
  pais?: string;
  curso: string;
  nivel:
    | "Graduação - Bacharelado"
    | "Graduação - Licenciatura"
    | "Pós-Graduação - Mestrado"
    | "Pós-Graduação - Doutorado";
  grandeArea: string;
  unidade: string;
  campus: string;
  coordenador: string;
  emailInstitucional: string;
  telefoneInstitucional?: string;
  siteCurso: string;
  conveniosIntercambio: string[];
  fonteUrl: string;
  dataVerificacao: string;
}

export interface ResumoIntercambio {
  totalDepartamentos: number;
  totalProgramas: number;
  totalCursosMapeados: number;
  totalInstituicoes: number;
  totalPaisesAlcancados: number;
  totalEventosCalendario: number;
  eventosPorMes: [string, number][];
  programasMaisOferecidos: [string, number][];
  instituicoesComMaisCursos: [string, number][];
  verificadoEm: string;
}
