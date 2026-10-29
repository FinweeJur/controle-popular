import Link from "next/link";
import casosJson from "@/data/jurisprudencia-casos.json";
import resumoJson from "@/data/jurisprudencia-resumo.json";
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

export const resumo = resumoJson as Resumo;
export const CASOS = (casosJson as ArquivoCasos).casos;

const NOMES_TRIBUNAL: Record<string, string> = {
  TJMG: "TJMG — Brumadinho (MG)",
  TJES: "TJES — Fundão/Rio Doce (ES)",
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
};

const ROTULO_STATUS: Record<string, string> = {
  aprovado: "aprovado",
  sem_resumo: "sem resumo",
  revisao_humana: "revisão",
};

export const reais = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
  const porTribunal = contagemPor(CASOS, "tribunal");
  const semResumo = CASOS.filter((caso) => caso.status === "sem_resumo").length;
  const itens: [string, string, string][] = [
    ["Processos no acervo", CASOS.length.toLocaleString("pt-BR"), "2ª instância, TJMG + TJES"],
    ["TJMG — Brumadinho", String(porTribunal.find(([k]) => k === "TJMG")?.[1] ?? 0), "polo e danos classificados"],
    ["TJES — Fundão/Rio Doce", String(porTribunal.find(([k]) => k === "TJES")?.[1] ?? 0), "sem classificação de polo ainda"],
    ["Sem resumo de mérito", semResumo.toLocaleString("pt-BR"), "aparecem na lista, sem polo"],
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

export function Formulario({ filtros }: { filtros: Filtros }) {
  const campo = "rounded border border-[var(--cp-border)] bg-transparent px-2 py-1";
  return (
    <form method="get" className="grid gap-3 rounded-lg border border-[var(--cp-border)] p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Processo</span>
        <input name="q" defaultValue={filtros.q} placeholder="número do processo" className={campo} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Tribunal</span>
        <select name="tribunal" defaultValue={filtros.tribunal} className={campo}>
          <option value="">Todos</option>
          {valoresUnicos(CASOS, "tribunal").map((tribunal) => (
            <option key={tribunal} value={tribunal}>{NOMES_TRIBUNAL[tribunal] ?? tribunal}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Estado</span>
        <select name="estado" defaultValue={filtros.estado} className={campo}>
          <option value="">Todos</option>
          {valoresUnicos(CASOS, "estado").map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
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
          <option value="">Todas</option>
          {valoresUnicos(CASOS, "comarca").map((comarca) => (
            <option key={comarca} value={comarca}>{comarca}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Ano</span>
        <select name="ano" defaultValue={filtros.ano} className={campo}>
          <option value="">Todos</option>
          {valoresUnicos(CASOS, "ano").map((ano) => (
            <option key={ano} value={ano}>{ano}</option>
          ))}
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

function CelulaTemas({ caso }: { caso: CasoJurisprudencia }) {
  const texto = caso.temas.slice(0, 2).join(", ") || caso.assunto || "—";
  const resto = caso.temas.length > 2 ? ` +${caso.temas.length - 2}` : "";
  return <>{`${texto}${resto}`}</>;
}

const COLUNAS = ["Processo", "Tribunal", "Ano", "Órgão/Comarca", "Polo", "Resultado", "Temas", "Revisão"];

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
            <tr key={`${caso.tribunal}:${caso.processo}`} className="border-t border-[var(--cp-border)] align-top">
              <td className="px-3 py-2 font-tabular"><CelulaProcesso caso={caso} /></td>
              <td className="px-3 py-2">{caso.tribunal}/{caso.estado}</td>
              <td className="px-3 py-2">{caso.ano || "—"}</td>
              <td className="px-3 py-2">{caso.orgao || caso.comarca || "—"}</td>
              <td className="px-3 py-2">{ROTULOS[caso.polo] ?? (caso.polo || "—")}</td>
              <td className="px-3 py-2">{ROTULOS[caso.resultado] ?? (caso.resultado || "—")}</td>
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

export function Atalhos({ tribunal, estado }: { tribunal: string; estado: string }) {
  const ativo = "rounded-lg border-2 border-[var(--cp-primary)] bg-[var(--cp-primary)]/10 p-4";
  const inativo = "rounded-lg border border-[var(--cp-border)] p-4 hover:border-[var(--cp-primary)]";
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">Recortes por desastre</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link className={tribunal === "TJMG" ? ativo : inativo} href="/jurisprudencia?tribunal=TJMG&estado=MG#lista">
          <p className="font-semibold">Brumadinho — TJMG</p>
          <p className="text-sm opacity-70">2ª instância de Minas Gerais · polo e danos PNAB/PEAB</p>
        </Link>
        <Link className={tribunal === "TJES" ? ativo : inativo} href="/jurisprudencia?tribunal=TJES&estado=ES#lista">
          <p className="font-semibold">Fundão/Rio Doce — TJES</p>
          <p className="text-sm opacity-70">2ª instância do Espírito Santo · sem polo classificado ainda</p>
        </Link>
      </div>
      {estado || tribunal ? (
        <p className="text-sm opacity-70">
          Recorte ativo: {[tribunal, estado].filter(Boolean).join(" · ")} ·{" "}
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
          {semResumo.toLocaleString("pt-BR")} acórdãos do TJES entram na lista sem polo nem
          resultado: a classificação de mérito do Fundão ainda não foi feita.
        </li>
        <li>
          O recorte é a 2ª instância; não é o universo de 1ª instância nem a amostra da
          18ª Câmara do NACAB.
        </li>
        <li>Não há dado pessoal nesta página: só processo, tema, número e fonte.</li>
      </ul>
    </section>
  );
}
