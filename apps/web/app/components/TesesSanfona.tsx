"use client";

import { useMemo, useState } from "react";
import SanfonaResumo from "./SanfonaResumo";
import type { Tese } from "@/lib/biblioteca/teses";

/**
 * Seção governando as teses de um destino (`dados de destino`).
 *
 * O que o dono pediu em 14/10/2026:
 * - TAG `MAB` visível em quem menciona o Movimento (dado já vem do gerador);
 * - resumo acessível via sanfona sem sair da página (`SanfonaResumo`);
 * - link oficial de acesso à publicação em cada item (formato ABNT com
 *   hiperlink — AGENTS §8); 36 teses vêm sem link e a lacuna fica ditada.
 *
 * A busca é textual em tempo real, tolerante a acentos (AGENTS §8: buscável
 * e filtrável). A fatia inteira chega por props da página servidor; nenhum
 * fetch adicional daqui.
 */

function semAcentoMenor(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase();
}

function hostnameDiscreto(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Cartão de uma tese: título, metadado, TAGs, sanfona do resumo e o LINK
    OFICIAL de acesso (36 teses vêm sem link e a lacuna fica ditada). Função
    própria para a listagem ficar sob o teto de método grande do CodeScene. */
function CartaoTese({ tese }: { tese: Tese }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-4 transition hover:border-border/70">
      <h4 className="font-display text-base font-semibold leading-snug">{tese.titulo}</h4>
      <p className="mt-1 text-xs text-text-soft">
        {tese.autor} · {tese.tipo} ({tese.ano ?? "s/data"}) · {tese.instituicao}
        {tese.sigla ? ` (${tese.sigla})` : ""} · idioma {tese.idioma?.toUpperCase() ?? "não declarado"}
        {tese.acesso === "embargoedAccess" ? " · acesso embargado pela fonte" : ""}
      </p>

      {(tese.tags.length > 0 || tese.desastre === "ambos") && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {tese.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"
            >
              TAG {tag}
            </span>
          ))}
          {tese.desastre === "ambos" && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
              Mariana + Brumadinho
            </span>
          )}
        </div>
      )}

      {tese.resumo ? (
        <div className="mt-2">
          <SanfonaResumo resumo={tese.resumo} />
        </div>
      ) : (
        <p className="mt-2 text-xs italic text-text-soft">
          Sem resumo na fonte — lacuna declarada, não inventada (§7).
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {tese.links.length > 0 ? <LinksOficiaisTeses links={tese.links} /> : (
          <span className="italic text-text-soft">
            Sem link oficial na fonte — lacuna declarada.
          </span>
        )}
      </div>
    </li>
  );
}

/** Bloco de links: o primeiro é o acesso principal; os demais, espelhos. */
function LinksOficiaisTeses({ links }: { links: readonly string[] }) {
  return (
    <>
      <a
        href={links[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-accent underline underline-offset-2 hover:text-primary focus-visible:outline-2 focus-visible:outline-accent"
      >
        Acessar publicação ↗
      </a>
      {links.slice(1).map((link) => (
        <a
          key={link}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-soft underline underline-offset-2 hover:text-primary"
        >
          Acesso alternativo: {hostnameDiscreto(link)} ↗
        </a>
      ))}
    </>
  );
}

/** Busca textual em tempo real + filtro "Só MAB" + contador (AGENTS §8). */
function BarraDeBuscaTeses({
  busca, setBusca, soMab, setSoMab, comMab, mostrando, total,
}: {
  busca: string;
  setBusca: (v: string) => void;
  soMab: boolean;
  setSoMab: (v: boolean) => void;
  comMab: number;
  mostrando: number;
  total: number;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={busca}
        onChange={(ev) => setBusca(ev.target.value)}
        placeholder="Buscar título, autor, instituição ou tema do resumo…"
        aria-label="Buscar tese por título, autoria ou tema do resumo"
        className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-soft focus:border-accent focus-visible:outline-2 focus-visible:outline-accent sm:w-auto sm:flex-1"
      />
      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          checked={soMab}
          onChange={(ev) => setSoMab(ev.target.checked)}
          className="size-4 accent-[var(--cp-primary)]"
        />
        Só MAB <span className="text-xs text-text-soft">({comMab})</span>
      </label>
      <span className="text-xs text-text-soft" aria-live="polite">
        Mostrando {mostrando} de {total}
      </span>
    </div>
  );
}

export default function TesesSanfona({
  teses,
  tituloSessao = "Teses e dissertações",
}: {
  teses: readonly Tese[];
  tituloSessao?: string;
}) {
  const [busca, setBusca] = useState("");
  const [soMab, setSoMab] = useState(false);

  const visiveis = useMemo(() => {
    const termo = semAcentoMenor(busca.trim());
    return teses
      .filter(
        (t) =>
          (!soMab || t.tags.includes("MAB")) &&
          (!termo ||
            semAcentoMenor(`${t.titulo} ${t.autor} ${t.instituicao} ${t.resumo ?? ""}`).includes(termo)),
      )
      .sort(
        (a, b) =>
          (b.ano ?? 0) - (a.ano ?? 0) || a.titulo.localeCompare(b.titulo, "pt-BR"),
      );
  }, [teses, busca, soMab]);

  const comMab = teses.filter((t) => t.tags.includes("MAB")).length;
  const comResumo = teses.filter((t) => t.resumo).length;

  return (
    <section aria-label={tituloSessao} className="text-text">
      <h3 className="font-display text-lg font-bold tracking-tight">{tituloSessao}</h3>
      <p className="mt-1 text-sm text-text-soft">
        {teses.length} teses e dissertações e{" "}
        <strong className="text-text">repositório oficial linkado</strong> em cada item —{" "}
        {comMab} com a TAG <span className="font-bold text-primary">MAB</span>; {comResumo} com resumo na
        página.
      </p>

      {/* Busca em tempo real + filtro pela tag MAB (regra das bibliotecas, §8). */}
      <BarraDeBuscaTeses
        busca={busca}
        setBusca={setBusca}
        soMab={soMab}
        setSoMab={setSoMab}
        comMab={comMab}
        mostrando={visiveis.length}
        total={teses.length}
      />

      {visiveis.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm italic text-text-soft">
          Nenhuma tese com esse termo — ajuste a busca ou o filtro. A fonte completa
          está no levantamento versionado.
        </p>
      ) : (
        <ol className="mt-4 grid gap-3">
          {visiveis.map((t) => (
            <CartaoTese key={t.id} tese={t} />
          ))}
        </ol>
      )}
    </section>
  );
}
