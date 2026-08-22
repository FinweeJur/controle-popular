r"""etl.apis.sisema_fiscalizacao_barragens — autos de infração, gestão e
classificação de barragens, barragens em emergência, denúncias e fiscalização
ambiental, do painel público "Outros Indicadores" da SEMAD/SISEMA (MG).

Igual a `etl.apis.tacs_mineradoras`: relatório Power BI embutido, sem login;
a decodificação do DSR está em `etl.apis._powerbi_dsr`, importada aqui, não
reescrita.

═══ O PAINEL É UM MENU QUE ESCONDE 4 RELATÓRIOS-FILHOS ═══

O link que circula publicamente ("Painel de Termos de Compromisso de
Barragens de Mineração") não tem dado nenhum — é um MENU com 2 abas. O dado
está em 4 relatórios-filhos, mapeados em `docs/FONTES.md` §"Painel Sisema".
Este módulo coleta o FILHO `resourceKey=6f0dee31-708d-42fd-ad2d-9a70e2f49dbc`
(modelId 5910103, "Outros Indicadores", 30 abas), que sustenta as 6 abas de
maior valor público listadas no mapeamento desta tarefa: AUTOS DE INFRAÇÃO,
GESTÃO DE BARRAGENS, CLASSIFICAÇÃO DE BARRAGENS, BARRAGENS EM EMERGÊNCIA,
DENÚNCIAS, FISCALIZAÇÃO.

═══ TRÊS RESSALVAS QUE VIAJAM COLADAS AO DADO (mesmo padrão de tacs) ═══

1. **CONGELADO em 2026-08-19T18:27:40** (`refreshEnabled: false`,
   `lastRefreshTime` do modelo, medido ao vivo em 2026-08-21 contra
   `modelsAndExploration`). Não é dado ao vivo.
2. **Publicado de uma "My workspace" pessoal** (`ownerInfo.groupDisplayName`
   do relatório-filho) — mesma ressalva de governança que o painel de TACs.
3. **O contrato do DSR não é documentado.** Guardas erguem em vez de
   adivinhar.

═══ COMO AS ENTIDADES REAIS FORAM ACHADAS (schema.entities vem VAZIO) ═══

`modelsAndExploration` não devolve schema — `entidades: 0`. As 5 entidades
abaixo NÃO vieram de tentativa/erro contra o endpoint de query: vieram de
**ler os visuais do próprio relatório**, que o mesmo JSON do menu já traz em
`exploration.sections[].visualContainers[].config` (cada visual carrega um
`prototypeQuery` com `From[].Entity` e `Select[]` — a mesma técnica que
`tacs_mineradoras.py` documenta como "o único jeito de saber a que entidade
uma propriedade pertence"). Cruzando isso com os `filters` de seção/visual
(que também referenciam `Column.Expression.SourceRef.Entity`) dá a lista de
colunas REALMENTE usadas nas 6 abas-alvo — não um chute de nomes genéricos.

O primeiro mapeamento desta tarefa (`scratchpad/sisema_painel_...json`, de
sessão anterior) listava as 5 entidades com um conjunto GENÉRICO idêntico de
colunas ("ID, Nome, Descrição, Data, Status, Tipo, Município, Ano, Número")
para TODAS elas — sinal de que eram placeholder, não medição. Refeito aqui
por entidade, os nomes reais e as colunas são completamente outros (nenhuma
das 5 entidades tem uma coluna literalmente chamada "Nome" ou "Descrição").
Cada coluna abaixo foi ainda **confirmada individualmente contra o endpoint
de query** (uma consulta por nome, janela 5, igual ao itinerário de
`tacs_mineradoras.py`) antes de entrar em `ENTIDADES`.

| chave interna | entidade real (From.Entity) | aba(s) que sustenta |
|---|---|---|
| `autos_infracao` | `Autos_Infracao_Completa` | AUTOS DE INFRAÇÃO |
| `gestao_e_classificacao_barragens` | `Barragens_Geral` | GESTÃO DE BARRAGENS **e** CLASSIFICAÇÃO DE BARRAGENS (as duas abas usam a MESMA entidade — confirmado varrendo as duas seções separadamente) |
| `barragens_emergencia` | `Barragens em Emergencia` | BARRAGENS EM EMERGÊNCIA |
| `denuncias` | `Denuncias` | DENÚNCIAS |
| `fiscalizacao` | `Fiscalização_Completa_Gaia` | FISCALIZAÇÃO |

Todas as 6 abas-alvo têm lastro. Nenhuma ficou sem entidade.

⚠️ **Uma entidade-DECOY descartada**: os filtros da aba AUTOS DE INFRAÇÃO
também referenciam uma entidade `Autos_Infracao` (SEM "_Completa"), com pelo
menos a coluna "Situação Auto" — e essa coluna RESOLVE contra o endpoint
(HTTP 200, sem erro). Não foi usada: nenhum visual VISÍVEL da aba lê dela
(só aparece dentro de um filtro/bookmark), o que a torna candidata a versão
antiga/paralela da mesma tabela. Extrair dela seria arriscar pegar uma cópia
desatualizada por trás de um nome quase igual — a mesma armadilha que
`tacs_mineradoras.py` documenta para "Saldo Acumulado..." (metadado que
engana), só que aqui é a entidade inteira, não a coluna.

⚠️ **Uma entidade de SISTEMA descartada**: a aba FISCALIZAÇÃO filtra também
por `Calendário.Ano` — uma tabela de calendário automática do Power BI (a
mesma classe que `tacs_mineradoras.py` já cataloga como "de sistema, não
usável": `Calendario`, `DateTableTemplate_*`, `LocalDateTable_*`). Não é
dado de negócio; não entra em `ENTIDADES`.

═══ O TETO DE JANELA DO SERVIDOR, E A PARTIÇÃO POR DATA QUE ELE EXIGIU ═══

`tacs_mineradoras.py` prova completude subindo a janela até a resposta vir
MENOR que ela pedida. Aqui isso quebra para 3 das 5 entidades: **medido ao
vivo em 2026-08-21, o servidor nunca devolve mais que 30000 linhas — MESMO
pedindo janela de 80000.** `Autos_Infracao_Completa` tem ~521 mil linhas,
`Denuncias` ~102 mil, `Fiscalização_Completa_Gaia` ~31,5 mil: todas maiores
que o teto do servidor. Uma única consulta nunca prova completude nelas.

A saída: **particionar por intervalo de DATA e recursar.** Cada entidade
grande tem uma coluna de data (`Data de Lavratura`, `Data de cadastro`,
`DATA_FISCALIZACAO`) já confirmada como coluna real. `_particionar` pede a
entidade filtrada por `Data BETWEEN [dia_ini 00:00:00, dia_fim 23:59:59]`
com janela `_LIMIAR_PARTICAO` (25000, com folga sob o teto de 30000 medido):
se a resposta vier MENOR que o limiar, aquele intervalo está PROVADO
completo (mesma lógica de `janela_cheia` de `_powerbi_dsr.conferir`, só que
aplicada a um pedaço do calendário em vez do total); se vier EXATAMENTE no
limiar, o intervalo bipartido ao meio (por dia) e cada metade é recursada.
Intervalos fechados `[a, b]` em dias, sem sobreposição e sem buraco por
construção — a soma das folhas cobre `[1601-01-01, 9999-12-31]` inteiro.

⚠️ **Por que `[1601-01-01, 9999-12-31]` e não o mínimo/máximo real da
coluna**: a própria API do Power BI recusa literal `DateTime` menor que
1601-01-01 (`UnsupportedDateTimeLiteral`, medido ao vivo) — é limite do
MOTOR DE CONSULTA, não deste coletor. `Autos_Infracao_Completa` tem 9 linhas
com data anterior a isso (a mais antiga decodifica como "0205-06-12", claro
erro de digitação/sistema legado — SISEMA não existia no ano 205). Essas 9
não cabem num filtro `Between` com limite inferior travado em 1601, mas
CABEM numa comparação `< 1601-01-01` (o motor só recusa o LITERAL sendo
menor que 1601, não a comparação em si) — `_buscar_bucket_pre_1601` busca
exatamente essas separadamente, ANTES da partição principal, fechando a
cobertura em 100% sem precisar declarar nenhuma linha como "fora de
alcance". Nas outras duas entidades particionadas o bucket pré-1601 veio
vazio (medido) — o código confere isso sempre, não assume.

⚠️ **Uma segunda camada de sujeira nos dados, catalogada e MANTIDA (não
excluída)**: 2024 das linhas de `Autos_Infracao_Completa` trazem
`Data de Lavratura` cravada em 1899-12-29/30/31 — exatamente a "data zero"
do Automation Date do OLE (Excel/Access), a marca clássica de campo NULO
convertido em data pelo pipeline de origem antes de chegar ao Power BI. Não
é erro deste coletor nem motivo para excluir a linha: o auto de infração
existe, só a data de lavratura que a origem perdeu. `_particionar` extrai
essas 2024 linhas normalmente (caem dentro de `[1601, 9999]`, formam uma
partição folha densa); nenhuma lógica de negócio aqui as filtra ou
"corrige" — quem consumir o dado decide o que fazer com uma data que é,
comprovadamente, artefato de sistema.

═══ A ARMADILHA DO NORMALIZADOR DE `RT` CONTRA LITERAL DE DATA ═══

`_powerbi_dsr.conferir_contra_restart_token` (função COMPARTILHADA, não
alterada aqui) sabe normalizar `'texto'` e `2023L`, mas não reconhece o
literal DAX de data-hora que o servidor manda no `RT` quando a última coluna
selecionada é uma data: `datetime'2024-05-18T00:00:00'`. Sem reconhecer essa
forma, `_normalizar_rt` devolve a string crua, ela nunca bate com o valor
decodificado (inteiro em milissegundos), e `conferir()` ergue `ErroDSR`
alegando máscara R/Ø invertida — **quando na verdade a decodificação está
CERTA**. Verificado manualmente e batido byte a byte, em 2026-08-21:
`1715990400000` (valor decodificado) == `new Date("2024-05-18T00:00:00Z")`
== o que o `RT` afirma. Reproduzido em toda entidade com coluna de data
testada aqui (`Autos_Infracao_Completa`, `Denuncias`,
`Fiscalização_Completa_Gaia`); as entidades sem coluna de data
(`Barragens_Geral`, `Barragens em Emergencia`) não disparam o gap.

Este módulo NÃO toca `_powerbi_dsr.py` (fora do escopo desta tarefa; e
"reescrever o decodificador" era regra explícita a não fazer). Em vez disso,
`_conferir_tolerante_a_datetime_no_rt` envolve `conferir()`: se ele erguer
por causa do RT E a mensagem contiver o padrão `datetime'...'`, a função
reconverte ELA MESMA o literal para epoch-ms (replicando só a leitura do
literal, nunca a decodificação do DSR) e confere numericamente contra o
valor já decodificado pelo módulo compartilhado. Só perdoa a divergência se
bater exatamente; qualquer outra causa de divergência continua fatal, sem
exceção — a guarda original ("recuso devolver") permanece de pé para
qualquer coisa que não seja este gap específico e já verificado.

═══ USO ═══

    python -m etl.apis.sisema_fiscalizacao_barragens --sondar
    python -m etl.apis.sisema_fiscalizacao_barragens --entidade autos_infracao
    python -m etl.apis.sisema_fiscalizacao_barragens          # tudo, grava JSON

A extração completa, medida ao vivo em 2026-08-21, soma **723.261 linhas**
(582.210 autos_infracao + 102.369 denuncias + 38.445 fiscalizacao + 224
gestao_e_classificacao_barragens + 13 barragens_emergencia), em ~90
requisições HTTP (a bisecção por data converge rápido: cada intervalo
grande demais custa uma consulta "desperdiçada" antes de bipartir — aceito
de propósito, a alternativa seria confiar num teto que já provou devolver
contagem capada). Não é uma coleta de segundos, mas também não são as
"várias centenas" que a estimativa original deste módulo previa antes de
medir — a bisecção poda ramo vazio muito mais rápido do que o pior caso
teórico sugeria.

⚠️ **O arquivo de saída passa de 350 MB** (medido: `autos_infracao` sozinho
tem 582 mil linhas). Bem acima do limite de 100 MB do GitHub para um
arquivo comum — `git add` neste arquivo vai falhar ou exigir Git LFS. Este
módulo grava JSON compacto (sem indentação) para não desperdiçar espaço à
toa, mas isso não resolve a ordem de grandeza: a causa é o volume real do
dado (582 mil autos de infração), não o formato. Decidir a estratégia de
publicação (particionar por ano, agregar para o público, LFS, banco em vez
de arquivo) está FORA do escopo desta tarefa — registrado aqui para quem
for consumir o arquivo a seguir não descobrir isso ao tentar commitar.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import requests

from etl.apis._powerbi_dsr import ErroDSR, Tabela, conferir, decodificar_resposta
from etl.apis._powerbi_dsr import _normalizar_rt  # reaproveita o normalizador de literal do RT, não reescreve

LOG = "[etl.apis.sisema_fiscalizacao_barragens]"

# Cluster brazil-south, mesmo medido em tacs_mineradoras.py: api.powerbi.com
# dá 403, cluster errado dá 401 (parece login, não é).
BASE = "https://wabi-brazil-south-b-primary-api.analysis.windows.net"
URL = f"{BASE}/public/reports/querydata?synchronous=true"

# Medidos ao vivo em 2026-08-21 contra
# GET {BASE}/public/reports/{RESOURCE_KEY}/modelsAndExploration?preferReadOnlySession=true
# com header X-PowerBI-ResourceKey: {RESOURCE_KEY}. DATASET_ID = models[0].dbName;
# REPORT_ID = exploration.report.objectId (o GUID, não o id numérico interno).
RESOURCE_KEY = "6f0dee31-708d-42fd-ad2d-9a70e2f49dbc"
DATASET_ID = "ce3de06e-efa2-465e-aec2-aa792967c532"
REPORT_ID = "773731c9-c25f-4b6a-bf56-903e3b12f181"
MODEL_ID = 5910103

# refreshSchedule.refreshEnabled=false + lastRefreshTime do modelo (ver docstring §1).
DADO_CONGELADO_EM = "2026-08-19"
DADO_CONGELADO_EM_TIMESTAMP = "2026-08-19T18:27:40.36Z"
WORKSPACE_DE_ORIGEM = "My workspace"

TIMEOUT = 120
_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

# Janela para as entidades pequenas (mesmo padrão de tacs_mineradoras.py).
_JANELA_INICIAL = 500
_JANELA_MAXIMA = 30_000

# Teto medido do SERVIDOR (não deste coletor): pedir mais que isso não muda a
# resposta. O limiar de partição fica com folga abaixo dele.
_JANELA_MAXIMA_SERVIDOR = 30_000
_LIMIAR_PARTICAO = 25_000
_PROFUNDIDADE_MAXIMA = 40  # log2(dias entre 1601 e 9999) ≈ 22; folga generosa.

# Piso de literal DateTime aceito pela API (medido: erguer com
# UnsupportedDateTimeLiteral abaixo disto). Teto usa o máximo do .NET DateTime.
_DATA_MINIMA_API = date(1601, 1, 1)
_DATA_MAXIMA_API = date(9999, 12, 31)

_SAIDA = "dados/sisema-fiscalizacao-barragens.json"

# Nomes EXATOS, com acento/espaço/ponto como o modelo declara (inclusive
# "ATIVIDADE " com espaço à direita em Barragens_Geral, e ".AF_VINCULADO"
# com ponto à esquerda em Fiscalização_Completa_Gaia — não são erro de
# digitação deste módulo, são o Property real; "normalizar" quebra a
# consulta (mesmo aviso de tacs_mineradoras.py).
ENTIDADES: dict[str, dict] = {
    "autos_infracao": {
        "entidade": "Autos_Infracao_Completa",
        "campos": [
            "Auto de Infração",
            "Valor do Auto de Infração",
            "Data de Lavratura",
            "Situação Auto",
            "Data Encerramento/Envio Divida Ativa",
            "Unidade Atual",
            "Municipio do autuado",
            "Agenda",
            "Órgão Coordenador",
        ],
        "aba": "AUTOS DE INFRAÇÃO",
        "modo": "particionada",
        "campo_data": "Data de Lavratura",
        "campos_data": ["Data de Lavratura", "Data Encerramento/Envio Divida Ativa"],
    },
    "gestao_e_classificacao_barragens": {
        "entidade": "Barragens_Geral",
        "campos": [
            "Id Sigibar",
            "FINALIDADE",
            "MÉTODO CONSTRUTIVO",
            "MUNICÍPIO",
            "ATIVIDADE ",
            "CATEGORIA DE RISCO",
            "POTENCIAL DE DANO AMBIENTAL",
            "CLASSE",
        ],
        "aba": "GESTÃO DE BARRAGENS + CLASSIFICAÇÃO DE BARRAGENS",
        "modo": "simples",
    },
    "barragens_emergencia": {
        "entidade": "Barragens em Emergencia",
        "campos": ["ID", "EMPREENDED", "NOME_SIGBM", "PDA_DECRET", "EMERGENCIA", "MUNICIPIO"],
        "aba": "BARRAGENS EM EMERGÊNCIA",
        "modo": "simples",
    },
    "denuncias": {
        "entidade": "Denuncias",
        "campos": [
            "ID",
            "Município do Denunciado",
            "Data de cadastro",
            "SITUAÇÃO",
            "TEMPO",
            "UNIDADE",
            "TIPOLOGIA",
            "ANO CAD",
            "Tipo de Registro",
            "AGENDA",
        ],
        "aba": "DENÚNCIAS",
        "modo": "particionada",
        "campo_data": "Data de cadastro",
        "campos_data": ["Data de cadastro"],
    },
    "fiscalizacao": {
        "entidade": "Fiscalização_Completa_Gaia",
        "campos": [
            "ID_ATIVIDADE_AF",
            "DATA_FISCALIZACAO",
            "Regional",
            "Municipio",
            "Tipologia",
            "Possui_Infracoes",
            ".AF_VINCULADO",
            "DATA_ABERTURA_DO_ATO",
            "ATIVIDADE",
        ],
        "aba": "FISCALIZAÇÃO",
        "modo": "particionada",
        "campo_data": "DATA_FISCALIZACAO",
        "campos_data": ["DATA_FISCALIZACAO", "DATA_ABERTURA_DO_ATO"],
    },
}


# ────────────────────────────── HTTP / pedido ───────────────────────────


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": _UA,
        "Content-Type": "application/json;charset=UTF-8",
        "X-PowerBI-ResourceKey": RESOURCE_KEY,
    })
    return s


def _where_intervalo_fechado(campo: str, fonte: str, dia_ini: date, dia_fim: date) -> dict:
    """`campo BETWEEN [dia_ini 00:00:00, dia_fim 23:59:59]`. Medido ao vivo:
    `Between` é INCLUSIVE nas duas pontas — usar 23:59:59 (não 00:00:00 do
    dia seguinte) no limite superior é o que evita contar a mesma linha em
    duas partições vizinhas quando os dados são só-data (sem hora), que é o
    caso de toda coluna de data medida neste painel."""
    return {
        "Between": {
            "Expression": {"Column": {"Expression": {"SourceRef": {"Source": fonte}}, "Property": campo}},
            "LowerBound": {"Literal": {"Value": f"datetime'{dia_ini.isoformat()}T00:00:00'"}},
            "UpperBound": {"Literal": {"Value": f"datetime'{dia_fim.isoformat()}T23:59:59'"}},
        }
    }


def _where_antes_de(campo: str, fonte: str, dia: date) -> dict:
    """`campo < dia 00:00:00`. `ComparisonKind` medido ao vivo por
    tentativa (0–6): 4 devolve as linhas com data ANTES do literal — a API
    só recusa o LITERAL sendo menor que 1601-01-01, não a comparação em si,
    então isto alcança as linhas anteriores ao piso do `Between` (ver
    docstring do módulo, §"por que 1601 e não o mínimo real")."""
    return {
        "Comparison": {
            "ComparisonKind": 4,
            "Left": {"Column": {"Expression": {"SourceRef": {"Source": fonte}}, "Property": campo}},
            "Right": {"Literal": {"Value": f"datetime'{dia.isoformat()}T00:00:00'"}},
        }
    }


def montar_pedido(entidade: str, campos: list[str], janela: int, where: dict | None = None) -> dict:
    """Espelha `tacs_mineradoras.montar_pedido`, com `Where` opcional para a
    partição por data."""
    fonte = "e"
    selecao = [
        {"Column": {"Expression": {"SourceRef": {"Source": fonte}}, "Property": campo}, "Name": f"{fonte}.{campo}"}
        for campo in campos
    ]
    query: dict = {
        "Version": 2,
        "From": [{"Name": fonte, "Entity": entidade, "Type": 0}],
        "Select": selecao,
    }
    if where is not None:
        query["Where"] = [{"Condition": where}]
    return {
        "version": "1.0.0",
        "queries": [{
            "Query": {"Commands": [{"SemanticQueryDataShapeCommand": {
                "Query": query,
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


def _consultar_via_requests(sessao: requests.Session, corpo: bytes) -> tuple[int, bytes]:
    r = sessao.post(URL, data=corpo, timeout=TIMEOUT)
    return r.status_code, r.content


def _consultar_via_curl(corpo: bytes) -> tuple[int, bytes]:
    """Mesma requisição, via `curl` em subprocesso. Existe porque, NESTA
    classe de sandbox, o socket do `requests`/urllib3 morre com
    `PermissionError [WinError 10013]` antes de qualquer byte sair —
    medido ao vivo em 2026-08-21, mesmo erro que `tacs_mineradoras.py`
    documenta ter contornado só para VERIFICAR fora do módulo. Aqui o
    contorno fica DENTRO do módulo (ativado automaticamente pelo mesmo
    WinError em `_consultar`) porque esta tarefa pede rodar a extração de
    verdade, não só medir por fora. `--compressed` é obrigatório: a API
    manda corpo gzip com Content-Type de JSON (ver docstring do módulo)."""
    import subprocess
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp.write(corpo)
        caminho_tmp = tmp.name
    try:
        resultado = subprocess.run(
            [
                "curl", "-s", "--compressed", "-X", "POST", URL,
                "-H", f"X-PowerBI-ResourceKey: {RESOURCE_KEY}",
                "-H", "Content-Type: application/json;charset=UTF-8",
                "-H", f"User-Agent: {_UA}",
                "--data-binary", f"@{caminho_tmp}",
                "-w", "\n%{http_code}",
                "--max-time", str(TIMEOUT),
            ],
            capture_output=True, timeout=TIMEOUT + 10,
        )
    finally:
        Path(caminho_tmp).unlink(missing_ok=True)
    if resultado.returncode != 0:
        raise RuntimeError(f"{LOG} curl falhou (código {resultado.returncode}): {resultado.stderr[:400]!r}")
    saida = resultado.stdout
    corpo_resp, _, status_txt = saida.rpartition(b"\n")
    try:
        status = int(status_txt)
    except ValueError:
        raise RuntimeError(f"{LOG} curl não devolveu status HTTP reconhecível: {saida[-200:]!r}") from None
    return status, corpo_resp


def _consultar(sessao: requests.Session, pedido: dict) -> dict:
    corpo = json.dumps(pedido, ensure_ascii=False).encode("utf-8")
    try:
        status, bruto = _consultar_via_requests(sessao, corpo)
    except requests.exceptions.ConnectionError as e:
        if "10013" not in str(e):
            raise
        status, bruto = _consultar_via_curl(corpo)
    if status in (401, 403):
        raise RuntimeError(
            f"{LOG} HTTP {status} do endpoint. Pista falsa (ver tacs_mineradoras.py): cluster "
            f"errado dá 401 e api.powerbi.com dá 403, os dois PARECEM falta de login, mas este "
            f"relatório é público. Confira {BASE} e X-PowerBI-ResourceKey. Corpo: {bruto[:400]!r}"
        )
    if status != 200:
        raise RuntimeError(f"{LOG} HTTP {status} inesperado do endpoint. Corpo: {bruto[:400]!r}")
    dados = json.loads(bruto)
    r0 = (dados.get("results") or [{}])[0]
    if "error" in r0:
        raise RuntimeError(
            f"{LOG} a API devolveu odata.error dentro do 200 OK: "
            f"{json.dumps(r0['error'], ensure_ascii=False)[:500]}"
        )
    return dados


# ─────────────────── tolerância ao gap de datetime no RT ────────────────

_RE_RT_DATETIME = re.compile(r"^datetime'(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})'$")


def _rt_datetime_para_epoch_ms(bruto: str) -> int | None:
    m = _RE_RT_DATETIME.match(bruto)
    if not m:
        return None
    ano, mes, dia, h, mi, s = (int(x) for x in m.groups())
    return int(datetime(ano, mes, dia, h, mi, s, tzinfo=timezone.utc).timestamp() * 1000)


def _conferir_tolerante_a_datetime_no_rt(tabela: Tabela, *, janela: int | None = None) -> dict:
    """`conferir()` do decodificador compartilhado, tolerando SÓ o gap
    verificado do normalizador de RT contra literal `datetime'...'` (ver
    docstring do módulo). Qualquer outra causa de erro sobe intacta."""
    try:
        return conferir(tabela, janela=janela)
    except ErroDSR as e:
        msg = str(e)
        if "restart token" not in msg or "datetime'" not in msg:
            raise
        if not tabela.restart_token or not tabela.linhas:
            raise
        obtidos = [tabela.linhas[-1][c] for c in tabela.colunas]
        # `tabela.restart_token` é CRU (ex.: "'33568'", "2023L") — mesma
        # normalização que `conferir_contra_restart_token` já aplicaria
        # (_normalizar_rt, reaproveitada, não duplicada). Sem isto, todo RT
        # de texto/número "diverge" só por causa das aspas/sufixo que
        # sobraram, mascarando o gap real de datetime que este wrapper
        # existe para tolerar.
        esperados = [_normalizar_rt(v) for v in tabela.restart_token]
        if len(esperados) != len(obtidos):
            raise
        for coluna, esperado, obtido in zip(tabela.colunas, esperados, obtidos):
            if str(esperado) == str(obtido):
                continue
            epoch = _rt_datetime_para_epoch_ms(str(esperado)) if isinstance(esperado, str) else None
            if epoch is None or epoch != obtido:
                raise ErroDSR(
                    f"{LOG} divergência de RT que NÃO é o gap de literal datetime conhecido "
                    f"(coluna {coluna!r}: RT normalizado={esperado!r} decodificado={obtido!r}) — "
                    "recuso tolerar."
                ) from e
        diag: dict = {"linhas": len(tabela.linhas), "colunas": len(tabela.colunas)}
        diag.update(tabela.diagnostico)
        diag["conferido"] = True
        diag["conferido_via"] = "RT com tolerância verificada a literal datetime (ver docstring do módulo)"
        if janela is not None and len(tabela.linhas) >= janela:
            diag["janela_cheia"] = True
        return diag


# ────────────────────────── modo simples (molde tacs) ───────────────────


def _buscar_entidade_simples(sessao: requests.Session, chave: str, verboso: bool = True) -> dict:
    """Igual a `tacs_mineradoras._buscar_entidade`: sobe a janela até a
    resposta vir MENOR que ela — só isso PROVA fim de tabela. Para as
    entidades desta tarefa que cabem sob o teto do servidor."""
    spec = ENTIDADES[chave]
    janela = _JANELA_INICIAL
    while True:
        resposta = _consultar(sessao, montar_pedido(spec["entidade"], spec["campos"], janela))
        tabela = decodificar_resposta(resposta)
        diag = _conferir_tolerante_a_datetime_no_rt(tabela, janela=janela)
        if not diag.get("janela_cheia"):
            if verboso:
                print(f"{LOG} {chave}: {len(tabela)} linha(s) (janela {janela}, fim provado).")
            return {"tabela": tabela, "diagnostico": diag}
        if janela >= _JANELA_MAXIMA:
            raise RuntimeError(
                f"{LOG} {chave}: janela chegou ao teto ({_JANELA_MAXIMA}) ainda cheia — não devia "
                "acontecer para uma entidade marcada 'simples'; ela precisa virar 'particionada'."
            )
        janela = min(janela * 4, _JANELA_MAXIMA)
        if verboso:
            print(f"{LOG} {chave}: janela cheia, subindo para {janela}.")


# ───────────────────── modo particionado por data ────────────────────────


def _buscar_bucket_pre_1601(
    sessao: requests.Session, entidade: str, campos: list[str], campo_data: str, verboso: bool
) -> Tabela:
    """As linhas com data ANTERIOR ao piso de literal DateTime da própria
    API (1601-01-01) — inalcançáveis por `Between`, alcançáveis por `<`.
    Ver docstring do módulo."""
    where = _where_antes_de(campo_data, "e", _DATA_MINIMA_API)
    pedido = montar_pedido(entidade, campos, _LIMIAR_PARTICAO, where=where)
    tabela = decodificar_resposta(_consultar(sessao, pedido))
    diag = _conferir_tolerante_a_datetime_no_rt(tabela, janela=_LIMIAR_PARTICAO)
    if diag.get("janela_cheia"):
        raise RuntimeError(
            f"{LOG} {entidade}: bucket anterior a {_DATA_MINIMA_API.isoformat()} já bate o limiar de "
            f"{_LIMIAR_PARTICAO} linha(s) — inesperado (medido em 2026-08-21: 9 linhas no máximo entre "
            "as 3 entidades particionadas). Parar em vez de assumir completo."
        )
    if verboso and len(tabela):
        print(
            f"{LOG} {entidade}: {len(tabela)} linha(s) com data anterior a "
            f"{_DATA_MINIMA_API.isoformat()} (piso de literal DateTime da API — capturadas via '<')."
        )
    return tabela


def _particionar(
    sessao: requests.Session,
    entidade: str,
    campos: list[str],
    campo_data: str,
    ini: date,
    fim: date,
    profundidade: int,
    verboso: bool,
) -> list[Tabela]:
    """Cobre `[ini, fim]` (dias, fechado nas duas pontas) sem sobreposição e
    sem buraco. Cada folha devolvida é PROVADA completa (resposta menor que
    `_LIMIAR_PARTICAO`); intervalos que enchem a janela bipartem por dia e
    recursam. Ver docstring do módulo, §"o teto de janela do servidor"."""
    if profundidade > _PROFUNDIDADE_MAXIMA:
        raise RuntimeError(
            f"{LOG} {entidade}: profundidade de partição passou de {_PROFUNDIDADE_MAXIMA} em "
            f"[{ini}..{fim}] — não devia acontecer sobre um intervalo de calendário finito; "
            "sinal de bug na bipartição, não de mais dado. Parar."
        )
    where = _where_intervalo_fechado(campo_data, "e", ini, fim)
    pedido = montar_pedido(entidade, campos, _LIMIAR_PARTICAO, where=where)
    tabela = decodificar_resposta(_consultar(sessao, pedido))
    diag = _conferir_tolerante_a_datetime_no_rt(tabela, janela=_LIMIAR_PARTICAO)
    n = len(tabela)
    if n == 0:
        return []
    if not diag.get("janela_cheia"):
        if verboso:
            print(f"{LOG} {entidade} [{ini}..{fim}]: {n} linha(s) (folha provada completa).")
        return [tabela]
    # Janela encheu: este intervalo tem >= _LIMIAR_PARTICAO linhas, não prova
    # nada sobre o total real. Bipartir por dia e recursar — descarta esta
    # resposta capada (ela não representa o intervalo inteiro).
    if ini == fim:
        raise RuntimeError(
            f"{LOG} {entidade}: um ÚNICO DIA ({ini.isoformat()}) já bate o limiar de "
            f"{_LIMIAR_PARTICAO} linha(s) — este coletor só particiona por data; não há como provar "
            "completude sem outra dimensão de corte, que não está implementada. Situação inédita "
            "para este painel (não observada em 2026-08-21); parar em vez de devolver janela capada."
        )
    meio = ini + (fim - ini) // 2
    if verboso:
        print(f"{LOG} {entidade} [{ini}..{fim}]: janela cheia em {n}, bipartindo em {meio.isoformat()}.")
    esquerda = _particionar(sessao, entidade, campos, campo_data, ini, meio, profundidade + 1, verboso)
    direita = _particionar(
        sessao, entidade, campos, campo_data, meio + timedelta(days=1), fim, profundidade + 1, verboso
    )
    return esquerda + direita


def _buscar_entidade_particionada(sessao: requests.Session, chave: str, verboso: bool = True) -> dict:
    spec = ENTIDADES[chave]
    entidade, campos, campo_data = spec["entidade"], spec["campos"], spec["campo_data"]
    tabelas: list[Tabela] = []
    pre1601 = _buscar_bucket_pre_1601(sessao, entidade, campos, campo_data, verboso)
    if len(pre1601):
        tabelas.append(pre1601)
    tabelas.extend(
        _particionar(sessao, entidade, campos, campo_data, _DATA_MINIMA_API, _DATA_MAXIMA_API, 0, verboso)
    )
    total = sum(len(t) for t in tabelas)
    if verboso:
        print(
            f"{LOG} {chave}: {total} linha(s) em {len(tabelas)} partição(ões) "
            f"(cobertura [{_DATA_MINIMA_API.isoformat()}..{_DATA_MAXIMA_API.isoformat()}] + bucket "
            "pré-1601, sem sobreposição nem buraco por construção)."
        )
    return {"tabelas": tabelas, "total": total, "particoes": len(tabelas)}


# ─────────────────────── normalização e gravação ─────────────────────────

# Mesma armadilha e mesma correção de tacs_mineradoras.py: o DSR manda
# número como STRING quando o double não faz round-trip limpo em JSON.
_RE_NUMERO_DSR = re.compile(r"^-?\d+(?:\.\d+)?$")


def _normalizar_numero(v: object) -> object:
    if isinstance(v, str) and _RE_NUMERO_DSR.match(v):
        return int(v) if "." not in v else float(v)
    return v


def _normalizar_data(v: object) -> object:
    """Colunas de data (`T:7` no DSR) vêm ORA como inteiro epoch-ms UTC, ORA
    como STRING ISO já formatada — medido ao vivo em 2026-08-21, NA MESMA
    LINHA de `Fiscalização_Completa_Gaia`: `DATA_FISCALIZACAO` chegou
    `"1968-09-02T00:00:00"` (string) e `DATA_ABERTURA_DO_ATO` chegou
    `1753660800000` (inteiro), no mesmo registro. É a mesma classe de
    sujeira que `tacs_mineradoras.py` documenta para número-como-string
    (`_normalizar_numero`), só que em coluna de data — e pela mesma razão
    tem de ser resolvida AQUI, uma vez, na entrada: sem isso a MESMA coluna
    do JSON de saída teria dois tipos conforme a linha. Normaliza sempre
    para ISO 8601 (`AAAA-MM-DDThh:mm:ss`, UTC) usando aritmética de datas
    pura do Python — `datetime.fromtimestamp` estoura em anos fora do
    alcance do runtime C do Windows, e este painel TEM ano 9202 de verdade
    (ver docstring do módulo, §"segunda camada de sujeira")."""
    if v is None or isinstance(v, str):
        return v
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return (datetime(1970, 1, 1, tzinfo=timezone.utc) + timedelta(milliseconds=v)).strftime(
            "%Y-%m-%dT%H:%M:%S"
        )
    return v


def _linhas_com_ressalva(tabela: Tabela, chave: str) -> list[dict]:
    """Ressalva de congelamento gravada EM CADA LINHA (mesmo raciocínio de
    tacs_mineradoras.py: cabeçalho se perde quando alguém copia a lista).
    Nomes de coluna com espaço/ponto sobrando (`"ATIVIDADE "`,
    `".AF_VINCULADO"`) só têm o prefixo `"e."` e espaços de BORDA
    removidos — o ponto interno de `.AF_VINCULADO` é parte do nome real e
    fica."""
    prefixo = "e."
    campos_data = set(ENTIDADES[chave].get("campos_data", ()))
    saida = []
    for linha in tabela.linhas:
        limpa = {}
        for k, v in linha.items():
            nome = (k[len(prefixo):] if k.startswith(prefixo) else k).strip()
            limpa[nome] = _normalizar_data(v) if nome in campos_data else _normalizar_numero(v)
        limpa["_entidade"] = chave
        limpa["_dado_congelado_em"] = DADO_CONGELADO_EM
        saida.append(limpa)
    return saida


def coletar(chaves: list[str] | None = None, verboso: bool = True) -> dict:
    sessao = _sessao()
    chaves = chaves or list(ENTIDADES)
    blocos, diagnosticos = {}, {}
    for chave in chaves:
        if chave not in ENTIDADES:
            raise SystemExit(f"{LOG} entidade desconhecida: {chave!r} (tem: {sorted(ENTIDADES)})")
        spec = ENTIDADES[chave]
        if spec["modo"] == "simples":
            resultado = _buscar_entidade_simples(sessao, chave, verboso=verboso)
            tabelas = [resultado["tabela"]]
            diag_extra: dict = {k: v for k, v in resultado["diagnostico"].items() if k != "aviso"}
        elif spec["modo"] == "particionada":
            resultado = _buscar_entidade_particionada(sessao, chave, verboso=verboso)
            tabelas = resultado["tabelas"]
            diag_extra = {"particoes": resultado["particoes"]}
        else:
            raise SystemExit(f"{LOG} modo desconhecido para {chave!r}: {spec['modo']!r}")
        linhas: list[dict] = []
        for t in tabelas:
            linhas.extend(_linhas_com_ressalva(t, chave))
        blocos[chave] = linhas
        diagnosticos[chave] = {
            "entidade": spec["entidade"],
            "aba": spec["aba"],
            "modo": spec["modo"],
            "linhas": len(linhas),
            "colunas": spec["campos"],
            **diag_extra,
        }
    return {
        "fonte": "sisema_mg_painel_fiscalizacao_barragens",
        "fonte_nome": 'Painel "Outros Indicadores" — SISEMA/SEMAD-MG (Power BI público, filho do menu de barragens)',
        "resource_key": RESOURCE_KEY,
        "model_id": MODEL_ID,
        "dado_congelado_em": DADO_CONGELADO_EM,
        "dado_ao_vivo": False,
        "ressalva_congelamento": (
            f"O painel declara refreshEnabled=false; lastRefreshTime={DADO_CONGELADO_EM_TIMESTAMP} — "
            "o dado NÃO reflete a situação atual de autos, barragens, denúncias ou fiscalizações."
        ),
        "workspace_de_origem": WORKSPACE_DE_ORIGEM,
        "ressalva_workspace": (
            "O relatório-filho foi publicado de uma 'My workspace' pessoal, não de workspace "
            "institucional — depende de uma conta individual, sem governança de área."
        ),
        "ressalva_formato": (
            "O formato DSR do Power BI não é documentado e pode mudar sem aviso; a coleta quebra de "
            "propósito se mudar, em vez de gravar tabela plausível e errada."
        ),
        "ressalva_particao": (
            "O servidor nunca devolve mais de 30000 linhas por consulta (medido, mesmo pedindo mais). "
            "autos_infracao, denuncias e fiscalizacao foram particionadas por intervalo de data e "
            "recuperadas em várias consultas; cada partição-folha é provada completa antes de aceita, "
            "e a partição cobre 1601-01-01..9999-12-31 (piso/teto do próprio motor de consulta) mais um "
            "bucket separado para datas anteriores a 1601, sem sobreposição nem buraco por construção."
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
    # SEM indent, ao contrário de tacs_mineradoras.py: aqui a escala é outra
    # ordem de grandeza (a extração completa medida em 2026-08-21 soma
    # ~723 mil linhas, 582 mil só em `autos_infracao`) — `indent=1` sobre
    # centenas de milhares de objetos pequenos é quase todo espaço em
    # branco, e levou o arquivo a ~354 MB (medido). Compacto (sem indent,
    # sem espaço depois de `:`/`,`) é só formatação, não muda o dado; ainda
    # assim o arquivo fica bem acima do limite de 100 MB do GitHub — ver
    # docstring do módulo, ressalva de tamanho, não resolvida aqui (fora do
    # escopo desta tarefa decidir a estratégia de publicação).
    Path(caminho).write_text(
        json.dumps(pacote, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    total = sum(len(v) for v in pacote["dados"].values())
    print(f"{LOG} {total} linha(s) em {caminho} (congelado em {DADO_CONGELADO_EM}).")


def sondar(chaves: list[str] | None = None) -> None:
    pacote = coletar(chaves)
    print(
        f"{LOG} SONDAGEM (nada gravado) — congelado em {DADO_CONGELADO_EM}, "
        f"origem: {WORKSPACE_DE_ORIGEM!r}"
    )
    for chave, diag in pacote["diagnostico"].items():
        print(
            f"  {chave} [{diag['entidade']}] modo={diag['modo']}: {diag['linhas']} linha(s) · "
            f"colunas: {diag['colunas']}"
        )
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
