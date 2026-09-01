# Plano de revisão de dados e visibilização de informações relevantes

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [FONTES.md](../06-fontes/FONTES.md), [ESTADO.md](../02-estado/ESTADO.md), [TODO-PROXIMAS-RODADAS.md](../historico/planos/TODO-PROXIMAS-RODADAS.md)
> **Palavras-chave:** contratos publicos, fornecedores, alertas, territorios indigenas, quilombolas, legislacao municipal, transparencia ativa, auditoria, jornalismo de dados, automacao, cron, home-pc, deploy

## Sumário

- [Propósito e pergunta central](#propósito-e-pergunta-central)
- [O que já temos (fontes consolidadas)](#o-que-já-temos-fontes-consolidadas)
- [Ponto de vista 1: o cidadão](#ponto-de-vista-1-o-cidadão)
- [Ponto de vista 2: o jornalista investigativo](#ponto-de-vista-2-o-jornalista-investigativo)
- [Ponto de vista 3: Tribunal de Contas / Controladoria](#ponto-de-vista-3-tribunal-de-contas--controladoria)
- [Propostas de telas e indicadores](#propostas-de-telas-e-indicadores)
- [Entregáveis e ordem de execução](#entregáveis-e-ordem-de-execução)
- [Automação de coleta e deploy no home PC](#automação-de-coleta-e-deploy-no-home-pc)
- [Riscos e armadilhas](#riscos-e-armadilhas)
- [Decisões registradas](#decisões-registradas)

## Propósito e pergunta central

Avaliar quais informações disponíveis no portal respondem a perguntas de interesse público real — do cidadão que quer acompanhar a prefeitura, do jornalista que busca uma história, e do auditor que procura indícios de irregularidade — e propor telas, alertas e cruzamentos que tornem essas informações visíveis de forma útil e responsável.

A pergunta central é: **dos dados que já coletamos, quais histórias e alertas estão escondidos porque ainda não construímos a lente certa para enxergá-los?**

## O que já temos (fontes consolidadas)

Ver detalhes completos em [`docs/06-fontes/FONTES.md`](../06-fontes/FONTES.md). As bases mais relevantes para este plano são:

| Base | O que permite cruzar |
|---|---|
| PNCP (contratos) | contrato ↔ fornecedor ↔ órgão ↔ município |
| ComunicaBR (despesa municipal de MG) | despesa por função e subfunção em 853 municípios |
| CFEM (ANM) | arrecadação mineral por município |
| SIGMINE/ANM | processos minerários, autorizações, concessões de lavra |
| SIGTAP/MS, Transferegov, Convênios MG | transferências e convênios de saúde, meio ambiente, assistência |
| Terras indígenas (FUNAI) e quilombolas (INCRA) | sobreposição espacial com mineração, barragens, licenciamento |
| Licenciamento ambiental (SISEMA/FEAM) | empreendimentos, órgão licenciador, status |
| Repasse Brumadinho | valor repassado a cada município (com ressalva: receber ≠ atingido) |
| Lei Rouanet / SALIC | projetos culturais, incentivadores, proponentes por município |
| Legislação federal (MMA, LexML) | normas por tema; ainda falta legislação municipal sistemática |

## Ponto de vista 1: o cidadão

### O que o cidadão quer saber

1. **Onde o dinheiro da minha cidade está indo?**
   - Maiores contratos da prefeitura este ano.
   - Quem são os maiores fornecedores.
   - Quanto foi gasto por área (saúde, educação, obras).
2. **Tem algo errado que eu deveria cobrar?**
   - Contratos acima do limite de dispensa de licitação.
   - Contratos com o mesmo fornecedor em valores concentrados.
   - Obras atrasadas ou convênios prorrogados muitas vezes.
3. **A minha comunidade é afetada por algum empreendimento?**
   - Mineração, barragens, licenciamento ambiental perto de territórios indígenas, quilombolas ou áreas urbanas.
   - Obras do Acordo Paraopeba na minha cidade.
4. **Quais são as leis mais importantes da minha cidade?**
   - Lei Orgânica, Plano Diretor, Lei de Zoneamento, Código Tributário.

### Propostas de visibilização

- **Painel "O que acontece na minha cidade"**: cards com top 5 contratos, top 5 fornecedores, gasto por função, alertas e legislação principal.
- **Alertas simplificados**: ícone de atenção com explicação em linguagem clara ("Este contrato foi prorrogado 4 vezes sem nova licitação — isso é permitido, mas vale acompanhar").
- **Mapa de proximidade**: mostrar empreendimentos minerários, barragens e licenciamentos próximos ao município ou território selecionado.
- **Assinatura de alertas (futuro)**: receber notificação quando houver novo contrato acima de determinado valor ou novo licenciamento na região.

## Ponto de vista 2: o jornalista investigativo

### O que o jornalista quer cruzar

1. **Concentração e conflito de interesses**
   - Mesma empresa ganhadora de contratos em várias cidades ou em vários órgãos do mesmo município.
   - Empresa doadora de campanha eleitoral que também é fornecedora da prefeitura (cruzamento futuro com TSE).
   - Sócios em comum entre empresas concorrentes (QSA/Base dos Dados).
2. **Sobrepreço e anomalias**
   - Contrato com valor muito acima da mediana para o mesmo objeto em municípios similares.
   - Dispensa de licitação com valor justo abaixo do limite de dispensa.
   - Convênios com muitas prorrogações e aditivos de valor.
3. **Impacto ambiental e territorial**
   - Empreendimentos minerários sobrepondo terras indígenas ou quilombolas.
   - Licenciamentos ambientais com prazo de validade vencido.
   - Barragens em descaracterização próximas a comunidades.
   - Autorização de lavra perto de Área de Preservação Permanente ou ZAS.
4. **Dinheiro público e violência/justiça**
   - Repasse do Acordo Paraopeba para municípios fora da bacia (matéria já cuidada com ressalva visual).
   - Ações judiciais ambientais contra o mesmo município ou empresa.
   - Recursos do FPM/FUNASA em municípios com baixo IDH.

### Propostas de visibilização

- **Páginas de "cruzamento" pronto**: "Empresas que mais contratam prefeituras de MG", "Municípios que mais prorrogaram convênios", "Territórios tradicionais sob sobreposição minerária".
- **Ranking com ressalvas**: toda comparação traz nota metodológica (" valores não corrigidos pela inflação", "receber repasse ≠ ter sido atingido").
- **Download de CSV filtrado**: o jornalista pode baixar o recorte da tela e continuar a análise.
- **Notas técnicas com link permanente**: cada análise publicada vira página própria, citável e indexável.

## Ponto de vista 3: Tribunal de Contas / Controladoria

### O que o auditor fica de olho

1. **Indícios de irregularidade em contratações**
   - Fragmentação de despesa para ficar abaixo do limite de licitação.
   - Concentração de contratos com um único fornecedor (> 50% do total anual, por exemplo).
   - Contratação direta com empresa recém-criada ou sem histórico.
   - Aditivos que alteram objeto ou elevam valor original em mais de 25%.
2. **Gestão de convênios e transferências**
   - Convênios com prazo prorrogado várias vezes sem justificativa.
   - Valor executado muito abaixo do repassado.
   - Proponente com CNPJ suspenso, inidôneo ou em dívidas trabalhistas previdenciárias.
3. **Meio ambiente e regularidade**
   - Licenciamentos com condicionantes não cumpridas.
   - Empreendimentos em área de ZAS sem Plano de Ação de Emergência (PAE) publicado.
   - Processos minerários com CNPJ de titular diferente do operador.
4. **Legislação municipal e compliance**
   - Lei Orgânica e Plano Diretor atualizados e acessíveis.
   - Publicidade de atos oficiais no diário oficial.
   - Respostas a pedidos LAI dentro do prazo.

### Propostas de visibilização

- **Painel de alertas por município**: score de atenção com itens verificáveis, não conclusões.
- **Indicadores de risco**: concentração de fornecedores, taxa de dispensa de licitação, prorrogação de convênios, licenciamentos vencidos.
- **Exportação para auditoria**: CSV completo com metadados e fonte, pronto para anexar em processo.
- **Lacunas declaradas**: para cada município, listar o que ainda não conseguimos coletar (ex: "Plano Diretor não encontrado publicamente").

## Propostas de telas e indicadores

### Tela 1: "Contratos em alerta" por município

Filtros: município, ano, valor mínimo.
Colunas: contrato, fornecedor, valor, objeto, tipo de alerta, link para a fonte.
Alertas possíveis:
- valor acima da mediana para objeto similar;
- mesmo fornecedor com > N contratos no ano;
- dispensa de licitação com valor próximo ao limite;
- empresa criada no mesmo ano do contrato.

### Tela 2: "Maiores fornecedores"

Ranking por município ou por estado, com:
- valor total contratado;
- número de contratos;
- número de municípios atendidos;
- citação em outros acervos (Rouanet, CFEM, licenciamento).

### Tela 3: "Territórios e empreendimentos"

Mapa e tabela cruzando:
- terras indígenas e quilombolas;
- processos minerários, barragens, licenciamentos;
- distância e sobreposição espacial;
- órgão que autorizou cada empreendimento.

### Tela 4: "Legislação municipal"

Para cada município:
- Lei Orgânica (link para LexML, planalto ou diário municipal);
- Plano Diretor (link e ano);
- Lei de Zoneamento;
- Código Tributário;
- Código de Obras e Posturas.
Status: "encontrado", "não encontrado", "não verificado".

### Tela 5: "Painel do cidadão"

Resumo de uma cidade só:
- população e IDH;
- principais gastos;
- contratos em alerta;
- empreendimentos próximos;
- legislação principal;
- últimas notícias do radar (se houver).

## Entregáveis e ordem de execução

### Sprint 1 — Mapeamento e priorização

1. Inventariar, por município, quais dados já temos e quais estão faltando.
2. Definir regras de alerta com base na legislação (Lei 14.133/2021, LC 141/2012, resoluções do TCE-MG).
3. Validar regras com amostra real (evitar falsos positivos).

### Sprint 2 — Contratos e fornecedores

4. Criar tela "Maiores contratos" e "Maiores fornecedores" por município.
5. Implementar alertas iniciais: concentração, dispensa próxima do limite, empresa recém-criada.
6. Adicionar CSV filtrado por tela.

#### Status da Sprint 2 (2026-08-22, branch `contratos-fornecedores`)

Itens 4-6 entregues: `/[municipio]/prefeitura/fornecedores/` nova, tela de
contratos com cartões + gráfico anual + filtro por tipo + coluna de órgão,
indício "fornecedor criado no mesmo ano" (calculado na consulta via
`contratos-indicios.ts`, não persistido em `motivos_alerta`) e CSV filtrado
nas duas telas. Pendências registradas:

1. **Payload das rotas novas não medido** — a máquina da sprint não tem banco
   (Neon HTTP 402); build e medição contra o teto de 25 MiB ficam para o
   home-pc. Sem banco as telas renderizam o estado vazio declarado.
2. ~~Indício de concentração sem badge visual~~ **RESOLVIDO na passada
   `revisao-dados` (mesmo dia)**: a tela de contratos ganhou badge e filtro
   "concentração no ano" — mesmo fornecedor com mais de N contratos assinados
   NO MESMO ANO, contados no navegador sobre todas as linhas carregadas.
3. **ETL (`etl/alertas.py`) intocado** — os três indícios exigidos já existiam
   como regras 1, 2 e 8; o de empresa recém-criada é calculado em tempo de
   consulta e não entra no ETL. Persistir em `motivos_alerta` exige rodada de
   ETL no home-pc.
4. **`recem=1` fora do ramo JSON de `/api/contratos`** — só o CSV aceita;
   motivo documentado no código (agregados de janela em SQL divergiriam do
   conjunto filtrado).

#### Ajustes da passada `revisao-dados` (2026-08-22, decisão do dono)

1. **Regra de dispensa próxima do limite, documentada**: alerta dispara quando
   a contratação por dispensa atinge **90% do limite do art. 75 da Lei
   14.133/2021 — R$ 400.000 para obras/serviços de engenharia e R$ 100.000
   para bens/serviços comuns** (`LIMIAR_DISPENSA_*`, `PCT_LIMIAR_DISPENSA`
   em `etl/betim/etl/alertas.py`). Os valores anteriores (100.000/50.000)
   não eram os da lei e foram corrigidos; **a correção só chega ao banco com
   rodada de ETL no home-pc** — até lá, os alertas já gravados seguem com o
   critério antigo.
2. **Concentração por ano, N=3 configurável**: constante
   `INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO = 3` em
   `apps/web/lib/betim/contratos-indicios.ts`; estrito ("mais de N" — três
   não acusam, quatro sim). Agrupa por CNPJ e, na falta, pelo nome publicado.
   Sem CNPJ nem nome, a linha não gera indício (lacuna declarada, não
   inferência).
3. **Empresa recém-criada, lacuna explícita**: sem `data_abertura` do CNPJ,
   nenhum indício é gerado e a tela não afirma idade nenhuma da empresa —
   ausência de dado nunca vira sinal.
4. **Pendência nova: `conc=1` fora do CSV de contratos** — o indício de
   concentração é calculado sobre o conjunto carregado no navegador; a rota
   CSV teria que reproduzir a mesma contagem server-side para não divergir.

### Sprint 3 — Território e empreendimentos

7. Cruzar terras indígenas/quilombolas com mineração, barragens e licenciamento.
8. Criar tabela e mapa de sobreposições.
9. Listar órgãos autorizadores e documentos de referência.

### Sprint 4 — Legislação municipal

10. Levantar URLs de Lei Orgânica e Plano Diretor para os municípios prioritários (Betim, BH, Araçuaí, Itinga, Diamantina, municípios da bacia).
11. Criar tela de legislação com status e link.
12. Documentar lacunas para pedidos LAI futuros.

#### Status da Sprint 4 (2026-08-22, branch `revisao-dados-sprint4`)

Itens 10-11 **entregues**; item 12 parcialmente — cada status negativo na
tela já carrega nota dizendo onde foi procurado/onde procurar (matéria-prima
de pedido LAI). Tela `/[municipio]/legislacao` com os cinco instrumentos
(Lei Orgânica, Plano Diretor, Zoneamento/Uso do Solo, Código Tributário,
Código de Obras e Posturas), cartões por status e filtro. Dado versionado em
`apps/web/lib/betim/legislacao/dados.ts`, sem tabela nova no banco.

Regra editorial do levantamento: **só domínio oficial (.gov.br) entra como
"Encontrado"** — agregadores privados podem aparecer nas notas como pista,
nunca como link principal. Verificação feita em 2026-08-22 (`VERIFICADO_EM`),
colada aos números da tela.

Achados verificados: Betim LO (Prefeitura, 1990) e PD (DPURB, LC 07/2018
compilada até LC 23/2024); BH LO (Transparência PBH) e PD/zoneamento (Lei
11.181/2019 — o PDU incorporou as normas de uso do solo); Araçuaí PD, LC de
uso do solo (008/2007) e Código Tributário (LC 006/2000), todos no portal de
transparência.

Pendências:

1. **Bacia do Paraopeba não verificada** — os demais municípios da bacia
   entram com tudo "Não verificado"; a tela já lida com isso honestamente.
2. **Diamantina avançou na segunda rodada de verificação (mesmo dia)**: Lei
   Orgânica (1990, PDF na Prefeitura) e Plano Diretor (LC nº 103, texto
   vigente) agora "Encontrados"; restam zoneamento/tributário/obras com os
   dois canais oficiais anotados. **Itinga segue sem documento localizado** —
   site oficial confirmado (www.itinga.mg.gov.br) com repositório de
   Documentos Públicos (/publicacao) e Portal da Transparência próprio;
   nenhum PDF exposto diretamente, vale pedido LAI se a busca manual falhar.
3. **Betim/BH: Código Tributário e Código de Obras/Posturas** ainda não
   identificados (caminhos anotados nos itens).
4. **Links podem sair do ar** — re-verificar `VERIFICADO_EM` quando tocar
   aqui de novo; a nota de cada item sobrevive ao link quebrado.
5. **Sem CSV nesta tela** (lista fixa de 5 linhas, fora da regra das cinco
   coisas); se virar acervo grande, adotar `TabelaEstatica` + índice fatiado.

### Sprint 5 — Integração e comunicação

13. Criar "Painel do cidadão" consolidando as telas acima.
14. Escrever nota técnica com os primeiros achados.
15. Divulgar para imprensa e órgãos de controle.

#### Status da Sprint 5 (2026-08-22, branch `painel-do-cidadao`)

Item 13 **entregue**: `/[municipio]/painel-do-cidadao` consolida dinheiro
público (top 5 contratos por valor, top 5 fornecedores, três contagens de
alerta com link direto para as variantes da tabela — `?conc=1`,
`?motivo=regra_2_dispensa_proxima_limite`, `?recem=1`), território
(sobreposições da Sprint 3 com área total), legislação (X de 5 encontrados,
Sprint 4) e o card de empresa monitorada derivado de
`municipiosPrioridade` do observatório (`lib/empresas/dados.ts`) — Sigma
Lithium em Araçuaí/Itinga, Vale em Brumadinho/Betim/Sarzedo. Entrada no
grid "explorar" da home de cada cidade. Sem banco, cada seção degrada para
estado vazio honesto com link para a tela completa.

Decisões registradas nesta sprint:

1. **As contagens do painel reusam as MESMAS funções puras da tabela de
   contratos** (`contratos-indicios.ts`) — painel e tela completa não podem
   divergir; quando a regra mudar, muda nos dois lugares.
2. **Acesso rápido só aponta rota existente**: `/obras` e `/servidores`
   ainda NÃO têm página na zona Cidades, então não entraram no bloco (link
   quebrado com cara de atalho seria pior que ausência). Quando ganharem
   tela, entram na lista em `painel-do-cidadao/page.tsx`.
3. Itens 14-15 (nota técnica e divulgação) seguem abertos — dependem de
   build com banco no home-pc para os números sairem do estado vazio.

## Automação de coleta e deploy no home PC

### Objetivo

Como são muitas bases e a publicação depende do `home-pc` (única máquina que consegue buildar com banco local), criar um script mestre que rode no home PC, atualize as fontes na periodicidade certa, valide, build e publique automaticamente.

### Princípios

- **Não rodar coleta pesada na CI do GitHub** — limites de rede, storage e política de uso honesto das fontes.
- **Uma fonte por vez**, nunca todas em paralelo — evita saturar as APIs e facilita debug.
- **Coleta vazia não sobrescreve dado bom** — regra já usada nos coletores.
- **Build só se houver mudança real** — evita deploy vazio.
- **Notificação de falha** — Telegram, e-mail ou log local visível.
- **Credenciais fora do repo** — `.env.local` no home PC, nunca no Git.

### Periodicidade sugerida por fonte

| Fonte | Periodicidade | Justificativa |
|---|---|---|
| Radar de notícias do Paraopeba | diária | notícias têm curto prazo de utilidade |
| PNCP (contratos) | 2× por semana | base muda com novas contratações |
| ComunicaBR | semanal | dados municipais atualizados mensalmente, mas varia |
| CFEM (ANM) | mensal | atraso natural de ~2 meses |
| SIGMINE/ANM | mensal | zip diário, mas mudanças relevantes são mensais |
| Licenciamento ambiental | semanal | status de processos muda com frequência |
| Convênios federais (Transferegov) | semanal | atualizações frequentes de propostas |
| Convênios MG (CKAN) | semanal | CGE publica com atualização diária, mas semanal é razoável |
| Lei Rouanet / SALIC | mensal | projetos novos entram o tempo todo, mas não exige urgência |
| Terras indígenas / quilombolas | trimestral | geometria muda pouco |
| Barragens / ZAS | mensal | descaracterização e status evoluem |
| Legislação federal (MMA) | mensal | normas novas surgem, mas não diariamente |
| Diário oficial (quando ativo) | diária | atos oficiais têm prazo de publicidade |
| Clima/INMET avisos ativos | diária | avisos têm validade curta |
| AdaptaBrasil | trimestral | indicadores não mudam rápido |

### Cronograma de coleta sugerido

Distribuir as fontes ao longo da semana para não sobrecarregar o home PC nem as APIs.

**Segunda-feira**
- Manhã: Radar de notícias do Paraopeba
- Tarde: PNCP (contratos)

**Terça-feira**
- Manhã: ComunicaBR
- Tarde: Licenciamento ambiental + barragens/ZAS

**Quarta-feira**
- Manhã: Convênios federais (Transferegov)
- Tarde: Convênios MG (CKAN)

**Quinta-feira**
- Manhã: CFEM + SIGMINE
- Tarde: Lei Rouanet / SALIC

**Sexta-feira**
- Manhã: Legislação federal
- Tarde: Territórios (terras indígenas, quilombolas)

**Sábado**
- Manhã: AdaptaBrasil
- Tarde: Diário oficial (quando coletor estiver pronto)

**Diário (todo dia, leve)**
- INMET avisos ativos

**Mensal (primeiro domingo)**
- Revisão de todos os logs do mês
- Checagem de links quebrados
- Compactação e arquivamento de dados antigos

### Pipeline do script mestre

```bash
#!/bin/bash
# scripts/cron-home-pc.sh

set -euo pipefail

DATA=$(date +%Y-%m-%d)
LOG_DIR="/var/log/controle-popular"
LOG="$LOG_DIR/coleta-$DATA.log"
REPO="/caminho/do/repo"

cd "$REPO"

git fetch origin
git rebase origin/main

# 1. Coleta da vez (passada como argumento)
python "scripts/coletar-$1.py" >> "$LOG" 2>&1

# 2. Validacao de dado pessoal
python scripts/checar-dado-pessoal-em-dado.py --extra >> "$LOG" 2>&1

# 3. Testes
npm test >> "$LOG" 2>&1

# 4. Build (só se houver mudanca)
if git diff --quiet HEAD; then
  echo "Nenhuma mudanca, build cancelado." >> "$LOG"
  exit 0
fi

npm run build >> "$LOG" 2>&1

# 5. Deploy
npm run cf:deploy >> "$LOG" 2>&1

# 6. Commit e push das atualizacoes de dado
git add data/ etl/ apps/web/public/data/
git commit -F ".git/mensagem-coleta-$DATA.txt"
git push origin HEAD:main
```

### Agendamento

No Windows, usar **Task Scheduler** chamando um `.bat` que roda o WSL/Git Bash; no Linux/WSL, usar `cron`:

```cron
# Segunda 06h — radar de noticias
0 6 * * 1 /caminho/do/repo/scripts/cron-home-pc.sh radar-noticias
# Segunda 14h — PNCP
0 14 * * 1 /caminho/do/repo/scripts/cron-home-pc.sh pncp
# Terça 06h — ComunicaBR
0 6 * * 2 /caminho/do/repo/scripts/cron-home-pc.sh comunicabr
# ... e assim por diante
```

### Segurança e resiliência

- **Nunca rodar `--force` no push**.
- **Pausa entre requisições** respeitada em cada coletor.
- **User-Agent honesto** em todos.
- **robots.txt** verificado; decisões documentadas.
- Se um coletor falhar, o script continua com as próximas etapas? Não — `set -e` para na falha e notifica. A decisão é: falha de coleta não deve gerar deploy com dados antigos, mas também não deve quebrar toda a semana. Solução: cada coletor gera arquivo de status; o build só roda se o status for "OK" ou "vazio esperado".

### Logging e monitoramento

- Log diário rotacionado (mantém 30 dias).
- Resumo por Telegram ao final: "Coleta PNCP: 1.247 contratos novos. Build: OK. Deploy: OK." ou "Falha em CFEM: ver log".
- Dashboard simples no painel local mostrando última coleta bem-sucedida por fonte.

### O que falta decidir

- Qual máquina é o home-pc exato? (endereço, SO, se roda WSL)
- Onde fica o Postgres local? (Docker, serviço nativo, Neon quando voltar)
- Qual o canal de notificação? (Telegram já usado no canário)
- Se o deploy continua sendo Cloudflare Workers ou se GitHub Pages vira secundário

## Riscos e armadilhas

| Risco | Mitigação |
|---|---|
| Falso positivo em alertas de irregularidade | Sempre rotular como "indício" ou "ponto de atenção", nunca "fraude"; mostrar a regra |
| Dado desatualizado gera manchete errada | Data de coleta visível; não publicar ranking sem nota metodológica |
| Cruzamento espacial impreciso | Usar coordenadas oficiais; declarar margem de buffer e método |
| Expor pessoas físicas | Nunca exibir CPF, endereço ou nome de pessoa física; usar razão social para PJ |
| Inferir causalidade de correlação | Texto sempre separa "aparece nos dois acervos" de "há relação causal" |
| Legislação municipal de difícil acesso | Linkar o que existe; declarar lacuna; abrir pedidos LAI quando necessário |

## Decisões registradas

- Toda comparação ou ranking precisa de nota metodológica visível.
- Alertas são indícios, não conclusões — a linguagem deve refletir isso.
- O cidadão precisa de resumo, o jornalista de cruzamento, o auditor de evidência: as mesmas informações precisam de três lentes de apresentação.
- A ausência de dado é informação: toda lacuna deve ser declarada, nunca escondida.
