import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import Link from "@/lib/ambiental/link";
import { metadataEditavel } from "@/lib/edicoes";
import {
  ANO_DE_PICO,
  CFEM,
  MUNICIPIOS_PARA_50,
  MUNICIPIOS_PARA_80,
  RANKING_UF,
  SERIE_ANUAL,
  TOP_MUNICIPIOS,
  UFS_PARA_80,
} from "@/lib/ambiental/cfem";
import { IndiceWiki, LinksRelacionados, SecaoWiki } from "@/app/components/wiki";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import DataColeta from "@/app/components/DataColeta";
import CartoesResumo from "@/app/components/CartoesResumo";
import GraficoBarrasSvg from "@/app/components/GraficoBarrasSvg";
import GraficoLinhaSvg from "@/app/components/GraficoLinhaSvg";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";

/**
 * `/ambiental/mineracao` — CFEM por município.
 *
 * Fonte oficial: ANM (Agência Nacional de Mineração), dados abertos,
 * `CFEM_Distribuicao.csv` (https://dadosabertos.anm.gov.br/CFEM/).
 * O agregado versionado é `apps/web/data/anm-cfem.json`; a leitura tipada e as
 * contas (ranking, concentração, série) estão em `lib/ambiental/cfem.ts`, com
 * conferência de soma em `cfem.test.ts`. Esta página só apresenta.
 *
 * ═══ POR QUE NÃO HÁ LINK PARA A PÁGINA DO MUNICÍPIO ═══
 *
 * `/ambiental/barragens/municipio/[idIbge]` aceita código IBGE, mas o dado dela
 * é barragem, não CFEM. A página de cidade com CFEM (`/[municipio]/mineracao`)
 * mostra a CFEM ARRECADADA sobre a produção — número diferente deste, e existe
 * só para as cidades do catálogo, resolvidas por slug no banco. Ligar daqui
 * prometeria um número que a página de destino não tem. O código IBGE fica na
 * tabela para o leitor conferir na fonte.
 *
 * ═══ O QUE ESTA PÁGINA NÃO DIZ ═══
 *
 * Repasse não é aplicação: o valor é o que o ente recebeu, não o que gastou.
 * Valores nominais, sem correção monetária. O ano corrente é parcial. A
 * ressalva completa está na seção 5 e vem do campo `ressalva_editorial` do
 * próprio arquivo.
 */

export const metadata: Metadata = metadataEditavel("/ambiental/mineracao", {
  title: "CFEM: quanto a mineração repassa a cada município — Controle Popular",
  description: `Compensação Financeira pela Exploração Mineral (CFEM) repassada a ${formatNumberBR(
    CFEM.municipiosComRepasse
  )} municípios e ${RANKING_UF.length} estados entre ${CFEM.primeiroAno} e ${
    CFEM.ultimoAno
  }, com ranking por UF, os 20 municípios que mais receberam e a série por ano. Dado derivado do arquivo aberto da ANM.`,
});

const MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Real com os centavos da fonte — nunca "meio bilhão". */
function reais(valor: number): string {
  return MOEDA.format(valor);
}

