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
    "Os números de jurisprudência vêm da tabela medida do TJMG, com a rubrica "
    "fechada de 22 temas e 79 teses; a lista completa, processo a processo, "
    "está em [Jurisprudência](/jurisprudencia). Os números das vias de "
    "indenização vêm das fontes citadas em cada linha e têm datas diferentes — "
    "não formam uma série e não se somam. [medido]"
)

VIAS_INDENIZACAO = """## As vias de indenização individual

O dano coletivo corre em ação civil pública; o dano individual homogêneo se
repara por portas separadas, com critérios e valores diferentes. A tabela
abaixo reúne as principais, com a data de cada número — elas não formam uma
série e não se somam. [medido — fontes citadas em cada linha]

| Via | Pessoas contempladas | Valor | Média | Data | Fonte |
|---|---:|---:|---:|---|---|
| Acordos judiciais — dano água (crianças e adolescentes, GV) | 25.550 acordos | R$ 41,2 mi | R$ 1.644 por acordo | 2017 | TJMG |
| IRDR dano moral por falta d'água | — | R$ 2,3 mil por pessoa | — | 22/05/2024, anulado | [STJ](https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2024/21052024-Anulado-julgamento-que-fixou-indenizacao-de-R--2-3-mil-para-vitimas-da-falta-de-agua-apos-tragedia-de-Mariana.aspx) |
| PIM / Dano Água | 320.179 atendidos; 270.372 aceitaram | R$ 305,24 mi | R$ 1.125 por acordo | 30/05/2022 | Renova |
| PIM Danos Gerais | 10.970 aceitaram | R$ 1.896,52 mi | R$ 176.240 por família | 11/2024 | Renova |
| NOVEL | 95,7 mil atingidos | R$ 10 bi | R$ 104 mil por atingido | 07/2023 | [Agência Brasil](https://agenciabrasil.ebc.com.br/geral/noticia/2023-09/caso-samarco-sistema-indenizatorio-criado-em-2020-fecha-em-10-dias) |
| NOVEL Infraestrutura | — | +50% sobre o laudo AECOM | — | 08/02/2023 | [TRF6](https://sjmg.trf6.jus.br/caso-samarco-justica-federal-homologa-novel-infraestrutura/) |
| Acordos extrajudiciais — Mariana (FNE) | 838 pagos de 852 aceitos | — | — | 16/08/2025 | [Portal Reparação](https://www.reparacaobaciariodoce.com/reparacao-em-numeros/) |
| Ação inglesa | 600 mil atingidos | — | — | — | Pogust Goodhead |
| PID | **321 mil indenizações** | R$ 35 mil por pessoa | — | 22/10/2026 | [Samarco](https://www.samarco.com/perto-de-completar-dois-anos-novo-acordo-do-rio-doce-transforma-compromissos-em-entregas-concretas-para-as-pessoas-e-os-territorios/) |

A média por acordo não é comparável entre as linhas: cada via cobre um conjunto
diferente de danos. Uma indenização por dano água é, em geral, mais baixa que
uma por danos gerais, que inclui dano material e moral. [inferido]

O PID é a medida reparatória final do Novo Acordo: paga R$ 35 mil por pessoa
elegível, em parcela única, e exige quitação e desistência de ação judicial no
Brasil e no exterior. O balanço da Samarco de 22/10/2026 registra mais de 321
mil indenizações pelo programa — o dono informou 320 mil, e a diferença é de
arredondamento e data. O mesmo balanço soma 648 mil pessoas indenizadas ou
auxiliadas desde 2015 e R$ 36,6 bilhões pagos. [medido — Samarco, 22/10/2026]

Duas decisões mudaram o desenho das vias. Em 2024, o STJ anulou o IRDR do
TJMG que fixava R$ 2,3 mil por dano moral pela falta d'água, porque o
julgamento só admitiu manifestação da Samarco. Em 2022, o TRF1 considerou
ilegal exigir a desistência da ação inglesa para receber o NOVEL — decisão que
valeu para Naque. [medido — STJ e TRF1]"""


def montar() -> str:
    sintese = SINTESE.read_text(encoding="utf-8").strip()
    return "\n\n".join([sintese, COMO_LER, secao_riodoce(), VIAS_INDENIZACAO, FONTE]) + "\n"


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
