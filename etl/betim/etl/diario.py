"""etl.diario — classificação determinística do TIPO e extração de entidades
de atos de diários oficiais municipais, com anonimização Mod-11 de CPF (LGPD).
Port em Python de `apps/web/lib/diario/classificarAto.ts` e `extrairEntidades.ts`:
MESMA lógica, MESMA ordem de regras, MESMA calibração.

═══ POR QUE ISTO NÃO VIVE EM `etl/camaras/sigpub.py` ═══

A classificação é sobre o TEXTO do título, não sobre a plataforma que o
publicou — o mesmo raciocínio de `etl/temas.py` (compartilhado por
`camaras/sapl.py`, `camaras/syssolution.py`, `pbh/legislacao.py`,
`psp/legislacao.py`). O plano (`docs/planos/diario-oficial-plano.md`) prevê
D2 (Betim), D3 (BH) e D4 (SP) depois do SIGPub — coletores de OUTRAS
plataformas, mesma classificação. Duplicar a regex dentro de `sigpub.py`
funcionaria hoje e divergiria da versão TS na primeira mudança que alguém
esquecesse de replicar nos três lugares.
"""
from __future__ import annotations

import re
import unicodedata
from typing import Any

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

DESCRICAO_TIPO: dict[str, str] = {
    "decreto": "Decreto municipal (norma do Executivo).",
    "edital": (
        "Atos de licitação: aviso, credenciamento, dispensa, inexigibilidade, "
        "chamamento público, homologação, adjudicação, impugnação, registro de preço, ratificação."
    ),
    "contrato": "Contrato e termos aditivos de contrato (Prefeitura e Câmara).",
    "convenio": (
        "Convênio, termo de fomento e termo de colaboração "
        "(parcerias com repasse de recursos)."
    ),
    "portaria": "Portaria municipal (decisão interna do Executivo).",
    "lei": "Lei municipal (ordinária, complementar ou delegada).",
    "outro": "Atos que não se encaixam nos tipos acima.",
}

def _decodificar_html(s: str) -> str:
    s = re.sub(r"&#([0-9]+);", lambda m: chr(int(m.group(1))), s)
    s = re.sub(r"&#x([0-9a-fA-F]+);", lambda m: chr(int(m.group(1), 16)), s)
    s = re.sub(r"&quot;", '"', s, flags=re.IGNORECASE)
    s = re.sub(r"&amp;", "&", s, flags=re.IGNORECASE)
    s = re.sub(r"&lt;", "<", s, flags=re.IGNORECASE)
    s = re.sub(r"&gt;", ">", s, flags=re.IGNORECASE)
    s = re.sub(r"&ccedil;", "ç", s, flags=re.IGNORECASE)
    s = re.sub(r"&atilde;", "ã", s, flags=re.IGNORECASE)
    s = re.sub(r"&eacute;", "é", s, flags=re.IGNORECASE)
    return s


def normalizar_titulo_ato(titulo: str | None) -> str:
    """Caixa alta e sem acento — par NFD + descartar categoria Mn."""
    if not titulo:
        return ""
    sem_html = _decodificar_html(titulo)
    base = unicodedata.normalize("NFD", sem_html)
    sem_acento = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return sem_acento.replace("_", " ").upper()


_TEM_CONVENIO_PADRAO = re.compile(
    r"\b(CONVENIOS?|FOMENTO|COLABORACAO|COLABORACOES|PARCERIAS?|ACORDO DE COOPERACAO)\b",
    re.IGNORECASE,
)
_TEM_CONTRATO_PADRAO = re.compile(
    r"\b(CONTRATOS?|DISTRATOS?|RESCISAO CONTRATUAL)\b",
    re.IGNORECASE,
)
_TEM_LEI_INICIO = re.compile(
    r"^(?:LEIS?\b|LEI\s+(?:COMPLEMENTAR|MUNICIPAL|ESTADUAL|DELEGADA|ORDINARIA|ORGANICA)\b)",
    re.IGNORECASE,
)
_TEM_DECRETO_INICIO = re.compile(
    r"^(?:DECRETOS?\b|DECRETO\s+(?:MUNICIPAL|ESTADUAL|LEGISLATIVO|EXECUTIVO|REGULAMENTAR|NUMERADO|DE)\b)",
    re.IGNORECASE,
)
_TEM_PORTARIA_INICIO = re.compile(
    r"^(?:PORTARIAS?\b|PORTARIA\s+(?:SMS|SEMED|CONJUNTA|MUNICIPAL|DE)\b)",
    re.IGNORECASE,
)

