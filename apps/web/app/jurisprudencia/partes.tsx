import Link from "next/link";
import ContadorAnimado from "@/app/components/dados/ContadorAnimado";
import BarraAnimada from "@/app/components/dados/BarraAnimada";
import { CartaoCaso, LinhaCaso } from "./LinhaCaso";
import {
  CorpoGrafico,
  prepararItens,
  TIPOS_GRAFICO,
  type TipoGrafico,
} from "./graficos";
import { NOMES_FRENTE, NOMES_TIPO } from "./rotulos";
import casosJson from "@/data/jurisprudencia-casos.json";
import resumoJson from "@/data/jurisprudencia-resumo.json";
import noticiasJson from "@/data/noticias-tribunais.json";
import {
  poloPorAno,
  temasUnicos,
  valoresUnicos,
  contagemPor,
  contagemTemasIndenizacao,
  contarLista,
  estatisticasDeValor,
  faixasDeValor,
  ROTULOS,
  type CasoJurisprudencia,
  type Filtros,
  type Pagina,
} from "@/lib/jurisprudencia";

/**
 * @file Partes visuais da página /jurisprudencia.
 *
 * Separadas da rota para o CodeScene medir cada módulo: a página fica só com
 * a composição, e aqui moram tabela, cartões, gráfico, formulário e notas.
 * Tudo é componente de servidor — nada vai para o cliente.
 */

interface Resumo {
  geradoEm: string;
  fonte: string;
  coleta: string;
  publicacao: string;
  auditoria: Record<string, number>;
  polo: Record<string, number>;
  resultado: Record<string, number>;
  temas: Record<string, number>;
  danos_pnab: Record<string, number>;
  processos_sem_dano: number;
  valores: Record<string, number | null>;
  status_resumos: Record<string, number>;
  amostragem: Record<string, string | number>;
}

interface ArquivoCasos {
  geradoEm: string;
  total: number;
  casos: CasoJurisprudencia[];
}

interface Noticia {
  tribunal: string;
  data: string;
  titulo: string;
  resumo: string;
  url: string;
  termos: string;
}

const NOTICIAS = (noticiasJson as { itens: Noticia[] }).itens;

export const resumo = resumoJson as Resumo;
export const CASOS = (casosJson as ArquivoCasos).casos;

/**
 * Fronteira entre o acervo penal e o acervo de desastres (04/11/2026).
 *
 * O frente `penal` reúne 6.182 processos (TJES e STF) coletados por âncoras de
 * desastre, mas a maioria é crime comum da região — homicídio, tráfico, júri — e
 * não responsabilização criminal do rompimento.
 *
 * Até 04/11 a página de desastres ainda trazia 239 desses casos, com a desculpa
 * de que citavam o desastre. O dono cortou: penal tem página própria e não
 * aparece nesta. Processo penal do desastre continua acessível em
 * `/jurisprudencia/penal`, onde o recorte é o crime, não a indenização.
 */
export const CASOS_DESASTRE = CASOS.filter((caso) => caso.frente !== "penal");

const NOMES_TRIBUNAL: Record<string, string> = {
  TJMG: "TJMG (MG)",
  TJES: "TJES (ES)",
  STF: "STF",
  STJ: "STJ",
  TST: "TST",
};

const NOMES_PNAB: Record<string, string> = {
  perda_propriedade: "Perda de propriedade",
  desvalorizacao_imoveis: "Desvalorização de imóveis",
  perda_capacidade_produtiva: "Perda de capacidade produtiva",
  perda_areas_pesca: "Perda de áreas de pesca",
  agua_abastecimento: "Água e abastecimento",
  perda_renda_trabalho: "Perda de renda/trabalho",
  mudanca_habitos_psicossociais: "Mudança de hábitos psicossociais",
  comunidades_tradicionais: "Comunidades tradicionais",
  acesso_areas_urbanas_rurais: "Acesso a áreas urbanas/rurais",
  deslocamento_compulsorio: "Deslocamento compulsório",
  atividades_produtivas_locais: "Atividades produtivas locais",
  outros_pnab_peab: "Outros PNAB/PEAB",
};

export const reais = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function contar(frente: string): number {
  return CASOS_DESASTRE.filter((caso) => caso.frente === frente).length;
}

