import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import { dataDoAcervo } from "@/lib/fontes/dataDoArquivo";
import { IndiceWiki, SecaoWiki, LinksRelacionados } from "@/app/components/wiki";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import DataColeta from "@/app/components/DataColeta";
import CartoesResumo from "@/app/components/CartoesResumo";
import GraficoBarrasSvg from "@/app/components/GraficoBarrasSvg";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";
import { ResumoRealidadeBox } from "@/app/components/ResumoRealidade";
type FunaiBruto = typeof import("@/data/funai-terras-indigenas.json");
type IncraBruto = typeof import("@/data/incra-assentamentos.json");
import { lerDadoDeArquivo } from "@/lib/ambiental/dado-de-arquivo";

// SERVER-ONLY: os dois arquivos somam 4,4 MB; `import` estatico embutiria isso
// no bundle do Worker (teto de 3 MiB gzip). Mesmo padrao de estudos-dados.ts.
const funai = lerDadoDeArquivo<FunaiBruto>("funai-terras-indigenas.json");
const incra = lerDadoDeArquivo<IncraBruto>("incra-assentamentos.json");

/**
 * `/ambiental/fundiario` â€” a terra no Brasil em duas camadas: terras
 * indÃ­genas (FUNAI) e projetos de assentamento (INCRA).
 *
 * Fonte oficial:
 * - FUNAI â€” GeoServer, camada `Funai:tis_poligonais_portarias` (WFS), mediÃ§Ã£o
 *   nacional de 18/11/2026 em `apps/web/data/funai-terras-indigenas.json`.
 * - INCRA â€” SIPRA, relaÃ§Ã£o de projetos de reforma agrÃ¡ria (CSV), relatÃ³rio de
 *   06/03/2026 em `apps/web/data/incra-assentamentos.json`.
 *
 * Por que as duas fontes ficam lado a lado e NUNCA somadas: critÃ©rios
 * diferentes (polÃ­gono oficial de TI contra Ã¡rea de projeto criado), atos
 * diferentes e nenhum identificador comum. Um "total de terra" Ãºnico seria
 * nÃºmero que nenhuma das duas fontes publica.
 *
 * O coletor guarda sÃ³ atributos, sem polÃ­gono: o desenho estÃ¡ em
 * `/funcaosocialterra/mapa`. A UF do INCRA Ã© derivada do nÃºmero da SR â€” nÃ£o Ã©
 * publicada â€” e 12 projetos ficaram sem UF; os dois registros de Ã¡rea
 * impossÃ­vel (SP e SE) ficam sinalizados, nunca corrigidos por conta prÃ³pria.
 */

const SECOES = [
  { id: "numeros", titulo: "1. Os nÃºmeros das duas bases" },
  { id: "por-uf", titulo: "2. As duas camadas por estado" },
  { id: "comparacao", titulo: "3. As duas colunas nÃ£o viram um total" },
  { id: "grafico", titulo: "4. Os dez maiores estados" },
  { id: "metodo", titulo: "5. MÃ©todo, fonte e o que a fonte nÃ£o publica" },
];

const LINKS_RELACIONADOS = [
  {
    href: "/funcaosocialterra/mapa",
    titulo: "Globo 3D de terras",
    descricao: "A sobreposiÃ§Ã£o espacial de terras indÃ­genas, quilombos, cavas e barragens.",
  },
  {
    href: "/funcaosocialterra",
    titulo: "FunÃ§Ã£o social da terra",
    descricao: "O hub da frente: o que jÃ¡ estÃ¡ medido e publicado sobre a terra no Brasil.",
  },
  {
    href: "/ambiental/nossa-gente",
    titulo: "Nossa gente",
    descricao: "Povos tradicionais, pescadores e atingidos no acervo do ObservatÃ³rio.",
  },
  {
    href: "/ambiental/barragens",
    titulo: "Barragens em Minas",
    descricao: "Os trÃªs cadastros de barragens, com emergÃªncia e estabilidade declaradas.",
  },
];

const LINKS_TOPO = [
  {
    href: "/funcaosocialterra/mapa",
    titulo: "Globo 3D de terras",
    descricao: "As camadas desenhadas sobre satÃ©lite.",
  },
  {
    href: "/funcaosocialterra",
    titulo: "FunÃ§Ã£o social da terra",
    descricao: "O hub da frente e o que ele mede.",
  },
  {
    href: "/ambiental/nossa-gente",
    titulo: "Nossa gente",
    descricao: "Quem vive o territÃ³rio, no acervo.",
  },
];

