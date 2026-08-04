"""etl.psp.orgaos_canonicos — desfaz o corte de 50 caracteres da SEGES/SP.

O CSV de servidores da SEGES publica `SECRET_SUBPREF` e `SETOR` truncados em
EXATAMENTE 50 caracteres — o corte vem DA FONTE, não do nosso código, que só
faz `.strip()`. A assinatura é inconfundível: um pico na distribuição de
comprimentos exatamente no teto, com o nome partido no meio da palavra
("SECRETARIA MUNICIPAL DE INFRAESTRUTURA URBANA E OB").

POR QUE DÁ PARA CONSERTAR À MÃO, E SÓ AQUI. Em `orgao` são **4** valores
distintos afetados (de 60), e cada um tem exatamente um nome oficial possível
— não há adivinhação envolvida, o prefixo de 50 caracteres já identifica a
secretaria sem ambiguidade. Em `lotacao` são **342** valores distintos, e aí
não dá: reconstituir 342 nomes de setor sem uma lista canônica publicada seria
INVENTAR dado, que num portal de transparência é pior que exibir truncado.

A MESMA TABELA SERVE `servidores` E `folha_pagamento`. As duas casam pelo
texto do órgão, por desenho (ver `etl/psp/servidores.py`), então consertar uma
sem a outra quebraria o join em silêncio. As 8 linhas cortadas de
`folha_pagamento` são os mesmos 4 nomes.

Nomes conferidos contra a estrutura oficial da Prefeitura de São Paulo.
"""

# Cortado (50 caracteres, como vem da fonte) -> nome oficial completo.
ORGAOS_TRUNCADOS_SP = {
    "SECRETARIA MUNICIPAL DE CULTURA E ECONOMIA CRIATIV": (
        "SECRETARIA MUNICIPAL DE CULTURA E ECONOMIA CRIATIVA"
    ),
    "SECRETARIA MUNICIPAL DE DIREITOS HUMANOS E CIDADAN": (
        "SECRETARIA MUNICIPAL DE DIREITOS HUMANOS E CIDADANIA"
    ),
    "SECRETARIA MUNICIPAL DE INFRAESTRUTURA URBANA E OB": (
        "SECRETARIA MUNICIPAL DE INFRAESTRUTURA URBANA E OBRAS"
    ),
    "SECRETARIA MUNICIPAL DE MOBILIDADE URBANA E TRANSP": (
        "SECRETARIA MUNICIPAL DE MOBILIDADE URBANA E TRANSPORTES"
    ),
}


def canonizar_orgao(valor: str | None) -> str | None:
    """Devolve o nome completo quando o valor é um dos truncados conhecidos.

    Silencioso e idempotente de propósito: quem já está completo passa
    inalterado, então isto pode rodar na escrita e no backfill sem contar
    quantas vezes rodou.

    NÃO tenta adivinhar por prefixo. Um `startswith` sobre a lista pareceria
    mais esperto e casaria com secretaria nova cujo nome comece igual —
    gravando o nome da secretaria ERRADA, sem erro. A tabela é fechada e
    revisável; nome novo cortado aparece no guarda abaixo.
    """
    if not valor:
        return valor
    return ORGAOS_TRUNCADOS_SP.get(valor, valor)


def truncados_desconhecidos(valores) -> set[str]:
    """Valores com 50 caracteres exatos que a tabela ainda não cobre.

    Existe porque o silêncio aqui é caro: a SEGES criar ou renomear uma
    secretaria com nome longo devolveria um truncado novo, e sem este aviso
    ele entraria no portal cortado, indistinguível de um nome curto real.
    """
    conhecidos = set(ORGAOS_TRUNCADOS_SP)
    return {v for v in valores if v and len(v) == 50 and v not in conhecidos}
