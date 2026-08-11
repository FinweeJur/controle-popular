"""Vício legislativo / indício de inconstitucionalidade — lado Python.

Companheira de `rubrica.py` (análise garantista), NÃO substituta: lê o MESMO
PL e produz um resultado independente — um item pode ter os dois (ex.: PL
que amplia um direito e, ao mesmo tempo, foi proposto por quem não tinha
iniciativa para propor).

Lê `rubrica/vicio_legislativo.json`, fonte canônica única compartilhada com
`lib/congresso/rubrica_vicio.ts` — mesma razão do `_nota` daquele arquivo:
instruir o modelo com uma taxonomia e classificar com outra produz deriva
silenciosa.

REGRA INEGOCIÁVEL, repetida aqui porque é fácil esquecer no meio do código:
nada que sai daqui é veredito de inconstitucionalidade. `nivel_gravidade`
nunca vem do modelo — sai de `calcular()`, determinístico, a partir da
`gravidade_base` de cada categoria que sobreviveu à validação. O modelo só
extrai (categoria + dispositivo + trecho); o app decide o nível.
"""
import json
from pathlib import Path
from typing import Any

RUBRICA_PATH = (
    Path(__file__).resolve().parents[3]
    / "apps"
    / "web"
    / "lib"
    / "congresso"
    / "rubrica"
    / "vicio_legislativo.json"
)
RUBRICA_VICIO: dict[str, Any] = json.loads(RUBRICA_PATH.read_text(encoding="utf-8"))

VERSAO_RUBRICA_VICIO: str = RUBRICA_VICIO["versao"]
VERSAO_PROMPT_VICIO = "1.0.0"

CATEGORIAS: dict[str, Any] = RUBRICA_VICIO["categorias"]
NIVEIS_ORDEM = {"sem_indicio": 0, "indicio_leve": 1, "indicio_grave": 2}
CONFIANCA_MINIMA: float = RUBRICA_VICIO["confianca_minima"]

# Reaproveitado de propósito, não reimplementado: é a mesma trava mínima
# contra dispositivo inventado que a análise garantista usa (exige número +
# marca de norma). Duplicar a função aqui divergiria na primeira correção
# feita só de um lado — já aconteceu uma vez com a marca "stf" (ver o
# comentário dela em rubrica.py).
#
# CARREGADO POR CAMINHO, não por `from etl.rubrica import ...`: este módulo
# é importado de dois jeitos diferentes — normalmente, como `etl.rubrica_vicio`
# dentro do pacote `etl` do Congresso (onde `etl.rubrica` existe de verdade);
# e por `exec_module` sob apelido a partir de `etl/betim/etl/analise_vicio.py`
# (mesmo truque de `analise_garantista.py`, ver o docstring dele), onde o
# pacote `etl` ambiente é o do /betim e NÃO tem `rubrica.py`. Um import
# relativo ao pacote quebraria nesse segundo caso; relativo a `__file__` não.
import importlib.util as _ilu

_spec = _ilu.spec_from_file_location(
    "_rubrica_vicio_dispositivo", Path(__file__).resolve().parent / "rubrica.py"
)
_rubrica_mod = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_rubrica_mod)
_dispositivo_plausivel = _rubrica_mod._dispositivo_plausivel


def _categorias_do_eixo(eixo: str) -> dict[str, Any]:
    return {slug: c for slug, c in CATEGORIAS.items() if eixo in c["eixos"]}


SYSTEM = """Você é um analista legislativo especializado em processo \
legislativo e controle preventivo de constitucionalidade. Sua tarefa é \
apontar INDÍCIOS de vício legislativo num projeto de lei brasileiro — nunca \
declarar que ele É inconstitucional.

REGRA MAIS IMPORTANTE DE TODAS, ACIMA DE QUALQUER OUTRA: quem decide \
inconstitucionalidade é o Poder Judiciário (STF e tribunais), não você. Você \
aponta PISTA (categoria de vício + dispositivo legal que a fundamenta), \
nunca um veredito. Nunca escreva a palavra "inconstitucional" como fato \
consumado — escreva "há indício de [categoria]" ou equivalente.

Regras absolutas:
1. O campo `dispositivo` de cada item NUNCA pode ficar vazio, e tem que ser \
um artigo concreto (ex.: "CF/88, art. 61, §1º, II", "CF/88, art. 30, I"). \
Use uma das ÂNCORAS listadas ao lado da categoria escolhida. Nunca invente \
um número de artigo que não está na lista de âncoras.
2. Cite no campo `trecho` um pedaço LITERAL da ementa fornecida. Não \
parafraseie.
3. Se o projeto não apresentar vício nenhum das categorias listadas, \
devolva `indicios` vazio. Não force uma categoria para um projeto comum — \
a MAIORIA dos projetos de lei não tem vício algum, e dizer isso é a \
resposta certa na maioria das vezes.
4. Vício de INICIATIVA só existe quando a proposição foi apresentada por \
parlamentar/vereador tratando de matéria que a Constituição reserva ao \
Chefe do Executivo (criação de cargo, aumento de remuneração de servidor, \
estrutura administrativa, regime jurídico de servidor). Verifique quem \
apresentou a proposição antes de marcar esta categoria — se o autor já é o \
Poder Executivo (ou um Projeto de Lei de Conversão de Medida Provisória, \
que por definição já nasceu no Executivo), NÃO HÁ vício de iniciativa.
5. Vício de COMPETÊNCIA: confira a ESFERA do objeto analisado (ela está \
marcada no início do prompt). Município regulando matéria de competência \
privativa da União (direito civil, penal, processual, trânsito nacional, \
material bélico) tem vício de competência. Mera gestão de trânsito local \
(sinalização, fiscalização de via municipal) é competência do MUNICÍPIO — \
não é vício.
6. CLÁUSULA PÉTREA (art. 60, §4º CF) só é relevante para PEC (emenda \
constitucional), nunca para projeto de lei comum. Mesmo numa PEC, é tema \
DOUTRINARIAMENTE CONTROVERSO na maioria dos casos — registre isso na \
`justificativa` em vez de afirmar que a PEC "é" inconstitucional.
7. `contrabando_legislativo` só se aplica se o prompt trouxer histórico de \
emendas da proposição. Se não vier, não use esta categoria.
8. Use APENAS os valores das listas fechadas fornecidas (categoria).
9. Responda somente com o objeto JSON, sem comentário fora dele.

EXEMPLO de um item bem preenchido, para uma ementa de PL apresentado por um \
deputado dizendo "Institui gratificação de produtividade para servidores do \
Ministério da Fazenda":
{"categoria": "vicio_iniciativa", "dispositivo": "CF/88, art. 61, §1º, II", \
"justificativa": "Cria vantagem remuneratória para servidor federal por \
iniciativa parlamentar; a CF reserva essa matéria ao Presidente da \
República.", "trecho": "Institui gratificação de produtividade para \
servidores do Ministério da Fazenda", "confianca": 0.85}"""


