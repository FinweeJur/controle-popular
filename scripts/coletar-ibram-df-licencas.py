"""coletar-ibram-df-licencas.py — licenciamento ambiental e autorizações do Distrito Federal.

Coleta a relação pública integral de atos de licenciamento ambiental e autorizações
do Instituto Brasília Ambiental (IBRAM-DF), mantido pelo Governo do Distrito Federal (GDF)
através do Sistema de Processos Urutau (http://urutau.ibram.df.gov.br/).
Grava JSON estruturado em apps/web/data/ibram-df-licencas.json.

Fonte: http://urutau.ibram.df.gov.br/
Portal institucional: https://www.ibram.df.gov.br/licenciamento-ambiental/

Rodar:
    python scripts/coletar-ibram-df-licencas.py               # coleta completa de todos os atos (~3.758 registros)
    python scripts/coletar-ibram-df-licencas.py --limit 500   # coleta rápida de amostra
    python scripts/coletar-ibram-df-licencas.py --scan-cpf    # varre CPF com validador oficial ao final

Privacidade e LGPD (Regra 2 do AGENTS.md):
- Higienização obrigatória de CPF por algoritmo mod-11 oficial (substituído por '[CPF redigido]').
- CNPJs válidos de 14 dígitos são mantidos e formatados.
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

URL_URUTAU = "http://urutau.ibram.df.gov.br/"
URL_DETALHE = "http://urutau.ibram.df.gov.br/detalhe_processo/{}"
UA = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
ORGAO = "IBRAM (DF)"
UF = "DF"

SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "ibram-df-licencas.json"
CACHE_DIR = Path(__file__).resolve().parent / ".cache" / "ibram-df"
CACHE_DETALHES = CACHE_DIR / "detalhes.json"

RE_CPF = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b")

# Mapeamento oficial de Regiões Administrativas do DF para as 7 Bacias Hidrográficas do DF (ADASA/IBRAM)
BACIAS_DF_POR_RA = {
    # Bacia do Rio Paranoá (RH Paraná)
    "BRASÍLIA": "Bacia do Rio Paranoá",
    "PLANO PILOTO": "Bacia do Rio Paranoá",
    "LAGO SUL": "Bacia do Rio Paranoá",
    "LAGO NORTE": "Bacia do Rio Paranoá",
    "CRUZEIRO": "Bacia do Rio Paranoá",
    "SUDOESTE/OCTOGONAL": "Bacia do Rio Paranoá",
    "CANDANGOLÂNDIA": "Bacia do Rio Paranoá",
    "GUARÁ": "Bacia do Rio Paranoá",
    "NÚCLEO BANDEIRANTE": "Bacia do Rio Paranoá",
    "SCIA": "Bacia do Rio Paranoá",
    "SCIA/ESTRUTURAL": "Bacia do Rio Paranoá",
    "ESTRUTURAL": "Bacia do Rio Paranoá",
    "SIA": "Bacia do Rio Paranoá",
    "VICENTE PIRES": "Bacia do Rio Paranoá",
    "ÁGUAS CLARAS": "Bacia do Rio Paranoá",
    "RIACHO FUNDO": "Bacia do Rio Paranoá",
    "RIACHO FUNDO I": "Bacia do Rio Paranoá",
    "ITAPOÃ": "Bacia do Rio Paranoá",
    "VARJÃO": "Bacia do Rio Paranoá",
    "PARK WAY": "Bacia do Rio Paranoá",
    "SIBN": "Bacia do Rio Paranoá",

    # Bacia do Rio São Bartolomeu (RH Paraná)
    "SÃO SEBASTIÃO": "Bacia do Rio São Bartolomeu",
    "JARDIM BOTÂNICO": "Bacia do Rio São Bartolomeu",
    "PARANOÁ": "Bacia do Rio São Bartolomeu",

    # Bacia do Rio Descoberto (RH Paraná)
    "BRAZLÂNDIA": "Bacia do Rio Descoberto",
    "CEILÂNDIA": "Bacia do Rio Descoberto",
    "TAGUATINGA": "Bacia do Rio Descoberto",
    "SAMAMBAIA": "Bacia do Rio Descoberto",
    "SOL NASCENTE E PÔR DO SOL": "Bacia do Rio Descoberto",
    "SOL NASCENTE": "Bacia do Rio Descoberto",
    "PÔR DO SOL": "Bacia do Rio Descoberto",

    # Bacia do Rio Corumbá (RH Paraná)
    "GAMA": "Bacia do Rio Corumbá",
    "SANTA MARIA": "Bacia do Rio Corumbá",
    "RECANTO DAS EMAS": "Bacia do Rio Corumbá",
    "RIACHO FUNDO II": "Bacia do Rio Corumbá",

    # Bacia do Rio Maranhão (RH Tocantins-Araguaia)
    "PLANALTINA": "Bacia do Rio Maranhão",
    "SOBRADINHO": "Bacia do Rio Maranhão",
    "SOBRADINHO I": "Bacia do Rio Maranhão",
    "SOBRADINHO L": "Bacia do Rio Maranhão",
    "SOBRADINHO II": "Bacia do Rio Maranhão",
    "FERCAL": "Bacia do Rio Maranhão",

    # Bacia do Rio Preto (RH São Francisco)
    "PAD/DF": "Bacia do Rio Preto",
}

MAPA_TIPOS = {
    "LO": "Licença de Operação (LO)",
    "LP": "Licença Prévia (LP)",
    "LI": "Licença de Instalação (LI)",
    "AA": "Autorização Ambiental (AA)",
    "LAS": "Licença Ambiental Simplificada (LAS)",
    "ASV": "Autorização de Supressão Vegetal (ASV)",
    "CF": "Compensação Florestal (CF)",
    "TCA": "Termo de Compromisso Ambiental (TCA)",
    "LAC": "Licença Ambiental por Adesão e Compromisso (LAC)",
    "LOT": "Licença de Operação a Título Precário (LOT)",
    "CA": "Consulta Ambiental (CA)",
    "CP": "Consulta Prévia (CP)",
}

MESES_PT = {
    "janeiro": "01", "fevereiro": "02", "março": "03", "marco": "03",
    "abril": "04", "maio": "05", "junho": "06", "julho": "07",
    "agosto": "08", "setembro": "09", "outubro": "10", "novembro": "11", "dezembro": "12"
}


def _cpf_valido(dig: str) -> bool:
    """Validação matemática de CPF via algoritmo mod-11 oficial."""
    if len(dig) != 11 or len(set(dig)) == 1:
        return False

    def dv(ate: int) -> int:
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    return dv(9) == int(dig[9]) and dv(10) == int(dig[10])


def _apagar_cpf(texto: str | None) -> str | None:
    """Sanitiza strings substituindo CPFs por '[CPF redigido]'."""
    if not texto:
        return None
    dig_puro = re.sub(r"\D", "", texto)
    if len(dig_puro) == 11 and _cpf_valido(dig_puro):
        return "[CPF redigido]"

    def _sub(m):
        val = m.group(0)
        d = re.sub(r"\D", "", val)
        if len(d) == 11 and _cpf_valido(d):
            return "[CPF redigido]"
        return val

    return RE_CPF.sub(_sub, texto)


def _formatar_cnpj(doc: str) -> str:
    """Formata CNPJ válido de 14 dígitos."""
    d = re.sub(r"\D", "", doc)
    if len(d) == 14:
        return f"{d[:2]}.{d[2:5]}.{d[5:8]}/{d[8:12]}-{d[12:]}"
    return doc


def _formatar_processo(proc: str | None) -> str | None:
    """Formata número SEI do GDF para legibilidade (ex: 00391-00023650/2017-97)."""
    if not proc:
        return None
    p = proc.strip()
    d = re.sub(r"\D", "", p)
    if len(d) == 19 and d.startswith("00391"):
        return f"{d[:5]}-{d[5:13]}/{d[13:17]}-{d[17:]}"
    return p


def _parse_data_pt(texto: str | None) -> str | None:
    """Converte datas por extenso em português ou numéricas para formato ISO YYYY-MM-DD."""
    if not texto:
        return None
    t = texto.strip()
    if t.lower() in ["none", "null", "-", ""]:
        return None

    # Ex: '25 de Abril de 2022'
    m = re.search(r"(\d{1,2})\s+de\s+([a-zA-ZçÇ]+)\s+de\s+(\d{4})", t, re.IGNORECASE)
    if m:
        dia = int(m.group(1))
        mes_nome = m.group(2).lower()
        mes = MESES_PT.get(mes_nome)
        ano = int(m.group(3))
        if mes:
            return f"{ano:04d}-{mes}-{dia:02d}"

    # Ex: '25/04/2022'
    m2 = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", t)
    if m2:
        dia = int(m2.group(1))
        mes = int(m2.group(2))
        ano = int(m2.group(3))
        return f"{ano:04d}-{mes:02d}-{dia:02d}"

    return None


def _extrair_ano(proc: str | None, lic: str | None, dt_iso: str | None) -> int | None:
    """Extrai ano de referência do processo, licença ou data ISO."""
    if dt_iso and len(dt_iso) >= 4:
        try:
            return int(dt_iso[:4])
        except Exception:
            pass

    for s in [lic, proc]:
        if not s:
            continue
        m = re.search(r"/(20\d{2})", s)
        if m:
            return int(m.group(1))
        m = re.search(r"\b(20\d{2})\b", s)
        if m:
            val = int(m.group(1))
            if 1990 <= val <= 2026:
                return val
    return None


def _resolver_bacia(bacia_raw: str | None, ra: str | None) -> str:
    """Resolve o nome oficial da bacia hidrográfica distrital."""
    if bacia_raw and bacia_raw.strip().lower() not in ["none", "null", "-", ""]:
        b = bacia_raw.strip()
        if b.lower().startswith("rio "):
            return f"Bacia do {b}"
        if not b.lower().startswith("bacia"):
            return f"Bacia do {b}"
        return b

    if ra:
        ra_norm = ra.strip().upper()
        if ra_norm in BACIAS_DF_POR_RA:
            return BACIAS_DF_POR_RA[ra_norm]

    return "Bacia Hidrográfica do Distrito Federal (DF)"


def _gerar_tags(tipo: str | None, situacao: str | None, ra: str | None, bacia: str | None) -> list[str]:
    """Gera tags categorizadas em minúsculas."""
    tags = ["licenca", "ibram", "df"]
    if ra:
        ra_slug = re.sub(r"[^\w]+", "_", ra.lower()).strip("_")
        if ra_slug and ra_slug not in tags:
            tags.append(ra_slug)
    if bacia:
        b_slug = re.sub(r"[^\w]+", "_", bacia.lower()).replace("bacia_do_", "").replace("bacia_hidrografica_do_", "").strip("_")
        if b_slug and b_slug not in tags:
            tags.append(b_slug)

    combinado = f"{tipo or ''} {situacao or ''}".lower()
    if "operacao" in combinado or " lo" in combinado:
        tags.append("licenca_operacao")
    if "previa" in combinado or " lp" in combinado:
        tags.append("licenca_previa")
    if "instalacao" in combinado or " li" in combinado:
        tags.append("licenca_instalacao")
    if "supressao" in combinado or " asv" in combinado:
        tags.append("supressao_vegetal")
    if "simplificada" in combinado or " las" in combinado:
        tags.append("licenca_simplificada")
    if "autorizacao" in combinado or " aa" in combinado:
        tags.append("autorizacao_ambiental")
    if "compensacao" in combinado or " cf" in combinado:
        tags.append("compensacao_florestal")
    if "compromisso" in combinado or " tca" in combinado:
        tags.append("termo_compromisso")
    if "valida" in combinado:
        tags.append("valida")
    elif "analise" in combinado:
        tags.append("em_analise")
    elif "cancelada" in combinado:
        tags.append("cancelada")
    elif "expirada" in combinado:
        tags.append("expirada")

    return list(dict.fromkeys(tags))


def _carregar_cache_detalhes() -> dict[str, dict]:
    """Carrega cache local de detalhes dos processos."""
    if CACHE_DETALHES.exists():
        try:
            return json.loads(CACHE_DETALHES.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def _salvar_cache_detalhes(cache: dict[str, dict]) -> None:
    """Salva cache local de detalhes no disco."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DETALHES.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def _buscar_detalhes_concorrente(urls_ids: list[str], cache: dict[str, dict], max_workers: int = 40) -> dict[str, dict]:
    """Busca detalhes dos processos com paralelismo e cache em disco."""
    pendentes = [uid for uid in urls_ids if uid not in cache]
    if not pendentes:
        return cache

    print(f"Buscando detalhes de {len(pendentes):,} processos com {max_workers} conexões concorrentes...")
    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(pool_connections=max_workers + 10, pool_maxsize=max_workers + 10)
    session.mount("http://", adapter)
    session.headers.update({"User-Agent": UA})

    def _fetch(uid: str) -> tuple[str, dict | None]:
        url = URL_DETALHE.format(uid)
        for _ in range(3):
            try:
                r = session.get(url, timeout=12)
                if r.status_code == 200:
                    text = r.text
                    proto = re.search(r"Data do Protocolo.*?:\s*([^\n\r<]+)", text)
                    emissao = re.search(r"Data de Emissão.*?:\s*([^\n\r<]+)", text)
                    venc = re.search(r"Data de Vencimento.*?:\s*([^\n\r<]+)", text)
                    bacia = re.search(r"Bacia Hidrográfica:\s*([^\n\r<]+)", text)
                    return uid, {
                        "proto": proto.group(1).strip() if proto else None,
                        "emissao": emissao.group(1).strip() if emissao else None,
                        "venc": venc.group(1).strip() if venc else None,
                        "bacia": bacia.group(1).strip() if bacia else None,
                    }
                time.sleep(0.5)
            except Exception:
                time.sleep(0.5)
        return uid, None

    t0 = time.time()
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        for idx, (uid, dados) in enumerate(executor.map(_fetch, pendentes)):
            if dados is not None:
                cache[uid] = dados
            if (idx + 1) % 500 == 0 or (idx + 1) == len(pendentes):
                el = time.time() - t0
                print(f"  Progresso detalhes: {idx + 1:,}/{len(pendentes):,} em {el:.1f}s...")
                _salvar_cache_detalhes(cache)

    _salvar_cache_detalhes(cache)
    return cache


