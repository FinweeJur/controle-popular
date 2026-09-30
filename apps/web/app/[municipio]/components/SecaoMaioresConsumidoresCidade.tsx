"use client";

/**
 * @file apps/web/app/[municipio]/components/SecaoMaioresConsumidoresCidade.tsx
 * @description Seção interativa "Maiores Consumidores e Empregadores" exibida na
 * página principal de cada município (/[municipio]), logo abaixo dos indicadores econômicos.
 *
 * Papel no portal:
 * Apresenta o Top 5 de empresas consumidoras de água, energia e combustível, maiores
 * empregadoras e movimentadoras de capital na cidade/região, acompanhado de Gráfico
 * de Rosca (Donut Chart) SVG responsivo, comparativo de tarifa Empresa vs. Cidadão
 * e equivalência de abastecimento populacional.
 *
 * Decisões técnicas (AGENTS.md §5.1, §5.10 e §8):
 * - Recebe apenas escalares (codigoIbge, nomeMunicipio) como props para zero inflação de RSC payload.
 * - Legenda e descrições respeitam o piso text-sm (14px) para leitura clara no celular e PC.
 * - Todos os itens possuem link direto para a fonte oficial pública (IGAM, ANA, CCEE, ANP, RAIS, CVM).
 */

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Droplets,
  Zap,
  Fuel,
  Users,
  Landmark,
  Scale,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Building2,
} from "lucide-react";
import DonutChartResponsivo from "@/app/components/charts/DonutChartResponsivo";
import {
  obterTop5ConsumidoresPorMunicipio,
  gerarFatiasDonutMg,
  valorPorEixoMg,
  urlFontePorEixoMg,
  calcularEquivalenciaPopulacionalAgua,
  type EixoRecurso,
} from "@/lib/recursos/dados-consumidores";

interface SecaoMaioresConsumidoresCidadeProps {
  codigoIbge: string;
  nomeMunicipio: string;
}

const ABAS_EIXOS: {
  id: EixoRecurso;
  rotulo: string;
  icone: React.ComponentType<{ size?: number; className?: string }>;
  unidade: string;
  descricaoEixo: string;
}[] = [
  {
    id: "agua",
    rotulo: "Água",
    icone: Droplets,
    unidade: "m³/ano",
    descricaoEixo: "Volume anual de água bruta outorgada (superficial e subterrânea) no IGAM e na ANA.",
  },
  {
    id: "energia",
    rotulo: "Energia",
    icone: Zap,
    unidade: "MWh/ano",
    descricaoEixo: "Consumo anual de energia elétrica em alta tensão no Mercado Livre (CCEE) e rede básica.",
  },
  {
    id: "combustivel",
    rotulo: "Combustível",
    icone: Fuel,
    unidade: "L/ano",
    descricaoEixo: "Consumo anual estimado de óleo diesel mineral, óleo combustível e gás industrial (ANP / Climate TRACE).",
  },
  {
    id: "empregos",
    rotulo: "Empregos",
    icone: Users,
    unidade: "vínculos",
    descricaoEixo: "Estoque de empregos formais diretos com carteira assinada registrados na RAIS/CAGED.",
  },
  {
    id: "capital",
    rotulo: "Capital",
    icone: Landmark,
    unidade: "R$/ano",
    descricaoEixo: "Receita operacional, valor econômico movimentado e base de cálculo da CFEM/ICMS.",
  },
];

