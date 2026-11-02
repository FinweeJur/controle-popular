import { Suspense, type ReactNode } from "react";
import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import RepasseBrumadinho from "@/app/[municipio]/components/RepasseBrumadinho";
import BarrasValor from "@/app/[municipio]/components/charts/BarrasValor";
import Moeda from "@/app/components/Moeda";
import DataColeta from "@/app/components/DataColeta";
import { getVisaoGeral } from "@/lib/betim/prefeitura";
import { getCaixaDisponivel } from "@/lib/betim/caixa";
import { getDiarioOficialInfo } from "@/lib/betim/diarioOficial";
import { getViagens } from "@/lib/betim/viagens";
import { arquivoRepasse } from "@/lib/brumadinho/repasse";
import {
  formatCurrencyBRL,
  formatCurrencyCompactaBR,
  formatDateBR,
  formatNumberBR,
} from "@/lib/betim/format";
import {
  cidadeDaRota,
  metadataDaCidade,
  nomePortal,
  type Cidade,
} from "@/lib/betim/cidade";
import {
  AREAS,
  TELAS,
  TOTAL_DE_TELAS,
  type AreaPainel,
  type TelaDaArea,
} from "@/lib/prefeitura/areas";
import BarraDeAreas, { BarraDeAreasCompleta } from "./BarraDeAreas";
import PainelDiarias from "./PainelDiarias";

/**
 * @file `/[municipio]/prefeitura` — painel da Prefeitura, um por cidade.
 *
 * O QUE MUDOU (02/11/2026): a família tinha 11 rotas por cidade e uma fila de
 * 12 abas no topo desta página. Agora esta é a porta única, com seis áreas
 * (`?area=dinheiro|compras|pessoal|obras|cultura|diario`), âncoras por seção e
 * um rodapé com as páginas irmãs que continuaram vivas.
 *
 * O QUE NÃO MUDOU, PORQUE NÃO PODIA: nenhuma tela com dado próprio virou
 * recorte. Contratos, licitações, fornecedores, despesas, cultura, servidores,
 * obras e Diário Oficial continuam rotas com busca, filtro, ordenação e
 * exportação próprios — o painel linka cada uma e resume o que já era resumo
 * aqui (caixa, receita, gastos por função, maiores fornecedores, última edição
 * do Diário). Só `/prefeitura/diarias` foi absorvido, porque era o único sem
 * interação: uma tabela servida pelo servidor, agora `?area=pessoal`
 * (`PainelDiarias.tsx`). `/prefeitura/legislacao` já era ponte desde 2026-08-07.
 *
 * POR QUE `force-static`: o alvo `output: 'export'` (GitHub Pages) não tem
 * request na geração, e uma rota que lê `searchParams` no servidor derruba o
 * build. O `?area=` é lido no cliente (`BarraDeAreas.tsx`), o mesmo padrão de
 * `prefeitura/despesas/PainelDespesas.tsx`. Em troca, a página é gerada uma vez
 * com TODAS as áreas visíveis — no alvo estático o botão de faceta ancora a
 * seção, sem esconder conteúdo.
 *
 * NÚMEROS: os cartões continuam com a fonte ao lado (SICONFI, PNCP, IBGE) e a
 * data de coleta vem do arquivo do rateio, nunca digitada. `PainelFacetas`
 * mostra o N de cada área, que é o número de telas realmente listadas — não
 * uma contagem de registro inventada para enfeitar botão.
 */

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export const dynamic = "force-static";

