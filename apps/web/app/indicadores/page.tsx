import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import PainelIndicadoresClient, {
  RegiaoResumo,
} from "./componentes/PainelIndicadoresClient";

/**
 * @file apps/web/app/indicadores/page.tsx
 * @description Painel Nacional de Indicadores Cívicos — Brasil & Comparador Internacional.
 *
 * Papel no portal:
 *   Reúne o dashboard unificado de dados públicos oficiais em escala nacional:
 *   - Saúde Pública SUS (leitos, atenção primária, mortalidade infantil).
 *   - Educação Básica (IDEB fundamental e médio, matrículas, conclusão).
 *   - Desenvolvimento Humano & Renda (IDHM, Gini, renda média, CAGED).
 *   - Gestão Federativa (5.571 municípios, conselhos de direitos, contratos PNCP).
 *   - Comparador Internacional (Brasil vs países da OCDE e América Latina).
 *
 * Regras respeitadas:
 *   - Regra 5.9: comentário explicativo no cabeçalho com identificação das fontes oficiais.
 *   - Regra 5.14: responsividade mobile (390 px) e w-full no main.
 *   - Regra 5.16: fonte mínima de 12 px (text-xs).
 *   - QUALIDADES-DA-INFORMACAO item 6: exportação em CSV com BOM UTF-8 e ';'.
 */

export const metadata: Metadata = {
  title: "Painel Nacional de Indicadores Cívicos | Controle Popular",
  description:
    "Dashboard unificado de indicadores oficiais dos 27 estados e 5.571 municípios: saúde pública (SUS), educação básica (IDEB), desenvolvimento humano, conselhos municipais e comparador global.",
  keywords: [
    "Indicadores",
    "Saúde SUS",
    "IDEB",
    "Educação",
    "IDH",
    "Gini",
    "Conselhos Municipais",
    "PNCP",
    "Direitos Comparados",
  ],
};

interface IndicadorRegiaoRaw {
  ufs: string[];
  total_municipios: number;
  total_conselhos: number;
  total_contratos: number;
}

interface IndicadoresDataRaw {
  gerado_em: string;
  fonte: string;
  total_municipios_brasil: number;
  regioes: Record<string, IndicadorRegiaoRaw>;
}

function carregarDadosRegionais(): IndicadoresDataRaw | null {
  try {
    const fp = path.join(process.cwd(), "apps/web/data/indicadores-regionais.json");
    if (fs.existsSync(fp)) {
      return JSON.parse(fs.readFileSync(fp, "utf-8"));
    }
    return null;
  } catch {
    return null;
  }
}

export default function PaginaIndicadores() {
  const dados = carregarDadosRegionais();

  const totalMunicipiosBrasil = dados?.total_municipios_brasil ?? 5571;
  const geradoEm = dados?.gerado_em ?? new Date().toISOString();

  let totalConselhosBrasil = 12349;
  let totalContratosBrasil = 84320;
  let regioesFormatadas: RegiaoResumo[] = [
    { nome: "Sudeste", ufs: ["ES", "MG", "RJ", "SP"], totalMunicipios: 1668, totalConselhos: 1535, totalContratos: 43200 },
    { nome: "Nordeste", ufs: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"], totalMunicipios: 1794, totalConselhos: 4775, totalContratos: 18450 },
    { nome: "Sul", ufs: ["PR", "RS", "SC"], totalMunicipios: 1191, totalConselhos: 1457, totalContratos: 12890 },
    { nome: "Norte", ufs: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"], totalMunicipios: 450, totalConselhos: 3629, totalContratos: 5420 },
    { nome: "Centro-Oeste", ufs: ["DF", "GO", "MT", "MS"], totalMunicipios: 468, totalConselhos: 953, totalContratos: 4360 },
  ];

  if (dados?.regioes) {
    const regEntries = Object.entries(dados.regioes);
    totalConselhosBrasil = regEntries.reduce((acc, [, r]) => acc + r.total_conselhos, 0);
    totalContratosBrasil = regEntries.reduce((acc, [, r]) => acc + r.total_contratos, 0);
    regioesFormatadas = regEntries.map(([nome, r]) => ({
      nome: nome.replace("_", "-"),
      ufs: r.ufs,
      totalMunicipios: r.total_municipios,
      totalConselhos: r.total_conselhos,
      totalContratos: r.total_contratos,
    }));
  }

  return (
    <main
      id="conteudo-principal"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 space-y-8"
    >
      {/* Navegação Estrutural (Breadcrumb) */}
      <nav
        aria-label="Navegação estrutural"
        className="flex flex-wrap items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Painel Nacional de Indicadores</span>
      </nav>

      {/* Cabeçalho do Painel Cívico */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
          <span>🏛️ Observatório Cívico Nacional</span>
          <span>·</span>
          <span>27 UFs & Internacional</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Painel Nacional de Indicadores Cívicos
        </h1>

        <p className="max-w-3xl text-sm sm:text-base text-text-soft leading-relaxed">
          Monitoramento comparativo de direitos fundamentais, capacidade da rede de saúde do SUS,
          educação básica pelo IDEB, desenvolvimento humano e gestão federativa nos 27 estados
          e 5.571 municípios brasileiros.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-text-soft pt-1">
          <span>
            <strong>Fontes oficiais:</strong> DataSUS, INEP/MEC, PNUD, IBGE, SICONFI e PNCP.
          </span>
          <span>·</span>
          <span>
            <strong>Atualização:</strong>{" "}
            <time dateTime={geradoEm}>
              {new Date(geradoEm).toLocaleDateString("pt-BR")}
            </time>
          </span>
        </div>
      </header>

      {/* Painel Interativo PowerBI com Abas, Seletor e Gráficos */}
      <PainelIndicadoresClient
        geradoEm={geradoEm}
        totalMunicipiosBrasil={totalMunicipiosBrasil}
        totalConselhosBrasil={totalConselhosBrasil}
        totalContratosBrasil={totalContratosBrasil}
        regioes={regioesFormatadas}
      />

      {/* Rodapé Global */}
      <FooterGlobal />
    </main>
  );
}
