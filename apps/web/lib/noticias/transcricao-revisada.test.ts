/**
 * @file Guarda da transcrição revisada publicada em sanfona.
 *
 * O post com áudio aponta para `#transcricao`; a sanfona lê o JSON em
 * `data/transcricoes/`. Se o slug do JSON, o do post ou o arquivo de áudio se
 * desencontrarem, a sanfona some sem aviso — este teste amarra os três.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import noticiasRaw from "@/data/noticias-portal.json";
import transcricao from "@/data/transcricoes/comissao-direitos-humanos.json";
import type { NoticiaPortal } from "./portal";

interface Bloco {
  quem: string;
  texto: string;
}
interface Secao {
  titulo: string;
  blocos: Bloco[];
}
interface TranscricaoRevisada {
  slug: string;
  titulo: string;
  nota: string;
  secoes: Secao[];
}

const DADOS = transcricao as TranscricaoRevisada;
const POSTS = noticiasRaw as unknown as NoticiaPortal[];
const PUBLIC = fileURLToPath(new URL("../../public", import.meta.url));

describe("transcrição revisada do post com áudio", () => {
  const post = POSTS.find((p) => p.slug === DADOS.slug);

  it("aponta para um post existente e para a âncora da sanfona", () => {
    expect(post, `post ausente: ${DADOS.slug}`).toBeDefined();
    expect(post!.audio?.transcricao).toBe("#transcricao");
    expect(post!.audio?.arquivo.startsWith("/audio/")).toBe(true);
  });

  it("o áudio existe em public/", () => {
    expect(existsSync(`${PUBLIC}${post!.audio!.arquivo}`)).toBe(true);
  });

  it("tem seções com fala atribuída e texto não vazio", () => {
    expect(DADOS.secoes.length).toBeGreaterThanOrEqual(2);
    for (const secao of DADOS.secoes) {
      expect(secao.titulo.trim().length).toBeGreaterThan(0);
      expect(secao.blocos.length).toBeGreaterThan(0);
      for (const bloco of secao.blocos) {
        expect(bloco.quem.trim().length).toBeGreaterThan(0);
        expect(bloco.texto.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it("não tem mojibake nem marcador de revisão pendente", () => {
    const texto = JSON.stringify(DADOS);
    for (const marca of ["Ã£", "Ã©", "Ã§", "â€", "�", "[...]", "TODO"]) {
      expect(texto.includes(marca), `marca encontrada: ${marca}`).toBe(false);
    }
  });
});
