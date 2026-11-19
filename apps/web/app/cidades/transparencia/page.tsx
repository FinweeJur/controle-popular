import type { Metadata } from "next";
import Link from "next/link";

import avaliacoesJson from "@/data/pntp/avaliacoes-mg.json";
import resumoJson from "@/data/pntp/resumo-brasil.json";
import ContadorAnimado from "@/app/components/dados/ContadorAnimado";
import DataColeta from "@/app/components/DataColeta";
import ExplicadorDaPagina from "@/app/components/ExplicadorDaPagina";
import FooterGlobal from "@/app/components/FooterGlobal";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { IndiceWiki, LinksRelacionados, SecaoWiki } from "@/app/components/wiki";
import { formatNumberBR } from "@/lib/betim/format";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";
import { metadataEditavel } from "@/lib/edicoes";
import {
  contagemPorNivel,
  formatarDecimal,
  linhasDoAno,
  resumoDoAno,
  seriePorAno,
  type AcervoPntp,
} from "@/lib/pntp/pagina";

import GraficoMediaAno from "./GraficoMediaAno";
import PainelTransparencia from "./PainelTransparencia";

/**
 * ═══ PNTP/ATRICON — TRANSPARÊNCIA DOS PORTAIS PÚBLICOS DE MG ═══
 *
 * O que é:
 *   Página do tema CIDADES com o Índice de Transparência Pública (ITP) que a
 *   Atricon mede nos portais oficiais dos entes de Minas Gerais, ciclos
 *   2022–2025: cartões de topo, série anual com N, tabela filtrável do ciclo
 *   2025 e a nota de método.
 *
 * Fonte oficial:
 *   Atricon — Programa Nacional de Transparência Pública, dados abertos em
 *   https://pntp.atricon.org.br/dados-abertos/. JSON versionado em
 *   `apps/web/data/pntp/` (`avaliacoes-mg.json`, 5.286 entes de MG;
 *   `resumo-brasil.json`, agregado nacional), gerado por
 *   `scripts/coletar-pntp.py`. Decisões em `docs/06-fontes/PNTP-ATRICON.md`.
 *
 * Por que foi feito assim:
 *   - O índice é dado de CIDADE (prefeitura e câmara de cada município), então
 *     a rota mora dentro de `/cidades`, como `/cidades/diarios` — não é frente
 *     nova nem rota solta no topo.
 *   - Server Component importa o JSON e entrega ao cliente SÓ o ciclo 2025, em
 *     tuplas (`LinhaPntp`): medido, 572 KB o recorte com todos os campos,
 *     187 KB em tupla. Nada de 5.286 linhas como props (regra 5.1).
 *   - `itp: null` é "Não Avaliado" e sai "—" na tela e vazio no CSV: a fonte
 *     grava 0 para quem não entregou o formulário, e publicar esse 0 seria
 *     dizer "transparência zero" de quem só não participou.
 *   - **Média sempre com N**: 2023 tem 14 avaliados de 1.712 entes em MG, e o
 *     número 75,1 fala desses 14, não do estado.
 *   - **Nível é selo, não cálculo**: nada aqui deriva selo do ITP.
 *   - Fonte e data de coleta visíveis (`DataColeta`), link para a página de
 *     dados abertos e citação ABNT na seção 5.
 *   - Regras 5.10 (descrição ≥ text-sm), 5.14 (390 px sem rolagem lateral) e
 *     5.16 (interface ≥ 12 px).
 */

const acervo = avaliacoesJson as unknown as AcervoPntp;
const resumo = resumoJson as unknown as {
  fonte: string;
  fonteUrl: string;
  nota: string;
  coletadoEm: string;
  anos: Array<{
    ano: number;
    entes: number;
    avaliados: number;
    naoAvaliados: number;
    itpMedio: number | null;
  }>;
};

const ANO_TABELA = 2025;

const serie = seriePorAno(acervo.entes);
const numeros = resumoDoAno(acervo.entes, ANO_TABELA);
const linhas2025 = linhasDoAno(acervo.entes, ANO_TABELA);
const niveis2025 = contagemPorNivel(
  acervo.entes.filter((ente) => ente.ano === ANO_TABELA)
);
const brasil2025 = resumo.anos.find((ano) => ano.ano === ANO_TABELA) ?? null;
const serieBrasil = resumo.anos.map((ano) => ({
  ano: ano.ano,
  media: ano.itpMedio,
  n: ano.avaliados,
}));

/** Entes estaduais do recorte (Governo, Assembleia, TJ, TCE, MP, Defensoria). */
const estaduais2025 = acervo.entes.filter(
  (ente) => ente.ano === ANO_TABELA && ente.esfera === "Estadual"
).length;