/**
 * Ranking em barras.
 *
 * Substitui a tabela de três colunas onde o que importa é a ordem, não o
 * cruzamento: no celular a barra cabe inteira, a tabela rolava de lado.
 *
 * `total` é o denominador do percentual e vem do chamador — nunca do maior
 * item da lista. Percentual sobre base errada é o erro mais fácil de publicar
 * sem perceber.
 */
export function Grafico({
  titulo,
  dados,
  total,
  nota,
  limite = 10,
  tipo = "barras",
}: {
  titulo: string;
  dados: [string, number][];
  total: number;
  nota?: string;
  limite?: number;
  tipo?: TipoGrafico;
}) {
  // Rosca e blocos não se leem com dez fatias: nesses dois, o limite cai.
  const teto = tipo === "barras" ? limite : 6;
  const itens = prepararItens(dados, teto, (chave) => ROTULOS[chave] ?? NOMES_PNAB[chave] ?? chave);
  return (
    <section className="mx-auto w-full max-w-3xl space-y-2">
      <h2 className="font-display text-lg font-semibold">{titulo}</h2>
      <CorpoGrafico tipo={tipo} itens={itens} total={total} />
      {nota ? <p className="text-xs opacity-70">{nota}</p> : null}
    </section>
  );
}

/**
 * Troca a representação do painel inteiro: barras, rosca ou blocos.
 *
 * Mesmo mecanismo da faixa de temas — link com o estado na URL. Escolher
 * "rosca" troca os oito gráficos de uma vez, o que é o comportamento de painel
 * que o dono pediu; não faz sentido ter metade do painel em barras.
 */
