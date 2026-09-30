"use client";

/**
 * @file apps/web/app/consumo-corporativo/PainelConsumoCorporativoClient.tsx
 * @description Painel interativo unificado dos 50 maiores consumidores corporativos
 * de água, energia, combustível, empregos e capital em Minas Gerais e nos 20 países do G20.
 *
 * Papel no portal:
 * Atende integralmente à Regra das 6 Qualidades do Controle Popular (AGENTS.md §8):
 * 1. Links oficiais diretos e verificados (IGAM, ANA, CCEE, ANP, RAIS, CVM, EPA ECHO, ECCC NPRI, FAO Aquastat, World Bank).
 * 2. Busca textual sem acentos e filtros facetados por município, setor CNAE e continente.
 * 3. Ordenação crescente e decrescente em todas as colunas.
 * 4. Cartões de topo com agregados medidos, equivalência humana e assimetria tarifária.
 * 5. Barra Idioma Trilíngue (PT/EN/ES) + TTS + integração com o chatbot Seu Nonô.
 * 6. Exportação CSV com BOM UTF-8 (\uFEFF) e impressão vetorial CSS.
 */

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Droplets,
  Zap,
  Fuel,
  Users,
  Landmark,
  Search,
  Download,
  Printer,
  ArrowUpDown,
  ExternalLink,
  Scale,
  Globe,
  Flame,
  Factory,
  MapPin,
} from "lucide-react";
import DonutChartResponsivo from "@/app/components/charts/DonutChartResponsivo";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao, TextoTrilingue } from "@/lib/internacional/idiomas-internacional";
import { semAcento } from "@/lib/busca/normalizar";
import {
  obterTop50ConsumidoresMg,
  obterConsumoPaisesG20,
  obterPegadaEIntensidadeSetorial,
  gerarFatiasDonutMg,
  valorPorEixoMg,
  urlFontePorEixoMg,
  calcularEquivalenciaPopulacionalAgua,
  calcularEquivalenciaResidencialEnergia,
  exportarCsvConsumidoresMg,
  exportarCsvConsumoG20,
  PALETA_DONUT_RECURSOS,
  type EixoRecurso,
  type FatiaDonutConsumo,
} from "@/lib/recursos/dados-consumidores";

type AbaVisao = "mg-top50" | "g20-paises" | "pegada-cnae" | "mapa-calor-cidades";

const RESUMO_VOZ: TextoTrilingue = {
  pt: "Painel dos 50 maiores consumidores corporativos de água, energia, combustível, empregos e capital em Minas Gerais e nos 20 países do G20, comparando tarifas empresariais com a conta paga pelo cidadão.",
  en: "Dashboard of the top 50 corporate consumers of water, energy, fuel, jobs, and capital in Minas Gerais and across the 20 G20 nations, comparing industrial rates with residential citizen tariffs.",
  es: "Panel de los 50 mayores consumidores corporativos de agua, energía, combustible, empleo y capital en Minas Gerais y en los 20 países del G20, comparando tarifas industriales con la tarifa ciudadana.",
};

const PERGUNTA_NONO: TextoTrilingue = {
  pt: "Quem são os maiores consumidores de água e energia em Minas Gerais e quanto pagam em comparação ao cidadão?",
  en: "Who are the largest water and energy consumers in Minas Gerais and how much do they pay compared to citizens?",
  es: "¿Quiénes son los mayores consumidores de agua y energía en Minas Gerais y cuánto pagan frente al ciudadano?",
};

