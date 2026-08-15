r"""etl.apis.adaptabrasil_risco — **índice** de risco climático por município,
do AdaptaBrasil (MCTI/INPE/RNP), para `adaptabrasil_indicadores` (migration
`0074`).

Primeira fatia de `docs/PLANO-BASES-CLIMA-E-RISCO.md` §1 — a fonte que o
plano coloca em primeiro lugar por ter API pública sem login, cobrir as 853
cidades de MG numa chamada só e ter licença confirmada.

Fonte: `https://sistema.adaptabrasil.mcti.gov.br/api/`, REST, sem
autenticação. Duas rotas usadas aqui:

    GET /api/hierarquia/adaptabrasil
        → catálogo dos 558 indicadores (nome, nível, ano-base, cenários)
    GET /api/mapa-dados/{uf}/municipio/{indicador}/{ano}/{cenario}/adaptabrasil
        → um registro por município da UF

Licença: **CC-BY-SA**, confirmada em
`adaptabrasil.mcti.gov.br/sobre/termos-de-uso`, uso comercial permitido, com
citação obrigatória no formato "AdaptaBrasil MCTI – Setor(es) Estratégico(s)
[nome], acessado em [data] através do link [LINK]". É por isso que cada linha
gravada leva `setor_nome`, `fonte_url` e `atualizado_em`: sem os três a
citação exigida pela licença não pode ser montada na tela.

═══ O QUE ESTE DADO É, E O QUE ELE NÃO É ═══

`valor` é um **índice composto de 0 a 1**, calculado pela metodologia do
AdaptaBrasil (Ameaça × Exposição × Vulnerabilidade, com 14 subcomponentes
por baixo). NÃO é porcentagem, NÃO é contagem de pessoas, NÃO é contagem de
domicílios — nem quando o nome do indicador parece dizer isso (o
subindicador 60039 chama-se "Domicílios em áreas de risco" e vale 0,32 em
Brumadinho: é posição na escala, não 32 domicílios).

Quem quiser publicar GENTE precisa da outra fonte do plano (§2, BATER
IBGE/CEMADEN: 1.377.577 pessoas expostas em MG, Censo 2010 + mapeamento de
risco até abril/2017), que não passa por aqui. `faixa` (Muito baixo..Muito
alto, rótulo da própria fonte) acompanha todo valor porque é o que a fonte
autoriza afirmar em linguagem comum.

═══ POR QUE O PADRÃO COLETA 8 INDICADORES, E NÃO OS 2 DA MANCHETE ═══

Medido em 2026-08-15, e é o achado que muda o desenho deste módulo:
**Belo Horizonte vale 0,00 ("Muito baixo") nos DOIS índices de manchete** —
deslizamento (60001) e inundação (60041) — e é a única cidade grande de MG
nessa situação (só ela e Funilândia zeram). A mesma Belo Horizonte que o
BATER/IBGE mede com **389.218 pessoas em área de risco**, 16,4% da
população.

Não é erro de coleta; é o que a composição do índice faz. Abrindo o 60001
para BH na mesma chamada:

    Ameaça (60004) ................................. 0,86  Muito alto
    Exposição (60003) .............................. 0,91  Muito alto
    Domicílios em áreas de risco (60039) ........... 1,00  Muito alto  (o teto)
    Vulnerabilidade (60002) ........................ 0,00  Muito baixo
    ──────────────────────────────────────────────────────────────────
    Risco (60001) = Ameaça × Exposição × Vulnerabilidade ... 0,00

A capacidade adaptativa da capital zera o produto, e o número de manchete
some com a ameaça, a exposição e as moradias em risco no mesmo passo.
Publicar só o 60001 diria à cidade com MAIS gente em área de risco do estado
que o risco dela é "muito baixo".

Por isso o padrão deste módulo são os 8 indicadores: os 2 de manchete e as 3
componentes de cada um (Vulnerabilidade, Exposição, Ameaça). A tela pode
escolher o que mostrar; o banco não pode escolher não ter a decomposição.

═══ ARMADILHAS MEDIDAS AO VIVO (2026-08-15) ═══

1. **Sem `User-Agent`, a API devolve HTTP 403** (919 bytes) — não é bloqueio
   a robô em geral: o UA do projeto (`ControlePopular/1.0`) responde 200, não
   precisa fingir navegador. O plano não registrava esta.

2. **Ano errado devolve `[]` com HTTP 200**, em silêncio. Cada indicador tem
   seu próprio `years` na hierarquia (60001 e 60041: `[2015, 2030, 2050]`).
   Este módulo NÃO tem ano hardcoded: lê `years` da hierarquia e, por
   padrão, usa o menor (o presente). Resposta vazia é tratada como ABORT,
   nunca como "coletei zero".

3. **Ano futuro exige `cenario`, e o id do cenário está no nó do SETOR, não
   no do indicador.** 60001 tem `scenarios: null`; quem lista os cenários é
   o 60000 (`40` Otimista/RCP4.5, `41` Pessimista). Chamar
   `/60001/2030/null/` devolve `[]`; `/60001/2030/40/` devolve 853 registros
   (172.785 bytes, medido). O módulo aceita `--ano`/`--cenario` para isso,
   mas o padrão desta rodada é só o presente.

4. **`geocod_ibge` vem como texto de 7 dígitos**, já no formato de
   `ref_municipios_mg.id_ibge` — não precisa de `LPAD` (diferente do
   `codibge` numérico dos pluviômetros do CEMADEN, §3 do plano).

Uso:

    python -m etl.apis.adaptabrasil_risco --sondar    # mede, NÃO grava
    python -m etl.apis.adaptabrasil_risco             # grava (8 indicadores, presente)
    python -m etl.apis.adaptabrasil_risco --indicadores 60001 --ano 2030 --cenario 40
"""
import argparse
import pathlib
import datetime as dt
import sys
from collections import Counter

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import get_supabase_client

