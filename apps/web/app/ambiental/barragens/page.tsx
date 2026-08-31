import type { Metadata } from "next";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import Link from "@/lib/ambiental/link";
import { COBERTURA_SIGBM } from "@/lib/ambiental/barragens-sigbm";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  contarBarragensMg,
  listarBarragensFeamMg,
  listarMunicipiosComBarragens,
} from "@/lib/db/queries/barragens";
import BuscaMunicipio from "./BuscaMunicipio";
import TabelaFeam from "./TabelaFeam";
import TabelaSigbm from "./TabelaSigbm";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/ambiental/barragens", {
  title: "Barragens em Minas Gerais — Controle Popular · Ambiental",
  description:
    "Barragens de Minas Gerais nos três cadastros públicos: o inventário da FEAM (mineração e indústria, com condição de estabilidade e nível de emergência), o cadastro nacional do SNISB (todos os usos) e o SIGBM da ANM (mineração, federal). Busca por município e filtro por nível de emergência, condição de estabilidade e categoria de risco.",
});

/**
 * `/ambiental/barragens` — estadual, sem `[municipio]`, mesmo padrão de
 * `/ambiental/copam`: FEAM e SNISB cobrem Minas Gerais inteira, a cidade é
 * um atributo da barragem, não da tela.
 *
 * Dado já coletado (`etl.apis.feam_barragens`, `etl.apis.snisb_barragens`) —
 * esta página só lê. A seção SIGBM/ANM lê `apps/web/data/barragens-sigbm.json`
 * (coletor `etl.apis.sigbm_anm`) — dado de arquivo, não de banco, então
 * renderiza com conteúdo mesmo quando o banco está fora do ar. As armadilhas
 * e o vocabulário exato de cada campo estão em
 * `docs/ambiental/F0-discovery.md` §5, §11 e §13.3.1; a composição por
 * município (join falível por nome) está em `lib/betim/barragens.ts`,
 * reaproveitada pela rota `/barragens/municipio/[idIbge]`.
 */
