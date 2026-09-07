#!/usr/bin/env python3
"""
Baixa PDFs restantes do portal ESG da Vale.

Usa links extraídos dos HTMLs coletados (18 fontes).
Salva em apps/web/data/esg/ com nomes descritivos.
Registra metadados em apps/web/data/esg/meta/.
"""
import json, re, time, urllib.request
from pathlib import Path
from datetime import datetime, timezone

DATA_DIR = Path('apps/web/data/esg')
META_DIR = DATA_DIR / 'meta'
USER_AGENT = 'Controle-Popular/1.0 (controlepopular.com.br)'
REQUEST_DELAY = 2

# Links de PDFs confirmados nos HTMLs coletados
PDF_URLS = [
    ("vale-esg-climate-pdf", "https://vale.com/documents/44618/387477/POL0012-G_Mud_Clim_i.pdf/4d00aad8-96a3-bf85-a1e1-12f95f66f30d?version=3.1&t=1764891755125&download=false", "Politica_Mudancas_Climaticas_Vale.pdf"),
    ("vale-esg-ghg-pdf", "https://vale.com/documents/44618/5301309/Vale+SA-07-04-2025-CORPORATE-14-30.pdf/dc5bd57b-2247-553e-33dc-b926b87f77b0?version=1.5&t=1773256616146&download=false&_gl=1*1lcko0d*_gcl_au*ODQ3MDIwODguMTc4MTE5ODkxMA..*_ga*NjQ4MzM3MDE0LjE3ODExOTg5MTA.*_ga_BNK5C1QYMC*czE3ODI4NDA1OTYkbzQ3JGcxJHQxNzgyODQzMDMyJGo1NiRsMCRoODYwMzc1NjQx", "Vale_SA_CDP_Relatorio_Corporativo_2025.pdf"),
    ("vale-natureza-pdf", "https://vale.com/documents/44618/436238/VALE_Vale%26Natureza.pdf/fb444623-c6cd-bd1b-497e-b1b4832fda78?version=1.2&t=1773172120332&download=false&_gl=1*1h5u8rh*_gcl_au*ODQ3MDIwODguMTc4MTE5ODkxMA..*_ga*NjQ4MzM3MDE0LjE3ODExOTg5MTA.*_ga_BNK5C1QYMC*czE3ODI4NDA1OTYkbzQ3JGcxJHQxNzgyODQzMDMyJGo1NiRsMCRoODYwMzc1NjQx", "Vale_Vale_Natureza_2024.pdf"),
]

def download_pdf(url_id: str, url: str, filename: str) -> dict:
    """Baixa um PDF e salva com metadados."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=60) as resp:
            content = resp.read()
            ext = ".pdf"
            path = DATA_DIR / f"{filename}{ext}"
            with open(path, 'wb') as f:
                f.write(content)
            meta = {
                "id": url_id,
                "url": url,
                "filename": str(path),
                "size_bytes": len(content),
                "sha256": __import__('hashlib').sha256(content).hexdigest(),
                "downloaded_at": datetime.now(timezone.utc).isoformat(),
                "status": "ok",
            }
            return meta
    except Exception as e:
        print(f"  ⚠️ Falha {url_id}: {e}")
        return {"id": url_id, "url": url, "status": "failed", "error": str(e)}

def main():
    META_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    
    print(f"📥 Baixando {len(PDF_URLS)} PDFs do portal ESG da Vale...")
    for url_id, url, filename in PDF_URLS:
        print(f"  [{url_id}] {filename[:60]}...")
        time.sleep(REQUEST_DELAY)
        meta = download_pdf(url_id, url, filename)
        results.append(meta)
        
        # Salva metadado individual
        meta_path = META_DIR / f"{url_id}.json"
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
        
        if meta.get("status") == "ok":
            print(f"    ✅ {meta['size_bytes']:,} bytes")
        else:
            print(f"    ❌ {meta.get('error', 'desconhecido')}")
    
    # Salva resumo geral
    with open(DATA_DIR / 'pdfs-download-log.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    ok_count = sum(1 for r in results if r.get('status') == 'ok')
    print(f"\n✅ {ok_count}/{len(results)} PDFs baixados com sucesso")
    print(f"📝 Log salvo em esg/pdfs-download-log.json")

if __name__ == '__main__':
    main()
