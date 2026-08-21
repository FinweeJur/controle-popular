"use client";

import { useMemo, useState } from "react";
import { CONVENIOS_AMBIENTAIS_MG } from "@/lib/ambiental/convenios-mg";
import { formatCurrencyCompactaBR, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { semAcento } from "@/lib/busca/normalizar";

/**
 * A lista dos 870 convênios, filtrável.
 *
 * ═══ POR QUE ESTE COMPONENTE É DE CLIENTE ═══
 *
 * `CONVENIOS_AMBIENTAIS_MG` pesa ~930 KiB, e 59% disso é o campo `objetivo` —
 * o texto com que a própria fonte descreve para que serve cada convênio. Ele é
 * o que faz a lista valer a pena, então não dá para cortar; mas array desse
 * tamanho importado por página de SERVIDOR entraria no bundle do Worker, que
 * tem teto de 3 MiB gzip e hoje opera com pouca margem.
 *
 * Em componente de cliente o array vai para o chunk servido como asset
 * estático, cujo teto é 25 MiB por arquivo. A página de servidor ao lado só
 * importa as constantes de cobertura. É a mesma divisão de
 * `/paraopeba/auditoria`. Ver `docs/ARQUITETURA.md`.
 */

const POR_PAGINA = 40;

type Ordem = "valor" | "prorrogacao" | "ano";

export default function ConveniosClient() {
  const [busca, setBusca] = useState("");
  const [orgao, setOrgao] = useState("");
  const [soProrrogados, setSoProrrogados] = useState(false);
  const [ordem, setOrdem] = useState<Ordem>("valor");
  const [mostrando, setMostrando] = useState(POR_PAGINA);

  const orgaos = useMemo(
    () => [...new Set(CONVENIOS_AMBIENTAIS_MG.map((c) => c.orgao))].sort(),
    [],
  );

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    const lista = CONVENIOS_AMBIENTAIS_MG.filter((c) => {
      if (orgao && c.orgao !== orgao) return false;
      if (soProrrogados && c.diasDeProrrogacao === 0) return false;
      if (!termo) return true;
      return (
        semAcento(c.nome.toLowerCase()).includes(termo) ||
        semAcento(c.objetivo.toLowerCase()).includes(termo) ||
        semAcento(c.municipio.toLowerCase()).includes(termo) ||
        semAcento(c.convenente.toLowerCase()).includes(termo)
      );
    });
    const por: Record<Ordem, (a: (typeof lista)[number], b: (typeof lista)[number]) => number> = {
      valor: (a, b) => b.valorTotal - a.valorTotal,
      prorrogacao: (a, b) => b.diasDeProrrogacao - a.diasDeProrrogacao,
      ano: (a, b) => b.ano - a.ano,
    };
    return [...lista].sort(por[ordem]);
  }, [busca, orgao, soProrrogados, ordem]);

  const visiveis = filtrados.slice(0, mostrando);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[220px]">
          <span className="block text-[.82em] font-medium text-text-soft">
            Buscar por nome, objetivo, município ou convenente
          </span>
          <input
            type="search"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            placeholder="ex.: nascente, Diamantina, reflorestamento"
          />
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Órgão</span>
          <select
            value={orgao}
            onChange={(e) => {
              setOrgao(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value="">Todos</option>
            {orgaos.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Ordenar por</span>
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value="valor">Maior valor</option>
            <option value="prorrogacao">Maior prorrogação</option>
            <option value="ano">Mais recente</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-[.92em] text-text-soft">
          <input
            type="checkbox"
            checked={soProrrogados}
            onChange={(e) => {
              setSoProrrogados(e.target.checked);
              setMostrando(POR_PAGINA);
            }}
          />
          Só os prorrogados
        </label>
      </div>

      <p className="mt-4 text-[.88em] text-text-soft" role="status">
        {formatNumberBR(filtrados.length)}{" "}
        {filtrados.length === 1 ? "convênio" : "convênios"}
        {filtrados.length > 0 && (
          <>
            {" "}
            · {formatCurrencyCompactaBR(filtrados.reduce((t, c) => t + c.valorTotal, 0))} somados
          </>
        )}
      </p>

      {filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhum convênio com esses filtros. Vazio aqui é resposta — não quer dizer que a busca
          falhou.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visiveis.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-surface px-4 py-3">
              <p className="font-semibold text-text">{c.nome || "(sem nome na fonte)"}</p>
              <p className="mt-1 text-[.88em] text-text-soft">
                {[c.orgao, c.convenente, c.municipio, c.instrumento, c.ano]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-2 text-[.92em] text-text-soft">
                <strong className="font-medium text-text">
                  {formatCurrencyCompactaBR(c.valorTotal)}
                </strong>
                {c.prazoOriginal && c.prazoAtual && (
                  <>
                    {" · prazo original "}
                    {formatDateBR(c.prazoOriginal)}
                    {c.diasDeProrrogacao > 0 ? (
                      <>
                        {" → hoje "}
                        {formatDateBR(c.prazoAtual)}{" "}
                        <strong className="font-medium text-text">
                          (+{formatNumberBR(c.diasDeProrrogacao)} dias)
                        </strong>
                      </>
                    ) : (
                      ", sem prorrogação"
                    )}
                  </>
                )}
              </p>
              {c.objetivo && (
                <details className="mt-2 text-[.9em] text-text-soft">
                  <summary className="cursor-pointer">Objetivo, como a fonte escreveu</summary>
                  <p className="mt-1.5">{c.objetivo}</p>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}

      {mostrando < filtrados.length && (
        <button
          type="button"
          onClick={() => setMostrando((n) => n + POR_PAGINA)}
          className="mt-4 w-full rounded-md border border-border bg-surface px-4 py-2 text-[.92em] font-medium hover:border-primary"
        >
          Mostrar mais {formatNumberBR(Math.min(POR_PAGINA, filtrados.length - mostrando))} de{" "}
          {formatNumberBR(filtrados.length - mostrando)} restantes
        </button>
      )}
    </div>
  );
}
