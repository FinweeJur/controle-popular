"""Benchmark da rubrica contra um conjunto balanceado — o portão da F4.

    python -m etl.benchmark                 # roda os 30 casos
    python -m etl.benchmark --limite 6      # amostra rápida
    python -m etl.benchmark --repetir 3     # checa reprodutibilidade
    python -m etl.benchmark --caso 2638852  # um caso só, verboso

NÃO precisa de Supabase. Só da API da Câmara (pública) e do LLM configurado.

Por que este arquivo existe
---------------------------
`docs/F0-discovery.md` §4.2 registra a pergunta mais perigosa do projeto:
nas 5 primeiras proposições testadas, TODAS saíram "garantista". Com 5
casos não dá para saber se isso é viés de amostra (os PLs recentes eram
mesmo protetivos) ou viés do modelo (ele lê qualquer proposta como
benéfica). A diferença é decisiva: um classificador que nunca diz
"reducionista" não classifica nada, e o eixo inteiro do produto cai.

O conjunto de `casos.json` é montado justamente para separar as duas
hipóteses: 10 casos que um humano lê como reducionistas, 10 como
garantistas, 10 sem direito em jogo. Se a acurácia for alta nos
garantistas e no chão nos reducionistas, é viés do modelo — e o número
que mostra isso é o RECALL POR CLASSE, não a acurácia global (com 1/3 de
cada classe, um modelo que responde "garantista" sempre já tira 33%).

O que se mede aqui
------------------
1. acurácia global e **recall por classe** (o que responde a §4.2);
2. matriz de confusão — para onde vai o erro, não só quanto erra;
3. taxa de descarte da validação (qualidade da extração);
4. **rastreabilidade do dispositivo citado**: cada citação vem da ementa
   ou de uma âncora da rubrica? Uma que não vem de nenhuma das duas é
   candidata a alucinação e sai listada por extenso.

Limite honesto da checagem (4): ela confere a NORMA citada, não o número
do artigo. Validar artigo exigiria uma base normativa completa, e o LexML
— fonte canônica — está atrás do desafio anti-bot (F0-discovery §3). Uma
citação "rastreável" aqui é uma citação cuja LEI faz sentido; o artigo
segue precisando de olho humano na amostra.
"""
import argparse
import json
import time
import unicodedata
import urllib.request
from collections import Counter
from pathlib import Path

from etl import rubrica
from etl.llm import LLMError, get_provider
from etl.normas import extrair as extrair_normas

API = "https://dadosabertos.camara.leg.br/api/v2"
AQUI = Path(__file__).resolve().parent
CASOS_PATH = AQUI / "casos.json"
CACHE_DIR = AQUI / ".cache"
RESULTADO_PATH = AQUI / "resultado.json"

CLASSES = ("garantista", "reducionista", "tecnico")

# O rótulo da rubrica é mais fino que a classe do gabarito (que é ternária
# de propósito: julgar "garantista" vs "garantista_forte" à mão seria
# discutir intensidade, e não é isso que está em teste aqui).
BUCKET = {
    "garantista_forte": "garantista",
    "garantista": "garantista",
    "neutro": "tecnico",
    "reducionista": "reducionista",
    "reducionista_forte": "reducionista",
    "misto": "misto",  # não é acerto nem erro simples — contado à parte
}


# ── Dados da proposição (com cache em disco) ──────────────────
def _carregar_proposicao(id_camara: str) -> dict:
    """Busca detalhe na API da Câmara, com cache local.

    O cache não é otimização: é o que torna o benchmark repetível. Sem ele,
    uma reexecução compara o modelo contra uma ementa que pode ter sido
    editada na origem, e a variação de rótulo ficaria indistinguível de
    variação do modelo.
    """
    CACHE_DIR.mkdir(exist_ok=True)
    cache = CACHE_DIR / f"{id_camara}.json"
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))

    req = urllib.request.Request(
        f"{API}/proposicoes/{id_camara}", headers={"Accept": "application/json"}
    )
    d = json.load(urllib.request.urlopen(req, timeout=90))["dados"]
    prop = {
        "id": str(d["id"]),
        "identificacao": f"{d['siglaTipo']} {d['numero']}/{d['ano']}",
        "ementa": d.get("ementa"),
        "ementa_detalhada": d.get("ementaDetalhada"),
        "keywords": d.get("keywords"),
        "texto_integral": None,
    }
    cache.write_text(json.dumps(prop, ensure_ascii=False, indent=2), encoding="utf-8")
    return prop


