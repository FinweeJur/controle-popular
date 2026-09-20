/**
 * Dados do laboratório — preparação server-side.
 * Cada dataset é resumido em DitherItem[] (para o gráfico de pontos).
 */

import type { DitherItem } from "./lab-dither";
import type { JanelaDados } from "./LabJanela";

import { COBERTURA_SIGBM } from "@/lib/ambiental/barragens-sigbm";
import { COBERTURA_DECISOES_LICENCIAMENTO, DECISOES_LICENCIAMENTO_POR_TIPO } from "@/lib/ambiental/decisoes-licenciamento";
import { carregarDadosEducacaoMg } from "@/lib/educacao/mg-dados";
import { obterSeriesEconomicas } from "@/lib/series-economicas";
import { carregarCeapNacional } from "@/lib/congresso/ceap-nacional-dados";
import { obterEstatisticasContatos } from "@/lib/judiciario/contatos";
import { carregarAnalisesEsg } from "@/lib/paraopeba/esg-vale";

export type { DitherItem } from "./lab-dither";
export type { JanelaDados } from "./LabJanela";

function corPorIndex(i: number): string {
  const cores = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
  ];
  return cores[i % cores.length];
}

// ── Barragens ────────────────────────────────────────────────────────────────

export function resumoBarragens(): JanelaDados {
  const itens: DitherItem[] = COBERTURA_SIGBM.porSituacao.map((s, i) => ({
    rotulo: s.valor,
    valor: s.total,
    cor: corPorIndex(i),
  }));
  return {
    titulo: "Barragens SIGBM/ANM",
    itens,
    fonteLabel: `Fonte: ${COBERTURA_SIGBM.fonte} · Coletado: ${COBERTURA_SIGBM.coletadoEm}`,
    fonteUrl: COBERTURA_SIGBM.urlFonte,
    filtros: {
      label: "situação",
      valores: COBERTURA_SIGBM.porSituacao.map((s) => s.valor),
    },
  };
}

// ── Licenciamento ────────────────────────────────────────────────────────────

export function resumoLicencas(): JanelaDados {
  const itens: DitherItem[] = DECISOES_LICENCIAMENTO_POR_TIPO.map((t, i) => ({
    rotulo: t.decisao,
    valor: t.total,
    cor: corPorIndex(i),
  }));
  return {
    titulo: "Decisões de Licenciamento Ambiental",
    itens,
    fonteLabel: `Fonte: ${COBERTURA_DECISOES_LICENCIAMENTO.fonte} · ${COBERTURA_DECISOES_LICENCIAMENTO.medidoEm}`,
    fonteUrl: "https://sistemas.meioambiente.mg.gov.br/licenciamento",
    filtros: {
      label: "tipo de decisão",
      valores: DECISOES_LICENCIAMENTO_POR_TIPO.map((t) => t.decisao),
    },
  };
}

// ── Educação ─────────────────────────────────────────────────────────────────

export function resumoEducacao(): JanelaDados {
  const dados = carregarDadosEducacaoMg();
  const top10 = [...dados.indicadores]
    .sort((a, b) => b.matriculas_fundamental - a.matriculas_fundamental)
    .slice(0, 10);

  const itens: DitherItem[] = top10.map((m, i) => ({
    rotulo: m.municipio,
    valor: m.matriculas_fundamental,
    cor: corPorIndex(i),
  }));

  const municipios = [...new Set(top10.map((m) => m.municipio))].sort();
  return {
    titulo: "Educação MG — Matrículas Fundamental (top 10)",
    itens,
    fonteLabel: `Fonte: INEP/Censo Escolar · ${dados.metadata.data_atualizacao}`,
    fonteUrl: "https://www.gov.br/inep/",
    filtros: {
      label: "município",
      valores: municipios,
    },
  };
}

// ── Economia ─────────────────────────────────────────────────────────────────

