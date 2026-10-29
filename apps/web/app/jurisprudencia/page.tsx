import type { Metadata } from "next";
import Link from "next/link";
import { filtrar, ordenar, paginar, type Filtros } from "@/lib/jurisprudencia";
import {
  Atalhos,
  BotoesLegislacao,
  CASOS,
  Cartoes,
  Formulario,
  GraficoPoloAno,
  Notas,
  Paginacao,
  reais,
  resumo,
  SumulasPorTribunal,
  Tabela,
  TabelaCasos,
} from "./partes";

/**
 * @file Página /jurisprudencia — jurisprudência geral dos desastres.
 *
 * O QUE É: um só acervo para tudo o que já foi coletado — TJMG (Brumadinho,
 * Rio Doce e direitos humanos), TJES (Fundão) e as súmulas do STF, STJ e TST.
 * Filtro por frente, tipo, tribunal, estado, polo, tema, comarca, ano e
 * processo. Os hubs (`/paraopeba` e `/riodoce`) linkam com o recorte pronto.
 *
 * REGRAS (AGENTS): coleção nunca vai como prop de cliente (§5.1); todo número
 * tem N; valor só como mediana com ressalva; fonte mínima 12 px; link interno
 * com `next/link` (§5.13); celular é a régua (§5.14).
 */

export const metadata: Metadata = {
  title: "Jurisprudência dos desastres — Controle Popular",
  description:
    "Acórdãos do TJMG (Brumadinho, Rio Doce e direitos humanos), do TJES (Fundão) e súmulas do STF, STJ e TST: tribunal, estado, polo vencedor, resultado, temas, danos PNAB/PEAB e valores, com método e fonte.",
};

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
    frente: texto("frente"),
    tipo: texto("tipo"),
    tribunal: texto("tribunal"),
    estado: texto("estado"),
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
  const tjmg = CASOS.filter((caso) => caso.frente === "brumadinho" && caso.polo);
  const semResumo = CASOS.filter((caso) => caso.status === "sem_resumo").length;
  const mostrarBrumadinho = !filtros.frente || filtros.frente === "brumadinho";

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Jurisprudência dos desastres</h1>
        <p className="max-w-3xl text-sm opacity-80">
          Tudo o que o portal já coletou em um só lugar: <strong>Brumadinho</strong> (TJMG,{" "}
          {total.toLocaleString("pt-BR")} processos, 2019–2024), <strong>Rio Doce</strong>{" "}
          (TJMG, comarcas da bacia) e <strong>Fundão</strong> (TJES), mais{" "}
          <strong>direitos humanos</strong> no TJMG e as <strong>súmulas</strong> do STF,
          STJ e TST. Filtre por frente, tipo, tribunal e estado.
        </p>
        <p className="text-xs opacity-70">
          Brumadinho — coleta: {resumo.coleta} · publicação: {resumo.publicacao} · fonte:{" "}
          {resumo.fonte}
        </p>
      </header>

      <Cartoes />
      <Atalhos tribunal={filtros.tribunal ?? ""} frente={filtros.frente ?? ""} />

      <section className="space-y-4" id="lista">
        <h2 className="font-display text-xl font-semibold">Lista</h2>
        <Formulario filtros={filtros} />
        <p className="text-sm opacity-70">
          {pagina.total.toLocaleString("pt-BR")} item(ns) · página {pagina.pagina} de{" "}
          {pagina.totalPaginas}
        </p>
        <TabelaCasos itens={pagina.itens} />
        <Paginacao pagina={pagina} filtros={filtros} />
      </section>

      <SumulasPorTribunal />

      {mostrarBrumadinho ? (
        <div className="space-y-10">
          <Tabela titulo="Brumadinho: polo vencedor" dados={resumo.polo} total={total} />
          <Tabela titulo="Brumadinho: resultado do recurso" dados={resumo.resultado} total={total} />
          <GraficoPoloAno casos={tjmg} />
          <Tabela
            titulo="Brumadinho: temas (um processo pode ter vários)"
            dados={resumo.temas}
            total={total}
          />
          <Tabela
            titulo="Brumadinho: danos PNAB/PEAB reconhecidos"
            dados={resumo.danos_pnab}
            total={total}
          />
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Brumadinho: valores</h2>
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
        </div>
      ) : null}

      <BotoesLegislacao />
      <Notas semResumo={semResumo} />

      <footer className="space-y-2 text-sm opacity-80">
        <p>
          Relatório completo do Brumadinho (método, tabelas e crítica):{" "}
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
          use o filtro acima ou a <Link className="underline" href="/busca">busca</Link>.
        </p>
      </footer>
    </div>
  );
}
