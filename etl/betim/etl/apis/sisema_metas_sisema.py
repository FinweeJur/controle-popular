r"""etl.apis.sisema_metas_sisema — PMI, Metas Regionais, Intervenção Ambiental e
Licenciamento do painel público "Estratégias e Planos" da SEMAD/MG, um dos 4
relatórios-filhos do menu Sisema (`docs/FONTES.md`, seção "Painel Sisema").

resourceKey `a279135b-2ca1-4f52-ab06-cb9842bbb3de`, modelId `6768507`, 19
abas (17 com dado + MENU + MENU PMI), cobrindo 2022 a 2026.

═══ POR QUE O MAPEAMENTO ANTERIOR DECLAROU "SCHEMA NÃO ACESSÍVEL", E NÃO ERA ═══

A sondagem que precedeu este coletor testou 40+ nomes de entidade contra
`/querydata` e todos vieram `CouldNotResolveSemanticQueryDefinition` — porque
`/modelsAndExploration` devolve `exploration.report.model` **sem**
`conceptualSchema` (igual ao doc do menu já registra) e os nomes testados
foram PALPITE em português/inglês ("Projetos", "Metas", "Metrics"...), não
nomes reais do modelo.

**Os nomes reais não estão em nenhum "schema" — estão no `prototypeQuery` de
CADA VISUAL do relatório**, dentro de `exploration.sections[].
visualContainers[].config` (uma string JSON por visual). Todo visual que lê
dado carrega `singleVisual.prototypeQuery.From` (mapa fonte→Entity real) e
`.Select` (cada coluna com `Property` real, dentro de `Column` para coluna
crua ou `Column` dentro de `Aggregation` para coluna somada no visual — as
duas são coluna de verdade, testável; só `Measure` é medida calculada e
falha como `Column`, ver armadilha abaixo). Varrer os 194 `visualContainers`
das 19 seções e agrupar por `Entity` destravou as 17 entidades de negócio
deste modelo — nenhuma delas aparece em `schema.entities` nem seria
adivinhada por nome. Esta é a rota que serve quando `conceptualschema` não
vem: **ler o que os próprios visuais do relatório consultam**.

═══ AS 17 ENTIDADES, E A INCONSISTÊNCIA DE NOME QUE QUASE CUSTOU 2 DELAS ═══

Uma por aba×ano (`ENTIDADES` abaixo, chave curta → nome real de `Entity`):
PMI (2022-2026), METAS REGIONAIS (2022-2026), INTERVENÇÃO AMBIENTAL
(2023-2026, a aba nasceu em 2023) e LICENCIAMENTO (2024-2026, nasceu em
2024) — bate exatamente com a cobertura já medida em `docs/FONTES.md`.

⚠️ **O nome da entidade PMI muda de grafia ano a ano, e não é normalização
nossa — é o dado de origem**: `PMI_2022`, `PMI_2025`, `PMI_2026` usam
underscore; **`"PMI 2023"` e `"PMI 2024"` usam ESPAÇO** (alguém recriou a
página em vez de duplicar, e o Power BI Desktop não força nome consistente
entre tabelas do mesmo modelo). Testado ao vivo: os dois formatos resolvem
— um com underscore em `"PMI 2023"` daria `CouldNotResolveSemanticQuery-
Definition`, silenciosamente indistinguível de "entidade não existe". O
`ENTIDADES` abaixo grava a grafia exata medida, célula a célula.

⚠️ **Nomes de coluna com ESPAÇO NO FIM, no dado de origem, não em bug de
extração**: `"Executado - Até 180 dias "` (as 4 entidades de Intervenção
Ambiental) e as duas colunas "processos formalizados até 31/12/2023 " (só
Licenciamento 2024) carregam um espaço à direita que o `Property` exige
byte a byte — remover o espaço para "limpar" o nome faz a consulta falhar
do mesmo jeito que underscore trocado por espaço.

⚠️ **`PMI_Regionais_2022` tem uma medida-armadilha idêntica à já documentada
em `tacs_mineradoras`**: a tabela do relatório mostra uma coluna chamada
"% de Execução2022" (nome colado ao ano, resíduo de copiar-colar o visual)
que é `Measure` calculada, não `Column`. Pedida como `Column` devolve HTTP
200 com `odata.error` `CouldNotResolveSemanticQueryDefinition` (confirmado
ao vivo em 2026-08-21) — por isso `ENTIDADES["metas_regionais_2022"]` não a
lista; quem quiser o percentual soma `Executado`/`Planejado` das linhas.

⚠️ **`PMI_Regionais_2022` também não tem `Regional` nos campos coletados —
e isso não é uma coluna esquecida**: nenhum dos 9 visuais da aba "METAS
REGIONAIS - 2022" projeta essa coluna (o slicer daquela página filtra por
`Meta`, não por região). Sem um visual que a use, não há como confirmar o
nome real da coluna sem adivinhar — e adivinhar é exatamente o que este
coletor se recusa a fazer (ver `AGENTS.md`/docstring de `tacs_mineradoras`).
Registrado aqui para quem for comparar 2022 com os anos seguintes: a
granularidade regional só existe a partir de 2023 nesta aba.

⚠️ **Os indicadores de LICENCIAMENTO mudam de METODOLOGIA a cada ano, não só
de nome de coluna**: 2024 mede 4 famílias de processo por prazo (LAS/RAS,
LAC/LAT com/sem EIA-RIMA, passivo pré-2024); 2025 e 2026 medem outras 4
(cadastro/LAS até 10 dias, processos pós-2024, pareceres pós-2025 até 60
dias, passivo pré-2024 finalizado). **Não existe coluna equivalente entre
2024 e 2025+** — comparar "execução do Licenciamento" ano a ano por nome de
campo estaria comparando coisas diferentes. O mesmo vale, em grau menor,
para INTERVENÇÃO AMBIENTAL: a meta de prazo mudou de 75%/25% (180/270 dias,
2023-2024) para 70%/30% (2025-2026) — texto declarado no próprio painel,
não temos coluna que carregue essa mudança, só a data de corte.

═══ RESSALVAS QUE VÃO GRAVADAS NO DADO ═══

1. **"Dados até" é declarado pelo PRÓPRIO painel, em texto, por aba×ano** —
   não é só o `refreshSchedule` do modelo. Lido nos textbox de cada seção:
   2022 a 2025 fecham em 31/12 do próprio ano (ano encerrado); **2026 vem
   parcial, "Dados até: 30/06/2026 (Atualização bimestral)"** — o ano
   corrente não está completo, e não completará: o modelo está congelado
   (abaixo). `DADOS_ATE_POR_ANO` grava essa data exata em cada linha via
   `_dados_ate`, por ano.

2. **O modelo está CONGELADO em 2026-07-13** (`refreshSchedule.
   refreshEnabled: false`, `lastRefreshTime` = `/Date(1783975436163)/` =
   2026-07-13T20:43:56Z, `nextRefreshTime` = ano 9999). Mesmo padrão do
   painel de TACs: **não é dado ao vivo**. `DADO_CONGELADO_EM` grava essa
   data em cada linha via `_modelo_congelado_em`.

3. **Publicado de uma "My workspace" pessoal** (`ownerInfo.groupDisplayName
   == "My workspace"`), não de workspace institucional — mesma ressalva de
   governança do painel de TACs.

4. **As metas são CUMULATIVAS dentro do ano, texto do próprio painel**: "o
   resultado apresentado em cada bimestre abarca o resultado total do ano
   obtido até aquele período". Cada linha de bimestre já É o acumulado —
   **somar os 5-6 bimestres de um ano multiplica o resultado**; o valor do
   ano é o do ÚLTIMO bimestre coletado, não a soma das linhas.

5. **O contrato do DSR não é documentado** (ver `_powerbi_dsr.py`) — as
   guardas de lá quebram em vez de gravar tabela plausível e errada.

Uso:

    python -m etl.apis.sisema_metas_sisema --sondar
    python -m etl.apis.sisema_metas_sisema --entidade pmi_2026
    python -m etl.apis.sisema_metas_sisema                       # tudo, grava JSON
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from etl.apis._powerbi_dsr import ErroDSR, conferir, decodificar_resposta

LOG = "[etl.apis.sisema_metas_sisema]"

# Mesmo cluster do painel de TACs — api.powerbi.com dá 403, cluster errado dá
# 401 (as duas PARECEM falta de login; não é: relatório público, sem token).
BASE = "https://wabi-brazil-south-b-primary-api.analysis.windows.net"
URL = f"{BASE}/public/reports/querydata?synchronous=true"

RESOURCE_KEY = "a279135b-2ca1-4f52-ab06-cb9842bbb3de"
DATASET_ID = "1f88f8b6-a002-49a7-9cf5-9de2c6110e77"  # model.dbName, medido ao vivo
REPORT_ID = "6965222"  # exploration.reportId, medido ao vivo
MODEL_ID = 6768507

# refreshSchedule.refreshEnabled=false + lastRefreshTime no modelo. Ver §2.
DADO_CONGELADO_EM = "2026-07-13"
WORKSPACE_DE_ORIGEM = "My workspace"

# Texto literal dos textbox de cada seção ("Dados até: DD/MM/AAAA"). Ver §1.
DADOS_ATE_POR_ANO: dict[int, str] = {
    2022: "31/12/2022",
    2023: "31/12/2023",
    2024: "31/12/2024",
    2025: "31/12/2025",
    2026: "30/06/2026",
}

RESSALVA_METAS_CUMULATIVAS = (
    "As metas são cumulativas dentro do ano (texto do próprio painel): o resultado de "
    "cada bimestre já é o acumulado do ano até aquele período. Somar os bimestres de um "
    "ano multiplica o resultado; o valor do ano é o do ÚLTIMO bimestre, não a soma das linhas."
)

TIMEOUT = 120
_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

_JANELA_INICIAL = 500
_JANELA_MAXIMA = 30_000

_SAIDA = "dados/sisema-metas-sisema.json"

# Grafia exata medida coluna a coluna contra o endpoint em 2026-08-21, via
# `prototypeQuery` dos visuais (ver docstring do módulo — não há
# `conceptualschema` disponível para este modelo). Espaço em "PMI 2023" /
# "PMI 2024" e espaço no FIM de algumas colunas são do dado de origem: não
# normalizar.
ENTIDADES: dict[str, dict] = {
    "pmi_2022": {
        "entidade": "PMI_2022",
        "aba": "PMI",
        "ano": 2022,
        "campos": ["Bimestre", "Meta", "Planejado", "Executado", "% de Execução"],
    },
    "pmi_2023": {
        "entidade": "PMI 2023",
        "aba": "PMI",
        "ano": 2023,
        "campos": ["Bimestre", "Meta", "Planejado", "Executado", "% de Execução"],
    },
    "pmi_2024": {
        "entidade": "PMI 2024",
        "aba": "PMI",
        "ano": 2024,
        "campos": ["Bimestre", "Meta", "Planejado", "Executado", "% de Execução"],
    },
    "pmi_2025": {
        "entidade": "PMI_2025",
        "aba": "PMI",
        "ano": 2025,
        "campos": ["Bimestre", "Meta", "Planejado", "Executado", "% de Execução"],
    },
    "pmi_2026": {
        "entidade": "PMI_2026",
        "aba": "PMI",
        "ano": 2026,
        "campos": ["Bimestre", "Meta", "Planejado", "Executado", "% de Execução"],
    },
    "metas_regionais_2022": {
        "entidade": "PMI_Regionais_2022",
        "aba": "METAS REGIONAIS",
        "ano": 2022,
        # Sem "Regional": nenhum visual desta aba/ano projeta a coluna (ver §).
        # "% de Execução2022" fica de fora: é Measure, falha como Column.
        "campos": ["Bimestre", "Meta", "Planejado", "Executado"],
    },
    "metas_regionais_2023": {
        "entidade": "PMI_Regionais_2023",
        "aba": "METAS REGIONAIS",
        "ano": 2023,
        "campos": ["Bimestre", "Regional", "Meta", "Planejado", "Executado"],
    },
    "metas_regionais_2024": {
        "entidade": "PMI_Regionais_2024",
        "aba": "METAS REGIONAIS",
        "ano": 2024,
        "campos": ["Bimestre", "Regional", "Meta", "Planejado", "Executado"],
    },
    "metas_regionais_2025": {
        "entidade": "PMI_Regionais_2025",
        "aba": "METAS REGIONAIS",
        "ano": 2025,
        "campos": ["Bimestre", "Regional", "Meta", "Planejado", "Executado"],
    },
    "metas_regionais_2026": {
        "entidade": "PMI_Regionais_2026",
        "aba": "METAS REGIONAIS",
        "ano": 2026,
        "campos": ["Bimestre", "Regional", "Meta", "Planejado", "Executado"],
    },
    "intervencao_ambiental_2023": {
        "entidade": "PMI_Regionais_Int_Ambiental_2023",
        "aba": "INTERVENÇÃO AMBIENTAL",
        "ano": 2023,
        # "Executado - Até 180 dias " tem espaço no FIM — do dado de origem.
        "campos": ["Bimestre", "Regional", "Planejado - Até 180 dias", "Executado - Até 180 dias ", "Planejado - Até 270 dias", "Executado - Até 270 dias"],
    },
    "intervencao_ambiental_2024": {
        "entidade": "PMI_Regionais_Int_Ambiental_2024",
        "aba": "INTERVENÇÃO AMBIENTAL",
        "ano": 2024,
        "campos": ["Bimestre", "Regional", "Planejado - Até 180 dias", "Executado - Até 180 dias ", "Planejado - Até 270 dias", "Executado - Até 270 dias"],
    },
    "intervencao_ambiental_2025": {
        "entidade": "PMI_Regionais_Int_Amb_2025",
        "aba": "INTERVENÇÃO AMBIENTAL",
        "ano": 2025,
        "campos": ["Bimestre", "Regional", "Planejado - Até 180 dias", "Executado - Até 180 dias ", "Planejado - Até 270 dias", "Executado - Até 270 dias"],
    },
    "intervencao_ambiental_2026": {
        "entidade": "PMI_Regionais_Int_Amb_2026",
        "aba": "INTERVENÇÃO AMBIENTAL",
        "ano": 2026,
        "campos": ["Bimestre", "Regional", "Planejado - Até 180 dias", "Executado - Até 180 dias ", "Planejado - Até 270 dias", "Executado - Até 270 dias"],
    },
    "licenciamento_2024": {
        "entidade": "PMI_Regionais_Licenciamento_2024",
        "aba": "LICENCIAMENTO",
        "ano": 2024,
        # Metodologia própria de 2024 — não comparável com 2025/2026 (ver §).
        # As duas últimas colunas têm espaço no FIM, do dado de origem.
        "campos": [
            "Bimestre", "Regional",
            "LAS/RAS - Planejado - Até 120 dias", "LAS/RAS - Executado - Até 120 dias",
            "LAC/LAT sem Eia/Rima - Planejado - Até 210 dias", "LAC/LAT sem Eia/Rima - Executado - Até 210 dias",
            "LAC/LAT com Eia/Rima - Planejado - Até 300 dias", "LAC/LAT com Eia/Rima - Executado - Até 300 dias",
            "Planejado - Processos formalizados até 31/12/2023 ", "Executado - Processos formalizados até 31/12/2023 ",
        ],
    },
    "licenciamento_2025": {
        "entidade": "PMI_Regionais_Licenc_2025",
        "aba": "LICENCIAMENTO",
        "ano": 2025,
        # Metodologia própria de 2025-2026 — não comparável com 2024 (ver §).
        "campos": [
            "Bimestre", "Regional",
            "Formalização de LAS Cadastro, LAS/RAS, LAC até 10 dias úteis - Planejado", "Formalização de LAS Cadastro, LAS/RAS, LAC até 10 dias úteis - Executado",
            "Processos formalizados a partir de 01/01/2024 (LAS/RAS até 90 dias; LAC/LAT sem Eia/Rima até 180 dias; LAC/LAT com Eia/Rima até 300 dias) - Planejado",
            "Processos formalizados a partir de 01/01/2024 (LAS/RAS até 90 dias; LAC/LAT sem Eia/Rima até 180 dias; LAC/LAT com Eia/Rima até 300 dias) - Executado",
            "Processos formalizados a partir de 01/01/2025 (Pareceres de LAC e LAT em até 60 dias) - Planejado",
            "Processos formalizados a partir de 01/01/2025 (Pareceres de LAC e LAT em até 60 dias) - Executado",
            "Processos formalizados antes de 01/01/2024 (em trâmite e não classificados como passivo) finalizados conforme prazo legal - Planejado",
            "Processos formalizados antes de 01/01/2024 (em trâmite e não classificados como passivo) finalizados conforme prazo legal - Executado",
        ],
    },
    "licenciamento_2026": {
        "entidade": "PMI_Regionais_Licenc_2026",
        "aba": "LICENCIAMENTO",
        "ano": 2026,
        "campos": [
            "Bimestre", "Regional",
            "Formalização de LAS Cadastro, LAS/RAS, LAC até 10 dias úteis - Planejado", "Formalização de LAS Cadastro, LAS/RAS, LAC até 10 dias úteis - Executado",
            "Processos formalizados a partir de 01/01/2024 (LAS/RAS até 90 dias; LAC/LAT sem Eia/Rima até 180 dias; LAC/LAT com Eia/Rima até 300 dias) - Planejado",
            "Processos formalizados a partir de 01/01/2024 (LAS/RAS até 90 dias; LAC/LAT sem Eia/Rima até 180 dias; LAC/LAT com Eia/Rima até 300 dias) - Executado",
            "Processos formalizados a partir de 01/01/2025 (Pareceres de LAC e LAT em até 60 dias) - Planejado",
            "Processos formalizados a partir de 01/01/2025 (Pareceres de LAC e LAT em até 60 dias) - Executado",
            "Processos formalizados antes de 01/01/2024 (em trâmite e não classificados como passivo) finalizados conforme prazo legal - Planejado",
            "Processos formalizados antes de 01/01/2024 (em trâmite e não classificados como passivo) finalizados conforme prazo legal - Executado",
        ],
    },
}


# ────────────────────────────── HTTP / pedido ───────────────────────────
#
# Via `curl` em subprocesso, não `requests`: nesta classe de sandbox o socket
# do Python é bloqueado (`PermissionError: [WinError 10013]`, confirmado ao
# vivo — `tacs_mineradoras.py` documenta o mesmo e teve de verificar "por
# fora do módulo"). Aqui a ida por `curl` é o próprio módulo, não um atalho
# de depuração: `--sondar` e a extração real rodam de ponta a ponta sem
# depender de socket do Python.

_CURL_MARCADOR_STATUS = b"\n<<<SISEMA_HTTP_STATUS>>>"


def montar_pedido(entidade: str, campos: list[str], janela: int) -> dict:
    """Espelha byte a byte a forma do pedido confirmada ao vivo em
    2026-08-21 (ver docstring). O endpoint é exigente com a forma;
    "simplificar" o envelope costuma render 400 sem explicação."""
    fonte = "e"
    seleção = [
        {
            "Column": {"Expression": {"SourceRef": {"Source": fonte}}, "Property": campo},
            "Name": f"{fonte}.{campo}",
        }
        for campo in campos
    ]
    return {
        "version": "1.0.0",
        "queries": [{
            "Query": {"Commands": [{"SemanticQueryDataShapeCommand": {
                "Query": {
                    "Version": 2,
                    "From": [{"Name": fonte, "Entity": entidade, "Type": 0}],
                    "Select": seleção,
                },
                "Binding": {
                    "Primary": {"Groupings": [{"Projections": list(range(len(campos)))}]},
                    "DataReduction": {"DataVolume": 3, "Primary": {"Window": {"Count": janela}}},
                    "Version": 1,
                },
            }}]},
            "QueryId": "",
            "ApplicationContext": {
                "DatasetId": DATASET_ID,
                "Sources": [{"ReportId": REPORT_ID, "VisualId": ""}],
            },
        }],
        "cancelQueries": [],
        "modelId": MODEL_ID,
    }


def _consultar(pedido: dict) -> dict:
    """POST via `curl --compressed` em subprocesso (ver nota acima). O corpo
    vai por stdin (`--data-binary @-`) para não bater limite de linha de
    comando do Windows nem sofrer escaping de shell; a resposta some com um
    marcador de status ao final para separar corpo de `%{http_code}` sem
    arriscar colidir com o JSON (que nunca contém o marcador)."""
    corpo = json.dumps(pedido, ensure_ascii=False).encode("utf-8")
    cmd = [
        "curl", "--compressed", "-s", "--max-time", str(TIMEOUT),
        "-X", "POST",
        "-H", f"X-PowerBI-ResourceKey: {RESOURCE_KEY}",
        "-H", "Content-Type: application/json;charset=UTF-8",
        "-H", f"User-Agent: {_UA}",
        "--data-binary", "@-",
        "-w", _CURL_MARCADOR_STATUS.decode("ascii") + "%{http_code}",
        URL,
    ]
    try:
        r = subprocess.run(cmd, input=corpo, capture_output=True, timeout=TIMEOUT + 10)
    except FileNotFoundError as e:
        raise RuntimeError(f"{LOG} `curl` não encontrado no PATH — necessário para este coletor.") from e
    except subprocess.TimeoutExpired as e:
        raise RuntimeError(f"{LOG} curl estourou o timeout de {TIMEOUT}s.") from e
    if r.returncode != 0:
        raise RuntimeError(
            f"{LOG} curl saiu com código {r.returncode}: {r.stderr.decode('utf-8', 'replace')[:400]}"
        )
    bruto = r.stdout
    if _CURL_MARCADOR_STATUS not in bruto:
        raise RuntimeError(f"{LOG} saída do curl sem o marcador de status esperado — "
                            f"formato de resposta mudou. Início: {bruto[:200]!r}")
    corpo_resp, _, status_bruto = bruto.rpartition(_CURL_MARCADOR_STATUS)
    try:
        status = int(status_bruto.decode("ascii").strip())
    except ValueError:
        status = None
    if status in (401, 403):
        raise RuntimeError(
            f"{LOG} HTTP {status} do endpoint. ATENÇÃO à pista falsa: cluster errado "
            f"responde 401 e api.powerbi.com responde 403 — os dois PARECEM falta de login, "
            f"mas este relatório é público e não usa token. Confira o cluster ({BASE}) e o "
            f"header X-PowerBI-ResourceKey antes de procurar autenticação. "
            f"Corpo: {corpo_resp[:400].decode('utf-8', 'replace')!r}"
        )
    if status is None or not (200 <= status < 300):
        raise RuntimeError(
            f"{LOG} HTTP {status} do endpoint. Corpo: {corpo_resp[:400].decode('utf-8', 'replace')!r}"
        )
    try:
        return json.loads(corpo_resp.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        raise RuntimeError(
            f"{LOG} resposta HTTP {status} não é JSON UTF-8 válido — lembrete: sem "
            f"`--compressed` o corpo vem GZIP com Content-Type de JSON e o parse morre em "
            f"'invalid start byte 0x8b'. Início: {corpo_resp[:200]!r}"
        ) from e


def _buscar_entidade(chave: str, verboso: bool = True) -> dict:
    """Sobe a janela até a resposta vir MENOR que ela — só isso PROVA que a
    tabela acabou (mesmo raciocínio de `tacs_mineradoras._buscar_entidade`)."""
    spec = ENTIDADES[chave]
    janela = _JANELA_INICIAL
    while True:
        resposta = _consultar(montar_pedido(spec["entidade"], spec["campos"], janela))
        tabela = decodificar_resposta(resposta)
        diag = conferir(tabela, janela=janela)
        if not diag.get("janela_cheia"):
            if verboso:
                print(f"{LOG} {chave} ({spec['entidade']!r}): {len(tabela)} linha(s) "
                      f"(janela {janela}, fim provado). herdadas por R: "
                      f"{diag.get('celulas_herdadas_por_R')}, nulas por Ø: "
                      f"{diag.get('celulas_nulas_por_Ø')}.")
            return {"tabela": tabela, "diagnostico": diag, "janela": janela}
        if janela >= _JANELA_MAXIMA:
            raise RuntimeError(
                f"{LOG} {chave}: a janela chegou ao teto ({_JANELA_MAXIMA}) e a resposta ainda "
                f"veio cheia — não consigo PROVAR que li a tabela inteira. Recuso devolver "
                "contagem que pode estar truncada."
            )
        janela = min(janela * 4, _JANELA_MAXIMA)
        if verboso:
            print(f"{LOG} {chave}: janela cheia, subindo para {janela}.")


# O DSR manda número como STRING quando o double não faz round-trip limpo em
# JSON (mesma armadilha documentada em `tacs_mineradoras`, ex.: "% de
# Execução" chegou como "1.5781863636363638"). Normalizado uma vez, na
# gravação — quem consome o JSON já recebe número de verdade.
_RE_NUMERO_DSR = re.compile(r"^-?\d+(?:\.\d+)?$")


def _normalizar_numero(v: object) -> object:
    if isinstance(v, str) and _RE_NUMERO_DSR.match(v):
        return int(v) if "." not in v else float(v)
    return v


def _linhas_com_ressalva(tabela, chave: str) -> list[dict]:
    """As ressalvas viajam EM CADA LINHA, não só no cabeçalho do arquivo —
    mesmo padrão de `tacs_mineradoras._linhas_com_ressalva`: cabeçalho se
    perde quando a lista é copiada para outro lugar."""
    spec = ENTIDADES[chave]
    ano = spec["ano"]
    prefixo = "e."
    saida = []
    for linha in tabela.linhas:
        limpa = {
            (k[len(prefixo):] if k.startswith(prefixo) else k): _normalizar_numero(v)
            for k, v in linha.items()
        }
        limpa["_entidade"] = chave
        limpa["_aba"] = spec["aba"]
        limpa["_ano"] = ano
        limpa["_dados_ate"] = DADOS_ATE_POR_ANO[ano]
        limpa["_modelo_congelado_em"] = DADO_CONGELADO_EM
        saida.append(limpa)
    return saida


def coletar(chaves: list[str] | None = None, verboso: bool = True) -> dict:
    chaves = chaves or list(ENTIDADES)
    blocos, diagnosticos = {}, {}
    for chave in chaves:
        if chave not in ENTIDADES:
            raise SystemExit(f"{LOG} entidade desconhecida: {chave!r} (tem: {sorted(ENTIDADES)})")
        resultado = _buscar_entidade(chave, verboso=verboso)
        blocos[chave] = _linhas_com_ressalva(resultado["tabela"], chave)
        diagnosticos[chave] = {
            "entidade": ENTIDADES[chave]["entidade"],
            "aba": ENTIDADES[chave]["aba"],
            "ano": ENTIDADES[chave]["ano"],
            "linhas": len(blocos[chave]),
            "colunas": resultado["tabela"].colunas,
            **{k: v for k, v in resultado["diagnostico"].items() if k != "aviso"},
        }
    return {
        "fonte": "semad_mg_painel_sisema_estrategias_planos",
        "fonte_nome": 'Painel Sisema — "Estratégias e Planos" (PMI/Metas Regionais/'
                      "Intervenção Ambiental/Licenciamento) — SEMAD/MG (Power BI público)",
        "resource_key": RESOURCE_KEY,
        "modelo_id": MODEL_ID,
        "dado_congelado_em": DADO_CONGELADO_EM,
        "dado_ao_vivo": False,
        "ressalva_congelamento": (
            f"O painel declara refreshEnabled=false; o modelo está congelado em "
            f"{DADO_CONGELADO_EM} e NÃO reflete a situação atual do PMI/metas."
        ),
        "workspace_de_origem": WORKSPACE_DE_ORIGEM,
        "ressalva_workspace": (
            "O relatório foi publicado de uma 'My workspace' pessoal, não de workspace "
            "institucional — depende de uma conta individual, sem governança de área."
        ),
        "ressalva_formato": (
            "O formato DSR do Power BI não é documentado e pode mudar sem aviso; a coleta "
            "quebra de propósito se mudar, em vez de gravar tabela plausível e errada."
        ),
        "dados_ate_por_ano": DADOS_ATE_POR_ANO,
        "ressalva_dados_ate": (
            "'Dados até' é declarado pelo próprio painel (texto em cada aba), não inferido: "
            "2022-2025 são anos encerrados (até 31/12); 2026 vem PARCIAL (até 30/06/2026) e "
            "não completará — o modelo está congelado desde 2026-07-13."
        ),
        "ressalva_metas_cumulativas": RESSALVA_METAS_CUMULATIVAS,
        "ressalva_metodologia_licenciamento": (
            "Os indicadores de LICENCIAMENTO mudam de definição entre 2024 e 2025-2026 "
            "(famílias de processo diferentes); os de INTERVENÇÃO AMBIENTAL mudam a meta de "
            "prazo entre 2023-2024 (75%/25%) e 2025-2026 (70%/30%). Não comparar por nome de "
            "campo entre esses grupos de anos como se fosse o mesmo indicador."
        ),
        "coletado_em": datetime.now(timezone.utc).isoformat(),
        "diagnostico": diagnosticos,
        "dados": blocos,
    }


def exportar(caminho: str = _SAIDA, chaves: list[str] | None = None) -> None:
    pacote = coletar(chaves)
    if not any(pacote["dados"].values()):
        print(f"{LOG} ABORT: nada coletado — não sobrescrevo {caminho}.", file=sys.stderr)
        sys.exit(1)
    Path(caminho).parent.mkdir(parents=True, exist_ok=True)
    Path(caminho).write_text(json.dumps(pacote, ensure_ascii=False, indent=1), encoding="utf-8")
    total = sum(len(v) for v in pacote["dados"].values())
    print(f"{LOG} {total} linha(s) em {caminho} (congelado em {DADO_CONGELADO_EM}).")


def sondar(chaves: list[str] | None = None) -> None:
    pacote = coletar(chaves)
    print(f"{LOG} SONDAGEM (nada gravado) — congelado em {DADO_CONGELADO_EM}, "
          f"origem: {WORKSPACE_DE_ORIGEM!r}")
    for chave, diag in pacote["diagnostico"].items():
        print(f"  {chave} [{diag['aba']} {diag['ano']}] entidade={diag['entidade']!r}: "
              f"{diag['linhas']} linha(s) · colunas: {diag['colunas']}")
        amostra = pacote["dados"][chave][:1]
        if amostra:
            print(f"    1ª: {json.dumps(amostra[0], ensure_ascii=False)[:300]}")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("--sondar", action="store_true", help="mede e imprime, sem gravar")
    p.add_argument("--entidade", action="append", choices=sorted(ENTIDADES),
                   help="restringe a uma entidade (repetível)")
    p.add_argument("--saida", default=_SAIDA)
    args = p.parse_args()
    try:
        if args.sondar:
            sondar(args.entidade)
        else:
            exportar(args.saida, args.entidade)
    except ErroDSR as e:
        print(f"{LOG} FALHA NA DECODIFICAÇÃO (de propósito, para não gravar dado torto):\n{e}",
              file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
