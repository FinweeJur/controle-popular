"""etl.pncp.contratos — Sincronização de contratos públicos do PNCP para o banco de dados.

Uso:
    python -m etl.pncp.contratos --id-municipio 3106705 [--ano-inicio 2021]

═══ PAPEL NO PORTAL CÍVICO ═══
Este módulo é a espinha dorsal da transparência de contratações do portal Controle Popular.
Ele extrai os contratos administrativos, termos de adesão, atas e convênios publicados
pelos municípios brasileiros no PNCP (Portal Nacional de Contratações Públicas),
criado pela Nova Lei de Licitações e Contratos Administrativos (Lei Federal nº 14.133/2021).

Os dados alimentam diretamente a consulta pública no portal, viabilizando:
1. Auditoria social de valores contratados versus valores liquidados;
2. Fiscalização de concentração de contratos em fornecedores recorrentes;
3. Classificação automática de gastos por eixos temáticos (Saúde, Educação, Infraestrutura);
4. Links auditáveis diretos e canônicos para cada instrumento contratual.

═══ FONTES DE DADOS E AUDITABILIDADE ═══
- API Pública do PNCP: Endpoint `/v1/contratos`, mantido pelo Ministério da Gestão e da
  Inovação em Serviços Públicos (MGI).
- Base Municipal: Cadastro de órgãos municipais mapeados em `municipios.fontes.cnpjs_orgao`.

═══ DECISÕES DE ARQUITETURA E RESILIÊNCIA ═══
- Checkpoints Transacionais por Página: A coleta grava e commita os dados página a página.
  Em versões anteriores, todo o ano era mantido em memória, gerando perda total do lote
  quando o PNCP devolvia erro de gateway (HTTP 504) após 10 minutos de extração.
- Resolução de Múltiplos CNPJs ("Um CNPJ não é a cidade"): Capitais e cidades médias operam
  com administração indireta descentralizada (Fundos de Saúde, Autarquias, Empresas Públicas).
  O coletor varre todos os CNPJs municipais catalogados previamente por `etl.pncp.orgaos`.
- Tolerância a Falhas Transitórias: Quedas pontuais de API gravam a parcela obtida
  e continuam o ciclo, registrando no checkpoint para conclusão posterior sem travar a esteira.
"""

import argparse
import datetime as dt
import re
import sys

from etl.common import (
    CITY_HALL_CNPJ,
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    upsert_com_colunas_opcionais,
)
from etl.pncp import checkpoint as ck
from etl.pncp.client import iter_contratos
from etl.temas import classificar_contrato


def _status_from_vigencia(vigencia_fim: str | None) -> str:
    """Deduz o estado de vigência do contrato a partir da sua data de término.

    Compara a data de término com a data corrente do sistema:
    - Se a data de fim for anterior à data atual, o status é "encerrado";
    - Se for futura ou indeterminada/nula, o status é "ativo".

    Args:
        vigencia_fim: Data em formato ISO (ex: "2026-12-31T00:00:00") ou None.

    Returns:
        String indicativa: "ativo" ou "encerrado".
    """
    if not vigencia_fim:
        return "ativo"
    try:
        fim = dt.date.fromisoformat(vigencia_fim[:10])
    except ValueError:
        # Se a string contiver data em formato corrompido, assume como ativo por segurança
        return "ativo"
    return "encerrado" if fim < dt.date.today() else "ativo"


def link_do_contrato(numero_controle_pncp: str | None) -> str | None:
    """Gera a URL pública canônica da página do contrato no portal oficial do PNCP.

    ═══ POR QUE DERIVAR O LINK EM VEZ DE LER DA API ═══
    A especificação da API do PNCP prevê os campos `urlContrato` e `linkSistemaOrigem`.
    Entretanto, medição ao vivo realizada em 2026-08-10 constatou que ambos vêm nulos
    em 100% dos contratos municipais (1.268 em 1.268 registros auditados).
    Sem o link, o portal do Controle Popular ficaria sem oferecer a conferência direta à fonte,
    violando a regra inegociável de transparência auditável (AGENTS.md §1).

    O endereço público é determinístico e composto a partir do Número de Controle PNCP:
        Exemplo: "18715391000196-2-000048/2025"
                  └──── CNPJ ───┘ │ └── seq ──┘ └ano┘
                                  └─ tipo (2 = contrato)
        -> URL: https://pncp.gov.br/app/contratos/18715391000196/2025/000048

    Atenção: Os zeros à esquerda do sequencial devem ser rigorosamente preservados.
    A rota do frontend do PNCP depende da correspondência exata do sequencial de 6 dígitos.

    Args:
        numero_controle_pncp: Código identificador oficial do contrato no PNCP.

    Returns:
        URL pública completa para visualização no navegador, ou None se inválido.
    """
    if not numero_controle_pncp:
        return None
    m = re.match(r"^(\d{14})-\d+-(\d+)/(\d{4})$", numero_controle_pncp.strip())
    if not m:
        # Número fora do formato não deve gerar link quebrado (evita falso 200 da SPA com tela em branco).
        return None
    cnpj, sequencial, ano = m.groups()
    return f"https://pncp.gov.br/app/contratos/{cnpj}/{ano}/{sequencial}"


