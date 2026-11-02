import type { Metadata } from "next";
import Link from "next/link";
import {
  contagemPor,
  contarLista,
  estatisticasDeValor,
  faixasDeValor,
  filtrar,
  ordenar,
  paginar,
  type Filtros,
} from "@/lib/jurisprudencia";
import {
  Atalhos,
  Barras,
  BotoesLegislacao,
  CASOS_DESASTRE,
  Cartoes,
  FaixaTemas,
  Formulario,
  GraficoPoloAno,
  Notas,
  NoticiasTribunais,
  Paginacao,
  reais,
  resumo,
  SumulasPorTribunal,
  TabelaCasos,
} from "./partes";

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
 * REGRAS: todo número com N; valor só como mediana e faixa, nunca média;
 * fonte mínima 12 px; celular é a régua.
 */

export const metadata: Metadata = {
  title: "Jurisprudência dos desastres — Controle Popular",
  description:
    "Painel da jurisprudência dos desastres: acórdãos do TJMG (Brumadinho, Rio Doce e direitos humanos), do TJES (Fundão) e súmulas do STF, STJ e TST, com recorte por tema de indenização, danos PNAB/PEAB e valores.",
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
    recorte: texto("recorte"),
    ordem: texto("ordem") || "ano_desc",
  };

  // Um único recorte alimenta painel e lista: o que o leitor vê nos números é
  // exatamente o que ele vê na tabela abaixo.
  const visiveis = ordenar(filtrar(CASOS_DESASTRE, filtros), filtros.ordem);
  const pagina = paginar(visiveis, Number(texto("pagina")) || 1);
  const totalVisivel = visiveis.length;
  const comTemas = visiveis.filter((caso) => caso.temas.length > 0).length;
  const comDanos = visiveis.filter((caso) => caso.danos_pnab.length > 0).length;
  const valores = estatisticasDeValor(visiveis);
  const faixas = faixasDeValor(visiveis);
  const porAno = [...contagemPor(visiveis, "ano")].sort((a, b) => a[0].localeCompare(b[0]));
  const semResumo = visiveis.filter((caso) => caso.status === "sem_resumo").length;

  return (
    <div className="w-full space-y-10 px-4 py-10">
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
          ; aqui só aparecem os processos penais que citam o desastre.
        </p>
        <p className="text-xs opacity-70">
          Brumadinho — coleta: {resumo.coleta} · publicação: {resumo.publicacao} · fonte:{" "}
          {resumo.fonte}
        </p>
      </header>

      <div className="mx-auto max-w-5xl space-y-10">
        <Cartoes />
        <FaixaTemas filtros={filtros} />
        <Atalhos tribunal={filtros.tribunal ?? ""} frente={filtros.frente ?? ""} />

        <section className="space-y-8" aria-label="Painel do recorte">
          <p className="text-sm opacity-80">
            <strong>{totalVisivel.toLocaleString("pt-BR")}</strong>{" "}
            {totalVisivel === 1 ? "item no recorte" : "itens no recorte"} de{" "}
            {CASOS_DESASTRE.length.toLocaleString("pt-BR")}.
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            <Barras
              titulo="Por tribunal"
              dados={contagemPor(visiveis, "tribunal")}
              total={totalVisivel}
            />
            <Barras
              titulo="Por frente"
              dados={contagemPor(visiveis, "frente")}
              total={totalVisivel}
            />
            <Barras
              titulo="Resultado do recurso"
              dados={contagemPor(visiveis, "resultado")}
              total={totalVisivel}
              nota="Inclui itens sem resultado registrado na categoria —."
            />
            <Barras
              titulo="Polo vencedor"
              dados={contagemPor(visiveis, "polo")}
              total={totalVisivel}
              nota={`Polo só existe onde o resumo de mérito foi classificado: ${visiveis
                .filter((caso) => caso.polo)
                .length.toLocaleString("pt-BR")} itens.`}
            />
            <Barras titulo="Por ano da decisão" dados={porAno} total={totalVisivel} />
            <Barras
              titulo="Temas do acervo"
              dados={contarLista(visiveis, "temas")}
              total={comTemas}
              nota={`Um processo entra em vários temas: ${comTemas.toLocaleString("pt-BR")} itens com tema preenchido.`}
            />
            <Barras
              titulo="Danos PNAB/PEAB reconhecidos"
              dados={contarLista(visiveis, "danos_pnab")}
              total={comDanos}
              nota={`${comDanos.toLocaleString("pt-BR")} itens com dano classificado.`}
            />
            <Barras
              titulo="Faixa de valor mencionado"
              dados={faixas.dados}
              total={faixas.n}
              nota={
                faixas.n
                  ? `${faixas.n.toLocaleString("pt-BR")} decisões com valor em R$ — mediana ${reais(valores.mediana)}.`
                  : "Nenhuma decisão deste recorte traz valor em R$."
              }
            />
          </div>

          <GraficoPoloAno casos={visiveis} />

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

        <section className="space-y-4" id="lista">
          <h2 className="font-display text-xl font-semibold">Lista</h2>
          <Formulario filtros={filtros} />
          <Paginacao pagina={pagina} filtros={filtros} />
          <TabelaCasos itens={pagina.itens} />
        </section>

        <SumulasPorTribunal />
        <BotoesLegislacao />
        <NoticiasTribunais />
        <Notas semResumo={semResumo} />

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
      </div>
    </div>
  );
}
