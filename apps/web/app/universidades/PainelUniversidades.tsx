"use client";

/**
 * @file apps/web/app/universidades/PainelUniversidades.tsx
 * @description Painel de busca do índice de pesquisa e extensão universitária.
 *
 * Papel no portal: filtrar, no navegador, grupos de pesquisa e projetos de
 * extensão por nome, líder, área temática, grande área, estado, instituição e
 * faculdade. O filtro roda no cliente porque o portal é export estático —
 * ler `searchParams` no servidor quebraria o alvo Cloudflare.
 *
 * Régua (QUALIDADES-DA-INFORMACAO.md):
 * 2. busca tolerante a acento e filtros reais;
 * 3. ordenação por nome;
 * 4. contagem visível do que está filtrado;
 * 6. CSV do que está na tela, com `;` e BOM UTF-8, e impressão nativa;
 * 7. layout de 390 px sem rolagem lateral;
 * 8. data da fonte visível em cada cartão.
 *
 * Contatos: o cartão mostra o contato do grupo quando a fonte publica; senão,
 * o contato institucional, sempre rotulado. Nada é deduzido do líder.
 */

import { useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  Filter,
  Globe,
  AtSign,
  Mail,
  Phone,
  RotateCcw,
  Search,
} from "lucide-react";
import { semAcento } from "@/lib/busca/normalizar";
import type {
  Contato,
  GrupoPesquisa,
  Instituicao,
  ProjetoExtensao,
  Unidade,
} from "@/lib/universidades/tipos";
import { nomeDoTema } from "@/lib/universidades/temas";
import {
  cruzarTemasPorUf,
  proximoFiltro,
  resumirPorData,
  resumirPorLocal,
  type RegistroCruzamento,
} from "@/lib/universidades/cruzamento";
import {
  anosDoAcervo,
  areasConhecimentoDoAcervo,
  areasDoAcervo,
  filtrarGrupos,
  filtrarProjetos,
  temFiltroAtivo,
  temasDoAcervo,
  unidadesDoPainel,
} from "@/lib/universidades/filtros";
import CruzamentoUniversidades from "./CruzamentoUniversidades";

export interface PainelUniversidadesProps {
  instituicoes: Instituicao[];
  unidades: Unidade[];
  grupos: GrupoPesquisa[];
  projetos: ProjetoExtensao[];
  verificadoEm: string;
  /** Quando definido, a página é de uma instituição só. */
  instituicaoFixa?: string;
}

type TipoFiltro = "todos" | "pesquisa" | "extensao";

const POR_PAGINA = 24;

