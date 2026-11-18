/**
 * @file Guarda das transcrições publicadas.
 *
 * O post com áudio aponta para `/noticias/<slug>/transcricao`. Se o registro
 * da transcrição e o post se desencontrarem, a página some e o link do post
 * cai em 404 — e ninguém percebe até alguém clicar. Este teste amarra os dois
 * lados e confere o arquivo de áudio no `public/`.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import noticiasRaw from "@/data/noticias-portal.json";
import { listarTranscricoes } from "./transcricoes";
import type { NoticiaPortal } from "./portal";

const POSTS = noticiasRaw as unknown as NoticiaPortal[];
const PUBLIC = fileURLToPath(new URL("../../public", import.meta.url));

describe("transcrições do blog", () => {
  it("tem pelo menos uma transcrição registrada", () => {
    expect(listarTranscricoes().length).toBeGreaterThan(0);
  });

  it("cada transcrição aponta para um post existente e para a própria página", () => {
    for (const { slug, transcricao } of listarTranscricoes()) {
      const post = POSTS.find((p) => p.slug === slug);
      expect(post, `post ausente: ${slug}`).toBeDefined();
      expect(post!.audio?.transcricao).toBe(`/noticias/${slug}/transcricao`);
      expect(transcricao.slug).toBe(slug);
    }
  });

  it("o áudio existe em public/", () => {
    for (const { transcricao } of listarTranscricoes()) {
      const caminho = `${PUBLIC}${transcricao.audio}`;
      expect(existsSync(caminho), `áudio ausente: ${transcricao.audio}`).toBe(true);
    }
  });

  it("as marcas de tempo são válidas e os ids são únicos", () => {
    for (const { transcricao } of listarTranscricoes()) {
      const ids = new Set<string>();
      for (const segmento of transcricao.segmentos) {
        expect(segmento.t).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        expect(segmento.id).toMatch(/^t-\d{2}-\d{2}-\d{2}$/);
        expect(ids.has(segmento.id), `id repetido: ${segmento.id}`).toBe(false);
        ids.add(segmento.id);
        expect(segmento.texto.length).toBeGreaterThan(0);
      }
    }
  });
});
