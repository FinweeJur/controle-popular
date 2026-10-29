import type { Metadata } from "next";
import Link from "next/link";
import casosJson from "@/data/jurisprudencia-casos.json";
import resumoJson from "@/data/jurisprudencia-resumo.json";
import {
  filtrar,
  ordenar,
  paginar,
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
 * @file Página /jurisprudencia — panorama e lista filtrável dos acórdãos.
 *
 * O QUE É: lê `jurisprudencia-resumo.json` (agregados) e
 * `jurisprudencia-casos.json` (2.970 processos) e mostra o retrato
 * NACAB/Guaicuy do Brumadinho, com filtro e paginação no SERVIDOR.
 *
 * REGRAS (AGENTS): coleção nunca vai como prop de cliente (§5.1); todo número
 * tem N; valor só como mediana com ressalva; data de coleta e publicação;
 * fonte mínima 12 px; `<main>` da casca.
 */

export const metadata: Metadata = {
  title: "Jurisprudência — Controle Popular",
  description:
    "2.970 acórdãos do TJMG sobre o rompimento da barragem de Brumadinho: polo vencedor, resultado, temas, danos PNAB/PEAB e valores, com método e fonte.",
};

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

const resumo = resumoJson as Resumo;
const CASOS = (casosJson as ArquivoCasos).casos;

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

const reais = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Tabela({ titulo, dados, total }: { titulo: string; dados: Record<string, number>; total: number }) {
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
    </section>
  );
}

function GraficoPoloAno({ casos }: { casos: CasoJurisprudencia[] }) {
  const anos = poloPorAno(casos);
  const maior = Math.max(...anos.map((item) => item.total), 1);
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">Polo por ano de julgamento</h2>
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
                  className={
                    polo === "empresa"
                      ? "bg-[var(--cp-secondary)]"
                      : polo === "atingido"
                        ? "bg-[var(--cp-primary)]"
                        : polo === "parcial"
                          ? "bg-[var(--cp-tertiary)]"
                          : "bg-[var(--cp-border)]"
                  }
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

function Cartoes() {
  const total = resumo.auditoria.processos_unicos;
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {[
        ["Processos únicos", total.toLocaleString("pt-BR")],
        ["Com inteiro teor", resumo.auditoria.com_inteiro_teor.toLocaleString("pt-BR")],
        ["Resumos aprovados", (resumo.status_resumos.aprovado ?? 0).toLocaleString("pt-BR")],
        ["Amostra AAS (5%, 95%)", String(resumo.amostragem.amostra)],
      ].map(([rotulo, valor]) => (
        <div key={rotulo} className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="text-xs uppercase tracking-wide opacity-60">{rotulo}</p>
          <p className="font-display text-2xl font-bold">{valor}</p>
        </div>
      ))}
    </section>
  );
}

