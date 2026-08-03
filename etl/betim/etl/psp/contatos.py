"""etl.psp.contatos — telefones de emergência e de órgãos públicos de São
Paulo, para `contatos_uteis`.

    python -m etl.psp.contatos --id-municipio 3550308

NÃO É RASPAGEM: é curadoria, como foi a de Betim. Não existe dataset aberto
de telefone útil em São Paulo — o CKAN municipal (474 datasets, ver
`etl/psp/__init__.py`) não publica nenhum, e o SP156 expõe catálogo de
SERVIÇOS, não de telefones. O que existe são páginas institucionais em HTML.
A diferença para Betim é que aqui **cada linha carrega a URL da página
oficial onde o número foi lido** (coluna `fonte`, criada em
`supabase/betim/migrations/0035_contatos_uteis_fonte_e_chave.sql`).

POR QUE A FONTE É OBRIGATÓRIA AQUI. Telefone de emergência errado num portal
de transparência manda a pessoa para o lugar errado na hora pior. Sem a URL
não há como conferir, nem como saber que envelheceu. Regra seguida na
montagem desta lista, em 2026-08-03: **todo número abaixo foi lido numa
página aberta ao vivo**, cuja URL está na própria linha. Nada de agregador
("telefones úteis de SP", listas de blog), nada de memória, e o que não foi
achado em página oficial simplesmente NÃO ENTROU — é por isso que não há
aqui, por exemplo, telefone direto de cada uma das 32 subprefeituras
(a Prefeitura encaminha zeladoria pelo 156) nem o 181 do Disque-Denúncia
estadual (o portal da SSP-SP é um SPA que não serve o número em HTML; o que
a Prefeitura publica é o 0800 156 315, e é esse que está aqui, com a fonte
dela).

AS PÁGINAS ABERTAS (todas em domínio oficial: `prefeitura.sp.gov.br`,
`sp156.prefeitura.sp.gov.br`, `procon.sp.gov.br`, `saopaulo.sp.leg.br`):

* SP156 — "Outros Canais de Atendimento": o bloco de emergência da própria
  Prefeitura (SAMU, Bombeiros, PM, Defesa Civil, GCM, Mulher, Disque-Denúncia)
  e os 0800 de zeladoria (iluminação, limpeza) e do ATENDE.
* Defesa Civil municipal e Secretaria Municipal de Segurança Urbana: os
  telefones ADMINISTRATIVOS (Rua da Consolação, 1379), que são coisa
  diferente do 199/153 de emergência e por isso entram com nome próprio.
* Ouvidoria Geral do Município: 156 **opção 5** — a página é explícita
  quanto à opção, e omiti-la faria o leitor cair na fila geral.
* COVISA (Vigilância em Saúde): a denúncia sanitária é pelo 156, mas a
  coordenadoria tem linha própria, que é a que está aqui.
* Procon-SP: 151, e a página avisa que só funciona para chamadas
  ORIGINADAS no município e em horário comercial — isso está no nome da
  linha, senão o leitor liga no sábado e conclui que o portal mente.
* Câmara Municipal de São Paulo: central e Ouvidoria (0800).

O QUE NÃO É NÚMERO NACIONAL. 190/192/193/199/153/180 são padronizados no
Brasil inteiro, mas não estão aqui por serem "de conhecimento geral" — estão
porque a Prefeitura de São Paulo os publica na sua própria página de canais,
que é a fonte registrada em cada linha.

IDEMPOTÊNCIA: upsert por (id_municipio, nome) — a unique criada na 0035.
Rodar de novo corrige número que mudou em vez de duplicar a lista, que é o
que acontecia antes (a tabela só tinha a pk uuid).
"""

import argparse
import sys

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
)

# Marca de que este pacote é o da Prefeitura de SÃO PAULO, no mesmo molde de
# `etl/psp/servidores.py` e `etl/pbh/obras.py`: não é default de argparse, é
# a assinatura da fonte, e o módulo se recusa a rodar para outra cidade.
HOST_ESPERADO = "dados.prefeitura.sp.gov.br"

# --- as páginas oficiais abertas em 2026-08-03 ---
F_SP156 = "https://sp156.prefeitura.sp.gov.br/portal/outros-canais-de-atendimento"
F_DEFESA_CIVIL = "https://prefeitura.sp.gov.br/web/defesa_civil"
F_SEGURANCA = "https://prefeitura.sp.gov.br/web/seguranca_urbana"
F_OUVIDORIA = "https://prefeitura.sp.gov.br/web/ouvidoria/w/fale_com_a_ouvidoria/227268"
F_COVISA = "https://prefeitura.sp.gov.br/web/saude/w/vigilancia_em_saude/204808"
F_PROCON = "https://www.procon.sp.gov.br/horario-de-atendimento-endereco-e-telefone/"
F_CAMARA = "https://www.saopaulo.sp.leg.br/fale-conosco/telefones/"

