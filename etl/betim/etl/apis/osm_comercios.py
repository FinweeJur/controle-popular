"""etl.apis.osm_comercios — supermercados e farmácias de qualquer município
brasileiro (OpenStreetMap/Overpass) para `comercios_essenciais`.

    python -m etl.apis.osm_comercios --id-municipio 3550308

Pedido original (2026-07-24): "cadastre já supermercados e farmácias...
publicidade gratuita e informação pública relevante".

FONTE: Overpass API (`shop=supermarket` + `amenity=pharmacy`), pública e sem
cota — ao contrário do CNPJ da Receita Federal via Base dos Dados
(`br_me_cnpj.estabelecimentos`), que teria endereço/telefone oficiais
melhores mas é uma tabela histórica gigante (Brasil inteiro, vários meses)
que estoura a cota gratuita do BigQuery com um filtro só por município.

═══════════════════════════════════════════════════════════════════════════
REESCRITO EM 2026-08-03 PORQUE ESTE MÓDULO ESTAVA GRAVANDO A CIDADE ERRADA
═══════════════════════════════════════════════════════════════════════════

A versão anterior aceitava `--id-municipio` mas tinha a cidade dentro do
código, em CONSTANTES DE MÓDULO (não em default de argparse, por isso
`scripts/conferir_defaults_de_cidade.py` não pegava):

    CENTRO_LAT, CENTRO_LNG = -19.9681, -44.1983   # centro de BETIM
    BETIM_RELATION_ID = "R368812"                 # polígono de BETIM

Ou seja: buscava num raio a partir do centro de Betim e depois confirmava
com o polígono de Betim — para QUALQUER `--id-municipio`. Rodar
`--id-municipio 3106200` (Belo Horizonte) não deu erro nenhum: coletou 24
estabelecimentos de BETIM e os gravou com o id de BH. Medido no banco antes
da correção: as 24 linhas de BH eram "Drogaria Preço Popular" em
Citrolândia, "Farmácia Betim - Mercado Farma", farmácias do Jardim das
Alterosas — todas com longitude ~-44,1, que é Betim, não BH (~-43,9).
É o MESMO defeito de "default de cidade" documentado em
`etl/common.carregar_municipio`, só que escondido um nível abaixo do que o
script de conferência sabe olhar.

O QUE MUDOU, e por que cada coisa:

1. **Não há mais raio nem centro.** A busca é por ÁREA administrativa:
   `area["IBGE:GEOCODIGO"="<id_municipio>"]`. O código do IBGE é o próprio
   `--id-municipio`, então a cidade não pode divergir do argumento nem por
   engano — não existe segundo lugar onde ela esteja escrita. Verificado ao
   vivo em 2026-08-03: as relações de São Paulo (298285), Belo Horizonte
   (368782) e Betim (368812) têm a tag `IBGE:GEOCODIGO` preenchida.
   O nome da relação ainda é conferido contra `municipios.nome` antes de
   qualquer escrita (`_conferir_area`), porque tag de OSM é editável por
   qualquer um e um geocódigo trocado no mapa reetiquetaria uma cidade
   inteira em silêncio.

2. **Sumiu o teste geométrico feito à mão** (Nominatim + ray casting). Ele
   existia só para descartar os vizinhos que o raio trazia; com `(area.a)` o
   recorte já é o polígono administrativo real, feito no servidor. Menos uma
   dependência de rede (Nominatim) e menos um lugar para errar.

3. **`nwr` em vez de `node`.** A consulta antiga só via POI mapeado como
   PONTO. Contado ao vivo em São Paulo: 809 nós, 961 vias e 26 relações —
   **55% dos estabelecimentos da capital estão mapeados como polígono de
   edifício**, e a versão anterior os ignorava. `out center` devolve o
   centróide de via/relação; nó continua vindo com lat/lon próprios.

4. **`osm_id` codifica o TIPO no sinal.** A tabela tem
   UNIQUE(id_municipio, osm_id) e id de nó, via e relação são numerações
   INDEPENDENTES no OSM — a via 12345 e o nó 12345 existem as duas. Sem
   distinguir, duas lojas diferentes colidiriam na chave única e uma
   sobrescreveria a outra. Convenção: nó = `+id` (é o que já está gravado,
   nada migra), via = `-id`, relação = `-(10¹² + id)`.

5. **Dedupe de loja mapeada duas vezes.** A mesma farmácia costuma existir
   como nó (o POI) e como via (o prédio). Sem tratamento a lista pública
   mostraria "Drogasil" duas vezes no mesmo endereço. `_deduplicar` junta
   quem tem o mesmo nome normalizado a menos de 60 m e fica com o registro
   mais informativo (mais tags de telefone/endereço). 60 m é curto o
   bastante para não colapsar duas lojas de rede na mesma avenida.

6. **Limpeza do estrago (`_apagar_provados_fora`).** Corrigir o módulo não
   desfaz o que ele gravou: as 24 linhas de Betim continuariam na página de
   BH, porque upsert não apaga. Depois de sincronizar, o módulo pergunta ao
   OSM quais dos `osm_id` que sobraram no banco AINDA EXISTEM no mapa e
   estão FORA da área do município — esses são prova de cidade errada e são
   apagados. Quem simplesmente sumiu do OSM NÃO é apagado: sumiço não prova
   nada (pode ser edição temporária), e tirar uma farmácia de verdade da
   lista é pior do que manter uma linha velha.

TELEFONE NUNCA É SOBRESCRITO POR VAZIO — regra antiga, mantida: se o OSM não
traz telefone e o banco já tem um (pesquisado à mão em 2026-07-24), o do
banco fica. O OSM só ganha quando TEM número.

COBERTURA MEDIDA (2026-08-03, depois da correção), pela contagem do próprio
Overpass (`out count`): São Paulo 1.796 elementos brutos, Belo Horizonte e
Betim na casa das centenas/dezenas. É dado colaborativo: não é o universo
de lojas da cidade, é o que está mapeado.
"""
import argparse
import sys
import time
import unicodedata

