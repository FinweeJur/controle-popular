"""coletar-semace-ce.py — licenciamento e fiscalização ambiental do Ceará (SEMACE).

O que é: baixa os processos de licenciamento ambiental e os autos de
fiscalização ambiental do Ceará e grava `apps/web/data/semace-ce.json`,
um JSON compacto (colunas + linhas) para a página pública.

Fonte oficial:
- Licenciamento: POST https://servicos.semace.ce.gov.br/SemaceMobileWS/webService/consultaProcesso/processos
- Fiscalização:  POST https://servicos.semace.ce.gov.br/SemaceMobileWS/webService/fiscalizacao/findProcessosFiscalizacao
- Portal que publica as duas consultas: https://servicos.semace.ce.gov.br/consultaProcesso
  e https://servicos.semace.ce.gov.br/consultaProcessoFiscalizacao

Medição: 18/11/2026 (docs/historico/descobertas/ambiental-PE-CE-licenciamento.md).
`consultaProcesso/infofilters` diz 184 municípios; a busca vazia devolve
205.820 processos e 17.974 autos, sem login e sem CAPTCHA.

## robots.txt e ritmo (lidos em 18/11/2026)

- https://servicos.semace.ce.gov.br/robots.txt → **404** (o host devolve o
  HTML do app; não há `Disallow` publicado). Sem `Crawl-delay`.
- https://www.semace.ce.gov.br/robots.txt → **404** e hoje o host nem
  completa o TLS (erro de certificado) — é o portal institucional, não é
  onde o dado mora.
- Não achei termo de uso que proíba acesso automatizado. Ainda assim:
  servidor público, então UA honesto (`finweejur/github artur colito`),
  2 s entre requisições ao mesmo host, lotes de 1.000 e checkpoint.

## Por que JSON e não o XLS de 16 colunas

`consultaProcesso/downloadListArquivo` (XLS) aceita só `{filter, limit}` —
o app manda `limit: totalRegistro`, ou seja, o acervo inteiro numa
requisição só. A página de 5.000 já deu **504** uma vez (medido), e o XLS
de 205 mil linhas é justamente o pedido que estoura o gateway. A rota JSON
gêmea aceita `pagina` e traz mais campos (sigla do tipo, validade,
situação, zona, área, coordenadas). Mesmo dado, fatiável, sem parser BIFF
artesanal. `fiscalizacao/downloadListArquivo` está 500/504 desde a
sondagem; o JSON dos autos funciona.

`statusJulgamento` do auto vem como **código** (0..31). O coletor troca pelo
rótulo do próprio app (`STATUS_JULGAMENTO`, lido do `bundle.js`): "16" não diz
nada ao leitor; "Período de Recurso" diz. Código fora da lista fica como veio.

## Paginação e checkpoint

⚠️ **A paginação da fonte engana.** `pagina` NÃO é o índice do lote: o
servidor multiplica `pagina` por **10** (o limite padrão do app), não pelo
`limit` enviado. Medido em 18/11/2026: com `limit: 1000`, `pagina: 1`
devolveu 990 dos 1.000 registros de `pagina: 0`, e só `pagina: 100`
começou no registro 1.000. Ou seja: paginar de 1 em 1 rebaixa o acervo a
~3 mil registros distintos (205 mil linhas baixadas para 3.050 únicas — a
primeira rodada fez exatamente isso, e o dedupe por `processoId` gritou).
Por isso o coletor anda `pagina = lote × 100`. Lote = 1.000 registros.

A chave de deduplicação muda por rota: processo usa `processoId`; auto usa
`numeroDocumento`, porque `processoId` do auto vem **vazio em 1.333 dos
17.974** e se repete quando um processo tem mais de uma autuação.

Cada lote baixado vira `scripts/.cache/semace-ce/<rota>/lote-00000.json` e
só depois entra em `lotes_ok` do checkpoint: re-rodar não rebaixa lote.
Lote que falhar (504/timeout/corpo vazio/JSON corrompido) fica de fora de
`lotes_ok`, a rodada segue e o JSON final diz quantos faltaram
(`lotes_pendentes`) e marca `truncado: true`.

## Dado pessoal

As duas rotas devolvem `cpfCnpj`, `interessado` (licenciamento) e
`cliente` (fiscalização) em texto claro. Regra do projeto:
- CPF nunca é gravado: run de 11 dígitos vira `null` + `doc_redigido: 1`;
- só CNPJ de 14 dígitos é mantido;
- `interessado` e `cliente` nem entram na linha — nome de pessoa física
  não interessa à página;
- texto livre passa pelo removedor de CPF (padrão de dígitos, não lista).

Rodar:
    python scripts/coletar-semace-ce.py --dry-run      # só mede os totais
    python scripts/coletar-semace-ce.py --limite 2000  # teste fatiado
    python scripts/coletar-semace-ce.py                # tudo (retoma do cache)
    python scripts/coletar-semace-ce.py --resumo       # remonta do cache, SEM rede
    python scripts/coletar-semace-ce.py --refetch      # rebaixa todos os lotes

## Duas saídas, e nenhuma delas mente sobre ser completa

1. `scripts/.cache/semace-ce/completo.json` — o acervo **linha a linha**
   (205.820 processos + 21.955 autos, ~54 MB). Fica no `.cache`, que é
   ignorado pelo git: 54 MB não entram no repositório.
2. `apps/web/data/semace-ce.json` — a versão **publicável**, com limite de
   2 MB: cabeçalho com os totais, as contagens (`resumo_por_situacao`,
   `resumo_por_ano`, `resumo_por_municipio`, `resumo_por_tipo`,
   `resumo_por_julgamento`, valor total autuado) e uma **amostra rotulada**
   de 300 linhas por bloco. Ela diz de quantas linhas é amostra e aponta o
   arquivo completo em `linhas_completas_em`.

`--resumo` monta o publicável (e reescreve o completo) a partir dos lotes em
cache, sem uma requisição sequer — serve para depois de mexer só no formato.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
import time
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
from datetime import datetime, timezone
from pathlib import Path

WS = "https://servicos.semace.ce.gov.br/SemaceMobileWS/webService/"
PORTAL = "https://servicos.semace.ce.gov.br/consultaProcesso"
CACHE = Path(__file__).resolve().parent / ".cache" / "semace-ce"
COMPLETO = CACHE / "completo.json"        # acervo linha a linha, fora do git
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "semace-ce.json"
AMOSTRA = 300                             # linhas por bloco no arquivo publicável
UA = "finweejur/github artur colito"

PAUSA = 2          # s entre requisições ao mesmo host (regra do projeto)
LOTE = 1000        # registros por requisição; 5.000 já deu 504 (medido)
TIMEOUT = 120

RESSALVA = ("Processo em análise ou com licença emitida não é licença em vigor; "
            "auto de fiscalização não é condenação — cabe defesa e o julgamento "
            "pode arquivar. Números da fonte, reproduzidos sem juízo nosso.")

# `statusJulgamento` vem como CÓDIGO (0..31). O vocabulário abaixo é o switch
# `statusJulgamento` do próprio bundle.js da SEMACE (lido em 18/11/2026) — não
# é tradução nossa. Código fora da lista fica como a fonte mandou.
STATUS_JULGAMENTO = {
    0: "Aguardando Envio do Auto de Infração",
    1: "Aguardando AR do Auto de Infração Defesa",
    2: "Período de Defesa",
    3: "Aguardando Distribuição - Parecer Instrutório",
    4: "Aguardando Elaboração do Parecer Instrutório",
    5: "Elaborando Parecer Instrutório",
    6: "Aguardando Comunicação - Parecer Instrutório",
    7: "Aguardando AR - Parecer Instrutório",
    8: "Período de Alegação",
    9: "Aguardando Distribuição - Decisão de 1ª Instância",
    10: "Aguardando Decisão de 1ª Instância",
    11: "Elaborando Decisão de 1ª Instância",
    12: "Decisão de 1ª Instância Concluída",
    13: "Aguardando AR - Decisão 1ª Instância",
    14: "Transitado em Julgado",
    15: "Suspenso",
    16: "Período de Recurso",
    17: "Aguardando Auto de Infração Entregue Pessoalmente",
    18: "Aguardando Confirmação do Parecer Instrutório Entregue Pessoalmente",
    19: "Aguardando Decisão de Julgamento Entregue Pessoalmente",
    20: "Aguardando Auto de Infração Publicado em Edital",
    21: "Aguardando Parecer Instrutório Publicado em Edital",
    22: "Aguardando Decisão Publicada em Edital",
    23: "Parecer Instrutório Concluído",
    24: "Aguardando Comunicação - Decisão Em 1ª Instância",
    25: "Julgado em 1ª Instância",
    26: "Encaminhado para Câmara Recursal (2ª Instância)",
    27: "Aguardando Validação da Defesa",
    28: "Aguardando Conclusão do Raia - Fase Instrução",
    29: "Aguardando Conclusão do Raia - Fase Decisão",
    30: "Aguardando Validação da Alegação",
    31: "Aguardando Validação do Recurso",
}

# Filtro que o app monta quando o formulário vai vazio (19 chaves, medidas no
# bundle.js de 18/11/2026). `{"filter": {}}` e filtro parcial dão HTTP 500.
FILTRO_PROCESSO = {
    "spuId": None, "cpfCnpj": None, "interessado": None, "zona": None,
    "cidadeId": None, "cidade": None, "cidadeFiltro": "", "endereco": None,
    "tipoProcessoID": None, "atividade": None, "atividadeDescricao": None,
    "licencaId": None, "opcoesLicencas": None, "digital": "ambos",
    "digitalFilter": "ambos", "dataEmissaoRanger": None, "dataRanger": None,
    "apenasUC": False, "unidadesConservacoes": "",
}

# Idem para a fiscalização: os 9 campos do formulário. `cidadeId` tem de ser
# null — lista vazia faz o servidor devolver 500 (medido em 18/11/2026).
FILTRO_AUTO = {
    "spuId": None, "numeroDocumento": None, "tipoProcessoId": None,
    "descricao": None, "cpfCnpj": None, "cliente": None, "cidadeId": None,
    "dataRangerTermos": None, "dataRangerNotificacao": None,
}

COLUNAS = {
    "processos": ["processo", "spu", "tipo", "sigla", "municipio", "atividade",
                  "empreendimento_atividade", "abertura", "emissao", "validade",
                  "situacao", "zona", "area", "digital", "licenca", "cnpj",
                  "doc_redigido"],
    "autos": ["processo", "spu", "tipo", "numero_documento", "autuado_em",
              "municipio", "uf", "descricao", "valor", "tipo_infracao", "dae",
              "status_julgamento", "fundamentos", "utm_e", "utm_n", "cnpj",
              "doc_redigido"],
}

ROTAS = {
    "processos": {
        "caminho": "consultaProcesso/processos",
        "filtro": FILTRO_PROCESSO,
        "resumo": "situacao",
    },
    "autos": {
        "caminho": "fiscalizacao/findProcessosFiscalizacao",
        "filtro": FILTRO_AUTO,
        "resumo": "status_julgamento",
        # `processoId` NÃO identifica auto: vem vazio em 1.333 dos 17.974 e se
        # repete quando um processo tem mais de uma autuação. A chave é o número
        # do próprio auto (coluna 3).
        "chave": 3,
        # Medido em 18/11/2026: a ordenação dos autos balança ~10% entre
        # janelas de 1.000 (2.358 duplicados e 2.332 buracos na 1ª rodada) e
        # ~0,1% em janelas de 2.000. Janela maior, menos fronteira, menos
        # buraco. 16 s por requisição: perto do limite de 30 s do gateway.
        "lote": 2000,
    },
}


def log(msg: str) -> None:
    print(f"[coletar-semace-ce] {msg}", flush=True)


# ---------------------------------------------------------------- sanitização

def _doc(v) -> tuple[str | None, int]:
    """(cnpj, doc_redigido). Só CNPJ de 14 dígitos passa; 11 dígitos (CPF,
    válido por mod-11 ou não) nunca é gravado."""
    d = re.sub(r"\D", "", str(v or ""))
    if len(d) == 14:
        return d, 0
    return None, 1 if len(d) == 11 else 0


def _cpf_valido(digitos: str) -> bool:
    """mod-11 de CPF — usado no teste, para provar que o redator pega CPF real."""
    if len(digitos) != 11 or len(set(digitos)) == 1:
        return False
    for corte in (9, 10):
        soma = sum(int(d) * (corte + 1 - i) for i, d in enumerate(digitos[:corte]))
        dv = (soma * 10) % 11 % 10
        if dv != int(digitos[corte]):
            return False
    return True


def _sem_cpf(texto):
    """Apaga runs de 11 dígitos de texto livre (padrão genérico)."""
    if texto is None:
        return None
    limpo = re.sub(r"\d[\d.\-]{8,}\d",
                   lambda m: "" if len(re.sub(r"\D", "", m.group(0))) == 11 else m.group(0),
                   str(texto))
    return " ".join(limpo.split()) or None


def _data(v):
    if not v:
        return None
    return str(v)[:10]


def _texto(v, limite=300):
    if v is None:
        return None
    return _sem_cpf(str(v))[:limite] if str(v) else None


def _linha_processo(r: dict) -> list:
    cnpj, redig = _doc(r.get("cpfCnpj"))
    return [
        r.get("processoId"), r.get("spuId"), _texto(r.get("tipoProcesso"), 120),
        r.get("siglaTipo"), r.get("cidade"), _texto(r.get("atividade"), 180),
        _texto(r.get("empreendimentoAtividade"), 180),
        _data(r.get("dataCadastro")), _data(r.get("dataEmissao")),
        _data(r.get("dataValidade")), _texto(r.get("situacao"), 120),
        r.get("zona"), r.get("area"), r.get("digital"), r.get("licencaId"),
        cnpj, redig,
    ]


def _num_auto(v) -> tuple:
    """Número do auto de infração. Quase todos têm prefixo ("M2018...-TRM"); uns
    poucos vêm como 11 dígitos (ano + sequencial) que passam no mod-11 e seriam
    lidos como CPF. A régua do repositório não distingue: nesses dois, sai null
    e doc_redigido=1 — 2 dos 21.955, medidos em 18/11/2026."""
    d = re.sub(r"\D", "", str(v or ""))
    if len(d) == 11 and _cpf_valido(d):
        return None, 1
    return v, 0


def _linha_auto(r: dict) -> list:
    cnpj, redig = _doc(r.get("cpfCnpj"))
    numero, num_redig = _num_auto(r.get("numeroDocumento"))
    redig = max(redig, num_redig)
    valor = r.get("valor")
    try:
        valor = round(float(valor), 2) if valor not in (None, "") else None
    except (TypeError, ValueError):
        valor = None
    fund = r.get("fundamentacao")
    codigo = r.get("statusJulgamento")
    status = STATUS_JULGAMENTO.get(int(codigo), codigo) if str(codigo).isdigit() else codigo
    return [
        r.get("processoId"), r.get("spuId"), _texto(r.get("tipoProcesso"), 120),
        numero, _data(r.get("dataAutuado")), r.get("cidade"),
        r.get("estado"), _texto(r.get("descricao"), 300), valor,
        _texto(r.get("tipoInfracao"), 120), r.get("dae"),
        status, len(fund) if isinstance(fund, list) else None,
        r.get("coordutmme"), r.get("coordutmmn"), cnpj, redig,
    ]


LINHA = {"processos": _linha_processo, "autos": _linha_auto}


# ---------------------------------------------------------------- HTTP

def _post_dados(corpo_bytes: bytes) -> dict:
    """Valida o CORPO: 200 com corpo vazio não é sucesso; corpo que não é JSON
    também não (o gateway devolve HTML de 504 com status enganoso)."""
    if not corpo_bytes:
        raise ValueError("HTTP 200 com corpo vazio")
    try:
        dados = json.loads(corpo_bytes.decode("utf-8", "replace"))
    except json.JSONDecodeError as e:
        raise ValueError(f"corpo não é JSON ({len(corpo_bytes)} B): {e}") from e
    if not isinstance(dados, dict):
        raise ValueError(f"JSON inesperado: {type(dados).__name__}")
    return dados


def _post(caminho: str, corpo: dict) -> dict:
    """POST com `Content-Type: text/plain` (o app manda assim; application/json
    devolve 415)."""
    req = urllib.request.Request(
        WS + caminho, data=json.dumps(corpo).encode(),
        headers={"User-Agent": UA, "Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return _post_dados(resp.read())


def _registros(dados: dict) -> list:
    """A lista vem em `processos` nas duas rotas; procura a primeira lista de
    dicionários para não quebrar se a fonte renomear."""
    for chave in ("processos", "lista", "list", "items", "data"):
        v = dados.get(chave)
        if isinstance(v, list):
            return v
    for v in dados.values():
        if isinstance(v, list) and (not v or isinstance(v[0], dict)):
            return v
    return []


# ---------------------------------------------------------------- checkpoint

def _arq_ckpt() -> Path:
    return CACHE / "checkpoint.json"


def _ler_ckpt() -> dict:
    CACHE.mkdir(parents=True, exist_ok=True)
    if _arq_ckpt().exists():
        try:
            return json.loads(_arq_ckpt().read_text(encoding="utf-8"))
        except Exception:
            log("checkpoint ilegível — recomeçando")
    return {"rotas": {}}


def _salvar_ckpt(ckpt: dict) -> None:
    ckpt["ata"] = datetime.now(timezone.utc).isoformat()
    arq = _arq_ckpt()
    tmp = arq.with_suffix(".parcial")
    tmp.write_text(json.dumps(ckpt, ensure_ascii=False), encoding="utf-8")
    tmp.replace(arq)  # Windows: rename atômico com o alvo fora do caminho


def _dir_lotes(rota: str) -> Path:
    d = CACHE / rota
    d.mkdir(parents=True, exist_ok=True)
    return d


def _arq_lote(rota: str, pagina: int) -> Path:
    return _dir_lotes(rota) / f"lote-{pagina:05d}.json"


def _ler_lote(rota: str, pagina: int) -> list | None:
    arq = _arq_lote(rota, pagina)
    if not arq.exists():
        return None
    try:
        v = json.loads(arq.read_text(encoding="utf-8"))
        return v if isinstance(v, list) else None
    except Exception:
        return None


def _gravar_lote(rota: str, pagina: int, linhas: list) -> None:
    arq = _arq_lote(rota, pagina)
    tmp = arq.with_suffix(".parcial")
    tmp.write_text(json.dumps(linhas, ensure_ascii=False), encoding="utf-8")
    tmp.replace(arq)


# ---------------------------------------------------------------- coleta

def _coletar(rota: str, ckpt: dict, limite: int | None, refetch: bool) -> dict:
    """Baixa os lotes que faltam de uma rota. Devolve o estado do checkpoint
    dela: {"total_fonte", "lotes_ok": [...], "pendentes": {...}}."""
    cfg = ROTAS[rota]
    lote = cfg.get("lote") or LOTE
    estado = ckpt.setdefault("rotas", {}).setdefault(rota, {})
    lotes_ok = set() if refetch else set(int(p) for p in estado.get("lotes_ok", []))
    estado["lotes_ok"] = sorted(lotes_ok)

    def pedir(indice: int) -> dict:
        # MEDIDO em 18/11/2026: o servidor multiplica `pagina` por 10 (o limite
        # padrão do app), não pelo `limit` enviado. Pedir pagina=1 devolve 990
        # dos 1.000 registros da pagina=0; pagina=100 começa no registro 1.000.
        # Então o lote de N registros anda de N/10 em N/10 páginas.
        return _post(cfg["caminho"], {"filter": cfg["filtro"], "limit": lote,
                                      "pagina": indice * max(1, lote // 10)})

    # A página 0 dá o total. Se já está em cache e não pedimos refetch, ainda
    # assim precisamos do total atual — 1 requisição barata por rodada.
    total = None
    primeira = None
    if 0 in lotes_ok:
        total = estado.get("total_fonte")
        if total is None:
            total = sum(len(_ler_lote(rota, p) or []) for p in lotes_ok)

    pendentes: dict[str, str] = {}
    falhou_abertura = False
    if total is None:
        for tentativa in (1, 2):
            try:
                dados = pedir(0)
                total = int(dados.get("totalRegistro") or 0)
                primeira = dados
                break
            except Exception as e:
                motivo = f"{type(e).__name__}: {e}"
                log(f"{rota} lote 0: falhou ({motivo})")
                if tentativa == 2:
                    falhou_abertura = True
                    pendentes["0"] = motivo
                else:
                    time.sleep(PAUSA * 3)

    if total:
        estado["total_fonte"] = total
    else:
        total = estado.get("total_fonte") or 0

    # MEDIDO em 18/11/2026: `totalRegistro` é PISO, não tamanho do acervo. A
    # fiscalização declara 17.974 e devolve autos até o offset 22.026; o
    # licenciamento declara 205.820 e ainda tem 6 registros em 205.820. Então a
    # varredura vai até a primeira página vazia, com teto de segurança para não
    # girar para sempre se a fonte passar a devolver lixo.
    fim = estado.get("fim")          # índice da 1ª página vazia, quando já sabido
    if limite is not None:
        n_indices = math.ceil(min(total, limite) / lote) if total else 0
    elif fim is not None:
        n_indices = fim
    else:
        n_indices = math.ceil(max(total, lote) / lote) + max(4, math.ceil(total / lote * 0.35))
    log(f"{rota}: total declarado {total:,} | lotes até {n_indices} de {lote}"
        + (f" (fim já medido no lote {fim})" if fim is not None else "")
        + ("" if not falhou_abertura else " | abertura falhou"))

    falhas = 0
    n_paginas = n_indices

    for indice in range(n_indices):
        if indice in lotes_ok:
            continue
        if indice == 0 and primeira is not None:
            dados = primeira
        else:
            time.sleep(PAUSA)
            try:
                dados = pedir(indice)
            except Exception as e:
                motivo = f"{type(e).__name__}: {e}"[:160]
                pendentes[str(indice)] = motivo
                falhas += 1
                log(f"{rota} lote {indice:>5}/{n_indices - 1}: PENDENTE ({motivo})")
                if falhas >= 3:
                    # Medido em 18/11/2026: o gateway devolve 504 em 30 s para
                    # TODA rota (até infofilters) quando a fonte degrada.
                    # Insistir nos 200 lotes restantes seria 1h40 martelando
                    # servidor já quebrado. Para aqui; a próxima rodada retoma.
                    log(f"{rota}: 3 falhas seguidas — fonte instável, "
                        f"parando esta rota nesta rodada. Lotes restantes ficam pendentes.")
                    break
                continue
        falhas = 0
        brutos = _registros(dados)
        if not brutos:
            if limite is None:
                estado["fim"] = indice      # acervo terminou aqui
                n_paginas = indice
            log(f"{rota} lote {indice:>5}/{n_indices - 1}: vazio — fim do acervo")
            break
        linhas = [LINHA[rota](r) for r in brutos if isinstance(r, dict)]
        _gravar_lote(rota, indice, linhas)
        lotes_ok.add(indice)
        pendentes.pop(str(indice), None)   # motivo antigo não fica pendurado
        estado["lotes_ok"] = sorted(lotes_ok)
        estado["lotes_pendentes"] = pendentes
        _salvar_ckpt(ckpt)
        log(f"{rota} lote {indice:>5}/{n_indices - 1}: +{len(linhas)} "
            f"(acumulado {len(lotes_ok)} lotes)")

    if limite is None and "fim" in estado:
        n_paginas = min(n_paginas, estado["fim"]) if n_paginas else estado["fim"]
    estado["lotes_pendentes"] = pendentes
    estado["n_paginas"] = n_paginas
    estado["fim"] = estado.get("fim")
    _salvar_ckpt(ckpt)
    return {"total_fonte": total, "lotes_ok": lotes_ok,
            "pendentes": pendentes, "n_paginas": n_paginas,
            "fim_medido": estado.get("fim") is not None}


def _montar(rota: str, estado: dict, limite: int | None) -> tuple[list, dict]:
    """Lê os lotes do cache, deduplica pela chave da rota e fecha os números."""
    i_chave = ROTAS[rota].get("chave", 0)
    linhas: list[list] = []
    vistos: set = set()
    duplicados = 0
    for pagina in sorted(estado["lotes_ok"]):
        for linha in _ler_lote(rota, pagina) or []:
            chave = linha[i_chave] or f"{pagina}-{len(linhas)}"   # sem chave: não deduplica
            if chave in vistos:
                duplicados += 1
                continue
            vistos.add(chave)
            linhas.append(linha)
    if limite is not None:
        linhas = linhas[:limite]

    total = estado["total_fonte"]
    pendentes = estado.get("pendentes") or {}
    # Pendente é toda página esperada que não está no cache — inclusive a que
    # nem foi tentada (fonte instável no meio da rodada).
    faltando = [p for p in range(estado.get("n_paginas") or 0)
                if p not in estado["lotes_ok"]]
    # `truncado` = falta lote, ou o corte do --limite, ou veio MENOS que o total
    # declarado. Acervo maior que o declarado passa (a fonte declara piso) mas
    # fica visível em `divergencia_fonte`, e o `obs` diz o que foi medido.
    truncado = bool(faltando) or (limite is not None and limite < total) \
        or len(linhas) < total
    return linhas, {"total_fonte": total, "total_coletado": len(linhas),
                    "divergencia_fonte": len(linhas) - total,
                    "fim_do_acervo_medido": bool(estado.get("fim_medido")),
                    "lotes_pendentes": len(faltando),
                    "lotes_pendentes_detalhe": dict(list(pendentes.items())[:20]),
                    "duplicados_removidos": duplicados, "truncado": truncado}


def _resumos(rota: str, linhas: list[list]) -> dict:
    """Contagens que a página publica. `abertura` é a única data que nunca vem
    nula no licenciamento (70.865 dos 205.820 não têm `emissao`)."""
    i_mun = COLUNAS[rota].index("municipio")
    i_sit = COLUNAS[rota].index(ROTAS[rota]["resumo"])
    por_mun: dict[str, int] = {}
    por_sit: dict[str, int] = {}

    def soma(d: dict, chave, vazio="sem informação"):
        k = str(chave or vazio)
        d[k] = d.get(k, 0) + 1

    for linha in linhas:
        soma(por_mun, linha[i_mun], "sem município")
        soma(por_sit, linha[i_sit])

    out = {
        "resumo_por_municipio": dict(sorted(por_mun.items(), key=lambda kv: -kv[1])),
        ("resumo_por_situacao" if rota == "processos"
         else "resumo_por_julgamento"): dict(sorted(por_sit.items(), key=lambda kv: -kv[1])),
    }
    if rota == "processos":
        i_ano = COLUNAS[rota].index("abertura")
        por_ano: dict[str, int] = {}
        for linha in linhas:
            soma(por_ano, str(linha[i_ano] or "")[:4] or None, "sem data")
        out["resumo_por_ano"] = dict(sorted(por_ano.items()))
    else:
        i_tipo = COLUNAS[rota].index("tipo")
        i_infr = COLUNAS[rota].index("tipo_infracao")
        i_valor = COLUNAS[rota].index("valor")
        por_tipo: dict[str, int] = {}
        por_infr: dict[str, int] = {}
        total = 0.0
        com_valor = 0
        for linha in linhas:
            soma(por_tipo, linha[i_tipo])
            soma(por_infr, linha[i_infr])
            if linha[i_valor]:
                total += float(linha[i_valor])
                com_valor += 1
        out["resumo_por_tipo"] = dict(sorted(por_tipo.items(), key=lambda kv: -kv[1]))
        out["resumo_por_tipo_infracao"] = dict(sorted(por_infr.items(), key=lambda kv: -kv[1]))
        out["valor_total_autuado"] = round(total, 2)
        out["autos_com_valor"] = com_valor
    return out


def _estado_do_checkpoint(rota: str, ckpt: dict) -> dict:
    """Estado de uma rota lido do checkpoint — base do modo --resumo (sem rede)."""
    c = ckpt.get("rotas", {}).get(rota, {})
    return {"total_fonte": c.get("total_fonte") or 0,
            "lotes_ok": set(int(p) for p in c.get("lotes_ok") or []),
            "pendentes": c.get("lotes_pendentes") or {},
            "n_paginas": c.get("n_paginas") or 0,
            "fim_medido": c.get("fim") is not None}


def _publicavel(blocos: dict, colunas: dict) -> dict:
    """Versão de bolso para o build: cabeçalho + resumos + amostra rotulada.

    Ela NÃO é o acervo — por isso o cabeçalho carrega os totais e a amostra diz
    de quantas linhas é amostra, e `linhas_completas_em` aponta o arquivo cheio.
    """
    proc, auto = blocos["processos"], blocos["autos"]
    truncado = proc["truncado"] or auto["truncado"]
    raiz = Path(__file__).resolve().parent.parent
    onde = (COMPLETO.relative_to(raiz) if COMPLETO.is_relative_to(raiz) else COMPLETO)
    return {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": "SEMACE-CE",
        "url_fonte": PORTAL,
        "truncado": truncado,
        "linhas_completas_em": onde.as_posix(),
        "processos": {
            "total_fonte": proc["total_fonte"],
            "total_coletado": proc["total_coletado"],
            "truncado": proc["truncado"],
            "lotes_pendentes": proc["lotes_pendentes"],
            "colunas": colunas["processos"],
            **{k: v for k, v in proc.items() if k.startswith("resumo_por_")},
            "amostra": {
                "rotulo": f"primeiras {len(proc['amostra'])} de "
                          f"{proc['total_coletado']:,} linhas".replace(",", "."),
                "colunas": colunas["processos"],
                "linhas": proc["amostra"],
            },
        },
        "autos": {
            "total_fonte": auto["total_fonte"],
            "total_coletado": auto["total_coletado"],
            "truncado": auto["truncado"],
            "lotes_pendentes": auto["lotes_pendentes"],
            "colunas": colunas["autos"],
            "valor_total_autuado": auto["valor_total_autuado"],
            "autos_com_valor": auto["autos_com_valor"],
            **{k: v for k, v in auto.items() if k.startswith("resumo_por_")},
            "amostra": {
                "rotulo": f"primeiras {len(auto['amostra'])} de "
                          f"{auto['total_coletado']:,} linhas".replace(",", "."),
                "colunas": colunas["autos"],
                "linhas": auto["amostra"],
            },
        },
        "ressalva_editorial": RESSALVA,
        "obs": ("Licenciamento e fiscalização ambiental do Ceará direto da API "
                "SemaceMobileWS. ESTE ARQUIVO É RESUMO: carrega os totais, as "
                "contagens e uma amostra rotulada de cada bloco; o acervo linha a "
                "linha está em `linhas_completas_em` (cache local, fora do git). "
                "`total_fonte` é o total DECLARADO pela fonte; `total_coletado` é "
                "o que o coletor trouxe (a fiscalização declara menos do que "
                "serve, e isso aparece na diferença entre os dois). "
                "`municipio` é o campo `cidade` da fonte — endereço do "
                "interessado/autuado, que traz 'S/N' e municípios de fora do CE; "
                "não é o local do empreendimento. `ano` do licenciamento é o da "
                "abertura do processo (70.865 não têm data de emissão). "
                "CPF não é gravado: run de 11 dígitos vira null + doc_redigido=1; "
                "nomes de pessoa física (interessado/cliente) não entram. "
                "`truncado` só é false com todos os lotes no cache, sem corte de "
                "--limite e sem pendência."),
    }


def main() -> None:
    global LOTE
    p = argparse.ArgumentParser(description="Coletor SEMACE-CE (licenciamento e fiscalização)")
    p.add_argument("--dry-run", action="store_true", help="só mede os totais, não grava")
    p.add_argument("--limite", type=int, default=None, help="máximo de registros por rota")
    p.add_argument("--refetch", action="store_true", help="ignora o cache e rebaixa os lotes")
    p.add_argument("--resumo", action="store_true",
                   help="monta só o arquivo publicável, do cache, sem rede")
    p.add_argument("--lote", type=int, default=LOTE,
                   help=f"registros por requisição (padrão {LOTE}; reduza se a fonte estiver lenta)")
    args = p.parse_args()

    LOTE = args.lote
    if LOTE % 10:
        log(f"[!] --lote {LOTE} não é múltiplo de 10 (a fonte anda de 10 em 10)")

    log(f"saida: {SAIDA}")
    log(f"robots: servicos.semace.ce.gov.br 404 (sem Disallow); ritmo {PAUSA}s; UA honesto")

    ckpt = _ler_ckpt()
    if args.refetch:
        for rota in ROTAS:
            ckpt.setdefault("rotas", {}).pop(rota, None)
        _salvar_ckpt(ckpt)

    if args.dry_run:
        for rota in ROTAS:
            lote = ROTAS[rota].get("lote") or LOTE
            try:
                dados = _post(ROTAS[rota]["caminho"],
                              {"filter": ROTAS[rota]["filtro"], "limit": 10, "pagina": 0})
                total = dados.get("totalRegistro") or 0
                log(f"{rota}: totalRegistro={total} amostra={len(_registros(dados))} "
                    f"lotes(pelo declarado, {lote}/lote)={math.ceil(total / lote)} "
                    f"— a varredura segue até a 1ª página vazia")
            except Exception as e:
                log(f"{rota}: sondagem falhou ({type(e).__name__}: {e})")
            time.sleep(PAUSA)
        log("dry-run: nada foi gravado")
        return

    estados = {}
    if args.resumo:
        log("modo --resumo: monta do cache, SEM rede")
        for rota in ROTAS:
            estados[rota] = _estado_do_checkpoint(rota, ckpt)
    else:
        for rota in ROTAS:
            estados[rota] = _coletar(rota, ckpt, args.limite, args.refetch)
            time.sleep(PAUSA)

    blocos = {}
    for rota in ROTAS:
        linhas, nums = _montar(rota, estados[rota], args.limite)
        if not linhas:
            log(f"[!] {rota}: nenhuma linha no cache — bloco vazio, nada a publicar")
        blocos[rota] = {
            "fonte": "SEMACE (Superintendência Estadual do Meio Ambiente do Ceará)",
            "url_fonte": WS + ROTAS[rota]["caminho"],
            "colunas": COLUNAS[rota],
            **nums,
            **_resumos(rota, linhas),
            "amostra": linhas[:AMOSTRA],
            "linhas": linhas,
        }

    if not blocos["processos"]["linhas"]:
        log("[!] nenhum processo coletado — o arquivo existente NÃO foi sobrescrito")
        return

    # Lição do coletor da ANA (18/11/2026): rodada que produz menos que o já
    # publicado não sobrescreve calada. Aqui o risco é `--limite` rodado depois
    # de uma coleta completa — 2.000 linhas apagariam 205.820.
    if args.limite and SAIDA.exists():
        try:
            antigo = json.loads(SAIDA.read_text(encoding="utf-8"))
            n_antigo = int((antigo.get("processos") or {}).get("total_coletado") or 0)
        except Exception:
            n_antigo = 0
        if blocos["processos"]["total_coletado"] < n_antigo:
            log(f"[!] --limite {args.limite} produziria "
                f"{blocos['processos']['total_coletado']:,} linhas contra {n_antigo:,} "
                f"já publicadas — o arquivo NÃO foi sobrescrito")
            return

    # 1) acervo completo no cache (fora do git): 53 MB não entra no repositório
    completo = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": "SEMACE-CE",
        "url_fonte": PORTAL,
        "truncado": blocos["processos"]["truncado"] or blocos["autos"]["truncado"],
        "processos": blocos["processos"],
        "autos": blocos["autos"],
        "ressalva_editorial": RESSALVA,
    }
    COMPLETO.parent.mkdir(parents=True, exist_ok=True)
    COMPLETO.write_text(json.dumps(completo, ensure_ascii=False, separators=(",", ":")),
                        encoding="utf-8")

    # 2) resumo publicável (<= 2 MB) para o build
    saida = _publicavel(blocos, COLUNAS)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")

    auto = blocos["autos"]
    log(f"[ok] completo {COMPLETO.stat().st_size / 1e6:.1f} MB em {COMPLETO}")
    log(f"[ok] processos {blocos['processos']['total_coletado']:,}/"
        f"{blocos['processos']['total_fonte']:,} em "
        f"{len(blocos['processos']['resumo_por_municipio']):,} municípios; "
        f"autos {auto['total_coletado']:,}/{auto['total_fonte']:,}; "
        f"pendentes: processos {blocos['processos']['lotes_pendentes']}, "
        f"autos {auto['lotes_pendentes']}; truncado={saida['truncado']}")
    log(f"[ok] publicável {SAIDA.stat().st_size / 1024:.0f} KB em {SAIDA}")


if __name__ == "__main__":
    main()
