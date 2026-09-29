"""Gera apps/web/lib/memoria/calendario.ts das duas fontes do dono.

Fontes e autoria (correções do dono em 29/09/2026):
- "Aos que virão — Calendário Insurgente": de GUSTAVO SEFERIAN; a data da
  citação é a DATA DO POST (a URL do WordPress traz /AAAA/MM/DD/).
- "Calendário Histórico dos Trabalhadores e Trabalhadoras": do MST, 2009
  (organização de Ângelo Diogo Mazin, Janaina Strozake e Miguel Enrique
  Almeida Stádile), documento local sem URL.

REGRA DO DONO: fato sem dia ou sem ano NÃO se perde. O que tem dia/mês
entra no dia (com ou sem ano); o que não tem data nenhuma vira "recheio"
e preenche, de forma determinística (semente sha1 do próprio texto), os
dias do ano que ficaram sem fato.

O script não inventa nada: data, título, autor e link vêm dos arquivos.
"""
import hashlib
import json
import re
import unicodedata
from pathlib import Path

TEMP = Path(r"C:\Users\teste\AppData\Local\Temp\opencode")
DESTINO = Path(r"X:\DevCoder\OpenCode\controle-popular\apps\web\lib\memoria\calendario.ts")

MESES = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9,
    "outubro": 10, "novembro": 11, "dezembro": 12,
}
MES_ABNT = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.",
            "set.", "out.", "nov.", "dez."]
AUTOR_BLOG = "SEFERIAN, Gustavo"
ORGAO_BLOG = "Aos que virão — Calendário Insurgente"
AUTOR_MST = "MST — MOVIMENTO DOS TRABALHADORES RURAIS SEM TERRA"
ORGAO_MST = ("Calendário Histórico dos Trabalhadores e Trabalhadoras "
             "(org. Ângelo Diogo Mazin, Janaina Strozake e Miguel Enrique Almeida Stádile)")
DATA_MST = "2009"


def sem_acento(t: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", t.lower()) if not unicodedata.combining(c)
    )


def classificar(texto: str) -> list[str]:
    t = sem_acento(texto)
    tipos = []
    if re.search(r"revolta|insurrei|levante|rebeli|motim|conjura|inconfiden", t):
        tipos.append("revolta")
    if re.search(r"quilomb|escrav|abolic|negro|palmares|zumbi|males", t):
        tipos.append("quilombo")
    if re.search(r"indigen|indio|povos origin|guarani|yanomami|funai|aldeia", t):
        tipos.append("indigena")
    if re.search(r"greve|operari|sindic|trabalhador|proletari|fabrica|metalurgic", t):
        tipos.append("greve")
    if re.search(r"sem-terra|posseir|campesin|latifundio|agraria|ligas camponesas|assentament|reforma agraria", t):
        tipos.append("campo")
    if re.search(r"anistia|ditadura|tortura|presos polit|guerrilha|ai-5|censura|golpe", t):
        tipos.append("anistia")
    if re.search(r"mulher|femin|lgbt|racis|direitos humanos|direito|voto|sufragio", t):
        tipos.append("direitos")
    if not tipos:
        tipos.append("resistencia")
    return tipos


def escapa(s: str) -> str:
    return (s.replace("\\", "\\\\").replace('"', '\\"')
            .replace("\n", " ").replace("\t", " ").replace("\r", " "))


def limpa(texto: str) -> str:
    f = re.sub(r"^[^A-Za-zÀ-ÿ0-9\"“]+", "", re.sub(r"\s{2,}", " ", texto)).strip()
    f = re.sub(r"\s*(WW-|Absatz|Standard)[^\s]*.*$", "", f).strip()
    f = re.sub(r"^[A-Za-zÀ-ÿ]\s+(?=[A-ZÀ-Ý])", "", f)
    if f and f[0].islower() and not f[0].isdigit():
        f = f[0].upper() + f[1:]
    return f


