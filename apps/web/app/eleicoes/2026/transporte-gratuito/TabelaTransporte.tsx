"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, RotateCcw, Search } from "lucide-react";

import BotoesExportar from "@/app/components/BotoesExportar";
import BotaoBrilho from "@/app/components/react-bits/BotaoBrilho";
import type { ColunaCsv } from "@/lib/tabela/csv";
import { normalizar, type Direcao } from "@/lib/tabela/ordenavel";
import type {
  PoliticaTransporte,
  TipoPolitica,
} from "@/lib/eleicoes/transporte-2026";

/**
 * Tabela filtrável das políticas de gratuidade confirmadas.
 *
 * Recebe apenas os registros de `politicas`; o transporte especial da
 * Justiça Eleitoral fica nos cartões por TRE, porque são conceitos
 * diferentes. A tabela é pequena (dezenas de linhas), então a busca e a
 * ordenação rodam no cliente sem paginação.
 */

const ROTULO_TIPO: Record<TipoPolitica, string> = {
  estadual: "Estadual",
  distrital: "Distrital",
  metropolitana: "Metropolitana",
  municipal: "Municipal",
};

/** Políticas permanentes de domingo que também cobrem 25/10. */
const POLITICAS_PERMANENTES = new Set([
  "belem-municipal",
  "canoas-municipal",
  "caruaru-municipal",
  "caucaia-municipal",
  "cuiaba-municipal",
]);

/**
 * Domínios de órgão público. O destaque "Fonte pública" só aparece quando o
 * link é do próprio ente (governo, TRE, MP, DPU, prefeitura ou agência).
 * Imprensa continua identificada como imprensa.
 */
const DOMINIOS_PUBLICOS = [
  "gov.br",
  "jus.br",
  "leg.br",
  "mp.br",
  "def.br",
  "prefeitura.rio",
  "prefeitura.poa.br",
  "agenciapara.com.br",
  "sptrans.com.br",
  "agenciabelem.com.br",
  "prefeiturademossoro.com.br",
];

const FONTE_DOCUMENTO_OFICIAL = new Set(["campo-grande-municipal"]);

function ehFontePublica(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return DOMINIOS_PUBLICOS.some(
      (dominio) => host === dominio || host.endsWith(`.${dominio}`),
    );
  } catch {
    return false;
  }
}

function rotuloFonte(politica: PoliticaTransporte): string {
  if (FONTE_DOCUMENTO_OFICIAL.has(politica.id)) return "Documento oficial";
  return ehFontePublica(politica.fonteUrl) ? "Fonte pública" : "Imprensa";
}

function classeFonte(politica: PoliticaTransporte): string {
  const rotulo = rotuloFonte(politica);
  if (rotulo === "Fonte pública") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
  }
  if (rotulo === "Documento oficial") {
    return "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300";
  }
  return "border-border bg-surface-2 text-text-soft";
}

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function formatarData(valor: string): string {
  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (dia) return `${dia[3]}/${dia[2]}/${dia[1]}`;

  const mes = /^(\d{4})-(\d{2})$/.exec(valor);
  if (mes) return `${MESES[Number(mes[2]) - 1]}/${mes[1]}`;

  return valor;
}

type CampoOrdenacao = "uf" | "ente" | "tipo" | "periodo" | "fonteData";

interface Ordem {
  campo: CampoOrdenacao;
  direcao: Direcao;
}

function valorDe(politica: PoliticaTransporte, campo: CampoOrdenacao): string {
  if (campo === "tipo") return ROTULO_TIPO[politica.tipo];
  return politica[campo];
}

function comparar(a: PoliticaTransporte, b: PoliticaTransporte, ordem: Ordem): number {
  const base = valorDe(a, ordem.campo).localeCompare(valorDe(b, ordem.campo), "pt-BR");
  return ordem.direcao === "asc" ? base : -base;
}

const COLUNAS_CSV: readonly ColunaCsv<PoliticaTransporte>[] = [
  { chave: "uf", rotulo: "UF" },
  { chave: "ente", rotulo: "Ente" },
  {
    chave: "tipo",
    rotulo: "Tipo",
    formatar: (valor) => ROTULO_TIPO[valor as TipoPolitica],
  },
  { chave: "cobertura", rotulo: "Cobertura" },
  { chave: "modalidades", rotulo: "Modalidades" },
  { chave: "periodo", rotulo: "Período" },
  { chave: "fonteNome", rotulo: "Fonte" },
  { chave: "fonteUrl", rotulo: "URL da fonte" },
  {
    chave: "fonteData",
    rotulo: "Data da fonte",
    formatar: (valor) => formatarData(String(valor)),
  },
  {
    chave: "id",
    rotulo: "Natureza da fonte",
    formatar: (_valor, linha) => rotuloFonte(linha),
  },
  {
    chave: "id",
    rotulo: "Política permanente",
    formatar: (_valor, linha) => (POLITICAS_PERMANENTES.has(linha.id) ? "Sim" : "Não"),
  },
  { chave: "observacao", rotulo: "Observação" },
];