_TEM_DISPENSA_RH = re.compile(
    r"\bDISPENSA\s+DE\s+(?:CARGO|SERVIDOR|FUNCAO|COMISSAO|EMPREGADO|PESSOAL)\b",
    re.IGNORECASE,
)

_PADROES_LICITACAO: tuple[re.Pattern[str], ...] = (
    re.compile(r"\bLICITA(?:CAO|COES|TORI[AO]S?|NTES?|DOS?|R)\b", re.IGNORECASE),
    re.compile(r"\bEDITAIS?\b", re.IGNORECASE),
    re.compile(r"\bCREDENCIAMENTOS?\b", re.IGNORECASE),
    re.compile(r"\bCHAMAMENTOS?\s+PUBLICOS?\b|\bCHAMAMENTO\s+PUBLICO\b", re.IGNORECASE),
    re.compile(r"\bHOMOLOGA(?:CAO|COES)\b", re.IGNORECASE),
    re.compile(r"\bADJUDICA(?:CAO|COES)\b", re.IGNORECASE),
    re.compile(r"\bIMPUGNA(?:CAO|COES)\b", re.IGNORECASE),
    re.compile(r"\bREGISTRO\s+DE\s+PRECOS?\b", re.IGNORECASE),
    re.compile(r"\bRATIFICA(?:CAO|COES)\b", re.IGNORECASE),
    re.compile(r"\bPREG(?:AO|OES)\b", re.IGNORECASE),
    re.compile(r"\bCONCORRENCIAS?\b", re.IGNORECASE),
    re.compile(r"\bTOMADA\s+DE\s+PRECOS?\b", re.IGNORECASE),
    re.compile(r"\bCONVITES?\b", re.IGNORECASE),
    re.compile(r"\bCOTACAO\s+ELETRONICA\b", re.IGNORECASE),
    re.compile(r"\bLEIL(?:AO|OES)\b", re.IGNORECASE),
    re.compile(r"\bINEXIGIBILIDADES?\b", re.IGNORECASE),
    re.compile(r"\bDISPENSA\b", re.IGNORECASE),
)


def _tem_palavra_de_licitacao(normalizado: str) -> bool:
    if _TEM_DISPENSA_RH.search(normalizado):
        sem_dispensa = _TEM_DISPENSA_RH.sub("", normalizado)
        return any(p.search(sem_dispensa) for p in _PADROES_LICITACAO)
    return any(p.search(normalizado) for p in _PADROES_LICITACAO)


_TEM_LEI_GERAL = re.compile(
    r"\bLEIS?\s+(?:COMPLEMENTAR\s+|MUNICIPAL\s+|ESTADUAL\s+|DELEGADA\s+|ORDINARIA\s+|ORGANICA\s+)?N[ºO°\.]?\s*[0-9]|\bLEIS\b|\bLEI\s+(?:COMPLEMENTAR|MUNICIPAL|ESTADUAL|DELEGADA|ORDINARIA|ORGANICA)\b",
    re.IGNORECASE,
)
_TEM_DECRETO_GERAL = re.compile(r"\bDECRETOS?\b", re.IGNORECASE)
_TEM_PORTARIA_GERAL = re.compile(r"\bPORTARIAS?\b", re.IGNORECASE)


