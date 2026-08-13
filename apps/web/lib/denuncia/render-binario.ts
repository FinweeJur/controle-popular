import type { BlocoDenuncia, DocumentoDenuncia } from "@/lib/denuncia/compor";

/**
 * DOCX e PDF do registro de denúncia — **só no navegador**, nunca no servidor.
 *
 * Mesmo padrão de `lib/congresso/oficio/render-binario.ts` — reusado de
 * propósito, não reinventado (`renderPdf` de lá é a mesma lógica de
 * desenho manual com `pdf-lib`, só trocando os 6 tipos de `Bloco` do
 * ofício pelos 5 de `BlocoDenuncia`) — mas aqui o motivo principal se
 * inverte. Lá, o motivo original era técnico (bundle/CPU do Worker Free);
 * aqui o motivo técnico é o MESMO — `docx` + `pdf-lib` custam ~304 KiB
 * gzip juntos (número medido no arquivo irmão), e este Worker já está
 * perto do teto de 3 MB — mas ele é secundário: o motivo que decide é de
 * segurança física. Quem denuncia violação de direitos humanos pode estar
 * em risco, e a denúncia pode ser contra um agente do Estado — um portal
 * de transparência é exatamente o tipo de lugar que esse agente saberia
 * pedir para investigar. Se este arquivo rodasse no servidor, a rota que
 * o chamasse teria que RECEBER o texto da denúncia como corpo de
 * requisição — e nesse instante ele já teria passado pelo Worker e estaria
 * nos logs de observability, que é justamente a garantia que o facilitador
 * promete não quebrar.
 *
 * O PDF existe ao lado do DOCX, não no lugar dele: o DOCX supõe um editor
 * instalado, o PDF abre em qualquer celular — quem está em situação de
 * risco pode não ter Word no aparelho, e pode precisar MOSTRAR o
 * documento na tela para alguém (Defensoria, delegacia), não só guardá-lo.
 *
 * Por isso: nenhuma rota `route.din.ts` importa este arquivo. Só
 * `BaixarDocumento.tsx` (carregado com `next/dynamic({ ssr: false })`), no
 * clique de "baixar .docx"/"baixar .pdf" — o `await import()` de cada lib
 * aqui vira um chunk de cliente separado, baixado só nesse momento, e só
 * da lib que o formato escolhido precisa (clicar em .docx nunca baixa
 * `pdf-lib`, e vice-versa).
 */

type DocxModule = typeof import("docx");

function paragrafosDoBloco(
  b: BlocoDenuncia,
  lib: DocxModule
): InstanceType<DocxModule["Paragraph"]>[] {
  const { Paragraph, TextRun, HeadingLevel } = lib;
  switch (b.tipo) {
    case "titulo":
      return [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          spacing: { after: 300 },
          children: [new TextRun({ text: b.texto, bold: true })],
        }),
      ];
    case "subtitulo":
      return [
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
          children: [new TextRun({ text: b.texto, bold: true })],
        }),
      ];
    case "item":
      return [
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 80 },
          children: [new TextRun(b.texto)],
        }),
      ];
    case "aviso":
      return [
        new Paragraph({
          spacing: { before: 120, after: 180 },
          children: [new TextRun({ text: b.texto, italics: true })],
        }),
      ];
    default:
      return [
        new Paragraph({
          spacing: { after: 150, line: 300 },
          children: [new TextRun(b.texto)],
        }),
      ];
  }
}

export async function renderDocxDenuncia(documento: DocumentoDenuncia): Promise<Uint8Array> {
  const docx = await import("docx");
  const { Document, Packer } = docx;

  const paragrafos = documento.blocos.flatMap((b) => paragrafosDoBloco(b, docx));

  const doc = new Document({
    creator: "Controle Popular — Direitos em Movimento",
    title: documento.titulo,
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 24 } }, // 12pt
      },
    },
    sections: [{ properties: {}, children: paragrafos }],
  });

  return new Uint8Array(await Packer.toBuffer(doc));
}

/**
 * PDF do registro — cópia do desenho manual de `renderPdf` em
 * `lib/congresso/oficio/render-binario.ts` (mesma A4, mesma margem, mesmo
 * "escrever com quebra de linha manual", porque `pdf-lib` não tem layout
 * de parágrafo pronto), só trocando os 6 tipos de `Bloco` do ofício pelos
 * 5 de `BlocoDenuncia`. Times New Roman por padrão como no ofício — não é
 * escolha nova, é a MESMA fonte que já cobre todo o português acentuado
 * com `WinAnsiEncoding` sem precisar embutir arquivo de fonte.
 */
export async function renderPdfDenuncia(documento: DocumentoDenuncia): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const pdf = await PDFDocument.create();
  pdf.setTitle(documento.titulo);
  pdf.setCreator("Controle Popular — Direitos em Movimento");

  const fonte = await pdf.embedFont(StandardFonts.TimesRoman);
  const fonteItalica = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const fonteNegrito = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const A4: [number, number] = [595.28, 841.89];
  const MARGEM = 70;
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
    opcoes: { f?: typeof fonte; tamanho?: number; recuo?: number; espacoDepois?: number } = {}
  ) => {
    const { f = fonte, tamanho = 12, recuo = 0, espacoDepois = 12 } = opcoes;
    const entrelinha = tamanho + 6;
    const linhas = quebrar(texto, f, tamanho, largura - recuo);
    linhas.forEach((linha) => {
      novaPaginaSePreciso(entrelinha);
      pagina.drawText(linha, { x: MARGEM + recuo, y, size: tamanho, font: f, color: rgb(0, 0, 0) });
      y -= entrelinha;
    });
    y -= espacoDepois;
  };

  for (const b of documento.blocos) {
    switch (b.tipo) {
      case "titulo":
        escrever(b.texto, { f: fonteNegrito, tamanho: 18, espacoDepois: 20 });
        break;
      case "subtitulo":
        escrever(b.texto, { f: fonteNegrito, tamanho: 13, espacoDepois: 8 });
        break;
      case "item":
        escrever(`•  ${b.texto}`, { recuo: 14, espacoDepois: 6 });
        break;
      case "aviso":
        escrever(b.texto, { f: fonteItalica, espacoDepois: 14 });
        break;
      default:
        escrever(b.texto, { espacoDepois: 12 });
    }
  }

  return pdf.save();
}

export const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const MIME_PDF = "application/pdf";

/**
 * Nome de arquivo seguro em Windows, macOS e Linux — sem data pessoal no
 * nome. `formato` tem o mesmo default de sempre (`docx`) para não quebrar
 * quem já chamava esta função sem argumento.
 */
export function nomeArquivoDenuncia(formato: "docx" | "pdf" = "docx"): string {
  const agora = new Date();
  const carimbo = agora.toISOString().slice(0, 10);
  return `registro-de-denuncia-${carimbo}.${formato}`;
}