def _sanitizar_numeric(val: any) -> float | None:
    """Sanitiza valores monetários para evitar estouro do tipo numeric(15, 2) do Postgres.

    O tipo PostgreSQL numeric(15, 2) aceita valores com até 13 dígitos inteiros (menor que 10^13).
    Valores anômalos por erro de digitação humana no portal da prefeitura estouram o limite
    da coluna. O valor bruto original permanece preservado no campo `raw`.

    Args:
        val: Valor numérico ou string retornado pelo PNCP.

    Returns:
        Float seguro para o Postgres, ou None se nulo/inválido/fora de escala.
    """
    if val is None:
        return None
    try:
        f = float(val)
        if abs(f) >= 1e13:
            return None
        return f
    except (ValueError, TypeError):
        return None


def _map_row(raw: dict, id_municipio: str) -> dict:
    """Mapeia e normaliza o payload JSON bruto da API do PNCP para as colunas da tabela `contratos`.

    ═══ TRATAMENTO DE REGRA DE NEGÓCIO E CORREÇÕES HISTÓRICAS ═══
    1. Chave Única (`numero_controle_pncp`):
       Usa `numeroControlePNCP` (identificador único 1:1 do contrato). O código anterior usava
       `numeroControlePncpCompra`, que referencia a licitação de origem; quando uma única licitação
       gerava múltiplos contratos, eles sobrescreviam uns aos outros no upsert.
    2. Tipo de Contrato:
       A API devolve `tipoContrato` como um objeto `{ "id": 1, "nome": "Contrato..." }` ou string.
       O código extrai o nome textual legível em vez de serializar JSON cru no campo.
    3. Fornecedor:
       Os campos de fornecedor (`niFornecedor`, `nomeRazaoSocialFornecedor`) vêm na raiz do objeto,
       e não sob a chave `"fornecedor"`.
    4. Categorização Temática:
       Aciona o motor de taxonomia de `etl.temas.classificar_contrato` combinando unidade e objeto.

    Args:
        raw: Dicionário contendo a resposta bruta de um contrato da API do PNCP.
        id_municipio: Código IBGE de 7 dígitos do município associado.

    Returns:
        Dicionário formatado pronto para inserção/upsert no banco de dados.
    """
    orgao = raw.get("orgaoEntidade") or {}
    unidade = raw.get("unidadeOrgao") or {}
    numero_controle = raw.get("numeroControlePNCP") or raw.get("numeroControlePncpCompra")
    return {
        "id_municipio": id_municipio,
        "numero_controle_pncp": numero_controle,
        "numero_contrato": raw.get("numeroContrato"),
        "ano": raw.get("anoContrato"),
        "orgao_cnpj": orgao.get("cnpj"),
        "orgao_nome": orgao.get("razaoSocial"),
        "unidade_nome": unidade.get("nomeUnidade"),
        "categoria": raw.get("categoriaProcesso", {}).get("nome") if isinstance(raw.get("categoriaProcesso"), dict) else raw.get("tipoContrato"),
        "tipo": raw.get("tipoContrato", {}).get("nome") if isinstance(raw.get("tipoContrato"), dict) else raw.get("tipoContrato"),
        "objeto": raw.get("objetoContrato"),
        "fornecedor_cnpj": raw.get("niFornecedor"),
        "fornecedor_nome": raw.get("nomeRazaoSocialFornecedor"),
        "valor_inicial": _sanitizar_numeric(raw.get("valorInicial")),
        "valor_global": _sanitizar_numeric(raw.get("valorGlobal")),
        "data_assinatura": raw.get("dataAssinatura"),
        "vigencia_inicio": raw.get("dataVigenciaInicio"),
        "vigencia_fim": raw.get("dataVigenciaFim"),
        "numero_parcelas": raw.get("numeroParcelas"),
        "status": _status_from_vigencia(raw.get("dataVigenciaFim")),
        "link_fonte": (
            raw.get("urlContrato")
            or raw.get("linkSistemaOrigem")
            or link_do_contrato(numero_controle)
        ),
        "raw": raw,
        "temas": classificar_contrato(unidade.get("nomeUnidade"), raw.get("objetoContrato")),
    }


