/**
 * @file apps/web/lib/intercambio/tipos.ts
 * @description Modelo de dados para Departamentos de Intercâmbio, Programas/Editais e Cursos com Coordenadores.
 *
 * Papel no portal:
 *   Alimenta as zonas `/educacao` e `/universidades` com informações verificadas
 *   sobre mobilidade acadêmica internacional (Erasmus+, PILA, AUGM/Escala, Brafitec, Santander)
 *   e contatos institucionais de diretorias de relações internacionais e coordenações de cursos.
 *
 * Regras respeitadas (QUALIDADES-DA-INFORMACAO.md e AGENTS.md):
 *   1. Toda entidade possui link oficial verificado (`urlOficial` / `site`).
 *   2. Contatos são estritamente canais institucionais públicos declarados pela universidade.
 *   3. Zero dados pessoais sensíveis ou números de CPF.
 */

export interface DepartamentoIntercambio {
  id: string;
  instituicao: string;
  nomeInstituicao: string;
  uf: string;
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

export interface CursoCoordenador {
  id: string;
  instituicao: string;
  nomeInstituicao: string;
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
  programasMaisOferecidos: [string, number][];
  instituicoesComMaisCursos: [string, number][];
  verificadoEm: string;
}