type UfTi = { tis: number; area_ha: number; compartilhadas: number; municipios: number };
type UfAssentamento = {
  projetos: number;
  area_ha: number;
  familias_capacidade: number;
  municipios: number;
};

const TI_POR_UF = funai.por_uf as Record<string, UfTi | undefined>;
const ASSENTAMENTO_POR_UF = incra.por_uf as Record<string, UfAssentamento | undefined>;
const UF_SUSPEITA = new Set(incra.area_suspeita.map((registro) => registro.uf));

/** Uma linha da tabela por estado: as duas camadas, sem coluna de total. */
const LINHAS_UF = Object.keys({ ...TI_POR_UF, ...ASSENTAMENTO_POR_UF })
  .filter((uf) => uf !== "??")
  .map((uf) => {
    const ti = TI_POR_UF[uf];
    const assentamento = ASSENTAMENTO_POR_UF[uf];
    return {
      uf,
      tis: ti?.tis ?? 0,
      tiHa: Math.round(ti?.area_ha ?? 0),
      projetos: assentamento?.projetos ?? 0,
      assHa: Math.round(assentamento?.area_ha ?? 0),
      familias: assentamento?.familias_capacidade ?? 0,
      suspeita: UF_SUSPEITA.has(uf),
    };
  })
  .sort((a, b) => b.tiHa - a.tiHa);

/** Estados sem nenhuma feiÃ§Ã£o da camada da FUNAI â€” zero nesta base, sÃ³ isso. */
const UFS_SEM_TI = LINHAS_UF.filter((linha) => linha.tis === 0).map((linha) => linha.uf);

/** Hectares em milhÃµes de hectares, uma casa â€” sÃ³ para o desenho. */
const emMilhoesHa = (ha: number) => Math.round(ha / 1e5) / 10;

const TOP_TI = LINHAS_UF.slice(0, 10).map((linha) => ({
  rotulo: linha.uf,
  valor: emMilhoesHa(linha.tiHa),
}));

/** Sem os dois registros de Ã¡rea impossÃ­vel: eles distorceriam a escala. */
const TOP_ASSENTAMENTO = LINHAS_UF.filter((linha) => !linha.suspeita)
  .sort((a, b) => b.assHa - a.assHa)
  .slice(0, 10)
  .map((linha) => ({ rotulo: linha.uf, valor: emMilhoesHa(linha.assHa) }));

const descreverGrafico = (itens: { rotulo: string; valor: number }[]) =>
  itens
    .map((item) => `${item.rotulo}, ${item.valor.toLocaleString("pt-BR")} milhÃµes de hectares`)
    .join("; ");

/** Os trÃªs maiores, em texto: o grÃ¡fico nunca Ã© o Ãºnico canal. */
const tresMaiores = (itens: { rotulo: string; valor: number }[]) =>
  itens
    .slice(0, 3)
    .map((item) => `${item.rotulo} (${item.valor.toLocaleString("pt-BR")} milhÃµes de hectares)`)
    .join(", ");

const AREA_SUSPEITA_HA = Math.round(
  incra.area_suspeita.reduce((soma, registro) => soma + registro.area_ha, 0)
);

const FAMILIAS_CAPACIDADE = incra.linhas.reduce(
  (soma, linha) => soma + linha.familias_capacidade,
  0
);
const FAMILIAS_ASSENTADAS = incra.linhas.reduce(
  (soma, linha) => soma + linha.familias_assentadas,
  0
);
const TIS_REGULARIZADAS = funai.linhas.filter((linha) => linha.fase_ti === "Regularizada").length;

export const metadata: Metadata = metadataEditavel("/ambiental/fundiario", {
  title: "Terras indÃ­genas e assentamentos por estado â€” Controle Popular Â· Ambiental",
  description:
    "As duas camadas federais da terra no Brasil: 667 terras indÃ­genas da FUNAI (125.421.723 ha) e 9.964 projetos de assentamento do INCRA (140.912.141 ha). Tabela por estado com o ParÃ¡ em destaque, a Ã¡rea suspeita da fonte marcada e o aviso de que as duas bases nÃ£o se somam.",
});

