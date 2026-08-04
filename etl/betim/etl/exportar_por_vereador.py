"""etl.exportar_por_vereador — fila de análise com o VEREADOR como unidade.

    python -m etl.exportar_por_vereador --id-municipio 3550308 --dir fila_sp
    python -m etl.exportar_por_vereador --id-municipio 3106200 --dir fila_bh --n 15

Irmão de `etl.exportar_prompts`, e a diferença é de PERGUNTA, não de formato.

`exportar_prompts` ordena por CAMADA: responde "o que vale mais a pena
analisar nesta cidade", e por isso varre lei vigente com sinal de direito
antes de decreto. É a fila certa para retratar o ACERVO.

Aqui a unidade é a PESSOA: cada vereador contribui com os seus N projetos de
lei mais recentes. É a fila certa para o retrato POR VEREADOR — e a diferença
não é cosmética. Na fila por camada, um vereador prolífico ocuparia as
primeiras centenas de posições e os demais ficariam sem nenhuma análise, de
modo que comparar dois vereadores compararia amostras de tamanhos
incomparáveis. Com N por cabeça, "fulano tem 3 projetos reducionistas e
sicrano nenhum" passa a ser afirmação sobre eles, não sobre a fila.

SÓ PROJETO DE LEI (e emenda à Lei Orgânica). Requerimento, indicação e moção
não alteram dispositivo — a rubrica manda devolver vazio, e pagar por essa
resposta é pagar para receber `[]` (ver `etl.fila_prioridade`).

Reusa `normalizar_proposicao` e `exportar_lista`, então o prompt gerado é
IDÊNTICO ao do pipeline padrão — mesma rubrica, mesma versão — e
`etl.importar_analises` aceita sem saber que a fila foi outra.
"""
import argparse
from datetime import date
from pathlib import Path
from uuid import UUID

from etl.analise_garantista import CAMPOS_PROPOSICAO, normalizar_proposicao
from etl.common import carregar_municipio, get_supabase_client
from etl.exportar_prompts import exportar_lista

TIPOS_PROJETO = ("projeto_lei", "emenda_lei_organica", "proposta_emenda_lei_organica")

# `pl.` em cada coluna: sem isso `id` fica ambíguo entre a CTE e `analises`.
_SELECT_PL = ", ".join(f"pl.{c.strip()}" for c in CAMPOS_PROPOSICAO.split(","))

# `left join ... where a.id is null` em vez de `not exists`: o que já foi
# analisado sai da fila, então re-rodar depois de importar não reexporta nada
# e o comando é seguro de repetir.
_SQL = f"""
with pl as (
  select p.*,
         row_number() over (partition by p.vereador_id
                            order by p.ano desc nulls last,
                                     p.numero desc nulls last) rn
  from proposicoes p
  where p.id_municipio = %s
    and p.tipo = any(%s)
    and p.vereador_id is not null
)
select {_SELECT_PL}
from pl
left join analises a on a.proposicao_id = pl.id
where pl.rn <= %s and a.id is null
"""


def _serializavel(v):
    """UUID/date -> str.

    O cursor cru devolve objetos Python; o cliente do ETL (`_row_out`) já
    normaliza, mas aqui a consulta é SQL direto — e o manifesto do exportador
    é JSON. Sem isto, `json.dumps` estoura em "UUID is not JSON serializable"
    depois de o trabalho todo estar feito.
    """
    return str(v) if isinstance(v, (UUID, date)) else v


def exportar(id_municipio: str, destino: Path, n: int, modelo: str) -> int:
    municipio = carregar_municipio(id_municipio)
    con = get_supabase_client().conexao()

    with con.cursor() as cur:
        cur.execute(_SQL, (id_municipio, list(TIPOS_PROJETO), n))
        cols = [d.name for d in cur.description]
        brutos = [
            {k: _serializavel(v) for k, v in zip(cols, linha)} for linha in cur.fetchall()
        ]

    fila = [normalizar_proposicao(r, municipio) for r in brutos]
    # `exportar_lista` resume a fila por camada no manifesto; aqui não há
    # camadas — todas as peças são projeto de lei do mesmo recorte.
    for obj in fila:
        obj["_camada"] = f"ultimos_{n}_por_vereador"

    print(f"[exportar_por_vereador] {municipio['nome']}: {len(fila)} projetos a analisar")
    return exportar_lista(fila, destino, "arquivos", modelo)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    # Sem default de cidade: ver scripts/conferir_defaults_de_cidade.py.
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--dir", required=True)
    ap.add_argument("--n", type=int, default=15, help="projetos por vereador (padrão: 15)")
    ap.add_argument("--modelo", default="claude-sonnet-5")
    a = ap.parse_args()
    exportar(a.id_municipio, Path(a.dir), a.n, a.modelo)
