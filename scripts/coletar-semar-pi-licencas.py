"""coletar-semar-pi-licencas.py — licenciamento ambiental da SEMARH-PI (SIGA-PI).

Coleta a relação pública de licenças ambientais concedidas no estado do Piauí
a partir do portal oficial da SEMARH (SIGA-PI) e grava JSON estruturado em
apps/web/data/semar-pi-licencas.json.

Portal: https://www.semarh.pi.gov.br/licencas/concedidas
Sistema: SIGA — Sistema Integrado de Gestão Ambiental e Recursos Hídricos
Total disponível: ~6.509 registros

Rodar:
    python scripts/coletar-semar-pi-licencas.py               # coleta tudo (~6.509 licenças)
    python scripts/coletar-semar-pi-licencas.py --limit 50    # amostra de teste
    python scripts/coletar-semar-pi-licencas.py --scan-cpf    # varre CPF ao final

Estrutura real do payload RSC (mapeada em 17/09/2026):
    item.processo.numero_processo              → número do processo
    item.processo.procedimento.nome            → tipo de licença
    item.processo.atividadesprocesso[0]
        .atividade.empreendimento
            .nome_empreendimento               → nome do empreendimento
            .empreendedores[].tipo_cadastro_pessoa → F=CPF (redigir), J=CNPJ (manter)
    item.documentos_eletronicos[0].created_at  → data de emissão (dict com .datetime)
    item.documentos_eletronicos[0].arquivo.validade → data de vencimento

Privacidade e LGPD:
- Empreendedores PF (tipo_cadastro_pessoa='F'): empresa substituída por '[Empreendedor - pessoa física]'.
- Sanitização de CPF por algoritmo mod-11 em todos os campos de texto.
"""
from __future__ import annotations

import argparse
import datetime
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

URL_BASE = "https://www.semarh.pi.gov.br/licencas/concedidas"
UA = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
UF = "PI"
ORGAO = "SEMARH (PI)"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "semar-pi-licencas.json"
CACHE_DIR = Path(__file__).resolve().parent / ".cache" / "semar-pi"
PAUSA = 2.0


RE_CPF = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}[-]?\d{2}\b")


def _cpf_valido(dig: str) -> bool:
    if len(dig) != 11 or len(set(dig)) == 1:
        return False

    def dv(ate: int) -> int:
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    return dv(9) == int(dig[9]) and dv(10) == int(dig[10])


def _apagar_cpf(texto: str | None) -> str | None:
    if not texto:
        return None
    dig_puro = re.sub(r"\D", "", texto)
    if len(dig_puro) == 11 and _cpf_valido(dig_puro):
        return "[CPF redigido]"

    def _sub(m: re.Match) -> str:
        val = m.group(0)
        d = re.sub(r"\D", "", val)
        if len(d) == 11 and _cpf_valido(d):
            return "[CPF redigido]"
        return val

    return RE_CPF.sub(_sub, texto)


def _extrair_data(obj) -> str | None:
    """Extrai data ISO (YYYY-MM-DD) de campo string ISO ou dict {datetime, date, ...}."""
    if not obj:
        return None
    if isinstance(obj, str):
        return obj.split("T")[0] if "T" in obj else obj[:10]
    if isinstance(obj, dict):
        dt = obj.get("datetime") or obj.get("date")
        if not dt:
            return None
        s = str(dt)
        if "/" in s:  # dd/mm/yyyy
            p = s.split("/")
            if len(p) == 3:
                return f"{p[2][:4]}-{p[1]:>02}-{p[0]:>02}"
        return s.split("T")[0][:10]
    return None


def _gerar_tags(tipo: str | None, categoria: str | None) -> list[str]:
    tags = ["licenca", "semarh", "pi"]
    if tipo:
        t = tipo.lower()
        if "prévia" in t or "previa" in t:
            tags.append("licenca_previa")
        elif "instalacao" in t or "instalação" in t:
            tags.append("licenca_instalacao")
        elif "operacao" in t or "operação" in t:
            tags.append("licenca_operacao")
        elif "dispensa" in t:
            tags.append("dispensa_licenciamento")
        elif "simplificada" in t or "las" in t:
            tags.append("licenca_ambiental_simplificada")
        elif "outorga" in t:
            tags.append("outorga_hidrica")
        elif "veiculo" in t or "transporte" in t:
            tags.append("transporte_perigoso")
        elif "supressao" in t or "supressão" in t:
            tags.append("supressao_vegetacao")
    if categoria:
        c = categoria.lower()
        if "controle" in c:
            tags.append("controle_ambiental")
        elif "recursos" in c:
            tags.append("recursos_hidricos")
    return list(dict.fromkeys(tags))


def _extrair_pagina(page_num: int) -> tuple[int, list[dict]]:
    url = f"{URL_BASE}?page={page_num}" if page_num > 1 else URL_BASE
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        html = resp.read().decode("utf-8", "ignore")

    decoder = json.JSONDecoder()
    for call in re.findall(r"self\.__next_f\.push\((\[.*?\])\)", html, re.S):
        try:
            parsed = json.loads(call)
            if len(parsed) < 2 or not isinstance(parsed[1], str):
                continue
            content = parsed[1]
            if '"results":[' not in content:
                continue

            idx = content.find('"results":[')
            pos = idx + 11
            results: list[dict] = []

            while pos < len(content) and content[pos:pos + 1] == "{":
                item, end = decoder.raw_decode(content[pos:])
                results.append(item)
                pos += end
                if content[pos:pos + 1] == ",":
                    pos += 1
                else:
                    break

            m_count = re.search(r'"count"\s*:\s*(\d+)', content)
            total_count = int(m_count.group(1)) if m_count else 0
            return total_count, results
        except Exception:
            continue
    return 0, []


