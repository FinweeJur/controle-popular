import type { Metadata } from "next";
import NextLink from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import Moeda from "@/app/components/Moeda";
import { formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import { MARCOS_PARAOPEBA, formatarDataMarco } from "@/lib/paraopeba/linha-do-tempo";
import { COBERTURA_DOCUMENTOS_PROCESSO } from "@/lib/paraopeba/documentos";
import { coberturaBiblioteca } from "@/lib/paraopeba/biblioteca";
import {
  COBERTURA_AUDITORIA_AJRI,
  PERIODO_AUDITORIA_AJRI,
} from "@/lib/paraopeba/auditoria-ajri";
import { COBERTURA_TEMATICA_PERICIA } from "@/lib/paraopeba/temas-acervo";
// Fora do barril de propósito: `execucao-fgv.ts` são 226 KB de dado gerado e
// `execucao-fgv-dados.ts` lê o bundle com `node:fs`. Esta rota é servidor e
// monta a tabela no build, sem mandar a coleção para o cliente.
import {
  COBERTURA_EXECUCAO_FGV,
  REFERENCIA_EXECUCAO_FGV,
  TOTAL_EXECUCAO_FGV,
} from "@/lib/paraopeba/execucao-fgv";
import { MUNICIPIOS_EXECUCAO_FGV } from "@/lib/paraopeba/execucao-fgv-dados";
import { RESUMO_AUXILIO_PARAOPEBA } from "@/lib/paraopeba/auxilio";
import { COBERTURA_CLIPPING, PERIODO_CLIPPING } from "@/lib/paraopeba/clipping";
import { COBERTURA_BIBLIOTECA_DESASTRES } from "@/lib/ambiental/desastres-cobertura";
import jurisprudenciaBruta from "@/data/jurisprudencia-casos.json";
import noticiasBrutas from "@/data/noticias-desastres.json";
import mabBruto from "@/data/mab-publicacoes.json";

/**
 * `/paraopeba/panorama` — Brumadinho em uma página.
 *
 * ═══ POR QUE EXISTE ═══
 *
 * A frente tem 18 rotas, e cada uma mede um pedaço do caso: execução
 * financeira, auxílio, auditoria, perícia, autos do processo, biblioteca das
 * ATIs, clipping, notícias, MAB e jurisprudência. Quem chega de fora não sabe
 * por onde começar, e quem lê uma página não vê o conjunto. Esta é a página
 * longa de leitura: desce o feed e encontra todos os subfrentes com os números
 * medidos, a fonte e a data de cada um.
 *
 * ═══ O QUE ESTA PÁGINA NÃO FAZ ═══
 *
 * Não recalcula nada e não soma acervos diferentes. Cada bloco importa a
 * contagem do módulo que já a mede, ou filtra o arquivo de dado no build — como
 * `/eixos/casos` faz. Quando um número não existe no acervo, a página escreve
 * "não medido" em vez de estimar.
 *
 * ═══ SERVIDOR, ZERO CLIENTE ═══
 *
 * As coleções passam de 30 mil itens (57 MB só de jurisprudência). Nada disso
 * vira prop de componente de cliente (regra 5.1 do AGENTS.md): as listas são
 * reduzidas a contagens e a tabela do top 8 é montada aqui, no servidor.
 * Barras são CSS/Tailwind puro — nenhuma biblioteca nova, nenhum JS extra.
 */

interface CasoJurisprudencia {
  frente?: string;
}

interface NoticiaDesastre {
  desastre?: string | null;
}

interface PublicacaoMab {
  caso?: string | null;
}

const ARQUIVO_JURIS = jurisprudenciaBruta as {
  geradoEm?: string;
  total?: number;
  casos?: CasoJurisprudencia[];
};
const ARQUIVO_NOTICIAS = noticiasBrutas as {
  gerado_em?: string;
  janela_dias?: number;
  itens?: NoticiaDesastre[];
};
const ARQUIVO_MAB = mabBruto as {
  geradoEm?: string;
  total?: number;
  itens?: PublicacaoMab[];
};

const CASOS = ARQUIVO_JURIS.casos ?? [];
const NOTICIAS = ARQUIVO_NOTICIAS.itens ?? [];
const MAB = ARQUIVO_MAB.itens ?? [];

const ACORDAOS_BRUMADINHO = CASOS.filter((c) => c.frente === "brumadinho").length;
const NOTICIAS_BRUMADINHO = NOTICIAS.filter((n) => n.desastre === "brumadinho").length;
const MAB_BRUMADINHO = MAB.filter((m) => m.caso === "brumadinho").length;

const TOTAL_JURIS = ARQUIVO_JURIS.total ?? CASOS.length;
const TOTAL_NOTICIAS = NOTICIAS.length;
const TOTAL_MAB = ARQUIVO_MAB.total ?? MAB.length;

const JANELA_NOTICIAS = ARQUIVO_NOTICIAS.janela_dias ?? 0;
const DATA_JURIS = dia(ARQUIVO_JURIS.geradoEm);
const DATA_NOTICIAS = dia(ARQUIVO_NOTICIAS.gerado_em);
const DATA_MAB = dia(ARQUIVO_MAB.geradoEm);

/** "2026-11-08" ou ISO completo → "08/11/2026". É data de coleta, sem fuso. */
function dia(iso: string | undefined): string {
  if (!iso) return "data não registrada";
  const [ano, mes, data] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !data) return "data não registrada";
  return `${data}/${mes}/${ano}`;
}

