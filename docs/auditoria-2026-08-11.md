# Auditoria do portal — 2026-08-11

> Produzida por um workflow de 11 agentes (6 auditando cada cidade página a
> página no site em produção, 1 auditando as zonas de topo, 2 lendo o vault e
> a documentação técnica, 2 críticos sintetizando e revisando). Os achados de
> maior severidade foram **verificados manualmente** antes de entrar aqui —
> ver a seção "O que foi conferido e corrigido no mesmo dia" antes de agir
> sobre qualquer item abaixo que pareça já resolvido.

## Como ler este documento

A auditoria varreu 324 páginas de cidade (6 cidades × 54 caminhos) mais 21
zonas de topo via `curl`. **Isso tem um ponto cego conhecido**: várias tabelas
grandes do site carregam via JavaScript no cliente (`TabelaEstatica`/
`ListaXxx`), e `curl` só vê o HTML antes do carregamento — aparece como
"0 de 0", que não é o mesmo que vazio de verdade. Os agentes confirmaram boa
parte disso abrindo o navegador de verdade quando o padrão parecia suspeito,
mas nem tudo foi reconferido. **Dois itens que a auditoria listou como
"parcial/suspeito" eram falso-positivo puro do curl** — ver abaixo.

## O que foi conferido e corrigido no mesmo dia (commit `d8d8e67`)

Três achados de maior severidade foram verificados com navegador real e/ou
consulta direta ao banco antes de qualquer ação, e os três eram reais:

1. **`/seguranca` de São Paulo dizia "Sejusp-MG"** — a página inteira foi
   escrita para Betim e nunca ganhou condicional quando SP passou a ter
   coletor próprio (SSP-SP). O **número sempre esteve certo** (verificado no
   banco: `fonte='ssp_sp_ocorrencias_mensais'`); o texto que dizia de onde
   vinha estava errado. Corrigido: a página ramifica por UF.
2. **BH: home mostrava "0 contratos ativos" com 6.872 reais no banco.** Causa:
   `status` não tem vocabulário único entre coletores — BH grava o texto
   literal do GRP da Ábaco (`'EM EXECUÇÃO'`), as outras cidades computam
   `'ativo'/'encerrado'` minúsculo. Toda comparação exata no site (home, selo
   da lista, filtro, exportação) só reconhecia o segundo vocabulário.
   Corrigido em `lib/betim/statusContrato.ts`, sem reescrever dado gravado.
3. **Um órgão de teste da própria API da Câmara vazou para
   `/congresso/comissoes`** — "TESTECOM (COMISSÃO FICTÍCIA)", que a API da
   Câmara devolve com `ativo: true` como qualquer comissão real. Desativado
   (migration `congresso/0010`) e o coletor ganhou filtro para não reimportar.

**Verificado e NÃO era bug:**

- **Araçuaí, fornecedor "WS Shows/Wesley Safadão" somando R$900 milhões** —
  conferido direto no PNCP: é o valor que a própria prefeitura publicou no
  federal. Não corrigimos número oficial por conta própria. O que É real: o
  alerta de valor atípico exige ≥3 contratos na mesma categoria para calcular
  média/desvio, e este é provavelmente o único "show artístico" de Araçuaí —
  grupo de tamanho 1, a regra pula em silêncio. Fica como item de metodologia
  abaixo, não conserto de uma linha.
- **`/busca` "travada em 0%, carregando"** — falso-positivo do `curl`. Testado
  no navegador: 629+ resultados reais para "saúde".
- **Encoding quebrado em "FLORETTI BRASIL PARTICIPAÇÕES" (Araçuaí)** —
  confirmado no DOM real que a página renderiza errado, mas o banco tem a
  string limpa (UTF-8 correto, sem duplicata). A corrupção acontece entre o
  banco e o HTML publicado; mecanismo não identificado, não perseguido às
  cegas nesta rodada.

---

## O que falta ou está incompleto (deduplicado, corrigido após verificação)

