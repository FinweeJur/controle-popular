#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera a base versionada de Concessoes e Parcerias de Minas Gerais (Plano 4 - PPP).

Papel no portal:
    Alimenta a rota /ambiental/ppp com contratos REAIS do Estado de MG que
    registram concessoes, parcerias publico-privadas e os contratos de apoio
    (supervisao/verificacao e estruturacao) dessas concessoes.

Fonte oficial:
    Portal da Transparencia do Estado de Minas Gerais - base de contratos
    (dados.mg.gov.br / CKAN, conjunto "fiscais-contrato"). Arquivo ja coletado
    e rastreado no repositorio:

        etl/betim/dados/ckan-mg-fiscais-contrato.json   (16.922 contratos)

Saida:
    apps/web/data/ppp-mg.json

Decisoes tecnicas:
    - Nao ha classificacao paga por API: o campo `natureza` separa o
      INSTRUMENTO da concessao dos CONTRATOS DE APOIO (supervisao, verificacao,
      estudos de estruturacao). O leitor nao deve confundir "contrato que cita
      concessao" com "a concessao em si".
    - Filtro conservador: so entram objetos que citam concessao/PPP de verdade.
      "Concessao onerosa de espaco para cantina" e afins ficam de fora - nao
      sao PPP e misturar isso seria insinuacao, que e dano.
    - CNPJ da concessionaria so entra quando tem 14 digitos; qualquer outra
      coisa (vazio, CPF) vira "Nao informado". Zero CPF.
    - Rodar de novo sobrescreve o JSON (reprocessavel a partir da fonte).