def _processar_item(item: dict) -> dict | None:
    processo_obj = item.get("processo") or {}
    procedimento = processo_obj.get("procedimento") or {}
    docs = item.get("documentos_eletronicos") or []

    num_processo = _apagar_cpf(
        str(processo_obj.get("numero_processo") or "s/n").strip()
    )
    tipo_nome = procedimento.get("nome") or "Licença Ambiental"
    categoria_disp = procedimento.get("categoria_display") or "Licenciamento"

    # Datas via primeiro documento eletrônico
    dt_emissao: str | None = None
    dt_vencimento: str | None = None
    if docs:
        doc0 = docs[0]
        dt_emissao = _extrair_data(doc0.get("created_at"))
        arquivo = doc0.get("arquivo") or {}
        dt_vencimento = _extrair_data(arquivo.get("validade"))

    ano: int | None = None
    if dt_emissao:
        try:
            ano = int(dt_emissao[:4])
        except Exception:
            pass

    # Empresa e município via atividadesprocesso
    empresa: str | None = None
    municipio: str | None = None

    for ativ_entry in (processo_obj.get("atividadesprocesso") or []):
        ativ = ativ_entry.get("atividade") or {}
        empreend = ativ.get("empreendimento") or {}

        nome_empr = empreend.get("nome_empreendimento")
        if nome_empr:
            # Verificar se é PF
            pessoas = empreend.get("empreendedores") or []
            pf = any(p.get("tipo_cadastro_pessoa") == "F" for p in pessoas)
            if pf:
                empresa = "[Empreendedor — pessoa física]"
            else:
                empresa = nome_empr.strip().title()

        # Município
        mun = empreend.get("municipio") or ativ.get("municipio")
        if isinstance(mun, dict):
            municipio = mun.get("nome") or mun.get("nome_municipio")
        elif isinstance(mun, str):
            municipio = mun

        if empresa:
            break

    # Microresumo
    partes_mr = [tipo_nome]
    if empresa and "pessoa física" not in empresa:
        partes_mr.append(empresa[:60])
    if municipio:
        partes_mr.append(f"{municipio}/PI")
    if dt_vencimento:
        partes_mr.append(f"Validade: {dt_vencimento}")
    microresumo = " · ".join(partes_mr)

    tags = _gerar_tags(tipo_nome, categoria_disp)

    return {
        "orgao": ORGAO,
        "uf": UF,
        "ano": ano,
        "categoria": "licenca",
        "tipo": tipo_nome,
        "empresa": _apagar_cpf(empresa),
        "municipio": municipio,
        "bacia": "Bacia do Rio Parnaíba",
        "data_inicio": dt_emissao,
        "data_fim": dt_vencimento,
        "situacao": "Concedida",
        "processo": num_processo,
        "microresumo": microresumo,
        "tags": tags,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Coleta licencas concedidas pela SEMARH-PI")
    parser.add_argument("--limit", type=int, default=0, help="0 = tudo (padrão)")
    parser.add_argument("--scan-cpf", action="store_true")
    args = parser.parse_args()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    linhas: list[dict] = []
    page = 1
    total_disponivel = 0

    print(f"Coletando SEMARH-PI (limite: {'tudo' if args.limit == 0 else args.limit})...")

    while True:
        try:
            total_count, itens = _extrair_pagina(page)
            if total_count > 0:
                total_disponivel = total_count
            if not itens:
                print(f"Página {page}: sem itens — fim.")
                break

            novos = 0
            for item in itens:
                linha = _processar_item(item)
                if linha:
                    linhas.append(linha)
                    novos += 1
                if args.limit > 0 and len(linhas) >= args.limit:
                    break

            print(f"  Pág {page}: {novos} novos | Total: {len(linhas):,}/{total_disponivel:,}")

            if args.limit > 0 and len(linhas) >= args.limit:
                break

            page += 1
            time.sleep(PAUSA)

        except urllib.error.HTTPError as e:
            print(f"HTTP {e.code} pág {page}: {e}")
            if e.code == 404:
                break
            time.sleep(5)
        except Exception as e:
            print(f"Erro pág {page}: {e}")
            break

    truncado = total_disponivel > 0 and len(linhas) < total_disponivel

    resultado = {
        "gerado_em": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "fonte": URL_BASE,
        "truncado": truncado,
        "total": len(linhas),
        "total_disponivel": total_disponivel,
        "ressalva_editorial": (
            "Licenças ambientais concedidas pela SEMARH-PI registradas no sistema oficial SIGA-PI. "
            "A concessão de ato ambiental atesta conformidade na data de deferimento e "
            "está sujeita ao cumprimento contínuo das condicionantes fixadas no processo. "
            "Empreendedores pessoas físicas têm identificação redigida (LGPD)."
        ),
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nGravado: {SAIDA} ({len(linhas):,} registros, {SAIDA.stat().st_size:,} bytes)")
    status = "⚠ TRUNCADO" if truncado else "✅ COMPLETO"
    print(f"{status}: {len(linhas):,}/{total_disponivel:,}")

    if args.scan_cpf:
        print("\nAuditoria de CPF...")
        scanner = Path(__file__).resolve().parent / "checar-dado-pessoal-em-dado.py"
        r = subprocess.run(
            [sys.executable, str(scanner), "--extra", str(SAIDA)],
            capture_output=True, text=True, encoding="utf-8", errors="replace",
        )
        print(r.stdout[-2000:])
        if r.returncode != 0:
            return 2
        print(f"✅ Auditoria {SAIDA.name}: LIMPA!")

    return 0


if __name__ == "__main__":
    sys.exit(main())
