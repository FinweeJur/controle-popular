import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import {
  contarBarragensMg,
  listarBarragensFeamMg,
  listarMunicipiosComBarragens,
} from "@/lib/db/queries/barragens";
import BuscaMunicipio from "./BuscaMunicipio";
import TabelaFeam from "./TabelaFeam";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/ambiental/barragens", {
  title: "Barragens em Minas Gerais — Controle Popular · Ambiental",
  description:
    "Barragens de Minas Gerais nos dois cadastros públicos: o inventário da FEAM (mineração e indústria, com condição de estabilidade e nível de emergência) e o cadastro nacional do SNISB (todos os usos). Busca por município e filtro por nível de emergência, condição de estabilidade e categoria de risco.",
});

/**
 * `/ambiental/barragens` — estadual, sem `[municipio]`, mesmo padrão de
 * `/ambiental/copam`: FEAM e SNISB cobrem Minas Gerais inteira, a cidade é
 * um atributo da barragem, não da tela.
 *
 * Dado já coletado (`etl.apis.feam_barragens`, `etl.apis.snisb_barragens`) —
 * esta página só lê. As armadilhas e o vocabulário exato de cada campo
 * estão em `docs/ambiental/F0-discovery.md` §5, §11 e §13.3.1; a composição
 * por município (join falível por nome) está em `lib/betim/barragens.ts`,
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
          As barragens de Minas Gerais, nos dois cadastros que existem
        </h1>
        <p className="max-w-2xl text-[1.05em] opacity-85">
          Não existe UM cadastro de barragens em Minas — existem dois, cobrindo coisas
          diferentes. Nenhum dos dois é o inventário completo sozinho, e este portal mostra os
          dois lado a lado, sem somar.
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
          <strong>As duas fontes não se substituem.</strong> A FEAM só cobre mineração e
          indústria — abastecimento de água, irrigação e hidrelétrica ficam fora dela, mesmo
          quando são grandes e reguladas. Um município com zero barragens na FEAM pode ter
          dezenas no SNISB, e o contrário: uma barragem de mineração pode estar na FEAM sem
          aparecer no SNISB. &quot;Zero na FEAM&quot; nunca é lido aqui como &quot;sem
          barragem&quot;.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">
          O dado mais acionável: emergência e estabilidade não atestada
        </h2>
        <p className="mt-1 max-w-2xl text-sm opacity-75">
          Só a FEAM declara isso, e só para mineração e indústria. Busque por barragem ou
          município, ou filtre pelo vocabulário exato da fonte — nível de emergência, condição
          de estabilidade e categoria de risco.
        </p>
        <div className="mt-4">
          <TabelaFeam barragens={feam} />
        </div>
      </section>

      {municipios.length > 0 ? (
        <section className="mt-12 border-t border-[var(--cp-border)] pt-8">
          <h2 className="font-display text-xl font-semibold">Ver por município</h2>
          <p className="mt-1 text-sm opacity-75">
            {formatNumberBR(municipios.length)} municípios de Minas Gerais têm barragem
            cadastrada em pelo menos uma das duas fontes.
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
          MG filtrado dentro da base nacional. O casamento entre as duas fontes, quando um
          município aparece nas duas, é feito por nome normalizado da barragem — não há
          identificador comum — e é por isso que a página de cada município nunca soma os dois
          totais como um número exato.
        </p>
        <p className="mt-3 max-w-2xl text-[.95em] opacity-80">
          <strong>Este portal não afirma irregularidade.</strong> É a reprodução do cadastro
          como as fontes oficiais publicam.
        </p>
      </section>
    </div>
  );
}