const selos2025 = niveis2025.filter((item) =>
  ["Diamante", "Ouro", "Prata"].includes(item.rotulo)
);
const totalSelos = selos2025.reduce((soma, item) => soma + item.total, 0);

const SECOES = [
  { id: "o-que-e", titulo: "1. O que é o PNTP" },
  { id: "numeros", titulo: "2. Números de MG em 2025" },
  { id: "serie", titulo: "3. Série 2022–2025" },
  { id: "tabela", titulo: "4. Tabela do ciclo 2025" },
  { id: "metodo", titulo: "5. Método e limites" },
];

const LINKS_RELACIONADOS = [
  {
    href: "/cidades",
    titulo: "203 Cidades Estratégicas do Brasil",
    descricao: "O painel do tema Cidades: capitais e polos do interior em todas as UFs.",
  },
  {
    href: "/cidades/diarios",
    titulo: "Diários Oficiais Municipais",
    descricao: "O que Betim, Contagem e Uberaba publicaram no diário oficial, com fonte.",
  },
  {
    href: "/prefeitura",
    titulo: "Contratos e Despesas da Prefeitura",
    descricao: "O gasto público do município, com empenho, fornecedor e link à fonte.",
  },
  {
    href: "/dados",
    titulo: "Catálogo de Dados Abertos",
    descricao: "As bases que alimentam o portal, com fonte, licença e data de coleta.",
  },
];

export const metadata: Metadata = metadataEditavel("/cidades/transparencia", {
  title: "Transparência dos Portais Públicos de MG — PNTP/Atricon | Controle Popular",
  description: `Índice de Transparência Pública dos entes de Minas Gerais: ${formatNumberBR(
    numeros.n
  )} avaliados no ciclo 2025, média de ${formatarDecimal(
    numeros.media
  )} pontos, e a série de 2022 a 2025 com o número de avaliados em cada ano.`,
});

