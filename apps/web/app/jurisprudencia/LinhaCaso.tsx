"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CasoJurisprudencia } from "@/lib/jurisprudencia";
import { analisarEmenta } from "@/lib/jurisprudencia-ementa";
import { linkFonteOficial, type FonteOficial } from "@/lib/jurisprudencia-fonte";
import { NOMES_FRENTE, NOMES_TIPO, explicarPolo, merito } from "./rotulos";

/**
 * @file Linha (desktop) e cartão (celular) da lista de jurisprudência.
 *
 * POR QUE DOIS DESENHOS
 *
 * A tabela tinha nove colunas e rolava de lado no celular — exatamente o que a
 * regra 5.14 proíbe. Cinco colunas cabem no desktop; no celular nenhuma tabela
 * de decisão judicial cabe. Então: `md:` para cima é tabela, abaixo é cartão
 * empilhado. O `TabelaCasos` renderiza os dois contêineres e cada um esconde o
 * outro por CSS — não há duplicação de dado, só de marcação.
 *
 * Órgão, comarca, classe e recorrente saíram da linha e entraram no bloco
 * aberto: são o detalhe, não o que se compara de relance.
 *
 * Por que cliente: a sanfona precisa de estado e ocupa a linha inteira
 * (`colSpan`), o que não dá para fazer com `<details>` dentro da célula. O
 * componente recebe **um caso**, então o JSON grande continua no servidor.
 *
 * LINK DO ACÓRDÃO ≠ BUSCA PELO NÚMERO
 *
 * O número do processo só vira link quando existe `link` externo do tribunal:
 * aí o clique abre o acórdão daquele processo. Quando o `link` é a rota
 * interna `/api/inteiro-teor` ou está vazio, o número fica como texto e a
 * linha "Fonte:" oferece a **busca oficial** do tribunal — um formulário, não
 * a decisão. O rótulo diz "Buscar no TJMG", nunca "Ver no TJMG": o TJMG exige
 * código antes de pesquisar, e uma URL montada com o número prometeria um
 * resultado que não existe. Sem link e sem busca cadastrada, a tela diz
 * "fonte oficial não informada" em vez de inventar destino.
 */

const LIMITE_CURTO = 320;
const COLUNAS = 5;

function resumoDe(caso: CasoJurisprudencia): string {
  return (caso.resumo || "").trim();
}

function ementaDe(caso: CasoJurisprudencia): string {
  return (caso.ementa || "").trim();
}

function ehCurto(caso: CasoJurisprudencia): boolean {
  if (caso.tipo === "sumula") return true;
  return !resumoDe(caso) && ementaDe(caso).length <= LIMITE_CURTO;
}

function temasDe(caso: CasoJurisprudencia): string {
  // Sem tema e sem assunto, o campo fica vazio: travessão não informa nada.
  const texto = caso.temas.slice(0, 2).join(", ") || caso.assunto.slice(0, 90);
  const resto = caso.temas.length > 2 ? ` +${caso.temas.length - 2}` : "";
  return `${texto}${resto}`.trim();
}

function temMaisTexto(caso: CasoJurisprudencia): boolean {
  if (!ementaDe(caso)) return false;
  return !ehCurto(caso) || ementaDe(caso) !== resumoDe(caso);
}

/** Ficha da decisão: o que saiu da linha e virou detalhe. */
function fichaDe(caso: CasoJurisprudencia): string {
  return [caso.orgao, caso.comarca, caso.classe, caso.recorrente].filter(Boolean).join(" · ");
}

/** Link de inteiro teor, quando existe. Um lugar só decide isso. */
function linkInteiro(caso: CasoJurisprudencia): string | null {
  const link = caso.link ?? "";
  return link.startsWith("/api/inteiro-teor") ? link : null;
}

/**
 * Rótulo do link para a fonte quando a ementa é só um trecho.
 *
 * "Ler o acórdão" só vale quando o destino é o acórdão naquele processo;
 * quando é a busca oficial, o rótulo diz "Buscar o processo" — o TJMG exige
 * código antes de pesquisar e a URL não leva o número. Prometer o acórdão
 * ali seria o mesmo erro que a linha "Fonte:" já evita.
 */