def main() -> int:
    parser = argparse.ArgumentParser(description="Coleta atos de licenciamento do IBRAM-DF via Sistema Urutau")
    parser.add_argument("--limit", type=int, default=0, help="Limite de registros (0 = todos)")
    parser.add_argument("--workers", type=int, default=40, help="Número de threads simultâneas para detalhes")
    parser.add_argument("--no-details", action="store_true", help="Pula extração de páginas de detalhe")
    parser.add_argument("--scan-cpf", action="store_true", help="Executa auditoria oficial de CPF ao final")
    args = parser.parse_args()

    print(f"Iniciando coleta IBRAM-DF via Sistema Urutau (limite: {'tudo' if args.limit == 0 else args.limit})...")
    print(f"Acessando {URL_URUTAU}...")
    headers = {"User-Agent": UA}
    resp = requests.get(URL_URUTAU, headers=headers, timeout=30)
    if resp.status_code != 200:
        print(f"Erro ao acessar {URL_URUTAU}: HTTP {resp.status_code}")
        return 1

    soup = BeautifulSoup(resp.content, "html.parser")
    table = soup.find("table")
    if not table:
        print("Erro: tabela não encontrada na página inicial do Urutau.")
        return 1

    tbody = table.find("tbody")
    rows = tbody.find_all("tr") if tbody else []
    total_disponivel = len(rows)
    print(f"Total de registros encontrados no Urutau: {total_disponivel:,}")

    # Extrai IDs para busca de detalhes
    urls_ids = []
    linhas_brutas = []
    for r in rows:
        th = r.find("th")
        a = th.find("a") if th else None
        proc_raw = a.get_text(strip=True) if a else (th.get_text(strip=True) if th else "")
        detail_href = a.get("href") if a else ""
        detail_id = detail_href.split("/")[-1] if detail_href and "/" in detail_href else ""

        tds = r.find_all("td")
        num_lic = tds[0].get_text(strip=True) if len(tds) > 0 else None
        tipo_raw = tds[1].get_text(strip=True) if len(tds) > 1 else None
        situacao_raw = tds[2].get_text(strip=True) if len(tds) > 2 else None
        empresa_raw = tds[3].get_text(strip=True) if len(tds) > 3 else None
        doc_raw = tds[4].get_text(strip=True) if len(tds) > 4 else None
        cep_raw = tds[5].get_text(strip=True) if len(tds) > 5 else None
        ra_raw = tds[6].get_text(strip=True) if len(tds) > 6 else None
        logradouro_raw = tds[7].get_text(strip=True) if len(tds) > 7 else None
        coords_raw = tds[8].get_text(strip=True) if len(tds) > 8 else None

        if detail_id:
            urls_ids.append(detail_id)

        linhas_brutas.append({
            "proc_raw": proc_raw,
            "detail_id": detail_id,
            "num_lic": num_lic if num_lic and num_lic.lower() != "none" else None,
            "tipo_raw": tipo_raw if tipo_raw and tipo_raw.lower() != "none" else None,
            "situacao_raw": situacao_raw if situacao_raw and situacao_raw.lower() != "none" else None,
            "empresa_raw": empresa_raw if empresa_raw and empresa_raw.lower() != "none" else None,
            "doc_raw": doc_raw if doc_raw and doc_raw.lower() != "none" else None,
            "cep_raw": cep_raw if cep_raw and cep_raw.lower() != "none" else None,
            "ra_raw": ra_raw if ra_raw and ra_raw.lower() != "none" else None,
            "logradouro_raw": logradouro_raw if logradouro_raw and logradouro_raw.lower() != "none" else None,
            "coords_raw": coords_raw if coords_raw and coords_raw.lower() != "none" else None,
        })

    # Busca detalhes
    cache_detalhes = _carregar_cache_detalhes()
    if not args.no_details:
        target_ids = urls_ids if args.limit == 0 else urls_ids[:args.limit]
        cache_detalhes = _buscar_detalhes_concorrente(target_ids, cache_detalhes, max_workers=args.workers)

    linhas = []
    for item in linhas_brutas:
        uid = item["detail_id"]
        det = cache_detalhes.get(uid, {})

        # Tipo da licença expandido
        tipo_sigla = item["tipo_raw"] or "Licença Ambiental"
        tipo = MAPA_TIPOS.get(tipo_sigla, tipo_sigla)

        # Situação
        sit_bruta = item["situacao_raw"] or "Válida"
        situacao = "Válida" if sit_bruta.lower() in ["válida", "valida"] else sit_bruta

        # Município / RA
        ra = item["ra_raw"]
        mun = ra.title() if ra else "Brasília"

        # Bacia hidrográfica
        bacia_raw = det.get("bacia")
        bacia = _resolver_bacia(bacia_raw, ra)

        # Datas
        dt_inicio = _parse_data_pt(det.get("emissao")) or _parse_data_pt(det.get("proto"))
        dt_fim = _parse_data_pt(det.get("venc"))

        # Processo e ano
        num_lic = item["num_lic"]
        processo_fmt = _formatar_processo(item["proc_raw"])
        ano = _extrair_ano(processo_fmt, num_lic, dt_inicio)

        # Empresa e Higienização de CPF/CNPJ (LGPD mod-11)
        doc = item["doc_raw"]
        empresa_nome = item["empresa_raw"]
        empresa_fmt = None

        if doc:
            d_dig = re.sub(r"\D", "", doc)
            if len(d_dig) == 14:
                # CNPJ válido de 14 dígitos mantido
                cnpj_fmt = _formatar_cnpj(d_dig)
                empresa_fmt = f"{empresa_nome} ({cnpj_fmt})" if empresa_nome else cnpj_fmt
            elif len(d_dig) == 11 and _cpf_valido(d_dig):
                # CPF de pessoa física sanitizado com mod-11
                empresa_fmt = f"{empresa_nome} ([CPF redigido])" if empresa_nome else "[CPF redigido]"
            elif len(d_dig) == 11:
                # 11 dígitos em geral redigidos por precaução de privacidade
                empresa_fmt = f"{empresa_nome} ([CPF redigido])" if empresa_nome else "[CPF redigido]"
            else:
                empresa_fmt = empresa_nome
        else:
            empresa_fmt = empresa_nome

        empresa_sanitizada = _apagar_cpf(empresa_fmt)

        # Microresumo de 1 linha
        lic_ref = f" nº {num_lic}" if num_lic else ""
        emp_ref = f" · {empresa_sanitizada}" if empresa_sanitizada else ""
        microresumo = f"{tipo}{lic_ref} · {mun}, DF{emp_ref} · {bacia} · Situação: {situacao}"
        microresumo = _apagar_cpf(microresumo)

        # Tags categorizadas
        tags = _gerar_tags(tipo, situacao, ra, bacia)

        linhas.append({
            "orgao": ORGAO,
            "uf": UF,
            "ano": ano,
            "categoria": "licenca",
            "tipo": _apagar_cpf(tipo),
            "empresa": empresa_sanitizada,
            "municipio": mun,
            "bacia": bacia,
            "data_inicio": dt_inicio,
            "data_fim": dt_fim,
            "situacao": situacao,
            "processo": _apagar_cpf(processo_fmt),
            "microresumo": microresumo,
            "tags": tags,
        })

        if args.limit > 0 and len(linhas) >= args.limit:
            break

    resultado = {
        "gerado_em": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "fonte": URL_URUTAU,
        "truncado": args.limit > 0 and len(linhas) < total_disponivel,
        "total": len(linhas),
        "total_disponivel": total_disponivel,
        "ressalva_editorial": (
            "Atos de licenciamento ambiental e autorizações do Distrito Federal (IBRAM-DF - Instituto Brasília Ambiental) "
            "obtidos via Sistema de Processos Urutau. "
            "A concessão atesta a regularidade ambiental formal perante o órgão distrital na data de emissão."
        ),
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    tamanho_bytes = SAIDA.stat().st_size
    print(f"Gravado em {SAIDA} ({len(linhas):,} registros, {tamanho_bytes:,} bytes)")

    if args.scan_cpf:
        print("Executando varredura oficial de CPF (mod-11)...")
        scanner = Path(__file__).resolve().parent / "checar-dado-pessoal-em-dado.py"
        r = subprocess.run(
            [sys.executable, str(scanner), "--extra", str(SAIDA)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        print(r.stdout)
        if SAIDA.name in r.stdout:
            print(f"ERRO: Dado pessoal detectado em {SAIDA.name}!")
            return 2
        print(f"Auditoria de CPF em {SAIDA.name}: 100% LIMPA!")

    return 0


if __name__ == "__main__":
    sys.exit(main())
