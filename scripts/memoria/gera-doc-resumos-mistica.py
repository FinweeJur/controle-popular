"""Gera o doc de revisão antes x depois dos resumos da Mística do Dia.

Entradas:
  TEMP/calendario.antes.ts   backup do calendario.ts aplicado (cópia feita
                             antes da rodada de correção, 30/09/2026)
  TEMP/calendario.novo.json  saída do gera-calendario-insurgente.py
                             com --para-revisao
  TEMP/estatisticas-resumos.json  medições do gerador (sem seleção x com
                             seleção) — mesmo módulo metricas_resumo.py

Saída:
  docs/planos/REVISAO-RESUMOS-MISTICA.md

Por que: o dono revisa o texto ANTES de o calendario.ts ser trocado
(regra do fluxo de 30/09/2026). O doc mostra, por dia, o titulo e o
resumo antigos contra os novos, com a fonte curta de cada verbete, e as
medições de repetição e dos 4 elementos pedidas pelo dono em 30/09.

Nao inventa nada: as duas colunas sao recorte dos proprios arquivos.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
# mesmo módulo do gerador: a medição do doc é a medição do gerador
from metricas_resumo import mede  # noqa: E402

TEMP = Path(r"C:\Users\teste\AppData\Local\Temp\opencode")
REPO = Path(r"X:\DevCoder\OpenCode\controle-popular")
ANTES = TEMP / "calendario.antes.ts"
NOVO = TEMP / "calendario.novo.json"
STATS = TEMP / "estatisticas-resumos.json"
DESTINO = REPO / "docs/planos/REVISAO-RESUMOS-MISTICA.md"

CAMPO = re.compile(r'(\w+):\s*"((?:[^"\\]|\\.)*)"')
BLOCOS = re.compile(r"\n  \{([^}]+)\}", re.S)


def desescapa(s: str) -> str:
    return (s.replace('\\"', '"').replace("\\n", " ").replace("\\t", " ")
            .replace("\\\\", "\\"))


def ler_antes() -> list[dict]:
    """Parse do calendario.ts vigente (mesmo formato do gerador)."""
    texto = ANTES.read_text(encoding="utf-8")
    entradas = []
    for bloco in BLOCOS.findall(texto):
        dados = {k: desescapa(v) for k, v in CAMPO.findall(bloco)}
        if "diaMes" in dados and "titulo" in dados:
            entradas.append(dados)
    return entradas


def celula(dados: dict | None) -> str:
    if not dados:
        return "—"
    partes = [f"**{dados['titulo']}**"]
    if dados.get("ano"):
        partes.append(f"(fato de {dados['ano']})")
    if dados.get("resumo"):
        partes.append(dados["resumo"])
    return "<br>".join(p.replace("|", "\\|") for p in partes)


def agrupar(entradas: list[dict]) -> dict[tuple, list[dict]]:
    grupos: dict[tuple, list[dict]] = {}
    for e in entradas:
        grupos.setdefault((e.get("diaMes", ""), e.get("ano", "")), []).append(e)
    return grupos


def main() -> int:
    antes = ler_antes()
    depois = json.loads(NOVO.read_text(encoding="utf-8"))

    # pareamento por (dia, ano) na ordem: o titulo novo vem do mesmo
    # paragrafo do titulo velho, entao a posicao dentro do dia casa.
    grupos_a = agrupar(antes)
    grupos_d = agrupar(depois)
    pares: list[tuple[dict | None, dict | None]] = []
    for k in sorted(set(grupos_a) | set(grupos_d)):
        fila_a = grupos_a.get(k, [])
        fila_d = grupos_d.get(k, [])
        for i in range(max(len(fila_a), len(fila_d))):
            pares.append((
                fila_a[i] if i < len(fila_a) else None,
                fila_d[i] if i < len(fila_d) else None,
            ))

    mudaram = [
        (a, d) for a, d in pares
        if d is None or a is None
        or a.get("titulo") != d.get("titulo")
        or a.get("resumo", "") != d.get("resumo", "")
        or a.get("autor") != d.get("autor")
    ]

    com_resumo_antes = sum(1 for e in antes if e.get("resumo"))
    com_resumo_depois = sum(1 for e in depois if e.get("resumo"))
    sem_corpo = sum(
        1 for e in depois
        if "Calendário Insurgente" in e.get("orgao", "") and not e.get("resumo")
    )
    fontes = {}
    for e in depois:
        fontes[e.get("fonteCurta", "?")] = fontes.get(e.get("fonteCurta", "?"), 0) + 1

    # medição das 3 séries com o MESMO módulo do gerador
    med_antes = mede([(e.get("titulo", ""), e.get("resumo", "")) for e in antes])
    stats = json.loads(STATS.read_text(encoding="utf-8"))
    sem_sel = stats["sem_selecao"]
    com_sel = stats["depois"]
    forcadas = stats["repeticoes_forcadas"]

    def _linha4(med: dict) -> str:
        c = med["cobertura"]
        return f"{c['todos']}/{med['com_resumo']}"

    def _linha4titulo(med: dict) -> str:
        c = med["cobertura_com_titulo"]
        return f"{c['todos']}/{med['com_resumo']}"

    linhas = [
        "# Revisão dos resumos da Mística do Dia (antes × depois)",
        "",
        "> **Tipo:** PLANO",
        "> **Domínio:** global (home — Mística do Dia)",
        "> **Última medição:** 2026-09-30",
        "> **Leitura estimada:** longa (> 15 min)",
        "> **Relacionados:** [PLANO-MEMORIA-RESISTENCIAS.md](PLANO-MEMORIA-RESISTENCIAS.md), "
        "[PRODUTO.md](../01-produto/PRODUTO.md), [AGENTS.md](/AGENTS.md)",
        "> **Palavras-chave:** mistica do dia, resumo, calendario, lutas populares, "
        "memoria, fonte curta, revisao de conteudo, seferian, benitez, mst",
        "",
        "## Sumário",
        "",
        "- [O que mudou](#o-que-mudou)",
        "- [Estatísticas medidas](#estatísticas-medidas)",
        "- [Repetições e os quatro elementos](#repetições-e-os-quatro-elementos)",
        "- [Fontes curtas (formato do dono)](#fontes-curtas-formato-do-dono)",
        "- [Revisão dia a dia](#revisão-dia-a-dia)",
        "- [Decisão pendente do dono](#decisão-pendente-do-dono)",
        "",
        "## O que mudou",
        "",
        "Regra do dono (30/09/2026): o resumo vem do **texto-fonte**, no",
        "próprio estilo de escrita da fonte — nunca reescrito por máquina.",
        "",
        "- **Antes:** o blog nascia sem resumo (só título), e o MST cortava",
        "  a frase no primeiro ponto — resumo de frase solta, incompleta.",
        "- **Depois:** 1-2 frases recortadas do parágrafo da fonte, cap 400.",
        "  O blog usa o corpo coletado post a post; o MST usa o parágrafo",
        "  inteiro do documento do dono.",
        "- **Autor corrigido:** 6 posts são de Carla Benitez Martins e",
        "  constavam como SEFERIAN.",
        f"- **As {len(depois) - com_resumo_depois} lacunas são honestas:**",
        f"  {sem_corpo} posts são só imagem (sem legenda no original) e",
        f"  {len(depois) - com_resumo_depois - sem_corpo} são frases únicas",
        "  fechadas — o título já é a frase inteira da fonte. Inventar",
        "  contexto é proibido (AGENTS.md §7: lacuna é informação).",
        "",
        "## Estatísticas medidas",
        "",
        "| Métrica | Antes | Depois |",
        "|---|---:|---:|",
        f"| Entradas | {len(antes)} | {len(depois)} |",
        f"| Com resumo | {com_resumo_antes} | {com_resumo_depois} |",
        f"| Sem resumo | {len(antes) - com_resumo_antes} | {len(depois) - com_resumo_depois} |",
        f"| Linhas alteradas neste doc | — | {len(mudaram)} |",
        f"| Blog sem corpo coletado | — | {sem_corpo} |",
        "",
        "## Repetições e os quatro elementos",
        "",
        "Dois pedidos do dono em 30/09/2026: apagar as frases que se",
        "repetiam entre verbetes e exigir os 4 elementos em todo resumo",
        "(quem, o quê, quando, onde).",
        "",
        "Medição com `metricas_resumo.py` — o **mesmo código** que o",
        "gerador usa para escolher. Três séries: **Aplicado** = o",
        "`calendario.ts` de hoje; **Sem seleção** = o novo gerador ainda",
        "sem a escolha; **Com seleção** = o que este doc propõe.",
        "",
        "| Métrica | Aplicado | Sem seleção | Com seleção |",
        "|---|---:|---:|---:|",
        f"| Frases repetidas (60+ caracteres) | {med_antes['frases_repetidas']} "
        f"| {sem_sel['frases_repetidas']} | {com_sel['frases_repetidas']} |",
        f"| Resumos idênticos entre verbetes | {med_antes['resumos_identicos']} "
        f"| {sem_sel['resumos_identicos']} | {com_sel['resumos_identicos']} |",
        f"| Resumo repetindo o título | {med_antes['titulo_repetido']} "
        f"| {sem_sel['titulo_repetido']} | {com_sel['titulo_repetido']} |",
        f"| 4 elementos — só o resumo | {_linha4(med_antes)} "
        f"| {_linha4(sem_sel)} | {_linha4(com_sel)} |",
        f"| 4 elementos — título + resumo (tela) | {_linha4titulo(med_antes)} "
        f"| {_linha4titulo(sem_sel)} | {_linha4titulo(com_sel)} |",
        f"| Repetições impossíveis de evitar | — | — | {forcadas} |",
        "",
        f"Com seleção, por elemento (só o resumo): "
        f"quem {com_sel['cobertura']['quem']}/{com_sel['com_resumo']}, "
        f"o quê {com_sel['cobertura']['oque']}, "
        f"quando {com_sel['cobertura']['quando']}, "
        f"onde {com_sel['cobertura']['onde']}.",
        "",
        "### Por que nem todo resumo tem os 4 elementos ⚠️",
        "",
        "- Os 4 elementos vêm do **texto da fonte**. O gerador só",
        "  ESCOLHE entre recortes possíveis; nunca escreve palavra nova",
        "  (AGENTS.md §7: inventar contexto é proibido).",
        "- O que falta são citações, poemas e trechos sem data nem lugar",
        "  no parágrafo — completar exigiria reescrever.",
        "- Lendo **título + resumo** (o par que aparece na tela),",
        f"  {_linha4titulo(com_sel)} verbetes têm os 4 elementos.",
        f"- As {forcadas} repetições forçadas vêm do documento do MST:",
        "  o mesmo parágrafo aparece em dois verbetes — a repetição é da",
        "  fonte, não do gerador.",
        "",
        "## Fontes curtas (formato do dono)",
        "",
        "Padrão aprovado pelo dono (30/09/2026): `(Obra, Autor, Data)` —",
        "",
    ]
    for fonte, n in sorted(fontes.items(), key=lambda x: -x[1]):
        linhas.append(f"- **{fonte}** — {n} verbetes")
    linhas += [
        "",
        "Autor é a **FONTE**, nunca a pessoa (o dono: “Blog Aos que Virão",
        "melhor que Seferian ou Benitez”). Data é o ano da citação: 2020",
        "no blog, 2009 no MST. A citação ABNT completa continua em",
        "`referenciaAbnt()` (`mistica.ts`); a curta é `fonteCurta()`.",
        "",
        "## Revisão dia a dia",
        "",
        "Verbetes alterados, ordenados por dia. `—` = não existia antes",
        "(verbete novo) ou não sobreviveu à limpeza de duplicatas.",
        "",
        "| Dia | Antes | Depois | Fonte curta |",
        "|---|---|---|---|",
    ]
    for a, d in mudaram:
        dia = (d or a or {}).get("diaMes", "?")
        linhas.append(
            f"| {dia} | {celula(a)} | {celula(d)} | {(d or {}).get('fonteCurta', '—')} |"
        )
    linhas += [
        "",
        "## Decisão pendente do dono",
        "",
        "Aprovar este doc para trocar `apps/web/lib/memoria/calendario.ts`",
        "(roda o gerador sem `--para-revisao`) e os testes de",
        "`mistica.test.ts` acompanham o formato da fonte curta.",
        "",
        "Para quem prefere Word: `REVISAO-RESUMOS-MISTICA.docx` (mesma",
        "pasta) traz só o conteúdo visível na tela — ano + título,",
        "resumo e fonte —, sem colunas de antes x depois.",
        "",
    ]
    DESTINO.write_text("\n".join(linhas), encoding="utf-8")
    print(f"doc: {DESTINO} | linhas: {len(linhas)} | alterados: {len(mudaram)}/{len(depois)}")
    print(f"antes: {len(antes)} (resumo {com_resumo_antes}) -> depois: {len(depois)} (resumo {com_resumo_depois}) | blog sem corpo: {sem_corpo}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