def _casar_tipo_por_texto(n: str) -> str:
    if not n:
        return "outro"

    # 1. Convênios e Parcerias (precedência máxima)
    if _TEM_CONVENIO_PADRAO.search(n):
        return "convenio"

    # 2. Contratos, Aditivos e Distratos
    if _TEM_CONTRATO_PADRAO.search(n):
        return "contrato"

    # 3. Atos normativos que iniciam explicitamente com o tipo
    if _TEM_LEI_INICIO.search(n) and "PROJETO DE LEI" not in n and not n.startswith("PROJETO DE"):
        return "lei"
    if _TEM_DECRETO_INICIO.search(n) and "PROJETO DE DECRETO" not in n and not n.startswith("PROJETO DE"):
        return "decreto"
    if _TEM_PORTARIA_INICIO.search(n) and "PROJETO DE PORTARIA" not in n and not n.startswith("PROJETO DE"):
        return "portaria"

    # 4. Licitações e Editais (precedência sobre citações acessórias de Leis ou Decretos)
    if _tem_palavra_de_licitacao(n):
        return "edital"

    # 5. Atos normativos no corpo do título (quando não forem editais)
    if (_TEM_LEI_GERAL.search(n) or n.startswith("LEI")) and "PROJETO DE LEI" not in n and not n.startswith("PROJETO DE"):
        return "lei"
    if _TEM_DECRETO_GERAL.search(n) and "PROJETO DE DECRETO" not in n and not n.startswith("PROJETO DE"):
        return "decreto"
    if _TEM_PORTARIA_GERAL.search(n) and "PROJETO DE PORTARIA" not in n and not n.startswith("PROJETO DE"):
        return "portaria"

    return "outro"


def classificar_ato(titulo: str | None, categoria_original: str | None = None) -> str:
    """Classifica o tipo de um ato a partir do título (e opcionalmente da categoria original).
    Nunca lança: tudo que não bate nas regras é `outro` — calar (outro) é melhor que errar o tipo.
    Mesmo contrato de `classificarAto()` no TS.
    """
    if not titulo and not categoria_original:
        return "outro"

    if titulo:
        primeiro_trecho = re.split(r"\r?\n|\.\s", titulo)[0] if titulo else ""
        n_primeiro = normalizar_titulo_ato(primeiro_trecho)
        tipo_primeiro = _casar_tipo_por_texto(n_primeiro)
        if tipo_primeiro != "outro":
            return tipo_primeiro

    n_titulo = normalizar_titulo_ato(titulo)
    tipo_titulo = _casar_tipo_por_texto(n_titulo)
    if tipo_titulo != "outro":
        return tipo_titulo

    if categoria_original:
        n_categoria = normalizar_titulo_ato(categoria_original)
        tipo_categoria = _casar_tipo_por_texto(n_categoria)
        if tipo_categoria != "outro":
            return tipo_categoria

    return "outro"


