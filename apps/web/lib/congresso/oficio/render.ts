import type { Bloco, Oficio } from "@/lib/congresso/oficio/compor";

/**
 * Renderizadores do ofício. Os três formatos partem da MESMA lista de
 * blocos — nenhum deles reescreve texto. Se o TXT e o DOCX pudessem
 * divergir, o usuário assinaria um documento diferente do que revisou na
 * tela.
 */

const LARGURA_TXT = 78;

function quebrarLinhas(texto: string, largura: number): string[] {
  const linhas: string[] = [];
  for (const paragrafo of texto.split("\n")) {
    let atual = "";
    for (const palavra of paragrafo.split(/\s+/)) {
      if (!atual) {
        atual = palavra;
      } else if ((atual + " " + palavra).length <= largura) {
        atual += " " + palavra;
      } else {
        linhas.push(atual);
        atual = palavra;
      }
    }
    linhas.push(atual);
  }
  return linhas;
}

export function renderTxt(oficio: Oficio, blocos: Bloco[] = oficio.blocos): string {
  const partes: string[] = [];

  if (oficio.destinatarios.length > 1) {
    partes.push(
      "Destinatários:\n" +
        oficio.destinatarios
          .map((d) => `  - ${d.cargo} ${d.nome}${d.email ? ` <${d.email}>` : ""}`)
          .join("\n")
    );
  }

  for (const b of blocos) {
    switch (b.tipo) {
      case "citacao":
        partes.push(quebrarLinhas(`“${b.texto}”`, LARGURA_TXT - 4).map((l) => `    ${l}`).join("\n"));
        break;
      case "assinatura":
        partes.push("\n" + "_".repeat(40) + "\n" + b.texto);
        break;
      default:
        partes.push(quebrarLinhas(b.texto, LARGURA_TXT).join("\n"));
    }
  }

  return partes.join("\n\n") + "\n";
}

/**
 * DOCX e PDF NÃO ficam aqui: vivem em `render-binario.ts` e rodam só no
 * browser.
 *
 * `docx` + `pdf-lib` custam ~304 KiB gzip. Com as três zonas num Worker
 * só, o bundle deu 3.250 KiB contra o teto de 3.072 KiB (3 MB) do
 * Cloudflare Workers Free — deploy recusado. Este arquivo tem de continuar
 * livre de dependência pesada: ele é importado pelo route handler, logo
 * entra no bundle do servidor.
 */

export const MIME: Record<string, string> = {
  txt: "text/plain; charset=utf-8",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

/** Nome de arquivo seguro em Windows, macOS e Linux. */
export function nomeArquivo(oficio: Oficio, formato: string): string {
  const base = oficio.titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 80);
  return `${base || "oficio"}.${formato}`;
}
