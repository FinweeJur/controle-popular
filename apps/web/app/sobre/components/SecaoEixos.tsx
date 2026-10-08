/**
 * SecaoEixos — seção "Os 4 Grandes Eixos e as subfrentes" da página /sobre,
 * incluindo o termo de uso de IA, a lista de cidades e as tabelas de volume.
 *
 * Extraída do `SobrePage` em 08/10/2026 (hotspots CodeScene, saúde 7,26).
 * Recebe `cidades` e `stats` como props — o dado continua vindo do banco
 * via `listarCidades()` e `obterEstatisticasPortal()` no servidor.
 */
import NextLink from "next/link";
import { CATALOGO_EIXOS } from "@/lib/eixos/catalogo";
import { formatNumberBR } from "@/lib/betim/format";
import type { EstatisticasPortal } from "@/lib/betim/estatisticas-portal";

interface Props {
  cidades: { nome: string; uf: string }[];
  stats: EstatisticasPortal | null;
}

export function SecaoEixos({ cidades, stats }: Props) {
  const nomesCidades = cidades.map((c) => `${c.nome}-${c.uf}`).join(", ");
  const N = formatNumberBR;

  return (
    <section className="space-y-5">
      <h2 className="font-display text-2xl font-semibold">
        Os 4 Grandes Eixos e as subfrentes
      </h2>
      <p className="text-text-soft">
        O portal se organiza em <strong className="text-text">quatro grandes eixos
        temáticos</strong> e mais de <strong className="text-text">36 subfrentes</strong>.
        Cada subfrente é uma porta de entrada para dado concreto — clique para abrir. A
        lista canônica vive em{" "}
        <code className="font-mono text-[.85em]">lib/eixos/catalogo.ts</code>.
      </p>

      <div className="space-y-6">
        {Object.values(CATALOGO_EIXOS).map((eixo) => (
          <div key={eixo.id}>
            <h3 className="font-display text-lg font-semibold">{eixo.titulo}</h3>
            <p className="text-[.9em] text-text-soft">{eixo.subtitulo}</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {eixo.subfrentes.map((sub) => {
                const href =
                  sub.rotaLegada ??
                  (eixo.id === "terra"
                    ? `/terra-e-territorios/${sub.slug}`
                    : eixo.id === "estado"
                      ? `/estado-e-economia/${sub.slug}`
                      : eixo.id === "central"
                        ? `/central/${sub.slug}`
                        : `/direitos-em-movimento/${sub.slug}`);
                return (
                  <a
                    key={sub.id}
                    href={href}
                    className="group rounded-lg border border-border bg-surface p-3 transition-colors hover:border-primary"
                  >
                    <span className="font-display text-[.95em] font-semibold group-hover:text-primary">
                      {sub.titulo}
                    </span>
                    <span className="block text-[.82em] text-text-soft">
                      {sub.descricao}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ TERMO DE USO DE IA — unificado logo após os links das subfrentes ═══ */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-lg font-semibold">
          Termo de uso de Inteligência Artificial
        </h3>
        <p className="mt-1 text-[.95em] text-text-soft">
          O portal usa IA para <strong className="text-text">ler texto</strong> e extrair
          campos — nunca para escrever número nem opinar. A política completa, com onde a
          IA entra e onde ela não entra, está em{" "}
          <NextLink href="/politica-de-ia" className="text-primary hover:text-accent">
            /politica-de-ia
          </NextLink>
          .
        </p>
      </div>

      <p className="text-[.9em] text-text-soft">
        {cidades.length} cidades estão publicadas hoje: <strong className="text-text">{nomesCidades}</strong>.
        A cobertura varia muito entre elas — a seção &ldquo;O que ainda falta&rdquo;, mais
        abaixo, mostra a diferença em vez de escondê-la.
      </p>

      {stats && (
        <div className="space-y-6 text-[.88em]">
          <p className="text-text-soft">
            Volume publicado, medido no banco do portal no momento em que esta página foi
            gerada:
          </p>

          <TabelaVolume
            titulo="Municipal (seis cidades)"
            linhas={[
              ["Contratos", stats.municipal.contratos],
              ["Licitações", stats.municipal.licitacoes],
              ["Atos oficiais (leis, decretos, portarias)", stats.municipal.atosOficiais],
              ["Proposições de câmaras municipais", stats.municipal.proposicoes],
              ["Vínculos de servidores", stats.municipal.servidores],
              ["Vereadores", stats.municipal.vereadores],
              ["Escolas", stats.municipal.escolas],
              ["Estabelecimentos de saúde", stats.municipal.saudeEstabelecimentos],
              ["Obras", stats.municipal.obras],
              ["Contratos com alerta de risco", stats.municipal.contratosComAlerta],
            ]}
          />

          <TabelaVolume
            titulo="Congresso Nacional"
            linhas={[
              ["Proposições", stats.congresso.proposicoes],
              ["Parlamentares", stats.congresso.parlamentares],
              ["Bancadas e frentes parlamentares", stats.congresso.bancadas],
              ["Vínculos de parlamentar com bancada", stats.congresso.bancadaMembros],
              ["Comissões e demais órgãos", stats.congresso.orgaos],
              ["Votações nominais", stats.congresso.votacoes],
            ]}
          />

          <TabelaVolume
            titulo="Judiciário"
            linhas={[
              ["Tribunais", stats.judiciario.tribunais],
              ["Magistrados cadastrados", stats.judiciario.magistrados],
              [
                "Destes, com data de nascimento levantada",
                stats.judiciario.magistradosComNascimento,
              ],
              ["Indicações registradas", stats.judiciario.indicacoes],
              ["Cadeiras com ocupação registrada", stats.judiciario.ocupacoes],
            ]}
          />
          <p className="text-[.85em] text-text-soft">
            A data de aposentadoria compulsória só é calculável para os{" "}
            {N(stats.judiciario.magistradosComNascimento)} magistrados com data de
            nascimento levantada, de {N(stats.judiciario.magistrados)} cadastrados — o
            restante é curadoria manual em andamento.
          </p>

          <TabelaVolume
            titulo="Ambiental (Minas Gerais)"
            linhas={[
              ["Licenças ambientais", stats.ambiental.licencas],
              ["Normas ambientais (ALMG, SEMAD, SIAM)", stats.ambiental.normas],
              [
                `Destas, com tema atribuído (${((stats.ambiental.normasComTema / stats.ambiental.normas) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`,
                stats.ambiental.normasComTema,
              ],
              ["Reuniões do COPAM", stats.ambiental.reunioesCopam],
              ["Itens de pauta", stats.ambiental.itensPauta],
              ["Barragens (FEAM)", stats.ambiental.barragensFeam],
              ["Barragens (SNISB)", stats.ambiental.barragensSnisb],
              ["Autos de infração estaduais (CAP/SEMAD)", stats.ambiental.autosEstaduais],
              ["Autos de infração federais (IBAMA)", stats.ambiental.autosFederais],
            ]}
          />
        </div>
      )}
    </section>
  );
}

/** Tabela de volume de dados — auxiliar local da seção de eixos. */
function TabelaVolume({
  titulo,
  linhas,
}: {
  titulo: string;
  linhas: [string, number][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left">
        <caption className="border-b border-border bg-surface-2 px-3 py-2 text-left font-semibold text-text">
          {titulo}
        </caption>
        <tbody>
          {linhas.map(([label, valor]) => (
            <tr key={label} className="border-t border-border first:border-t-0">
              <td className="px-3 py-1.5 text-text-soft">{label}</td>
              <td className="px-3 py-1.5 text-right font-mono text-text">
                {formatNumberBR(valor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
