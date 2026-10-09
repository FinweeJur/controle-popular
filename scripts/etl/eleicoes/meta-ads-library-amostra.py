# meta-ads-library-amostra.py — fase 2 do painel de gastos das eleicoes 2026.
#
# O que faz: abre a Biblioteca de Anuncios da Meta (Meta Ads Library) no
# navegador do proprio PC e coleta uma AMOSTRA dos anuncios dos 10 candidatos
# que MAIS receberam de big tech na prestacao de contas ao TSE. Para cada um,
# guarda id da biblioteca, periodo, faixa de valor gasto e impressoes tal como
# a Meta exibe.
#
# Fonte oficial: https://www.facebook.com/ads/library/ (sem API publica no
# Brasil para este recorte; o dono aprovou amostra manual em 09/10/2026).
#
# Decisoes tecnicas e honestidade:
# - AMOSTRA, nao inventario: buscamos por palavra-chave (nome de urna), a
#   pagina1 tem ordenacao padrao da Meta por impressoes; so contamos bloco
#   cujo PATROCINADOR casar com o candidato (a busca keyword traz anuncios de
#   terceiros que citam o nome).
# - Valor gasto vem em FAIXA do proprio site ("R$150 mil a R$175 mil").
#   Jamais convertemos faixa em numero exato.
# - A Meta mostra pagina1 com ~60 blocos; clicamos em todos os "Ver resumo"
#   visiveis para expandir as faixas; o que nao expandiu fica sem faixa e o
#   campo fica ausente (lacuna = informacao, nunca estimativa nossa).
# - Retomada por checkpoint: se derruba no candidato7, a proxima rodada le o
#   JSON parcial e comeca do proximo.
# - Navegador Edge do sistema via Playwright (o binario proprio do Playwright
#   nao esta baixado nesta maquina; armadilha registrada no AGENTS.md).
# - Pausa de 3 s entre candidatos (mesmo host; regra de 1-2 s por host da
#   coleta). User-Agent: navegador real, sem UA falso.
# - Nada de dado pessoal: so nomes de campanha, ids de anuncio publicos e
#   faixas de gasto.
#
# Uso: python scripts/etl/eleicoes/meta-ads-library-amostra.py [--de <urna>] [--refazer]
import json
import os
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone

from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# 4 niveis ate a raiz do monorepo: eleicoes -> etl -> scripts -> raiz
_RAIZ = os.path.abspath(__file__)
for _ in range(4):
    _RAIZ = os.path.dirname(_RAIZ)
RAIZ = _RAIZ
ENTRADA = os.path.join(RAIZ, "apps", "web", "data", "eleicoes", "gastos-2026", "bigtech.json")
SAIDA = os.path.join(RAIZ, "apps", "web", "data", "eleicoes", "gastos-2026", "meta-ads-amostra.json")
URL_BASE = ("https://www.facebook.com/ads/library/"
            "?active_status=all&ad_type=political_and_issue_ads&country=BR"
            "&media_type=all&q={q}&search_type=keyword_unordered")
PAUSA_S = 3
MAX_BLOCOS = 15  # teto por candidato: e amostra, nao inventario
METODO = ("Amostra manual na Meta Ads Library: busca por palavra-chave (nome de "
          "urna), Brasil, anuncios politicos, pagina1 por impressoes; blocos "
          "filtrados pelo patrocinador do candidato; faixas de valor gasto como "
          "a Meta exibe. Nao e inventario completo nem total de gasto.")

RE_PATROCINADOR = re.compile(r"Ver (?:resumo|detalhes do anúncio)\n([^\n]+)\nPatrocinado")
RE_PERIODO_A = re.compile(r"\d{1,2} de \w+ de \d{4} a \d{1,2} de \w+ de \d{4}")
RE_PERIODO_B = re.compile(r"\d{1,2} de \w+ de \d{4} - \d{1,2} de \w+ de \d{4}")
RE_NUM_CRIATIVO = re.compile(r"(\d+) anúncios? usam esse criativo")
RE_GASTO = re.compile(r"Valor gasto \(BRL\):\s*\n?([^\n]+)")
RE_IMPRESSOES = re.compile(r"Impressões:\s*\n?([^\n]+)")
RE_PUBLICO = re.compile(r"Tamanho estimado do público:\s*\n?([^\n]+)")


def sem_acento(texto):
    """Normaliza para comparar nomes sem cuidar de acento/caixa (patrocinador
    da Meta vem em forma propria: 'Celio Studart' vs 'CELIO STUDART...')."""
    return "".join(
        c for c in unicodedata.normalize("NFKD", texto)
        if not unicodedata.combining(c)
    ).casefold().strip()


