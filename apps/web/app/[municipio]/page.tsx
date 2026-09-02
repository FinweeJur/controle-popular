import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import OutrasFrentes from "@/app/components/OutrasFrentes";
import PainelDialogo from "@/app/components/PainelDialogo";
import FotoBrasilComS from "@/app/components/FotoBrasilComS";
import CenasDoBrasil from "@/app/components/CenasDoBrasil";
import DataCard from "@/app/[municipio]/components/DataCard";
import RankingVereadores from "@/app/[municipio]/components/charts/RankingVereadores";
import IndiceRiscoDireitosCard from "@/app/[municipio]/components/IndiceRiscoDireitosCard";
import { climaDaCidade, contatosUteis, listarIndicadores, resumoContratosAtivos } from "@/lib/db/queries/betim";
import { indicadoresRiscoDireitos } from "@/lib/db/queries/risco-direitos";
import {
  rotuloLegislatura,
  temFonte,
  type Cidade,
  type IdMunicipio,
} from "@/lib/db/queries/municipios";
import Moeda from "@/app/components/Moeda";
import { formatNumberBR } from "@/lib/betim/format";
import { fetchAnunciosAtivos } from "@/lib/betim/anuncios";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import {
  getVereadores,
  getRankingVereadores,
  getAtividadeRecenteCamara,
  TIPO_PROPOSICAO_LABELS,
} from "@/lib/betim/vereadores";
import { getNoticias, CATEGORIA_LABELS } from "@/lib/betim/noticias";
import { getObrasParaopebaMenosConcluidas } from "@/lib/betim/paraopeba";
import {
  FONTE_OFICIAL,
  EXPLICACAO_INDICADOR,
  avisoDeDefasagem,
} from "@/lib/betim/fontesIndicadores";
import {
  Landmark,
  Users,
  MessageCircle,
  MapPin,
  Fuel,
  CloudSun,
  ShieldAlert,
  HeartPulse,
  GraduationCap,
  TrendingUp,
  Construction,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `${nomePortal(c)} — Portal independente de transparência de ${c.nome}-${c.uf}`,
  (c) => `Dados públicos sobre contratos, finanças, câmara e serviços de ${c.nome}-${c.uf}, reunidos em um só lugar. Portal independente, sem vínculo com a Prefeitura ou a Câmara.`
);

// Home indicator cards row (plan §3). Real values come from `indicadores`
// once the Base dos Dados ETL (F3) runs; until then each renders "em breve".
// First entry gets the large "bento" tile treatment.
// Nomes precisam bater exatamente com `indicadores.nome` gravado pelo ETL
// (etl/bd/ibge.py, inep.py, snis.py, trabalho.py) -- achado real 2026-07-23:
// "ideb"/"saneamento"/"empregos_formais" nunca existiram com esses nomes
// (o dado real já estava no banco como ideb_anos_finais/cobertura_esgoto/
// saldo_empregos_caged, usado em /educacao, /infraestrutura, /economia),
// então esses 3 cards ficavam presos em "em breve" por um mismatch de
// chave, não por falta de dado. "pobreza"/"frota_veiculos"/"idh" continuam
// sem fonte confirmada -- ver TODO.md.
const INDICATOR_LABELS: { nome: string; label: string; unidade_curta?: string }[] = [
  { nome: "populacao", label: "População", unidade_curta: "habitantes" },  // rótulo ganha a cidade no uso
  { nome: "pib_per_capita", label: "PIB per capita" },
  { nome: "ideb_anos_finais", label: "IDEB (anos finais)" },
  { nome: "cobertura_esgoto", label: "Cobertura de esgoto" },
  { nome: "salario_medio", label: "Salário médio" },
  { nome: "saldo_empregos_caged", label: "Saldo de empregos (CAGED)" },
  { nome: "pobreza", label: "Taxa de pobreza" },
  { nome: "frota_veiculos", label: "Frota de veículos" },
  { nome: "idh", label: "IDH" },
];

/** Ano do BUILD, não do acesso — a página é estática, então é este o momento
 *  em que "há quantos anos" pode ser calculado. O site é reconstruído todo
 *  dia, então o número nunca fica mais de um dia velho. */
const ANO_ATUAL = new Date().getFullYear();

