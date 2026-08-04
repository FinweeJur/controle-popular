"""etl.pbh.contatos — telefones úteis de Belo Horizonte, para `contatos_uteis`.

    python -m etl.pbh.contatos --id-municipio 3106200

A LISTA É CURADA, OS NÚMEROS NÃO SÃO DIGITADOS. As duas cidades anteriores
resolveram isto com uma tabela literal no código (Betim, 19 linhas sem origem
registrada; São Paulo, 20 linhas com a URL da página onde cada número foi
lido). Aqui a maior parte da lista vem de uma fonte viva: o **SIOM**, Sistema
de Informações Organizacionais do Município, que a própria página de contato
da PBH indica como o lugar onde se consultam "endereços, telefones, e-mails e
titulares" dos órgãos. São 2.262 unidades, todas com telefone.

O que este módulo escolhe é QUAIS unidades entram na tela — o resto do
número, do nome oficial e da atualização é responsabilidade da PBH. Rodar de
novo corrige um telefone que a Prefeitura trocou, em vez de congelar a versão
que alguém copiou um dia.

DESCOBERTA DO SIOM (vale para qualquer sistema novo da PBH): o portal é um
SPA que guarda a URL da API em `/env.json` — exatamente o mesmo padrão do
Diário Oficial das capitais. `GET https://siomexterno.pbh.gov.br/env.json`
devolve `API_URL`, e daí sai o serviço usado aqui. **Está atrás do mesmo WAF
GoCache dos outros dois portais**: `requests` recebe 403 "Acesso Bloqueado",
`curl_cffi` passa — por isso este módulo usa o transporte de `cliente.py`.

POR QUE O `id` E A SIGLA ANDAM JUNTOS EM `UNIDADES`. O id é a chave de busca;
a sigla é uma soma de verificação. Se a PBH renumerar a estrutura, casar só
pelo id gravaria o telefone da unidade errada em silêncio — que é a falha
mais cara possível aqui. Com a sigla ao lado, o módulo aborta.

ONDE ESTÃO OS NÚMEROS DE EMERGÊNCIA. A PBH não tem o equivalente à página
"Outros Canais de Atendimento" do SP156, que em São Paulo publicava a lista
inteira num lugar só; aqui cada número está na página do serviço que o usa —
193 e 199 nas recomendações de chuva da Defesa Civil, 192 na página de
urgência da Saúde, 190/180/100 na página de políticas para as mulheres, 153
no FAQ de Segurança. Por isso `FIXOS` cita uma URL diferente por linha: é o
lugar onde o número foi de fato lido, e é lá que ele será desmentido se
mudar.

IDEMPOTÊNCIA: upsert por (id_municipio, nome), a unique da migration 0035.
"""

import argparse
import re
import sys

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
)
from etl.pbh.cliente import _tentar

from curl_cffi import requests as creq

LOG = "[etl.pbh.contatos]"

HOST_ESPERADO = "ckan.pbh.gov.br"

SIOM_API = "https://siom.pbh.gov.br/siomws/servico/arvore-unidade-organizacional"
# O que vai na coluna `fonte` das linhas vindas do SIOM: a API devolve 6,8 MB
# de JSON, que não serve para alguém conferir. O portal é a mesma informação
# com busca por nome.
SIOM_PORTAL = "https://siomexterno.pbh.gov.br/"

# Páginas da PBH e da CMBH abertas em 2026-08-03, uma por número que não vem
# do SIOM (os de emergência e os canais gerais, que são serviço e não unidade
# organizacional).
F_CONTATO = "https://prefeitura.pbh.gov.br/contato"
F_CHUVA = "https://prefeitura.pbh.gov.br/defesa-civil/recomendacoes-e-orientacoes/chuva"
F_ALERTAS = "https://prefeitura.pbh.gov.br/defesa-civil/alertas-de-risco"
F_URGENCIA = "https://prefeitura.pbh.gov.br/saude/atencao-a-saude/urgencia-e-emergencia"
F_MULHERES = "https://prefeitura.pbh.gov.br/direitos-humanos/politicas/mulheres"
F_SEGURANCA = "https://prefeitura.pbh.gov.br/seguranca/perguntas-frequentes"
F_CMBH = "https://www.cmbh.mg.gov.br/ouvidoria"

