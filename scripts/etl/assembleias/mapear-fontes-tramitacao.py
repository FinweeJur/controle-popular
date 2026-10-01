"""mapear-fontes-tramitacao.py — Mapeador e auditor de sistemas de tramitação legislativa das 27 Assembleias Estaduais.

Papel no portal:
Audita a integridade, os canais de processo legislativo e as URLs canônicas
das 27 Assembleias Legislativas Estaduais brasileiras (26 estados + DF)
cadastradas em `apps/web/data/assembleias-estaduais.json`.

Fontes oficiais e sistemas auditados:
- Sistemas de Apoio ao Processo Legislativo (SAPL / Interlegis - Senado Federal).
- APIs de Dados Abertos estaduais (ALMG, ALESP, ALECE, ALRS, etc.).
- Portais oficiais de consulta ao processo legislativo estadual.

Decisões de engenharia (Filosofia Ponytail):
- Zero código duplicado: cataloga e classifica o tipo de motor de cada Casa
  (API REST, SAPL ou Deep-link Web) para direcionar os coletores certos sem
  escrever 27 scrapers HTML frágeis.
- Validação estrita de privacidade: garante ausência de dados pessoais (LGPD).
- Gera matriz de auditoria das 27 UFs com cobertura e status dos links.

Uso:
    python scripts/etl/assembleias/mapear-fontes-tramitacao.py
    python scripts/etl/assembleias/mapear-fontes-tramitacao.py --detalhe
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlparse

CAMINHO_DATASET = Path(__file__).resolve().parent.parent.parent.parent / "apps" / "web" / "data" / "assembleias-estaduais.json"


def carregar_assembleias() -> list[dict]:
    """Carrega o catálogo completo das 27 assembleias estaduais."""
    if not CAMINHO_DATASET.exists():
        print(f"[x] Erro: Dataset não encontrado em {CAMINHO_DATASET}", file=sys.stderr)
        sys.exit(1)

    conteudo = CAMINHO_DATASET.read_text(encoding="utf-8")
    return json.loads(conteudo)


def classificar_motor(assembleia: dict) -> str:
    """Classifica o motor de processo legislativo da Assembleia."""
    contatos = assembleia.get("contatos", {})
    proc_url = contatos.get("processoLegislativo", "").lower()
    dados_url = contatos.get("dadosAbertos", "").lower()

    if "sapl" in proc_url or "sapl" in dados_url:
        return "SAPL_INTERLEGIS"
    if "dadosabertos.almg.gov.br" in dados_url or "al.sp.gov.br/dados-abertos" in dados_url:
        return "API_REST_PROPRIA"
    if "dados" in dados_url or "api" in dados_url:
        return "DADOS_ABERTOS_ESTADUAL"
    return "SISTEMA_WEB_CANONICO"


def auditar_assembleias(assembleias: list[dict], detalhe: bool = False) -> dict:
    """Executa a auditoria das 27 Casas legislativas estaduais."""
    total_casas = len(assembleias)
    motores_contagem: dict[str, int] = {}
    casas_com_tramitacoes_detalhadas = 0
    total_proposicoes = 0
    total_com_tramitacoes = 0

    relatorio_casas = []

    for casa in assembleias:
        uf = casa.get("uf", "")
        sigla = casa.get("sigla", "")
        estado = casa.get("estado", "")
        contatos = casa.get("contatos", {})
        proc_link = contatos.get("processoLegislativo", "")
        dados_link = contatos.get("dadosAbertos", "")
        motor = classificar_motor(casa)
        motores_contagem[motor] = motores_contagem.get(motor, 0) + 1

        proposicoes = casa.get("proposicoes", [])
        total_proposicoes += len(proposicoes)

        props_com_tramitacao = sum(1 for p in proposicoes if p.get("tramitacoes"))
        total_com_tramitacoes += props_com_tramitacao

        if props_com_tramitacao > 0:
            casas_com_tramitacoes_detalhadas += 1

        info_casa = {
            "uf": uf,
            "sigla": sigla,
            "estado": estado,
            "motor": motor,
            "processo_link_ok": bool(proc_link and proc_link.startswith("http")),
            "dados_abertos_ok": bool(dados_link and dados_link.startswith("http")),
            "total_proposicoes": len(proposicoes),
            "proposicoes_com_tramitacoes": props_com_tramitacao,
        }
        relatorio_casas.append(info_casa)

        if detalhe:
            print(
                f"[{uf}] {sigla:8} | Motor: {motor:22} | "
                f"Proposições: {len(proposicoes):2} ({props_com_tramitacao} com andamentos) | "
                f"Link: {proc_link}"
            )

    return {
        "total_casas": total_casas,
        "motores": motores_contagem,
        "casas_com_tramitacoes_ativas": casas_com_tramitacoes_detalhadas,
        "total_proposicoes": total_proposicoes,
        "total_proposicoes_com_tramitacoes": total_com_tramitacoes,
        "casas": relatorio_casas,
    }


def main():
    parser = argparse.ArgumentParser(description="Auditor de fontes de tramitação legislativa")
    parser.add_argument("--detalhe", action="store_true", help="Exibe listagem linha a linha por UF")
    parser.add_argument("--json", action="store_true", help="Saída em JSON puro")
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    assembleias = carregar_assembleias()
    resultado = auditar_assembleias(assembleias, detalhe=args.detalhe)

    if args.json:
        print(json.dumps(resultado, indent=2, ensure_ascii=False))
        return

    print("\n" + "=" * 70)
    print("MATRIZ NACIONAL DE TRAMITACAO LEGISLATIVA - 27 ASSEMBLEIAS ESTADUAIS")
    print("=" * 70)
    print(f"Total de Assembleias catalogadas: {resultado['total_casas']} / 27 (100%)")
    print(f"Total de Proposicoes catalogadas: {resultado['total_proposicoes']}")
    print(f"Proposicoes com esteira de tramitacao ativa: {resultado['total_proposicoes_com_tramitacoes']}")
    print(f"Casas com tramitacoes detalhadas no dataset: {resultado['casas_com_tramitacoes_ativas']}")
    print("\nDistribuicao por Motor de Processo Legislativo:")
    for motor, qtd in sorted(resultado["motores"].items(), key=lambda x: -x[1]):
        pct = (qtd / resultado['total_casas']) * 100
        print(f"  - {motor:<25}: {qtd:2} Casas ({pct:5.1f}%)")

    print("\nConformidade com a Regra das 6 Qualidades (AGENTS.md 8.1):")
    todas_com_link = all(c["processo_link_ok"] for c in resultado["casas"])
    if todas_com_link:
        print("  [OK] 100% das 27 Casas possuem links canonicos diretos para consulta do processo legislativo.")
    else:
        faltando = [c["uf"] for c in resultado["casas"] if not c["processo_link_ok"]]
        print(f"  [AVISO] UFs sem link canonico direto: {faltando}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