function dataBr(iso: string): string {
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

function contatoDoRegistro(
  registro: { contatos?: Contato; instituicao: string },
  instituicoes: Instituicao[],
): { contato: Contato | undefined; institucional: boolean } {
  if (registro.contatos) return { contato: registro.contatos, institucional: false };
  const inst = instituicoes.find(
    (i) => i.sigla.toUpperCase() === registro.instituicao.toUpperCase(),
  );
  return { contato: inst?.contatos, institucional: true };
}

export default function PainelUniversidades({
  instituicoes,
  unidades,
  grupos,
  projetos,
  verificadoEm,
  instituicaoFixa,
}: PainelUniversidadesProps) {
  const [busca, setBusca] = useState("");
  const [uf, setUf] = useState("");
  const [instituicao, setInstituicao] = useState(instituicaoFixa ?? "");
  const [unidade, setUnidade] = useState("");
  const [area, setArea] = useState("");
  const [areaConhecimento, setAreaConhecimento] = useState("");
  const [tema, setTema] = useState("");
  const [tipo, setTipo] = useState<TipoFiltro>("todos");
  const [ano, setAno] = useState("");
  const [pagina, setPagina] = useState(1);
  const [paginaProjetos, setPaginaProjetos] = useState(1);

  const instituicoesDisponiveis = useMemo(() => {
    const lista = instituicaoFixa
      ? instituicoes.filter(
          (i) => i.sigla.toUpperCase() === instituicaoFixa.toUpperCase(),
        )
      : instituicoes;
    return [...lista].sort((a, b) => a.sigla.localeCompare(b.sigla, "pt-BR"));
  }, [instituicoes, instituicaoFixa]);

  const ufsDisponiveis = useMemo(
    () => [...new Set(instituicoesDisponiveis.map((i) => i.uf))].sort(),
    [instituicoesDisponiveis],
  );

  const unidadesDisponiveis = useMemo(
    () => unidadesDoPainel(unidades, grupos, instituicao),
    [unidades, grupos, instituicao],
  );

  const areasDisponiveis = useMemo(() => areasDoAcervo(grupos), [grupos]);

  const areasConhecimentoDisponiveis = useMemo(
    () => areasConhecimentoDoAcervo(grupos),
    [grupos],
  );

  const temasDisponiveis = useMemo(
    () => temasDoAcervo(grupos, projetos),
    [grupos, projetos],
  );

  const anosDisponiveis = useMemo(
    () => anosDoAcervo(grupos, projetos),
    [grupos, projetos],
  );

  const termos = useMemo(
    () =>
      semAcento(busca)
        .split(/\s+/)
        .filter(Boolean),
    [busca],
  );

  const instituicoesPorSigla = useMemo(
    () => new Map(instituicoes.map((i) => [i.sigla.toUpperCase(), i])),
    [instituicoes],
  );

  const gruposFiltrados = useMemo(() => {
    if (tipo === "extensao") return [];
    return filtrarGrupos(grupos, {
      instituicao,
      uf,
      unidade,
      area,
      areaConhecimento,
      tema,
      ano,
      termos,
      instituicoesPorSigla,
    });
  }, [
    grupos,
    tipo,
    instituicao,
    uf,
    unidade,
    area,
    areaConhecimento,
    tema,
    ano,
    termos,
    instituicoesPorSigla,
  ]);

  const projetosFiltrados = useMemo(() => {
    if (tipo === "pesquisa") return [];
    return filtrarProjetos(projetos, {
      instituicao,
      uf,
      unidade,
      area,
      areaConhecimento,
      tema,
      ano,
      termos,
      instituicoesPorSigla,
    });
  }, [
    projetos,
    tipo,
    instituicao,
    uf,
    unidade,
    area,
    areaConhecimento,
    tema,
    ano,
    termos,
    instituicoesPorSigla,
  ]);

  /**
   * Registros achatados para o cruzamento. Saem das listas JÁ filtradas: o
   * mapa acompanha o recorte, em vez de contradizer a lista.
   */
  const registrosCruzamento = useMemo<RegistroCruzamento[]>(() => {
    const linhas: RegistroCruzamento[] = [];
    for (const g of gruposFiltrados) {
      const inst = instituicoesPorSigla.get(g.instituicao.toUpperCase());
      linhas.push({
        tipo: "pesquisa",
        instituicao: g.instituicao,
        uf: inst?.uf ?? "—",
        temas: g.areaTematica ?? [],
        ano: String(g.anoReferencia),
      });
    }
    for (const p of projetosFiltrados) {
      const inst = instituicoesPorSigla.get(p.instituicao.toUpperCase());
      linhas.push({
        tipo: "extensao",
        instituicao: p.instituicao,
        uf: inst?.uf ?? "—",
        temas: p.areaTematica ?? [],
        ano: p.inicio?.slice(0, 4) ?? null,
      });
    }
    return linhas;
  }, [gruposFiltrados, projetosFiltrados, instituicoesPorSigla]);

  const temasCruzados = useMemo(
    () => cruzarTemasPorUf(registrosCruzamento, nomeDoTema),
    [registrosCruzamento],
  );
  const locaisCruzados = useMemo(
    () => resumirPorLocal(registrosCruzamento),
    [registrosCruzamento],
  );
  const datasCruzadas = useMemo(
    () => resumirPorData(registrosCruzamento),
    [registrosCruzamento],
  );
  const semTema = useMemo(
    () => registrosCruzamento.filter((r) => r.temas.length === 0).length,
    [registrosCruzamento],
  );

  const totalFiltrado = gruposFiltrados.length + projetosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(gruposFiltrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const gruposDaPagina = gruposFiltrados.slice(inicio, inicio + POR_PAGINA);

  const totalPaginasProjetos = Math.max(
    1,
    Math.ceil(projetosFiltrados.length / POR_PAGINA),
  );
  const paginaAtualProjetos = Math.min(paginaProjetos, totalPaginasProjetos);
  const inicioProjetos = (paginaAtualProjetos - 1) * POR_PAGINA;
  const projetosDaPagina = projetosFiltrados.slice(
    inicioProjetos,
    inicioProjetos + POR_PAGINA,
  );

  const filtroAtivo = temFiltroAtivo({
    busca,
    uf,
    unidade,
    area,
    areaConhecimento,
    tema,
    ano,
    tipo,
    instituicao,
    instituicaoFixa,
  });

  function limpar() {
    setBusca("");
    setUf("");
    setInstituicao(instituicaoFixa ?? "");
    setUnidade("");
    setArea("");
    setAreaConhecimento("");
    setTema("");
    setAno("");
    setTipo("todos");
    setPagina(1);
    setPaginaProjetos(1);
  }

  /**
   * Aplica um clique do cruzamento. A regra de liga/desliga mora em
   * `proximoFiltro`, testada à parte; aqui só sobe o estado e rola a tela.
   */
  function aplicarCruzamento(patch: { tema?: string; uf?: string; ano?: string }) {
    const proximo = proximoFiltro({ tema, uf, ano }, patch);
    setTema(proximo.tema);
    setUf(proximo.uf);
    setAno(proximo.ano);
    setPagina(1);
    setPaginaProjetos(1);

    // O mapa fica acima da lista; sem o empurrão o clique parece não fazer nada.
    requestAnimationFrame(() => {
      document
        .getElementById("lista-universidades")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function exportarCsv() {
    const cab = [
      "tipo",
      "nome",
      "lider_ou_coordenador",
      "ano",
      "inicio",
      "fim",
      "area",
      "area_conhecimento",
      "temas",
      "tematica_fonte",
      "instituicao",
      "uf",
      "unidade",
      "fonte",
      "data_acesso",
    ];
    const linhas: string[][] = [];
    for (const g of gruposFiltrados) {
      const inst = instituicoesPorSigla.get(g.instituicao.toUpperCase());
      linhas.push([
        "pesquisa",
        g.nome,
        g.lider,
        String(g.anoReferencia),
        "",
        "",
        g.area,
        g.areaConhecimento ?? "",
        (g.areaTematica ?? []).map(nomeDoTema).join(" | "),
        "",
        g.instituicao,
        inst?.uf ?? "",
        g.unidade ?? "",
        g.fonteUrl,
        g.dataAcesso,
      ]);
    }
    for (const p of projetosFiltrados) {
      const inst = instituicoesPorSigla.get(p.instituicao.toUpperCase());
      linhas.push([
        "extensao",
        p.nome,
        p.coordenador ?? "",
        p.inicio?.slice(0, 4) ?? "",
        p.inicio ?? "",
        p.fim ?? "",
        p.area ?? "",
        p.areaConhecimento ?? "",
        (p.areaTematica ?? []).map(nomeDoTema).join(" | "),
        p.areaTematicaFonte ?? "",
        p.instituicao,
        inst?.uf ?? "",
        p.unidade ?? "",
        p.url,
        p.dataAcesso,
      ]);
    }
    const csv =
      "\uFEFF" +
      [cab, ...linhas]
        .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
        .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "universidades-pesquisa-extensao.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectCls =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <section aria-label="Busca no índice universitário" className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
          <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
          Filtros
          {filtroAtivo && (
            <button
              type="button"
              onClick={limpar}
              className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-text-soft hover:text-text"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Limpar
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="relative block sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block text-xs font-medium text-text-soft">
              Buscar por nome, líder, área ou instituição
            </span>
            <Search
              className="pointer-events-none absolute left-3 top-[2.15rem] h-4 w-4 text-text-soft"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Ex.: agroecologia, saúde coletiva, UFVJM, Diamantina"
              className={`${selectCls} pl-9`}
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">Estado</span>
            <select
              value={uf}
              onChange={(e) => {
                setUf(e.target.value);
                setPagina(1);
              }}
              className={selectCls}
              disabled={Boolean(instituicaoFixa)}
            >
              <option value="">Todos</option>
              {ufsDisponiveis.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          {!instituicaoFixa && (
            <label>
              <span className="mb-1 block text-xs font-medium text-text-soft">
                Instituição
              </span>
              <select
                value={instituicao}
                onChange={(e) => {
                  setInstituicao(e.target.value);
                  setUnidade("");
                  setPagina(1);
                }}
                className={selectCls}
              >
                <option value="">Todas</option>
                {instituicoesDisponiveis.map((i) => (
                  <option key={i.sigla} value={i.sigla}>
                    {i.sigla} — {i.nome}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">
              Faculdade / unidade
            </span>
            <select
              value={unidade}
              onChange={(e) => {
                setUnidade(e.target.value);
                setPagina(1);
              }}
              className={selectCls}
              disabled={!unidadesDisponiveis.length}
            >
              <option value="">
                {unidadesDisponiveis.length ? "Todas" : "Não informada na fonte"}
              </option>
              {unidadesDisponiveis.map((u) => (
                <option key={`${u.instituicao}-${u.sigla}`} value={u.sigla}>
                  {u.sigla} — {u.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">
              Área do conhecimento
            </span>
            <select
              value={areaConhecimento}
              onChange={(e) => {
                setAreaConhecimento(e.target.value);
                setPagina(1);
              }}
              className={selectCls}
            >
              <option value="">Todas</option>
              {areasConhecimentoDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">
              Área temática
            </span>
            <select
              value={tema}
              onChange={(e) => {
                setTema(e.target.value);
                setPagina(1);
              }}
              className={selectCls}
            >
              <option value="">Todas</option>
              {temasDisponiveis.map((t) => (
                <option key={t} value={t}>
                  {nomeDoTema(t)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">
              Área predominante
            </span>
            <select
              value={area}
              onChange={(e) => {
                setArea(e.target.value);
                setPagina(1);
              }}
              className={selectCls}
            >
              <option value="">Todas</option>
              {areasDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">Tipo</span>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as TipoFiltro);
                setPagina(1);
                setPaginaProjetos(1);
              }}
              className={selectCls}
            >
              <option value="todos">Pesquisa e extensão</option>
              <option value="pesquisa">Só pesquisa</option>
              <option value="extensao">Só extensão</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">
              Ano (relatório do grupo ou início do projeto)
            </span>
            <select
              value={ano}
              onChange={(e) => {
                setAno(e.target.value);
                setPagina(1);
                setPaginaProjetos(1);
              }}
              className={selectCls}
            >
              <option value="">Todos</option>
              {anosDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-text-soft">
          Área temática é classificação editorial derivada do nome e da área
          declarada — não substitui a área oficial da fonte.
        </p>
      </div>

      <CruzamentoUniversidades
        temas={temasCruzados}
        locais={locaisCruzados}
        datas={datasCruzadas}
        temaAtivo={tema}
        ufAtiva={uf}
        anoAtivo={ano}
        semTema={semTema}
        onFiltrar={aplicarCruzamento}
      />

      <ResumoContagem
        total={totalFiltrado}
        grupos={gruposFiltrados.length}
        projetos={projetosFiltrados.length}
        verificadoEm={verificadoEm}
        onExportar={exportarCsv}
      />

      <SecaoCatalogo
        id="grupos-pesquisa"
        titulo="Grupos de pesquisa e de estudo"
        descricao="O DGP/CNPq registra grupos de pesquisa; muitos se organizam como grupo de estudo. O nome e o líder aparecem como a fonte publica."
        rotuloPaginacao="Paginação dos grupos de pesquisa"
        tipo="grupo"
        itens={gruposDaPagina}
        total={gruposFiltrados.length}
        pagina={paginaAtual}
        totalPaginas={totalPaginas}
        onPagina={setPagina}
        instituicoes={instituicoes}
        instituicoesPorSigla={instituicoesPorSigla}
      />

      <SecaoCatalogo
        id="projetos-extensao"
        titulo="Projetos de extensão"
        descricao="Projetos com página pública na plataforma da instituição. O SIEXC/UFVJM publica coordenador, área, linha e período; o contato do projeto cai no canal institucional, sempre rotulado."
        rotuloPaginacao="Paginação dos projetos de extensão"
        tipo="projeto"
        itens={projetosDaPagina}
        total={projetosFiltrados.length}
        pagina={paginaAtualProjetos}
        totalPaginas={totalPaginasProjetos}
        onPagina={setPaginaProjetos}
        instituicoes={instituicoes}
        instituicoesPorSigla={instituicoesPorSigla}
      />

      {totalFiltrado === 0 && (
        <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-soft">
          Nenhum registro encontrado com esses filtros.{" "}
          <button
            type="button"
            onClick={limpar}
            className="font-semibold text-primary hover:underline"
          >
            Limpar filtros
          </button>
        </p>
      )}
    </section>
  );
}

function ContatosBloco({
  contato,
  institucional,
}: {
  contato: Contato | undefined;
  institucional: boolean;
}) {
  if (!contato) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-soft">
      {institucional && (
        <span className="w-full text-xs uppercase tracking-wide text-text-soft">
          Contato da instituição
        </span>
      )}
      {contato.site && (
        <a
          href={contato.site}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <Globe className="h-3.5 w-3.5" aria-hidden="true" /> Site
        </a>
      )}
      {contato.instagram && (
        <a
          href={contato.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <AtSign className="h-3.5 w-3.5" aria-hidden="true" /> Instagram
        </a>
      )}
      {contato.telefone && (
        <a
          href={`tel:${contato.telefone.replace(/[^\d+]/g, "")}`}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {contato.telefone}
        </a>
      )}
      {contato.email && (
        <a
          href={`mailto:${contato.email}`}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {contato.email}
        </a>
      )}
    </div>
  );
}

/** Contato já resolvido: do registro ou, na falta, o da instituição. */
interface ContatoResolvido {
  contato: Contato | undefined;
  institucional: boolean;
}

/** Cartão de grupo de pesquisa ou de estudo. */
function CartaoGrupo({
  grupo,
  instituicao,
  contato,
}: {
  grupo: GrupoPesquisa;
  instituicao: Instituicao | undefined;
  contato: ContatoResolvido;
}) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold leading-snug text-text">{grupo.nome}</h3>
      <p className="mt-1 text-xs text-text-soft">
        {instituicao?.sigla ?? grupo.instituicao} · {instituicao?.uf ?? ""}
        {grupo.unidade ? ` · ${grupo.unidade}` : ""}
        {grupo.fonteNota ? ` · ${grupo.fonteNota}` : ""}
      </p>
      <p className="mt-1 text-xs text-text-soft">
        <span className="font-medium text-text">Líder:</span> {grupo.lider}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {grupo.area}
        </span>
        {grupo.areaConhecimento && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-soft">
            {grupo.areaConhecimento}
          </span>
        )}
        {(grupo.areaTematica ?? []).slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded-full border border-border px-2 py-0.5 text-xs text-text-soft"
          >
            {nomeDoTema(t)}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-3">
        <ContatosBloco contato={contato.contato} institucional={contato.institucional} />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <a
            href={grupo.fonteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Fonte oficial ({grupo.anoReferencia})
          </a>
          <span className="text-text-soft">
            conferido em {dataBr(grupo.dataAcesso)}
          </span>
        </div>
      </div>
    </article>
  );
}

/** Etiquetas do projeto: área, temática declarada e linha de extensão. */
function BadgesProjeto({ projeto }: { projeto: ProjetoExtensao }) {
  const etiquetas = [
    projeto.area
      ? { chave: "area", texto: projeto.area, destaque: true }
      : null,
    projeto.areaTematicaFonte
      ? {
          chave: "tematica",
          texto: `Temática: ${projeto.areaTematicaFonte}`,
          destaque: false,
        }
      : null,
    projeto.linhaExtensao
      ? { chave: "linha", texto: projeto.linhaExtensao, destaque: false }
      : null,
  ].filter((e): e is { chave: string; texto: string; destaque: boolean } => e !== null);

  if (etiquetas.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {etiquetas.map((e) => (
        <span
          key={e.chave}
          className={
            e.destaque
              ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              : "rounded-full border border-border px-2 py-0.5 text-xs text-text-soft"
          }
        >
          {e.texto}
        </span>
      ))}
    </div>
  );
}

/** Período de execução, com travessão onde a fonte não informa. */
function LinhaPeriodo({ projeto }: { projeto: ProjetoExtensao }) {
  if (!projeto.inicio && !projeto.fim) return null;
  return (
    <p className="mt-1 text-xs text-text-soft">
      <span className="font-medium text-text">Período:</span>{" "}
      {projeto.inicio ? dataBr(projeto.inicio) : "—"} a{" "}
      {projeto.fim ? dataBr(projeto.fim) : "—"}
    </p>
  );
}

/** Cartão de projeto de extensão. */
function CartaoProjeto({
  projeto,
  instituicao,
  contato,
}: {
  projeto: ProjetoExtensao;
  instituicao: Instituicao | undefined;
  contato: ContatoResolvido;
}) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold leading-snug text-text">
        {projeto.nome}
      </h3>
      <p className="mt-1 text-xs text-text-soft">
        {instituicao?.sigla ?? projeto.instituicao} · {instituicao?.uf ?? ""} ·{" "}
        {projeto.plataforma}
        {projeto.abrangencia ? ` · ${projeto.abrangencia}` : ""}
      </p>

      {projeto.coordenador && (
        <p className="mt-1 text-xs text-text-soft">
          <span className="font-medium text-text">Coordenador(a):</span>{" "}
          {projeto.coordenador}
        </p>
      )}

      <LinhaPeriodo projeto={projeto} />
      <BadgesProjeto projeto={projeto} />

      <div className="mt-auto pt-3">
        <ContatosBloco contato={contato.contato} institucional={contato.institucional} />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <a
            href={projeto.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Página do projeto
          </a>
          <span className="text-text-soft">
            conferido em {dataBr(projeto.dataAcesso)}
          </span>
        </div>
      </div>
    </article>
  );
}

/** Linha de contagem com o botão de CSV. */
function ResumoContagem({
  total,
  grupos,
  projetos,
  verificadoEm,
  onExportar,
}: {
  total: number;
  grupos: number;
  projetos: number;
  verificadoEm: string;
  onExportar: () => void;
}) {
  return (
    <div
      id="lista-universidades"
      className="flex scroll-mt-24 flex-wrap items-center gap-3"
    >
      <p className="text-sm text-text-soft" aria-live="polite">
        <strong className="text-text">{total}</strong> registro
        {total === 1 ? "" : "s"} · {grupos} grupo
        {grupos === 1 ? "" : "s"} de pesquisa · {projetos} projeto
        {projetos === 1 ? "" : "s"} de extensão · acervo de{" "}
        {dataBr(verificadoEm)}
      </p>
      <button
        type="button"
        onClick={onExportar}
        disabled={total === 0}
        className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Exportar CSV
      </button>
    </div>
  );
}

/** Paginação simples, com a página atual visível. */
function Paginacao({
  rotulo,
  pagina,
  totalPaginas,
  onPagina,
}: {
  rotulo: string;
  pagina: number;
  totalPaginas: number;
  onPagina: (atualiza: (p: number) => number) => void;
}) {
  if (totalPaginas <= 1) return null;
  return (
    <nav
      aria-label={rotulo}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onPagina((p) => Math.max(1, p - 1))}
        disabled={pagina === 1}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="text-xs text-text-soft">
        Página {pagina} de {totalPaginas}
      </span>
      <button
        type="button"
        onClick={() => onPagina((p) => Math.min(totalPaginas, p + 1))}
        disabled={pagina === totalPaginas}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-40"
      >
        Próxima
      </button>
    </nav>
  );
}

interface SecaoProps {
  id: string;
  titulo: string;
  descricao: string;
  rotuloPaginacao: string;
  /** Discriminante do cartão: grupo de pesquisa ou projeto de extensão. */
  tipo: "grupo" | "projeto";
  itens: GrupoPesquisa[] | ProjetoExtensao[];
  total: number;
  pagina: number;
  totalPaginas: number;
  onPagina: (atualiza: (p: number) => number) => void;
  instituicoes: Instituicao[];
  instituicoesPorSigla: Map<string, Instituicao>;
}

/**
 * Seção de catálogo com cartões e paginação própria.
 *
 * Grupo e projeto têm o mesmo esqueleto (título, explicação, grade, paginação)
 * e diferem só no cartão. Uma seção só evita as duas cópias que o CodeScene
 * acusava como duplicação.
 */
function SecaoCatalogo({
  id,
  titulo,
  descricao,
  rotuloPaginacao,
  tipo,
  itens,
  total,
  pagina,
  totalPaginas,
  onPagina,
  instituicoes,
  instituicoesPorSigla,
}: SecaoProps) {
  if (total === 0) return null;

  const cartoes =
    tipo === "grupo"
      ? (itens as GrupoPesquisa[]).map((g) => (
          <CartaoGrupo
            key={`${g.instituicao}-${g.nome}`}
            grupo={g}
            instituicao={instituicoesPorSigla.get(g.instituicao.toUpperCase())}
            contato={contatoDoRegistro(g, instituicoes)}
          />
        ))
      : (itens as ProjetoExtensao[]).map((p) => (
          <CartaoProjeto
            key={`${p.instituicao}-${p.nome}`}
            projeto={p}
            instituicao={instituicoesPorSigla.get(p.instituicao.toUpperCase())}
            contato={contatoDoRegistro(p, instituicoes)}
          />
        ));

  return (
    <>
      <section id={id} aria-label={titulo} className="scroll-mt-24 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-text">{titulo}</h2>
          <p className="text-xs text-text-soft">{descricao}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">{cartoes}</div>
      </section>
      <Paginacao
        rotulo={rotuloPaginacao}
        pagina={pagina}
        totalPaginas={totalPaginas}
        onPagina={onPagina}
      />
    </>
  );
}
