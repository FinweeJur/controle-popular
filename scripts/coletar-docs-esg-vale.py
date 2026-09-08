#!/usr/bin/env python3
"""
Coletor de Documentos ESG da Vale S.A. para Controle Popular.

Raspa URLs-chave do portal ESG da Vale, salva HTML/PDF em apps/web/data/esg/,
gera metadados JSON e executa análise com o modelo Seu Nono Sabia (Ollama).

Uso:
    python scripts/coletar_docs_esg_vale.py
    python scripts/coletar_docs_esg_vale.py --dry-run   # só lista URLs
    python scripts/coletar_docs_esg_vale.py --analyze    # coleta + analisa via Ollama
"""

import json
import os
import sys
import time
import hashlib
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

# ── Configuração ──────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "apps" / "web" / "data" / "esg"
META_DIR = DATA_DIR / "meta"
OLLAMA_URL = "http://172.18.176.1:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"  # Seu Nono Sabia 7B está sendo baixado

REQUEST_DELAY = 2  # segundos entre requisições
USER_AGENT = "Controle-Popular/1.0 (controlepopular.com.br)"

# ── Fontes ESG da Vale ────────────────────────────────────────────────
FONTE_ESG = [
    {
        "id": "vale-esg-home",
        "name": "Portal ESG — Home",
        "url": "https://www.vale.com/esg/home",
        "category": "overview",
        "description": "Página principal do portal ESG com compromissos, notícias e acesso rápido",
    },
    {
        "id": "vale-esg-integrated-strategy",
        "name": "Estratégia Integrada",
        "url": "https://vale.com/esg/integrated-strategy",
        "category": "strategy",
        "description": "Estratégia integrada de sustentabilidade da Vale",
    },
    {
        "id": "vale-esg-nature",
        "name": "Nature",
        "url": "https://vale.com/esg/nature",
        "category": "environment",
        "description": "Informações sobre biodiversidade, conservação e proteção de ecossistemas",
    },
    {
        "id": "vale-esg-climate",
        "name": "Climate",
        "url": "https://vale.com/esg/climate",
        "category": "climate",
        "description": "Mudanças climáticas, emissões de GHG, metas de descarbonização",
    },
    {
        "id": "vale-esg-social",
        "name": "Social",
        "url": "https://www.vale.com/social",
        "category": "social",
        "description": "Desempenho social, relações com comunidades, direitos humanos",
    },
    {
        "id": "vale-esg-local-communities",
        "name": "Local Communities",
        "url": "https://vale.com/esg/local-communities",
        "category": "social",
        "description": "Relações com comunidades vizinhas e Planos de Relações Comunitárias (PRCs)",
    },
    {
        "id": "vale-esg-indigenous-peoples",
        "name": "Indigenous Peoples",
        "url": "https://vale.com/esg/indigenous-peoples-and-traditional-communities",
        "category": "social",
        "description": "Relação com povos indígenas e comunidades tradicionais",
    },
    {
        "id": "vale-esg-human-rights",
        "name": "Human Rights",
        "url": "https://vale.com/esg/human-rights",
        "category": "governance",
        "description": "Compromisso com direitos humanos e due diligence",
    },
    {
        "id": "vale-esg-dams",
        "name": "Dams",
        "url": "https://vale.com/dams",
        "category": "environment",
        "description": "Monitoramento de barragens e Programa de Descaracterização",
    },
    {
        "id": "vale-esg-document-library",
        "name": "Document Library",
        "url": "https://vale.com/en/esg/document-library",
        "category": "documents",
        "description": "Biblioteca de documentos ESG para download",
    },
    {
        "id": "vale-esg-occupational-health",
        "name": "Occupational Health and Safety",
        "url": "https://vale.com/esg/occupational-health-and-safety",
        "category": "social",
        "description": "Segurança do trabalho e saúde ocupacional",
    },
    {
        "id": "vale-esg-reparation",
        "name": "Reparation",
        "url": "https://vale.com/esg/reparation",
        "category": "social",
        "description": "Reparação integral dos danos do rompimento da barragem",
    },
    {
        "id": "vale-esg-mine-closure",
        "name": "Mine Closure",
        "url": "https://vale.com/en/esg/mine-closure-and-future-use",
        "category": "environment",
        "description": "Fechamento de minas e uso futuro sustentável",
    },
    {
        "id": "vale-environment",
        "name": "Environment",
        "url": "https://www.vale.com/environment",
        "category": "environment",
        "description": "Página de meio ambiente com biodiversidade, ecoeficiência e recuperação",
    },
    {
        "id": "vale-energy",
        "name": "Energy",
        "url": "https://vale.com/energy",
        "category": "climate",
        "description": "Energia e descarbonização — 100% renovável no Brasil desde 2023",
    },
    {
        "id": "vale-esg-last-updates",
        "name": "Last Updates",
        "url": "https://vale.com/esg/last-updates",
        "category": "news",
        "description": "Últimas atualizações do portal ESG",
    },
    {
        "id": "vale-ta-circular-mining",
        "name": "Circular Economy Report",
        "url": "https://www.vale.com/w/vale-2025-issb-report-circular-mining-business-opportunity/-/categories/4916964",
        "category": "reports",
        "description": "Relatório ISSB 2025 sobre economia circular como oportunidade de negócio",
    },
    {
        "id": "vale-tax-contribution",
        "name": "Tax Contribution Report 2025",
        "url": "https://vale.com/documents/d/guest/tax-contribution-report_2025",
        "category": "reports",
        "description": "Relatório de Contribuições Fiscais 2025",
    },
]

