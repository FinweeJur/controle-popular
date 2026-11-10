import type { Metadata } from "next";
import Link from "next/link";
import CaminhoSistema from "@/app/components/CaminhoSistema";
import { filtrar, ordenar, paginar, type Filtros } from "@/lib/jurisprudencia";
import {
  Atalhos,
  BotoesLegislacao,
  CASOS_DESASTRE,
  Cartoes,
  FaixaTemas,
  Formulario,
  Notas,
  NoticiasTribunais,
  Paginacao,
  PainelRecorte,
  resumo,
  RodapeMetodo,
  SeletorGrafico,
  SumulasPorTribunal,
  TabelaCasos,
} from "./partes";
import type { TipoGrafico } from "./graficos";
import { CatalogoIndeterminados } from "./Catalogo";
import { ResumoRealidadeBox } from "../components/ResumoRealidade";
import { TrilhaFrentes } from "../components/TrilhaFrentes";
import { TeseTema1280 } from "./TeseTema1280";
import { MiniSumarioLateral } from "../components/wiki/MiniSumarioLateral";

/**
 * @file Página /jurisprudencia — painel dos desastres.
 *
 * O QUE É: um só acervo (TJMG Brumadinho/Rio Doce/direitos humanos, TJES
 * Fundão e súmulas do STF, STJ e TST) com painel de estatística no topo e a
 * lista embaixo. A faixa de temas troca o recorte inteiro no clique.
 *
 * ARQUITETURA (e por quê): o clique é LINK com o estado na URL, e a página é
 * renderizada no servidor. Coleção de 16.834 itens não vai como prop de
 * cliente (AGENTS §5.1), e a casca não pode desmontar a cada filtro (§5.13).
 * De quebra o recorte fica compartilhável e funciona sem JavaScript.
 *
 * A página só compõe: quem desenha o painel é `PainelRecorte`, e o método mora
 * em `RodapeMetodo` — ambos em `partes.tsx`.
 */

export const metadata: Metadata = {
  title: "Jurisprudência dos desastres — Controle Popular",
  description:
    "Painel da jurisprudência dos desastres: acórdãos do TJMG (Brumadinho, Rio Doce e direitos humanos), do TJES (Fundão) e súmulas do STF, STJ e TST, com recorte por tema de indenização, danos PNAB/PEAB e valores.",
};

const SECOES_JURIS = [
  { id: "resumo-realidade", titulo: "Resumo de realidade" },
  { id: "tema-1280", titulo: "Tema 1.280/STJ" },
  { id: "cartoes", titulo: "Números do acervo" },
  { id: "temas", titulo: "Recorte por tema" },
  { id: "grafico", titulo: "Como ver" },
  { id: "painel", titulo: "Painel" },
  { id: "catalogo", titulo: "Catálogo" },
  { id: "lista", titulo: "Lista de casos" },
  { id: "sumulas", titulo: "Súmulas" },
  { id: "legislacao", titulo: "Normas" },
  { id: "noticias", titulo: "Notícias" },
  { id: "metodo", titulo: "Como ler" },
];

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
    recorte: texto("recorte"),
    grafico: texto("grafico"),
    ordem: texto("ordem") || "ano_desc",
  };
  const pedido = texto("grafico");
  const tipoGrafico: TipoGrafico =
    pedido === "rosca" || pedido === "blocos" ? pedido : "barras";

  // Um único recorte alimenta painel e lista: o que o leitor vê nos números é
  // exatamente o que ele vê na tabela abaixo.
  const visiveis = ordenar(filtrar(CASOS_DESASTRE, filtros), filtros.ordem);
  const pagina = paginar(visiveis, Number(texto("pagina")) || 1);
  const semResumo = visiveis.filter((caso) => caso.status === "sem_resumo").length;

  return (
    <div className="w-full space-y-10 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <CaminhoSistema rota="/jurisprudencia" />
      </div>

      <header className="mx-auto max-w-5xl space-y-3">
        <h1 className="font-display text-3xl font-bold">Jurisprudência dos desastres</h1>
        <p className="max-w-3xl text-sm opacity-80">
          Um painel só para tudo o que o portal já coletou:{" "}
          <strong>{CASOS_DESASTRE.length.toLocaleString("pt-BR")}</strong> itens — acórdãos do
          TJMG (Brumadinho, Rio Doce e direitos humanos), do TJES (Fundão) e súmulas do STF, STJ
          e TST. Escolha um tema e todos os números abaixo mudam juntos.
        </p>
        <p className="text-sm opacity-70">
          Penal e crime comum ficam em{" "}
          <Link className="underline" href="/jurisprudencia/penal">
            página própria
          </Link>
          ; nesta página não aparece nenhum processo penal.
        </p>
        <p className="text-xs opacity-70">
          Brumadinho — coleta: {resumo.coleta} · publicação: {resumo.publicacao} · fonte:{" "}
          {resumo.fonte}
        </p>
      </header>

      <div className="mx-auto max-w-5xl space-y-10">
        <ResumoRealidadeBox rota="/jurisprudencia" />
        <TeseTema1280 />
        <TrilhaFrentes atual="/jurisprudencia" />
        <Cartoes />
        <FaixaTemas filtros={filtros} />
        <Atalhos tribunal={filtros.tribunal ?? ""} frente={filtros.frente ?? ""} />

        <SeletorGrafico filtros={filtros} tipo={tipoGrafico} />
        <PainelRecorte casos={visiveis} tipo={tipoGrafico} />

        <CatalogoIndeterminados />

        <section className="scroll-mt-24 space-y-4" id="lista">
          <h2 className="font-display text-xl font-semibold">Lista</h2>
          <Formulario filtros={filtros} />
          <Paginacao pagina={pagina} filtros={filtros} />
          <TabelaCasos itens={pagina.itens} />
        </section>

        <SumulasPorTribunal />
        <BotoesLegislacao />
        <NoticiasTribunais />
        <Notas semResumo={semResumo} />
        <RodapeMetodo />
      </div>
      <MiniSumarioLateral itens={SECOES_JURIS} />
    </div>
  );
}