# (nome, telefone, categoria, fonte) — número lido no texto da página citada.
FIXOS: list[tuple[str, str, str, str]] = [
    ("Polícia Militar", "190", "emergencia", F_MULHERES),
    ("SAMU", "192", "emergencia", F_URGENCIA),
    ("Corpo de Bombeiros", "193", "emergencia", F_CHUVA),
    ("Defesa Civil", "199", "emergencia", F_CHUVA),
    ("Guarda Civil Municipal", "153", "emergencia", F_SEGURANCA),
    ("Central de Atendimento à Mulher", "180", "emergencia", F_MULHERES),
    ("Disque 100 — violência contra criança e adolescente", "100", "emergencia", F_MULHERES),
    ("Alerta de risco por SMS (envie seu CEP)", "40199", "emergencia", F_ALERTAS),
    ("Central de Atendimento PBH 156", "156", "prefeitura", F_CONTATO),
    ("PBH 156 (de fora de Belo Horizonte)", "(31) 2509-0005", "prefeitura", F_CONTATO),
    ("Câmara Municipal de Belo Horizonte", "(31) 3555-1100", "camara", F_CMBH),
    ("Ouvidoria da Câmara Municipal", "(31) 3555-1112", "camara", F_CMBH),
]

# (id no SIOM, sigla esperada, nome na tela, categoria).
#
# O nome na tela não é o nome oficial da unidade: "Diretoria de Proteção e
# Defesa do Consumidor" é como a PBH chama o órgão internamente e "Procon-BH"
# é como a pessoa procura. `categoria` é fechada — a página traduz com
# `CONTATO_CATEGORIA_LABELS` (emergencia | prefeitura | camara | saude |
# outros) e o que sair dessa lista aparece cru na tela.
UNIDADES: list[tuple[int, str, str, str]] = [
    (2305, "GCMBH", "Guarda Civil Municipal (comando)", "prefeitura"),
    (2304, "SUPDEC", "Proteção e Defesa Civil (administrativo)", "prefeitura"),
    (2268, "PMBH", "Gabinete do Prefeito", "prefeitura"),
    (2388, "DOUV", "Ouvidoria-Geral do Município", "prefeitura"),
    (2306, "SUOUVI", "Subcontroladoria de Ouvidoria", "prefeitura"),
    (4837, "OGBH", "Ouvidoria da Guarda Civil Municipal", "prefeitura"),
    (2271, "CTGM", "Controladoria-Geral do Município", "prefeitura"),
    (5802, "DATC", "Atendimento ao Cidadão (BH Resolve)", "prefeitura"),
    (2639, "PROCON", "Procon-BH", "outros"),
    (2294, "SMSA", "Secretaria Municipal de Saúde", "saude"),
    (3142, "DVSA", "Vigilância Sanitária", "saude"),
    (4872, "CCZ", "Centro de Controle de Zoonoses", "saude"),
    (2663, "CEAM", "Benvinda — atendimento à mulher", "saude"),
]

# `(31) 3277-4141` e `(31) 2509-0005` são fixos; `(31) 98372-1785` é celular.
_FIXO = re.compile(r"^\(\d{2}\)\s*[2-5]\d{3}-\d{4}$")


