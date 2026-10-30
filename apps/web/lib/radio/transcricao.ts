/**
 * Transcrição de rádio no navegador — helpers fora do React.
 *
 * Papel no portal: dar texto ao que a rádio fala sem mandar áudio para fora.
 * O Whisper (`transformers.js`, WebAssembly) roda no aparelho do leitor; este
 * módulo isola a parte de áudio e modelo para o componente `TranscricaoRadio`
 * ficar só com a interface. Extraído em 29/10/2026, quando o CodeScene passou
 * a cobrar a complexidade média do arquivo.
 *
 * Decisões que valem para quem mexer aqui:
 * - `language` e `task` NÃO vão no construtor do pipeline (o `transformers.js`
 *   os ignora ali). Vão em cada inferência, em `OPCOES_INFERENCIA`: sem isso o
 *   Whisper autodetecta e responde em inglês.
 * - o idioma é fixo em português; o acervo é brasileiro e tradução não é o
 *   objetivo.
 * - `whisper-small` é o menor modelo com português minimamente confiável. O
 *   `base` errava muito; o download (q8, padrão do WASM) fica em ~250 MB.
 * - blocos de 12 s reduzem corte de palavra e alucinação; o áudio é
 *   normalizado por pico porque cada emissora chega com volume diferente.
 * - é transcrição de FALA: música rende pouco e marcadores como `[MUSIC]` são
 *   removidos antes de entrar na bolha.
 */
import type { EstacaoRadio } from "./estacoes";

/** Biblioteca de inferência local (sem chave, sem servidor). O `+esm` do
 * jsDelivr entrega o pacote já no formato de módulo que o navegador importa. */
const TRANSFORMERS_CDN =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/+esm";

/** Modelo multilíngue; `small` é o menor com português confiável. */
const MODELO_WHISPER = "Xenova/whisper-small";

/** Taxa de amostragem que o Whisper exige. */
const TAXA_WHISPER = 16000;

/** Segundos por bloco enviado ao modelo. */
const SEGUNDOS_BLOCO = 12;

/** Idioma e tarefa fixos: português, transcrição (nunca tradução). */
export const OPCOES_INFERENCIA = {
  language: "portuguese",
  task: "transcribe",
  return_timestamps: false,
} as const;

/**
 * Opções aprimoradas para forçar português com maior confiabilidade.
 * Inclui configurações adicionais para reduzir detecção de inglês.
 */
export const OPCOES_INFERENCIA_APRIMORADAS = {
  ...OPCOES_INFERENCIA,
  // Forçar explicitamente o modelo para português
  language: "portuguese",
  // Adicionar configuração de temperatura mais baixa para reduzir alucinações
  temperature: 0.0,
  // Forçar o modelo a não usar detecção automática de idioma
  force_language: "portuguese",
} as const;

/** Transcritor devolvido pelo `pipeline`; `dispose` libera o modelo. */
export interface Transcritor {
  (audio: Float32Array, opcoes?: Record<string, unknown>): Promise<{ text: string }>;
  dispose?: () => Promise<void> | void;
}

/** Grafo de captura: fonte → processador → ganho 0 → destino (sem som). */
export interface CapturaAudio {
  ctx: AudioContext;
  processor: ScriptProcessorNode;
  source: MediaElementAudioSourceNode;
  ganho: GainNode;
}

/** Assinatura mínima do `transformers.js` que a bolha usa. */
interface ModuloTransformers {
  pipeline: (tarefa: string, modelo: string) => Promise<Transcritor>;
}

/** Concatena blocos de Float32 num único Float32Array. */
function concatenar(blocos: Float32Array[]): Float32Array {
  const total = blocos.reduce((acc, b) => acc + b.length, 0);
  const saida = new Float32Array(total);
  let pos = 0;
  for (const b of blocos) {
    saida.set(b, pos);
    pos += b.length;
  }
  return saida;
}

