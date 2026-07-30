import type { Bloco, Oficio } from "@/lib/congresso/oficio/compor";

/**
 * DOCX e PDF do ofício — **só no browser** (Fase 6 da migração
 * Cloudflare/Neon).
 *
 * POR QUE ESTE ARQUIVO EXISTE SEPARADO de `render.ts`: `docx` e `pdf-lib`
 * custam ~304 KiB gzip, e o Worker do Cloudflare Free tem teto de 3 MB
 * gzip de bundle. Com as três zonas num Worker só, o build passou de
 * 3.250 KiB — 178 KiB ACIMA do teto, com o deploy recusado. Tirar estas
 * duas libs do bundle do servidor é o que devolve a margem.
 *
 * Não é só bundle: geração de DOCX/PDF no servidor também gastaria CPU
 * (teto de 10 ms/invocação no Free) por um trabalho que o browser do
 * usuário faz de graça. O `await import()` aqui é lazy de verdade — no
 * cliente vira um chunk separado, baixado só quando alguém clica em
 * "baixar .docx"/".pdf".
 *
 * As duas funções são cópia FIEL do que rodava no servidor (mesmos blocos,
 * mesma tipografia) — se divergissem, o usuário baixaria um documento
 * diferente do que revisou na tela, que é justamente o que
 * `render.ts` documenta como inaceitável.
 */

export async function renderDocx(
  oficio: Oficio,
  blocos: Bloco[] = oficio.blocos
): Promise<Uint8Array> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import("docx");

  const paragrafos = blocos.map((b) => {
    switch (b.tipo) {
      case "local_data":
        return new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 400 },
          children: [new TextRun(b.texto)],
        });
      case "vocativo":
        return new Paragraph({ spacing: { after: 200 }, children: [new TextRun(b.texto)] });
      case "referencia":
        return new Paragraph({
          spacing: { after: 400 },
          children: [new TextRun({ text: b.texto, bold: true })],
        });
      case "citacao":
        return new Paragraph({
          indent: { left: 1200 },
          spacing: { after: 240 },
          children: [new TextRun({ text: `“${b.texto}”`, italics: true, size: 20 })],
        });
      case "fecho":
        return new Paragraph({
          spacing: { before: 400, after: 600 },
          children: [new TextRun(b.texto)],
        });
      case "assinatura":
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          children: b.texto.split("\n").flatMap((linha, i) => [
            ...(i > 0 ? [new TextRun({ text: "", break: 1 })] : []),
            new TextRun(linha),
          ]),
        });
      default:
        return new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240, line: 360 },
          indent: { firstLine: 720 },
          children: [new TextRun(b.texto)],
        });
    }
  });

  const doc = new Document({
    creator: "Controle Popular — Congresso",
    title: oficio.titulo,
    styles: {
      default: {
        document: { run: { font: "Times New Roman", size: 24 } }, // 12pt
      },
    },
    sections: [{ properties: {}, children: paragrafos }],
  });

  return new Uint8Array(await Packer.toBuffer(doc));
}

export async function renderPdf(
  oficio: Oficio,
  blocos: Bloco[] = oficio.blocos
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const pdf = await PDFDocument.create();
  pdf.setTitle(oficio.titulo);
  pdf.setCreator("Controle Popular — Congresso");

  // Helvetica usa WinAnsiEncoding, que cobre todo o português (á à â ã ç
  // é ê í ó ô õ ú ü). Fonte customizada exigiria embutir arquivo e não
  // traria nada aqui.
  const fonte = await pdf.embedFont(StandardFonts.TimesRoman);
  const fonteItalica = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const fonteNegrito = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const A4: [number, number] = [595.28, 841.89];
  const MARGEM = 70;
  const TAMANHO = 12;
  const ENTRELINHA = 18;
  const largura = A4[0] - MARGEM * 2;

  let pagina = pdf.addPage(A4);
  let y = A4[1] - MARGEM;

  const novaPaginaSePreciso = (altura: number) => {
    if (y - altura < MARGEM) {
      pagina = pdf.addPage(A4);
      y = A4[1] - MARGEM;
    }
  };

  const quebrar = (texto: string, f: typeof fonte, tamanho: number, larg: number) => {
    const linhas: string[] = [];
    for (const paragrafo of texto.split("\n")) {
      let atual = "";
      for (const palavra of paragrafo.split(/\s+/)) {
        const teste = atual ? `${atual} ${palavra}` : palavra;
        if (f.widthOfTextAtSize(teste, tamanho) <= larg) {
          atual = teste;
        } else {
          if (atual) linhas.push(atual);
          atual = palavra;
        }
      }
      linhas.push(atual);
    }
    return linhas;
  };

  const escrever = (
    texto: string,
    opcoes: {
      f?: typeof fonte;
      tamanho?: number;
      recuo?: number;
      alinhamento?: "esquerda" | "direita" | "centro";
      espacoDepois?: number;
      primeiraLinhaRecuo?: number;
    } = {}
  ) => {
    const {
      f = fonte,
      tamanho = TAMANHO,
      recuo = 0,
      alinhamento = "esquerda",
      espacoDepois = 12,
      primeiraLinhaRecuo = 0,
    } = opcoes;

    const larg = largura - recuo;
    const linhas = quebrar(texto, f, tamanho, larg - primeiraLinhaRecuo);

    linhas.forEach((linha, i) => {
      novaPaginaSePreciso(ENTRELINHA);
      const w = f.widthOfTextAtSize(linha, tamanho);
      const recuoLinha = i === 0 ? primeiraLinhaRecuo : 0;
      let x = MARGEM + recuo + recuoLinha;
      if (alinhamento === "direita") x = A4[0] - MARGEM - w;
      if (alinhamento === "centro") x = (A4[0] - w) / 2;
      pagina.drawText(linha, { x, y, size: tamanho, font: f, color: rgb(0, 0, 0) });
      y -= ENTRELINHA;
    });
    y -= espacoDepois;
  };

  for (const b of blocos) {
    switch (b.tipo) {
      case "local_data":
        escrever(b.texto, { alinhamento: "direita", espacoDepois: 24 });
        break;
      case "vocativo":
        escrever(b.texto, { espacoDepois: 8 });
        break;
      case "referencia":
        escrever(b.texto, { f: fonteNegrito, espacoDepois: 24 });
        break;
      case "citacao":
        escrever(`“${b.texto}”`, { f: fonteItalica, tamanho: 11, recuo: 40 });
        break;
      case "fecho":
        y -= 12;
        escrever(b.texto, { espacoDepois: 40 });
        break;
      case "assinatura":
        escrever(b.texto, { alinhamento: "centro", espacoDepois: 0 });
        break;
      default:
        escrever(b.texto, { primeiraLinhaRecuo: 40 });
    }
  }

  return pdf.save();
}
