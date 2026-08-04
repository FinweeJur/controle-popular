import RotuloBadge from "@/app/[municipio]/components/RotuloBadge";
import { labelDoDireito } from "@/lib/congresso/rubrica";
import { formatDateBR } from "@/lib/betim/format";
import type { DestaqueLegislacao } from "@/lib/betim/legislacao-garantista";

/**
 * Card de destaque (alerta ou bom exemplo) do eixo Cidades.
 *
 * Espelha `app/congresso/components/CardDestaque.tsx`: mostra SEMPRE o
 * motivo — direito afetado, dispositivo citado e o trecho literal —, nunca
 * só o rótulo. Duas diferenças deliberadas em relação ao Congresso:
 *
 * 1. O selo "Lei vigente" / "Projeto em tramitação" — aqui existem DOIS
 *    tipos de objeto analisado, e a diferença importa de verdade: uma lei
 *    já sancionada vale agora, um projeto ainda pode mudar ou ser
 *    arquivado antes de virar norma.
 * 2. Sem link "gerar ofício": esse fluxo é específico do Congresso (ofício
 *    a parlamentar) e não tem equivalente no eixo Cidades, que também não
 *    tem página de detalhe por proposição/ato — por isso o link no rodapé
 *    aponta pra fonte oficial (`link_fonte`) quando existe, em vez de uma
 *    rota interna que não existe.
 */
export default function CardLegislacao({ d }: { d: DestaqueLegislacao }) {
  const ehAto = d.tipoObjeto === "ato";
  const autoresVisiveis = d.autores?.slice(0, 2) ?? [];
  const autoresRestantes = (d.autores?.length ?? 0) - autoresVisiveis.length;

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-display font-semibold text-text">{d.identificacao}</span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            ehAto ? "bg-primary/10 text-primary" : "bg-surface-2 text-text-soft"
          }`}
        >
          {ehAto ? "Lei vigente" : "Projeto em tramitação"}
        </span>
        <RotuloBadge rotulo={d.rotulo} score={d.score} tamanho="sm" />
        {d.clausula_petrea ? (
          <span className="rounded-md border border-alert px-2 py-0.5 text-xs text-alert">
            toca cláusula pétrea
          </span>
        ) : null}
        {d.vedacao_retrocesso ? (
          <span className="rounded-md border border-alert px-2 py-0.5 text-xs text-alert">
            retrocesso social
          </span>
        ) : null}
      </div>

      {!ehAto && autoresVisiveis.length > 0 ? (
        <p className="mt-2 text-sm text-text-soft">
          <span className="opacity-80">Autoria: </span>
          <span className="text-text">{autoresVisiveis.join(", ")}</span>
          {autoresRestantes > 0 ? (
            <span> + {autoresRestantes} {autoresRestantes === 1 ? "coautor" : "coautores"}</span>
          ) : null}
        </p>
      ) : null}

      <p className="mt-2 text-sm text-text-soft">{d.ementa ?? "—"}</p>

      {d.principal ? (
        <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
          <p>
            {/* O verbo sai da DIREÇÃO DO ITEM, não do rótulo da análise. O
                item principal é o de maior |peso|, e nada garante que ele
                puxe para o mesmo lado do rótulo final: uma análise com
                score positivo (garantista) pode ter como item mais pesado
                justamente o único que restringe. Ler o verbo do rótulo
                imprimia "Amplia" embaixo de um trecho que restringe — e o
                trecho está ali do lado, para o leitor conferir. */}
            <strong className="text-text">
              {d.principal.direcao === "restringe"
                ? "Restringe"
                : d.principal.direcao === "amplia"
                  ? "Amplia"
                  : "Toca"}
              : {labelDoDireito(d.principal.direito)}
            </strong>{" "}
            <span className="text-text-soft">
              ({d.principal.dispositivo}
              {d.principal.grau ? ` · alcance ${d.principal.grau}` : ""})
            </span>
          </p>
          {d.principal.trecho ? (
            <p className="mt-1.5 italic text-text-soft">“{d.principal.trecho}”</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-soft">
        {d.data ? (
          <span>
            {ehAto ? "publicada em" : "apresentado em"} {formatDateBR(d.data)}
          </span>
        ) : null}
        {!ehAto && d.situacao ? <span>{d.situacao}</span> : null}
        {d.direitos.length > 1 ? <span>{d.direitos.length} direitos afetados</span> : null}
        {/* O modelo aparece porque score não é comparável entre modelos —
            ver `lib/betim/legislacao-garantista.ts`. */}
        {d.modelo ? <span>análise por {d.modelo}</span> : null}
        {d.linkFonte ? (
          <a
            href={d.linkFonte}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Ver fonte oficial ↗
          </a>
        ) : null}
      </div>
    </article>
  );
}
