"""Extrai entradas datadas do "Calendario Historico dos Trabalhadores".

Entrada: o texto cru do .doc (extraido por offset UTF-16LE).
Saida: JSON com {diaMes, ano, paragrafo, frase, vizinho} das entradas
ancoradas em data ("No dia 15 de marco de 1789, ..." / "em 1o de maio
de 1886"). `vizinho` junta as linhas seguintes: e o texto-fonte do
resumo quando o paragrafo proprio nao alcanca duas frases.

Por que assim: o documento do dono e prosa corrida, sem estrutura de
banco. Ancorar em "<dia> de <mes>" e o unico jeito honesto de virar
calendario sem inventar nada - a frase e do documento, nao do agente.
Nao escreve no repositorio.

CORRECAO (30/09/2026, regra do dono): a primeira versao cortava no
primeiro ". " apos 40 caracteres e capava em 300 - o resumo da Mistica
do Dia ficava uma frase solta, cortada no meio, e 297 de 380 entradas
do MST ficavam sem resumo. Agora cada entrada guarda o PARAGRAFO
inteiro da linha (corte de seguranca em 800 chars) e a FRASE que
contem a data (para virar titulo). O resumo sai do paragrafo, no
estilo de escrita da propria fonte.
"""
import json
import re
from pathlib import Path

ORIGEM = Path(r"C:\Users\teste\AppData\Local\Temp\opencode\calendario-trabalhadores.txt")
DESTINO = Path(r"C:\Users\teste\AppData\Local\Temp\opencode\calendario-trabalhadores.json")

MESES = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9,
    "outubro": 10, "novembro": 11, "dezembro": 12,
}
# "no dia 15 de março de 1789" | "1º de maio de 1886" | "em 20 de novembro"
PADRAO = re.compile(
    r"(?:no dia\s+|dia\s+|aos\s+|em\s+|por volta de\s+)?"
    r"(\d{1,2})\s*[ºo°]?\s*de\s+(" + "|".join(MESES) + r")(?:\s+de\s+(\d{3,4}))?",
    re.IGNORECASE,
)
ANO_SOLTO = re.compile(r"\b(1[5-9]\d{2}|20\d{2})\b")
FRASE = re.compile(r"(?<=[.!?])\s+")
# fronteira de topico no txt: referencia cruzada ("Inter 2 1967: ..."),
# cabecalho de data ("4 de janeiro: 1808: ...") e fim de bibliografia
# ("Sao Paulo: Boitempo, 2000.")
CABECALHO = re.compile(r"^(Inter\s+\d|\d{1,2}\s*º?\s*de\s+\w+\s*:)", re.IGNORECASE)
BIBLIO = re.compile(r"[,;]\s*(1[89]\d\d|20\d\d)\.\s*$")
TAM_PARAGRAFO = 800


def limpar(texto: str) -> str:
    return re.sub(r"\s{2,}", " ", texto).strip()


def frase_na_data(linha: str, inicio: int, fim: int) -> str:
    """A sentenca inteira que contem a ancora de data.

    Sem corte de 200: quem trunca em 200 e o gerador, na fronteira de
    palavra - e o resto da frase vira candidato a resumo (antes o corte
    aqui mordia o texto e o resto se perdia).
    """
    ponto = linha.rfind(". ", 0, inicio)
    comeco = ponto + 2 if ponto >= 0 else 0
    fim_sentenca = linha.find(". ", fim)
    fim_sentenca = len(linha) if fim_sentenca < 0 else fim_sentenca + 1
    return limpar(linha[comeco:fim_sentenca])


def linhas_vizinhas(i: int) -> str:
    """As linhas seguintes, juntas, como contexto do resumo.

    O .doc nao tem marcador de paragrafo sobrevivente na extracao (o
    regex da extracao come os \\r), e o txt vem com 0 linhas vazias:
    o corpo de um fato ocupa 1-3 linhas seguidas, e o PROXIMO fato
    comeca sem aviso. Junta ate 3 linhas (ou 300 chars) e para em:
    - "Inter ...": referencia cruzada do proprio documento;
    - "4 de janeiro: 1808:": cabecalho de data de outro verbete;
    - "..., 2000.": linha de bibliografia (ano final com ponto).
    Ainda assim o dono revisa o antes x depois no doc de revisao - o
    vizinho e chute honesto de contexto, nao certeza de topico.
    """
    partes: list[str] = []
    total = 0
    for j in range(i + 1, len(linhas)):
        p = limpar(linhas[j])
        if not p:
            continue
        if CABECALHO.match(p) or BIBLIO.match(p) or len(partes) >= 3:
            break
        partes.append(p)
        total += len(p)
        if total >= 300:
            break
    return " ".join(partes)[:TAM_PARAGRAFO]