import requests

from etl.common import ID_MUNICIPIO_DEFAULT, carregar_municipio, get_supabase_client

# Instâncias públicas do Overpass, em ordem de preferência. A principal
# devolve 504 com frequência ("Dispatcher_Client::request_read_and_idx::
# timeout. The server is probably too busy") — não é erro nosso e não é
# permanente, mas com uma instância só a rodada de São Paulo falha na
# metade das vezes. Medido hoje: 504 na 1ª tentativa e 200 na 2ª, várias
# vezes seguidas.
ENDPOINTS_OVERPASS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]
USER_AGENT = "ControlePopular/1.0 (contato via github.com/FinweeJur/betim-ai)"

# Timeout declarado DENTRO da query (o Overpass mata a consulta sozinho) e
# timeout de socket. São Paulo demora ~40 s só para montar a área.
TIMEOUT_OVERPASS = 300
TIMEOUT_HTTP = 360

CNAE_TIPO = {"supermarket": "supermercado", "pharmacy": "farmacia"}

# Deslocamento do id de relação, para não colidir com o id de via negativo
# (ver item 4 do docstring). A maior relação do OSM está na casa dos 2×10⁷ e
# a maior via na dos 1,4×10⁹ — 10¹² dá folga de três ordens de grandeza.
OFFSET_RELACAO = 10**12

# Duas lojas de MESMO NOME a menos disto são a mesma loja mapeada como nó e
# como prédio. Em graus, ~0,00054° de latitude.
RAIO_DUPLICATA_M = 60.0
_METROS_POR_GRAU = 111_320.0


def _consultar(query: str) -> dict | None:
    """Roda a query no primeiro Overpass que responder 200.

    Percorre as instâncias em ordem, 3 tentativas em cada, porque 429 (cota
    momentânea) e 504 (fila cheia) são o comportamento NORMAL das instâncias
    públicas em horário movimentado, não sintoma de query errada.
    """
    for url in ENDPOINTS_OVERPASS:
        for tentativa in range(3):
            try:
                resp = requests.post(
                    url,
                    data={"data": query},
                    headers={"User-Agent": USER_AGENT},
                    timeout=TIMEOUT_HTTP,
                )
            except requests.RequestException as e:
                print(f"[etl.apis.osm_comercios] {url}: {type(e).__name__} ({tentativa + 1}/3)")
                time.sleep(8)
                continue
            if resp.status_code == 200:
                return resp.json()
            print(
                f"[etl.apis.osm_comercios] {url}: HTTP {resp.status_code} "
                f"({tentativa + 1}/3)"
            )
            time.sleep(10)
    return None


def _normalizar(s: str | None) -> str:
    sem_acento = unicodedata.normalize("NFD", s or "")
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return " ".join(sem_acento.upper().split())


