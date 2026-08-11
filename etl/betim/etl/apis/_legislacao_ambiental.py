"""etl.apis._legislacao_ambiental — o que os três coletores de legislação
ambiental (`legislacao_almg`, `legislacao_semad`, `legislacao_siam`)
compartilham: o `User-Agent` identificável (mesma convenção do
`cap_autos_infracao`), e a heurística de **dedup entre fontes**.

═══ POR QUE A CHAVE DE DEDUP EXISTE, E POR QUE ELA NÃO APAGA NADA ═══

As três fontes NÃO são compartimentos estanques. Medido ao vivo em
2026-08-11: a Lei nº 26.039/2026 (proteção ambiental) apareceu tanto na
consulta da ALMG (que traz as normas básicas do Legislativo, filtradas
localmente por `indexacao` = "Meio Ambiente") quanto no Banco de Legislação
Ambiental da SEMAD (que lista `Lei | Estadual | 26039 | 2026-08-07`) — a
MESMA lei, duas fontes. O SIAM (arquivo histórico) soma um terceiro
vocabulário para o mesmo universo de Leis/Decretos estaduais, e também
cobre Deliberação Copam/Portaria IEF/Portaria Igam — o mesmo tipo de ato
que a SEMAD lista.

A decisão deste projeto (registrada aqui, não em cada coletor): **as três
fontes gravam suas linhas, sem fundir e sem que uma apague a outra.** Uma
chave de dedup PERFEITA exigiria um identificador estável e compatível
entre três sistemas que nunca combinaram formato entre si — não existe.
Fundir errado (duas leis DIFERENTES tratadas como uma por coincidência de
número/ano) apaga informação real; não fundir e deixar a proveniência
visível (a `fonte` de cada linha) é reversível e honesto. `chave_dedup` é
best-effort — serve para a TELA sinalizar "isto também aparece em outra
fonte", nunca para decidir sozinha o que entra no banco.

A heurística: normaliza `tipo` para um vocabulário comum (a ALMG abrevia —
"DEC", "LCP" —, a SEMAD e o SIAM escrevem por extenso e às vezes grudam o
âmbito no tipo — "Decreto Estadual" — que aqui é removido porque âmbito não
é tipo, é escopo, e já existe outro jeito de saber que é estadual: as três
fontes deste eixo só cobrem MG), `numero` para dígitos puros (a ALMG grava
sem pontuação, "26039"; o SIAM grava com separador de milhar, "1.874" —
depois de tirar o ponto, os dois viram "26039"/"1874" e ficam comparáveis),
e junta com o ano. Duas linhas de fontes diferentes com a mesma
`chave_dedup` são candidatas fortes a serem a mesma norma — não certeza
(duas leis diferentes já teriam por azar o mesmo número em anos diferentes,
mas ai o ano diferiria; dentro do MESMO ano e MESMO tipo, número duplicado
citando norma diferente não foi observado nesta sondagem).
"""
import re
import unicodedata

UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

FONTES = ("almg", "semad", "siam")

# A ALMG entrega o tipo já abreviado (`tipo=LEI` no parâmetro de busca, mas o
# campo devolvido em `listaItem[].tipo` usa estes códigos curtos — DEC, LCP
# — vistos ao vivo em 2026-08-11 nas primeiras páginas da pesquisa
# direcionada). Mapeados para a forma por extenso que SEMAD/SIAM usam, para
# a chave de dedup enxergar as três fontes com o mesmo vocabulário.
_ABREV_ALMG = {
    "LEI": "LEI",
    "DEC": "DECRETO",
    "LCP": "LEI COMPLEMENTAR",
    "EMC": "EMENDA CONSTITUCIONAL",
    "RES": "RESOLUCAO",
    "RAL": "RESOLUCAO ALMG",
}


def _normalizar_texto(s: str) -> str:
    """Maiúsculo, sem acento, espaço único — mesma receita de
    `etl.apis.cap_autos_infracao._normalizar`."""
    base = unicodedata.normalize("NFD", s or "")
    sem_acento = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return " ".join(sem_acento.upper().split())


def normalizar_tipo(tipo_bruto: str | None) -> str | None:
    """`"DEC"` (ALMG) e `"Decreto Estadual"` (SIAM) -> `"DECRETO"`."""
    if not tipo_bruto or not tipo_bruto.strip():
        return None
    t = _normalizar_texto(tipo_bruto)
    if t in _ABREV_ALMG:
        return _ABREV_ALMG[t]
    # Âmbito grudado no tipo (SIAM: "DECRETO ESTADUAL"; nunca "FEDERAL" nas
    # três fontes deste eixo, que só cobrem MG) não é informação de TIPO.
    t = re.sub(r"\bESTADUAL\b", "", t)
    return " ".join(t.split()) or None


def normalizar_numero(numero_bruto: str | None) -> str | None:
    """`"1.874"` (separador de milhar do SIAM) e `"26039"` (ALMG, sem
    pontuação) -> `"1874"`/`"26039"`. Zeros à esquerda também caem —
    `"026039"` e `"26039"` são o mesmo número."""
    if not numero_bruto:
        return None
    digitos = re.sub(r"\D", "", numero_bruto)
    if not digitos:
        return None
    return str(int(digitos))


def chave_dedup(tipo_bruto: str | None, numero_bruto: str | None, ano: int | None) -> str | None:
    """`None` quando falta qualquer uma das três partes — uma chave parcial
    juntaria normas que não têm nada a ver só por causa do campo ausente."""
    tipo = normalizar_tipo(tipo_bruto)
    numero = normalizar_numero(numero_bruto)
    if not tipo or not numero or not ano:
        return None
    return f"{tipo}:{numero}:{ano}"
