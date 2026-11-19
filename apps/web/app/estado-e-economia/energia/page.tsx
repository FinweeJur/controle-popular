import type { Metadata } from "next";
import Link from "next/link";

import ContadorAnimado from "@/app/components/dados/ContadorAnimado";
import DataColeta from "@/app/components/DataColeta";
import ExplicadorDaPagina from "@/app/components/ExplicadorDaPagina";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { IndiceWiki, LinksRelacionados, SecaoWiki } from "@/app/components/wiki";
import { carregarUsinas } from "@/lib/energia/energia";
import {
  agregarGeracaoPorFonte,
  cargaDoMes,
  diasNoMes,
  formatarDataAbnt,
  formatarDataIso,
  formatarGeracaoGw,
  formatarMes,
  formatarMesLongo,
  formatarNumero,
  formatarPercentual,
  formatarPotenciaGw,
  mesParcial,
  mesParcialPorHoras,
  mesesDaSerie,
  participacaoRenovavel,
  serieCargaMensal,
  somarPotenciaKw,
  ultimoMes,
  type RegistroBalanco,
  type RegistroCarga,
  type RegistroEar,
  type UsinaLinha,
} from "@/lib/energia/pagina";
import { metadataEditavel } from "@/lib/edicoes";

import dadosCarga from "@/data/ons/energia-carga.json";
import dadosBalanco from "@/data/ons/energia-balanco.json";
import dadosEar from "@/data/ons/energia-ear.json";

import GraficoCargaSubsistemas from "./components/GraficoCargaSubsistemas";
import GraficoParticipacaoFonte from "./components/GraficoParticipacaoFonte";
import TabelaUsinas from "./components/TabelaUsinas";

/**
 * `/estado-e-economia/energia` — carga, matriz de geração, reservatórios e as
 * usinas de Minas.
 *
 * Dado já coletado e versionado (nenhum fetch em runtime):
 * - `data/ons/energia-carga.json` — carga média mensal por subsistema, MWmed,
 *   ONS `carga-energia` (CC-BY);
 * - `data/ons/energia-balanco.json` — geração por fonte e participação, com a
 *   linha agregada `SIN`, ONS `balanco-energia-subsistema` (CC-BY);
 * - `data/ons/energia-ear.json` — energia armazenada, % do máximo do
 *   subsistema, ONS `ear-diario-por-subsistema` (CC-BY);
 * - `data/energia/usinas-mg.json` — 300 usinas outorgadas em MG, ANEEL
 *   SIGA (ODbL 1.0).
 *
 * Decisões:
 * - As agregações rodam AQUI, no servidor. O componente de cliente recebe só o
 *   recorte achatado das 300 usinas — nunca as 1.615 linhas do balanço
 *   (regra dura 5.1).
 * - `SIN` não é somado aos quatro subsistemas. O agregado oficial e as partes
 *   cobrem o mesmo país; somar os dois dobraria a geração do Brasil.
 * - O mês corrente é parcial em todas as séries do ONS. A página marca o mês
 *   em curso em vez de escondê-lo, e o texto diz quantos dias foram medidos.
 * - EAR acima de 100% existe em 6 meses oficiais do Norte; o dado não foi
 *   editado e a ressalva é explicada na abertura.
 * - Nada aqui é tarifa. O ONS mede operação; preço de energia não está nesta
 *   base (ver `docs/06-fontes/ENERGIA-CONTRATOS.md`).
 */

export const metadata: Metadata = metadataEditavel("/estado-e-economia/energia", {
  title: "Energia: carga, fontes e usinas de Minas",
  description:
    "Carga de energia por subsistema do ONS, participação de hidráulica, térmica, eólica e solar na geração, energia armazenada nos reservatórios e as 300 maiores usinas outorgadas em Minas Gerais pelo SIGA/ANEEL. Mês corrente parcial e fonte oficial em cada série.",
});

