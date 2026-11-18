/**
 * Tipos da transcrição publicada junto de um post com áudio.
 *
 * O JSON em `data/transcricoes/` segue este contrato; o teste do blog
 * confere que todo post com `audio.transcricao` tem entrada no registro.
 */
export interface SegmentoTranscricao {
  /** Marca de tempo no formato HH:MM:SS. */
  t: string;
  /** Id de âncora, ex.: `t-00-00-31`. */
  id: string;
  texto: string;
}

export interface Transcricao {
  slug: string;
  /** Caminho do MP3 em `public/`. */
  audio: string;
  duracao: string;
  /** Modelo que transcreveu, para o leitor saber a origem do texto. */
  modelo: string;
  geradoEm: string;
  /** Download do .txt, quando existir. */
  arquivoTexto?: string;
  segmentos: SegmentoTranscricao[];
}
