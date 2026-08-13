import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import TaxaDeErroTerras from "@/app/[municipio]/components/TaxaDeErroTerras";
import { ZONAS } from "@/lib/zonas";
import { listarCidades } from "@/lib/db/queries/municipios";
import { vazioResumoPorMunicipio } from "@/lib/betim/terras";
import { formatNumberBR } from "@/lib/betim/format";
import { carregarResumoMapaEstadual } from "@/lib/terras/mapa-resumo";
import { carregarAlertasSigmine, carregarAtosAreaProtegida } from "@/lib/terras/alertas";

/**
 * `/funcaosocialterra` — a frente de função social da terra.
 *
 * ═══ O QUE ESTA PÁGINA PODE PROMETER ═══
 *
 * O card do `/ambiental` traz a lição, escrita na própria `lib/zonas.ts`: ele
 * anunciava quatro seções e só uma tinha dado, e foi cortado porque "um card
 * que promete quatro e entrega uma não é antecipação de roadmap, é o portal
 * de transparência mentindo na vitrine".
 *
 * Aqui a mesma régua: a página lista as cidades que TÊM levantamento — três,
 * todas do Vale do Jequitinhonha — e diz que as outras não têm. Nada de
 * "em breve" com número ao lado.
 *
 * ═══ E A REGRA QUE MANDA NESTA FRENTE ═══
 *
 * O número sai acompanhado da taxa de erro, na mesma tela, sempre
 * (`TaxaDeErroTerras`). Este é o único dado do portal que é ESTIMATIVA
 * produzida por método próprio, e não leitura de fonte oficial — publicá-lo
 * sem a margem seria cobrar dos outros o que não se faz.
 *
 * ═══ 13/08: A PÁGINA ENVELHECEU PARA O QUE O MAPA VIROU ═══
 *
 * O texto foi escrito quando esta frente era só vazio cadastral em três
 * cidades do Jequitinhonha. O mapa hoje carrega camadas estaduais que não
 * existiam então — terra indígena, barragem, SIGMINE, CFEM, cruzamento de
 * dinheiro, território quilombola — e a seção "O que o mapa mostra hoje"
 * (abaixo) existe para o hub não ficar preso à versão antiga de si mesmo, o
 * mesmo erro que `lib/zonas.ts` já registrou duas vezes para o CARD desta
 * frente. Cada número vem de `carregarResumoMapaEstadual()`
 * (`lib/terras/mapa-resumo.ts`), que conta feição por arquivo GeoJSON — não
 * há número digitado aqui. O VAZIO CADASTRAL continua sendo o recorte de
 * três cidades que é: não infla, não veste roupa estadual que não tem.
 */
const ZONA = ZONAS.find((z) => z.id === "terras")!;

export const metadata: Metadata = {
  title: "Função social da terra — Controle Popular",
  description:
    "Mapa 3D de Minas Gerais com terra indígena, barragem, mineração (SIGMINE), CFEM e alertas de sobreposição, e o vazio cadastral — quanto do território de cada cidade não tem imóvel rural declarado no CAR — com a metodologia aberta e a taxa de erro medida ao lado do número.",
};

