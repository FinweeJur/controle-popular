"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import {
  filtrarEstudos,
  opcoesDeFiltro,
  REPOSITORIO_LABEL,
  CLASSE_ESTUDO_LABEL,
  ESTADO_LINK_LABEL,
  ESTADOS_QUEBRADOS,
  type EstudoLinha,
  type FiltroEstudos,
} from "@/lib/ambiental/estudos";
import { formatDateBR } from "@/lib/betim/format";

/**
 * Tabela de `/ambiental/estudos` — mesmo mecanismo de índice fatiado das
 * outras nove listas do território (molde: `ListaContratos.tsx`, nove
 * filtros no slot `controles` + predicado `filtrar`). O filtro em si NÃO é
 * reimplementado aqui: `filtrar` chama `filtrarEstudos` de
 * `lib/ambiental/estudos.ts`, e as opções de cada `<select>` vêm de
 * `opcoesDeFiltro(linhas)` — nunca uma lista fixa, porque município e
 * repositório mudam a cada coleta.
 *
 * ═══ POR QUE `filtrar` SÓ RECEBE `linha`, E `FiltroEstudos` USA ESTADO ═══
 *
 * `TabelaEstatica.filtrar` é `(linha: T) => boolean`, sem acesso ao estado do
 * componente por parâmetro — por isso o predicado fecha sobre o `FiltroEstudos`
 * atual via `useCallback`. `busca` (texto livre) fica de FORA desse objeto e
 * vai para `camposBusca`/estado interno da própria `TabelaEstatica`: ela já
 * resolve busca por texto (com o mesmo `semAcento`), e duplicar isso em
 * `filtrarEstudos({ texto })` seria filtrar duas vezes pelo mesmo campo.
 *
 * ═══ `?municipio=` NA ENTRADA ═══
 *
 * A camada do globo (`public/terras/globo/js/ui/rotulos.js`) linka para
 * `/ambiental/estudos?municipio=<nome>` — esse link só é útil se chegar
 * filtrado. O valor entra bruto do parâmetro (o nome do município como a
 * fonte grava, sem normalização): se não bater com nenhum valor de
 * `opcoesDeFiltro().municipios`, o `<select>` simplesmente não marca nenhuma
 * opção e a tabela mostra tudo — falha visível, não filtro fantasma.
 */

type LinhaEstudo = EstudoLinha & Record<string, unknown>;

const CAMPOS_BUSCA: (keyof LinhaEstudo & string)[] = [
  "empreendimento",
  "municipio",
  "nome_arquivo",
  "processo",
];

/** Aviso de link quebrado — texto, não só cor (o estado "quebrado" não pode
 *  depender de um leitor distinguir vermelho de cinza). `ESTADO_LINK_LABEL`
 *  vem do mesmo mapa que a fonte usa para rotular o resultado do teste de
 *  acesso; `ESTADOS_QUEBRADOS` decide quando este aviso aparece. Sem data
 *  fixa no texto: a data da checagem é `geradoEm`, mostrada uma vez no
 *  rodapé de `page.tsx`, não repetida em cada linha. */
function AvisoLinkQuebrado({ linha }: { linha: LinhaEstudo }) {
  if (!ESTADOS_QUEBRADOS.has(linha.link_estado)) return null;
  return (
    <span className="block text-xs font-medium text-alert">
      ⚠ {ESTADO_LINK_LABEL[linha.link_estado] ?? "link quebrado"} na última checagem
    </span>
  );
}

/** Repositório sem `nome_arquivo` enumerável: a célula "Documento" não finge
 *  que há um arquivo para clicar — mostra o rótulo do repositório e linka
 *  para lá, deixando claro que é pasta/página, não o documento em si. */
