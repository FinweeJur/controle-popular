import type { Metadata } from "next";
import Link from "next/link";
import {
  obterUrfbiosCar,
  obterEstatisticasCar,
  listarRegistrosCar,
} from "@/lib/ambiental/car";
import { formatNumberBR } from "@/lib/betim/format";
import TabelaCar, { type ImovelCar } from "./TabelaCar";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = {
  title: "Cadastro Ambiental Rural (CAR) em Minas Gerais — IEF e CAR 2.0 | Meio Ambiente (ONSA)",
  description:
    "Radiografia dos 1,16 milhão de imóveis do CAR em Minas Gerais sob gestão do IEF/MG nas 14 URFBios: tempo médio de espera de 1.564 dias (~4,3 anos), análise por setor, porte e consulta oficial auditada.",
};

export default function PaginaCarAmbiental() {
  const urfbios = obterUrfbiosCar();
  const estatisticas = obterEstatisticasCar();
  const registrosBrutos = listarRegistrosCar();

  // Mapeamento normalizado para o componente TabelaCar
  const registrosTabela: ImovelCar[] = registrosBrutos.map((r) => ({
    id: r.codigoCar,
    codigoCar: r.codigoCar,
    nomeImovel: `Imóvel Rural (${r.municipio})`,
    municipio: r.municipio,
    codIbge: r.codigoIbge,
    urfbio: r.urfbio,
    porte: r.porte,
    modulosFiscais: r.modulosFiscais,
    areaHa: r.areaHectares,
    setor: r.setor,
    status: r.status,
    dataCadastro: r.dataInscricao,
    tempoAnaliseDias: r.tempoAnaliseDias,
    linkConsultaSicar: r.linkOficial,
    linkConsultaCar20: `https://csr.ufmg.br/car20_mg/consultar-car/?car=${encodeURIComponent(r.codigoCar)}`,
  }));

  // Ordenação das URFBios por tempo de análise decrescente para o gráfico comparativo
  const urfbiosPorTempo = [...urfbios].sort(
    (a, b) => b.tempoMedioAnaliseDias - a.tempoMedioAnaliseDias
  );
  const maxTempoDias = Math.max(...urfbios.map((u) => u.tempoMedioAnaliseDias), 1800);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <Link href="/ambiental" className="hover:underline">ONSA</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Cadastro Ambiental Rural (CAR / IEF MG)</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            IEF / Sisema MG
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            CAR 2.0 MG (CSR / UFMG)
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            SICAR Nacional (MAPA / MMA)
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            14 Polos Regionais (URFBios)
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
          Cadastro Ambiental Rural (CAR) em Minas Gerais
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg max-w-4xl">
          A radiografia da fila de regularização ambiental no Instituto Estadual de Florestas (IEF/MG):
          mais de <strong>1,16 milhão de imóveis</strong> cadastrados, com <strong>76,9% da base represada</strong> em
          análise e tempo médio de espera superior a <strong>4 anos (1.564 dias)</strong>.
          Dados consolidados pelas 14 Unidades Regionais de Florestas e Biodiversidade (URFBios),
          com cortes por setor, porte em módulos fiscais e busca auditável.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-emerald-600 pl-4 text-sm italic text-muted">
          &ldquo;O real não está na saída nem na chegada: ele se dispõe para a gente é no meio da travessia.&rdquo;
          — João Guimarães Rosa, Grande Sertão: Veredas, 1956
        </p>
      </header>

      {/* ═══ CARTÕES DE TOPO (REGRA DAS 5 COISAS - ITEM 2) ═══ */}
      <section aria-label="Indicadores gerais do CAR em Minas Gerais" className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total de Imóveis no Estado</span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">
            {formatNumberBR(estatisticas.totalImoveis)}
          </p>
          <span className="mt-1 block text-xs text-muted">
            100% dos 853 municípios mineiros mapeados
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Área Rural Cadastrada</span>
          <p className="mt-2 font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {(estatisticas.areaTotalHectares / 1_000_000).toFixed(2)} mi ha
          </p>
          <span className="mt-1 block text-xs text-muted">
            Cobre ~72,8% do território de Minas Gerais
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Tempo Médio de Espera</span>
          <p className="mt-2 font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
            {formatNumberBR(estatisticas.tempoMedioAnaliseDias)} dias
          </p>
          <span className="mt-1 block text-xs text-muted">
            Média de ~4,3 anos aguardando validação do IEF
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Represados em Análise</span>
          <p className="mt-2 font-display text-3xl font-bold text-rose-600 dark:text-rose-400">
            {estatisticas.percentualEmAnalise.toFixed(1)}%
          </p>
          <span className="mt-1 block text-xs text-muted">
            895 mil imóveis em fila ou pendentes de retificação
          </span>
        </div>
      </section>

      {/* ═══ GRÁFICOS INLINE (REGRA DAS 5 COISAS - ITEM 1) ═══ */}
      <section aria-label="Gráficos de tempo de análise e porte" className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico 1: Tempo Médio de Análise por Polo Regional (URFBio) */}
        <div className="rounded-2xl border border-border bg-surface-2 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Tempo Médio de Análise por Polo Regional (URFBio)
              </h2>
              <p className="text-xs text-muted">
                Em dias de espera acumulada desde a inscrição no SICAR
              </p>
            </div>
            <span className="rounded-md bg-surface-3 px-2 py-1 text-[11px] font-mono font-semibold text-muted">
              14 URFBios
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {urfbiosPorTempo.map((u) => {
              const pct = Math.round((u.tempoMedioAnaliseDias / maxTempoDias) * 100);
              const anos = (u.tempoMedioAnaliseDias / 365).toFixed(1);
              return (
                <div key={u.id} className="text-xs">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {u.nome} <span className="text-muted">({u.sede})</span>
                    </span>
                    <span className="font-mono text-muted">
                      <strong>{formatNumberBR(u.tempoMedioAnaliseDias)} d</strong> ({anos} anos)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        u.tempoMedioAnaliseDias > 1600
                          ? "bg-rose-500"
                          : u.tempoMedioAnaliseDias > 1500
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico 2: Distribuição por Porte e Setor Econômico */}
        <div className="rounded-2xl border border-border bg-surface-2 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-base font-bold text-foreground">
                Perfil Territorial: Porte por Módulos Fiscais (MF)
              </h2>
              <p className="text-xs text-muted">
                Minas Gerais é predominantemente minifundiária e familiar no CAR
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-medium text-foreground">
                    Pequeno Porte (até 4 Módulos Fiscais — MF)
                  </span>
                  <span className="font-mono text-muted">
                    {formatNumberBR(estatisticas.distribuicaoPorte.pequeno)} imóveis (<strong>92,8%</strong>)
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500" style={{ width: "92.8%" }} />
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  Agricultura familiar, posseiros e pequenos sitiantes: prioridade legal da Lei 12.651/2012.
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-medium text-foreground">
                    Médio Porte (4 a 15 Módulos Fiscais)
                  </span>
                  <span className="font-mono text-muted">
                    {formatNumberBR(estatisticas.distribuicaoPorte.medio)} imóveis (<strong>5,3%</strong>)
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-blue-600 dark:bg-blue-500" style={{ width: "5.3%" }} />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-medium text-foreground">
                    Grande Porte (&gt; 15 Módulos Fiscais)
                  </span>
                  <span className="font-mono text-muted">
                    {formatNumberBR(estatisticas.distribuicaoPorte.grande)} imóveis (<strong>1,9%</strong>)
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-purple-600 dark:bg-purple-500" style={{ width: "1.9%" }} />
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  Grandes fazendas, empresas de silvicultura (eucalipto/celulose) e mineradoras.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-surface-1 p-3.5 text-xs">
            <span className="font-semibold text-foreground">💡 O que é Módulo Fiscal em MG?</span>
            <p className="mt-1 text-muted leading-relaxed">
              O Módulo Fiscal é fixado pelo INCRA para cada município (varia de 18 ha na Zona da Mata a 70 ha no Norte/Noroeste).
              Um imóvel de 4 MF em Unaí pode ter 280 hectares, enquanto em Ubá atinge apenas 72 hectares.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ AS TRÊS RESSALVAS DO DADO (CONFORMIDADE AGENTS.MD §7) ═══ */}
      <section aria-label="Ressalvas institucionais do acervo CAR" className="mb-10 rounded-2xl border border-dashed border-border bg-surface-1 p-5 text-xs text-muted leading-relaxed">
        <h3 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-1.5">
          <span>⚠️</span> Três ressalvas essenciais que acompanham este dado público:
        </h3>
        <ul className="space-y-1.5 list-disc pl-4">
          <li>
            <strong>O CAR é autodeclaratório:</strong> A inscrição no SICAR reflete o perímetro desenhado pelo proprietário
            ou posseiro. A existência do registro não equivale à regularidade ambiental nem à titulação fundiária da terra.
          </li>
          <li>
            <strong>O gargalo crônico do Estado:</strong> Com mais de 76% da base ainda em análise pelo IEF/MG, o tempo médio
            de espera de 1.564 dias gera insegurança tanto para quem preserva quanto para o combate a fraudes e sobreposições.
          </li>
          <li>
            <strong>Proteção de dados e links oficiais:</strong> Este portal não armazena nem expõe nomes ou CPFs de pessoas físicas.
            Cada linha disponibiliza hiperlink direto para a consulta oficial auditada no SICAR federal e na plataforma CAR 2.0 MG (CSR/UFMG).
          </li>
        </ul>
      </section>

      {/* ═══ TABELA INTERATIVA (REGRA DAS 5 COISAS - ITENS 3, 4 E 5) ═══ */}
      <section aria-label="Tabela e busca de registros CAR">
        <TabelaCar
          registros={registrosTabela}
          urfbios={urfbios.map((u) => u.nome)}
        />
      </section>

      {/* SEÇÃO RELACIONADA */}
      <div className="mt-12 border-t border-border pt-8">
        <MeioAmbienteRelacionado />
      </div>

      <FooterGlobal />
    </div>
  );
}