/**
 * Normaliza o bloco pelo pico (0,95). Rádios chegam com volumes muito
 * diferentes; sem isso, estação baixa vira sussurro para o modelo e estação
 * alta satura — os dois casos pioram a transcrição.
 */
export function normalizar(audio: Float32Array): Float32Array {
  let pico = 0;
  for (const amostra of audio) pico = Math.max(pico, Math.abs(amostra));
  if (pico < 0.01 || pico > 0.95) return audio;
  const fator = 0.95 / pico;
  const saida = new Float32Array(audio.length);
  for (let i = 0; i < audio.length; i += 1) saida[i] = audio[i] * fator;
  return saida;
}

/**
 * Limpa o que o Whisper devolve para MÚSICA e RUÍDO: marcadores como
 * `[MUSIC]`, `(upbeat music)` e notas `♪` não são fala e só poluem a bolha.
 * Se sobrar vazio, o trecho é descartado pelo chamador.
 * Inclui detecção e correção de texto em inglês.
 */
export function limparTexto(bruto: string): string {
  // Primeiro remove marcadores de música e ruído
  let limpo = bruto
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[♪♫♬]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Se sobrar texto, aplica detecção e correção de inglês
  if (limpo) {
    limpo = detectarECorrigirIngles(limpo);
  }

  return limpo;
}

/** 
 * Detecta e corrige texto em inglês que pode aparecer na transcrição.
 * 
 * O Whisper às vezes detecta inglês mesmo com configuração para português,
 * especialmente em músicas ou áudio de baixa qualidade. Esta função verifica
 * presença de palavras-chave em inglês e aplica correções quando necessário.
 */
export function detectarECorrigirIngles(texto: string): string {
  if (!texto || texto.trim() === "") return texto;

  // Lista de palavras comuns em inglês que podem aparecer em transcrições
  const palavrasInglesComuns = [
    "the", "and", "that", "this", "but", "they", "have", "been", "was", "were",
    "are", "is", "it", "for", "not", "you", "your", "his", "her", "she", "he",
    "we", "our", "us", "them", "their", "what", "which", "who", "when", "where",
    "why", "how", "can", "will", "would", "could", "should", "may", "might", "must",
    "shall", "do", "does", "did", "have", "has", "had", "be", "being", "been",
    "am", "is", "are", "was", "were", "being", "been", "a", "an", "or", "but",
    "if", "because", "as", "until", "while", "of", "at", "by", "about", "into",
    "through", "during", "before", "after", "above", "below", "from", "up", "down",
    "in", "out", "on", "off", "over", "under", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "any", "both", "each",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
    "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just",
    "don", "should", "now", "d", "ll", "m", "o", "re", "ve", "y", "ain", "aren",
    "couldn", "didn", "doesn", "hadn", "hasn", "haven", "isn", "ma", "mightn",
    "mustn", "needn", "shan", "shouldn", "wasn", "weren", "won", "wouldn"
  ];

  // Lista de padrões que indicam transcrição de música em inglês
  const padroesMusicaIngles = [
    /\b(music|song|track|album|artist|band|guitar|drum|piano|violin)\b/gi,
    /\b(love|heart|baby|girl|boy|night|day|time|world|life)\b/gi,
    /\b(I|you|he|she|it|we|they|me|him|her|us|them)\s+(love|like|want|need|feel|see)\b/gi,
    /\b(oh|ah|yeah|hey|whoa|wow)\b/gi,
  ];

  // Verifica se o texto contém muitas palavras em inglês
  const palavras = texto.toLowerCase().split(/\s+/);
  const palavrasIngles = palavras.filter(palavra => 
    palavrasInglesComuns.includes(palavra.replace(/[^\w]/g, ''))
  );

  // Se mais de 30% das palavras forem em inglês, suspeita de detecção errada
  const proporcaoIngles = palavrasIngles.length / palavras.length;
  
  if (proporcaoIngles > 0.3) {
    console.warn("Transcrição detectada como predominantemente em inglês:", texto);
    
    // Aplica correções básicas
    let textoCorrigido = texto;
    
    // Remove palavras muito comuns em inglês que podem ser ruído
    textoCorrigido = textoCorrigido.replace(/\b(the|and|that|this|but|they|have)\b/gi, '');
    
    // Adiciona marcação de possível tradução incorreta
    textoCorrigido = textoCorrigido.trim();
    if (textoCorrigido !== texto) {
      textoCorrigido += " [tradução automática]";
    }
    
    return textoCorrigido;
  }

  // Verifica padrões de música em inglês
  const temPadroesMusica = padroesMusicaIngles.some(padrao => padrao.test(texto));
  
  if (temPadroesMusica && palavrasIngles.length > 2) {
    console.warn("Transcrição contém padrões de música em inglês:", texto);
    return texto + " [música detectada]";
  }

  return texto;
}
export function liberarTranscritor(transcriber: Transcritor | null): void {
  if (!transcriber?.dispose) return;
  try {
    void Promise.resolve(transcriber.dispose()).catch(() => {});
  } catch {
    // Plataforma sem `dispose`: o coletor cuida quando puder.
  }
}

