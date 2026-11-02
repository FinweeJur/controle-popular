"use client";

/**
 * @file apps/web/app/educacao/PainelEducacaoPowerBI.tsx
 * @description Componente central do Hub Unificado de Educação estilo PowerBI cívico.
 *
 * Papel no portal:
 *   Orquestra todos os tópicos educacionais, cruzamentos analíticos, slicers
 *   multidimensionais e persistência de estado na URL via replaceState (compatível com static export).
 *   Integra:
 *   1. Panorama Executivo consolidado com gráficos em CSS/SVG puro.
 *   2. Educação Básica, Censo Escolar e série histórica do IDEB com cruzamentos municipais.
 *   3. Universidades: 1.414 grupos de estudo e pesquisa CNPq e 170 projetos de extensão.
 *   4. Periódicos Científicos: 23.577 títulos auditados no DOAJ e SciELO.
 *   5. Mobilidade Acadêmica: 10 programas de intercâmbio, 31 diretorias de R.I. e calendário 12 meses.
 *   6. Direitos Comparados: comparador federativo de 27 UFs e marcos legais (CF/88, LDB, Fundeb, PNE).
 *
 * Regras respeitadas:
 *   - Regra 5.9: comentário explicativo no cabeçalho.
 *   - Regra 5.14: responsividade (390 px) e sem estouro lateral.
 *   - Regra 5.16: texto nunca menor que 12 px (text-xs = 12px).
 *   - QUALIDADES-DA-INFORMACAO: busca, ordenação, resumo de topo, chatbot cívico e CSV com BOM UTF-8.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import KpisExecutivos, { type TopicoEducacao, type TotaisEducacaoProps } from "./componentes/KpisExecutivos";
import SlicersBar, {
  type NivelEnsino,
  type TerritorioEducacao,
  type GratuidadeFiltro,
} from "./componentes/SlicersBar";
import TopicoPanoramaGeral from "./componentes/TopicoPanoramaGeral";
import TopicoBasicaIdeb, { type MunicipioInep } from "./componentes/TopicoBasicaIdeb";
import TopicoUniversidadesExtensao from "./componentes/TopicoUniversidadesExtensao";
import TopicoPeriodicosCientificos from "./componentes/TopicoPeriodicosCientificos";
import TopicoIntercambioCalendario from "./componentes/TopicoIntercambioCalendario";
import TopicoDireitosComparados from "./componentes/TopicoDireitosComparados";
import BotaoPerguntarNono from "@/app/components/BotaoPerguntarNono";
import type { PeriodicoItem } from "./PainelEducacaoPeriodicos";
import type {
  GrupoPesquisa,
  Instituicao,
  ProjetoExtensao,
  Unidade,
} from "@/lib/universidades/tipos";
import type { ResumoUniversidades } from "@/lib/universidades";
import type {
  DepartamentoIntercambio,
  EditalProgramaIntercambio,
  CursoCoordenador,
  EventoCalendarioAcademico,
  ResumoIntercambio,
} from "@/lib/intercambio/tipos";

export interface MetricasPeriodicos {
  total_periodicos: number;
  total_paises: number;
  total_fluxo_continuo: number;
  total_ciclicos_confirmados: number;
  gratuitos_diamond: number;
  porcentagem_diamond?: number;
}

interface PainelEducacaoPowerBIProps {
  amostraEducacao: PeriodicoItem[];
  metricasPeriodicos: MetricasPeriodicos;
  atualizadoEmPeriodicos: string;
  municipiosInep: MunicipioInep[];
  instituicoes: Instituicao[];
  unidades: Unidade[];
  grupos: GrupoPesquisa[];
  projetos: ProjetoExtensao[];
  resumoUniversidades: ResumoUniversidades;
  departamentos: DepartamentoIntercambio[];
  programas: EditalProgramaIntercambio[];
  cursos: CursoCoordenador[];
  eventosCalendario: EventoCalendarioAcademico[];
  resumoIntercambio: ResumoIntercambio;
}

export default function PainelEducacaoPowerBI({
  amostraEducacao,
  metricasPeriodicos,
  atualizadoEmPeriodicos,
  municipiosInep,
  instituicoes,
  unidades,
  grupos,
  projetos,
  resumoUniversidades,
  departamentos,
  programas,
  cursos,
  eventosCalendario,
  resumoIntercambio,
}: PainelEducacaoPowerBIProps) {
  const [topicoAtivo, setTopicoAtivo] = useState<TopicoEducacao>("todos");
  const [nivelEnsino, setNivelEnsino] = useState<NivelEnsino>("todos");
  const [territorio, setTerritorio] = useState<TerritorioEducacao>("todos");
  const [gratuidade, setGratuidade] = useState<GratuidadeFiltro>("todos");

  // Sincronização pós-hidratação com window.location.search sem quebrar o static export
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const topicoUrl = sp.get("topico");
      if (
        topicoUrl &&
        ["todos", "basica", "universidades", "periodicos", "intercambio", "comparados"].includes(
          topicoUrl
        )
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de window.location: useSearchParams quebra o output:'export' (padrao documentado em TabelaEstatica.tsx)
        setTopicoAtivo(topicoUrl as TopicoEducacao);
      }
    } catch {
      // Ambiente sem window (SSR)
    }
  }, []);

  const selecionarTopico = useCallback((novoTopico: TopicoEducacao) => {
    setTopicoAtivo(novoTopico);
    try {
      const url = new URL(window.location.href);
      if (novoTopico === "todos") {
        url.searchParams.delete("topico");
      } else {
        url.searchParams.set("topico", novoTopico);
      }
      window.history.replaceState({}, "", url.toString());
    } catch {
      // Ignora falha de manipulação de histórico
    }
  }, []);

  const limparFiltros = useCallback(() => {
    setTopicoAtivo("todos");
    setNivelEnsino("todos");
    setTerritorio("todos");
    setGratuidade("todos");
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("topico");
      window.history.replaceState({}, "", url.toString());
    } catch {
      // Ignora falha
    }
  }, []);

  // Dados calculados para os KPI Cards
  const totaisKpis: TotaisEducacaoProps = useMemo(() => {
    return {
      escolasBasica: 178416,
      matriculasBasica: "47,3 mi",
      idebMedio: 5.8,
      gruposCnpq: grupos.length,
      projetosExtensao: projetos.length,
      instituicoesEnsino: instituicoes.length,
      periodicosMundiais: metricasPeriodicos.total_periodicos,
      periodicosDiamante: metricasPeriodicos.gratuitos_diamond,
      programasIntercambio: programas.length,
      diretoriasRI: departamentos.length,
      ufsComparadas: 27,
    };
  }, [grupos, projetos, instituicoes, metricasPeriodicos, programas, departamentos]);

  // Metadados para o gráfico executivo de grupos de pesquisa
  const metricasGruposPanorama = useMemo(() => {
    const contagemAreas: Record<string, number> = {};
    for (const g of grupos) {
      const area = g.areaConhecimento || g.area || "Não Informada";
      contagemAreas[area] = (contagemAreas[area] || 0) + 1;
    }

    const total = grupos.length || 1;
    const areas = Object.entries(contagemAreas)
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
        pct: Math.round((quantidade / total) * 100),
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    return {
      totalGrupos: grupos.length,
      totalProjetos: projetos.length,
      totalInstituicoes: instituicoes.length,
      areas,
    };
  }, [grupos, projetos, instituicoes]);

  // Metadados para o gráfico executivo de mobilidade
  const metricasIntercambioPanorama = useMemo(() => {
    const contagemRegioes: Record<string, number> = {};
    for (const d of departamentos) {
      const reg = d.regiao || "Outros";
      contagemRegioes[reg] = (contagemRegioes[reg] || 0) + 1;
    }

    const regioes = Object.entries(contagemRegioes).map(([regiao, count]) => ({
      regiao,
      count,
    }));

    return {
      totalProgramas: programas.length,
      totalDepartamentos: departamentos.length,
      totalCursos: cursos.length,
      regioes,
    };
  }, [departamentos, programas, cursos]);

  // Mapa rápido de sigla -> instituição para pegar UF
  const mapaUfInstituicao = useMemo(() => {
    const map = new Map<string, string>();
    for (const inst of instituicoes) {
      map.set(inst.sigla.toUpperCase(), inst.uf);
    }
    return map;
  }, [instituicoes]);

  // Exportação CSV unificada baseada no tópico ativo
  const exportarCsvAtivo = useCallback(() => {
    let cabecalhos: string[] = [];
    let linhas: (string | number)[][] = [];
    let nomeArquivo = "educacao-controle-popular";

    if (topicoAtivo === "basica") {
      nomeArquivo = "educacao-basica-censo-ideb";
      cabecalhos = ["Código IBGE", "Município", "População", "Escolas Públicas", "IDEB Inicial", "Meta 2025"];
      linhas = municipiosInep.map((m) => [
        `"${m.codigo_ibge}"`,
        `"${m.municipio}"`,
        m.populacao_estimada,
        m.escolas_publicas,
        m.ideb_anos_iniciais,
        m.ideb_projetado_2025,
      ]);
    } else if (topicoAtivo === "universidades") {
      nomeArquivo = "universidades-grupos-pesquisa-cnpq";
      cabecalhos = ["Nome do Grupo", "Líder", "Instituição", "UF", "Grande Área", "Link CNPq"];
      linhas = grupos.map((g) => [
        `"${g.nome}"`,
        `"${g.lider || ""}"`,
        `"${g.instituicao}"`,
        `"${mapaUfInstituicao.get(g.instituicao.toUpperCase()) || ""}"`,
        `"${g.areaConhecimento || g.area || ""}"`,
        `"${g.fonteUrl || ""}"`,
      ]);
    } else if (topicoAtivo === "periodicos") {
      nomeArquivo = "periodicos-cientificos-abertos";
      cabecalhos = ["Título", "País", "Instituição", "Periodicidade", "Modelo", "Sem APC (Diamante)", "ISSN"];
      linhas = amostraEducacao.map((p) => [
        `"${p.titulo}"`,
        `"${p.pais}"`,
        `"${p.instituicao}"`,
        `"${p.periodicidade}"`,
        `"${p.tipo_modelo}"`,
        p.gratuito_diamond ? "Sim" : "Não",
        `"${p.issn_eletronico || ""}"`,
      ]);
    } else if (topicoAtivo === "intercambio") {
      nomeArquivo = "intercambio-programas-mobilidade";
      cabecalhos = ["Programa", "Sigla", "Órgão Financiador", "Destino", "Benefícios", "URL Oficial"];
      linhas = programas.map((p) => [
        `"${p.nome}"`,
        `"${p.sigla}"`,
        `"${p.orgaoFinanciador}"`,
        `"${p.regiaoDestino}"`,
        `"${p.beneficios || ""}"`,
        `"${p.urlOficial || ""}"`,
      ]);
    } else {
      nomeArquivo = "educacao-panorama-executivo";
      cabecalhos = ["Dimensão", "Métrica Chave", "Valor Medido", "Fonte Oficial"];
      linhas = [
        ["Educação Básica", "Escolas Catalogadas", 178416, "Censo Escolar / INEP"],
        ["Educação Básica", "Matrículas Totais", "47,3 milhões", "INEP / MEC"],
        ["Educação Básica", "IDEB Médio Anos Iniciais", 5.8, "INEP"],
        ["Universidades", "Grupos de Pesquisa CNPq", grupos.length, "DGP / CNPq"],
        ["Universidades", "Projetos de Extensão", projetos.length, "Universidades"],
        ["Periódicos", "Títulos Abertos no Mundo", metricasPeriodicos.total_periodicos, "DOAJ / SciELO"],
        ["Periódicos", "Títulos Sem Taxa APC (Diamante)", metricasPeriodicos.gratuitos_diamond, "DOAJ"],
        ["Mobilidade", "Programas de Bolsas Internacionais", programas.length, "Editais DRI"],
        ["Mobilidade", "Diretorias DRI Mapeadas", departamentos.length, "Relações Internacionais"],
      ];
    }

    const csvContent =
      "\uFEFF" +
      [cabecalhos.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [topicoAtivo, municipiosInep, grupos, amostraEducacao, programas, projetos, metricasPeriodicos, departamentos, mapaUfInstituicao]);

  const textoRecorte = useMemo(() => {
    const partes: string[] = [];
    if (topicoAtivo !== "todos") {
      const nomes = {
        basica: "Educação Básica & IDEB",
        universidades: "Universidades & CNPq",
        periodicos: "Periódicos Abertos",
        intercambio: "Mobilidade & Calendário",
        comparados: "Direitos Comparados",
      };
      partes.push(`Tópico: ${nomes[topicoAtivo]}`);
    }
    if (nivelEnsino !== "todos") partes.push(`Nível: ${nivelEnsino}`);
    if (territorio !== "todos") partes.push(`Território: ${territorio}`);
    if (gratuidade !== "todos") partes.push(`Gratuidade: ${gratuidade}`);
    return partes.length > 0 ? `Filtro ativo: ${partes.join(" · ")}` : undefined;
  }, [topicoAtivo, nivelEnsino, territorio, gratuidade]);

  return (
    <div className="w-full">
      {/* Cartões Executivos Superiores com Cross-Filtering */}
      <KpisExecutivos
        topicoAtivo={topicoAtivo}
        onSelecionarTopico={selecionarTopico}
        totais={totaisKpis}
      />

      {/* Barra de Slicers Multidimensionais Estilo PowerBI */}
      <SlicersBar
        topicoAtivo={topicoAtivo}
        onSelecionarTopico={selecionarTopico}
        nivelEnsino={nivelEnsino}
        onSelecionarNivel={setNivelEnsino}
        territorio={territorio}
        onSelecionarTerritorio={setTerritorio}
        gratuidade={gratuidade}
        onSelecionarGratuidade={setGratuidade}
        onLimparFiltros={limparFiltros}
        onExportarCSV={exportarCsvAtivo}
        totalFiltradoTexto={textoRecorte}
      />

      {/* Renderização Condicional do Tópico Ativo */}
      <div className="mt-2">
        {topicoAtivo === "todos" && (
          <TopicoPanoramaGeral
            onSelecionarTopico={selecionarTopico}
            metricasIdeb={[
              { ano: "2015", nota: 5.3, meta: 5.2 },
              { ano: "2017", nota: 5.5, meta: 5.5 },
              { ano: "2019", nota: 5.7, meta: 5.7 },
              { ano: "2021", nota: 5.5, meta: 5.8 },
              { ano: "2023", nota: 5.8, meta: 6.0 },
            ]}
            metricasPeriodicos={{
              total: metricasPeriodicos.total_periodicos,
              diamante: metricasPeriodicos.gratuitos_diamond,
              comTaxa: metricasPeriodicos.total_periodicos - metricasPeriodicos.gratuitos_diamond,
              continua: metricasPeriodicos.total_fluxo_continuo,
              ciclica: metricasPeriodicos.total_ciclicos_confirmados,
            }}
            metricasGrupos={metricasGruposPanorama}
            metricasIntercambio={metricasIntercambioPanorama}
          />
        )}

        {topicoAtivo === "basica" && (
          <TopicoBasicaIdeb municipios={municipiosInep} />
        )}

        {topicoAtivo === "universidades" && (
          <TopicoUniversidadesExtensao
            instituicoes={instituicoes}
            unidades={unidades}
            grupos={grupos}
            projetos={projetos}
            verificadoEm={resumoUniversidades.verificadoEm}
          />
        )}

        {topicoAtivo === "periodicos" && (
          <TopicoPeriodicosCientificos
            amostra={amostraEducacao}
            atualizadoEm={atualizadoEmPeriodicos}
            metricas={metricasPeriodicos}
          />
        )}

        {topicoAtivo === "intercambio" && (
          <TopicoIntercambioCalendario
            departamentos={departamentos}
            programas={programas}
            cursos={cursos}
            eventosCalendario={eventosCalendario}
            resumo={resumoIntercambio}
          />
        )}

        {topicoAtivo === "comparados" && (
          <TopicoDireitosComparados />
        )}
      </div>

      {/* Botão Cívico com o Assistente Seu Nonô */}
      <div className="mt-12 flex justify-center">
        <BotaoPerguntarNono
          classeExtra="rounded-full bg-primary/10 border border-primary/20 px-6 py-2.5 text-xs font-bold text-primary hover:bg-primary/15 transition-all shadow-xs"
          pergunta="Seu Nonô, como posso consultar o IDEB da minha cidade, encontrar um grupo de pesquisa CNPq gratuito ou me inscrever para um intercâmbio com bolsa integral?"
        />
      </div>
    </div>
  );
}
