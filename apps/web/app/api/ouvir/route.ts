/**
 * @file route.ts
 * @description POST /api/ouvir — leitura em voz alta TRADUZIDA.
 *
 * Papel no portal: o botao "Ouvir" (OuvirNavbar) pede a este endpoint o audio
 * da pagina no idioma escolhido pelo leitor. O servidor TRADUZ o texto
 * (Azure AI Translator) e SINTETIZA a voz (Azure AI Speech), devolvendo um
 * MP3. Assim a voz e sempre a mesma em qualquer aparelho, e o texto sai no
 * idioma pedido — inclusive mandarim e italiano, que muitos aparelhos nao
 * tem instalados.
 *
 * Fonte/credenciais: as chaves vivem em variaveis de ambiente do servidor
 * (`AZURE_TRANSLATOR_KEY`, `AZURE_TRANSLATOR_REGION`, `AZURE_SPEECH_KEY`,
 * `AZURE_SPEECH_REGION`). NUNCA no cliente e NUNCA no repositorio (§5.8). As
 * duas ofertas cabem no nivel gratuito do GitHub Student Pack.
 *
 * Privacidade (§5.8): so vai para a Microsoft o texto VISIVEL do `<main>`, que
 * ja e publico. Paginas que ecoam o que a pessoa digitou (busca) NAO usam este
 * caminho — o cliente as exclui — para nunca enviar termo de busca (que pode
 * conter nome ou CPF) a terceiro.
 *
 * Decisoes tecnicas:
 * - `runtime = "nodejs"`: usa `Buffer` para juntar os pedacos de audio.
 * - texto longo e fatiado em pedacos de frases (o Translator tem teto por
 *   requisicao e o Speech, teto de duracao); os MP3 sao concatenados.
 * - limite de caracteres por leitura e um freio simples por IP evitam que uma
 *   unica pessoa consuma a cota gratuita dos outros.
 * - sem chave configurada devolve 503; o cliente cai na voz do navegador.
 */
import { acharIdioma } from "@/lib/ouvir/idiomas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Teto de caracteres por leitura (protege a cota gratuita). */
const MAX_CARACTERES = 6000;
/** Tamanho de cada pedaco enviado ao Translator/Speech. */
const TAMANHO_PEDACO = 2000;
/** Leituras por IP em cada janela. */
const LIMITE_POR_JANELA = 30;
/** Duracao da janela do freio, em ms. */
const JANELA_MS = 10 * 60 * 1000;

/** Freio simples em memoria (reinicia com o processo). */
const contagem = new Map<string, { n: number; inicio: number }>();

function excedeuLimite(ip: string): boolean {
  const agora = Date.now();
  const atual = contagem.get(ip);
  if (!atual || agora - atual.inicio > JANELA_MS) {
    contagem.set(ip, { n: 1, inicio: agora });
    return false;
  }
  atual.n += 1;
  return atual.n > LIMITE_POR_JANELA;
}

/** Escapa o texto para virar conteudo de SSML (XML). */
function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Fatia o texto em pedacos de ate `maximo` caracteres, cortando em fim de
 * frase quando possivel (nao corta palavra nem frase no meio).
 */
function fatiar(texto: string, maximo: number): string[] {
  const pedacos: string[] = [];
  let atual = "";
  for (const frase of texto.split(/(?<=[.!?;:])\s+/)) {
    if ((atual + " " + frase).trim().length > maximo && atual) {
      pedacos.push(atual.trim());
      atual = frase;
    } else {
      atual = (atual + " " + frase).trim();
    }
  }
  if (atual) pedacos.push(atual.trim());
  return pedacos;
}

/** Traduz um pedaco de texto para o codigo de destino do Translator. */
async function traduzir(
  texto: string,
  para: string,
  chave: string,
  regiao: string,
): Promise<string> {
  const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${encodeURIComponent(para)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": chave,
      "Ocp-Apim-Subscription-Region": regiao,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ Text: texto }]),
  });
  if (!r.ok) throw new Error(`traduzir ${r.status}`);
  const dados = (await r.json()) as Array<{ translations: Array<{ text: string }> }>;
  return dados[0]?.translations?.[0]?.text ?? "";
}

/** Sintetiza um pedaco de texto com a voz escolhida; devolve o audio (MP3). */
async function sintetizar(
  texto: string,
  locale: string,
  voz: string,
  chave: string,
  regiao: string,
): Promise<ArrayBuffer> {
  const ssml =
    `<speak version="1.0" xml:lang="${locale}">` +
    `<voice name="${voz}">${escaparXml(texto)}</voice></speak>`;
  const r = await fetch(
    `https://${regiao}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": chave,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "controle-popular",
      },
      body: ssml,
    },
  );
  if (!r.ok) throw new Error(`sintetizar ${r.status}`);
  return r.arrayBuffer();
}

export async function POST(req: Request) {
  const tradChave = process.env.AZURE_TRANSLATOR_KEY;
  const vozChave = process.env.AZURE_SPEECH_KEY;
  const tradRegiao = process.env.AZURE_TRANSLATOR_REGION ?? "northcentralus";
  const vozRegiao = process.env.AZURE_SPEECH_REGION ?? "northcentralus";

  // Sem credencial, o cliente cai na voz do navegador (degradacao honesta).
  if (!tradChave || !vozChave) {
    return Response.json({ erro: "leitura-azure-nao-configurada" }, { status: 503 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "desconhecido";
  if (excedeuLimite(ip)) {
    return Response.json({ erro: "muitas-leituras" }, { status: 429 });
  }

  let corpo: { texto?: unknown; idioma?: unknown };
  try {
    corpo = (await req.json()) as typeof corpo;
  } catch {
    return Response.json({ erro: "json-invalido" }, { status: 400 });
  }

  const texto = typeof corpo.texto === "string" ? corpo.texto.trim() : "";
  const idioma = typeof corpo.idioma === "string" ? corpo.idioma : "";
  const conf = acharIdioma(idioma);
  if (!texto || !conf) {
    return Response.json({ erro: "texto-ou-idioma-ausente" }, { status: 400 });
  }

  try {
    const limitado = texto.slice(0, MAX_CARACTERES);

    // Traduz (em pedacos) — junta os pedacos traduzidos.
    const traduzidos: string[] = [];
    for (const pedaco of fatiar(limitado, TAMANHO_PEDACO)) {
      traduzidos.push(await traduzir(pedaco, conf.tradutor, tradChave, tradRegiao));
    }
    const textoFinal = traduzidos.join(" ").trim();

    // Sintetiza (em pedacos) e concatena os MP3.
    const pedacos = fatiar(textoFinal, TAMANHO_PEDACO);
    const audios: Buffer[] = [];
    for (const pedaco of pedacos) {
      const buf = await sintetizar(pedaco, conf.codigo, conf.voz, vozChave, vozRegiao);
      audios.push(Buffer.from(buf));
    }

    return new Response(Buffer.concat(audios), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return Response.json({ erro: "falha-na-leitura" }, { status: 502 });
  }
}
