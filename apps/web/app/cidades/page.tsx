import Link from "next/link";
import {
  listarCidadesEstrategicas,
  obterEstatisticasExpansao,
} from "@/lib/cidades/estrategicas";
import TabelaCidadesClient from "./TabelaCidadesClient";
import PainelDialogo from "@/app/components/PainelDialogo";

export const metadata = {
  title: "Plano de Expansão Nacional — 199 Cidades Estratégicas | Controle Popular",
  description:
    "Mapa mestre das 27 capitais de estado e 172 polos regionais do interior atendidos pelo Controle Popular com códigos IBGE e DATASUS.",
};

export default function PaginaCidadesEstrategicas() {
  const cidades = listarCidadesEstrategicas();
  const stats = obterEstatisticasExpansao();

  // Gráfico de distribuição por região
  const regioes = [
    { nome: "Nordeste", total: stats.distribuicaoRegiao.Nordeste, cor: "#0284c7" },
    { nome: "Sudeste", total: stats.distribuicaoRegiao.Sudeste, cor: "#16a34a" },
    { nome: "Sul", total: stats.distribuicaoRegiao.Sul, cor: "#9333ea" },
    { nome: "Norte", total: stats.distribuicaoRegiao.Norte, cor: "#ca8a04" },
    { nome: "Centro-Oeste", total: stats.distribuicaoRegiao["Centro-Oeste"], cor: "#ea580c" },
  ];
  const maxRegiao = Math.max(...regioes.map((r) => r.total));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* BREADCRUMB */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Expansão Nacional</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            Plano Mestre Nacional
          </span>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-0.5 text-xs text-muted">
            IBGE + DATASUS
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          199 Cidades Estratégicas do Brasil
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          O portal Controle Popular expande sua fiscalização cidadã para as 27 Capitais
          e 172 Polos do Interior em todas as 27 Unidades Federativas. Cobertura completa de
          contratos, saúde pelo SUS (CID-10), risco socioambiental e finanças públicas.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-sm italic text-muted">
          <p>
            &ldquo;O número vem do dado; o modelo, se houver, só embrulha. Tipagem nominal estrita: 7 dígitos para o código IBGE e 6 dígitos para o DATASUS. Nomes ambíguos ou homônimos são sempre desambiguados pelo código oficial.&rdquo;
          </p>
          <p className="mt-1 text-xs not-italic font-medium text-foreground">
            — Diretriz Arquitetural de Expansão Nacional (PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md)
          </p>
        </div>
      </header>

      {/* 1. CARTÕES DE STATUS DE TOPO */}
      <section aria-labelledby="titulo-totais" className="mb-8">
        <h2 id="titulo-totais" className="sr-only">Totais da Expansão</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Cidades Totais</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
              {stats.totalCidades}
            </p>
            <p className="mt-1 text-[11px] text-muted">Auditadas no IBGE</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Capitais e DF</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary sm:text-3xl">
              {stats.totalCapitais}
            </p>
            <p className="mt-1 text-[11px] text-muted">100% das Capitais</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Polos do Interior</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
              {stats.totalPolosInterior}
            </p>
            <p className="mt-1 text-[11px] text-muted">Centros Regionais</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Estados (UFs)</p>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-600 sm:text-3xl">
              {stats.totalEstados}
            </p>
            <p className="mt-1 text-[11px] text-muted">26 Estados + DF</p>
          </div>
        </div>
      </section>

      {/* 2. GRÁFICO SVG NATIVO: DISTRIBUIÇÃO POR REGIÃO */}
      <section className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Distribuição Geográfica das Cidades Estratégicas
        </h2>
        <p className="mt-1 text-xs text-muted">
          Quantidade de municípios selecionados por macrorregião geográfica brasileira.
        </p>

        <div className="mt-4 space-y-3">
          {regioes.map((r) => {
            const pct = Math.round((r.total / maxRegiao) * 100);
            return (
              <div key={r.nome} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{r.nome}</span>
                  <span className="font-mono text-muted">{r.total} municípios ({Math.round((r.total / stats.totalCidades) * 100)}%)</span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: r.cor,
                    }}
                    role="progressbar"
                    aria-valuenow={r.total}
                    aria-valuemin={0}
                    aria-valuemax={maxRegiao}
                    aria-label={`Região ${r.nome}: ${r.total} municípios`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. TABELA COM FILTROS E CSV */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-xl font-semibold text-foreground">
          Catálogo Completo das Cidades
        </h2>
        <TabelaCidadesClient cidades={cidades} />
      </section>

      {/* 4. SANFONA DE DIÁLOGO */}
      <section className="mb-8">
        <PainelDialogo
          titulo="Como funciona a expansão do Controle Popular para o Brasil?"
          perguntas={[
            {
              id: "por-que-199",
              pergunta: "Por que começar com 199 cidades estratégicas?",
              resposta:
                "As 27 capitais e os 172 polos do interior concentram mais de 65% do PIB, dos leitos hospitalares SUS e dos principais nós de infraestrutura e pressão socioambiental do Brasil. Isso viabiliza auditoria de alto impacto sem dispersar o foco antes de consolidar os coletores automáticos.",
            },
            {
              id: "diferenca-codigos",
              pergunta: "Qual a diferença entre o código IBGE e o código DATASUS?",
              resposta:
                "O código IBGE possui 7 dígitos (ex: Belo Horizonte = 3106200). O DATASUS utiliza 6 dígitos truncando o dígito verificador final (ex: 310620). Misturar esses códigos geraria vazios nas consultas hospitalares e contratuais. O portal trata ambos como tipos nominais distintos.",
            },
            {
              id: "trilhas-cruzamento",
              pergunta: "Quais dados são cruzados em cada cidade?",
              resposta:
                "O plano mestre estabelece quatro trilhas críticas: 1) Socioambiental (barragens, embargos e terra); 2) Finanças (PNCP, contratos e Siconfi); 3) Judiciário (processos climáticos e CNJ); 4) Saúde (internações hospitalares por causas evitáveis e agressões ambientais via CID-10).",
            },
          ]}
        />
      </section>
    </div>
  );
}