# ── Rastreabilidade da citação ────────────────────────────────
def _normas(texto: str | None) -> set[tuple[str, str | None, int | None]]:
    """Normas citadas num texto, como (tipo, número, ano).

    Guarda o ano separado em vez de usar o identificador cru porque a
    MESMA norma aparece com e sem ano conforme a grafia: a ementa escreve
    "Lei nº 9.605, de 12 de fevereiro de 1998" (vira `lei:9605:1998`) e o
    modelo responde "Lei 9.605/1998" (vira `lei:9605:?`, o extrator não lê
    ano depois de barra). Comparar identificador contra identificador
    marcava essas duas como normas diferentes — e uma citação perfeita
    saía listada como candidata a alucinação. Falso alarme em métrica de
    alucinação é pior que nenhuma métrica: ensina a ignorá-la.
    """
    return {(r["tipo"], r["numero"], r["ano"]) for r in extrair_normas(texto)}


def _mesma_norma(a: set, b: set) -> bool:
    """Interseção tolerante a ano ausente de um dos lados."""
    for tipo_a, num_a, ano_a in a:
        for tipo_b, num_b, ano_b in b:
            if tipo_a != tipo_b or num_a != num_b:
                continue
            if ano_a is None or ano_b is None or ano_a == ano_b:
                return True
    return False


_ANCORAS_POR_DIREITO: dict[str, set] = {
    slug: {n for a in d["ancoras"] for n in _normas(a)}
    for slug, d in rubrica.DIREITOS.items()
}


def _sem_acento(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s or "") if unicodedata.category(c) != "Mn"
    ).lower()


def rastrear(dispositivo: str, direito: str, texto_fonte: str) -> str:
    """De onde saiu a citação: 'ementa', 'ancora' ou 'nao_rastreavel'.

    Não corrige nada — só rotula a origem. Item "não rastreável" continua
    entrando no score (o guarda-corpo que barra citação é o
    `_dispositivo_plausivel` da rubrica); aqui ele é MEDIDO, para que a
    taxa de alucinação seja um número acompanhado a cada versão de prompt
    em vez de uma impressão.
    """
    do_dispositivo = _normas(dispositivo)
    if not do_dispositivo:
        return "nao_rastreavel"
    if _mesma_norma(do_dispositivo, _normas(texto_fonte)):
        return "ementa"
    if _mesma_norma(do_dispositivo, _ANCORAS_POR_DIREITO.get(direito, set())):
        return "ancora"
    # Âncoras escritas por extenso ("Lei 8.078/1990 (CDC)") às vezes voltam
    # do modelo com outra grafia da mesma norma; a comparação textual pega
    # o que a comparação por identificador deixou passar.
    alvo = _sem_acento(dispositivo)
    for ancora in rubrica.DIREITOS.get(direito, {}).get("ancoras", []):
        if _sem_acento(ancora)[:14] in alvo:
            return "ancora"
    return "nao_rastreavel"