const WEATHER_LABELS: Record<number, string> = {
  0: "Céu limpo",
  1: "Poucas nuvens",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Neblina",
  48: "Neblina",
  51: "Garoa fraca",
  53: "Garoa",
  55: "Garoa forte",
  61: "Chuva fraca",
  63: "Chuva",
  65: "Chuva forte",
  80: "Pancadas de chuva",
  81: "Pancadas de chuva",
  82: "Pancadas fortes",
  95: "Trovoadas",
};

interface IndicadorRow {
  nome: string;
  valor: string | null;
  valor_numerico: number | null;
  ano_referencia: number | null;
  unidade: string | null;
  /** Identificador do conjunto na origem (`br_inep_ideb`), traduzido para
   *  nome e endereço por `lib/betim/fontesIndicadores.ts`. */
  fonte: string | null;
}

interface ClimaAtual {
  atual: { temperature: number; weathercode: number } | null;
  diario: { temperature_2m_max: number[]; temperature_2m_min: number[] } | null;
}

/**
 * A primeira linha de cada indicador na ordem `ano_referencia desc` é a
 * mais recente — a consulta traz a série inteira e o `if (!map[nome])`
 * fica com a primeira de cada nome.
 */
async function getIndicadores(
  idMunicipio: IdMunicipio
): Promise<Record<string, IndicadorRow>> {
  try {
    const data = await listarIndicadores(
      idMunicipio,
      INDICATOR_LABELS.map((i) => i.nome)
    );
    if (!data) return {};

    const map: Record<string, IndicadorRow> = {};
    for (const row of data as IndicadorRow[]) {
      if (!map[row.nome]) map[row.nome] = row;
    }
    return map;
  } catch {
    return {};
  }
}

async function getContratosAtivosSummary(
  idMunicipio: IdMunicipio
): Promise<{ count: number; sum: number } | null> {
  try {
    // Era `select valor_global` de todos os contratos ativos com
    // `count: "exact"`, e a soma no JS; agora COUNT e SUM saem do banco.
    const r = await resumoContratosAtivos(idMunicipio);
    if (!r) return null;
    return { count: r.qtd, sum: r.soma };
  } catch {
    return null;
  }
}

interface ContatoUtil {
  nome: string;
  telefone: string | null;
  categoria: string | null;
}

async function getContatosUteis(idMunicipio: IdMunicipio): Promise<ContatoUtil[]> {
  try {
    const data = await contatosUteis(idMunicipio);
    return (data ?? []) as ContatoUtil[];
  } catch {
    return [];
  }
}

async function getClima(idMunicipio: IdMunicipio): Promise<ClimaAtual | null> {
  try {
    return ((await climaDaCidade(idMunicipio)) as ClimaAtual) ?? null;
  } catch {
    return null;
  }
}

/** `fonte` filtra o card pelas chaves de `municipios.fontes` — mesma regra
 * de `/servicos`: item que aponta para uma página que a cidade não tem não
 * entra no menu. */
const explorar = (
  cidade: Cidade
): { href: string; nome: string; desc: string; icon: LucideIcon; fonte?: string }[] => [
  // Sprint 5 do plano de revisão de dados — o resumo em uma tela.
  { href: "/painel-do-cidadao", nome: "Painel do cidadão", desc: "Dinheiro público, território e leis em uma tela", icon: LayoutDashboard },
  { href: "/prefeitura", nome: "Prefeitura", desc: "Contratos, despesas e fornecedores", icon: Landmark },
  { href: "/camara", nome: "Câmara Municipal", desc: "Vereadores e verbas indenizatórias", icon: Users },
  { href: "/zap", nome: `Zap ${cidade.nome}`, desc: "Cadastro de negócios no WhatsApp", icon: MessageCircle },
  { href: "/citrolandia", nome: "Citrolândia", desc: "Bairros da região e negócios locais", icon: MapPin, fonte: "citrolandia" },
  { href: "/postos-combustivel", nome: "Postos de Combustível", desc: "Nota de conformidade ANP", icon: Fuel },
  { href: "/clima", nome: "Clima", desc: "Previsão e chuva acumulada", icon: CloudSun },
  { href: "/defesa-civil", nome: "Defesa Civil", desc: "Alertas de emergência", icon: ShieldAlert },
];

