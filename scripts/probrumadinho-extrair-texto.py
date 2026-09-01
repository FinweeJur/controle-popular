#!/usr/bin/env python3
"""
Extrai as primeiras páginas dos PDFs do acervo Pró-Brumadinho (Governo de MG)
para alimentar a geração de micro-resumos.

Fonte: C:/Users/Home/.kimi_openclaw/workspace/documentos_pro_brumadinho/
  - mapa_documentos_pro_brumadinho.csv  (titulo,url,orgao,ano,tipo,status,content_type)
  - pdfs/                               (arquivos baixados em 31/08/2026)

Saída: scripts/_tmp-probrumadinho/textos.json  (NÃO versionar)

═══ SANITIZAÇÃO ANTES DO LLM (regra 8 do AGENTS.md) ═══

Ato oficial pode trazer CPF de pessoa física no corpo do texto (já aconteceu
neste repositório com ementa de TAC do IBAMA). Nenhum texto bruto sai desta
máquina para prompt de LLM sem antes passar pela máscara de CPF abaixo —
regex de formato + confirmação mod-11, a mesma régua base de
`scripts/checar-dado-pessoal-em-dado.py`. O que mascara aqui vira
"[CPF-REMOVIDO]" no JSON de saída.

O casamento CSV × arquivo é por título NORMALIZADO (sem acento, sem pontuação,
caixa baixa): o nome do arquivo é o título do CSV com `_` no lugar de
espaços/pontos e o sufixo `_<ano>`. O que não casar é RELATADO no final —
nunca forçado.
"""

import csv
import json
import re
import sys
import unicodedata
from pathlib import Path

import pymupdf

FONTE = Path("C:/Users/Home/.kimi_openclaw/workspace/documentos_pro_brumadinho")
CSV_FONTE = FONTE / "mapa_documentos_pro_brumadinho.csv"
PASTA_PDFS = FONTE / "pdfs"
SAIDA = Path("scripts/_tmp-probrumadinho/textos.json")

PAGINAS = 2
MAX_CARACTERES = 6000

CPF_REGEX = re.compile(r"\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}")


def cpf_valido(digitos: str) -> bool:
    """mod-11 de CPF — mesma régua base do checar-dado-pessoal-em-dado.py."""
    if len(digitos) != 11 or len(set(digitos)) == 1:
        return False
    for corte in (9, 10):
        soma = sum(int(digitos[i]) * (corte + 1 - i) for i in range(corte))
        dv = (soma * 10) % 11 % 10
        if dv != int(digitos[corte]):
            return False
    return True


def mascarar_cpf(texto: str) -> tuple[str, int]:
    """Substitui ocorrências que passam no mod-11. Retorna (texto, n_mascarados)."""
    n = 0

    def troca(m: re.Match) -> str:
        nonlocal n
        digitos = re.sub(r"\D", "", m.group(0))
        if cpf_valido(digitos):
            n += 1
            return "[CPF-REMOVIDO]"
        return m.group(0)

    return CPF_REGEX.sub(troca, texto), n


def normalizar(texto: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", texto)
    sem_acento = "".join(c for c in sem_acento if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", sem_acento.lower())


def main() -> int:
    SAIDA.parent.mkdir(parents=True, exist_ok=True)

    linhas = list(csv.DictReader(open(CSV_FONTE, encoding="utf-8-sig")))
    arquivos = {normalizar(p.stem): p.name for p in PASTA_PDFS.iterdir() if p.is_file()}

    itens = []
    sem_arquivo = []
    cpfs_mascarados = 0
    for linha in linhas:
        titulo = linha["titulo"].strip()
        alvo = normalizar(titulo)
        # casa por prefixo: o arquivo é "<titulo normalizado><sufixo>"
        candidatos = [nome for chave, nome in arquivos.items() if chave.startswith(alvo)]
        # desempate: o arquivo exato é "<titulo>_<ano>" normalizado
        if len(candidatos) > 1 and linha["ano"].strip():
            exato = alvo + normalizar(linha["ano"].strip())
            candidatos = [arquivos[c] for c in (normalizar(Path(n).stem) for n in candidatos) if c == exato]
        if not candidatos:
            # fallback 1: o título contém a chave do arquivo (títulos truncados no nome)
            candidatos = [nome for chave, nome in arquivos.items() if alvo.startswith(chave) and len(chave) > 15]
        if not candidatos and "(" in titulo:
            # fallback 2: o nome do arquivo truncou antes do parêntese ("(CONSAD 2022)" virou "_CONSAD 2_2022")
            base = normalizar(titulo.split("(")[0])
            candidatos = [nome for chave, nome in arquivos.items() if chave.startswith(base)]
        if len(candidatos) != 1:
            sem_arquivo.append({"titulo": titulo, "candidatos": candidatos})
            continue
        arquivo = candidatos[0]
        trecho = ""
        if arquivo.lower().endswith(".pdf"):
            try:
                with pymupdf.open(PASTA_PDFS / arquivo) as doc:
                    trecho = "\n".join(doc[i].get_text() for i in range(min(PAGINAS, len(doc))))
            except Exception as exc:  # PDF corrompido não derruba a rodada
                trecho = f"[ERRO DE LEITURA: {exc}]"
        trecho = " ".join(trecho.split())[:MAX_CARACTERES]
        trecho, n = mascarar_cpf(trecho)
        cpfs_mascarados += n
        itens.append({
            "titulo": titulo,
            "arquivo": arquivo,
            "url": linha["url"].strip(),
            "orgao": linha["orgao"].strip(),
            "ano": linha["ano"].strip(),
            "tipo": linha["tipo"].strip(),
            "trecho": trecho,
        })

    SAIDA.write_text(json.dumps(itens, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"linhas no CSV: {len(linhas)}")
    print(f"casados com arquivo: {len(itens)}")
    print(f"sem arquivo (ou ambíguo): {len(sem_arquivo)}")
    for s in sem_arquivo:
        print(f"  - {s['titulo']}  candidatos={s['candidatos']}")
    print(f"CPFs mascarados antes de qualquer LLM: {cpfs_mascarados}")
    print(f"saída: {SAIDA}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