/** Data ISO `yyyy-mm-dd` → `dd/mm/aaaa`, sem passar por fuso. */
function dataBR(iso: string): string {
  const [ano, mes, data] = iso.split("-");
  return ano && mes && data ? `${data}/${mes}/${ano}` : iso;
}

/** Percentual com uma casa decimal e vírgula — nunca ponto em texto pt-BR. */
function pct(parte: number, todo: number): string {
  if (!todo) return "—";
  return `${formatNumberBR(Number(((parte / todo) * 100).toFixed(1)))}%`;
}

export const metadata: Metadata = metadataEditavel("/paraopeba/panorama", {
  title: "Brumadinho em uma página — Paraopeba | Controle Popular",
  description:
    `O caso Brumadinho inteiro em uma leitura: ${formatNumberBR(ACORDAOS_BRUMADINHO)} acórdãos do TJMG, ${formatNumberBR(COBERTURA_DOCUMENTOS_PROCESSO.publicados)} autos com município citado, ${formatNumberBR(COBERTURA_AUDITORIA_AJRI.total)} documentos da auditoria, 645 itens das ATIs, ${formatNumberBR(NOTICIAS_BRUMADINHO)} notícias, ${formatNumberBR(MAB_BRUMADINHO)} publicações do MAB e a execução do Acordo nos 26 municípios da bacia.`,
});

/** Barra de proporção sem biblioteca — só token de cor, nunca hex cravado. */
function Barra({ fracao, rotulo }: { fracao: number; rotulo: string }) {
  const largura = Math.max(0, Math.min(100, fracao * 100));
  return (
    <span
      className="block h-2 w-full overflow-hidden rounded-full bg-chart-track"
      role="img"
      aria-label={rotulo}
    >
      <span
        className="block h-full rounded-full bg-accent"
        style={{ width: `${largura.toFixed(1)}%` }}
      />
    </span>
  );
}

function Botao({
  href,
  children,
  principal = false,
}: {
  href: string;
  children: React.ReactNode;
  principal?: boolean;
}) {
  return (
    <NextLink
      href={href}
      className={
        principal
          ? "inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition-opacity hover:opacity-90"
          : "inline-block rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary hover:text-primary"
      }
    >
      {children}
    </NextLink>
  );
}

function NaoMedido({ children }: { children?: React.ReactNode }) {
  return (
    <span className="text-[12px] italic text-text-soft">
      não medido{children ? `: ${children}` : ""}
    </span>
  );
}

function CartaoNumero({
  valor,
  rotulo,
  nota,
}: {
  valor: string;
  rotulo: string;
  nota: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="font-tabular text-2xl font-bold tracking-tight text-text">{valor}</p>
      <p className="mt-1 text-[13px] font-medium text-text">{rotulo}</p>
      <p className="mt-1 text-[12px] leading-snug text-text-soft">{nota}</p>
    </div>
  );
}

function CartaoPorta({
  href,
  rotulo,
  descricao,
}: {
  href: string;
  rotulo: string;
  descricao: string;
}) {
  return (
    <NextLink
      href={href}
      className="block rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-primary/50 hover:text-primary"
    >
      <span className="block text-sm font-semibold text-text">{rotulo}</span>
      <span className="mt-0.5 block text-[12px] leading-snug text-text-soft">{descricao}</span>
    </NextLink>
  );
}

