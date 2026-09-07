#!/usr/bin/env python3
"""Pipeline de análise ESG da Vale — gera JSON de integração com páginas."""
import json
from pathlib import Path

DATA_DIR = Path('apps/web/data/esg')

# Análises já geradas via Ollama (llama3.2:3b)
analyses = []

# 1. ESG Home / Overview
with open(DATA_DIR / 'analise1.json') as f:
    d = json.load(f)
    analyses.append({
        'fonte': 'vale-esg-home',
        'categoria': 'overview',
        'analise': d['response'],
        'modelo': 'llama3.2:3b',
    })

# 2. Ambiental
with open(DATA_DIR / 'analise-amb.json') as f:
    d = json.load(f)
    analyses.append({
        'fonte': 'vale-environment',
        'categoria': 'environment',
        'analise': d['response'],
        'modelo': 'llama3.2:3b',
    })

# 3. Riscos (já temos do teste anterior)
with open(DATA_DIR / 'analise-teste.json') as f:
    d = json.load(f)
    analyses.append({
        'fonte': 'vale-esg-dams',
        'categoria': 'environment',
        'analise': d['response'],
        'modelo': 'llama3.2:3b',
    })

# Salva
with open(DATA_DIR / 'esg-analyses.json', 'w', encoding='utf-8') as f:
    json.dump(analyses, f, ensure_ascii=False, indent=2)

print(f'✅ {len(analyses)} análises salvas em esg-analyses.json')
for a in analyses:
    print(f"  - {a['fonte']}: {a['analise'][:80]}...")
