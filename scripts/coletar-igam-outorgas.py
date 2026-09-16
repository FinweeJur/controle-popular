"""coletar-igam-outorgas.py — outorgas de uso de recursos hídricos delegadas
ao estado de Minas Gerais (IGAM/SISEMA).

Coleta a "Consulta de Decisões de Outorga de Direito de Uso de Recursos
Hídricos" (grade Yii2, sem login) e grava JSON compacto em
apps/web/data/igam-outorgas.json.

Rodar:
    python scripts/coletar-igam-outorgas.py --dry-run  # conta registros só
    python scripts/coletar-igam-outorgas.py            # coleta até --limit
    python scripts/coletar-igam-outorgas.py --limit 0  # tudo (~1.115 páginas)
    python scripts/coletar-igam-outorgas.py --scan-cpf # varre CPF ao final

## Fonte e sondagem (2026-09-16, 4 requisições)

- http://sistemas.meioambiente.mg.gov.br/licenciamento/site/lista-outorgas
  (mesma consulta linkada em igam.mg.gov.br/w/consulta-de-decisao-de-outorgas-de-direito-de-uso)
- Sem login. Grade paginada: 55.729 registros (1-20 de 55,729), respeita
  `per-page` (probe com per-page=200 devolveu 50 — cap do servidor; usar 50).
- robots.txt do host: 404 (sem restrição). Paginação GET com pausa 2s,
  UA honesto. Sondagem ficou dentro de 4 GETs.

## O que a fonte NÃO expõe (verificado ao vivo)

- A grade HTML mostra 9 colunas: Portaria, Data de Publicação, Mês, Ano,
  Regional (URGA), Empreendimento, CPF/CNPJ, Modo de Uso, Decisão.
- Processo/Validade/Município/Bacia (estadual)/UPGRH/Curso d'água existem no
  seletor do botão "Exportar resultados" (xlsx), mas o export é POST com
  CSRF/kartik e não é cabível aqui — campos ficam null até haver rota melhor.
- CPF e nome já vêm mascarados na fonte ("463.20******", "José******",
  efeito da LGPD anunciada no portal). Regra do coletor: mantém doc só se
  14 dígitos completos (CNPJ); qualquer máscara/vírgula CPF vai null.
  Nome passa por sanitização (apaga qualquer run de 11 dígitos).

## Campos de saída (registros)

portaria | data_publicacao | mes | ano | regional | empreendimento |
tipo_uso (Modo de Uso) | situacao (Decisão) — e null para numero_processo,
municipio, bacia, data_outorga (data de publicação preenche), validade.
"resumo_por_bacia" conta por Regional/URGA (unidade de gestão em MG) e
leva ressalva de que Paraopeba não é discriminável nesta fonte.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
from datetime import datetime, timezone
from pathlib import Path

BASE = "http://sistemas.meioambiente.mg.gov.br/licenciamento/site/lista-outorgas"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "igam-outorgas.json"
CACHE = Path(__file__).resolve().parent / ".cache" / "igam-outorgas"
UA = "ControlePopular/1.0 (+controlepopular.com.br; dado publico governamental)"

PAUSA = 2  # s entre requisições (sem robots no host, UA honesto)
POR_PAGINA = 50  # cap medido do servidor
LIMITE_PADRAO = 5000

# contagem medida em 2026-09-16 no summary da grade
TOTAL_MEDIDO = 55729

RESSALVA = ("Consulta de decisões de outorga no diário (IGAM/URGAs/Suprams). "
            "Ter decisão deferida não confirma uso em execução, e a fonte HTML "
            "não expõe Município/Bacia/UPGRH — resumo usa a Regional (URGA).")


def _get(url: str, timeout: int = 120) -> str:
    """GET com UA honesto. 403/429/waf: espera 30s e re-tenta 1x.
    Fonte vem em windows-1252 sem charset declarado — decodifica por lá."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            bruto = resp.read()
            charset = resp.headers.get_content_charset() or "windows-1252"
        return bruto.decode(charset.lower(), errors="replace")
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            print(f"  [!] {e.code} do servidor — esperando 30s e tentando de novo...")
            time.sleep(30)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode("windows-1252", errors="replace")
        raise


# ---------------------------------------------------------------------------
# sanitização (idem coletor ANA)
# ---------------------------------------------------------------------------

