import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatNumberBR } from "@/lib/betim/format";
import type { CategoriaComunicaBR, ItemComunicaBR, SubIndicadorComunicaBR } from "@/lib/comunicabr/indicadores";
import { RESSALVA_COMUNICABR } from "@/lib/comunicabr/indicadores";
import {
  type LacunaDeCategoria,
  lacunaDaCategoria,
  metaComunicaBR,
  municipioComunicaBR,
  resumoDosMunicipios,
  serieTemNumero,
  tituloDaCategoria,
} from "@/lib/comunicabr/mg";

/**
 * A ficha de UMA cidade no ComunicaBR — os indicadores um a um, com o
 * ministério que declarou cada um, e os vazios visíveis no meio deles.
 *
 * ═══ POR QUE OS VAZIOS APARECEM NA LISTA, E NÃO SÓ NO TOTAL ═══
 *
 * Em Betim são 105 itens com valor e **99 vazios**, de 204. Uma lista só com
 * os 105 seria uma página bonita e uma mentira por omissão: quem procurasse
 * "Minha Casa, Minha Vida" e não achasse a linha concluiria que o programa não
 * existe na cidade — quando o que houve foi a fonte não publicar. Por isso o
 * item vazio aparece no lugar dele, com um travessão, e a contagem vem junto
 * do título de cada tema.
 *
 * ═══ O TRAVESSÃO NUNCA VIRA ZERO ═══
 *
 * A API preenche `valorBruto: 0` justamente nos registros em que se recusa a
 * exibir número — medido: em 660 itens de cinco municípios, nenhum item exibe
 * zero. `parDeValor()` (em `lib/comunicabr/indicadores.ts`) anula esse zero na
 * leitura, então aqui `valor === null` significa "não publicado", e é assim
 * que a tela escreve. Publicar "R$ 0,00" onde o governo disse "não se aplica"
 * afirmaria que a cidade não recebeu nada — o erro mais grave possível numa
 * página de transparência.
 *
 * ═══ ENTREGA: TUDO NO SERVIDOR ═══
 *
 * Esta rota é estática e renderizada no servidor com os ~204 itens DESTA
 * cidade. Nada de acervo em props de cliente: `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`
 * mede o que isso custou em `/ambiental/legislacao` (35,5 MiB de `.cache`
 * contra o teto de 25 MiB da Cloudflare, com o deploy travado até hoje).
 */

type Params = Promise<{ codigo: string }>;

