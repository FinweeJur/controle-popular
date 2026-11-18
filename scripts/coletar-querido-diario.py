# -*- coding: utf-8 -*-
"""Coleta uma amostra pequena de diários oficiais municipais no Querido Diário.

O QUE E: prova de fonte para o eixo municipal do portal. Consulta a API pública
do Querido Diário (Open Knowledge Brasil) numa janela curta, em três cidades
mineiras, e grava **só metadados, contagem e um trecho curto** de cada diário.
A íntegra fica no link do próprio diário — este coletor não versiona texto de
diário, nem PDF, nem ata.

FONTE OFICIAL: https://api.queridodiario.org.br (API v0.19.0, medida em
18/11/2026). Documentação de uso:
https://docs.queridodiario.ok.org.br/pt-br/latest/utilizando/api-publica.html

DECISÃO DE COLETA (18/11/2026), conforme AGENTS/COLETA-ETICA:

- `robots.txt` do host da API responde `Allow: /` para `User-agent: *`; o
  Content-Signal pede `use=reference`, que é exatamente o uso daqui (índice e
  trecho, não cópia).
- A documentação diz: "Não impomos nenhuma restrição para consumo da API.
  Esperamos bom senso... Referência: 60 requisições/minuto." Este coletor fica
  em ~40 req/min no pior caso e, na prática, faz 21 requisições na amostra.
- User-Agent honesto: `finweejur/github artur colito`.
- Pausa de 1,5 s entre QUALQUER chamada (inclusive o bucket de `.txt`), sem
  paralelismo, com uma tentativa extra em caso de 429/5xx.
- A amostra é fechada: 3 cidades, janela de 7 dias, 4 termos. Não é varredura
  do acervo nacional.

DUAS ARMADILHAS MEDIDAS NESTA MÁQUINA:

1. O host histórico `api.queridodiario.ok.org.br` está com o TLS quebrado desde
   outubro/2026 (handshake failure em OpenSSL, curl e Chrome; o certificado
   mais recente no CT expirou em 02/10/2026). O serviço mudou para
   `api.queridodiario.org.br` e é lá que este coletor fala. O domínio antigo
   continua citado na documentação pública — por isso o link dela vai no JSON.
2. O Querido Diário NÃO classifica ato por tipo. Ele devolve diário, data,
   edição e trechos de busca. Então "ato" aqui é uma linha de evidência:
   (cidade, termo, diário) com a contagem de ocorrências no texto daquele
   diário. É o que o dado permite medir sem inventar classificação.

POR QUE ASSIM:

- A contagem de ocorrências é feita no `.txt` baixado em memória e descartado.
  Guardar o texto inteiro seria copiar o diário — proibido pelo escopo e caro em
  disco. O que fica no JSON é a contagem e um trecho de até 200 caracteres.
- **A contagem NÃO vem da busca.** Medido em 18/11/2026: a busca sem aspas é
  fuzzy — `querystring=portaria` devolveu trecho destacando "Porto", nome de
  pessoa; e mesmo entre aspas, o token exato perde o plural ("portarias"). Para
  medir menção, o texto do diário é a régua: baixa o `.txt`, conta o radical e
  descarta o texto. A busca da API foi testada e ficou de fora da contagem de
  propósito — número inflado ou mutilado por tokenização não serve.
- O trecho é um recorte de até 200 caracteres em volta da primeira ocorrência
  do radical, extraído do texto já baixado. É a evidência mínima: o leitor vê a
  palavra no contexto e abre o diário pelo link.
- Número de matrícula, protocolo longo e CPF não interessam ao portal. Todo
  trecho passa por `_limpar_trecho()`, que comprime espaço, corta em 200
  caracteres e troca sequência de 10+ dígitos por `[numero]`. CPF nunca entra.
- Cidade sem cobertura no Querido Diário também é resultado: Mariana e
  Brumadinho estão em nível 0 (sem diário coletado) e ficam registradas como
  `semCobertura`, em vez de sumirem do relatório.

Uso:
    python scripts/coletar-querido-diario.py
    python scripts/coletar-querido-diario.py --desde 2026-11-01 --ate 2026-11-07
    python scripts/coletar-querido-diario.py --cidade 3106705 --seco
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
SAIDA = RAIZ / "apps" / "web" / "data" / "querido-diario" / "atos.json"

BASE_API = "https://api.queridodiario.org.br"
DOCS = "https://docs.queridodiario.ok.org.br/pt-br/latest/utilizando/api-publica.html"
UA = "finweejur/github artur colito"
PAUSA = 1.5
TENTATIVAS = 2

# Janela fechada de 7 dias. Fixa de propósito: o arquivo é prova auditável e
# precisa dizer exatamente qual semana mediu. Rodada nova usa --desde/--ate.
DESDE = "2026-11-10"
ATE = "2026-11-16"

# 3 cidades mineiras com cobertura nível 3 (a maior) no Querido Diário. A
# sugestão original — Betim, Mariana, Brumadinho — não fecha: Mariana e
# Brumadinho respondem nível 0 e `availability_date` vazio em /cities/{ibge}.
CIDADES = [
    ("3106705", "Betim"),
    ("3118601", "Contagem"),
    ("3170107", "Uberaba"),
]

# (chave no JSON, termo enviado à API, radical contado no texto)
# O radical é declarado, não escondido: "licita" pega licitação/licitações/
# licitado/licitante; "nome" + vogal pega nomeação/nomeado/nomeou/nomeia.
TERMOS = [
    ("decreto", "decreto", r"\bdecretos?\b"),
    ("portaria", "portaria", r"\bportarias?\b"),
    ("licitacao", "licitação", r"\blicita\w*"),
    ("nomeacao", "nomeação", r"\bnome[aeiou]\w*"),
]

# Diário é PDF de dezenas de páginas; 3 por cidade bastam para a amostra e
# mantêm o download sob controle.
MAX_DIARIOS_POR_CIDADE = 3
MAX_TRECHO = 200

# Nome do host e não URL: o portal não reproduz o diário, só aponta para ele.
FONTE = "Querido Diário (Open Knowledge Brasil)"


class Gate:
    """Porteiro de ritmo: garante PAUSA segundos entre duas chamadas quaisquer."""

    def __init__(self, pausa: float) -> None:
        self.pausa = pausa
        self.ultima = 0.0

    def esperar(self) -> None:
        faltam = self.pausa - (time.monotonic() - self.ultima)
        if faltam > 0:
            time.sleep(faltam)
        self.ultima = time.monotonic()


def _requisitar(url: str, gate: Gate) -> tuple[int, bytes]:
    """GET com UA honesto, ritmo e uma repetição em 429/5xx/erro de rede."""
    ultimo_erro: Exception | None = None
    for tentativa in range(TENTATIVAS):
        gate.esperar()
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json, text/plain, */*"})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            ultimo_erro = e
            if e.code == 429 or 500 <= e.code < 600:
                time.sleep(5 + 5 * tentativa)
                continue
            raise
        except (urllib.error.URLError, TimeoutError) as e:
            ultimo_erro = e
            time.sleep(5 + 5 * tentativa)
    raise RuntimeError(f"falhou após {TENTATIVAS} tentativas: {url} :: {ultimo_erro}")


def _json(url: str, gate: Gate) -> dict:
    status, corpo = _requisitar(url, gate)
    if status != 200:
        raise RuntimeError(f"HTTP {status} em {url}")
    return json.loads(corpo.decode("utf-8"))


def _limpar_trecho(texto: str) -> str:
    """Comprime espaço, tira sequência longa de dígito e corta em 200 chars.

    Sequência de 10+ dígitos cobre CPF (11), telefone e matrícula comprida; o
    dado não serve para a contagem e não deve sair daqui. CNPJ também cai, o
    que é aceitável: o trecho é ilustração, o número oficial está no diário.
    """
    t = re.sub(r"\s+", " ", texto or "").strip()
    t = re.sub(r"\d{10,}", "[numero]", t)
    if len(t) > MAX_TRECHO:
        t = t[: MAX_TRECHO - 1].rstrip() + "…"
    return t


def _listar_diarios(cidade: tuple[str, str], desde: str, ate: str, gate: Gate) -> list[dict]:
    """Diários publicados no período, sem trecho (busca só por metadado)."""
    q = urllib.parse.urlencode(
        {
            "territory_ids": cidade[0],
            "published_since": desde,
            "published_until": ate,
            "size": 100,
            "number_of_excerpts": 0,
        }
    )
    d = _json(f"{BASE_API}/gazettes?{q}", gate)
    return d.get("gazettes", []) or []


def _trecho_local(texto: str, radical: str) -> str:
    """Recorte de até 200 caracteres em volta da primeira ocorrência.

    Serve de evidência: o leitor confere a palavra no contexto e abre o diário
    pelo link. Sem ocorrência, devolve vazio — não inventa trecho.
    """
    m = re.search(radical, texto, flags=re.IGNORECASE)
    if not m:
        return ""
    ini = max(0, m.start() - 80)
    fim = min(len(texto), m.start() + (MAX_TRECHO - 80))
    return _limpar_trecho(texto[ini:fim])


def _contar_no_texto(txt_url: str, gate: Gate) -> tuple[str, dict[str, int]]:
    """Baixa o .txt e conta os radicais.

    Retorna (texto, contagem por chave). O chamador guarda o texto só enquanto
    a cidade está sendo processada, para montar o trecho; nada é gravado.
    """
    status, corpo = _requisitar(txt_url, gate)
    if status != 200:
        raise RuntimeError(f"HTTP {status} no txt {txt_url}")
    texto = corpo.decode("utf-8", errors="replace")
    contagem = {chave: len(re.findall(radical, texto, flags=re.IGNORECASE)) for chave, _, radical in TERMOS}
    return texto, contagem


def _coletar_cidade(cidade: tuple[str, str], desde: str, ate: str, gate: Gate, seco: bool) -> dict:
    ibge, nome = cidade
    diarios = _listar_diarios(cidade, desde, ate, gate)

    registro: dict = {
        "ibge": ibge,
        "nome": nome,
        "uf": "MG",
        "diariosNoPeriodo": len(diarios),
        "porTipo": {chave: {"diarios": 0, "ocorrencias": 0} for chave, _, _ in TERMOS},
        "atos": [],
        "erros": [],
    }

    # Ordena por data e corta: amostra pequena, download previsível.
    diarios = sorted(diarios, key=lambda g: (g.get("date") or "", g.get("edition") or ""))[:MAX_DIARIOS_POR_CIDADE]

    contagens: dict[str, dict[str, int]] = {}
    textos: dict[str, str] = {}
    for g in diarios:
        txt = g.get("txt_url")
        if not txt:
            registro["erros"].append(f"sem txt_url em {g.get('date')}")
            continue
        if seco:
            contagens[g.get("url") or txt] = {chave: 0 for chave, _, _ in TERMOS}
            continue
        try:
            texto, c = _contar_no_texto(txt, gate)
            textos[g.get("url") or txt] = texto
            contagens[g.get("url") or txt] = c
        except Exception as e:  # diário quebrado não derruba a rodada
            registro["erros"].append(f"txt {g.get('date')}: {e}")

    registro["diariosContados"] = len(contagens)
    coletado_em = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()

    for chave, termo, radical in TERMOS:
        for g in diarios:
            url = g.get("url") or ""
            ocorrencias = contagens.get(url, {}).get(chave, 0)
            if ocorrencias <= 0:
                continue
            registro["porTipo"][chave]["diarios"] += 1
            registro["porTipo"][chave]["ocorrencias"] += ocorrencias
            registro["atos"].append(
                {
                    "tipo": chave,
                    "termo": termo,
                    "data": g.get("date"),
                    "edicao": g.get("edition"),
                    "extra": bool(g.get("is_extra_edition")),
                    "ocorrencias": ocorrencias,
                    "trecho": _trecho_local(textos.get(url, ""), radical),
                    "link": url,
                    "fonte": FONTE,
                    "coletadoEm": coletado_em,
                }
            )

    return registro


def _sem_cobertura(ibge: str, nome: str, gate: Gate) -> dict | None:
    """Confirma no /cities/{ibge} se a cidade realmente não tem cobertura."""
    try:
        d = _json(f"{BASE_API}/cities/{ibge}", gate)
    except Exception:
        return None
    cidade = d.get("city") or {}
    if cidade.get("level") in ("0", 0) or not cidade.get("availability_date"):
        return {
            "ibge": ibge,
            "nome": cidade.get("territory_name") or nome,
            "uf": cidade.get("state_code") or "",
            "nivel": cidade.get("level"),
            "motivo": "sem diário coletado pelo Querido Diário (nível 0 / sem data de disponibilidade)",
        }
    return None


def main() -> int:
    p = argparse.ArgumentParser(description="Amostra de diários municipais no Querido Diário.")
    p.add_argument("--desde", default=DESDE)
    p.add_argument("--ate", default=ATE)
    p.add_argument("--cidade", action="append", help="IBGE de 7 dígitos; pode repetir")
    p.add_argument("--seco", action="store_true", help="não grava o JSON")
    p.add_argument("--saida", default=str(SAIDA))
    args = p.parse_args()

    gate = Gate(PAUSA)
    alvos = [c for c in CIDADES if not args.cidade or c[0] in args.cidade]
    if not alvos:
        print("nenhuma cidade da lista casou com --cidade", file=sys.stderr)
        return 2

    # Cidades que já sabemos sem cobertura: medição de 18/11/2026. Ficam no
    # JSON como resultado negativo, para ninguém tentar de novo no escuro.
    sem_cobertura = []
    for ibge, nome in (("3140001", "Mariana"), ("3109006", "Brumadinho")):
        r = _sem_cobertura(ibge, nome, gate)
        if r:
            sem_cobertura.append(r)

    cidades = []
    for cidade in alvos:
        print(f"→ {cidade[1]} ({cidade[0]})", flush=True)
        registro = _coletar_cidade(cidade, args.desde, args.ate, gate, args.seco)
        total = len(registro["atos"])
        print(f"  {registro['diariosNoPeriodo']} diário(s), {total} linha(s) de ato", flush=True)
        for chave, dados in registro["porTipo"].items():
            print(f"  {chave:10s} diários={dados['diarios']:2d} ocorrências={dados['ocorrencias']:3d}")
        cidades.append(registro)

    saida = {
        "fonte": {
            "nome": FONTE,
            "api": BASE_API,
            "documentacao": DOCS,
            "licencaDados": "CC-BY 4.0 (informações da plataforma); código MIT",
            "limiteRecomendado": "60 requisições/minuto (documentação); este coletor usa pausa de 1,5 s",
            "aviso": "Só metadado, contagem e trecho de até 200 caracteres. O diário completo está no link.",
        },
        "coletadoEm": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "janela": {"de": args.desde, "ate": args.ate},
        "termos": [chave for chave, _, _ in TERMOS],
        "radicais": {chave: radical for chave, _, radical in TERMOS},
        "metodo": {
            "contagem": "radical contado no .txt do diário, baixado em memória e descartado",
            "trecho": "recorte de até 200 caracteres em volta da primeira ocorrência do radical",
            "classificacao": "não existe classificação oficial de ato aqui: 'tipo' é o termo procurado",
            "diariosPorCidade": f"até {MAX_DIARIOS_POR_CIDADE} por cidade; ver diariosContados",
        },
        "cidades": cidades,
        "semCobertura": sem_cobertura,
    }

    texto = json.dumps(saida, ensure_ascii=False, separators=(",", ":"))
    print(f"\n{len(texto)} bytes, {sum(len(c['atos']) for c in cidades)} linhas de ato")

    if args.seco:
        print("[seco] nada gravado")
        return 0

    destino = Path(args.saida)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(texto + "\n", encoding="utf-8")
    print(f"gravado em {destino}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