export function SeletorGrafico({ filtros, tipo }: { filtros: Filtros; tipo: TipoGrafico }) {
  return (
    <nav id="grafico" className="flex scroll-mt-24 flex-wrap items-center gap-2 text-sm" aria-label="Tipo de gráfico">
      <span className="opacity-70">Como ver:</span>
      {TIPOS_GRAFICO.map((opcao) => (
        <Link
          key={opcao.slug}
          href={hrefCom({ ...filtros, grafico: opcao.slug }, 1)}
          className={
            tipo === opcao.slug
              ? "rounded-full border border-[var(--cp-primary)] bg-[var(--cp-primary)] px-3 py-1 text-white"
              : "rounded-full border border-[var(--cp-border)] px-3 py-1 hover:border-[var(--cp-primary)]"
          }
        >
          {opcao.rotulo}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Faixa de botões do painel: um recorte por vez, estado na URL.
 *
 * É link, não `useState` (AGENTS §5.1 e §5.13): o acervo tem 16.834 itens e não
 * pode virar prop de cliente; e a casca não desmonta entre um clique e outro.
 * De quebra, cada recorte fica compartilhável e o histórico do navegador
 * funciona como "voltar".
 *
 * A contagem do acervo inteiro é cara (normaliza 16.834 ementas) e não muda
 * entre requisições: fica em cache de módulo, no servidor. Sem isso, cada
 * clique num botão de tema refaria a varredura completa.
 */
let cacheTemasIndenizacao: ReturnType<typeof contagemTemasIndenizacao> | null = null;

function contagemTemasDoAcervo() {
  cacheTemasIndenizacao ??= contagemTemasIndenizacao(CASOS_DESASTRE);
  return cacheTemasIndenizacao;
}

export function FaixaTemas({ filtros }: { filtros: Filtros }) {
  const contagem = contagemTemasDoAcervo();
  const total = CASOS_DESASTRE.length;
  const semRecorte: Filtros = { ...filtros, recorte: undefined };
  const botao = (ativo: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${
      ativo
        ? "border-[var(--cp-primary)] bg-[var(--cp-primary)] text-white"
        : "border-[var(--cp-border)] hover:border-[var(--cp-primary)]"
    }`;
  return (
    <nav id="temas" className="space-y-2 scroll-mt-24" aria-label="Recorte por tema de indenização">
      <h2 className="font-display text-lg font-semibold">Recorte por tema</h2>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link className={botao(!filtros.recorte)} href={hrefCom(semRecorte, 1)}>
            Todos · {total.toLocaleString("pt-BR")}
          </Link>
        </li>
        {contagem.map((tema) => (
          <li key={tema.slug}>
            <Link
              className={botao(filtros.recorte === tema.slug)}
              href={hrefCom({ ...filtros, recorte: tema.slug }, 1)}
            >
              {tema.rotulo} · {tema.n.toLocaleString("pt-BR")}
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs opacity-70">
        Cada número é quantos itens do acervo citam o tema no texto da decisão — um caso pode
        entrar em mais de um recorte.
      </p>
    </nav>
  );
}

export function Tabela({
  titulo,
  dados,
  total,
  nota,
}: {
  titulo: string;
  dados: Record<string, number>;
  total: number;
  nota?: string;
}) {
  const itens = Object.entries(dados).sort((a, b) => b[1] - a[1]);
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">{titulo}</h2>
      <div className="overflow-x-auto rounded-lg border border-[var(--cp-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--cp-surface-2)] text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">Categoria</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">N</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            {itens.map(([chave, valor]) => (
              <tr key={chave} className="border-t border-[var(--cp-border)]">
                <td className="px-3 py-2">{ROTULOS[chave] ?? NOMES_PNAB[chave] ?? chave}</td>
                <td className="px-3 py-2 text-right font-tabular">{valor}</td>
                <td className="px-3 py-2 text-right font-tabular opacity-70">
                  {total ? `${((100 * valor) / total).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {nota ? <p className="text-xs opacity-70">{nota}</p> : null}
    </section>
  );
}

export function Cartoes() {
  const semResumo = CASOS_DESASTRE.filter((caso) => caso.status === "sem_resumo").length;
  const acordaosh = CASOS_DESASTRE.length - contar("sumula");
  const sumulas = contar("sumula");
  const itens: [string, number, string][] = [
    ["Itens no acervo", CASOS_DESASTRE.length, "acórdãos e súmulas"],
    ["Acórdãos", acordaosh, "TJMG, TJES, STF, STJ"],
    ["Súmulas", sumulas, "STF, STJ e TST"],
    ["Sem resumo de mérito", semResumo, "entram na lista, sem polo"],
  ];
  return (
    <section id="cartoes" className="grid scroll-mt-24 gap-3 sm:grid-cols-2">
      {itens.map(([rotulo, valor, nota]) => (
        <div key={rotulo} className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="text-xs uppercase tracking-wide opacity-60">{rotulo}</p>
          <p className="font-display text-2xl font-bold">
            <ContadorAnimado valor={valor} />
          </p>
          <p className="text-xs opacity-60">{nota}</p>
        </div>
      ))}
    </section>
  );
}

const CORES_POLO: Record<string, string> = {
  empresa: "bg-[var(--cp-secondary)]",
  atingido: "bg-[var(--cp-primary)]",
  parcial: "bg-[var(--cp-tertiary)]",
};

export function GraficoPoloAno({ casos }: { casos: CasoJurisprudencia[] }) {
  const anos = poloPorAno(casos);
  const maior = Math.max(...anos.map((item) => item.total), 1);
  return (
    <section className="mx-auto w-full max-w-3xl space-y-3">
      <h2 className="font-display text-xl font-semibold">Brumadinho: polo por ano</h2>
      <div className="mx-auto max-w-md space-y-2">
        {anos.map((item) => (
          <div key={item.ano} className="flex items-center gap-3 text-sm">
            <span className="w-12 shrink-0 font-tabular opacity-70">{item.ano}</span>
            <div className="flex h-5 w-full max-w-56 overflow-hidden rounded bg-[var(--cp-surface-2)]">
              {item.partes.map(([polo, n]) => (
                <BarraAnimada
                  key={polo}
                  fracao={n / maior}
                  className={`h-full ${CORES_POLO[polo] ?? "bg-[var(--cp-border)]"}`}
                  style={{ width: `${(100 * n) / maior}%` }}
                />
              ))}
            </div>
            <span className="shrink-0 font-tabular opacity-70">
              <ContadorAnimado valor={item.total} />
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs opacity-70">
        Cada barra é um ano; os segmentos são o polo vencedor. N = {casos.length}.
      </p>
    </section>
  );
}

function Opcoes({ valores, nomes }: { valores: string[]; nomes: Record<string, string> }) {
  return (
    <>
      <option value="">Todos</option>
      {valores.map((valor) => (
        <option key={valor} value={valor}>{nomes[valor] ?? valor}</option>
      ))}
    </>
  );
}

export function Formulario({ filtros }: { filtros: Filtros }) {
  const campo = "rounded border border-[var(--cp-border)] bg-transparent px-2 py-1";
  return (
    <form method="get" className="grid gap-3 rounded-lg border border-[var(--cp-border)] p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Processo ou súmula</span>
        <input name="q" defaultValue={filtros.q} placeholder="número do processo" className={campo} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Frente</span>
        <select name="frente" defaultValue={filtros.frente} className={campo}>
          <Opcoes valores={valoresUnicos(CASOS_DESASTRE, "frente")} nomes={NOMES_FRENTE} />
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Tribunal</span>
        <select name="tribunal" defaultValue={filtros.tribunal} className={campo}>
          <Opcoes valores={valoresUnicos(CASOS_DESASTRE, "tribunal")} nomes={NOMES_TRIBUNAL} />
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Estado</span>
        <select name="estado" defaultValue={filtros.estado} className={campo}>
          <Opcoes valores={valoresUnicos(CASOS_DESASTRE, "estado")} nomes={{}} />
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Tipo</span>
        <select name="tipo" defaultValue={filtros.tipo} className={campo}>
          <Opcoes valores={valoresUnicos(CASOS_DESASTRE, "tipo")} nomes={NOMES_TIPO} />
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Polo</span>
        <select name="polo" defaultValue={filtros.polo} className={campo}>
          <option value="">Todos</option>
          {contagemPor(CASOS_DESASTRE, "polo").map(([polo]) => (
            <option key={polo} value={polo}>{ROTULOS[polo] ?? polo}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Tema</span>
        <select name="tema" defaultValue={filtros.tema} className={campo}>
          <option value="">Todos</option>
          {temasUnicos(CASOS_DESASTRE).map((tema) => (
            <option key={tema} value={tema}>{tema}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Comarca</span>
        <select name="comarca" defaultValue={filtros.comarca} className={campo}>
          <Opcoes valores={valoresUnicos(CASOS_DESASTRE, "comarca")} nomes={{}} />
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Ano</span>
        <select name="ano" defaultValue={filtros.ano} className={campo}>
          <Opcoes valores={valoresUnicos(CASOS_DESASTRE, "ano")} nomes={{}} />
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Ordem</span>
        <select name="ordem" defaultValue={filtros.ordem} className={campo}>
          <option value="ano_desc">Ano (mais novo)</option>
          <option value="ano_asc">Ano (mais antigo)</option>
          <option value="comarca">Comarca</option>
          <option value="polo">Polo</option>
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button type="submit" className="rounded bg-[var(--cp-primary)] px-4 py-2 text-sm font-semibold text-white">
          Filtrar
        </button>
        <Link className="text-sm underline" href="/jurisprudencia#lista">Limpar</Link>
      </div>
    </form>
  );
}

const COLUNAS = ["Processo", "Tribunal/Ano", "Polo/Resultado", "Temas", ""];

export function TabelaCasos({ itens }: { itens: CasoJurisprudencia[] }) {
  return (
    <>
      {/* Desktop: 5 colunas com largura fixa — cabe sem rolar de lado. */}
      <div className="hidden overflow-x-auto rounded-lg border border-[var(--cp-border)] md:block">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-[var(--cp-surface-2)] text-left">
            <tr>
              {COLUNAS.map((rotulo, indice) => (
                <th
                  key={rotulo || `coluna-${indice}`}
                  scope="col"
                  className="whitespace-nowrap px-2 py-2 font-semibold"
                >
                  {rotulo || <span className="sr-only">Ações</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itens.map((caso) => (
              <LinhaCaso key={caso.id} caso={caso} />
            ))}
          </tbody>
        </table>
      </div>
      {/* Celular: cartão empilhado, nada de tabela de 9 colunas rolando. */}
      <ul className="space-y-3 md:hidden">
        {itens.map((caso) => (
          <CartaoCaso key={caso.id} caso={caso} />
        ))}
      </ul>
    </>
  );
}

export function hrefCom(filtros: Filtros, pagina: number, base = "/jurisprudencia"): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor) params.set(chave, String(valor));
  }
  if (pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function Paginacao({
  pagina,
  filtros,
  base = "/jurisprudencia",
}: {
  pagina: Pagina<CasoJurisprudencia>;
  filtros: Filtros;
  base?: string;
}) {
  return (
    <nav className="flex items-center justify-between text-sm" aria-label="Paginação">
      {pagina.pagina > 1 ? (
        <Link className="underline" href={hrefCom(filtros, pagina.pagina - 1, base)}>← anterior</Link>
      ) : (
        <span />
      )}
      <span className="opacity-70">{pagina.pagina} / {pagina.totalPaginas}</span>
      {pagina.pagina < pagina.totalPaginas ? (
        <Link className="underline" href={hrefCom(filtros, pagina.pagina + 1, base)}>próxima →</Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

const RECORTES: { rotulo: string; nota: string; href: string; ativo: (t: string, f: string) => boolean }[] = [
  {
    rotulo: "Brumadinho — TJMG",
    nota: "2ª instância de Minas Gerais · polo e danos PNAB/PEAB",
    href: "/jurisprudencia?frente=brumadinho#lista",
    ativo: (_t, f) => f === "brumadinho",
  },
  {
    rotulo: "Rio Doce — TJMG",
    nota: "Comarcas da bacia do Doce · sem resumo ainda",
    href: "/jurisprudencia?frente=riodoce&tribunal=TJMG#lista",
    ativo: (t, f) => f === "riodoce" && t === "TJMG",
  },
  {
    rotulo: "Fundão/Rio Doce — TJES",
    nota: "2ª instância do Espírito Santo · sem polo classificado",
    href: "/jurisprudencia?frente=riodoce&tribunal=TJES#lista",
    ativo: (t, f) => f === "riodoce" && t === "TJES",
  },
  {
    rotulo: "Direitos humanos — TJMG",
    nota: "Acórdãos de DH do TJMG · 123 com resumo",
    href: "/jurisprudencia?frente=dh#lista",
    ativo: (_t, f) => f === "dh",
  },
  {
    rotulo: "Súmulas — STF, STJ e TST",
    nota: "1.872 enunciados, com link para a fonte",
    href: "/jurisprudencia?frente=sumula#lista",
    ativo: (_t, f) => f === "sumula",
  },
  {
    rotulo: "Penal e criminal",
    nota: "6.182 processos do TJES e STF · página própria",
    href: "/jurisprudencia/penal",
    ativo: (_t, f) => f === "penal",
  },
];

export function Atalhos({ tribunal, frente }: { tribunal: string; frente: string }) {
  const ativo = "rounded-lg border-2 border-[var(--cp-primary)] bg-[var(--cp-primary)]/10 p-4";
  const inativo = "rounded-lg border border-[var(--cp-border)] p-4 hover:border-[var(--cp-primary)]";
  return (
    <section id="atalhos" className="scroll-mt-24 space-y-3">
      <h2 className="font-display text-xl font-semibold">Recortes por frente</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {RECORTES.map((recorte) => (
          <Link
            key={recorte.href}
            className={recorte.ativo(tribunal, frente) ? ativo : inativo}
            href={recorte.href}
          >
            <p className="font-semibold">{recorte.rotulo}</p>
            <p className="text-sm opacity-70">{recorte.nota}</p>
          </Link>
        ))}
      </div>
      {frente || tribunal ? (
        <p className="text-sm opacity-70">
          Recorte ativo: {[frente, tribunal].filter(Boolean).join(" · ")} ·{" "}
          <Link className="underline" href="/jurisprudencia#lista">ver tudo</Link>
        </p>
      ) : null}
    </section>
  );
}

export function BotoesLegislacao() {
  return (
    <section id="legislacao" className="scroll-mt-24 space-y-3">
      <h2 className="font-display text-xl font-semibold">Normas e direito crítico</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link className="rounded-lg border border-[var(--cp-border)] p-4 hover:border-[var(--cp-primary)]" href="/ambiental/legislacao">
          <p className="font-semibold">Legislação e direito crítico popular →</p>
          <p className="text-sm opacity-70">
            Normas federais, estaduais e internacionais de direitos humanos: Convenção
            169 da OIT, Pacto de San José, Marco de Sendai, Lei 12.334/2010 e o
            acervo unificado da frente ambiental.
          </p>
        </Link>
        <Link className="rounded-lg border border-[var(--cp-border)] p-4 hover:border-[var(--cp-primary)]" href="/ambiental/direitos-humanos">
          <p className="font-semibold">Direitos humanos e desastres →</p>
          <p className="text-sm opacity-70">
            O que a jurisprudência e as normas exigem em reparação, participação e
            não repetição, com os instrumentos que sustentam cada decisão.
          </p>
        </Link>
      </div>
    </section>
  );
}

export function SumulasPorTribunal() {
  const dados = CASOS.filter((caso) => caso.tipo === "sumula").reduce<Record<string, number>>((mapa, caso) => {
    mapa[caso.tribunal] = (mapa[caso.tribunal] ?? 0) + 1;
    return mapa;
  }, {});
  return (
    <div id="sumulas" className="scroll-mt-24">
      <Tabela
        titulo="Súmulas por tribunal"
        dados={dados}
        total={contar("sumula")}
        nota="STF 736, STJ 673 e TST 463 — enunciados vigentes baixados da fonte oficial."
      />
    </div>
  );
}

export function NoticiasTribunais() {
  const itens = NOTICIAS.slice(0, 12);
  return (
    <section id="noticias" className="scroll-mt-24 space-y-3">
      <h2 className="font-display text-xl font-semibold">Notícias oficiais dos tribunais</h2>
      <p className="text-sm opacity-70">
        Direitos humanos, meio ambiente, Brumadinho, Rio Doce e povos tradicionais, direto
        da fonte. O STJ não entra: o termo de uso veda coleta automatizada.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {itens.map((noticia) => (
          <li key={noticia.url} className="rounded-lg border border-[var(--cp-border)] p-4">
            <p className="text-xs uppercase tracking-wide opacity-60">
              {noticia.tribunal} · {noticia.data || "sem data"}
            </p>
            <a
              className="mt-1 block text-sm font-semibold underline"
              href={noticia.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {noticia.titulo}
            </a>
            <p className="mt-1 line-clamp-3 text-xs opacity-70">{noticia.resumo}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs opacity-60">N = {NOTICIAS.length} notícias coletadas; exibindo as 12 mais recentes.</p>
    </section>
  );
}

/**
 * O painel do recorte atual: contadores, oito barras, polo por ano e valores.
 *
 * Fica aqui, e não em `page.tsx`, porque é desenho — a página só decide qual
 * acervo entra. Todos os blocos saem do MESMO `casos`, então o número do topo,
 * a barra e a lista nunca discordam.
 */
export function PainelRecorte({
  casos,
  tipo = "barras",
}: {
  casos: CasoJurisprudencia[];
  tipo?: TipoGrafico;
}) {
  const total = casos.length;
  const comTemas = casos.filter((caso) => caso.temas.length > 0).length;
  const comDanos = casos.filter((caso) => caso.danos_pnab.length > 0).length;
  const comPolo = casos.filter((caso) => caso.polo).length;
  const valores = estatisticasDeValor(casos);
  const faixas = faixasDeValor(casos);
  const porAno = [...contagemPor(casos, "ano")].sort((a, b) => a[0].localeCompare(b[0]));
  return (
    <section id="painel" className="scroll-mt-24 space-y-8" aria-label="Painel do recorte">
      <p className="text-sm opacity-80">
        <strong>
          <ContadorAnimado valor={total} />
        </strong>{" "}
        {total === 1 ? "item no recorte" : "itens no recorte"} de{" "}
        {CASOS_DESASTRE.length.toLocaleString("pt-BR")}.
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        <Grafico titulo="Por tribunal" dados={contagemPor(casos, "tribunal")} total={total} tipo={tipo} />
        <Grafico titulo="Por frente" dados={contagemPor(casos, "frente")} total={total} tipo={tipo} />
        <Grafico
          titulo="Resultado do recurso"
          dados={contagemPor(casos, "resultado")}
          total={total}
          tipo={tipo}
          nota="Inclui itens sem resultado registrado na categoria —."
        />
        <Grafico
          titulo="Polo vencedor"
          dados={contagemPor(casos, "polo")}
          total={total}
          tipo={tipo}
          nota={`Polo só existe onde o resumo de mérito foi classificado: ${comPolo.toLocaleString("pt-BR")} itens.`}
        />
        <Grafico titulo="Por ano da decisão" dados={porAno} total={total} tipo={tipo} />
        <Grafico
          titulo="Temas do acervo"
          dados={contarLista(casos, "temas")}
          total={comTemas}
          tipo={tipo}
          nota={`Um processo entra em vários temas: ${comTemas.toLocaleString("pt-BR")} itens com tema preenchido.`}
        />
        <Grafico
          titulo="Danos PNAB/PEAB reconhecidos"
          dados={contarLista(casos, "danos_pnab")}
          total={comDanos}
          tipo={tipo}
          nota={`${comDanos.toLocaleString("pt-BR")} itens com dano classificado.`}
        />
        <Grafico
          titulo="Faixa de valor mencionado"
          dados={faixas.dados}
          total={faixas.n}
          tipo={tipo}
          nota={
            faixas.n
              ? `${faixas.n.toLocaleString("pt-BR")} decisões com valor em R$ — mediana ${reais(valores.mediana)}.`
              : "Nenhuma decisão deste recorte traz valor em R$."
          }
        />
      </div>

      <GraficoPoloAno casos={casos} />

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Valores do recorte</h2>
        <p className="text-sm opacity-80">
          {valores.n.toLocaleString("pt-BR")} decisões com valor numérico. Mediana{" "}
          {reais(valores.mediana)}; Q1 {reais(valores.q1)}; Q3 {reais(valores.q3)}.
        </p>
        <p className="text-xs opacity-70">
          O campo é o maior valor em R$ mencionado no texto — pode ser pedido, condenação ou
          valor de ação coletiva. A média não é publicada: um outlier de R$ 200 bilhões a
          distorce.
        </p>
      </section>
    </section>
  );
}

/** Método e fontes externas do acervo. */
export function RodapeMetodo() {
  return (
    <footer className="space-y-2 text-sm opacity-80">
      <h2 className="font-display text-base font-semibold">Método e fontes</h2>
      <p>
        A classificação é do portal, com método de assessoria jurídica popular — leitura da
        decisão, polo vencedor, resultado, dano e valor — e revisão humana. As assessorias
        técnicas independentes entram como referência e contraponto:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <a
            className="underline"
            href="https://nacab.org.br/wp-content/uploads/2025/07/Relatorio_PesquisaJurisprudencial_2023.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            NACAB — Relatório de Pesquisa Jurisprudencial 2023
          </a>{" "}
          (PDF, 1,6 MB).
        </li>
        <li>
          <a
            className="underline"
            href="https://guaicuy.org.br/biblioteca/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Guaicuy — biblioteca de publicações
          </a>{" "}
          (assessoria técnica independente do Paraopeba).
        </li>
        <li>
          <a
            className="underline"
            href="https://github.com/FinweeJur/tjmg-jurimetria/blob/master/relatorios/RELATORIO-GUAICUY-NACAB.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Análise do portal sobre os dois relatórios
          </a>{" "}
          — o que eles cobrem e o que não cobrem.
        </li>
      </ul>
      <p>
        O assistente do portal consulta este acervo pelo RAG. Para a lista caso a caso, use o
        filtro acima ou a <Link className="underline" href="/busca">busca</Link>.
      </p>
    </footer>
  );
}

export function Notas({ semResumo }: { semResumo: number }) {
  return (
    <section id="metodo" className="scroll-mt-24 space-y-2 rounded-lg border border-[var(--cp-border)] p-4 text-sm">
      <h2 className="font-display text-lg font-semibold">Como ler e o que não afirmar</h2>
      <ul className="list-disc space-y-1 pl-5 opacity-80">
        <li>
          A classificação é do portal, com método de assessoria jurídica popular: leitura da
          decisão, polo vencedor, resultado do recurso, dano reconhecido e valor, e revisão
          humana do que a automação não fecha. {resumo.status_resumos.revisao_humana} resumos
          ainda estão em revisão.
        </li>
        <li>
          Os relatórios das assessorias técnicas independentes — Guaicuy (Paraopeba) e NACAB
          (Brumadinho) — servem de referência e de contraponto. Os números desta página não são
          os deles.
        </li>
        <li>
          {semResumo.toLocaleString("pt-BR")} itens entram sem resumo de mérito: Rio Doce (TJMG),
          Fundão (TJES) e a maior parte dos direitos humanos. Eles aparecem na lista, sem polo.
        </li>
        <li>
          Súmulas não têm polo: são enunciado normativo, não decisão de caso concreto.
        </li>
        <li>O recorte é a 2ª instância; não é o universo de 1ª instância.</li>
        <li>Não há dado pessoal nesta página: só processo, tema, número e fonte.</li>
      </ul>
    </section>
  );
}
