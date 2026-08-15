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

# ═══ CPF NA EMENTA — MEDIDO, NÃO HIPOTÉTICO ═══
#
# A ementa é texto oficial, e texto oficial às vezes traz CPF de pessoa
# física. Medido em 2026-08-15 nas 8.940 normas federais: **uma** ocorrência
# — a portaria do IBAMA que delega competência para firmar um TAC e escreve o
# nome do proprietário rural com o CPF ao lado. Uma em 8.940 é exatamente o
# número que faz uma conferência manual passar batido.
#
# Que a fonte publique não autoriza republicar. Este repositório é PÚBLICO: um
# CPF aqui fica indexável e clonável para sempre, o que é bem diferente de
# estar numa portaria no Diário Oficial. O teste `lib/sem-cpf-no-repo.test.ts`
# já barrava a entrada no repo — foi ele que pegou esta; a limpeza fica aqui,
# na origem, para o dado nunca chegar a ser gravado em lugar nenhum.
#
# O NOME DA PESSOA PERMANECE. O ato é público e a responsabilidade nele é
# pública — quem assina um TAC ambiental responde por ele com nome. Sai o
# identificador que serve para cruzar cadastros, não a informação de
# interesse público.
_CPF = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b")


def redigir_documentos(texto: str | None) -> str | None:
    """Troca CPF por `[CPF removido]`. CNPJ fica, de propósito.

    A assimetria é a decisão: CNPJ identifica empresa, e saber QUAL empresa
    assinou o TAC é justamente o que este portal existe para mostrar. CPF
    identifica pessoa natural.
    """
    if not texto:
        return texto
    return _CPF.sub("[CPF removido]", texto)

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


# ─────────────────────────── regressão ──────────────────────────────────
#
# Convenção do repo: extrator carrega a própria suíte atrás de `--testar`, e
# ela vira passo de workflow (`etl.normas --testar`, `etl.cota --testar`).
# Aqui isso pesa mais do que o normal, porque `docs/ANTES-DO-PUSH.md` conta
# que a PRIMEIRA versão do guarda de CPF deste repo **passava verde com CPF
# real dentro**: usava `\d` num `grep -E` POSIX, que não conhece `\d`, e
# casava zero. Guarda cego é pior que guarda nenhum — dá a sensação de estar
# protegido.
#
# Por isso os casos cobrem os DOIS lados. Só testar que o CPF sai deixaria
# passar uma regressão que redige demais e corrompe o texto oficial — e a
# ementa que originou tudo isto tem, na mesma frase, um número de processo
# que NÃO pode ser tocado.
#
# ⚠️ AS FIXTURES SÃO SINTÉTICAS, E ISSO NÃO É DETALHE. A primeira versão
# destes casos usava o CPF VERDADEIRO da ementa — e o guarda barrou o push,
# repetindo ao pé da letra o incidente de 13/08/2026 descrito em
# `docs/ANTES-DO-PUSH.md`: quatro dos seis CPF vazados estavam no comentário
# que documentava a função que remove CPF. Medir o vazamento na base real e
# colar o exemplo verdadeiro para justificar a proteção é como o exemplo
# VIRA o vazamento. `123.456.789-09` e `000.000.000-00` ilustram o formato
# igual e não são o CPF de ninguém.

_CASOS_REDACAO = [
    ("CPF nº 123.456.789-09, proprietário",
     "CPF nº [CPF removido], proprietário",
     "a forma do caso que originou esta função (Portaria IBAMA 2080/2012)"),
    ("Ação Civil Pública nº 2008.39.00.011777-1",
     "Ação Civil Pública nº 2008.39.00.011777-1",
     "número de processo na MESMA ementa — redigir isto corromperia o ato"),
    ("com Zandino Uliana, inscrito no CPF nº 123.456.789-09",
     "com Zandino Uliana, inscrito no CPF nº [CPF removido]",
     "o NOME permanece: quem assina um TAC ambiental responde por ele com nome"),
    ("CNPJ 33.000.167/0001-01",
     "CNPJ 33.000.167/0001-01",
     "CNPJ identifica empresa e é o que este portal existe para mostrar"),
    ("município 3106705", "município 3106705", "código IBGE não é documento"),
    ("Portaria nº 2.080, de 2012", "Portaria nº 2.080, de 2012", "número de norma fica"),
    ("dois: 123.456.789-09 e 000.000.000-00",
     "dois: [CPF removido] e [CPF removido]",
     "redige todos, não só o primeiro"),
    (None, None, "None continua None"),
    ("", "", "vazio continua vazio"),
]


def testar() -> bool:
    ok = True
    for entrada, esperado, porque in _CASOS_REDACAO:
        obtido = redigir_documentos(entrada)
        if obtido != esperado:
            ok = False
            print(f"  FALHA  {porque}")
            print(f"         esperado={esperado!r}")
            print(f"         obtido  ={obtido!r}")
    print(f"[etl.apis._legislacao_ambiental] {len(_CASOS_REDACAO)} caso(s) de redação: "
          f"{'OK' if ok else 'FALHOU'}")
    return ok


if __name__ == "__main__":
    import argparse
    import sys

    p = argparse.ArgumentParser(description="Helpers das fontes de legislação ambiental.")
    p.add_argument("--testar", action="store_true", help="roda a suíte de regressão da redação")
    args = p.parse_args()
    if args.testar:
        sys.exit(0 if testar() else 1)
    p.print_help()
