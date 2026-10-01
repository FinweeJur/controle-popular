import type { Metadata } from "next";
import Link from "next/link";
import { History, ExternalLink } from "lucide-react";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { metadataEditavel } from "@/lib/edicoes";
import { CALENDARIO_LUTAS } from "@/lib/memoria/calendario";
import { localDaEntrada } from "@/lib/memoria/locais";
import {
  bensTombadosRurais,
  capitanias,
  fazendasTombadas,
  listasPopulacao,
  mineracaoProtegida,
  terrasPublicas,
  type AgregadoProtegido,
} from "@/lib/historia/camadas";
import TabelaHistoria, { type ColunaHistoria, type LinhaHistoria } from "./TabelaHistoria";

/**
 * `/historia` — Fase F do PLANO-HISTORIA-CAMADAS-GLOBO-3D.md.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE ═══
 *
 * O globo 3D desenha as camadas históricas; esta página dá a elas a leitura em
 * tabela — busca, ordenação por coluna, CSV do filtrado, impressão — sem
 * repetir o dado: as linhas saem dos MESMOS `.geojson` que o globo carrega
 * (`lib/historia/camadas.ts` lê e passa só as linhas; a geometria fica lá).
 *
 * ═══ O QUE ESTA PÁGINA NÃO DIZ ═══
 *
 * - **História não acusa.** Os pontos são registros oficiais (IBGE, APM, IEPHA,
 *   OpenHistoricalMap) datados e com fonte; o juízo é do leitor e da historiografia.
 * - **Fronteira colonial é traçado aproximado.** Cada seção repete a natureza do dado.
 * - **Piso, não total:** onde o método é por centroide, está escrito.
 */
export const dynamic = "force-static";

export const metadata: Metadata = metadataEditavel("/historia", {
  title: "História — capitanias, revoltas e terras de Minas - Controle Popular",
  description:
    "As capitanias hereditárias de 1534, as revoltas com lugar identificado, as fazendas tombadas e " +
    "os registros de terras públicas do Império — cada linha com a fonte oficial e o botão para ver no globo 3D.",
});

const Vazio = ({ children }: { children: string }) => (
  <p className="rounded-xl border border-border p-4 text-sm text-text-soft">{children}</p>
);

