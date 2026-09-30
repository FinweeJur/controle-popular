"use client";

import { useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { useFavoritas } from "@/app/cidades/Favoritos";
import { useItensPasta } from "@/app/pasta/pastaStore";
import { useTemas } from "@/app/temas/TemasClient";
import {
  CHAVES_LOCAIS,
  montarExportacao,
  serializarExportacao,
  validarImportacao,
} from "@/lib/portabilidade/dados-locais";

/**
 * "Meus dados" (`/meus-dados`) — exportar, importar e apagar a vida local.
 *
 * ═══ O QUE É ═══
 *
 * O portal guarda três coisas no navegador: cidades seguidas, pasta de dossiê
 * e temas acompanhados. Aqui o leitor baixa tudo num JSON, restaura noutro
 * aparelho e apaga quando quiser. Sem conta, sem servidor.
 *
 * ═══ POR QUE RECARREGAR APÓS IMPORTAR/APAGAR ═══
 *
 * Os três acervos vivem em módulos com cache em memória. Escrever direto no
 * `localStorage` não atualiza esse cache; recarregar a página é a forma mais
 * simples e honesta de refletir a mudança sem espalhar sincronização frágil.
 */

export default function MeusDadosClient() {
  const cidades = useFavoritas();
  const pasta = useItensPasta();
  const temas = useTemas();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Baixa um JSON com os três acervos locais. */
  function exportar() {
    if (typeof window === "undefined") return;
    const dados = montarExportacao({
      cidadesJson: window.localStorage.getItem(CHAVES_LOCAIS.cidades),
      pastaJson: window.localStorage.getItem(CHAVES_LOCAIS.pasta),
      temasJson: window.localStorage.getItem(CHAVES_LOCAIS.temas),
    });
    const blob = new Blob([serializarExportacao(dados)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "controle-popular-meus-dados.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /** Lê um arquivo de importação e grava os acervos no navegador. */
  async function importar(arquivo: File) {
    const texto = await arquivo.text();
    const dados = validarImportacao(texto);
    if (!dados) {
      setMensagem("Arquivo inválido: não é um JSON do Controle Popular.");
      return;
    }
    window.localStorage.setItem(CHAVES_LOCAIS.cidades, JSON.stringify(dados.cidades));
    window.localStorage.setItem(CHAVES_LOCAIS.pasta, JSON.stringify(dados.pasta));
    window.localStorage.setItem(CHAVES_LOCAIS.temas, JSON.stringify(dados.temas));
    window.location.reload();
  }

  /** Apaga os três acervos do navegador. */
  function apagar() {
    if (typeof window === "undefined") return;
    if (!window.confirm("Apagar suas cidades, pasta e temas deste aparelho? Não dá para desfazer.")) return;
    window.localStorage.removeItem(CHAVES_LOCAIS.cidades);
    window.localStorage.removeItem(CHAVES_LOCAIS.pasta);
    window.localStorage.removeItem(CHAVES_LOCAIS.temas);
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { rotulo: "Cidades seguidas", valor: cidades.length },
          { rotulo: "Itens na pasta", valor: pasta.length },
          { rotulo: "Temas acompanhados", valor: temas.length },
        ].map((item) => (
          <li key={item.rotulo} className="rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="font-display text-2xl font-bold text-foreground">{item.valor}</p>
            <p className="mt-1 text-xs text-muted">{item.rotulo}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportar}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Download size={14} aria-hidden="true" /> Baixar tudo (JSON)
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-foreground transition-colors hover:text-primary"
        >
          <Upload size={14} aria-hidden="true" /> Importar JSON
        </button>
        <button
          type="button"
          onClick={apagar}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <Trash2 size={14} aria-hidden="true" /> Apagar tudo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-label="Escolher arquivo JSON de importação"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) void importar(arquivo);
          }}
        />
      </div>

      {mensagem && (
        <p role="status" aria-live="polite" className="text-sm text-amber-600 dark:text-amber-400">
          {mensagem}
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted">
        O arquivo fica só com você: o portal não recebe, não envia e não guarda
        nada em servidor. Importe-o em outro aparelho para levar suas listas.
      </p>
    </div>
  );
}