export function resumoEconomia(): JanelaDados {
  const acervo = obterSeriesEconomicas();
  const series = Object.values(acervo.series);

  const itens: DitherItem[] = series.map((s, i) => ({
    rotulo: s.nome.length > 24 ? `${s.nome.slice(0, 22)}…` : s.nome,
    valor: Math.abs(s.ultimoValor) * 100,
    cor: corPorIndex(i),
  }));

  return {
    titulo: "Séries Econômicas BCB",
    itens,
    fonteLabel: `Fonte: ${acervo.fonte} · ${acervo.geradoEm.slice(0, 10)}`,
    fonteUrl: acervo.urlFonte,
    filtros: {
      label: "série",
      valores: series.map((s) =>
        s.nome.length > 24 ? `${s.nome.slice(0, 22)}…` : s.nome
      ),
    },
  };
}

// ── Congresso ────────────────────────────────────────────────────────────────

export function resumoCongresso(): JanelaDados {
  const ceap = carregarCeapNacional();
  if (!ceap) {
    return {
      titulo: "CEAP Parlamentar",
      itens: [],
      fonteLabel: "Dado não disponível",
      fonteUrl: "https://www.camara.leg.br/cota-parlamentar/",
    };
  }

  const porUf = Object.entries(ceap.totaisPorUf)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const itens: DitherItem[] = porUf.map(([uf, total], i) => ({
    rotulo: uf,
    valor: total,
    cor: corPorIndex(i),
  }));

  return {
    titulo: "CEAP — Gastos por UF (top 10)",
    itens,
    fonteLabel: `Fonte: ${ceap.fonte} · ${ceap.geradoEm.slice(0, 10)}`,
    fonteUrl: "https://www.camara.leg.br/cota-parlamentar/",
    filtros: {
      label: "UF",
      valores: porUf.map(([uf]) => uf),
    },
  };
}

// ── Judiciário ───────────────────────────────────────────────────────────────

export function resumoJudiciario(): JanelaDados {
  const stats = obterEstatisticasContatos();

  const itens: DitherItem[] = [
    { rotulo: "Varas", valor: stats.totalVaras, cor: corPorIndex(0) },
    { rotulo: "Gabinetes", valor: stats.totalGabinetes, cor: corPorIndex(1) },
    { rotulo: "Secretarias", valor: stats.totalSecretarias, cor: corPorIndex(2) },
    { rotulo: "Comarcas", valor: stats.totalComarcas, cor: corPorIndex(3) },
    { rotulo: "Balcões Virtuais", valor: stats.totalBalcoesVirtuais, cor: corPorIndex(4) },
  ];

  return {
    titulo: "Judiciário — Unidades por Tipo",
    itens,
    fonteLabel: `Total: ${stats.totalUnidades.toLocaleString("pt-BR")} unidades · ${stats.ufsAtendidas} UFs`,
    fonteUrl: "/judiciario/contatos",
    filtros: {
      label: "ramo",
      valores: ["Estadual", "Federal", "Trabalho"],
    },
  };
}

// ── Clima ────────────────────────────────────────────────────────────────────

export function resumoClima(): JanelaDados {
  const itens: DitherItem[] = [
    { rotulo: "Deslizamentos", valor: 60001, cor: "#ef4444" },
    { rotulo: "Inundações", valor: 60041, cor: "#3b82f6" },
  ];

  return {
    titulo: "Risco Climático — AdaptaBrasil/MCTI",
    itens,
    fonteLabel: "Fonte: AdaptaBrasil/MCTI · 853 municípios de MG",
    fonteUrl: "https://www.gov.br/mcti/",
  };
}

// ── ESG ──────────────────────────────────────────────────────────────────────

export function resumoEsg(): JanelaDados {
  const dados = carregarAnalisesEsg();

  const itens: DitherItem[] = dados.analises.map((a, i) => ({
    rotulo: a.fonte.length > 20 ? `${a.fonte.slice(0, 18)}…` : a.fonte,
    valor: a.resumo.length,
    cor: corPorIndex(i),
  }));

  return {
    titulo: "ESG Vale — Análises",
    itens,
    fonteLabel: `Atualizado: ${dados.atualizacao}`,
    fonteUrl: "/paraopeba/vale",
    filtros: {
      label: "fonte",
      valores: dados.analises.map((a) => a.fonte),
    },
  };
}
