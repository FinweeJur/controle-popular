# Fontes: CNJ (CACOL/DataJud), JUMA, MMA/CONAMA e CNDH — planos de integração

O dono mandou duas fontes (CACOL do CNJ, base de litigância climática do JUMA) e
perguntou se dava para integrar aos painéis existentes. Durante a apuração, ele
mandou mais duas: a central de legislação ambiental do MMA (Congresso já filtrado
por MG e por precedentes, mas com **zero** norma federal hoje) e as resoluções e
recomendações do CNDH. As quatro entram no mesmo documento porque são a mesma
pergunta: **norma ou decisão de âmbito nacional que o portal ainda não tem.**

**Isto é plano de COMO integrar, não avaliação de SE.** Onde a fonte é fraca (ex.:
JUMA só tem 6 casos de MG), digo o número medido e sigo com o plano — a decisão de
integrar já foi tomada pelo dono.

Todo endpoint abaixo foi **chamado de verdade em 2026-08-13/14** e respondeu; toda
contagem foi **medida**, não estimada. Onde não consegui medir, está escrito que
não consegui, e por quê.

---

> ⚠️ **A chave do DataJud não está escrita aqui, de propósito.** O CNJ
> publica uma chave de acesso à API pública na documentação oficial do
> DataJud; pegue-a de lá na hora de usar e guarde como variável de ambiente,
> nunca no repositório. Este repo é PÚBLICO e já vazou dado sensível uma vez
> (ver `docs/ANTES-DO-PUSH.md`): credencial em arquivo versionado é credencial
> exposta, mesmo quando a origem dela é aberta — porque o arquivo sobrevive à
> rotação da chave e vira histórico permanente.

## Resposta curta

| Fonte | Dado extraível? | Licença permite republicar? | Onde encaixa | Entra no mapa? |
|---|---|---|---|---|
| **CACOL (painel CNJ)** | Painel Power BI é só visual — sem export. **A fonte por trás (DataJud) tem API pública real**, testada e funcionando. | **API do DataJud veda distribuir dado derivado sem avisar o CNJ (cláusula 3.8/3.9) — não presumir.** Painel em si sem termo próprio achado. | `/ambiental` — recurso novo ("litígio coletivo em curso"), não os 15 precedentes | **Sim** — DataJud dá `codigoMunicipioIBGE` do órgão julgador (comarca, não o fato) |
| **JUMA (litigância climática)** | Sim — a tabela inteira (187 casos) já vem no HTML de um `GET` simples, sem precisar de navegador nem clicar em "Download". | **Não encontrada.** PUC-Rio é universidade privada; termos publicados são template genérico de e-commerce sobre dado de usuário, não da base. Tratar como direitos reservados. | `/ambiental/direito-critico` — mas como recurso **novo**, ao lado dos 15 precedentes (formato de "resumo" é diferente de "ementa+relevância") | Só com cruzamento textual (só tem UF estruturada; município só no texto) |
| **MMA / CONAMA (legislação federal)** | Sim — CSV público, `dados.mma.gov.br`, e página do CONAMA enumerável por id. | **CC-BY confirmada** (CKAN `license_title`). Republicar é permitido, com atribuição. | `ambiental_legislacao` (mesma tabela, novo campo `esfera`) | Não — é legislação, não fato territorializável |
| **CNDH (resoluções/recomendações)** | Sim — Recomendações via API GraphQL do Decidim (Participa+Brasil); Resoluções via página HTML estática do gov.br/mdh. Ambas responderam 200. | **CC BY-ND 3.0** (selo padrão gov.br, confirmado no rodapé). Permite citar/linkar; veda obra derivada do texto. | Painel de legislação **unificado** que outra frente está construindo (esfera=federal, tema=vocabulário CNDH) | Só com cruzamento textual — nenhuma das duas tem campo de município |

A descoberta que mais muda o desenho: **CACOL, o painel que o dono mandou, não é
a peça mais forte da sua própria família de dados.** O DataJud por trás dele é.
E achei uma resolução do CNDH dedicada a Brumadinho (seção 4) — o teste que o
dono pediu bateu.

---

## 1. CACOL (CNJ) — o painel é vitrine, o DataJud é a fonte

### 1.1 O que é, medido

`https://justica-em-numeros.cnj.jus.br/painel-cacol/` responde HTTP 200 e contém
só um `<iframe src="https://app.powerbi.com/view?r=eyJr...">` — **é Power BI
"publish to web", visual puro, confirmado abrindo o iframe direto.**

O nome: **CACOL = Cadastro Nacional de Ações Coletivas**, painel do CNJ em
parceria com o CNMP, instituído pela **Resolução CNJ nº 331/2020** e
regulamentado pela **Portaria Presidência CNJ nº 187/2023**. Reúne estatística
de: Ação Civil Pública (ACP), Ação Civil Coletiva (ACC), Ação de Cumprimento
(ACUMPR), Ação Popular (AP), Mandado de Segurança Coletivo (MSC) — dados do CNJ
via **DataJud** — mais Inquérito Civil Público e Termo de Ajustamento de
Conduta, dados do CNMP via seu "Portal de Direitos Coletivos".

### 1.2 O que o painel expõe (medido abrindo o relatório)

Inspecionando a árvore de acessibilidade do relatório carregado (sem precisar
baixar nada — os números já vêm renderizados como texto real, não imagem),
confirmei os **filtros disponíveis**: `ramo_justica`, `Tribunal`, **`uf_oj,
municipio_oj`** (UF **e** Município do órgão julgador), `Órgão Julgador` (nome),
`Grau`, `Procedimento`, `Formato`, `Numeração única/sigilo`, `Ano`, `Tipo de
Classe`/`Classe`, **`CNPJ da parte`**, `Hierarquia de Assuntos` (8 níveis de
árvore) e `Nome da parte`.