# ── Funções utilitárias ───────────────────────────────────────────────

def slugify(text: str) -> str:
    """Converte texto em slug válido para nomes de arquivo."""
    text = text.lower().strip()
    text = "".join(c if c.isalnum() or c in (" ", "-") else "_" for c in text)
    return text.replace(" ", "-")


def compute_hash(content: bytes) -> str:
    """Calcula SHA-256 do conteúdo."""
    return hashlib.sha256(content).hexdigest()


def save_metadata(meta: dict, doc_id: str) -> None:
    """Salva metadados JSON de um documento."""
    META_DIR.mkdir(parents=True, exist_ok=True)
    meta_path = META_DIR / f"{doc_id}.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def download_page(url: str) -> tuple[str | None, dict | None]:
    """Baixa uma página e retorna (html_content, metadata)."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as response:
            content = response.read()
            html = content.decode("utf-8", errors="replace")
            meta = {
                "id": slugify(url.split("/")[-1] or url.split(".")[-1]),
                "url": url,
                "status_code": response.status,
                "content_type": response.headers.get("Content-Type", "unknown"),
                "size_bytes": len(content),
                "sha256": compute_hash(content),
                "downloaded_at": datetime.now(timezone.utc).isoformat(),
            }
            return html, meta
    except (urllib.error.URLError, urllib.error.HTTPError, Exception) as e:
        print(f"  ⚠️ Falha ao baixar {url}: {e}")
        return None, None


def download_pdf(url: str, filename: str) -> dict | None:
    """Baixa um PDF e salva em apps/web/data/esg/."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=60) as response:
            content = response.read()
            ext = os.path.splitext(filename)[1] or ".pdf"
            path = DATA_DIR / f"{slugify(filename)}{ext}"
            with open(path, "wb") as f:
                f.write(content)
            meta = {
                "id": slugify(filename),
                "url": url,
                "filename": str(path),
                "size_bytes": len(content),
                "sha256": compute_hash(content),
                "downloaded_at": datetime.now(timezone.utc).isoformat(),
            }
            return meta
    except Exception as e:
        print(f"  ⚠️ Falha ao baixar PDF {url}: {e}")
        return None


def call_ollama(prompt: str, model: str = OLLAMA_MODEL) -> str:
    """Chama Ollama para análise."""
    try:
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"num_predict": 500, "temperature": 0.3},
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            OLLAMA_URL,
            data=data,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result.get("response", "")
    except Exception as e:
        print(f"  ⚠️ Falha ao chamar Ollama: {e}")
        return ""


# ── Pipeline principal ────────────────────────────────────────────────