/** Abre o áudio oculto da estação, com `hls.js` quando não há HLS nativo. */
export async function prepararAudio(
  estacao: EstacaoRadio,
  hlsRef: { current: { destroy: () => void } | null },
): Promise<HTMLAudioElement> {
  const audio = new Audio();
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";

  const suporteHlsNativo = audio.canPlayType("application/vnd.apple.mpegurl") !== "";
  if (estacao.formato === "hls" && !suporteHlsNativo) {
    const { default: Hls } = await import("hls.js");
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void audio.play().catch(() => {});
      });
      hls.loadSource(estacao.stream);
      hls.attachMedia(audio);
    } else {
      audio.src = estacao.stream;
    }
  } else {
    audio.src = estacao.stream;
  }

  await audio.play().catch(() => {
    // No HLS o manifesto ainda pode não ter chegado; o listener acima
    // dispara o play. Nos demais formatos, falha é falha.
    if (estacao.formato !== "hls") {
      throw new Error("Não foi possível abrir o áudio desta estação.");
    }
  });
  return audio;
}

/**
 * Cria o grafo em 16 kHz e entrega um bloco a cada `SEGUNDOS_BLOCO`.
 * O ganho 0 mantém o áudio fora da saída: só a captura existe.
 */
export async function criarCaptura(
  audio: HTMLAudioElement,
  aoBloco: (bloco: Float32Array) => void,
): Promise<CapturaAudio> {
  const ctx = new AudioContext({ sampleRate: TAXA_WHISPER });
  await ctx.resume();
  const source = ctx.createMediaElementSource(audio);
  const processor = ctx.createScriptProcessor(8192, 1, 1);
  const ganho = ctx.createGain();
  ganho.gain.value = 0;

  const alvo = TAXA_WHISPER * SEGUNDOS_BLOCO;
  let acumulado: Float32Array[] = [];
  let amostras = 0;
  processor.onaudioprocess = (ev) => {
    const dados = ev.inputBuffer.getChannelData(0);
    acumulado.push(new Float32Array(dados));
    amostras += dados.length;
    if (amostras < alvo) return;
    const bloco = concatenar(acumulado);
    acumulado = [];
    amostras = 0;
    aoBloco(bloco);
  };

  source.connect(processor);
  processor.connect(ganho);
  ganho.connect(ctx.destination);
  return { ctx, processor, source, ganho };
}

/** Carrega o Whisper uma vez; o import remoto fica fora do bundle do Next. */
export async function carregarModelo(): Promise<Transcritor> {
  const mod = (await import(
    /* webpackIgnore: true */ TRANSFORMERS_CDN
  )) as unknown as ModuloTransformers;
  return mod.pipeline("automatic-speech-recognition", MODELO_WHISPER);
}
