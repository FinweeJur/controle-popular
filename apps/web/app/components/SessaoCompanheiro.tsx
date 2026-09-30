"use client";

/**
 * @file SessaoCompanheiro.tsx
 * @description Controle da sessão pareada dentro do widget do Seu Nonô. Cria a
 * sessão, mostra o código para o companheiro de desktop entrar, ouve os turnos
 * pelo SSE e abre o link da página que o bichinho apontou.
 *
 * PAPEL NO PROJETO
 * ----------------
 * É a ponta do site no fluxo pareado: o widget cria a sessão (POST
 * `/api/companheiro/sessao`), exibe o código curto, abre
 * `GET /api/companheiro/sessao/{id}/eventos` e, quando chega um `turno`,
 * mostra a resposta e abre o atalho principal. O companheiro recebe o mesmo
 * turno e segue os galhos. Uma pergunta, um turno, dois desfechos.
 *
 * DECISÕES TÉCNICAS
 * -----------------
 * - O `id` da sessão é publicado no evento `cp:sessao-companheiro`, que a
 *   `PonteCompanheiro` ouve para etiquetar as coordenadas.
 * - O link do turno abre em aba nova quando é fonte externa; rota interna do
 *   portal navega na aba atual (é o desfecho pedido: "o chat abre a página").
 * - Sem dado pessoal e sem imagem: só a pergunta (feita pelo companheiro) e a
 *   resposta do RAG circulam.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Cable, Check, Copy, ExternalLink, X } from "lucide-react";
import type { RespostaCompanheiro } from "@/lib/companheiro/contrato";

interface TurnoRecebido {
  pergunta?: string;
  resposta: RespostaCompanheiro;
}

function ehExterno(href: string): boolean {
  return /^(https?:)?\/\//.test(href) || href.startsWith("mailto:");
}

export function SessaoCompanheiro() {
  const [aberto, setAberto] = useState(false);
  const [sessao, setSessao] = useState<{ id: string; codigo: string } | null>(null);
  const [pareada, setPareada] = useState(false);
  const [turno, setTurno] = useState<TurnoRecebido | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fonteRef = useRef<EventSource | null>(null);

  /** Abre a sessão (uma vez) e publica o id para a ponte responsiva. */
  const abrirSessao = useCallback(async () => {
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
        new CustomEvent("cp:sessao-companheiro", { detail: { id: dados.id, codigo: dados.codigo } })
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro de rede ao abrir a sessao.");
    }
  }, [sessao]);

  /** Ouve o SSE da sessão enquanto ela existir. */
  useEffect(() => {
    if (!sessao) return;
    const fonte = new EventSource(`/api/companheiro/sessao/${sessao.id}/eventos`);
    fonteRef.current = fonte;

    fonte.addEventListener("pareada", () => setPareada(true));
    fonte.addEventListener("turno", (ev) => {
      try {
        const msg = JSON.parse((ev as MessageEvent).data) as { dados?: TurnoRecebido };
        if (!msg.dados?.resposta) return;
        setTurno(msg.dados);
        const alvo =
          msg.dados.resposta.atalhos.find((a) => a.principal) ?? msg.dados.resposta.atalhos[0];
        if (alvo) {
          // O desfecho do site é ABRIR o link. Fonte externa vai em aba nova;
          // rota interna do portal navega aqui (o link também fica visível no
          // painel antes da navegação).
          if (ehExterno(alvo.href)) {
            window.open(alvo.href, "_blank", "noopener,noreferrer");
          } else {
            window.location.assign(alvo.href);
          }
        }
      } catch {
        // Evento malformado: ignora.
      }
    });
    fonte.onerror = () => {
      // O EventSource reconecta sozinho; nada a fazer.
    };

    return () => {
      fonte.close();
      fonteRef.current = null;
    };
  }, [sessao]);

  const copiarCodigo = useCallback(async () => {
    if (!sessao) return;
    try {
      await navigator.clipboard.writeText(sessao.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Sem permissão de clipboard: o código continua visível na tela.
    }
  }, [sessao]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (aberto ? setAberto(false) : void abrirSessao())}
        className="rounded-full p-1 text-text-soft hover:bg-surface-2"
        aria-label="Conectar o companheiro Seu Nono (bichinho)"
        aria-expanded={aberto}
        title="Conectar companheiro"
      >
        <Cable size={18} />
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Sessao do companheiro"
          className="absolute right-0 top-9 z-10 w-64 rounded-xl border border-border bg-surface p-3 text-left shadow-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-text">Conectar o companheiro</p>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="rounded p-0.5 text-text-soft hover:bg-surface-2"
              aria-label="Fechar"
            >
              <X size={14} />
            </button>
          </div>

          {erro && <p className="mt-2 text-[.72rem] text-alert">{erro}</p>}

          {sessao && (
            <>
              <p className="mt-1 text-[.72rem] leading-relaxed text-text-soft">
                No bichinho, escolha <strong>Entrar numa sessão</strong> e digite:
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
                <code className="font-tabular text-base font-bold tracking-widest text-text">
                  {sessao.codigo}
                </code>
                <button
                  type="button"
                  onClick={() => void copiarCodigo()}
                  className="rounded p-1 text-text-soft hover:bg-surface"
                  aria-label="Copiar codigo"
                >
                  {copiado ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="mt-1.5 text-[.68rem] text-text-soft">
                {pareada ? "Conectado. Pergunte pelo bichinho." : "Aguardando o bichinho entrar..."}
              </p>
            </>
          )}

          {turno && (
            <div className="mt-2 border-t border-border pt-2">
              {turno.pergunta && (
                <p className="text-[.72rem] text-text-soft">
                  <strong className="text-text">Pergunta:</strong> {turno.pergunta}
                </p>
              )}
              <p className="mt-1 whitespace-pre-wrap text-[.75rem] leading-relaxed text-text">
                {turno.resposta.resposta}
              </p>
              {turno.resposta.atalhos[0] && (
                <a
                  href={turno.resposta.atalhos[0].href}
                  target={ehExterno(turno.resposta.atalhos[0].href) ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
                >
                  {turno.resposta.atalhos[0].rotulo}
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
