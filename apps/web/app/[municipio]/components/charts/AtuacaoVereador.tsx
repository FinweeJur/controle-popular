import { composicaoPontuacao, type RankingVereador } from "@/lib/betim/vereadores";
import { formatNumberBR } from "@/lib/betim/format";
import StackedPointsBar from "./StackedPointsBar";

const COR_POR_SLOT: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-2)",
  3: "var(--color-ord-3)",
  4: "var(--color-ord-4)",
};

export interface AtuacaoVereadorProps {
  /** Ranking completo — necessário pra posição e pra escala comparável. */
  ranking: RankingVereador[];
  vereadorId: string;
}

/**
 * A atuação de UM vereador, na escala da Câmara inteira: a barra é medida
 * contra o primeiro colocado, então dá pra ver a distância real em vez de
 * uma barra cheia que não diz nada. Volta `null` quando o vereador não
 * pontuou — melhor não mostrar gráfico do que mostrar um vazio.
 */
export default function AtuacaoVereador({ ranking, vereadorId }: AtuacaoVereadorProps) {
  const posicao = ranking.findIndex((r) => r.id === vereadorId);
  if (posicao === -1) return null;

  const vereador = ranking[posicao];
  if (vereador.pontuacao <= 0) return null;

  const max = ranking.reduce((m, r) => Math.max(m, r.pontuacao), 0);
  const segmentos = composicaoPontuacao(vereador.porTipo);
  const lider = ranking[0];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-text">
          <strong className="font-tabular text-text">{posicao + 1}º</strong> de{" "}
          <span className="font-tabular">{formatNumberBR(ranking.length)}</span> vereadores
        </p>
        <p className="font-tabular text-sm text-text">
          {formatNumberBR(vereador.pontuacao)}
          <span className="ml-1 text-xs font-normal text-text-soft">pontos</span>
        </p>
      </div>

      <StackedPointsBar segmentos={segmentos} total={vereador.pontuacao} max={max} />

      <ul className="mt-2 space-y-1">
        {segmentos.map((s) => (
          <li key={s.tier.slot} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className={`cp-ord-seg cp-ord-seg-${s.tier.slot} h-2.5 w-2.5 shrink-0 rounded-[2px]`}
              style={{ background: COR_POR_SLOT[s.tier.slot] }}
            />
            {/* Sem sufixo "s" automático: os rótulos são sintagmas
                ("Projeto de Lei"), então pluralizar na ponta produzia
                "projeto de leis". O número já dá a quantidade. */}
            <span className="text-text-soft">
              <span className="font-tabular text-text">{formatNumberBR(s.qtd)}</span>{" "}
              {s.tier.labelCurto} × {s.tier.peso} ={" "}
              <span className="font-tabular text-text">{formatNumberBR(s.pontos)}</span>{" "}
              {s.pontos === 1 ? "ponto" : "pontos"}
            </span>
          </li>
        ))}
      </ul>

      {posicao > 0 ? (
        <p className="mt-3 border-t border-border/60 pt-2.5 text-xs text-text-soft">
          O 1º colocado ({lider.nome_urna ?? "—"}) tem{" "}
          <span className="font-tabular text-text">{formatNumberBR(lider.pontuacao)}</span>{" "}
          pontos.
        </p>
      ) : null}
    </div>
  );
}
