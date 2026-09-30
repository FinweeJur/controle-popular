"""Gera o .docx da revisão com SÓ o conteúdo visível ao leitor.

Pedido do dev em 30/09/2026: "me gere um .docx com só o que fica
visível pro usuário". O .md de revisão carrega metadados, colunas de
antes x depois e medições — ótimo para conferência técnica, ruim para
leitura no Word. Este script é o oposto: nada de tabela comparativa,
só o que aparece na tela da Mística do Dia.

O que é visível (app/components/MisticaDoDia.tsx):
  1. ano + título (juntos, ano em negrito) — o ano SÓ aparece quando o
     título não traz o ano (unificação das datas, dev 30/09/2026);
  2. resumo, quando existe (no máximo 2 frases: cada história cabe em
     2 parágrafos, dev 30/09/2026);
  3. aviso "Fato do calendário sem data no original" (semData);
  4. "Fonte: " + citação CURTA `(Obra, Autor, Data)` — a mesma
     `fonteCurta()` de lib/memoria/mistica.ts, com link quando houver.

Entrada:  TEMP/calendario.novo.json  (saída do gerador)
Saída:    docs/planos/REVISAO-RESUMOS-MISTICA.docx

O dia entra como título de seção só para navegação — é o dia que o
calendário serve, não um dado da tela.
"""
from __future__ import annotations

import json
from pathlib import Path

from docx import Document
from docx.shared import Pt

TEMP = Path(r"C:\Users\teste\AppData\Local\Temp\opencode")
REPO = Path(r"X:\DevCoder\OpenCode\controle-popular")
NOVO = TEMP / "calendario.novo.json"
DESTINO = REPO / "docs/planos/REVISAO-RESUMOS-MISTICA.docx"

MESES_LONGO = {
    1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril", 5: "maio",
    6: "junho", 7: "julho", 8: "agosto", 9: "setembro", 10: "outubro",
    11: "novembro", 12: "dezembro",
}


def mostra_selo_ano(e: dict) -> bool:
    """Selo de ano só quando o título não traz o ano (fonte: mostrarAnoSelo)."""
    ano = e.get("ano", "")
    return bool(ano) and ano not in e.get("titulo", "")


def rotulo_dia(dia_mes: str) -> str:
    """'05-25' -> '25 de maio' (seção de navegação do Word)."""
    m, d = dia_mes.split("-")
    return f"{int(d)} de {MESES_LONGO[int(m)]}"


def main() -> int:
    entradas = json.loads(NOVO.read_text(encoding="utf-8"))

    doc = Document()
    doc.core_properties.title = "Revisão dos resumos da Mística do Dia"
    doc.core_properties.comments = (
        "Só o conteúdo visível na tela: ano + título, resumo e fonte curta. "
        "Gerado por scripts/memoria/gera-doc-resumos-mistica-docx.py."
    )

    doc.add_heading("Mística do Dia — o que aparece na tela", level=0)
    intro = doc.add_paragraph(
        "Cada verbete abaixo é exatamente o bloco da home: ano + título, "
        "resumo e fonte curta (Obra, Autor, Data). O ano só aparece quando "
        "o título não traz o ano. Sem colunas de antes x depois — a "
        "comparação técnica fica em REVISAO-RESUMOS-MISTICA.md."
    )
    intro.runs[0].font.size = Pt(10)

    dia_atual = None
    for e in entradas:
        if e["diaMes"] != dia_atual:
            dia_atual = e["diaMes"]
            doc.add_heading(rotulo_dia(dia_atual), level=2)

        # ano + título: o selo de ano só entra quando o título não o traz
        p = doc.add_paragraph()
        if mostra_selo_ano(e):
            negrito = p.add_run(f"{e['ano']}: ")
            negrito.bold = True
        p.add_run(e["titulo"])

        if e.get("resumo"):
            resumo = doc.add_paragraph(e["resumo"])
            resumo.paragraph_format.space_after = Pt(2)

        if e.get("semData"):
            aviso = doc.add_paragraph(
                "Fato do calendário sem data no original — exibido para "
                "não deixar o dia vazio."
            )
            aviso.runs[0].italic = True
            aviso.runs[0].font.size = Pt(9)

        fonte = doc.add_paragraph()
        rotulo = fonte.add_run("Fonte: ")
        rotulo.bold = True
        fonte.add_run(e.get("fonteCurta", ""))
        fonte.paragraph_format.space_after = Pt(10)

    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    doc.save(DESTINO)
    print(f"docx: {DESTINO} | verbetes: {len(entradas)} | "
          f"{DESTINO.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
