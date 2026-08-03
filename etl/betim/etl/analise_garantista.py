"""etl.analise_garantista — rubrica garantista × reducionista no eixo Cidades.

    python -m etl.analise_garantista --id-municipio 3106705 --amostra 3

POR QUE ESTE MÓDULO NÃO TEM RUBRICA DENTRO DELE.

A taxonomia canônica é `apps/web/lib/congresso/rubrica/rubrica.json`, e o
`_nota` daquele arquivo é uma ordem, não um comentário: instruir o modelo
com uma lista de direitos/mecanismos e pontuar com outra produz DERIVA
SILENCIOSA — rótulos calculados sobre categorias que o app não reconhece,
sem erro nenhum aparecendo. Isso vale entre eixos com a mesma força que
vale entre `lib/rubrica.ts` e `etl/rubrica.py`: as 24 âncoras são da CF/88,
e a CF/88 governa lei municipal exatamente como governa lei federal. Um
segundo `rubrica.json` "adaptado para cidades" seria a maneira mais rápida
de fazer BH e o Congresso pontuarem em réguas diferentes chamando as duas
de a mesma.

COMO O REUSO É FEITO, E POR QUE ASSIM.

`etl/congresso` e `etl/betim` são dois pacotes DISTINTOS, ambos chamados
`etl`. De dentro daqui, `from etl import rubrica` resolveria para
`etl/betim/etl/rubrica.py` — que não existe — e um `sys.path.append` do
diretório do Congresso deixaria dois pacotes homônimos disputando o mesmo
nome em `sys.modules`, com o vencedor decidido pela ordem de import. É
exatamente a classe de bug que este projeto já pagou uma vez (default de
cidade em argparse: parece certo, roda sem erro, grava dado errado).

A saída limpa é carregar os módulos do Congresso POR CAMINHO DE ARQUIVO,
sob um nome próprio (`_congresso_rubrica`), sem tocar em `sys.path`. Isso
funciona porque `rubrica.py` e `normas.py` são folhas: importam só stdlib,
nada do pacote `etl` deles. Se um dia deixarem de ser, o `exec_module`
quebra na cara com ImportError — barulhento, que é o que se quer.

E o `rubrica.json`? Continua sendo lido pelo próprio `rubrica.py`, que
resolve o caminho a partir do `__file__` DELE (`parents[3]` = raiz do
repo). Carregar por caminho preserva isso: o arquivo lido é o mesmo,
byte a byte, que o Congresso e o frontend leem.

O QUE ESTE MÓDULO ACRESCENTA (e é só isto): o cabeçalho municipal do
prompt. Validação (`validar_itens`), cálculo de score/rótulo (`calcular`) e
extração de normas (`extrair_normas`) são reexportados sem uma linha de
reimplementação.
"""
import argparse
import importlib.util
import re
import sys
from pathlib import Path

from etl import temas as temas_mod
from etl.common import carregar_municipio, get_supabase_client

# etl/betim/etl/analise_garantista.py -> etl/betim/etl -> etl/betim -> etl -> raiz
RAIZ_REPO = Path(__file__).resolve().parents[3]
DIR_CONGRESSO = RAIZ_REPO / "etl" / "congresso" / "etl"


def _carregar_do_congresso(nome: str):
    """Importa `etl/congresso/etl/<nome>.py` por caminho, sob apelido próprio.

    Não usa `sys.path`: os dois eixos têm um pacote `etl` cada, e adicionar
    o diretório do Congresso ao path faria os dois brigarem pelo mesmo nome
    em `sys.modules`. Ver docstring do módulo.
    """
    caminho = DIR_CONGRESSO / f"{nome}.py"
    if not caminho.exists():
        raise RuntimeError(
            f"{caminho} não existe. O eixo Cidades depende da rubrica do eixo "
            f"Congresso e não tem cópia dela de propósito — sem esse arquivo não "
            f"há análise garantista, e inventar uma taxonomia local aqui seria o "
            f"defeito que o `_nota` do rubrica.json manda evitar."
        )
    apelido = f"_congresso_{nome}"
    if apelido in sys.modules:
        return sys.modules[apelido]

    spec = importlib.util.spec_from_file_location(apelido, caminho)
    modulo = importlib.util.module_from_spec(spec)
    # Registrar ANTES do exec: se o módulo se auto-referenciar durante a
    # carga, ele acha a si mesmo em vez de recarregar.
    sys.modules[apelido] = modulo
    spec.loader.exec_module(modulo)
    return modulo