linhas = ORIGEM.read_text(encoding="utf-8").splitlines()
entradas = []
vistos = set()
for i, linha in enumerate(linhas):
    linha = limpar(linha)
    if len(linha) < 30 or "WW-" in linha or "Standardschrift" in linha:
        continue
    for m in PADRAO.finditer(linha):
        dia = int(m.group(1))
        if not 1 <= dia <= 31:
            continue
        mes = MESES[m.group(2).lower()]
        ano = m.group(3)
        if not ano:
            # ano mais proximo da data, na propria linha
            janela = linha[max(0, m.start() - 60): m.end() + 120]
            outro = ANO_SOLTO.search(janela)
            ano = outro.group(1) if outro else None
        paragrafo = limpar(linha)[:TAM_PARAGRAFO]
        frase = frase_na_data(linha, m.start(), m.end())
        if len(frase) < 25:
            frase = paragrafo[:200]
        chave = f"{mes:02d}-{dia:02d}|{paragrafo[:60].lower()}"
        if chave in vistos:
            continue
        vistos.add(chave)
        entradas.append({
            "diaMes": f"{mes:02d}-{dia:02d}",
            "ano": ano,
            "paragrafo": paragrafo,
            "frase": frase,
            "vizinho": linhas_vizinhas(i),
        })

entradas.sort(key=lambda e: (e["diaMes"], e["ano"] or ""))
DESTINO.write_text(json.dumps(entradas, ensure_ascii=False, indent=1), encoding="utf-8")

# --- recheio: fatos SEM data no original -------------------------------
# Pedido do dono (29/09/2026): fato sem dia ou sem ano NÃO se perde; ele
# preenche dia vazio de fato no calendário. Aqui só se colhe o texto cru
# desses parágrafos (linhas sem âncora de data); a distribuição pelos dias
# vazios acontece no gerador, de forma determinística.
# 30/09/2026: paragrafo inteiro (antes era so a primeira frase, [:220] -
# o resumo do verbete ficava sem texto-fonte).
rcheio = []
vistos_r = set()
for i, linha in enumerate(linhas):
    linha = limpar(linha)
    if len(linha) < 45 or "WW-" in linha or "Standardschrift" in linha:
        continue
    if PADRAO.search(linha):
        continue  # já tem data: não é recheio
    if len(re.findall(r"[A-Za-zÀ-ÿ]{3,}", linha)) < 6:
        continue
    limpa = re.sub(r"^[^A-Za-zÀ-ÿ0-9\"“]+", "", linha).strip()
    if len(limpa) < 45:
        continue
    # 30/09/2026 (regra do resumo): linha de bibliografia nao e fato -
    # "LABICA, Georges. Sao Paulo: Expressao Popular, 2009." tem 8
    # palavras no total, mas a PRIMEIRA frase tem 2. Linha que comeca
    # minuscula e continuacao de frase anterior (o txt quebra no meio).
    primeira = re.split(r"(?<=[.!?])\s+", limpa)[0]
    if len(primeira.split()) < 6 or primeira[:1].islower():
        continue
    chave = limpa[:60].lower()
    if chave in vistos_r:
        continue
    vistos_r.add(chave)
    rcheio.append({"paragrafo": limpa[:TAM_PARAGRAFO], "vizinho": linhas_vizinhas(i)})

RECHEIO = ORIGEM.with_name("calendario-trabalhadores-recheio.json")
RECHEIO.write_text(json.dumps(rcheio, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"recheio (fatos sem data): {len(rcheio)}", flush=True)
for r in rcheio[:5]:
    print(f"  {r['paragrafo'][:100]}", flush=True)
print(f"entradas: {len(entradas)} | dias distintos: {len({e['diaMes'] for e in entradas})}", flush=True)
for e in entradas[:15]:
    print(f"  {e['diaMes']} ({e['ano']}) {e['frase'][:110]}", flush=True)
