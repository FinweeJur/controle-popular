"use client";

/**
 * @file WidgetRastreabilidadeTransnacional.tsx
 * @description Simulador interativo do fluxo mineral e societário transnacional (Brasil ↔ Exterior).
 *
 * Papel no portal:
 * Permite ao cidadão rastrear a rota do minério: da mina no Brasil até a bolsa no exterior.
 * Demonstra a conexão entre cidades mineradas em MG/PA, bolsas de valores e fundos acionistas globais.
 *
 * Regras e decisões:
 * - Links canônicos diretos para órgãos oficiais (ANM, SEC, TSX, Ouvidoria CORE).
 * - Frases de até 13 palavras nos textos de interface (AGENTS.md §12).
 * - Visualização vetorial leve em CSS e SVG sem dependências externas pesadas.
 */

import React, { useState } from "react";
import { Globe, ArrowRight, ExternalLink, ShieldCheck, Factory, Ship, Landmark, Banknote } from "lucide-react";

interface CadeiaMineral {
  id: string;
  mineral: string;
  empresa: string;
  paisOrigemSede: string;
  bandeira: string;
  minaBrasil: {
    nome: string;
    municipio: string;
    processosAnm: number;
    anmUrl: string;
  };
  escoamento: {
    porto: string;
    destino: string;
  };
  bolsaExterior: {
    bolsa: string;
    ticker: string;
    relatorioUrl: string;
  };
  acionistasFundos: {
    nomes: string[];
    marcoregulador: string;
  };
}

const CADEIAS: CadeiaMineral[] = [
  {
    id: "litio",
    mineral: "Lítio das Baterias",
    empresa: "Sigma Lithium Corp",
    paisOrigemSede: "Canadá (Vancouver/TSX)",
    bandeira: "🇨🇦",
    minaBrasil: {
      nome: "Grota do Cirilo",
      municipio: "Araçuaí e Itinga (MG)",
      processosAnm: 29,
      anmUrl: "https://sigmine.anm.gov.br",
    },
    escoamento: {
      porto: "Porto de Vitória (ES)",
      destino: "Mercado asiático e automotivo global",
    },
    bolsaExterior: {
      bolsa: "Toronto Stock Exchange (TSX-V: SGML)",
      ticker: "SGML / NASDAQ",
      relatorioUrl: "https://www.sedarplus.ca",
    },
    acionistasFundos: {
      nomes: ["A10 Invest", "Fundos globais de transição energética"],
      marcoregulador: "Ouvidoria CORE do Canadá e dever de consulta prévia.",
    },
  },
  {
    id: "ferro",
    mineral: "Minério de Ferro",
    empresa: "Vale S.A. / BHP Billiton",
    paisOrigemSede: "Brasil / Reino Unido e Austrália",
    bandeira: "🇬🇧 🇦🇺",
    minaBrasil: {
      nome: "Complexos Itabira e Mariana",
      municipio: "Itabira e Mariana (MG)",
      processosAnm: 142,
      anmUrl: "https://app.anm.gov.br/SIGBM/Publico/GerenciarDanos",
    },
    escoamento: {
      porto: "Porto de Tubarão (ES)",
      destino: "Porto de Roterdã (Holanda) e China",
    },
    bolsaExterior: {
      bolsa: "New York Stock Exchange (NYSE: VALE)",
      ticker: "NYSE: VALE / B3: VALE3",
      relatorioUrl: "https://www.sec.gov/edgar/searchedgar/companysearch",
    },
    acionistasFundos: {
      nomes: ["Previ", "BlackRock (EUA)", "Manara Minerals (Arábia Saudita)", "Mitsui (Japão)"],
      marcoregulador: "High Court de Londres (Mariana) e EUDR europeu.",
    },
  },
  {
    id: "aluminio",
    mineral: "Bauxita e Alumínio",
    empresa: "Norsk Hydro",
    paisOrigemSede: "Noruega / Europa",
    bandeira: "🇳🇴",
    minaBrasil: {
      nome: "Mineração Paragominas e Alunorte",
      municipio: "Paragominas e Barcarena (PA)",
      processosAnm: 38,
      anmUrl: "https://dados.gov.br/dados/conjuntos-dados/licenciamento-ambiental-federal",
    },
    escoamento: {
      porto: "Porto de Vila do Conde (PA)",
      destino: "Europa e América do Norte",
    },
    bolsaExterior: {
      bolsa: "Oslo Stock Exchange (OSE: NHY)",
      ticker: "OSE: NHY",
      relatorioUrl: "https://www.hydro.com",
    },
    acionistasFundos: {
      nomes: ["Fundo Soberano da Noruega", "Investidores institucionais"],
      marcoregulador: "Diretiva de Devida Diligência CSDDD da União Europeia.",
    },
  },
  {
    id: "niobio",
    mineral: "Nióbio e Fosfatos",
    empresa: "CMOC Brasil",
    paisOrigemSede: "China (Luoyang)",
    bandeira: "🇨🇳",
    minaBrasil: {
      nome: "Minas Chapadão e Boa Vista",
      municipio: "Catalão e Ouvidor (GO)",
      processosAnm: 24,
      anmUrl: "https://sigmine.anm.gov.br",
    },
    escoamento: {
      porto: "Porto de Santos (SP)",
      destino: "Siderúrgicas na China, Ásia e Europa",
    },
    bolsaExterior: {
      bolsa: "Hong Kong Stock Exchange (HKEX: 3993)",
      ticker: "HKEX: 3993",
      relatorioUrl: "https://www.hkex.com.hk",
    },
    acionistasFundos: {
      nomes: ["Cathay Fortune", "China Molybdenum Co.", "Fundos estatais"],
      marcoregulador: "Controle cambial e acordos bilaterais Brasil-China.",
    },
  },
];