function CelulaDocumento({ linha }: { linha: LinhaEstudo }) {
  if (linha.nome_arquivo && linha.url) {
    return (
      <div className="flex flex-col gap-0.5">
        <a
          href={linha.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-2"
        >
          {linha.nome_arquivo} ↗
        </a>
        <AvisoLinkQuebrado linha={linha} />
      </div>
    );
  }
  const rotulo = linha.repositorio_rotulo || REPOSITORIO_LABEL[linha.repositorio] || "repositório";
  const alvo = linha.url || linha.link_repositorio;
  if (alvo) {
    return (
      <div className="flex flex-col gap-0.5">
        <a
          href={alvo}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-soft underline decoration-dotted underline-offset-2"
        >
          Abrir pasta no {rotulo} ↗
        </a>
        <AvisoLinkQuebrado linha={linha} />
      </div>
    );
  }
  return <span className="text-text-soft">— sem link publicado</span>;
}

const COLUNAS: ColunaTabela<LinhaEstudo>[] = [
  { chave: "classe", rotulo: "Classe", numerica: true, largura: "w-[60px]" },
  {
    chave: "classe_estudo_rotulo",
    rotulo: "Tipo",
    formatar: (l) => l.classe_estudo_rotulo || CLASSE_ESTUDO_LABEL[l.classe_estudo ?? ""] || "—",
    largura: "w-[80px]",
  },
  { chave: "municipio", rotulo: "Município", largura: "w-[120px]" },
  {
    chave: "data_publicacao_iso",
    rotulo: "Publicação",
    ordenavel: true,
    tipoOrdenacao: "data",
    formatar: (l) => (l.data_publicacao_iso ? formatDateBR(l.data_publicacao_iso) : l.data_publicacao || "—"),
    largura: "w-[100px]",
  },
  { chave: "empreendimento", rotulo: "Empreendimento" },
  {
    chave: "nome_arquivo",
    rotulo: "Documento",
    formatar: (l) => <CelulaDocumento linha={l} />,
  },
  { chave: "modalidade", rotulo: "Modalidade" },
  {
    chave: "unidade_regional",
    rotulo: "Un. Regional",
    formatar: (l) => {
      const texto = l.unidade_regional || "—";
      const curto = texto.replace(/^Unidade Regional de /, "UR ").replace(/^Unidade Regional do /, "UR ");
      return <span className="block max-w-[180px] truncate" title={texto}>{curto}</span>;
    },
  },
  {
    chave: "data_limite_iso",
    rotulo: "Prazo audiência",
    ordenavel: true,
    tipoOrdenacao: "data",
    formatar: (l) => (l.data_limite_iso ? formatDateBR(l.data_limite_iso) : l.data_limite || "—"),
    largura: "w-[110px]",
  },
  {
    chave: "repositorio_rotulo",
    rotulo: "Arquivo",
    formatar: (l) => (
      <span className="whitespace-nowrap">
        {l.repositorio_rotulo || REPOSITORIO_LABEL[l.repositorio] || "—"}
      </span>
    ),
    largura: "w-[100px]",
  },
  {
    chave: "link_ficha",
    rotulo: "Ficha",
    ordenavel: false,
    formatar: (l) => (
      <a
        href={l.link_ficha}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 whitespace-nowrap"
      >
        Ficha ↗
      </a>
    ),
    largura: "w-[70px]",
  },
];

export default function BuscaEstudos({ base }: { base: string }) {
  const [municipio, setMunicipio] = useState("");
  const [unidadeRegional, setUnidadeRegional] = useState("");
  const [classe, setClasse] = useState("");
  const [classeEstudo, setClasseEstudo] = useState("");
  const [repositorio, setRepositorio] = useState("");
  const [ano, setAno] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [somenteComArquivo, setSomenteComArquivo] = useState(false);
  // "Só os de link quebrado" nao e' um filtro a mais: e' a lista que virou
  // pedido de acesso a informacao (235 estudos, 144 municipios, medido em
  // 20/08/2026). Deixar isso so como aviso por linha obrigaria a pessoa a
  // paginar 2.415 linhas para montar a mesma lista a mao.
  const [somenteQuebrado, setSomenteQuebrado] = useState(false);
  const primeiraRenderizacao = useRef(true);

  // Estado inicial vindo da URL, uma vez, depois da hidratação — mesmo
  // contrato de `TabelaEstatica` (sem `useSearchParams()`, proibido nesta
  // rota porque o alvo é `output: 'export'`; ver o cabeçalho daquele
  // componente). `?municipio=` é o parâmetro que a camada do globo usa.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
// eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de window.location/sessionStorage: useSearchParams quebra o output:'export' (padrao documentado em TabelaEstatica.tsx)
    setMunicipio(sp.get("municipio") ?? "");
    setUnidadeRegional(sp.get("regional") ?? "");
    setClasse(sp.get("classe") ?? "");
    setClasseEstudo(sp.get("tipo") ?? "");
    setRepositorio(sp.get("repositorio") ?? "");
    setAno(sp.get("ano") ?? "");
    setModalidade(sp.get("modalidade") ?? "");
    setSomenteComArquivo(sp.get("com_arquivo") === "1");
    setSomenteQuebrado(sp.get("quebrado") === "1");
  }, []);

  // Espelha de volta na URL, sem entrar no histórico — o link continua
  // compartilhável mesmo sem o hook do roteador.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (municipio) {
      sp.set("municipio", municipio);
    } else {
      sp.delete("municipio");
    }
    if (unidadeRegional) {
      sp.set("regional", unidadeRegional);
    } else {
      sp.delete("regional");
    }
    if (classe) {
      sp.set("classe", classe);
    } else {
      sp.delete("classe");
    }
    if (classeEstudo) {
      sp.set("tipo", classeEstudo);
    } else {
      sp.delete("tipo");
    }
    if (repositorio) {
      sp.set("repositorio", repositorio);
    } else {
      sp.delete("repositorio");
    }
    if (ano) {
      sp.set("ano", ano);
    } else {
      sp.delete("ano");
    }
    if (modalidade) {
      sp.set("modalidade", modalidade);
    } else {
      sp.delete("modalidade");
    }
    if (somenteComArquivo) {
      sp.set("com_arquivo", "1");
    } else {
      sp.delete("com_arquivo");
    }
    if (somenteQuebrado) {
      sp.set("quebrado", "1");
    } else {
      sp.delete("quebrado");
    }
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [municipio, unidadeRegional, classe, classeEstudo, repositorio, ano, modalidade, somenteComArquivo, somenteQuebrado]);

  // `filtrarEstudos` é a MESMA função testada em `lib/ambiental/estudos.test.ts`
  // — este predicado não reimplementa regra nenhuma, só monta o `FiltroEstudos`
  // a partir do estado local. `useCallback` não é cosmético: `TabelaEstatica`
  // põe isto numa dependência de `useMemo` (ver o cabeçalho daquele arquivo).
  const filtrar = useCallback(
    (linha: LinhaEstudo) => {
      const filtro: FiltroEstudos = {
        municipio: municipio || undefined,
        unidadeRegional: unidadeRegional || undefined,
        classe: classe ? Number(classe) : undefined,
        classeEstudo: classeEstudo || undefined,
        repositorio: repositorio || undefined,
        ano: ano ? Number(ano) : undefined,
        modalidade: modalidade || undefined,
        somenteComArquivo: somenteComArquivo || undefined,
        somenteLinkQuebrado: somenteQuebrado || undefined,
      };
      return filtrarEstudos([linha], filtro).length > 0;
    },
    [municipio, unidadeRegional, classe, classeEstudo, repositorio, ano, modalidade, somenteComArquivo, somenteQuebrado]
  );

  const temFiltro = Boolean(
    municipio ||
      unidadeRegional ||
      classe ||
      classeEstudo ||
      repositorio ||
      ano ||
      modalidade ||
      somenteComArquivo ||
      somenteQuebrado
  );

  const limparFiltros = () => {
    setMunicipio("");
    setUnidadeRegional("");
    setClasse("");
    setClasseEstudo("");
    setRepositorio("");
    setAno("");
    setModalidade("");
    setSomenteComArquivo(false);
    setSomenteQuebrado(false);
  };

  return (
    <TabelaEstatica<LinhaEstudo>
      base={base}
      colunas={COLUNAS}
      camposBusca={CAMPOS_BUSCA}
      vazio="Nenhum estudo encontrado."
      filtrar={filtrar}
      controles={({ linhas }) => {
        const opcoes = opcoesDeFiltro(linhas);
        return (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-4">
            <div className="flex flex-col">
              <label htmlFor="f-municipio" className="mb-1 text-xs font-medium opacity-75">
                Município
              </label>
              <select
                id="f-municipio"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                className="w-56 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-bg)] px-3 py-1.5 text-sm"
              >
                <option value="">Todos</option>
                {opcoes.municipios.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="f-regional" className="mb-1 text-xs font-medium opacity-75">
                Unidade regional
              </label>
              <select
                id="f-regional"
                value={unidadeRegional}
                onChange={(e) => setUnidadeRegional(e.target.value)}
                className="w-56 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-bg)] px-3 py-1.5 text-sm"
              >
                <option value="">Todas</option>
                {opcoes.unidadesRegionais.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="f-classe" className="mb-1 text-xs font-medium opacity-75">
                Classe
              </label>
              <select
                id="f-classe"
                value={classe}
                onChange={(e) => setClasse(e.target.value)}
                className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-bg)] px-3 py-1.5 text-sm"
              >
                <option value="">Todas</option>
                {opcoes.classes.map((c) => (
                  <option key={c} value={String(c)}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="f-tipo" className="mb-1 text-xs font-medium opacity-75">
                Tipo de documento
              </label>
              <select
                id="f-tipo"
                value={classeEstudo}
                onChange={(e) => setClasseEstudo(e.target.value)}
                className="w-40 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-bg)] px-3 py-1.5 text-sm"
              >
                <option value="">Todos</option>
                {opcoes.classesEstudo.map((c) => (
                  <option key={c} value={c}>
                    {CLASSE_ESTUDO_LABEL[c] ?? c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="f-repositorio" className="mb-1 text-xs font-medium opacity-75">
                Onde está o arquivo
              </label>
              <select
                id="f-repositorio"
                value={repositorio}
                onChange={(e) => setRepositorio(e.target.value)}
                className="w-44 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-bg)] px-3 py-1.5 text-sm"
              >
                <option value="">Todos</option>
                {opcoes.repositorios.map((r) => (
                  <option key={r} value={r}>
                    {REPOSITORIO_LABEL[r] ?? r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="f-ano" className="mb-1 text-xs font-medium opacity-75">
                Ano
              </label>
              <select
                id="f-ano"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-bg)] px-3 py-1.5 text-sm"
              >
                <option value="">Todos</option>
                {opcoes.anos.map((a) => (
                  <option key={a} value={String(a)}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="f-modalidade" className="mb-1 text-xs font-medium opacity-75">
                Modalidade
              </label>
              <select
                id="f-modalidade"
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value)}
                className="w-56 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-bg)] px-3 py-1.5 text-sm"
              >
                <option value="">Todas</option>
                {opcoes.modalidades.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={somenteComArquivo}
                onChange={(e) => setSomenteComArquivo(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--cp-border)]"
              />
              Só o que dá para abrir
            </label>

            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={somenteQuebrado}
                onChange={(e) => setSomenteQuebrado(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--cp-border)]"
              />
              Só os de link quebrado
            </label>

            {temFiltro && (
              <button
                type="button"
                onClick={limparFiltros}
                className="rounded-lg border border-[var(--cp-border)] px-3 py-1.5 text-sm underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Limpar filtros
              </button>
            )}
          </div>
        );
      }}
    />
  );
}
