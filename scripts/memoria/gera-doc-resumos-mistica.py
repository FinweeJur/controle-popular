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

Por que: o dev revisa o texto ANTES de o calendario.ts ser trocado
(regra do fluxo de 30/09/2026). O doc mostra, por dia, o titulo e o
resumo antigos contra os novos, com a fonte curta de cada verbete, e as
medições de repetição e dos 4 elementos pedidas pelo dev em 30/09.

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

# O backup `calendario.antes.ts` foi gravado por uma versão que decodificou os
# bytes UTF-8 como cp437/cp850 — é o "s├¡tio" no lugar de "sítio". O arquivo é
# UTF-8 VÁLIDO, mas carrega o mojibake dentro. Sem reparar, a coluna "Antes" do
# doc sai ilegível. O reparo é o inverso exato: re-codifica em cp437/cp850 e
# decodifica em UTF-8, e só troca se o resultado MELHORAR (menos marcadores).
_MOJIBAKE = ("\u251c", "\u2523", "\u2520", "\u252c", "\u2550", "\u2551", "\u2560", "\ufffd")


def conta_mojibake(texto: str) -> int:
    return sum(texto.count(c) for c in _MOJIBAKE)


def reparar_mojibake(texto: str) -> str:
    """Desfaz o mojibake cp437/cp850 lido como UTF-8. Idempotente e seguro:
    devolve o original quando não há ganho. Nunca inventa caractere."""
    antes = conta_mojibake(texto)
    if antes == 0:
        return texto
    for enc in ("cp437", "cp850"):
        try:
            tentativa = texto.encode(enc).decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            continue
        if conta_mojibake(tentativa) < antes:
            return tentativa
    return texto


def desescapa(s: str) -> str:
    return (s.replace('\\"', '"').replace("\\n", " ").replace("\\t", " ")
            .replace("\\\\", "\\"))


# A coluna "Antes" é cópia literal do calendário velho, que ainda usa o termo
# antigo no sentido de PROPRIETÁRIO de bem (sítio, sapataria, fazenda). Aqui
# ele vira "proprietário" — o doc nasce alinhado à regra de nomenclatura sem
# alterar o fato histórico.
_TERMOS = (
    (re.compile(r"\bdono do s[ií]tio\b", re.I), "proprietário do sítio"),
    (re.compile(r"\bdono da sapataria\b", re.I), "proprietário da sapataria"),
    (re.compile(r"\bdono das fazendas\b", re.I), "proprietário das fazendas"),
)


def normalizar_termos(texto: str) -> str:
    for pad, sub in _TERMOS:
        texto = pad.sub(sub, texto)
    return texto


# Contador do reparo de mojibake, para o rodapé do doc sair com o número medido.
_REPARADOS = {"n": 0}


def ler_antes() -> list[dict]:
    """Parse do calendario.ts vigente (mesmo formato do gerador).

    O reparo de mojibake é por CAMPO (título, resumo, fonte), nunca no texto
    inteiro: o arquivo tem emoji (⚠️) e o encode cp437/cp850 estouraria no
    arquivo todo, deixando o mojibake passar. Campo a campo, cada string
    corrompida é reparada isoladamente."""
    bruto = ANTES.read_text(encoding="utf-8")
    reparados = 0
    entradas = []
    for bloco in BLOCOS.findall(bruto):
        dados = {}
        for k, v in CAMPO.findall(bloco):
            valor = desescapa(v)
            novo = reparar_mojibake(valor)
            if novo != valor:
                reparados += 1
            dados[k] = novo
        if "diaMes" in dados and "titulo" in dados:
            entradas.append(dados)
    if reparados:
        print(f"reparo: {reparados} campo(s) do backup com mojibake desfeito(s)")
    _REPARADOS["n"] = reparados
    return entradas


def celula(dados: dict | None) -> str:
    if not dados:
        return "—"
    partes = [f"**{normalizar_termos(dados['titulo'])}**"]
    if dados.get("ano"):
        partes.append(f"(fato de {dados['ano']})")
    if dados.get("resumo"):
        partes.append(normalizar_termos(dados["resumo"]))
    return "<br>".join(p.replace("|", "\\|") for p in partes)


def agrupar(entradas: list[dict]) -> dict[tuple, list[dict]]:
    grupos: dict[tuple, list[dict]] = {}
    for e in entradas:
        grupos.setdefault((e.get("diaMes", ""), e.get("ano", "")), []).append(e)
    return grupos


def main() -> int:
    antes = ler_antes()
    bruto_novo = NOVO.read_text(encoding="utf-8")
    # Guarda: a saída NOVA não pode ter mojibake. Se tiver, é regressão —
    # paro em vez de gravar um doc que parece certo e está torto.
    if conta_mojibake(bruto_novo) > 0:
        raise SystemExit(
            f"ABORT: {NOVO.name} tem mojibake ({conta_mojibake(bruto_novo)} marcadores) — "
            "o gerador do calendário regrediu; conserte a origem antes do doc."
        )
    depois = json.loads(bruto_novo)

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
        "- [Fontes curtas (formato do dev)](#fontes-curtas-formato-do-dev)",
        "- [Revisão dia a dia](#revisão-dia-a-dia)",
        "- [Decisão pendente do dev](#decisão-pendente-do-dev)",
        "",
        "## O que mudou",
        "",
        "Regra do dev (30/09/2026): o resumo vem do **texto-fonte**, no",
        "próprio estilo de escrita da fonte — nunca reescrito por máquina.",
        "",
        f"> **Reparo de origem:** o backup do calendário velho (coluna Antes)",
        f"> estava com mojibake — UTF-8 lido como cp437, que transforma uma",
        f"> letra acentuada em dois caracteres de desenho de caixa. O doc",
        f"> desfaz isso campo a campo: {_REPARADOS['n']} campo(s) reparado(s)",
        f"> nesta geração. A coluna Antes é o texto antigo, só legível.",
        "",
        "- **Antes:** o blog nascia sem resumo (só título), e o MST cortava",
        "  a frase no primeiro ponto — resumo de frase solta, incompleta.",
        "- **Depois:** 1-2 frases recortadas do parágrafo da fonte, cap 400.",
        "  O blog usa o corpo coletado post a post; o MST usa o parágrafo",
        "  inteiro do documento do dev.",
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
        "Dois pedidos do dev em 30/09/2026: apagar as frases que se",
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
        "## Fontes curtas (formato do dev)",
        "",
        "Padrão aprovado pelo dev (30/09/2026): `(Obra, Autor, Data)` —",
        "",
    ]
    for fonte, n in sorted(fontes.items(), key=lambda x: -x[1]):
        linhas.append(f"- **{fonte}** — {n} verbetes")
    linhas += [
        "",
        "Autor é a **FONTE**, nunca a pessoa (o dev: “Blog Aos que Virão",
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
        "## Decisão pendente do dev",
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