export default async function FuncaoSocialTerraPage() {
  const cidades = await listarCidades();

  const comDado = (
    await Promise.all(
      (cidades ?? []).map(async (c) => ({
        cidade: c,
        linhas: (await vazioResumoPorMunicipio(c.id_municipio)) ?? [],
      }))
    )
  ).filter((x) => x.linhas.length > 0);

  const totalHa = comDado.reduce(
    (s, x) => s + x.linhas.reduce((t, l) => t + l.areaCandidataHa, 0),
    0
  );

  const resumoMapa = carregarResumoMapaEstadual();
  const alertaOperacao = carregarAlertasSigmine("operacao");
  const alertaInteresse = carregarAlertasSigmine("interesse");
  const atosAreaProtegida = carregarAtosAreaProtegida();

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <p className="text-[.8em] font-semibold tracking-wide text-text-soft uppercase">
        {ZONA.etiqueta}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
        {ZONA.titulo}
      </h1>
      <p className="mt-3 max-w-[62ch] text-text-soft">
        Terra sem dono declarado não é terra sem função. O Cadastro Ambiental
        Rural é declaratório: quem tem imóvel rural declara. O que sobra — área
        que ninguém declarou — é o <strong>vazio cadastral</strong>, e é o
        ponto de partida para perguntar de quem é aquela terra e o que se faz
        dela. Mas o mapa desta frente não para mais no vazio cadastral: hoje
        ele também mostra terra indígena, barragem, mineração, dinheiro
        público e onde essas camadas se cruzam.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href="/funcaosocialterra/mapa"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-ink shadow-sm transition-colors hover:opacity-90"
        >
          Ver mapa completo (3D) →
        </a>
        <a
          href="/funcaosocialterra/alertas"
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text shadow-sm transition-colors hover:border-primary"
        >
          Ver alertas, um por um →
        </a>
      </div>

      <section className="mt-9">
        <h2 className="font-display text-xl font-semibold">
          O que o mapa mostra hoje
        </h2>
        <p className="mt-1 max-w-[62ch] text-sm text-text-soft">
          Minas Gerais inteira nestas camadas — não só o Jequitinhonha do
          vazio cadastral abaixo. Cada número é contado direto no GeoJSON
          publicado, sem digitar.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="font-tabular text-xl font-bold text-text">
              {formatNumberBR(resumoMapa.terrasIndigenas)}
            </p>
            <p className="text-text-soft">
              terras indígenas da FUNAI, todas as fases (do &quot;em estudo&quot; ao
              &quot;regularizada&quot; — o direito é o mesmo nas quatro).
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="font-tabular text-xl font-bold text-text">
              {formatNumberBR(resumoMapa.territoriosQuilombolas)}
            </p>
            <p className="text-text-soft">territórios quilombolas publicados.</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="font-tabular text-xl font-bold text-text">
              {formatNumberBR(resumoMapa.barragensComManchaPublicada)}
            </p>
            <p className="text-text-soft">
              barragens com mancha de inundação publicada pela FEAM — a área que
              a água alcança se a barragem romper.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="font-tabular text-xl font-bold text-text">
              {formatNumberBR(resumoMapa.sigmineOperacao)} +{" "}
              {formatNumberBR(resumoMapa.sigmineInteresse)}
            </p>
            <p className="text-text-soft">
              títulos minerários da ANM (SIGMINE): {formatNumberBR(resumoMapa.sigmineOperacao)}{" "}
              em fase que autoriza extrair, {formatNumberBR(resumoMapa.sigmineInteresse)} são só
              requerimento — as duas nunca somadas como &quot;mina&quot;.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="font-tabular text-xl font-bold text-text">
              {formatNumberBR(resumoMapa.cfemMunicipios)}
            </p>
            <p className="text-text-soft">
              municípios com royalty da mineração (CFEM) detalhado por substância e
              empresa.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="font-tabular text-xl font-bold text-text">
              {formatNumberBR(resumoMapa.cruzamentoDinheiroEmpresas)}
            </p>
            <p className="text-text-soft">
              empresas cruzadas entre licença ambiental e dinheiro público recebido —
              cobertura de 4 municípios (Araçuaí, Betim, Diamantina e Itinga), não o
              estado inteiro.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-soft">
          <p>
            <strong className="text-text">Alertas calculados por sobreposição de geometria:</strong>{" "}
            {formatNumberBR(alertaOperacao.itens.length)} sobreposições entre território e lavra
            já autorizada, {formatNumberBR(alertaInteresse.itens.length)} entre território e
            requerimento minerário, e {formatNumberBR(atosAreaProtegida.totalNormas)} normas
            municipais que criam ou alteram área protegida. Terra indígena e território
            quilombola atingidos por mancha de barragem: zero, medido numa varredura completa —
            não é ausência de checagem.
          </p>
          <a
            href="/funcaosocialterra/alertas"
            className="mt-2 inline-block font-medium text-primary underline underline-offset-2 hover:text-accent"
          >
            Conferir cada alerta, com processo e link para a fonte →
          </a>
        </div>
      </section>

      {comDado.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
          Nenhuma cidade tem levantamento publicado no momento.
        </p>
      ) : (
        <>
          <section className="mt-9">
            <h2 className="font-display text-xl font-semibold">
              Onde já foi levantado
            </h2>
            <p className="mt-1 text-sm text-text-soft">
              {formatNumberBR(Math.round(totalHa))} hectares em{" "}
              {comDado.length}{" "}
              {comDado.length === 1 ? "cidade" : "cidades"} do Vale do
              Jequitinhonha.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {comDado.map(({ cidade, linhas }) => {
                const l = linhas[0];
                return (
                  <a
                    key={cidade.id_municipio}
                    href={`/${cidade.slug}/terras`}
                    className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary"
                  >
                    <h3 className="font-display text-base font-semibold text-text">
                      {cidade.nome}
                    </h3>
                    <p className="mt-2 font-tabular text-2xl font-bold text-text">
                      {l.percentual.toFixed(1)}%
                    </p>
                    <p className="mt-1 text-xs text-text-soft">
                      {formatNumberBR(Math.round(l.areaCandidataHa))} ha de{" "}
                      {formatNumberBR(Math.round(l.areaUniversoHa))} ha ·{" "}
                      {l.qtdPoligonos} polígonos
                    </p>
                    <p className="mt-3 text-[.8em] font-medium text-primary">
                      Ver em {cidade.nome} →
                    </p>
                  </a>
                );
              })}
            </div>
          </section>

          <TaxaDeErroTerras />

          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">
              Como o número é calculado
            </h2>
            <ol className="mt-3 max-w-[62ch] list-decimal space-y-2 pl-5 text-sm text-text-soft">
              <li>
                Parte-se do limite do município, na malha oficial do IBGE. É
                ele o denominador — a porcentagem é sobre o município inteiro,
                não sobre um recorte escolhido.
              </li>
              <li>
                Subtrai-se tudo o que foi declarado no CAR: cada imóvel rural
                que alguém registrou.
              </li>
              <li>
                Subtraem-se as classes de uso que não admitem destinação
                fundiária — corpo d&apos;água, mancha urbana e afins.
              </li>
              <li>
                O que sobra é o vazio cadastral. Cada polígono guarda a regra
                exata que o produziu, e ela aparece na página da cidade.
              </li>
            </ol>
            <p className="mt-4 max-w-[62ch] text-sm text-text-soft">
              <strong className="text-text">
                Vazio cadastral não é terra devoluta.
              </strong>{" "}
              Terra devoluta é categoria jurídica, decidida em processo. O que
              está aqui é candidato a verificação — e a taxa de erro acima diz
              com que frequência esse candidato não se confirma.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">
              De onde vem o dado
            </h2>
            <p className="mt-2 max-w-[62ch] text-sm text-text-soft">
              Cadastro Ambiental Rural (CAR/SICAR), malha municipal do IBGE,
              cobertura do MapBiomas e as bases fundiárias do INCRA (SIGEF e
              SNCI). O pipeline que produz as camadas é aberto e roda fora
              deste portal.
            </p>
            <a
              href="https://www.car.gov.br/publico/imoveis/index"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-2"
            >
              Consultar o CAR na fonte oficial ↗
            </a>
          </section>
        </>
      )}

      {/* Rodapé padrão do portal, direto na página e não num `layout.tsx`.
          Esta frente tem três rotas — este hub, `/mapa` e `/alertas` — e
          `/mapa` é o globo 3D ocupando a tela inteira, com HUD nos quatro
          cantos do canvas: rodapé embaixo dele seria ruído sobre uma tela
          que já resolve a própria navegação e já tem link de volta para cá.
          Um `layout.tsx` de zona colaria nas três (inclusive no globo). Ver
          a nota em `mapa/page.tsx`, que registra a mesma decisão pelo outro
          lado, e `alertas/page.tsx`, que segue o mesmo padrão manual de
          cabeçalho/rodapé em vez de layout de zona. */}
      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