| # | Item | Onde | Esforço | Impacto | Por quê | Bloqueio | Próximo passo concreto |
|---|---|---|---|---|---|---|---|
| 1 | ~~Home "0 contratos" em BH~~ | — | — | — | **CORRIGIDO hoje**, commit `d8d8e67` | — | — |
| 2 | Alerta de valor atípico (regra 1) invisível para contratos ÚNICOS na categoria | Todas as cidades, mas achado em Araçuaí | Médio | Alto | `MIN_AMOSTRA_BASELINE=3` faz a regra pular grupos de tamanho 1-2 — exatamente o contrato isolado sem par de comparação, que é o mais arriscado de não ter alerta nenhum | — | Desenhar um segundo critério para grupo pequeno: comparar contra a mediana de TODOS os contratos da cidade (não só da categoria), ou contra um teto absoluto (ex.: % do orçamento anual). Precisa de calibração — não é fix de uma linha |
| 3 | ~~Comissão de teste "TESTECOM" em produção~~ | — | — | — | **CORRIGIDO hoje**, commit `d8d8e67` | — | — |
| 4 | ~~SP mostrando "Sejusp-MG"~~ | — | — | — | **CORRIGIDO hoje**, commit `d8d8e67` | — | — |
| 5 | Zona Congresso: `proposicoes`/`votacoes`/`bons-exemplos` pareciam "0 de 0" | Zona Congresso | — | — | **Falso-positivo do curl** — mesmo padrão do `/busca`. BH sozinha confirma 3.742 proposições reais carregando via JS. Ainda vale abrir os 3 caminhos de Congresso no navegador para ter certeza (não foi feito nesta verificação), mas a suspeita de bug caiu bastante | — | Confirmar no navegador antes de investir qualquer esforço aqui |
| 6 | `/congresso/agenda` expõe comando de desenvolvedor (`python -m etl.camara.eventos`) na mensagem de "nada agendado" | Zona Congresso | Baixo | Baixo | Vazamento de detalhe interno pro público, sem risco de segurança real mas não deveria aparecer | — | Trocar a mensagem por texto sem comando |
| 7 | `/camara/proposicoes` retorna 404 apesar de estar no menu da própria Câmara | Araçuaí, Itinga | Baixo | Médio-alto | Rota anunciada mas quebrada; rotas irmãs funcionam nas mesmas cidades | — | Comparar com Betim/BH (que funcionam) e corrigir o registro de rota |
| 8 | Texto de template de Betim vazando pra outras cidades ("Citrolândia", barragens de Igarapé/Itatiaiuçu/Sarzedo) + link morto pra `/citrolandia` | Araçuaí, BH, Itinga, SP | Baixo | Médio-alto | Cidadão de outra cidade lê sobre região de Betim | — | Localizar os textos fixos em `links-uteis-mg` e `meio-ambiente` e trocar por conteúdo condicional |
| 9 | Migrations/seeds quebradas: defesa civil filtra por `slug` inexistente; seeds do Judiciário com incompatibilidade de tipo | Todas as cidades (defesa civil) + zona Judiciário | Baixo | Médio | Causa já diagnosticada no vault §6, é só aplicar | — | Corrigir `0045_defesa_civil_so_betim` (usar `id_municipio`, não `slug`), ajustar tipos em `judiciario/0004` e `/0007` |
| 10 | Inventário estadual de barragens incompleto (FEAM 4/249, SNISB 52/2.212) | Zona Ambiental | Baixo | Médio | Coletores já existem e testados; o bloqueio antigo (Neon HTTP 402) não existe mais — banco é local agora | — | Rodar os coletores por completo; deduplicar FEAM×SNISB antes de somar |
| 11 | Contatos/Notícias vazios (5 de 6 cidades); coleta-lixo/plantão-farmácias vazios em TODAS as 6, inclusive Betim | Contatos/Notícias: 5 cidades. Coleta-lixo/plantão: as 6 | Baixo | Médio | Só Betim tem contatos/notícias reais (trabalho manual). Coleta-lixo/plantão são casos DIFERENTES: fonte nunca confirmada em nenhuma cidade — precisa de sessão de descoberta, não é réplica de trabalho já feito | — | Replicar cadastro de contatos/notícias de Betim; para coleta-lixo/plantão, abrir uma sessão de descoberta de fonte (nenhuma cidade tem hoje) |
| 12 | Zap/Compra-e-venda vazios nas 6 cidades | Todas | Baixo | Baixo-médio | Depende de gente se cadastrar, não de coleta | Crescimento orgânico, não trabalho de engenharia | Tratar como frente de divulgação |
| 13 | `/camara/legislacao` sem nenhuma norma cadastrada | BH, Itinga, SP | Médio | Alto | Dado central de transparência legislativa faltando nas cidades maiores | — | Verificar se essas câmaras publicam via SAPL ou exigem outra fonte |
| 14 | `/prefeitura/servidores` vazio (Araçuaí, Itinga confirmados; Diamantina/SP não confirmados no navegador ainda) | Araçuaí, Itinga (confirmado); Diamantina, SP (a confirmar) | Médio | Alto | Causa de Araçuaí já mapeada (§21 do vault: portal posta mas não pagina em headless — testar abrir o menu de contexto do exportador antes de clicar) | — | Testar a correção do menu de contexto em Araçuaí; escrever coletores de Itinga (CidadesMG) e Diamantina (PortalTransp) |
| 15 | `/prefeitura/servidores` de BH só mostra 114 nominais (Belotur) contra 78.612 vínculos processados | BH | — | — | **Não é lacuna** — já documentado no vault §25: o endpoint da PBH devolve o NÚMERO de vínculos por órgão, não o nome. 114 é quanto vem nominal; a folha agregada por órgão entrou inteira (4.530 linhas) | Limite estrutural da fonte | Nenhum — já é o máximo que a fonte permite. Vale só deixar isso explícito NA TELA de servidores de BH, pra não parecer que a prefeitura tem 114 funcionários |
| 16 | `/camara/comissoes` vazio ou sem membros (Araçuaí, BH, Itinga vazio; Diamantina com comissões sem membro) | 4 cidades | Médio | Médio | Só Betim e SP têm composição real | — | Replicar coletor de comissões de Betim/SP |
| 17 | `/congresso/bancadas` lista 354 entidades sem composição sincronizada | Zona Congresso | Baixo-médio | Médio | A maioria (320, frentes parlamentares da Câmara) NÃO depende do bloqueio do Senado — reclassificado de "médio esforço" pra parcialmente ganho rápido | Só a parte do Senado é bloqueada por anti-bot | Semear a composição da Câmara primeiro (não bloqueada); Senado espera |
| 18 | Judiciário: vagas projetadas cobrem só STF; faltam ~89 assentos de STJ/TST/STM/TSE/TJMG/TRF6; TJMG sem contagem de cadeiras | Zona Judiciário | Médio | Médio | Curadoria manual de ~93 datas de nascimento ainda em andamento | — | Terminar de semear as datas que faltam |
| 19 | Fotos ausentes: vereadores de Diamantina (1/13); magistrados (0/17) | Diamantina, Judiciário | — | — | Causa e bloqueio já documentados (vault): Diamantina precisa de coletor específico (SysSolution não traz foto); magistrados não têm endpoint, é curadoria manual | Trabalho manual represado, não bug | Curadoria manual, como o resto dessas tabelas |
| 20 | `grupos-economicos` "ok, zero grupos" em BH/SP pode ser falso-negativo | BH, SP | — | — | A cota do BigQuery (CNPJ/sócios) está esgotada justamente nessas duas cidades — sem sócios coletados, "nenhum grupo" não é resultado confiável, é ausência de insumo | Cota gratuita do BigQuery esgotada (ver bloqueios) | Reavaliar quando a cota resetar; não tratar como "análise rodou e deu zero" |
| 21 | `/prefeitura/obras` vazio (5 de 6 cidades); frota de veículos "em breve" em todas | Obras: Araçuaí, BH, Diamantina, Itinga, SP. Frota: as 6 | Médio | Médio | Só Betim tem 59 obras reais | Parcial: SISOP (cobriria as 3 do Vale de uma vez) tem certificado incompleto | Enquanto o SISOP não resolve, avaliar raspador direto pra BH/SP (maior volume) |
| 22 | Terras cobre só 3 das 6 cidades; rodada 2 de validação do G0 pendente | BH, Betim, SP sem cobertura | Médio | Médio | Rodada 1: 0 falsos-positivos eliminados por desenho do critério (não por falha real) — precisa de recorte novo | GPKG da bacia não estão nesta máquina; julgamento humano das 40 áreas é do usuário | `--semente 7 --excluir-julgados` quando os GPKG chegarem |
| 23 | `/legislacao/alertas` e `/legislacao/bons-exemplos` quase vazios (0-1,8% das normas analisadas) | Todas as 6, graus variados | Alto | Alto | É a funcionalidade central do produto; a fila só de Betim tem 894 itens | Sem modelo automatizado aprovado — a única rodada até hoje foi manual, 60 análises | Rodar o conjunto de calibração (10 garantista/10 reducionista/10 técnico) antes de escalar |
| 24 | Zona Ambiental anuncia 454 reuniões/19.162 licenças, mas só Barragens tem link funcional | Zona Ambiental | Alto | Alto | Página se autodeclara "em construção", mas números aparecem como se fossem clicáveis | — | Testar em amostra pequena se o município de cada item de pauta do COPAM sai de forma confiável antes de construir a tela inteira |
| 25 | Diário oficial não coletado em nenhuma cidade | Mais urgente em Araçuaí/Itinga (câmaras sem proposições, dependem só do diário) | Alto | Médio-alto | Sem isso, essas 2 câmaras nunca terão legislação completa | Corte de LGPD pendente (nomeação/exoneração, CPF) — decisão do usuário | Engenharia pode adiantar (mapear SIGPub) em paralelo à decisão de LGPD |

