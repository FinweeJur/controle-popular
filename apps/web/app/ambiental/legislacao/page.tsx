import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import {
  contarCoberturaTemasLegislacaoAmbiental,
  contarLegislacaoAmbiental,
  listarLegislacaoAmbiental,
} from "@/lib/db/queries/legislacao-ambiental";
import { listarNormasDireitoCritico, listarPrecedentesDireitoCritico } from "@/lib/db/queries/direito-critico";
import BuscaLegislacaoUnificada from "./BuscaLegislacaoUnificada";

export const metadata: Metadata = {
  title: "Legislação e precedentes por tema — Controle Popular · Ambiental",
  description:
    "Legislação ambiental estadual de Minas (ALMG, Semad, Siam), legislação nacional/internacional e precedentes judiciais, numa busca só, filtrável por esfera e por tema de proteção — mineração, recursos hídricos, serras, indígena, quilombola, rios e mais.",
};

/**
 * `/ambiental/legislacao` — painel unificado, decisão do dono (2026-08-13):
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
 * FILTRO próprio, badge no card, e o tipo já reserva `"municipal"` pro dia
 * em que outra frente ligar `atos_oficiais` aqui, e `"nacional"` já cobre o
 * espaço pro dia em que a legislação federal do MMA entrar (outra frente
 * está planejando essa fonte — ver `lib/ambiental/legislacao-unificada.ts`).
 * Norma federal e portaria estadual não vão se misturar sem o leitor saber
 * qual é qual quando isso acontecer.
 *
 * ═══ PRECEDENTE NÃO É NORMA ═══
 *
 * O painel de direito crítico já acertava nisso — cada precedente carrega
 * tribunal/ementa/relevância, nunca artigo, e o card muda de forma. Continua
 * assim aqui: `BuscaLegislacaoUnificada` nunca achata as três classes
 * (`estadual`/`critica`/`precedente`) num shape comum, só compartilha o
 * filtro de esfera/tema/busca.
 */