rubrica = _carregar_do_congresso("rubrica")
_normas = _carregar_do_congresso("normas")

# Reexports — o chamador usa estes, nunca uma versão local.
validar_itens = rubrica.validar_itens
calcular = rubrica.calcular
DIREITOS = rubrica.DIREITOS
MECANISMOS = rubrica.MECANISMOS
VERSAO_RUBRICA: str = rubrica.VERSAO_RUBRICA

# O prompt daqui NÃO é o do Congresso (tem cabeçalho municipal), então a
# versão precisa dizer as duas coisas. Assim um bump lá em cima também
# invalida as análises daqui — `analises.versao_prompt` é o que permite
# reanalisar só o que ficou para trás.
VERSAO_PROMPT: str = f"{rubrica.VERSAO_PROMPT}+cidades.1.0.0"


# ═══════════════════════════════════════════════════════════════
# Prompt
# ═══════════════════════════════════════════════════════════════

_MARCADOR_TAXONOMIA = "DIREITOS (use exatamente estes slugs):"

# A lista de direitos, a de mecanismos, a escala de grau e o CONTRATO JSON
# de saída são fatiados do prompt do Congresso em tempo de import, em vez de
# reescritos aqui. Motivo: `validar_itens` (que é a do Congresso) espera
# aquelas chaves exatas. Se alguém acrescentar um campo ao JSON lá e este
# arquivo tivesse uma cópia do formato, a cópia continuaria produzindo o
# formato velho — e a validação passaria, porque campo a mais não é erro.
# Fatiar garante que o contrato é sempre o mesmo objeto.
_esqueleto = rubrica.montar_prompt({})
if _MARCADOR_TAXONOMIA not in _esqueleto:
    raise RuntimeError(
        "o prompt de `etl/congresso/etl/rubrica.py` mudou de forma e o marcador "
        f"{_MARCADOR_TAXONOMIA!r} sumiu. Isto é uma parada proposital: seguir em "
        "frente montaria o prompt municipal sem a taxonomia, e o modelo devolveria "
        "slugs inventados que a validação descartaria em silêncio."
    )
BLOCO_TAXONOMIA = _MARCADOR_TAXONOMIA + _esqueleto.split(_MARCADOR_TAXONOMIA, 1)[1]
del _esqueleto


# O SYSTEM base vem inteiro do Congresso — as regras absolutas (dispositivo
# nunca vazio, trecho literal, listas fechadas) valem igual para lei
# municipal, e se alguém as apertar lá, as cidades herdam. O adendo trata do
# que só existe aqui.
ADENDO_MUNICIPAL = """

ADENDO MUNICIPAL — o objeto analisado é norma de MUNICÍPIO, não do Congresso.

6. As âncoras continuam sendo da CF/88 e da lei federal: a Constituição \
governa lei municipal do mesmo jeito. Um decreto municipal que fecha o \
acesso a creche restringe o art. 208, IV da CF/88 — é essa a âncora a citar. \
Não invente artigo de lei orgânica que você não viu no texto.
7. A competência municipal é limitada (CF/88, art. 30). Se o ato apenas \
executa localmente política federal ou estadual, sem criar nem retirar \
direito, a direção é `neutro`.
8. Analise o que o texto DIZ, não o que ele provavelmente vira. Um projeto \
arquivado que restringia um direito restringia um direito; a situação de \
tramitação é informada só como contexto e não muda a leitura.
9. Devolva `direitos_afetados` VAZIO — a regra 3, aplicada ao caso \
municipal, que é onde ela mais aparece — para: abertura de crédito \
suplementar ou adicional e remanejamento de dotação orçamentária (movem \
dinheiro dentro do orçamento, não mudam dispositivo nenhum: não há artigo a \
citar), denominação de logradouro ou de equipamento público, título de \
cidadão honorário e comenda, data comemorativa e inclusão no calendário \
oficial, nomeação/exoneração e ponto facultativo. Em Betim isso é a regra e \
não a exceção: 315 dos 660 atos coletados são crédito suplementar."""