---

## A mesma tabela, por prioridade (menor esforço → maior impacto primeiro)

🟢 ganho rápido · 🟡 vale a pena · 🟠 grande mas importante · 🔴 bloqueado por algo externo

| Ordem | Item | Observação |
|---|---|---|
| ✅ | #1, #3, #4 — home BH, TESTECOM, SP/Sejusp-MG | **Feito hoje** |
| 1 🟢✅ | #6 — comando de dev exposto em `/congresso/agenda` | **Feito** — commit `592f207` |
| 2 🟢✅ | #7 — `/camara/proposicoes` 404 em 2 cidades | **Feito** — bug real era no menu (`Header.tsx`), não na rota — commit `f87eaa3` |
| 3 🟢✅ | #8 — texto de Betim vazando pra outras cidades | **Feito** — commit `a085f7f` |
| 4 🟢✅ | #9 — migrations quebradas (defesa civil, Judiciário) | **Feito** — commit `9c36020` |
| 5 🟢🔶 | #10 — inventário de barragens incompleto | **Coletor confirmado OK, mas cobertura estadual esbarra em decisão de arquitetura** — `municipios` só tem 6 linhas; ver seção nova abaixo |
| 6 🟢⬜ | #11 — contatos/notícias (réplica) vs. coleta-lixo/plantão (descoberta nova) | Não entrou nesta rodada |
| 7 🟢✅ | #17 — bancadas da Câmara (não a parte do Senado) | **Feito** — 320/320 frentes com composição (58.785 vínculos). Achado: as 354 são TODAS da Câmara, não é bloqueio de Senado — os 34 sem composição (bloco/federação/partido) não têm endpoint de membros na API, ponto final |
| 8 🟡🔶 | #13 — `/camara/legislacao` vazio nas 3 maiores cidades | **BH e SP feitos** (3.586 e 2.233 atos — coletores já existiam, nunca tinham rodado; cron semanal de SP também consertado, commit `a0c4e36`). **Itinga parcial**: fonte nova achada e coletor escrito (commit `e2bb9f8`), mas as categorias LEIS/LEIS COMPLEMENTARES estão vazias na própria fonte — zero lei mesmo |
| 9 🟡🔶 | #14 — servidores vazios (Araçuaí/Itinga) | **Araçuaí feito** — 1.098 servidores, achado o botão certo ("Dados Abertos", não o menu de contexto) — commit `9a0fe6d`. **Itinga não entrou** nesta rodada |
| 10 🟡🔶 | #16 — comissões vazias/incompletas | **BH feito** (13 comissões / 265 membros — coletor já existia). Diamantina confirmado completo. **Araçuaí e Itinga: fonte genuinamente vazia**, não é bug — não dá pra coletar o que a câmara nunca cadastrou |
| 11 🟡🔶 | #18 — Judiciário, vagas só cobrem STF | **Avançou**: STJ 32/32, STM 9/15, TST 18/26 + cadeiras do TJMG — commit `c179a8c`. Curadoria manual segue incompleta (STM e TST) |
| 12 🟡✅ | #2 — alerta de valor atípico cego pra contrato único | **Feito** — Regra 11 nova (compara contra teto do orçamento anual da cidade quando a categoria não tem grupo) — commit `56f14e2` |
| 13 🔴 | #21 — obras/frota | Parcial: SISOP com certificado incompleto |
| 14 🔴 | #22 — Terras em 3 de 6 cidades | GPKG fora desta máquina + julgamento humano |
| 15 🟠🔶 | #23 — análise garantista quase vazia | **Primeira etapa feita**: conjunto de calibração de 25 casos (garantista/reducionista/técnico) rodado e conferido contra a rubrica — commit `5346bee`. Escalar pras outras cidades ainda não começou |
| 16 🟠✅ | #24 — zona Ambiental "em construção" | **Viabilidade confirmada**: município sai em 97% dos itens de pauta do COPAM sem precisar abrir PDF — commit `2de85af`. Construir a tela em si é o próximo passo, não feito aqui |
| 17 🔴 | #25 — diário oficial | Decisão de LGPD pendente; engenharia pode adiantar |