/** As 18 portas do caso — `vale/documentos` entra como porta própria. */
const ROTAS: { href: string; rotulo: string; descricao: string }[] = [
  { href: "/paraopeba", rotulo: "Visão geral", descricao: "O hub da frente e as portas do caso" },
  { href: "/paraopeba/analise", rotulo: "Análise integrada", descricao: "Auditoria, perícia e ATIs cruzadas" },
  { href: "/paraopeba/auditoria", rotulo: "Auditoria socioambiental", descricao: "467 documentos da AECOM" },
  { href: "/paraopeba/auxilio", rotulo: "Auxílio emergencial", descricao: "Pagamentos mês a mês" },
  { href: "/paraopeba/biblioteca", rotulo: "Biblioteca das assessorias", descricao: "645 itens das ATIs" },
  { href: "/paraopeba/clipping", rotulo: "Clipping", descricao: `${formatNumberBR(COBERTURA_CLIPPING.total)} itens de imprensa` },
  { href: "/paraopeba/correlacao", rotulo: "Preços × notícias", descricao: "Ações da Vale e cobertura" },
  { href: "/paraopeba/documentos", rotulo: "Documentos do processo", descricao: "471 autos com município citado" },
  { href: "/paraopeba/entenda", rotulo: "Entenda o caso", descricao: "Siglas e estrutura da reparação" },
  { href: "/paraopeba/execucao", rotulo: "Execução por município", descricao: "26 cidades e 234 projetos" },
  { href: "/paraopeba/indice", rotulo: "Índice", descricao: "Lista de todas as portas" },
  { href: "/paraopeba/linha-do-tempo", rotulo: "Linha do tempo", descricao: "23 marcos do processo" },
  { href: "/paraopeba/mab", rotulo: "MAB", descricao: "253 publicações do movimento" },
  { href: "/paraopeba/noticias", rotulo: "Notícias", descricao: "39 itens no radar da bacia" },
  { href: "/paraopeba/pericia", rotulo: "Perícia da UFMG", descricao: "445 documentos técnicos" },
  { href: "/paraopeba/quem-atua", rotulo: "Quem atua", descricao: "Atores da reparação" },
  { href: "/paraopeba/vale", rotulo: "Ações da Vale", descricao: "A companhia no mercado e nos autos" },
  { href: "/paraopeba/vale/documentos", rotulo: "Documentos da Vale na CVM", descricao: "Autos regulatórios da companhia" },
];

const SUMARIO = [
  { href: "#numeros", rotulo: "O caso em números" },
  { href: "#aconteceu", rotulo: "O que aconteceu" },
  { href: "#dinheiro", rotulo: "Dinheiro e execução" },
  { href: "#reparacao", rotulo: "Reparação e indenização" },
  { href: "#auditoria", rotulo: "Auditoria e perícia" },
  { href: "#documentos", rotulo: "Documentos e biblioteca" },
  { href: "#noticias", rotulo: "Notícias e MAB" },
  { href: "#jurisprudencia", rotulo: "Jurisprudência" },
  { href: "#mapa", rotulo: "Mapa das subfrentes" },
];

