import type { SegmentoTranscricao, Transcricao } from "./transcricao-tipos";
import comissaoDireitosHumanos from "@/data/transcricoes/comissao-direitos-humanos.json";

/**
 * Registro das transcrições publicadas.
 *
 * Cada arquivo em `data/transcricoes/` é a versão estruturada do áudio
 * anexado a um post. A chave é o slug do post — é o que liga
 * `post.audio.transcricao` à página `/noticias/<slug>/transcricao`.
 *
 * Por que um registro e não leitura de diretório: o build estático precisa
 * de `generateStaticParams` síncrono e tipado. Acrescentar uma transcrição é
 * importar o JSON e incluir a linha aqui.
 */
const REGISTRO: Record<string, Transcricao> = {
  "oab-mg-onze-anos-mariana-reparacao-saude":
    comissaoDireitosHumanos as Transcricao,
};

export function obterTranscricao(slug: string): Transcricao | null {
  return REGISTRO[slug] ?? null;
}

export function listarTranscricoes(): { slug: string; transcricao: Transcricao }[] {
  return Object.entries(REGISTRO).map(([slug, transcricao]) => ({
    slug,
    transcricao,
  }));
}

export type { SegmentoTranscricao, Transcricao };
