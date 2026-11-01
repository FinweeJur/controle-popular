# Direitos Comparados - Documentação

## Visão Geral

O módulo **Direitos Comparados** é uma nova frente do Eixo 2 (Direitos em Movimento) do Controle Popular que permite comparar indicadores de direitos fundamentais entre diferentes estados, instituições e períodos. O sistema integra dados de diversas fontes governamentais para fornecer uma análise comparativa abrangente de desenvolvimento humano, educação, saúde, justiça, trabalho e finanças públicas.

## Estrutura do Módulo

### 1. Direitos Comparados (`/direitos-comparados`)

**Hub principal** que organiza as três frentes principais:

- **Comparador de Indicadores**: Interface comparativa entre estados
- **Grupos de Pesquisa**: Análise de redes de cooperação científica
- **Universidades e Impacto**: Monitoramento de impacto social

### 2. Comparador de Indicadores (`/direitos-comparados/indicadores`)

**Funcionalidades:**
- Seleção de estados para comparação (máximo 5 estados)
- Seleção de períodos históricos (2020-2023)
- Escolha de dimensões de direitos (desenvolvimento, educação, saúde, justiça, trabalho, finanças)
- Tabela comparativa com formatação adequada para cada tipo de indicador
- Destaque visual para valores maiores (quando aplicável)

**Indicadores Disponíveis:**

#### Desenvolvimento Humano
- IDH geral e suas dimensões (renda, educação, longevidade)
- Coeficiente Gini
- PIB per capita e total
- Renda média
- Taxas de desemprego e informalidade

#### Educação
- IDEB (ensino fundamental e médio)
- Matrículas (pública e privada)
- Docentes e escolas
- Taxa de conclusão e distorção idade-série
- Densidade da rede escolar

#### Saúde
- Leitos hospitalares e estabelecimentos SUS
- Profissionais de saúde (médicos, enfermeiros)
- Cobertura vacinal e mortalidade infantil
- Internações e partos no SUS
- Unidades de Saúde da Família

#### Justiça
- Varas judiciais e defensorias públicas
- Delegacias especializadas
- Juízes por 100 mil habitantes
- Acesso à justiça e processos
- Decisões judiciais e recursos

#### Trabalho
- Formalização CAGED
- Emprego formal e informal
- Renda média e salário mínimo
- Programas de trabalho e aprendizes
- Microcrédito

#### Finanças Públicas
- Repasses federais
- Gastos em saúde e educação
- Arrecadação ICMS
- Dívida pública e superávit
- Transferências municipais

### 3. Grupos de Pesquisa (`/direitos-comparados/pesquisa`)

**Funcionalidades:**
- Mapeamento geográfico de grupos de pesquisa
- Análise de redes de cooperação institucional
- Indicadores de produção científica
- Evolução histórica dos grupos
- Vinculação com políticas públicas

**Indicadores:**
- Grupos por área do conhecimento e estado
- Pesquisadores, estudantes e técnicos
- Publicações, teses e patentes
- Projetos financiados
- Parcerias internacionais

### 4. Universidades e Impacto (`/direitos-comparados/universidades`)

**Funcionalidades:**
- Indicadores universitários sociais
- Monitoramento de impacto social
- Relações universidade-governo
- Avaliação de contribuição para políticas
- Mapeamento de extensão comunitária

**Dimensões de Impacto:**
- Educação básica
- Saúde comunitária
- Tecnologia e inovação
- Cultura e memória
- Meio ambiente
- Justiça social

## Fontes de Dados

### Fontes Oficiais

| Fonte | Sigla | Responsável | Área de Abrangência |
|-------|-------|-------------|-------------------|
| IBGE | IBGE | Governo Federal | Demográfica, econômica, social |
| INEP | INEP | MEC | Educação |
| Ministério da Saúde | MS | Governo Federal | Saúde |
| CNJ | CNJ | Poder Judiciário | Justiça |
| TSE | TSE | Poder Judiciário | Eleições |
| CNPq | CNPq | Governo Federal | Ciência e tecnologia |
| CAPES | CAPES | MEC | Pós-graduação |
| INPI | INPI | Governo Federal | Propriedade industrial |
| Portal da Transparência | Transparência | Governo Federal | Finanças públicas |