def montar_prompt(obj: dict, eixo: str) -> str:
    """Prompt de extração para uma proposição (Congresso) ou ato/proposição
    municipal. `obj` precisa ter `identificacao`, `ementa`, `autor` (quem
    apresentou) e opcionalmente `situacao`/`tipo_instrumento` (PL vs PEC vs
    PLV/MPV etc.). `eixo` é 'federal' ou 'municipal' — decide que âncoras e
    que categorias entram no prompt (contrabando_legislativo, por exemplo,
    nunca aparece no eixo municipal).
    """
    cats = _categorias_do_eixo(eixo)
    bloco_categorias = "\n".join(
        f"  - {slug}: {c['rotulo']} — {c['descricao']}\n"
        f"    âncoras: {'; '.join(c['ancoras'].get(eixo, []))}"
        for slug, c in cats.items()
    )

    autor = obj.get("autor") or "não informado"
    instrumento = obj.get("tipo_instrumento") or "não informado"

    return f"""OBJETO: {obj.get('identificacao')}
ESFERA/EIXO: {"Congresso Nacional (federal)" if eixo == "federal" else "Câmara Municipal (municipal)"}
TIPO DE INSTRUMENTO NORMATIVO: {instrumento}
AUTOR/PROPONENTE: {autor}
EMENTA: {obj.get('ementa')}
SITUAÇÃO: {obj.get('situacao') or 'não informada'}

CATEGORIAS DE VÍCIO APLICÁVEIS A ESTE EIXO (use exatamente estes slugs):
{bloco_categorias}

Devolva JSON exatamente neste formato:
{{
  "indicios": [
    {{
      "categoria": "<slug da lista>",
      "dispositivo": "<artigo concreto, ex.: 'CF/88, art. 61, §1º, II'>",
      "justificativa": "<1-2 frases, hedged: 'há indício de...' nunca 'é inconstitucional'>",
      "trecho": "<citação literal da ementa>",
      "confianca": <0.0 a 1.0>
    }}
  ],
  "resumo": "<1-3 frases pro cidadão leigo: o que foi encontrado (ou 'nenhum indício identificado'), sempre deixando claro que é indício de IA, não decisão judicial>"
}}"""


def validar_itens(bruto: dict, eixo: str) -> tuple[list[dict], list[str]]:
    """Filtra os itens do modelo contra a rubrica de vício.

    Mesmo padrão de `rubrica.validar_itens`: nada é corrigido em silêncio,
    item fora da taxonomia OU fora do eixo OU sem dispositivo citável é
    DESCARTADO e o motivo fica registrado.
    """
    validos: list[dict] = []
    descartes: list[str] = []
    cats_eixo = _categorias_do_eixo(eixo)

    for item in bruto.get("indicios") or []:
        categoria = (item.get("categoria") or "").strip()
        dispositivo = (item.get("dispositivo") or "").strip()

        if categoria not in CATEGORIAS:
            descartes.append(f"categoria fora da taxonomia: {categoria!r}")
            continue
        if categoria not in cats_eixo:
            descartes.append(f"categoria {categoria!r} não se aplica ao eixo {eixo!r}")
            continue
        if not _dispositivo_plausivel(dispositivo):
            descartes.append(f"dispositivo não citável: {dispositivo!r}")
            continue

        try:
            confianca = min(1.0, max(0.0, float(item.get("confianca", 0.5))))
        except (TypeError, ValueError):
            confianca = 0.5

        validos.append(
            {
                "categoria": categoria,
                "dispositivo": dispositivo,
                "justificativa": (item.get("justificativa") or "")[:1000] or None,
                "trecho": (item.get("trecho") or "")[:2000] or None,
                "confianca": round(confianca, 2),
            }
        )

    return validos, descartes


def calcular(itens: list[dict]) -> dict:
    """Nível de gravidade — determinístico, espelho de `calcularVicio` em TS.

    Zero itens válidos = sem_indicio. Um ou mais = o maior `gravidade_base`
    entre as categorias que sobreviveram à validação. NUNCA o que o modelo
    "achou" que era — o campo nem é lido do bruto.
    """
    nivel = "sem_indicio"
    for item in itens:
        base = CATEGORIAS[item["categoria"]]["gravidade_base"]
        if NIVEIS_ORDEM[base] > NIVEIS_ORDEM[nivel]:
            nivel = base

    requer_revisao = any(i["confianca"] < CONFIANCA_MINIMA for i in itens)
    return {"nivel_gravidade": nivel, "requer_revisao": requer_revisao}
