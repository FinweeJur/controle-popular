# PNTP/Atricon — índice de transparência por ente público

> **Tipo:** FONTE
> **Domínio:** transparência pública (Atricon/PNTP) — índice por ente, recorte de MG
> **Última medição:** 2026-11-18 (pacotes dos ciclos 2022–2025 baixados e medidos; coletor `scripts/coletar-pntp.py`)
> **Leitura estimada:** média (10–20 min)
> **Relacionados:** [FONTES.md](FONTES.md), [COLETA-ETICA.md](COLETA-ETICA.md), [DADOS-GOV-BR.md](DADOS-GOV-BR.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md)
> **Palavras-chave:** pntp, atricon, transparência, índice, itp, município, tribunal de contas, dados abertos, cpf, dado pessoal, mg

## Sumário

- [O que é o programa](#o-que-é-o-programa)
- [Cobertura medida](#cobertura-medida)
- [Onde ficam os arquivos](#onde-ficam-os-arquivos)
- [Schema: 15 colunas em 2022, 21 de 2023 em diante](#schema-15-colunas-em-2022-21-de-2023-em-diante)
- [O que o portal publica](#o-que-o-portal-publica)
- [Números medidos](#números-medidos)
- [Privacidade: o que nunca é publicado](#privacidade-o-que-nunca-é-publicado)
- [Armadilhas medidas](#armadilhas-medidas)
- [Licença e termos](#licença-e-termos)
- [Como o portal usaria](#como-o-portal-usaria)
- [Limites: o que este índice não é](#limites-o-que-este-índice-não-é)
- [Como rodar e verificar](#como-rodar-e-verificar)
- [Origem / histórico](#origem--histórico)

## O que é o programa

O **PNTP — Programa Nacional de Transparência Pública** avalia a transparência
ativa dos portais oficiais das instituições públicas brasileiras. Nasceu em
2022 de uma união entre **Atricon, TCE-MT e TCU**, hoje com todos os Tribunais
de Contas, e cobre os três Poderes, Ministérios Públicos, Tribunais de Contas,
Defensorias, estatais e consórcios.

A avaliação tem duas camadas, e a diferença entre elas importa para quem lê o
número:

1. **Autoavaliação** — o próprio órgão responde ao formulário da Cartilha de
   Orientação, critério por critério, e anexa a evidência (link da página).
2. **Validação técnica** — auditores do Tribunal de Contas conferem as
   evidências no sistema **Avalia**, em três etapas, e saneiam a resposta.

O resultado de cada ente é o **ITP (Índice de Transparência Pública)**, de 0 a
100, mais o **% das Essenciais** (quanto dos critérios essenciais foi atendido)
e um **nível**. O ente também recebe duas marcas: se a avaliação foi
**validada** e se é **certificável** (só Diamante, Ouro e Prata recebem o
selo — medido, ver [armadilhas](#armadilhas-medidas)).

## Cobertura medida

| Ciclo | Entes na planilha | Entes de MG | Observação |
|---|---:|---:|---|
| 2022 | 8.019 | 150 | escopo e metodologia diferentes dos ciclos seguintes |
| 2023 | 11.697 | 1.712 | primeira rodada da matriz nova |
| 2024 | 11.697 | 1.712 | |
| 2025 | 11.697 | 1.712 | |

- A home do programa publica, em 18/11/2026, **"10.879 entidades avaliadas em
  2026"** — o ciclo 2026 ainda está em apuração e **não tem pacote publicado**;
  o mais recente é o de 2025.
- Em MG são **6 entes estaduais** (Governo, Assembleia, TJ, TCE, MP e
  Defensoria) em todos os ciclos, e o resto é municipal: prefeitura e câmara de
  cada município que participou.

## Onde ficam os arquivos

- Portal: <https://pntp.atricon.org.br/dados-abertos/>
- Pacotes anuais: `https://cdn.atricon.org.br/2026/08/dados_pntp_<ano>.zip`

| Ciclo | ZIP (medido) | Bytes |
|---|---:|---:|
| 2022 | 83 MB | 87.384.890 |
| 2023 | 183 MB | 191.529.027 |
| 2024 | 202 MB | 211.614.707 |
| 2025 | 323 MB | 338.558.947 |

Dentro de cada ZIP:

```
pntp_<ano>/avaliacoes_pntp_<ano>.xlsx          ← a tabela que o portal lê
pntp_<ano>/respostas/respostas_pntp_<ano>_<UF>.xlsx   ← NÃO é usada
```

A pasta `respostas/` tem uma planilha por UF com o formulário respondido
critério por critério. É ~30× maior, traz texto livre escrito por servidor e
não alimenta nenhuma página do portal — por isso o coletor ignora.

**`robots.txt`** (medido 18/11/2026): libera `/dados-abertos/`; `Disallow` só
em `/wp-admin/`, `/wp-json/` e busca. `Crawl-delay: 10` está publicado para
rastreadores de IA — a coleta baixa **4 arquivos** com 2 s de pausa, uma vez
por ciclo. O `Last-Modified` dos quatro pacotes era **17/08/2026**; a própria
página os rotula como atualizados em 10/02/2026 (o rótulo do site atrasa em
relação ao arquivo — vale o cabeçalho HTTP).

## Schema: 15 colunas em 2022, 21 de 2023 em diante

A página da Atricon avisa: **"o esquema muda entre ciclos"**. Medido:

| Ciclo | Colunas | Nomes que importam |
|---|---:|---|
| 2022 | 15 | `Código Formulário`, `Data Envio`, `Poder do Ente Público`, `Esfera`, `Órgão`, `Estado`, `Município`, `Avaliação Validada?`, `Avaliação Certificável?`, `Índice de Transparência`, `% das Essenciais`, `Nível de Transparência`, `Preenchido por:`, `Nome Responsável`, `E-mail Responsável` |
| 2023–2025 | 21 | `id_avaliacao`, `Data Envio`, `Poder`, `Esfera`, `Unidade Gestora`, `UF`, `Código Entidade`, `ibge`, `Município`, `Autoavaliação`, `Avaliação Validada?`, `Avaliação Revisada?`, `Avaliação Certificável?`, `Índice de Transparência`, `% das Essenciais`, `Nível de Transparência`, `% de Variação de Índice`, `Variação por Índice`, `Histórico do Nível`, `Variação por Nível`, `Link Site Principal` |

Diferenças que quebram coletor desatento:

- o estado vem **por extenso** ("MINAS GERAIS" em 2022, "Minas Gerais" depois),
  e o filtro por UF é comparação de string, não de sigla;
- `Órgão` (2022) é **genérico** — "Prefeitura", "Câmara dos Vereadores" — e se
  repete em cada município; `Unidade Gestora` (2023+) é o nome completo;
- `Índice de Transparência` e `% das Essenciais` vêm em **fração 0–1**
  (0,8252788), não em porcentagem;
- `Avaliação Validada?` usa **emoji** em 2022 (`✔️`/`❌`), `Sim`/`Não` depois,
  e `-` quando o ente não foi avaliado;
- 2022 não tem nível `Não Avaliado` — os 8.019 entes têm índice.

## O que o portal publica

Dois arquivos, gerados por `scripts/coletar-pntp.py`:

| Arquivo | Conteúdo | Tamanho medido |
|---|---|---:|
| `apps/web/data/pntp/avaliacoes-mg.json` | uma linha por ente de MG, ciclos 2022–2025 | 1,69 MiB (1.771.783 bytes) |
| `apps/web/data/pntp/resumo-brasil.json` | só agregado nacional por ano, esfera e poder | 4,2 KB |

Campos por ente — e **só** estes:

| Campo | Tipo | Origem |
|---|---|---|
| `ano` | inteiro | ciclo |
| `orgao` | texto | `Unidade Gestora`; em 2022, `Órgão` + município ("Prefeitura de Ouro Preto") |
| `poder` | texto | `Poder` / `Poder do Ente Público` |
| `esfera` | texto | `Esfera` (Municipal, Estadual…) |
| `estado` | texto | `MG` |
| `municipio` | texto | `Município` (capitalizado quando a fonte vem em caixa alta) |
| `itp` | número 0–100 · nulo | `Índice de Transparência` ×100, 1 decimal |
| `pctEssenciais` | número 0–100 · nulo | `% das Essenciais` ×100, 1 decimal |
| `nivel` | texto | `Nível de Transparência`, literal |
| `validada` | booleano · nulo | `Avaliação Validada?` |
| `certificavel` | booleano · nulo | `Avaliação Certificável?` |
| `fonte` | URL | ZIP do ciclo |
| `coletadoEm` | ISO 8601 | carimbo da coleta |

O resumo nacional traz, por ciclo: `entes`, `avaliados`, `naoAvaliados`,
`itpMedio` e as listas `porEsfera` e `porPoder` com a mesma trinca. Nenhuma
linha de ente mora ali.

## Números medidos

Recorte de MG, medido em 18/11/2026:

| Ciclo | Entes | Avaliados | ITP médio de MG | ITP médio do Brasil |
|---|---:|---:|---:|---:|
| 2022 | 150 | 150 | 66,1 | 67,6 |
| 2023 | 1.712 | 14 | 75,1 | 58,2 |
| 2024 | 1.712 | 128 | 67,2 | 63,9 |
| 2025 | 1.712 | 1.581 | 54,4 | 66,6 |

Leituras que o número bruto esconde:

- **2023 é um deserto de MG.** Dos 1.712 entes, 1.698 estão como
  `Não Avaliado` — a média de 75,1 fala de 14 entes, não do estado. Foi o
  primeiro ciclo da matriz nova e a base de MG não foi validada.
- **2024 ainda é magro:** 1.584 não avaliados, 128 com índice.
- **2025 é o ciclo completo:** 1.581 avaliados, média 54,4 — abaixo da média
  nacional de 66,6. É o número que vale publicar como "MG no PNTP".
- O cálculo do resumo **reproduz o número da Atricon**: 66,6% para 2025
  excluindo `Não Avaliado`, e 57,34% na média bruta — exatamente a diferença
  que a página do PNTP explica ("a média bruta engana").

## Privacidade: o que nunca é publicado

A planilha da Atricon traz **`Preenchido por:`, `Nome Responsável` e
`E-mail Responsável`** — nome e e-mail do servidor que preencheu o
formulário. É dado pessoal de pessoa natural no exercício da função, e o
repositório do portal é público (regras 5.2 e 5.8).

O que o coletor faz:

- **nunca copia** esses três campos para nenhuma estrutura de saída — o
  dicionário publicável é montado campo a campo, não é a linha da planilha;
- **varre o resultado antes de gravar**: aborta se achar e-mail, CPF válido
  por mod-11 ou o nome de um dos campos proibidos;
- o teste `apps/web/lib/pntp/pntp.test.ts` repete a varredura no arquivo
  versionado — e-mail, CPF por mod-11 e campo de responsável.

Efeito colateral conhecido e aceito: **não é possível responder "quem
preencheu" a partir do portal**. Quem precisar desse dado vai à fonte, onde
ele já é público desde sempre.

## Armadilhas medidas

1. **A escala do índice não é uniforme.** Fora de 0–1, mas dentro de 0–100, há
   **5 linhas no ciclo 2025** com `% das Essenciais` já em porcentagem
   (5 · 6,6 · 4,2 · 2,2), todas com `Avaliação Validada? = Não`. Ler como
   fração daria 500%. O coletor aceita a leitura possível (5%), conta o ajuste
   e o imprime no relatório da coleta.
2. **`Não Avaliado` vem com índice 0 na planilha.** Publicar esse 0 diria
   "transparência zero" de quem só não entregou o formulário. O portal grava
   `itp: null` e mantém `nivel: "Não Avaliado"`; o teste exige a
   correspondência.
3. **"Intermediário*" (2022) não é Intermediário.** Medido: a faixa com
   asterisco cobre ITP 0,75–0,99 e **nunca** é certificável — é a banda alta
   sem selo. Em 2023 ela foi rebatizada **"Elevado"**, que também cobre
   0,75–0,98 e nunca é certificável. Os selos (Prata ≥ 0,75, Ouro ≥ 0,85,
   Diamante ≥ 0,95) são sempre certificáveis. Consequência prática: **nível
   não é função do índice** — "Prata" e "Elevado" convivem na mesma faixa, e
   derivar o nível do ITP seria inventar selo.
4. **O nível `Elevado` não existe em 2022 e `Não Avaliado` não existe em
   2022.** Comparar série de níveis entre ciclos exige cuidado; comparar ITP,
   não.
5. **`% das Essenciais` pode vir `-`.** Em 2022 isso acontece em 2 linhas de
   nível `Inexistente`, fora de MG. O campo sai `null` em vez de 0.
6. **A UF é nome por extenso e muda de caixa** entre 2022 e 2023 — "MINAS
   GERAIS" em caixa alta e "Minas Gerais" capitalizado. Comparar com `==
   "MG"` devolve zero linhas e um arquivo vazio com cara de sucesso.
7. **A base é quase idêntica de 2023 a 2025** (11.697 linhas, 1.712 de MG):
   quem só olhar o total vai achar que nada mudou. O que muda é o preenchimento
   — 3.652 · 4.327 · 1.625 não avaliados.
8. **`robots.txt` com `Crawl-delay: 10`** para rastreadores de IA. A coleta
   é manual, de 4 arquivos, fora da CI.

## Licença e termos

- A página de dados abertos **não declara licença Creative Commons** nem
  termo de uso específico para os pacotes; publica-os como **dados abertos**,
  e o dado em si já é público (avaliação de portal oficial).
- O portal usa com **atribuição explícita** ("Atricon — PNTP") e link para a
  página de origem em toda página que exibir o índice.
- O `robots.txt` não veda a coleta; veda `/wp-admin/`, `/wp-json/` e busca.
- Não há cadastro, token ou chave. Não há área autenticada envolvida.
- Se a Atricon publicar licença formal depois, este documento e o campo
  `licenca` do JSON devem ser atualizados.

## Como o portal usaria

O uso natural é **na página do município**: "a prefeitura tirou **88,1** no
PNTP 2025, nível Ouro; a câmara, **94,6**, nível Ouro" — com o link para a
ficha na Atricon e a ressalva de que é autoavaliação validada por auditoria
de evidência, não auditoria de gestão.

Com o arquivo atual dá para:

- publicar **série 2022–2025** por ente (prefeitura e câmara separadas);
- **comparar com a média do Brasil** e com a média de MG do mesmo ciclo (está
  no `resumo-brasil.json`, sem precisar recalcular);
- marcar quem **não foi avaliado** no ciclo em vez de mostrar zero;
- ranquear municípios por ITP **dentro do ciclo** — nunca entre ciclos, por
  causa da mudança de matriz em 2023;
- destacar **selo** (Diamante/Ouro/Prata) com `certificavel: true`.

O que não dá para fazer com este recorte: análise por **critério** (isso exige
a pasta `respostas/`, que não é coletada), nem comparação entre ciclos com
metodologias diferentes sem nota de rodapé.

## Limites: o que este índice não é

- **Não é auditoria de gestão.** Avalia o **portal de transparência** —
  publicado, atualizado, acessível, com dado exigido por lei.
- **A base é autoavaliação.** O ente responde; o Tribunal de Contas valida a
  evidência, não audita o gasto. `validada: true` significa "a evidência foi
  conferida", não "o dado é verdadeiro em tudo".
- **Não mede qualidade do gasto, obra ou política pública.** Um portal
  Diamante pode conviver com gestão ruim; um portal Inicial não prova
  irregularidade.
- **`Não Avaliado` não é reprovação.** Em 2023 foram 1.698 dos 1.712 entes de
  MG; publicar isso como zero seria difamação em massa com número.
- **A média nacional depende da régua.** Este documento adota a régua da
  fonte: fora `Não Avaliado`, dentro `Inexistente` como zero. Outra régua dá
  outro número — e é por isso que o resumo declara a regra no campo `nota`.
- **Não serve para comparar 2022 com 2023+ sem ressalva.** Mudou a matriz,
  mudou o conjunto de entes, mudou o vocabulário dos níveis.

## Como rodar e verificar

```bash
# coleta os quatro ciclos (baixa ~830 MB uma vez, em %TEMP%\cp-pntp)
python scripts/coletar-pntp.py

# um ciclo só, ou ignorando o cache
python scripts/coletar-pntp.py --ano 2025
python scripts/coletar-pntp.py --refazer

# a guarda do dado publicado
cd apps/web && npx vitest run lib/pntp
```

O coletor é **idempotente**: se o dado não mudou, ele mantém o `coletadoEm`
anterior e não reescreve o arquivo. `--ano` atualiza **só o ciclo remedido** —
os outros três continuam no arquivo, com o carimbo da coleta em que foram
lidos. Nenhum `.zip` ou `.xlsx` é versionado; o cache vive na pasta temporária.
A varredura de CPF do pre-push alcança `apps/web/data` — onde os dois JSON
moram.

## Origem / histórico

- **18/11/2026 — primeira coleta.** Pacotes 2022–2025 baixados e medidos,
  `scripts/coletar-pntp.py` criado, recorte de MG (5.286 entes) e resumo
  nacional publicados, teste de contrato e privacidade em `lib/pntp`.
  Ajuste de escala em 5 linhas de 2025 registrado no relatório da coleta.