def validar_cpf(digitos_ou_formatado: str | None) -> bool:
    """Validação de CPF por algoritmo Mod-11.
    Rejeita 11 dígitos idênticos ou tamanho diferente de 11.
    """
    if not digitos_ou_formatado:
        return False
    digitos = re.sub(r"\D", "", digitos_ou_formatado)
    if len(digitos) != 11 or len(set(digitos)) == 1:
        return False

    def dv(ate: int) -> int:
        soma = sum(int(digitos[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    return dv(9) == int(digitos[9]) and dv(10) == int(digitos[10])


def validar_cnpj(cnpj_ou_formatado: str | None) -> bool:
    """Validação de CNPJ por algoritmo Mod-11 (14 dígitos).
    Rejeita sequências de dígitos idênticos ou tamanho diferente de 14.
    """
    if not cnpj_ou_formatado:
        return False
    digitos = re.sub(r"\D", "", cnpj_ou_formatado)
    if len(digitos) != 14 or len(set(digitos)) == 1:
        return False

    pesos_dv1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos_dv2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    soma1 = sum(int(digitos[i]) * pesos_dv1[i] for i in range(12))
    resto1 = soma1 % 11
    dv1 = 0 if resto1 < 2 else 11 - resto1
    if dv1 != int(digitos[12]):
        return False

    soma2 = sum(int(digitos[i]) * pesos_dv2[i] for i in range(13))
    resto2 = soma2 % 11
    dv2 = 0 if resto2 < 2 else 11 - resto2
    return dv2 == int(digitos[13])


def formatar_cnpj(cnpj: str) -> str:
    """Formata sequência de 14 dígitos como CNPJ XX.XXX.XXX/YYYY-ZZ."""
    digitos = re.sub(r"\D", "", cnpj)
    if len(digitos) != 14:
        return cnpj
    return f"{digitos[0:2]}.{digitos[2:5]}.{digitos[5:8]}/{digitos[8:12]}-{digitos[12:14]}"


def anonimizar_cpfs(texto: str | None, mascara: str = "***.***.***-**") -> str:
    """Substitui CPFs válidos de pessoas físicas por máscara protegida."""
    if not texto:
        return ""

    re_cpf = re.compile(r"\b[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}\b|\b[0-9]{11}\b")

    def _substituir(match: re.Match[str]) -> str:
        val = match.group(0)
        if val in SINTETICOS:
            return val
        digitos = re.sub(r"\D", "", val)
        if validar_cpf(digitos):
            return mascara
        return val

    return re_cpf.sub(_substituir, texto)


def _extrair_valores_monetarios(texto: str) -> tuple[list[float], float | None]:
    regex_moeda = re.compile(
        r"(?:R\$\s*|VALOR(?:\s+GLOBAL|\s+TOTAL)?(?:\s+ESTIMADO)?(?:\s+DE)?\s*:?\s*R?\$?\s*)"
        r"([0-9]{1,3}(?:\.[0-9]{3})*,\s*[0-9]{2})",
        re.IGNORECASE,
    )
    valores: list[float] = []
    vistos: set[float] = set()
    match_valor_total: float | None = None

    for m in regex_moeda.finditer(texto):
        raw_num = m.group(1).replace(" ", "").replace(".", "").replace(",", ".")
        try:
            num = float(raw_num)
        except ValueError:
            continue
        if num > 0:
            if num not in vistos:
                vistos.add(num)
                valores.append(num)
            contexto = m.group(0).upper()
            if "TOTAL" in contexto or "GLOBAL" in contexto:
                match_valor_total = num

    principal = match_valor_total if match_valor_total is not None else (max(valores) if valores else None)
    return valores, principal


def _extrair_cnpjs(texto: str) -> list[str]:
    regex_cnpj = re.compile(r"\b[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}\b|\b[0-9]{14}\b")
    cnpjs_encontrados: list[str] = []
    vistos: set[str] = set()

    for m in regex_cnpj.finditer(texto):
        raw = m.group(0)
        digitos = re.sub(r"\D", "", raw)
        if validar_cnpj(digitos):
            formatado = formatar_cnpj(digitos)
            if formatado not in vistos:
                vistos.add(formatado)
                cnpjs_encontrados.append(formatado)

    return cnpjs_encontrados


def _extrair_numero_processo(texto: str) -> str | None:
    padroes = [
        re.compile(
            r"(?:PROCESSO\s+LICITAT[ÓO]RIO|PROCESSO\s+ADMINISTRATIVO|PROC\.\s*ADM\.|PROCESSO|PL|PA)\s*"
            r"(?:N[ºO°\.]?\s*)?([0-9]+(?:\.[0-9]+)*(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:PROCESSO\s*(?:N[ºO°\.]?\s*)?)([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
    ]
    for padrao in padroes:
        m = padrao.search(texto)
        if m and m.group(1):
            num = m.group(1).strip()
            if len(num) >= 2:
                return num
    return None


def _extrair_numero_edital(texto: str) -> str | None:
    padroes = [
        re.compile(
            r"(?:ATA\s+DE\s+REGISTRO\s+DE\s+PRE[ÇC]OS?)\s*"
            r"(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:EDITAL(?:\s+DE\s+LICITA[ÇC][ÃA]O)?)\s*"
            r"(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:PREG[ÃA]O\s+ELETR[ÔO]NICO|PREG[ÃA]O\s+PRESENCIAL|PREG[ÃA]O)\s*"
            r"(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:DISPENSA(?:\s+DE\s+LICITA[ÇC][ÃA]O)?)\s*"
            r"(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:INEXIGIBILIDADE(?:\s+DE\s+LICITA[ÇC][ÃA]O)?)\s*"
            r"(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:CHAMAMENTO\s+P[ÚU]BLICO)\s*"
            r"(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:TOMADA\s+DE\s+PRE[ÇC]OS|CONCORR[ÊE]NCIA)\s*"
            r"(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
    ]
    melhor_pos: int | None = None
    melhor_num: str | None = None

    for padrao in padroes:
        m = padrao.search(texto)
        if m and m.group(1):
            num = m.group(1).strip()
            if len(num) >= 2:
                if melhor_pos is None or m.start() < melhor_pos:
                    melhor_pos = m.start()
                    melhor_num = num

    return melhor_num


def _extrair_numero_contrato(texto: str) -> str | None:
    padroes = [
        re.compile(
            r"(?:TERMO\s+ADITIVO\s+(?:AO\s+CONTRATO\s+)?N[ºO°\.]?\s*)([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:CONTRATO(?:\s+DE\s+[A-ZÇÃÉÊÍÓÔÚ]+|\s+ADMINISTRATIVO)?)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:TERMO\s+DE\s+FOMENTO)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:TERMO\s+DE\s+COLABORA[ÇC][ÃA]O)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:TERMO\s+DE\s+PARCERIA)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:CONV[ÊE]NIO)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:ACORDO\s+DE\s+COOPERA[ÇC][ÃA]O(?:\s+T[ÉE]CNICA)?)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:/[0-9]{2,4})?)",
            re.IGNORECASE,
        ),
    ]
    melhor_pos: int | None = None
    melhor_num: str | None = None

    for padrao in padroes:
        m = padrao.search(texto)
        if m and m.group(1):
            num = m.group(1).strip()
            if len(num) >= 2:
                if melhor_pos is None or m.start() < melhor_pos:
                    melhor_pos = m.start()
                    melhor_num = num

    return melhor_num


def _extrair_objeto(texto: str) -> str | None:
    padroes = [
        re.compile(
            r"(?:OBJETO|OBJETIVO|FINALIDADE)\s*:\s*([^.;\n\r]+(?:[.;]|$))",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:CUJO\s+OBJETO\s+[ÉE]\s*)([^.;\n\r]+(?:[.;]|$))",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:TENDO\s+POR\s+OBJETO\s*)([^.;\n\r]+(?:[.;]|$))",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:COM\s+O\s+OBJETIVO\s+DE\s*)([^.;\n\r]+(?:[.;]|$))",
            re.IGNORECASE,
        ),
    ]
    for padrao in padroes:
        m = padrao.search(texto)
        if m and m.group(1):
            limpo = re.sub(r"[.;]+$", "", m.group(1)).strip()
            if len(limpo) >= 5:
                return limpo
    return None


def extrair_entidades(texto_bruto: str | None, tipo_informado: str | None = None) -> dict[str, Any]:
    """Extrai todas as entidades estruturadas de um ato oficial."""
    if not texto_bruto:
        return {
            "valores_monetarios": [],
            "valor_principal": None,
            "cnpjs": [],
            "numero_processo": None,
            "numero_edital": None,
            "numero_contrato": None,
            "objeto": None,
            # Chaves camelCase para conveniência e interoperabilidade
            "valoresMonetarios": [],
            "valorPrincipal": None,
            "numeroProcesso": None,
            "numeroEdital": None,
            "numeroContrato": None,
        }

    texto = anonimizar_cpfs(texto_bruto)
    tipo = tipo_informado or classificar_ato(texto)
    valores, principal = _extrair_valores_monetarios(texto)
    cnpjs = _extrair_cnpjs(texto)
    processo = _extrair_numero_processo(texto)
    edital = (
        None
        if tipo in ("contrato", "decreto", "portaria", "lei")
        else _extrair_numero_edital(texto)
    )
    contrato = (
        None
        if tipo in ("edital", "decreto", "portaria", "lei")
        else _extrair_numero_contrato(texto)
    )
    objeto = _extrair_objeto(texto)

    return {
        "valores_monetarios": valores,
        "valor_principal": principal,
        "cnpjs": cnpjs,
        "numero_processo": processo,
        "numero_edital": edital,
        "numero_contrato": contrato,
        "objeto": objeto,
        # Chaves camelCase para conveniência e interoperabilidade
        "valoresMonetarios": valores,
        "valorPrincipal": principal,
        "numeroProcesso": processo,
        "numeroEdital": edital,
        "numeroContrato": contrato,
    }
