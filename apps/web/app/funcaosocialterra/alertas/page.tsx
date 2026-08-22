import type { Metadata } from "next";
import Cabecalho from "../Cabecalho";
import FooterGlobal from "@/app/components/FooterGlobal";
import AvisoColetaEmCurso from "@/app/components/AvisoColetaEmCurso";
import {
  carregarAlertasSigmine,
  carregarAlertaTiMancha,
  carregarAlertaQuilombolaMancha,
  carregarAtosAreaProtegida,
  FONTE_ANM_PROCESSOS,
  type AlertaSigmine,
  type AlertaQuilombolaManchaItem,
  type AlvoNoMapa,
} from "@/lib/terras/alertas";
import { formatNumberBR, formatDateBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/funcaosocialterra/alertas` — verificação item a item dos alertas que o
 * globo 3D só mostra como camada.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE, E POR QUE AQUI ═══
 *
 * Pedido: "essa lista de alertas merece uma página própria pra posterior
 * verificação". No globo dá para VER a sobreposição no mapa; não dá para
 * CONFERIR processo por processo, com o link para a fonte oficial ao lado.
 * Fica dentro de `/funcaosocialterra` (não uma zona nova) porque os quatro
 * alertas SÃO produto desta frente — território, SIGMINE, barragem e
 * legislação que mexe em área protegida são exatamente as camadas que o
 * mapa desta frente já carrega; uma zona própria duplicaria navegação para
 * o mesmo dado.
 *
 * ═══ NENHUM NÚMERO AQUI VEM DIGITADO ═══
 *
 * Tudo sai de `lib/terras/alertas.ts`, que lê os GeoJSON publicados em
 * `public/terras/globo/dados/camadas/` toda vez que a página é gerada —
 * sem cache entre builds. As camadas de território×SIGMINE e a de área
 * protegida estão sendo reprocessadas por outra frente ao mesmo tempo em
 * que esta página foi escrita (territórios quilombolas ganhando nome, entre
 * outras coisas); a próxima geração estática já lê o que estiver lá.
 *
 * `dynamic = "force-static"` não é necessário aqui (sem `searchParams`,
 * `output: 'export'` já trata a rota como estática por padrão) — diferente
 * de `mapa/page.tsx`, que precisa da declaração explícita por causa do
 * `useSearchParams()` do `GloboIframe`.
 */
export const metadata: Metadata = metadataEditavel("/funcaosocialterra/alertas", {
  title: "Alertas — Função social da terra | Controle Popular",
  description:
    "Sobreposição entre território (indígena e quilombola) e processo minerário na ANM, terra indígena atingida por mancha de barragem, e normas municipais que mexem em área protegida — item a item, com o caminho para conferir na fonte oficial.",
});

function AlvoMapaLink({ alvo, texto }: { alvo: AlvoNoMapa | null; texto: string }) {
  if (!alvo) return null;
  return (
    <a
      href={`/funcaosocialterra/mapa?camada=${encodeURIComponent(alvo.camada)}&idx=${alvo.idx}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
    >
      {texto} ↗
    </a>
  );
}

function haFmt(v: number): string {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 0 });
}