# ── Execução de um caso ───────────────────────────────────────
def rodar_caso(provider, caso: dict, verboso: bool = False) -> dict:
    prop = _carregar_proposicao(caso["id_camara"])
    fonte = " ".join(filter(None, [prop.get("ementa"), prop.get("ementa_detalhada")]))

    t0 = time.time()
    try:
        bruto = provider.gerar_json(
            rubrica.montar_prompt(prop), system=rubrica.SYSTEM, temperatura=0.0
        )
    except LLMError as e:
        return {
            **caso,
            "obtido": "erro",
            "erro": str(e)[:300],
            "segundos": round(time.time() - t0, 1),
        }

    itens, descartes = rubrica.validar_itens(bruto)
    calculo = rubrica.calcular(itens)
    for i in itens:
        i["origem_citacao"] = rastrear(i["dispositivo"], i["direito"], fonte)

    obtido = BUCKET.get(calculo["rotulo"], calculo["rotulo"])
    resultado = {
        **caso,
        "obtido": obtido,
        "rotulo_bruto": calculo["rotulo"],
        "score": calculo["score"],
        "acertou": obtido == caso["esperado"],
        "itens": itens,
        "descartes": descartes,
        "clausula_petrea": bool(bruto.get("clausula_petrea")),
        "vedacao_retrocesso": bool(bruto.get("vedacao_retrocesso")),
        "resumo_neutro": (bruto.get("resumo_neutro") or "")[:600],
        "segundos": round(time.time() - t0, 1),
    }

    marca = "ok " if resultado["acertou"] else "ERRO"
    print(
        f"  [{marca}] {caso['identificacao']:<14} esperado={caso['esperado']:<12}"
        f" obtido={obtido:<12} ({calculo['rotulo']}, score {calculo['score']:+.2f},"
        f" {len(itens)} itens, {resultado['segundos']}s)"
    )
    if verboso or not resultado["acertou"]:
        for i in itens:
            print(
                f"        [{i['peso']:+.2f}] {i['direito']} · {i['direcao']} · {i['grau']}"
                f" · {i['dispositivo']} <{i['origem_citacao']}>"
            )
        for d in descartes:
            print(f"        DESCARTADO: {d}")
    return resultado


# ── Relatório ─────────────────────────────────────────────────
def relatar(resultados: list[dict]) -> dict:
    validos = [r for r in resultados if r["obtido"] != "erro"]
    acertos = sum(1 for r in validos if r["acertou"])
    acuracia = acertos / len(validos) if validos else 0.0

    print("\n" + "=" * 78)
    print(f"ACURÁCIA GLOBAL: {acertos}/{len(validos)} = {acuracia:.0%}   (meta da F4: ≥ 80%)")
    if len(validos) < len(resultados):
        print(f"  ({len(resultados) - len(validos)} caso(s) com erro de LLM, fora da conta)")

    print("\nRECALL POR CLASSE — é isto que responde a §4.2 do F0-discovery:")
    por_classe = {}
    for classe in CLASSES:
        da_classe = [r for r in validos if r["esperado"] == classe]
        if not da_classe:
            continue
        certos = sum(1 for r in da_classe if r["acertou"])
        por_classe[classe] = {"total": len(da_classe), "acertos": certos}
        print(f"  {classe:<14} {certos}/{len(da_classe)} = {certos / len(da_classe):.0%}")

    red = por_classe.get("reducionista")
    if red:
        if red["acertos"] == 0:
            print(
                "\n  >> O modelo NÃO produziu nenhum 'reducionista' onde um humano vê 10.\n"
                "     É o cenário (b) do F0-discovery §4.2: viés do modelo, não da amostra.\n"
                "     NÃO construir a UI de análise em cima disto — trocar de modelo ou de\n"
                "     prompt e rodar de novo."
            )
        elif red["acertos"] / red["total"] < 0.5:
            print(
                "\n  >> Recall de 'reducionista' abaixo de 50%: o eixo funciona, mas torto.\n"
                "     Ver a matriz abaixo para onde os erros vão antes de mexer no prompt."
            )

    print("\nMATRIZ DE CONFUSÃO (linha = esperado, coluna = obtido):")
    obtidos = sorted({r["obtido"] for r in validos})
    print(f"  {'':<14}" + "".join(f"{o:>16}" for o in obtidos))
    for classe in CLASSES:
        linha = Counter(r["obtido"] for r in validos if r["esperado"] == classe)
        if not linha:
            continue
        print(f"  {classe:<14}" + "".join(f"{linha.get(o, 0):>16}" for o in obtidos))

    itens = [i for r in validos for i in r["itens"]]
    descartes = sum(len(r["descartes"]) for r in validos)
    total_bruto = len(itens) + descartes
    print(f"\nEXTRAÇÃO: {len(itens)} itens válidos · {descartes} descartados", end="")
    if total_bruto:
        print(f" · taxa de descarte {descartes / total_bruto:.0%}")
    else:
        print()

    origem = Counter(i["origem_citacao"] for i in itens)
    print("\nRASTREABILIDADE DA CITAÇÃO (confere a norma, não o nº do artigo):")
    for k in ("ementa", "ancora", "nao_rastreavel"):
        print(f"  {k:<16} {origem.get(k, 0)}")
    nao_rastreaveis = [
        (r["identificacao"], i["direito"], i["dispositivo"])
        for r in validos
        for i in r["itens"]
        if i["origem_citacao"] == "nao_rastreavel"
    ]
    if nao_rastreaveis:
        print("  candidatas a citação inventada — conferir à mão:")
        for ident, direito, disp in nao_rastreaveis:
            print(f"    {ident:<14} {direito:<28} {disp}")
    else:
        print("  nenhuma citação fora da ementa ou das âncoras.")

    ruido = [
        r for r in validos if r["esperado"] == "tecnico" and r["itens"]
    ]
    if ruido:
        print(
            f"\nRUÍDO EM PROPOSIÇÃO TÉCNICA: {len(ruido)} das honoríficas geraram item de"
            " direito.\n  (A regra 3 do system prompt manda devolver lista vazia nesses casos.)"
        )
        for r in ruido:
            print(f"  {r['identificacao']:<14} {[i['direito'] for i in r['itens']]}")

    return {
        "acuracia": round(acuracia, 4),
        "acertos": acertos,
        "avaliados": len(validos),
        "por_classe": por_classe,
        "taxa_descarte": round(descartes / total_bruto, 4) if total_bruto else None,
        "origem_citacao": dict(origem),
        "ruido_tecnico": len(ruido),
    }