function percentual(valor: number): string {
  return `${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

const MESES_ABNT = [
  "jan.",
  "fev.",
  "mar.",
  "abr.",
  "maio",
  "jun.",
  "jul.",
  "ago.",
  "set.",
  "out.",
  "nov.",
  "dez.",
];

/** Data no formato ABNT ("18 nov. 2026"), sempre a do arquivo — nunca digitada. */
function dataABNT(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MESES_ABNT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const SECOES = [
  { id: "totais", titulo: "1. O total do Brasil" },
  { id: "uf", titulo: "2. Ranking por UF" },
  { id: "municipios", titulo: "3. Municípios que mais receberam" },
  { id: "ano", titulo: `4. Série por ano, ${CFEM.primeiroAno}–${CFEM.ultimoAno}` },
  { id: "metodo", titulo: "5. Método: o que este número é e não é" },
];

const LINKS_RELACIONADOS = [
  {
    href: "/ambiental/barragens",
    titulo: "Barragens de Minas Gerais",
    descricao:
      "Os três cadastros de barragens, com nível de emergência e condição de estabilidade.",
  },
  {
    href: "/ambiental/licenciamento",
    titulo: "Licenciamento ambiental",
    descricao: "Licenças deferidas em Minas, por município, setor e classe de risco.",
  },
  {
    href: "/ambiental/autuacoes",
    titulo: "Autos de infração ambiental",
    descricao: "A autuação do Sisema, ano a ano, com valor lavrado e município.",
  },
  {
    href: "/ambiental/estudos",
    titulo: "Estudos de impacto (EIA/RIMA)",
    descricao: "Onde o Estado hospeda os estudos que embasaram cada licença.",
  },
];

const IRMAS = [
  { href: "/barragens", rotulo: "Barragens", descricao: "Os três cadastros de barragens" },
  {
    href: "/licenciamento",
    rotulo: "Licenciamento",
    descricao: "Licenças deferidas em Minas",
  },
  {
    href: "/autuacoes",
    rotulo: "Autos de infração",
    descricao: "Autuação do Sisema em 2024–2026",
  },
  {
    href: "/estudos",
    rotulo: "Estudos de impacto",
    descricao: "EIA/RIMA e audiências públicas",
  },
];

/** Bloco do topo: outras páginas do eixo, com uma frase de porquê. */
function NavIrmaos() {
  return (
    <nav
      aria-label="Outras páginas do eixo ambiental"
      className="mt-8 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-4"
    >
      <h2 className="text-sm font-semibold">Do mesmo eixo</h2>
      <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        {IRMAS.map((irma) => (
          <li key={irma.href}>
            <Link href={irma.href} className="underline hover:text-primary">
              {irma.rotulo}
            </Link>
            <span className="opacity-70"> — {irma.descricao}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Cabecalho() {
  return (
    <header className="space-y-4">
      <p
        className="text-[.82em] font-semibold uppercase tracking-wide"
        style={{ color: "var(--cp-tertiary)" }}
      >
        Ambiental · Mineração · CFEM
      </p>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        CFEM: quanto a mineração repassou a cada município
      </h1>
      <ResumoExpandivel
        className="max-w-2xl text-sm"
        texto={`A CFEM é a Compensação Financeira pela Exploração Mineral: um percentual do que a mineração extrai, recolhido pela ANM e repartido entre os entes. Este arquivo soma o que foi repassado entre ${CFEM.primeiroAno} e ${CFEM.ultimoAno}: ${reais(CFEM.totalBrasil)} no país, dos quais ${reais(CFEM.totalMunicipios)} foram a municípios e ${reais(CFEM.totalEstados)} aos governos estaduais. A distribuição é concentrada — ${UFS_PARA_80} estados somam mais de 80% do valor — e o repasse não diz como o dinheiro foi gasto.`}
      />
      <DataColeta
        coletadoEm={CFEM.geradoEm}
        fonte="ANM — CFEM Distribuição por ente (dados abertos)"
        competencia={`${CFEM.primeiroAno} a ${CFEM.ultimoAno}${
          CFEM.anoParcial ? `, ${CFEM.anoParcial} parcial` : ""
        }`}
      />
      <NavIrmaos />
      <IndiceWiki itens={SECOES} />
    </header>
  );
}

function SecaoTotais() {
  const cartoes = [
    {
      rotulo: `Repasse total, ${CFEM.primeiroAno}–${CFEM.ultimoAno}`,
      valor: reais(CFEM.totalBrasil),
      detalhe: "Municípios e estados somados, em valores nominais",
      destaque: true,
    },
    {
      rotulo: "Repasse aos municípios",
      valor: reais(CFEM.totalMunicipios),
      detalhe: `${formatNumberBR(CFEM.municipiosComRepasse)} municípios receberam alguma coisa`,
    },
    {
      rotulo: "Repasse aos estados",
      valor: reais(CFEM.totalEstados),
      detalhe: `${RANKING_UF.length} UFs; não entra no corte por município`,
    },
    {
      rotulo: "Anos cobertos",
      valor: CFEM.anos.length,
      detalhe: `${CFEM.primeiroAno} a ${CFEM.ultimoAno}${
        CFEM.anoParcial ? ` — ${CFEM.anoParcial} parcial` : ""
      }`,
    },
  ];

  return (
    <SecaoWiki id="totais" titulo={SECOES[0].titulo}>
      <CartoesResumo itens={cartoes} colunas={2} />
      <p className="mt-4 max-w-2xl text-sm opacity-85">
        A soma dos municípios é menor que o total porque os estados também recebem:
        {" "}
        {reais(CFEM.totalEstados)} ficaram com os governos estaduais, e esse dinheiro não
        aparece na conta de nenhuma cidade. Das {formatNumberBR(CFEM.linhasFonte)} linhas do
        arquivo da ANM, {formatNumberBR(CFEM.linhasSemCodigoMunicipal)} são repasses ao ente
        estadual, sem código municipal.
      </p>
      <p className="mt-2 max-w-2xl text-sm opacity-85">
        O ano de maior repasse é {ANO_DE_PICO.ano}: {reais(ANO_DE_PICO.total)}. O maior
        município recebedor, {TOP_MUNICIPIOS[0].nome}, ficou com{" "}
        {reais(TOP_MUNICIPIOS[0].total)} — {percentual(TOP_MUNICIPIOS[0].percentualBrasil)} do
        repasse do país.
      </p>
    </SecaoWiki>
  );
}

function SecaoUf() {
  const destaques = RANKING_UF.slice(0, UFS_PARA_80);
  const itensGrafico = RANKING_UF.slice(0, 10).map((linha, indice) => ({
    rotulo: linha.uf,
    valor: linha.percentual,
    cor:
      indice < UFS_PARA_80
        ? "var(--color-warning, #f59e0b)"
        : "var(--color-primary, #10b981)",
  }));

  return (
    <SecaoWiki id="uf" titulo={SECOES[1].titulo}>
      <p className="max-w-2xl text-sm opacity-85">
        <strong>Mineração é concentrada, e o repasse segue a mina.</strong>{" "}
        {UFS_PARA_80} UFs — {destaques.map((l) => l.uf).join(" e ")} — somam{" "}
        {percentual(
          destaques.reduce((soma, linha) => soma + linha.percentual, 0)
        )}{" "}
        do repasse do país. As cinco primeiras chegam a{" "}
        {percentual(
          RANKING_UF.slice(0, 5).reduce((soma, linha) => soma + linha.percentual, 0)
        )}
        . As outras {RANKING_UF.length - UFS_PARA_80} UFs dividem o restante.
      </p>
      <div className="mt-4 rounded-2xl border border-[var(--cp-border)] p-4 sm:p-6">
        <GraficoBarrasSvg
          itens={itensGrafico}
          titulo="Repasse da CFEM por UF — participação no total do país"
          subtitulo={`Percentual do total de ${CFEM.primeiroAno} a ${CFEM.ultimoAno}. Em laranja, as UFs que somam mais de 80%.`}
          descricaoAcessivel={`Gráfico de barras do repasse da CFEM por UF. ${destaques
            .map((l) => `${l.uf}: ${percentual(l.percentual)}`)
            .join("; ")}. Gráfico das dez primeiras; a tabela abaixo tem as ${RANKING_UF.length} UFs.`}
          orientacao="horizontal"
          unidade="%"
        />
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--cp-border)]">
        <table className="w-full min-w-[38rem] text-sm">
          <caption className="sr-only">
            Repasse da CFEM por unidade da federação, {CFEM.primeiroAno} a {CFEM.ultimoAno}
          </caption>
          <thead className="bg-[var(--cp-surface-2)] text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">UF</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Repasse total</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">% do Brasil</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Municípios</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                Ao governo do estado
              </th>
            </tr>
          </thead>
          <tbody>
            {RANKING_UF.map((linha) => (
              <tr key={linha.uf} className="border-t border-[var(--cp-border)]">
                <th scope="row" className="px-3 py-2 text-left font-medium">{linha.uf}</th>
                <td className="px-3 py-2 text-right font-tabular">{reais(linha.total)}</td>
                <td className="px-3 py-2 text-right font-tabular">
                  {percentual(linha.percentual)}
                </td>
                <td className="px-3 py-2 text-right font-tabular">
                  {formatNumberBR(linha.municipios)}
                </td>
                <td className="px-3 py-2 text-right font-tabular">{reais(linha.totalEstado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-2xl text-sm opacity-75">
        &quot;Ao governo do estado&quot; é o que sobrou da UF depois de descontados os
        repasses aos municípios dela. A coluna de municípios conta quantos receberam algum
        valor em algum ano — não quantos têm mina ativa hoje.
      </p>
    </SecaoWiki>
  );
}

function SecaoMunicipios() {
  return (
    <SecaoWiki id="municipios" titulo={SECOES[2].titulo}>
      <p className="max-w-2xl text-sm opacity-85">
        {MUNICIPIOS_PARA_50} municípios somam metade do repasse destinado a municípios;{" "}
        {MUNICIPIOS_PARA_80} somam 80%. São {formatNumberBR(CFEM.municipiosComRepasse)} no
        total, e a cauda é longa: a maioria recebe pouco porque o minério sai de poucos
        lugares.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--cp-border)]">
        <table className="w-full min-w-[38rem] text-sm">
          <caption className="sr-only">
            Os 20 municípios que mais receberam CFEM entre {CFEM.primeiroAno} e{" "}
            {CFEM.ultimoAno}
          </caption>
          <thead className="bg-[var(--cp-surface-2)] text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">#</th>
              <th scope="col" className="px-3 py-2 font-semibold">Município</th>
              <th scope="col" className="px-3 py-2 font-semibold">UF</th>
              <th scope="col" className="px-3 py-2 font-semibold">Código IBGE</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Repasse recebido</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">% do Brasil</th>
            </tr>
          </thead>
          <tbody>
            {TOP_MUNICIPIOS.map((linha, indice) => (
              <tr key={linha.codigoIbge} className="border-t border-[var(--cp-border)]">
                <td className="px-3 py-2 font-tabular opacity-70">{indice + 1}</td>
                <th scope="row" className="px-3 py-2 text-left font-medium">{linha.nome}</th>
                <td className="px-3 py-2">{linha.uf}</td>
                <td className="px-3 py-2 font-tabular">{linha.codigoIbge}</td>
                <td className="px-3 py-2 text-right font-tabular">{reais(linha.total)}</td>
                <td className="px-3 py-2 text-right font-tabular">
                  {percentual(linha.percentualBrasil)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-2xl text-sm opacity-75">
        É o repasse recebido pelo município — não o que a mina produziu no território, nem o
        que a prefeitura gastou. O portal não tem página por município com este repasse: o
        código IBGE está na tabela para conferir direto na{" "}
        <a href={CFEM.urlFonte} className="underline" rel="noreferrer noopener" target="_blank">
          base da ANM
        </a>
        .
      </p>
    </SecaoWiki>
  );
}

function SecaoAno() {
  const pontos = SERIE_ANUAL.map((linha) => ({
    rotulo: linha.ano,
    valor: Math.round(linha.total / 1_000_000),
    destaque: linha.ano === ANO_DE_PICO.ano,
    anotacao: linha.ano === CFEM.anoParcial ? "parcial" : undefined,
  }));
  const primeiro = SERIE_ANUAL[0];

  return (
    <SecaoWiki id="ano" titulo={SECOES[3].titulo}>
      <p className="max-w-2xl text-sm opacity-85">
        Em {CFEM.primeiroAno} o repasse foi {reais(primeiro.total)}; o pico é{" "}
        {ANO_DE_PICO.ano}, com {reais(ANO_DE_PICO.total)}. A série oscila com o preço do
        minério e com o volume extraído — e é nominal: cada ano está no dinheiro daquele ano,
        sem correção.
      </p>
      <div className="mt-4 rounded-2xl border border-[var(--cp-border)] p-4 sm:p-6">
        <GraficoLinhaSvg
          pontos={pontos}
          titulo="CFEM repassada por ano — Brasil"
          subtitulo={
            CFEM.anoParcial
              ? `Em R$ milhões correntes. ${CFEM.anoParcial} está parcial.`
              : "Em R$ milhões correntes."
          }
          descricaoAcessivel={`Série do repasse da CFEM por ano, em milhões de reais nominais. ${CFEM.primeiroAno}: R$ ${Math.round(
            primeiro.total / 1_000_000
          )} milhões. Pico em ${ANO_DE_PICO.ano}: R$ ${Math.round(
            ANO_DE_PICO.total / 1_000_000
          )} milhões. Valores exatos na tabela abaixo.`}
          prefixo="R$ "
          unidade=" mi"
          altura={280}
        />
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--cp-border)]">
        <table className="w-full min-w-[26rem] text-sm">
          <caption className="sr-only">
            Repasse da CFEM por ano, {CFEM.primeiroAno} a {CFEM.ultimoAno}
          </caption>
          <thead className="bg-[var(--cp-surface-2)] text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">Ano</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Repasse total</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Linhas na fonte</th>
            </tr>
          </thead>
          <tbody>
            {SERIE_ANUAL.map((linha) => (
              <tr key={linha.ano} className="border-t border-[var(--cp-border)]">
                <th scope="row" className="px-3 py-2 text-left font-medium">
                  {linha.ano}
                  {linha.ano === CFEM.anoParcial ? (
                    <span className="ml-2 text-sm opacity-70">parcial</span>
                  ) : null}
                </th>
                <td className="px-3 py-2 text-right font-tabular">{reais(linha.total)}</td>
                <td className="px-3 py-2 text-right font-tabular opacity-80">
                  {formatNumberBR(linha.linhas)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-2xl text-sm opacity-75">
        &quot;Linhas na fonte&quot; é o número de distribuições mensais que a ANM publicou
        naquele ano — serve para ver o tamanho do registro, não o valor.
      </p>
    </SecaoWiki>
  );
}

function SecaoMetodo() {
  return (
    <SecaoWiki id="metodo" titulo={SECOES[4].titulo}>
      <ul className="max-w-2xl space-y-3 text-sm opacity-85">
        <li>
          <strong>Repasse não é aplicação.</strong> O valor diz quanto o ente recebeu da
          CFEM, não como gastou. Nenhuma frase desta página afirma destino do dinheiro.
        </li>
        <li>
          <strong>Valores nominais, sem correção monetária.</strong> {reais(CFEM.totalBrasil)}{" "}
          é a soma de {CFEM.anos.length} anos no dinheiro de cada ano — somar{" "}
          {CFEM.primeiroAno} com {CFEM.ultimoAno} superestima o poder de compra do passado.
        </li>
        {CFEM.anoParcial ? (
          <li>
            <strong>{CFEM.anoParcial} é parcial.</strong> O recorte vai até a última
            atualização do arquivo na ANM, em {dataABNT(CFEM.atualizadoNaFonte)}. Compare
            esse ano com os anteriores sabendo disso.
          </li>
        ) : null}
        <li>
          <strong>Distribuição não é arrecadação.</strong> A CFEM arrecadada sobre a produção
          e o rateio entre os entes são contas diferentes, com defasagem — o número aqui é o
          rateio.
        </li>
        <li>
          <strong>Dado derivado.</strong> O CSV da ANM tem {formatNumberBR(CFEM.linhasFonte)}{" "}
          linhas (uma por distribuição e mês,{" "}
          {(CFEM.bytesFonte / 1_000_000).toLocaleString("pt-BR", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}{" "}
          MB); esta página lê o agregado por ente e por ano, gerado a partir dele. A soma por
          UF e a soma por ano fecham com o total do Brasil, com{" "}
          {CFEM.diferencaCentavos} centavo{CFEM.diferencaCentavos === 1 ? "" : "s"} de
          diferença por arredondamento.
        </li>
        <li>
          <strong>Fonte.</strong> ANM. Agência Nacional de Mineração.{" "}
          <em>CFEM — Distribuição por ente</em>. Dados abertos, arquivo{" "}
          <code className="text-[.95em]">CFEM_Distribuicao.csv</code>. Disponível em:{" "}
          <a href={CFEM.urlFonte} className="underline" rel="noreferrer noopener" target="_blank">
            dadosabertos.anm.gov.br/CFEM/CFEM_Distribuicao.csv
          </a>
          . Acesso em: {dataABNT(CFEM.geradoEm)}.
        </li>
      </ul>
    </SecaoWiki>
  );
}

export default function MineracaoIndex() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Cabecalho />
      <SecaoTotais />
      <SecaoUf />
      <SecaoMunicipios />
      <SecaoAno />
      <SecaoMetodo />
      <LinksRelacionados links={LINKS_RELACIONADOS} />
      <MeioAmbienteRelacionado />
    </div>
  );
}