function ItemSigmine({ item, fato }: { item: AlertaSigmine; fato: boolean }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-text">
            {item.territorioNome ?? (
              <span className="italic text-text-soft">Território não identificado no dado</span>
            )}
            {item.territorioEtnia && (
              <span className="ml-2 font-normal text-text-soft">({item.territorioEtnia})</span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-text-soft">
            {item.territorioTipo === "terra_indigena" ? "Terra indígena" : "Território quilombola"}
            {item.territorioFase ? ` · fase ${item.territorioFase}` : ""}
            {item.territorioMunicipios.length > 0 && ` · ${item.territorioMunicipios.join(", ")}`}
          </p>
          {item.semNomeMotivo && (
            <p className="mt-1 max-w-[60ch] text-xs text-text-soft">{item.semNomeMotivo}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            fato
              ? "bg-alert/15 text-alert"
              : "bg-surface-2 text-text-soft"
          }`}
        >
          {haFmt(item.areaIntersecaoHa)} ha
        </span>
      </div>

      <div className="mt-3 border-t border-border/60 pt-3">
        <p className="text-text">
          <span className="font-medium">{item.sigmineNome}</span> — {item.sigmineSubs}
        </p>
        <p className="mt-0.5 text-xs text-text-soft">
          Processo ANM <span className="font-tabular">{item.sigmineProcesso}</span> · fase{" "}
          {item.sigmineFase}
          {item.sigmineUso ? ` · uso: ${item.sigmineUso}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <a
            href={FONTE_ANM_PROCESSOS.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
          >
            Conferir processo {item.sigmineProcesso} na ANM ↗
          </a>
          <AlvoMapaLink alvo={item.mapa} texto="Ver no mapa" />
        </div>
      </div>
    </li>
  );
}

function ItemQuilombolaMancha({ item }: { item: AlertaQuilombolaManchaItem }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-text">{item.territorioNome}</p>
          <p className="mt-0.5 text-xs text-text-soft">
            Território quilombola{item.territorioFase ? ` · fase ${item.territorioFase}` : ""}
            {item.territorioMunicipios.length > 0 &&
              ` · ${item.territorioMunicipios.join(", ")}`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-alert/15 px-2.5 py-1 text-xs font-semibold text-alert">
          {haFmt(item.areaIntersecaoHa)} ha
        </span>
      </div>

      <div className="mt-3 border-t border-border/60 pt-3">
        <p className="text-text">
          <span className="font-medium">{item.barragem}</span> — {item.empreendedor}
        </p>
        <p className="mt-0.5 text-xs text-text-soft">
          {item.municipioBarragem}
          {item.statusPae ? ` · status do PAE: ${item.statusPae}` : ""} — a mancha é o alcance
          máximo da onda numa ruptura hipotética (ERHB), não uma previsão de rompimento.
        </p>
        <AlvoMapaLink alvo={item.mapa} texto="Ver a mancha desta barragem no mapa" />
      </div>
    </li>
  );
}

export default function AlertasPage() {
  const operacao = carregarAlertasSigmine("operacao");
  const interesse = carregarAlertasSigmine("interesse");
  const tiMancha = carregarAlertaTiMancha();
  const quilombolaMancha = carregarAlertaQuilombolaMancha();
  const atos = carregarAtosAreaProtegida();

  return (
    <>
      <Cabecalho />
      <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
        <p className="text-[.8em] font-semibold tracking-wide text-text-soft uppercase">
          Terra e território · Alertas
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Alertas, um por um — para conferir, não só para olhar
        </h1>
        <p className="mt-3 max-w-[62ch] text-text-soft">
          O mapa 3D mostra estas sobreposições como camada — dá para ver onde
          acontecem, não dá para conferir cada uma. Esta página lista cada
          alerta que a frente de terra e território calcula, com o processo,
          o titular, o link para a fonte oficial e o atalho para o mesmo ponto
          no mapa.
        </p>

        {/* A ressalva vem ANTES dos números, não no rodapé: quem lê "zero
            interseções" na primeira dobra já formou a conclusão muito antes de
            chegar ao fim da página. E o exemplo que o componente cita aconteceu
            nesta página, com este cálculo. */}
        <AvisoColetaEmCurso escopo="Aqui a cobertura pesa duas vezes: depende de quantos territórios já foram ingeridos E de para quantas barragens a FEAM publicou mancha — 156 das 259 de Minas." />

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href="/funcaosocialterra"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-text hover:border-primary"
          >
            ← Função social da terra
          </a>
          <a
            href="/funcaosocialterra/mapa"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-ink shadow-sm hover:opacity-90"
          >
            Ver mapa completo (3D) →
          </a>
        </div>

        <nav className="mt-8 flex flex-wrap gap-3 rounded-2xl border border-dashed border-border bg-surface-2 px-4 py-3 text-xs">
          <a href="#operacao" className="font-medium text-primary hover:underline">
            Lavra autorizada ({formatNumberBR(operacao.itens.length)})
          </a>
          <a href="#interesse" className="font-medium text-primary hover:underline">
            Interesse minerário ({formatNumberBR(interesse.itens.length)})
          </a>
          <a href="#ti-mancha" className="font-medium text-primary hover:underline">
            TI × mancha de barragem
          </a>
          <a href="#quilombola-mancha" className="font-medium text-primary hover:underline">
            Quilombola × mancha de barragem
          </a>
          <a href="#area-protegida" className="font-medium text-primary hover:underline">
            Normas em área protegida ({formatNumberBR(atos.totalNormas)})
          </a>
        </nav>

        {/* ═══ Sobreposição território × SIGMINE — operação ═══════════════ */}
        <section id="operacao" className="mt-10 scroll-mt-6">
          <h2 className="font-display text-xl font-semibold">
            Território sobreposto por lavra AUTORIZADA
          </h2>
          <p className="mt-1 max-w-[62ch] text-sm text-text-soft">
            {formatNumberBR(operacao.itens.length)} sobreposições reais de geometria (não caixa
            aproximada) entre terra indígena ou território quilombola e um processo cuja fase
            já autoriza extrair minério — {haFmt(operacao.areaTotalHa)} ha ao todo.{" "}
            <strong className="text-text">Isto é fato consumado, não risco futuro</strong>: a
            extração já é permitida onde as duas geometrias se cruzam.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {operacao.itens.map((item, i) => (
              <ItemSigmine key={`${item.sigmineProcesso}-${i}`} item={item} fato />
            ))}
          </ul>
        </section>

        {/* ═══ Sobreposição território × SIGMINE — interesse ══════════════ */}
        <section id="interesse" className="mt-12 scroll-mt-6">
          <h2 className="font-display text-xl font-semibold">
            Território sobreposto por interesse minerário
          </h2>
          <p className="mt-1 max-w-[62ch] text-sm text-text-soft">
            {formatNumberBR(interesse.itens.length)} sobreposições com processo cuja fase é
            requerimento, pesquisa ou área em disponibilidade — um papel protocolado na ANM, não
            uma mina — somando {haFmt(interesse.areaTotalHa)} ha.{" "}
            <strong className="text-text">
              Isto é risco futuro, não fato consumado
            </strong>
            : nada está sendo extraído hoje só por existir este processo; muitos nunca viram
            lavra. Juridicamente é uma categoria diferente da seção acima, e por isso está numa
            seção separada.
          </p>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-primary underline decoration-dotted underline-offset-2">
              Ver as {formatNumberBR(interesse.itens.length)} sobreposições
            </summary>
            <ul className="mt-4 flex flex-col gap-3">
              {interesse.itens.map((item, i) => (
                <ItemSigmine key={`${item.sigmineProcesso}-${i}`} item={item} fato={false} />
              ))}
            </ul>
          </details>
        </section>

        {/* ═══ TI × mancha de barragem ═════════════════════════════════════ */}
        <section id="ti-mancha" className="mt-12 scroll-mt-6">
          <h2 className="font-display text-xl font-semibold">
            Terra indígena atingida por mancha de barragem
          </h2>
  <div className="mt-3 rounded-2xl border border-border bg-surface p-5">
            <p className="text-2xl font-bold font-tabular text-text">
              {tiMancha.qtdFeaturesEncontradas === 0
                ? "Zero"
                : formatNumberBR(tiMancha.qtdFeaturesEncontradas)}
            </p>
            <p className="mt-1 text-sm text-text-soft">
              interseções de geometria entre as {formatNumberBR(tiMancha.qtdTerritorios)}{" "}
              terras indígenas de MG e as{" "}
              {formatNumberBR(tiMancha.qtdBarragensComManchaPublicada)} manchas de
              inundação de barragem publicadas — varredura completa de{" "}
              <strong className="text-text">
                {formatNumberBR(tiMancha.universoCombinacoes)} combinações
              </strong>
              , não uma amostra.
            </p>
            <p className="mt-3 text-sm text-text-soft">
              <strong className="text-text">
                &quot;Zero hoje&quot; não é &quot;seguro para sempre&quot;:
              </strong>{" "}
              a FEAM publica mancha de inundação só para as barragens acima — nem todo o
              inventário dela tem esse estudo pronto. Se uma barragem sem mancha publicada ganhar
              o estudo, ou um novo estudo de ruptura mudar o alcance de uma mancha já publicada,
              esta conta pode deixar de dar zero. Esta página passa a listar a interseção aqui no
              dia em que ela existir.
            </p>
          </div>
        </section>

        {/* ═══ Quilombola × mancha de barragem ═════════════════════════════ */}
        <section id="quilombola-mancha" className="mt-12 scroll-mt-6">
          <h2 className="font-display text-xl font-semibold">
            Território quilombola atingido por mancha de barragem
          </h2>
          {quilombolaMancha.vazio ? (
            <div className="mt-3 rounded-2xl border border-border bg-surface p-5">
              <p className="text-2xl font-bold font-tabular text-text">Zero</p>
              <p className="mt-1 text-sm text-text-soft">
                interseções entre os {formatNumberBR(quilombolaMancha.qtdTerritorios)} territórios
                quilombolas publicados e as{" "}
                {formatNumberBR(quilombolaMancha.qtdBarragensComManchaPublicada)} manchas de
                inundação de barragem — varredura completa de{" "}
                <strong className="text-text">
                  {formatNumberBR(quilombolaMancha.universoCombinacoes)} combinações
                </strong>
                .
              </p>
              <p className="mt-3 text-sm text-text-soft">
                Mesma ressalva da seção acima sobre a cobertura da mancha da FEAM: ausência de
                mancha publicada não é ausência de risco — é ausência de dado publicado.
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-border bg-surface p-5">
              <p className="text-2xl font-bold font-tabular text-text">
                {formatNumberBR(quilombolaMancha.qtdFeaturesEncontradas)}
              </p>
              <p className="mt-1 text-sm text-text-soft">
                interseções de geometria entre os{" "}
                {formatNumberBR(quilombolaMancha.qtdTerritorios)} territórios quilombolas
                publicados e as{" "}
                {formatNumberBR(quilombolaMancha.qtdBarragensComManchaPublicada)} manchas de
                inundação de barragem — varredura completa de{" "}
                <strong className="text-text">
                  {formatNumberBR(quilombolaMancha.universoCombinacoes)} combinações
                </strong>
                , em {formatNumberBR(quilombolaMancha.qtdTerritoriosAtingidos)} territórios
                distintos, somando {haFmt(quilombolaMancha.areaTotalHa)} ha.
              </p>
              <p className="mt-3 text-sm text-text-soft">
                Estes alertas existem no dado desde que a varredura passou a cruzar a camada
                oficial de territórios quilombolas do INCRA (13/08/2026) — antes, uma das três
                camadas de território nunca era cruzada com nada, e os alertas ficavam
                invisíveis. Todos os territórios estão com <strong className="text-text">RTID
                publicado, em titulação</strong>: reconhecidos pelo INCRA e ainda sem título
                definitivo.
              </p>
            </div>
          )}
          {!quilombolaMancha.vazio && (
            <ul className="mt-4 flex flex-col gap-3">
              {quilombolaMancha.itens.map((item, i) => (
                <ItemQuilombolaMancha key={`${item.territorioNome}-${item.barragem}-${i}`} item={item} />
              ))}
            </ul>
          )}
          {!quilombolaMancha.vazio && (
            <p className="mt-4 max-w-[62ch] text-xs text-text-soft">
              Vale a ressalva da seção de terra indígena: a FEAM publica mancha de inundação só
              para as barragens acima — 156 das 259 do inventário dela. Se uma barragem sem
              mancha publicada ganhar o estudo, ou um novo estudo de ruptura mudar o alcance,
              esta lista pode crescer.
            </p>
          )}
        </section>

        {/* ═══ Normas em área protegida ════════════════════════════════════ */}
        <section id="area-protegida" className="mt-12 scroll-mt-6">
          <h2 className="font-display text-xl font-semibold">
            Normas municipais que mexem em área protegida
          </h2>
          <p className="mt-1 max-w-[62ch] text-sm text-text-soft">
            {formatNumberBR(atos.totalNormas)} normas, em {formatNumberBR(atos.municipios.length)}{" "}
            municípios, que criam ou alteram uma área protegida — leitura da ementa completa
            feita à mão, não classificação automática. {atos.coberturaTexto || "Cobertura declarada no próprio dado."}
          </p>
          <div className="mt-4 flex flex-col gap-6">
            {atos.municipios.map((m) => (
              <div key={m.geocodigo} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-text">{m.nome}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-soft">
                      {m.totalCria > 0 && `${m.totalCria} cria`}
                      {m.totalCria > 0 && m.totalAlteraArea > 0 && " · "}
                      {m.totalAlteraArea > 0 && `${m.totalAlteraArea} altera área`}
                      {(m.totalCria > 0 || m.totalAlteraArea > 0) && m.totalProcessoAndamento > 0 && " · "}
                      {m.totalProcessoAndamento > 0 && `${m.totalProcessoAndamento} processo em andamento`}
                    </span>
                    <AlvoMapaLink alvo={m.mapa} texto="Ver contorno no mapa" />
                  </div>
                </div>
                <ul className="mt-3 flex flex-col gap-3">
                  {m.normas.map((n, i) => (
                    <li key={i} className="border-t border-border/60 pt-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-text">
                          {n.tipo} nº {n.numero}
                        </p>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[.75em] font-semibold text-primary">
                          {n.categoriaLabel}
                        </span>
                      </div>
                      {n.dataPublicacao && (
                        <p className="mt-0.5 text-xs text-text-soft">{formatDateBR(n.dataPublicacao)}</p>
                      )}
                      <p className="mt-1 text-text-soft">{n.ementa}</p>
                      <p className="mt-1 text-xs text-text-soft">{n.motivoClassificacao}</p>
                      <a
                        href={n.linkFonte}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
                      >
                        Ver a norma na fonte oficial ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-[62ch] text-xs text-text-soft">{atos.avisoTexto}</p>
        </section>

        <section className="mt-14 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
          <h2 className="font-display text-base font-semibold text-text">
            O que esta página cobre — e o que não cobre
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Território × SIGMINE cobre as {formatNumberBR(operacao.itens.length + interesse.itens.length)}{" "}
              sobreposições calculadas por interseção de geometria real entre terra indígena,
              território quilombola e processo minerário em Minas Gerais inteira.
            </li>
            <li>
              TI/quilombola × mancha de barragem cobre só as barragens com mancha de inundação
              publicada pela FEAM — não o inventário completo de barragens do estado.
            </li>
            <li>
              Normas em área protegida cobrem só os municípios com legislação já coletada neste
              portal — ausência de um município aqui não significa ausência de norma sobre área
              protegida lá, significa que a legislação dele ainda não foi coletada.
            </li>
            <li>
              Nenhum alerta desta página afirma irregularidade. Lavra autorizada sobre terra
              indígena ou território quilombola pode ter processo de licenciamento e consulta
              prévia em dia — o alerta aponta ONDE conferir, a conclusão depende de quem verificar
              o processo na fonte.
            </li>
          </ul>
        </section>

        <footer className="mt-16 border-t border-border pt-8 text-sm">
          <FooterGlobal />
        </footer>
      </main>
    </>
  );
}
