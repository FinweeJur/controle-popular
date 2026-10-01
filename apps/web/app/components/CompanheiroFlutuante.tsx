"use client";

/**
 * @file CompanheiroFlutuante.tsx
 * @description O companheiro Seu Nonô no site: um bichinho-preguiça flutuante,
 * arrastável, que abre a sessão pareada com o companheiro de desktop.
 *
 * PAPEL NO PROJETO
 * ----------------
 * É a cara visível do companheiro no portal. A rádio (`PlayerRadio.tsx`) e o
 * widget do Seu Nonô (`SeuNono.tsx`) já vivem no canto inferior esquerdo e são
 * arrastáveis (`usarArrastavel`). Este bichinho nasce na COLUNA ESQUERDA, logo
 * ACIMA do Seu Nonô (`left-4 bottom-20`), em 48 px para não tomar tela — e
 * também é arrastável, com a posição lembrada no `localStorage`
 * (chave `cp_companheiro_pos`).
 *
 * O companheiro de verdade roda no desktop (repo FinweeJur/clicky-ptbr). Aqui a
 * pessoa gera o código da sessão pareada e digita no app: uma pergunta, um
 * turno, dois desfechos (o chat abre o link; o bichinho voa até o botão).
 *
 * DECISÕES TÉCNICAS
 * -----------------
 * - Reusa `usarArrastavel`: **clique ≠ arrasto** pelo limiar de 5 px, senão
 *   mexer o bichinho abriria o painel sem querer.
 * - A sessão vem de `POST /api/companheiro/sessao`. Ao criar, publica o evento
 *   `cp:sessao-companheiro`, que a `PonteCompanheiro` ouve para etiquetar as
 *   coordenadas dos alvos na tela.
 * - Arte servida de `public/companheiro/preguica.png`, ampliada com
 *   `image-rendering: pixelated` para não borrar os pixels.
 * - Sem dado pessoal e sem imagem: só o código da sessão e a resposta do RAG.
 */

import { useCallback, useState } from "react";
import Image from "next/image";
import { Check, Copy, X } from "lucide-react";
import { usarArrastavel } from "@/lib/usarArrastavel";

export function CompanheiroFlutuante() {
  const { estilo, arrastando, foiArrasto, handlers } = usarArrastavel("cp_companheiro_pos");
  const [aberto, setAberto] = useState(false);
  const [sessao, setSessao] = useState<{ id: string; codigo: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  /** Cria a sessão pareada (uma vez) e publica o id para a ponte. */
  const abrir = useCallback(async () => {
    setAberto(true);
    if (sessao) return;
    setErro(null);
    try {
      const resp = await fetch("/api/companheiro/sessao", { method: "POST" });
      const dados = (await resp.json()) as { id?: string; codigo?: string; erro?: string };
      if (!resp.ok || !dados.id || !dados.codigo) {
        throw new Error(dados.erro ?? "Nao consegui abrir a sessao.");
      }
      setSessao({ id: dados.id, codigo: dados.codigo });
      window.dispatchEvent(
        new CustomEvent("cp:sessao-companheiro", { detail: { id: dados.id, codigo: dados.codigo } }),
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro de rede ao abrir a sessao.");
    }
  }, [sessao]);

  const aoClicar = useCallback(() => {
    if (foiArrasto()) return; // o gesto foi arrastar, não clicar
    if (aberto) setAberto(false);
    else void abrir();
  }, [aberto, abrir, foiArrasto]);

  const copiar = useCallback(async () => {
    if (!sessao) return;
    try {
      await navigator.clipboard.writeText(sessao.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // sem clipboard: o código segue visível na tela
    }
  }, [sessao]);

  return (
    <div className="fixed bottom-20 left-4 z-40 print:hidden" style={estilo}>
      <div className="relative flex flex-col items-end">
        <button
          type="button"
          onClick={aoClicar}
          {...handlers}
          aria-label="Abrir o companheiro Seu Nono (bichinho)"
          aria-expanded={aberto}
          title="Companheiro Seu Nono — arraste para mover"
          className={`flex h-12 w-12 touch-none items-center justify-center rounded-full border border-border bg-surface shadow-lg transition hover:bg-surface-2 ${arrastando ? "cursor-grabbing" : "cursor-pointer"}`}
        >
          <Image
            src="/companheiro/preguica.png"
            alt=""
            width={32}
            height={32}
            priority={false}
            style={{ imageRendering: "pixelated" }}
          />
        </button>

        {aberto && (
          <div
            role="dialog"
            aria-label="Sessao do companheiro"
            className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-border bg-surface p-3 text-left shadow-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-text">Companheiro Seu Non&ocirc;</p>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded p-0.5 text-text-soft hover:bg-surface-2"
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-1 text-[.72rem] leading-relaxed text-text-soft">
              Ele fica na sua tela e leva voc&ecirc; at&eacute; a p&aacute;gina que responde. No
              bichinho, escolha <strong>Entrar numa sess&atilde;o</strong> e digite o c&oacute;digo:
            </p>

            {erro && <p className="mt-2 text-[.72rem] text-alert">{erro}</p>}

            {sessao && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
                <code className="font-tabular text-base font-bold tracking-widest text-text">
                  {sessao.codigo}
                </code>
                <button
                  type="button"
                  onClick={() => void copiar()}
                  className="rounded p-1 text-text-soft hover:bg-surface"
                  aria-label="Copiar codigo"
                >
                  {copiado ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