/** CabeÃ§alho: o que a rota cobre, de onde vem e o que ela nÃ£o afirma. */
function Cabecalho() {
  return (
    <header className="space-y-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-text-soft">
        Ambiental Â· Terras Â· Brasil
      </p>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Terras indÃ­genas e assentamentos, nos dois cadastros federais
      </h1>

      <ResumoRealidadeBox rota="/ambiental/fundiario" />

      <ResumoExpandivel
        texto={`A FUNAI mantÃ©m ${formatNumberBR(funai.total)} terras indÃ­genas, somando ${formatNumberBR(Math.round(funai.total_ha))} hectares no paÃ­s. O INCRA mantÃ©m ${formatNumberBR(incra.total)} projetos de assentamento, em ${formatNumberBR(Math.round(incra.total_ha))} hectares. SÃ£o cadastros de finalidades diferentes, sem identificador comum: esta pÃ¡gina mostra cada um por estado, com o ParÃ¡ em destaque, e marca os ${incra.area_suspeita.length} registros de Ã¡rea impossÃ­vel que a fonte do INCRA publicou.`}
        className="max-w-3xl text-text-soft"
      />

      <DataColeta
        coletadoEm={dataDoAcervo(funai)}
        fonte="FUNAI (WFS) e INCRA (SIPRA)"
        competencia={`relatÃ³rio do INCRA de ${incra.data_do_relatorio}`}
      />
    </header>
  );
}

