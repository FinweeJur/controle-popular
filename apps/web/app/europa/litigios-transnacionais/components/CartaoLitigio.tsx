/**
 * Card completo de um litígio de Mariana/Brumadinho na Europa.
 *
 * Mostra número do processo, citação, partes, objeto e fase; abaixo, os
 * fatos, os atos e os próximos passos, cada um com a fonte. A regra é não
 * afirmar número ou fase sem fonte oficial: o que não foi conferido ganha
 * o selo de pendência e o motivo.
 */
import type { Litigio } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";
import AtosDoLitigio from "./AtosDoLitigio";
import FatosDoLitigio from "./FatosDoLitigio";
import FontesDoLitigio from "./FontesDoLitigio";
import SeloPendente from "./SeloPendente";

const ROTULO_CASO: Record<Litigio["caso"], string> = {
  mariana: "Mariana (Rio Doce)",
  brumadinho: "Brumadinho (Paraopeba)",
};

const ROTULO_STATUS: Record<Litigio["status"], string> = {
  "em-andamento": "em andamento",
  julgado: "julgado",
  pendente: "a confirmar",
};

export default function CartaoLitigio({ litigio }: { litigio: Litigio }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {ROTULO_CASO[litigio.caso]}
        </span>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-text-soft">
          {ROTULO_STATUS[litigio.status]}
        </span>
        {litigio.pendente ? <SeloPendente /> : null}
      </div>

      <h3 className="mt-3 font-display text-xl font-semibold text-text">
        {litigio.titulo}
      </h3>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Tribunal</dt>
          <dd className="text-text">{litigio.tribunal}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Jurisdição</dt>
          <dd className="text-text">{litigio.jurisdicao}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Processo</dt>
          <dd className="text-text break-words">{litigio.numeroProcesso}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Citação</dt>
          <dd className="text-text">{litigio.citacaoNeutra ?? "não informada"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Partes</dt>
          <dd className="text-text">
            <span className="font-medium">Autores:</span> {litigio.partes.autores.join("; ")}
            <br />
            <span className="font-medium">Réus:</span> {litigio.partes.reus.join("; ")}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Objeto</dt>
          <dd className="text-text">{litigio.objeto}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Fase processual</dt>
          <dd className="text-text">
            {litigio.faseProcessual}{" "}
            <span className="text-xs text-text-soft">
              (acesso em {formatarDataBR(litigio.dataAcesso)})
            </span>
          </dd>
        </div>
      </dl>

      {litigio.observacaoPendencia ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300">
          {litigio.observacaoPendencia}
        </p>
      ) : null}

      <FatosDoLitigio fatos={litigio.fatos} />
      <AtosDoLitigio atos={litigio.atos} />

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-text">Próximos passos</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-soft">
          {litigio.proximosPassos.map((passo) => (
            <li key={passo.descricao}>
              {passo.descricao} {passo.pendente ? <SeloPendente texto="a conferir" /> : null}
              {passo.fonteUrl ? (
                <a
                  href={passo.fonteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-xs font-medium text-accent hover:underline"
                >
                  Fonte ↗
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <FontesDoLitigio fontes={litigio.fontes} />
    </article>
  );
}