def casa_patrocinador(pat, candidato):
    """Decide se o patrocinador do anuncio e do proprio candidato.
    Criterio bidirecional por contido: urna (CELIO STUDART) ou nome completo
    (Celio Studart Barbosa) casam com a forma da Meta ('Celio Studart')."""
    p = sem_acento(pat)
    if not p:
        return False
    urna, nome = sem_acento(candidato["urna"]), sem_acento(candidato["nome"])
    return urna in p or p in urna or p in nome or nome in p


def achar(bloco, padrao):
    """Primeiro grupo de captura do padrao no bloco, ja sem espaco nas pontas."""
    m = padrao.search(bloco)
    return m.group(1).strip() if m else None


def achar_periodo(bloco):
    """Periodo exibido: cobre 'a' (intervalo) e '-' (data unica do intervalo)."""
    m = RE_PERIODO_A.search(bloco) or RE_PERIODO_B.search(bloco)
    return m.group(0) if m else None


def parsear_blocos(texto):
    """Fatia o texto visivel da pagina nos blocos de anuncio. Cada bloco comeca
    no id da Biblioteca (marcador estavel da Meta)."""
    return texto.split("Identificação da biblioteca: ")[1:]


def extrair(bloco, candidato):
    """Extrai de um bloco os campos da amostra, ou None se nao e do candidato."""
    pat = achar(bloco, RE_PATROCINADOR) or ""
    if not casa_patrocinador(pat, candidato):
        return None
    numero = achar(bloco, RE_NUM_CRIATIVO)
    return {
        "id": bloco.split("\n", 1)[0].strip(),
        "patrocinador": pat,
        "periodo": achar_periodo(bloco),
        "anunciosMesmoCriativo": int(numero) if numero else 1,
        "faixaGastoBRL": achar(bloco, RE_GASTO),
        "impressoes": achar(bloco, RE_IMPRESSOES),
        "publicoEstimado": achar(bloco, RE_PUBLICO),
    }


def clicar_resumo(pag):
    """Clica no primeiro 'Ver resumo' pendente. False quando nao ha botao (e
    rola para carregar mais) ou quando o clique falha. click(force=True): o
    clique normal estoura timeout quando um cabecalho fixo cobre o botao."""
    botoes = pag.get_by_text("Ver resumo", exact=True)
    if botoes.count() == 0:
        pag.mouse.wheel(0, 1500)
        pag.wait_for_timeout(350)
        return False
    try:
        botoes.first.scroll_into_view_if_needed(timeout=1200)
        botoes.first.click(timeout=1200, force=True)
        pag.wait_for_timeout(300)
        return True
    except Exception:
        pag.mouse.wheel(0, 1200)
        pag.wait_for_timeout(300)
        return False


def expandir_e_capturar(pag, teto=110):
    """Abre as faixas de gasto e captura os blocos acumulando a cada clique.
    A lista carrega sob demanda e a pagina VIRTUALIZA: os cards de baixo saem
    do DOM, entao ler o texto so no fim perde parte deles (medido 09/10/2026).
    Aqui re-lemos o texto a cada clique e guardamos o bloco por id — a ultima
    versao (ja expandida) sobrescreve a primeira. Devolve (blocos, cliques)."""
    vistos, cliques, sem_alvo = {}, 0, 0
    for _ in range(teto):
        clicou = clicar_resumo(pag)
        cliques += 1 if clicou else 0
        sem_alvo = 0 if clicou else sem_alvo + 1
        if sem_alvo >= 3:
            break
        for bloco in parsear_blocos(pag.inner_text("body")):
            vistos[bloco.split("\n", 1)[0].strip()] = bloco
    return list(vistos.values()), cliques


def somar_pagina(bloco, paginas):
    """Conta as paginas patrocinadoras vistas, para a nota de contexto."""
    nome = achar(bloco, RE_PATROCINADOR)
    if nome:
        paginas[nome] = paginas.get(nome, 0) + 1


def identificar(blocos, candidato):
    """Dos blocos vistos, devolve (itens do candidato, paginas, antigos fora).
    Filtra pelo patrocinador e descarta anuncio de outro ano (a busca por nome
    traz historico: o AECIO tem anuncios de 2022/2023)."""
    itens, vistos, paginas, antigos = [], set(), {}, 0
    for bloco in blocos:
        somar_pagina(bloco, paginas)
        item = extrair(bloco, candidato)
        if not item or item["id"] in vistos:
            continue
        periodo = item.get("periodo")
        if periodo and "2026" not in periodo:
            antigos += 1
            continue
        vistos.add(item["id"])
        itens.append(item)
    return itens[:MAX_BLOCOS], paginas, antigos