function formatarValorEixo(valor: number, eixo: EixoRecurso): string {
  if (eixo === "capital") {
    if (valor >= 1_000_000_000) {
      return `R$ ${(valor / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bi`;
    }
    return `R$ ${(valor / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  }
  if (valor >= 1_000_000_000) {
    return `${(valor / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} bi`;
  }
  if (valor >= 1_000_000) {
    return `${(valor / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  }
  return valor.toLocaleString("pt-BR");
}

export default function PainelConsumoCorporativoClient() {
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");
  const [abaVisao, setAbaVisao] = useState<AbaVisao>("mg-top50");
  const [eixoAtivo, setEixoAtivo] = useState<EixoRecurso>("agua");

  // Filtros MG
  const [busca, setBusca] = useState("");
  const [filtroMunicipio, setFiltroMunicipio] = useState("todos");
  const [filtroSetor, setFiltroSetor] = useState("todos");
  const [ordemDesc, setOrdemDesc] = useState(true);

  // Filtros G20
  const [filtroContinente, setFiltroContinente] = useState("todos");

  const listaMg = useMemo(() => obterTop50ConsumidoresMg(), []);
  const listaG20 = useMemo(() => obterConsumoPaisesG20(), []);
  const listaPegada = useMemo(() => obterPegadaEIntensidadeSetorial(), []);

  const municipiosUnicos = useMemo(
    () => Array.from(new Set(listaMg.map((i) => i.municipioNome))).sort(),
    [listaMg]
  );

  const setoresUnicos = useMemo(
    () => Array.from(new Set(listaMg.map((i) => i.categoriaSetor))).sort(),
    [listaMg]
  );

  const continentesG20 = useMemo(
    () => Array.from(new Set(listaG20.map((p) => p.continente))).sort(),
    [listaG20]
  );

  // Lista MG Filtrada e Ordenada
  const mgFiltrados = useMemo(() => {
    const q = semAcento(busca.trim().toLowerCase());
    return listaMg
      .filter((item) => {
        if (filtroMunicipio !== "todos" && item.municipioNome !== filtroMunicipio) return false;
        if (filtroSetor !== "todos" && item.categoriaSetor !== filtroSetor) return false;
        if (!q) return true;
        const alvo = semAcento(
          `${item.empresa} ${item.grupoEconomico} ${item.municipioNome} ${item.setorCnae} ${item.baciaHidrografica} ${item.cnpjRaiz}`
        ).toLowerCase();
        return alvo.includes(q);
      })
      .sort((a, b) => {
        const va = valorPorEixoMg(a, eixoAtivo);
        const vb = valorPorEixoMg(b, eixoAtivo);
        return ordemDesc ? vb - va : va - vb;
      });
  }, [listaMg, busca, filtroMunicipio, filtroSetor, eixoAtivo, ordemDesc]);

  // Lista G20 Filtrada e Ordenada
  const g20Filtrados = useMemo(() => {
    const q = semAcento(busca.trim().toLowerCase());
    return listaG20
      .filter((p) => {
        if (filtroContinente !== "todos" && p.continente !== filtroContinente) return false;
        if (!q) return true;
        const alvo = semAcento(
          `${p.pais} ${p.codigoIso3} ${p.topCorporacoesConsumidoras} ${p.setorMaisIntensivoAgua} ${p.setorMaisIntensivoEnergia}`
        ).toLowerCase();
        return alvo.includes(q);
      })
      .sort((a, b) => {
        const extrairValorG20 = (item: typeof a) => {
          if (eixoAtivo === "agua") return item.retiradaAguaTotalBilhoesM3Ano;
          if (eixoAtivo === "energia") return item.energiaEletricaTotalTwhAno;
          if (eixoAtivo === "combustivel") return item.combustivelPetroleoMilBarrisDia;
          if (eixoAtivo === "empregos") return item.forcaTrabalhoMilhoes;
          return item.pibBilhoesUsd;
        };
        return ordemDesc
          ? extrairValorG20(b) - extrairValorG20(a)
          : extrairValorG20(a) - extrairValorG20(b);
      });
  }, [listaG20, busca, filtroContinente, eixoAtivo, ordemDesc]);

  // Donut MG
  const donutMg = useMemo(
    () => gerarFatiasDonutMg(mgFiltrados, eixoAtivo, 5),
    [mgFiltrados, eixoAtivo]
  );

  // Donut G20
  const donutG20 = useMemo(() => {
    const extrair = (p: (typeof listaG20)[0]) => {
      if (eixoAtivo === "agua") return p.retiradaAguaTotalBilhoesM3Ano;
      if (eixoAtivo === "energia") return p.energiaEletricaTotalTwhAno;
      if (eixoAtivo === "combustivel") return p.combustivelPetroleoMilBarrisDia;
      if (eixoAtivo === "empregos") return p.forcaTrabalhoMilhoes;
      return p.pibBilhoesUsd;
    };
    const totalG20 = g20Filtrados.reduce((acc, p) => acc + extrair(p), 0) || 1;
    const top5 = g20Filtrados.slice(0, 5);
    const somaTop5 = top5.reduce((acc, p) => acc + extrair(p), 0);

    const fatias: FatiaDonutConsumo[] = top5.map((p, idx) => {
      const val = extrair(p);
      return {
        id: p.codigoIso3,
        rotulo: `${p.bandeira} ${p.pais}`,
        subtitulo: `Top empresas: ${p.topCorporacoesConsumidoras.split(",").slice(0, 3).join(", ")}`,
        valor: val,
        percentual: Number(((val / totalG20) * 100).toFixed(1)),
        corHex: PALETA_DONUT_RECURSOS[idx % 5],
        urlFonte: p.urlFonteOficial,
      };
    });

    const restante = Math.max(0, totalG20 - somaTop5);
    const pctTop5 = Number(((somaTop5 / totalG20) * 100).toFixed(1));
    if (restante > 0) {
      fatias.push({
        id: "g20-restante",
        rotulo: "Demais países do G20",
        subtitulo: `${Math.max(0, g20Filtrados.length - 5)} economias restantes`,
        valor: restante,
        percentual: Math.max(0, Number((100 - pctTop5).toFixed(1))),
        corHex: PALETA_DONUT_RECURSOS[5],
        ehRestante: true,
      });
    }

    return { fatias, pctTop5, totalG20 };
  }, [g20Filtrados, eixoAtivo]);

  // Mapa de Calor Municipal (Agregação por cidade de MG)
  const rankingCidadesCalor = useMemo(() => {
    const mapa = new Map<
      string,
      {
        municipioNome: string;
        codigoIbge: string;
        bacia: string;
        qtdPlantas: number;
        aguaM3Ano: number;
        energiaMwhAno: number;
        combustivelLitrosAno: number;
        empregos: number;
        capitalBrl: number;
        empresas: string[];
      }
    >();

    for (const item of listaMg) {
      const atual = mapa.get(item.municipioNome) ?? {
        municipioNome: item.municipioNome,
        codigoIbge: item.codigoIbgeMunicipio,
        bacia: item.baciaHidrografica,
        qtdPlantas: 0,
        aguaM3Ano: 0,
        energiaMwhAno: 0,
        combustivelLitrosAno: 0,
        empregos: 0,
        capitalBrl: 0,
        empresas: [],
      };
      atual.qtdPlantas += 1;
      atual.aguaM3Ano += item.aguaOutorgadaM3Ano;
      atual.energiaMwhAno += item.energiaConsumidaMwhAno;
      atual.combustivelLitrosAno += item.combustivelLitrosAno;
      atual.empregos += item.empregosDiretos;
      atual.capitalBrl += item.capitalMovimentadoBrl;
      atual.empresas.push(item.empresa.split("—")[0].trim());
      mapa.set(item.municipioNome, atual);
    }

    return Array.from(mapa.values()).sort((a, b) => {
      if (eixoAtivo === "agua") return b.aguaM3Ano - a.aguaM3Ano;
      if (eixoAtivo === "energia") return b.energiaMwhAno - a.energiaMwhAno;
      if (eixoAtivo === "combustivel") return b.combustivelLitrosAno - a.combustivelLitrosAno;
      if (eixoAtivo === "empregos") return b.empregos - a.empregos;
      return b.capitalBrl - a.capitalBrl;
    });
  }, [listaMg, eixoAtivo]);

  const baixarPlanilhaCsv = () => {
    const conteudo =
      abaVisao === "g20-paises"
        ? exportarCsvConsumoG20(g20Filtrados)
        : exportarCsvConsumidoresMg(mgFiltrados);
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      abaVisao === "g20-paises"
        ? `controle-popular-g20-consumo-${eixoAtivo}.csv`
        : `controle-popular-top50-mg-${eixoAtivo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unidadeEixoMg =
    eixoAtivo === "agua"
      ? "m³/ano"
      : eixoAtivo === "energia"
      ? "MWh/ano"
      : eixoAtivo === "combustivel"
      ? "L/ano"
      : eixoAtivo === "empregos"
      ? "vínculos"
      : "R$/ano";

  return (
    <div className="space-y-8">
      {/* Barra Idioma Trilíngue + Ouvir + Seu Nonô */}
      <BarraIdiomaTrilingue
        idioma={idioma}
        aoTrocarIdioma={setIdioma}
        resumoTrilingue={RESUMO_VOZ}
        perguntaSeuNono={PERGUNTA_NONO}
      />

      {/* Navegação de Visões Principais */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAbaVisao("mg-top50")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              abaVisao === "mg-top50"
                ? "bg-primary text-white shadow-xs"
                : "bg-surface-2 text-foreground hover:border-primary/40"
            }`}
          >
            <Factory size={16} />
            <span>Top 50 Empresas (Minas Gerais)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaVisao("g20-paises")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              abaVisao === "g20-paises"
                ? "bg-primary text-white shadow-xs"
                : "bg-surface-2 text-foreground hover:border-primary/40"
            }`}
          >
            <Globe size={16} />
            <span>20 Países do G20 & Multinacionais</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaVisao("pegada-cnae")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              abaVisao === "pegada-cnae"
                ? "bg-primary text-white shadow-xs"
                : "bg-surface-2 text-foreground hover:border-primary/40"
            }`}
          >
            <Scale size={16} />
            <span>Pegada Hídrica & Empregos por CNAE</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaVisao("mapa-calor-cidades")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              abaVisao === "mapa-calor-cidades"
                ? "bg-primary text-white shadow-xs"
                : "bg-surface-2 text-foreground hover:border-primary/40"
            }`}
          >
            <Flame size={16} />
            <span>Mapa de Calor Municipal (MG)</span>
          </button>
        </div>

        {/* Botões CSV e Impressão (Qualidade 6) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={baixarPlanilhaCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition"
          >
            <Download size={14} />
            <span>Baixar CSV Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground hover:border-primary transition"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Seletor dos 5 Eixos de Recursos */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted mr-2">
          Eixo de Análise:
        </span>
        {(
          [
            { id: "agua", rotulo: "💧 Água", icone: Droplets },
            { id: "energia", rotulo: "⚡ Energia Elétrica", icone: Zap },
            { id: "combustivel", rotulo: "⛽ Combustível", icone: Fuel },
            { id: "empregos", rotulo: "👥 Empregos Diretos", icone: Users },
            { id: "capital", rotulo: "💰 Capital & Receita", icone: Landmark },
          ] as const
        ).map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setEixoAtivo(e.id)}
            className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
              eixoAtivo === e.id
                ? "bg-foreground text-background shadow-2xs"
                : "border border-border bg-surface text-foreground hover:border-primary"
            }`}
          >
            {e.rotulo}
          </button>
        ))}
      </div>

      {/* ═══ VISÃO 1: TOP 50 MINAS GERAIS ═══ */}
      {abaVisao === "mg-top50" && (
        <div className="space-y-6">
          <DonutChartResponsivo
            titulo={`Concentração Corporativa em Minas Gerais (${eixoAtivo.toUpperCase()})`}
            subtitulo="Proporção consumida pelas 5 maiores operações filtradas frente ao volume total de referência do Estado de Minas Gerais."
            fatias={donutMg.fatias}
            rotuloCentroTopo="Top 5 Concentra"
            valorCentroPrincipal={`${donutMg.percentualConcentradoTop.toLocaleString("pt-BR")}%`}
            rotuloCentroBase="do total de MG"
            formatarValor={(v) => formatarValorEixo(v, eixoAtivo)}
            unidadeCurta={eixoAtivo === "capital" ? "" : unidadeEixoMg}
          />

          {/* Controles de Busca e Filtros (Qualidade 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="sm:col-span-2 relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar empresa, CNPJ raiz, cidade, bacia ou CNAE..."
                className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <select
                value={filtroMunicipio}
                onChange={(e) => setFiltroMunicipio(e.target.value)}
                aria-label="Filtrar por município"
                className="w-full rounded-xl border border-border bg-surface-2 py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="todos">Todos os municípios ({municipiosUnicos.length})</option>
                {municipiosUnicos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filtroSetor}
                onChange={(e) => setFiltroSetor(e.target.value)}
                aria-label="Filtrar por setor"
                className="w-full rounded-xl border border-border bg-surface-2 py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="todos">Todos os setores</option>
                {setoresUnicos.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOrdemDesc((d) => !d)}
                className="p-2 rounded-xl border border-border bg-surface-2 text-foreground hover:border-primary shrink-0"
                title={ordemDesc ? "Maior para menor" : "Menor para maior"}
              >
                <ArrowUpDown size={16} />
              </button>
            </div>
          </div>

          {/* Tabela Completa Top 50 MG */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface-2 text-xs font-bold uppercase text-muted border-b border-border">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Empresa / Planta Industrial</th>
                  <th className="py-3 px-3">Município & Bacia</th>
                  <th className="py-3 px-3 text-right">Volume ({unidadeEixoMg})</th>
                  <th className="py-3 px-3 text-right">Equiv. Populacional (Água)</th>
                  <th className="py-3 px-3 text-right">Tarifa Empresa vs. Cidadão</th>
                  <th className="py-3 px-3 text-right">Fonte Oficial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {mgFiltrados.map((item, idx) => {
                  const val = valorPorEixoMg(item, eixoAtivo);
                  const url = urlFontePorEixoMg(item, eixoAtivo);
                  const eqHab = calcularEquivalenciaPopulacionalAgua(item.aguaOutorgadaM3Ano);
                  const fatorAgua = Math.round(
                    item.tarifaAguaCidadaoBrlM3 / (item.tarifaAguaEmpresaBrlM3 || 0.025)
                  );

                  return (
                    <tr key={item.id} className="hover:bg-surface-2/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-primary">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3 max-w-md">
                        <div className="font-bold text-foreground">{item.empresa}</div>
                        <div className="text-xs text-muted">
                          Grupo: {item.grupoEconomico} · CNPJ Raiz: {item.cnpjRaiz} · {item.setorCnae}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-foreground">{item.municipioNome}</div>
                        <div className="text-xs text-muted">{item.baciaHidrografica}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-foreground whitespace-nowrap">
                        {formatarValorEixo(val, eixoAtivo)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-muted whitespace-nowrap">
                        {eqHab.toLocaleString("pt-BR")} hab.
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="text-xs font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            R$ {item.tarifaAguaEmpresaBrlM3.toFixed(3)}/m³
                          </span>{" "}
                          vs{" "}
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            R$ {item.tarifaAguaCidadaoBrlM3.toFixed(2)}/m³
                          </span>
                        </div>
                        <div className="text-xs text-muted">
                          Cidadão paga {fatorAgua}× mais na água
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary transition"
                        >
                          <span>Fonte</span>
                          <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ VISÃO 2: 20 PAÍSES DO G20 & MULTINACIONAIS ═══ */}
      {abaVisao === "g20-paises" && (
        <div className="space-y-6">
          <DonutChartResponsivo
            titulo={`Proporção entre as 20 Maiores Economias do G20 (${eixoAtivo.toUpperCase()})`}
            subtitulo="Comparativo internacional combinando FAO Aquastat, World Bank, US EIA, EPA ECHO, ECCC NPRI, Climate TRACE e Eurostat."
            fatias={donutG20.fatias}
            rotuloCentroTopo="Top 5 G20"
            valorCentroPrincipal={`${donutG20.pctTop5.toLocaleString("pt-BR")}%`}
            rotuloCentroBase="do bloco G20"
            formatarValor={(v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
            unidadeCurta={
              eixoAtivo === "agua"
                ? "bi m³/ano"
                : eixoAtivo === "energia"
                ? "TWh/ano"
                : eixoAtivo === "combustivel"
                ? "mil bbl/d"
                : eixoAtivo === "empregos"
                ? "mi trab."
                : "bi USD"
            }
          />

          {/* Filtro por Continente + Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar país do G20, multinacional (Vale, BHP, Exxon, BASF, Aramco) ou setor..."
                className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filtroContinente}
                onChange={(e) => setFiltroContinente(e.target.value)}
                aria-label="Filtrar por continente"
                className="rounded-xl border border-border bg-surface-2 py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="todos">Todos os continentes (20 membros)</option>
                {continentesG20.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOrdemDesc((d) => !d)}
                className="p-2 rounded-xl border border-border bg-surface-2 text-foreground hover:border-primary"
              >
                <ArrowUpDown size={16} />
              </button>
            </div>
          </div>

          {/* Tabela G20 */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface-2 text-xs font-bold uppercase text-muted border-b border-border">
                <tr>
                  <th className="py-3 px-3">País (G20)</th>
                  <th className="py-3 px-3">Água (FAO Aquastat)</th>
                  <th className="py-3 px-3">Energia & Petróleo</th>
                  <th className="py-3 px-3">Tarifa Indústria vs. Cidadão</th>
                  <th className="py-3 px-3">Maiores Corporações Consumidoras</th>
                  <th className="py-3 px-3 text-right">Fontes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {g20Filtrados.map((p) => (
                  <tr key={p.codigoIso3} className="hover:bg-surface-2/40 transition">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-foreground text-base">
                        {p.bandeira} {p.pais}
                      </div>
                      <div className="text-xs text-muted">
                        {p.codigoIso3} · {p.continente}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-foreground">
                        {p.retiradaAguaTotalBilhoesM3Ano.toLocaleString("pt-BR")} bi m³/ano
                      </div>
                      <div className="text-xs text-muted">
                        Agro: {p.pctAguaAgricola}% · Ind: {p.pctAguaIndustrial}% · Dom:{" "}
                        {p.pctAguaDomestica}%
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-foreground">
                        {p.energiaEletricaTotalTwhAno.toLocaleString("pt-BR")} TWh/ano
                      </div>
                      <div className="text-xs text-muted">
                        {p.energiaEletricaKwhPerCapita.toLocaleString("pt-BR")} kWh/hab ·{" "}
                        {p.combustivelPetroleoMilBarrisDia.toLocaleString("pt-BR")} mil bbl/d
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-xs font-mono">
                        ⚡ Ind: <strong>US$ {p.tarifaEnergiaIndustrialUsdKwh.toFixed(3)}</strong> vs
                        Res: <strong>US$ {p.tarifaEnergiaResidencialUsdKwh.toFixed(3)}</strong>/kWh
                      </div>
                      <div className="text-xs font-mono text-muted">
                        💧 Ind: US$ {p.tarifaAguaBrutaIndustrialUsdM3.toFixed(3)} vs Res: US${" "}
                        {p.tarifaAguaResidencialUsdM3.toFixed(2)}/m³
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-md">
                      <div className="text-sm font-semibold text-foreground leading-snug">
                        {p.topCorporacoesConsumidoras}
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        Foco: {p.setorMaisIntensivoAgua}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap space-y-1">
                      <a
                        href={p.urlFonteOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary transition block"
                      >
                        <span>Regulador</span>
                        <ExternalLink size={11} />
                      </a>
                      <a
                        href={p.urlWorldBank}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted hover:text-foreground transition block"
                      >
                        <span>World Bank</span>
                        <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ VISÃO 3: PEGADA HÍDRICA & GERAÇÃO DE EMPREGO POR CNAE ═══ */}
      {abaVisao === "pegada-cnae" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
            <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
              Pegada Hídrica de Exportação vs. Intensidade de Empregos por Setor (CNAE)
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Comparação direta de quantos litros de água e quilowatts-hora são consumidos
              para produzir 1 tonelada de cada commodity exportada e quantos empregos formais
              cada setor gera para cada 1 bilhão de litros de água ou 1 GWh consumido.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {listaPegada.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-border bg-surface-2/40 p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono font-bold text-primary">
                      {p.cnaeAssociado}
                    </span>
                    <h4 className="font-display text-base font-bold text-foreground">
                      {p.produtoOuSetor}
                    </h4>
                    <p className="text-sm text-muted leading-snug">{p.observacaoCivica}</p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-border/60 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">💧 Pegada Hídrica:</span>
                      <span className="font-mono font-bold text-foreground">
                        {p.aguaLitrosPorTonelada.toLocaleString("pt-BR")} L / tonelada
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">⚡ Pegada Elétrica:</span>
                      <span className="font-mono font-bold text-foreground">
                        {p.energiaKwhPorTonelada.toLocaleString("pt-BR")} kWh / tonelada
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">👷 Empregos por 1 bi L de água:</span>
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {p.empregosPorBilhaoLitrosAgua.toLocaleString("pt-BR")} vagas
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">🏭 Empregos por 1 GWh elétrico:</span>
                      <span className="font-mono font-bold text-foreground">
                        {p.empregosPorGwhEnergia.toLocaleString("pt-BR")} vagas
                      </span>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-muted truncate max-w-[200px]">
                        Destino: {p.destinoExportacaoPrincipal}
                      </span>
                      <a
                        href={p.urlFonte}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        <span>Fonte</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ VISÃO 4: MAPA DE CALOR MUNICIPAL (CONCENTRAÇÃO TERRITORIAL MG) ═══ */}
      {abaVisao === "mapa-calor-cidades" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
            <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
              Mapa de Calor Municipal: Cidades que Concentram o Consumo Corporativo em MG
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Municípios mineiros ordenados pela concentração de consumo corporativo no eixo
              selecionado ({eixoAtivo.toUpperCase()}). Clique no município para abrir o painel
              local da cidade.
            </p>

            <div className="space-y-3 pt-2">
              {rankingCidadesCalor.map((cid, index) => {
                const maxVal =
                  eixoAtivo === "agua"
                    ? rankingCidadesCalor[0]?.aguaM3Ano || 1
                    : eixoAtivo === "energia"
                    ? rankingCidadesCalor[0]?.energiaMwhAno || 1
                    : eixoAtivo === "combustivel"
                    ? rankingCidadesCalor[0]?.combustivelLitrosAno || 1
                    : eixoAtivo === "empregos"
                    ? rankingCidadesCalor[0]?.empregos || 1
                    : rankingCidadesCalor[0]?.capitalBrl || 1;

                const valAtual =
                  eixoAtivo === "agua"
                    ? cid.aguaM3Ano
                    : eixoAtivo === "energia"
                    ? cid.energiaMwhAno
                    : eixoAtivo === "combustivel"
                    ? cid.combustivelLitrosAno
                    : eixoAtivo === "empregos"
                    ? cid.empregos
                    : cid.capitalBrl;

                const larguraPct = Math.max(4, Math.min(100, Math.round((valAtual / maxVal) * 100)));
                const slugCidade = semAcento(cid.municipioNome.toLowerCase()).replace(/\s+/g, "-");

                return (
                  <div
                    key={cid.codigoIbge}
                    className="rounded-xl border border-border bg-surface-2/30 p-3.5 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/15 text-primary">
                          #{index + 1}
                        </span>
                        <Link
                          href={`/${slugCidade}`}
                          className="font-bold text-base text-foreground hover:text-primary transition inline-flex items-center gap-1"
                        >
                          <MapPin size={14} className="text-primary" />
                          <span>{cid.municipioNome}</span>
                        </Link>
                        <span className="text-xs text-muted">
                          ({cid.qtdPlantas} megaplanta{cid.qtdPlantas > 1 ? "s" : ""} · {cid.bacia})
                        </span>
                      </div>

                      <div className="font-mono text-sm font-extrabold text-foreground">
                        {formatarValorEixo(valAtual, eixoAtivo)}{" "}
                        {eixoAtivo === "capital" ? "" : unidadeEixoMg}
                      </div>
                    </div>

                    {/* Barra térmica de intensidade */}
                    <div className="h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 via-amber-500 to-rose-600 transition-all duration-500"
                        style={{ width: `${larguraPct}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                      <span>Empresas: {cid.empresas.join(", ")}</span>
                      <span>
                        Equiv. Água:{" "}
                        <strong>
                          {calcularEquivalenciaPopulacionalAgua(cid.aguaM3Ano).toLocaleString("pt-BR")}{" "}
                          hab.
                        </strong>{" "}
                        · Equiv. Energia:{" "}
                        <strong>
                          {calcularEquivalenciaResidencialEnergia(cid.energiaMwhAno).toLocaleString(
                            "pt-BR"
                          )}{" "}
                          casas
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