function rotuloFonteDaEmenta(caso: CasoJurisprudencia, fonte: FonteOficial): string | null {
  const tribunal = caso.tribunal || "tribunal";
  if (fonte.tipo === "acordao") return `Ler o acórdão no ${tribunal}`;
  if (fonte.tipo === "busca") return `Buscar o processo no ${tribunal}`;
  return null;
}

/** Rótulo do gatilho conforme o que está aberto. */
function rotuloGatilho(aberto: "resumo" | "inteiro" | null, qual: "resumo" | "inteiro"): string {
  if (aberto !== qual) return qual === "resumo" ? "ver mais" : "ver inteiro teor";
  return qual === "resumo" ? "ver menos" : "fechar inteiro teor";
}

/**
 * Linha "Fonte:" — o caminho para conferir a decisão na origem.
 *
 * Quando só existe a busca oficial, o texto é "Buscar no TJMG" e o `title`
 * avisa que o número não vai junto. Quando não há nem isso, a tela admite a
 * lacuna; nunca um link para outro processo.
 */
function LinhaFonteOficial({ caso }: { caso: CasoJurisprudencia }) {
  const fonte = linkFonteOficial(caso);
  if (fonte.tipo === "indisponivel") {
    return (
      <p className="text-xs opacity-70" title={fonte.titulo}>
        {fonte.rotulo}
      </p>
    );
  }
  return (
    <p className="text-xs">
      <span className="opacity-70">Fonte: </span>
      <a
        className="font-semibold text-primary underline"
        href={fonte.url}
        target="_blank"
        rel="noopener noreferrer"
        title={fonte.titulo}
      >
        {fonte.rotulo}
        <span aria-hidden="true"> ↗</span>
      </a>
    </p>
  );
}