SYSTEM = rubrica.SYSTEM + ADENDO_MUNICIPAL


def montar_prompt(obj: dict) -> str:
    """Prompt de extração para um ato sancionado ou um projeto municipal.

    `obj` é o registro normalizado por `normalizar_ato` /
    `normalizar_proposicao`. Como no Congresso, os fatos vêm do banco já
    verificados — o modelo nunca busca informação, só estrutura a que
    recebeu.
    """
    if obj.get("tipo_objeto") == "ato":
        cabecalho = "LEI/ATO MUNICIPAL"
        situacao = f"NORMA JÁ SANCIONADA E EM VIGOR (publicada em {obj.get('data') or 'data não informada'})"
    else:
        cabecalho = "PROJETO MUNICIPAL"
        situacao = (
            f"PROJETO EM TRAMITAÇÃO — situação: {obj.get('situacao') or 'não informada'} "
            f"(apresentado em {obj.get('data') or 'data não informada'})"
        )

    # Os temas vêm de `etl/temas.py` (regex auditável). Entram no prompt como
    # PISTA, com o aviso de que podem estar vazios ou errados: o classificador
    # de temas foi calibrado para navegação na UI, não para direito
    # fundamental, e apresentá-lo como verdade faria o modelo ancorar nele.
    lista_temas = ", ".join(obj.get("temas") or []) or "nenhum (pode ser ruído do classificador, não conclua nada disso)"

    return f"""{cabecalho}: {obj.get('identificacao')}
MUNICÍPIO: {obj.get('municipio_nome')}/{obj.get('uf')} (IBGE {obj.get('id_municipio')})
SITUAÇÃO: {situacao}
EMENTA: {obj.get('ementa')}
TEMAS PRÉ-CLASSIFICADOS POR PALAVRA-CHAVE (pista, não conclusão): {lista_temas}

{BLOCO_TAXONOMIA}"""


# ═══════════════════════════════════════════════════════════════
# Normalização dos dois objetos analisáveis
# ═══════════════════════════════════════════════════════════════

CAMPOS_ATO = "id, id_municipio, tipo, numero, ano, ementa, temas, data_publicacao, link_fonte"
CAMPOS_PROPOSICAO = (
    "id, id_municipio, tipo, numero, ano, ementa, temas, situacao, data_apresentacao, link_fonte"
)

_ROTULO_TIPO_PROPOSICAO = {
    "projeto_lei": "Projeto de Lei",
    "projeto_resolucao": "Projeto de Resolução",
    "projeto_decreto_legislativo": "Projeto de Decreto Legislativo",
    "emenda_lei_organica": "Emenda à Lei Orgânica",
    "proposta_emenda_lei_organica": "Proposta de Emenda à Lei Orgânica",
    "emenda": "Emenda",
    "emenda_loa": "Emenda ao Orçamento",
    "requerimento": "Requerimento",
    "indicacao": "Indicação",
    "mocao": "Moção",
}


def _iso(valor) -> str | None:
    return valor.isoformat() if hasattr(valor, "isoformat") else (valor or None)


