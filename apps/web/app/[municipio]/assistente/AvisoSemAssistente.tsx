import {
  DESTINOS_SEM_ASSISTENTE,
  TEXTO_SEM_ASSISTENTE,
  TITULO_SEM_ASSISTENTE,
} from "@/lib/rota-ausente";

/**
 * "O assistente por IA não existe nesta cópia do site" — e para onde ir.
 *
 * SEM `"use client"`, de propósito: é markup puro, sem estado nem handler.
 * Assim serve aos DOIS caminhos que precisam dele, que descobrem a mesma
 * ausência em momentos diferentes:
 *
 * - `page.tsx` (servidor) monta isto DIRETO quando `exportandoEstatico`, sem
 *   nem carregar o chat — a pessoa não chega a digitar uma pergunta que
 *   ninguém vai receber.
 * - `AssistenteChat.tsx` (cliente) monta isto quando o `fetch` volta 404 —
 *   a rede de segurança para a rota que sumir no alvo Cloudflare, onde a
 *   flag de build diria que ela existe.
 *
 * Um componente só porque o texto e os destinos precisam ser os mesmos nos
 * dois: duas cópias divergiriam na primeira correção de redação, e a versão
 * errada seria justamente a do caminho raro.
 */
export default function AvisoSemAssistente() {
  return (
    // `role="status"` e não `role="alert"`: não é um erro que acabou de
    // acontecer, é uma condição permanente desta cópia do portal. `alert`
    // interromperia o leitor de tela para anunciar uma falha que não é falha.
    <div role="status" className="rounded-2xl border border-border bg-surface-2 p-5">
      <p className="font-semibold text-text">{TITULO_SEM_ASSISTENTE}</p>
      <p className="mt-1.5 text-sm text-text-soft">{TEXTO_SEM_ASSISTENTE}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {DESTINOS_SEM_ASSISTENTE.map((d) => (
          <li key={d.href}>
            {/* `<a>` cru com caminho de RAIZ, nunca o `caminho()` da cidade:
                `/busca` e `/assistente` ficam FORA da zona `/[municipio]`, e
                prefixá-los daria `/betim/busca`, que não existe. */}
            <a
              href={d.href}
              className="block rounded-xl border border-border bg-surface px-4 py-2.5 no-underline hover:border-primary"
            >
              <span className="font-medium text-text">{d.rotulo}</span>
              <span className="mt-0.5 block text-sm text-text-soft">
                {d.descricao}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