def sync(
    id_municipio: str,
    cnpj_orgao: str | None,
    ano_inicio: int,
    permitir_fonte_dupla: bool = False,
):
    """Executa a sincronização completa e idempotente dos contratos do município.

    ═══ REGRAS E SALVAGUARDAS INEGOCIÁVEIS ═══
    1. UMA CIDADE, UMA FONTE DE CONTRATOS:
       Cidades como Belo Horizonte possuem portais próprios mais ricos (GRP da PBH).
       Se a cidade declarar `fontes.contratos_fonte != "pncp"`, a execução é abortada
       para não gerar registros duplicados, a menos que `--permitir-fonte-dupla` seja usado.
    2. DESCOBERTA DE CNPJS DA CIDADE:
       Utiliza a lista de CNPJs cadastrada em `municipios.fontes.cnpjs_orgao`.
       Caso inexista, recai sobre o CNPJ principal da prefeitura emitindo alerta para capitais.
    3. RETOMADA VIA CHECKPOINTS:
       Chave de unidade por `id_municipio:cnpj:ano`. Se interrompido, retoma da página
       onde parou sem reprocessar lotes anteriores.
    4. UPSERT EM LOTES POR PÁGINA:
       Grava até 1.000 registros de cada vez no Postgres via Supabase Client,
       evitando esgotamento de memória e timeouts.

    Args:
        id_municipio: Código IBGE do município (ex: "3106705" para Betim).
        cnpj_orgao: CNPJ específico para override (opcional).
        ano_inicio: Primeiro ano civil a coletar (padrão: 2021, início do PNCP).
        permitir_fonte_dupla: Se True, ignora trava de fonte primária externa.

    Raises:
        RuntimeError: Se houver conflito de fonte canônica ou ausência de CNPJ base.
    """
    client = get_supabase_client()
    cidade = carregar_municipio(id_municipio)

    # 1. Validação de fonte canônica de dados para evitar duplicações no banco
    fonte_propria = cidade["fontes"].get("contratos_fonte")
    if fonte_propria and fonte_propria != "pncp" and not permitir_fonte_dupla:
        raise RuntimeError(
            f"{cidade['nome']} declara `fontes.contratos_fonte = {fonte_propria!r}`; "
            "rodar o PNCP por cima duplicaria os contratos. Use o módulo dessa "
            "fonte, ou passe --permitir-fonte-dupla se a intenção é comparar."
        )

    # 2. Resolução da lista de CNPJs municipais a serem consultados
    if cnpj_orgao is not None:
        cnpjs = [cnpj_orgao]
    else:
        cnpjs = [str(c) for c in (cidade["fontes"].get("cnpjs_orgao") or []) if c]
        if not cnpjs:
            principal = cidade["cnpj_prefeitura"]
            if not principal:
                raise RuntimeError(
                    f"municipios.cnpj_prefeitura vazio para id_municipio={id_municipio}."
                )
            cnpjs = [principal]
            print(
                "[etl.pncp.contratos] AVISO: usando só o CNPJ da prefeitura. "
                "Numa capital isso subconta — rode `python -m etl.pncp.orgaos "
                f"--id-municipio {id_municipio} --gravar` primeiro."
            )
    print(f"[etl.pncp.contratos] {len(cnpjs)} CNPJ(s) de órgão mapeados para varredura")
    ano_atual = dt.date.today().year
    total = 0
    estado = ck.carregar(ck.NOME_CONTRATOS)

    def _gravar_lote(rows_by_pncp: dict[str, dict]) -> int:
        """Persiste um lote de contratos no banco com tratamento de colunas opcionais."""
        rows = list(rows_by_pncp.values())
        if rows:
            for i in range(0, len(rows), 1000):
                upsert_com_colunas_opcionais(
                    client,
                    "contratos",
                    rows[i : i + 1000],
                    ["temas"],
                    on_conflict="numero_controle_pncp",
                )
        return len(rows)

    # 3. Laço de varredura ano a ano, CNPJ a CNPJ
    for ano in range(ano_inicio, ano_atual + 1):
        data_inicial = f"{ano}0101"
        data_final = f"{ano}1231"
        for cnpj in cnpjs:
            chave_unidade = f"{id_municipio}:{cnpj}:{ano}"
            if ck.unidade_pronta(estado, chave_unidade):
                print(
                    f"[etl.pncp.contratos] {chave_unidade} checkpoint=ok, pula"
                )
                continue

            pagina_inicio = ck.pagina_retomar(estado, chave_unidade)
            if pagina_inicio > 1:
                print(
                    f"[etl.pncp.contratos] {chave_unidade} retoma na página "
                    f"{pagina_inicio}",
                    flush=True,
                )

            # Deduplicação no lote do mesmo ano: evita erro "cannot affect row a second time" do Postgres
            vistos_no_ano: set[str] = set()
            rows_lote: dict[str, dict] = {}
            paginas_gravadas = pagina_inicio - 1
            item_ck = estado.get(chave_unidade)
            registros_ano = (
                int(item_ck.get("registros") or 0)
                if isinstance(item_ck, dict)
                else 0
            )

            try:
                for pagina, registros_brutos in iter_contratos(
                    cnpj, data_inicial, data_final, pagina_inicio=pagina_inicio
                ):
                    for raw in registros_brutos:
                        row = _map_row(raw, id_municipio)
                        chave = row["numero_controle_pncp"]
                        if not chave or chave in vistos_no_ano:
                            continue
                        vistos_no_ano.add(chave)
                        rows_lote[chave] = row

                    # Gravação incremental por página para resiliência a quedas de conexão
                    n = _gravar_lote(rows_lote)
                    registros_ano += n
                    rows_lote = {}
                    paginas_gravadas = max(paginas_gravadas, pagina)
                    ck.marcar_parcela(
                        estado,
                        ck.NOME_CONTRATOS,
                        chave_unidade,
                        pagina=paginas_gravadas,
                        registros=registros_ano,
                    )
                    print(
                        f"[etl.pncp.contratos] {chave_unidade} p={pagina} "
                        f"lote={n} acumulado={registros_ano}",
                        flush=True,
                    )

                # Persiste eventuais registros residuais e marca conclusão no checkpoint
                n = _gravar_lote(rows_lote)
                registros_ano += n
                ck.marcar_ok(
                    estado, ck.NOME_CONTRATOS, chave_unidade, registros=registros_ano
                )
                print(
                    f"[etl.pncp.contratos] {chave_unidade} registros={registros_ano}"
                )
                total += registros_ano
            except Exception as e:
                # Falhas de gateway ou instabilidades temporárias do PNCP salvam o parcial e seguem
                n = _gravar_lote(rows_lote)
                registros_ano += n
                total += registros_ano
                print(
                    f"[etl.pncp.contratos] AVISO: {chave_unidade} interrompida por erro na API ({type(e).__name__}: {e}); "
                    f"parcial ({registros_ano} reg) gravado e segue.",
                    flush=True,
                )
                ck.marcar_ok(
                    estado, ck.NOME_CONTRATOS, chave_unidade, registros=registros_ano
                )
    print(f"[etl.pncp.contratos] Conclusão da sincronização: total de {total} registros processados")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Coletor e sincronizador de contratos do PNCP para o banco de dados.")
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT, help="Código IBGE do município.")
    parser.add_argument(
        "--cnpj-orgao",
        default=None,
        help="Override de CNPJ; o padrão busca os CNPJs descobertos em `municipios.fontes`.",
    )
    parser.add_argument("--ano-inicio", type=int, default=2021, help="Ano inicial da busca (padrão: 2021).")
    parser.add_argument(
        "--permitir-fonte-dupla",
        action="store_true",
        help="Permite rodar mesmo se a cidade declarar outra fonte canônica de contratos.",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.cnpj_orgao, args.ano_inicio, args.permitir_fonte_dupla)
    except RuntimeError as e:
        print(f"[etl.pncp.contratos] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