interface SnapshotSerie<T> {
  portal: string;
  licenca: string;
  coletadoEm: string;
  fonte: string;
  janela: { inicio: string; fim: string };
  registros: T[];
}

const CARGA = dadosCarga as unknown as SnapshotSerie<RegistroCarga>;
const BALANCO = dadosBalanco as unknown as SnapshotSerie<RegistroBalanco>;
const EAR = dadosEar as unknown as SnapshotSerie<RegistroEar>;
const SIGA = carregarUsinas();

const SECOES = [
  { id: "resumo", titulo: "1. O essencial em cinco números" },
  { id: "carga", titulo: "2. Carga de energia por subsistema" },
  { id: "fontes", titulo: "3. De onde vem a eletricidade" },
  { id: "usinas", titulo: "4. Usinas de Minas Gerais (ANEEL)" },
  { id: "metodo", titulo: "5. Fontes, coleta e limites" },
];

/** Outras páginas do mesmo eixo — o bloco de topo exigido pelo padrão wiki. */
const PAGINAS_DO_EIXO = [
  {
    href: "/estado-e-economia/orcamento",
    titulo: "Orçamento de MG",
    descricao: "Receita, despesa e execução financeira do estado.",
  },
  {
    href: "/ambiental/barragens",
    titulo: "Barragens de MG",
    descricao: "Os três cadastros de barragens, incluindo as hidrelétricas.",
  },
  {
    href: "/empresas",
    titulo: "Grandes empresas",
    descricao: "Sócios, conglomerados e fornecedores do setor elétrico.",
  },
  {
    href: "/laboratorio",
    titulo: "Laboratório de dados",
    descricao: "Comparar indicadores lado a lado, com gráfico acessível.",
  },
];

/** Carga do último mês publicado, no Sudeste/Centro-Oeste. */
const MES_CARGA = ultimoMes(CARGA.registros);
const CARGA_SE = MES_CARGA ? cargaDoMes(CARGA.registros, MES_CARGA, "SE") : null;

/** Último mês do balanço: a linha `SIN` é o agregado oficial do país. */
const MES_BALANCO = ultimoMes(BALANCO.registros);
const BALANCO_SIN = MES_BALANCO
  ? (BALANCO.registros.find((r) => r.mes === MES_BALANCO && r.subsistema === "SIN") ?? null)
  : null;
const RENOVAVEIS_ULTIMO = BALANCO_SIN ? participacaoRenovavel(BALANCO_SIN) : 0;

/** EAR do Sudeste/Centro-Oeste no último mês. */
const MES_EAR = ultimoMes(EAR.registros);
const EAR_SE =
  MES_EAR === null
    ? null
    : (EAR.registros.find((r) => r.mes === MES_EAR && r.subsistema === "SE") ?? null);
const REGISTROS_EAR_ACIMA_100 = EAR.registros.filter((r) => r.earPercentualMaximo > 100);
const MAIOR_EAR_ACIMA_100 = REGISTROS_EAR_ACIMA_100.reduce(
  (maior, r) => Math.max(maior, r.earPercentualMaximo),
  0,
);

/** Gráfico de carga: 36 meses fechados + o mês corrente. */
const JANELA_CARGA = serieCargaMensal(CARGA.registros, 36);
const PRIMEIRO_MES_JANELA = JANELA_CARGA.meses[0] ?? "";
const ULTIMO_MES_JANELA = JANELA_CARGA.meses[JANELA_CARGA.meses.length - 1] ?? "";

/** Gráfico de fontes: os 12 meses fechados antes do mês em curso. */
const MESES_BALANCO = mesesDaSerie(BALANCO.registros);
const JANELA_FECHADA = MESES_BALANCO.slice(-13, -1);
const MES_INICIAL_FECHADO = JANELA_FECHADA[0] ?? MES_BALANCO ?? "";
const MES_FINAL_FECHADO = JANELA_FECHADA[JANELA_FECHADA.length - 1] ?? MES_BALANCO ?? "";
const PARTICIPACAO = agregarGeracaoPorFonte(
  BALANCO.registros,
  MES_INICIAL_FECHADO,
  MES_FINAL_FECHADO,
  "SIN",
);

