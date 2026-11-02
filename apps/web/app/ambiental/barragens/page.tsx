import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { exportandoEstatico } from "@/lib/alvo-de-build";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import Link from "@/lib/ambiental/link";
import { COBERTURA_SIGBM } from "@/lib/ambiental/barragens-sigbm";
import {
  contarBarragensMg,
  listarBarragensFeamMg,
  listarMunicipiosComBarragens,
} from "@/lib/db/queries/barragens";
import BuscaMunicipio from "./BuscaMunicipio";
import TabelaFeam from "./TabelaFeam";
import TabelaSigbm from "./TabelaSigbm";
import CartoesResumo from "@/app/components/CartoesResumo";
import GraficoBarrasSvg from "@/app/components/GraficoBarrasSvg";
import { metadataEditavel } from "@/lib/edicoes";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";

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
 * reaproveitada pela rota `/ambiental/barragens/municipio/[idIbge]`.
 *
 * ═══ SIGBM ABSORVIDO EM 02/11/2026 (era `/ambiental/barragens/sigbm`) ═══
 *
 * A rota filha repetia o MESMO arquivo e a MESMA tabela (`TabelaSigbm`), sem
 * dado próprio: só acrescentava cinco cartões, dois gráficos e a nota
 * metodológica. Absorvida para cá porque aqui já mora tudo dela — a URL antiga
 * responde 301 (servidor) ou ponte (estático) para `#sigbm-anm`.
 *
 * ═══ POR QUE ESTA PÁGINA NÃO É PAINEL DE FACETAS ═══
 *
 * A tentação era `?fonte=feam|snisb|sigbm`, mas os três cadastros NÃO
 * compartilham identificador nem escopo: a FEAM declara 249 (mineração e
 * indústria de MG), o SIGBM 320 (mineração no Brasil, filtrado para MG) e o
 * SNISB cobre todos os usos. Um botão "Todos" precisaria de um denominador, e
 * qualquer soma publicaria um total de barragens que não existe. O painel de
 * facetas exige denominador honesto (`PainelFacetas.tsx`); aqui ele não existe,
 * então as três fontes ficam lado a lado em seções ancoradas — como a página
 * sempre defendeu.
 *
 * AS SEÇÕES SÃO FUNÇÕES LOCAIS: o hook de saúde de código barra método com
 * mais de 120 linhas e complexidade acima de 10. Quebrar por seção mantém cada
 * pedaço legível e não muda o HTML — nenhum estado atravessa a fronteira.
 */

type Contagem = Awaited<ReturnType<typeof contarBarragensMg>>;
type BarragemFeam = Awaited<ReturnType<typeof listarBarragensFeamMg>>[number];
type MunicipioComBarragem = Awaited<ReturnType<typeof listarMunicipiosComBarragens>>[number];

/** Cartões e gráficos que eram a única coisa própria de `/barragens/sigbm`. */
const CARTOES_SIGBM = [
  {
    rotulo: "Total de Barragens em MG",
    valor: COBERTURA_SIGBM.total,
    detalhe: `${COBERTURA_SIGBM.municipios} municípios com barragens`,
    destaque: true,
  },
  {
    rotulo: "Em Nível de Emergência (1 a 3)",
    valor: COBERTURA_SIGBM.emEmergencia,
    detalhe: `${COBERTURA_SIGBM.porNivelEmergencia[3]?.total ?? 0} no Nível 3 (iminência de ruptura)`,
    alerta: true,
  },
  {
    rotulo: "Em Nível de Alerta",
    valor: COBERTURA_SIGBM.emAlerta,
    detalhe: "Instrumento preventivo preliminar da ANM",
  },
  {
    rotulo: "Em Descaracterização",
    valor: COBERTURA_SIGBM.emDescaracterizacao,
    detalhe: `${COBERTURA_SIGBM.inativas} inativas e ${COBERTURA_SIGBM.ativas} ativas`,
  },
  {
    rotulo: "Categoria de Risco Alta (CRI)",
    valor: COBERTURA_SIGBM.categoriaRiscoAlta,
    detalhe: "Avaliação técnica da estrutura física",
    alerta: true,
  },
];

