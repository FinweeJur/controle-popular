"""etl.normas — extração determinística de referências normativas.

"Que leis este projeto altera?" é a pergunta que liga um PL à legislação
existente — e ela NÃO precisa de LLM: a resposta está escrita em português
burocrático altamente padronizado na própria ementa ("Altera o art. 1.336
da Lei nº 10.406, de 10 de janeiro de 2002 (Código Civil)").

Regex, não modelo, por três motivos: é auditável (dá para mostrar ao
usuário o trecho exato que gerou o link), é gratuito (roda em 4.400 PLs
sem custo nem fila) e é determinístico (o mesmo PL sempre produz o mesmo
grafo).

O LexML — a fonte canônica de identificadores de norma — está atrás do
mesmo desafio anti-bot do Senado (ver docs/F0-discovery.md), então não dá
para resolver URN oficial. Produzimos identificadores próprios no formato
`lei:10406:2002`, estáveis o bastante para agrupar e linkar.

REGRA DO PROJETO (aprendida no app irmão, onde `licita` batia dentro de
"SOlicitação" e inflou uma categoria em ~13×): todo padrão aqui é testado
contra ementas REAIS antes de ser aceito — ver `python -m etl.normas
--testar`.
"""
import argparse
import re

# ── Padrões ───────────────────────────────────────────────────
# `nº`, `n.`, `n°` e `no` aparecem todos na prática. O `\.?` depois de
# `n` cobre "n.", e o grupo de caracteres cobre as três variações de
# ordinal (º masculino, ° grau, o simples).
_NUM = r"n[º°o\.]{0,2}\s*"

# Número de lei com separador de milhar opcional: "10.406" ou "10406".
#
# O `+` na primeira alternativa é obrigatório e a ausência dele foi um bug
# real, achado em 2026-07-23 pelo smoke test do ofício. Com `*`, a
# alternância — que é ORDENADA — casava "104" dentro de "10406" e parava
# ali, produzindo `lei:104:?`. Não apareceu na validação contra 60 ementas
# porque ementa oficial quase sempre escreve "Lei nº 10.406" com ponto de
# milhar; texto gerado por LLM escreve "Lei 10406/2002" sem, e era
# justamente aí que o verificador precisava acertar.
_NUMERO_NORMA = r"(\d{1,3}(?:\.\d{3})+|\d{2,6})"

# Ano da norma nas duas formas que aparecem na prática:
#   "Lei 8.078, de 11 de setembro de 1990"  → grupo "de ... AAAA"
#   "Lei 8078/1990"                          → grupo "/AAAA"
# A forma com barra faltava e gerava `lei:8078:?`, que por sua vez virou
# falso positivo no verificador de alucinação do benchmark. Ler o ano aqui
# resolve na origem, em vez de contornar na comparação.
_ANO_NORMA = r"(?:\s*/\s*(\d{4})|\s*[,/]?\s*de\s+[^,;)]{0,40}?(\d{4}))?"

_PADROES: list[tuple[str, re.Pattern]] = [
    (
        "lei_complementar",
        re.compile(rf"lei\s+complementar\s+(?:{_NUM})?{_NUMERO_NORMA}{_ANO_NORMA}", re.IGNORECASE),
    ),
    (
        "decreto_lei",
        re.compile(rf"decreto[\s-]lei\s+(?:{_NUM})?{_NUMERO_NORMA}{_ANO_NORMA}", re.IGNORECASE),
    ),
    (
        "lei",
        # `(?<!complementar )` e `(?<!-)` evitam recapturar o que os dois
        # padrões acima já pegaram como tipo mais específico.
        re.compile(rf"(?<!complementar\s)(?<!-)\blei\s+(?:{_NUM})?{_NUMERO_NORMA}{_ANO_NORMA}", re.IGNORECASE),
    ),
    (
        "decreto",
        re.compile(rf"(?<!-)\bdecreto\s+(?:{_NUM})?{_NUMERO_NORMA}{_ANO_NORMA}", re.IGNORECASE),
    ),
    (
        "medida_provisoria",
        re.compile(rf"medida\s+provis[óo]ria\s+(?:{_NUM})?{_NUMERO_NORMA}{_ANO_NORMA}", re.IGNORECASE),
    ),
    (
        "emenda_constitucional",
        re.compile(rf"emenda\s+constitucional\s+(?:{_NUM})?{_NUMERO_NORMA}", re.IGNORECASE),
    ),
]