/** Bloco do topo: outras pÃ¡ginas do mesmo eixo (padrÃ£o de pÃ¡gina, item 6a). */
function NavTopo() {
  return (
    <nav
      aria-label="PÃ¡ginas do mesmo eixo"
      data-ignorar-indice
      className="mt-6 rounded-2xl border border-border bg-surface-2/60 p-4"
    >
      <p className="text-sm font-semibold">Do mesmo eixo</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-3">
        {LINKS_TOPO.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg border border-border bg-surface p-3 text-sm hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <span className="font-semibold text-primary">{item.titulo}</span>
              <span className="mt-1 block text-text-soft">{item.descricao}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** SeÃ§Ã£o 1 â€” cartÃµes medidos e as ressalvas de cada base. */
function SecaoNumeros() {
  const cartoes = [
    {
      rotulo: "Terras indÃ­genas (FUNAI)",
      valor: funai.total,
      detalhe: `${formatNumberBR(Math.round(funai.total_ha))} ha Â· ${formatNumberBR(funai.ti_compartilhadas.length)} dividem UF`,
      destaque: true,
    },
    {
      rotulo: "Grafias de povo no campo etnia",
      valor: new Set(funai.linhas.map((linha) => linha.etnia_nome)).size,
      detalhe: "variaÃ§Ãµes de escrita da fonte, sem consolidar povos",
    },
    {
      rotulo: "Projetos de assentamento (INCRA)",
      valor: incra.total,
      detalhe: `${formatNumberBR(Math.round(incra.total_ha))} ha no total, incluindo ${incra.area_suspeita.length} registros impossÃ­veis`,
      alerta: true,
    },
    {
      rotulo: "FamÃ­lias de capacidade",
      valor: FAMILIAS_CAPACIDADE,
      detalhe: "capacidade declarada dos projetos, nÃ£o quem reside",
    },
    {
      rotulo: "Projetos no ParÃ¡",
      valor: incra.por_uf.PA?.projetos ?? 0,
      detalhe: `${formatNumberBR(Math.round(incra.por_uf.PA?.area_ha ?? 0))} ha Â· ${formatNumberBR(incra.por_uf.PA?.municipios ?? 0)} municÃ­pios`,
      destaque: true,
    },
  ];

  return (
    <SecaoWiki id="numeros" titulo="1. Os nÃºmeros das duas bases">
      <p className="max-w-3xl text-sm text-text-soft">
        Terras indÃ­genas e assentamentos sÃ£o cadastros de finalidades diferentes. A FUNAI
        publica o polÃ­gono oficial de cada terra indÃ­gena. O INCRA publica a relaÃ§Ã£o de
        projetos de assentamento criados. Esta pÃ¡gina lÃª os dois arquivos e mostra os totais
        por estado, sem somar as duas bases.
      </p>

      <div className="mt-4">
        <CartoesResumo itens={cartoes} colunas={5} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="font-semibold">Terras indÃ­genas</p>
          <p className="mt-1 text-text-soft">
            {formatNumberBR(funai.total)} terras, {formatNumberBR(Math.round(funai.total_ha))} ha.
            Das {formatNumberBR(funai.total)} terras, {formatNumberBR(TIS_REGULARIZADAS)} estÃ£o
            regularizadas; as outras{" "}
            {formatNumberBR(funai.total - TIS_REGULARIZADAS)} estÃ£o em fases anteriores do
            procedimento, de em estudo a encaminhada para regularizaÃ§Ã£o. A fase Ã© a que a FUNAI
            declara no cadastro, nada alÃ©m.
          </p>
          <p className="mt-2 text-text-soft">
            No ParÃ¡ estÃ£o {formatNumberBR(funai.por_uf.PA?.tis ?? 0)} terras,{" "}
            {formatNumberBR(Math.round(funai.por_uf.PA?.area_ha ?? 0))} ha â€” mais{" "}
            {formatNumberBR(funai.por_uf.PA?.compartilhadas ?? 0)} terras que dividem UF com
            outro estado e nÃ£o entram nessa conta.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="font-semibold">Projetos de assentamento</p>
          <p className="mt-1 text-text-soft">
            {formatNumberBR(incra.total)} projetos no relatÃ³rio de {incra.data_do_relatorio},{" "}
            {formatNumberBR(Math.round(incra.total_ha))} ha. A Ã¡rea Ã© a do projeto criado, nÃ£o a
            jÃ¡ titulada.
          </p>
          <p className="mt-2 text-text-soft">
            O cadastro traz dois campos de famÃ­lia: a capacidade declarada soma{" "}
            {formatNumberBR(FAMILIAS_CAPACIDADE)} e as famÃ­lias assentadas somam{" "}
            {formatNumberBR(FAMILIAS_ASSENTADAS)}. Medem coisas diferentes; esta pÃ¡gina usa a
            capacidade.
          </p>
          <p className="mt-2 text-text-soft">
            No ParÃ¡ estÃ£o {formatNumberBR(incra.por_uf.PA?.projetos ?? 0)} projetos,{" "}
            {formatNumberBR(Math.round(incra.por_uf.PA?.area_ha ?? 0))} ha, em{" "}
            {formatNumberBR(incra.por_uf.PA?.municipios ?? 0)} municÃ­pios, com{" "}
            {formatNumberBR(incra.por_uf.PA?.familias_capacidade ?? 0)} famÃ­lias de capacidade.
          </p>
        </div>
      </div>
    </SecaoWiki>
  );
}

/** CÃ©lula de nota: o marcador da fonte nÃ£o Ã© cor, Ã© texto. */
function NotaDaLinha({ suspeita }: { suspeita: boolean }) {
  if (!suspeita) return <span className="text-text-soft">â€”</span>;
  return (
    <span className="inline-block rounded border border-alert px-1.5 py-0.5 text-xs">
      Ã¡rea suspeita na fonte
    </span>
  );
}

/** SeÃ§Ã£o 2 â€” a tabela Ãºnica com as duas camadas por estado. */
function SecaoPorUf() {
  return (
    <SecaoWiki id="por-uf" titulo="2. As duas camadas por estado">
      <p className="max-w-3xl text-sm text-text-soft">
        Estados ordenados pela Ã¡rea de terra indÃ­gena. Terra que divide duas ou trÃªs UFs nÃ£o Ã©
        atribuÃ­da a nenhuma delas â€” por isso a coluna do estado nÃ£o fecha o total sozinha (a
        conta estÃ¡ na seÃ§Ã£o 3). A Ãºltima coluna marca o que a fonte publicou e nÃ£o fecha:{" "}
        {incra.area_suspeita.length === 1 ? "um projeto" : `${incra.area_suspeita.length} projetos`}{" "}
        com Ã¡rea digitada acima de qualquer medida possÃ­vel.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[46rem] border-collapse text-xs sm:text-sm">
          <caption className="p-3 text-left text-sm text-text-soft">
            Terras indÃ­genas e projetos de assentamento por estado. Ãreas em hectares.
          </caption>
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left">
              <th scope="col" className="px-3 py-2 font-semibold">
                Estado
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                Terras indÃ­genas
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                Ãrea de TI (ha)
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                Projetos
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                Ãrea de assentamento (ha)
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                FamÃ­lias (capacidade)
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Nota
              </th>
            </tr>
          </thead>
          <tbody>
            {LINHAS_UF.map((linha) => (
              <tr
                key={linha.uf}
                className={`border-b border-border/60 ${
                  linha.uf === "PA" ? "bg-primary/10 font-semibold" : "odd:bg-surface-2/40"
                }`}
              >
                <th scope="row" className="px-3 py-2 text-left font-medium">
                  {linha.uf}
                  {linha.uf === "PA" ? (
                    <span className="ml-2 rounded-full border border-primary px-2 py-0.5 text-xs font-normal">
                      foco
                    </span>
                  ) : null}
                </th>
                <td className="px-3 py-2 text-right font-tabular">{formatNumberBR(linha.tis)}</td>
                <td className="px-3 py-2 text-right font-tabular">{formatNumberBR(linha.tiHa)}</td>
                <td className="px-3 py-2 text-right font-tabular">
                  {formatNumberBR(linha.projetos)}
                </td>
                <td className="px-3 py-2 text-right font-tabular">{formatNumberBR(linha.assHa)}</td>
                <td className="px-3 py-2 text-right font-tabular">
                  {formatNumberBR(linha.familias)}
                </td>
                <td className="px-3 py-2">
                  <NotaDaLinha suspeita={linha.suspeita} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 max-w-3xl text-sm text-text-soft">
        {UFS_SEM_TI.join(" e ")} aparecem com zero terra indÃ­gena porque a camada da FUNAI nÃ£o
        tem nenhuma feiÃ§Ã£o nesses estados. Zero nesta camada nÃ£o Ã© afirmaÃ§Ã£o sobre nenhuma
        outra base.
      </p>
    </SecaoWiki>
  );
}

/** SeÃ§Ã£o 3 â€” por que nÃ£o existe "total de terra" e a conta que fecha a FUNAI. */
function SecaoComparacao() {
  const somaUfTi = Math.round(funai.soma_por_uf_ha);
  const compartilhadas = Math.round(funai.area_ti_compartilhada_ha);
  const semUf = incra.por_uf["??"];

  return (
    <SecaoWiki id="comparacao" titulo="3. As duas colunas nÃ£o viram um total">
      <p className="max-w-3xl text-sm text-text-soft">
        Somar terra indÃ­gena com assentamento daria um nÃºmero que nenhuma fonte publica. A
        terra indÃ­gena Ã© o polÃ­gono oficial declarado pela FUNAI. O assentamento Ã© a Ã¡rea do
        projeto criado pelo INCRA. Um projeto pode estar dentro de uma terra indÃ­gena, ao lado
        dela ou longe dela â€” e as duas bases nÃ£o tÃªm identificador comum para dizer qual caso Ã©
        qual. Por isso a tabela nÃ£o tem coluna de total.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="font-semibold">A conta que fecha nas terras indÃ­genas</p>
          <dl className="mt-2 space-y-1 text-text-soft">
            <div className="flex flex-wrap justify-between gap-2">
              <dt>Soma das UFs com terra indÃ­gena</dt>
              <dd className="font-tabular">{formatNumberBR(somaUfTi)} ha</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt>{formatNumberBR(funai.ti_compartilhadas.length)} terras que dividem UF</dt>
              <dd className="font-tabular">{formatNumberBR(compartilhadas)} ha</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-1 font-semibold">
              <dt>Total declarado pela FUNAI</dt>
              <dd className="font-tabular">{formatNumberBR(Math.round(funai.total_ha))} ha</dd>
            </div>
          </dl>
          <p className="mt-2 text-text-soft">
            As duas parcelas somam exatamente o total do arquivo: nenhuma terra fica contada
            duas vezes e nenhuma fica de fora.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="font-semibold">O que a fonte do INCRA nÃ£o fecha</p>
          <p className="mt-1 text-text-soft">
            A UF do projeto nÃ£o Ã© publicada: o coletor a deriva do nÃºmero da SuperintendÃªncia
            Regional. {formatNumberBR(incra.projetos_sem_uf)} projetos (
            {((incra.projetos_sem_uf / incra.total) * 100).toFixed(2)}%) nÃ£o resolvem para
            nenhuma UF e ficam fora da tabela, somando{" "}
            {formatNumberBR(Math.round(semUf?.area_ha ?? 0))} ha. NÃ£o sÃ£o redistribuÃ­dos.
          </p>
          <p className="mt-2 text-text-soft">
            {incra.area_suspeita.length === 1 ? "Um registro tem" : `${incra.area_suspeita.length} registros tÃªm`}{" "}
            Ã¡rea impossÃ­vel digitada na fonte:{" "}
            {incra.area_suspeita
              .map(
                (registro) =>
                  `${registro.uf} com ${formatNumberBR(Math.round(registro.area_ha))} ha`
              )
              .join(" e ")}
            . Eles continuam no total de {formatNumberBR(Math.round(incra.total_ha))} ha. Sem
            eles, a soma seria{" "}
            {formatNumberBR(Math.round(incra.total_ha) - AREA_SUSPEITA_HA)} ha â€” nÃºmero que a
            fonte nÃ£o publica e que esta pÃ¡gina mostra sÃ³ para dimensionar o erro, nÃ£o para
            substituir o total.
          </p>
        </div>
      </div>
    </SecaoWiki>
  );
}

/** SeÃ§Ã£o 4 â€” duas barras de top 10, com o texto ao lado como alternativa. */
function SecaoGraficos() {
  return (
    <SecaoWiki id="grafico" titulo="4. Os dez maiores estados">
      <p className="max-w-3xl text-sm text-text-soft">
        Ãrea por estado em milhÃµes de hectares, um grÃ¡fico por camada. No segundo,{" "}
        {incra.area_suspeita.length === 1
          ? "o registro de Ã¡rea impossÃ­vel fica"
          : `os ${incra.area_suspeita.length} registros de Ã¡rea impossÃ­vel ficam`}{" "}
        fora do desenho â€” com eles a escala esconderia todos os outros estados. Eles seguem na
        tabela, com a marca.
      </p>

      <div className="mt-4 grid gap-6 rounded-2xl border border-border bg-surface p-4 sm:p-6 lg:grid-cols-2">
        <GraficoBarrasSvg
          itens={TOP_TI}
          titulo="Terras indÃ­genas â€” dez maiores estados"
          subtitulo="Ãrea do polÃ­gono oficial da FUNAI, em milhÃµes de hectares (Mha)"
          descricaoAcessivel={`Terras indÃ­genas por estado, em milhÃµes de hectares: ${descreverGrafico(TOP_TI)}.`}
          orientacao="horizontal"
          unidade=" Mha"
        />
        <GraficoBarrasSvg
          itens={TOP_ASSENTAMENTO}
          titulo="Assentamentos â€” dez maiores estados"
          subtitulo={`Ãrea de projeto do INCRA, sem ${incra.area_suspeita.length} registros de Ã¡rea impossÃ­vel`}
          descricaoAcessivel={`Projetos de assentamento por estado, em milhÃµes de hectares: ${descreverGrafico(TOP_ASSENTAMENTO)}.`}
          orientacao="horizontal"
          unidade=" Mha"
          corPadrao="var(--color-info, #3b82f6)"
        />
      </div>

      <p className="mt-3 max-w-3xl text-sm text-text-soft">
        Em terras indÃ­genas, os trÃªs maiores sÃ£o {tresMaiores(TOP_TI)}. Nos assentamentos,
        tirando {incra.area_suspeita.length === 1 ? "o registro de Ã¡rea impossÃ­vel" : `os ${incra.area_suspeita.length} registros de Ã¡rea impossÃ­vel`}
        , os trÃªs maiores sÃ£o {tresMaiores(TOP_ASSENTAMENTO)}. Os valores exatos de todas as UFs
        estÃ£o na tabela da seÃ§Ã£o 2.
      </p>
    </SecaoWiki>
  );
}

/** SeÃ§Ã£o 5 â€” procedÃªncia, o que Ã© derivado e o que a fonte nÃ£o publica. */
function SecaoMetodo() {
  return (
    <SecaoWiki id="metodo" titulo="5. MÃ©todo, fonte e o que a fonte nÃ£o publica">
      <dl className="max-w-3xl space-y-3 text-sm">
        <div>
          <dt className="font-semibold">Terras indÃ­genas â€” FUNAI</dt>
          <dd className="mt-1 text-text-soft">
            Camada <code>tis_poligonais_portarias</code> do GeoServer da FUNAI, consultada por
            WFS em {funai.medido_em}. O coletor pede sÃ³ os atributos, sem geometria: o polÃ­gono
            das {formatNumberBR(funai.total)} terras passaria de 100 MB. O desenho no mapa vem
            de outro arquivo.
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Assentamentos â€” INCRA</dt>
          <dd className="mt-1 text-text-soft">
            RelaÃ§Ã£o de projetos de reforma agrÃ¡ria do SIPRA, relatÃ³rio de{" "}
            {incra.data_do_relatorio}, medida em {incra.medido_em}. Uma linha por projeto
            criado, agrupada por SuperintendÃªncia Regional.
          </dd>
        </div>
        <div>
          <dt className="font-semibold">O que Ã© derivado, nÃ£o publicado</dt>
          <dd className="mt-1 text-text-soft">
            A UF do assentamento: a fonte nÃ£o tem esse campo. O coletor a deriva do nÃºmero da
            SR e, nos blocos que cruzam estado, do municÃ­pio sede. A lista de UFs de cada terra
            indÃ­gena vem concatenada na fonte e foi separada aqui. A Ã¡rea de terra que divide
            UF nÃ£o Ã© dividida entre os estados.
          </dd>
        </div>
        <div>
          <dt className="font-semibold">O que a fonte nÃ£o publica</dt>
          <dd className="mt-1 text-text-soft">
            A camada da FUNAI nÃ£o traz data de atualizaÃ§Ã£o prÃ³pria, entÃ£o a data acima Ã© a da
            coleta. Nenhuma das duas bases publica ocupaÃ§Ã£o efetiva, sobreposiÃ§Ã£o com outras
            Ã¡reas ou titulaÃ§Ã£o concluÃ­da. A fase de demarcaÃ§Ã£o declarada pela FUNAI nÃ£o Ã©
            registro de consulta prÃ©via aos povos. Projeto criado nÃ£o Ã© projeto ocupado, e Ã¡rea
            do projeto nÃ£o Ã© Ã¡rea titulada.
          </dd>
        </div>
        <div>
          <dt className="font-semibold">O que esta pÃ¡gina nÃ£o afirma</dt>
          <dd className="mt-1 text-text-soft">
            Nenhum registro aqui Ã© conflito, grilagem ou irregularidade. Ã‰ o cadastro como as
            duas autarquias o publicam. Nenhum nome de pessoa, CPF ou dado de beneficiÃ¡rio Ã©
            coletado; os povos aparecem pelo nome coletivo que a fonte usa.
          </dd>
        </div>
      </dl>

      <div className="mt-6 rounded-xl border border-dashed border-border p-4 text-sm">
        <p className="font-semibold">Fonte (ABNT)</p>
        <p className="mt-2 text-text-soft">
          FUNAI â€” FUNDAÃ‡ÃƒO NACIONAL DOS POVOS INDÃGENAS.{" "}
          <strong>Terras IndÃ­genas: camada tis_poligonais_portarias</strong>. BrasÃ­lia: FUNAI,
          2026. DisponÃ­vel em:{" "}
          <a
            href={funai.url_fonte}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline"
          >
            {funai.url_fonte}
          </a>
          . Acesso em: {funai.medido_em}.
        </p>
        <p className="mt-2 text-text-soft">
          INCRA â€” INSTITUTO NACIONAL DE COLONIZAÃ‡ÃƒO E REFORMA AGRÃRIA.{" "}
          <strong>Projetos de reforma agrÃ¡ria: relaÃ§Ã£o do SIPRA</strong>. BrasÃ­lia: INCRA, 2026.
          DisponÃ­vel em:{" "}
          <a
            href={incra.url_fonte}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline"
          >
            {incra.url_fonte}
          </a>
          . Acesso em: {incra.medido_em}.
        </p>
      </div>
    </SecaoWiki>
  );
}

export default function FundiarioPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <nav aria-label="NavegaÃ§Ã£o estrutural" className="mb-4 text-sm text-text-soft">
        <Link href="/ambiental" className="hover:text-primary">
          Ambiental
        </Link>{" "}
        Â· <span className="text-text">Terras indÃ­genas e assentamentos</span>
      </nav>

      <Cabecalho />
      <NavTopo />

      <IndiceWiki itens={SECOES} />

      <SecaoNumeros />
      <SecaoPorUf />
      <SecaoComparacao />
      <SecaoGraficos />
      <SecaoMetodo />

      <LinksRelacionados links={LINKS_RELACIONADOS} />
      <MeioAmbienteRelacionado />
    </div>
  );
}
