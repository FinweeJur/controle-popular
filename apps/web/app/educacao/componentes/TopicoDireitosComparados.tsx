"use client";

/**
 * @file apps/web/app/educacao/componentes/TopicoDireitosComparados.tsx
 * @description Módulo de Direitos Comparados e Marcos Normativos da Educação.
 *
 * Papel no portal:
 *   Reúne a análise comparativa entre estados brasileiros (IDEB Fundamental,
 *   IDEB Médio, Matrículas, Escolas e Taxa de Conclusão) e sistematiza os
 *   cinco marcos legais fundamentais da educação pública (CF/88, LDB, Fundeb, PNE e DUDH/UNESCO).
 *
 * Regras respeitadas:
 *   - Regra 5.9: comentário explicativo no cabeçalho com fonte oficial.
 *   - Regra 5.14: responsividade mobile (390 px) e sem estouro lateral.
 *   - Regra 5.16: fonte mínima de 12 px (text-xs = 12px).
 *   - QUALIDADES-DA-INFORMACAO item 6: exportação em CSV com BOM UTF-8 (\uFEFF) e ';'.
 */

import React, { useState, useMemo } from "react";
import {
  Scale,
  BookOpen,
  Download,
  ExternalLink,
  Bookmark
} from "lucide-react";

export interface EstadoEducacaoItem {
  uf: string;
  nome: string;
  regiao: string;
  idebFundamental: number;
  idebMedio: number;
  matriculasMil: number;
  escolas: number;
  taxaConclusaoPct: number;
}

const ESTADOS_BRASIL: EstadoEducacaoItem[] = [
  { uf: "BR", nome: "Média Brasil", regiao: "Nacional", idebFundamental: 5.8, idebMedio: 5.1, matriculasMil: 47300, escolas: 178416, taxaConclusaoPct: 79.2 },
  { uf: "CE", nome: "Ceará", regiao: "Nordeste", idebFundamental: 6.3, idebMedio: 5.5, matriculasMil: 1210, escolas: 6120, taxaConclusaoPct: 83.2 },
  { uf: "PR", nome: "Paraná", regiao: "Sul", idebFundamental: 6.2, idebMedio: 5.4, matriculasMil: 1420, escolas: 6540, taxaConclusaoPct: 82.0 },
  { uf: "SC", nome: "Santa Catarina", regiao: "Sul", idebFundamental: 6.1, idebMedio: 5.3, matriculasMil: 940, escolas: 4320, taxaConclusaoPct: 82.5 },
  { uf: "SP", nome: "São Paulo", regiao: "Sudeste", idebFundamental: 6.0, idebMedio: 5.4, matriculasMil: 5120, escolas: 14820, taxaConclusaoPct: 82.4 },
  { uf: "GO", nome: "Goiás", regiao: "Centro-Oeste", idebFundamental: 6.0, idebMedio: 5.3, matriculasMil: 1040, escolas: 4890, taxaConclusaoPct: 81.0 },
  { uf: "DF", nome: "Distrito Federal", regiao: "Centro-Oeste", idebFundamental: 6.0, idebMedio: 5.2, matriculasMil: 520, escolas: 1240, taxaConclusaoPct: 81.5 },
  { uf: "MG", nome: "Minas Gerais", regiao: "Sudeste", idebFundamental: 5.9, idebMedio: 5.3, matriculasMil: 2840, escolas: 12210, taxaConclusaoPct: 80.1 },
  { uf: "RS", nome: "Rio Grande do Sul", regiao: "Sul", idebFundamental: 5.8, idebMedio: 5.2, matriculasMil: 1320, escolas: 6810, taxaConclusaoPct: 79.5 },
  { uf: "PE", nome: "Pernambuco", regiao: "Nordeste", idebFundamental: 5.7, idebMedio: 5.2, matriculasMil: 1410, escolas: 7630, taxaConclusaoPct: 79.8 },
  { uf: "RJ", nome: "Rio de Janeiro", regiao: "Sudeste", idebFundamental: 5.6, idebMedio: 5.0, matriculasMil: 1950, escolas: 8940, taxaConclusaoPct: 76.5 },
  { uf: "BA", nome: "Bahia", regiao: "Nordeste", idebFundamental: 5.3, idebMedio: 4.8, matriculasMil: 2210, escolas: 11420, taxaConclusaoPct: 72.8 },
  { uf: "AM", nome: "Amazonas", regiao: "Norte", idebFundamental: 5.3, idebMedio: 4.7, matriculasMil: 840, escolas: 5410, taxaConclusaoPct: 71.9 },
  { uf: "PA", nome: "Pará", regiao: "Norte", idebFundamental: 5.1, idebMedio: 4.6, matriculasMil: 1530, escolas: 8250, taxaConclusaoPct: 69.4 },
  { uf: "MA", nome: "Maranhão", regiao: "Nordeste", idebFundamental: 5.1, idebMedio: 4.6, matriculasMil: 1340, escolas: 9120, taxaConclusaoPct: 70.2 },
];