### Cobertura Temporal

- **Educação**: 2023 (IDEB 2022)
- **Saúde**: 2023 (CNES 2023)
- **IDH**: 2021 (estimativas 2022)
- **Finanças**: 2023 (Portal da Transparência)
- **Justiça**: 2023 (CNJ 2023)
- **Trabalho**: 2023 (CAGED 2023)

## Arquitetura Técnica

### Backend

#### Tipos e Interfaces (`lib/direitos-comparados/tipos.ts`)
- Definição completa dos tipos de dados
- Interfaces para estados, indicadores e comparações
- Configuração do sistema e limites

#### Lógica de Dados (`lib/direitos-comparados/dados.ts`)
- Carregamento e processamento de dados
- Funções de comparação e cálculos
- Formatação de valores e unidades
- Configuração de fontes e metadados

### Frontend

#### Componentes React
- `ComparadorIndicadores.tsx`: Interface principal de comparação
- Componentes reutilizáveis de UI
- Design system integrado ao projeto

#### Páginas Next.js
- App Router com páginas server-side
- Client components para interatividade
- SEO e acessibilidade

## Integração com o Sistema Existente

### Eixo 2 - Direitos em Movimento
O módulo se integra ao eixo existente através:
- Navegação estruturada entre subfrentes
- Compartilhamento de componentes de UI
- Consistência editorial e visual

### Banco de Dados
- Leitura de dados existentes (IBGE, CNES, etc.)
- Estrutura expandida para novos indicadores
- Suporte a dados históricos

### API Pública
- Novos endpoints para dados comparados
- Formatos JSON e CSV para exportação
- Documentação OpenAPI

## Metodologia e Qualidade dos Dados

### Tratamento de Dados
- Normalização de unidades de medida
- Preenchimento de lacunas declaradas
- Validação de consistência
- Rastreamento de fontes

### Precisão e Atualização
- Data de referência clara para cada indicador
- Frequência de atualização variável por fonte
- Indicação de estimativas vs. valores definitivos
- Taxa de erro quando aplicável

### Acessibilidade
- Design responsivo (mobile-first)
- Contraste WCAG AA
- Navegação por teclado
- Leitura de tela (TTS)

## Próximos Passos

### Fase 1 - Implementação Atual
- ✅ Estrutura básica do módulo
- ✅ Comparador de indicadores entre estados
- ✅ Dados de exemplo e formatação
- ✅ Integração com navegação existente

### Fase 2 - Expansão de Dados
- 🔄 Integração real com fontes oficiais
- 🔄 Atualização automática de dados
- 🔄 Adição de indicadores históricos
- 🔄 Exportação de dados em formatos abertos

### Fase 3 - Visualização Avançada
- 🔄 Gráficos comparativos interativos
- 🔄 Mapas geográficos com indicadores
- 🔄 Dashboards personalizáveis
- 🔄 Análise temporal e tendências

### Fase 4 - Análise Exploratória
- 🔄 Machine learning para padrões
- 🔄 Previsão de indicadores
- 🔄 Análise de correlação entre direitos
- 🔄 Relatórios automatizados

## Manutenção e Atualização

### Frequência de Atualização
- **Diária**: Dados de transparência
- **Mensal**: Indicadores sociais
- **Anual**: Censo e avaliações
- **Decadal**: Censo demográfico

### Monitoramento de Qualidade
- Verificação automática de dados
- Alertas de inconsistências
- Atualização de fontes esgotadas
- Documentação de mudanças metodológicas

## Contribuição

O módulo de Direitos Comparados é desenvolvido seguindo as mesmas diretrizes do projeto principal:

- Código aberto (AGPL-3.0)
- Dados públicos com fontes claras
- Acessibilidade como requisito
- Design centrado no usuário
- Transparência metodológica

Para contribuir, consulte o [README principal](/README.md) e as [regras do repositório](/AGENTS.md).