# Artigos citados ("art. 1.336", "arts. 217-A, 218 e 218-A", "artigo 5º").
_ARTIGOS = re.compile(
    r"\bart(?:s?\.|igos?)\s*((?:\d+(?:\.\d+)?(?:\s*-\s*[A-Z])?(?:º|°)?[,;\s e]{0,4}){1,8})",
    re.IGNORECASE,
)

# Codificações citadas pelo apelido, sem número. Só entram quando o
# apelido aparece — não inferimos "Código Civil" a partir de "civil".
_APELIDOS: dict[str, str] = {
    r"c[óo]digo\s+civil": "lei:10406:2002",
    r"c[óo]digo\s+penal": "decreto_lei:2848:1940",
    r"c[óo]digo\s+de\s+processo\s+penal": "decreto_lei:3689:1941",
    r"c[óo]digo\s+de\s+processo\s+civil": "lei:13105:2015",
    r"consolida[çc][ãa]o\s+das\s+leis\s+do\s+trabalho|\bCLT\b": "decreto_lei:5452:1943",
    r"c[óo]digo\s+de\s+defesa\s+do\s+consumidor|\bCDC\b": "lei:8078:1990",
    r"estatuto\s+da\s+crian[çc]a\s+e\s+do\s+adolescente|\bECA\b": "lei:8069:1990",
    r"estatuto\s+da\s+pessoa\s+idosa|estatuto\s+do\s+idoso": "lei:10741:2003",
    r"lei\s+maria\s+da\s+penha": "lei:11340:2006",
    r"lei\s+geral\s+de\s+prote[çc][ãa]o\s+de\s+dados|\bLGPD\b": "lei:13709:2018",
    r"c[óo]digo\s+florestal": "lei:12651:2012",
    r"lei\s+de\s+diretrizes\s+e\s+bases|\bLDB\b": "lei:9394:1996",
    r"estatuto\s+da\s+cidade": "lei:10257:2001",
    r"lei\s+brasileira\s+de\s+inclus[ãa]o|\bLBI\b": "lei:13146:2015",
    r"lei\s+de\s+acesso\s+[àa]\s+informa[çc][ãa]o|\bLAI\b": "lei:12527:2011",
    r"c[óo]digo\s+de\s+tr[âa]nsito": "lei:9503:1997",
    r"c[óo]digo\s+tribut[áa]rio\s+nacional|\bCTN\b": "lei:5172:1966",
}
_APELIDOS_COMPILADOS = [(re.compile(p, re.IGNORECASE), ident) for p, ident in _APELIDOS.items()]

_CONSTITUICAO = re.compile(
    r"constitui[çc][ãa]o\s+(?:federal|da\s+rep[úu]blica)|\bCF/88\b|\bCF\b(?=[,\s])",
    re.IGNORECASE,
)


def _limpar_numero(n: str) -> str:
    return n.replace(".", "")