function Detalhe({ caso, comFonte = true }: { caso: CasoJurisprudencia; comFonte?: boolean }) {
  const resumo = resumoDe(caso);
  // A ementa vem recortada de dois jeitos: ~500 caracteres pela fonte ou
  // 12.000 pelo gerador. O helper decide se o texto é inteiro ou trecho;
  // olhar só o teto de 12.000 deixava 4.970 trechos passarem como "Ementa:".
  const analise = analisarEmenta(ementaDe(caso));
  const fonte = linkFonteOficial(caso);
  const rotuloFonte = analise.truncada ? rotuloFonteDaEmenta(caso, fonte) : null;
  const ficha = fichaDe(caso);
  return (
    <div className="max-h-[60vh] space-y-3 overflow-y-auto overscroll-contain pr-1 text-sm leading-relaxed">
      {ficha ? <p className="text-xs opacity-70">{ficha}</p> : null}
      {resumo ? (
        <p>
          <span className="font-semibold">Resumo: </span>
          {resumo}
        </p>
      ) : null}
      {analise.texto ? (
        <div>
          <p>
            <span className="font-semibold">
              {analise.truncada ? "Trecho da ementa: " : "Ementa: "}
            </span>
            {analise.texto}
            {analise.motivo === "limite-gerador" ? "…" : null}
          </p>
          {analise.truncada ? (
            <div className="mt-1 space-y-1">
              <p className="text-xs leading-snug opacity-70">
                Trecho de {analise.caracteres.toLocaleString("pt-BR")} caracteres. O texto
                integral está no acórdão.
              </p>
              {/* O link do acórdão/busca substitui a linha "Fonte:" abaixo:
                  os dois apontariam para a mesma URL. No celular (`comFonte`
                  falso) a linha "Fonte:" já está fora da sanfona. */}
              {comFonte && rotuloFonte && fonte.tipo !== "indisponivel" ? (
                <p className="text-xs">
                  <a
                    className="font-semibold text-primary underline"
                    href={fonte.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={fonte.titulo}
                  >
                    {rotuloFonte}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {comFonte && !rotuloFonte ? <LinhaFonteOficial caso={caso} /> : null}
    </div>
  );
}

function CelulaProcesso({ caso }: { caso: CasoJurisprudencia }) {
  const fonte = linkFonteOficial(caso);
  // Só o link do acórdão justifica linkar o número. A busca oficial abre um
  // formulário vazio; linkar o número ali faria busca passar por fonte.
  if (fonte.tipo !== "acordao") return <>{caso.processo}</>;
  return (
    <a
      className="underline"
      href={fonte.url}
      target="_blank"
      rel="noopener noreferrer"
      title={fonte.titulo}
    >
      {caso.processo}
    </a>
  );
}

function ResumoCurto({ caso }: { caso: CasoJurisprudencia }) {
  const texto = resumoDe(caso) || (caso.tipo === "sumula" ? ementaDe(caso) : "");
  if (!texto) return null;
  // Sem clamp: o resumo do acervo tem mediana de 321 caracteres, e cortar em duas
  // linhas escondia justamente o desfecho. Quem quiser o texto inteiro usa o
  // "ver mais"; aqui o resumo aparece por completo, quebrando linha.
  return <p className="mt-1 text-xs leading-snug text-text-soft">{texto}</p>;
}

/**
 * Inteiro teor dentro da própria lista, não em aba de texto cru.
 *
 * Antes o botão abria `/api/inteiro-teor?...` numa aba nova: o leitor via
 * texto puro em fonte monoespaçada, com cara de terminal, e sem como baixar.
 * Agora o texto carrega aqui, na tipografia do portal, e o download é um link
 * ao lado — o mesmo conteúdo, servido com `content-disposition` pela rota.
 */
function InteiroTeorPainel({ caso }: { caso: CasoJurisprudencia }) {
  const [estado, setEstado] = useState<"carregando" | "erro" | "ok">("carregando");
  const [texto, setTexto] = useState("");
  useEffect(() => {
    let vivo = true;
    const url = caso.link ?? "";
    fetch(url)
      .then((resposta) => (resposta.ok ? resposta.text() : Promise.reject(new Error(String(resposta.status)))))
      .then((conteudo) => {
        if (!vivo) return;
        setTexto(conteudo);
        setEstado("ok");
      })
      .catch(() => vivo && setEstado("erro"));
    return () => {
      vivo = false;
    };
  }, [caso.link]);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs opacity-70">
          Inteiro teor · {caso.processo} · {caso.tribunal}
        </p>
        <a
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
          href={`${caso.link}&download=1`}
          download={`${caso.processo}.txt`}
        >
          baixar .txt
        </a>
      </div>
      <LinhaFonteOficial caso={caso} />
      {estado === "carregando" ? <p className="text-sm opacity-70">carregando…</p> : null}
      {estado === "erro" ? (
        <p className="text-sm opacity-70">
          O inteiro teor deste processo não está disponível no portal.
        </p>
      ) : null}
      {estado === "ok" ? (
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain whitespace-pre-wrap pr-1 text-sm leading-relaxed">
          {texto}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Copia resumo + ementa para a área de transferência.
 *
 * O botão existia no diálogo de ementa (`EmentaDialog.tsx`) e sumiu quando a
 * leitura virou sanfona na própria linha. De volta aqui, com o mesmo texto e o
 * mesmo ícone: o leitor copia a decisão para colar no laudo, no processo ou na
 * conversa — sem isso ele seleciona 12 mil caracteres na mão.
 */
function BotaoCopiar({ caso }: { caso: CasoJurisprudencia }) {
  const [copiado, setCopiado] = useState(false);
  useEffect(() => {
    if (!copiado) return;
    const relogio = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(relogio);
  }, [copiado]);

  const semPrefixo = (texto: string, prefixo: string) =>
    texto.replace(new RegExp(`^${prefixo}:\\s*`, "i"), "").trim();
  // Copiar um trecho rotulado de "Ementa:" levaria a mesma confusão da tela
  // para o laudo. O rótulo acompanha o que está na sanfona.
  const analise = analisarEmenta(ementaDe(caso));
  const rotuloEmenta = analise.truncada ? "Trecho da ementa" : "Ementa";
  const texto = [
    resumoDe(caso) ? `Resumo: ${semPrefixo(resumoDe(caso), "resumo")}` : "",
    analise.texto ? `${rotuloEmenta}: ${semPrefixo(analise.texto, "ementa")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  if (!texto) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
        } catch {
          setCopiado(false);
        }
      }}
      aria-label={`Copiar ementa do processo ${caso.processo}`}
      className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
    >
      {copiado ? <Check size={14} /> : <Copy size={14} />}
      {copiado ? "copiado" : "copiar ementa"}
    </button>
  );
}

function Acoes({
  caso,
  aberto,
  onToggle,
  classe,
}: {
  caso: CasoJurisprudencia;
  aberto: "resumo" | "inteiro" | null;
  onToggle: (qual: "resumo" | "inteiro") => void;
  classe?: string;
}) {
  const temInteiro = Boolean(linkInteiro(caso));
  return (
    <div className={classe ?? "flex flex-col items-end gap-1"}>
      {temMaisTexto(caso) ? (
        <button
          type="button"
          onClick={() => onToggle("resumo")}
          aria-expanded={aberto === "resumo"}
          className="text-xs font-semibold text-primary underline"
        >
          {rotuloGatilho(aberto, "resumo")}
        </button>
      ) : null}
      <BotaoCopiar caso={caso} />
      {temInteiro ? (
        <button
          type="button"
          onClick={() => onToggle("inteiro")}
          aria-expanded={aberto === "inteiro"}
          className="text-xs font-semibold text-primary underline"
        >
          {rotuloGatilho(aberto, "inteiro")}
        </button>
      ) : null}
    </div>
  );
}

export function LinhaCaso({ caso }: { caso: CasoJurisprudencia }) {
  const [aberto, setAberto] = useState<"resumo" | "inteiro" | null>(null);
  const alternar = (qual: "resumo" | "inteiro") =>
    setAberto((atual) => (atual === qual ? null : qual));
  return (
    <>
      <tr className="hidden border-t border-[var(--cp-border)] align-top md:table-row">
        <td className="w-[9.5rem] px-2 py-2 font-tabular">
          <CelulaProcesso caso={caso} />
        </td>
        <td className="w-[7rem] whitespace-nowrap px-2 py-2">
          {caso.tribunal}/{caso.estado} · {caso.ano || "—"}
        </td>
        <td className="w-[10.5rem] px-2 py-2" title={explicarPolo(caso)}>
          {merito(caso)}
        </td>
        <td className="px-2 py-2">
          {temasDe(caso) ? <span>{temasDe(caso)}</span> : null}
          <ResumoCurto caso={caso} />
        </td>
        <td className="w-[7.5rem] px-2 py-2 text-right">
          <Acoes caso={caso} aberto={aberto} onToggle={alternar} />
        </td>
      </tr>
      {aberto ? (
        <tr className="hidden border-t border-[var(--cp-border)] bg-[var(--cp-surface-2)] md:table-row">
          <td colSpan={COLUNAS} className="px-4 py-3">
            {aberto === "inteiro" ? <InteiroTeorPainel caso={caso} /> : <Detalhe caso={caso} />}
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** Cartão do celular: mesma informação, empilhada, sem rolagem lateral. */
export function CartaoCaso({ caso }: { caso: CasoJurisprudencia }) {
  const [aberto, setAberto] = useState<"resumo" | "inteiro" | null>(null);
  const alternar = (qual: "resumo" | "inteiro") =>
    setAberto((atual) => (atual === qual ? null : qual));
  return (
    <li className="space-y-1 rounded-lg border border-[var(--cp-border)] p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-tabular font-semibold">
          <CelulaProcesso caso={caso} />
        </p>
        <p className="shrink-0 text-xs opacity-70">{caso.ano || "—"}</p>
      </div>
      <p className="text-xs opacity-70">
        {caso.tribunal}/{caso.estado} · {NOMES_TIPO[caso.tipo] ?? caso.tipo} ·{" "}
        {NOMES_FRENTE[caso.frente] ?? caso.frente}
      </p>
      <p>{merito(caso)}</p>
      {explicarPolo(caso) ? (
        <p className="text-xs opacity-70">{explicarPolo(caso)}</p>
      ) : null}
      {temasDe(caso) ? <p className="text-xs opacity-80">{temasDe(caso)}</p> : null}
      <ResumoCurto caso={caso} />
      <LinhaFonteOficial caso={caso} />
      {aberto ? (
        <div className="rounded bg-[var(--cp-surface-2)] p-2">
          {aberto === "inteiro" ? <InteiroTeorPainel caso={caso} /> : <Detalhe caso={caso} comFonte={false} />}
        </div>
      ) : null}
      <Acoes caso={caso} aberto={aberto} onToggle={alternar} classe="flex flex-wrap gap-3 pt-1" />
    </li>
  );
}