export default function WidgetRastreabilidadeTransnacional() {
  const [cadeiaAtiva, setCadeiaAtiva] = useState(CADEIAS[0].id);
  const atual = CADEIAS.find((c) => c.id === cadeiaAtiva) || CADEIAS[0];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <Globe size={12} aria-hidden="true" />
            Fluxo Transnacional de Recursos
          </span>
          <h3 className="mt-1.5 text-base font-bold text-text">
            Rastreabilidade Mineral e Societária
          </h3>
          <p className="text-xs text-text-soft">
            Acompanhe a rota do minério: do solo brasileiro até as bolsas mundiais.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CADEIAS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCadeiaAtiva(c.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                c.id === cadeiaAtiva
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-surface-2 text-text-soft hover:bg-surface hover:text-text"
              }`}
            >
              {c.bandeira} {c.mineral.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Diagrama de fluxo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Etapa 1: Mina no Brasil */}
        <div className="rounded-xl border border-border bg-surface-2/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="flex items-center gap-1">
              <Factory size={13} />
              1. Mina no Brasil
            </span>
            <span>🇧🇷</span>
          </div>
          <div className="font-semibold text-xs text-text">{atual.minaBrasil.nome}</div>
          <div className="text-[11px] text-text-soft">{atual.minaBrasil.municipio}</div>
          <div className="pt-1 text-[11px] text-text-soft">
            <span className="font-semibold text-text">{atual.minaBrasil.processosAnm}</span> processos minerários ativos.
          </div>
          <a
            href={atual.minaBrasil.anmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
          >
            Consultar ANM <ExternalLink size={10} />
          </a>
        </div>

        {/* Etapa 2: Escoamento */}
        <div className="rounded-xl border border-border bg-surface-2/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-sky-600 dark:text-sky-400 font-bold">
            <span className="flex items-center gap-1">
              <Ship size={13} />
              2. Logística & Porto
            </span>
            <span>⚓</span>
          </div>
          <div className="font-semibold text-xs text-text">{atual.escoamento.porto}</div>
          <div className="text-[11px] text-text-soft">Destino: {atual.escoamento.destino}</div>
          <div className="pt-1 text-[11px] text-text-soft">
            Ferrovias e portos de escoamento marítimo internacional.
          </div>
        </div>

        {/* Etapa 3: Bolsa no Exterior */}
        <div className="rounded-xl border border-border bg-surface-2/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-bold">
            <span className="flex items-center gap-1">
              <Landmark size={13} />
              3. Bolsa no Exterior
            </span>
            <span>{atual.bandeira}</span>
          </div>
          <div className="font-semibold text-xs text-text">{atual.bolsaExterior.ticker}</div>
          <div className="text-[11px] text-text-soft">{atual.bolsaExterior.bolsa}</div>
          <div className="pt-1 text-[11px] text-text-soft">
            Prestação de contas contábeis e formulários anuais.
          </div>
          <a
            href={atual.bolsaExterior.relatorioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-medium"
          >
            Relatórios oficiais <ExternalLink size={10} />
          </a>
        </div>

        {/* Etapa 4: Acionistas & Governança */}
        <div className="rounded-xl border border-border bg-surface-2/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold">
            <span className="flex items-center gap-1">
              <Banknote size={13} />
              4. Fundos Acionistas
            </span>
            <span>🌐</span>
          </div>
          <div className="font-semibold text-xs text-text">
            {atual.acionistasFundos.nomes[0]}
          </div>
          <div className="text-[11px] text-text-soft">
            {atual.acionistasFundos.nomes.slice(1).join(", ")}
          </div>
          <div className="pt-1 text-[10px] text-text-soft border-t border-border mt-1">
            <ShieldCheck size={11} className="inline mr-1 text-emerald-600" />
            {atual.acionistasFundos.marcoregulador}
          </div>
        </div>
      </div>
    </div>
  );
}
