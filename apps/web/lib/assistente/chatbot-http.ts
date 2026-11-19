import { NextResponse } from "next/server";
import {
  responderComRag,
  responderSemModelo,
  comPrazo,
  ORCAMENTO_CHATBOT_MS,
  type RespostaRag,
} from "./embeddings/rag";
import { perguntaComRepasses } from "./acervo";
import { responderJurisprudencia } from "./jurisprudencia-escada";
import { sanitizarEntradaUsuario } from "../seguranca/blindagem-prompt";
import { ipDoCliente } from "../rate-limit-ip";

/**
 * Corpo HTTP do `/api/chatbot` — separado do arquivo de rota (`route.din.ts`)
 * para ser testável direto com `Request`/`Response`, sem importar a árvore
 * de rotas do Next (o vitest do projeto roda só `lib/**`).
 *
 * ═══ ORÇAMENTO DE TEMPO E DEGRADAÇÃO HONESTA (10/11/2026) ═══
 *
 * Medido em produção: `POST /api/chatbot` ficou mais de 44 s pendurado
 * (duas vezes) enquanto `/api/saude` respondia em ~5 s. Causa: o caminho
 * antigo tentava Ollama em `172.18.176.1:11434`, inalcançável a partir do
 * container do Azure, com 30-60 s de espera por tentativa.
 *
 * Decisões, todas visíveis aqui:
 * - `ORCAMENTO_CHATBOT_MS` (~25 s) é teto DURO do endpoint: `comPrazo`
 *   corre contra o pipeline inteiro, inclusive a injeção de repasses.
 * - `responderComRag` recebe orçamento interno menor que o daqui e usa os
 *   provedores remotos (GLM grátis -> Maritaca -> DeepSeek -> Ling), 15 s
 *   por provedor por padrão.
 * - Nada de 500 por falha de geração: o RAG devolve `responderSemModelo`
 *   (200, `textoGeradoPorModelo: false`, fontes com título e link). Se o
 *   prazo estourar de vez, esta função responde a mesma frase honesta.
 * - Ollama não é importado neste caminho; sem `EMBED_API_KEY` a busca é
 *   lexical, que é CPU e custa milissegundos.
 */

/**
 * Limitador de taxa em memória por IP (Token Bucket) para proteção anti-DoS.
 * Permite até 15 perguntas por janela de 1 minuto por IP.
 */
interface RegistroLimite {
  contagem: number;
  resetEm: number;
}
const LIMITES_IP = new Map<string, RegistroLimite>();
const LIMITE_MAX_POR_MINUTO = 15;
const JANELA_MS = 60 * 1000;

function verificarLimite(ip: string): boolean {
  const agora = Date.now();
  const registro = LIMITES_IP.get(ip);

  // Limpeza de entradas expiradas para evitar vazamento de memória
  if (LIMITES_IP.size > 1000) {
    for (const [chave, val] of LIMITES_IP.entries()) {
      if (agora > val.resetEm) LIMITES_IP.delete(chave);
    }
  }

  if (!registro || agora > registro.resetEm) {
    LIMITES_IP.set(ip, { contagem: 1, resetEm: agora + JANELA_MS });
    return true;
  }

  if (registro.contagem >= LIMITE_MAX_POR_MINUTO) {
    return false;
  }

  registro.contagem += 1;
  return true;
}

/** Folga entre o teto interno do RAG e o teto do endpoint (parse + JSON). */
const MARGEM_RESPOSTA_MS = 4_000;

