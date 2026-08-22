"""etl.diario — classificação determinística do TIPO de uma matéria do diário
oficial, a partir do título (cabeçalho). Porta em Python de
`apps/web/lib/diario/classificarAto.ts`: MESMA lógica, MESMA ordem de regras,
MESMA calibração.

═══ POR QUE ISTO NÃO VIVE EM `etl/camaras/sigpub.py` ═══

A classificação é sobre o TEXTO do título, não sobre a plataforma que o
publicou — o mesmo raciocínio de `etl/temas.py` (compartilhado por
`camaras/sapl.py`, `camaras/syssolution.py`, `pbh/legislacao.py`,
`psp/legislacao.py`). O plano (`docs/planos/diario-oficial-plano.md`) prevê
D2 (Betim), D3 (BH) e D4 (SP) depois do SIGPub — coletores de OUTRAS
plataformas, mesma classificação. Duplicar a regex dentro de `sigpub.py`
funcionaria hoje e divergiria da versão TS na primeira mudança que alguém
esquecesse de replicar nos três lugares.

═══ POR QUE UM PORT MANUAL, E NÃO CHAMAR O TS DE DENTRO DO PYTHON ═══

O coletor é Python (padrão de `etl/betim`); o classificador de referência já
existe em TypeScript porque foi escrito primeiro para a tela do portal
(`apps/web/lib/diario/`). Rodar Node a partir de um coletor Python para
classificar cada título seria uma dependência de runtime cruzada só para
nove regras de regex — mais frágil que portar a lógica (curta, auditável) e
CONFERIR a fidelidade do port contra a MESMA fixture de calibração que o
teste TypeScript usa (`etl/diario_test.py`, que lê
`apps/web/lib/diario/fixtures/diamantina-70-titulos.json` diretamente — não
uma cópia, para as duas linguagens nunca divergirem sem que um teste acuse).

═══ A ORDEM DAS REGRAS É DECISÃO, NÃO ACASO (herdado do TS) ═══

"EXTRATO DE CONTRATO AO PROCESSO LICITATÓRIO" contém os dois mundos
(CONTRATO e LICITAÇÃO): é CONTRATO, porque o ato publicado é o contrato.
"TERMO DE HOMOLOGAÇÃO AO CONTRATO" também. Por isso as regras de convênio e
contrato vêm ANTES do balaio de licitação — caso contrário homologação de
contrato viraria edital. Ver `classificarAto.ts` para a decisão original.
"""
from __future__ import annotations

import unicodedata

# Os 7 tipos fechados de `atos_diario.tipo` (migration
# `supabase/betim/migrations/0077_atos_diario.sql`, CHECK constraint) — a
# MESMA lista de `TIPOS_ATO` em `classificarAto.ts`, na mesma ordem de
# exibição (a mais comentada primeiro, "outro" por último).
TIPOS_ATO: tuple[str, ...] = (
    "decreto",
    "edital",
    "contrato",
    "convenio",
    "portaria",
    "lei",
    "outro",
)

ROTULOS_TIPO: dict[str, str] = {
    "decreto": "Decreto",
    "edital": "Licitação/edital",
    "contrato": "Contrato",
    "convenio": "Convênio/parceria",
    "portaria": "Portaria",
    "lei": "Lei",
    "outro": "Outro",
}

# Palavras que marcam o processo de licitação, em ordem de leitura — igual a
# `PALAVRAS_DE_LICITACAO` em classificarAto.ts.
_PALAVRAS_DE_LICITACAO: tuple[str, ...] = (
    "LICIT",
    "EDITAL",
    "CREDENCIAMENTO",
    "DISPENSA",
    "INEXIGIBILIDADE",
    "CHAMAMENTO PUBLICO",
    "HOMOLOGACAO",
    "ADJUDICACAO",
    "IMPUGNACAO",
)

# Palavras isoladas (não substring) — o TS usa `\bCONVENIO\b` e
# `\b(FOMENTO|COLABORACAO)\b`. Sem o limite de palavra, um título como
# "INCONVENIENTE" bateria em "CONVENIO" por substring — não aconteceu na
# amostra de 70, mas o `\b` do original é deliberado, então o port preserva.
_PALAVRAS_DE_CONVENIO: tuple[str, ...] = ("CONVENIO", "FOMENTO", "COLABORACAO")


def normalizar_titulo_ato(titulo: str | None) -> str:
    """Caixa alta e sem acento — mesmo par (NFD + descartar categoria Mn) já
    usado por `_sem_acento()` em `camaras/sapl.py`/`camaras/syssolution.py`,
    aqui com o mesmo NOME de função do TS (`normalizarTituloAto`) para quem
    for comparar os dois arquivos lado a lado."""
    base = unicodedata.normalize("NFD", titulo or "")
    sem_acento = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return sem_acento.upper()


def _tem_palavra_isolada(normalizado: str, palavra: str) -> bool:
    """`\\bPALAVRA\\b` sem trazer o módulo `re` só para isto: checa que o
    caractere antes/depois (quando existir) não é letra/dígito/underscore —
    a mesma definição de fronteira de palavra do regex, restrita ao alfabeto
    ASCII que sobra depois de `normalizar_titulo_ato` (títulos já vêm sem
    acento e em caixa alta neste ponto)."""
    inicio = normalizado.find(palavra)
    while inicio != -1:
        fim = inicio + len(palavra)
        antes_ok = inicio == 0 or not (normalizado[inicio - 1].isalnum() or normalizado[inicio - 1] == "_")
        depois_ok = fim == len(normalizado) or not (normalizado[fim].isalnum() or normalizado[fim] == "_")
        if antes_ok and depois_ok:
            return True
        inicio = normalizado.find(palavra, inicio + 1)
    return False


def _tem_palavra_de_licitacao(normalizado: str) -> bool:
    return any(p in normalizado for p in _PALAVRAS_DE_LICITACAO)


def classificar_ato(titulo: str | None) -> str:
    """Classifica o tipo de um ato pelo título. Nunca lança: tudo que não
    bate nas regras é `outro` — calar (outro) é melhor que errar o tipo.
    Mesmo contrato de `classificarAto()` no TS."""
    n = normalizar_titulo_ato(titulo)

    if any(_tem_palavra_isolada(n, p) for p in _PALAVRAS_DE_CONVENIO):
        return "convenio"

    if "CONTRATO" in n:
        return "contrato"

    if n.startswith("LEI"):
        return "lei"

    if n.startswith("DECRETO"):
        return "decreto"

    if n.startswith("PORTARIA"):
        return "portaria"

    if _tem_palavra_de_licitacao(n):
        return "edital"

    return "outro"
