#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  TabStopType,
  TabStopPosition,
  BorderStyle,
  convertInchesToTwip,
  Footer,
  Header,
  PageNumber,
  NumberFormat,
  ExternalHyperlink,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

const md = readFileSync("docs/RELATORIO-TECNICO-PORTAL.md", "utf-8");

function parseMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip horizontal rules
    if (/^---+\s*$/.test(line)) continue;

    // Tables - collect rows
    if (line.includes("|") && line.trim().startsWith("|")) {
      if (!/^\|[\s-|]+\|$/.test(line)) {
        // Not a separator row
        const cells = line
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim());
        tableRows.push(cells);
      }
      inTable = true;
      continue;
    } else if (inTable) {
      // End of table - render a real Word table (células + bordas)
      if (tableRows.length > 0) {
        elements.push(tabelaDocx(tableRows));
        elements.push(new Paragraph({ children: [], spacing: { after: 80 } }));
        tableRows = [];
      }
      inTable = false;
    }

    // Headings
    if (line.startsWith("# ")) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^#\s+/, ""),
              bold: true,
              font: "Calibri",
              size: 32,
            }),
          ],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
        })
      );
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^##\s+/, ""),
              bold: true,
              font: "Calibri",
              size: 28,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        })
      );
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^###\s+/, ""),
              bold: true,
              font: "Calibri",
              size: 24,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
      continue;
    }

    if (line.startsWith("#### ")) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^####\s+/, ""),
              bold: true,
              font: "Calibri",
              size: 22,
            }),
          ],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 150, after: 80 },
        })
      );
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      elements.push(
        new Paragraph({ children: [], spacing: { after: 80 } })
      );
      continue;
    }

    // Regular paragraphs with inline formatting
    const runs = parseInlineFormatting(line);
    elements.push(
      new Paragraph({
        children: runs,
        spacing: { after: 100 },
        alignment: AlignmentType.JUSTIFIED,
      })
    );
  }

  // Flush remaining table rows
  if (tableRows.length > 0) {
    elements.push(tabelaDocx(tableRows));
  }

  return elements;
}

/** Tabela markdown → TableCell com célula e borda. Células cujas linhas correm na fonte (com hiperlinks). */
const FORMATO_CELULA = {
  font: "Calibri",
  size: 20,
};
function celulasDaLinha(cells) {
  return cells.map(
    (cell) =>
      new TableCell({
        children: [new Paragraph({ children: parseInlineFormatting(cell) })],
      })
  );
}
function tabelaDocx(rowsIn) {
  const [cabecalho, ...linhas] = rowsIn;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: cabecalho.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      ...FORMATO_CELULA,
                      text: cell.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
                      bold: true,
                    }),
                  ],
                }),
              ],
            })
        ),
      }),
      ...linhas.map(
        (cells) =>
          new TableRow({
            children: cells.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ children: parseInlineFormatting(cell) })],
                })
            ),
          })
      ),
    ],
  });
}

function parseInlineFormatting(text) {
  const runs = [];
  // Quebra em **bold** e [texto](url); o que não casa nada vira corrido.
  const parts = text.split(/(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^()]+\))/g).filter(Boolean);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          font: "Calibri",
          size: 22,
        })
      );
      continue;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      runs.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: link[1],
              style: "Hyperlink",
              font: "Calibri",
              size: 22,
              color: "0563C1",
              underline: { type: "single" },
            }),
          ],
          link: link[2],
        })
      );
      continue;
    }
    runs.push(
      new TextRun({
        text: part,
        font: "Calibri",
        size: 22,
      })
    );
  }
  return runs;
}

const elements = parseMarkdown(md);

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.18),
            right: convertInchesToTwip(1.18),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "RELATÓRIO TÉCNICO — Portal Controle Popular",
                  font: "Calibri",
                  size: 18,
                  italics: true,
                  color: "888888",
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: "Calibri",
                  size: 18,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      children: elements,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("docs/RELATORIO-TECNICO-PORTAL.docx", buffer);
console.log("docx gerado: docs/RELATORIO-TECNICO-PORTAL.docx");