export default async function PanoramaParaopebaPage() {
  const coberturaAti = await coberturaBiblioteca();

  const ACERVOS = [
    {
      valor: formatNumberBR(ACORDAOS_BRUMADINHO),
      rotulo: "acórdãos do TJMG",
      nota: `frente brumadinho do acervo de ${formatNumberBR(TOTAL_JURIS)} casos · ${DATA_JURIS}`,
    },
    {
      valor: formatNumberBR(COBERTURA_DOCUMENTOS_PROCESSO.publicados),
      rotulo: "autos com município citado",
      nota: `${pct(COBERTURA_DOCUMENTOS_PROCESSO.publicados, COBERTURA_DOCUMENTOS_PROCESSO.totalAcervo)} dos ${formatNumberBR(COBERTURA_DOCUMENTOS_PROCESSO.totalAcervo)} da Plataforma UFMG citam município`,
    },
    {
      valor: formatNumberBR(COBERTURA_AUDITORIA_AJRI.total),
      rotulo: "documentos da auditoria",
      nota: `${formatNumberBR(COBERTURA_AUDITORIA_AJRI.porTipo.relatorio)} relatórios + ${formatNumberBR(COBERTURA_AUDITORIA_AJRI.porTipo["nota-tecnica"])} notas · AECOM`,
    },
    {
      valor: formatNumberBR(coberturaAti.publicados),
      rotulo: "itens da biblioteca das ATIs",
      nota: `AEDAS, Guaicuy e NACAB · coleta de ${dia(coberturaAti.geradoEm)}`,
    },
    {
      valor: formatNumberBR(NOTICIAS_BRUMADINHO),
      rotulo: "notícias no radar",
      nota: `de ${formatNumberBR(TOTAL_NOTICIAS)} itens em ${JANELA_NOTICIAS} dias · ${DATA_NOTICIAS}`,
    },
    {
      valor: formatNumberBR(MAB_BRUMADINHO),
      rotulo: "publicações do MAB",
      nota: `de ${formatNumberBR(TOTAL_MAB)} no acervo do movimento · ${DATA_MAB}`,
    },
    {
      valor: formatNumberBR(MARCOS_PARAOPEBA.length),
      rotulo: "marcos na linha do tempo",
      nota: `${formatarDataMarco(MARCOS_PARAOPEBA[0].data)} a ${formatarDataMarco(MARCOS_PARAOPEBA[MARCOS_PARAOPEBA.length - 1].data)}`,
    },
    {
      valor: formatNumberBR(COBERTURA_EXECUCAO_FGV.municipios),
      rotulo: "municípios na execução da FGV",
      nota: `${formatNumberBR(COBERTURA_EXECUCAO_FGV.projetosDistintos)} projetos · relatório de ${REFERENCIA_EXECUCAO_FGV.relatorio}`,
    },
  ];

  const topMunicipios = [...MUNICIPIOS_EXECUCAO_FGV]
    .sort((a, b) => b.acordoAtual - a.acordoAtual)
    .slice(0, 8);
  const maiorAcordo = topMunicipios[0]?.acordoAtual ?? 0;

  const auxilio = RESUMO_AUXILIO_PARAOPEBA;

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[13px] text-text-soft" aria-label="Trilha">
        <NextLink href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </NextLink>{" "}
        · <span className="text-text">Panorama</span>
      </nav>

      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <header>
        <h1 className="font-display text-[clamp(1.8em,4.5vw,2.8em)] leading-[1.1] font-bold tracking-tight">
          Brumadinho em uma página
        </h1>
        <p className="mt-3 max-w-3xl text-[1.05em] leading-relaxed text-text-soft">
          O rompimento da barragem B-I da mina Córrego do Feijão, em 25/01/2019, e tudo o
          que veio depois: o Acordo de R$ 37,6 bilhões, o auxílio emergencial, a execução
          por município, a auditoria independente, a perícia da UFMG e os acervos que
          documentam o caso. Cada número abaixo tem fonte e data — e o que não foi medido
          aparece com esse nome.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Botao href="/paraopeba/analise" principal>
            Ler a análise integrada
          </Botao>
          <Botao href="/paraopeba/linha-do-tempo">Ver a linha do tempo</Botao>
        </div>

        <nav aria-label="Nesta página" className="mt-8 border-t border-border pt-4">
          <p className="text-[12px] font-semibold tracking-wide text-text-soft uppercase">
            Nesta página
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]">
            {SUMARIO.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-text-soft underline-offset-4 hover:text-primary hover:underline">
                  {item.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* ── 2. O caso em números ────────────────────────────────────────── */}
      <section id="numeros" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          O caso em números
        </h2>
        <p className="mt-1 max-w-3xl text-[.93em] text-text-soft">
          Oito contagens, cada uma de um acervo diferente. Elas não se somam: um acórdão
          não é um auto, um auto não é um documento de auditoria e uma notícia não é um
          fato oficial. A comparação útil é entre acervos, não entre totais.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACERVOS.map((a) => (
            <CartaoNumero key={a.rotulo} valor={a.valor} rotulo={a.rotulo} nota={a.nota} />
          ))}
        </div>
      </section>

      {/* ── 3. O que aconteceu ──────────────────────────────────────────── */}
      <section id="aconteceu" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          O que aconteceu
        </h2>
        <div className="mt-3 max-w-3xl space-y-3 text-[.97em] leading-relaxed text-text-soft">
          <p>
            Em 25 de janeiro de 2019, a barragem B-I da mina Córrego do Feijão, operada
            pela Vale, rompeu em Brumadinho (MG). A lama de rejeitos desceu pelo ribeirão
            Ferro-Carvão, destruiu o refeitório da própria empresa e alcançou o Rio
            Paraopeba, atingindo comunidades ao longo do vale. O caso virou processo
            judicial, acordo e uma estrutura permanente de reparação.
          </p>
          <p>
            A reparação tem camadas que não se confundem: o Termo de Compromisso da
            Defensoria Pública de MG, em 2019; o Acordo Judicial de 04/02/2021, de R$ 37,6
            bilhões; o auxílio emergencial pago mês a mês; os projetos municipais dos
            Anexos I.3 e I.4, auditados pela FGV; a fiscalização socioambiental da AECOM; e
            a perícia técnica da UFMG. Esta página reúne o número medido de cada camada.
          </p>
        </div>
        <p className="mt-4">
          <NextLink
            href="/paraopeba/linha-do-tempo"
            className="text-sm font-semibold text-accent hover:underline"
          >
            A cronologia completa, com {formatNumberBR(MARCOS_PARAOPEBA.length)} marcos →
          </NextLink>
        </p>
      </section>

      {/* ── 4. Dinheiro e execução ──────────────────────────────────────── */}
      <section id="dinheiro" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          Dinheiro e execução
        </h2>
        <p className="mt-1 max-w-3xl text-[.93em] text-text-soft">
          A FGV é a auditora independente do Acordo, nomeada pelo Juízo da 2ª Vara da
          Fazenda Pública. Ela publica, mês a mês, quanto cada município da bacia tem a
          receber, quanto está reservado em projetos autorizados e quanto já saiu do caixa.
        </p>

        <div className="mt-4 rounded-2xl border border-alert/40 bg-surface-2 p-5">
          <p className="text-[.95em] font-semibold text-text">
            Estes R$ 5,48 bilhões não são o Acordo inteiro.
          </p>
          <p className="mt-2 text-[.92em] leading-relaxed text-text-soft">
            O recorte desta página é a execução dos <strong className="text-text">Anexos
            I.3 e I.4</strong> — a parte do Acordo que vira projeto dentro de cada um dos{" "}
            {formatNumberBR(COBERTURA_EXECUCAO_FGV.municipios)} municípios da bacia, com{" "}
            {formatNumberBR(COBERTURA_EXECUCAO_FGV.projetosDistintos)} projetos distintos.
            Mobilidade, segurança hídrica, fortalecimento do serviço público e reparação
            socioambiental correm por fora, sob gestão do Estado, e a FGV não as audita
            aqui. Somar este total com os R$ 37,6 bilhões do Acordo inventa dinheiro.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[12px] text-text-soft">Acordo original do recorte</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">
              <Moeda value={TOTAL_EXECUCAO_FGV.acordoInicial} />
            </p>
            <p className="mt-1 text-[12px] text-text-soft">valores de 04/02/2021</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[12px] text-text-soft">Acordo atualizado</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">
              <Moeda value={TOTAL_EXECUCAO_FGV.acordoAtual} />
            </p>
            <p className="mt-1 text-[12px] text-text-soft">corrigido pelo IPCA</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[12px] text-text-soft">Reservado em projetos</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">
              <Moeda value={TOTAL_EXECUCAO_FGV.empenhosAutorizados} />
            </p>
            <p className="mt-1 text-[12px] text-text-soft">
              {pct(TOTAL_EXECUCAO_FGV.empenhosAutorizados, TOTAL_EXECUCAO_FGV.acordoAtual)} do
              acordo atualizado
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[12px] text-text-soft">Saldo a destinar</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">
              <Moeda value={TOTAL_EXECUCAO_FGV.saldoTeto} />
            </p>
            <p className="mt-1 text-[12px] text-text-soft">já descontada a reserva de 25% da FGV</p>
          </div>
        </div>

        <h3 className="mt-8 font-display text-lg font-semibold">
          Os 8 municípios com maior valor de acordo
        </h3>
        <p className="mt-1 text-[.9em] text-text-soft">
          Dos {formatNumberBR(COBERTURA_EXECUCAO_FGV.municipios)} municípios da bacia,
          ordenados pelo acordo atualizado. A barra compara cada um ao maior da lista; a
          última coluna mostra a fatia no total do recorte.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-[.9em]">
            <caption className="sr-only">
              Top 8 municípios por acordo atualizado, com valor reservado e participação no
              total do recorte I.3/I.4
            </caption>
            <thead className="text-text-soft">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-3 font-medium">Município</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Acordo atualizado</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Reservado</th>
                <th scope="col" className="py-2 text-right font-medium">% do total</th>
              </tr>
            </thead>
            <tbody>
              {topMunicipios.map((m) => (
                <tr key={m.municipio} className="border-b border-border/60 align-top">
                  <td className="py-2.5 pr-3">
                    <span className="font-medium text-text">{m.municipio}</span>
                    <span className="mt-1 block max-w-[16rem]">
                      <Barra
                        fracao={maiorAcordo ? m.acordoAtual / maiorAcordo : 0}
                        rotulo={`${m.municipio}: ${pct(m.acordoAtual, maiorAcordo)} do maior valor da lista`}
                      />
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right font-tabular whitespace-nowrap">
                    <Moeda value={m.acordoAtual} />
                  </td>
                  <td className="py-2.5 pr-3 text-right font-tabular whitespace-nowrap">
                    <Moeda value={m.empenhosAutorizados} />
                  </td>
                  <td className="py-2.5 text-right font-tabular whitespace-nowrap">
                    {pct(m.acordoAtual, TOTAL_EXECUCAO_FGV.acordoAtual)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold text-text">
                <td className="py-2.5 pr-3">
                  Total dos {formatNumberBR(COBERTURA_EXECUCAO_FGV.municipios)} municípios
                </td>
                <td className="py-2.5 pr-3 text-right font-tabular whitespace-nowrap">
                  <Moeda value={TOTAL_EXECUCAO_FGV.acordoAtual} />
                </td>
                <td className="py-2.5 pr-3 text-right font-tabular whitespace-nowrap">
                  <Moeda value={TOTAL_EXECUCAO_FGV.empenhosAutorizados} />
                </td>
                <td className="py-2.5 text-right font-tabular">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-text-soft">
          <strong className="text-text">“Reservado” não é obra pronta.</strong> A FGV chama
          esta coluna de empenho autorizado: é o dinheiro comprometido com projetos que já
          têm ordem de início. O avanço físico da obra é outro dado, que esta página não
          traz — <NaoMedido>avanço físico das obras</NaoMedido>. Fonte: FGV —
          Projeto Rio Paraopeba, relatório de {REFERENCIA_EXECUCAO_FGV.relatorio} e planilha
          financeira de {REFERENCIA_EXECUCAO_FGV.financeiro}; coleta de{" "}
          {dataBR(REFERENCIA_EXECUCAO_FGV.coletadoEm)}.
        </p>

        <p className="mt-4">
          <Botao href="/paraopeba/execucao">Ver os 26 municípios e os projetos um a um</Botao>
        </p>
      </section>

      {/* ── 5. Reparação e indenização ──────────────────────────────────── */}
      <section id="reparacao" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          Reparação e indenização
        </h2>
        <p className="mt-1 max-w-3xl text-[.93em] leading-relaxed text-text-soft">
          O auxílio emergencial é uma parte da reparação — a renda paga às famílias
          atingidas enquanto o processo corre. Ele não é a indenização individual por
          danos, que tem outro caminho judicial. Os números abaixo vêm do painel da
          reparação compilado até setembro de 2026.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-tabular text-2xl font-bold text-text">{auxilio.pessoasAtendidas}</p>
            <p className="mt-1 text-[13px] font-medium text-text">pessoas atendidas</p>
            <p className="mt-1 text-[12px] leading-snug text-text-soft">
              {auxilio.pessoasAtendidasDetalhe}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-tabular text-2xl font-bold text-text">{auxilio.valorMensal}</p>
            <p className="mt-1 text-[13px] font-medium text-text">custo mensal do NAE</p>
            <p className="mt-1 text-[12px] leading-snug text-text-soft">
              {auxilio.valorMensalDetalhe}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-tabular text-2xl font-bold text-text">
              {auxilio.municipiosAlcancados}
            </p>
            <p className="mt-1 text-[13px] font-medium text-text">municípios alcançados</p>
            <p className="mt-1 text-[12px] leading-snug text-text-soft">
              {auxilio.municipiosAlcancadosDetalhe}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-tabular text-2xl font-bold text-text">{auxilio.totalPago}</p>
            <p className="mt-1 text-[13px] font-medium text-text">pago pela Vale desde 2019</p>
            <p className="mt-1 text-[12px] leading-snug text-text-soft">
              {auxilio.totalPagoDetalhe}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-4">
          <p className="text-[.9em] font-semibold text-text">O que esta página não mede</p>
          <p className="mt-1 text-[14px] leading-relaxed text-text-soft">
            O valor da indenização individual por vítima ou por família não está nos módulos
            usados aqui — <NaoMedido>indenização individual</NaoMedido>. O total pago
            informado pelo painel soma coisas diferentes (indenizações, PTR, NAE e obras) e
            não serve como média por pessoa. Para o recorte de valores de condenação, a
            porta é a análise de jurimetria da jurisprudência, não esta página.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Botao href="/paraopeba/auxilio">Auxílio mês a mês</Botao>
          <Botao href="/paraopeba/analise">Análise integrada da reparação</Botao>
        </div>
      </section>

      {/* ── 6. Auditoria e perícia ──────────────────────────────────────── */}
      <section id="auditoria" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          Auditoria e perícia
        </h2>
        <p className="mt-1 max-w-3xl text-[.93em] text-text-soft">
          Duas vozes técnicas, com acervos e finalidades diferentes: a AECOM audita a
          execução do Acordo; a UFMG produziu a perícia judicial sobre os danos. Nenhuma
          das duas é documento da Vale ou das instituições de justiça.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="font-display text-lg font-semibold">Auditoria socioambiental — AECOM</h3>
            <p className="mt-1 text-[.9em] leading-relaxed text-text-soft">
              Auditoria independente prevista no Acordo de Reparação, contratada para
              fiscalizar a execução. O acervo é catálogo e link — nenhum PDF é espelhado.
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-[.9em]">
              <div>
                <dt className="text-[12px] text-text-soft">Documentos</dt>
                <dd className="font-tabular text-xl font-bold">
                  {formatNumberBR(COBERTURA_AUDITORIA_AJRI.total)}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-text-soft">Relatórios / notas</dt>
                <dd className="font-tabular text-xl font-bold">
                  {formatNumberBR(COBERTURA_AUDITORIA_AJRI.porTipo.relatorio)} /{" "}
                  {formatNumberBR(COBERTURA_AUDITORIA_AJRI.porTipo["nota-tecnica"])}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-text-soft">Temas</dt>
                <dd className="font-tabular text-xl font-bold">
                  {formatNumberBR(COBERTURA_AUDITORIA_AJRI.temas)}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-text-soft">Instrumentos</dt>
                <dd className="font-tabular text-xl font-bold">
                  {formatNumberBR(COBERTURA_AUDITORIA_AJRI.instrumentos)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[12px] text-text-soft">
              Período coberto: {dataBR(PERIODO_AUDITORIA_AJRI.de)} a{" "}
              {dataBR(PERIODO_AUDITORIA_AJRI.ate)}.
            </p>
            <p className="mt-4">
              <Botao href="/paraopeba/auditoria">Abrir a auditoria</Botao>
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="font-display text-lg font-semibold">Perícia judicial — UFMG</h3>
            <p className="mt-1 text-[.9em] leading-relaxed text-text-soft">
              Resultados técnicos produzidos pelos pesquisadores do projeto Brumadinho
              UFMG. Não é o mesmo acervo dos autos do processo: aqui estão os estudos, não
              as peças judiciais.
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-[.9em]">
              <div>
                <dt className="text-[12px] text-text-soft">Documentos</dt>
                <dd className="font-tabular text-xl font-bold">
                  {formatNumberBR(COBERTURA_TEMATICA_PERICIA.total)}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-text-soft">Com tema atribuído</dt>
                <dd className="font-tabular text-xl font-bold">
                  {formatNumberBR(COBERTURA_TEMATICA_PERICIA.comTema)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[12px] leading-relaxed text-text-soft">
              A maior parte do acervo é administrativa:{" "}
              {COBERTURA_TEMATICA_PERICIA.motivoDoResto}. Os 7 documentos de resultado são
              a substância técnica da perícia.
            </p>
            <p className="mt-4">
              <Botao href="/paraopeba/pericia">Abrir a perícia</Botao>
            </p>
          </div>
        </div>
      </section>

      {/* ── 7. Documentos e biblioteca ──────────────────────────────────── */}
      <section id="documentos" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          Documentos e biblioteca
        </h2>
        <p className="mt-1 max-w-3xl text-[.93em] leading-relaxed text-text-soft">
          Três acervos documentais que costumam ser confundidos. Os autos vêm do processo
          judicial; a biblioteca das ATIs reúne o que as assessorias publicaram para as
          pessoas atingidas; a biblioteca dos desastres é o mesmo material das ATIs
          catalogado pelo recorte do caso.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-tabular text-2xl font-bold text-text">
              {formatNumberBR(COBERTURA_DOCUMENTOS_PROCESSO.publicados)}
            </p>
            <p className="mt-1 text-[13px] font-medium text-text">autos com município citado</p>
            <p className="mt-1 text-[12px] leading-snug text-text-soft">
              {pct(COBERTURA_DOCUMENTOS_PROCESSO.publicados, COBERTURA_DOCUMENTOS_PROCESSO.totalAcervo)}{" "}
              dos {formatNumberBR(COBERTURA_DOCUMENTOS_PROCESSO.totalAcervo)} documentos da
              Plataforma UFMG citam um município. É uma fatia do acervo, não o processo
              inteiro; o restante não tinha município identificável no índice.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-tabular text-2xl font-bold text-text">
              {formatNumberBR(coberturaAti.publicados)}
            </p>
            <p className="mt-1 text-[13px] font-medium text-text">itens da biblioteca das ATIs</p>
            <p className="mt-1 text-[12px] leading-snug text-text-soft">
              AEDAS, Guaicuy e NACAB. Coleta de {dia(coberturaAti.geradoEm)}, com período de{" "}
              {coberturaAti.periodo.de ? dataBR(coberturaAti.periodo.de) : "—"} a{" "}
              {coberturaAti.periodo.ate ? dataBR(coberturaAti.periodo.ate) : "—"}.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-tabular text-2xl font-bold text-text">
              {formatNumberBR(COBERTURA_BIBLIOTECA_DESASTRES.porDesastre.brumadinho)}
            </p>
            <p className="mt-1 text-[13px] font-medium text-text">itens da biblioteca dos desastres</p>
            <p className="mt-1 text-[12px] leading-snug text-text-soft">
              Recorte Brumadinho da biblioteca unificada, medida em{" "}
              {dataBR(COBERTURA_BIBLIOTECA_DESASTRES.medidoEm)}. O total da biblioteca é{" "}
              {formatNumberBR(COBERTURA_BIBLIOTECA_DESASTRES.total)} itens, somando também
              Mariana ({formatNumberBR(COBERTURA_BIBLIOTECA_DESASTRES.porDesastre.mariana)}).
            </p>
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-text-soft">
          <strong className="text-text">
            As duas contagens de {formatNumberBR(coberturaAti.publicados)} não se somam.
          </strong>{" "}
          A biblioteca das ATIs e o recorte Brumadinho da biblioteca dos desastres são o
          mesmo acervo visto por dois cortes: um por assessoria, outro por caso. Somar os
          dois daria{" "}
          {formatNumberBR(
            coberturaAti.publicados +
              COBERTURA_BIBLIOTECA_DESASTRES.porDesastre.brumadinho,
          )}{" "}
          itens e dobraria o mesmo documento.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Botao href="/paraopeba/documentos">Documentos do processo</Botao>
          <Botao href="/paraopeba/biblioteca">Biblioteca das ATIs</Botao>
        </div>
      </section>

      {/* ── 8. Notícias, clipping e MAB ─────────────────────────────────── */}
      <section id="noticias" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          Notícias, clipping e MAB
        </h2>
        <p className="mt-1 max-w-3xl text-[.93em] text-text-soft">
          Três formas de acompanhar o que se fala do caso. Nenhuma delas é fato oficial:
          notícia diz que algo foi noticiado, clipping é curadoria datada e o MAB é parte
          interessada no processo.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-tabular text-2xl font-bold text-text">
              {formatNumberBR(NOTICIAS_BRUMADINHO)}
            </p>
            <p className="mt-1 text-[13px] font-medium text-text">notícias no radar</p>
            <p className="mt-1 text-[12px] leading-snug text-text-soft">
              De {formatNumberBR(TOTAL_NOTICIAS)} itens coletados nos últimos{" "}
              {JANELA_NOTICIAS} dias. Coleta de {DATA_NOTICIAS}.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-tabular text-2xl font-bold text-text">
              {formatNumberBR(COBERTURA_CLIPPING.total)}
            </p>
            <p className="mt-1 text-[13px] font-medium text-text">itens no clipping</p>
            <p className="mt-1 text-[12px] leading-snug text-text-soft">
              Curadoria manual do painel-fonte, de {dataBR(PERIODO_CLIPPING.de)} a{" "}
              {dataBR(PERIODO_CLIPPING.ate)}. Não se atualiza sozinha.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-tabular text-2xl font-bold text-text">
              {formatNumberBR(MAB_BRUMADINHO)}
            </p>
            <p className="mt-1 text-[13px] font-medium text-text">publicações do MAB</p>
            <p className="mt-1 text-[12px] leading-snug text-text-soft">
              De {formatNumberBR(TOTAL_MAB)} itens no acervo do movimento. Coleta de{" "}
              {DATA_MAB}.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Botao href="/paraopeba/noticias?fonte=bacia">Radar da bacia</Botao>
          <Botao href="/paraopeba/clipping">Clipping</Botao>
          <Botao href="/paraopeba/mab">MAB</Botao>
        </div>
      </section>

      {/* ── 9. Jurisprudência ───────────────────────────────────────────── */}
      <section id="jurisprudencia" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          Jurisprudência
        </h2>
        <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <p className="font-tabular text-3xl font-bold text-text">
              {formatNumberBR(ACORDAOS_BRUMADINHO)}
            </p>
            <p className="text-[.95em] text-text-soft">
              acórdãos do TJMG com a frente Brumadinho, de{" "}
              {formatNumberBR(TOTAL_JURIS)} casos no acervo de jurisprudência.
            </p>
          </div>
          <p className="mt-2 max-w-3xl text-[.9em] leading-relaxed text-text-soft">
            Todos os {formatNumberBR(ACORDAOS_BRUMADINHO)} são acórdãos do Tribunal de
            Justiça de Minas Gerais. O acervo é lido do arquivo de casos de{" "}
            {DATA_JURIS} e não inclui o recorte penal, que tem página própria. Valor de
            condenação e desfecho por processo são medidos na página de jurisprudência, não
            aqui.
          </p>
          <p className="mt-4">
            <Botao href="/jurisprudencia?tribunal=TJMG&estado=MG#lista">
              Ver os acórdãos do TJMG
            </Botao>
          </p>
        </div>
      </section>

      {/* ── 10. Mapa das subfrentes ─────────────────────────────────────── */}
      <section id="mapa" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          Mapa das subfrentes
        </h2>
        <p className="mt-1 max-w-3xl text-[.93em] text-text-soft">
          As {formatNumberBR(ROTAS.length)} portas do caso. Cada uma abre a página que mede
          aquele recorte; nenhuma substitui as outras.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ROTAS.map((rota) => (
            <CartaoPorta
              key={rota.href}
              href={rota.href}
              rotulo={rota.rotulo}
              descricao={rota.descricao}
            />
          ))}
        </div>
      </section>

      {/* ── Método e lacunas ───────────────────────────────────────────── */}
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-bold tracking-tight">O que ficou de fora</h2>
        <ul className="mt-3 max-w-3xl space-y-2 text-[.9em] leading-relaxed text-text-soft">
          <li>
            <strong className="text-text">Avanço físico das obras</strong> —{" "}
            <NaoMedido>a execução da FGV é desembolso, não obra entregue</NaoMedido>.
          </li>
          <li>
            <strong className="text-text">Os demais anexos do Acordo</strong> —{" "}
            <NaoMedido>mobilidade, segurança hídrica e reparação socioambiental</NaoMedido>{" "}
            correm sob gestão do Estado e não entram no recorte I.3/I.4.
          </li>
          <li>
            <strong className="text-text">Indenização individual</strong> —{" "}
            <NaoMedido>valor por vítima ou por família</NaoMedido>; o total pago soma
            programas diferentes e não vira média.
          </li>
          <li>
            <strong className="text-text">Documentos sem município:</strong>{" "}
            {formatNumberBR(
              COBERTURA_DOCUMENTOS_PROCESSO.totalAcervo -
                COBERTURA_DOCUMENTOS_PROCESSO.comMunicipioIdentificado,
            )}{" "}
            dos {formatNumberBR(COBERTURA_DOCUMENTOS_PROCESSO.totalAcervo)} documentos da
            Plataforma UFMG não têm município identificável no índice e não entram nos
            autos publicados.
          </li>
          <li>
            <strong className="text-text">Tema na perícia:</strong>{" "}
            {formatNumberBR(COBERTURA_TEMATICA_PERICIA.total - COBERTURA_TEMATICA_PERICIA.comTema)}{" "}
            dos {formatNumberBR(COBERTURA_TEMATICA_PERICIA.total)} documentos não têm tema
            atribuível — são editais, listas de equipe e papelada de chamada.
          </li>
        </ul>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
