import Link from "@/lib/betim/link";
import { MOTIVO_ALERTA_INFO } from "@/lib/betim/contratos";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

export const generateMetadata = metadataDaCidade(
  (c) => `Metodologia dos alertas de contrato — ${nomePortal(c)}`,
  (c) => `Como cada alerta de contrato é calculado, com a base legal ou jurisprudencial verificada — revisão feita contra TCU/TCE em 2026-07-23.`
);

const REGRAS_ORDENADAS = [
  "regra_2_dispensa_proxima_limite",
  "regra_3_aditivos_elevados",
  "regra_5_fornecedor_sancionado_ceis",
  "regra_7_situacao_cadastral_irregular",
  "regra_8_muitos_contratos_janela_curta",
  "regra_9_grupo_economico_contratos_relacionados",
  "regra_1_valor_atipico_para_categoria",
  "regra_4_capital_social_baixo",
];

export default async function MetodologiaPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const violacoes = REGRAS_ORDENADAS.filter(
    (codigo) => MOTIVO_ALERTA_INFO[codigo]?.categoria === "violacao_legal"
  );
  const heuristicas = REGRAS_ORDENADAS.filter(
    (codigo) => MOTIVO_ALERTA_INFO[codigo]?.categoria === "heuristica"
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/prefeitura/contratos" className="hover:text-primary">
          Contratos
        </Link>{" "}
        · <span className="text-text">Metodologia dos alertas</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Metodologia dos alertas de contrato
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Nenhum alerta neste site é uma acusação. Cada um vem de uma regra
        automática, aplicada igual a todo contrato — abaixo está o motivo
        exato e a base legal ou jurisprudencial de cada uma, revisada
        criticamente em 2026-07-23.
      </p>

      <section className="mt-8">
        <h2 className="mb-1 font-display text-lg font-bold text-text">
          ⚠ Risco de violação legal
        </h2>
        <p className="mb-4 text-sm text-text-soft">
          Estas regras têm dispositivo de lei ou jurisprudência consolidada
          por trás — se disparam, o contrato tem uma característica que, na
          letra da lei ou na prática dos Tribunais de Contas, é
          reconhecida como irregularidade ou risco de irregularidade.
        </p>
        <ul className="flex flex-col gap-4">
          {violacoes.map((codigo) => {
            const info = MOTIVO_ALERTA_INFO[codigo];
            return (
              <li key={codigo} className="rounded-2xl border border-alert/40 bg-alert/5 p-4">
                <p className="font-display font-semibold text-text">{info.label}</p>
                <p className="mt-1 text-sm text-text-soft">{info.fundamentacao}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-1 font-display text-lg font-bold text-text">
          · Sinal de atenção — heurística de investigação
        </h2>
        <p className="mb-4 text-sm text-text-soft">
          Estas regras <strong className="font-semibold text-text">não têm teto fixado em lei ou súmula</strong>.
          São sinais usados na prática por Tribunais de Contas, CGU e
          Ministério Público para decidir onde vale a pena olhar mais de
          perto — não constatam, por si só, irregularidade nenhuma.
        </p>
        <ul className="flex flex-col gap-4">
          {heuristicas.map((codigo) => {
            const info = MOTIVO_ALERTA_INFO[codigo];
            return (
              <li key={codigo} className="rounded-2xl border border-accent/40 bg-accent/5 p-4">
                <p className="font-display font-semibold text-text">{info.label}</p>
                <p className="mt-1 text-sm text-text-soft">{info.fundamentacao}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">
          O que fica de fora, por enquanto
        </h2>
        <p className="mt-2">
          <strong className="font-semibold text-text">Fornecedor sancionado no CEIS/CNEP</strong>{" "}
          agora é checado de verdade contra o Portal da Transparência. Uma
          ressalva importante ao ler esse alerta: nem toda sanção alcança
          qualquer município — algumas têm abrangência limitada à esfera de
          quem aplicou a sanção. O campo "Abrangência" aparece sempre junto
          do alerta na tela de contratos, exatamente pra permitir essa
          checagem.
        </p>
        <p className="mt-2">
          <strong className="font-semibold text-text">
            Mínimos constitucionais de saúde (15%) e educação (25%)
          </strong>{" "}
          são calculados corretamente (base de impostos e transferências
          constitucionais, gasto no estágio "Liquidado") — mas não
          aparecem como alerta público porque não há nada pra alertar:{" "}
          {cidade.nome} cumpre os dois mínimos com folga em todos os anos com
          dado (2015-2024), entre 38-54% em saúde e 37-60% em educação.
        </p>
      </section>

      <p className="mt-6 text-xs text-text-soft">
        Revisão completa, regra a regra, com as fontes verificadas:{" "}
        <a
          href="https://github.com/FinweeJur/betim-ai/blob/master/docs/alertas-contratos-revisao-juridica.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          docs/alertas-contratos-revisao-juridica.md ↗
        </a>
      </p>
    </div>
  );
}