"""

from __future__ import annotations

import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[3]
ENTRADA = RAIZ / "etl/betim/dados/ckan-mg-fiscais-contrato.json"
SAIDA = RAIZ / "apps/web/data/ppp-mg.json"

FONTE = "Portal da Transparencia MG - base de contratos (CKAN dados.mg.gov.br)"
FONTE_URL = "https://www.transparencia.mg.gov.br/contratos"

# Objetos que citam concessao/PPP mas NAO sao PPP: cantina, comodato de
# aparelho, fornecimento de utilidade, licenca de software, treinamento.
FORA = re.compile(
    r"cantina|lanchonete|restaurante|refei[çc][õo]es|alimenta[çc][ãa]o|reprografia|"
    r"material escolar|comodato|glicos|glicemia|assistencia tecnica|licen[çc]a de uso|"
    r"licen[çc]as microsoft|pilotos de aeronaves|mina d[\'`]?[aá]gua|"
    r"fornecimento de g[áa]s|energia el[ée]trica em m|microgera[çc][ãa]o|"
    r"gerenciamento das manuten[çc][õo]es|agente de integra[çc][ãa]o|p[óo]s-gradua|mba",
    re.I,
)

# Um termo que situa o contrato no universo de concessoes/PPPs.
MENCAO = re.compile(
    r"concess|concession[áa]ri|parceria\s+p[úu]blico|\bPPP\b|rodoanel|mg-?050|vias do caf",
    re.I,
)
SUPERVISAO = re.compile(
    r"supervis|verificador|verifica[çc][ãa]o|aferi[çc]|monitora[çc][ãa]o|fiscaliza[çc][ãa]o",
    re.I,
)
ESTRUTURACAO = re.compile(
    r"estudo|modelag|viabilidade|estrutura[çc][ãa]o de|bndes", re.I
)


def natureza_de(objeto: str) -> str | None:
    # Ordem importa. O INSTRUMENTO comeca com "Concessao..."; a supervisao e o
    # apoio apenas CITAM a concessao - nunca sao a concessao.
    if re.match(r"^\s*concess", objeto, re.I):
        return "instrumento_concessao"
    if ESTRUTURACAO.search(objeto) and MENCAO.search(objeto):
        return "estruturacao_estudos"
    if SUPERVISAO.search(objeto) and MENCAO.search(objeto):
        return "supervisao_verificacao"
    return None

SETOR_REGEX = [
    ("rodovias", r"rodovi|mg-050|br-|rodoanel|vias do caf|liberta"),
    ("saneamento", r"saneament|esgoto|abastecimento de [áa]gua|efluente"),
    ("residuos_solidos", r"res[íi]duos|aterro|triagem"),
    ("iluminacao_publica", r"ilumina[çc][ãa]o p"),
    ("saude", r"sa[úu]de|hospital|centros de sa[úu]de|unidades de sa[úu]de"),
    ("educacao", r"educa[çc]|escola|unidade educacional"),
    ("seguranca_cidadania", r"penitenci|prisio|seguran[çc]a|ressocializa"),
    ("mobilidade", r"mobilidade|lote rodovi|transporte"),
    ("imobiliario", r"im[óo]vel|serraria|uso de espa[çc]o|patrim[ôo]nio"),
]


def setor_de(objeto: str) -> str:
    for nome, pat in SETOR_REGEX:
        if re.search(pat, objeto, re.I):
            return nome
    return "outros"


def cnpj_valido(bruto) -> str | None:
    digitos = re.sub(r"\D", "", str(bruto or ""))
    return digitos if len(digitos) == 14 else None


def main() -> None:
    contratos = json.loads(ENTRADA.read_text(encoding="utf-8"))
    registros = []
    vistos: set[str] = set()

    for c in contratos:
        objeto = c.get("objeto") or ""
        if "concess" not in objeto.lower() and "parceria p" not in objeto.lower():
            continue
        if FORA.search(objeto):
            continue
        natureza = natureza_de(objeto)
        if not natureza:
            continue

        chave = f"{c.get('numeroContrato')}/{c.get('ano')}"
        if chave in vistos:
            continue
        vistos.add(chave)

        cnpj = cnpj_valido(c.get("cnpj"))
        registros.append(
            {
                "id": f"mg-{c.get('numeroContrato')}-{c.get('ano')}",
                "numeroContrato": str(c.get("numeroContrato") or ""),
                "numeroProcesso": c.get("numeroProcesso"),
                "ano": c.get("ano"),
                "objeto": objeto,
                "natureza": natureza,
                "setor": setor_de(objeto),
                "concessionaria": c.get("fornecedor"),
                "cnpjConcessionaria": cnpj or "Nao informado",
                "valorInicial": c.get("valorInicial"),
                "valorAtual": c.get("valorAtual"),
                "dataInicio": c.get("inicioVigencia"),
                "dataFim": c.get("fimVigencia"),
                "orgao": c.get("orgaoParticipante"),
                "unidadeGestora": c.get("unidadeGestora"),
                "situacao": c.get("situacao"),
                "esfera": "estadual",
                "fonte": FONTE,
                "fonteUrl": FONTE_URL,
            }
        )

    registros.sort(key=lambda r: (r["natureza"], r["ano"] or 0))

    por_natureza = Counter(r["natureza"] for r in registros)
    por_setor = Counter(r["setor"] for r in registros)
    saida = {
        "metadados": {
            "titulo": "Concessoes e Parcerias Publico-Privadas de Minas Gerais",
            "fonte": FONTE,
            "fonteUrl": FONTE_URL,
            "geradoEm": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "total": len(registros),
            "porNatureza": dict(por_natureza),
            "porSetor": dict(por_setor.most_common()),
            "ressalva": (
                "Contratos do Estado de MG cujo objeto cita concessao ou "
                "parceria publico-privada. O campo `natureza` separa o "
                "INSTRUMENTO da concessao dos contratos de SUPERVISAO e de "
                "ESTRUTURACAO. Nem todo registro cita uma concessao em "
                "operacao: contrato de apoio nao e a PPP."
            ),
        },
        "contratos": registros,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(
        json.dumps(saida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"OK {SAIDA.name}: {len(registros)} contratos")
    for nat, n in por_natureza.most_common():
        print(f"   {nat}: {n}")
    for s, n in por_setor.most_common():
        print(f"   setor {s}: {n}")


if __name__ == "__main__":
    main()