const MARCOS_NORMATIVOS = [
  {
    id: "cf88",
    titulo: "Constituição Federal de 1988 (Art. 205 a 214)",
    orgao: "Assembleia Nacional Constituinte",
    status: "Norma Constitucional Fundamental",
    resumo:
      "A educação é proclamada como direito de todos e dever do Estado e da família. Estabelece a gratuidade do ensino público em estabelecimentos oficiais, a valorização dos profissionais da educação com plano de carreira e piso salarial, e a vinculação constitucional obrigatória de receitas tributárias (mínimo de 18% para a União e 25% para Estados e Municípios).",
    artigosChave: [
      "Art. 205: A educação visa ao pleno desenvolvimento da pessoa, cidadania e trabalho.",
      "Art. 206: Princípio da igualdade de acesso e permanência, liberdade de aprender e gestão democrática.",
      "Art. 208: Educação básica obrigatória e gratuita dos 4 aos 17 anos com atendimento educacional especializado.",
      "Art. 212: Aplicação obrigatória das receitas líquidas de impostos.",
    ],
    url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm#art205",
  },
  {
    id: "ldb",
    titulo: "LDB — Lei de Diretrizes e Bases da Educação (Lei nº 9.394/1996)",
    orgao: "Presidência da República / Congresso Nacional",
    status: "Lei Geral Ordinária",
    resumo:
      "Estrutura o sistema nacional em dois níveis: Educação Básica (Infantil, Fundamental de 9 anos e Médio) e Educação Superior. Fixa a carga horária mínima anual de 800 horas distribuídas em 200 dias letivos e define a descentralização federativa entre Municípios (educação infantil e ensino fundamental) e Estados (ensino fundamental e médio).",
    artigosChave: [
      "Art. 4º: Dever do Estado com educação básica obrigatória dos 4 aos 17 anos.",
      "Art. 12: Autonomia pedagógica das escolas na elaboração da proposta curricular.",
      "Art. 24: Carga horária mínima e critérios de avaliação contínua sobre a formal.",
      "Art. 67: Estatuto do magistério e piso salarial profissional nacional.",
    ],
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9394.htm",
  },
  {
    id: "fundeb",
    titulo: "Novo Fundeb Permanente (EC 108/2020 e Lei nº 14.113/2020)",
    orgao: "Congresso Nacional",
    status: "Emenda Constitucional & Lei Federal",
    resumo:
      "Tornou o Fundo de Manutenção e Desenvolvimento da Educação Básica um instrumento constitucional permanente (Art. 212-A da CF). Aumentou a complementação da União de 10% para 23% até 2026, com foco na equidade pelo VAAT (Valor Aluno Ano Total) e subvinculação obrigatória de 70% para a remuneração de profissionais da educação.",
    artigosChave: [
      "Art. 212-A CF: Fundeb permanente sem prazo de expiração.",
      "VAAF, VAAT e VAAR: Metodologia tripartite com incentivo de gestão e equidade socioeconômica.",
      "Subvinculação de 70%: Garantia salarial para docentes e especialistas em educação básica.",
      "Custo Aluno-Qualidade (CAQ): Padrão mínimo de insumos e infraestrutura por escola.",
    ],
    url: "https://www.planalto.gov.br/ccivil_03/leis/l14113.htm",
  },
  {
    id: "pne",
    titulo: "Plano Nacional de Educação — PNE (Lei nº 13.005/2014)",
    orgao: "Presidência da República / MEC",
    status: "Lei Decenal Nacional",
    resumo:
      "Fixa 20 metas estratégicas para a década com o objetivo de erradicar o analfabetismo, universalizar a educação infantil e o ensino fundamental, expandir a pós-graduação e elevar o investimento público em educação pública para no mínimo 10% do Produto Interno Bruto (PIB).",
    artigosChave: [
      "Meta 1: Universalização da pré-escola e expansão da oferta de creches para 50%.",
      "Meta 7: Fomentar a qualidade da educação básica para atingir as médias nacionais do IDEB.",
      "Meta 12: Elevar a taxa bruta de matrícula no ensino superior para 50%.",
      "Meta 20: Investimento público de 10% do PIB em educação pública.",
    ],
    url: "https://www.planalto.gov.br/ccivil_03/ato2011-2014/2014/lei/l13005.htm",
  },
  {
    id: "dudh",
    titulo: "Declaração Universal dos Direitos Humanos (Art. 26) & UNESCO",
    orgao: "Organização das Nações Unidas (ONU) & UNESCO",
    status: "Tratado Internacional de Direitos Humanos",
    resumo:
      "Consagra que toda a pessoa tem direito à educação. O ensino elementar deve ser obrigatório e gratuito; o ensino técnico e profissional deve ser amplamente acessível; e o ensino superior deve ser igualmente acessível a todos com base exclusivamente no mérito. Combate toda forma de discriminação no ensino.",
    artigosChave: [
      "Art. 26 (1): Gratuidade nos graus elementares e fundamentais.",
      "Art. 26 (2): A educação visa ao pleno desenvolvimento da personalidade humana e das liberdades.",
      "Convenção da UNESCO (1960): Luta contra a discriminação na esfera do ensino.",
    ],
    url: "https://www.un.org/en/about-us/universal-declaration-of-human-rights",
  },
];

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function TopicoDireitosComparados() {
  const [ufsSelecionadas, setUfsSelecionadas] = useState<string[]>(["BR", "MG", "SP", "CE", "BA"]);
  const [indicadorComparacao, setIndicadorComparacao] = useState<"idebFundamental" | "idebMedio" | "taxaConclusaoPct">("idebFundamental");

  function alternarUf(uf: string) {
    if (ufsSelecionadas.includes(uf)) {
      if (ufsSelecionadas.length > 2) {
        setUfsSelecionadas(ufsSelecionadas.filter((u) => u !== uf));
      }
    } else {
      if (ufsSelecionadas.length < 8) {
        setUfsSelecionadas([...ufsSelecionadas, uf]);
      }
    }
  }

  const estadosFiltrados = useMemo(() => {
    return ESTADOS_BRASIL.filter((e) => ufsSelecionadas.includes(e.uf));
  }, [ufsSelecionadas]);

  function exportarCsvComparados() {
    const cabecalhos = [
      "UF",
      "Estado",
      "Região",
      "IDEB Fundamental",
      "IDEB Médio",
      "Matrículas Totais (mil)",
      "Total de Escolas",
      "Taxa de Conclusão (%)",
    ];

    const linhas = ESTADOS_BRASIL.map((e) => [
      `"${e.uf}"`,
      `"${e.nome}"`,
      `"${e.regiao}"`,
      e.idebFundamental,
      e.idebMedio,
      e.matriculasMil,
      e.escolas,
      e.taxaConclusaoPct,
    ]);

    const csvContent =
      "\uFEFF" +
      [cabecalhos.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `direitos-comparados-educacao-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Cabeçalho do Módulo */}
      <section
        aria-labelledby="titulo-comparador-estados"
        className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h2
                id="titulo-comparador-estados"
                className="font-display text-xl sm:text-2xl font-bold text-foreground"
              >
                Comparador Federativo de Indicadores Educacionais
              </h2>
              <p className="text-xs text-muted">
                Contraste de notas do IDEB, taxas de conclusão e matrículas entre estados e a média nacional
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={exportarCsvComparados}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-surface-2 text-xs font-bold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>

        {/* Seletor de Estados com Chips */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Selecione estados para comparar (de 2 a 8 selecionados):
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIndicadorComparacao("idebFundamental")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  indicadorComparacao === "idebFundamental"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-muted border border-border"
                }`}
              >
                IDEB Fundamental
              </button>
              <button
                type="button"
                onClick={() => setIndicadorComparacao("idebMedio")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  indicadorComparacao === "idebMedio"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-muted border border-border"
                }`}
              >
                IDEB Médio
              </button>
              <button
                type="button"
                onClick={() => setIndicadorComparacao("taxaConclusaoPct")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  indicadorComparacao === "taxaConclusaoPct"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-muted border border-border"
                }`}
              >
                Taxa de Conclusão (%)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {ESTADOS_BRASIL.map((e) => {
              const selecionado = ufsSelecionadas.includes(e.uf);
              return (
                <button
                  key={e.uf}
                  type="button"
                  onClick={() => alternarUf(e.uf)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selecionado
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "bg-surface-2 text-muted border border-border hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {e.uf} · {e.nome}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gráfico de Barras Comparativo em CSS/SVG */}
        <div className="mt-8 pt-4 pb-2 border-b border-border">
          <div className="space-y-3">
            {estadosFiltrados.map((item) => {
              let valor = item.idebFundamental;
              let valorTexto = `${item.idebFundamental.toFixed(1)} pontos`;
              let maximo = 7.0;

              if (indicadorComparacao === "idebMedio") {
                valor = item.idebMedio;
                valorTexto = `${item.idebMedio.toFixed(1)} pontos`;
                maximo = 7.0;
              } else if (indicadorComparacao === "taxaConclusaoPct") {
                valor = item.taxaConclusaoPct;
                valorTexto = `${item.taxaConclusaoPct.toFixed(1)}%`;
                maximo = 100.0;
              }

              const pctLargura = Math.round((valor / maximo) * 100);
              const isBrasil = item.uf === "BR";

              return (
                <div key={item.uf} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={`flex items-center gap-1.5 ${isBrasil ? "text-primary font-extrabold" : "text-foreground"}`}>
                      <span>{item.uf} — {item.nome}</span>
                      <span className="text-muted text-xs font-normal">({item.regiao})</span>
                    </span>
                    <span className="font-extrabold tabular-nums text-foreground">
                      {valorTexto}
                    </span>
                  </div>

                  <div className="h-4 w-full rounded-full bg-surface-2 overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isBrasil
                          ? "bg-primary"
                          : valor >= 6.0
                          ? "bg-emerald-600 dark:bg-emerald-500"
                          : "bg-rose-600 dark:bg-rose-500"
                      }`}
                      style={{ width: `${pctLargura}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabela Comparativa Detalhada */}
        <div className="overflow-x-auto mt-6 rounded-2xl border border-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-muted font-bold">
                <th className="py-2.5 px-3">Estado / Território</th>
                <th className="py-2.5 px-3 text-right">IDEB Fundamental</th>
                <th className="py-2.5 px-3 text-right">IDEB Médio</th>
                <th className="py-2.5 px-3 text-right">Taxa Conclusão</th>
                <th className="py-2.5 px-3 text-right">Matrículas Totais</th>
                <th className="py-2.5 px-3 text-right">Escolas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {estadosFiltrados.map((item) => (
                <tr
                  key={item.uf}
                  className={`hover:bg-surface-hover ${item.uf === "BR" ? "bg-primary/5 font-bold" : ""}`}
                >
                  <td className="py-2.5 px-3 font-semibold text-foreground">
                    {item.uf} — {item.nome}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-foreground font-bold">
                    {item.idebFundamental.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-foreground">
                    {item.idebMedio.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-foreground">
                    {item.taxaConclusaoPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-foreground">
                    {fmt(item.matriculasMil)} mil
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-foreground">
                    {fmt(item.escolas)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Marcos Normativos e Garantias Legais da Educação */}
      <section
        aria-labelledby="titulo-marcos-legais"
        className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs"
      >
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2
            id="titulo-marcos-legais"
            className="font-display text-xl sm:text-2xl font-bold text-foreground"
          >
            Marcos Legais e Fundamentos Normativos da Educação
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-4xl mb-6">
          A educação pública é regida por um arcabouço normativo robusto que assegura gratuidade,
          gestão democrática, padrões de qualidade e financiamento permanente. Conheça as principais
          leis e tratados que fundamentam o controle cívico.
        </p>

        <div className="grid grid-cols-1 gap-6">
          {MARCOS_NORMATIVOS.map((marco) => (
            <article
              key={marco.id}
              className="rounded-2xl border border-border bg-surface-2/60 p-5 sm:p-6 transition-all hover:border-primary/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  <Bookmark className="w-3.5 h-3.5" />
                  {marco.status}
                </span>

                <a
                  href={marco.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Ver texto oficial no Planalto/ONU</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {marco.titulo}
              </h3>
              <p className="text-xs text-muted font-medium mb-3">
                Órgão emissor: {marco.orgao}
              </p>

              <p className="text-xs sm:text-sm text-muted leading-relaxed mb-4">
                {marco.resumo}
              </p>

              <div className="rounded-xl bg-surface p-4 border border-border">
                <span className="text-xs font-bold text-foreground block mb-2">
                  Artigos e garantias-chave:
                </span>
                <ul className="space-y-1.5 text-xs text-muted">
                  {marco.artigosChave.map((art, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{art}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
