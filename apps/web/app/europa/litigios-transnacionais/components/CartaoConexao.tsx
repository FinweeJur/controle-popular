/**
 * Card de conexão transnacional que não é Mariana nem Brumadinho.
 *
 * Existe para dar contexto ao leitor sem falsear a classificação: a
 * Braskem/Maceió é um caso holandês próprio, não um litígio de Brumadinho.
 */
import type { ConexaoTransnacional } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";
import FontesDoLitigio from "./FontesDoLitigio";
import SeloPendente from "./SeloPendente";

export default function CartaoConexao({
  conexao,
}: {
  conexao: ConexaoTransnacional;
}) {
  return (
    <article className="rounded-xl border border-dashed border-border bg-surface/60 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
          conexão holandesa
        </span>
        {conexao.pendente ? <SeloPendente /> : null}
      </div>

      <h3 className="mt-3 font-display text-xl font-semibold text-text">
        {conexao.titulo}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-text-soft">{conexao.resumo}</p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Tribunal</dt>
          <dd className="text-text">{conexao.tribunal}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Jurisdição</dt>
          <dd className="text-text">{conexao.jurisdicao}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Processo</dt>
          <dd className="text-text break-words">{conexao.numeroProcesso}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Objeto</dt>
          <dd className="text-text">{conexao.objeto}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Fase</dt>
          <dd className="text-text">
            {conexao.faseProcessual}{" "}
            <span className="text-xs text-text-soft">
              (acesso em {formatarDataBR(conexao.dataAcesso)})
            </span>
          </dd>
        </div>
      </dl>

      {conexao.observacaoPendencia ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300">
          {conexao.observacaoPendencia}
        </p>
      ) : null}

      <FontesDoLitigio fontes={conexao.fontes} />
    </article>
  );
}