def _conferir_area(id_municipio: str, cidade: dict) -> None:
    """Aborta se a relação do OSM com este geocódigo não for esta cidade.

    Não é paranoia gratuita: `IBGE:GEOCODIGO` é tag editável por qualquer
    pessoa. Se ela estiver errada ou ausente, a `area(...)` da consulta
    seguinte fica vazia (ou vira outro município) e o módulo gravaria zero
    linha — ou as lojas da cidade errada — sem levantar exceção nenhuma. O
    nome vem do BANCO (`municipios.nome`), que é a autoridade aqui.
    """
    dados = _consultar(
        f'[out:json][timeout:180];rel["IBGE:GEOCODIGO"="{id_municipio}"];out tags;'
    )
    if dados is None:
        raise RuntimeError(
            "Overpass não respondeu 200 em nenhuma das instâncias — rodada abortada "
            "antes de escrever. Tente de novo mais tarde."
        )
    elementos = dados.get("elements", [])
    if not elementos:
        raise RuntimeError(
            f"nenhuma relação do OSM tem IBGE:GEOCODIGO={id_municipio}. Sem a área "
            "administrativa não há como recortar o município, e buscar por raio foi "
            "exatamente o defeito que trocou Betim por BH — nada foi gravado."
        )
    nomes = {_normalizar(el.get("tags", {}).get("name")) for el in elementos}
    esperado = _normalizar(cidade["nome"])
    if esperado not in nomes:
        raise RuntimeError(
            f"IBGE:GEOCODIGO={id_municipio} no OSM aponta para {sorted(nomes)}, mas "
            f"`municipios` diz que essa cidade é {cidade['nome']!r}. Divergência de "
            "identidade da cidade — nada foi gravado."
        )
    print(
        f"[etl.apis.osm_comercios] área confirmada: "
        f"{', '.join(str(el['id']) for el in elementos)} = {cidade['nome']}/{cidade['uf']}"
    )


def _coletar(id_municipio: str) -> list[dict]:
    """Todos os supermercados e farmácias DENTRO do município, no OSM.

    `nwr` (node+way+relation) e `out center`: mais da metade dos
    estabelecimentos de uma capital está mapeada como polígono de edifício,
    e a consulta antiga, só de `node`, não os via.
    """
    query = f"""[out:json][timeout:{TIMEOUT_OVERPASS}];
area["IBGE:GEOCODIGO"="{id_municipio}"]->.municipio;
(
  nwr["shop"="supermarket"](area.municipio);
  nwr["amenity"="pharmacy"](area.municipio);
);
out center tags;"""
    dados = _consultar(query)
    if dados is None:
        raise RuntimeError(
            "Overpass não respondeu 200 em nenhuma das instâncias na consulta "
            "principal — nada foi gravado."
        )
    return dados.get("elements", [])


def _osm_id(el: dict) -> int | None:
    """Id único por (tipo, id) — ver item 4 do docstring."""
    tipo, ident = el.get("type"), el.get("id")
    if ident is None:
        return None
    if tipo == "node":
        return ident
    if tipo == "way":
        return -ident
    if tipo == "relation":
        return -(OFFSET_RELACAO + ident)
    return None


def _coordenada(el: dict) -> tuple[float, float] | None:
    """(lat, lon) do elemento: próprio se for nó, centróide se for área."""
    if el.get("lat") is not None and el.get("lon") is not None:
        return float(el["lat"]), float(el["lon"])
    centro = el.get("center") or {}
    if centro.get("lat") is not None and centro.get("lon") is not None:
        return float(centro["lat"]), float(centro["lon"])
    return None


def _riqueza(row: dict) -> int:
    """Quantos campos opcionais a linha preencheu — critério de desempate do
    dedupe. Entre o nó e o prédio, fica quem tem telefone/endereço/bairro."""
    return sum(1 for c in ("telefone", "endereco", "bairro") if row.get(c))


def _deduplicar(rows: list[dict]) -> tuple[list[dict], int]:
    """Colapsa a mesma loja mapeada como nó E como prédio.

    Só compara registros de mesmo nome normalizado (barato) e mesmo tipo; a
    distância é euclidiana em graus corrigida por cos(lat), o que a menos de
    100 m erra por centímetros e dispensa haversine.
    """
    import math

    por_nome: dict[tuple[str, str], list[dict]] = {}
    for r in rows:
        por_nome.setdefault((_normalizar(r["nome"]), r["tipo"]), []).append(r)

    mantidos: list[dict] = []
    colapsados = 0
    for grupo in por_nome.values():
        # Mais informativo primeiro: assim o representante do cluster já é o
        # melhor registro e não é preciso mesclar campo a campo.
        grupo.sort(key=_riqueza, reverse=True)
        escolhidos: list[dict] = []
        for cand in grupo:
            perto = False
            for j in escolhidos:
                dlat = (float(cand["lat"]) - float(j["lat"])) * _METROS_POR_GRAU
                dlon = (
                    (float(cand["lng"]) - float(j["lng"]))
                    * _METROS_POR_GRAU
                    * math.cos(math.radians(float(cand["lat"])))
                )
                if math.hypot(dlat, dlon) <= RAIO_DUPLICATA_M:
                    perto = True
                    break
            if perto:
                colapsados += 1
            else:
                escolhidos.append(cand)
        mantidos.extend(escolhidos)
    return mantidos, colapsados