const GRAFICO_EMERGENCIA = COBERTURA_SIGBM.porNivelEmergencia.map((n) => ({
  rotulo: n.valor,
  valor: n.total,
  cor:
    n.valor.includes("3")
      ? "var(--color-alert, #ef4444)"
      : n.valor.includes("2") || n.valor.includes("1")
        ? "var(--color-warning, #f59e0b)"
        : n.valor.includes("Alerta")
          ? "var(--color-info, #3b82f6)"
          : "var(--color-primary, #10b981)",
}));

const GRAFICO_SITUACAO = COBERTURA_SIGBM.porSituacao.map((s) => ({
  rotulo: s.valor,
  valor: s.total,
  cor: s.valor === "Em Descaracterização" ? "var(--color-primary)" : undefined,
}));

/** Link de retorno ao topo, repetido no fim de cada seção ("subir"). */
function Subir() {
  return (
    <p className="mt-6 text-sm">
      <a href="#topo" className="underline">
        ↑ Subir ao início da página
      </a>
    </p>
  );
}

/** Atalhos "descer" para as seções — a página é longa e o celular é a régua. */
function NavAncoras() {
  const atalhos = [
    { href: "#feam", rotulo: "Inventário da FEAM" },
    { href: "#sigbm-anm", rotulo: "SIGBM / ANM" },
    { href: "#por-municipio", rotulo: "Ver por município" },
    { href: "#fonte-dado", rotulo: "De onde vem o dado" },
    { href: "#irmas", rotulo: "Páginas irmãs" },
  ];
  return (
    <nav
      aria-label="Seções desta página"
      className="mt-8 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-4"
    >
      <h2 className="text-sm font-semibold">Nesta página</h2>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {atalhos.map((atalho) => (
          <li key={atalho.href}>
            <a href={atalho.href} className="underline">
              ↓ {atalho.rotulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Abertura: h1, os dois totais (FEAM e SNISB) e o aviso de que não se somam. */
function Cabecalho({ contagem }: { contagem: Contagem }) {
  return (
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

      {/* BANNER DE NAVEGAÇÃO CRUZADA: BARRAGENS MUNDIAIS E GLOBO 3D */}
      <div className="grid gap-3 sm:grid-cols-2 pt-2">
        <Link
          href="/ambiental/barragens-globais"
          className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 p-4 text-xs hover:border-primary hover:bg-primary/10 transition group"
        >
          <div>
            <span className="font-bold text-foreground group-hover:text-primary flex items-center gap-1.5 text-sm">
              🌍 Grandes Barragens Mundiais
            </span>
            <p className="text-muted mt-1 text-xs leading-relaxed">
              62 estruturas globais de rejeitos, hidrelétricas e água (ICOLD, NID e Global Tailings).
            </p>
          </div>
          <span className="text-primary font-bold text-lg group-hover:translate-x-1 transition shrink-0 ml-3">
            &rarr;
          </span>
        </Link>

        <Link
          href="/funcaosocialterra/mapa"
          className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-xs hover:border-emerald-500 hover:bg-emerald-500/10 transition group"
        >
          <div>
            <span className="font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5 text-sm">
              🌐 Visualizar no Globo 3D
            </span>
            <p className="text-muted mt-1 text-xs leading-relaxed">
              Sobreposição espacial de barragens com terras indígenas, quilombolas e cavas em satélite.
            </p>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg group-hover:translate-x-1 transition shrink-0 ml-3">
            &rarr;
          </span>
        </Link>
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
  );
}

/** FEAM: a única fonte com estabilidade e emergência preenchidas para MG. */
function SecaoFeam({ feam }: { feam: BarragemFeam[] }) {
  return (
    <section id="feam" className="mt-10 scroll-mt-6" aria-labelledby="titulo-feam">
      <h2 id="titulo-feam" className="font-display text-xl font-semibold">
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
      <Subir />
    </section>
  );
}

/** Cartões de topo do SIGBM — antes viviam na rota filha. */
function CartoesSigbm() {
  return (
    <div className="mt-8">
      <h3 className="font-display text-lg font-semibold">O cadastro em cinco números</h3>
      <div className="mt-3">
        <CartoesResumo itens={CARTOES_SIGBM} colunas={5} />
      </div>
    </div>
  );
}

/** Dois gráficos SVG inline da rota filha, sem biblioteca. */
function GraficosSigbm() {
  return (
    <div className="mt-6 grid gap-6 rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-6 sm:grid-cols-2">
      <div>
        <GraficoBarrasSvg
          itens={GRAFICO_EMERGENCIA}
          titulo="Distribuição por Nível de Emergência"
          subtitulo="Classificação oficial da ANM para o estado de MG"
          orientacao="horizontal"
          altura={220}
        />
      </div>
      <div>
        <GraficoBarrasSvg
          itens={GRAFICO_SITUACAO}
          titulo="Situação Operacional"
          subtitulo="Barragens ativas, inativas e em descaracterização"
          orientacao="horizontal"
          altura={220}
        />
      </div>
    </div>
  );
}

/** SIGBM/ANM: a seção inteira que era a rota `/ambiental/barragens/sigbm`. */
function SecaoSigbm() {
  return (
    <section
      id="sigbm-anm"
      className="mt-12 scroll-mt-6 border-t border-[var(--cp-border)] pt-8"
      aria-labelledby="titulo-sigbm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-sigbm" className="font-display text-xl font-semibold">
          SIGBM — o cadastro nacional de barragens de mineração (ANM)
        </h2>
        <Link
          href="/ambiental/barragens/descaracterizacao"
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

      <CartoesSigbm />
      <GraficosSigbm />

      <p className="mt-4 max-w-2xl rounded-lg border border-dashed border-[var(--cp-border)] px-4 py-3 text-[.9em] opacity-80">
        <strong>Não soma com a FEAM.</strong> Os dois cadastros cobrem barragens de
        mineração em Minas por órgãos diferentes, sem identificador comum — a FEAM declara
        249 e o SIGBM 320, e nenhum dos dois é &quot;o certo&quot;: são registros de
        finalidades diferentes. E &quot;Nível de Alerta&quot; é um estado separado de
        &quot;Emergência Nivel 1..3&quot; — esta página os mostra separados.
      </p>

      <div className="mt-4 rounded-2xl border border-alert/30 bg-[var(--cp-surface-2)] p-5 text-sm opacity-90">
        <p className="font-semibold">Nota metodológica de segurança:</p>
        <p className="mt-1">
          O <strong>Nível de Alerta</strong> é uma medida preventiva interna e não se confunde com os{" "}
          <strong>Níveis de Emergência 1, 2 e 3</strong> (onde o Nível 3 representa risco iminente de
          ruptura). O cadastro do SIGBM não soma diretamente com os números do inventário estadual da
          FEAM devido a escopos e critérios normativos distintos.
        </p>
      </div>

      <div className="mt-4">
        <TabelaSigbm />
      </div>

      <p className="mt-4 text-sm opacity-80">
        Fonte: <strong>Agência Nacional de Mineração (ANM)</strong> — Sistema Integrado de Gestão de
        Segurança de Barragens de Mineração. Dados de domínio público disponibilizados em conformidade
        com a Lei de Acesso à Informação.
      </p>
      <Subir />
    </section>
  );
}

/** Busca por município — só FEAM e SNISB publicam código IBGE. */
function SecaoMunicipios({ municipios }: { municipios: MunicipioComBarragem[] }) {
  return (
    <section
      id="por-municipio"
      className="mt-12 scroll-mt-6 border-t border-[var(--cp-border)] pt-8"
      aria-labelledby="titulo-municipio"
    >
      <h2 id="titulo-municipio" className="font-display text-xl font-semibold">
        Ver por município
      </h2>
      <p className="mt-1 text-sm opacity-75">
        {formatNumberBR(municipios.length)} municípios de Minas Gerais têm barragem
        cadastrada na FEAM ou no SNISB. O SIGBM não publica código IBGE, então fica fora
        desta busca por município.
      </p>
      <div className="mt-4">
        <BuscaMunicipio municipios={municipios} />
      </div>
      <Subir />
    </section>
  );
}

/** Procedência e ressalva editorial — o portal não afirma irregularidade. */
function SecaoFonteDado() {
  return (
    <section
      id="fonte-dado"
      className="mt-12 scroll-mt-6 border-t border-[var(--cp-border)] pt-8"
      aria-labelledby="titulo-fonte"
    >
      <h2 id="titulo-fonte" className="font-display text-xl font-semibold">
        De onde vem o dado
      </h2>
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
      <Subir />
    </section>
  );
}

/** Faixa de rotas irmãs que continuaram vivas porque têm dado próprio. */
function SecaoIrmas() {
  const irmas = [
    {
      href: "/ambiental/barragens/descaracterizacao",
      rotulo: "Descaracterização a montante (MPMG)",
    },
    { href: "/ambiental/barragens-globais", rotulo: "Grandes barragens mundiais" },
    { href: "/ambiental/condicionantes", rotulo: "Condicionantes de barragens" },
    { href: "/ambiental/nossos", rotulo: "Coleção Nossos — rios, serras e territórios" },
  ];
  return (
    <section
      id="irmas"
      className="mt-12 scroll-mt-6 border-t border-[var(--cp-border)] pt-8"
      aria-labelledby="titulo-irmas"
    >
      <h2 id="titulo-irmas" className="font-display text-xl font-semibold">
        Páginas irmãs de barragens
      </h2>
      <p className="mt-1 max-w-2xl text-sm opacity-75">
        Estas continuam em endereço próprio porque têm dado próprio — não são recorte do
        mesmo cadastro do SIGBM:
      </p>
      <ul className="mt-4 flex flex-wrap gap-2 text-sm">
        {irmas.map((irma) => (
          <li key={irma.href}>
            <Link
              href={irma.href}
              className="rounded-full border border-[var(--cp-border)] px-3 py-1 hover:border-primary"
            >
              {irma.rotulo}
            </Link>
          </li>
        ))}
        <li>
          <a
            href="#por-municipio"
            className="rounded-full border border-[var(--cp-border)] px-3 py-1 hover:border-primary"
          >
            Busca por município (nesta página)
          </a>
        </li>
      </ul>
      <Subir />
    </section>
  );
}

export default async function BarragensIndex() {
  // Leitura viva no alvo com runtime; ver a nota em
  // `app/ambiental/licenciamento/page.tsx`. No export segue pré-renderizada.
  if (!exportandoEstatico) noStore();

  const [contagem, feam, municipios] = await Promise.all([
    contarBarragensMg(),
    listarBarragensFeamMg(),
    listarMunicipiosComBarragens(),
  ]);

  return (
    <div id="topo" className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <Cabecalho contagem={contagem} />
      <NavAncoras />
      <SecaoFeam feam={feam} />
      <SecaoSigbm />
      {municipios.length > 0 ? <SecaoMunicipios municipios={municipios} /> : null}
      <SecaoFonteDado />
      <SecaoIrmas />

      {/* PONTE HUMANA — ecossistema ONSA / Coleção Nossos */}
      <details className="group mt-12 border-t border-[var(--cp-border)] pt-6">
        <summary className="cursor-pointer list-none text-sm font-semibold opacity-90">
          <span className="mr-1.5 inline-block text-xs opacity-70 transition-transform duration-200 group-open:rotate-180">▼</span>
          Nossa terra, nossa gente
        </summary>
        <p className="mt-2 max-w-2xl text-[.9em] opacity-80">
          Por trás de cada barragem cadastrada há gente que vive a jusante — veja o rio e o território pelo lado humano na{" "}
          <Link href="/ambiental/nossos" className="underline">Coleção Nossos</Link> e no bloco{" "}
          <Link href="/ambiental/nossa-gente" className="underline">&quot;E nossa gente?&quot;</Link>.
        </p>
      </details>
      <MeioAmbienteRelacionado />
    </div>
  );
}