def _telefone_principal(bruto: str, unidade: str) -> str:
    """O número que vai para a tela, de uma unidade que publica vários.

    O SIOM entrega `telefonesUnidade` como lista separada por vírgula — o
    Centro de Controle de Zoonoses tem quatro. A tela mostra UM por linha, e
    a escolha não é indiferente: o primeiro da lista do CCZ é um celular, e
    publicar celular como telefone de um serviço público é pior que publicar
    o tronco, porque celular troca de dono. Daí a preferência pelo primeiro
    FIXO, com o primeiro número qualquer como recurso.
    """
    numeros = [n.strip() for n in (bruto or "").split(",") if n.strip()]
    if not numeros:
        raise RuntimeError(f"unidade {unidade} veio do SIOM sem telefone")
    for n in numeros:
        if _FIXO.match(n):
            return n
    return numeros[0]


def _arvore() -> dict[int, dict]:
    resp = _tentar(lambda: creq.get(SIOM_API, impersonate="chrome", timeout=300))
    dados = resp.json()
    return {u["idUnidadeOrganizacional"]: u for u in dados}


def sync(id_municipio: str) -> int:
    cidade = carregar_municipio(id_municipio)
    host = str(cidade["fontes"].get("prefeitura_dados_abertos_host") or "")
    if HOST_ESPERADO not in host:
        raise RuntimeError(
            f"id_municipio={id_municipio} ({cidade['nome']}) não é servido por "
            f"{HOST_ESPERADO} (fontes.prefeitura_dados_abertos_host={host!r}). "
            "Esta lista é de telefones da Prefeitura e da Câmara de Belo "
            "Horizonte; gravá-la em outra cidade publicaria telefone de outro "
            "município."
        )

    arvore = _arvore()
    print(f"{LOG} SIOM: {len(arvore)} unidades organizacionais")

    rows: list[dict] = []
    for nome, telefone, categoria, fonte in FIXOS:
        rows.append(
            {
                "id_municipio": id_municipio,
                "nome": nome,
                "telefone": telefone,
                "categoria": categoria,
                "fonte": fonte,
            }
        )

    for id_uo, sigla, nome, categoria in UNIDADES:
        uo = arvore.get(id_uo)
        if uo is None:
            raise RuntimeError(
                f"unidade {sigla} (id {id_uo}) sumiu do SIOM. Confira em "
                f"{SIOM_PORTAL} qual é o id novo antes de rodar — casar pelo "
                "nome no lugar do id publicaria o telefone da unidade errada."
            )
        atual = (uo.get("siglaUnidadeOrganizacional") or "").strip()
        if atual != sigla:
            raise RuntimeError(
                f"o id {id_uo} agora é {atual!r} no SIOM, e não {sigla!r} "
                f"({uo.get('nomeUnidadeOrganizacional')!r}). A estrutura foi "
                "renumerada; reveja UNIDADES antes de gravar."
            )
        rows.append(
            {
                "id_municipio": id_municipio,
                "nome": nome,
                "telefone": _telefone_principal(uo.get("telefonesUnidade"), sigla),
                "categoria": categoria,
                "fonte": SIOM_PORTAL,
            }
        )

    # `ordem` é a posição na tela; sai da posição na lista para que reordenar
    # aqui reordene o portal, sem número mágico repetido em dois lugares.
    for i, r in enumerate(rows, start=1):
        r["ordem"] = i

    nomes = [r["nome"] for r in rows]
    if len(set(nomes)) != len(nomes):
        raise RuntimeError(
            "há nomes repetidos — (id_municipio, nome) é a chave do upsert, então "
            "a linha repetida sobrescreveria a anterior na mesma instrução."
        )

    client = get_supabase_client()
    client.table("contatos_uteis").upsert(rows, on_conflict="id_municipio,nome").execute()

    por_categoria: dict[str, int] = {}
    for r in rows:
        por_categoria[r["categoria"]] = por_categoria.get(r["categoria"], 0) + 1
    print(
        f"{LOG} id_municipio={id_municipio} ({cidade['nome']}) contatos={len(rows)} "
        + " ".join(f"{k}={v}" for k, v in sorted(por_categoria.items()))
    )
    return len(rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Contatos úteis de Belo Horizonte.")
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