def _mapear(el: dict, id_municipio: str) -> dict | None:
    tags = el.get("tags", {})
    nome = (tags.get("name") or "").strip()
    osm_id = _osm_id(el)
    ponto = _coordenada(el)
    tipo_osm = tags.get("shop") if tags.get("shop") == "supermarket" else tags.get("amenity")
    # Sem nome não dá para listar (a página mostra o nome), sem coordenada
    # não dá para mapear, e sem os dois a linha só ocuparia espaço.
    if not nome or osm_id is None or ponto is None or tipo_osm not in CNAE_TIPO:
        return None

    endereco = " ".join(
        p for p in (tags.get("addr:street"), tags.get("addr:housenumber")) if p
    ) or None
    return {
        "id_municipio": id_municipio,
        "osm_id": osm_id,
        "nome": nome,
        "tipo": CNAE_TIPO[tipo_osm],
        "bairro": tags.get("addr:suburb") or tags.get("addr:neighbourhood"),
        "endereco": endereco,
        "telefone": tags.get("phone") or tags.get("contact:phone"),
        "lat": ponto[0],
        "lng": ponto[1],
        "fonte": "openstreetmap",
    }


def _preservar_telefones(client, id_municipio: str, rows: list[dict]) -> int:
    """Impede que o upsert apague telefone já cadastrado.

    Bug real de 2026-07-24: o OSM não traz telefone para a maioria dos
    estabelecimentos, então cada rodada gravava NULL por cima dos números
    que tinham sido pesquisados e inseridos à mão. O OSM continua ganhando
    quando TEM número (é a fonte mais fresca); só o vazio é que cede.
    """
    existentes = {
        int(e["osm_id"]): e["telefone"]
        for e in (
            client.table("comercios_essenciais")
            .select("osm_id, telefone")
            .eq("id_municipio", id_municipio)
            .execute()
            .data
            or []
        )
        if e.get("telefone")
    }
    preservados = 0
    for r in rows:
        if not r["telefone"] and r["osm_id"] in existentes:
            r["telefone"] = existentes[r["osm_id"]]
            preservados += 1
    return preservados


