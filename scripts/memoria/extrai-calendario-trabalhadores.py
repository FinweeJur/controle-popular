"""Extrai entradas datadas do "Calendario Historico dos Trabalhadores".

Entrada: o texto cru do .doc (extraido por offset UTF-16LE).
Saida: JSON com {diaMes, ano, frase} das frases ancoradas em data
("No dia 15 de marco de 1789, ..." / "em 1o de maio de 1886").

Por que assim: o documento do dono e prosa corrida, sem estrutura de
banco. Ancorar em "<dia> de <mes>" e o unico jeito honesto de virar
calendario sem inventar nada - a frase e do documento, nao do agente.
Nao escreve no repositorio.
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

linhas = ORIGEM.read_text(encoding="utf-8").splitlines()
entradas = []
vistos = set()
for linha in linhas:
    linha = linha.strip()
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
        # frase: recorte da linha em volta da data, cortado em pontuacao
        inicio = max(0, m.start() - 40)
        trecho = linha[inicio: m.end() + 260]
        trecho = re.sub(r"\s{2,}", " ", trecho).strip()
        corte = trecho.find(". ", 40)
        if corte > 0:
            trecho = trecho[: corte + 1]
        chave = f"{mes:02d}-{dia:02d}|{trecho[:50].lower()}"
        if chave in vistos:
            continue
        vistos.add(chave)
        entradas.append({
            "diaMes": f"{mes:02d}-{dia:02d}",
            "ano": ano,
            "frase": trecho[:300],
        })

entradas.sort(key=lambda e: (e["diaMes"], e["ano"] or ""))
DESTINO.write_text(json.dumps(entradas, ensure_ascii=False, indent=1), encoding="utf-8")

# --- recheio: fatos SEM data no original -------------------------------
# Pedido do dono (29/09/2026): fato sem dia ou sem ano NÃO se perde; ele
# preenche dia vazio de fato no calendário. Aqui só se colhe o texto cru
# desses parágrafos (linhas sem âncora de data); a distribuição pelos dias
# vazios acontece no gerador, de forma determinística.
rcheio = []
vistos_r = set()
for linha in linhas:
    linha = linha.strip()
    if len(linha) < 45 or "WW-" in linha or "Standardschrift" in linha:
        continue
    if PADRAO.search(linha):
        continue  # já tem data: não é recheio
    if len(re.findall(r"[A-Za-zÀ-ÿ]{3,}", linha)) < 6:
        continue
    limpa = re.sub(r"^[^A-Za-zÀ-ÿ0-9\"“]+", "", re.sub(r"\s{2,}", " ", linha)).strip()
    if len(limpa) < 45:
        continue
    chave = limpa[:60].lower()
    if chave in vistos_r:
        continue
    vistos_r.add(chave)
    frase = re.split(r"(?<=[.!?])\s+", limpa)[0][:220]
    rcheio.append({"frase": frase})

RECHEIO = ORIGEM.with_name("calendario-trabalhadores-recheio.json")
RECHEIO.write_text(json.dumps(rcheio, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"recheio (fatos sem data): {len(rcheio)}", flush=True)
for r in rcheio[:5]:
    print(f"  {r['frase'][:100]}", flush=True)
print(f"entradas: {len(entradas)} | dias distintos: {len({e['diaMes'] for e in entradas})}", flush=True)
for e in entradas[:15]:
    print(f"  {e['diaMes']} ({e['ano']}) {e['frase'][:110]}", flush=True)