export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Prefeitura de ${c.nome}: contratos, despesas e servidores — ${nomePortal(c)}`,
  (c) =>
    `Painel da Prefeitura de ${c.nome} por área: dinheiro e despesas, compras e contratos, pessoal e viagens, obras, cultura e Diário Oficial, com link para cada tela.`,
  "/prefeitura"
);

interface Props {
  params: Promise<{ municipio: string }>;
}

/** Dados que as seções compartilham — buscados uma vez, no servidor. */
interface DadosDoPainel {
  cidade: Cidade;
  visaoGeral: Awaited<ReturnType<typeof getVisaoGeral>>;
  caixa: Awaited<ReturnType<typeof getCaixaDisponivel>>;
  diario: Awaited<ReturnType<typeof getDiarioOficialInfo>>;
  viagens: Awaited<ReturnType<typeof getViagens>>;
}

export default async function PrefeituraPainelPage({ params }: Props) {
  const cidade = await cidadeDaRota(params);
  const [visaoGeral, caixa, diario, arqRepasse, viagens] = await Promise.all([
    getVisaoGeral(cidade.id_municipio),
    getCaixaDisponivel(cidade.id_municipio),
    getDiarioOficialInfo(cidade),
    // O dump do rateio mora em arquivo (com carimbo `atualizado_na_fonte`);
    // a data visível vem DELE, nunca digitada na página.
    arquivoRepasse(),
    // Conteúdo absorvido de `/prefeitura/diarias` (ver `PainelDiarias.tsx`).
    getViagens(cidade.id_municipio),
  ]);

  const facetas = AREAS.map((area) => ({
    slug: area.slug,
    rotulo: area.rotulo,
    n: area.telas.length,
  }));
  const nota = `N = telas da área: rota viva ou bloco deste painel. A soma é ${TOTAL_DE_TELAS}.`;
  // Telas vivas do rodapé: as absorvidas (`href: null`) ficam de fora porque
  // o link delas seria a própria âncora da seção acima.
  const telasVivas = TELAS.filter(
    (tela): tela is TelaDaArea & { href: string } => tela.href !== null
  );
  const dados: DadosDoPainel = { cidade, visaoGeral, caixa, diario, viagens };

  return (
    <div id="topo" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
      <Cabecalho cidade={cidade} />

      <div className="mt-4">
        <DataColeta
          coletadoEm={arqRepasse?.atualizado_na_fonte ?? null}
          fonte="rateio do Acordo de Reparação de Brumadinho (Pró-Brumadinho/SEGOV)"
        />
      </div>

      <div id="nav-areas" className="mt-8 scroll-mt-24">
        {/* `<Suspense>` porque `useSearchParams()` está no cliente; o fallback
            é a mesma faixa sem botão aceso, então a barra nunca some do HTML. */}
        <Suspense
          fallback={
            <BarraDeAreasCompleta facetas={facetas} total={TOTAL_DE_TELAS} nota={nota} />
          }
        >
          <BarraDeAreas facetas={facetas} total={TOTAL_DE_TELAS} nota={nota} />
        </Suspense>
      </div>

      <div className="mt-8 space-y-8">
        {AREAS.map((area, indice) => (
          <Secao key={area.slug} area={area} proxima={AREAS[indice + 1]}>
            <ConteudoDaArea area={area} dados={dados} />
          </Secao>
        ))}
      </div>

      <FaixaDePaginas cidade={cidade} telas={telasVivas} />
    </div>
  );
}

/** Trilha e abertura: o que é a página e de quem são os dados. */
function Cabecalho({ cidade }: { cidade: Cidade }) {
  return (
    <>
      <nav aria-label="Trilha de navegação" className="mb-4 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/" className="hover:text-primary">
          {cidade.nome}
        </Link>{" "}
        · <span className="font-semibold text-text">Prefeitura</span>
      </nav>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Prefeitura de {cidade.nome}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft sm:text-base">
          Dados públicos sobre contratos, gastos, pessoal e estrutura da
          administração municipal de {cidade.nome}, agregados de fontes oficiais.
          Escolha a área abaixo: o resumo aparece aqui e a tela com busca, filtro
          e exportação abre no endereço próprio dela.
        </p>
      </header>
    </>
  );
}

/**
 * Rodapé de navegação: as telas irmãs que continuaram com endereço próprio,
 * mais as duas páginas que já moravam fora da família (Plano de Governo e o
 * acervo normativo da Câmara, que era a aba "Legislação" do menu antigo).
 */
function FaixaDePaginas({
  cidade,
  telas,
}: {
  cidade: Cidade;
  telas: readonly (TelaDaArea & { href: string })[];
}) {
  return (
    <>
      <nav
        aria-label="Páginas irmãs da Prefeitura"
        className="mt-10 rounded-2xl border border-border bg-surface p-4 sm:p-5"
      >
        <h2 className="font-display text-lg font-semibold text-text">
          Páginas irmãs que continuam vivas
        </h2>
        <p className="mt-1 text-sm text-text-soft">
          Cada uma tem endereço próprio e não perdeu nada ao entrar neste painel.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {telas.map((tela) => (
            <li key={tela.slug}>
              <Link
                href={tela.href}
                className="inline-block rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary hover:bg-primary/15"
              >
                {tela.titulo}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/gestao"
              className="inline-block rounded-full bg-surface-2 px-3 py-1.5 font-medium text-text hover:bg-surface-2/70"
            >
              Plano de Governo
            </Link>
          </li>
          <li>
            <Link
              href="/camara/legislacao"
              className="inline-block rounded-full bg-surface-2 px-3 py-1.5 font-medium text-text hover:bg-surface-2/70"
            >
              Legislação (Câmara)
            </Link>
          </li>
        </ul>
      </nav>

      <p className="mt-6 text-sm">
        <Link className="underline" href="/">
          Voltar para o início de {cidade.nome}
        </Link>
      </p>
    </>
  );
}

/**
 * Casca de uma área: título, as N telas que ela entrega (a lista visível é o
 * denominador do botão de faceta) e a navegação "descer"/"subir".
 *
 * As âncoras usam `<a href="#id">` cru de propósito: rolagem dentro da mesma
 * página não é navegação de rota, e `next/link` só atrapalharia.
 */
function Secao({
  area,
  proxima,
  children,
}: {
  area: AreaPainel;
  proxima?: AreaPainel;
  children: ReactNode;
}) {
  return (
    <section
      id={`area-${area.slug}`}
      aria-labelledby={`titulo-area-${area.slug}`}
      className="scroll-mt-24 rounded-2xl border border-border bg-surface p-4 sm:p-6"
    >
      <header className="space-y-3">
        <h2
          id={`titulo-area-${area.slug}`}
          className="font-display text-2xl font-bold tracking-tight text-text"
        >
          {area.titulo}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          {area.descricao}
        </p>
        <ul className="space-y-2">
          {area.telas.map((tela) => (
            <li key={tela.slug} className="text-sm">
              {tela.href ? (
                <Link href={tela.href} className="font-medium text-accent hover:underline">
                  {tela.titulo} →
                </Link>
              ) : (
                <a href={`#${tela.ancora}`} className="font-medium text-accent hover:underline">
                  {tela.titulo} ↓
                </a>
              )}{" "}
              <span className="text-text-soft">— {tela.descricao}</span>
            </li>
          ))}
        </ul>
      </header>

      <div className="mt-4">{children}</div>

      <nav
        aria-label={`Navegação na área ${area.rotulo}`}
        className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3 text-sm"
      >
        <a href="#nav-areas" className="font-medium underline">
          ↑ Subir para as áreas
        </a>
        {proxima ? (
          <a href={`#area-${proxima.slug}`} className="font-medium underline">
            ↓ Descer para {proxima.rotulo}
          </a>
        ) : (
          <a href="#topo" className="font-medium underline">
            ↑ Voltar ao topo
          </a>
        )}
      </nav>
    </section>
  );
}

