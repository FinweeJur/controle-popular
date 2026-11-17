"""coletar-semas-pa-estudos.py — audiências públicas, EIA e RIMA do Pará (SEMAS-PA).

Fonte oficial: Portal da Transparência Ambiental da SEMAS-PA, API pública da SPA
Angular (sem login, sem token, sem CAPTCHA):

    https://portaldatransparencia.semas.pa.gov.br/portal-da-transparencia-api/api/v1/documentos?id_tipo_arquivo={id}&page={n}
    https://portaldatransparencia.semas.pa.gov.br/portal-da-transparencia-api/api/v1/documentos/download/{id}

Medido em 17/11/2026 (sondagem registrada em
docs/historico/descobertas/ambiental-PA-eia-rima.md, ~70 requisições):

- universo do endpoint sem filtro: 5.128 documentos, 257 páginas de 20;
- audiência pública: 25 documentos (127,5 MB de PDF), 2019–2026, todos com
  município, empreendimento, tipologia e `data_audiencia`;
- RIMA (Relatório de Impactos Ambientais): 78 documentos (~2,0 GiB de PDF);
- EIA (Estudos de Impacto Ambiental): 72 documentos (~2,2 GiB de PDF).

Por que API e não HTML: o site institucional (`www.semas.pa.gov.br`) não tem
página de audiências (busca interna devolve a home; sitemap 404; 0 ocorrência
de "audi" em Editais/Serviços/Sistemas). A lista só existe nesta API.

Por que o `id_tipo_arquivo` NÃO é fixado em 3/5/6: é número interno do banco da
SEMAS e pode ser renumerado sem aviso. O coletor confere o NOME do tipo que vem
dentro de cada item (`tipo_arquivo.nome`/`descricao`) contra o esperado e, se o
número não bater, procura o id certo numa varredura curta (1..120) antes de
gravar. Se não achar, aborta — nunca grava dado de outro tipo.

Por que não baixar os PDFs: EIA + RIMA somam ~4,5 GiB. A linha traz a URL de
download e o tamanho; o PDF é validado por amostra (1 por tipo, magic `%PDF-`)
para provar que a rota serve arquivo, não página de erro.

Rodar:
    python scripts/coletar-semas-pa-estudos.py --dry-run    # só contagens
    python scripts/coletar-semas-pa-estudos.py              # grava o JSON
    python scripts/coletar-semas-pa-estudos.py --scan-cpf   # + varredor de CPF

## Ética e privacidade

- User-Agent honesto `finweejur/github artur colito`, pausa de 2 s entre
  requisições (o host anuncia `x-ratelimit-limit: 60`; o ritmo usado na
  sondagem foi 1,5 s e nunca tomou 403/429). 403/429 = aborta na hora: não
  insiste, não roda disfarçado.
- `robots.txt` de todos os subdomínios SEMAS: `Allow: /`; `Content-Signal:
  ai-train=no, use=reference` — uso aqui é referência/documentação, não treino.
- `cpf_cnpj` é preservado quando tem 14 dígitos (CNPJ, pessoa jurídica). Run de
  11 dígitos válido por mod-11 vira `null` e a linha ganha `doc_redigido: 1`;
  todo campo de texto passa pelo mesmo varredor.

## Ressalva editorial

Audiência publicada NÃO é licença concedida: a ata registra que houve
audiência, e o licenciamento segue o rito próprio (o portal não publica
`numero_processo` nem `numero_licenca`). EIA/RIMA publicados são estudo
apresentado, não aprovação. Vínculo audiência ↔ EIA/RIMA só por CNPJ +
município + tipologia (heurística), nunca por chave — este coletor não inventa
esse vínculo.
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
from datetime import datetime, timezone
from pathlib import Path

UA = "finweejur/github artur colito"
API = "https://portaldatransparencia.semas.pa.gov.br/portal-da-transparencia-api/api/v1"
URL_DOC = API + "/documentos"
URL_PDF = API + "/documentos/download/{id}"
PORTAL_HUMANO = "https://portaldatransparencia.semas.pa.gov.br/#/visao-publica"
PAUSA = 2  # s entre QUALQUER par de requisições ao host (regra do repo: 1–2 s)
SONDA_MAX = 120  # teto da varredura de id quando o número do tipo mudar
SAIDA = (Path(__file__).resolve().parent.parent
         / "apps" / "web" / "data" / "semas-pa-estudos.json")

FONTES = {
    "api_documentos": URL_DOC,
    "pdf": URL_PDF,
    "interface_humana": PORTAL_HUMANO,
    "robots": "Allow: / + Content-Signal ai-train=no, use=reference (17/11/2026)",
    "medicao": "17/11/2026 — 25 audiências, 78 RIMA, 72 EIA; universo de 5.128 documentos",
}

RESSALVA = ("Audiência publicada NÃO é licença concedida e EIA/RIMA publicado "
            "NÃO é aprovação: a ata só registra que houve audiência, e o rito "
            "de licenciamento segue em separado (o portal não publica número "
            "de processo nem de licença). Vínculo audiência↔estudo não é "
            "publicado pela fonte. Consulta oficial: " + PORTAL_HUMANO)

COLUNAS = ["id", "tipo", "ano", "data_audiencia", "empreendimento", "cnpj",
           "municipio", "uf", "tipologia", "atividade", "codigo_atividade",
           "arquivo", "tamanho_bytes", "url_pdf", "portal"]

# Cada tipo esperado: o que o nome/descrição do `tipo_arquivo` tem de dizer e o
# id medido em 17/11/2026 (usado só como ponto de partida, nunca como verdade).
TIPOS = [
    {"chave": "audiencia", "ids": (3,),
     "nome": "Relatórios", "descricao": "Audiência Pública",
     "exige": ("AUDIENCIA",)},
    {"chave": "rima", "ids": (5,),
     "nome": "Relatório de Impactos Ambientais", "descricao": None,
     "exige": ("RELATORIO", "IMPACTO")},
    {"chave": "eia", "ids": (6,),
     "nome": "Estudos de Impacto Ambiental", "descricao": None,
     "exige": ("ESTUDO", "IMPACTO")},
]

_BYTES_LIDOS = 0  # o que de fato trafegou, para relatar honestamente


class BloqueioFonte(RuntimeError):
    """403/429 da fonte: parar, não insistir."""


try:
    import truststore
    _CTX = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
except Exception:
    _CTX = ssl.create_default_context()


def _norm(t) -> str:
    t = unicodedata.normalize("NFKD", str(t or ""))
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", t).upper().strip()


def _http(url: str, timeout: int = 120) -> bytes:
    """GET com UA honesto e pausa. Status 200 com corpo vazio NÃO é sucesso."""
    global _BYTES_LIDOS
    time.sleep(PAUSA)
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, context=_CTX, timeout=timeout) as resp:
            bruto = resp.read()
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            raise BloqueioFonte(
                f"HTTP {e.code} em {url} — pare aqui, não insista") from e
        raise
    _BYTES_LIDOS += len(bruto)
    if not bruto:
        raise RuntimeError(f"HTTP 200 com corpo de 0 byte em {url}")
    return bruto


def _json(url: str) -> dict:
    d = json.loads(_http(url).decode("utf-8"))
    if not isinstance(d, dict) or "data" not in d:
        raise RuntimeError(f"resposta sem `data` em {url}")
    return d


# ---------------------------------------------------------------------------
# sanitização: CNPJ preservado, CPF redigido (mesmo padrão do coletor de licenças)
# ---------------------------------------------------------------------------

RE_11D = re.compile(r"\d[\d .\-/]{7,24}\d")


def _cpf_valido(dig: str) -> bool:
    """Mod-11 com os pesos 10..2 (o mesmo critério de
    `scripts/checar-dado-pessoal-em-dado.py`). Múltiplos de 11 iguais não valem."""
    if not dig.isdigit() or len(dig) != 11 or len(set(dig)) == 1:
        return False
    for ate in (9, 10):
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        if (0 if resto == 10 else resto) != int(dig[ate]):
            return False
    return True


def _apagar_cpf_em_texto(texto: str) -> str:
    """11 dígitos mod-11 válidos -> '[CPF redigido]'; 14 dígitos (CNPJ) intacto."""
    def _apagar(m):
        s = m.group(0)
        dig = re.sub(r"\D", "", s)
        if len(dig) == 14:
            return s
        if len(dig) == 11:
            return "[CPF redigido]" if _cpf_valido(dig) else s
        if len(dig) in (12, 13) and any(
                _cpf_valido(dig[i:i + 11]) for i in range(len(dig) - 10)):
            return "[CPF redigido]"
        return s
    return RE_11D.sub(_apagar, texto)


def _cnpj_ou_redigido(doc):
    """(cnpj|None, redigido). 14 dígitos = CNPJ, preservado; resto com dígito = CPF."""
    if not doc:
        return None, False
    dig = re.sub(r"\D", "", str(doc))
    if len(dig) == 14:
        return dig, False
    return (None, True) if dig else (None, False)


def _limpar(v):
    if v is None:
        return None
    s = str(v).strip()
    return s if s and s.lower() not in ("nan", "none") else None


# ---------------------------------------------------------------------------
# conferência do tipo (id interno pode ser renumerado)
# ---------------------------------------------------------------------------

def _tipo_confere(tipo_arquivo: dict, esperado: dict) -> bool:
    """O `tipo_arquivo` do item é o que a gente pediu?

    O nome tem de conter TODAS as palavras de `exige`. Para "Relatórios" (nome
    genérico, onde a audiência vive dentro), também se exige que a `descricao`
    fale de audiência: 78 relatórios de outro assunto moram no mesmo id se a
    SEMAS renumerar.
    """
    nome = _norm((tipo_arquivo or {}).get("nome"))
    desc = _norm((tipo_arquivo or {}).get("descricao"))
    if not all(p in nome or p in desc for p in esperado["exige"]):
        return False
    if esperado["chave"] == "audiencia":
        return "AUDIENCIA" in desc or "AUDIENCIA" in nome
    if esperado["chave"] == "eia":  # "Estudos de Impacto Ambiental", não o RIMA
        return "RELATORIO" not in nome
    return True


def _primeira_pagina(id_tipo: int) -> dict:
    return _json(f"{URL_DOC}?id_tipo_arquivo={id_tipo}&page=1")


def _resolver_id(esperado: dict, ja_usados: dict) -> int:
    """Id cujo `tipo_arquivo` casa com o esperado; erro claro se não achar."""
    tentativas = list(esperado["ids"]) + [i for i in range(1, SONDA_MAX + 1)]
    vistos = set()
    for id_tipo in tentativas:
        if id_tipo in vistos or id_tipo in ja_usados:
            continue
        vistos.add(id_tipo)
        d = _primeira_pagina(id_tipo)
        itens = d.get("data") or []
        if not itens:
            continue
        if _tipo_confere(itens[0].get("tipo_arquivo"), esperado):
            if id_tipo not in esperado["ids"]:
                print(f"  [!] tipo '{esperado['chave']}' renumera: "
                      f"{esperado['ids']} -> {id_tipo} (conferido pelo nome)")
            return id_tipo
    raise RuntimeError(
        f"tipo '{esperado['chave']}' ({esperado['nome']}) não encontrado em "
        f"id_tipo_arquivo 1..{SONDA_MAX} — a fonte mudou de nome; não gravo "
        f"nada até alguém reconferir a sondagem")


# ---------------------------------------------------------------------------
# paginação
# ---------------------------------------------------------------------------

def _coletar_tipo(id_tipo: int, esperado: dict) -> "tuple[list[dict], int, bool]":
    """Anda todas as páginas do tipo; dedup por `id`. (itens, total, concluiu)."""
    itens: list[dict] = []
    vistos: set[int] = set()
    total = 0
    pagina = 1
    concluiu = False
    while True:
        d = _primeira_pagina(id_tipo) if pagina == 1 else _json(
            f"{URL_DOC}?id_tipo_arquivo={id_tipo}&page={pagina}")
        total = int(d.get("total") or 0)
        ultima = int(d.get("last_page") or 1)
        lote = d.get("data") or []
        if not lote:
            # página vazia com total>0 é a fonte falhando, não fim de lista
            print(f"  [!] {esperado['chave']}: página {pagina} veio vazia "
                  f"(total {total}) — para aqui")
            break
        estranhos = [x for x in lote
                     if not _tipo_confere(x.get("tipo_arquivo"), esperado)]
        if estranhos:
            raise RuntimeError(
                f"id_tipo_arquivo={id_tipo} devolveu {len(estranhos)} item(ns) de "
                f"outro tipo na página {pagina} — abortando para não gravar "
                f"dado trocado")
        for x in lote:
            if x.get("id") in vistos:
                continue
            vistos.add(x.get("id"))
            itens.append(x)
        print(f"    {esperado['chave']} pág {pagina}/{ultima}: "
              f"{len(itens)}/{total}", flush=True)
        if pagina >= ultima:
            concluiu = True
            break
        pagina += 1
    return itens, total, concluiu


# ---------------------------------------------------------------------------
# item -> linha
# ---------------------------------------------------------------------------

def _linha(item: dict, chave: str) -> dict:
    muni = item.get("municipio") or {}
    tipo = item.get("tipologia") or {}
    cnpj, redigido = _cnpj_ou_redigido(item.get("cpf_cnpj"))
    lin = {
        "id": item.get("id"),
        "tipo": chave,
        "ano": _limpar(item.get("ano")),
        "data_audiencia": _limpar(item.get("data_audiencia")),
        "empreendimento": _limpar(item.get("nome_razao_social")),
        "cnpj": cnpj,
        "municipio": _limpar(muni.get("nome_municipio")),
        "uf": _limpar(muni.get("uf")),
        "tipologia": _limpar(tipo.get("nome_tipologia")),
        "atividade": _limpar(tipo.get("nome_atividade")),
        "codigo_atividade": _limpar(tipo.get("codigo")),
        "arquivo": _limpar(item.get("nome_arquivo")),
        "tamanho_bytes": item.get("tamanho_arquivo"),
        "url_pdf": URL_PDF.format(id=item.get("id")),
        "portal": PORTAL_HUMANO,
    }
    if redigido:
        lin["doc_redigido"] = 1
    for k, v in list(lin.items()):  # todo campo de texto passa pelo varredor
        if isinstance(v, str):
            lin[k] = _apagar_cpf_em_texto(v)
    if not lin["id"]:
        raise RuntimeError(f"item sem id em {chave} — formato da API mudou")
    return lin


def _ano_da_linha(lin: dict) -> str:
    """Ano da linha; audiência usa a data da audiência (o `ano` às vezes falta)."""
    for campo in ("data_audiencia", "ano"):
        v = lin.get(campo)
        if v and re.match(r"^\d{4}", str(v)):
            return str(v)[:4]
    return "(sem ano)"


def _validar_pdf(lin: dict) -> dict:
    """Abaixo só os primeiros bytes: prova que a rota serve PDF, não HTML de erro."""
    global _BYTES_LIDOS
    time.sleep(PAUSA)
    req = urllib.request.Request(lin["url_pdf"], headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, context=_CTX, timeout=120) as resp:
            prefixo = resp.read(8)
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            raise BloqueioFonte(f"HTTP {e.code} no PDF {lin['id']}") from e
        raise
    _BYTES_LIDOS += len(prefixo)
    return {"id": lin["id"], "tipo": lin["tipo"], "url": lin["url_pdf"],
            "bytes_baixados": len(prefixo),
            "magic": prefixo[:5].decode("latin-1"),
            "ok": prefixo.startswith(b"%PDF-")}


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(
        description="Coleta audiências públicas, EIA e RIMA do Pará (SEMAS-PA)")
    ap.add_argument("--dry-run", action="store_true", help="só conta, não grava")
    ap.add_argument("--scan-cpf", action="store_true",
                    help="roda o varredor oficial de CPF ao final")
    args = ap.parse_args()

    print("=== SEMAS-PA audiências / EIA / RIMA (portal da transparência) ===\n")
    print(f"  fonte  : {URL_DOC}")
    print(f"  ritmo  : {PAUSA}s entre requisições, UA honesto, 403/429 aborta")
    print(f"  saida  : {SAIDA.name}")

    resolvidos: dict[str, int] = {}
    try:
        for esperado in TIPOS:
            resolvidos[esperado["chave"]] = _resolver_id(esperado, resolvidos)
    except BloqueioFonte as e:
        print(f"\n[cancelado] {e}\n  Nada foi gravado.")
        sys.exit(3)
    print(f"  tipos  : {resolvidos}")

    if args.dry_run:
        for chave, id_tipo in resolvidos.items():
            d = _primeira_pagina(id_tipo)
            print(f"    {chave:10s} total {d.get('total')} "
                  f"({d.get('last_page')} páginas)")
        print("  (dry-run: nada além destas contagens foi baixado)")
        return

    linhas: list[dict] = []
    por_tipo: dict[str, dict] = {}
    truncado = False
    try:
        for esperado in TIPOS:
            chave = esperado["chave"]
            id_tipo = resolvidos[chave]
            print(f"\n  coletando {chave} (id_tipo_arquivo={id_tipo})...")
            itens, total, concluiu = _coletar_tipo(id_tipo, esperado)
            novas = [_linha(x, chave) for x in itens]
            linhas.extend(novas)
            faltando = total - len(novas)
            por_tipo[chave] = {
                "id_tipo_arquivo": id_tipo,
                "nome_tipo": _limpar((itens[0].get("tipo_arquivo") or {}).get("nome"))
                             if itens else None,
                "total_fonte": total,
                "linhas": len(novas),
                "faltando": max(faltando, 0),
            }
            if not concluiu or faltando > 0:
                truncado = True
                print(f"  [!] {chave}: {len(novas)} de {total} — PARCIAL")
    except BloqueioFonte as e:
        print(f"\n[cancelado] {e}\n  Nada foi gravado.")
        sys.exit(3)
    except RuntimeError as e:
        print(f"\n[cancelado] {e}\n  Nada foi gravado.")
        sys.exit(2)

    total_fonte = sum(t["total_fonte"] for t in por_tipo.values())
    resumo_tipo: dict[str, int] = {}
    resumo_ano: dict[str, dict[str, int]] = {}
    for r in linhas:
        resumo_tipo[r["tipo"]] = resumo_tipo.get(r["tipo"], 0) + 1
        ano = _ano_da_linha(r)
        resumo_ano.setdefault(r["tipo"], {})
        resumo_ano[r["tipo"]][ano] = resumo_ano[r["tipo"]].get(ano, 0) + 1

    amostras = [_validar_pdf(next(r for r in linhas if r["tipo"] == ch))
                for ch in ("audiencia", "rima", "eia")
                if any(r["tipo"] == ch for r in linhas)]

    mb_total = sum((r.get("tamanho_bytes") or 0) for r in linhas) / 1024 / 1024
    mb_baixado = _BYTES_LIDOS / 1024 / 1024
    n_ano_vazio = sum(1 for r in linhas if not r["ano"])
    n_redigido = sum(1 for r in linhas if r.get("doc_redigido"))
    fora_pa = sorted({r["uf"] for r in linhas if r["uf"] not in (None, "PA")})

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": URL_DOC,
        "fontes": FONTES,
        "total_fonte": total_fonte,
        "truncado": truncado,
        "colunas": COLUNAS,
        "obs": (
            f"{len(linhas)} documentos ({total_fonte} na fonte). Um `id` por "
            "documento publicado; audiência vem como ATA dentro do tipo "
            "'Relatórios' da SEMAS, identificada por `data_audiencia`. Cada "
            "linha traz URL direta do PDF: EIA+RIMA somam ~"
            f"{mb_total / 1024:.1f} GiB, por isso o PDF NÃO é baixado (só "
            "amostra de 1 por tipo, conferida por magic `%PDF-`). O "
            "`id_tipo_arquivo` é interno e foi conferido pelo NOME do tipo. "
            "A fonte NÃO publica numero_processo nem numero_licenca: vínculo "
            "audiência↔estudo só por CNPJ + município + tipologia. CNPJ de 14 "
            "dígitos preservado; CPF nunca é gravado (run de 11 dígitos válido "
            "por mod-11 vira null + doc_redigido=1) — "
            f"{n_redigido} documento(s) redigido(s) nesta rodada. "
            f"O campo `ano` vem vazio em {n_ano_vazio} linha(s): o ano do "
            "resumo sai de `data_audiencia` quando existe. "
            + (f"UF fora do Pará na fonte: {', '.join(fora_pa)} (registro da "
               "própria SEMAS, não erro de coleta). " if fora_pa else "")
            + "`requisicoes_bytes` é o total trafegado de verdade."
        ),
        "ressalva_editorial": RESSALVA,
        "tipos": por_tipo,
        "resumo_por_tipo": resumo_tipo,
        "resumo_por_ano": resumo_ano,
        "pdf_amostra_validada": amostras,
        "pdf_tamanho_total_mb": round(mb_total, 1),
        "requisicoes_bytes": _BYTES_LIDOS,
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    tam_kb = SAIDA.stat().st_size / 1024
    print(f"\n[ok] {len(linhas)} documentos ({total_fonte} na fonte) -> "
          f"{SAIDA.name} ({tam_kb:,.0f} KB)")
    for chave, n in resumo_tipo.items():
        print(f"  {chave:10s} {n}")
    print(f"  PDFs: {mb_total:,.0f} MB na fonte; {mb_baixado:.1f} MB trafegados "
          f"({len(amostras)} amostras validadas)")
    if truncado:
        print("  ⚠ TRUNCADO: a fonte tem mais documento do que esta rodada pegou")
    if not all(a["ok"] for a in amostras):
        print("  ⚠ amostra de PDF não veio com magic %PDF- — rota pode ter mudado")

    if args.scan_cpf:
        print("\n  rodando o varredor de CPF sobre a saída...")
        r = subprocess.run([sys.executable, "scripts/checar-dado-pessoal-em-dado.py",
                            "--extra", str(SAIDA)])
        if r.returncode != 0:
            print("  [!] CPF achado no JSON — limpar campo no coletor e re-rodar.")
            sys.exit(2)
        print("  scan clean.")


if __name__ == "__main__":
    main()
