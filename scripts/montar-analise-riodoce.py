# -*- coding: utf-8 -*-
"""Monta a análise do Rio Doce com as tabelas que a página exibe.

POR QUE EXISTE

A síntese do litoral (`docs/pesquisa/consensus/sintese-02-rio-doce-litoral.md`)
responde "o que a evidência permite afirmar" sobre a pluma. Falta o outro lado:
o que os tribunais decidiram. Este script junta os dois — o texto citado e as
contagens da rubrica fechada — sem deixar o modelo escrever número.

REGRA: nenhum número vem de modelo. Todos saem de
`temas-gerais-brumadinho.json` e `temas-gerais-riodoce.json`, via
`tabelas-jurisprudencia.py`, a partir dos achados auditados.

Uso:
    python scripts/montar-analise-riodoce.py
"""
from __future__ import annotations

import json
from pathlib import Path

from tabelas_jurisprudencia import secao_riodoce

RAIZ = Path(__file__).resolve().parents[1]
SINTESE = RAIZ / "docs" / "pesquisa" / "consensus" / "sintese-02-rio-doce-litoral.md"
SAIDA = RAIZ / "apps" / "web" / "data" / "analises" / "rio-doce.json"

COMO_LER = """## Como ler estas tabelas

A unidade de contagem não é o processo, é o **achado**: um trecho de ementa
classificado com um tema e uma tese. Um mesmo processo pode discutir dano moral,
prova pericial e nexo causal — e então entra três vezes. Por isso a soma dos N de
um tema não é o número de processos, e maior N não significa mais processos.

A **tese** é um rótulo fechado de uma lista de 79, distribuída em 22 temas. O
classificador escolhe o rótulo; não inventa. A **fatia** é quanto a tese
dominante ocupa dentro do tema: mede o peso da tese naquele conjunto de achados,
não a probabilidade de o leitor ganhar ou perder. O **sentido** diz a quem a tese
favorece, na leitura do próprio classificador. [medido — rubrica medida]

Nas tabelas, a barra mostra o volume do tema em relação ao maior tema da
tabela, e o N fica dentro dela. A fatia da tese dominante aparece escrita na
coluna da tese — são duas medidas diferentes, e misturá-las num desenho só
faria a barra mentir. [medido — tabela medida]

Tudo é lido da **ementa**, o resumo que o tribunal escreve no topo da decisão.
Ementa não é o voto: o que o acórdão decide pode ser mais nuançado do que a
frase catalogada. É por isso que cada afirmação abaixo traz o número e o texto
citado, e não uma conclusão solta. [medido — tabela medida]"""

FONTE = (
    "Os números desta página vêm da tabela medida da jurisprudência do TJMG, "
    "com a rubrica fechada de 22 temas e 79 teses. A lista completa, processo a "
    "processo, está em [Jurisprudência](/jurisprudencia). [medido]"
)


def montar() -> str:
    sintese = SINTESE.read_text(encoding="utf-8").strip()
    return "\n\n".join([sintese, COMO_LER, secao_riodoce(), FONTE]) + "\n"


def main() -> int:
    markdown = montar()
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    anterior = {}
    if SAIDA.exists():
        anterior = json.loads(SAIDA.read_text(encoding="utf-8"))
    SAIDA.write_text(
        json.dumps(
            {
                "rota": "/ambiental/rio-doce/analise",
                "titulo": anterior.get("titulo") or "Análise integrada — Rio Doce e litoral",
                "geradoEm": "2026-11-08",
                "markdown": markdown,
            },
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )
    tabelas = sum(1 for linha in markdown.splitlines() if linha.startswith("|"))
    print(f"rio-doce: {len(markdown)} caracteres | {tabelas} linhas de tabela")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
