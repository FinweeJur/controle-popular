/**
 * Responde uma pergunta vinda do companheiro de desktop (bichinho-preguica).
 *
 * PAPEL NO PROJETO
 * ----------------
 * O widget do Seu Nono roda no navegador e ja resolve a pergunta em degraus:
 * primeiro a escada determinista (atalhos sem IA), depois o RAG. O companheiro
 * e um cliente novo, fora do navegador, que precisa do MESMO caminho — e sem
 * duplicar regra. Este modulo reusa as duas pecas existentes:
 *   - `avaliarEscadaDeterminista` (lib/assistente/escada-determinista.ts);
 *   - `responderComRag` (lib/assistente/embeddings/rag.ts).
 *
 * REGRAS DE NEGOCIO
 * -----------------
 * - `fala` e derivada da resposta: sem marcadores [n], curta, e com a fonte
 *   citada pelo titulo que veio do dado. O modelo so embrulha; aqui nao se
 *   acrescenta numero, nome nem conclusao.
 * - "Galho" e o dado real (fonte do RAG ou atalho da escada). A trilha do
 *   bichinho segue a ordem de citacao.
 *
 * DECISAO TECNICA
 * ---------------
 * A escada determinista roda no servidor por ser pura (sem `window`), o que
 * ja era verdade no cliente. Quando algum degrau exigir tocar arquivo ou rede,
 * ele deve ser movido para uma funcao separada — nao inserido aqui.
 */

import { avaliarEscadaDeterminista } from "../assistente/escada-determinista";
import { responderComRag } from "../assistente/embeddings/rag";
import type {
  GalhoCompanheiro,
  PedidoCompanheiro,
  RespostaCompanheiro,
} from "./contrato";

/** Data ISO da geracao, no formato que a ressalva de IA usa. */
function dataDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Monta a frase que o bichinho fala.
 *
 * Tira os marcadores [n] (som de "colchete um" e ruido), junta as duas
 * primeiras frases, corta o excesso e cola a fonte pelo titulo. Nunca
 * acrescenta dado que nao esteja na resposta: so reembala o que veio.
 */
export function montarFala(resposta: string, titulos: string[] = []): string {
  const limpo = resposta
    .replace(/\[\d+\]/g, "")   // sem marcadores de citacao no som
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")   // sem espaco solto antes de pontuacao
    .trim();

  const frases = limpo.split(/(?<=[.!?])\s+/).filter(Boolean);
  let fala = frases.slice(0, 2).join(" ") || limpo;

  // Fala longa cansa quem escuta: corta com reticencias.
  if (fala.length > 220) {
    fala = `${fala.slice(0, 217).trimEnd()}...`;
  }

  const fontes = titulos.filter(Boolean).slice(0, 2);
  if (fontes.length > 0) {
    fala = `${fala} Fonte: ${fontes.join(", ")}.`.trim();
  }
  return fala;
}

/** Converte a resposta do RAG em galhos, na ordem de citacao. */
function galhosDoRag(fontes: { titulo?: string; url?: string; rota?: string }[]): GalhoCompanheiro[] {
  return fontes.map((f, i) => ({
    indice: i + 1,
    rotulo: f.titulo ?? `Fonte ${i + 1}`,
    url: f.url,
    rota: f.rota,
  }));
}

/**
 * Caminho completo: escada determinista primeiro; se ela nao cobrir a
 * pergunta, vai para o RAG. Devolve o contrato do companheiro pronto.
 *
 * Pode lancar `OllamaIndisponivel` (de `responderComRag`) quando nao ha
 * provedor remoto, nem embeddings, nem Ollama — a rota traduz isso em 503.
 */
export async function responderComoCompanheiro(
  pedido: PedidoCompanheiro
): Promise<RespostaCompanheiro> {
  const pergunta = pedido.pergunta.trim();

  // Degrau 0-2: atalhos e respostas curadas, sem IA.
  const escada = avaliarEscadaDeterminista(pergunta, pedido.pathname);
  if (escada) {
    const galhos: GalhoCompanheiro[] = escada.atalhos.map((a, i) => ({
      indice: i + 1,
      rotulo: a.rotulo,
      rota: a.href,
    }));
    return {
      resposta: escada.texto,
      fala: montarFala(
        escada.texto,
        escada.atalhos.slice(0, 1).map((a) => a.rotulo)
      ),
      galhos,
      atalhos: escada.atalhos,
      modelo: "deterministico",
      data: dataDeHoje(),
      ressalva: true,
      abstencao: false,
    };
  }

  // Degrau 3: RAG do acervo do Seu Nono.
  const rag = await responderComRag(pergunta, {
    pathname: pedido.pathname,
    titulo: pedido.titulo,
  });

  const galhos = galhosDoRag(rag.fontes);
  const atalhos = galhos
    .filter((g) => g.rota)
    .map((g) => ({
      rotulo: `Abrir ${g.rotulo}`,
      href: g.rota as string,
      principal: g.indice === 1,
    }));

  return {
    resposta: rag.resposta,
    fala: montarFala(
      rag.resposta,
      rag.fontes.map((f) => f.titulo).filter((t): t is string => Boolean(t))
    ),
    galhos,
    atalhos,
    modelo: rag.modelo,
    data: rag.data,
    ressalva: true,
    verificacao: rag.verificacao,
    abstencao: rag.fontes.length === 0,
  };
}
