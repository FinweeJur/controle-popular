import type { BlocoDenuncia, DocumentoDenuncia } from "@/lib/denuncia/compor";

/**
 * DOCX do registro de denúncia — **só no navegador**, nunca no servidor.
 *
 * Mesmo padrão de `lib/congresso/oficio/render-binario.ts` — reusado de
 * propósito, não reinventado — mas aqui o motivo principal se inverte. Lá,
 * o motivo original era técnico (bundle/CPU do Worker Free); aqui o motivo
 * técnico é o MESMO (`docx` custa ~150 KiB gzip sozinho, e este Worker já
 * está perto do teto de 3 MB), mas ele é secundário: o motivo que decide é
 * de segurança física. Quem denuncia violação de direitos humanos pode
 * estar em risco, e a denúncia pode ser contra um agente do Estado — um
 * portal de transparência é exatamente o tipo de lugar que esse agente
 * saberia pedir para investigar. Se este arquivo rodasse no servidor, a
 * rota que o chamasse teria que RECEBER o texto da denúncia como corpo de
 * requisição — e nesse instante ele já teria passado pelo Worker e estaria
 * nos logs de observability, que é justamente a garantia que o facilitador
 * promete não quebrar.
 *
 * Por isso: nenhuma rota `route.din.ts` importa este arquivo. Só
 * `BaixarDocumento.tsx` (carregado com `next/dynamic({ ssr: false })`), no
 * clique de "baixar .docx" — o `await import()` aqui vira um chunk de
 * cliente separado, baixado só nesse momento.
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

export const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Nome de arquivo seguro em Windows, macOS e Linux — sem data pessoal no nome. */
export function nomeArquivoDenuncia(): string {
  const agora = new Date();
  const carimbo = agora.toISOString().slice(0, 10);
  return `registro-de-denuncia-${carimbo}.docx`;
}