def data_do_post(url: str) -> str:
    m = re.search(r"/(\d{4})/(\d{2})/(\d{2})/", url)
    if not m:
        return "2020"
    ano, mes, dia = int(m.group(1)), int(m.group(2)), int(m.group(3))
    return f"{dia} {MES_ABNT[mes - 1]} {ano}"


entradas: list[dict] = []
vistos: set[str] = set()

# --- blog (autor e data conforme o dono) --------------------------------
for post in json.loads((TEMP / "blog-calendario.json").read_text(encoding="utf-8-sig")):
    titulo = re.sub(r"\s+", " ", post["titulo"]).strip()
    m = re.match(r"^(\d{1,2})\s*[ºo°]?\s*de\s+([A-Za-zÀ-ÿ]+)\s+de\s+(\d{3,4})\s*[-–—:]\s*(.+)$", titulo)
    if not m:
        continue
    dia, mes_nome, ano, fato = m.groups()
    mes = MESES.get(sem_acento(mes_nome))
    if not mes or not 1 <= int(dia) <= 31:
        continue
    fato = fato.strip().rstrip(".").strip()
    if len(fato) < 6:
        continue
    chave = f"{mes:02d}-{int(dia):02d}|{sem_acento(fato)[:55]}"
    if chave in vistos:
        continue
    vistos.add(chave)
    entradas.append({
        "diaMes": f"{mes:02d}-{int(dia):02d}",
        "ano": ano,
        "titulo": (fato[0].upper() + fato[1:])[:200],
        "resumo": "",
        "tipo": classificar(fato),
        "autor": AUTOR_BLOG,
        "orgao": ORGAO_BLOG,
        "fonteData": data_do_post(post["url"]),
        "url": post["url"],
        "semData": False,
    })

# --- MST (mantém fato sem ano; o dia/mês já veio da âncora) -------------
for e in json.loads((TEMP / "calendario-trabalhadores.json").read_text(encoding="utf-8")):
    frase = limpa(e["frase"])
    if len(frase) < 25:
        continue
    partes = re.split(r"(?<=[.!?])\s+", frase)
    titulo = partes[0][:200].strip()
    resumo = " ".join(partes[1:])[:300].strip()
    chave = f"{e['diaMes']}|{sem_acento(titulo)[:55]}"
    if chave in vistos:
        continue
    vistos.add(chave)
    entradas.append({
        "diaMes": e["diaMes"],
        "ano": e["ano"] or "",
        "titulo": titulo,
        "resumo": resumo,
        "tipo": classificar(frase),
        "autor": AUTOR_MST,
        "orgao": ORGAO_MST,
        "fonteData": DATA_MST,
        "url": "",
        "semData": False,
    })

# --- recheio: fatos sem data preenchem os dias vazios -------------------
cobertos = {e["diaMes"] for e in entradas}
todos_os_dias = [
    f"{m:02d}-{d:02d}"
    for m in range(1, 13)
    for d in range(1, ([31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]) + 1)
]
vazios = [d for d in todos_os_dias if d not in cobertos]
recheio = json.loads((TEMP / "calendario-trabalhadores-recheio.json").read_text(encoding="utf-8"))
# ordem determinística: sha1 do próprio texto — rodar de novo dá o mesmo quadro
recheio.sort(key=lambda r: hashlib.sha1(r["frase"].encode("utf-8")).hexdigest())
usados = 0
indice = 0
for dia in vazios:
    # recheio curto é descartado SEM consumir o dia (senão o dia fica vazio)
    while indice < len(recheio) and len(limpa(recheio[indice]["frase"])) < 40:
        indice += 1
    if indice >= len(recheio):
        break
    frase = limpa(recheio[indice]["frase"])
    indice += 1
    entradas.append({
        "diaMes": dia,
        "ano": "",
        "titulo": frase[:200],
        "resumo": "",
        "tipo": classificar(frase),
        "autor": AUTOR_MST,
        "orgao": ORGAO_MST,
        "fonteData": DATA_MST,
        "url": "",
        "semData": True,
    })
    usados += 1