def extrair(texto: str | None) -> list[dict]:
    """Extrai referências normativas de um texto.

    Devolve uma lista de dicts com `identificador` (estável),
    `tipo`, `numero`, `ano`, `artigos` e `trecho` (o que casou — para o
    usuário poder conferir).
    """
    if not texto:
        return []

    achados: dict[str, dict] = {}

    for tipo, padrao in _PADROES:
        for m in padrao.finditer(texto):
            numero = _limpar_numero(m.group(1))
            # `_ANO_NORMA` tem dois grupos alternativos (barra e "de ...");
            # só um casa por vez. `emenda_constitucional` não usa o sufixo
            # e por isso tem um grupo só — daí o acesso defensivo.
            grupos = m.groups()
            ano = next((g for g in grupos[1:3] if g), None)
            ident = f"{tipo}:{numero}:{ano or '?'}"
            if ident not in achados:
                achados[ident] = {
                    "identificador": ident,
                    "tipo": tipo,
                    "numero": numero,
                    "ano": int(ano) if ano else None,
                    "artigos": [],
                    "trecho": m.group(0).strip(),
                }

    for padrao, ident in _APELIDOS_COMPILADOS:
        m = padrao.search(texto)
        if not m:
            continue
        if ident in achados:
            continue
        # Se a mesma norma já foi capturada pelo número, o apelido é
        # redundante — só entra quando aparece sozinho ("altera o Código
        # Civil" sem citar a Lei 10.406).
        tipo, numero, ano = ident.split(":")
        achados[ident] = {
            "identificador": ident,
            "tipo": tipo,
            "numero": numero,
            "ano": int(ano),
            "artigos": [],
            "trecho": m.group(0).strip(),
        }

    if _CONSTITUICAO.search(texto):
        achados.setdefault(
            "constituicao:1988",
            {
                "identificador": "constituicao:1988",
                "tipo": "constituicao",
                "numero": None,
                "ano": 1988,
                "artigos": [],
                "trecho": "Constituição Federal",
            },
        )

    artigos = []
    for m in _ARTIGOS.finditer(texto):
        for parte in re.split(r"[,;]|\se\s", m.group(1)):
            parte = parte.strip().rstrip(".").replace("º", "").replace("°", "")
            if parte:
                artigos.append(parte)

    # Os artigos ficam na referência quando há exatamente UMA norma citada.
    # Com várias, atribuir artigo a norma exigiria análise sintática — e um
    # link errado é pior que link nenhum num app cuja premissa é auditável.
    lista = list(achados.values())
    if artigos and len(lista) == 1:
        lista[0]["artigos"] = sorted(set(artigos))

    return lista


# ── Teste de calibração ───────────────────────────────────────
# Regra do projeto: classificador de texto só é confiável depois de
# testado contra o boilerplate real do domínio.
_CASOS: list[tuple[str, list[str]]] = [
    (
        "Altera o art. 1.336 da Lei nº 10.406, de 10 de janeiro de 2002 (Código Civil), "
        "para disciplinar o ressarcimento de honorários advocatícios.",
        ["lei:10406:2002"],
    ),
    (
        "Altera os arts. 217-A, 218 e 218-A do Decreto-Lei n° 2.848, de 7 de dezembro de "
        "1940 – Código Penal, para estender os efeitos da norma à vítima com idade igual a 14 anos.",
        ["decreto_lei:2848:1940"],
    ),
    (
        "Dispõe sobre o exercício da profissão de técnico em anatomia, necropsia e "
        "tanatopraxia humana.",
        [],
    ),
    (
        "Cria o Programa Nacional de Combate à Pobreza Menstrual nas Escolas Públicas.",
        [],
    ),
    (
        "Altera a Consolidação das Leis do Trabalho para dispor sobre jornada.",
        ["decreto_lei:5452:1943"],
    ),
    (
        "Acrescenta dispositivo à Lei Complementar nº 123, de 14 de dezembro de 2006.",
        ["lei_complementar:123:2006"],
    ),
    (
        "Altera a Constituição Federal para incluir a proteção de dados entre os "
        "direitos fundamentais.",
        ["constituicao:1988"],
    ),
    # Regressão do bug de truncamento (2026-07-23): sem o `+` em
    # `_NUMERO_NORMA`, estes três davam `lei:104`, `lei:807` e `lei:363`.
    ("Altera a Lei 10406 de 2002.", ["lei:10406:2002"]),
    ("Menciona a Lei 8078/1990 sem ponto de milhar.", ["lei:8078:1990"]),
    ("Referência ao PL 3631/2026 escrito como Lei 3631.", ["lei:3631:?"]),
]


def testar() -> bool:
    ok = True
    for texto, esperado in _CASOS:
        obtido = sorted(r["identificador"] for r in extrair(texto))
        if obtido != sorted(esperado):
            ok = False
            print(f"  FALHOU\n    texto:    {texto[:80]}...\n    esperado: {esperado}\n    obtido:   {obtido}")
        else:
            print(f"  ok  {esperado or '(nenhuma)'}")
    print("TODOS OS CASOS PASSARAM" if ok else "HÁ FALHAS — não confiar no extrator ainda")
    return ok


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--testar", action="store_true")
    p.add_argument("--texto", help="extrai de um texto avulso")
    args = p.parse_args()
    if args.texto:
        import json

        print(json.dumps(extrair(args.texto), ensure_ascii=False, indent=2))
    else:
        raise SystemExit(0 if testar() else 1)