function Formulario({ filtros }: { filtros: Filtros }) {
  const campo = "rounded border border-[var(--cp-border)] bg-transparent px-2 py-1";
  return (
    <form method="get" className="grid gap-3 rounded-lg border border-[var(--cp-border)] p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="opacity-70">Processo</span>
        <input name="q" defaultValue={filtros.q} placeholder="número do processo" className={campo} />
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

function TabelaCasos({ itens }: { itens: CasoJurisprudencia[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--cp-border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--cp-surface-2)] text-left">
          <tr>
            {["Processo", "Ano", "Comarca", "Polo", "Resultado", "Temas", "Revisão"].map((rotulo) => (
              <th key={rotulo} scope="col" className="px-3 py-2 font-semibold">{rotulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {itens.map((caso) => (
            <tr key={caso.processo} className="border-t border-[var(--cp-border)] align-top">
              <td className="px-3 py-2 font-tabular">
                {caso.link ? (
                  <a className="underline" href={caso.link} target="_blank" rel="noopener noreferrer">
                    {caso.processo}
                  </a>
                ) : (
                  caso.processo
                )}
              </td>
              <td className="px-3 py-2">{caso.ano || "—"}</td>
              <td className="px-3 py-2">{caso.comarca || "—"}</td>
              <td className="px-3 py-2">{ROTULOS[caso.polo] ?? caso.polo ?? "—"}</td>
              <td className="px-3 py-2">{ROTULOS[caso.resultado] ?? caso.resultado ?? "—"}</td>
              <td className="px-3 py-2">
                {caso.temas.slice(0, 2).join(", ") || "—"}
                {caso.temas.length > 2 ? ` +${caso.temas.length - 2}` : ""}
              </td>
              <td className="px-3 py-2">
                <span
                  className={
                    caso.status === "aprovado"
                      ? "rounded bg-[var(--cp-primary)]/15 px-2 py-0.5 text-xs"
                      : "rounded bg-[var(--cp-tertiary)]/15 px-2 py-0.5 text-xs"
                  }
                >
                  {caso.status === "aprovado" ? "aprovado" : "revisão"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function hrefCom(filtros: Filtros, pagina: number): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor) params.set(chave, String(valor));
  }
  if (pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query ? `/jurisprudencia?${query}` : "/jurisprudencia";
}

function Paginacao({ pagina, filtros }: { pagina: Pagina<CasoJurisprudencia>; filtros: Filtros }) {
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

function Notas() {
  return (
    <section className="space-y-2 rounded-lg border border-[var(--cp-border)] p-4 text-sm">
      <h2 className="font-display text-lg font-semibold">Como ler e o que não afirmar</h2>
      <ul className="list-disc space-y-1 pl-5 opacity-80">
        <li>
          O polo é recalculado pela regra NACAB; {resumo.status_resumos.revisao_humana}{" "}
          resumos ainda estão em revisão humana.
        </li>
        <li>
          {resumo.processos_sem_dano.toLocaleString("pt-BR")} processos não têm nenhuma
          categoria PNAB/PEAB reconhecida na ementa.
        </li>
        <li>
          O recorte é a 2ª instância do TJMG; não é o universo de 1ª instância do Guaicuy
          nem a amostra da 18ª Câmara do NACAB.
        </li>
        <li>Não há dado pessoal nesta página: só processo, tema, número e fonte.</li>
      </ul>
    </section>
  );
}

export default async function Jurisprudencia({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const texto = (chave: string) => {
    const valor = params[chave];
    return (Array.isArray(valor) ? valor[0] : valor) ?? "";
  };
  const filtros: Filtros = {
    polo: texto("polo"),
    tema: texto("tema"),
    comarca: texto("comarca"),
    ano: texto("ano"),
    q: texto("q"),
    ordem: texto("ordem") || "ano_desc",
  };
  const pagina = paginar(ordenar(filtrar(CASOS, filtros), filtros.ordem), Number(texto("pagina")) || 1);
  const total = resumo.auditoria.processos_unicos;
  const valores = resumo.valores;

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Jurisprudência do Brumadinho</h1>
        <p className="max-w-3xl text-sm opacity-80">
          {total.toLocaleString("pt-BR")} acórdãos do TJMG sobre o rompimento da barragem
          da Mina Córrego do Feijão, julgados entre 2019 e 2024. O retrato segue a
          metodologia NACAB/ADAI e o Dossiê Paraopeba (Instituto Guaicuy): polo definido
          por <strong>quem recorreu × resultado do recurso</strong>, danos nas 12
          categorias PNAB/PEAB e valor quando o texto informa.
        </p>
        <p className="text-xs opacity-70">
          Coleta: {resumo.coleta} · Publicação: {resumo.publicacao} · Fonte: {resumo.fonte}
        </p>
      </header>

      <Cartoes />
      <Tabela titulo="Polo vencedor" dados={resumo.polo} total={total} />
      <Tabela titulo="Resultado do recurso" dados={resumo.resultado} total={total} />
      <GraficoPoloAno casos={CASOS} />
      <Tabela titulo="Temas (um processo pode ter vários)" dados={resumo.temas} total={total} />
      <Tabela titulo="Danos PNAB/PEAB reconhecidos" dados={resumo.danos_pnab} total={total} />

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Valores</h2>
        <p className="text-sm opacity-80">
          {Number(valores.n ?? 0).toLocaleString("pt-BR")} processos com valor numérico.
          Mediana {reais(Number(valores.mediana ?? 0))}; Q1 {reais(Number(valores.q1 ?? 0))};
          Q3 {reais(Number(valores.q3 ?? 0))}.
        </p>
        <p className="text-xs opacity-70">
          O campo é o maior valor em R$ mencionado no texto — pode ser pedido, condenação
          ou valor de ação coletiva. A média não é publicada: um outlier de R$ 200 bilhões
          a distorce.
        </p>
      </section>

      <section className="space-y-4" id="lista">
        <h2 className="font-display text-xl font-semibold">Lista dos acórdãos</h2>
        <Formulario filtros={filtros} />
        <p className="text-sm opacity-70">
          {pagina.total.toLocaleString("pt-BR")} processo(s) · página {pagina.pagina} de{" "}
          {pagina.totalPaginas}
        </p>
        <TabelaCasos itens={pagina.itens} />
        <Paginacao pagina={pagina} filtros={filtros} />
      </section>

      <Notas />

      <footer className="space-y-2 text-sm opacity-80">
        <p>
          Relatório completo (método, tabelas e crítica):{" "}
          <a
            className="underline"
            href="https://github.com/FinweeJur/tjmg-jurimetria/blob/master/relatorios/RELATORIO-GUAICUY-NACAB.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            RELATORIO-GUAICUY-NACAB.md
          </a>
          .
        </p>
        <p>
          O assistente do portal consulta este acervo pelo RAG. Para a lista caso a caso,
          use o filtro acima ou a{" "}
          <Link className="underline" href="/busca">busca</Link>.
        </p>
      </footer>
    </div>
  );
}