def checar_reprodutibilidade(resultados_por_rodada: list[list[dict]]) -> None:
    """DoD 5 do plano: mesmo PL, mesmo modelo e prompt ⇒ mesmo rótulo.

    Temperatura 0 não garante determinismo em LLM (batching e kernels de
    GPU introduzem variação), então isso é medição, não suposição.
    """
    print("\n" + "=" * 78)
    print(f"REPRODUTIBILIDADE ({len(resultados_por_rodada)} rodadas, temperatura 0):")
    instaveis = []
    for idx, primeiro in enumerate(resultados_por_rodada[0]):
        rotulos = {r[idx]["obtido"] for r in resultados_por_rodada}
        if len(rotulos) > 1:
            instaveis.append((primeiro["identificacao"], sorted(rotulos)))
    total = len(resultados_por_rodada[0])
    print(f"  {total - len(instaveis)}/{total} casos deram o mesmo rótulo em todas as rodadas")
    for ident, rotulos in instaveis:
        print(f"    INSTÁVEL  {ident:<14} {rotulos}")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--limite", type=int, help="roda só os N primeiros casos")
    p.add_argument("--caso", help="id_camara de um caso específico (verboso)")
    p.add_argument("--repetir", type=int, default=1, help="rodadas para medir estabilidade")
    p.add_argument("--verboso", action="store_true")
    args = p.parse_args()

    dados = json.loads(CASOS_PATH.read_text(encoding="utf-8"))
    casos = dados["casos"]
    if args.caso:
        casos = [c for c in casos if c["id_camara"] == args.caso]
        if not casos:
            raise SystemExit(f"caso {args.caso} não está em casos.json")
        args.verboso = True
    if args.limite:
        casos = casos[: args.limite]

    provider = get_provider()
    print(f"provedor: {provider.identificacao}")
    print(f"rubrica: v{rubrica.VERSAO_RUBRICA} · prompt: v{rubrica.VERSAO_PROMPT}")
    print(f"gabarito: v{dados['versao']} · {len(casos)} casos\n")
    if not provider.disponivel():
        raise SystemExit(
            "provedor indisponível. Com Ollama: `ollama list` e confira LLM_MODEL."
        )

    rodadas = []
    for n in range(args.repetir):
        if args.repetir > 1:
            print(f"--- rodada {n + 1}/{args.repetir} ---")
        rodadas.append([rodar_caso(provider, c, args.verboso) for c in casos])

    resumo = relatar(rodadas[-1])
    if args.repetir > 1:
        checar_reprodutibilidade(rodadas)

    RESULTADO_PATH.write_text(
        json.dumps(
            {
                "modelo": provider.identificacao,
                "versao_rubrica": rubrica.VERSAO_RUBRICA,
                "versao_prompt": rubrica.VERSAO_PROMPT,
                "versao_gabarito": dados["versao"],
                "resumo": resumo,
                "casos": rodadas[-1],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\nresultado completo em {RESULTADO_PATH}")


if __name__ == "__main__":
    main()