function formatarNumeroCompacto(valor: number, eixo: EixoRecurso): string {
  if (eixo === "capital") {
    if (valor >= 1_000_000_000) {
      return `R$ ${(valor / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bi`;
    }
    if (valor >= 1_000_000) {
      return `R$ ${(valor / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
    }
    return `R$ ${valor.toLocaleString("pt-BR")}`;
  }

  if (valor >= 1_000_000_000) {
    return `${(valor / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} bi`;
  }
  if (valor >= 1_000_000) {
    return `${(valor / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  }
  return valor.toLocaleString("pt-BR");
}

export default function SecaoMaioresConsumidoresCidade({
  codigoIbge,
  nomeMunicipio,
}: SecaoMaioresConsumidoresCidadeProps) {
  const [eixoAtivo, setEixoAtivo] = useState<EixoRecurso>("agua");

  const resumoCidade = useMemo(
    () => obterTop5ConsumidoresPorMunicipio(codigoIbge, nomeMunicipio, eixoAtivo),
    [codigoIbge, nomeMunicipio, eixoAtivo]
  );

  const dadosDonut = useMemo(
    () => gerarFatiasDonutMg(resumoCidade.itensTop5, eixoAtivo, 5),
    [resumoCidade.itensTop5, eixoAtivo]
  );

  const abaAtual = ABAS_EIXOS.find((a) => a.id === eixoAtivo) ?? ABAS_EIXOS[0];

  return (
    <section
      aria-labelledby="heading-maiores-consumidores-cidade"
      className="mt-14 rounded-3xl border border-border bg-surface p-5 sm:p-8 shadow-xs space-y-6"
    >
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/70 pb-5">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Building2 size={14} />
              <span>Pressão sobre Recursos & Poder Econômico</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
              {resumoCidade.temPlantaMegaconsumidoraLocal
                ? `Plantas industriais instaladas em ${nomeMunicipio} + Rede Estadual`
                : `Operadores estaduais e bacia regional de ${nomeMunicipio}`}
            </span>
          </div>

          <h2
            id="heading-maiores-consumidores-cidade"
            className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground"
          >
            Top 5 Maiores Consumidores de Água, Energia, Combustível e Empregos —{" "}
            {nomeMunicipio}
          </h2>

          <p className="text-sm text-muted leading-relaxed">
            Quem mais consome água outorgada, energia elétrica e combustível, quem
            mais emprega e quanto uma grande corporação paga por recurso em comparação
            à conta paga pelo cidadão de {nomeMunicipio}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href={`/assistente?pergunta=${encodeURIComponent(
              `Quais são os maiores consumidores de água e energia em ${nomeMunicipio} e quanto pagam de tarifa?`
            )}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-primary hover:border-primary transition"
          >
            <Sparkles size={14} />
            <span>Perguntar ao Seu Nonô</span>
          </Link>

          <Link
            href="/consumo-corporativo"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white hover:opacity-95 transition shadow-2xs"
          >
            <span>Ranking Top 50 MG + G20</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Seletor de 5 Abas Temáticas */}
      <div
        role="tablist"
        aria-label="Selecionar eixo de consumo ou emprego"
        className="flex flex-wrap gap-2"
      >
        {ABAS_EIXOS.map((aba) => {
          const Icone = aba.icone;
          const ativo = aba.id === eixoAtivo;
          return (
            <button
              key={aba.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setEixoAtivo(aba.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                ativo
                  ? "bg-primary text-white shadow-xs"
                  : "border border-border bg-surface-2 text-foreground hover:border-primary/50"
              }`}
            >
              <Icone size={16} />
              <span>{aba.rotulo}</span>
            </button>
          );
        })}
      </div>

      {/* Cartões Proativos: Assimetria Tarifária (Empresa vs. Cidadão) e Equivalência Humana */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            <span>💧 Custo da Água (1 m³ = 1.000 L)</span>
            <Scale size={15} />
          </div>
          <div className="flex items-baseline justify-between gap-2 pt-1">
            <div>
              <span className="text-xs text-muted block">Grande Empresa (Outorga):</span>
              <span className="font-mono text-lg font-extrabold text-foreground">
                R$ {resumoCidade.tarifaMediaAguaEmpresaBrlM3.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted block">Morador (Tarifa Residencial):</span>
              <span className="font-mono text-lg font-extrabold text-rose-600 dark:text-rose-400">
                R$ {resumoCidade.tarifaMediaAguaCidadaoBrlM3.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted pt-1">
            O cidadão paga cerca de{" "}
            <strong className="text-foreground">
              {resumoCidade.fatorDesigualdadeAgua}× mais caro
            </strong>{" "}
            por litro de água tratada do que a cobrança de captação bruta corporativa.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <span>⚡ Custo da Energia (1 kWh)</span>
            <Zap size={15} />
          </div>
          <div className="flex items-baseline justify-between gap-2 pt-1">
            <div>
              <span className="text-xs text-muted block">Grande Indústria (Mercado Livre):</span>
              <span className="font-mono text-lg font-extrabold text-foreground">
                R$ {resumoCidade.tarifaMediaEnergiaEmpresaBrlKwh.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted block">Morador (Conta Cativa):</span>
              <span className="font-mono text-lg font-extrabold text-rose-600 dark:text-rose-400">
                R$ {resumoCidade.tarifaMediaEnergiaCidadaoBrlKwh.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted pt-1">
            Na conta residencial o trabalhador paga{" "}
            <strong className="text-foreground">
              {resumoCidade.fatorDesigualdadeEnergia}× mais por kWh
            </strong>{" "}
            do que megaconsumidores livres na CCEE.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            <span>🏘️ Equivalência Populacional</span>
            <Users size={15} />
          </div>
          <div className="pt-1">
            <span className="font-mono text-xl font-extrabold text-foreground block">
              {resumoCidade.equivalenciaHabitantesAguaTop5.toLocaleString("pt-BR")} habitantes
            </span>
            <span className="text-xs text-muted block">
              abastecidos em água pelo consumo somado deste Top 5 (padrão OMS 110 L/dia)
            </span>
          </div>
          <p className="text-sm text-muted pt-1">
            Em eletricidade, o Top 5 consome o equivalente a{" "}
            <strong className="text-foreground">
              {resumoCidade.equivalenciaResidenciasEnergiaTop5.toLocaleString("pt-BR")} famílias
            </strong>
            .
          </p>
        </div>
      </div>

      {/* Gráfico Donut SVG + Legenda Lateral Responsiva */}
      <DonutChartResponsivo
        titulo={`Proporção de ${abaAtual.rotulo}: Top 5 vs. Total Estadual de Referência (MG)`}
        subtitulo={abaAtual.descricaoEixo}
        fatias={dadosDonut.fatias}
        rotuloCentroTopo={`Top 5 (${abaAtual.rotulo})`}
        valorCentroPrincipal={`${dadosDonut.percentualConcentradoTop.toLocaleString("pt-BR")}%`}
        rotuloCentroBase="do total estadual MG"
        formatarValor={(v) => formatarNumeroCompacto(v, eixoAtivo)}
        unidadeCurta={eixoAtivo === "capital" ? "" : abaAtual.unidade}
      />

      {/* Tabela Compacta Auditável do Top 5 */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-2/20">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-surface-2 text-xs font-bold uppercase text-muted border-b border-border">
            <tr>
              <th className="py-3 px-3">#</th>
              <th className="py-3 px-3">Empresa / Operação</th>
              <th className="py-3 px-3">Vínculo Territorial</th>
              <th className="py-3 px-3 text-right">Volume ({abaAtual.rotulo})</th>
              <th className="py-3 px-3 text-right">Equivalência Humana (Água)</th>
              <th className="py-3 px-3 text-right">Fonte Oficial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {resumoCidade.itensTop5.map((item, idx) => {
              const valorEixo = valorPorEixoMg(item, eixoAtivo);
              const urlOficial = urlFontePorEixoMg(item, eixoAtivo);
              const eqHab = calcularEquivalenciaPopulacionalAgua(item.aguaOutorgadaM3Ano);

              return (
                <tr key={item.id} className="hover:bg-surface-2/40 transition">
                  <td className="py-3 px-3 font-mono font-bold text-primary">
                    #{idx + 1}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-foreground">{item.empresa}</div>
                    <div className="text-xs text-muted">
                      CNPJ Raiz: {item.cnpjRaiz} · {item.setorCnae}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                        item.escopoLocal === "Planta Local no Município"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      {item.escopoLocal} ({item.municipioNome})
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                    {formatarNumeroCompacto(valorEixo, eixoAtivo)}{" "}
                    {eixoAtivo === "capital" ? "" : abaAtual.unidade}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-muted whitespace-nowrap">
                    {eqHab.toLocaleString("pt-BR")} hab.
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <a
                      href={urlOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary transition"
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
    </section>
  );
}