/** Qual bloco de conteúdo mora em cada área. */
function ConteudoDaArea({
  area,
  dados,
}: {
  area: AreaPainel;
  dados: DadosDoPainel;
}) {
  if (area.slug === "dinheiro") {
    return (
      <ConteudoDinheiro
        cidade={dados.cidade}
        visaoGeral={dados.visaoGeral}
        caixa={dados.caixa}
      />
    );
  }
  if (area.slug === "compras") {
    return <ConteudoCompras visaoGeral={dados.visaoGeral} />;
  }
  if (area.slug === "pessoal") {
    return <PainelDiarias cidade={dados.cidade} viagens={dados.viagens} />;
  }
  if (area.slug === "diario") {
    return <ConteudoDiario cidade={dados.cidade} diario={dados.diario} />;
  }
  return (
    <p className="text-sm text-text-soft">
      O conteúdo completo — inclusive busca, filtro e o que a fonte de cada
      cidade não publica — está na tela acima.
    </p>
  );
}

/** Área "Dinheiro": o que entrou, o que foi pago e o custo por habitante. */
function ConteudoDinheiro({
  cidade,
  visaoGeral,
  caixa,
}: {
  cidade: Cidade;
  visaoGeral: Awaited<ReturnType<typeof getVisaoGeral>>;
  caixa: Awaited<ReturnType<typeof getCaixaDisponivel>>;
}) {
  return (
    <div className="space-y-6">
      {caixa ? (
        <DataCard
          title={`Caixa disponível em ${caixa.ano}`}
          source={{ label: "SICONFI/Tesouro Nacional", url: "https://siconfi.tesouro.gov.br/" }}
        >
          <p className="font-tabular text-2xl font-bold text-text">
            <Moeda value={caixa.valor} />
          </p>
          {caixa.anoAnterior && caixa.valorAnterior ? (
            <p className="mt-1 text-xs text-text-soft">
              {caixa.valor >= caixa.valorAnterior ? "+" : ""}
              <Moeda value={caixa.valor - caixa.valorAnterior} /> em relação a{" "}
              {caixa.anoAnterior}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-text-soft">
            Inclui dinheiro que já tem destino certo (saúde, educação etc.).
            Não é dinheiro livre pra gastar em qualquer coisa.
          </p>
        </DataCard>
      ) : null}

      <RepasseBrumadinho idMunicipio={cidade.id_municipio} />

      {!visaoGeral.ok ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          <p className="mb-2 font-medium text-text">Visão geral — em breve</p>
          <p>
            Indicadores como gastos por função e maiores fornecedores aparecem
            aqui assim que os dados oficiais forem conectados. Por enquanto, veja
            os{" "}
            <Link href="/prefeitura/contratos" className="font-medium text-accent hover:underline">
              contratos administrativos
            </Link>
            , já disponíveis via PNCP.
          </p>
        </div>
      ) : (
        <>
          {visaoGeral.custoPerCapitaAno > 0 && (
            <DataCard
              title={`Custo da Prefeitura por habitante em ${visaoGeral.ano}`}
              source={{
                label: "SICONFI/Tesouro Nacional + IBGE",
                url: "https://siconfi.tesouro.gov.br/",
              }}
            >
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <p className="font-tabular text-2xl font-bold text-text">
                  <Moeda value={visaoGeral.custoPerCapitaAno / 12} />
                  <span className="ml-1 text-sm font-normal text-text-soft">por mês</span>
                </p>
                <p className="font-tabular text-lg font-semibold text-text-soft">
                  <Moeda value={visaoGeral.custoPerCapitaAno} />
                  <span className="ml-1 text-sm font-normal">por ano</span>
                </p>
              </div>
              <p className="mt-2 text-xs text-text-soft">
                Despesa total paga em {visaoGeral.ano} (
                <Moeda value={visaoGeral.despesaTotal} />) dividida pela população
                de {visaoGeral.populacaoAno} ({formatNumberBR(visaoGeral.populacao)}{" "}
                habitantes). Mede o tamanho do orçamento por pessoa — não é um
                valor cobrado de cada morador.
              </p>
            </DataCard>
          )}

          <DataCard
            title={`Receita realizada em ${visaoGeral.ano}`}
            source={{ label: "SICONFI/Tesouro Nacional", url: "https://siconfi.tesouro.gov.br/" }}
          >
            <p className="font-tabular text-2xl font-bold text-text">
              <Moeda value={visaoGeral.receitaTotal} />
            </p>
          </DataCard>

          <DataCard
            title={`Maiores gastos por função em ${visaoGeral.ano} (despesas pagas)`}
            source={{ label: "SICONFI/Tesouro Nacional", url: "https://siconfi.tesouro.gov.br/" }}
          >
            <BarrasValor
              formatValor={formatCurrencyCompactaBR}
              itens={visaoGeral.gastosPorFuncao.map((item) => ({
                label: item.funcao,
                valor: item.valor,
                titulo: `${item.funcao}: ${formatCurrencyBRL(item.valor)} pagos em ${visaoGeral.ano}`,
              }))}
            />
            <p className="mt-3 text-xs text-text-soft">
              Ver o detalhe completo, com filtro por ano, em{" "}
              <Link href="/prefeitura/despesas" className="font-medium text-accent hover:underline">
                Despesas por função →
              </Link>
            </p>
          </DataCard>
        </>
      )}
    </div>
  );
}

/** Área "Compras": quem mais recebeu, e o caminho para as três telas do PNCP. */
function ConteudoCompras({
  visaoGeral,
}: {
  visaoGeral: Awaited<ReturnType<typeof getVisaoGeral>>;
}) {
  if (!visaoGeral.ok) {
    return (
      <p className="text-sm text-text-soft">
        O ranking de fornecedores aparece aqui quando os dados do PNCP desta
        cidade estiverem conectados. O ranking completo está na tela{" "}
        <Link href="/prefeitura/fornecedores" className="font-medium text-accent hover:underline">
          Maiores fornecedores
        </Link>
        .
      </p>
    );
  }

  return (
    <DataCard
      title="Maiores fornecedores (soma de todos os contratos)"
      source={{ label: "PNCP", url: "https://pncp.gov.br/" }}
    >
      <BarrasValor
        formatValor={formatCurrencyCompactaBR}
        itens={visaoGeral.maioresFornecedores.map((item) => ({
          label: item.nome,
          valor: item.valor,
          titulo: `${item.nome}: ${formatCurrencyBRL(item.valor)} somando todos os contratos`,
        }))}
      />
      <p className="mt-3 text-xs text-text-soft">
        Os cinco primeiros do acumulado. Ranking completo com filtros, CSV e
        índices em{" "}
        <Link href="/prefeitura/fornecedores" className="font-medium text-accent hover:underline">
          Maiores fornecedores →
        </Link>
      </p>
    </DataCard>
  );
}

/** Área "Diário Oficial": a última edição e o link para a tela completa. */
function ConteudoDiario({
  cidade,
  diario,
}: {
  cidade: Cidade;
  diario: Awaited<ReturnType<typeof getDiarioOficialInfo>>;
}) {
  /* Só cidade com fonte `diario_oficial` ganha o card — link para o diário
     errado é pior que ausência (mesma doutrina da rede de proteção). Itinga
     não tem fonte e não renderiza. */
  const urlDiario = cidade.fontes?.diario_oficial;
  if (typeof urlDiario !== "string") {
    return (
      <p className="text-sm text-text-soft">
        Esta cidade ainda não tem um Diário Oficial conectado neste portal.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface-2 p-5">
      <div>
        <h3 className="font-display text-base font-semibold text-text">
          Diário Oficial (Órgão Oficial)
        </h3>
        <p className="mt-1 max-w-xl text-sm text-text-soft">
          Leis, decretos e atos são publicados diariamente no Órgão Oficial de{" "}
          {cidade.nome}.{" "}
          {diario?.ultimaEdicao ? (
            <>
              Última edição:{" "}
              <strong className="text-text">nº {diario.ultimaEdicao}</strong>
              {diario.ultimaData ? <> de {formatDateBR(diario.ultimaData)}</> : null} ·{" "}
              {formatNumberBR(diario.totalAno)} edições em {diario.ano}.
            </>
          ) : null}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/prefeitura/diario"
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-ink hover:bg-primary/90"
        >
          Consultar atos e editais →
        </Link>
        <a
          href={urlDiario}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-surface px-4 py-1.5 text-sm font-medium text-text hover:bg-surface/70"
        >
          Portal original ↗
        </a>
      </div>
    </div>
  );
}
