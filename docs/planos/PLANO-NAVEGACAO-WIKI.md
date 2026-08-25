# Plano de navegacao em formato wiki

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-24
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [REVISAO-UX-E-ONBOARDING.md](REVISAO-UX-E-ONBOARDING.md), [PRODUTO.md](../01-produto/PRODUTO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** wiki, navegacao, sumario, indice, links relacionados, fluxo, onboarding

## Sumario

- [Proposito](#proposito)
- [Resumo para quem so quer o veredito](#resumo-para-quem-so-quer-o-veredito)
- [Principios que governam a proposta](#principios-que-governam-a-proposta)
- [Estrutura proposta](#estrutura-proposta)
- [Componentes reusaveis](#componentes-reusaveis)
- [Mapeamento das paginas existentes](#mapeamento-das-paginas-existentes)
- [Fluxos sugeridos entre paginas](#fluxos-sugeridos-entre-paginas)
- [Implementacao incremental](#implementacao-incremental)
- [Riscos e tetos](#riscos-e-tetos)
- [Decisoes a tomar](#decisoes-a-tomar)
- [Origem](#origem)

## Proposito

Transformar a navegacao do Controle Popular de um conjunto de "zonas isoladas" em uma experiencia de leitura em rede: cada pagina tem um sumario proprio, links para paginas gerais nos titulos de secao ("veja +") e, no final, uma lista de paginas relacionadas que sugere o proximo passo. O objetivo e reduzir a sensacao de labirinto reportada em testes de onboarding e ajudar quem chega sob estresse a encontrar o que precisa sem depender da busca.

## Resumo para quem so quer o veredito

| Mudanca | Onde | Como |
|---|---|---|
| Indice mestre do portal | `/indice` (ou `/wiki`) | Pagina unica com todos os hubs e links de entrada |
| Indice por frente | `/[zona]/indice` | Cards de topicos + sumario da frente |
| Sumario dentro da pagina | topo de paginas longas | Componente `IndiceWiki` com ancoras |
| "Veja +" nos titulos | ao lado de `h2`/`h3` | Link discreto para pagina geral do tema |
| Paginas relacionadas | rodape do conteudo | Componente `LinksRelacionados` com proximo passo |
| Navegacao entre cidades | `/[municipio]/indice` | Mesmo padrao, dados por cidade |

Nenhuma rota existente e removida. A proposta acrescenta paginas de indice e componentes; as paginas atuais continuam acessiveis pelos mesmos URLs.

## Principios que governam a proposta

1. **A navegacao e conteudo, nao decoracao.** Cada indice deve dizer o que a pagina destino responde, nao so o titulo.
2. **Link apenas para paginas que existem.** Indices gerados de fontes de verdade (`lib/zonas.ts`, `cidades-do-build.ts`, rotas do App Router) para nao criar 404 silenciosos.
3. **Nenhuma colecao vira prop de cliente.** Componentes de navegacao recebem listas pequenas e estaticas; paginas com muitos itens usam indice fatiado ou servidor (regra 1 do `AGENTS.md`).
4. **Acessibilidade primeiro.** Sumario como landmarks, links com texto descritivo, foco visivel, leitura em voz alta testada.
5. **Wiki nao substitui URL direta.** Quem sabe o caminho continua entrando direto; a wiki e para quem nao sabe por onde comecar.

## Estrutura proposta

### 1. Hub global: `/indice`

Pagina de entrada para leitura em rede. Equivalente a uma "pagina principal de wiki".

Secoes:
- **Por frente:** 6 cards (Cidades, Congresso, Judiciario, Funcao Social da Terra, Paraopeba, Ambiental). Cada card leva para `/[zona]/indice`.
- **Por cidade:** lista das 6 cidades publicadas, cada uma levando para `/[municipio]/indice`.
- **Por tema transversal:** Direitos em Movimento, Busca, Dados Populares, ComunicaBR, Sobre, Termos.
- **Por necessidade:** "Estou sendo despejado", "Quero denunciar", "Quero entender o Acordo de Brumadinho", etc. — links diretos para paginas de acao.

### 2. Indice por frente: `/[zona]/indice`

Exemplo para `/congresso/indice`:
- Sumario rapido no topo.
- Cards de topicos: Proposicoes, Votacoes, Parlamentares, Comissoes, Bancadas, Alertas, Bons exemplos, Agenda, Metodologia.
- Cada card tem: titulo, uma frase do que responde, link "veja +".
- Secao "Por que comecar por aqui?" com 3 links prioritarios.
- "Fluxo sugerido": seta visual Proposicoes → Votacoes → Parlamentares.

### 3. Indice por cidade: `/[municipio]/indice`

- Cards por eixo: Prefeitura, Camara, Servicos, Saude, Educacao, Meio Ambiente, etc.
- Cada card linka para a pagina correspondente da cidade.
- Aviso de cobertura: "Esta cidade tem X dos Y topicos disponiveis".

### 4. Dentro de cada pagina de conteudo

Paginas com mais de 3 secoes (`##`) ganham:
- **Sumario no topo:** `IndiceWiki` com ancoras para cada `h2`.
- **"Veja +" nos titulos:** ao lado de `h2`/`h3`, quando existe uma pagina geral do tema (ex.: titulo "Contratos" leva para `/betim/prefeitura/contratos` ou `/congresso/proposicoes`).
- **Paginas relacionadas no final:** `LinksRelacionados` com 3-5 links e uma frase de continuidade ("Depois de ver os contratos, confira os fornecedores").

## Componentes reusaveis

### `IndiceWiki`
- Recebe array de `{ id, titulo }` extraido dos `h2` da pagina.
- Renderiza `<nav aria-label="Sumario desta pagina">` com lista de ancoras.
- Estilo: lista vertical compacta, sem cor chamativa.
- Nao recebe o conteudo da pagina, so os titulos.

### `VejaMais`
- Recebe `href` e `label`.
- Renderiza link discreto ao lado do titulo de secao: `Contratos <a href="...">veja +</a>`.
- Usado server-side; nao adiciona hidratacao desnecessaria.

### `LinksRelacionados`
- Recebe array de `{ href, titulo, descricao }`.
- Renderiza secao "Proximo" ou "Paginas relacionadas" no final do `<main>`.
- Limitado a 5 itens; acima disso, usar indice de pagina.

### `CartaoTopico`
- Recebe `href`, `titulo`, `descricao`, `cor?`, `badge?`.
- Usado nos hubs `/indice` e `/[zona]/indice`.
- Grid responsivo (1/2/3 colunas).

### `FluxoNavegacao`
- Recebe array de etapas.
- Renderiza seta visual entre topicos para sugerir ordem de leitura.
- Usado com moderacao, so quando existe de fato uma sequencia didatica.

## Mapeamento das paginas existentes

### Frente Cidades (`/[municipio]`)
Hub: `/[municipio]/indice`
Topicos do hub:
- Prefeitura (contratos, licitacoes, despesas, fornecedores, obras, servidores, cultura)
- Camara (proposicoes, votacoes, comissoes, vereadores)
- Servicos publicos (saude, educacao, clima, coleta de lixo, plantao farmacias, postos)
- Economia e territorio (economia, mineracao, terras, meio ambiente, agronegocio)
- Transparencia (nota-transparencia, dados abertos, metodologia)

### Frente Congresso (`/congresso`)
Hub: `/congresso/indice`
Topicos do hub:
- Proposicoes, Votacoes, Parlamentares, Comissoes, Bancadas
- Alertas, Bons exemplos, Agenda
- Metodologia

### Frente Judiciario (`/judiciario`)
Hub: `/judiciario/indice`
Topicos do hub:
- Tribunais, Vagas, Indicacoes
- Corregedorias, Defensoria, Inspecoes, Presidios
- Numeros, Instituicoes, Metodologia

### Frente Ambiental (`/ambiental`)
Hub: `/ambiental/indice`
Topicos do hub:
- COPAM, Licenciamento, Barragens, Estudos de impacto
- TACs, Convênios, Patrimonio cultural
- Legislacao, Decisoes LAI, Direito critico

### Frente Paraopeba (`/paraopeba`)
Hub: `/paraopeba/indice`
Topicos do hub (em ordem didatica):
- Entenda, Clipping, Linha do tempo, Quem atua
- Auxilio, Execucao, Documentos, Biblioteca
- Auditoria, Pericia, Analise

### Frente Funcao Social da Terra (`/funcaosocialterra`)
Hub: `/funcaosocialterra/indice`
Topicos do hub:
- Mapa (globo 3D), Alertas
- Metodologia, Fontes

## Fluxos sugeridos entre paginas

### Fluxo: "Quero entender um contrato municipal"
1. `/indice` → Cidades → `/betim/indice`
2. `/betim/indice` → Prefeitura → `/betim/prefeitura/contratos`
3. Na pagina de contratos: sumario interno, "veja +" em "Fornecedores" → `/betim/prefeitura/fornecedores`
4. No final: relacionadas → `/betim/prefeitura/licitacoes`, `/betim/camara/proposicoes`

### Fluxo: "Quero acompanhar uma proposta de lei"
1. `/indice` → Congresso → `/congresso/indice`
2. `/congresso/indice` → Proposicoes → `/congresso/proposicoes`
3. Na pagina: sumario interno, "veja +" em "Comissoes" → `/congresso/comissoes`
4. No final: relacionadas → `/congresso/votacoes`, `/congresso/alertas`

### Fluxo: "Quero saber sobre a reparacao de Brumadinho"
1. `/indice` → Paraopeba → `/paraopeba/indice`
2. `/paraopeba/indice` → Entenda → `/paraopeba/entenda`
3. No final: relacionadas → `/paraopeba/clipping`, `/paraopeba/linha-do-tempo`

### Fluxo: "Quero denunciar"
1. `/indice` → "Estou em situacao de risco" → `/direitos-em-movimento/denuncia`
2. Na pagina: relacionadas → `/direitos-em-movimento/ajuda`, `/direitos-em-movimento/informacao`

## Implementacao incremental

### Fase 1: componentes base (1 sessao)
- Criar `IndiceWiki`, `VejaMais`, `LinksRelacionados`, `CartaoTopico` em `apps/web/app/components/wiki/`.
- Adicionar testes de acessibilidade basicos (presenca de `aria-label`, links validos).
- Usar em UMA pagina piloto, ex.: `/congresso/proposicoes`.

### Fase 2: hubs por frente (1-2 sessoes)
- Criar `/[zona]/indice` para Congresso, Judiciario, Paraopeba, Ambiental, Funcao Social da Terra.
- Cidades: criar `/[municipio]/indice` reutilizando o mesmo `CartaoTopico`.
- Validar todos os links com script de auditoria.

### Fase 3: hub global (1 sessao)
- Criar `/indice` com os 6 cards de frente, lista de cidades e temas transversais.
- Linkar `/indice` a partir do `FooterGlobal` e da home (sem remover nada).

### Fase 4: paginas de conteudo (contínuo)
- Em cada pagina longa, adicionar `IndiceWiki`, `VejaMais` e `LinksRelacionados`.
- Priorizar paginas com maior trafego (`/dados/populares` pode indicar quais).

### Fase 5: medicao
- Rodar `npm test` e `npx tsc --noEmit`.
- Medir payload: nenhum componente de wiki pode fazer uma rota passar de 25 MiB de asset ou 3 MiB gzip.
- Testar leitura em voz alta e navegacao por teclado.

## Riscos e tetos

| Risco | Mitigacao |
|---|---|
| Payload do Worker estourar | Componentes server-side; listas pequenas; nenhuma colecao grande como prop de cliente |
| 404 em links gerados automaticamente | Gerar indices a partir de fontes de verdade; auditar com script |
| Acessibilidade quebrar | `aria-label`, skip-link, foco visivel, teste com leitor de tela |
| Duplicar navegacao existente | Novas paginas nao substituem header/footer; sao complementares |
| Manutencao dos indices envelhecer | Dados dos indices devem vir de `lib/zonas.ts` e de scans de `app/`, nao de listas cravadas |

## Decisoes a tomar

1. **URL do hub global:** `/indice` ou `/wiki`? Recomendacao: `/indice` (palavra em portugues, sem jargon, curta).
2. **"Veja +" aparece em todos os `h2` ou so quando ha pagina correspondente?** Recomendacao: so quando ha pagina; ocultar quando nao houver destino.
3. **Gerar indices automaticamente ou manualmente?** Recomendacao: automaticamente a partir das rotas existentes, com excecoes explicitas.
4. **Prioridade de implementacao:** comecar por Congresso (navegacao ja madura) ou por Cidades (maior trafego)? Recomendacao: Congresso como piloto por ter layout consolidado.

## Origem

Surgiu do pedido do dono em 2026-08-24: estruturar o portal como wiki, com indices, sumarios, links gerais nos titulos e paginas relacionadas ao final, criando continuidade entre paginas.