const ATALHOS_EM_DADOS: { href: string; nome: string; icon: LucideIcon }[] = [
  { href: "/saude", nome: "Saúde", icon: HeartPulse },
  { href: "/educacao", nome: "Educação", icon: GraduationCap },
  { href: "/economia", nome: "Economia", icon: TrendingUp },
  { href: "/infraestrutura", nome: "Infraestrutura", icon: Construction },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const [
    indicadores,
    contratosSummary,
    contatos,
    clima,
    anuncios,
    vereadores,
    ranking,
    atividadeRecente,
    noticias,
    obrasParaopeba,
    riscoDireitos,
  ] = await Promise.all([
    getIndicadores(cidade.id_municipio),
    getContratosAtivosSummary(cidade.id_municipio),
    getContatosUteis(cidade.id_municipio),
    getClima(cidade.id_municipio),
    fetchAnunciosAtivos(cidade.id_municipio),
    getVereadores(cidade.id_municipio),
    getRankingVereadores(cidade.id_municipio),
    getAtividadeRecenteCamara(cidade.id_municipio),
    getNoticias(cidade.id_municipio),
    getObrasParaopebaMenosConcluidas(cidade.id_municipio, 5),
    indicadoresRiscoDireitos(cidade.id_municipio, cidade),
  ]);
  const anuncioAtivo = anuncios[0] ?? null;
  const topRanking = ranking.rows.slice(0, 6);
  const ultimasNoticias = noticias.rows.slice(0, 3);

  // O card do índice só existe com dado real em pelo menos uma dimensão —
  // lacuna é informação, e um "Risco Baixo 12/100" sem dado seria número
  // fabricado (régua editorial do AGENTS.md).
  const temDadoRisco =
    riscoDireitos !== null &&
    (riscoDireitos.cobertura.saudeVida ||
      riscoDireitos.cobertura.socioambientalClima ||
      riscoDireitos.cobertura.integridadeErario ||
      riscoDireitos.cobertura.opacidadePolitica);

  const populacao = indicadores["populacao"];
  const outrosIndicadores = INDICATOR_LABELS.slice(1);

  return (
    <div>
      {/* HERO */}
      <section
        className="border-b border-border px-4 py-14 sm:px-8 sm:py-20"
        style={{
          background:
            "radial-gradient(1100px 480px at 12% -12%, color-mix(in srgb, var(--color-primary) 16%, transparent), transparent), radial-gradient(820px 460px at 102% -6%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent)",
        }}
      >
        <div className="mx-auto grid max-w-5xl gap-9 lg:grid-cols-[1.7fr_1fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-[.88em] font-semibold text-accent">
              iniciativa cidadã independente
            </span>
            <h1 className="mt-4 max-w-[15ch] font-display text-[clamp(2.2em,5.5vw,3.6em)] leading-[1.05] font-bold tracking-tight text-text text-balance">
              Transparência pública de <span className="text-primary">{cidade.nome}, {cidade.uf}</span>
            </h1>
            <p className="mt-4 max-w-[52ch] text-[1.1em] text-text-soft text-pretty">
              Contratos, números e serviços de {cidade.nome} num lugar só. Cada dado
              vem de fonte oficial, com link pra você conferir.
            </p>
            <form
              action="/prefeitura/contratos"
              method="GET"
              className="mt-6 flex max-w-[520px] gap-2"
            >
              <input
                type="search"
                name="q"
                placeholder="Buscar contratos, fornecedores…"
                aria-label="Busca pública"
                className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-3.5 text-text"
              />
              <button
                type="submit"
                className="cursor-pointer rounded-xl border border-primary bg-primary px-6 py-3.5 font-semibold text-primary-ink"
              >
                Buscar
              </button>
            </form>
          </div>

          {clima?.atual ? (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[.85em] font-semibold tracking-wide text-text-soft">
                  {/* Escapou da varredura de strings "Betim" porque estava em
                      CAIXA ALTA — um grep por "Betim" não encontra "BETIM". O
                      card mostrava a temperatura correta de Belo Horizonte sob
                      o rótulo "BETIM · AGORA". */}
                  {cidade.nome.toLocaleUpperCase("pt-BR")} · AGORA
                </span>
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              </div>
              <div className="mt-2 font-tabular text-[3.2em] leading-none font-semibold">
                {Math.round(clima.atual.temperature)}°
              </div>
              <div className="text-[.9em] text-text-soft">
                {WEATHER_LABELS[clima.atual.weathercode] ?? "—"}
              </div>
              {clima.diario ? (
                <div className="mt-3.5 flex gap-4 border-t border-border pt-3.5 font-tabular text-[.92em]">
                  <span>
                    mín <strong>{Math.round(clima.diario.temperature_2m_min[0])}°</strong>
                  </span>
                  <span>
                    máx <strong>{Math.round(clima.diario.temperature_2m_max[0])}°</strong>
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Foto do acervo Brasil com S (Lab 678), com crédito na legenda
              — ver `FotoBrasilComS.tsx`. Sem corte, por termos do acervo. */}
          <FotoBrasilComS
            id="00039"
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
          />
        </div>
      </section>

      {/* NOTA DE TRANSPARÊNCIA */}
      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        <div
          role="note"
          className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border border-l-4 border-l-primary bg-primary/5 px-5 py-3.5"
        >
          <strong className="text-[.92em]">Nota de transparência</strong>
          <span className="text-[.9em] text-text-soft">
            Os dados vêm de fontes oficiais e são atualizados de tempos em
            tempos. Este site não tem vínculo com a Prefeitura nem com a Câmara.
          </span>
        </div>
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-14 sm:px-8">
        {/* DIÁLOGO ENTRE FRENTES (Painéis-sanfona) */}
        <PainelDialogo
          origemRota={`/${cidade.slug}`}
          origemTitulo={cidade.nome}
          abertoInicialmente={cidade.slug === "diamantina"}
        />

        {/* INDICADORES (bento) */}
        <section>
          <h2 className="mb-5 font-display text-[1.7em] font-semibold tracking-tight">
            A cidade em números
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2 row-span-2 flex min-h-[200px] flex-col justify-between rounded-2xl bg-primary p-6 text-primary-ink">
              <span className="text-[.9em] font-medium opacity-85">
                {INDICATOR_LABELS[0].label} de {cidade.nome}
              </span>
              <div>
                {populacao ? (
                  <>
                    <div className="font-tabular text-[3em] leading-none font-semibold">
                      {populacao.valor_numerico !== null
                        ? formatNumberBR(populacao.valor_numerico)
                        : (populacao.valor ?? "—")}
                    </div>
                    <div className="mt-2 text-[.9em] opacity-90">
                      {INDICATOR_LABELS[0].unidade_curta}
                      {populacao.ano_referencia ? ` · ${populacao.ano_referencia}` : ""}
                    </div>
                  </>
                ) : (
                  <div className="text-[.9em] font-medium opacity-80">em breve</div>
                )}
              </div>
            </div>
            {outrosIndicadores.map(({ nome, label }) => {
              const row = indicadores[nome];
              return (
                <div
                  key={nome}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
                >
                  <span className="text-[.82em] text-text-soft">{label}</span>
                  {row ? (
                    <>
                      <div className="mt-1.5 font-tabular text-[1.6em] leading-none font-semibold">
                        {row.valor_numerico !== null ? (
                          row.unidade === "R$" ? (
                            <Moeda value={row.valor_numerico} />
                          ) : row.unidade === "pontos" ? (
                            // IDEB é uma nota com casa decimal significativa
                            // (4,9 != 5) -- arredondar pro inteiro mais
                            // próximo perderia a diferença real entre anos.
                            <>
                              {row.valor_numerico.toFixed(1).replace(".", ",")}
                              <span className="ml-1 text-xs font-normal">{row.unidade}</span>
                            </>
                          ) : nome === "idh" ? (
                            // IDH é um índice 0-1 com 3 casas decimais
                            // significativas (convenção do próprio PNUD) --
                            // Math.round jogaria 0,749 pra "1".
                            row.valor_numerico.toFixed(3).replace(".", ",")
                          ) : (
                            <>
                              {formatNumberBR(Math.round(row.valor_numerico))}
                              {row.unidade && nome !== "saldo_empregos_caged" ? (
                                // "vagas" no banco é o rótulo genérico do
                                // ETL, mas soa como "vaga de emprego aberta
                                // pra se candidatar" -- o número real é o
                                // SALDO líquido do CAGED (admissões menos
                                // demissões), sinal bem diferente. Omitido
                                // aqui pra não confundir; o rótulo do card
                                // já deixa "(CAGED)" e "Saldo" explícitos.
                                <span className="ml-1 text-xs font-normal">{row.unidade}</span>
                              ) : null}
                            </>
                          )
                        ) : (
                          (row.valor ?? "—")
                        )}
                      </div>
                      {row.ano_referencia ? (
                        <span className="mt-1 block text-[.85em] text-text-soft">
                          {row.ano_referencia}
                        </span>
                      ) : null}

                      {/* O que o número quer dizer, em uma frase.
                        * "IDEB (anos finais) — 3,8 pontos" não informa quem
                        * não sabe o que é IDEB nem qual é a escala. */}
                      {EXPLICACAO_INDICADOR[nome] ? (
                        <p className="mt-2 text-[.78em] leading-snug text-text-soft">
                          {EXPLICACAO_INDICADOR[nome]}
                        </p>
                      ) : null}

                      {/* Dado velho tem de se anunciar como velho: IDH e
                        * pobreza são do Censo de 2010 e ficavam lado a lado
                        * com números de 2025, sem distinção. */}
                      {avisoDeDefasagem(row.ano_referencia, ANO_ATUAL) ? (
                        <p className="mt-1 text-[.72em] leading-snug text-text-soft opacity-80">
                          {avisoDeDefasagem(row.ano_referencia, ANO_ATUAL)}
                        </p>
                      ) : null}

                      {/* O link que faltava. A frase no alto desta página
                        * promete "cada dado vem de fonte oficial, com link
                        * pra você conferir" — e nenhum destes nove cards
                        * tinha link nenhum (medido em produção, 2026-08-10). */}
                      {row.fonte && FONTE_OFICIAL[row.fonte] ? (
                        <a
                          href={FONTE_OFICIAL[row.fonte].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-[.75em] font-medium text-primary underline underline-offset-2"
                        >
                          {FONTE_OFICIAL[row.fonte].rotulo} ↗
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <div className="mt-1.5 text-[.9em] font-medium text-text-soft">em breve</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ÍNDICE DE RISCO A DIREITOS */}
        {temDadoRisco && riscoDireitos ? (
          <section>
            <IndiceRiscoDireitosCard
              indice={riscoDireitos.indice}
              cobertura={riscoDireitos.cobertura}
              municipioSlug={cidade.slug}
              municipioNome={cidade.nome}
            />
          </section>
        ) : null}

        {/* DOIS RESUMOS */}
        <section className="grid gap-5 sm:grid-cols-2">
          <DataCard
            title="Contratos ativos da Prefeitura"
            source={{ label: "PNCP", url: "https://pncp.gov.br/" }}
          >
            {contratosSummary ? (
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="font-tabular text-2xl font-bold text-text">
                    {formatNumberBR(contratosSummary.count)}
                  </p>
                  <p className="text-xs text-text-soft">contratos ativos</p>
                </div>
                <div>
                  <p className="font-tabular text-2xl font-bold text-text">
                    <Moeda value={contratosSummary.sum} />
                  </p>
                  <p className="text-xs text-text-soft">valor global somado</p>
                </div>
              </div>
            ) : (
              <p>Nenhum dado ainda — em breve.</p>
            )}
            <Link
              href="/prefeitura/contratos"
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Ver todos os contratos →
            </Link>
          </DataCard>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-base font-semibold">Câmara Municipal</h3>
            </div>
            {vereadores.ok && vereadores.rows.length > 0 ? (
              <p className="mt-3 text-sm text-text-soft">
                <strong className="font-tabular text-text">{vereadores.rows.length}</strong>{" "}
                vereadores da {rotuloLegislatura(cidade)}, com proposições,
                votos e verbas indenizatórias.
              </p>
            ) : (
              <p className="mt-3 text-sm text-text-soft">Nenhum dado ainda — em breve.</p>
            )}
            <Link
              href="/camara"
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Ver a Câmara →
            </Link>
          </div>
        </section>

        {/* ATIVIDADE RECENTE DA CÂMARA */}
        {atividadeRecente.ok &&
        (atividadeRecente.ultimoProjeto ||
          atividadeRecente.ultimoAprovado ||
          atividadeRecente.ultimoRequerimento) ? (
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-[1.7em] font-semibold tracking-tight">
                Atividade recente da Câmara
              </h2>
              <Link
                href="/camara/proposicoes"
                className="text-sm font-medium text-accent hover:underline"
              >
                Ver todas as proposições →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Último projeto", item: atividadeRecente.ultimoProjeto },
                { label: "Último aprovado", item: atividadeRecente.ultimoAprovado },
                { label: "Último requerimento", item: atividadeRecente.ultimoRequerimento },
              ].map(({ label, item }) => {
                const conteudo = (
                  <>
                    <span className="text-[.85em] font-semibold tracking-wide text-text-soft uppercase">
                      {label}
                    </span>
                    {item ? (
                      <>
                        <p className="mt-1.5 font-display font-semibold text-text">
                          {TIPO_PROPOSICAO_LABELS[item.tipo] ?? item.tipo} nº {item.numero}/{item.ano}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-text-soft">{item.ementa ?? "—"}</p>
                        {item.link_fonte ? (
                          <span className="mt-2 block text-xs font-medium text-accent">
                            Ver fonte oficial ↗
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <p className="mt-1.5 text-sm text-text-soft">—</p>
                    )}
                  </>
                );
                return item?.link_fonte ? (
                  <a
                    key={label}
                    href={item.link_fonte}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent"
                  >
                    {conteudo}
                  </a>
                ) : (
                  <div key={label} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                    {conteudo}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* RANKING DE ATUAÇÃO POR VEREADOR */}
        {topRanking.length > 0 && topRanking.some((r) => r.pontuacao > 0) ? (
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-[1.7em] font-semibold tracking-tight">
                Ranking de atuação por vereador
              </h2>
              <Link href="/camara#ranking" className="text-sm font-medium text-accent hover:underline">
                Ver ranking completo →
              </Link>
            </div>
            <p className="mb-4 max-w-2xl text-xs text-text-soft">
              Cada faixa da barra mostra quanto aquele tipo de proposta
              rendeu de pontos. Quanto mais escura, mais o tipo pesa. A
              conta aparece embaixo da barra.
            </p>
            <RankingVereadores rows={topRanking} />
          </section>
        ) : null}

        {/* BETIM EM DADOS */}
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-[1.7em] font-semibold tracking-tight">
              {cidade.nome} em Dados
            </h2>
            <Link href="/dados" className="text-sm font-medium text-accent hover:underline">
              Ver todos os temas →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ATALHOS_EM_DADOS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="cp-card-hover flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-5 text-center shadow-sm hover:border-primary"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon size={20} strokeWidth={2} aria-hidden="true" />
                </span>
                <p className="font-display text-sm font-semibold text-text">{item.nome}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* PARAOPEBA — OBRAS MAIS LONGE DE CONCLUIR */}
        {obrasParaopeba.length > 0 && (
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-[1.7em] font-semibold tracking-tight">
                Reparação do Paraopeba — obras mais longe de concluir
              </h2>
              <Link
                href="/meio-ambiente/paraopeba"
                className="text-sm font-medium text-accent hover:underline"
              >
                Ver todos os projetos →
              </Link>
            </div>
            <p className="mb-4 max-w-2xl text-xs text-text-soft">
              Obras da reparação de Brumadinho em {cidade.nome} que menos andaram até
              agora. O número mostra quanto de cada obra já ficou pronta,
              segundo a FGV, que fiscaliza de forma independente.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {obrasParaopeba.map((o) => {
                const exec = o.percentualRealizado ?? 0;
                const atrasada =
                  o.percentualPlanejado != null && exec < o.percentualPlanejado - 1;
                return (
                  <li key={o.idFdi}>
                    <Link
                      href="/meio-ambiente/paraopeba"
                      className="cp-card-hover flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
                    >
                      <p className="line-clamp-2 font-display text-sm font-semibold text-text">
                        {o.titulo}
                      </p>
                      <div className="mt-auto pt-3">
                        <div className="mb-1 flex items-baseline justify-between text-xs">
                          <span className="font-tabular font-semibold text-text">
                            {exec.toFixed(0)}% executado
                          </span>
                          {o.percentualPlanejado != null && (
                            <span className={atrasada ? "text-alert" : "text-text-soft"}>
                              planejado {o.percentualPlanejado.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(Math.max(exec, 2), 100)}%` }}
                          />
                        </div>
                        {o.areaTematica && (
                          <p className="mt-2 text-[.75em] text-text-soft">{o.areaTematica}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* NOTÍCIAS */}
        {ultimasNoticias.length > 0 && (
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-[1.7em] font-semibold tracking-tight">
                Notícias
              </h2>
              <Link href="/noticias" className="text-sm font-medium text-accent hover:underline">
                Ver todas →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {ultimasNoticias.map((n) => (
                <Link
                  key={n.slug}
                  href={`/noticias/${n.slug}`}
                  className="cp-card-hover rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
                >
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[.85em] font-semibold tracking-wide text-primary uppercase">
                    {CATEGORIA_LABELS[n.categoria] ?? n.categoria}
                  </span>
                  <p className="mt-2 font-display font-semibold text-text">{n.titulo}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-text-soft">{n.resumo}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* EXPLORE O PORTAL */}
        <section>
          <h2 className="mb-5 font-display text-[1.7em] font-semibold tracking-tight">
            Explore o portal
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {explorar(cidade)
              .filter((item) => !item.fonte || temFonte(cidade, item.fonte))
              .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="cp-card-hover flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon size={20} strokeWidth={2} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display font-semibold text-text">{item.nome}</p>
                  <p className="mt-1 text-sm text-text-soft">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CONTATOS ÚTEIS */}
        <section>
          <h2 className="mb-5 font-display text-[1.7em] font-semibold tracking-tight">
            Contatos úteis
          </h2>
          {contatos.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {contatos.map((c) => (
                <div
                  key={c.nome}
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
                >
                  <span className="font-medium text-text">{c.nome}</span>
                  {c.telefone ? (
                    <span className="ml-2 font-tabular text-text-soft">{c.telefone}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-soft">Nenhum dado ainda — em breve.</p>
          )}
        </section>

        {/* ANÚNCIO LOCAL */}
        {anuncioAtivo ? (
          <a
            href={anuncioAtivo.link ?? "/anuncie"}
            target={anuncioAtivo.link ? "_blank" : undefined}
            rel={anuncioAtivo.link ? "noopener noreferrer" : undefined}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary bg-surface-2 px-7 py-6"
          >
            <div>
              <span className="text-[.85em] font-semibold tracking-wide text-text-soft uppercase">
                Publicidade
              </span>
              <p className="mt-1.5 text-[1.05em] font-semibold">
                {anuncioAtivo.nome_comercio}
              </p>
            </div>
            {anuncioAtivo.banner_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={anuncioAtivo.banner_url}
                alt={anuncioAtivo.nome_comercio}
                className="max-h-16 rounded-lg"
              />
            ) : null}
          </a>
        ) : (
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-surface-2 px-7 py-6">
            <div>
              <span className="text-[.85em] font-semibold tracking-wide text-text-soft uppercase">
                Espaço publicitário
              </span>
              <p className="mt-1.5 text-[1.05em] font-semibold">
                Seu negócio de {cidade.nome} aqui — a partir de{" "}
                <span className="font-tabular">R$ 200</span>, pagamento único.
              </p>
            </div>
            <Link
              href="/anuncie"
              className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-3 text-sm font-semibold text-primary-ink"
            >
              Anuncie aqui
            </Link>
          </section>
        )}

        {/* SOBRE TEASER */}
        <section className="rounded-2xl border border-border bg-surface-2 p-6">
          <h2 className="mb-2 font-display text-lg font-semibold">Sobre o projeto</h2>
          <p className="mb-3 max-w-2xl text-sm text-text-soft">
            O {nomePortal(cidade)} é um projeto independente. Ele reúne,
            num lugar só, dados públicos oficiais sobre {cidade.nome}. Não temos
            vínculo com a Prefeitura nem com a Câmara.
          </p>
          <Link href="/sobre" className="text-sm font-medium text-accent hover:underline">
            Conheça o projeto →
          </Link>
        </section>

        <OutrasFrentes atual="cidades" />

        {/* Faixa decorativa com crédito — ver `CenasDoBrasil.tsx`. */}
        <CenasDoBrasil fotos={["00253", "00254", "00293", "00325"]} />
      </main>
    </div>
  );
}
