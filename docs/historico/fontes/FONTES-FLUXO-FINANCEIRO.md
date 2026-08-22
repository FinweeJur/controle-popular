# Fontes: fluxo financeiro — ligar o dinheiro ao mapa

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, fontes, coleta

## Sumário

- [Propósito](#propósito)
- [Resposta curta](#resposta-curta)
- [0. O que já está no banco — medido, não estimado](#0-o-que-já-está-no-banco-medido-não-estimado)
- [1. Contratos e convênios públicos por CNPJ](#1-contratos-e-convênios-públicos-por-cnpj)
- [2. CFEM — Compensação Financeira pela Exploração de Recursos Minerais](#2-cfem-compensação-financeira-pela-exploração-de-recursos-minerais)
- [3. Grupos econômicos — até onde o QSA permite subir](#3-grupos-econômicos-até-onde-o-qsa-permite-subir)
- [4. Lacunas declaradas](#4-lacunas-declaradas)
- [5. Ordem sugerida — maior ganho, menor esforço primeiro](#5-ordem-sugerida-maior-ganho-menor-esforço-primeiro)

## Propósito

Pergunta central: o portal já tem `ambiental_licenciamento.cnpj_raiz` (quem tem licença ambiental, por município, em todo o estado). Dá para usar essa raiz de 8 dígitos como chave e cruzar com quem recebe dinheiro público (contrato, convênio), quem paga royalty de mineração (CFEM) e quem controla...

Pergunta central: o portal já tem `ambiental_licenciamento.cnpj_raiz` (quem tem
licença ambiental, por município, em todo o estado). Dá para usar essa raiz de
8 dígitos como chave e cruzar com quem recebe dinheiro público (contrato,
convênio), quem paga royalty de mineração (CFEM) e quem controla quem (grupo
econômico via QSA da Receita)?

Tudo abaixo foi **medido no banco local** (`127.0.0.1:5432/controle_popular`,
nunca a Neon) e **chamado ao vivo** em 2026-08-13, ou é citação de um coletor
deste mesmo repositório que já tem data e número de teste ao vivo registrados
no próprio código — nesse caso o texto diz a data e aponta o arquivo, em vez
de re-simular a chamada. Onde não confirmei nada, está escrito que não
confirmei.

Não existiam `docs/FONTES-FLUXO-FINANCEIRO.md` nem `docs/PLANO-FLUXO-FINANCEIRO.md`
antes desta rodada — este é o primeiro levantamento do eixo dinheiro↔mapa.

---

## Resposta curta

| # | Pergunta | Existe fonte utilizável hoje? |
|---|---|---|
| 0 | O banco já tem `cnpj_raiz` suficiente pra valer o cruzamento? | **Sim.** 75,2% das 19.704 linhas de `ambiental_licenciamento` (e **100% das que são pessoa jurídica**), 10.934 raízes distintas, em **825 dos 854 municípios de MG**. |
| 1 | Contratos e convênios públicos por CNPJ — federal | **Sim, e com um defeito corrigível achado nesta sessão**: o Portal da Transparência já devolve o CNPJ do convenente, e o coletor de `convenios_federais` **joga esse campo fora**. PNCP (contratos) já grava CNPJ corretamente. |
| 1b | O mesmo, estadual de MG | **Não confirmado.** `transparencia.mg.gov.br` responde 200 mas é uma SPA sem HTML útil para mapear API sem uma sessão de descoberta dedicada — não investigada nesta rodada. Ver lacuna §5.4. |
| 2 | CFEM — quem paga, quanto, onde, com que atraso | **Sim para quanto/onde/quando; não para quem em CNPJ.** A ANM identifica o pagador só por razão social (texto livre), nunca por CNPJ. Atraso medido: ~2 meses. |
| 3 | Subir de `cnpj_raiz` para o grupo econômico / controlador real | **Parcialmente, e com limite de privacidade explícito.** O QSA (via Base dos Dados/Receita) dá nome de sócio e permite ligar CNPJs por sócio compartilhado; **o CPF do sócio pessoa física vem sempre mascarado** (6 dos 11 dígitos visíveis) — publicar o resto é proibido, e o próprio repositório já vazou CPF uma vez por comentário de exemplo (ver `CLAUDE.md`). |

A descoberta que mais muda o desenho do resto do trabalho **não é uma fonte
nova**: é que as tabelas financeiras (`contratos`, `despesas`,
`convenios_federais`, `royalties_cfem`...) vivem presas à tabela `municipios`
(**6 linhas**, o cadastro de cidade "onboardada" com domínio e branding
próprios), enquanto `ambiental_licenciamento` vive em `ref_municipios_mg`
(**854 linhas**, cadastro leve, todo o estado). O cruzamento cnpj_raiz × dinheiro
só é possível hoje nas cidades que têm as duas coisas — ver §0 e §5.

---

## 0. O que já está no banco — medido, não estimado

```sql
select count(*) total, count(cnpj_raiz) com_cnpj_raiz,
       round(100.0*count(cnpj_raiz)/count(*),1) pct,
       count(distinct cnpj_raiz) cnpj_raiz_distintos
from ambiental_licenciamento;
```

| total | com `cnpj_raiz` | % | raízes distintas |
|---:|---:|---:|---:|
| 19.704 | 14.824 | 75,2% | 10.934 |

Os 24,8% sem `cnpj_raiz` **não são um buraco de coleta**: são pessoa física.
Conferido:

| `eh_pessoa_fisica` | `cnpj_raiz` nulo | linhas |
|---|---|---:|
| false | false | 14.824 |
| true | true | 4.880 |

**100% das linhas de pessoa jurídica têm `cnpj_raiz` preenchido.** O campo não
tem lacuna própria — a lacuna que existe é a de pessoa física, que é
estrutural (PF não tem CNPJ) e correta.

### Cobertura geográfica

**825 dos 854 municípios de MG** têm pelo menos uma licença com `cnpj_raiz`
preenchido — é estadual de fato, não uma amostra. Os 15 municípios com mais
linhas:

| Município | Licenças com CNPJ | Raízes distintas |
|---|---:|---:|
| Uberlândia | 494 | 385 |
| Divinópolis | 196 | 175 |
| Pouso Alegre | 183 | 161 |
| Araguari | 181 | 158 |
| Sete Lagoas | 177 | 164 |
| Varginha | 165 | 149 |
| Patos de Minas | 162 | 135 |
| João Pinheiro | 159 | 117 |
| Paracatu | 152 | 116 |
| Janaúba | 127 | 86 |
| Araxá | 125 | 89 |
| Poços de Caldas | 119 | 97 |
| Coromandel | 108 | 75 |
| Cláudio | 108 | 93 |
| Monte Carmelo | 107 | 86 |

### Concentração — quantas raízes já são "grupo" só dentro do próprio ambiental

```sql
with c as (select cnpj_raiz, count(*) n from ambiental_licenciamento
           where cnpj_raiz is not null group by 1)
select case when n=1 then '1 licença' when n between 2 and 5 then '2-5' else '6+' end,
       count(*) qtd_raizes, sum(n) qtd_licencas from c group by 1;
```

| Licenças por raiz | Raízes | Licenças |
|---|---:|---:|
| 1 | 9.145 | 9.145 |
| 2–5 | 1.659 | 4.040 |
| 6+ | 130 | 1.639 |

As 130 raízes com 6+ licenças (multi-sítio, multi-atividade) são o alvo mais
barato para detecção de grupo econômico: já estão concentradas, sem precisar
de QSA nenhum para ver que é a mesma empresa. Exemplo medido por **nome**
(não só raiz — ver a armadilha da COMPANHIA BRASILEIRA DE LITIO abaixo):
`VALE S.A.` aparece em **74 licenças em 13 municípios**; `COMPANHIA DE
SANEAMENTO DE MINAS GERAIS COPASA MG` em **221 licenças em 154 municípios**.

### Setor de quem tem `cnpj_raiz`

| Setor | Rótulo | Licenças |
|---|---|---:|
| F | Gerenciamento de Resíduos e Serviços | 3.930 |
| A | Atividades Minerárias | 3.317 |
| B | Indústria Metalúrgica e Outras | 1.911 |
| E | Atividades de Infraestrutura | 1.782 |
| C | Indústria Química e Outras | 1.432 |
| G | Agrossilvipastoris | 1.239 |
| D | Indústria Alimentícia | 1.179 |
| H | Não listadas/não enquadradas | 34 |

Setor A (Minerárias) é o segundo maior grupo — é exatamente o que a
comparação com CFEM (§2) precisa.

### Por que `cnpj_raiz` é sempre 8 dígitos, mesmo quando a fonte dá o CNPJ inteiro

`etl/betim/etl/apis/ambiental_licenciamento.py` (`_classificar_documento`)
grava **só a raiz**, mesmo nos ~1.098 casos em que a fonte (WFS IDE-Sisema)
publica o CNPJ completo sem redação (ver `docs/ambiental/F0-discovery.md`
§1.3). É decisão de privacidade deliberada — nunca gravar mais do que a raiz
identifica a empresa, nunca o estabelecimento exato. **Consequência para o
cruzamento**: a chave de 8 dígitos não distingue matriz de filial, então um
match por `cnpj_raiz` pode juntar duas pessoas jurídicas de fato diferentes
(mesmo grupo, CNPJ completo diferente) como se fossem uma. Para a pergunta
"esse grupo tem licença aqui?" isso é a granularidade certa; para "esse
CNPJ específico assinou este contrato?" não é — precisa do CNPJ completo, que
`ambiental_licenciamento` propositalmente não guarda.

---

## 1. Contratos e convênios públicos por CNPJ

### 1.1 PNCP — contratos municipais, CNPJ correto, mas só nas cidades onboardadas

`etl/betim/etl/pncp/contratos.py` grava `contratos.fornecedor_cnpj` a partir de
`niFornecedor` (campo plano, não aninhado — achado em 2026-07-21, a versão
anterior lia `raw["fornecedor"]["cnpj"]`, que nunca existiu, e ficava sempre
nulo). O endpoint é público, sem chave:

```
https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao
  ?codigoMunicipioIbge=<ibge>&codigoModalidadeContratacao=<1-13>&dataInicial=...&dataFinal=...
```

**Armadilha real**: `cnpjOrgao=<CNPJ da prefeitura>` só alcança a
administração direta central. Uma capital contrata por dezenas de secretarias
e empresas com CNPJ próprio — medido em São Paulo: só **114 contratos** pela
prefeitura sozinha, contra a lista completa descoberta varrendo por
`codigoMunicipioIbge` e filtrando `esferaId == "M"`
(`etl/betim/etl/pncp/orgaos.py`). Sem essa varredura, o cruzamento subconta
silenciosamente.

Hoje o banco tem **12.991 contratos**, mas só para **5 municípios**:

| `id_municipio` | Contratos |
|---|---:|
| Belo Horizonte (3106200) | 6.878 |
| São Paulo (3550308) | 4.736 |
| Betim (3106705) | 800 |
| Diamantina (3121605) | 315 |
| Araçuaí (3103405) | 262 |

(São Paulo entra porque é uma das cidades onboardadas na plataforma, não por
erro — o projeto tem clientes fora de MG.)

**Cruzamento medido**: raiz de `contratos.fornecedor_cnpj` (8 primeiros
dígitos) contra `ambiental_licenciamento.cnpj_raiz` bate em **16 raízes
distintas, cobrindo 299 linhas de `contratos`**. É pouco em termos absolutos
porque hoje só 5 municípios têm contrato — não é o teto da fonte, é o teto do
que já foi coletado.

### 1.2 TCE-MG SICOM — cobre onde o PNCP furou, mas depende de token humano

`etl/betim/etl/apis/tce_mg.py` existe porque **Itinga parou de publicar no
PNCP em jan/2024** — o dinheiro não parou, só o portal nacional. O TCE-MG
recebe a prestação de contas de qualquer jeito (~130–190 contratos/ano por
cidade, mesmo em 2024–2025) e tem `fornecedor_cnpj` (`num_doc_credor`) já
separado do signatário público.

**A armadilha que trava a escala**: o acesso programático exige um JWT de
sessão que **expira em ~1h** e nasce de um captcha resolvido por humano. Não
há chave de API. O módulo lê de um cache local de ZIPs alimentado
manualmente — funciona por município já baixado, não escala para 854 sozinho.

### 1.3 Portal da Transparência federal — convênios, e o achado desta sessão

`etl/betim/etl/apis/transparencia_gov.py`, chave gratuita
(`chave-api-dados`), endpoint:

```
GET https://api.portaldatransparencia.gov.br/api-de-dados/convenios?codigoIBGE=<ibge>&pagina=<n>
```

**Chamado ao vivo agora (2026-08-13, Betim, página 1, HTTP 200, 15
registros).** O JSON de cada convênio traz:

```json
"convenente": {
  "cpfFormatado": "",
  "cnpjFormatado": "22.733.919/0001-27",
  "nome": "ASSOCIACAO DE PAIS E AMIGOS DOS EXCEPCIONAIS",
  "tipo": "Entidades Sem Fins Lucrativos"
}
```

**E aqui está o achado**: `_map_row()` em `transparencia_gov.py` grava só
`convenente.get("nome")` — o campo `cnpjFormatado` **chega na resposta e é
descartado**. A tabela `convenios_federais` (6.806 linhas hoje, 6 municípios)
não tem coluna de CNPJ do convenente. Não é uma fonte nova para pedir: é uma
coluna que falta em uma fonte que **já responde o dado**.

Testado também com um convênio de **pessoa física** (Belo Horizonte, página
1): `cpfFormatado` vem **mascarado pela própria fonte**
(`***.918.086-**`) — a API do governo federal já entrega o CPF pronto para
publicação pública, sem trabalho de redação do nosso lado. **CNPJ vem
inteiro**, sem máscara — correto, CNPJ de pessoa jurídica não é dado pessoal.

### 1.4 Estadual de Minas Gerais — não confirmado

`https://www.transparencia.mg.gov.br/` responde HTTP 200, mas o HTML servido
é o casco de uma SPA (2.417 bytes, sem link de API ou "dados abertos" no
markup estático) — a navegação real é client-side. `dados.mg.gov.br`, que a
pesquisa ambiental já tinha descartado para legislação/água ("110 datasets,
zero ambientais"), não foi testado aqui para contratos/licitações estaduais.
**Não investiguei a fundo**: mapear a API por trás dessa SPA (ou achar um
CKAN/portal de dados abertos separado do site institucional) é trabalho de
uma sessão de descoberta dedicada, no padrão de `docs/ambiental/F0-discovery.md`
— não uma tarde de leitura de HTML. Fica como lacuna declarada (§5.4), não
como "não existe".

---

## 2. CFEM — Compensação Financeira pela Exploração de Recursos Minerais

Coletor: `etl/betim/etl/apis/anm_cfem.py`, fonte **ASP.NET WebForms sem
chave**: `https://sistemas.anm.gov.br/arrecadacao/extra/Relatorios/`. Dois
relatórios: por substância/mês (`arrecadacao_cfem_substancia.aspx`) e por
empresa/ano (`cfem/arrecadadores.aspx`).

### Testado ao vivo agora (2026-08-13)

Rodei o coletor de verdade contra a fonte, sem tocar no banco, importando o
módulo já existente:

```
Araçuaí (3103405), relatório de arrecadadores, ano 2024: 7 linhas
{'empresa': 'SIGMA MINERACAO S.A.', 'qtde_titulos': 1,
 'valor_operacao': '268606086.50', 'valor_cfem': '6290155.84',
 'pct_recolhimento': '2.34'}
```

**Confirmei também, na página inteira (HTML bruto do relatório de
arrecadadores), que a substring "cnpj" não aparece em lugar nenhum.** A ANM
identifica quem pagou **só por razão social, texto livre, sem CNPJ** — em
nenhum dos dois relatórios. Não é uma lacuna de coleta: é o que a fonte
oferece.

### Granularidade e atraso, medidos

- **Grão**: (município, ano, mês, substância) no relatório 1; (município,
  ano, empresa) no relatório 2. Série desde 2004.
- **Atraso**: testado agora para Itinga/2026 — a série tem dado até
  **junho/2026** (mês 6), consultado em 13/08/2026. Atraso medido de
  ~2 meses.
- **Distribuição por município (quanto a PREFEITURA recebe, não quanto foi
  arrecadado)**: `distribuicao_cfem_muni.aspx` — **reconfirmado agora,
  ao vivo**: HTTP 200, **zero campos `<select>` na página**, nenhum
  formulário para preencher. O relatório está de fato vazio/sem filtro
  utilizável, batendo com o achado de 2026-08-07 registrado na migration
  0044. **A CFEM arrecadada não é a CFEM que o município recebe** (a Lei
  13.540/2017 reparte entre União, estado, produtor e afetados) — a tela
  não pode dizer "a cidade recebeu X".
- **Não somar entre municípios**: a mesma guia da SIGMA MINERAÇÃO aparece
  **inteira** em Itinga e em Araçuaí (mesmo título, R$ 268.606.086,50 de
  operação, sem rateio) — já documentado na migration 0044 e revalidado
  pela consulta acima.

### O cruzamento por nome já tem sinal real — testado no próprio banco

Sem esperar CNPJ nenhum, testei se as empresas que pagam CFEM em
Araçuaí/Itinga **já aparecem por nome** em `ambiental_licenciamento`:

| Empresa (CFEM) | Aparece no ambiental? | `cnpj_raiz` |
|---|---|---|
| SIGMA MINERACAO S.A. | Sim, em Itinga **e** Araçuaí | `16482100` |
| COMPANHIA BRASILEIRA DE LITIO | Sim, em Araçuaí (2x) | `21624700` |
| COMPANHIA BRASILEIRA DE LITIO (outra linha) | Sim, em Itinga | `21624671` |

**A armadilha do match por nome está aqui, medida**: "COMPANHIA BRASILEIRA DE
LITIO" aparece com **duas raízes diferentes** (`21624700` e `21624671`) em
municípios diferentes — mesmo nome, CNPJ-raiz distinto de verdade (não é erro
de leitura; são 8 dígitos diferentes). Um join ingênuo por nome exato
funcionaria na maioria dos casos, mas "mesmo nome ⇒ mesma raiz" **não é
garantido** — precisa de normalização e, idealmente, de confirmação humana
antes de publicar como fato, não como sugestão.

---

## 3. Grupos econômicos — até onde o QSA permite subir

### O que já está implementado e testado

`etl/betim/etl/bd/cnpj.py` enriquece `fornecedores`/`socios` a partir de
`basedosdados.br_me_cnpj` (BigQuery, espelho do CNPJ da Receita Federal),
**escopado aos CNPJs que já ganharam contrato** (não ao universo de CNPJs do
Brasil — seria caro e não é o que a tabela `contratos` precisa). Testado ao
vivo em 2026-07-20/21 contra o BigQuery real (datas e correções de schema
registradas na própria docstring do módulo). Tem fallback pontual na
BrasilAPI (`consultar_cnpj`) para CNPJ recém-aberto que o snapshot do BD ainda
não pegou — **limitado a 50 consultas por rodada** porque a BrasilAPI dá 429
já na segunda chamada em sequência (medido em 2026-08-03) e o termo de uso
proíbe varredura.

`etl/betim/etl/grupos.py` monta `grupos_economicos`: uma componente conexa
sobre CNPJs que **já ganharam contrato no município**, ligados quando
compartilham um `socios.nome_socio`. **Hoje tem 20 grupos**, todos derivados
dos CNPJs de `contratos` — nunca rodado sobre `ambiental_licenciamento.cnpj_raiz`.

### O limite de privacidade, medido no dado real

```sql
select nome_socio, documento_mascarado from socios limit 3;
```

```
CELSO JOSE TIAGO        ***313397**
DARIO DE CASTRO          ***287196**
```

O CPF vem com **6 dos 11 dígitos visíveis** (padrão de máscara da própria
Receita/Base dos Dados) — os 3 primeiros e os 2 últimos ficam ocultos. **Isto
não é o suficiente para provar identidade única**: dois sócios homônimos
("JOSE DA SILVA") em cidades diferentes não têm como ser diferenciados só
pelo nome, e o CPF mascarado não fecha a lacuna (faltam 5 dígitos). Ligar
duas empresas porque compartilham `nome_socio` é um **sinal probabilístico**,
não uma prova jurídica de controle comum — a tela que consumir isso precisa
dizer "sócio em comum" e não "mesmo dono", e não pode oferecer o CPF
mascarado como se fosse identificador confiável para desambiguar.

**O que não pode ser publicado, dito de forma direta**: CPF completo de
pessoa física, em qualquer campo, em qualquer parte do repositório — inclusive
em comentário de código ou exemplo de teste. O projeto já vazou seis CPFs
reais dessa forma exata (ver `estilo-de-resposta`/memória do projeto e o
cabeçalho de `scripts/checar-dado-pessoal.py`, escrito depois do vazamento).
`socios.documento_mascarado` já sai mascarado da fonte; a única forma de
piorar isso é alguém tentar "completar" o CPF a partir de outra fonte para
enriquecer o grupo — **não fazer isso**.

### O que falta para aplicar isto ao `cnpj_raiz` do ambiental

`etl/bd/cnpj.py` consulta `br_me_cnpj.empresas` e `br_me_cnpj.socios` **já
por `cnpj_basico`** — que é exatamente o formato de `cnpj_raiz` (8 dígitos).
Só a tabela `estabelecimentos` (nome fantasia, situação cadastral, endereço)
precisa do CNPJ completo de 14 dígitos, que `ambiental_licenciamento`
propositalmente não guarda (§0). Ou seja: **dá para rodar razão social + QSA
para as 10.934 raízes do ambiental sem precisar do CNPJ completo** — é o
mesmo par de consultas que já existe, só trocando a origem da lista de CNPJs
de "quem ganhou contrato" para "quem tem licença ambiental". Volume novo:
10.934 raízes é ~4,5× o volume que o módulo já processa hoje somando os 5
municípios com contrato — dentro da faixa que o BigQuery já demonstrou
aguentar, não testado neste exato tamanho.

---

## 4. Lacunas declaradas

### 4.1 Financeiro é regional (6 municípios); ambiental é estadual (854)

`contratos`, `despesas`, `receitas`, `convenios_federais`, `royalties_cfem`,
`licitacoes` têm todos FK para `municipios` (6 linhas: Belo Horizonte,
Araçuaí, Betim, São Paulo, Diamantina, Itinga). `ambiental_licenciamento` tem
FK para `ref_municipios_mg` (854 linhas, todo o estado). **O cruzamento
cnpj_raiz × dinheiro só existe hoje nos municípios que têm as duas coisas** —
na prática, Araçuaí, Betim, Diamantina e Itinga (Belo Horizonte tem só 11
licenças ambientais no banco, volume baixo). Isto não é falha de fonte: é
escopo de coleta. `municipios.nome`/`uf` são as únicas colunas `not null` —
tecnicamente dá para inserir uma linha mínima (sem domínio, sem branding) para
qualquer um dos 854 e destravar o financeiro lá, sem mudar schema.

### 4.2 CFEM não tem CNPJ em nenhum dos dois relatórios da ANM

Confirmado ao vivo nesta sessão (§2). Cruzamento por nome funciona (tem sinal
real, mostrado acima) mas exige normalização e não garante 1:1 — duas
empresas com nomes muito parecidos, ou a mesma empresa com raízes diferentes
por filial, quebram um join ingênuo.

### 4.3 `convenios_federais` descarta o CNPJ que a fonte já entrega

Achado desta sessão (§1.3). Correção é código + migration, não uma nova
integração — o dado já está sendo baixado e jogado fora.

### 4.4 Estadual de MG não mapeado

`transparencia.mg.gov.br` é SPA; API por trás não identificada nesta sessão.
Precisa de sessão de descoberta dedicada (rede do navegador, não leitura de
HTML estático).

### 4.5 QSA nunca rodou sobre `cnpj_raiz` do ambiental

Tecnicamente viável com o módulo que já existe (§3), mas não executado — seria
a primeira vez que `etl/bd/cnpj.py` roda fora do escopo "CNPJ que ganhou
contrato".

### 4.6 CPF de sócio mascarado — teto de certeza, não de cobertura

6 de 11 dígitos visíveis não fecha identidade. Qualquer "grupo econômico"
derivado de sócio compartilhado é um sinal, precisa de rótulo como tal, e
**nunca** deve tentar completar o CPF a partir de outra fonte.

### 4.7 TCE-MG SICOM não escala sozinho

Depende de token de sessão humano (~1h de vida) — cobre bem as cidades já em
cache, não generaliza para 854 municípios sem mudança de processo (ou achar
uma via com chave de API, não confirmada).

---

## 5. Ordem sugerida — maior ganho, menor esforço primeiro

1. **Capturar `convenente.cnpjFormatado`/`cpfFormatado` em `convenios_federais`**
   (§1.3). O dado já chega na resposta da API que já roda; é uma coluna nova
   + um campo a mais no `_map_row()` + reprocessar as 6.806 linhas já
   coletadas (não precisa recotar tudo do zero, a API responde de novo em
   segundos por município). Menor esforço de todo o documento.

2. **Rodar QSA (`etl/bd/cnpj.py`, consulta por `cnpj_basico`) sobre as 10.934
   raízes de `ambiental_licenciamento`** (§3), gravando razão social e sócios
   numa tabela nova (ou reaproveitando `fornecedores`/`socios` com uma coluna
   de origem, já que hoje elas assumem implicitamente "CNPJ que ganhou
   contrato"). Reusa código que já existe e já foi testado contra o BigQuery
   real; o único trabalho é trocar a fonte da lista de CNPJs.

3. **Cruzamento CFEM × ambiental por nome, escopado a Araçuaí e Itinga**
   (§2). Já tem sinal medido (SIGMA, Companhia Brasileira de Lítio) e volume
   pequeno o bastante para validar a normalização de nome à mão antes de
   generalizar. Serve de piloto para decidir a regra de match antes de
   arriscar um falso positivo em escala.

4. **Inserir linhas mínimas em `municipios` para os municípios onde o
   ambiental já tem massa** (Uberlândia, Divinópolis, Pouso Alegre, etc. —
   §0) e rodar PNCP (`etl.pncp.orgaos` + `etl.pncp.contratos`) neles. Destrava
   o cruzamento de contrato × cnpj_raiz para além dos 5 municípios atuais sem
   exigir branding/domínio — é dado, não é produto por cidade.

5. **Sessão de descoberta dedicada do portal estadual de MG**
   (`transparencia.mg.gov.br`), no padrão F0 dos outros eixos: inspecionar
   rede do navegador, não o HTML estático.

6. **Varredura estadual completa de PNCP/TCE-MG para os 854 municípios.**
   Maior volume, maior custo (PNCP dá 429 em rajada; TCE-MG exige token
   humano renovado por hora) — é a etapa cara, e só compensa depois que os
   passos 1–4 já tiverem provado que o cruzamento cnpj_raiz × dinheiro traz
   achado publicável.

---

*Levantado em 2026-08-13. Consultas ao Postgres local e chamadas de rede
(Portal da Transparência, ANM/CFEM) foram feitas ao vivo nesta sessão, com
os números acima. Onde o levantamento se apoia em um coletor já existente no
repositório em vez de repetir a chamada, o texto cita o arquivo e a data do
teste original registrada no próprio código. O que não foi confirmado está
marcado como tal.*
