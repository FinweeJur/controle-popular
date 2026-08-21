r"""etl.apis._powerbi_dsr — decodificador PURO do "DSR" (Data Shape Result),
o formato comprimido em que a API pública de relatórios do Power BI devolve
tabela. Sem rede, sem estado global: entra o JSON da resposta, sai tabela.

Escrito em 2026-08-20 para o painel "Painel TACs Final" da SEMAD/MG
(ver `etl.apis.tacs_mineradoras`), mas o decodificador em si não sabe nada
sobre TACs — serve qualquer `querydata` do mesmo endpoint.

═══ POR QUE ESTE MÓDULO EXISTE SEPARADO, E POR QUE ELE QUEBRA ALTO ═══

O DSR **não é uma tabela**: é uma tabela com três camadas de compressão
empilhadas (dicionário de valores, máscara de repetição, máscara de nulo).
Um decodificador *quase* certo não devolve erro — devolve **tabela plausível
e errada**, com colunas vazias que parecem "dado faltando na origem". Esse é
o modo de falha que este módulo existe para tornar impossível: toda
ambiguidade vira exceção, nunca célula vazia.

O contrato do DSR **não é documentado pela Microsoft** e pode mudar sem
aviso. Por isso duas decisões: (1) a fixture congelada
(`_powerbi_dsr_test.py`) trava o formato medido em 2026-08-20, e (2) as
guardas abaixo preferem estourar a adivinhar. Se a fonte mudar o formato, o
teste quebra e o coletor para — em vez de gravar tabela silenciosamente
torta.

═══ AS TRÊS CAMADAS, COMO MEDIDAS NA FIXTURE ═══

Caminho do dado: `results[0].result.data.dsr.DS[0].PH[0]["DM0"]`. Cada item
é uma linha, e a PRIMEIRA linha carrega o esquema em `S` (que também define
a ORDEM das colunas e qual dicionário cada uma usa).

1. **`ValueDicts` + `S[].DN`** — a coluna cujo esquema tem `DN: "D0"` guarda
   em `C` um ÍNDICE INTEIRO no dicionário `ValueDicts["D0"]`, não o valor.
   A coluna SEM `DN` (na fixture, `G4`/Ano, `T: 4` = número) guarda o valor
   CRU. Confundir as duas troca "Ano 2022" por "o 2022º item do dicionário".

2. **`R` — máscara de bits de REPETIÇÃO.** Bit `j` ligado = "a coluna `j`
   REPETE o valor da linha anterior". É o que explica a linha `[0,0,0,0,2022]`
   seguida de `{"C": [2023], "R": 15}`: 15 = `0b01111`, as quatro primeiras
   colunas herdam, só o Ano vem novo. **Ignorar `R` produz 43 das 50 linhas
   com quatro colunas vazias** — e nada nos dados denuncia o erro.

3. **`Ø` (U+00D8) — máscara de bits de NULO.** Bit `j` ligado = "a coluna `j`
   é NULA nesta linha". **Nulo e repetição são coisas DIFERENTES**: tratar
   nulo como repetição faz o valor da linha de cima escorrer para baixo,
   inventando dado que a fonte nunca afirmou. Alguns servidores mandam a
   chave como `"null"`; as duas grafias são aceitas aqui, nunca somadas.

`C` traz **só as colunas que não foram nem herdadas nem anuladas**, na ordem
do esquema. O casamento coluna↔valor é posicional DENTRO desse subconjunto —
por isso `_decodificar_linha` consome `C` com um cursor e **confere no fim
que consumiu `C` inteiro** (sobra = interpretação de máscara errada).

═══ POR QUE OS NOMES DE COLUNA VÊM DO `descriptor`, NUNCA DA POSIÇÃO ═══

O esquema `S` nomeia as colunas `G0..G4` (nomes internos do agrupamento). Os
nomes de verdade (`e.Projeto`, `e.Órgão/Instituição`) estão em
`data.descriptor.Select[]`, casados por `Select[].Value == S[].N`. O
descriptor **não vem necessariamente na mesma ordem** do `S`, e presumir a
ordem é o jeito mais fácil de trocar duas colunas de lugar sem que nada
pareça errado — "Mineradora" e "Órgão" são ambos texto curto. Casar por
`Value` é barato e elimina a classe inteira de erro.

═══ A CONFERÊNCIA INDEPENDENTE: `RT` ═══

A resposta traz `DS[0].RT`, o "restart token" — os valores da ÚLTIMA linha
da janela, em forma literal, que o servidor usa para retomar a paginação.
Ele é gerado pelo servidor por um caminho DIFERENTE do `DM0` comprimido, o
que o torna uma **testemunha independente** da decodificação:
`conferir_contra_restart_token` compara a última linha decodificada com ele.
Foi assim que a decodificação desta fixture foi validada em 2026-08-20 (bate
nas 5 colunas). Se um dia o `R` for interpretado ao contrário, o `RT` acusa.

Formato do `RT`: texto entre aspas simples (`'SUTAF'`) e número com sufixo
de tipo (`2023L` = inteiro longo) — por isso a comparação normaliza os dois
lados antes de confrontar, e trata divergência de TIPO como ruído do token,
não como erro de dado.

⚠️ **Nem toda resposta traz `RT`.** Medido em 2026-08-21, ao vivo: as
entidades `Contas x Projetos`, `Empresas_valores Estado Consulta Geral` e
`Soma Deposito_Execucao_Transferencia` respondem SEM `RT` (a conferência cai
para `{"conferido": False, "motivo": "resposta sem RT ou sem linhas"}`, não
para erro) — só `Execução_Projetos_Completa` trouxe `RT` na sondagem
original. Ausência de `RT` não é falha de decodificação; é a testemunha
independente que simplesmente não veio nesta consulta. `conferir()` não
ergue por isso — quem chama decide se aceita `conferido: False`.

Uso:

    from etl.apis._powerbi_dsr import decodificar_resposta, conferir
    tabela = decodificar_resposta(resposta_json)
    conferir(tabela, esperado=50)
    tabela.linhas[0]["e.Projeto"]
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

LOG = "[etl.apis._powerbi_dsr]"

# A máscara de nulo vem como "Ø" (U+00D8). Alguns servidores mandam "null".
# As duas grafias valem, mas nunca são SOMADAS: ver `_mascara_de_nulo`.
_CHAVES_NULO = ("Ø", "null")

# Um índice muito além do fim do dicionário quase certamente é um valor CRU
# lido como índice (ex.: o ano 2022 contra um dicionário de 6 nomes). O corte
# é RELATIVO ao tamanho do dicionário, não um número absoluto: um dicionário
# de 6 valores e outro de 40 mil merecem limiares diferentes. Só afina a
# MENSAGEM — quem barra o erro é a checagem de intervalo, sempre.
_FATOR_INDICE_SUSPEITO = 10
_PISO_INDICE_SUSPEITO = 100


class ErroDSR(RuntimeError):
    """Formato do DSR fora do contrato medido. SEMPRE fatal: a alternativa é
    devolver tabela plausível e errada, que ninguém audita."""


@dataclass
class Tabela:
    """Resultado decodificado. `colunas` na ordem do esquema `S`; `linhas` são
    dicionários nome->valor (`None` = nulo declarado pela fonte)."""

    colunas: list[str]
    linhas: list[dict[str, Any]]
    total_declarado: int | None = None
    restart_token: list[Any] | None = None
    diagnostico: dict[str, Any] = field(default_factory=dict)

    def __len__(self) -> int:
        return len(self.linhas)

    def como_matriz(self) -> list[list[Any]]:
        return [[l[c] for c in self.colunas] for l in self.linhas]


# ──────────────────────────── navegação no envelope ─────────────────────


def _exigir(cond: bool, mensagem: str) -> None:
    if not cond:
        raise ErroDSR(f"{LOG} {mensagem}")


def extrair_data(resposta: dict) -> dict:
    """`results[0].result.data`. Erguer aqui é melhor que um KeyError cru
    lá na frente: se o envelope mudou, nada abaixo faz sentido."""
    _exigir(isinstance(resposta, dict), f"resposta não é objeto JSON: {type(resposta).__name__}")
    resultados = resposta.get("results")
    _exigir(
        isinstance(resultados, list) and len(resultados) > 0,
        f"resposta sem `results` não-vazio — chaves: {sorted(resposta)}",
    )
    primeiro = resultados[0]
    if "error" in primeiro:
        raise ErroDSR(f"{LOG} a API devolveu erro dentro do 200 OK: {primeiro['error']!r}")
    data = (primeiro.get("result") or {}).get("data")
    _exigir(isinstance(data, dict), f"`results[0].result.data` ausente — chaves: {sorted(primeiro)}")
    return data


def _nomes_do_descriptor(data: dict) -> dict[str, str]:
    """`Select[].Value` -> `Select[].Name`. Casamento por VALOR, nunca por
    posição (ver docstring do módulo)."""
    seleção = (data.get("descriptor") or {}).get("Select")
    _exigir(
        isinstance(seleção, list) and len(seleção) > 0,
        "`descriptor.Select` ausente ou vazio — sem ele não há como nomear coluna "
        "sem presumir ordem, e presumir ordem troca coluna de lugar em silêncio.",
    )
    nomes: dict[str, str] = {}
    for item in seleção:
        valor, nome = item.get("Value"), item.get("Name")
        _exigir(
            valor is not None and nome is not None,
            f"item de `descriptor.Select` sem `Value`/`Name`: {item!r}",
        )
        nomes[valor] = nome
    return nomes


# ─────────────────────────────── as máscaras ────────────────────────────


def _mascara_de_nulo(linha: dict) -> int:
    """Aceita `Ø` ou `null`, mas ergue se vierem AS DUAS: somar ou escolher
    uma seria adivinhar qual o servidor considera autoritativa, e o custo do
    palpite errado é dado nulo virando dado real (ou o contrário)."""
    presentes = [k for k in _CHAVES_NULO if k in linha]
    if len(presentes) > 1:
        raise ErroDSR(
            f"{LOG} linha traz mais de uma máscara de nulo ao mesmo tempo ({presentes}) — "
            "contrato mudou; recuso adivinhar qual vale."
        )
    if not presentes:
        return 0
    bruto = linha[presentes[0]]
    _exigir(isinstance(bruto, int), f"máscara de nulo não-inteira: {bruto!r}")
    return bruto


def _mascara_de_repeticao(linha: dict) -> int:
    bruto = linha.get("R", 0)
    _exigir(isinstance(bruto, int), f"máscara de repetição `R` não-inteira: {bruto!r}")
    return bruto


def _bits_acima_de(mascara: int, n_colunas: int) -> bool:
    return mascara >> n_colunas != 0


# ────────────────────────────── decodificação ───────────────────────────


def _resolver_valor(bruto: Any, dicionario_nome: str | None, dicts: dict, coluna: str, i: int) -> Any:
    """Índice -> valor do `ValueDicts` quando a coluna tem `DN`; senão, cru."""
    if dicionario_nome is None:
        return bruto
    valores = dicts.get(dicionario_nome)
    _exigir(
        isinstance(valores, list),
        f"linha {i}, coluna {coluna!r}: esquema aponta o dicionário {dicionario_nome!r}, "
        f"que não existe em ValueDicts (tem: {sorted(dicts)}).",
    )
    if not isinstance(bruto, int) or isinstance(bruto, bool):
        # Valor literal numa coluna que declarou dicionário: acontece em DSR
        # real quando o servidor decide não internar um valor. É legítimo,
        # mas só para texto — inteiro aqui seria índice, e cair neste ramo
        # com inteiro significaria que a checagem de intervalo foi pulada.
        return bruto
    if not 0 <= bruto < len(valores):
        suspeito = bruto >= max(_PISO_INDICE_SUSPEITO, len(valores) * _FATOR_INDICE_SUSPEITO)
        pista = (
            " O número está muito além do fim do dicionário — provável valor CRU lido como "
            "índice (confusão índice×literal)."
            if suspeito
            else ""
        )
        raise ErroDSR(
            f"{LOG} linha {i}, coluna {coluna!r}: índice {bruto} fora do dicionário "
            f"{dicionario_nome!r}, que tem {len(valores)} valor(es).{pista}"
        )
    return valores[bruto]


def _decodificar_linha(
    linha: dict,
    i: int,
    esquema: list[tuple[str, str | None]],
    colunas: list[str],
    dicts: dict,
    anterior: list[Any] | None,
) -> list[Any]:
    repeticao = _mascara_de_repeticao(linha)
    nulo = _mascara_de_nulo(linha)
    celulas = linha.get("C", [])
    _exigir(isinstance(celulas, list), f"linha {i}: `C` não é lista: {celulas!r}")

    n = len(esquema)
    if len(celulas) > n:
        raise ErroDSR(
            f"{LOG} linha {i} tem {len(celulas)} valor(es) em `C` para um descriptor de "
            f"{n} coluna(s) — mais colunas que o esquema; o formato mudou."
        )
    for nome_mascara, mascara in (("R", repeticao), ("Ø", nulo)):
        if _bits_acima_de(mascara, n):
            raise ErroDSR(
                f"{LOG} linha {i}: máscara {nome_mascara}={mascara} (0b{mascara:b}) tem bit "
                f"ligado além da coluna {n - 1} — mais colunas que o descriptor."
            )
    if repeticao and anterior is None:
        # A guarda que pega a máscara invertida: não existe "linha anterior"
        # para a primeira. Se `R` manda herdar aqui, a leitura dos bits está
        # ao contrário — e o resultado seria tabela inteira deslocada.
        raise ErroDSR(
            f"{LOG} linha 0 traz máscara de repetição R={repeticao} (0b{repeticao:b}), mas não "
            "há linha anterior de quem herdar — sinal de que a interpretação da máscara está "
            "invertida. Recuso decodificar."
        )

    valores: list[Any] = []
    cursor = 0
    for j, (interno, dicionario_nome) in enumerate(esquema):
        herda = (repeticao >> j) & 1
        eh_nulo = (nulo >> j) & 1
        if herda and eh_nulo:
            raise ErroDSR(
                f"{LOG} linha {i}, coluna {colunas[j]!r}: bit ligado em R E em Ø ao mesmo "
                "tempo — 'repete o de cima' e 'é nulo' se contradizem."
            )
        if herda:
            valores.append(anterior[j])  # type: ignore[index]
        elif eh_nulo:
            valores.append(None)
        else:
            if cursor >= len(celulas):
                raise ErroDSR(
                    f"{LOG} linha {i}: `C` acabou na coluna {colunas[j]!r} (tem {len(celulas)} "
                    f"valor(es), R={repeticao}, Ø={nulo}) — máscara e valores não fecham."
                )
            valores.append(
                _resolver_valor(celulas[cursor], dicionario_nome, dicts, colunas[j], i)
            )
            cursor += 1

    if cursor != len(celulas):
        raise ErroDSR(
            f"{LOG} linha {i}: sobraram {len(celulas) - cursor} valor(es) em `C` sem coluna "
            f"(consumi {cursor} de {len(celulas)}, R={repeticao}, Ø={nulo}) — interpretação "
            "de máscara errada."
        )
    return valores


def decodificar_dsr(dsr: dict, nomes: dict[str, str], membro: str = "DM0") -> Tabela:
    """Decodifica `dsr` já extraído. `nomes` vem do descriptor."""
    conjuntos = dsr.get("DS")
    _exigir(isinstance(conjuntos, list) and conjuntos, "`dsr.DS` ausente ou vazio.")
    ds = conjuntos[0]
    dicts = ds.get("ValueDicts") or {}
    paginas = ds.get("PH")
    _exigir(isinstance(paginas, list) and paginas, "`dsr.DS[0].PH` ausente ou vazio.")

    # As linhas podem vir repartidas em vários `PH`; concatenar na ordem é o
    # comportamento do próprio visual. Ler só `PH[0]` truncaria em silêncio.
    brutas: list[dict] = []
    for ph in paginas:
        pedaco = ph.get(membro)
        if pedaco is None:
            continue
        _exigir(isinstance(pedaco, list), f"`PH[...][{membro!r}]` não é lista: {type(pedaco).__name__}")
        brutas.extend(pedaco)

    if not brutas:
        chaves = sorted({k for ph in paginas for k in ph})
        _exigir(
            membro in chaves,
            f"membro {membro!r} não existe no `PH` (tem: {chaves}) — o nome do membro vem de "
            "`descriptor.Expressions.Primary.Groupings[].Member`.",
        )
        return Tabela(colunas=[], linhas=[], total_declarado=0, restart_token=ds.get("RT"))

    esquema_bruto = brutas[0].get("S")
    _exigir(
        isinstance(esquema_bruto, list) and esquema_bruto,
        "a primeira linha não traz o esquema `S` — sem ele não há ordem de coluna nem "
        "mapa de dicionário, e qualquer decodificação seria chute.",
    )
    esquema: list[tuple[str, str | None]] = []
    colunas: list[str] = []
    for campo in esquema_bruto:
        interno = campo.get("N")
        _exigir(interno is not None, f"campo do esquema sem `N`: {campo!r}")
        _exigir(
            interno in nomes,
            f"coluna interna {interno!r} não está no `descriptor.Select` (tem: {sorted(nomes)}) "
            "— casar por posição no lugar disto trocaria coluna de lugar em silêncio.",
        )
        esquema.append((interno, campo.get("DN")))
        colunas.append(nomes[interno])

    linhas: list[dict[str, Any]] = []
    anterior: list[Any] | None = None
    herdadas = nulas = 0
    for i, bruta in enumerate(brutas):
        valores = _decodificar_linha(bruta, i, esquema, colunas, dicts, anterior)
        herdadas += bin(_mascara_de_repeticao(bruta)).count("1")
        nulas += bin(_mascara_de_nulo(bruta)).count("1")
        anterior = valores
        linhas.append(dict(zip(colunas, valores)))

    return Tabela(
        colunas=colunas,
        linhas=linhas,
        total_declarado=len(brutas),
        restart_token=(ds.get("RT") or [None])[0] if ds.get("RT") else None,
        diagnostico={
            "linhas_brutas": len(brutas),
            "celulas_herdadas_por_R": herdadas,
            "celulas_nulas_por_Ø": nulas,
            "paginas_PH": len(paginas),
            "dicionarios": {k: len(v) for k, v in dicts.items()},
        },
    )


def decodificar_resposta(resposta: dict, membro: str = "DM0") -> Tabela:
    """Envelope -> `Tabela`. É a porta de entrada normal deste módulo."""
    data = extrair_data(resposta)
    dsr = data.get("dsr")
    _exigir(isinstance(dsr, dict), "`result.data.dsr` ausente — resposta não é DSR.")
    return decodificar_dsr(dsr, _nomes_do_descriptor(data), membro=membro)


# ──────────────────────────────── conferência ───────────────────────────


_RE_TEXTO_RT = re.compile(r"^'(.*)'$", re.DOTALL)
_RE_NUMERO_RT = re.compile(r"^(-?\d+(?:\.\d+)?)[A-Za-z]?$")


def _normalizar_rt(bruto: Any) -> Any:
    """`"'SUTAF'"` -> `"SUTAF"`; `"2023L"` -> `2023`. O `RT` é serializado
    como expressão DAX, não como JSON — comparar cru daria falso negativo."""
    if not isinstance(bruto, str):
        return bruto
    texto = _RE_TEXTO_RT.match(bruto)
    if texto:
        return texto.group(1).replace("''", "'")
    numero = _RE_NUMERO_RT.match(bruto.strip())
    if numero:
        valor = numero.group(1)
        return int(valor) if "." not in valor else float(valor)
    if bruto in ("null", "BLANK()"):
        return None
    return bruto


def conferir_contra_restart_token(tabela: Tabela) -> dict:
    """Confronta a última linha decodificada com o `RT` da resposta.

    O `RT` é gerado pelo servidor por um caminho DIFERENTE do `DM0`
    comprimido — é testemunha INDEPENDENTE de que as máscaras foram lidas
    certo. Uma inversão de `R` desloca a última linha e aparece aqui.
    Devolve diagnóstico; ergue se divergir em valor. Nem toda resposta traz
    `RT` (ver docstring do módulo) — ausência não é erro, só reduz o que dá
    para confirmar."""
    if not tabela.restart_token or not tabela.linhas:
        return {"conferido": False, "motivo": "resposta sem RT ou sem linhas"}
    esperado = [_normalizar_rt(v) for v in tabela.restart_token]
    obtido = [tabela.linhas[-1][c] for c in tabela.colunas]
    if len(esperado) != len(obtido):
        raise ErroDSR(
            f"{LOG} o restart token tem {len(esperado)} coluna(s) e a última linha "
            f"decodificada tem {len(obtido)} — decodificação e servidor discordam do formato."
        )
    divergentes = [
        (tabela.colunas[j], esperado[j], obtido[j])
        for j in range(len(obtido))
        # Comparação por TEXTO: o RT perde o tipo (`2023L`), e exigir tipo
        # igual acusaria ruído do token como erro de dado.
        if str(esperado[j]) != str(obtido[j])
    ]
    if divergentes:
        raise ErroDSR(
            f"{LOG} a última linha decodificada NÃO bate com o restart token do servidor: "
            f"{divergentes!r}. É o sintoma clássico de máscara `R`/`Ø` lida ao contrário — "
            "a tabela inteira está deslocada. Recuso devolver."
        )
    return {"conferido": True, "colunas": len(obtido)}


def conferir(tabela: Tabela, esperado: int | None = None, janela: int | None = None) -> dict:
    """Guarda de integridade. Ergue em vez de devolver tabela truncada.

    - contagem decodificada × contagem declarada pela resposta;
    - contagem × `esperado` (o total que a fonte afirma, quando conhecido);
    - `janela`: se a resposta encheu exatamente a janela pedida, há MAIS
      dado do lado de lá. Truncar aqui e chamar de total é o erro que
      produz "o painel tem 50 projetos" quando tem 300."""
    diag: dict[str, Any] = {"linhas": len(tabela.linhas), "colunas": len(tabela.colunas)}
    diag.update(tabela.diagnostico)

    if tabela.total_declarado is not None and len(tabela.linhas) != tabela.total_declarado:
        raise ErroDSR(
            f"{LOG} decodifiquei {len(tabela.linhas)} linha(s) mas a resposta declara "
            f"{tabela.total_declarado} — tabela truncada, recuso devolver."
        )
    diag.update(conferir_contra_restart_token(tabela))

    if esperado is not None and len(tabela.linhas) != esperado:
        raise ErroDSR(
            f"{LOG} esperava {esperado} linha(s) e decodifiquei {len(tabela.linhas)} — "
            "paginação incompleta ou a fonte mudou."
        )
    if janela is not None and len(tabela.linhas) >= janela:
        diag["janela_cheia"] = True
        diag["aviso"] = (
            f"a resposta encheu a janela de {janela} linha(s): quase certamente há MAIS dado "
            "além desta página. Tratar isto como total seria subcontar."
        )
    return diag