export default async function BarragensIndex() {
  const [contagem, feam, municipios] = await Promise.all([
    contarBarragensMg(),
    listarBarragensFeamMg(),
    listarMunicipiosComBarragens(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Ambiental · Estadual · Barragens
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          As barragens de Minas Gerais, nos três cadastros que existem
        </h1>
        <p className="max-w-2xl text-[1.05em] opacity-85">
          Não existe UM cadastro de barragens em Minas — existem três, cobrindo coisas
          diferentes: o inventário da FEAM (mineração e indústria de Minas), o cadastro
          nacional do SNISB (todos os usos) e o SIGBM da ANM (barragens de mineração,
          federal). Nenhum dos três é o inventário completo sozinho, e este portal mostra os
          três lado a lado, sem somar.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border px-4 py-3 text-[.95em]" style={{ borderColor: "var(--cp-tertiary)" }}>
            <p className="font-semibold">Inventário da FEAM</p>
            <p className="mt-1">
              <strong className="font-tabular text-lg">{formatNumberBR(contagem.totalFeam)}</strong>{" "}
              barragens de mineração e indústria, em{" "}
              <strong className="font-tabular">{formatNumberBR(contagem.municipiosFeam)}</strong>{" "}
              municípios. Traz condição de estabilidade, nível de emergência e método
              construtivo — o que o SNISB, ao lado, quase nunca preenche.
            </p>
          </div>
          <div className="rounded-lg border px-4 py-3 text-[.95em]" style={{ borderColor: "var(--cp-tertiary)" }}>
            <p className="font-semibold">Cadastro nacional (SNISB/ANA)</p>
            <p className="mt-1">
              <strong className="font-tabular text-lg">{formatNumberBR(contagem.totalSnisb)}</strong>{" "}
              barragens em Minas, de todos os usos (abastecimento, irrigação, hidrelétrica,
              mineração), em{" "}
              <strong className="font-tabular">{formatNumberBR(contagem.municipiosSnisb)}</strong>{" "}
              municípios — a maior parte fora do que a FEAM cobre.
            </p>
          </div>
        </div>

        <p className="max-w-2xl rounded-lg border border-dashed border-[var(--cp-border)] px-4 py-3 text-[.9em] opacity-80">
          <strong>As três fontes não se substituem.</strong> A FEAM só cobre mineração e
          indústria — abastecimento de água, irrigação e hidrelétrica ficam fora dela, mesmo
          quando são grandes e reguladas. O SIGBM cobre mineração no Brasil inteiro, pelo
          órgão federal, e não soma com a FEAM: os cadastros não compartilham identificador.
          Um município com zero barragens na FEAM pode ter dezenas no SNISB, e o contrário:
          uma barragem de mineração pode estar na FEAM sem aparecer no SNISB — ou aparecer nos
          dois cadastros com números diferentes. &quot;Zero&quot; numa fonte nunca é lido aqui
          como &quot;sem barragem&quot;.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">
          O dado mais acionável: emergência e estabilidade não atestada
        </h2>
        <p className="mt-1 max-w-2xl text-sm opacity-75">
          A FEAM é a que preenche isso com o vocabulário mais completo — condição de
          estabilidade, nível de emergência e método construtivo — e só para mineração e
          indústria. O SIGBM da ANM, na seção abaixo, também traz nível de emergência e
          categoria de risco, pelo cadastro federal. Busque por barragem ou município, ou
          filtre pelo vocabulário exato da fonte — nível de emergência, condição de
          estabilidade e categoria de risco.
        </p>
        <div className="mt-4">
          <TabelaFeam barragens={feam} />
        </div>
      </section>

      {/* ═══ SIGBM — ANM: o cadastro nacional da mineração ═══ */}
      <section
        className="mt-12 border-t border-[var(--cp-border)] pt-8"
        aria-labelledby="sigbm-anm"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="sigbm-anm" className="font-display text-xl font-semibold">
            SIGBM — o cadastro nacional de barragens de mineração (ANM)
          </h2>
          <Link
            href="/barragens/descaracterizacao"
            className="shrink-0 text-xs underline opacity-70 hover:opacity-100"
          >
            ver também: as barragens em descaracterização acompanhadas pelo MPMG →
          </Link>
        </div>
        <p className="mt-1 max-w-2xl text-sm opacity-75">
          O Sistema de Gestão de Segurança de Barragens de Mineração da ANM é o cadastro
          federal das barragens de mineração, atualizado diariamente. Esta seção lê o arquivo
          aberto da ANM de {formatDateBR(COBERTURA_SIGBM.ultimaAtualizacao)}, filtrado para
          Minas na coleta de {formatDateBR(COBERTURA_SIGBM.coletadoEm)}:{" "}
          {formatNumberBR(COBERTURA_SIGBM.total)} barragens em{" "}
          {formatNumberBR(COBERTURA_SIGBM.municipios)} municípios, de{" "}
          {formatNumberBR(COBERTURA_SIGBM.totalBrasil)} no Brasil.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-tertiary)" }}
          >
            <p className="font-semibold">Barragens de mineração em MG</p>
            <p className="mt-1">
              <strong className="font-tabular text-lg">
                {formatNumberBR(COBERTURA_SIGBM.total)}
              </strong>{" "}
              em {formatNumberBR(COBERTURA_SIGBM.municipios)} municípios ·{" "}
              {formatNumberBR(COBERTURA_SIGBM.empreendedores)} empreendedores
            </p>
          </div>
          <div
            className="rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-alert)" }}
          >
            <p className="font-semibold">Com nível de emergência (1–3)</p>
            <p className="mt-1">
              <strong className="font-tabular text-lg">
                {formatNumberBR(COBERTURA_SIGBM.emEmergencia)}
              </strong>{" "}
              {COBERTURA_SIGBM.emEmergencia === 1 ? "barragem" : "barragens"} ·{" "}
              {formatNumberBR(COBERTURA_SIGBM.porNivelEmergencia[3].total)} no nível 3 · mais{" "}
              {formatNumberBR(COBERTURA_SIGBM.emAlerta)} em Nível de Alerta
            </p>
          </div>
          <div
            className="rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-tertiary)" }}
          >
            <p className="font-semibold">Em descaracterização</p>
            <p className="mt-1">
              <strong className="font-tabular text-lg">
                {formatNumberBR(COBERTURA_SIGBM.emDescaracterizacao)}
              </strong>{" "}
              · {formatNumberBR(COBERTURA_SIGBM.inativas)} inativas ·{" "}
              {formatNumberBR(COBERTURA_SIGBM.emConstrucao)} em construção
            </p>
          </div>
          <div
            className="rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-alert)" }}
          >
            <p className="font-semibold">Categoria de risco alta</p>
            <p className="mt-1">
              <strong className="font-tabular text-lg">
                {formatNumberBR(COBERTURA_SIGBM.categoriaRiscoAlta)}
              </strong>{" "}
              {COBERTURA_SIGBM.categoriaRiscoAlta === 1 ? "barragem" : "barragens"} do cadastro
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-2xl rounded-lg border border-dashed border-[var(--cp-border)] px-4 py-3 text-[.9em] opacity-80">
          <strong>Não soma com a FEAM.</strong> Os dois cadastros cobrem barragens de
          mineração em Minas por órgãos diferentes, sem identificador comum — a FEAM declara
          249 e o SIGBM 320, e nenhum dos dois é &quot;o certo&quot;: são registros de
          finalidades diferentes. E &quot;Nível de Alerta&quot; é um estado separado de
          &quot;Emergência Nivel 1..3&quot; — esta página os mostra separados.
        </p>

        <div className="mt-4">
          <TabelaSigbm />
        </div>
      </section>

      {municipios.length > 0 ? (
        <section className="mt-12 border-t border-[var(--cp-border)] pt-8">
          <h2 className="font-display text-xl font-semibold">Ver por município</h2>
          <p className="mt-1 text-sm opacity-75">
            {formatNumberBR(municipios.length)} municípios de Minas Gerais têm barragem
            cadastrada na FEAM ou no SNISB. O SIGBM não publica código IBGE, então fica fora
            desta busca por município.
          </p>
          <div className="mt-4">
            <BuscaMunicipio municipios={municipios} />
          </div>
        </section>
      ) : null}

      <section className="mt-12 border-t border-[var(--cp-border)] pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-2 max-w-2xl text-[.95em] opacity-80">
          <strong>Inventário de Barragens da FEAM</strong> — planilha anual (base 2024),
          mineração e indústria de Minas Gerais. <strong>Cadastro Nacional de Barragens
          (SNISB/ANA)</strong> — cadastro consolidado pós-Lei 14.066/2020, todos os usos, com
          MG filtrado dentro da base nacional. <strong>SIGBM/ANM</strong> — arquivo aberto
          (CSV) do Sistema de Gestão de Segurança de Barragens de Mineração, atualização
          diária, filtrado para Minas nesta página. As fontes não compartilham identificador:
          quando um município aparece em mais de uma, o casamento é por nome normalizado da
          barragem — e é por isso que nenhuma tela deste portal soma os totais como um número
          exato.
        </p>
        <p className="mt-3 max-w-2xl text-[.95em] opacity-80">
          <strong>Este portal não afirma irregularidade.</strong> É a reprodução do cadastro
          como as fontes oficiais publicam.
        </p>
      </section>
      <FooterGlobal />
    </div>
  );
}