export default function TransparenciaPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-text">
      <main
        id="conteudo-principal"
        className="mx-auto w-full max-w-5xl min-w-0 px-4 py-10 sm:px-6"
      >
        <nav
          aria-label="Navegação estrutural"
          className="mb-4 flex flex-wrap items-center gap-2 text-xs text-text-soft"
        >
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/cidades" className="hover:text-primary">
            Cidades
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-text">Transparência dos portais</span>
        </nav>

        {/* Outras páginas do MESMO eixo — padrão wiki, item 6a */}
        <nav aria-label="Outras páginas do tema Cidades" className="mb-6">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <li>
              <Link href="/cidades" className="font-semibold text-primary hover:underline">
                Cidades estratégicas
              </Link>
            </li>
            <li>
              <Link href="/cidades/diarios" className="font-semibold text-primary hover:underline">
                Diários municipais
              </Link>
            </li>
            <li>
              <Link
                href="/empresas/fornecedores"
                className="font-semibold text-primary hover:underline"
              >
                Fornecedores com CNPJ
              </Link>
            </li>
            <li>
              <Link href="/editais" className="font-semibold text-primary hover:underline">
                Editais de MG
              </Link>
            </li>
          </ul>
        </nav>

        <header>
          <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
            Tema Cidades · Fonte externa
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight text-text">
            Transparência dos portais públicos de Minas pelo PNTP
          </h1>
          <ExplicadorDaPagina
            frase="Cada órgão recebe nota de 0 a 100 pelo seu portal público. Esta página mostra Minas Gerais nos ciclos de 2022 a 2025."
            itens={[
              "Quantos entes de Minas foram avaliados em 2025 e qual foi a média — sempre com o N ao lado.",
              "A série de 2022 a 2025, com o aviso de que 2023 teve só 14 avaliados.",
              "A tabela do ciclo 2025, com busca, filtro por poder, esfera e selo e CSV do que está na tela.",
              "O que o índice mede e o que ele não mede: é o portal, não a gestão.",
            ]}
            glossario={[
              {
                termo: "PNTP (Programa Nacional de Transparência Pública)",
                definicao:
                  "avaliação da Atricon com os Tribunais de Contas que confere, item por item, o que cada órgão publica no portal de transparência.",
              },
              {
                termo: "ITP (Índice de Transparência Pública)",
                definicao:
                  "nota de 0 a 100 do PNTP. É o percentual de critérios de transparência atendidos; 100 significa que o portal cumpriu todos os itens avaliados.",
              },
              {
                termo: "Ente",
                definicao:
                  "cada órgão avaliado: uma prefeitura, uma câmara, um governo estadual, um tribunal. Prefeitura e câmara do mesmo município são dois entes.",
              },
              {
                termo: "Poder",
                definicao:
                  "Executivo (prefeitura ou governo) ou Legislativo (câmara ou assembleia). A tabela também traz Judiciário, Ministério Público e Tribunal de Contas.",
              },
              {
                termo: "Esfera",
                definicao: "o nível da federação a que o órgão pertence: municipal, estadual ou federal.",
              },
              {
                termo: "Selo (Prata, Ouro e Diamante)",
                definicao:
                  "nível de transparência que a Atricon atribui ao ente, na planilha da fonte. Não é calculado pelo portal a partir do ITP.",
              },
              {
                termo: "Nível",
                definicao:
                  "faixa publicada pela Atricon: Inicial, Básico, Intermediário, Elevado, Prata, Ouro e Diamante. É um selo, não uma conta que o portal refaz.",
              },
              {
                termo: "Não avaliado",
                definicao:
                  "ente que está na planilha, mas não entregou o formulário. A nota aparece como “—” e fica fora da média; nunca vale zero.",
              },
              {
                termo: "Critérios essenciais (%)",
                definicao:
                  "percentual dos itens obrigatórios da cartilha que o portal atende. Aparece na coluna “% essenciais” da tabela.",
              },
            ]}
          />
          <ResumoExpandivel
            texto={`O Programa Nacional de Transparência Pública, da Atricon com os Tribunais de Contas, dá uma nota de 0 a 100 ao portal de transparência de cada órgão público — o ITP. Esta página mostra o recorte de Minas Gerais nos quatro ciclos publicados, 2022 a 2025: ${formatNumberBR(
              numeros.n
            )} entes avaliados em 2025 com média de ${formatarDecimal(
              numeros.media
            )}, a série com o número de avaliados em cada ano e a tabela completa do último ciclo. A nota é autoavaliação conferida por auditor do Tribunal, não auditoria da gestão.`}
            className="mt-3 max-w-3xl text-text-soft"
          />
          <DataColeta
            coletadoEm={acervo.coletadoEm}
            fonte="Atricon — PNTP (dados abertos)"
            competencia="ciclos de 2022 a 2025"
          />
          <p className="mt-2 text-sm">
            <a
              href={acervo.fonteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center font-semibold text-primary hover:underline"
            >
              Baixar os dados abertos na Atricon ↗
            </a>
          </p>
        </header>

        <IndiceWiki itens={SECOES} />

        <SecaoWiki id="o-que-e" titulo="1. O que é o PNTP">
          <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-text-soft sm:text-base">
            <p>
              O <strong className="text-text">PNTP</strong> avalia a transparência ativa dos
              portais oficiais: o que o órgão publica, atualiza e deixa acessível, critério por
              critério da Cartilha de Orientação. Nasceu em 2022 de uma união entre Atricon, TCE-MT
              e TCU e hoje reúne os Tribunais de Contas do país. Cada ente recebe o{" "}
              <strong className="text-text">ITP</strong>, de 0 a 100, o percentual de critérios
              essenciais atendidos e um <strong className="text-text">nível</strong> (Inicial,
              Básico, Intermediário, Elevado e os selos Prata, Ouro e Diamante).
            </p>
            <p>
              A avaliação tem duas camadas, e a diferença importa para quem lê o número: o próprio
              órgão responde ao formulário e anexa a evidência (link da página), e um auditor do
              Tribunal de Contas confere essa evidência no sistema Avalia. É{" "}
              <strong className="text-text">autoavaliação verificada</strong> — não é auditoria de
              gestão, de gasto ou de obra.
            </p>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
              <h3 className="font-display text-base font-semibold text-text">
                O que este índice é e o que não é
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li>
                  <strong className="text-text">É</strong> uma medida do portal: o dado exigido por
                  lei está publicado, atualizado e acessível?
                </li>
                <li>
                  <strong className="text-text">Não é</strong> prova de gestão boa ou ruim: um
                  portal Diamante pode conviver com gestão questionável, e um portal Inicial não
                  prova irregularidade.
                </li>
                <li>
                  <strong className="text-text">Não é</strong> comparação direta entre 2022 e os
                  anos seguintes: em 2023 mudou a matriz de avaliação e mudou o conjunto de entes.
                </li>
              </ul>
            </div>
          </div>
        </SecaoWiki>

        <SecaoWiki id="numeros" titulo="2. Números de MG em 2025">
          <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
            O ciclo 2025 é o mais completo do recorte: {formatNumberBR(numeros.entes)} entes
            públicos de Minas na planilha, {formatNumberBR(numeros.n)} com índice. A média de{" "}
            {formatarDecimal(numeros.media)} pontos é calculada{" "}
            <strong className="text-text">só sobre os avaliados</strong> — {formatNumberBR(numeros.n)}{" "}
            de {formatNumberBR(numeros.entes)}. Os {formatNumberBR(numeros.naoAvaliados)} entes
            marcados como “Não Avaliado” ficam fora da conta e aparecem como “—” na tabela, nunca
            como zero.
          </p>

          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <li className="min-w-0 rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-xs font-medium tracking-wide text-text-soft uppercase">
                Entes avaliados · MG
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-text sm:text-3xl">
                <ContadorAnimado valor={numeros.n} />
              </p>
              <p className="mt-1 text-xs text-text-soft">
                de {formatNumberBR(numeros.entes)} entes no ciclo 2025
              </p>
            </li>
            <li className="min-w-0 rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-xs font-medium tracking-wide text-text-soft uppercase">
                Média de MG · só avaliados
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-primary sm:text-3xl">
                {numeros.media === null ? (
                  "—"
                ) : (
                  <ContadorAnimado valor={numeros.media} casas={1} />
                )}
              </p>
              <p className="mt-1 text-xs text-text-soft">
                {formatNumberBR(numeros.n)} de {formatNumberBR(numeros.entes)} avaliados
                {brasil2025
                  ? ` · Brasil: ${formatarDecimal(brasil2025.itpMedio)} com ${formatNumberBR(
                      brasil2025.avaliados
                    )} de ${formatNumberBR(brasil2025.entes)}`
                  : ""}
              </p>
            </li>
            <li className="min-w-0 rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-xs font-medium tracking-wide text-text-soft uppercase">
                Municípios com avaliação · MG
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-text sm:text-3xl">
                <ContadorAnimado valor={numeros.municipiosAvaliados} />
              </p>
              <p className="mt-1 text-xs text-text-soft">
                {formatarDecimal(numeros.pctMunicipiosAvaliados)}% ({formatNumberBR(
                  numeros.municipiosAvaliados
                )}{" "}
                de {formatNumberBR(numeros.municipios)} municípios)
              </p>
            </li>
            <li className="min-w-0 rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-xs font-medium tracking-wide text-text-soft uppercase">
                Entes no recorte · MG
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-text sm:text-3xl">
                <ContadorAnimado valor={numeros.entes} />
              </p>
              <p className="mt-1 text-xs text-text-soft">
                {formatNumberBR(numeros.municipios)} municípios + {estaduais2025} estaduais
              </p>
            </li>
          </ul>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-semibold text-text-soft uppercase">Selos de 2025</p>
              <p className="mt-1 text-sm leading-relaxed text-text-soft">
                {formatNumberBR(totalSelos)} de {formatNumberBR(numeros.n)} avaliados (
                {formatarDecimal(
                  numeros.n > 0 ? (totalSelos / numeros.n) * 100 : null
                )}
                %) tiraram selo: {selos2025.map((item) => `${item.total} ${item.rotulo}`).join(", ")}.
                O selo é atribuído pela Atricon ao ente, não calculado aqui a partir do índice.
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-semibold text-text-soft uppercase">
                Média de MG x média do Brasil
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-soft">
                Em 2025, Minas ficou em {formatarDecimal(numeros.media)} e o Brasil em{" "}
                {formatarDecimal(brasil2025?.itpMedio ?? null)} — com{" "}
                {formatNumberBR(brasil2025?.avaliados ?? 0)} entes avaliados no país. A média
                nacional bruta (com “Não Avaliado” entrando como zero) é menor; esta página usa a
                mesma régua da fonte, só avaliados.
              </p>
            </div>
          </div>
        </SecaoWiki>

        <SecaoWiki id="serie" titulo="3. Série 2022–2025">
          <div className="max-w-3xl space-y-2 text-sm leading-relaxed text-text-soft">
            <p>
              Cada ponto é a média dos entes de MG avaliados naquele ciclo, com o N logo abaixo do
              ano. Os trechos tracejados tocam <strong className="text-text">2023</strong>, quando
              só {formatNumberBR(serie.find((s) => s.ano === 2023)?.n ?? 0)} dos{" "}
              {formatNumberBR(serie.find((s) => s.ano === 2023)?.entes ?? 0)} entes de Minas foram
              avaliados: o 75,1 daquele ano fala desse punhado de entes, não do estado.
            </p>
            <p>
              Em <strong className="text-text">2022</strong> o escopo era outro —{" "}
              {formatNumberBR(serie.find((s) => s.ano === 2022)?.entes ?? 0)} entes, metodologia
              anterior —, e por isso a comparação com os ciclos seguintes é leitura de tendência,
              não de ranking.
            </p>
          </div>

          <GraficoMediaAno serie={serie} brasil={serieBrasil} />

          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-soft">
            A linha do Brasil usa a mesma régua (média só dos avaliados), com o N nacional de cada
            ciclo na tabela. Em 2023 a média nacional foi de 58,2 com 8.045 avaliados; em Minas, o
            N desabou para 14. A queda da média de MG em 2025 é do N completo, não de amostra
            pequena. Eixo de 0 a 100, a escala real do índice.
          </p>
        </SecaoWiki>

        <SecaoWiki id="tabela" titulo="4. Tabela do ciclo 2025">
          <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
            {formatNumberBR(linhas2025.length)} entes públicos de Minas no ciclo 2025, prefeitura e
            câmara de cada município mais os {estaduais2025} entes estaduais. Busca sem acento,
            filtro por poder, esfera e nível, e CSV do que estiver filtrado. A coluna ITP vazia
            (“—”) é ente não avaliado: ele existe na planilha, não tem nota.
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-text-soft">
            Prefeitura e câmara aparecem como linhas separadas de propósito: são poderes distintos,
            com portais distintos. A média de MG não é a média de nenhum dos dois.
          </p>

          <PainelTransparencia linhas={linhas2025} ano={ANO_TABELA} />
        </SecaoWiki>

        <SecaoWiki id="metodo" titulo="5. Método e limites">
          <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-text-soft">
            <div>
              <h3 className="font-display text-base font-semibold text-text">
                De onde vêm os números
              </h3>
              <p className="mt-1">
                Da planilha de avaliações que a Atricon publica em dados abertos, uma linha por
                ente e por ciclo. O portal baixa o pacote de cada ano, lê a aba de avaliações e
                publica apenas os campos do índice: ano, órgão, poder, esfera, estado, município,
                ITP, percentual de essenciais, nível e as marcas de validação. Coleta em{" "}
                {formatarDataBR(acervo.coletadoEm)}; cada linha do arquivo guarda o carimbo da
                coleta em que foi lida.
              </p>
            </div>

            <ul className="space-y-2">
              <li className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                <strong className="text-text">2023 não é “MG em 2023”.</strong> Foram{" "}
                {formatNumberBR(serie.find((s) => s.ano === 2023)?.n ?? 0)} avaliados entre{" "}
                {formatNumberBR(serie.find((s) => s.ano === 2023)?.entes ?? 0)} entes. O número
                aparece com o N ao lado e tracejado no gráfico porque média de 14 entes não
                representa um estado de 853 municípios.
              </li>
              <li className="rounded-xl border border-border bg-surface-2 p-3">
                <strong className="text-text">Nulo não é zero.</strong> “Não Avaliado” vem com
                índice zero na planilha da fonte. Publicar esse zero diria “transparência zero” de
                quem só não entregou o formulário — por isso a tela mostra “—” e o CSV deixa a
                célula vazia. Média só com avaliados; “Inexistente” tem índice e entra na conta,
                como na régua da fonte.
              </li>
              <li className="rounded-xl border border-border bg-surface-2 p-3">
                <strong className="text-text">Nível é selo, não conta.</strong> O nível vem escrito
                na planilha, atribuído pela Atricon. “Prata” e “Elevado” convivem na mesma faixa de
                índice, e derivar selo do ITP seria inventar certificação que o ente não recebeu.
              </li>
              <li className="rounded-xl border border-border bg-surface-2 p-3">
                <strong className="text-text">Poder e esfera separados.</strong> Prefeitura e câmara
                nunca entram na mesma média sem que o recorte diga que juntou. Ente estadual tem
                “Belo Horizonte” no campo município da fonte, e o portal não o trata como ente da
                capital.
              </li>
            </ul>

            <p className="text-xs">
              <strong className="text-text">Fonte (ABNT):</strong> ATRICON — ASSOCIAÇÃO DOS MEMBROS
              DOS TRIBUNAIS DE CONTAS DO BRASIL.{" "}
              <em>Programa Nacional de Transparência Pública: dados abertos</em>. Brasília, 2026.
              Disponível em:{" "}
              <a
                href={acervo.fonteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                https://pntp.atricon.org.br/dados-abertos/
              </a>
              . Acesso em {formatarDataBR(acervo.coletadoEm)}. Recorte de MG e agregado nacional
              versionados em <code className="text-xs">apps/web/data/pntp/</code>.
            </p>
          </div>
        </SecaoWiki>

        <LinksRelacionados links={LINKS_RELACIONADOS} />
      </main>

      <FooterGlobal />
    </div>
  );
}