def _temas(registro: dict) -> list[str]:
    """Temas gravados, com recomputação por cima.

    POR QUE RECOMPUTAR. Medido em 2026-08-03: as 2.541 proposições de São
    Paulo estão com `temas = NULL` (o backfill de temas nunca rodou lá),
    enquanto BH e Betim têm a coluna preenchida. Uma fila que confiasse só
    na coluna jogaria São Paulo INTEIRA para o fim, e o motivo — backfill
    pendente, não ausência de tema — ficaria invisível.
    """
    guardados = registro.get("temas") or []
    return sorted(set(guardados) | set(temas_mod.classificar_texto(registro.get("ementa"))))


def normalizar_ato(registro: dict, municipio: dict) -> dict:
    numero = registro.get("numero") or "s/n"
    ano = registro.get("ano") or "?"
    return {
        "id": registro["id"],
        "tipo_objeto": "ato",
        "id_municipio": registro["id_municipio"],
        "municipio_nome": municipio.get("nome"),
        "uf": municipio.get("uf"),
        "identificacao": f"{registro.get('tipo') or 'Ato'} nº {numero}/{ano}",
        "tipo": registro.get("tipo"),
        "ementa": registro.get("ementa"),
        "temas": _temas(registro),
        "situacao": None,
        "data": _iso(registro.get("data_publicacao")),
        "link_fonte": registro.get("link_fonte"),
    }


def normalizar_proposicao(registro: dict, municipio: dict) -> dict:
    tipo = registro.get("tipo") or ""
    numero = registro.get("numero") or "s/n"
    ano = registro.get("ano") or "?"
    rotulo = _ROTULO_TIPO_PROPOSICAO.get(tipo, tipo.replace("_", " ").title() or "Proposição")
    return {
        "id": registro["id"],
        "tipo_objeto": "proposicao",
        "id_municipio": registro["id_municipio"],
        "municipio_nome": municipio.get("nome"),
        "uf": municipio.get("uf"),
        "identificacao": f"{rotulo} nº {numero}/{ano}",
        "tipo": tipo,
        "ementa": registro.get("ementa"),
        "temas": _temas(registro),
        "situacao": registro.get("situacao"),
        "data": _iso(registro.get("data_apresentacao")),
        "link_fonte": registro.get("link_fonte"),
    }


# ═══════════════════════════════════════════════════════════════
# Legislação relacionada
# ═══════════════════════════════════════════════════════════════


# "Lei Municipal nº 6.152", "Decreto Estadual nº 123": o qualificador de
# esfera entre o tipo e o número.
#
# ISTO É UM REMENDO NECESSÁRIO, e o motivo merece registro. O extrator do
# Congresso foi calibrado contra ementa FEDERAL, onde ninguém escreve "Lei
# Municipal" — o padrão dele espera o número logo depois do tipo. Em Betim a
# forma qualificada é comum e o prejuízo é grande: MEDIDO em 2026-08-03
# sobre os 3.393 objetos de Betim, o extrator cru acha 206 referências e com
# este pré-processamento acha 279 — 71 objetos ganham o vínculo com a norma
# que alteram, vínculo que antes simplesmente não existia, sem erro nenhum
# aparecer (`legislacao_relacionada` ficava vazia).
#
# A correção é feita AQUI, e não em `etl/congresso/etl/normas.py`, de
# propósito: mexer no regex do outro eixo exigiria revalidá-lo contra as
# ementas federais dele (`python -m etl.normas --testar`), e um eixo não
# deve arriscar a calibração do outro para resolver um caso que só existe
# no seu lado. O tratamento é pré-processamento do texto, não uma segunda
# implementação da extração.
_QUALIFICADOR_ESFERA = re.compile(
    r"\b(lei\s+complementar|lei\s+org[âa]nica|lei|decreto\s+legislativo|decreto|"
    r"resolu[çc][ãa]o|portaria|instru[çc][ãa]o\s+normativa)"
    r"\s+(municipal|estadual|federal)\b",
    re.IGNORECASE,
)