Isto confirma o que o dono apontou: **o painel filtra por CNPJ e por
Município** — não é granularidade grossa demais. O problema não é a
granularidade, é o **acesso**: é um embed "view only", sem botão de exportação
visível, e os slicers do Power BI não abriram de forma confiável na automação
desta sessão (o ambiente de navegador ficou sem compositação ativa —
`document.hidden = true` durante toda a tentativa, o que impede o Power BI de
desenhar o popup do dropdown). Isto é limitação do ambiente de automação, não
prova de que o painel seja inacessível a um usuário humano normal.

**Números nacionais que consegui extrair** (filtro padrão do relatório,
Ano = 2026, sem outro filtro — dado real, lido da árvore de acessibilidade do
relatório já carregado):

| Ramo de Justiça | Casos novos em 2026 |
|---|---:|
| Justiça Estadual | 27.108 |
| Justiça do Trabalho | 25.754 |
| Justiça Federal | 3.124 |
| Tribunais Superiores | 13 |
| **Total (indicador "Casos Novos em 2026")** | **55.999** |

Não consegui isolar o filtro por MG dentro do painel nesta sessão (mesma
limitação de automação acima). O caminho documentado por um dos próprios
tribunais (TJAM/TJPR replicam a mesma orientação): selecionar "Justiça
Estadual" em Ramo de Justiça e depois "TJMG" em Tribunal.

### 1.3 A fonte por trás: DataJud tem API pública real, testada agora

CACOL usa dados do **DataJud — Base Nacional de Dados do Poder Judiciário**
(mesma Resolução CNJ 331/2020). O DataJud tem **API pública documentada**, e eu
**chamei de verdade**:

```
POST https://api-publica.datajud.cnj.jus.br/api_publica_tjmg/_search
Authorization: APIKey <CHAVE_DATAJUD>   # ver nota abaixo — NÃO commitar a chave
Content-Type: application/json
```

(chave pública extraída literal de `datajud-wiki.cnj.jus.br/api-publica/acesso/`
— **⚠️ copiar a chave via ferramenta de resumo de IA corrompeu 2 caracteres**
dela nesta sessão e deu 401; peguei o HTML bruto para ter certeza do literal.)

Confirmado HTTP 200 com resultado real (Elasticsearch por trás, um índice por
tribunal — `api_publica_tjmg`, `api_publica_trf6`, `api_publica_trt3` etc.,
lista completa em `datajud-wiki.cnj.jus.br/api-publica/endpoints/`).