def _sanitizar_doc_em_nome(nome) -> str | None:
    """Apaga do texto livre qualquer run que tenha 11 dígitos (CPF)."""
    if not nome:
        return None
    limpo = str(nome)

    def _apagar(m: "re.Match[str]") -> str:
        return "" if len(re.sub(r"\D", "", m.group(0))) == 11 else m.group(0)

    limpo = re.sub(r"\d[\d.\-]{8,}\d", _apagar, limpo)
    limpo = " ".join(limpo.split()).strip(" -,:")
    return limpo or None


def _doc_só_cnpj(doc) -> str | None:
    """Fonte já mascara ("463.20******"). Mantém só CNPJ completo (14 dígitos);
    máscara (CPF ou CNPJ parcial) → null."""
    if not doc:
        return None
    digitos = re.sub(r"\D", "", str(doc))
    return digitos if len(digitos) == 14 else None


# ---------------------------------------------------------------------------
# extração da grade
# ---------------------------------------------------------------------------

COLUNAS = ["portaria", "data_publicacao", "mes", "ano", "regional",
           "empreendimento", "doc", "tipo_uso", "situacao"]

RE_LINHA = re.compile(r"<tr[^>]*data-key[^>]*>(.*?)</tr>", re.S)
RE_CELDA = re.compile(r"<td[^>]*>(.*?)</td>", re.S)
RE_TOTAL = re.compile(r"de <b>([\d.,]+)</b>")  # 'de <b>55,729</b>'
RE_TAG = re.compile(r"<[^>]+>")


def _limpar(txt: str) -> str | None:
    s = re.sub(r"\s+", " ", RE_TAG.sub("", txt)).replace("&nbsp;", " ").strip()
    return s or None


def _contar_pagina(html: str) -> tuple[int, list[list]]:
    """Devolve (total anunciado, linhas da página)."""
    m_num = RE_TOTAL.search(html)
    total = int(m_num.group(1).replace(",", "").replace(".", "")) if m_num else 0
    linhas = []
    for corpo in RE_LINHA.findall(html):
        cel = [_limpar(c) for c in RE_CELDA.findall(corpo)]
        if len(cel) == len(COLUNAS):
            cel[5] = _sanitizar_doc_em_nome(cel[5])      # empreendimento
            cel[6] = _doc_só_cnpj(cel[6])                # doc: só CNPJ cheio
            linhas.append(cel)
    return total, linhas


def _url(pagina: int) -> str:
    q = urllib.parse.urlencode({"page": pagina, "per-page": POR_PAGINA})
    return f"{BASE}?{q}"


def _checkpoint() -> dict:
    """Lê (ou cria) o checkpoint com a lista de páginas concluídas."""
    CACHE.mkdir(parents=True, exist_ok=True)
    arq = CACHE / "checkpoint.json"
    if arq.exists():
        try:
            return json.loads(arq.read_text(encoding="utf-8"))
        except Exception:
            pass  # checkpoint corrompido: recomeça
    return {"paginas": [], "concluido": False}


def _salvar_checkpoint(ckpt: dict) -> None:
    arq = CACHE / "checkpoint.json"
    ckpt["ata"] = datetime.now(timezone.utc).isoformat()
    tmp = arq.with_suffix(".parcial")
    tmp.write_text(json.dumps(ckpt, ensure_ascii=False), encoding="utf-8")
    tmp.replace(arq)  # Windows: rename atômico precisa do alvo livre


def _paginar(limite: int, ckpt: dict, total: int) -> list[list]:
    """Baixa página a página (50/página, pausa 2s), retomando do checkpoint."""
    alvo = total if limite == 0 else min(total, limite)
    n_pags = (alvo + POR_PAGINA - 1) // POR_PAGINA
    registros: list[list] = []
    for pag in range(1, n_pags + 1):
        str_pag = str(pag)
        arq_pag = CACHE / f"pag-{str_pag.zfill(5)}.json"
        if str_pag in ckpt["paginas"]:
            if arq_pag.exists():
                try:
                    registros.extend(json.loads(arq_pag.read_text(encoding="utf-8")))
                    continue  # retomada: página já coletada e no cache
                except Exception:
                    pass  # cache corrompido: re-baixa
            ckpt["paginas"].remove(str_pag)  # página marcada sem cache: coleta de novo
        html = _get(_url(pag))
        total_visto, linhas = _contar_pagina(html)
        if not linhas:
            break  # fim real
        arq_pag.write_text(json.dumps(linhas, ensure_ascii=False), encoding="utf-8")
        ckpt["paginas"].append(str_pag)
        registros.extend(linhas[: max(0, alvo - len(registros)) if limite else len(linhas)])
        _salvar_checkpoint(ckpt)
        print(f"    página {pag}/{n_pags} (+{len(linhas)}, total {len(registros):,})")
        if limite and len(registros) >= alvo:
            break
        time.sleep(PAUSA)
    if len(registros) >= total:
        ckpt["concluido"] = True
        _salvar_checkpoint(ckpt)
    return registros[:alvo]