entradas.sort(key=lambda x: (x["diaMes"], x["ano"] or "9999"))

linhas = [
    "/**",
    ' * Calendário de lutas populares, resistências e revoltas — base da',
    ' * "Mística do Dia" da home (`app/components/MisticaDoDia.tsx`).',
    " *",
    " * ORIGEM DOS DADOS (as duas fontes pedidas pelo dono em 29/09/2026):",
    " * 1. Aos que virão — Calendário Insurgente, de Gustavo Seferian; a data",
    " *    da citação é a data do post (2020).",
    " *    https://aosquevirao.home.blog/category/calendario-insurgente/",
    " * 2. Calendário Histórico dos Trabalhadores e Trabalhadoras, do MST,",
    " *    2009 (org. Ângelo Diogo Mazin, Janaina Strozake e Miguel Enrique",
    " *    Almeida Stádile), documento local do acervo do dono, sem URL.",
    " *",
    " * GERADO POR SCRIPT (`gera-calendario-ts.py`), nunca à mão: são",
    " * centenas de datas e transcrever abriria a porta a erro de data e de",
    " * fonte. O script limpa ruído, classifica o tipo de luta e guarda a",
    " * fonte.",
    " *",
    " * REGRA DO DONO: fato sem dia ou sem ano NÃO se perde. O que tem dia",
    " * entra no dia (com ou sem ano, campo `ano` vazio quando a fonte não",
    " * datou); o que não tem data nenhuma vira `semData: true` e preenche,",
    " * de forma determinística, um dia do ano que ficou sem fato.",
    " *",
    " * FORMATO COMPACTO: a fonte entra por referência (autor, orgao,",
    " * fonteData, url). A citação ABNT completa é montada em runtime por",
    " * `referenciaAbnt()` em `mistica.ts` — repetir a ficha em cada entrada",
    " * inflaria o módulo, que é lido no cliente pela home.",
    " */",
    "",
    'import type { EntradaCalendario } from "./tipos";',
    "",
    "export const CALENDARIO_LUTAS: EntradaCalendario[] = [",
]
for e in entradas:
    linhas.append("  {")
    linhas.append(f'    diaMes: "{e["diaMes"]}",')
    linhas.append(f'    ano: "{escapa(e["ano"])}",')
    linhas.append(f'    titulo: "{escapa(e["titulo"])}",')
    if e["resumo"]:
        linhas.append(f'    resumo: "{escapa(e["resumo"])}",')
    tipos_ts = ", ".join('"' + t + '"' for t in e["tipo"])
    linhas.append(f"    tipo: [{tipos_ts}],")
    linhas.append(f'    autor: "{escapa(e["autor"])}",')
    linhas.append(f'    orgao: "{escapa(e["orgao"])}",')
    linhas.append(f'    fonteData: "{escapa(e["fonteData"])}",')
    if e["url"]:
        linhas.append(f'    url: "{escapa(e["url"])}",')
    if e["semData"]:
        linhas.append("    semData: true,")
    linhas.append("  },")
linhas.append("];")
linhas.append("")

DESTINO.write_text("\n".join(linhas), encoding="utf-8")

com_link = sum(1 for e in entradas if e["url"])
dias = {e["diaMes"] for e in entradas}
print(f"entradas: {len(entradas)} | com link: {com_link} | dias cobertos: {len(dias)}/{len(todos_os_dias)} | recheio usado: {usados}")
print(f"sem ano (mantidos): {sum(1 for e in entradas if not e['ano'])} | semData: {sum(1 for e in entradas if e['semData'])}")
print(f"arquivo: {DESTINO} | {DESTINO.stat().st_size // 1024} KB | {len(linhas)} linhas")
