import Link from "next/link";
import casosJson from "@/data/jurisprudencia-casos.json";
import resumoJson from "@/data/jurisprudencia-resumo.json";
import noticiasJson from "@/data/noticias-tribunais.json";
import {
  poloPorAno,
  temasUnicos,
  valoresUnicos,
  contagemPor,
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

const NOMES_TRIBUNAL: Record<string, string> = {
  TJMG: "TJMG (MG)",
  TJES: "TJES (ES)",
  STF: "STF",
  STJ: "STJ",
  TST: "TST",
};

const NOMES_FRENTE: Record<string, string> = {
  brumadinho: "Brumadinho (TJMG)",
  riodoce: "Rio Doce",
  dh: "Direitos humanos (TJMG)",
  sumula: "Súmulas",
};

const NOMES_TIPO: Record<string, string> = {
  acordao: "Acórdão",
  sumula: "Súmula",
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

const ESTILO_STATUS: Record<string, string> = {
  aprovado: "rounded bg-[var(--cp-primary)]/15 px-2 py-0.5 text-xs",
  sem_resumo: "rounded bg-[var(--cp-border)] px-2 py-0.5 text-xs",
  revisao_humana: "rounded bg-[var(--cp-tertiary)]/15 px-2 py-0.5 text-xs",
  sumula: "rounded bg-[var(--cp-secondary)]/15 px-2 py-0.5 text-xs",
};

const ROTULO_STATUS: Record<string, string> = {
  aprovado: "aprovado",
  sem_resumo: "sem resumo",
  revisao_humana: "revisão",
  sumula: "súmula",
};

export const reais = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function contar(frente: string): number {
  return CASOS.filter((caso) => caso.frente === frente).length;
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
  const semResumo = CASOS.filter((caso) => caso.status === "sem_resumo").length;
  const itens: [string, string, string][] = [
    ["Itens no acervo", CASOS.length.toLocaleString("pt-BR"), "acórdãos e súmulas"],
    ["Acórdãos", (CASOS.length - contar("sumula")).toLocaleString("pt-BR"), "TJMG, TJES, STF, STJ"],
    ["Súmulas", contar("sumula").toLocaleString("pt-BR"), "STF, STJ e TST"],
    ["Sem resumo de mérito", semResumo.toLocaleString("pt-BR"), "entram na lista, sem polo"],
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {itens.map(([rotulo, valor, nota]) => (
        <div key={rotulo} className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="text-xs uppercase tracking-wide opacity-60">{rotulo}</p>
          <p className="font-display text-2xl font-bold">{valor}</p>
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
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">Brumadinho: polo por ano</h2>
      <div className="space-y-2">
        {anos.map((item) => (
          <div key={item.ano} className="flex items-center gap-3 text-sm">
            <span className="w-12 font-tabular opacity-70">{item.ano}</span>
            <div className="flex h-5 flex-1 overflow-hidden rounded bg-[var(--cp-surface-2)]">
              {item.partes.map(([polo, n]) => (
                <span
                  key={polo}
                  title={`${ROTULOS[polo] ?? polo}: ${n}`}
                  style={{ width: `${(100 * n) / maior}%` }}
                  className={CORES_POLO[polo] ?? "bg-[var(--cp-border)]"}
                />
              ))}
            </div>
            <span className="w-16 text-right font-tabular opacity-70">{item.total}</span>
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
          <Opcoes valores={valoresUnicos(CASOS, "frente")} nomes={NOMES_FRENTE} />
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Tribunal</span>
        <select name="tribunal" defaultValue={filtros.tribunal} className={campo}>
          <Opcoes valores={valoresUnicos(CASOS, "tribunal")} nomes={NOMES_TRIBUNAL} />
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Estado</span>
        <select name="estado" defaultValue={filtros.estado} className={campo}>
          <Opcoes valores={valoresUnicos(CASOS, "estado")} nomes={{}} />
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Tipo</span>
        <select name="tipo" defaultValue={filtros.tipo} className={campo}>
          <Opcoes valores={valoresUnicos(CASOS, "tipo")} nomes={NOMES_TIPO} />
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Polo</span>
        <select name="polo" defaultValue={filtros.polo} className={campo}>
          <option value="">Todos</option>
          {contagemPor(CASOS, "polo").map(([polo]) => (
            <option key={polo} value={polo}>{ROTULOS[polo] ?? polo}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Tema</span>
        <select name="tema" defaultValue={filtros.tema} className={campo}>
          <option value="">Todos</option>
          {temasUnicos(CASOS).map((tema) => (
            <option key={tema} value={tema}>{tema}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Comarca</span>
        <select name="comarca" defaultValue={filtros.comarca} className={campo}>
          <Opcoes valores={valoresUnicos(CASOS, "comarca")} nomes={{}} />
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Ano</span>
        <select name="ano" defaultValue={filtros.ano} className={campo}>
          <Opcoes valores={valoresUnicos(CASOS, "ano")} nomes={{}} />
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

function SeloStatus({ status }: { status: string }) {
  return (
    <span className={ESTILO_STATUS[status] ?? ESTILO_STATUS.revisao_humana}>
      {ROTULO_STATUS[status] ?? "revisão"}
    </span>
  );
}

function CelulaProcesso({ caso }: { caso: CasoJurisprudencia }) {
  if (!caso.link) return <>{caso.processo}</>;
  return (
    <a className="underline" href={caso.link} target="_blank" rel="noopener noreferrer">
      {caso.processo}
    </a>
  );
}

function TextoDoCaso({ caso }: { caso: CasoJurisprudencia }) {
  if (!caso.ementa && !caso.resumo) return null;
  const rotulo = caso.resumo ? "ver resumo" : "ver ementa";
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs font-semibold text-primary underline">
        {rotulo}
      </summary>
      <div className="mt-2 max-w-md space-y-2 rounded border border-[var(--cp-border)] p-2 text-xs leading-relaxed">
        {caso.resumo ? (
          <p>
            <span className="font-semibold">Resumo: </span>
            {caso.resumo}
          </p>
        ) : null}
        {caso.ementa ? (
          <p className="opacity-80">
            <span className="font-semibold">Ementa: </span>
            {caso.ementa}
          </p>
        ) : null}
      </div>
    </details>
  );
}

function CelulaTemas({ caso }: { caso: CasoJurisprudencia }) {
  const texto = caso.temas.slice(0, 2).join(", ") || caso.assunto.slice(0, 90) || "—";
  const resto = caso.temas.length > 2 ? ` +${caso.temas.length - 2}` : "";
  return (
    <>
      <span>{`${texto}${resto}`}</span>
      <TextoDoCaso caso={caso} />
    </>
  );
}

function CelulaMerito({ caso }: { caso: CasoJurisprudencia }) {
  if (caso.tipo === "sumula") return <>—</>;
  const polo = ROTULOS[caso.polo] ?? caso.polo;
  const resultado = ROTULOS[caso.resultado] ?? caso.resultado;
  return <>{[polo, resultado].filter(Boolean).join(" · ") || "—"}</>;
}

const COLUNAS = ["Processo", "Tribunal", "Tipo", "Ano", "Órgão/Comarca", "Frente", "Polo/Resultado", "Temas", "Status"];

export function TabelaCasos({ itens }: { itens: CasoJurisprudencia[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--cp-border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--cp-surface-2)] text-left">
          <tr>
            {COLUNAS.map((rotulo) => (
              <th key={rotulo} scope="col" className="px-3 py-2 font-semibold">{rotulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {itens.map((caso) => (
            <tr key={caso.id} className="border-t border-[var(--cp-border)] align-top">
              <td className="px-3 py-2 font-tabular"><CelulaProcesso caso={caso} /></td>
              <td className="px-3 py-2">{caso.tribunal}/{caso.estado}</td>
              <td className="px-3 py-2">{NOMES_TIPO[caso.tipo] ?? caso.tipo}</td>
              <td className="px-3 py-2">{caso.ano || "—"}</td>
              <td className="px-3 py-2">{caso.orgao || caso.comarca || "—"}</td>
              <td className="px-3 py-2">{NOMES_FRENTE[caso.frente] ?? caso.frente}</td>
              <td className="px-3 py-2"><CelulaMerito caso={caso} /></td>
              <td className="px-3 py-2"><CelulaTemas caso={caso} /></td>
              <td className="px-3 py-2"><SeloStatus status={caso.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function hrefCom(filtros: Filtros, pagina: number): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor) params.set(chave, String(valor));
  }
  if (pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query ? `/jurisprudencia?${query}` : "/jurisprudencia";
}

export function Paginacao({ pagina, filtros }: { pagina: Pagina<CasoJurisprudencia>; filtros: Filtros }) {
  return (
    <nav className="flex items-center justify-between text-sm" aria-label="Paginação">
      {pagina.pagina > 1 ? (
        <Link className="underline" href={hrefCom(filtros, pagina.pagina - 1)}>← anterior</Link>
      ) : (
        <span />
      )}
      <span className="opacity-70">{pagina.pagina} / {pagina.totalPaginas}</span>
      {pagina.pagina < pagina.totalPaginas ? (
        <Link className="underline" href={hrefCom(filtros, pagina.pagina + 1)}>próxima →</Link>
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
];

export function Atalhos({ tribunal, frente }: { tribunal: string; frente: string }) {
  const ativo = "rounded-lg border-2 border-[var(--cp-primary)] bg-[var(--cp-primary)]/10 p-4";
  const inativo = "rounded-lg border border-[var(--cp-border)] p-4 hover:border-[var(--cp-primary)]";
  return (
    <section className="space-y-3">
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
    <section className="space-y-3">
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
    <Tabela
      titulo="Súmulas por tribunal"
      dados={dados}
      total={contar("sumula")}
      nota="STF 736, STJ 673 e TST 463 — enunciados vigentes baixados da fonte oficial."
    />
  );
}

export function NoticiasTribunais() {
  const itens = NOTICIAS.slice(0, 12);
  return (
    <section className="space-y-3">
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

export function Notas({ semResumo }: { semResumo: number }) {
  return (
    <section className="space-y-2 rounded-lg border border-[var(--cp-border)] p-4 text-sm">
      <h2 className="font-display text-lg font-semibold">Como ler e o que não afirmar</h2>
      <ul className="list-disc space-y-1 pl-5 opacity-80">
        <li>
          O polo do Brumadinho é recalculado pela regra NACAB; {resumo.status_resumos.revisao_humana}{" "}
          resumos ainda estão em revisão humana.
        </li>
        <li>
          {semResumo.toLocaleString("pt-BR")} itens entram sem resumo de mérito: Rio Doce (TJMG),
          Fundão (TJES) e a maior parte dos direitos humanos. Eles aparecem na lista, sem polo.
        </li>
        <li>
          Súmulas não têm polo: são enunciado normativo, não decisão de caso concreto.
        </li>
        <li>O recorte é a 2ª instância; não é o universo de 1ª instância nem a amostra da 18ª Câmara do NACAB.</li>
        <li>Não há dado pessoal nesta página: só processo, tema, número e fonte.</li>
      </ul>
    </section>
  );
}
