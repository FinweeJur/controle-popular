r"""etl.apis.tacs_mineradoras — os TACs das mineradoras com o Estado de Minas
Gerais, do painel público "Painel TACs Final" da SEMAD/MG.

O painel é um relatório Power BI embutido, publicado SEM login. Este módulo
consulta o mesmo endpoint que o embed do navegador usa e grava JSON; a
decodificação do formato comprimido está em `etl.apis._powerbi_dsr`, puro e
testado contra fixture congelada (`_powerbi_dsr_test.py`).

═══ TRÊS RESSALVAS QUE VIAJAM COLADAS AO DADO ═══

Estas não são notas de rodapé de implementação: **vão para a página do
site**, junto do número, sempre. Cada uma foi medida em
`fixtures/powerbi-modelsAndExploration.json` em 2026-08-20.

1. **O dado está CONGELADO em 2026-05-05.** O próprio modelo declara
   `refreshSchedule.refreshEnabled: false` (e `isRefreshable: false`), com
   `lastRefreshTime` = `/Date(1777994106250)/` = 2026-05-05. **Não é dado ao
   vivo.** Apresentar como "situação atual dos TACs" seria mentira — o valor
   executado de um projeto pode ter mudado desde então e o painel não
   saberia. Toda linha gravada leva `_dado_congelado_em`, para que a
   ressalva não possa se separar do número na hora de renderizar.

2. **Foi publicado de uma "My workspace" pessoal**, não de workspace
   institucional: `ownerInfo.groupDisplayName == "My workspace"`. Isso não
   torna o dado falso — é publicação oficial da SEMAD —, mas significa que
   ele depende da conta de UMA pessoa, sem governança de área. Um painel
   nessas condições some quando a conta muda de mão, e não há promessa
   institucional de continuidade. É informação relevante para quem cita.

3. **O contrato do DSR não é documentado e pode mudar sem aviso.** Por isso
   a fixture congelada e as guardas que quebram alto: se a Microsoft mudar
   o formato, este coletor PARA, em vez de gravar tabela plausível e
   errada.

═══ O MAPA DE ENTIDADES, E O ERRO QUE ELE JÁ CAUSOU ═══

O modelo (`conceptualschema`, modelId 4465627) expõe **11 entidades**; só 4
carregam dado de negócio, as outras 7 são calendário/data (`Calendario`,
`DateTableTemplate_*`, `LocalDateTable_*`) — de sistema, não usáveis, e duas
delas (`Calendario`, `LocalDateTable_*`) sequer decodificam: o `RT` diverge
da última linha (sintoma de restart token que não serve para conferência
nestas tabelas de sistema — não investigado além disso, e fora de escopo:
não é dado).

A primeira versão deste mapa pediu `Valor Transferido` dentro de
`Contas x Projetos` e o endpoint devolveu HTTP 200 com `odata.error`
(`CouldNotResolveSemanticQueryDefinition ... invalid Column reference`). A
coluna EXISTE — só que em `Execução_Projetos_Completa`, não em
`Contas x Projetos`. O erro nasceu de contar as propriedades do relatório
inteiro (`entidades_from` em todos os visuais) em vez de por entidade: o
mesmo nome de coluna aparece em quatro entidades diferentes, e só a
consulta isolada por entidade revela a qual cada propriedade pertence.

⚠️ **E o metadado ainda engana de uma segunda forma**: nomes como "Saldo
Acumulado Ano Mais Recente", "Deposito 2022-2025" e
"Percentual Execucao_Depositado" são `displayName` de **agregações**
(`Measure`) calculadas nos visuais — pedi-los como `Column` (a forma mais
natural de ler o schema) devolve HTTP 200 com `odata.error`, igual ao erro
original. A lista abaixo foi confirmada **coluna a coluna contra o
endpoint** (uma consulta por nome, janela 5): o que resolve como `Column`
fica; agregação sai — refazemos a soma aqui a partir da coluna crua, em vez
de fingir que existe campo para pedir.

Também entrou a **quarta entidade**, que faltava no primeiro mapa: `soma`
(`Soma Deposito_Execucao_Transferencia`) é o que fecha a conta entre o que
foi depositado, comprometido e executado.

**Verificado de novo, ao vivo, em 2026-08-21** (segunda sessão, endpoint
consultado diretamente por `curl` — o socket do `requests` fica bloqueado
nesta classe de sandbox, então a verificação rodou por fora do módulo): as
4 consultas abaixo devolvem HTTP 200 sem `odata.error`, com contagem menor
que a janela pedida nas 4 (848/2000, 69/500, 120/500, 120/500 — prova de
tabela completa, não truncada). Os totais de `projetos` batem, ao centavo,
com os medidos em 2026-08-20 (R$ 307.120.704,20 previstos / R$
125.304.594,47 executados / 40,8%) — confirmação independente de que o
painel está mesmo congelado, não que a verificação encontrou dado igual por
acaso.

═══ O CLUSTER CERTO, MEDIDO AO VIVO ═══

`https://wabi-brazil-south-b-primary-api.analysis.windows.net`. Medido em
2026-08-20: `https://api.powerbi.com/...` devolve **403**, e mandar para o
cluster errado devolve **401** — não 404. Ou seja, **errar o cluster parece
problema de autenticação**, e a reação natural (ir procurar token, achar que
precisa de login) é a pista falsa. Não precisa de token: precisa do cluster
certo mais o header `X-PowerBI-ResourceKey`.

═══ POR QUE `conferir` E NÃO "deu 200, tá bom" ═══

Padrão do repositório (AGENTS.md): **API responde 200 e mente**. Aqui o modo
específico é a JANELA: `DataReduction.Primary.Window.Count` limita as
linhas, e uma resposta que enche a janela exatamente quase sempre significa
que há mais dado do lado de lá. Aceitar isso como total é o erro que faz o
site dizer "27 projetos" quando são 300. `_buscar_entidade` sobe a janela
até a resposta vir MENOR que ela (prova de fim) e ergue se bater no teto
sem provar.

═══ A ARMADILHA DE TIPO, E ONDE ELA É FECHADA ═══

As colunas de valor vêm ora `number`, ora **string** com a precisão inteira
do double (`"1923682.8800000001"`) — o Power BI faz isso quando o número
não faz round-trip limpo em JSON. Normalizar isso é responsabilidade DESTE
módulo, uma vez só, na entrada (`_normalizar_numero`, aplicada em
`_linhas_com_ressalva`): quem grava a linha já grava número de verdade.
Adiar a normalização para quem consome o JSON é o erro — dois consumidores
diferentes decidiriam a conversão de formas diferentes, e somar sem
converter concatena string; ordenar vai por caractere ("100" < "20").

Uso:

    python -m etl.apis.tacs_mineradoras --sondar          # não grava
    python -m etl.apis.tacs_mineradoras --entidade projetos
    python -m etl.apis.tacs_mineradoras                    # tudo, grava JSON
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

from etl.apis._powerbi_dsr import ErroDSR, conferir, decodificar_resposta

LOG = "[etl.apis.tacs_mineradoras]"

# Cluster brazil-south: api.powerbi.com dá 403 e o cluster errado dá 401.
BASE = "https://wabi-brazil-south-b-primary-api.analysis.windows.net"
URL = f"{BASE}/public/reports/querydata?synchronous=true"

RESOURCE_KEY = "bfe10fcd-6bbb-4b18-a214-731c28f9d623"
DATASET_ID = "53649114-3412-4059-9767-6eb16d6662f9"
REPORT_ID = "31c85c87-854d-4a7a-b733-67abe684a859"
MODEL_ID = 4465627

# `refreshEnabled: false` + lastRefreshTime no modelo. Ver docstring §1.
DADO_CONGELADO_EM = "2026-05-05"
WORKSPACE_DE_ORIGEM = "My workspace"

TIMEOUT = 120
_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

_JANELA_INICIAL = 500
_JANELA_MAXIMA = 30_000

_SAIDA = "dados/tacs-mineradoras.json"

# Nomes COM acento e espaço, exatamente como o modelo declara — vão crus no
# JSON do pedido. "Normalizar" qualquer um deles devolve esqueleto vazio.
ENTIDADES: dict[str, dict] = {
    # ⟲ CORRIGIDO 20/08/2026 contra o metadado do relatório, e RECONFIRMADO
    # ao vivo em 21/08/2026 (ver docstring do módulo). A primeira versão
    # desta tabela pediu `Valor Transferido` dentro de `Contas x Projetos`,
    # e o endpoint devolveu HTTP 200 com `odata.error`
    # (`CouldNotResolveSemanticQueryDefinition ... invalid Column reference`).
    # A coluna existe, mas em OUTRA entidade — o erro nasceu de contar as
    # propriedades do relatório inteiro em vez de por entidade.
    #
    # O mapa abaixo sai do cruzamento `From[].Name -> From[].Entity` com os
    # `SourceRef.Source` de cada `Select`, dentro de cada visual: é o único
    # jeito de saber a que entidade uma propriedade pertence, porque o mesmo
    # nome ("Ano", "Mineradora") aparece em quase todas.
    #
    # ⚠️ E ainda assim o metadado ENGANA: nomes como "Saldo Acumulado Ano Mais
    # Recente", "Deposito 2022-2025" e "Percentual Execucao_Depositado" são
    # `NativeReferenceName`/`displayName` de AGREGAÇÕES nos visuais, não colunas
    # da entidade — pedi-los devolve HTTP 200 com `odata.error`. A lista final
    # abaixo foi confirmada COLUNA A COLUNA contra o endpoint em 20/08/2026
    # (uma consulta por nome, janela 5): o que resolve fica, o que não resolve
    # sai. `Contas x Projetos` tem 5 colunas reais; `Soma
    # Deposito_Execucao_Transferencia` tem 3 — o resto daquele visual é
    # `Aggregation` calculada na hora, e agregação a gente refaz aqui a partir
    # da coluna crua, em vez de fingir que existe campo para pedir.
    "projetos": {
        "entidade": "Execução_Projetos_Completa",
        "campos": [
            "Projeto", "Mineradora", "Órgão/Instituição", "Ano", "Status",
            "Valor Previsto", "Valor Previsto Real", "Valor Executado",
            "Valor Transferido", "Execução", "Breve relato da situação",
        ],
    },
    "empresas": {
        "entidade": "Empresas_valores Estado Consulta Geral",
        "campos": ["Empresa", "Ano", "Valor Estado", "Valor MP", "Valor Total correto"],
    },
    "contas": {
        "entidade": "Contas x Projetos",
        "campos": ["Mineradora", "Ano", "DEPÓSITO", "VALOR DO PROJETO", "ACUMULADO"],
    },
    # Quarta entidade, que faltava: é a que fecha a conta entre o que foi
    # depositado, o que foi comprometido e o que foi executado.
    "soma": {
        "entidade": "Soma Deposito_Execucao_Transferencia",
        "campos": ["Mineradora", "Ano", "Soma Deposito"],
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


def montar_pedido(entidade: str, campos: list[str], janela: int) -> dict:
    """Monta o `SemanticQueryDataShapeCommand`. Espelha byte a byte a forma
    do pedido que funcionou ao vivo (`fixtures/powerbi-querydata-pedido.json`)
    — o endpoint é exigente com a forma, e "simplificar" o envelope costuma
    render 400 sem explicação."""
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


def _consultar(sessao: requests.Session, pedido: dict) -> dict:
    r = sessao.post(URL, data=json.dumps(pedido, ensure_ascii=False).encode("utf-8"), timeout=TIMEOUT)
    if r.status_code in (401, 403):
        raise RuntimeError(
            f"{LOG} HTTP {r.status_code} do endpoint. ATENÇÃO à pista falsa: cluster errado "
            f"responde 401 e api.powerbi.com responde 403 — os dois PARECEM falta de login, "
            f"mas este relatório é público e não usa token. Confira o cluster ({BASE}) e o "
            f"header X-PowerBI-ResourceKey antes de procurar autenticação. Corpo: {r.text[:400]!r}"
        )
    r.raise_for_status()
    return r.json()


def _buscar_entidade(sessao: requests.Session, chave: str, verboso: bool = True) -> dict:
    """Sobe a janela até a resposta vir MENOR que ela — só isso PROVA que a
    tabela acabou. Uma resposta que enche a janela exatamente não é prova de
    fim, é o caso em que se subconta sem perceber."""
    spec = ENTIDADES[chave]
    janela = _JANELA_INICIAL
    while True:
        resposta = _consultar(sessao, montar_pedido(spec["entidade"], spec["campos"], janela))
        tabela = decodificar_resposta(resposta)
        diag = conferir(tabela, janela=janela)
        if not diag.get("janela_cheia"):
            if verboso:
                print(f"{LOG} {chave}: {len(tabela)} linha(s) (janela {janela}, fim provado). "
                      f"herdadas por R: {diag.get('celulas_herdadas_por_R')}, "
                      f"nulas por Ø: {diag.get('celulas_nulas_por_Ø')}.")
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
# JSON (medido: "1923682.8800000001", "371917.60000000003"). O padrão vem do
# PRÓPRIO formato — dígitos, opcionalmente com UM ponto decimal e sinal — e
# nunca casa com texto de verdade (nome de mineradora, status, relato): por
# isso é seguro aplicar em toda coluna, sem lista de campos numéricos para
# manter sincronizada com `ENTIDADES`.
_RE_NUMERO_DSR = re.compile(r"^-?\d+(?:\.\d+)?$")


def _normalizar_numero(v: object) -> object:
    """Converte string numérica do DSR para número de verdade. Ver docstring
    do módulo, §"a armadilha de tipo" — feito UMA VEZ aqui, na gravação, para
    que somar não concatene e ordenar não vá por caractere."""
    if isinstance(v, str) and _RE_NUMERO_DSR.match(v):
        return int(v) if "." not in v else float(v)
    return v


def _linhas_com_ressalva(tabela, chave: str) -> list[dict]:
    """A ressalva de congelamento é gravada EM CADA LINHA, não só no
    cabeçalho do arquivo: cabeçalho se perde quando alguém copia a lista
    para outro lugar, e aí o número viaja sozinho parecendo atual."""
    prefixo = "e."
    saida = []
    for linha in tabela.linhas:
        limpa = {
            (k[len(prefixo):] if k.startswith(prefixo) else k): _normalizar_numero(v)
            for k, v in linha.items()
        }
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
        resultado = _buscar_entidade(sessao, chave, verboso=verboso)
        blocos[chave] = _linhas_com_ressalva(resultado["tabela"], chave)
        diagnosticos[chave] = {
            "linhas": len(blocos[chave]),
            "colunas": resultado["tabela"].colunas,
            **{k: v for k, v in resultado["diagnostico"].items() if k != "aviso"},
        }
    return {
        "fonte": "semad_mg_painel_tacs",
        "fonte_nome": "Painel TACs Final — SEMAD/MG (Power BI público)",
        # As três ressalvas, no arquivo, para a página do site consumir:
        "dado_congelado_em": DADO_CONGELADO_EM,
        "dado_ao_vivo": False,
        "ressalva_congelamento": (
            f"O painel declara refreshEnabled=false; o dado está congelado em "
            f"{DADO_CONGELADO_EM} e NÃO reflete a situação atual dos TACs."
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
        "coletado_em": datetime.now(timezone.utc).isoformat(),
        "diagnostico": diagnosticos,
        "dados": blocos,
    }


def exportar(caminho: str = _SAIDA, chaves: list[str] | None = None) -> None:
    pacote = coletar(chaves)
    if not any(pacote["dados"].values()):
        # Mesmo padrão de `legislacao_mma`: arquivo vazio por cima de um bom
        # faz a carga seguinte concluir que a fonte esvaziou.
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
        print(f"  {chave}: {diag['linhas']} linha(s) · colunas: {diag['colunas']}")
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