LOG = "[etl.apis.adaptabrasil_risco]"

BASE = "https://sistema.adaptabrasil.mcti.gov.br/api"
TIMEOUT = 180
# Armadilha 1: sem UA a API responde 403. O UA do projeto basta — não é
# preciso se passar por navegador (medido em 2026-08-15).
_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

UF_PADRAO = "MG"
# Os 2 índices de manchete do setor 60000 (Desastres geo-hidrológicos) e as 3
# componentes de cada um. Ver "POR QUE O PADRÃO COLETA 8 INDICADORES" no topo:
# sozinho, o índice de manchete diz que Belo Horizonte tem risco "muito
# baixo". Os outros 73 indicadores do setor são subcomponentes de segundo
# nível para baixo e entram, se entrarem, por `--indicadores`.
INDICADORES_PADRAO = (
    60001,  # Deslizamento de terra (índice de risco)
    60002,  # └ Vulnerabilidade
    60003,  # └ Exposição
    60004,  # └ Ameaça
    60041,  # Inundações, enxurradas e alagamentos (índice de risco)
    60042,  # └ Vulnerabilidade
    60043,  # └ Exposição
    60044,  # └ Ameaça
)

FAIXAS_CONHECIDAS = {"Muito baixo", "Baixo", "Médio", "Alto", "Muito alto", "Dado indisponível"}


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = _UA
    return s