export async function generateStaticParams() {
  return (await resumoDosMunicipios()).map((m) => ({ codigo: m.codigo }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { codigo } = await params;
  const m = await municipioComunicaBR(codigo);
  if (!m) return { title: "Cidade não encontrada — Controle Popular" };
  const nome = m.nomeIbge.replace(/\/[A-Z]{2}$/, "");
  return {
    title: `${nome} no ComunicaBR — Controle Popular`,
    description: `Os ${m.cobertura.itens} indicadores que o governo federal publica sobre ${nome}/MG: ${m.cobertura.itensComValor} com valor e ${m.cobertura.itensVazios} sem valor publicado, cada um com o ministério que o declarou.`,
  };
}

/**
 * A frase da lacuna, por espécie. É o núcleo editorial desta tela: a mesma
 * ausência de número significa coisas diferentes conforme o tema venha zerado
 * em 853 cidades ou em 1, e trocar as duas ou acusa a prefeitura de algo que é
 * do governo federal, ou absolve a cidade em que a falta é local.
 */
function fraseDaLacuna(l: LacunaDeCategoria): { titulo: string; texto: string } {
  const zeradas = `${formatNumberBR(l.cidadesZeradas)} das ${formatNumberBR(l.cidades)} cidades de Minas`;
  switch (l.especie) {
    case "fonte-em-toda-uf":
      return {
        titulo: "Lacuna da fonte, não desta cidade",
        texto: `O ComunicaBR publica a estrutura deste tema e não publica valor para município nenhum: vem zerado em TODAS as ${formatNumberBR(l.cidades)} cidades de Minas. A ausência aqui é do portal federal — não diz nada sobre esta cidade.`,
      };
    case "fonte-na-maioria":
      return {
        titulo: "Lacuna da fonte na maior parte do estado",
        texto: `Este tema vem sem nenhum valor em ${zeradas} — a maioria. Uma ausência que se repete assim descreve o que o governo federal publica, não o que cada prefeitura fez.`,
      };
    default:
      return {
        titulo: "Sem valor publicado para esta cidade",
        texto: `Nenhum indicador deste tema veio com valor aqui. É uma ausência específica: em Minas, o tema vem zerado em ${zeradas} — nas demais, a fonte publicou algum número. Isso não afirma que o programa não existe na cidade; afirma que o dado não foi publicado para ela.`,
      };
  }
}

/**
 * ═══ O ESTILO DESTA PÁGINA MORA NUMA STRING SÓ, NO `<main>` ═══
 *
 * Não é gosto: é o teto de asset da Cloudflare, medido nesta rota.
 *
 * São 204 itens por cidade × 853 cidades. Na primeira versão, cada `<li>`
 * levava a sua própria string de classes (~180 bytes) e cada `<ul>` de
 * subindicador levava outra; o build gerou **652 MiB** de artefatos só para
 * `/dados/comunicabr` — 750 KB por cidade, contra ~80 KB de uma página comum
 * do portal (`/judiciario/tribunais/stf`). O `.cache` não estourava o teto de
 * 25 MiB por arquivo, mas somava mais que o portal inteiro, num deploy que já
 * está travado por tamanho (`docs/HANDOFF-PAYLOAD-LEGISLACAO.md`).
 *
 * Classe repetida é paga DUAS vezes — no HTML e no RSC flight, que é
 * exatamente o 7,5× que aquele handoff mede. Então tudo que se repete sobe uma
 * vez para o `<main>`, em variantes de descendente (`[&_li]:…`, o mesmo
 * recurso que os três `DataCard.tsx` do portal já usam), e cada linha fica com
 * marcação nua: `<li><span>título</span><b>valor</b></li>`.
 *
 * `data-vazio` e `data-n2` custam 11 bytes onde a classe custava 40, e dizem a
 * mesma coisa para o CSS.
 */
const ESTILO_DA_PAGINA = [
  "mx-auto max-w-3xl px-4 py-10 sm:py-14",
  // As linhas de indicador
  "[&_li]:flex [&_li]:flex-wrap [&_li]:items-baseline [&_li]:gap-x-3 [&_li]:border-b [&_li]:border-border/50 [&_li]:py-1.5",
  // Item de segundo nível (`items[].sub_items[]`) recuado, para o leitor ver
  // que ele detalha a linha de cima e não é irmão dela.
  "[&_li[data-n2]]:ml-3 [&_li[data-n2]]:border-l [&_li[data-n2]]:border-border [&_li[data-n2]]:pl-3",
  // Linha sem valor publicado inteira em tom suave. A cor não é o único sinal
  // — o travessão diz o mesmo —, então quem não a distingue não perde nada.
  "[&_li[data-vazio]]:text-text-soft",
  "[&_b]:ml-auto [&_b]:font-tabular [&_b]:font-semibold [&_b]:text-text",
  "[&_li[data-vazio]_b]:font-normal [&_li[data-vazio]_b]:text-text-soft",
  "[&_small]:text-[.8em] [&_small]:font-medium [&_small]:text-text-soft",
  "[&_h4]:font-medium [&_h4]:text-text",
  "[&_p[data-serie]]:mt-1.5 [&_p[data-serie]]:font-tabular [&_p[data-serie]]:text-[.85em] [&_p[data-serie]]:text-text-soft",
].join(" ");

function Linha({ item }: { item: ItemComunicaBR }) {
  return (
    <li data-vazio={item.valor === null ? "" : undefined} data-n2={item.nivel === 2 ? "" : undefined}>
      <span>{item.titulo}</span>
      {/* A procedência só se repete na linha quando o item declara a SUA —
          `fonteHerdada` marca o que veio do subindicador, e essa já está no
          cabeçalho acima. Quatro das 21 siglas de Betim só existem no nível do
          item (MDIC, MEMP, MM, MPS): omiti-las atribuiria o número ao
          ministério errado. */}
      {!item.fonteHerdada && item.fonte ? <small>{item.fonte}</small> : null}
      <b>{item.valor ?? "—"}</b>
    </li>
  );
}

function Subindicador({ sub }: { sub: SubIndicadorComunicaBR }) {
  const series = sub.series.filter(serieTemNumero);
  const seriesZeradas = sub.series.length - series.length;

  const procedencia = [sub.fonte, sub.referencia].filter(Boolean).join(" · ");

  return (
    <div className="mt-4">
      {/* Título e procedência no MESMO elemento: o ministério declarado e o
          corte temporal pertencem ao indicador, e um `<div>` de layout em
          volta custaria 66 aberturas de tag por cidade para não dizer nada. */}
      <h4>
        {sub.titulo} {procedencia ? <small>{procedencia}</small> : null}
      </h4>

      {sub.valor !== null ? (
        <p className="text-[1.15em]">
          <b>{sub.valor}</b>
        </p>
      ) : null}

      {sub.itens.length > 0 ? (
        <ul>
          {sub.itens.map((item, i) => (
            <Linha key={`${item.titulo}-${i}`} item={item} />
          ))}
        </ul>
      ) : null}

      {/* Série histórica em texto, não em gráfico: são 32 séries por cidade e
          um gráfico por série pesaria a página inteira para dizer quatro
          números. O eixo vem como a fonte o rotula ("2023"), sem reordenar.

          O ponto que vale ZERO vira travessão, e a série inteiramente zerada
          não é desenhada: o zero da série é o mesmo preenchimento do
          `valorBruto: 0` do item — ver a medição em `serieTemNumero()`
          (48% dos pontos de Minas são zero, e a fonte nunca exibe um zero). */}
      {series.map((s, i) => (
        <p key={`${s.nome}-${i}`} data-serie="">
          {`${s.nome || "Série"}: `}
          {s.pontos
            .map((p) => `${p.ano}: ${p.valor === 0 ? "—" : formatNumberBR(p.valor)}`)
            .join(" · ")}
        </p>
      ))}

      {seriesZeradas > 0 ? (
        <p className="mt-1.5 text-[.82em] text-text-soft">
          {seriesZeradas === 1 ? "Uma série histórica veio" : `${seriesZeradas} séries históricas vieram`}{" "}
          sem número em nenhum ano — zeros de preenchimento, não medição de zero. Não são
          desenhadas aqui.
        </p>
      ) : null}
    </div>
  );
}

async function Tema({ cat }: { cat: CategoriaComunicaBR }) {
  const comValor = cat.itens.length - cat.itensVazios;
  const zerada = cat.itens.length > 0 && comValor === 0;
  const lacuna = zerada ? await lacunaDaCategoria(cat.categoria) : null;
  const frase = lacuna ? fraseDaLacuna(lacuna) : null;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-lg font-semibold text-text">
          {tituloDaCategoria(cat.categoria)}
        </h3>
        <p className="font-tabular text-[.85em] text-text-soft">
          {comValor} de {cat.itens.length} com valor
        </p>
      </div>

      {frase ? (
        // O aviso vem ANTES dos itens vazios, não depois: depois deles o leitor
        // já concluiu, e a conclusão errada aqui é acusar a prefeitura.
        <div className="mt-3 rounded-xl border border-alert/40 px-3 py-2">
          <p className="text-[.9em] font-semibold text-alert">{frase.titulo}</p>
          <p className="mt-1 text-[.88em] text-text-soft">{frase.texto}</p>
        </div>
      ) : null}

      {cat.subindicadores.map((sub, i) => (
        <Subindicador key={`${sub.titulo}-${i}`} sub={sub} />
      ))}
    </section>
  );
}

export default async function FichaComunicaBR({ params }: { params: Params }) {
  const { codigo } = await params;
  const [municipio, meta] = await Promise.all([municipioComunicaBR(codigo), metaComunicaBR()]);
  if (!municipio || !meta) notFound();

  const nome = municipio.nomeIbge.replace(/\/[A-Z]{2}$/, "");
  const c = municipio.cobertura;
  const pctVazio = c.itens > 0 ? Math.round((c.itensVazios / c.itens) * 100) : 0;
  const comConteudo = municipio.categorias.filter((cat) => cat.itens.length > 0);
  const semItem = municipio.categorias.filter((cat) => cat.itens.length === 0);
  // Cadastro: só os campos de contagem da própria fonte. `chefe_executivo` e
  // `gentilico` vêm no mesmo bloco e ficam de fora de propósito — nome de
  // pessoa não é indicador de programa federal, e esta página não precisa dele
  // para nada (ver `docs/` sobre dado pessoal em conteúdo republicado).
  const cadastro = municipio.dadosGerais.filter(
    (d) => ["populacao", "eleitorado", "domicilios"].includes(d.chave) && d.valor !== null
  );

  return (
    <main id="conteudo-principal" tabIndex={-1} className={ESTILO_DA_PAGINA}>
      <nav className="mb-4 text-sm text-text-soft">
        <Link href="/dados/comunicabr" className="hover:text-primary">
          ← ComunicaBR em Minas Gerais
        </Link>
      </nav>

      <header className="space-y-2">
        <p className="text-[.82em] font-semibold tracking-wide text-text-soft uppercase">
          Governo federal · {nome}/MG · IBGE {municipio.codigoIbge}
        </p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          O que o governo federal diz ter feito em {nome}
        </h1>
        {cadastro.length > 0 ? (
          <p className="font-tabular text-[.9em] text-text-soft">
            {cadastro
              .map((d) => `${d.titulo.replace(/:$/, "")}: ${d.valor}`)
              .join(" · ")}
          </p>
        ) : null}
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="font-tabular text-[1.6em] leading-none font-bold text-text">{c.itens}</p>
          <p className="mt-1 text-[.82em] text-text-soft">indicadores publicados</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="font-tabular text-[1.6em] leading-none font-bold text-text">
            {c.itensComValor}
          </p>
          <p className="mt-1 text-[.82em] text-text-soft">com valor</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="font-tabular text-[1.6em] leading-none font-bold text-alert">
            {c.itensVazios}
          </p>
          <p className="mt-1 text-[.82em] text-text-soft">sem valor publicado ({pctVazio}%)</p>
        </div>
      </div>

      <p className="mt-4 rounded-2xl border border-alert/40 bg-surface px-4 py-3 text-[.9em] text-text-soft">
        <strong className="text-alert">O travessão (—) não é zero.</strong> Onde a fonte não publicou
        valor para {nome}, a linha mostra —, nunca &quot;0&quot; nem &quot;R$ 0,00&quot;. A API
        preenche o campo numérico com zero exatamente nos registros que ela se recusa a exibir, e em
        660 itens conferidos ao vivo nenhum exibiu um zero: tratar aquilo como medida diria que a
        cidade não recebeu nada onde o governo disse &quot;não se aplica&quot;. A mesma regra vale
        nas séries históricas — ano com zero aparece como —, e a série zerada de ponta a ponta não é
        desenhada.
      </p>

      <p className="mt-3 rounded-2xl border border-dashed border-border bg-surface-2 px-4 py-3 text-[.88em] text-text-soft">
        {RESSALVA_COMUNICABR}
      </p>

      {c.categoriasSemNenhumValor.length > 0 ? (
        <p className="mt-3 text-[.9em] text-text-soft">
          {c.categoriasSemNenhumValor.length === 1 ? "Um tema veio" : `${c.categoriasSemNenhumValor.length} temas vieram`}{" "}
          sem nenhum valor aqui —{" "}
          <strong className="text-text">
            {c.categoriasSemNenhumValor.map((k) => tituloDaCategoria(k)).join(", ")}
          </strong>
          . Cada um traz abaixo de quem é a lacuna: da fonte federal ou desta cidade.
        </p>
      ) : null}

      {comConteudo.map((cat) => (
        <Tema key={cat.categoria} cat={cat} />
      ))}

      {semItem.length > 0 ? (
        <p className="mt-8 text-[.9em] text-text-soft">
          A fonte ainda lista{" "}
          <strong className="text-text">{semItem.map((k) => tituloDaCategoria(k.categoria)).join(", ")}</strong>{" "}
          como temas, <strong className="text-text">sem nenhum indicador dentro</strong> — em{" "}
          {nome} e em toda Minas. Não há número para mostrar, e a ausência é do portal federal.
        </p>
      ) : null}

      <p className="mt-10 text-[.85em] text-text-soft">
        Fonte:{" "}
        <a
          href="https://comunicabr.presidencia.gov.br"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-accent"
        >
          ComunicaBR / Presidência da República ↗
        </a>
        , coleta de {new Date(meta.geradoEm).toLocaleDateString("pt-BR")}. As siglas ao lado de cada
        bloco são o ministério que a própria fonte declara ({c.fontes.length} nesta cidade). Para
        execução orçamentária auditada, o caminho é o{" "}
        <a
          href="https://portaldatransparencia.gov.br"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-accent"
        >
          Portal da Transparência ↗
        </a>
        .
      </p>
    </main>
  );
}
