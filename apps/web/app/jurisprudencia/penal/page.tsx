import type { Metadata } from "next";
import Link from "next/link";
import { filtrar, ordenar, paginar, type Filtros } from "@/lib/jurisprudencia";
import { CASOS, Paginacao, TabelaCasos } from "../partes";
import { ResumoRealidadeBox } from "@/app/components/ResumoRealidade";

/**
 * @file /jurisprudencia/penal — acervo penal separado do de desastres.
 *
 * Por que existe (pedido do dono, 01/11/2026): a frente `penal` tem 6.182
 * processos coletados por âncoras de desastre, mas a maioria é crime comum
 * da região (homicídio, tráfico, júri). Misturado com Brumadinho e Rio Doce,
 * o leitor não distingue responsabilização criminal do rompimento de crime
 * cotidiano.
 *
 * Regra da divisão:
 * - esta página mostra TODO o penal;
 * - `/jurisprudencia` esconde o penal, MENOS os 224 casos que citam o
 *   desastre — esses continuam lá, porque ali o crime é o objeto da
 *   responsabilização.
 */

export const metadata: Metadata = {
  title: "Jurisprudência penal — Controle Popular",
  description:
    "Acervo penal do portal: TJES e STF, com tribunal, ano, tema, resultado e resumo. Separado da jurisprudência dos desastres, que mantém só os casos de responsabilização criminal do rompimento.",
};

function textoDoParam(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? "";
}

export default async function JurisprudenciaPenal({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filtros: Filtros = {
    frente: "penal",
    tribunal: textoDoParam(params.tribunal),
    ano: textoDoParam(params.ano),
    q: textoDoParam(params.q),
    ordem: textoDoParam(params.ordem) || "ano_desc",
  };
  const pagina = paginar(
    ordenar(filtrar(CASOS, filtros), filtros.ordem),
    Number(textoDoParam(params.pagina)) || 1,
  );
  const totalPenal = CASOS.filter((caso) => caso.frente === "penal").length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <nav aria-label="Navegação estrutural" className="flex flex-wrap items-center gap-2 text-xs text-text-soft">
        <Link href="/" className="hover:text-primary hover:underline">Início</Link>
        <span>/</span>
        <Link href="/jurisprudencia" className="hover:text-primary hover:underline">Jurisprudência</Link>
        <span>/</span>
        <span className="font-semibold text-text">Penal</span>
      </nav>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Jurisprudência penal</h1>

        <ResumoRealidadeBox rota="/jurisprudencia/penal" />
        <p className="max-w-3xl text-sm opacity-80">
          <strong>{totalPenal.toLocaleString("pt-BR")}</strong> processos coletados por âncoras
          penais no TJES e no STF. A maior parte é crime comum — homicídio, tráfico, júri,
          violência doméstica — e não responsabilização criminal do rompimento.
        </p>
        <p className="max-w-3xl text-sm opacity-80">
          A âncora de coleta não separa classe processual, então o acervo também traz{" "}
          <strong>1.260 ações cíveis</strong> (apelação cível, agravo de instrumento, recurso
          inominado) e <strong>1.473 recursos constitucionais</strong> (ARE, RE, reclamação, ADI)
          que citam os mesmos temas. Eles ficam aqui para não sumirem do mapa, e a classificação
          de polo os marca como <em>indeterminado</em>, porque matéria cível não tem acusação e
          defesa.
        </p>
        <p className="max-w-3xl text-sm opacity-80">
          Os casos que citam o desastre continuam também em{" "}
          <Link href="/jurisprudencia" className="underline">Jurisprudência dos desastres</Link>,
          porque ali o crime é o objeto da responsabilização.
        </p>
      </header>

      {/* Resumo de realidade (F2): números contados no próprio JSON da página. */}
      <ResumoRealidadeBox rota="/jurisprudencia/penal" />

      <section className="space-y-4" id="lista">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link className="underline" href="/jurisprudencia/penal#lista">Todos</Link>
          <Link className="underline" href="/jurisprudencia/penal?tribunal=TJES#lista">TJES</Link>
          <Link className="underline" href="/jurisprudencia/penal?tribunal=STF#lista">STF</Link>
        </div>
        <p className="text-sm opacity-70">
          {pagina.total.toLocaleString("pt-BR")} item(ns) · página {pagina.pagina} de {pagina.totalPaginas}
        </p>
        <TabelaCasos itens={pagina.itens} />
        <Paginacao pagina={pagina} filtros={filtros} base="/jurisprudencia/penal" />
      </section>
    </div>
  );
}