@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, min=2, max=30))
def _get(sessao: requests.Session, url: str):
    r = sessao.get(url, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def carregar_hierarquia(sessao: requests.Session) -> dict[int, dict]:
    """Os 558 indicadores do AdaptaBrasil, indexados por id.

    Existe para que o ano e o nome NÃO sejam hardcoded aqui: é a hierarquia
    que diz qual é o ano-base de cada indicador (armadilha 2), quem é o setor
    de nível 1 (que a citação da licença exige nomear) e quais cenários
    existem (armadilha 3).
    """
    dados = _get(sessao, f"{BASE}/hierarquia/adaptabrasil")
    if not isinstance(dados, list) or not dados:
        raise RuntimeError(f"{LOG} hierarquia veio vazia ou em formato inesperado.")
    return {int(it["id"]): it for it in dados if it.get("id") is not None}


def _setor_de(hierarquia: dict[int, dict], indicador_id: int) -> dict:
    """Sobe pela cadeia `indicator_id_master` até o nó de nível 1 (o Setor
    Estratégico). Nível 0 é a raiz conceitual ("Risco Climático"), que não é
    setor de nenhum — se a subida chegar lá, a hierarquia mudou de forma e é
    melhor abortar do que gravar um setor errado na citação da licença."""
    atual = hierarquia.get(indicador_id)
    visitados: set[int] = set()
    while atual is not None and atual.get("level") not in (0, 1):
        mestre = atual.get("indicator_id_master")
        try:
            mestre_id = int(mestre)
        except (TypeError, ValueError):
            break
        if mestre_id in visitados:
            break
        visitados.add(mestre_id)
        atual = hierarquia.get(mestre_id)
    if atual is None or atual.get("level") != 1:
        raise RuntimeError(
            f"{LOG} não achei o setor (nível 1) do indicador {indicador_id} — "
            "a hierarquia da fonte mudou de forma; confira antes de gravar."
        )
    return atual


def _ano_do_indicador(no: dict, ano_pedido: int | None) -> int:
    anos = [int(a) for a in (no.get("years") or [])]
    if not anos:
        raise RuntimeError(
            f"{LOG} indicador {no.get('id')} ({no.get('name')!r}) não tem `years` na "
            "hierarquia — é nó de agregação, não indicador com dado por município."
        )
    if ano_pedido is None:
        # O menor ano é o presente; os maiores são projeção e exigem cenário.
        return min(anos)
    if ano_pedido not in anos:
        raise RuntimeError(
            f"{LOG} ano {ano_pedido} não existe para o indicador {no.get('id')} "
            f"(anos da fonte: {anos}). Chamar assim devolveria [] em silêncio."
        )
    return ano_pedido


def coletar(
    indicadores=INDICADORES_PADRAO,
    *,
    uf: str = UF_PADRAO,
    ano: int | None = None,
    cenario: int | None = None,
) -> list[dict]:
    sessao = _sessao()
    hierarquia = carregar_hierarquia(sessao)
    print(f"{LOG} hierarquia: {len(hierarquia)} indicadores.")

    linhas: list[dict] = []
    for indicador_id in indicadores:
        no = hierarquia.get(int(indicador_id))
        if no is None:
            raise RuntimeError(f"{LOG} indicador {indicador_id} não existe na hierarquia.")
        ano_alvo = _ano_do_indicador(no, ano)
        setor = _setor_de(hierarquia, int(indicador_id))
        try:
            pai_id = int(no["indicator_id_master"])
        except (KeyError, TypeError, ValueError):
            # A raiz da hierarquia manda a string "None" aqui. Um indicador
            # com dado por município sempre tem pai; se não tem, a forma da
            # fonte mudou e gravar sem pai deixaria as componentes homônimas
            # indistinguíveis na tela (ver 0074).
            raise RuntimeError(
                f"{LOG} indicador {indicador_id} sem `indicator_id_master` utilizável "
                f"({no.get('indicator_id_master')!r}) — hierarquia mudou de forma."
            )
        nivel = int(no.get("level") or 0)
        segmento_cenario = "null" if cenario is None else str(cenario)
        url = (
            f"{BASE}/mapa-dados/{uf}/municipio/{indicador_id}/"
            f"{ano_alvo}/{segmento_cenario}/adaptabrasil"
        )
        dados = _get(sessao, url)
        if not isinstance(dados, list) or not dados:
            # Armadilha 2/3: resposta vazia com HTTP 200. Nunca tratar como
            # "coletei zero" — é combinação inválida de ano/cenário.
            raise RuntimeError(
                f"{LOG} {url} devolveu vazio (HTTP 200). Ano {ano_alvo} e cenário "
                f"{segmento_cenario} não combinam para o indicador {indicador_id} — "
                "ano futuro exige `--cenario` (ids no nó do setor)."
            )
        print(
            f"{LOG} indicador {indicador_id} ({no.get('name')}) ano={ano_alvo} "
            f"cenario={segmento_cenario}: {len(dados)} registro(s)."
        )
        for reg in dados:
            valor = reg.get("value")
            if valor is None:
                continue
            valor = float(valor)
            if not 0.0 <= valor <= 1.0:
                # O contrato inteiro deste módulo é "índice de 0 a 1". Se a
                # fonte sair dessa escala, gravar seria publicar uma escala
                # que a tela vai interpretar errado.
                raise RuntimeError(
                    f"{LOG} valor fora da escala 0..1 ({valor}) em "
                    f"{reg.get('geocod_ibge')} / indicador {indicador_id} — "
                    "a fonte mudou de escala, confira antes de gravar."
                )
            faixa = (reg.get("rangelabel") or "").strip()
            if not faixa:
                raise RuntimeError(
                    f"{LOG} registro sem `rangelabel` em {reg.get('geocod_ibge')} — "
                    "sem a faixa o número não pode ser publicado (ver migration 0074)."
                )
            linhas.append(
                {
                    "id_municipio": str(reg["geocod_ibge"]).strip(),
                    "indicador_id": int(reg.get("indicator_id") or indicador_id),
                    "indicador_nome": (no.get("name") or "").strip(),
                    # Desempata as componentes homônimas: "Vulnerabilidade" é
                    # 60002 (deslizamento) e 60042 (inundação). Ver 0074.
                    "indicador_pai_id": pai_id,
                    "nivel": nivel,
                    "setor_id": int(setor["id"]),
                    "setor_nome": (setor.get("name") or "").strip(),
                    "ano": int(reg.get("year") or ano_alvo),
                    "cenario_id": reg.get("scenario_id"),
                    "valor": valor,
                    "faixa": faixa,
                    "cor_hex": (reg.get("valuecolor") or "").strip(),
                    "fonte_url": url,
                    # A licença CC-BY-SA exige citar "acessado em [data]
                    # através do link [LINK]" — a data tem de ser a do
                    # ACESSO, então é gravada a cada rodada em vez de ficar
                    # congelada no default da coluna.
                    "atualizado_em": dt.date.today().isoformat(),
                }
            )
    return linhas


def sondar(indicadores, uf: str, ano: int | None, cenario: int | None) -> None:
    linhas = coletar(indicadores, uf=uf, ano=ano, cenario=cenario)
    print(f"{LOG} {len(linhas)} linha(s) coletada(s) — ÍNDICE de 0 a 1, não contagem de gente.")
    municipios = {l["id_municipio"] for l in linhas}
    print(f"{LOG} {len(municipios)} município(s) distinto(s).")
    for indicador_id in sorted({l["indicador_id"] for l in linhas}):
        do_ind = [l for l in linhas if l["indicador_id"] == indicador_id]
        faixas = Counter(l["faixa"] for l in do_ind)
        nome = do_ind[0]["indicador_nome"]
        # O pai vai junto porque "Vulnerabilidade"/"Exposição"/"Ameaça"
        # existem duas vezes, uma por índice de manchete.
        pai = do_ind[0]["indicador_pai_id"]
        print(f"{LOG} [{indicador_id}] {nome} (dentro de {pai}) — {len(do_ind)} município(s)")
        for faixa, n in sorted(faixas.items(), key=lambda kv: -kv[1]):
            marca = "" if faixa in FAIXAS_CONHECIDAS else "  (FAIXA NOVA NA FONTE)"
            print(f"         {faixa}: {n}{marca}")
        for id_ibge, rotulo in (("3106705", "Betim"), ("3109006", "Brumadinho"), ("3106200", "Belo Horizonte")):
            amostra = [l for l in do_ind if l["id_municipio"] == id_ibge]
            if amostra:
                a = amostra[0]
                print(f"         {rotulo}: índice {a['valor']} ({a['faixa']})")


def sync(indicadores, uf: str, ano: int | None, cenario: int | None) -> None:
    client = get_supabase_client()
    linhas = coletar(indicadores, uf=uf, ano=ano, cenario=cenario)
    if not linhas:
        print(f"{LOG} nada coletado — NÃO apago o que já existe.")
        return
    # Upsert por chave natural (mesma postura de `etl.apis.copam_reunioes`):
    # o recorte não pode encolher por engano — são sempre as 853 cidades da
    # UF —, e reprocessar precisa corrigir valor no lugar, não duplicar.
    # A unique da 0074 é `nulls not distinct`: sem isso, as linhas de
    # `cenario_id IS NULL` nunca casariam e cada rodada duplicaria tudo.
    client.table("adaptabrasil_indicadores").upsert(
        linhas, on_conflict="id_municipio,indicador_id,ano,cenario_id"
    ).execute()
    print(f"{LOG} {len(linhas)} linha(s) gravada(s)/atualizada(s) em adaptabrasil_indicadores.")


def exportar_json(indicadores, uf: str, ano: int | None, cenario: int | None, destino) -> None:
    """Grava o resultado num JSON que o site lê no BUILD, sem passar por banco.

    ⚠️ Existe porque o banco é o gargalo, não a coleta. A Neon está em HTTP 402
    até 2026-09-01 e a máquina de trabalho não tem cópia do Postgres de
    produção — então `sync()` fica bloqueado e, com ele, a tela. Este caminho
    tira o banco da frente para o que a tela precisa: 853 municípios × 8
    indicadores é dado pequeno e sem junção, exatamente o caso em que um
    arquivo versionado serve melhor que uma tabela.

    Não substitui `sync()`: o banco continua sendo o destino para quem for
    cruzar isto com outra tabela. São dois consumidores diferentes.
    """
    import json

    linhas = coletar(indicadores, uf=uf, ano=ano, cenario=cenario)
    if not linhas:
        print(f"{LOG} nada coletado — NÃO sobrescrevo o arquivo que já existe.")
        return

    destino = pathlib.Path(destino)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        json.dumps(
            {
                "gerado_em": dt.datetime.now(dt.timezone.utc).isoformat(),
                "uf": uf,
                "linhas": linhas,
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"{LOG} {len(linhas)} linha(s) em {destino}")


def _parse_indicadores(txt: str) -> tuple[int, ...]:
    ids = tuple(int(p.strip()) for p in txt.split(",") if p.strip())
    if not ids:
        raise argparse.ArgumentTypeError("lista de indicadores vazia")
    return ids


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sondar", action="store_true", help="mede e relata, NÃO grava")
    parser.add_argument(
        "--json",
        metavar="CAMINHO",
        help="grava num JSON em vez do banco (o site lê este arquivo no build)",
    )
    parser.add_argument("--uf", default=UF_PADRAO)
    parser.add_argument(
        "--indicadores",
        type=_parse_indicadores,
        default=INDICADORES_PADRAO,
        help=(
            "ids separados por vírgula (padrão: os 2 índices de manchete + as 3 "
            "componentes de cada um — 60001,60002,60003,60004,60041,60042,60043,60044)"
        ),
    )
    parser.add_argument(
        "--ano",
        type=int,
        default=None,
        help="padrão: o menor `years` do indicador (o presente). Ano futuro exige --cenario.",
    )
    parser.add_argument(
        "--cenario",
        type=int,
        default=None,
        help="id do cenário (40 Otimista / 41 Pessimista, listados no nó do setor 60000)",
    )
    args = parser.parse_args()
    try:
        if args.sondar:
            sondar(args.indicadores, args.uf, args.ano, args.cenario)
        elif args.json:
            exportar_json(args.indicadores, args.uf, args.ano, args.cenario, args.json)
        else:
            sync(args.indicadores, args.uf, args.ano, args.cenario)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
