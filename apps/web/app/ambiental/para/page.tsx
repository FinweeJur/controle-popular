import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { exportandoEstatico } from "@/lib/alvo-de-build";
import Link from "@/lib/ambiental/link";
import { formatCurrencyCompactaBR, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { coberturaSnisbUf, type CoberturaSnisbUf } from "@/lib/db/queries/barragens";
import { metadataEditavel } from "@/lib/edicoes";
import { IndiceWiki, LinksRelacionados, SecaoWiki, type LinkRelacionado } from "@/app/components/wiki";
import CartoesResumo from "@/app/components/CartoesResumo";
import DataColeta from "@/app/components/DataColeta";
import GraficoBarrasSvg from "@/app/components/GraficoBarrasSvg";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";
import { ResumoRealidadeBox } from "@/app/components/ResumoRealidade";
type EstudosBruto = typeof import("@/data/semas-pa-estudos.json");
type MppaBruto = typeof import("@/data/mppa-pa-tacs.json");
type CfurhBruto = typeof import("@/data/aneel-cfurh-pa.json");
type EmpreendimentosBruto =
  typeof import("@/data/semas-pa-empreendimentos.json");
type SigbmBruto = typeof import("@/data/barragens-sigbm.json");
import { lerDadoDeArquivo } from "@/lib/ambiental/dado-de-arquivo";

// SERVER-ONLY: `readFileSync`, nao `import`, para nao embutir 5 MB de JSON no
// bundle do Worker (teto de 3 MiB gzip; erro 10027 medido em 24/08/2026).
const semasEstudos = lerDadoDeArquivo<EstudosBruto>("semas-pa-estudos.json");
const mppaTacs = lerDadoDeArquivo<MppaBruto>("mppa-pa-tacs.json");
const aneelCfurh = lerDadoDeArquivo<CfurhBruto>("aneel-cfurh-pa.json");
const semasEmpreendimentos =
  lerDadoDeArquivo<EmpreendimentosBruto>("semas-pa-empreendimentos.json");
const sigbm = lerDadoDeArquivo<SigbmBruto>("barragens-sigbm.json");

/**
 * `/ambiental/para` â€” hub ambiental do ParÃ¡. Estadual, sem `[municipio]`:
 * cada acervo cobre o estado inteiro e o municÃ­pio Ã© atributo do registro,
 * nÃ£o da tela (mesmo raciocÃ­nio de `/ambiental/copam` e
 * `/ambiental/barragens`).
 *
 * â•â•â• POR QUE UMA PÃGINA, E NÃƒO CINCO â•â•â•
 *
 * Os cinco acervos abaixo foram coletados por coletores diferentes, em dias
 * diferentes, com unidades diferentes (documento, termo, real, empreendimento,
 * barragem). Nenhum deles publica denominador comum com outro. Uma pÃ¡gina por
 * acervo criaria cinco endereÃ§os que ninguÃ©m acha; uma pÃ¡gina com facetas
 * (`?fonte=`) precisaria de um "Todos" que nÃ£o existe. Aqui cada acervo tem
 * sua seÃ§Ã£o ancorada, seu nÃºmero datado e sua ressalva â€” e a pÃ¡gina DIZ, em
 * cada seÃ§Ã£o, o que aquele nÃºmero cobre.
 *
 * â•â•â• DE ONDE VEM CADA NÃšMERO â•â•â•
 *
 * - arquivo, lido no build: `data/semas-pa-estudos.json` (175 documentos),
 *   `data/mppa-pa-tacs.json` (422 TAC), `data/aneel-cfurh-pa.json` (CFURH),
 *   `data/semas-pa-empreendimentos.json` (SIMLAM, PARCIAL) e
 *   `data/barragens-sigbm.json` (recorte `uf: "PA"`);
 * - banco, lido na geraÃ§Ã£o: `snisb_barragens` filtrado pelo prefixo IBGE
 *   `15`, via `coberturaSnisbUf()` â€” a versÃ£o parametrizada da consulta que
 *   `/ambiental/barragens` faz para Minas.
 *
 * Regra editorial que a pÃ¡gina inteira obedece: amostra nunca aparece como
 * total. O SIMLAM estÃ¡ em 13.778 de ~116 mil e isso estÃ¡ escrito antes do
 * grÃ¡fico, nÃ£o na nota de rodapÃ©.
 *
 * As seÃ§Ãµes sÃ£o FUNÃ‡Ã•ES LOCAIS: o hook de saÃºde de cÃ³digo barra mÃ©todo com
 * mais de 120 linhas. Quebrar por seÃ§Ã£o nÃ£o muda o HTML â€” nenhum estado
 * atravessa a fronteira.
 */

export const metadata: Metadata = metadataEditavel("/ambiental/para", {
  title: "ParÃ¡ ambiental â€” estudos, TACs, CFURH, SIMLAM e barragens Â· Controle Popular",
  description:
    "Os cinco acervos ambientais pÃºblicos do ParÃ¡, medidos um por um: 175 estudos e audiÃªncias da SEMAS, 422 TACs do MPPA, R$ 2,83 bilhÃµes de CFURH repassados pela ANEEL, 13.778 empreendimentos no SIMLAM (parcial) e as barragens do SNISB e do SIGBM. Cada nÃºmero diz o que cobre e o que nÃ£o cobre.",
});

const SECOES = [
  { id: "resumo", titulo: "1. Os cinco acervos, medidos" },
  { id: "estudos", titulo: "2. SEMAS: estudos e audiÃªncias publicados" },
  { id: "tacs", titulo: "3. MPPA: termos de ajustamento de conduta" },
  { id: "cfurh", titulo: "4. ANEEL: compensaÃ§Ã£o financeira (CFURH)" },
  { id: "empreendimentos", titulo: "5. SIMLAM: empreendimentos (parcial)" },
  { id: "barragens", titulo: "6. Barragens: dois cadastros, dois escopos" },
  { id: "fonte", titulo: "7. De onde vem cada dado" },
];

const LINKS_RELACIONADOS: LinkRelacionado[] = [
  {
    href: "/ambiental",
    titulo: "Acervo ambiental completo",
    descricao: "todas as frentes do eixo ambiental, com o que cada uma mede.",
  },
  {
    href: "/ambiental/licenciamento",
    titulo: "Licenciamento ambiental",
    descricao: "processos, licenÃ§as e pendÃªncias publicados pelos Ã³rgÃ£os estaduais.",
  },
  {
    href: "/ambiental/estudos",
    titulo: "Estudos de impacto",
    descricao: "EIA e RIMA que os Ã³rgÃ£os publicam, por estado.",
  },
  {
    href: "/ambiental/tac",
    titulo: "Termos de ajustamento de conduta",
    descricao: "o que Ã© um TAC e o que ele nÃ£o prova.",
  },
  {
    href: "/ambiental/barragens",
    titulo: "Barragens em Minas Gerais",
    descricao: "os trÃªs cadastros lado a lado, com emergÃªncia e estabilidade.",
  },
];

/** Moeda com centavos: `formatCurrencyBRL` arredonda, e aqui os centavos da
 *  CFURH sÃ£o parte do nÃºmero publicado (R$ 2.834.586.968,36). */
const moedaExata = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Ano â†’ contagem por tipo, sem depender das chaves literais do JSON. */
const ANOS_ESTUDO = semasEstudos.resumo_por_ano as Record<string, Record<string, number>>;

const ESTUDOS_POR_ANO = [...new Set(Object.values(ANOS_ESTUDO).flatMap((t) => Object.keys(t)))]
  .sort()
  .map((ano) => ({
    ano,
    audiencia: ANOS_ESTUDO.audiencia?.[ano] ?? 0,
    rima: ANOS_ESTUDO.rima?.[ano] ?? 0,
    eia: ANOS_ESTUDO.eia?.[ano] ?? 0,
  }))
  .map((l) => ({ ...l, total: l.audiencia + l.rima + l.eia }));

/** Recortes descritivos dos documentos da SEMAS, contados no arquivo. */
const ESTUDOS_MUNICIPIOS = new Set(semasEstudos.linhas.map((l) => l.municipio).filter(Boolean)).size;
const ESTUDOS_EMPREENDIMENTOS = new Set(
  semasEstudos.linhas.map((l) => l.empreendimento).filter(Boolean)
).size;

const TACS_POR_ANO = Object.entries(mppaTacs.resumo_por_ano as Record<string, number>).map(
  ([ano, total]) => ({ ano, total })
);
const TACS_ORGAOS = new Set(mppaTacs.linhas.map((l) => l.orgao)).size;
const TACS_COM_INTEGRA = mppaTacs.linhas.filter((l) => l.url_integra).length;

const CFURH_MUNICIPIOS = Object.entries(
  aneelCfurh.por_municipio as Record<string, { id_ibge: string; total: number; meses: number }>
).sort((a, b) => b[1].total - a[1].total);
const CFURH_USINAS = Object.entries(aneelCfurh.por_usina as Record<string, number>).sort(
  (a, b) => b[1] - a[1]
);
/** Parcela das duas usinas que dominam o repasse â€” derivada, nÃ£o publicada. */
const CFURH_PARCELA_DUAS_USINAS = Math.round(
  ((CFURH_USINAS[0][1] + CFURH_USINAS[1][1]) / aneelCfurh.total_pago_municipios) * 100
);

const SIMLAM_TOP = Object.entries(semasEmpreendimentos.resumo_por_municipio as Record<string, number>)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);
const SIMLAM_SEM_CNPJ = semasEmpreendimentos.linhas.filter((l) => !l.cnpj).length;
/** Total da fonte: nÃ£o Ã© campo do arquivo, vive como texto em
 *  `total_fonte_nota` ("â€¦; 115.980 empreendimentos foi o medido em
 *  17/11/2026"). Lido da nota para nÃ£o existir uma segunda cÃ³pia digitada Ã 
 *  mÃ£o â€” duas cÃ³pias divergem na primeira coleta nova. */