**Cada processo devolvido tem, medido no JSON real:** `numeroProcesso`,
`tribunal`, `grau`, `dataAjuizamento`, `classe.codigo`/`classe.nome`,
`orgaoJulgador.codigo`/`.nome`/**`.codigoMunicipioIBGE`**, `assuntos[]`
(código+nome), `movimentos[]` (histórico processual completo), `sistema`,
`formato`, `nivelSigilo`. **`codigoMunicipioIBGE` é geografia real, nível
município** — muito mais fino que o que o painel CACOL expõe por padrão.

**O que NÃO vem: nome ou CNPJ de parte.** Testei especificamente — nenhum dos
documentos amostrados trouxe qualquer campo de parte, e o endpoint `_mapping`
(que revelaria o schema completo) devolve **403** mesmo com a mesma chave que
autentica o `_search`. Isto é proteção deliberada de LGPD na API pública, não
uma omissão do coletor.

**Contado em TJMG, histórico completo (todas as instâncias, todos os anos —
não é "casos novos de 2026" como o painel, é o acervo inteiro indexado):**

| Classe (código TPU) | Processos em TJMG |
|---|---:|
| Ação Civil Pública (65) | 69.983 |
| Ação Popular (66) | 3.528 |
| Mandado de Segurança Coletivo (119) | 1.322 |
| Ação Civil Coletiva (63) | 962 |
| Ação de Cumprimento (ACUMPR) | **não localizada** — busca pela frase exata devolveu 0 no TJMG; pode ter outro nome de classe nesse tribunal, não confirmado |
| **Subtotal (4 classes confirmadas)** | **75.795** |

Das 69.983 Ações Civis Públicas, **6.011** têm algum assunto contendo a palavra
"Ambiental" (`match` textual, não é filtro oficial por ramo do direito — é
aproximação, não exato). É **~400× o número de precedentes hoje catalogados** em
`direito_critico_precedentes` (15) — mas **atenção**: isto é contagem de
*processos* (metadado processual), não de *precedentes com tese jurídica*. O
DataJud não devolve inteiro teor nem ementa da decisão — só classe, assunto,
movimentos e datas. **Não alimenta `direito_critico_precedentes` diretamente**;
alimenta um recurso diferente (mapa/lista de litígio em curso).

### 1.4 ⚠️ A licença exige decisão, não presunção

Li o Termo de Uso completo (`datajud-wiki.cnj.jus.br/api-publica/termo-uso`).
Três cláusulas mudam o plano:

> **3.3.** A API é fornecida exclusivamente para fins legais, **não comerciais**
> e autorizados [...]
>
> **3.8.** O usuário concorda em **não modificar, distribuir, vender ou
> explorar comercialmente a API ou qualquer informação derivada dela**;
>
> **3.9.** O usuário concorda em **dar ciência ao CNJ** de qualquer informação,
> notícia, estudo, relatório ou documento de qualquer natureza que seja
> **disponibilizado ao público em geral**.

Controle Popular satisfaz 3.3 (não comercial). Mas 3.8, lido literalmente, veda
**distribuir** informação derivada — e publicar um mapa/tabela de processos
ambientais no portal É disponibilizar ao público em geral, o que 3.9 trata como
gatilho para **notificar o CNJ antes**. **Não presumo que isto libera
publicação silenciosa.**

**Dois caminhos, ambos honestos:**
1. **Notificar o CNJ formalmente** (e-mail ao DPJ/CNJ) antes de publicar
   qualquer agregado derivado do DataJud — cumprindo 3.9 à risca.
2. **Consulta ao vivo, não dataset republicado**: a página consulta a API
   *sob demanda* (ex.: "quantos processos ambientais tramitam nesta comarca
   agora?", calculado na hora) em vez de manter uma tabela própria
   cacheada/baixável com os dados brutos do DataJud. Isto reduz a exposição
   a "distribuir informação derivada" — o dado nunca sai da memória da
   requisição.

Recomendo o caminho 2 para a primeira versão (mais simples de defender e mais
barato de manter — sem job de reingestão), com o caminho 1 em paralelo se o
projeto quiser guardar um snapshot histórico.

### 1.5 Plano de ingestão (se/quando o caminho 1 for adotado)

```sql
create table cacol_processos_mg (
  id                    uuid primary key default gen_random_uuid(),
  tribunal              text not null,              -- 'TJMG', 'TRF6', 'TRT3' ...
  numero_processo       text not null,
  classe_codigo         integer not null,
  classe_nome           text not null,
  orgao_julgador_codigo integer,
  orgao_julgador_nome   text,
  id_ibge_municipio     text references ref_municipios_mg(id_ibge) on delete set null,
  data_ajuizamento      date,
  assuntos              jsonb,                       -- [{codigo, nome}, ...] tal como vem da API
  grau                  text,
  sistema               text,
  ultima_atualizacao_fonte timestamptz,               -- dataHoraUltimaAtualizacao do DataJud
  coletado_em           timestamptz default now(),
  unique (tribunal, numero_processo)
);
```

- **Coleta**: `POST .../api_publica_tjmg/_search` com `query.bool.must` em
  `classe.codigo` (as 4-5 classes do CACOL) `AND` `assuntos.nome` casando
  termos ambientais — paginar com `search_after` (Elasticsearch, não `from`,
  que tem teto de 10.000). Repetir para `api_publica_trf6` e `api_publica_trt3`
  (federal e trabalhista de MG) se quiser cobertura completa dos 4 ramos.
- **Atualização**: `dataHoraUltimaAtualizacao` no próprio documento mostra
  granularidade quase diária — reingestão semanal por upsert em
  `(tribunal, numero_processo)` é suficiente.
- **Onde entra na tela**: **`/ambiental`**, não `/judiciario`. `/judiciario`
  hoje é sobre **quem ocupa** o tribunal (composição, indicação, aposentadoria)
  — não sobre o que ele julga. Uma seção nova em `/ambiental` (ex.: "Litígio
  coletivo ambiental em curso") com lista + pontos no mapa pelo
  `codigoMunicipioIBGE` do órgão julgador é o encaixe certo — **com o aviso
  explícito de que o ponto é a comarca que julga, não necessariamente onde o
  dano ocorreu** (mesma ressalva que o projeto já usa para "cita" × "é sobre" no
  material da UFMG).

### 1.6 Cruzamento com `cnpj_raiz` (ambiental_licenciamento) — conceito certo, bulk não existe hoje

O painel CACOL **tem** filtro "CNPJ da parte" (confirmado, seção 1.2) — a chave
certa para responder "esta empresa com licença ambiental aqui responde a
quantas ações coletivas?", igual ao padrão que `docs/FONTES-FLUXO-FINANCEIRO.md`
já usa para contratos e CFEM. **Mas o DataJud não devolve CNPJ de parte** (LGPD,
seção 1.3), e o painel Power BI não tem export em massa. Ou seja: a chave existe
nos dois lados, mas não há um único request que já junte as duas.

**Caminho realista, em ordem de esforço:**
1. Usar o DataJud (seção 1.5) para achar os **números de processo** ambientais
   por município de MG — isso é bulk, funciona hoje.
2. Para os processos de maior interesse (ex.: municípios onde
   `ambiental_licenciamento` já tem concentração alta de `cnpj_raiz` — VALE
   S.A., COPASA, os grupos do §"Concentração" de
   `docs/FONTES-FLUXO-FINANCEIRO.md`), seguir o **link de consulta pública do
   próprio tribunal** por número de processo (público por natureza — processo
   coletivo não tem sigilo por padrão) para extrair a parte ré.
3. **Não tentar cruzar as 10.934 raízes de uma vez.** É trabalho por processo,
   não em lote — priorizar por volume (seção 8).

---

## 2. JUMA — Plataforma de Litigância Climática no Brasil

### 2.1 O que é, medido

`https://juma.jur.puc-rio.br/base-dados-litigancia-climatica-no-brasil`
(HTTP 200) descreve: base de dados que reúne litígios climáticos nos tribunais
brasileiros, critério de inclusão = processo ajuizado no Judiciário brasileiro
relacionado a mudanças climáticas (tema central, um dos temas, ou tema
periférico). Mantida pelo **Grupo de Pesquisa JUMA — Direito, Ambiente e
Justiça no Antropoceno (PUC-Rio)**, com parceiros AIDA, Instituto Clima e
Sociedade, LACLIMA, GRI, Sabin Center e Treetech.

A plataforma em si vive em `https://plataformajuma.jur.puc-rio.br/` (o link do
site institucional aponta para `litigancia.biobd.inf.puc-rio.br`, que
redireciona pra lá — confirmado, HTTP 200).

**Não é painel de BI.** É uma aplicação web com `jQuery DataTables` sobre uma
tabela HTML — e a descoberta operacional mais importante: **a tabela inteira já
vem no HTML de um único `GET`, sem JavaScript**. Confirmei baixando a página com
`curl` puro (sem navegador): **187 `<tr>` de dados** já estão no HTML bruto,
com nome do caso, data, tipo de ação, resumo completo e link de detalhe. Não é
preciso automatizar clique nenhum, nem "raspar" via navegador headless — é
parse de HTML estático padrão (`BeautifulSoup`/`lxml`).

### 2.2 O que tem, com campos medidos

Inspecionando os filtros (`<select>` da página, com contagem por opção — dado
real, não estimado):

| Campo | O que é | Exemplo de valores |
|---|---|---|
| `tipo_acao` | Tipo de ação judicial | ACP (326), ADI (18), ADPF (11), ADO (3), Ação Popular (7), MS (1), outros |
| `estado_origem` | **UF** do tribunal de origem | 27 opções, ver §2.3 |
| `tipo_polo_ativo` / `tipo_polo_passivo` | Categoria de quem processa/é processado | MPF (251), sociedade civil organizada (56), empresas (75 no passivo)... |
| `principais_normas` | Normas citadas no caso | Acordo de Paris (300), Art. 225 CF (363), Convenção 169 OIT (64), Resolução CONAMA 1/1986 (21), Resolução CONAMA 237/1997 (22)... |
| `bioma` | Bioma envolvido | Amazônia domina (278); Cerrado 10, Mata Atlântica 17 |
| `setor_GEE` | Setor de emissões | Mudança de Uso da Terra e Florestas (298), Energia (57)... |
| `status` | Status processual | Pendente (249), Concluído (44), Decidido (14)... |
| `tipo_caso` | Sistêmico (69) ou Pontual (312) | |
| `licenciamento_ambiental` | Aborda (36) / Não aborda (345) | |

`principais_normas` **cruza direto com o vocabulário de
`direito_critico_normas`** (Acordo de Paris, Art. 225 CF, Convenção 169 OIT,
Resolução CONAMA já aparecem nas duas fontes) — é um sinal de compatibilidade
de esquema, não coincidência.

Cada caso tem página de detalhe (`/visualizacao_caso/{id}/0/`) com: Tipo de
Ação, **Órgão de origem**, Data de Distribuição, Número de processo, **Estado
de origem** (único campo geográfico estruturado — sem município), link de
consulta pública do tribunal, Resumo (texto longo, tipo síntese de petição +
decisão liminar), Polo ativo/passivo (nomes + tipo), Principais normas
mobilizadas.

### 2.3 Volume nacional e recorte de MG — medido

Rodapé do site: **"Casos publicados: 381"**. A tabela de navegação, por padrão,
mostra **187 linhas**. As duas contagens **não bateram** nesta sessão — a soma
dos facets de `tipo_acao` dá 381 (326+18+11+3+7+1+6+2+7=381), e a soma dos
facets de `lote` também dá 381 (195 "casos em lote(s)" + 186 "casos
individuais"). **Registro como pendência de entendimento, não presumo**: a
hipótese mais provável é que "381" conta *ações* e "187" conta *casos*
(agrupamentos), mas não confirmei a regra exata de agrupamento. Para a
ingestão, uso **187** como unidade — é o número de linhas realmente navegáveis
e com página de detalhe própria.

**Filtrando por `estado_origem = Minas Gerais (MG)`: 6 casos.** É pouco —
bem abaixo da hipótese de "dezenas ou centenas" que motivou este documento. Os
6, medidos agora:

1. MPF vs. União (Parque Nacional Grande Sertão Veredas)
2. **Mônica dos Santos e Mauro Marcos da Silva vs. Samarco Mineração S.A.,
   Estado de MG e ANM** (ampliação minerária no Complexo Germano, Mariana e
   Ouro Preto — cita Bento Rodrigues e Camargos, atingidas pela Barragem de
   Fundão)
3. MPF vs. União Federal (FUNCAP e multas ambientais)
4. Duda Salabert Rosa vs. Estado de MG e Taquaril Mineração S.A. (Complexo
   Minerário de Serra do Taquaril)
5. IBAMA vs. Siderúrgica São Luiz Ltda. e outros (carvão de origem irregular)
6. **Rio Doce vs. União Federal e Estado de Minas Gerais** (desastre em Mariana
   e Plano de Prevenção a Desastres de MG)

**Não há caso dedicado a Brumadinho/Paraopeba** entre os 187 casos nacionais —
busquei por "Brumadinho", "Paraopeba" e "Córrego do Feijão" no texto completo e
achei só 1 menção incidental (num caso sobre outro assunto). Isto faz sentido
pela metodologia da própria base: é **litigância climática** (mudança do
clima/GEE como tema), e Brumadinho (2019) é enquadrado nacionalmente como caso
de segurança de barragem e reparação socioambiental, não litígio climático —
diferente do caso nº 2 acima, que É sobre expansão minerária no MESMO complexo
(Germano/Mariana) e **cita explicitamente eventos climáticos extremos** como
fundamento jurídico (por isso entrou na base).

### 2.4 Geografia — só UF, município é texto livre

`estado_origem` é o único campo estruturado. O caso do Complexo Germano cita
"nos municípios de Mariana e Ouro Preto/MG" **dentro do resumo**, não como
campo. Para entrar no mapa por município, precisa da mesma técnica já planejada
para o acervo da UFMG/Paraopeba: cruzar o texto do resumo contra os 853
municípios de `municipios-mg.geojson`, **com taxa de erro medida numa amostra
real antes de publicar** — nunca inferência silenciosa.

### 2.5 Licença — não encontrada, tratar como reservada

Fui atrás do termo de uso (`juma.jur.puc-rio.br/lgpd`) e da metodologia. O que
achei: a página "LGPD" é um **template genérico de e-commerce (site feito em
Wix)** sobre dados pessoais de cadastro/cookies — fala de "produtos adquiridos",
"programas de fidelidade" — **não trata da base de casos**. A metodologia
(PDF, 2ª edição 2026) não fala de licença de reuso na própria página que a
referencia. **Não encontrei nenhuma declaração de licença de redistribuição da
base.** PUC-Rio é universidade privada — mesmo critério já usado pelo projeto
em `docs/_historico/FONTES-BRUMADINHO-UFMG.md` para material acadêmico sem licença
declarada: **tratar como direitos reservados**. Caminho seguro: **citar e
linkar** cada caso ao `/visualizacao_caso/{id}/0/` original (que já é o "link
para consulta pública do tribunal" mais o resumo do JUMA), e **pedir permissão
formal ao JUMA** antes de reproduzir os textos de resumo em massa no portal.

### 2.6 Plano de ingestão

```sql
create table juma_litigancia_climatica (
  id                uuid primary key default gen_random_uuid(),
  id_fonte          integer not null,        -- o {id} de /visualizacao_caso/{id}/0/
  nome_caso         text not null,
  data_distribuicao date,
  tipo_acao         text not null,
  numero_processo   text,
  estado_origem     text,                    -- UF, único campo geográfico da fonte
  id_ibge_municipio text references ref_municipios_mg(id_ibge) on delete set null,
                                              -- preenchido só por cruzamento textual, nunca pela fonte
  orgao_origem      text,
  link_consulta_publica text,
  resumo            text,                    -- texto longo — NÃO reproduzir em massa sem permissão do JUMA (§2.5)
  bioma             text,
  status            text,
  tipo_caso         text,                    -- 'Sistêmico' | 'Pontual'
  principais_normas text[],
  coletado_em       timestamptz default now(),
  unique (id_fonte)
);
```

- **Coleta**: `GET https://plataformajuma.jur.puc-rio.br/`, parse da tabela
  `#t_casos_publicados` (187 linhas já no HTML) para a lista; para cada linha,
  `GET /visualizacao_caso/{id}/0/` para os campos estruturados (Estado de
  origem, Órgão de origem etc.) — 188 requisições no total, tranquilo para rodar
  uma vez.
- **Filtrar para MG**: em vez de tentar reproduzir o filtro server-side do
  formulário (que exigiria descobrir o `value=` exato do `<option>`), mais
  simples e robusto é coletar as 187 linhas e filtrar localmente por
  `estado_origem === "Minas Gerais (MG)"`.
- **Atualização**: o rodapé do site declara "Data do último mapeamento [...]
  entre 21 de maio e 01 de junho de 2026" — atualização é por ciclo de
  pesquisa, não contínua. Reingestão mensal é mais que suficiente.
- **Onde entra**: **`/ambiental/direito-critico`**, mas como **seção nova**,
  não misturada aos 15 precedentes atuais — o "Resumo" da JUMA é uma síntese
  processual longa (pedidos, decisão liminar), diferente de "ementa +
  relevância" curtas que o formato atual exige. Alguém (humano ou IA, com a
  mesma disciplina de citar o trecho que sustenta, já usada em
  `etl/temas_direito_critico.py`) precisaria condensar cada resumo em
  ementa+relevância para os 6 casos de MG virarem precedentes no formato
  atual — não é 1:1 automatizável sem perda de precisão jurídica.

---

## 3. MMA / CONAMA — legislação ambiental federal

O dono apontou a lacuna certa: `ambiental_legislacao` tem 6.378 normas, **todas
estaduais de Minas** (SIAM 4.077, SEMAD 2.232, ALMG 69) — **zero federais**. O
próprio código do projeto já sabia disso: `apps/web/app/ambiental/legislacao/page.tsx`
diz "Fontes nacionais [...] ainda não entraram nesta busca [...] ficam para uma
próxima rodada", e `docs/ambiental/F0-discovery.md` §6 já tinha mapeado (mas não
medido) a fonte. Esta seção **mede** o que a F0 deixou como `[VERIFY]`.

### 3.1 A fonte, confirmada

**CKAN do MMA**, `dados.mma.gov.br`, dataset UUID `417a755c-4449-42e7-a60e-143a83dc130b`
("Legislação Ambiental Brasileira"). ⚠️ **`package_search` está com índice
quebrado** (devolve `count: 0` para qualquer busca) — confirmado agora; **tem
que buscar por UUID direto** via `package_show`:

```
GET https://dados.mma.gov.br/api/3/action/package_show?id=417a755c-4449-42e7-a60e-143a83dc130b
```

Confirmado HTTP 200. `license_title`: **"Creative Commons Atribuição"** (CC-BY)
— licença aberta, **confirmada, não presumida**.

O dataset tem um CSV por ano de atualização (2020 a 2025). O mais recente:

```
https://dados.mma.gov.br/dataset/417a755c-4449-42e7-a60e-143a83dc130b/resource/d75a2a79-1d00-423b-9dcf-db8fd1ca1f0e/download/legislacao-dados-abertos-19.09.25.csv
```

Baixado agora: HTTP 200, **3.792.066 bytes**. Cabeçalho real (delimitador `;`,
UTF-8 com BOM):

```
ANO;DOCUMENTO;Nº ;ATO NORMATIVO;EMENTA;ÁREA MMA;ASSUNTO;LINK;STATUS;REVOGA
```

⚠️ **Espaço sobrando em `Nº `** — igual ao que a F0 já tinha registrado.

### 3.2 Volume, medido — e uma armadilha de parsing real

**10.417 linhas no arquivo** (10.416 sem cabeçalho). Mas o CSV **não usa aspas**
para escapar `;` nem quebra de linha dentro de campo — a `EMENTA` de muitos
registros tem texto livre com quebra de linha embutida, sem aspas. Contando só
linhas que começam com um ano de 4 dígitos (assinatura confiável de um registro
novo): **8.572**. A diferença (~1.845 linhas) são continuações de `EMENTA`
quebrada. **Piso confiável: 8.572 normas. Teto bruto do arquivo: 10.416. Número
exato exige parser CSV de verdade** (biblioteca `csv` reconstruindo registros
por estado, não `split(';')` ingênuo) — não fabrico o número exato aqui.

Distribuição por tipo (contagem por substring no campo `ATO NORMATIVO`, medida
agora):

| Tipo | Ocorrências |
|---|---:|
| Portaria IBAMA | 2.375 |
| Portaria ICMBio | ~2.107 (duas grafias, "ICMBIO"/"ICMBio") |
| Portaria MMA | 787 |
| Instrução Normativa IBAMA | 538 |
| Decreto | ~542 |
| **Resolução CONAMA** | **536** (contagem por `grep` direto no arquivo) |
| Portaria GM/MMA | 216 |
| Lei | 123 |
| Deliberação CGEN | 104 |

### 3.3 CONAMA — página própria, também confirmada

```
https://conama.mma.gov.br/index.php?option=com_sisconama&view=atonormativo&id={N}
```

Confirmado vivo: `id=1` responde, mas com duas armadilhas medidas agora:
**redireciona de `http` para `https`**, e **exige `User-Agent` de navegador**
(sem UA: 403 — mesmo padrão já visto no SIGMINE/ANM em
`docs/FONTES-TERRITORIO-E-MINERACAO.md`). Com UA e seguindo o redirect: HTTP
200, título "CONAMA - Conselho Nacional do Meio Ambiente". Enumerável por
inteiro, 1984→2026 (F0 já tinha mapeado o intervalo).

**"Painel de Legislação do MMA" é Power BI** — decisão já tomada pelo projeto
(F0 §6): **não raspar**. Mantida — o CSV CC-BY já cobre o mesmo universo de
forma muito mais barata e sem ambiguidade de licença.

### 3.4 Plano de ingestão — cabe na tabela que já existe, com um campo novo

`ambiental_legislacao` (migration `0065`) tem hoje `fonte check (fonte in
('almg', 'semad', 'siam'))` e **nenhum campo `esfera`**. Migration nova:

```sql
alter table ambiental_legislacao
  add column esfera text not null default 'estadual'
    check (esfera in ('estadual', 'federal'));

alter table ambiental_legislacao
  drop constraint ambiental_legislacao_fonte_check;
alter table ambiental_legislacao
  add constraint ambiental_legislacao_fonte_check
    check (fonte in ('almg', 'semad', 'siam', 'mma'));

-- as 6.378 linhas existentes já nascem 'estadual' pelo default; não precisa de UPDATE.
```

- **`fonte = 'mma'`** cobre tanto o CSV geral quanto CONAMA (mesma origem
  federal) — `orgao` (coluna que já existe) distingue "IBAMA" / "ICMBio" /
  "CONAMA" / "MMA" dentro da mesma fonte, do mesmo jeito que hoje distingue
  "IEF" / "Igam" / "Copam" dentro de `semad`.
- **`id_fonte`**: para CONAMA, o `{N}` da URL (estável, é a chave da própria
  fonte). Para o resto do CSV (sem id próprio), a mesma solução que a tabela já
  usa para `chave_dedup`: tipo normalizado + número + ano.
- **Atualização**: o CKAN publica um CSV novo por ano (2020→2025 visto agora) —
  checar anualmente por um recurso novo no `package_show` é suficiente.
- **Onde entra**: a página `/ambiental/legislacao` já existe — precisa (1)
  adicionar "MMA" à lista "De onde vem cada norma" e (2) atualizar/remover o
  parágrafo que hoje diz que fontes nacionais "ficam para uma próxima rodada".
  Como o dono já decidiu unificar isto com CNDH e proteção num painel só
  (seção 5), a exposição final pode não ser esta página isolada — mas o dado
  na tabela serve os dois formatos.

---

## 4. CNDH — resoluções e recomendações

### 4.1 Onde vive, confirmado — duas plataformas diferentes

O CNDH publica em **dois lugares que não se falam**:

**Recomendações**: dentro do **Decidim** (plataforma de participação social do
governo federal, "Brasil Participativo"), que expõe **API GraphQL real**:

```
POST https://brasilparticipativo.presidencia.gov.br/api
Content-Type: application/json
```

Confirmado: o CNDH é a assembleia **id 38, slug `cndh`**. Query rodada agora:

```graphql
{ assembly(id: 38) { components { id name { translation(locale: "pt-BR") } __typename } } }
```

Devolveu 7 componentes: `Composições`, `Sobre`, `Agenda do Conselho`, `Página
Inicial`, `Eleições`, `Legislação`, **`Recomendações`** (id **3464**, tipo
`Pages`).

**Resoluções**: **não estão no Decidim.** Vivem numa página HTML estática,
legado, fora da API:

```
https://www.gov.br/mdh/pt-br/acesso-a-informacao/participacao-social/conselho-nacional-de-direitos-humanos-cndh/resolucoes
```

Confirmado HTTP 200, 263.621 bytes.

### 4.2 Volume, medido em cada uma

**Recomendações**: o componente `Pages` (id 3464) tem **uma única página**
(id 769, corpo em rich text/HTML, atualizada em 2026-01-29). Contando os links
dentro do corpo: **265 `<a>` ao todo**, dos quais **256 com texto começando em
"Recomenda..."** (241 com número explícito "nº X"). A numeração **reinicia por
gestão/biênio do conselho** — mesma armadilha vista noutras fontes: há série
2017 (até nº10), série 2022 (reinicia em nº01), série 2025 (chega a pelo menos
nº26) — **não é uma contagem sequencial global**, é preciso desduplicar por
ano+número, não só pelo número.

**Resoluções**: parseando a página HTML legado: **834 tags `<a>` no total**,
das quais **122 hrefs distintos** cujo texto começa em
"Resolução/Resolución/Resolution nº X, de DATA" (algumas com versão traduzida
em espanhol/inglês do mesmo documento). Mesma armadilha de numeração por ciclo.
A página também menciona arquivos `.rar` com resoluções anteriores a 2016 —
não abri esses arquivos, **volume anterior a 2016 não medido**.

### 4.3 O teste que o dono pediu — bateu

Procurei por Brumadinho/Samarco/Mariana nos links da página de Resoluções.
**Achei direto**:

| Resolução | Assunto |
|---|---|
| **Resolução nº 1, de 19 de fevereiro de 2019** | **"Relatório Brumadinho"** — arquivo `Resoluon1RelatrioBrumadinhoSEI.pdf` |
| Resolução nº 4, de 24 de maio de 2017 | "Relatório Samarco" |
| Resolução nº 14, de 11 de dezembro de 2019 | "Mariana e Bacia do Rio Doce" |
| Resolução nº 01, de 15 de março de 2016 | GT sobre populações afetadas pelo rompimento das barragens da Samarco na bacia do Rio Doce |

O CNDH publicou uma resolução **específica** sobre Brumadinho 24 dias depois do
rompimento (25/01/2019 → 19/02/2019). É exatamente o caso de teste ideal que
o dono pediu — e a camada do rompimento já existe no portal.

### 4.4 Geografia — nenhum campo estruturado, mesma técnica da UFMG

Introspeccionei o schema GraphQL do tipo `Page` (Decidim expõe introspecção):
campos são só `id`, `title`, `body`, `createdAt`, `updatedAt` — **nenhum campo
de local**. A página HTML das Resoluções é HTML solto, sem microdado de
geografia também. **Local, quando existe, está só no título/corpo do texto**
("Relatório Brumadinho", "Mariana e Bacia do Rio Doce", "Quilombo Arapemã [...]
Município de Santarém, Estado do Pará" — este último visto entre as
recomendações de 2025).

**Não há atalho.** O plano é o mesmo já desenhado para o acervo da UFMG: extrair
candidato a município do título/corpo, cruzar contra os 853 municípios de
`municipios-mg.geojson`, **medir a taxa de acerto numa amostra real antes de
publicar**, e nunca inferir silenciosamente. Dado o volume pequeno (~250
recomendações + ~120 resoluções, nacional, a maioria sem MG no texto), este
cruzamento é fazível manualmente/semi-automatizado para as poucas dezenas que
citarem MG — não precisa de um classificador sofisticado.

### 4.5 Fontes adjacentes no mesmo pipeline (custo marginal ~zero)

A mesma API do Decidim serve outras assembleias. Chequei duas:

- **CONFOCO** (id 14): componentes são só Composição/Sobre/Notícias/Estrutura —
  **nenhum componente normativo** (sem Recomendações/Resoluções). Não há nada
  para colher aqui.
- **CEMDP** (id 28, Comissão Especial sobre Mortos e Desaparecidos Políticos):
  tem componente **"Notas e Moções"** e **"Acervo Histórico"** — mas é domínio
  de justiça de transição, fora do escopo território/ambiental deste portal.
  Registro como fonte adjacente **não perseguida agora**, alcançável pelo mesmo
  coletor GraphQL no futuro.

### 4.6 Licença

Rodapé padrão de página gov.br, confirmado via grep no HTML da página de
Resoluções: **"Creative Commons Atribuição-SemDerivações 3.0 Não Adaptada"**
(CC BY-ND 3.0). `brasilparticipativo.presidencia.gov.br` também exibe o selo
Creative Commons no rodapé (não abri o texto completo do termo específico da
Presidência). **CC BY-ND permite citar e linkar** (o que o plano abaixo faz —
título, data, tema, link para o PDF/página original); **veda obra derivada**
do texto em si, o que não é um problema aqui porque o plano nunca reescreve o
texto da resolução — só indexa metadado e aponta para a fonte.

### 4.7 Plano de ingestão — cabe no painel de legislação unificado

Os campos que o painel unificado (que outra frente está construindo) precisa
para o CNDH, medidos nesta seção: **esfera** = `'federal'` sempre; **natureza**
= novo valor em `tipo` (`'resolucao'` | `'recomendacao'`); **tema** = o mesmo
vocabulário que `direito_critico_normas`/`ambiental_legislacao` já usam
(indígena, quilombola, povos tradicionais, rios, direitos humanos — o
vocabulário do CNDH bate direto com o do projeto, várias recomendações citadas
acima são sobre exatamente esses temas); **órgão emissor** = `'CNDH'`; **alvo**
= texto livre do título (ex. "Brumadinho", "Quilombo Arapemã, Santarém/PA") mais
o `id_ibge_municipio` quando o cruzamento textual (§4.4) achar candidato em MG.

```sql
-- Ilustrativo — o esquema final é da frente que está construindo o painel
-- unificado; aqui vai só os campos que o CNDH precisa alimentar.
insert into <tabela_unificada> (
  fonte, esfera, tipo, id_fonte, titulo, data, orgao_emissor,
  link_oficial, tema, alvo_texto, id_ibge_municipio
) values (
  'cndh', 'federal', 'resolucao', 'Resoluon1RelatrioBrumadinhoSEI.pdf',
  'Resolução nº 1, de 19 de fevereiro de 2019 — Relatório Brumadinho',
  '2019-02-19', 'CNDH',
  'https://www.gov.br/mdh/pt-br/.../Resoluon1RelatrioBrumadinhoSEI.pdf',
  array['rios','direitos_humanos'],  -- via mesmo dicionário de temas do projeto
  'Brumadinho', '3110004'            -- id_ibge de Brumadinho/MG, cruzamento textual
);
```

- **Coleta Recomendações**: uma chamada GraphQL (`component(id: 3464) {
  ...on Pages { page(id: 769) { body { translation(locale: "pt-BR") } } } }`),
  parse do HTML embutido no `body` (mesma técnica de extração de `<a>` usada
  nesta apuração).
- **Coleta Resoluções**: `GET` simples na página do gov.br/mdh, parse de
  `<a>` cujo texto comece com "Resolução".
- **`id_fonte`**: nome do arquivo PDF para Resoluções; slug da URL (ou nome do
  PDF, para as mais antigas) para Recomendações — nenhum dos dois tem ID
  numérico próprio por item.
- **Atualização**: a página de Recomendações foi atualizada em 2026-01-29 e já
  tem entrada de julho/2026 no corpo — checagem mensal do `updatedAt` do
  `Page` via GraphQL, e recoleta completa quando mudar (é uma página só, custo
  desprezível).

---

## 5. O painel de legislação unificado — o que cada fonte precisa entregar

O dono decidiu unificar os painéis de legislação (estadual + nacional +
proteção) num só, filtrável por tema — outra frente cuida da unificação em si.
Da apuração deste documento, os campos de primeira classe que essa tabela
precisa, porque **duas fontes diferentes (MMA/CONAMA e CNDH) já provaram que
precisam deles**:

- **`esfera`** (`estadual` | `federal`) — hoje não existe em
  `ambiental_legislacao`; MMA/CONAMA e CNDH são sempre `federal`, as 6.378
  linhas atuais são sempre `estadual`.
- **`natureza`** — o tipo do instrumento (lei, decreto, resolução, portaria,
  recomendação...) já existe como `tipo` em `ambiental_legislacao` e como
  `natureza` (nacional/internacional) em `direito_critico_normas` — as duas
  tabelas usam o campo com sentido diferente; a unificação precisa decidir um
  vocabulário só.
- **`tema`** — já existe nas duas tabelas de origem (`direito_critico_normas`
  via IA sobre o texto; `ambiental_legislacao` via taxonomia oficial da ALMG ou
  palavra-chave). CNDH e MMA/CONAMA entram no MESMO vocabulário (indígena,
  quilombola, povos tradicionais, rios, direitos humanos — confirmado que o
  vocabulário do CNDH bate; MMA precisa do mesmo tratamento de tema por
  palavra-chave já usado para SEMAD/SIAM).
- **`orgao_emissor`** — já existe como `orgao` em `ambiental_legislacao`.
- **`alvo`** — campo **novo**, que nenhuma das tabelas atuais tem: o
  texto livre (e, quando cruzado, o `id_ibge_municipio`) de a quem/onde a norma
  se dirige. Só o CNDH (recomendações são sempre dirigidas a algo) e, em menor
  grau, o MMA (normas territorializáveis são raras) precisam dele — mas é o
  campo que **decide se a norma entra no mapa**.

---

## 6. Lacunas declaradas

1. **CACOL/painel**: não consegui filtrar por MG dentro do embed Power BI
   nesta sessão (limitação de automação do ambiente, não do painel — ver
   §1.2). Um usuário humano ou uma sessão de automação com compositação de tela
   ativa deve conseguir.
2. **DataJud × licença**: cláusulas 3.8/3.9 do termo de uso exigem decisão
   humana (notificar CNJ e/ou usar só consulta ao vivo) antes de publicar
   qualquer dado derivado — não decidido aqui (ver §1.4).
3. **Cruzamento CNPJ CACOL × `ambiental_licenciamento`**: conceitualmente
   correto, sem via em lote hoje — precisa de trabalho por processo (§1.6).
4. **187 vs. 381 casos no JUMA**: contagens não reconciliadas nesta sessão
   (§2.3) — não impede a ingestão (uso 187), mas fica registrado.
5. **JUMA — licença**: nenhuma declaração de reuso encontrada; tratar como
   direitos reservados até confirmação/permissão formal do JUMA (§2.5).
6. **MMA CSV — contagem exata**: 8.572 (piso) a 10.416 (teto bruto) por causa
   de `EMENTA` multi-linha sem aspas no CSV; número exato exige parser real
   (§3.2).
7. **CNDH — resoluções anteriores a 2016**: mencionadas como arquivo `.rar` na
   página de Resoluções, não abertas nem contadas nesta sessão (§4.2).
8. **Geografia por texto (JUMA e CNDH)**: nenhuma das duas fontes tem
   município estruturado — cruzamento textual contra `municipios-mg.geojson`
   precisa de taxa de erro medida numa amostra real antes de qualquer
   publicação no mapa (§2.4, §4.4). Nunca inferência silenciosa.
9. **Dado de parte pessoa física**: nenhuma das quatro fontes desta rodada
   expôs nome/CPF de pessoa física em massa — DataJud bloqueia por LGPD
   (§1.3), JUMA/CNDH tratam de partes públicas (Estado, empresas, MP,
   sociedade civil). Se algum caso futuro trouxer parte pessoa física
   (ex.: autores individuais de ação popular, como no caso nº2 do JUMA — "Duda
   Salabert Rosa", "Mônica dos Santos", nomes já públicos por serem autores de
   processo, não terceiros), a triagem de dado pessoal do projeto
   (`scripts/checar-dado-pessoal.py`) já cobre isso antes do commit.

---

## 7. Ordem sugerida — maior ganho, menor esforço

1. **CNDH — Resoluções + Recomendações.** Menor esforço de coleta de todo o
   documento (uma chamada GraphQL + um `GET` estático), licença confirmada
   (CC BY-ND), e já achei o caso de teste perfeito (Resolução nº 1/2019,
   Brumadinho) — publica junto com a camada de rompimento que já existe.
2. **MMA/CONAMA — legislação federal.** Licença CC-BY confirmada, encaixa na
   tabela que já existe (`ambiental_legislacao`) com uma migration pequena
   (campo `esfera`), fecha a lacuna que o dono apontou como falha (federal =
   zero hoje).
3. **JUMA — os 6 casos de MG.** Poucos, mas ricos e já filtrados; coleta trivial
   (HTML estático, sem navegador); o esforço real é a curadoria manual de
   ementa+relevância para virarem precedentes no formato atual — fazível para
   6 casos numa sessão.
4. **DataJud — litígio coletivo ambiental em MG.** Maior potencial de volume
   (milhares de processos, geografia real por município) mas exige decisão de
   licença primeiro (notificar CNJ ou consulta ao vivo, §1.4) antes de
   qualquer ingestão em massa — por isso vem depois das três fontes que já têm
   caminho livre.
5. **Cruzamento CNPJ CACOL × `ambiental_licenciamento`.** Maior esforço
   (trabalho por processo, sem via em lote) — só compensa depois que o passo 4
   já estiver publicado e mostrar quais municípios/processos merecem o
   cruzamento manual primeiro.

---

*Levantado em 2026-08-13/14. Todos os endpoints citados neste documento foram
chamados e responderam; as contagens foram medidas, não estimadas. O que não
foi confirmado está marcado como tal.*
