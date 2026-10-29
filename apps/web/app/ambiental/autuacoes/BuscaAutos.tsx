"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GraficoBarrasSvg from "@/app/components/GraficoBarrasSvg";
import { formatCurrencyBRL } from "@/lib/betim/format";
import type { ResultadoBusca } from "@/lib/ambiental/autos-recentes";
import ItemAuto from "./ItemAuto";

/**
 * Busca e detalhe dos autos de infração 2024–2026 (Sisema/SEMAD-MG).
 *
 * ⚠️ POR QUE CLIENTE, E NÃO SERVIDOR
 * O filtro roda em `/api/autos/recentes`, que lê os 36 mil registros no
 * servidor e devolve 20 por página. Este componente só guarda o filtro e a
 * página atual — o arquivo grande nunca entra no bundle do navegador.
 *
 * ⚠️ O QUE A TELA NÃO PROMETE
 * - Empresa e medidas (embargo, reflorestamento) não existem nesta fonte;
 *   aparecem no recorte histórico do CAP.
 * - O painel do Sisema não tem link por auto: o "ver detalhes" mostra os
 *   metadados que a fonte publica e aponta para o painel.
 */
interface Props {
  municipios: string[];
  situacoes: string[];
  anos: string[];
  fonteUrl: string;
  totalGeral: number;
}

type CampoFiltro = "municipio" | "ano" | "situacao" | "valorMin" | "valorMax" | "numero";

interface ValoresFiltro {
  municipio: string;
  ano: string;
  situacao: string;
  valorMin: string;
  valorMax: string;
  numero: string;
}

const VAZIO: ValoresFiltro = {
  municipio: "",
  ano: "",
  situacao: "",
  valorMin: "",
  valorMax: "",
  numero: "",
};

const PAGINA_INICIAL: ResultadoBusca = {
  total: 0,
  valorTotal: 0,
  pagina: 1,
  paginas: 1,
  porAno: [],
  itens: [],
};

function montarParametros(filtro: ValoresFiltro, pagina: number): string {
  const pares: Array<[string, string]> = [
    ["municipio", filtro.municipio.trim()],
    ["ano", filtro.ano],
    ["situacao", filtro.situacao],
    ["valorMin", filtro.valorMin.trim()],
    ["valorMax", filtro.valorMax.trim()],
    ["q", filtro.numero.trim()],
  ];
  const p = new URLSearchParams();
  for (const [chave, valor] of pares) {
    if (valor) p.set(chave, valor);
  }
  p.set("pagina", String(pagina));
  return p.toString();
}

async function consultarApi(consulta: string, signal: AbortSignal): Promise<ResultadoBusca> {
  const resposta = await fetch(`/api/autos/recentes?${consulta}`, { signal, cache: "no-store" });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return (await resposta.json()) as ResultadoBusca;
}

function textoResumo(
  estado: { carregando: boolean; erro: string | null; resultado: ResultadoBusca; totalGeral: number },
  filtroAtivo: boolean
): string | null {
  if (estado.carregando) return "Carregando autos…";
  if (estado.erro) return null;
  const autos = `${estado.resultado.total.toLocaleString("pt-BR")} ${estado.resultado.total === 1 ? "auto" : "autos"}`;
  const valor = `${formatCurrencyBRL(estado.resultado.valorTotal)} em multa lavrada`;
  const janela = filtroAtivo ? "" : ` de ${estado.totalGeral.toLocaleString("pt-BR")} na janela 2024–2026`;
  return `${autos} · ${valor}${janela}`;
}

function temFiltro(filtro: ValoresFiltro): boolean {
  return Object.values(filtro).some((valor) => valor.trim() !== "");
}