def collect_all(dry_run: bool = False) -> list[dict]:
    """Coleta todas as fontes ESG. Retorna lista de metadados."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    META_DIR.mkdir(parents=True, exist_ok=True)

    results = []
    print(f"📋 Coletor ESG da Vale — {len(FONTE_ESG)} fontes")
    if dry_run:
        print("  (dry-run: apenas lista URLs)")
    print()

    for i, fonte in enumerate(FONTE_ESG):
        print(f"  [{i+1}/{len(FONTE_ESG)}] {fonte['name']}")
        print(f"    URL: {fonte['url']}")

        if dry_run:
            results.append(fonte | {"status": "dry-run"})
            continue

        time.sleep(REQUEST_DELAY)

        html, meta = download_page(fonte["url"])
        if html and meta:
            # Salva HTML
            html_path = DATA_DIR / f"{fonte['id']}.html"
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html)
            meta["html_path"] = str(html_path)
            print(f"    ✅ Salvo: {html_path.name} ({meta['size_bytes']:,} bytes)")
            results.append(fonte | meta | {"status": "ok"})

        # Verifica se há links para PDFs na página
        if ".pdf" in html:
            import re
            pdf_urls = re.findall(r'https?://[^\s"<>]+\.pdf[^\s"<>]*', html)
            for pdf_url in pdf_urls[:3]:  # máximo 3 PDFs por página
                time.sleep(REQUEST_DELAY)
                pdf_meta = download_pdf(pdf_url, f"{fonte['id']}_doc")
                if pdf_meta:
                    print(f"    📄 PDF: {pdf_url[:80]}...")
                    results.append(fonte | pdf_meta | {"status": "pdf-ok"})

    return results


def analyze_with_sabia(html_path: str, fonte_id: str) -> str:
    """Analisa HTML coletado com o modelo Seu Nono Sabia."""
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            html = f.read()
        # Remove tags HTML para texto puro
        import re
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()
        text = text[:8000]  # limite para contexto

        prompt = (
            f"Você é o Seu Nonô, assistente cívico do portal Controle Popular. "
            f"Analise este documento sobre a Vale S.A. e extraia em português: "
            f"1) Dados ambientais (barragens, emissões, biodiversidade) "
            f"2) Dados sociais (comunidades, direitos humanos, investimentos) "
            f"3) Compromissos e metas declarados "
            f"4) Riscos socioambientais "
            f"Responda em frases curtas, uma ideia por linha. "
            f"Documento:\n{text}"
        )
        return call_ollama(prompt)
    except Exception as e:
        print(f"  ⚠️ Falha ao analisar {fonte_id}: {e}")
        return ""


def run_analysis(dry_run: bool = False) -> list[dict]:
    """Executa análise de todas as páginas coletadas."""
    results = []
    print(f"🧠 Análise com Seu Nono Sabia — modelo: {OLLAMA_MODEL}")
    print()

    html_files = sorted(DATA_DIR.glob("*.html"))
    if not html_files:
        print("  ⚠️ Nenhum HTML coletado. Execute --analyze após coletar.")
        return results

    for i, html_path in enumerate(html_files):
        print(f"  [{i+1}/{len(html_files)}] Analisando {html_path.name}")
        analysis = analyze_with_sabia(str(html_path), html_path.stem)
        if analysis:
            result = {
                "fonte": html_path.stem,
                "analise": analysis,
                "analisado_em": datetime.now(timezone.utc).isoformat(),
                "modelo": OLLAMA_MODEL,
            }
            results.append(result)
            # Salva resultado
            result_path = DATA_DIR / f"analise-{html_path.stem}.json"
            with open(result_path, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            print(f"    ✅ Salvo: {result_path.name}")

    return results


def generate_empresas_update(analysis_results: list[dict]) -> str:
    """Gera conteúdo para atualizar o NOTICIAS_VALE e dados da Vale."""
    news_items = []
    for r in analysis_results:
        analysis_text = r.get("analise", "")
        if analysis_text:
            # Pega frases-chave do analysis
            lines = analysis_text.split("\n")
            key_lines = [l.strip() for l in lines if len(l.strip()) > 20][:3]
            if key_lines:
                news_items.append({
                    "data": r.get("analisado_em", datetime.now(timezone.utc).isoformat()),
                    "titulo": f"Análise ESG: {r.get('fonte', 'desconhecido')}",
                    "veiculo": "Seu Nono Sabia",
                    "href": f"/empresas/vale",
                    "resumo": " ".join(key_lines)[:200] + "...",
                })
    return news_items


# ── CLI ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    do_analyze = "--analyze" in sys.argv
    only_collect = "--collect-only" in sys.argv

    if do_analyze and not dry_run:
        # Faz collect primeiro se necessário
        collect_results = collect_all(dry_run=False)
        print(f"\n📊 Coleta concluída: {len(collect_results)} fontes")

        # Analisa
        analysis = run_analysis(dry_run=False)
        print(f"\n🧠 Análise concluída: {len(analysis)} documentos")

        # Gera atualização para empresas
        if analysis:
            news = generate_empresas_update(analysis)
            output_path = BASE_DIR / "apps" / "web" / "data" / "esg-update.json"
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(news, f, ensure_ascii=False, indent=2)
            print(f"\n📝 Atualização salva: {output_path}")

    elif only_collect:
        results = collect_all(dry_run=False)
        print(f"\n✅ Coleta concluída: {len(results)} fontes processadas")

    else:
        # Dry run ou help
        collect_all(dry_run=True)
        print(f"\n💡 Use --collect-only para baixar ou --analyze para coletar+analisar")