export default function PaginaHistoria() {
  const caps = capitanias();
  const fazendas = fazendasTombadas();
  const terras = terrasPublicas();
  const listas = listasPopulacao();
  const bensFederais = bensTombadosRurais();
  const protegidas = mineracaoProtegida();

  const revoltas = CALENDARIO_LUTAS.flatMap((e) => {
    const local = localDaEntrada(e);
    if (!local) return [];
    return [{
      data: e.diaMes.split("-").reverse().join("/"),
      ano: e.ano,
      titulo: e.titulo,
      lugar: local.nome,
      uf: local.uf,
      lat: local.lat,
      lon: local.lon,
      nomeVoo: `${e.titulo} — ${local.nome}/${local.uf}`,
      ctx: local.ctx ?? null,
    }];
  });

  const linhasCaps: LinhaHistoria[] = caps.map((c) => ({
    nome: c.nome, inicio: c.inicio, fim: c.fim, area: c.area,
  }));
  const linhasRevoltas: LinhaHistoria[] = revoltas;
  const linhasFazendas: LinhaHistoria[] = fazendas.map((f) => ({
    denominacao: f.denominacao, municipio: f.municipio, distrito: f.distrito,
    classe: f.classe, ato: f.ato, url: f.url,
  }));
  const linhasTerras: LinhaHistoria[] = terras.map((t) => ({
    notacao: t.notacao, municipio: t.municipio, periodo: t.periodo, titulo: t.titulo, url: t.url,
  }));
  const linhasListas: LinhaHistoria[] = listas.map((l) => ({
    local: l.local, municipio: l.municipio ?? "—", data: l.data, notacao: l.notacao,
    vila: l.vilaMineradora ?? "—", url: l.url,
  }));

  const colunasCaps: ColunaHistoria[] = [
    { chave: "nome", rotulo: "Capitania" },
    { chave: "inicio", rotulo: "Início" },
    { chave: "fim", rotulo: "Fim" },
    { chave: "area", rotulo: "Área relativa (graus²)", tipo: "numero" },
  ];
  const colunasRevoltas: ColunaHistoria[] = [
    { chave: "data", rotulo: "Dia" },
    { chave: "ano", rotulo: "Ano" },
    { chave: "titulo", rotulo: "Fato" },
    { chave: "lugar", rotulo: "Onde" },
    { chave: "uf", rotulo: "UF" },
    { chave: "voo", rotulo: "No globo", tipo: "voo" },
  ];
  const colunasFazendas: ColunaHistoria[] = [
    { chave: "denominacao", rotulo: "Bem tombado" },
    { chave: "municipio", rotulo: "Município" },
    { chave: "distrito", rotulo: "Distrito" },
    { chave: "ato", rotulo: "Ato legal" },
    { chave: "url", rotulo: "Fonte", tipo: "link" },
  ];
  const colunasTerras: ColunaHistoria[] = [
    { chave: "notacao", rotulo: "Notação" },
    { chave: "municipio", rotulo: "Município" },
    { chave: "periodo", rotulo: "Período" },
    { chave: "titulo", rotulo: "Registro" },
    { chave: "url", rotulo: "Fonte", tipo: "link" },
  ];
  const linhBens: LinhaHistoria[] = bensFederais.map((b) => ({
    nome: b.nome, municipio: b.municipio, uf: b.uf, classificacao: b.classificacao, ano: b.ano, processo: b.processo,
  }));
  const colunasBens: ColunaHistoria[] = [
    { chave: "nome", rotulo: "Bem tombado (federal)" },
    { chave: "municipio", rotulo: "Município" },
    { chave: "uf", rotulo: "UF" },
    { chave: "classificacao", rotulo: "Classificação" },
    { chave: "ano", rotulo: "Ano" },
    { chave: "processo", rotulo: "Processo" },
  ];
  const colunasListas: ColunaHistoria[] = [
    { chave: "local", rotulo: "Local (como no documento)" },
    { chave: "municipio", rotulo: "Município (IBGE)" },
    { chave: "vila", rotulo: "Vila mineradora (séc. XVIII)" },
    { chave: "data", rotulo: "Data" },
    { chave: "notacao", rotulo: "Notação" },
    { chave: "url", rotulo: "Fonte", tipo: "link" },
  ];
  const listasEmVila = listas.filter((l) => l.vilaMineradora).length;

  const totalUC = protegidas.find((p) => p.camada === "mineracao-em-uc")?.total ?? 0;
  const totalQuil = protegidas.find((p) => p.camada === "mineracao-em-quilombo")?.total ?? 0;

  const Cartao = ({ valor, rotulo }: { valor: string; rotulo: string }) => (
    <div className="rounded-2xl border border-border bg-surface-2 p-4">
      <p className="text-2xl font-semibold tabular-nums">{valor}</p>
      <p className="mt-1 text-sm text-text-soft">{rotulo}</p>
    </div>
  );

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/" className="transition hover:text-primary">Início</Link>{" "}
        › <span className="font-semibold text-foreground">História</span>
      </nav>

      <header className="rounded-3xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted">
          <History className="h-4 w-4" aria-hidden="true" /> História e território
        </p>
        <h1 className="mt-2 text-3xl font-bold">História — capitanias, revoltas e terras</h1>
        <ResumoExpandivel
          className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft"
          texto={
            "As camadas históricas no mesmo arquivo que alimenta o globo 3D: as capitanias " +
            "hereditárias de 1534, as revoltas com lugar identificado, as fazendas tombadas em Minas " +
            "e os registros de terras públicas do Império. Cada linha traz a fonte oficial, e cada " +
            "ponto abre o globo no lugar. Fronteira antiga é traçado aproximado, e o portal diz isso."
          }
        />
      </header>

      <section aria-label="Resumo em números" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Cartao valor={caps.length.toLocaleString("pt-BR")} rotulo="capitanias hereditárias (1534)" />
        <Cartao valor={revoltas.length.toLocaleString("pt-BR")} rotulo="revoltas com lugar identificado" />
        <Cartao valor={fazendas.length.toLocaleString("pt-BR")} rotulo="conjuntos rurais tombados (IEPHA)" />
        <Cartao valor={terras.length.toLocaleString("pt-BR")} rotulo="registros de terras públicas (APM)" />
        <Cartao valor={listas.length.toLocaleString("pt-BR")} rotulo="listas nominativas (1838-1840)" />
        <Cartao valor={listasEmVila.toLocaleString("pt-BR")} rotulo="listas em vila mineradora (séc. XVIII)" />
        <Cartao valor={bensFederais.length.toLocaleString("pt-BR")} rotulo="bens federais rurais tombados (IPHAN)" />
        <Cartao valor={totalUC.toLocaleString("pt-BR")} rotulo="polígonos de mineração em UC" />
        <Cartao valor={totalQuil.toLocaleString("pt-BR")} rotulo="polígonos de mineração em quilombo" />
      </section>

      {caps.length ? (
        <TabelaHistoria
          titulo="Capitanias hereditárias (1534)"
          nota="OpenHistoricalMap (CC0), faixa por faixa — traçado histórico aproximado"
          colunas={colunasCaps}
          linhas={linhasCaps}
          nomeCsv="historia-capitanias"
        />
      ) : <Vazio>Sem a camada de capitanias no repositório.</Vazio>}

      {revoltas.length ? (
        <TabelaHistoria
          titulo="Revoltas e lutas com lugar identificado"
          nota="gazetteer curado (lib/memoria/locais.ts) — só o lugar inequívoco"
          colunas={colunasRevoltas}
          linhas={linhasRevoltas}
          nomeCsv="historia-revoltas"
        />
      ) : <Vazio>Ainda não há verbete da memória com lugar inequívoco identificado.</Vazio>}

      {fazendas.length ? (
        <TabelaHistoria
          titulo="Conjuntos rurais tombados (IEPHA-MG)"
          nota="fazendas históricas e uma usina — ponto no centroide do município"
          colunas={colunasFazendas}
          linhas={linhasFazendas}
          nomeCsv="historia-fazendas-tombadas"
        />
      ) : <Vazio>Sem a camada de fazendas tombadas.</Vazio>}

      {terras.length ? (
        <TabelaHistoria
          titulo="Terras públicas do Império (APM, 1850s)"
          nota="registros que nomeiam o município — piso: 244 no acervo, 14 nomeiam"
          colunas={colunasTerras}
          linhas={linhasTerras}
          nomeCsv="historia-terras-publicas"
        />
      ) : <Vazio>Sem a camada de terras públicas.</Vazio>}

      {bensFederais.length ? (
        <TabelaHistoria
          titulo="Fazendas, engenhos e usinas tombados pelo IPHAN (federal)"
          nota="161 dos 2.475 bens tombados federais têm nome rural; ponto no centroide do município"
          colunas={colunasBens}
          linhas={linhBens}
          nomeCsv="historia-bens-tombados-rurais"
        />
      ) : <Vazio>Sem a camada de bens tombados do IPHAN.</Vazio>}

      {listas.length ? (
        <TabelaHistoria
          titulo="Listas nominativas (1838-1840) — APM"
          nota="fonte primária da população da província, incluindo a escravizada; o acervo cataloga o documento, não a contagem"
          colunas={colunasListas}
          linhas={linhasListas}
          nomeCsv="historia-listas-nominativas"
        />
      ) : <Vazio>Sem o índice de listas nominativas.</Vazio>}

      <section aria-label="Critério do cruzamento" className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="text-xl font-semibold">Como estas listas se cruzam com a mineração</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-soft">
          A coluna <strong>“Vila mineradora (século XVIII)”</strong> marca a lista cujo município
          pertencia a uma <strong>vila ou comarca do ouro</strong> — critério <strong>histórico</strong>,
          com fonte. É factual e datado.
        </p>
        <p className="mt-3 rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm">
          <strong>O que NÃO se fez, de propósito:</strong> cruzar estas listas de 1838-1840 com a{" "}
          <strong>mineração detectada por satélite</strong> (1995-2024) e concluir “mineração
          escravizada”. São dois dados verdadeiros com 150 anos de distância: juntos, sugeririam um
          terceiro falso. Isso é anacronismo, e a regra editorial do portal proíbe.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft">
          E vai a ressalva que a historiografia impõe: <strong>em 1838-1840 a economia escravista de
          Minas já era sobretudo agrária</strong>, não de lavra (Martins, <em>A economia escravista de
          Minas Gerais no século XIX</em>, CEDEPLAR/UFMG, 1982). A lista vem de lugar que <em>foi</em>
          minerador; o trabalho escravizado que ela registra, no período, era em boa parte rural. O
          acervo cataloga o documento — não traz a contagem de pessoas escravizadas, que exigiria ler
          a imagem de cada lista.
        </p>
        <p className="mt-2 text-xs text-text-soft">
          Dicionário de vilas e comarcas: IBGE, <em>Brasil: 500 anos de povoamento</em> (“descoberta do
          ouro”); Prado Júnior, <em>Formação do Brasil contemporâneo</em> (1942); Revista do Arquivo
          Público Mineiro.
        </p>
      </section>

      <section aria-label="Mineração em área protegida" className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="text-xl font-semibold">Mineração detectada em área protegida</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-soft">
          Cruzamento por centroide (piso, não total) entre a mineração detectada por satélite e as
          áreas protegidas oficiais. Estar dentro não é, por si, ilícito — é convite para conferir na
          fonte, e a apuração é da autoridade.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {protegidas.map((p: AgregadoProtegido) => (
            <div key={p.camada} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm font-semibold">
                {p.camada === "mineracao-em-uc" ? "Dentro de unidades de conservação" : "Dentro de territórios quilombolas"}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{p.total.toLocaleString("pt-BR")}</p>
              <ul className="mt-2 space-y-0.5 text-xs text-text-soft">
                {p.areas.slice(0, 6).map((a) => (
                  <li key={a.nome}>
                    {a.nome} — {a.quantos}
                  </li>
                ))}
                {p.areas.length > 6 ? <li>… e mais {p.areas.length - 6} áreas</li> : null}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Ver no globo" className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="text-xl font-semibold">Ver no globo 3D</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-soft">
          As camadas desta página são as mesmas do globo. O link abre com a camada acesa.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["hist-capitanias", "Capitanias hereditárias (1534)"],
            ["hist-revoltas", "Revoltas e lutas com lugar"],
            ["hist-listas-populacao", "Listas nominativas (1838-1840)"],
            ["hist-bens-tombados", "Bens tombados pelo IPHAN"],
            ["hist-terras-publicas", "Terras públicas do Império"],
            ["hist-fazendas-engenhos", "Fazendas históricas tombadas"],
            ["mineracao-em-uc", "Mineração detectada em UC"],
            ["mineracao-em-quilombo", "Mineração detectada em quilombo"],
          ].map(([camada, rotulo]) => (
            <li key={camada}>
              <a
                href={`/terras/globo/?camada=${camada}`}
                className="block rounded-xl border border-border bg-surface p-3 text-sm transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
              >
                {rotulo} <span className="underline">abrir</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Fonte e método" className="rounded-2xl border border-border bg-surface-2 p-5 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">De onde vêm estes dados</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li><strong>Capitanias:</strong> OpenHistoricalMap (CC0), conferido no modelo e na contagem contra o mapa do IBGE (Luís Teixeira, 1574).</li>
          <li><strong>Revoltas:</strong> verbetes do acervo de memória do portal, com lugar pelo gazetteer curado; a fonte de cada fato está no verbete.</li>
          <li><strong>Fazendas:</strong> IEPHA-MG — bens culturais tombados (conjuntos rurais).</li>
          <li><strong>Terras públicas:</strong> Arquivo Público Mineiro (SIAAPM), Repartição Especial das Terras Públicas.</li>
          <li><strong>Listas nominativas:</strong> Arquivo Público Mineiro (SIAAPM), Coleção Mapas de População (1838-1840) — a fonte primária da população, incluindo a escravizada.</li>
          <li><strong>Mineração:</strong> Monitor da Mineração (MapBiomas) × ANM/SIGMINE, cruzada com CNUC e INCRA por centroide.</li>
        </ul>
        <p className="mt-3 text-text-soft">
          As <strong>pendências</strong> desta frente (fontes de mineração escravizada, engenhos de cana,
          fazendas de café, cartografia dos tratados e o link canônico das obras acadêmicas) estão
          registradas no plano:{" "}
          <code>docs/planos/PLANO-HISTORIA-CAMADAS-GLOBO-3D.md</code>, seção “Pendências a resolver”.
        </p>
        <p className="mt-2 text-text-soft print:hidden">
          As tabelas são vetoriais e saem nítidas na impressão; cada botão de planilha baixa exatamente
          o que está filtrado na tela, com <code>;</code> e BOM UTF-8.
        </p>
        <p className="mt-2 text-xs text-text-soft">
          Camadas de geometria antiga em{" "}
          <a
            className="inline-flex items-center gap-1 underline"
            href="/terras/globo/?camada=hist-capitanias"
            target="_blank"
            rel="noopener noreferrer"
          >
            globo 3D <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </p>
      </section>
    </main>
  );
}