def _apagar_provados_fora(client, id_municipio: str, ids_atuais: set[int]) -> int:
    """Apaga o que o OSM PROVA que não fica neste município.

    Só entra aqui quem sobrou no banco e não veio na coleta de agora. Desses,
    o Overpass diz quais ainda existem no mapa; os que existem e não estão
    dentro da área do município são erro de rotulagem (o estrago descrito no
    topo do arquivo) e vão embora. Os que sumiram do OSM ficam: sumir não
    prova nada e apagar uma farmácia real da lista é o pior dos dois erros.
    """
    no_banco = {
        int(e["osm_id"])
        for e in (
            client.table("comercios_essenciais")
            .select("osm_id")
            .eq("id_municipio", id_municipio)
            .execute()
            .data
            or []
        )
    }
    suspeitos = no_banco - ids_atuais
    if not suspeitos:
        return 0

    # Desfaz a codificação de tipo do `osm_id` para poder perguntar ao OSM.
    nos = [i for i in suspeitos if i > 0]
    vias = [-i for i in suspeitos if -OFFSET_RELACAO < i < 0]
    relacoes = [(-i) - OFFSET_RELACAO for i in suspeitos if i <= -OFFSET_RELACAO]

    def _bloco(prefixo: str, ids: list[int], sufixo: str = "") -> str:
        return f"{prefixo}(id:{','.join(str(i) for i in ids)}){sufixo};" if ids else ""

    corpo_existe = (
        _bloco("node", nos) + _bloco("way", vias) + _bloco("rel", relacoes)
    )
    corpo_dentro = (
        _bloco("node", nos, "(area.municipio)")
        + _bloco("way", vias, "(area.municipio)")
        + _bloco("rel", relacoes, "(area.municipio)")
    )
    dados = _consultar(
        f"""[out:json][timeout:{TIMEOUT_OVERPASS}];
area["IBGE:GEOCODIGO"="{id_municipio}"]->.municipio;
({corpo_existe})->.existentes;
.existentes out ids;
({corpo_dentro});
out ids;"""
    )
    if dados is None:
        print(
            "[etl.apis.osm_comercios] AVISO: não deu para conferir os suspeitos no "
            "Overpass; nada foi apagado nesta rodada."
        )
        return 0

    # A resposta traz as duas saídas concatenadas: primeiro tudo que existe,
    # depois só o que está dentro. A contagem de aparições classifica cada
    # suspeito em três casos, que são coisas diferentes e não podem virar uma
    # mensagem só:
    #   2x -> existe e está DENTRO: continua sendo desta cidade, apenas saiu
    #         do recorte (perdeu o `name`, virou shop=convenience...). Fica.
    #   1x -> existe e está FORA: prova de cidade errada. Vai embora.
    #   0x -> sumiu do OSM: não prova nada. Fica.
    vistos: dict[int, int] = {}
    for el in dados.get("elements", []):
        oid = _osm_id(el)
        if oid is not None:
            vistos[oid] = vistos.get(oid, 0) + 1
    fora = [oid for oid, n in vistos.items() if n == 1 and oid in suspeitos]
    dentro_fora_do_recorte = sum(1 for n in vistos.values() if n == 2)
    sumiram = len(suspeitos) - len(vistos)
    if dentro_fora_do_recorte or sumiram:
        print(
            f"[etl.apis.osm_comercios] mantidos {dentro_fora_do_recorte} registro(s) "
            "ainda dentro do município mas fora do recorte atual do OSM "
            f"(retag/sem nome) e {sumiram} que sumiram do mapa — nenhum dos dois "
            "prova cidade errada."
        )
    if not fora:
        return 0

    LOTE = 1000
    for i in range(0, len(fora), LOTE):
        (
            client.table("comercios_essenciais")
            .delete()
            .eq("id_municipio", id_municipio)
            .in_("osm_id", fora[i : i + LOTE])
            .execute()
        )
    print(
        f"[etl.apis.osm_comercios] APAGADOS {len(fora)} registro(s) que o OSM confirma "
        f"estarem FORA de {id_municipio} (rotulagem errada de rodada anterior)."
    )
    return len(fora)


def sync(id_municipio: str, apagar_fora: bool = True) -> int:
    cidade = carregar_municipio(id_municipio)
    _conferir_area(id_municipio, cidade)

    elementos = _coletar(id_municipio)
    print(f"[etl.apis.osm_comercios] elementos_no_osm={len(elementos)}")

    rows = [r for r in (_mapear(el, id_municipio) for el in elementos) if r]
    descartados = len(elementos) - len(rows)
    rows, colapsados = _deduplicar(rows)
    print(
        f"[etl.apis.osm_comercios] utilizáveis={len(rows)} "
        f"(descartados_sem_nome_ou_ponto={descartados}, duplicatas_colapsadas={colapsados})"
    )

    if not rows:
        raise RuntimeError(
            f"o OSM não devolveu nenhum supermercado/farmácia utilizável em "
            f"{cidade['nome']} — improvável para um município; nada foi gravado."
        )

    client = get_supabase_client()
    preservados = _preservar_telefones(client, id_municipio, rows)
    if preservados:
        print(f"[etl.apis.osm_comercios] telefones preservados do banco: {preservados}")

    # Lotes de 1000 (regra da casa) — São Paulo passa de mil linhas e o
    # adapter já fatiaria por placeholder, mas o teto explícito é o contrato.
    LOTE = 1000
    for i in range(0, len(rows), LOTE):
        client.table("comercios_essenciais").upsert(
            rows[i : i + LOTE], on_conflict="id_municipio,osm_id"
        ).execute()

    if apagar_fora:
        _apagar_provados_fora(client, id_municipio, {r["osm_id"] for r in rows})

    supermercados = sum(1 for r in rows if r["tipo"] == "supermercado")
    farmacias = sum(1 for r in rows if r["tipo"] == "farmacia")
    com_telefone = sum(1 for r in rows if r["telefone"])
    print(
        f"[etl.apis.osm_comercios] id_municipio={id_municipio} ({cidade['nome']}) "
        f"gravados={len(rows)} supermercados={supermercados} farmacias={farmacias} "
        f"com_telefone={com_telefone}"
    )
    return len(rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Supermercados e farmácias via OSM.")
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--nao-apagar-fora",
        action="store_true",
        help="não apaga do banco os registros que o OSM confirma estarem fora do "
        "município (a limpeza do estrago de rodadas antigas)",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, apagar_fora=not args.nao_apagar_fora)
    except RuntimeError as e:
        print(f"[etl.apis.osm_comercios] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