def main() -> None:
    parser = argparse.ArgumentParser(description="Coleta de outorgas IGAM (grade SISEMA)")
    parser.add_argument("--dry-run", action="store_true", help="conta registros, não baixa")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO,
                        help="trunca registros (0 = sem truncar)")
    parser.add_argument("--scan-cpf", action="store_true", help="roda o varredor de CPF ao final")
    args = parser.parse_args()

    print("=== IGAM outorgas (sistemas.meioambiente.mg.gov.br) ===\n")
    print(f"  fonte  : {BASE}")
    print(f"  limite : {'sem limite' if args.limit == 0 else args.limit}")
    print(f"  robots : host sem robots.txt (404) — pausa {PAUSA}s, UA honesto")
    print(f"  nota   : grade expõe 9 de ~21 colunas; CPF/nome já mascarados na fonte;")
    print(f"           {TOTAL_MEDIDO:,} registros anunciados pela grade")
    print(f"  saida  : {SAIDA}")

    # 1 GET de sondagem (valide CONTEÚDO, nunca o status — armadilha do AGENTS.md)
    try:
        html = _get(_url(1))
        total, _ = _contar_pagina(html)
        if not total:
            raise RuntimeError("grade respondeu sem total (layout mudou?)")
        if abs(total - TOTAL_MEDIDO) > TOTAL_MEDIDO * 0.5:
            print(f"  [!] total na grade ({total:,}) difere do medido ({TOTAL_MEDIDO:,})")
    except Exception as e:
        print(f"\n[cancelado] sondagem da grade falhou: {e}")
        print("  Nada foi coletado ou inventado. Verificar portal/waf e re-rodar.")
        sys.exit(2)
    print(f"  sondagem: total na grade = {total:,} registros")
    if args.dry_run:
        alvo = total if args.limit == 0 else min(total, args.limit)
        print(f"  coletaria {alvo:,} registros em ~{(alvo + 49) // 50} páginas,")
        print(f"  estimativa JSON compacto (~120 B/linha): ~{alvo * 120 / 1e6:.1f} MB")
        print("  (dry-run: nada além desta sondagem foi baixado)")
        return

    time.sleep(PAUSA)
    ckpt = _checkpoint()
    registros = _paginar(args.limit, ckpt, total)

    # resumo por bacia: a HP não tem coluna Bacia; usa Regional (URGA) e nomeia
    resumo: dict[str, int] = {}
    for r in registros:
        chave = r[4] or "?"
        resumo[chave] = resumo.get(chave, 0) + 1
    resumo = dict(sorted(resumo.items(), key=lambda kv: -kv[1]))

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": BASE,
        "total_fonte": total,
        "truncado": bool(args.limit and len(registros) < total),
        "colunas": COLUNAS,
        "colunas_originais": ["portaria", "data_publicacao", "mes", "ano",
                              "regional", "empreendimento", "cnpj", "modo_uso",
                              "decisao"],
        "ressalva_editorial": RESSALVA,
        "resumo_por_bacia": {
            "chave": "regional_URGA",
            "nota": "A grade HTML não expõe Bacia/UPGRH; a contagem é por "
                    "Regional de gestão (URGA). A Bacia do Paraopeba não é "
                    "discriminável nesta fonte — não use este resumo para "
                    "responder sobre Paraopeba.",
            "contagens": resumo,
        },
        "obs": "doc mantém só CNPJ com 14 dígitos completos; a fonte já "
               "mascara CPF/nome (LGPD), máscara → null na coleta.",
        "linhas": registros,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(
        json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tam_kb = SAIDA.stat().st_size / 1024
    print(f"\n[ok] {len(registros):,} de {total:,} outorgas → {SAIDA.name} ({tam_kb:,.0f} KB)"
          + (" — TRUNCADO (use --limit 0)" if dados["truncado"] else ""))

    if args.scan_cpf:
        print("\n  rodando o varredor de CPF sobre a saída...")
        r = subprocess.run(
            [sys.executable, "scripts/checar-dado-pessoal-em-dado.py", "--extra", str(SAIDA)])
        if r.returncode != 0:
            print("  [!] CPF(s) achado(s) no JSON — redigir campo no coletor (substituir por null+flag).")
            sys.exit(2)
        print("  scan clean.")


if __name__ == "__main__":
    main()