/** Trata um POST do chatbot: valida, busca no acervo e responde (ou degrada). */
export async function responderPedidoChatbot(req: Request): Promise<Response> {
  // IP do cliente pelo cabeçalho que a Cloudflare seta na borda
  // (`lib/rate-limit-ip.ts`). NÃO ler `x-forwarded-for` cru: o cliente pode
  // mandá-lo e a borda o repassa, então o primeiro valor é falsificável.
  const ip = ipDoCliente(req);

  if (!verificarLimite(ip)) {
    return NextResponse.json(
      { erro: "Muitas perguntas enviadas em sequência. Por favor, aguarde 1 minuto antes de tentar novamente." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let pergunta = "";
  let pathname: string | undefined;
  let titulo: string | undefined;
  try {
    const body = (await req.json()) as {
      pergunta?: string;
      pathname?: string;
      titulo?: string;
    };
    pergunta = (body.pergunta ?? "").trim();
    if (typeof body.pathname === "string" && body.pathname.trim()) {
      pathname = body.pathname.trim().slice(0, 200);
    }
    if (typeof body.titulo === "string" && body.titulo.trim()) {
      titulo = body.titulo.trim().slice(0, 200);
    }
  } catch {
    return NextResponse.json({ erro: "Pergunta invalida." }, { status: 400 });
  }

  if (!pergunta || pergunta.length < 3) {
    return NextResponse.json({ erro: "Escreva uma pergunta." }, { status: 400 });
  }

  // Blindagem contra injeção de prompt e jailbreak
  const diagnostico = sanitizarEntradaUsuario(pergunta);
  if (!diagnostico.seguro) {
    return NextResponse.json(
      { erro: diagnostico.textoSanitizado },
      { status: 400 }
    );
  }
  pergunta = diagnostico.textoSanitizado;

  // Contagem de jurisprudência ANTES de qualquer modelo. O widget já tem o
  // degrau determinístico no cliente, mas Telegram, companheiro e qualquer
  // outro cliente que bata direto em `/api/chatbot` recebiam "não encontrei
  // esse número" para um dado que o portal tem. A resposta sai do acervo,
  // com a data e o link, e não custa token.
  const jurisprudencia = responderJurisprudencia(pergunta);
  if (jurisprudencia) {
    const resposta: RespostaRag = {
      resposta: jurisprudencia.texto,
      fontes: [
        {
          indice: 1,
          texto: jurisprudencia.texto,
          score: 1,
          titulo: `Jurisprudência: ${jurisprudencia.frenteNome}${
            jurisprudencia.tema ? ` · ${jurisprudencia.tema}` : ""
          }`,
          rota: jurisprudencia.link,
        },
      ],
      modelo: "contagem-jurisprudencia",
      data: new Date().toISOString().slice(0, 10),
      ressalva: true,
      textoGeradoPorModelo: false,
      verificacao: "ok",
    };
    return NextResponse.json(resposta);
  }

  // Dado direto por município: se a pergunta cita uma das 853 cidades de MG,
  // perguntaComRepasses() injeta no texto enviado ao RAG os repasses federais
  // reais (ComunicaBR) — o ponto ÚNICO por onde toda resposta IA passa. A
  // função nunca lança: sem dado, a pergunta segue pura e o fluxo é honesto.
  // Ela roda DENTRO do prazo: se a montagem do dado direto travar, o leitor
  // recebe a resposta honesta em vez de um pedido pendurado.
  try {
    const resposta: RespostaRag = await comPrazo(
      (async () => {
        const perguntaParaRag = await perguntaComRepasses(pergunta);
        return responderComRag(perguntaParaRag, {
          pathname,
          titulo,
          perguntaBusca: pergunta,
          orcamentoMs: Math.max(2_000, ORCAMENTO_CHATBOT_MS - MARGEM_RESPOSTA_MS),
        });
      })(),
      ORCAMENTO_CHATBOT_MS,
      "/api/chatbot"
    );
    return NextResponse.json(resposta);
  } catch (e) {
    // Defesa final: falha inesperada ou orçamento estourado não viram 500
    // nem texto pendurado. O detalhe fica no log do servidor; o leitor vê a
    // frase honesta e, quando houver, as fontes.
    console.warn(`[chatbot] degradando sem modelo: ${e instanceof Error ? e.message : String(e)}`);
    return NextResponse.json(responderSemModelo([], "orcamento-esgotado"));
  }
}
