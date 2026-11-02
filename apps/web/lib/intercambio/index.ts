/**
 * @file apps/web/lib/intercambio/index.ts
 * @description Ponto único de consulta e agregação do módulo de intercâmbio, calendário acadêmico, cursos e coordenações.
 *
 * Papel no portal:
 *   Sustenta as consultas das páginas /educacao e /universidades com dados medidos
 *   e agregados diretamente dos arrays tipados (QUALIDADES-DA-INFORMACAO.md item 4).
 */

import { semAcento, separarPalavras } from "@/lib/busca/normalizar";
import { DEPARTAMENTOS_INTERCAMBIO } from "./departamentos";
import { PROGRAMAS_INTERCAMBIO } from "./programas";
import { CURSOS_COORDENADORES } from "./cursos";
import { CALENDARIO_ACADEMICO } from "./calendario";
import type {
  DepartamentoIntercambio,
  EditalProgramaIntercambio,
  CursoCoordenador,
  EventoCalendarioAcademico,
  ResumoIntercambio,
} from "./tipos";

export * from "./tipos";
export * from "./departamentos";
export * from "./programas";
export * from "./cursos";
export * from "./calendario";

export function listarDepartamentos(): DepartamentoIntercambio[] {
  return [...DEPARTAMENTOS_INTERCAMBIO].sort((a, b) =>
    a.pais.localeCompare(b.pais) || a.instituicao.localeCompare(b.instituicao)
  );
}

export function listarProgramas(): EditalProgramaIntercambio[] {
  return [...PROGRAMAS_INTERCAMBIO];
}

export function listarCursos(): CursoCoordenador[] {
  return [...CURSOS_COORDENADORES].sort((a, b) =>
    a.instituicao.localeCompare(b.instituicao) || a.curso.localeCompare(b.curso)
  );
}

/** Calcula resumo matemático exato sem números digitados à mão (Qualidade 4) */
export function resumirIntercambio(): ResumoIntercambio {
  const contagemProgramas: Record<string, number> = {};
  const contagemInstituicoes: Record<string, number> = {};
  const setInstituicoes = new Set<string>();
  const setPaises = new Set<string>();
  const contagemEventosMes: Record<string, number> = {
    Janeiro: 0,
    Fevereiro: 0,
    Março: 0,
    Abril: 0,
    Maio: 0,
    Junho: 0,
    Julho: 0,
    Agosto: 0,
    Setembro: 0,
    Outubro: 0,
    Novembro: 0,
    Dezembro: 0,
  };

  for (const dep of DEPARTAMENTOS_INTERCAMBIO) {
    setInstituicoes.add(dep.instituicao);
    if (dep.pais) setPaises.add(dep.pais);
    for (const prog of dep.programas) {
      contagemProgramas[prog] = (contagemProgramas[prog] || 0) + 1;
    }
  }

  for (const curso of CURSOS_COORDENADORES) {
    setInstituicoes.add(curso.instituicao);
    if (curso.pais) setPaises.add(curso.pais);
    contagemInstituicoes[curso.instituicao] =
      (contagemInstituicoes[curso.instituicao] || 0) + 1;
  }

  for (const evento of CALENDARIO_ACADEMICO) {
    contagemEventosMes[evento.nomeMes] =
      (contagemEventosMes[evento.nomeMes] || 0) + 1;
  }

  const programasOrdenados = Object.entries(contagemProgramas).sort(
    (a, b) => b[1] - a[1]
  );
  const instOrdenadas = Object.entries(contagemInstituicoes).sort(
    (a, b) => b[1] - a[1]
  );
  const eventosPorMes = Object.entries(contagemEventosMes);

  return {
    totalDepartamentos: DEPARTAMENTOS_INTERCAMBIO.length,
    totalProgramas: PROGRAMAS_INTERCAMBIO.length,
    totalCursosMapeados: CURSOS_COORDENADORES.length,
    totalInstituicoes: setInstituicoes.size,
    totalPaisesAlcancados: setPaises.size,
    totalEventosCalendario: CALENDARIO_ACADEMICO.length,
    eventosPorMes,
    programasMaisOferecidos: programasOrdenados,
    instituicoesComMaisCursos: instOrdenadas,
    verificadoEm: "2026-11-02",
  };
}

/** Filtro inteligente de cursos tolerante a acentos e caixa */
export function filtrarCursos(
  termo?: string,
  instituicao?: string,
  grandeArea?: string,
  programa?: string
): CursoCoordenador[] {
  const t = termo ? semAcento(termo.toLowerCase().trim()) : "";
  const palavras = t ? separarPalavras(t) : [];

  return CURSOS_COORDENADORES.filter((c) => {
    if (instituicao && instituicao !== "Todas" && c.instituicao !== instituicao) {
      return false;
    }
    if (grandeArea && grandeArea !== "Todas" && c.grandeArea !== grandeArea) {
      return false;
    }
    if (
      programa &&
      programa !== "Todos" &&
      !c.conveniosIntercambio.some((p) => p.includes(programa))
    ) {
      return false;
    }
    if (!t) return true;

    const textoAlvo = semAcento(
      `${c.curso} ${c.instituicao} ${c.nomeInstituicao} ${c.coordenador} ${c.unidade} ${c.campus}`.toLowerCase()
    );
    return palavras.every((p) => textoAlvo.includes(p));
  });
}
