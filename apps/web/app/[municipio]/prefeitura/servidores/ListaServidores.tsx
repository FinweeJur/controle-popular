"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import type { ServidorRow } from "@/lib/betim/servidores";

/**
 * Tabela de `/[municipio]/prefeitura/servidores` — mesmo mecanismo de
 * `camara/proposicoes` (ver o porquê em `dados/[arquivo]/route.ts`).
 *
 * ═══ A CLASSIFICAÇÃO "ALTO ESCALÃO"/"COMISSIONADOS" É DUPLICADA AQUI, DE
 * PROPÓSITO — E PRECISA CONTINUAR IGUAL À DE `lib/db/queries/betim.ts` ═══
 *
 * `listarServidores` calcula os dois perfis em SQL com `LIKE`, e o critério
 * NÃO é cosmético: o comentário original registra que incluir cargos de
 * ESCOLA no "alto escalão" inflaria o recorte de ~350 para ~3.800 pessoas —
 * diretor de escola é chefia pedagógica, não cúpula de governo. Replicado
 * aqui byte a byte (mesmos prefixos, mesma exclusão de ESCOLA/PEDAGOGIC,
 * `startsWith`/`includes` sensíveis a maiúsculas como o `LIKE` do Postgres
 * é por padrão) porque a classificação roda sobre dado que já chegou ao
 * navegador — não há como "passar por prop" um cálculo, só o resultado.
 * **Se `listarServidores` mudar os prefixos, esta função tem que mudar
 * junto** — não há teste que pegue essa deriva automaticamente.
 */
function comissionado(v: ServidorRow): boolean {
  return (v.vinculo ?? "").startsWith("EM COMISS");
}

const PREFIXOS_ALTO_ESCALAO = [
  "SECRETARIO ",
  "SECRETARIO-",
  "SUBPREFEITO",
  "CHEFE DE GABINETE",
  "DIRETOR I",
  "DIRETOR DE PROJETOS",
  "DIRETOR DE PROGRAMA",
  "PRESIDENTE",
  "SUPERINTENDENTE",
  "OUVIDOR GERAL",
  "CONTROLADOR GERAL",
  "PROCURADOR GERAL",
  "ASSESSOR ESPECIAL",
  "COORDENADOR I",
];

function altoEscalao(v: ServidorRow): boolean {
  const cargo = v.cargo ?? "";
  const bate = PREFIXOS_ALTO_ESCALAO.some((p) => cargo.startsWith(p));
  return bate && !cargo.includes("ESCOLA") && !cargo.includes("PEDAGOGIC");
}

type LinhaServidor = ServidorRow & Record<string, unknown>;

const COLUNAS: ColunaTabela<LinhaServidor>[] = [
  { chave: "nome", rotulo: "Nome" },
  { chave: "cargo", rotulo: "Cargo", formatar: (s) => s.cargo ?? "—" },
  { chave: "lotacao", rotulo: "Lotação", formatar: (s) => s.lotacao ?? "—" },
  { chave: "vinculo", rotulo: "Vínculo", formatar: (s) => s.vinculo ?? "—" },
  { chave: "orgao", rotulo: "Órgão", formatar: (s) => s.orgao ?? "—" },
];

export default function ListaServidores({ base }: { base: string }) {
  const [perfil, setPerfil] = useState<"" | "comissionados" | "alto_escalao">("");
  const [orgao, setOrgao] = useState("");
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const p = sp.get("perfil");
    setPerfil(p === "comissionados" || p === "alto_escalao" ? p : "");
    setOrgao(sp.get("orgao") ?? "");
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    perfil ? sp.set("perfil", perfil) : sp.delete("perfil");
    orgao ? sp.set("orgao", orgao) : sp.delete("orgao");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [perfil, orgao]);

  const filtrar = useCallback(
    (s: LinhaServidor) => {
      if (perfil === "comissionados" && !comissionado(s)) return false;
      if (perfil === "alto_escalao" && !altoEscalao(s)) return false;
      if (orgao && s.orgao !== orgao) return false;
      return true;
    },
    [perfil, orgao]
  );

  return (
    <TabelaEstatica<LinhaServidor>
      base={base}
      colunas={COLUNAS}
      camposBusca={["nome", "cargo", "lotacao"]}
      vazio="Nenhum servidor encontrado no momento."
      filtrar={filtrar}
      controles={({ pronto, linhas }) => {
        // Lista de órgãos vem do próprio dado carregado — não de uma
        // segunda consulta ao servidor. Só fica completa quando `pronto`
        // (todas as fatias chegaram); antes disso mostra o que já viu, o
        // que é aceitável para um `<select>` que só cresce.
        const orgaos = [...new Set(linhas.map((l) => l.orgao).filter((o): o is string => Boolean(o)))].sort(
          (a, b) => a.localeCompare(b, "pt-BR")
        );
        return (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label htmlFor="f-perfil" className="mb-1 text-xs font-medium text-text-soft">
                Tipo de cargo
              </label>
              <select
                id="f-perfil"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as typeof perfil)}
                className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
              >
                <option value="">Todos os servidores</option>
                <option value="comissionados">Só cargos comissionados</option>
                <option value="alto_escalao">Só alto escalão</option>
              </select>
            </div>
            {orgaos.length > 0 && (
              <div className="flex flex-col">
                <label htmlFor="f-orgao" className="mb-1 text-xs font-medium text-text-soft">
                  Órgão
                </label>
                <select
                  id="f-orgao"
                  value={orgao}
                  disabled={!pronto}
                  onChange={(e) => setOrgao(e.target.value)}
                  className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text disabled:opacity-60"
                >
                  <option value="">Todos os órgãos</option>
                  {orgaos.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {perfil === "comissionados" && (
              <p className="max-w-md rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-text-soft">
                <strong className="font-medium text-text">Cargos comissionados</strong> são
                os de livre nomeação e exoneração — a parte do quadro que muda com o
                governo. O recorte sai do vínculo declarado pela própria Prefeitura
                (&ldquo;em comissão&rdquo;), não de uma leitura nossa do nome do cargo.
              </p>
            )}
            {perfil === "alto_escalao" && (
              <p className="max-w-md rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-text-soft">
                <strong className="font-medium text-text">Alto escalão</strong> é a cúpula
                da administração: secretários e adjuntos, subprefeitos, chefes de
                gabinete, diretores, presidentes, superintendentes, procurador e
                controlador-geral. <strong className="font-medium text-text">Diretor de
                escola e coordenador pedagógico ficam de fora</strong> — são chefia
                pedagógica, não cúpula de governo, e somam 3.455 pessoas em São Paulo,
                o bastante para desfigurar o recorte se entrassem.
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