export default function BuscaAutos({ municipios, situacoes, anos, fonteUrl, totalGeral }: Props) {
  const [filtro, setFiltro] = useState<ValoresFiltro>(VAZIO);
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<ResultadoBusca>(PAGINA_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const parametros = useMemo(() => montarParametros(filtro, pagina), [filtro, pagina]);

  const carregar = useCallback(async (consulta: string) => {
    abort.current?.abort();
    const controlador = new AbortController();
    abort.current = controlador;
    setCarregando(true);
    setErro(null);
    try {
      setResultado(await consultarApi(consulta, controlador.signal));
    } catch (falha) {
      if ((falha as Error).name !== "AbortError") setErro("Não foi possível carregar os autos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => carregar(parametros), 250);
    return () => clearTimeout(timer);
  }, [parametros, carregar]);

  function mudar(campo: CampoFiltro, valor: string) {
    setFiltro((atual) => ({ ...atual, [campo]: valor }));
    setPagina(1);
    setAberto(null);
  }

  function limpar() {
    setFiltro(VAZIO);
    setPagina(1);
    setAberto(null);
  }

  const resumo = textoResumo({ carregando, erro, resultado, totalGeral }, temFiltro(filtro));

  return (
    <section aria-label="Busca de autos de infração" className="space-y-6">
      <FiltrosAutos
        filtro={filtro}
        municipios={municipios}
        situacoes={situacoes}
        anos={anos}
        onMudar={mudar}
        onLimpar={limpar}
      />

      <div aria-live="polite" className="text-base text-text-soft">
        {erro ? <span className="text-alert">{erro}</span> : resumo}
      </div>

      {resultado.porAno.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <GraficoBarrasSvg
            itens={resultado.porAno}
            titulo="Autos por ano"
            subtitulo="O filtro atual, ano a ano"
            descricaoAcessivel="Quantidade de autos de infração por ano no filtro atual."
            orientacao="vertical"
            altura={220}
            largura={420}
          />
        </div>
      )}

      <ListaAutos
        resultado={resultado}
        carregando={carregando}
        erro={erro}
        aberto={aberto}
        fonteUrl={fonteUrl}
        onToggle={(id) => setAberto(aberto === id ? null : id)}
        onPagina={setPagina}
      />
    </section>
  );
}

function FiltrosAutos({
  filtro,
  municipios,
  situacoes,
  anos,
  onMudar,
  onLimpar,
}: {
  filtro: ValoresFiltro;
  municipios: string[];
  situacoes: string[];
  anos: string[];
  onMudar: (campo: CampoFiltro, valor: string) => void;
  onLimpar: () => void;
}) {
  const campo = "rounded-lg border border-border bg-surface-2 px-3 py-2 text-base text-text";
  return (
    <form
      className="grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="flex flex-col gap-1 text-sm font-medium text-text">
        Município
        <input
          list="lista-municipios"
          value={filtro.municipio}
          onChange={(e) => onMudar("municipio", e.target.value)}
          placeholder="Ex.: Betim"
          className={campo}
        />
        <datalist id="lista-municipios">
          {municipios.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-text">
        Ano
        <select value={filtro.ano} onChange={(e) => onMudar("ano", e.target.value)} className={campo}>
          <option value="">Todos os anos</option>
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-text">
        Situação do processo
        <select
          value={filtro.situacao}
          onChange={(e) => onMudar("situacao", e.target.value)}
          className={campo}
        >
          <option value="">Todas</option>
          {situacoes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-text">
        Valor mínimo (R$)
        <input
          inputMode="decimal"
          value={filtro.valorMin}
          onChange={(e) => onMudar("valorMin", e.target.value)}
          placeholder="0"
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-text">
        Valor máximo (R$)
        <input
          inputMode="decimal"
          value={filtro.valorMax}
          onChange={(e) => onMudar("valorMax", e.target.value)}
          placeholder="Sem teto"
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-text">
        Número do auto
        <input
          inputMode="numeric"
          value={filtro.numero}
          onChange={(e) => onMudar("numero", e.target.value)}
          placeholder="Ex.: 316253"
          className={campo}
        />
      </label>

      <div className="flex items-end">
        <button
          type="button"
          onClick={onLimpar}
          className="rounded-lg border border-border px-4 py-2 text-base text-text-soft hover:text-text"
        >
          Limpar filtros
        </button>
      </div>
    </form>
  );
}

function deveMostrarVazio(
  resultado: ResultadoBusca,
  carregando: boolean,
  erro: string | null
): boolean {
  if (carregando) return false;
  if (erro) return false;
  return resultado.total === 0;
}

function ListaAutos({
  resultado,
  carregando,
  erro,
  aberto,
  fonteUrl,
  onToggle,
  onPagina,
}: {
  resultado: ResultadoBusca;
  carregando: boolean;
  erro: string | null;
  aberto: string | null;
  fonteUrl: string;
  onToggle: (id: string) => void;
  onPagina: (pagina: number) => void;
}) {
  if (deveMostrarVazio(resultado, carregando, erro)) {
    return (
      <p className="rounded-xl border border-border bg-surface-2 p-4 text-base text-text-soft">
        Nenhum auto encontrado com esses filtros. Tente outro município, ano ou faixa de valor.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {resultado.itens.map((auto) => (
          <ItemAuto
            key={auto.a}
            auto={auto}
            aberto={aberto === auto.a}
            fonteUrl={fonteUrl}
            onToggle={() => onToggle(auto.a)}
          />
        ))}
      </ul>

      {resultado.paginas > 1 && (
        <nav
          className="flex flex-wrap items-center justify-between gap-3 text-base"
          aria-label="Paginação"
        >
          <button
            type="button"
            disabled={resultado.pagina <= 1}
            onClick={() => onPagina(resultado.pagina - 1)}
            className="rounded-lg border border-border px-4 py-2 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-text-soft">
            Página {resultado.pagina} de {resultado.paginas}
          </span>
          <button
            type="button"
            disabled={resultado.pagina >= resultado.paginas}
            onClick={() => onPagina(resultado.pagina + 1)}
            className="rounded-lg border border-border px-4 py-2 disabled:opacity-40"
          >
            Próxima →
          </button>
        </nav>
      )}
    </>
  );
}
