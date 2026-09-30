"use client";

import { useMemo, useState } from "react";
import { Download, Mail, Phone, Search } from "lucide-react";
import {
  type ContatoGuia,
  filtrarGuia,
  type GrupoContato,
  GRUPOS_CONTATO,
  ufsDisponiveis,
} from "@/lib/guia/contatos";

/**
 * Tela do guia de contatos públicos (`/guia`).
 *
 * ═══ O QUE É ═══
 *
 * Uma tabela única com os contatos de transparência (LAI) e de Justiça, com
 * busca tolerante a acento, filtros por origem e UF e exportação CSV — as
 * seis qualidades da regra de dados do portal.
 *
 * ═══ POR QUE A ORIGEM APARECE ═══
 *
 * Canal de LAI e unidade judiciária são coisas diferentes. A coluna "Origem"
 * mantém as duas separadas, para o leitor não tratar as 1.435 linhas como uma
 * lista só de "órgãos".
 */

interface Props {
  contatos: ContatoGuia[];
}

export default function GuiaClient({ contatos }: Props) {
  const [termo, setTermo] = useState("");
  const [grupo, setGrupo] = useState<GrupoContato | "todos">("todos");
  const [uf, setUf] = useState<string>("todas");

  const ufs = useMemo(() => ufsDisponiveis(contatos), [contatos]);
  const filtrados = useMemo(
    () => filtrarGuia(contatos, { termo, grupo, uf }),
    [contatos, termo, grupo, uf],
  );

  function baixarCsv() {
    const cabecalho = "Nome;Origem;Tipo;Nivel;Cidade;UF;Telefone;Email;Atendimento;Site\n";
    const linhas = filtrados
      .map((c) =>
        [c.nome, c.grupo, c.tipo, c.nivel, c.cidade, c.uf, c.telefone, c.email, c.atendimento, c.site]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(";"),
      )
      .join("\n");
    const conteudo = "\uFEFF" + cabecalho + linhas;
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "controle-popular-guia-contatos.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Buscar por órgão, cidade, e-mail ou telefone..."
              aria-label="Buscar no guia de contatos"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={grupo}
            onChange={(e) => setGrupo(e.target.value as GrupoContato | "todos")}
            aria-label="Filtrar por origem"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todos">Todas as origens</option>
            {GRUPOS_CONTATO.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            aria-label="Filtrar por UF"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todas">Todas as UFs</option>
            {ufs.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={baixarCsv}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Download size={14} aria-hidden="true" /> Baixar CSV ({filtrados.length})
        </button>
      </div>

      {/* Tabela */}
      <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Órgão / Unidade</th>
              <th scope="col" className="px-4 py-3">Origem</th>
              <th scope="col" className="px-4 py-3">Cidade / UF</th>
              <th scope="col" className="px-4 py-3">Contato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Nenhum contato encontrado com esses filtros.
                </td>
              </tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.id} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3">
                    <span className="block font-medium text-foreground">{c.nome}</span>
                    <span className="block text-xs text-muted">{c.tipo}{c.nivel ? ` · ${c.nivel}` : ""}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{c.grupo}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {c.cidade}
                    {c.cidade && c.uf ? " / " : ""}
                    {c.uf}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {c.telefone && (
                        <a
                          href={`tel:${c.telefone.replace(/[^\d+]/g, "")}`}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-primary hover:underline"
                        >
                          <Phone size={12} aria-hidden="true" /> {c.telefone}
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="inline-flex items-center gap-1.5 truncate text-xs text-primary hover:underline"
                        >
                          <Mail size={12} aria-hidden="true" /> {c.email}
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-right text-xs text-muted">
        {filtrados.length} de {contatos.length} contatos.
      </p>
    </div>
  );
}