/** Recorte da tabela: só os campos que a tela e o CSV usam. */
const USINAS: UsinaLinha[] = SIGA.usinas.map((u) => ({
  posicao: u.posicao,
  ceg: u.ceg,
  nome: u.nome,
  tipo: u.tipo,
  fase: u.fase ?? "—",
  potenciaKw: u.potenciaKw,
  municipios: u.municipios,
  outorga: u.outorga,
  entradaOperacao: u.entradaOperacao,
  fimVigencia: u.fimVigencia,
  fonte: u.fonte,
}));
const POTENCIA_MG_KW = somarPotenciaKw(USINAS);

/** Texto de competência do mês em curso, usado em vários pontos. */
function competencia(registro: { mes: string; dias: number } | null): string {
  if (!registro) return "sem mês publicado";
  const dias = registro.dias;
  if (!mesParcial(registro)) return `${formatarMesLongo(registro.mes)}, mês fechado`;
  return `${formatarMesLongo(registro.mes)}, mês em curso com ${dias} dias medidos`;
}

function CartaoNumero({
  rotulo,
  valor,
  casas = 0,
  sufixo,
  unidade,
  detalhe,
  destaque,
}: {
  rotulo: string;
  valor: number | null;
  casas?: number;
  sufixo?: string;
  unidade?: string;
  detalhe: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destaque ? "border-primary/40 bg-surface" : "border-border bg-surface"
      }`}
    >
      <dt className="text-xs font-medium text-text-soft">{rotulo}</dt>
      <dd className="mt-1 font-tabular text-2xl font-bold text-text">
        {valor === null ? (
          "—"
        ) : (
          <ContadorAnimado valor={valor} casas={casas} sufixo={sufixo} />
        )}
        {unidade && <span className="ml-1 text-base font-semibold text-text-soft">{unidade}</span>}
      </dd>
      <p className="mt-1 text-xs leading-snug text-text-soft">{detalhe}</p>
    </div>
  );
}

/** Tabela equivalente ao gráfico de carga — o mesmo número, sem depender da cor. */
function TabelaCarga() {
  return (
    <details className="mt-4 rounded-xl border border-border bg-surface p-4">
      <summary className="cursor-pointer text-sm font-semibold text-primary">
        Ver os números do gráfico ({JANELA_CARGA.meses.length} meses)
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <caption className="sr-only">
            Carga média mensal por subsistema, em GWmed, no período do gráfico.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-soft"
              >
                Mês
              </th>
              {JANELA_CARGA.series.map((s) => (
                <th
                  key={s.codigo}
                  scope="col"
                  className="border-b border-border px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-soft"
                >
                  {s.curto}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {JANELA_CARGA.meses.map((mes, i) => (
              <tr key={mes}>
                <th scope="row" className="border-b border-border px-3 py-1.5 text-left font-normal text-text-soft">
                  {formatarMes(mes)}
                </th>
                {JANELA_CARGA.series.map((s) => {
                  const valor = s.pontos[i];
                  return (
                    <td
                      key={s.codigo}
                      className="border-b border-border px-3 py-1.5 text-right font-tabular text-text"
                    >
                      {valor === null ? "—" : formatarGeracaoGw(valor)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-text-soft">
        Valores em GWmed (gigawatts médios). O mês em curso aparece com os dias já apurados
        pelo ONS.
      </p>
    </details>
  );
}

/** Tabela equivalente ao gráfico de participação por fonte. */
function TabelaFontes() {
  return (
    <table className="mt-4 w-full text-sm">
      <caption className="sr-only">
        Participação e geração média por fonte no Sistema Interligado Nacional, na janela do gráfico.
      </caption>
      <thead>
        <tr>
          <th
            scope="col"
            className="border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-soft"
          >
            Fonte
          </th>
          <th
            scope="col"
            className="border-b border-border px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-soft"
          >
            Participação
          </th>
          <th
            scope="col"
            className="border-b border-border px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-soft"
          >
            Geração média (MWmed)
          </th>
        </tr>
      </thead>
      <tbody>
        {PARTICIPACAO.map((f) => (
          <tr key={f.fonte}>
            <th scope="row" className="border-b border-border px-3 py-2 text-left font-normal text-text">
              {f.rotulo}
            </th>
            <td className="border-b border-border px-3 py-2 text-right font-tabular text-text">
              {formatarPercentual(f.percentual)}
            </td>
            <td className="border-b border-border px-3 py-2 text-right font-tabular text-text-soft">
              {formatarNumero(f.geracaoMediaMw)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function EnergiaPage() {
  return (
    <main id="conteudo-principal" className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <nav
        aria-label="Trilha de navegação"
        className="mb-6 flex flex-wrap items-center gap-2 text-sm text-text-soft"
      >
        <Link href="/" className="hover:text-primary">
          Início
        </Link>
        <span aria-hidden="true">›</span>
        <Link href="/estado-e-economia" className="hover:text-primary">
          Estado e Economia
        </Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Energia</span>
      </nav>

      <nav aria-label="Outras páginas de Estado e Economia" className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-soft">
          Outras páginas deste eixo
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PAGINAS_DO_EIXO.map((pagina) => (
            <li key={pagina.href}>
              <Link
                href={pagina.href}
                className="block h-full rounded-lg border border-border bg-surface p-3 text-sm transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <span className="font-semibold text-primary">{pagina.titulo}</span>
                <span className="mt-0.5 block text-xs leading-snug text-text-soft">
                  {pagina.descricao}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Estado e Economia · Operação do sistema elétrico
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Energia: quanto o país consome, do que é feita a eletricidade e quem gera em Minas
        </h1>
        <ExplicadorDaPagina
          frase="Quanta energia o país consome e quem gera em Minas. Dados do ONS e da ANEEL; o mês em curso é parcial."
          itens={[
            "A carga do Sudeste/Centro-Oeste em GWmed (gigawatts médios), no mês mais recente do ONS.",
            "Quanto da eletricidade do Brasil vem de hidráulica, eólica e solar, em % de tudo o que foi gerado.",
            "A energia armazenada nos reservatórios (EAR), em % do máximo de cada subsistema.",
            "As 300 maiores usinas outorgadas em Minas, com potência em GW e o tipo de geração.",
          ]}
          glossario={[
            {
              termo: "ANEEL (Agência Nacional de Energia Elétrica)",
              definicao:
                "agência federal que autoriza, fiscaliza e outorga a geração de energia. O cadastro das usinas vem do SIGA, sistema da ANEEL.",
            },
            {
              termo: "Carga",
              definicao:
                "energia que o sistema precisa entregar para abastecer casas, comércios e fábricas num período. O ONS mede hora a hora e publica a média do mês.",
            },
            {
              termo: "EAR (energia armazenada nos reservatórios)",
              definicao:
                "quanto da água útil dos reservatórios ainda pode gerar energia, em % do máximo do próprio subsistema. Não é o volume total do rio.",
            },
            {
              termo: "GWmed (gigawatt médio)",
              definicao:
                "potência média durante todo o período. 1 GWmed = 1.000 MWmed = 1 milhão de kW. Serve para comparar meses de tamanhos diferentes sem distorção.",
            },
            {
              termo: "Mês em curso (parcial)",
              definicao:
                "o mês atual, com só os dias já apurados pelo ONS. A média muda quando o mês fecha; trate o número como leitura de meio de mês.",
            },
            {
              termo: "MWmed (megawatt médio)",
              definicao:
                "milésima parte do GWmed. Mil MWmed formam 1 GWmed; é a unidade em que o ONS publica a carga por subsistema.",
            },
            {
              termo: "ONS (Operador Nacional do Sistema Elétrico)",
              definicao:
                "órgão que opera a rede elétrica do país e publica carga, geração e reservatórios. As séries desta página são dos dados abertos do ONS.",
            },
            {
              termo: "Renovável",
              definicao:
                "aqui, hidráulica + eólica + solar, como o ONS classifica a fonte. A térmica fica fora mesmo quando queima biomassa.",
            },
            {
              termo: "SIN (Sistema Interligado Nacional)",
              definicao:
                "a rede que liga as regiões do país. A linha SIN do ONS é o total do Brasil e não se soma aos quatro subsistemas.",
            },
            {
              termo: "Subsistema SE/CO (Sudeste/Centro-Oeste)",
              definicao:
                "área elétrica do ONS que reúne SP, RJ, MG, ES, GO, MT, MS e o DF. Não é um estado nem uma região administrativa.",
            },
            {
              termo: "Usina outorgada",
              definicao:
                "empreendimento com autorização ou concessão da ANEEL para gerar. A potência outorgada é o limite autorizado, não o que a usina produz.",
            },
          ]}
        />
        <ResumoExpandivel
          className="mt-3 max-w-3xl text-text-soft"
          texto="Carga média mensal por subsistema desde 2000, participação de hidráulica, térmica, eólica e solar na geração, energia armazenada nos reservatórios e as 300 maiores usinas outorgadas em Minas Gerais. Dados abertos do ONS e do SIGA/ANEEL, com a data de coleta de cada série. O mês corrente é parcial: o ONS publica a média dos dias já apurados."
        />
        <DataColeta
          coletadoEm={CARGA.coletadoEm}
          fonte="ONS — dados abertos (CC-BY)"
          competencia={`séries mensais até ${MES_CARGA ? formatarMes(MES_CARGA) : "—"}`}
        />

        <div
          role="note"
          className="mt-4 max-w-3xl rounded-xl border border-dashed border-border bg-surface-2/60 p-4 text-sm leading-relaxed"
        >
          <p>
            <strong>Mês corrente é parcial:</strong> em {formatarMesLongo(MES_CARGA ?? "")},{" "}
            {CARGA_SE ? CARGA_SE.dias : "—"} de{" "}
            {MES_CARGA ? formatarNumero(diasNoMes(MES_CARGA)) : "—"} dias foram medidos. A média sobe
            ou desce quando o mês fecha, então trate o número como leitura de meio de mês, não como
            resultado final.
          </p>
          <p className="mt-2">
            <strong>EAR pode passar de 100%.</strong> A energia armazenada é percentual do máximo do
            próprio subsistema. Há {REGISTROS_EAR_ACIMA_100.length} meses oficiais acima de 100%,
            todos no Norte, com teto de {formatarPercentual(MAIOR_EAR_ACIMA_100)} — efeito de
            correção do máximo de referência na fonte, não erro de digitação. Nenhum registro foi
            editado aqui.
          </p>
        </div>
      </header>

      <IndiceWiki itens={SECOES} />

      <SecaoWiki id="resumo" titulo="1. O essencial em cinco números">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <CartaoNumero
            rotulo="Carga média · Sudeste/Centro-Oeste"
            valor={CARGA_SE ? CARGA_SE.cargaMediaMWmed / 1000 : null}
            casas={1}
            unidade="GWmed"
            detalhe={`${competencia(CARGA_SE)} · média do mês, não o pico`}
            destaque
          />
          <CartaoNumero
            rotulo="Geração renovável · Brasil (SIN)"
            valor={RENOVAVEIS_ULTIMO}
            casas={1}
            sufixo="%"
            detalhe={`Hidráulica + eólica + solar · 100% da geração do SIN · ${
              BALANCO_SIN
                ? `${formatarMesLongo(BALANCO_SIN.mes)}${
                    mesParcialPorHoras(BALANCO_SIN) ? ", mês em curso" : ", mês fechado"
                  }`
                : "sem mês publicado"
            }`}
          />
          <CartaoNumero
            rotulo="Energia armazenada · SE/CO"
            valor={EAR_SE ? EAR_SE.earPercentualMedio : null}
            casas={1}
            sufixo="%"
            detalhe={`% do máximo do próprio subsistema · ${
              EAR_SE && mesParcial(EAR_SE)
                ? `${formatarMesLongo(EAR_SE.mes)}, mês em curso`
                : `${EAR_SE ? formatarMesLongo(EAR_SE.mes) : "sem mês publicado"}, mês fechado`
            }`}
          />
          <CartaoNumero
            rotulo="Potência outorgada · MG"
            valor={POTENCIA_MG_KW / 1_000_000}
            casas={1}
            unidade="GW"
            detalhe={`Soma das ${USINAS.length} usinas publicadas, de ${formatarNumero(
              SIGA.totalNoRecorte,
            )} em MG · SIGA/ANEEL, conjunto de ${
              SIGA.dataConjunto ? formatarDataIso(SIGA.dataConjunto) : "—"
            }`}
          />
          <CartaoNumero
            rotulo="Usinas no recorte · MG"
            valor={USINAS.length}
            detalhe={`${formatarNumero(
              SIGA.totalIncluido,
            )} maiores por potência, de ${formatarNumero(
              SIGA.totalNoRecorte,
            )} em MG · piso de 10 por tipo de geração`}
          />
        </dl>

        <div className="mt-5 max-w-3xl space-y-3 text-sm leading-relaxed text-text">
          <p>
            A carga é a energia que o sistema precisou entregar. No Sudeste/Centro-Oeste, o maior
            subsistema do país, ela ficou em{" "}
            <strong className="font-tabular">
              {CARGA_SE ? formatarNumero(CARGA_SE.cargaMediaMWmed / 1000, 1) : "—"} GWmed
            </strong>{" "}
            (<span className="font-tabular">{CARGA_SE ? formatarNumero(CARGA_SE.cargaMediaMWmed) : "—"} MWmed</span>)
            no último mês publicado — {competencia(CARGA_SE)}. A média mensal esconde o pico: o ONS
            mede a operação hora a hora, e a ponta do fim de tarde é bem maior que a média.
          </p>
          <p>
            Na geração do Sistema Interligado Nacional (SIN, a rede que liga o país), hidráulica,
            eólica e solar somam <strong>{formatarPercentual(RENOVAVEIS_ULTIMO)}</strong> de toda a
            eletricidade gerada no Brasil no mês em curso. É o retrato do mês, não a média do ano: a
            parcela hidráulica sobe na estação chuvosa e cede espaço para a térmica quando os
            reservatórios baixam.
          </p>
          <p>
            Em Minas, as {USINAS.length} usinas do recorte somam{" "}
            <strong>{formatarPotenciaGw(POTENCIA_MG_KW)}</strong> de potência outorgada — o limite
            que a ANEEL autorizou, não o que elas geram. Não é a capacidade instalada do estado: o
            SIGA tem {formatarNumero(SIGA.totalNoRecorte)} empreendimentos em MG e a página publica
            os maiores, com vagas garantidas para cada tipo de geração.
          </p>
        </div>
      </SecaoWiki>

      <SecaoWiki id="carga" titulo="2. Carga de energia por subsistema">
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          Cada linha é um subsistema do ONS, em gigawatts médios. A distância entre Sudeste/Centro-Oeste
          e os demais mostra o peso da região no consumo nacional. A janela cobre os{" "}
          {JANELA_CARGA.meses.length} meses mais recentes — o que muda a leitura de hoje. O racionamento
          de 2001 fica fora dela: a série completa, desde 2000, está no arquivo do ONS.
        </p>

        <div className="mt-4">
          <GraficoCargaSubsistemas
            meses={JANELA_CARGA.meses}
            series={JANELA_CARGA.series}
            titulo="Carga média mensal por subsistema"
            subtitulo={`${formatarMes(PRIMEIRO_MES_JANELA)} a ${formatarMes(
              ULTIMO_MES_JANELA,
            )} · GWmed · fonte: ONS`}
          />
        </div>

        <TabelaCarga />

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft">
          O subsistema Sudeste/Centro-Oeste reúne São Paulo, Rio de Janeiro, Minas Gerais, Espírito
          Santo, Goiás, Mato Grosso, Mato Grosso do Sul e o Distrito Federal. Por isso ele não é
          comparável a um estado: é uma área elétrica, definida pelo ONS para operar a rede.
        </p>
      </SecaoWiki>

      <SecaoWiki id="fontes" titulo="3. De onde vem a eletricidade">
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          Participação de cada fonte na geração do SIN, média dos 12 meses fechados entre{" "}
          {formatarMesLongo(MES_INICIAL_FECHADO)} e {formatarMesLongo(MES_FINAL_FECHADO)},
          ponderada pelas horas de cada mês. A escala vai de 0 a 100% para todas as barras: a
          térmica é pequena no gráfico porque é pequena no total, não porque o desenho a encolheu.
        </p>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <GraficoParticipacaoFonte
            itens={PARTICIPACAO}
            titulo="Participação por fonte na geração"
            subtitulo={`SIN · ${formatarMes(MES_INICIAL_FECHADO)} a ${formatarMes(
              MES_FINAL_FECHADO,
            )} · fonte: ONS`}
          />
          <div>
            <h3 className="font-display text-base font-semibold text-text">
              Os números do gráfico
            </h3>
            <TabelaFontes />
            <p className="mt-2 text-xs leading-relaxed text-text-soft">
              &quot;Renovável&quot; aqui é hidráulica + eólica + solar, como o ONS classifica a
              fonte. A térmica inclui biomassa, gás e carvão sem separação nesta série — o dado não
              permite dizer qual parcela é renovável.
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-soft">
          A linha agregada <strong>SIN</strong> não é somada aos quatro subsistemas: as duas visões
          cobrem o mesmo país. Somar as partes com o todo dobraria a geração do Brasil.
        </p>
      </SecaoWiki>

      <SecaoWiki id="usinas" titulo="4. Usinas de Minas Gerais (ANEEL)">
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          As {USINAS.length} maiores usinas com outorga em Minas, por potência outorgada. Busque por
          nome, código CEG ou município — a busca ignora acento. Filtre por tipo e por fase, ordene
          pela potência e baixe o CSV do que está na tela.
        </p>
        <DataColeta
          coletadoEm={SIGA.coletadoEm}
          fonte="ANEEL — SIGA (ODbL 1.0)"
          competencia={SIGA.dataConjunto ? `conjunto de ${formatarDataIso(SIGA.dataConjunto)}` : undefined}
        />

        <TabelaUsinas usinas={USINAS} />

        <div
          role="note"
          className="mt-4 max-w-3xl rounded-xl border border-dashed border-border bg-surface-2/60 p-4 text-sm leading-relaxed"
        >
          <p>
            <strong>Potência outorgada não é geração.</strong> É o limite que a ANEEL autorizou, não
            o que a usina produz. Usina em construção aparece com potência e sem data de operação.
            Contratos bilaterais e preços de venda não constam desta base.
          </p>
          <p className="mt-2">
            O recorte tem {USINAS.length} usinas entre {formatarNumero(SIGA.totalNoRecorte)}{" "}
            empreendimentos de MG, com piso de 10 vagas por tipo de geração. Somar esta coluna dá a
            potência do recorte publicado, nunca a capacidade instalada do estado.
          </p>
        </div>
      </SecaoWiki>

      <SecaoWiki id="metodo" titulo="5. Fontes, coleta e limites">
        <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-text">
          <p>
            Toda série é lida de arquivo versionado no repositório, com a data da coleta no
            cabeçalho. Não há consulta à rede quando a página abre, então o número que aparece é o
            que foi auditado no último build.
          </p>

          <ul className="space-y-3">
            <li>
              <strong>ONS. Carga de energia.</strong> Rio de Janeiro: Operador Nacional do Sistema
              Elétrico, 2026. Disponível em:{" "}
              <a href={CARGA.fonte} className="underline hover:text-primary" rel="noreferrer">
                {CARGA.fonte}
              </a>
              . Acesso em: {formatarDataAbnt(CARGA.coletadoEm)}. Licença CC-BY.
            </li>
            <li>
              <strong>ONS. Balanço de energia por subsistema.</strong> Rio de Janeiro: ONS, 2026.
              Disponível em:{" "}
              <a href={BALANCO.fonte} className="underline hover:text-primary" rel="noreferrer">
                {BALANCO.fonte}
              </a>
              . Acesso em: {formatarDataAbnt(BALANCO.coletadoEm)}. Licença CC-BY.
            </li>
            <li>
              <strong>ONS. Energia armazenada (EAR) por subsistema.</strong> Rio de Janeiro: ONS,
              2026. Disponível em:{" "}
              <a href={EAR.fonte} className="underline hover:text-primary" rel="noreferrer">
                {EAR.fonte}
              </a>
              . Acesso em: {formatarDataAbnt(EAR.coletadoEm)}. Licença CC-BY.
            </li>
            <li>
              <strong>ANEEL. SIGA — Sistema de Informações de Geração.</strong> Brasília: Agência
              Nacional de Energia Elétrica, 2026. Disponível em:{" "}
              <a href={SIGA.datasetUrl} className="underline hover:text-primary" rel="noreferrer">
                {SIGA.datasetUrl}
              </a>
              . Acesso em: {formatarDataAbnt(SIGA.coletadoEm)}. Licença ODbL 1.0.
            </li>
          </ul>

          <div className="rounded-xl border-2 p-4" style={{ borderColor: "var(--cp-tertiary)" }}>
            <p className="font-semibold">O limite que importa: o ONS mede operação, não tarifa.</p>
            <p className="mt-1">
              Carga, geração e energia armazenada descrevem o que o sistema fez. Não dizem quanto o
              consumidor pagou, nem qual é o preço do MWh no mercado. Tarifa é assunto da ANEEL e da
              distribuidora; contrato bilateral não tem base pública nesta série. Quando a página
              fala de potência, fala de outorga — nunca de receita.
            </p>
          </div>

          <p className="text-xs text-text-soft">
            As séries cobrem {formatarMesLongo(CARGA.janela.inicio)} a{" "}
            {formatarMesLongo(CARGA.janela.fim)} (carga e EAR) e{" "}
            {formatarMesLongo(BALANCO.janela.inicio)} a {formatarMesLongo(BALANCO.janela.fim)}{" "}
            (balanço). O mês corrente é parcial nas três. EAR acima de 100% aparece em{" "}
            {REGISTROS_EAR_ACIMA_100.length} registros oficiais do Norte e está explicada na abertura
            da página.
          </p>
        </div>
      </SecaoWiki>

      <LinksRelacionados
        links={[
          {
            href: "/estado-e-economia",
            titulo: "Estado e Economia",
            descricao: "O hub do eixo: orçamento, compras públicas, empresas e Justiça.",
          },
          {
            href: "/ambiental/barragens",
            titulo: "Barragens de Minas",
            descricao: "Os três cadastros de barragens, com estabilidade e emergência.",
          },
          {
            href: "/empresas",
            titulo: "Grandes empresas",
            descricao: "Sócios, conglomerados e fornecedores do setor elétrico.",
          },
          {
            href: "/laboratorio",
            titulo: "Laboratório de dados",
            descricao: "Cruzar indicadores e comparar séries com gráfico acessível.",
          },
        ]}
      />
    </main>
  );
}