const SIMLAM_TOTAL_FONTE = Number(
  (/[\d.]+(?=\s+empreendimentos)/.exec(semasEmpreendimentos.total_fonte_nota) ?? ["0"])[0].replace(
    /\./g,
    ""
  )
);
const SIMLAM_PERCENTUAL =
  SIMLAM_TOTAL_FONTE > 0
    ? Math.round((semasEmpreendimentos.total_empreendimentos / SIMLAM_TOTAL_FONTE) * 100)
    : 0;

const SIGBM_PA = sigbm.barragens.filter((b) => b.uf === "PA");

/** Conta um campo do SIGBM no recorte do ParÃ¡, mantendo a ordem pedida. */
function contarSigbm(campo: "situacao" | "nivel_emergencia" | "categoria_risco", ordem: string[]) {
  return ordem
    .map((valor) => ({ valor, total: SIGBM_PA.filter((b) => b[campo] === valor).length }))
    .filter((linha) => linha.total > 0);
}

const SIGBM_EMERGENCIA = contarSigbm("nivel_emergencia", [
  "Sem emergÃªncia",
  "NÃ­vel de Alerta",
  "EmergÃªncia Nivel 1",
  "EmergÃªncia Nivel 2",
  "EmergÃªncia Nivel 3",
]);
const SIGBM_MUNICIPIOS = new Set(SIGBM_PA.map((b) => b.municipio)).size;
const SIGBM_EMERGENCIA_N1 = SIGBM_PA.filter((b) => b.nivel_emergencia === "EmergÃªncia Nivel 1").length;
const SIGBM_EMERGENCIA_N2 = SIGBM_PA.filter((b) => b.nivel_emergencia === "EmergÃªncia Nivel 2").length;
const SIGBM_ALERTA = SIGBM_PA.filter((b) => b.nivel_emergencia === "NÃ­vel de Alerta").length;
const SIGBM_RISCO_ALTO = SIGBM_PA.filter((b) => b.categoria_risco === "Alta").length;

