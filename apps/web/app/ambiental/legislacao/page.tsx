import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { exportandoEstatico } from "@/lib/alvo-de-build";
import {
  contarCoberturaTemasLegislacaoAmbiental,
  contarLegislacaoAmbiental,
  listarLegislacaoAmbiental,
} from "@/lib/db/queries/legislacao-ambiental";
import { listarNormasDireitoCritico, listarPrecedentesDireitoCritico } from "@/lib/db/queries/direito-critico";
import BuscaLegislacaoUnificada from "./BuscaLegislacaoUnificada";
import GraficoLegislacao from "./GraficoLegislacao";
import CabecalhoLegislacao from "./CabecalhoLegislacao";
import CartoesLegislacao from "./CartoesLegislacao";
import NotasLegislacao from "./NotasLegislacao";
// Compactado ANTES de cruzar a fronteira: o corpus inteiro vai no payload
// da rota, e sem isto o asset passa dos 25 MiB do Workers. Ver
// `lib/ambiental/payload-compacto.ts` e `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`.
import { compactar } from "@/lib/ambiental/payload-compacto";
import Link from "@/lib/ambiental/link";
import { metadataEditavel } from "@/lib/edicoes";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";

export const metadata: Metadata = metadataEditavel("/ambiental/legislacao", {
  title: "Legislação e precedentes por tema — Controle Popular · Ambiental",
  description:
    "Legislação ambiental estadual de Minas (ALMG, Semad, Siam) e federal (MMA, Ibama, ICMBio, Resoluções Conama, CNDH), legislação nacional/internacional e precedentes judiciais, numa busca só, filtrável por esfera e por tema de proteção — mineração, fauna e flora, recursos hídricos, serras, indígena, quilombola, rios e mais.",
});