# `categoria` NÃO é texto livre: a página agrupa por ela e traduz o rótulo
# com `CONTATO_CATEGORIA_LABELS` em `apps/web/lib/betim/servicos.ts`, que
# hoje conhece emergencia | prefeitura | camara | saude | outros. Categoria
# fora dessa lista aparece crua na tela (é o que acontece com 'secretaria',
# usada pelas linhas de Betim).
CONTATOS: list[tuple[str, str, str, str]] = [
    # (nome, telefone, categoria, fonte)
    ("Polícia Militar", "190", "emergencia", F_SP156),
    ("SAMU", "192", "emergencia", F_SP156),
    ("Corpo de Bombeiros", "193", "emergencia", F_SP156),
    ("Defesa Civil", "199", "emergencia", F_SP156),
    ("Guarda Civil Metropolitana", "153", "emergencia", F_SP156),
    ("Central de Atendimento à Mulher", "180", "emergencia", F_SP156),
    ("Disque-Denúncia", "0800 156 315", "emergencia", F_SP156),
    ("Central de Atendimento SP156", "156", "prefeitura", F_SP156),
    ("SP156 (de fora da cidade, fixo da Grande SP)", "0800 011 0156", "prefeitura", F_SP156),
    ("Ouvidoria Geral do Município (156, opção 5)", "156", "prefeitura", F_OUVIDORIA),
    ("Iluminação Pública", "0800 779 0156", "prefeitura", F_SP156),
    ("Limpeza Pública e Varrição", "0800 777 7156", "prefeitura", F_SP156),
    ("ATENDE (transporte de pessoa com deficiência)", "0800 155 234", "prefeitura", F_SP156),
    ("Defesa Civil Municipal (administrativo)", "(11) 3124-5157", "prefeitura", F_DEFESA_CIVIL),
    ("Secretaria Municipal de Segurança Urbana", "(11) 3124-5100", "prefeitura", F_SEGURANCA),
    ("COVISA — Vigilância em Saúde", "(11) 5461-5600", "saude", F_COVISA),
    ("Câmara Municipal de São Paulo", "(11) 3396-4000", "camara", F_CAMARA),
    ("Ouvidoria da Câmara Municipal", "0800 3 226272", "camara", F_CAMARA),
    ("Procon-SP (ligações da capital, dias úteis 8h-18h)", "151", "outros", F_PROCON),
    ("CPTM", "0800 055 0121", "outros", F_SP156),
]


def sync(id_municipio: str) -> int:
    cidade = carregar_municipio(id_municipio)
    host = str(cidade["fontes"].get("prefeitura_dados_abertos_host") or "")
    if HOST_ESPERADO not in host:
        raise RuntimeError(
            f"id_municipio={id_municipio} ({cidade['nome']}) não é São Paulo "
            f"(fontes.prefeitura_dados_abertos_host={host!r}). Esta lista é curadoria "
            "de páginas da Prefeitura de São Paulo; gravá-la em outra cidade "
            "publicaria telefone de outro município — que é exatamente o defeito "
            "que `scripts/conferir_defaults_de_cidade.py` existe para impedir."
        )

    # `ordem` é a posição na tela (a página ordena por ela). Sai da posição na
    # lista acima, para que reordenar aqui reordene o portal — sem número
    # mágico repetido em dois lugares.
    rows = [
        {
            "id_municipio": id_municipio,
            "nome": nome,
            "telefone": telefone,
            "categoria": categoria,
            "ordem": i,
            "fonte": fonte,
        }
        for i, (nome, telefone, categoria, fonte) in enumerate(CONTATOS, start=1)
    ]

    nomes = [r["nome"] for r in rows]
    if len(set(nomes)) != len(nomes):
        raise RuntimeError(
            "há nomes repetidos em CONTATOS — (id_municipio, nome) é a chave do "
            "upsert, então a linha repetida sobrescreveria a anterior na mesma "
            "instrução (ON CONFLICT não pode tocar a mesma linha duas vezes)."
        )

    client = get_supabase_client()
    LOTE = 1000
    for i in range(0, len(rows), LOTE):
        client.table("contatos_uteis").upsert(
            rows[i : i + LOTE], on_conflict="id_municipio,nome"
        ).execute()

    por_categoria: dict[str, int] = {}
    for r in rows:
        por_categoria[r["categoria"]] = por_categoria.get(r["categoria"], 0) + 1
    print(
        f"[etl.psp.contatos] id_municipio={id_municipio} ({cidade['nome']}) "
        f"contatos={len(rows)} " + " ".join(f"{k}={v}" for k, v in sorted(por_categoria.items()))
    )
    return len(rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Contatos úteis de São Paulo.")
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.psp.contatos] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