/** Caixa de ressalva editorial â€” mesma moldura das pÃ¡ginas vizinhas. */
function Ressalva({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-[var(--cp-border)] px-4 py-3 text-sm opacity-90">
      <p className="font-semibold">{titulo}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {itens.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** Abertura: h1, descriÃ§Ã£o, procedÃªncia em uma linha e navegaÃ§Ã£o do eixo. */
function Cabecalho() {
  const irmaos = [
    { href: "/ambiental", rotulo: "Acervo ambiental" },
    { href: "/ambiental/licenciamento", rotulo: "Licenciamento" },
    { href: "/ambiental/estudos", rotulo: "Estudos de impacto" },
    { href: "/ambiental/tac", rotulo: "TACs" },
    { href: "/ambiental/barragens", rotulo: "Barragens" },
  ];
  return (
    <header>
      <nav aria-label="NavegaÃ§Ã£o estrutural" className="text-sm text-text-soft">
        <Link href="/ambiental" className="hover:text-primary">
          Ambiental
        </Link>{" "}
        Â· <span className="text-text">ParÃ¡</span>
      </nav>

      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-text-soft">
        Ambiental Â· ParÃ¡ Â· Acervos estaduais
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
        O ParÃ¡ ambiental em cinco acervos pÃºblicos
      </h1>

      <ResumoRealidadeBox rota="/ambiental/para" />

      <div className="mt-3 max-w-3xl">
        <ResumoExpandivel
          texto="O ParÃ¡ publica dado ambiental em cinco lugares que nÃ£o conversam entre si: os estudos e as audiÃªncias da SEMAS, os TACs do MinistÃ©rio PÃºblico, a compensaÃ§Ã£o financeira que a ANEEL repassa por hidrelÃ©trica, o catÃ¡logo de empreendimentos do SIMLAM e as barragens do SNISB e do SIGBM. Esta pÃ¡gina mede cada acervo separado, com a data da coleta, e diz o que ele cobre e o que nÃ£o cobre. Os cinco nÃºmeros nÃ£o se somam: cada um conta uma coisa diferente."
        />
      </div>

      <nav
        aria-label="Outras pÃ¡ginas do eixo ambiental"
        className="mt-6 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-4"
      >
        <h2 className="text-sm font-semibold">Outras pÃ¡ginas do eixo ambiental</h2>
        <ul className="mt-2 flex flex-wrap gap-2 text-sm">
          {irmaos.map((irmao) => (
            <li key={irmao.href}>
              <Link
                href={irmao.href}
                className="inline-flex rounded-full border border-[var(--cp-border)] px-3 py-1 hover:border-primary"
              >
                {irmao.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

/** SeÃ§Ã£o 1 â€” os cinco nÃºmeros, cada um com o que ele conta. */
function SecaoResumo({ cobertura }: { cobertura: CoberturaSnisbUf }) {
  const cartoes = [
    {
      rotulo: "Estudos e audiÃªncias (SEMAS)",
      valor: semasEstudos.linhas.length,
      detalhe: `${semasEstudos.resumo_por_tipo.audiencia} audiÃªncias Â· ${semasEstudos.resumo_por_tipo.rima} RIMA Â· ${semasEstudos.resumo_por_tipo.eia} EIA`,
      destaque: true,
    },
    {
      rotulo: "TACs (MPPA)",
      valor: mppaTacs.linhas.length,
      detalhe: `${mppaTacs.com_promotoria_ambiental} com promotoria ambiental no nome do Ã³rgÃ£o`,
    },
    {
      rotulo: "CFURH repassada (ANEEL)",
      valor: formatCurrencyCompactaBR(aneelCfurh.total_pago_municipios),
      detalhe: `${aneelCfurh.municipios} municÃ­pios, de 1996 a 2026`,
    },
    {
      rotulo: "Barragens no SNISB (ANA)",
      valor: cobertura.total,
      detalhe: `${cobertura.municipios} municÃ­pios Â· todos os usos da Ã¡gua`,
      alerta: cobertura.total === 0,
    },
    {
      rotulo: "Barragens de mineraÃ§Ã£o (ANM)",
      valor: SIGBM_PA.length,
      detalhe: `${SIGBM_MUNICIPIOS} municÃ­pios com nome no SIGBM`,
    },
    {
      rotulo: "Empreendimentos no SIMLAM (SEMAS)",
      valor: semasEmpreendimentos.total_empreendimentos,
      detalhe: `parcial: ${SIMLAM_PERCENTUAL}% do total medido na fonte`,
      alerta: true,
    },
  ];

  return (
    <SecaoWiki id="resumo" titulo="1. Os cinco acervos, medidos">
      <p className="text-sm text-text-soft">
        Cada cartÃ£o Ã© uma mediÃ§Ã£o do arquivo ou do banco desta pÃ¡gina, com a data na seÃ§Ã£o
        correspondente. Onde a fonte nÃ£o publica total, o nÃºmero Ã© o que foi lido â€” e o cartÃ£o diz
        isso.
      </p>
      <div className="mt-3">
        <CartoesResumo itens={cartoes} colunas={3} />
      </div>
    </SecaoWiki>
  );
}

/** SeÃ§Ã£o 2 â€” os 175 documentos da SEMAS. */
function SecaoEstudos() {
  return (
    <SecaoWiki id="estudos" titulo="2. SEMAS: estudos e audiÃªncias publicados">
      <p className="text-sm">
        A SEMAS publica {formatNumberBR(semasEstudos.linhas.length)} documentos nos trÃªs tipos que
        esta seÃ§Ã£o mede: {semasEstudos.resumo_por_tipo.audiencia} atas de audiÃªncia pÃºblica,{" "}
        {semasEstudos.resumo_por_tipo.rima} RIMA e {semasEstudos.resumo_por_tipo.eia} EIA. A fonte
        publica outros tipos de documento que este recorte nÃ£o inclui: a coleta filtrou os trÃªs
        tipos citados. Os documentos citam {ESTUDOS_MUNICIPIOS} municÃ­pios e{" "}
        {ESTUDOS_EMPREENDIMENTOS} empreendimentos distintos.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { rotulo: "Atas de audiÃªncia", valor: semasEstudos.resumo_por_tipo.audiencia },
          { rotulo: "RIMA", valor: semasEstudos.resumo_por_tipo.rima },
          { rotulo: "EIA", valor: semasEstudos.resumo_por_tipo.eia },
        ].map((tipo) => (
          <div key={tipo.rotulo} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-text-soft">{tipo.rotulo}</p>
            <p className="mt-1 font-tabular text-2xl font-bold">{formatNumberBR(tipo.valor)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <GraficoBarrasSvg
          itens={ESTUDOS_POR_ANO.map((l) => ({ rotulo: l.ano, valor: l.total }))}
          titulo="Documentos publicados por ano"
          subtitulo="EIA, RIMA e atas de audiÃªncia somados; ano da fonte ou, quando vazio, o da audiÃªncia"
          descricaoAcessivel={`Documentos por ano: ${ESTUDOS_POR_ANO.map((l) => `${l.ano}, ${l.total}`).join("; ")}.`}
          orientacao="horizontal"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Documentos da SEMAS por ano e tipo, com o total do ano.
          </caption>
          <thead className="bg-surface-2">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">Ano</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">EIA</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">RIMA</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">AudiÃªncias</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {ESTUDOS_POR_ANO.map((linha) => (
              <tr key={linha.ano} className="border-t border-border">
                <th scope="row" className="px-3 py-1.5 font-normal">{linha.ano}</th>
                <td className="px-3 py-1.5 text-right font-tabular">{linha.eia || "â€”"}</td>
                <td className="px-3 py-1.5 text-right font-tabular">{linha.rima || "â€”"}</td>
                <td className="px-3 py-1.5 text-right font-tabular">{linha.audiencia || "â€”"}</td>
                <td className="px-3 py-1.5 text-right font-tabular font-semibold">{linha.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Ressalva
        titulo={`O que estes ${semasEstudos.linhas.length} documentos nÃ£o provam`}
        itens={[
          "AudiÃªncia publicada nÃ£o Ã© licenÃ§a concedida: a ata sÃ³ registra que houve audiÃªncia.",
          "EIA ou RIMA publicado nÃ£o Ã© aprovaÃ§Ã£o do estudo nem do empreendimento.",
          "A fonte nÃ£o publica nÃºmero de processo nem de licenÃ§a, e nÃ£o liga audiÃªncia a estudo â€” o casamento possÃ­vel Ã© CNPJ, municÃ­pio e tipologia.",
        ]}
      />

      <DataColeta
        coletadoEm={semasEstudos.gerado_em}
        fonte="SEMAS-PA, Portal da TransparÃªncia"
        competencia="documentos publicados atÃ© a coleta"
      />
    </SecaoWiki>
  );
}

/** SeÃ§Ã£o 3 â€” os 422 TAC do MPPA. */
function SecaoTacs() {
  return (
    <SecaoWiki id="tacs" titulo="3. MPPA: termos de ajustamento de conduta">
      <p className="text-sm">
        O MinistÃ©rio PÃºblico do ParÃ¡ publica os TACs por ano, em 14 pÃ¡ginas-ano de 2013 a 2026. A
        soma lida Ã© {formatNumberBR(mppaTacs.linhas.length)} termos, em {TACS_ORGAOS} Ã³rgÃ£os de
        execuÃ§Ã£o diferentes. {mppaTacs.com_promotoria_ambiental} deles (
        {Math.round((mppaTacs.com_promotoria_ambiental / mppaTacs.linhas.length) * 100)}%) trazem
        promotoria de Meio Ambiente ou Ambiental no nome do Ã³rgÃ£o â€” recorte por texto, nÃ£o por
        campo.
      </p>

      <p className="mt-2 text-sm">
        A fonte nÃ£o declara total, nÃ£o tem filtro, nÃ£o tem paginaÃ§Ã£o e nÃ£o tem API: o nÃºmero acima Ã©
        a soma das linhas lidas nas pÃ¡ginas-ano. {TACS_COM_INTEGRA} termos tÃªm Ã­ntegra em PDF;{" "}
        {mppaTacs.linhas.length - TACS_COM_INTEGRA} nÃ£o tÃªm â€” {mppaTacs.linhas.filter((l) => l.sigiloso === 1).length}{" "}
        estÃ£o marcados como sigilosos na prÃ³pria fonte.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <GraficoBarrasSvg
          itens={TACS_POR_ANO.map((l) => ({ rotulo: l.ano, valor: l.total }))}
          titulo="Termos firmados por ano"
          subtitulo="Linhas lidas nas pÃ¡ginas-ano do MPPA; 2019 vem de endereÃ§o prÃ³prio"
          descricaoAcessivel={`TACs por ano: ${TACS_POR_ANO.map((l) => `${l.ano}, ${l.total}`).join("; ")}.`}
          orientacao="horizontal"
        />
      </div>

      <Ressalva
        titulo="O que um TAC firmado nÃ£o prova"
        itens={[
          "NÃ£o Ã© sentenÃ§a nem confissÃ£o de dano: Ã© compromisso entre as partes, que pode ter sido cumprido, aditado ou extinto â€” o MPPA nÃ£o publica status de cumprimento.",
          "O Ã³rgÃ£o de execuÃ§Ã£o Ã© quem assinou o termo, nÃ£o prova de que o problema ocorreu no municÃ­pio citado no nome da promotoria.",
          "A fonte nÃ£o publica municÃ­pio: esta pÃ¡gina nÃ£o atribui nenhum TAC a uma cidade.",
        ]}
      />

      <DataColeta
        coletadoEm={mppaTacs.gerado_em}
        fonte="MPPA, pÃ¡ginas de TAC por ano"
        competencia="2013 a 2026"
      />
    </SecaoWiki>
  );
}

/** SeÃ§Ã£o 4 â€” CFURH: dinheiro repassado por hidrelÃ©trica. */
function SecaoCfurh() {
  return (
    <SecaoWiki id="cfurh" titulo="4. ANEEL: compensaÃ§Ã£o financeira (CFURH)">
      <p className="text-sm">
        A CompensaÃ§Ã£o Financeira pela UtilizaÃ§Ã£o de Recursos HÃ­dricos pagou{" "}
        <strong className="font-tabular">{moedaExata.format(aneelCfurh.total_pago_municipios)}</strong>{" "}
        a {aneelCfurh.municipios} municÃ­pios do ParÃ¡, em{" "}
        {formatNumberBR(aneelCfurh.linhas.length)} linhas mensais, da competÃªncia de{" "}
        {formatDateBR(aneelCfurh.primeira_competencia)} a{" "}
        {formatDateBR(aneelCfurh.ultima_competencia)}. As duas maiores usinas â€”{" "}
        {CFURH_USINAS[0][0]} e {CFURH_USINAS[1][0]} â€” respondem por {CFURH_PARCELA_DUAS_USINAS}% do
        repasse.
      </p>

      <p className="mt-2 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface-2)] px-4 py-3 text-sm">
        <strong>Repasse nÃ£o Ã© aplicaÃ§Ã£o.</strong> O valor mostra o que a ANEEL transferiu ao
        municÃ­pio pelo uso da Ã¡gua, nÃ£o onde o dinheiro foi gasto. Para saber a aplicaÃ§Ã£o Ã© preciso
        cruzar com a execuÃ§Ã£o orÃ§amentÃ¡ria de cada prefeitura. As somas por municÃ­pio, ano e usina
        sÃ£o derivadas nesta pÃ¡gina â€” a ANEEL publica sÃ³ a linha mensal.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <GraficoBarrasSvg
          itens={CFURH_MUNICIPIOS.slice(0, 10).map(([nome, dados]) => ({
            rotulo: nome,
            valor: Math.round(dados.total / 1_000_000),
          }))}
          titulo="Dez municÃ­pios que mais receberam"
          subtitulo="Total repassado de 1996 a 2026, em milhÃµes de reais (arredondado)"
          descricaoAcessivel={`Repasse por municÃ­pio, em milhÃµes de reais: ${CFURH_MUNICIPIOS.slice(0, 10)
            .map(([nome, dados]) => `${nome}, ${Math.round(dados.total / 1_000_000)}`)
            .join("; ")}.`}
          orientacao="horizontal"
          unidade=" mi"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            CFURH repassada a cada municÃ­pio do ParÃ¡, com cÃ³digo IBGE e nÃºmero de linhas mensais.
          </caption>
          <thead className="bg-surface-2">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">MunicÃ­pio</th>
              <th scope="col" className="px-3 py-2 font-semibold">CÃ³digo IBGE</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Repasse</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Linhas</th>
            </tr>
          </thead>
          <tbody>
            {CFURH_MUNICIPIOS.map(([nome, dados]) => (
              <tr key={dados.id_ibge} className="border-t border-border">
                <th scope="row" className="px-3 py-1.5 font-normal">{nome}</th>
                <td className="px-3 py-1.5 font-tabular opacity-80">{dados.id_ibge}</td>
                <td className="px-3 py-1.5 text-right font-tabular">{moedaExata.format(dados.total)}</td>
                <td className="px-3 py-1.5 text-right font-tabular opacity-80">{dados.meses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-text-soft">
        Usinas que geraram o repasse no recorte:{" "}
        {CFURH_USINAS.map(([nome, valor]) => `${nome} (${formatCurrencyCompactaBR(valor)})`).join(", ")}.
        As somas usam as competÃªncias publicadas atÃ© a coleta; mÃªs novo na fonte nÃ£o reescreve esta
        pÃ¡gina.
      </p>

      <DataColeta
        coletadoEm={aneelCfurh.gerado_em}
        fonte="ANEEL, dados abertos da CFURH"
        competencia="nov/1996 a jul/2026"
      />
    </SecaoWiki>
  );
}

/** SeÃ§Ã£o 5 â€” SIMLAM: a amostra que NÃƒO pode aparecer como total. */
function SecaoEmpreendimentos() {
  const lidas = semasEmpreendimentos.total_empreendimentos;
  const percentual =
    SIMLAM_TOTAL_FONTE > 0 ? Math.round((lidas / SIMLAM_TOTAL_FONTE) * 100) : 0;
  return (
    <SecaoWiki id="empreendimentos" titulo="5. SIMLAM: empreendimentos (parcial)">
      <div className="rounded-xl border border-alert/50 bg-[var(--cp-surface-2)] p-4 text-sm">
        <p className="font-semibold">
          Este acervo estÃ¡ incompleto: {formatNumberBR(lidas)} de cerca de{" "}
          {formatNumberBR(SIMLAM_TOTAL_FONTE)} empreendimentos ({percentual}%).
        </p>
        <p className="mt-1">
          A coleta leu {formatNumberBR(semasEmpreendimentos.paginas)} pÃ¡ginas do catÃ¡logo e gravou{" "}
          {formatNumberBR(lidas)} linhas. O total de {formatNumberBR(SIMLAM_TOTAL_FONTE)} foi medido
          na mesma consulta em 17/11/2026, quando a fonte respondeu; na rodada seguinte o portal
          estava fechado. NÃ£o leia {formatNumberBR(lidas)} como o total do ParÃ¡.
        </p>
      </div>

      <p className="mt-3 text-sm">
        O campo de municÃ­pio Ã© texto livre digitado por quem cadastra: as {formatNumberBR(lidas)}{" "}
        linhas trazem {semasEmpreendimentos.municipios} grafias diferentes para os municÃ­pios do
        ParÃ¡. Aqui, contar por municÃ­pio Ã© contar por grafia â€” nÃ£o Ã© lista canÃ´nica de municÃ­pio.
        AlÃ©m disso, {formatNumberBR(SIMLAM_SEM_CNPJ)} linhas nÃ£o tÃªm CNPJ, e a lista do site repete
        linha com razÃ£o social &quot;.&quot;.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <GraficoBarrasSvg
          itens={SIMLAM_TOP.map(([nome, total]) => ({ rotulo: nome, valor: total }))}
          titulo="Dez grafias de municÃ­pio mais frequentes na amostra"
          subtitulo="Contagem na amostra lida, nÃ£o no acervo inteiro do SIMLAM"
          descricaoAcessivel={`Grafias de municÃ­pio mais frequentes na amostra: ${SIMLAM_TOP.map(
            ([nome, total]) => `${nome}, ${total}`
          ).join("; ")}.`}
          orientacao="horizontal"
        />
      </div>

      <Ressalva
        titulo="O que o catÃ¡logo do SIMLAM nÃ£o Ã©"
        itens={[
          "Empreendimento catalogado nÃ£o Ã© licenÃ§a: tipo, validade e situaÃ§Ã£o ficam no detalhe do processo, que esta coleta nÃ£o baixou.",
          "SituaÃ§Ã£o 'em anÃ¡lise', 'autuado' ou 'notificado' nÃ£o encerra processo e nÃ£o Ã© atestado de culpa nem de conformidade â€” cabe defesa e recurso.",
          "Amostra parcial nÃ£o sustenta ranking de municÃ­pio: a prÃ³xima coleta muda a ordem.",
        ]}
      />

      <DataColeta
        coletadoEm={semasEmpreendimentos.gerado_em}
        fonte="SEMAS-PA, SIMLAM (consulta pÃºblica)"
        competencia={`amostra de ${formatNumberBR(semasEmpreendimentos.paginas)} pÃ¡ginas do catÃ¡logo`}
      />
    </SecaoWiki>
  );
}

/** SeÃ§Ã£o 6 â€” SNISB (banco) e SIGBM (arquivo), sem somar os dois. */
function SecaoBarragens({ cobertura }: { cobertura: CoberturaSnisbUf }) {
  return (
    <SecaoWiki id="barragens" titulo="6. Barragens: dois cadastros, dois escopos">
      <p className="text-sm">
        O cadastro nacional do SNISB cobre todos os usos da Ã¡gua e traz{" "}
        <strong className="font-tabular">{formatNumberBR(cobertura.total)}</strong> barragens no ParÃ¡,
        em {formatNumberBR(cobertura.municipios)} municÃ­pios. O SIGBM, da ANM, cobre sÃ³ barragens de
        mineraÃ§Ã£o: {formatNumberBR(SIGBM_PA.length)} no estado, em {SIGBM_MUNICIPIOS} nomes de
        municÃ­pio. Os dois cadastros nÃ£o se substituem e nÃ£o se somam.
      </p>

      {cobertura.total === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-[var(--cp-border)] px-4 py-3 text-sm opacity-80">
          A consulta ao banco do SNISB nÃ£o respondeu nesta geraÃ§Ã£o â€” a seÃ§Ã£o do SIGBM, que lÃª
          arquivo, continua vÃ¡lida.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm">
            O campo de nÃ­vel de perigo vem preenchido em{" "}
            {formatNumberBR(cobertura.total - cobertura.semNivelPerigo)} de{" "}
            {formatNumberBR(cobertura.total)} barragens do SNISB no ParÃ¡. Zero no campo nÃ£o Ã©
            &quot;sem perigo&quot;: Ã© campo vazio na origem.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm text-text-soft">SNISB Â· barragens</p>
              <p className="mt-1 font-tabular text-2xl font-bold">{formatNumberBR(cobertura.total)}</p>
              <p className="text-sm text-text-soft">{formatNumberBR(cobertura.municipios)} municÃ­pios</p>
            </div>
            <div className="rounded-xl border border-alert/40 bg-surface p-4">
              <p className="text-sm text-text-soft">SNISB Â· categoria de risco alta</p>
              <p className="mt-1 font-tabular text-2xl font-bold">
                {formatNumberBR(cobertura.porCategoriaRisco.find((r) => r.valor === "Alto")?.total ?? 0)}
              </p>
              <p className="text-sm text-text-soft">avaliaÃ§Ã£o da estrutura, nÃ£o do dano</p>
            </div>
            <div className="rounded-xl border border-alert/40 bg-surface p-4">
              <p className="text-sm text-text-soft">SIGBM Â· em nÃ­vel de emergÃªncia</p>
              <p className="mt-1 font-tabular text-2xl font-bold">
                {formatNumberBR(SIGBM_EMERGENCIA_N1 + SIGBM_EMERGENCIA_N2)}
              </p>
              <p className="text-sm text-text-soft">
                {SIGBM_EMERGENCIA_N1} no nÃ­vel 1 Â· {SIGBM_EMERGENCIA_N2} no nÃ­vel 2 Â· mais{" "}
                {SIGBM_ALERTA} em nÃ­vel de alerta
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 sm:p-6">
            <GraficoBarrasSvg
              itens={cobertura.porCategoriaRisco.map((r) => ({
                rotulo: r.valor,
                valor: r.total,
                cor: r.valor === "Alto" ? "var(--color-alert, #ef4444)" : undefined,
              }))}
              titulo="SNISB Â· categoria de risco"
              subtitulo="Todos os usos da Ã¡gua, ParÃ¡"
              descricaoAcessivel={`Categoria de risco no SNISB: ${cobertura.porCategoriaRisco
                .map((r) => `${r.valor}, ${r.total}`)
                .join("; ")}.`}
              orientacao="horizontal"
              altura={200}
            />
            <GraficoBarrasSvg
              itens={SIGBM_EMERGENCIA.map((r) => ({
                rotulo: r.valor,
                valor: r.total,
                cor: r.valor.includes("Nivel") ? "var(--color-alert, #ef4444)" : undefined,
              }))}
              titulo="SIGBM Â· nÃ­vel de emergÃªncia"
              subtitulo="Barragens de mineraÃ§Ã£o, ParÃ¡"
              descricaoAcessivel={`NÃ­vel de emergÃªncia no SIGBM: ${SIGBM_EMERGENCIA.map(
                (r) => `${r.valor}, ${r.total}`
              ).join("; ")}.`}
              orientacao="horizontal"
              altura={200}
            />
          </div>

          <p className="mt-3 text-sm">
            No SIGBM do ParÃ¡, {formatNumberBR(SIGBM_RISCO_ALTO)} barragens de mineraÃ§Ã£o tÃªm categoria
            de risco alta e {formatNumberBR(SIGBM_PA.filter((b) => b.situacao === "Em DescaracterizaÃ§Ã£o").length)}{" "}
            estÃ£o em descaracterizaÃ§Ã£o. &quot;NÃ­vel de Alerta&quot; Ã© instrumento separado de
            &quot;EmergÃªncia NÃ­vel 1&quot; e aparece em linha prÃ³pria no grÃ¡fico do SIGBM.
          </p>
        </>
      )}

      <p className="mt-3 text-sm">
        Ver tambÃ©m as barragens de Minas Gerais nos trÃªs cadastros, com condiÃ§Ã£o de estabilidade:{" "}
        <Link href="/ambiental/barragens" className="underline">
          /ambiental/barragens
        </Link>
        .
      </p>

      <Ressalva
        titulo="Como ler estes dois nÃºmeros"
        itens={[
          "Zero em um cadastro nÃ£o Ã© 'sem barragem': Ã© fora do escopo daquela fonte.",
          "O SIGBM publica nome de municÃ­pio, sem cÃ³digo IBGE â€” os nomes nÃ£o sÃ£o comparÃ¡veis com os cÃ³digos do SNISB.",
          "As duas contagens vÃªm de datas e Ã³rgÃ£os diferentes e nÃ£o formam um total de barragens do ParÃ¡.",
        ]}
      />

      <DataColeta
        coletadoEm={sigbm.coletado_em}
        fonte="ANM, SIGBM (arquivo aberto)"
        competencia={`atualizaÃ§Ã£o de ${formatDateBR(sigbm.ultima_atualizacao)}`}
      />
    </SecaoWiki>
  );
}

/** SeÃ§Ã£o 7 â€” ABNT de cada fonte e a regra de nÃ£o somar. */
function SecaoFonte() {
  const fontes = [
    {
      texto:
        "SECRETARIA DE ESTADO DE MEIO AMBIENTE E SUSTENTABILIDADE DO PARÃ. Portal da TransparÃªncia: documentos do licenciamento ambiental. BelÃ©m: SEMAS, 2026.",
      url: semasEstudos.fontes.interface_humana,
      rotulo: "portal da SEMAS",
    },
    {
      texto:
        "MINISTÃ‰RIO PÃšBLICO DO ESTADO DO PARÃ. Termos de Ajustamento de Conduta firmados (2013â€“2026). BelÃ©m: MPPA, 2026.",
      url: mppaTacs.fontes.pagina_mae,
      rotulo: "TACs do MPPA",
    },
    {
      texto:
        "AGÃŠNCIA NACIONAL DE ENERGIA ELÃ‰TRICA. CompensaÃ§Ã£o Financeira pela UtilizaÃ§Ã£o de Recursos HÃ­dricos: beneficiÃ¡rios. BrasÃ­lia: ANEEL, 2026.",
      url: aneelCfurh.url_fonte,
      rotulo: "dados abertos da CFURH",
    },
    {
      texto:
        "SECRETARIA DE ESTADO DE MEIO AMBIENTE E SUSTENTABILIDADE DO PARÃ. SIMLAM: consulta pÃºblica de empreendimentos. BelÃ©m: SEMAS, 2026.",
      url: semasEmpreendimentos.fontes.consulta_publica,
      rotulo: "consulta pÃºblica do SIMLAM",
    },
    {
      texto:
        "AGÃŠNCIA NACIONAL DE MINERAÃ‡ÃƒO. SIGBM: Sistema Integrado de GestÃ£o de SeguranÃ§a de Barragens de MineraÃ§Ã£o. BrasÃ­lia: ANM, 2026.",
      url: sigbm.url_fonte,
      rotulo: "arquivo do SIGBM",
    },
    {
      texto:
        "AGÃŠNCIA NACIONAL DE ÃGUAS E SANEAMENTO BÃSICO. Sistema Nacional de InformaÃ§Ãµes sobre SeguranÃ§a de Barragens (SNISB). BrasÃ­lia: ANA, 2026.",
      url: "https://www.snisb.gov.br/",
      rotulo: "SNISB",
    },
  ];

  return (
    <SecaoWiki id="fonte" titulo="7. De onde vem cada dado">
      <ul className="space-y-3 text-sm">
        {fontes.map((fonte) => (
          <li key={fonte.url}>
            {fonte.texto} DisponÃ­vel em:{" "}
            <a
              href={fonte.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted underline-offset-2 hover:text-primary"
            >
              {fonte.rotulo}
            </a>
            . Acesso em: 18 nov. 2026.
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm">
        <strong>Nenhum nÃºmero desta pÃ¡gina soma fontes diferentes.</strong> Os cinco acervos nÃ£o
        compartilham denominador: documento, termo, real, empreendimento e barragem sÃ£o unidades
        distintas, e o SIGBM e o MPPA nÃ£o publicam cÃ³digo IBGE de municÃ­pio. Somar produziria um
        total que nÃ£o existe em nenhum Ã³rgÃ£o.
      </p>
      <p className="mt-2 text-sm">
        <strong>Este portal nÃ£o afirma irregularidade.</strong> Ã‰ a reproduÃ§Ã£o dos acervos como as
        fontes oficiais publicam, com a ressalva de cada uma.
      </p>
    </SecaoWiki>
  );
}

export default async function ParaAmbientalPage() {
  // Leitura viva no alvo com runtime; no export segue prÃ©-renderizada.
  if (!exportandoEstatico) noStore();

  const cobertura = await coberturaSnisbUf("15");

  return (
    <main id="conteudo-principal" className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Cabecalho />

      <IndiceWiki itens={SECOES} />

      <SecaoResumo cobertura={cobertura} />
      <SecaoEstudos />
      <SecaoTacs />
      <SecaoCfurh />
      <SecaoEmpreendimentos />
      <SecaoBarragens cobertura={cobertura} />
      <SecaoFonte />

      <LinksRelacionados links={LINKS_RELACIONADOS} />
      <MeioAmbienteRelacionado />
    </main>
  );
}