/**
 * `/ambiental/legislacao` — painel unificado, decisão do dev (2026-08-13):
 * "é melhor unificar os painéis de legislação estadual / nacional /
 * proteção em um só, filtrável por temas". Decisão tomada, não reaberta
 * aqui — este comentário documenta a implementação, não o debate.
 *
 * ═══ O QUE ERA DOIS PAINÉIS VIROU UM ═══
 *
 * Até 13/08/2026 esta URL só tinha as 6.378 normas ESTADUAIS (ALMG + Semad
 * + Siam, migration `0063`), e `/ambiental/direito-critico` (agora
 * redirecionada pra cá — ver `next.config.ts` e o bridge em
 * `app/ambiental/direito-critico/page.tsx`) tinha as 30 normas
 * nacionais/internacionais + 15 precedentes (migration `0067`). Duas telas
 * respondendo à MESMA pergunta ("que lei/decisão trata disso"), com o
 * leitor tendo que adivinhar qual abrir — o mesmo raciocínio que já valeu
 * pras camadas quilombolas no mapa 3D.
 *
 * A fusão é só de CAMADA DE APRESENTAÇÃO: as três tabelas de origem
 * (`ambiental_legislacao`, `direito_critico_normas`,
 * `direito_critico_precedentes`) continuam INTOCADAS — sem migration nova,
 * sem coluna nova. `lib/ambiental/legislacao-unificada.ts` é quem junta as
 * três listas já buscadas (uma query por tabela, 3 no total — dentro do
 * teto de 50 subrequests do Workers Free, ver `lib/db/client.ts`) num
 * array só, com esfera resolvida e tema no vocabulário unificado.
 *
 * ═══ ESFERA — CAMPO DE PRIMEIRA CLASSE ═══
 *
 * Antes a esfera de cada norma era implícita na fonte (ALMG = estadual,
 * "direito-crítico" = nacional/internacional misturados sem rótulo). Agora
 * todo item carrega `esfera` (municipal/estadual/nacional/internacional) —
 * FILTRO próprio e badge no card.
 *
 * ═══ 14/08/2026: A LEGISLAÇÃO FEDERAL ENTROU ═══
 *
 * Este comentário dizia, até aqui, que a esfera "nacional" guardava espaço
 * "pro dia em que a legislação federal do MMA entrar". Entrou: migration
 * `0073` + coletores `etl.apis.legislacao_mma` (CSV CC-BY do MMA, com as
 * Resoluções Conama) e `etl.apis.legislacao_cndh` (resoluções e
 * recomendações do CNDH, CC BY-ND — ementa citada, nunca reescrita). As
 * duas gravam na MESMA `ambiental_legislacao`, com `esfera='nacional'`, e
 * por isso o card estadual deixou de carimbar "Estadual" fixo: ele lê a
 * coluna. Números medidos da carga em `docs/LEGISLACAO-FEDERAL-MMA-CNDH.md`.
 *
 * ═══ PRECEDENTE NÃO É NORMA ═══
 *
 * O painel de direito crítico já acertava nisso — cada precedente carrega
 * tribunal/ementa/relevância, nunca artigo, e o card muda de forma. Continua
 * assim aqui: `BuscaLegislacaoUnificada` nunca achata as três classes
 * (`estadual`/`critica`/`precedente`) num shape comum, só compartilha o
 * filtro de esfera/tema/busca.
 *
 * ═══ CARTÕES E GRÁFICO (regra do dev, 2026-08-21: "cinco coisas") ═══
 *
 * O gráfico pedido é "por ano de norma e por órgão emissor" — os dois só
 * existem sobre `estaduais` (a tabela `ambiental_legislacao`, que apesar do
 * nome da variável já inclui MMA/CNDH federais desde a migration 0073):
 * `criticas` e `precedentes` não têm `ano` nem `orgao` na fonte, então
 * entrar num "gráfico por ano" com eles inventaria um eixo que o dado não
 * tem. Isso é dito na legenda de cada gráfico, não escondido.
 *
 * "Por ano" é uma janela dos últimos 12 anos com dado — não a série
 * completa: o corpus tem norma de décadas atrás, e um gráfico com uma barra
 * por ano desde o primeiro registro ficaria ilegível (e a pergunta que o
 * leitor faz de um portal de transparência é "estão legislando mais agora",
 * não a distribuição desde o século passado). O que fica de fora da janela
 * soma numa barra "antes de {ano}" — nenhuma norma sai da CONTAGEM, só do
 * desenho. "Por órgão" recorta aos 8 órgãos com mais normas, mesmo
 * raciocínio, com "outros órgãos" no lugar de "antes de".
 */
export default async function LegislacaoAmbientalIndex() {
  // Leitura viva no alvo com runtime; ver a nota em
  // `app/ambiental/licenciamento/page.tsx`. No export segue pré-renderizada.
  if (!exportandoEstatico) noStore();

  const [estaduais, criticas, precedentes, contagemEstadual, coberturaEstadual] = await Promise.all([
    listarLegislacaoAmbiental(),
    listarNormasDireitoCritico(),
    listarPrecedentesDireitoCritico(),
    contarLegislacaoAmbiental(),
    contarCoberturaTemasLegislacaoAmbiental(),
  ]);

  const totalGeral = estaduais.length + criticas.length + precedentes.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <CabecalhoLegislacao
        totalGeral={totalGeral}
        contagem={contagemEstadual}
        criticas={criticas.length}
        precedentes={precedentes.length}
        cobertura={coberturaEstadual}
      />


      {totalGeral > 0 && (
        <>
          <CartoesLegislacao
            totalGeral={totalGeral}
            contagem={contagemEstadual}
            criticas={criticas.length}
            precedentes={precedentes.length}
            cobertura={coberturaEstadual}
          />

          <GraficoLegislacao estaduais={estaduais} />
        </>
      )}

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-text">Eixo:</span>
          <Link
            href="/europa/legislacao-transnacionais"
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-primary hover:border-primary hover:underline"
          >
            Direito internacional ↗
          </Link>
        </div>
        <BuscaLegislacaoUnificada corpus={compactar(estaduais)} criticas={criticas} precedentes={precedentes} />
      </section>

      <NotasLegislacao />
          <MeioAmbienteRelacionado />
</div>
  );
}