def montar_nota(itens, paginas, antigos):
    """Nota honesta: registra as paginas que dominam a busca quando o proprio
    candidato tem poucos anuncios (o Lula anuncia pelo 'PT - Partido dos
    Trabalhadores'), e quantos anuncios antigos foram descartados. Nunca soma
    os anuncios de terceiros ao candidato."""
    nota = None
    if len(itens) < 3:
        principais = sorted(paginas.items(), key=lambda kv: -kv[1])[:3]
        nota = ("A busca deste nome e dominada por outras paginas: "
                + "; ".join(f"{p} ({n})" for p, n in principais) + ".")
    if antigos:
        extra = f"{antigos} anuncio(s) de anos anteriores foram descartados."
        nota = (nota + " " + extra) if nota else extra
    return nota


def coletar_candidato(pag, candidato, de_onde):
    """Abre a busca de 1 candidato, expande os resumos e devolve a amostra."""
    url = URL_BASE.format(q=candidato["urna"].replace(" ", "%20"))
    pag.goto(url, timeout=60000, wait_until="domcontentloaded")
    pag.wait_for_timeout(7000)
    blocos, cliques = expandir_e_capturar(pag)
    itens, paginas, antigos = identificar(blocos, candidato)
    print(f"  {candidato['urna']}: {len(blocos)} blocos vistos, "
          f"{len(itens)} do candidato (de {de_onde}; {cliques} resumos abertos; "
          f"{antigos} antigos fora)")
    return itens, montar_nota(itens, paginas, antigos)


def montar_base():
    """Estrutura do JSON de saida, com o metodo e a fonte ja embutidos."""
    return {
        "geradoEm": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "metodo": METODO,
        "fonte": "https://www.facebook.com/ads/library/",
        "candidatos": [],
    }


def carregar_checkpoint(dados, refazer):
    """Reaproveita o que a rodada anterior ja coletou (retomada por checkpoint),
    a menos que --refazer peca coleta do zero."""
    if refazer or not os.path.exists(SAIDA):
        return
    try:
        with open(SAIDA, encoding="utf-8") as f:
            velho = json.load(f)
        dados["candidatos"] = [c for c in velho.get("candidatos", []) if "anuncios" in c]
    except Exception:
        pass


def selecionar_pendentes(top, dados, de_onde):
    """Candidatos do top10 que ainda nao tem amostra nesta rodada."""
    ja_tem = {c.get("urna") for c in dados["candidatos"]}
    pendentes = [c for c in top if c["urna"] not in ja_tem]
    if de_onde:
        pendentes = [c for c in pendentes if c["urna"] == de_onde]
    return pendentes


def montar_registro(c, itens, nota):
    """Registro do candidato no JSON (a nota so entra se existir)."""
    registro = {
        "urna": c["urna"], "nome": c["nome"], "cargo": c["cargo"],
        "uf": c["uf"], "partido": c["partido"], "bigtechTSE": c["bigtech"],
        "anuncios": itens,
    }
    if nota:
        registro["nota"] = nota
    return registro


def salvar(dados):
    """Grava o JSON a cada candidato: e o checkpoint da retomada."""
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=1)


def ler_arg(nome):
    """Valor do argumento de linha de comando, em maiuscula."""
    return sys.argv[sys.argv.index(nome) + 1].upper() if nome in sys.argv else None


def main():
    with open(ENTRADA, encoding="utf-8") as f:
        top = json.load(f)["topCandidatos"][:10]
    dados = montar_base()
    carregar_checkpoint(dados, "--refazer" in sys.argv)
    pendentes = selecionar_pendentes(top, dados, ler_arg("--de"))
    print(f"candidatos no top10: {len(top)} | pendentes: {len(pendentes)}")

    with sync_playwright() as p:
        nav = p.chromium.launch(channel="msedge", headless=True)
        pag = nav.new_page(viewport={"width": 1366, "height": 2400})
        for i, c in enumerate(pendentes, 1):
            try:
                itens, nota = coletar_candidato(pag, c, f"{i}/{len(pendentes)}")
            except Exception as erro:
                print(f"  ERRO em {c['urna']}: {erro}")
                itens, nota = [], None
            dados["candidatos"].append(montar_registro(c, itens, nota))
            salvar(dados)
            time.sleep(PAUSA_S)
        nav.close()
    print("saida:", SAIDA)


if __name__ == "__main__":
    main()