export default async function LegislacaoAmbientalIndex() {
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
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Ambiental · Estadual, nacional e internacional · Legislação e precedentes
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          A legislação e os precedentes de proteção, numa busca só
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Leis, decretos, deliberações e portarias ambientais de Minas Gerais ao lado de tratados,
          declarações e decisões de tribunais nacionais e internacionais — numa busca só, filtrável
          por esfera (estadual, nacional, internacional) e por tema de proteção, do licenciamento de
          mineração à proteção de povos indígenas.
        </p>

        {totalGeral === 0 ? (
          <p className="max-w-2xl rounded-lg border border-dashed border-border px-4 py-3 text-[.95em] text-text-soft">
            Nada coletado ainda. Os coletores (
            <code className="font-mono text-[.85em]">etl.apis.legislacao_almg</code>,{" "}
            <code className="font-mono text-[.85em]">legislacao_semad</code>,{" "}
            <code className="font-mono text-[.85em]">legislacao_siam</code>,{" "}
            <code className="font-mono text-[.85em]">direito_critico_popular</code>) ainda não
            rodaram contra este banco.
          </p>
        ) : (
          <p
            className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-tertiary)" }}
          >
            <strong className="font-tabular">{formatNumberBR(totalGeral)}</strong> itens ao todo:{" "}
            <strong className="font-tabular">{formatNumberBR(estaduais.length)}</strong> normas
            estaduais (<strong className="font-tabular">{formatNumberBR(contagemEstadual.porFonte.almg)}</strong>{" "}
            ALMG, <strong className="font-tabular">{formatNumberBR(contagemEstadual.porFonte.semad)}</strong>{" "}
            Semad, <strong className="font-tabular">{formatNumberBR(contagemEstadual.porFonte.siam)}</strong>{" "}
            Siam), <strong className="font-tabular">{formatNumberBR(criticas.length)}</strong>{" "}
            instrumentos nacionais/internacionais e{" "}
            <strong className="font-tabular">{formatNumberBR(precedentes.length)}</strong> precedentes
            judiciais. As três fontes estaduais se sobrepõem em parte — a mesma Lei/Decreto pode
            estar em mais de uma, e o card avisa quando isso acontece.
          </p>
        )}

        {coberturaEstadual.total > 0 && (
          <p className="max-w-2xl rounded-lg border border-dashed border-border px-4 py-3 text-[.88em] text-text-soft">
            Das normas estaduais,{" "}
            <strong className="font-tabular text-text">{formatNumberBR(coberturaEstadual.comTema)}</strong> de{" "}
            <strong className="font-tabular text-text">{formatNumberBR(coberturaEstadual.total)}</strong> (
            {((100 * coberturaEstadual.comTema) / coberturaEstadual.total).toFixed(1).replace(".", ",")}%)
            receberam pelo menos um tema — as demais ficam &quot;sem tema atribuído&quot;, não
            empurradas pra um tema qualquer. As 45 linhas de legislação/precedente
            nacional/internacional têm 100% de cobertura (curadoria dedicada, ver seção abaixo).
          </p>
        )}
      </header>

      <section className="mt-10">
        <BuscaLegislacaoUnificada estaduais={estaduais} criticas={criticas} precedentes={precedentes} />
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem cada item</h2>
        <dl className="mt-3 space-y-3 text-[.92em] text-text-soft">
          <div>
            <dt className="font-semibold text-text">ALMG — Assembleia Legislativa de MG (estadual)</dt>
            <dd>
              Leis, decretos e leis complementares do Legislativo e do Executivo estaduais. As normas
              aqui vêm das ~2.500 &quot;normas básicas&quot; publicadas pela própria ALMG, filtradas
              localmente pelo tema oficial &quot;Meio Ambiente&quot; que a ALMG já atribui a cada uma.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Semad — Banco de Legislação Ambiental (estadual)</dt>
            <dd>
              Cobre o que a ALMG não tem: Deliberação Copam, Portaria IEF, Portaria Igam, Resolução
              Conjunta dos órgãos do Sisema — atos administrativos, não leis da Assembleia.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Siam — arquivo histórico (estadual)</dt>
            <dd>
              Sistema de legislação ambiental mais antigo da Semad, cobrindo até 2024. Soma um volume
              maior e um identificador (idNorma) que as outras duas fontes não têm.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Direito Crítico Popular (nacional e internacional)</dt>
            <dd>
              Carga inicial curada em torno de barragens e populações atingidas (Mariana, Brumadinho,
              o Movimento dos Atingidos por Barragens) — ver a seção de cobertura desigual abaixo.
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-[.9em] text-text-soft">
          Legislação federal ambiental (Ministério do Meio Ambiente, Conama) ainda não entrou nesta
          busca — outra frente do projeto está mapeando essa fonte; quando entrar, soma à esfera
          &quot;Nacional&quot; que já existe no filtro, sem precisar de painel novo.
        </p>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">Como o tema de cada item é decidido</h2>
        <p className="mt-3 text-[.92em] text-text-soft">
          A ALMG é a única fonte estadual que atribui, a cada norma, uma taxonomia oficial própria (o
          campo &quot;indexação&quot; da sua API de dados abertos). Os 9 temas estaduais do filtro
          (os 8 originais + &quot;Proteção de serras&quot;, adicionado em 13/08/2026 depois de medir
          180 normas com &quot;serra&quot; na ementa e confirmar um ramo oficial da própria taxonomia
          da ALMG — <code className="font-mono text-[.85em]">/Relevo/Serra (Relevo)</code>) nasceram
          de ramos REAIS dessa taxonomia, cruzados com palavra-chave auditável na ementa (regras em{" "}
          <code className="font-mono text-[.85em]">etl/temas_ambientais.py</code>). Semad e Siam não
          publicam taxonomia equivalente — para essas ~6.300 normas o tema vem só de palavra-chave,
          indício de conteúdo, não afirmação oficial.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          Os 6 temas exclusivos da legislação nacional/internacional (indígena, quilombola, povos e
          comunidades tradicionais, direitos humanos, rios, espécies) não têm campo de tema na
          fonte — cada atribuição saiu da leitura do texto de cada lei/precedente{" "}
          <strong className="font-semibold text-text">feita com auxílio de inteligência artificial</strong>
          , registrada linha a linha em{" "}
          <code className="font-mono text-[.85em]">etl/temas_direito_critico.py</code>, com o trecho
          que sustenta cada tema — reexecutável e auditável item a item, mas curadoria assistida por
          máquina, não leitura humana de ponta a ponta, e{" "}
          <strong className="font-semibold text-text">está em revisão</strong>.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          O tema &quot;Proteção de serras&quot; usa o MESMO slug nos dois vocabulários (estadual e
          nacional/internacional) de propósito — é o que faz o chip somar as duas fontes no filtro
          acima sem tabela de tradução. Os outros temas parecidos entre si (Recursos Hídricos
          estadual vs. Rios nacional/internacional; Fauna e Flora estadual vs. Espécies
          nacional/internacional) continuam com slugs distintos: o método por trás de cada um é
          diferente — um é regra sobre ementa administrativa, o outro é leitura de um material
          jurídico curado — e fundir os dois fingiria uma origem comum que não existe.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          Esta página dizia, até 13/08/2026, que a atribuição de tema do acervo nacional/internacional
          vinha de &ldquo;leitura humana&rdquo;. Não vinha, e a correção está aqui em vez de sumir no
          histórico: quem cobra procedência dos outros deve o mesmo padrão sobre si. Se você encontrar
          um tema que o trecho citado não sustenta, é erro nosso — e é exatamente o tipo de erro que
          esta revisão procura.
        </p>
      </section>
    </div>
  );
}