export default function TabelaTransporte({
  registros,
}: {
  registros: readonly PoliticaTransporte[];
}) {
  const [termo, setTermo] = useState("");
  const [uf, setUf] = useState("");
  const [tipo, setTipo] = useState("");
  const [ordem, setOrdem] = useState<Ordem>({ campo: "uf", direcao: "asc" });

  const ufs = useMemo(
    () => [...new Set(registros.map((registro) => registro.uf))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [registros],
  );

  const tipos = useMemo(
    () =>
      [...new Set(registros.map((registro) => registro.tipo))].sort((a, b) =>
        ROTULO_TIPO[a].localeCompare(ROTULO_TIPO[b], "pt-BR"),
      ),
    [registros],
  );

  const filtradas = useMemo(() => {
    const alvo = normalizar(termo);

    return registros
      .filter((registro) => (uf ? registro.uf === uf : true))
      .filter((registro) => (tipo ? registro.tipo === tipo : true))
      .filter((registro) => {
        if (!alvo) return true;
        const texto = [
          registro.uf,
          registro.ente,
          registro.tipo,
          registro.cobertura,
          registro.modalidades,
          registro.periodo,
          registro.fonteNome,
          registro.observacao,
        ].join(" ");
        return normalizar(texto).includes(alvo);
      })
      .sort((a, b) => comparar(a, b, ordem));
  }, [registros, termo, uf, tipo, ordem]);

  function alternar(campo: CampoOrdenacao) {
    setOrdem((atual) => {
      if (atual.campo === campo) {
        return { campo, direcao: atual.direcao === "asc" ? "desc" : "asc" };
      }
      return { campo, direcao: "asc" };
    });
  }

  function limpar() {
    setTermo("");
    setUf("");
    setTipo("");
    setOrdem({ campo: "uf", direcao: "asc" });
  }

  function icone(campo: CampoOrdenacao) {
    if (ordem.campo !== campo) return <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />;
    if (ordem.direcao === "asc") return <ArrowUp className="h-3.5 w-3.5" />;
    return <ArrowDown className="h-3.5 w-3.5" />;
  }

  function cabecalho(campo: CampoOrdenacao, rotulo: string) {
    return (
      <th
        scope="col"
        aria-sort={
          ordem.campo === campo
            ? ordem.direcao === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-soft"
      >
        <button
          type="button"
          onClick={() => alternar(campo)}
          className="inline-flex items-center gap-1 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {rotulo}
          {icone(campo)}
        </button>
      </th>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-semibold text-text-soft">
          Buscar
          <span className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
            <input
              type="search"
              value={termo}
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Estado, modalidade, fonte..."
              className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </span>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-text-soft">
          UF
          <select
            value={uf}
            onChange={(event) => setUf(event.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <option value="">Todas</option>
            {ufs.map((sigla) => (
              <option key={sigla} value={sigla}>
                {sigla}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-text-soft">
          Tipo
          <select
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <option value="">Todos</option>
            {tipos.map((chave) => (
              <option key={chave} value={chave}>
                {ROTULO_TIPO[chave]}
              </option>
            ))}
          </select>
        </label>

        <BotaoBrilho raio={8} forca={0.12} afastamento={20}>
          <button
            type="button"
            onClick={limpar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar
          </button>
        </BotaoBrilho>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs opacity-70" aria-live="polite">
          {filtradas.length} de {registros.length} políticas
        </p>
        <BotoesExportar
          dados={filtradas}
          colunas={COLUNAS_CSV}
          nomeArquivo="transporte-gratuito-2026"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[880px] text-sm">
          <caption className="border-b border-border bg-surface-2/60 px-3 py-2 text-left text-xs opacity-70">
            Políticas de gratuidade confirmadas até 21/10/2026. A lista é amostra
            verificada, não censo.
          </caption>
          <thead className="border-b border-border bg-surface-2/80">
            <tr>
              {cabecalho("uf", "UF")}
              {cabecalho("ente", "Ente")}
              {cabecalho("tipo", "Tipo")}
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-soft"
              >
                O que é gratuito
              </th>
              {cabecalho("periodo", "Período")}
              {cabecalho("fonteData", "Fonte")}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm opacity-70">
                  Nenhuma política encontrada com esses filtros.
                </td>
              </tr>
            ) : (
              filtradas.map((politica) => (
                <tr key={politica.id} className="border-b border-border/60 last:border-0">
                  <td className="whitespace-nowrap px-3 py-3 align-top font-semibold">
                    {politica.uf}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <p className="font-medium">{politica.ente}</p>
                    <p className="text-xs opacity-70">{politica.cobertura}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      <span className="inline-flex rounded-full border border-border bg-surface px-2 py-0.5 text-xs">
                        {ROTULO_TIPO[politica.tipo]}
                      </span>
                      {POLITICAS_PERMANENTES.has(politica.id) ? (
                        <span className="inline-flex rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-text-soft">
                          Permanente
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <p>{politica.modalidades}</p>
                    <p className="mt-1 text-xs opacity-70">{politica.observacao}</p>
                  </td>
                  <td className="px-3 py-3 align-top text-sm">{politica.periodo}</td>
                  <td className="px-3 py-3 align-top">
                    <a
                      href={politica.fonteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline underline-offset-2 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      {politica.fonteNome}
                    </a>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={`inline-flex rounded-full border px-1.5 py-0.5 text-xs font-semibold ${classeFonte(politica)}`}
                      >
                        {rotuloFonte(politica)}
                      </span>
                      <span className="opacity-70">{formatarData(politica.fonteData)}</span>
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
