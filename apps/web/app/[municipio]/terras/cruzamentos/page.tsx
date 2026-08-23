import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import BarrasValor from "@/app/[municipio]/components/charts/BarrasValor";
import { areaTotalHa, carregarCruzamentosDoMunicipio } from "@/lib/terras/cruzamentos-municipio";
import { LABEL_TIPO_CRUZAMENTO } from "@/lib/terras/cruzamentos-puro";
import { formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ListaCruzamentos from "./ListaCruzamentos";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Territórios tradicionais × empreendimentos em ${c.nome} — ${nomePortal(c)}`,
  (c) =>
    `Sobreposições de terras indígenas, quilombolas, mineração (SIGMINE/ANM) e barragens (FEAM/SNISB) em ${c.nome}, com fonte e mapa.`
);

interface CruzamentosPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function CruzamentosPage({ params: rota }: CruzamentosPageProps) {
  const cidade = await cidadeDaRota(rota);
  const cruz = carregarCruzamentosDoMunicipio(cidade.nome, cidade.id_municipio);

  const nPorTipo = {
    mineracao_operacao: cruz.linhas.filter((l) => l.tipo === "mineracao_operacao").length,
    mineracao_interesse: cruz.linhas.filter((l) => l.tipo === "mineracao_interesse").length,
    barragem_mancha_quilombola: cruz.linhas.filter((l) => l.tipo === "barragem_mancha_quilombola").length,
  };
  const nTi = cruz.territoriosPresentes.filter((t) => t.tipo === "terra_indigena").length;
  const nQui = cruz.territoriosPresentes.filter((t) => t.tipo === "quilombola").length;

  // Gráfico: área de interseção por tipo — cor única, o comprimento é o
  // dado; a tabela abaixo é a alternativa em texto (regra das cinco coisas).
  const areasPorTipo = Object.entries(nPorTipo)
    .map(([tipo, n]) => ({
      tipo: tipo as keyof typeof LABEL_TIPO_CRUZAMENTO,
      n,
      ha: areaTotalHa(cruz.linhas.filter((l) => l.tipo === tipo)),
    }))
    .filter((a) => a.n > 0);

  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/${cidade.slug}/terras/cruzamentos/dados`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/terras" className="hover:text-primary">
          Terras
        </Link>{" "}
        · <span className="text-text">Cruzamentos</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Territórios tradicionais × empreendimentos
      </h1>
      <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
        Onde os polígonos de terras indígenas (FUNAI) e territórios
        quilombolas (INCRA) de {cidade.nome} intersectam processos mineiros
        (SIGMINE/ANM) e manchas de barragens (FEAM/SNISB), linha por linha,
        com link para a fonte e para os dois polígonos no mapa.
      </p>

      <div className="mt-4 max-w-3xl rounded-2xl border border-dashed border-border bg-surface-2 p-5 text-sm leading-relaxed text-text-soft">
        <p>
          <strong className="text-text">O que este cruzamento diz — e o que não diz.</strong>{" "}
          Cada linha da tabela é uma <strong>interseção exata de polígonos</strong>,
          medida em hectares pela frente do globo 3D — não há margem de
          proximidade (buffer) nesta tela. Interseção é ponto de partida para
          investigar, <strong>não é irregularidade nem relação de causa</strong>:
          um processo mineiro sobreposto a território pode ser legal, antigo ou
          contestado — o que aqui se afirma é só que os dois polígonos se
          encontram no dado oficial.
        </p>
        <p className="mt-2">
          As seções “Barragens” e “Licenciamento” são{" "}
          <strong>co-ocorrência municipal</strong>: empreendimento e território
          aparecem no mesmo município, sem teste espacial entre eles — o rótulo
          está em cada uma. Fontes: FUNAI, INCRA, ANM/SIGMINE, FEAM/SNISB e
          SISEMA/FEAM, nas mesmas camadas públicas do{" "}
          <a href="/funcaosocialterra/mapa" target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
            globo da Função Social da Terra ↗
          </a>
          .
        </p>
      </div>

      {/* ── Cartões de topo (regra das cinco coisas) ── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-text-soft">Territórios no município</p>
          <p className="font-tabular mt-1 text-2xl font-bold text-text">{nTi + nQui}</p>
          <p className="mt-1 text-xs text-text-soft">
            {nTi} {nTi === 1 ? "terra indígena" : "terras indígenas"} · {nQui}{" "}
            {nQui === 1 ? "território quilombola" : "territórios quilombolas"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-text-soft">Sobreposições</p>
          <p className="font-tabular mt-1 text-2xl font-bold text-text">{cruz.linhas.length}</p>
          <p className="mt-1 text-xs text-text-soft">
            {nPorTipo.mineracao_operacao} mineração em operação ·{" "}
            {nPorTipo.mineracao_interesse} requerimento ·{" "}
            {nPorTipo.barragem_mancha_quilombola} mancha de barragem × quilombola
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-text-soft">Área intersectada</p>
          <p className="font-tabular mt-1 text-2xl font-bold text-text">
            {formatNumberBR(Math.round(areaTotalHa(cruz.linhas) * 100) / 100)} ha
          </p>
          <p className="mt-1 text-xs text-text-soft">soma das interseções exatas, sem buffer.</p>
        </div>
      </div>

      {/* ── Gráfico (área por tipo) + alternativa em texto na tabela ── */}
      {areasPorTipo.length > 0 && (
        <div className="mt-6">
          <DataCard title="Área de interseção por tipo de cruzamento" source={{ label: "FUNAI/INCRA × ANM/FEAM", url: "/funcaosocialterra/mapa" }}>
            <BarrasValor
              formatValor={(v) => `${formatNumberBR(Math.round(v * 100) / 100)} ha`}
              itens={areasPorTipo.map((a) => ({
                label: LABEL_TIPO_CRUZAMENTO[a.tipo],
                valor: a.ha,
                sublabel: `· ${a.n} ${a.n === 1 ? "cruzamento" : "cruzamentos"}`,
                titulo: `${LABEL_TIPO_CRUZAMENTO[a.tipo]}: ${formatNumberBR(Math.round(a.ha * 100) / 100)} ha em ${a.n} cruzamento(s)`,
              }))}
            />
          </DataCard>
        </div>
      )}

      {/* ── Tabela principal ── */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Sobreposições (interseção exata)
        </h2>
        <ListaCruzamentos base={baseDados} municipioSlug={cidade.slug} />
      </section>

      {/* ── Co-ocorrências municipais, rotuladas como tal ── */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <DataCard
          title={`Barragens com mancha publicada em ${cidade.nome}`}
          source={{ label: "FEAM/SNISB" }}
        >
          <p className="mb-3 text-sm">
            <strong className="text-text">Co-ocorrência municipal:</strong> estas
            estruturas estão no mesmo município que território tradicional —
            NÃO houve teste de sobreposição entre elas. A sobreposição real
            (quando existe) está na tabela acima.
          </p>
          {cruz.barragensNoMunicipio.length === 0 ? (
            <p className="text-sm text-text-soft">Nenhuma mancha publicada para este município.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {cruz.barragensNoMunicipio.map((b) => (
                <li key={b.estrutura}>
                  <strong className="text-text">{b.estrutura}</strong> · {b.empreendedor || "empreendedor não informado"} · PAE:{" "}
                  {b.statusPae || "sem status"}
                </li>
              ))}
            </ul>
          )}
        </DataCard>

        <DataCard
          title={`Licenciamento ambiental em ${cidade.nome}`}
          source={{ label: "SISEMA/FEAM" }}
        >
          <p className="mb-3 text-sm">
            <strong className="text-text">Co-ocorrência municipal:</strong>{" "}
            estudos e audiências registrados para o município — não há
            geometria por estudo nesta camada, então nada aqui afirma
            proximidade com território.
          </p>
          {cruz.licenciamentoMunicipal ? (
            <div className="text-sm">
              <p>
                {cruz.licenciamentoMunicipal.audiencias} audiência(s) pública(s) ·{" "}
                {cruz.licenciamentoMunicipal.estudosEnumeraveis} estudo(s) enumerável(is)
                {cruz.licenciamentoMunicipal.temEia && <> · EIA disponível</>}
                {cruz.licenciamentoMunicipal.temRima && <> · RIMA disponível</>}
              </p>
              {cruz.licenciamentoMunicipal.ultimaPublicacao && (
                <p className="mt-1 text-text-soft">Última publicação: {cruz.licenciamentoMunicipal.ultimaPublicacao}</p>
              )}
              <div className="mt-2 flex flex-col gap-1">
                {cruz.licenciamentoMunicipal.linkEstudos && (
                  <a href={cruz.licenciamentoMunicipal.linkEstudos} className="w-fit text-[.9em] font-medium text-primary underline underline-offset-2">
                    Estudos no acervo do portal →
                  </a>
                )}
                {cruz.licenciamentoMunicipal.linkFonteOficial && (
                  <a href={cruz.licenciamentoMunicipal.linkFonteOficial} target="_blank" rel="noopener noreferrer" className="w-fit text-[.9em] font-medium text-primary underline underline-offset-2">
                    Consulta oficial SISEMA/FEAM ↗
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-soft">
              Nenhum registro nesta camada para o geocódigo {cidade.id_municipio}.
            </p>
          )}
        </DataCard>
      </section>

      {cruz.territoriosPresentes.length > 0 && (
        <section className="mt-6">
          <DataCard title={`Territórios tradicionais registrados em ${cidade.nome}`} source={{ label: "FUNAI / INCRA" }}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {cruz.territoriosPresentes.map((t, i) => (
                <li key={`${t.tipo}-${t.nome ?? i}`} className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
                  <strong className="text-text">
                    {t.tipo === "terra_indigena" ? "Terra Indígena" : "Território quilombola"}:{" "}
                    {t.nome ?? "sem nome no dado de origem"}
                  </strong>
                  <span className="block text-text-soft">
                    {[
                      t.etniaOuFase,
                      t.fase,
                      t.areaHa != null ? `${formatNumberBR(Math.round(t.areaHa))} ha` : null,
                      t.municipios.length > 1 ? `também em ${t.municipios.filter((m) => !municipiosIguais(m, cidade.nome)).join(", ")}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          </DataCard>
        </section>
      )}

      {/* ── Lacunas declaradas (é conteúdo, não defeito escondido) ── */}
      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-display text-base font-semibold text-text">Lacunas deste município, declaradas</h2>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-text-soft">
          {cruz.lacunas.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
          <li>
            Casamento de município nas camadas FUNAI/INCRA/FEAM é por nome
            normalizado (sem acento/caixa), pois as fontes não publicam código
            IBGE — grafia muito divergente poderia escapar; os totais dos
            cartões vêm do mesmo filtro desta tela.
          </li>
        </ul>
      </section>
    </main>
  );
}

function municipiosIguais(a: string, b: string): boolean {
  return a.localeCompare(b, "pt-BR", { sensitivity: "accent" }) === 0;
}