def extrair_normas(texto: str | None) -> list[dict]:
    """Referências normativas da ementa, pelo extrator do Congresso, com a
    esfera marcada.

    A extração em si é a de `etl/congresso/etl/normas.py` — regex auditável,
    determinística, e NÃO o que o modelo alegou ter alterado. Aqui só se
    acrescentam duas coisas que o caso municipal exige.

    (1) O qualificador de esfera é retirado antes de delegar. Ver o
    comentário de `_QUALIFICADOR_ESFERA`: sem isso, "Lei Municipal nº 6.152"
    não é reconhecida como norma nenhuma.

    (2) O campo `esfera`, que existe por uma ambiguidade real: "Lei nº 2518,
    de 21 de dezembro de 1994" (código tributário de Betim) e uma lei
    federal de mesmo número produzem o mesmo identificador `lei:2518:1994`.
    Sem marcação, um grafo de normas ligaria as duas como se fossem a mesma.

    A esfera só é afirmada quando a própria citação diz qual é. Nos outros
    casos fica `indefinida` — e NÃO `federal`: ementa municipal cita lei
    federal o tempo todo (a LC 116/2003 do ISS aparece nos atos de Betim),
    mas a ausência da palavra "municipal" não prova nada, e afirmar esfera
    por omissão seria inventar procedência.
    """
    if not texto:
        return []

    # Mapa número-limpo -> esfera declarada, montado ANTES de limpar o texto.
    # `_normas._limpar_numero` é privado e reusado de propósito: o que
    # interessa é que a normalização do número ("6.152" -> "6152") seja
    # LITERALMENTE a mesma que o extrator aplica, senão a chave não bate.
    esferas: dict[str, str] = {}
    for m in _QUALIFICADOR_ESFERA.finditer(texto):
        depois = texto[m.end() : m.end() + 40]
        numero = re.search(r"(\d{1,3}(?:\.\d{3})+|\d{2,6})", depois)
        if numero:
            esferas[_normas._limpar_numero(numero.group(1))] = m.group(2).lower()

    limpo = _QUALIFICADOR_ESFERA.sub(r"\1", texto)
    achados = _normas.extrair(limpo)
    for a in achados:
        a["esfera"] = esferas.get(a["numero"], "indefinida")
    return achados


# ═══════════════════════════════════════════════════════════════
# CLI de inspeção (não grava nada)
# ═══════════════════════════════════════════════════════════════


def _amostra(id_municipio: str, quantos: int, tipo_objeto: str) -> None:
    sb = get_supabase_client()
    municipio = carregar_municipio(id_municipio)

    tabela, campos, normaliza = (
        ("atos_oficiais", CAMPOS_ATO, normalizar_ato)
        if tipo_objeto == "ato"
        else ("proposicoes", CAMPOS_PROPOSICAO, normalizar_proposicao)
    )
    linhas = (
        sb.table(tabela).select(campos).eq("id_municipio", id_municipio).limit(quantos).execute().data
    )
    for linha in linhas:
        print("=" * 70)
        print(montar_prompt(normaliza(linha, municipio)))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    # Sem default de cidade: ver scripts/conferir_defaults_de_cidade.py.
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--amostra", type=int, default=1, help="imprime N prompts e sai (não grava nada)")
    ap.add_argument("--tipo-objeto", choices=["ato", "proposicao"], default="ato")
    a = ap.parse_args()

    print(f"[analise_garantista] rubrica {VERSAO_RUBRICA} · prompt {VERSAO_PROMPT}")
    print(f"[analise_garantista] {len(DIREITOS)} direitos, {len(MECANISMOS)} mecanismos "
          f"lidos de {rubrica.RUBRICA_PATH}")
    _amostra(a.id_municipio, a.amostra, a.tipo_objeto)
