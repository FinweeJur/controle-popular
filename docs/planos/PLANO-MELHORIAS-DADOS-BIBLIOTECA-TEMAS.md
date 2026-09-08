# Plano — Seletor de Temas, Regra de Dados Compactos, Biblioteca Unificada e Execução Paraopeba

> **Tipo:** PLANO
> **Domínio:** ux/dados/paraopeba
> **Última medição:** 2026-09-07
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md), [PLANO-BIBLIOTECA-CRIMES-SOCIOAMBIENTAIS.md](./PLANO-BIBLIOTECA-CRIMES-SOCIOAMBIENTAIS.md)
> **Palavras-chave:** temas, popup, densidade, contratos, mariana, paraopeba, aecom, fgv, biblioteca, crimes socioambientais, hiperlinks, seu nono, sabia 7b

## Sumário

- [Propósito](#propósito)
- [1. Correção do Seletor de Temas](#1-correção-do-seletor-de-temas)
- [2. Regra Visual para Todo Dado / Contrato / Acordo](#2-regra-visual-para-todo-dado--contrato--acordo)
- [3. Execução da Biblioteca Unificada Socioambiental](#3-execução-da-biblioteca-unificada-socioambiental)
- [4. Hiperlinks em Temas e Tags nas Cidades](#4-hiperlinks-em-temas-e-tags-nas-cidades)
- [5. Cobertura da Execução do Acordo Paraopeba nos 26 Municípios](#5-cobertura-da-execução-do-acordo-paraopeba-nos-26-municípios)
- [Verificação e Rito](#verificação-e-rito)

## Propósito

Padronizar e aprimorar a experiência de dados públicos no Controle Popular, garantindo que o seletor de temas funcione instantaneamente, que tabelas de contratos e acordos exibam dados com densidade e inteligência cívica (tags, microresumo Sabiá 7B, link oficial e diálogo com Seu Nonô), que a biblioteca socioambiental tenha alcance nacional consolidado e que a execução do Acordo de Brumadinho seja investigada cidade a cidade.

---

## 1. Correção do Seletor de Temas

O componente `ThemeSwitcher.tsx` em `apps/web/app/[municipio]/components/ThemeSwitcher.tsx` utilizava o atributo nativo HTML `popoverTarget="theme-popover"`. Essa abordagem falhava no React por ausência de manipulador de clique síncrono e por suscetibilidade a nós duplicados.

### Solução
- Controle via `useState(false)`.
- Manipulador de clique no botão que alterna o estado `aberto`.
- Listener no `document` para capturar clique fora e fechar a janelinha.
- Tecla `Escape` para fechamento com foco retornado ao botão.
- Totalmente acessível com `aria-expanded` e `aria-haspopup`.

---

## 2. Regra Visual para Todo Dado / Contrato / Acordo

Toda tabela ou lista de contratos, convênios, acordos e projetos no portal adota os seguintes requisitos:

1. **Visão Comprimida (Densidade de Linhas)**:
   - Layout compacto para permitir leitura de maior volume de itens na tela sem rolagem cansativa.
   - Alternador de densidade ("Modo Denso / Modo Detalhado").
2. **Tags e Categorias**:
   - Badges coloridos indicando o tema e a área da administração pública.
3. **Microresumo Sabiá 7B / IA Cívica**:
   - Síntese explicativa em uma ou duas frases curtas.
   - Indicação de data e identificação da síntese, com ressalva de IA.
4. **Filtros e Ordenação**:
   - Filtro por região, tema, categoria e situação.
   - Ordenação por valor financeiro, data e ordem alfabética.
5. **Acesso Direto à Fonte e ao PDF**:
   - Link direto para a publicação no PNCP ou portal de transparência oficial.
6. **Diálogo no Chatbot Seu Nonô**:
   - Botão "Perguntar ao Seu Nonô" que abre o assistente com o contexto pré-carregado sobre o contrato/acordo.

Locais de aplicação:
- `apps/web/app/ambiental/mariana/PainelMariana.tsx` (Acordo do Rio Doce).
- `apps/web/app/[municipio]/prefeitura/contratos/ListaContratos.tsx` (Contratos municipais).

---

## 3. Execução da Biblioteca Unificada Socioambiental

Conforme planejado em `docs/planos/PLANO-BIBLIOTECA-CRIMES-SOCIOAMBIENTAIS.md`:
- Agregação de documentos das ATIs (Brumadinho), do Rio Doce (Mariana / CBH-Doce / Fundo Brasil).
- Expansão para casos nacionais e regionais (Quadrilátero Ferrífero, Serra do Gandarela, Vale do Aço, Alto São Francisco, Rio das Velhas, Garimpo Ilegal no Norte e Sul de MG, e Ações Coletivas do MPF, MPMG e DPU).
- Execução dos scripts de unificação gerando acervo de mais de 950 documentos oficiais indexados com links e metadados.

---

## 4. Hiperlinks em Temas e Tags nas Cidades

- No componente `FichaCard.tsx`, as tags `#tema` deixam de ser texto simples e viram links clicáveis apontando para a busca correspondente (`/busca?q=...`).
- Nas páginas das 199 cidades estratégicas, as áreas de atuação e conexões territoriais passam a ser pontes ativas de navegação.

---

## 5. Cobertura da Execução do Acordo Paraopeba nos 26 Municípios

Cruzamento dos dados oficiais:
- **Auditoria FGV**: R$ 5,48 bilhões pactuados nos Anexos I.3 e I.4, percentual desembolsado por município e lista de projetos por status.
- **Auditoria AECOM**: laudos de segurança hídrica, 16 eixos de danos socioambientais e monitoramento de rejeitos.
- **Biblioteca das ATIs**: pareceres técnicos e demandas comunitárias.

Geração de 26 reportagens estruturadas, uma para cada cidade da bacia do Paraopeba, integradas na base de notícias do portal e com atalhos de fiscalização cidadã.

---

## Verificação e Rito

1. `python scripts/validar-documentacao.py` para garantir conformidade do documento.
2. `npm test` para assegurar que nenhum teste regressou.
3. `npx tsc --project apps/web/tsconfig.json --noEmit` para validação estrita de tipos.
4. `python scripts/checar-dado-pessoal-em-dado.py` para auditoria de proteção a dados pessoais.
5. Build de produção e conferência no servidor local.