**Legenda desta rodada**: ✅ feito e verificado · 🔶 parcial, com o que falta anotado · ⬜ não entrou nesta rodada.

---

## Segunda rodada — workflow de 14 agentes em paralelo (2026-08-11, tarde)

Depois desta auditoria, rodei os 14 itens 🟢/🟡/🟠 acima num workflow com um agente Sonnet por
item, cada um num git worktree isolado (ou direto no checkout principal quando não havia risco de
colisão de arquivo). Todos os 14 terminaram sem erro; 10 commits novos foram integrados em `main`
depois de revisão (diffs conferidos um a um, `tsc --noEmit` + `npm test` limpos após cada merge,
numeração de migration sem gap nem duplicata). Nada foi enviado para o GitHub (`origin`) — fica
para quando o usuário decidir publicar.

**Decisão pendente que este workflow não tomou por si** (item #10, barragens): a tabela
`municipios` — usada por ~37 tabelas via chave estrangeira e pelo gerador de páginas estáticas —
só tem as 6 cidades do portal. Cobrir as 249 barragens FEAM + 2.212 SNISB do estado inteiro exige
uma de três rotas: (1) semear as ~853 cidades de MG como referência (`ativo=false`, migration
versionada), (2) tirar a FK de `feam_barragens`/`snisb_barragens` e gravar por nome+UF (elas já
guardam isso como texto), ou (3) aceitar cobertura parcial até a fase F5 do roadmap Ambiental já
prevista no código. Nenhuma foi executada — é modelagem, não conserto.

**Achado que corrige a própria auditoria** (item #17): a suposição de que 34 das 354 bancadas do
Congresso estariam presas ao bloqueio de anti-bot do Senado era errada — as 354 são todas da
Câmara; os 34 sem composição (blocos, federações, partidos) simplesmente não têm endpoint de
membros na API de Dados Abertos. Não é bloqueio, é ausência de dado na fonte.

---

## Bloqueado — não é sobre esforço

| Item | Tipo | Detalhe | O que destrava |
|---|---|---|---|
| Corte de LGPD (diário oficial, licenciamento ambiental — CPF em ~25% da camada, cópia de PDF vs. link) | Decisão do usuário | — | Usuário decidir o corte |
| Pedido ao TCE-MG (contratos de Itinga) | Decisão + ato do usuário | Pedido já redigido, não protocolado | Decisão de LGPD + usuário protocolar |
| Cota do BigQuery esgotada | Cota de API, só gratuita por decisão do usuário | CNPJ/sócios parado em BH e SP | Resetar sozinha (mensal) — não habilitar faturamento |
| SISOP (obras públicas) | Certificado incompleto | Cobriria as 3 cidades do Vale de uma vez | Fora do nosso controle |
| SIGIBAR (barragens, mais completo que FEAM/SNISB) | reCAPTCHA Enterprise | Projeto tem regra de não contornar CAPTCHA | Só se a SEMAD publicar sem captcha |
| pgvector / embeddings | Falta elevação (UAC) nesta máquina | Não bloqueia nada hoje (busca é por palavra-chave) | Terminal administrativo |
| Domínio `controlepopular.com.br` | Ação do usuário | DNS ainda não propagou | Usuário conferir no Registro.br |
| Portais de terceiro fora do ar (503) | Disponibilidade externa | Convênios BH, benefícios SP | Esperar o terceiro voltar |
| DataJud (CNJ) não busca por nome | Limite estrutural da fonte | Só busca por número de processo | Decisão de produto: aceitar, raspar e-SAJ/PJe, ou serviço pago |

---

## Cobertura desta auditoria

Cobriu as 6 cidades (324 páginas) e as 21 zonas de topo — não sobrou seção do
menu de fora. **Não cobriu**: páginas de item individual (um vereador
específico, uma proposição específica) — só listagens. Os 3 sub-blocos do
COPAM/Licenciamento/Legislação dentro de `/ambiental` foram avaliados pelo
texto da página-mãe, não com `curl` direto nas sub-URLs — vale conferir antes
de assumir que estão 404.
