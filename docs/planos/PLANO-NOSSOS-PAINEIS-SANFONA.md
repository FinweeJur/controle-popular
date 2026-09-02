# Plano — Frentes "Nossos" + Painéis-Sanfona e Diálogo Inter-Frentes

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-02
> **Leitura estimada:** media (15-25 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [AGENTS.md](/AGENTS.md), [PLANO-SEU-NONO-NOTEBOOKLM.md](./PLANO-SEU-NONO-NOTEBOOKLM.md)
> **Palavras-chave:** nossos rios, nossas serras, animais, territorios, nossa gente, onsa, terras, paineis, sanfona, sidebar, dialogo entre frentes, interdisciplinar

## Sumário

- [Visão Geral e Objetivos](#visão-geral-e-objetivos)
- [Parte 1 — Modelo de Dados](#parte-1--modelo-de-dados)
- [Parte 2 — Contrato JSON de Exemplo](#parte-2--contrato-json-de-exemplo)
- [Parte 3 — Estrutura de Telas e Componentes React](#parte-3--estrutura-de-telas-e-componentes-react)
- [Parte 4 — Wireframes em ASCII](#parte-4--wireframes-em-ascii)
- [Parte 5 — Regras de Associação entre Frentes](#parte-5--regras-de-associação-entre-frentes)
- [Parte 6 — Priorização por Esforço](#parte-6--priorização-por-esforço)
- [Parte 7 — Riscos Editoriais e Ressalvas](#parte-7--riscos-editoriais-e-ressalvas)
- [Parte 8 — Critérios de Aceite](#parte-8--critérios-de-aceite)

---

## 🌟 Visão Geral e Objetivos

O **Controle Popular** reúne dados oficiais e públicos de seis frentes de fiscalização cívica:
1. **Cidades:** contratos, contas municipais, câmaras e serviços locais.
2. **Congresso Nacional:** tramitação legislativa, bancadas e emendas.
3. **Judiciário:** tribunais, processos estruturantes e vacância.
4. **Função Social da Terra:** malha fundiária, CAR, quilombos e posse.
5. **Paraopeba:** reparação judicial do desastre de Brumadinho.
6. **ONSA (Observatório Nacional Socioambiental):** licenciamento, barragens, COPAM e clima.

### 🧩 O problema atual
Hoje, cada frente vive em uma página isolada.
O usuário em uma cidade (ex.: Diamantina) não sabe que o parque vizinho está em leilão de concessão no Executivo ou citado em projetos de lei no Congresso.

### 💡 A solução dos painéis-sanfona
Transformar o portal em um **acordeão vivo e interligado**.
Páginas locais e temáticas apresentam seus próprios dados e sugerem ativamente pontes para as demais frentes em uma gaveta lateral (*sidebar* sanfona).
Além disso, o **ONSA** passa a abrigar formalmente a dimensão de **terras e território**, acolhendo a família de subfrentes **"Nossos"**:
- **Nossos Rios** (bacias, outorgas, barragens e pescadores);
- **Nossas Serras** (relevo, unidades de conservação e mineração);
- **Nossos Animais** (fauna ameaçada e corredores ecológicos);
- **Nossos Territórios** (terras indígenas, quilombos, cerrados e vales);
- **Nossa Gente** (impactos sociais, trabalho tradicional, cultura e saúde comunitária).

Todas as páginas socioambientais passam a terminar com o bloco obrigatório **"E o social?"** e recebem as etiquetas fixas `natureza` e `ecossistema`.

---

## 📐 Parte 1 — Modelo de Dados

### 💡 Analogia do modelo
Pense no modelo como uma **estação central de trens**:
- Os **Lugares** são as estações (um rio, uma serra, um município).
- As **Pontes** são as linhas de trilho que ligam uma plataforma (frente A) a outra plataforma (frente B), sempre com uma placa explicando o motivo da viagem.

### 🗂️ Integração Territorial: ONSA abraça Meio Ambiente e Terras
O **ONSA** evolui de um observatório puramente biofísico para a casa integral do socioambiental e territorial.
A frente `/funcaosocialterra` passa a ser a âncora fundiária de ONSA (`/ambiental/nossos-territorios`), conectando a posse da terra ao bioma e aos direitos coletivos.

### 📝 Schema TypeScript central (`lib/lugares.ts` e `lib/dialogos.ts`)

```ts
/**
 * Tipos de lugares reconhecidos pelo portal.
 * Abrange divisões administrativas e recortes biofísicos/culturais.
 */
export type TipoLugar =
  | "municipio"
  | "rio"
  | "serra"
  | "vale"
  | "cerrado"
  | "unidade_conservacao"
  | "territorio_quilombola"
  | "terra_indigena";

/**
 * Frentes e fontes oficiais conectadas no portal.
 */
export type FrenteId =
  | "cidades"
  | "congresso"
  | "judiciario"
  | "ambiental"        // ONSA: meio ambiente e terras integrados
  | "paraopeba"
  | "executivo_estadual"
  | "terras";            // Rota legada mantida como alias para ONSA Territórios

/**
 * Nível de confiança da correlação editorial.
 * - fato_documentado: vínculo formal expresso em lei, ato público ou cartografia oficial.
 * - sinal_investigacao: correlação geoespacial ou temática que aponta hipótese de controle social.
 */
export type NivelConfianca = "fato_documentado" | "sinal_investigacao";

/**
 * Tags semânticas obrigatórias e livres do lugar.
 */
export type TagLugar = "natureza" | "ecossistema" | string;

/**
 * Registro de uma Ponte Inter-Frentes (o diálogo sanfona).
 */
export interface PonteEntreFrentes {
  id: string;
  frenteOrigem: FrenteId;
  rotaOrigem: string;        // ex: "/diamantina"
  frenteDestino: FrenteId;
  rotaDestino: string;       // ex: "/ambiental/nossas-serras/biribiri"
  rotuloAmigavel: string;    // Texto claro do botão de ação
  topico: string;            // ex: "Parque Estadual do Biribiri"
  razaoEditorial: string;    // Por que esta ponte existe na perspectiva cidadã
  nivelConfianca: NivelConfianca;
  ressalva?: string;         // Aviso expresso para evitar inferências falsas
  fonteOficial?: string;     // Órgão de origem do vínculo (ex: "IEF-MG", "ALMG", "ANM")
}

/**
 * Registro de um Lugar no acervo do portal.
 */
export interface RegistroLugar {
  id: string;                // Slug único (ex: "serra-do-espinhaco")
  nome: string;              // Nome em português comum (ex: "Serra do Espinhaço")
  tipo: TipoLugar;
  tags: TagLugar[];          // Contém obrigatoriamente "natureza" e "ecossistema"
  biomas: string[];          // ex: ["Cerrado", "Mata Atlântica"]
  baciasHidrograficas?: string[]; // ex: ["Bacia do Rio São Francisco", "Bacia do Rio Jequitinhonha"]
  municipiosIbge: string[];  // Códigos IBGE das cidades que interceptam o lugar
  unidadesConservacao?: string[]; // Nomes das UCs vinculadas
  temMineracao: boolean;     // Se há títulos minerários ativos no polígono
  temQuilombo: boolean;      // Se há comunidades quilombolas registradas
  resumoVozCidada: string;   // Explicação simples e direta sobre o lugar
  pontes: PonteEntreFrentes[]; // Pontes ativas (máximo de 3 em destaque por tela)
}
```

### 🗺️ Exemplos reais de Minas Gerais mapeados no modelo

1. **Rio Paraopeba:**
   - Tipo: `rio`
   - Tags: `["natureza", "ecossistema", "bacia-hidrografica", "aguas"]`
   - Bacia: Bacia do Rio São Francisco
   - Cidades: Brumadinho, Betim, Mário Campos, São Joaquim de Bicas, Juatuba, Pompéu
   - Pontes: Frente Paraopeba (acordo judicial de Brumadinho) e ONSA (outorgas do IGAM e barragens a montante).

2. **Rio Doce:**
   - Tipo: `rio`
   - Tags: `["natureza", "ecossistema", "reparacao", "calha-fluvial"]`
   - Bacia: Bacia do Rio Doce
   - Cidades: Mariana, Governador Valadares, Ipatinga, Resplendor
   - Pontes: Frente ONSA (desastre do Fundão / Renova) e Judiciário (repactuação federal na 4ª Vara de BH).

3. **Rio das Velhas:**
   - Tipo: `rio`
   - Tags: `["natureza", "ecossistema", "abastecimento-metropolitano"]`
   - Cidades: Ouro Preto, Nova Lima, Belo Horizonte, Sabará, Curvelo
   - Pontes: Cidades (captação de Bela Fama / COPASA) e ONSA (licenciamento de minerodutos no Quadrilátero Ferrífero).

4. **Rio Jequitinhonha:**
   - Tipo: `rio`
   - Tags: `["natureza", "ecossistema", "semiarido", "patrimonio-vivo"]`
   - Cidades: Diamantina, Itinga, Araçuaí, Coronel Murta
   - Pontes: ONSA Territórios (Vale do Lítio) e Cidades (segurança hídrica e caminhões-pipa).

5. **Serra do Espinhaço:**
   - Tipo: `serra`
   - Tags: `["natureza", "ecossistema", "reserva-da-biosfera", "divisor-de-aguas"]`
   - Cidades: Diamantina, Serro, Conceição do Mato Dentro, Catas Altas
   - Pontes: ONSA (Parque do Biribiri / UCs) e Cidades (royalties de CFEM da mineração).

6. **Serra do Cipó:**
   - Tipo: `serra`
   - Tags: `["natureza", "ecossistema", "campo-rupestre", "parque-nacional"]`
   - Cidades: Santana do Riacho, Jaboticatubas, Morro do Pilar
   - Pontes: ONSA (PARNA Cipó / ICMBio) e Congresso (projetos de ampliação de rodovias turísticas).

7. **Serra da Piedade:**
   - Tipo: `serra`
   - Tags: `["natureza", "ecossistema", "patrimonio-cultural-religioso", "monumento-natural"]`
   - Cidades: Caeté, Sabará
   - Pontes: ONSA (processos de tombamento e mineração no entorno) e Judiciário (ações civis públicas do MPMG).

8. **Vale do Jequitinhonha:**
   - Tipo: `vale`
   - Tags: `["natureza", "ecossistema", "artesanato-ceramica", "cultura-e-resistencia"]`
   - Cidades: Araçuaí, Itinga, Medina, Pedra Azul
   - Pontes: ONSA Nossos Territórios (impacto de projetos de lítio) e Cidades (repasse do Fundo de Participação e emprego).

9. **Cerrado:**
   - Tipo: `cerrado`
   - Tags: `["natureza", "ecossistema", "berco-das-aguas", "savana-biodiversa"]`
   - Cidades: Januária, Montes Claros, Buritizeiro, Curvelo
   - Pontes: ONSA (desmatamento e autos de infração do IBAMA/IEF) e Congresso (Proposta de Emenda Constitucional do Cerrado Patrimônio Nacional).

---

## 📦 Parte 2 — Contrato JSON de Exemplo

### 🏔️ Exemplo (A): Lugar — Serra do Espinhaço

```json
{
  "id": "serra-do-espinhaco",
  "nome": "Serra do Espinhaço",
  "tipo": "serra",
  "tags": [
    "natureza",
    "ecossistema",
    "reserva-da-biosfera",
    "divisor-de-aguas",
    "campo-rupestre"
  ],
  "biomas": [
    "Cerrado",
    "Mata Atlântica"
  ],
  "baciasHidrograficas": [
    "Bacia do Rio São Francisco",
    "Bacia do Rio Doce",
    "Bacia do Rio Jequitinhonha"
  ],
  "municipiosIbge": [
    "3121605",
    "3167103",
    "3117504",
    "3115300"
  ],
  "unidadesConservacao": [
    "Parque Estadual do Biribiri",
    "Parque Nacional da Serra do Cipó",
    "Parque Estadual do Itacolomi",
    "Parque Estadual da Serra do Rola-Moça"
  ],
  "temMineracao": true,
  "temQuilombo": true,
  "resumoVozCidada": "A Serra do Espinhaço é a única cordilheira do Brasil, guardiã de nascentes que abastecem três grandes bacias mineiras. Reúne campos rupestres únicos, comunidades quilombolas seculares e forte pressão de empreendimentos minerários.",
  "pontes": [
    {
      "id": "ponte-espinhaco-diamantina-biribiri",
      "frenteOrigem": "ambiental",
      "rotaOrigem": "/ambiental/nossas-serras/serra-do-espinhaco",
      "frenteDestino": "cidades",
      "rotaDestino": "/diamantina",
      "rotuloAmigavel": "Ver contratos e serviços de Diamantina, cidade polo do Alto Espinhaço",
      "topico": "Município polo e Parque do Biribiri",
      "razaoEditorial": "Diamantina concentra a gestão territorial, os leilões de concessão do Parque do Biribiri e as demandas de saúde e saneamento das vilas da serra.",
      "nivelConfianca": "fato_documentado",
      "ressalva": "Os orçamentos municipais de Diamantina cobrem a área urbana e distritos, mas a gestão do Parque Estadual é estadual (IEF).",
      "fonteOficial": "IBGE e IEF-MG"
    }
  ]
}
```

### 🌉 Exemplo (B): Ponte — Diamantina ➔ Biribiri ➔ ONSA + Executivo + Congresso

```json
{
  "topico": "Parque Estadual do Biribiri e Patrimônio Natural",
  "rotaOrigem": "/diamantina",
  "frenteOrigem": "cidades",
  "pontes": [
    {
      "id": "ponte-diamantina-biribiri-onsa",
      "frenteDestino": "ambiental",
      "rotaDestino": "/ambiental/nossas-serras/biribiri",
      "rotuloAmigavel": "Ver situação ecológica, fauna e mananciais do Biribiri no ONSA",
      "topico": "Unidade de Conservação e Preservação de Águas",
      "razaoEditorial": "O Parque Estadual do Biribiri protege os mananciais que abastecem Diamantina e abriga espécies ameaçadas do Cerrado.",
      "nivelConfianca": "fato_documentado",
      "ressalva": "A fiscalização ambiental é competência do IEF e da Polícia Ambiental, não da Guarda Municipal.",
      "fonteOficial": "IEF-MG (Cadastro Estadual de Unidades de Conservação)"
    },
    {
      "id": "ponte-diamantina-biribiri-executivo",
      "frenteDestino": "executivo_estadual",
      "rotaDestino": "/ambiental/licenciamento?filtro=biribiri",
      "rotuloAmigavel": "Acompanhar edital de concessão e uso público do parque no Governo de MG",
      "topico": "Projeto Estadual de Concessão Turística",
      "razaoEditorial": "O Governo do Estado incluiu as estruturas históricas e atrativos do Biribiri no Programa de Parcerias de Concessão de Parques.",
      "nivelConfianca": "fato_documentado",
      "ressalva": "A concessão transfere a gestão de bilheteria e atrativos turísticos; a conservação da biodiversidade e a titularidade da terra continuam sob responsabilidade do Estado.",
      "fonteOficial": "Diário Oficial do Estado de Minas Gerais (DOE-MG) / SEINFRA"
    },
    {
      "id": "ponte-diamantina-biribiri-congresso",
      "frenteDestino": "congresso",
      "rotaDestino": "/congresso?termo=unidades+de+conservacao+diamantina",
      "rotuloAmigavel": "Ver projetos de lei no Congresso e na ALMG sobre o Espinhaço",
      "topico": "Legislação e Recursos de Bancada para o Bioma",
      "razaoEditorial": "Parlamentares federais e estaduais destinam emendas para turismo sustentável e votam limites protetivos para a Serra do Espinhaço.",
      "nivelConfianca": "sinal_investigacao",
      "ressalva": "A autoria de uma proposta parlamentar não implica que os recursos já foram depositados ou que a lei foi sancionada.",
      "fonteOficial": "Câmara dos Deputados e Assembleia Legislativa de MG (ALMG)"
    }
  ]
}
```

---

## 🖥️ Parte 3 — Estrutura de Telas e Componentes React

### 🗺️ Catálogo de Rotas

| Rota | Frente | Função da tela |
|---|---|---|
| `/[municipio]` | Cidades | Contratos, receitas, saúde, câmara e gaveta sanfona de diálogos regionais |
| `/ambiental/nossos` | ONSA | Hub unificado socioambiental e territorial com os 5 recortes |
| `/ambiental/nossos-rios/[slug]` | ONSA | Página de rio: vazão, barragens, outorgas, fauna ictiológica e bloco social |
| `/ambiental/nossas-serras/[slug]` | ONSA | Página de serra: relevo, geodiversidade, unidades de conservação e mineração |
| `/ambiental/nossos-animais/[slug]` | ONSA | Página de espécie: bacia de ocorrência, nível de ameaça e degradação de habitat |
| `/ambiental/nossos-territorios/[slug]` | ONSA | Página de território (quilombos, vales, cerrados, assentamentos, terras públicas) |
| `/ambiental/nossa-gente/[slug]` | ONSA | Retratos de comunidades tradicionais, pescadores, ceramistas e trabalhadores |

### 🏛️ Anatomia das Páginas

#### 1. Página de Município (`/[municipio]`)
- **Cabeçalho Cívico:** nome da cidade, código IBGE, população e orçamento total.
- **Botão Gatilho do Diálogo:** badge visível `"Também acontece por aqui (X pontes)"`.
- **Blocos Locais:** despesas, saúde, educação, câmara e atas.
- **Sidebar Sanfona (PainelDialogo):** abre na lateral direita (ou como gaveta expansível no mobile), revelando os cartões de pontes com razão editorial e ressalvas.

#### 2. Página de Rio, Serra, Vale ou Cerrado (`/ambiental/nossos-*`)
- **Trilha de Navegação (Breadcrumb):** `ONSA > Nossos [Tipo] > [Nome do Lugar]`.
- **Faixa de Tags:** chips semânticos fixos `natureza`, `ecossistema` e tags específicas.
- **Número Protagonista com Fonte:** card de topo com o indicador mais urgente do local (ex.: extensão em km, outorgas emitidas, área preservada em hectares).
- **Gráfico Nativo SVG:** barras ou evolução temporal gerados via SVG puro sem biblioteca externa.
- **Tabela de Atos Oficiais:** lista filtrada por situação, órgão e ano, com botão de download CSV (separador `;` e BOM UTF-8).
- **Bloco "E o social?":** o fechamento da página, correlacionando o estado biofísico da natureza com a saúde, renda, moradia e cultura das pessoas locais.
- **Espaço Reservado de Voz:** marcador editorial para epígrafe ou verso da equipe interna.

#### 3. Bloco "E o social?"
- Focado nos determinantes sociais de saúde e vida:
  - **Água e Saúde Pública:** internações por doenças de veiculação hídrica ou respiratória no SIH-SUS.
  - **Trabalho e Subsistência:** registros de pescadores artesanais, agricultores familiares ou perda de renda pelo fechamento de atrativos naturais.
  - **Moradia e Segurança:** famílias vivendo em mancha de inundação, encosta de risco ou zona de autossalvamento (ZAS).
  - **Cultura e Identidade:** festividades tradicionais, saberes artesanais (ex.: barro do Jequitinhonha) e patrimônio imaterial.

#### 4. Sidebar Sanfona de Diálogo entre Frentes (`PainelDialogo`)
- **Acessibilidade:** componente com semântica WAI-ARIA (`aria-expanded`, navegação completa por teclado via Tab/Enter/Esc).
- **Limite Editorial:** exibe até 3 pontes ativas simultâneas para evitar sobrecarga cognitiva.
- **Cartão da Ponte:**
  1. Frente de destino em destaque (com cor e etiqueta da frente);
  2. Rótulo direto e humanizado;
  3. Razão editorial do vínculo;
  4. Selo de confiança (`Fato documentado` vs `Sinal de investigação`);
  5. Ressalva obrigatória em linguagem popular;
  6. Botão de clique único que direciona à URL exata da frente.

---

### 🌳 Árvore de Componentes React Reutilizáveis

```
apps/web/app/
├── [municipio]/
│   └── page.tsx
│       ├── TopNav
│       ├── HeaderMunicipio
│       ├── BotaoGatilhoSanfona (recebe total de pontes ativas)
│       ├── IndicadoresMunicipais
│       └── PainelDialogo (drawer sanfona lateral)
│           ├── CabecalhoDialogo
│           └── ListaPontes
│               └── CartaoPonteSanfona (recebe PonteEntreFrentes)
│                   ├── BadgeConfianca
│                   ├── RazaoEditorial
│                   ├── RessalvaCurada
│                   └── BotaoPonteLink
│
└── ambiental/
    └── nossos-[tipo]/[slug]/
        └── page.tsx
            └── PainelLugar (recebe RegistroLugar)
                ├── TrilhaNavegacao (Breadcrumbs)
                ├── HeroLugar (titulo, tags natureza e ecossistema)
                ├── NumeroProtagonista (valor, rotulo, fonte oficial)
                ├── GraficoDistribuicaoSvg (dados agregados inline)
                ├── TabelaEstatica (atos oficiais com CSV ; e BOM)
                ├── BlocoSocial (recebe DadosImpactoSocial)
                │   ├── CartaoSaudeAgua
                │   ├── CartaoRendaTrabalho
                │   ├── CartaoMoradiaRisco
                │   └── CartaoCulturaViva
                ├── EspacoEpigrafe (container para versos da redacao)
                └── PainelDialogo (sidebar sanfona com ate 3 pontes)
```

### 📋 Especificação de Props dos Componentes

#### `PainelLugar.tsx`
```tsx
interface PainelLugarProps {
  lugar: RegistroLugar;
  estatisticaPrincipal: {
    rotulo: string;
    valor: string;
    unidade?: string;
    fonte: string;
    dataMedicao: string;
  };
  dadosGrafico: { rotulo: string; valor: number }[];
  impactoSocial: DadosImpactoSocial;
}
```

#### `PainelDialogo.tsx`
```tsx
interface PainelDialogoProps {
  origemTitulo: string;
  origemRota: string;
  pontes: PonteEntreFrentes[];
  abertoInicialmente?: boolean;
  onFechar?: () => void;
}
```

#### `BlocoSocial.tsx`
```tsx
interface DadosImpactoSocial {
  populacaoAfetadaAprox: string; // Ex: "[ligar à fonte]"
  sinteseVidaHumana: string;
  saude: {
    indicador: string;
    descricao: string;
    fonte: string;
  };
  trabalhoERenda: {
    atividadePrincipal: string;
    vulnerabilidade: string;
    fonte: string;
  };
  moradia: {
    situacao: string;
    familiasRisco: string;
    fonte: string;
  };
  cultura: {
    manifestacao: string;
    ameacaOuPotencia: string;
    fonte: string;
  };
}

interface BlocoSocialProps {
  lugarNome: string;
  dados: DadosImpactoSocial;
}
```

#### `CartaoPonteSanfona.tsx`
```tsx
interface CartaoPonteSanfonaProps {
  ponte: PonteEntreFrentes;
}
```

---

## 🎨 Parte 4 — Wireframes em ASCII

### 🌊 Wireframe (A): Página do Rio Paraopeba (`/ambiental/nossos-rios/rio-paraopeba`)

```text
+---------------------------------------------------------------------------------------------------------+
| [LOGO CONTROLE POPULAR]   Cidades | Congresso | Judiciário | ONSA Meio Ambiente & Terras | Paraopeba   |
+---------------------------------------------------------------------------------------------------------+
| TRILHA: ONSA > Nossos Rios > Rio Paraopeba                                                              |
| TAGS: [natureza] [ecossistema] [bacia-rio-sao-francisco] [aguas-em-recuperacao]                        |
|                                                                                                         |
| ======================================================================================================= |
|  RIO PARAOPEBA — As Águas, a Lama e a Vida Ribanceira                                                   |
| ======================================================================================================= |
|                                                                                                         |
|  +-----------------------------+  +---------------------------------------+  +------------------------+ |
|  | NÚMERO PROTAGONISTA         |  | EVOLUÇÃO DAS OUTORGAS DE ÁGUA         |  | SANFONA DE DIÁLOGO     | |
|  | [ligar à fonte] km de leito |  | 2019: ||||||                          |  | (3 pontes interligadas)| |
|  | monitorado por 11 estações  |  | 2022: ||||||||||                      |  |                        | |
|  | Fonte: IGAM / fev-2026      |  | 2026: ||||||||||||||                  |  | > FRENTE PARAOPEBA     | |
|  +-----------------------------+  | Gráfico nativo inline SVG (sem lib)   |  |   Acompanhe o Acordo   | |
|                                   +---------------------------------------+  |   de Brumadinho, os R$ | |
|  [Espaço reservado para epígrafe/verso da equipe editorial]                  |   [ligar à fonte] bi e | |
|                                                                              |   as obras de calha.   | |
|  --------------------------------------------------------------------------- |   Razão: Reparação     | |
|  ATOS OFICIAIS E LICENÇAS NA BACIA DO PARAOPEBA                              |   judicial e auditoria | |
|  [Filtrar por Município v] [Filtrar por Situação v]   [BAIXAR PLANILHA CSV]  |   [Ver na frente ->]   | |
|  +--------------------+---------------------+-----------------+------------+ |                        | |
|  | Município          | Órgão / Ato         | Situação        | Ano        | | > ONSA TERRITÓRIOS     | |
|  | Brumadinho         | Copam nº [fonte]    | TAC vigente     | 2024       | |   Quilombos na bacia   | |
|  | Betim              | IGAM nº [fonte]     | Outorga vigil.  | 2025       | |   Razão: Comunidades   | |
|  | Pompéu             | Semad nº [fonte]    | Fiscalização    | 2026       | |   tradicionais ribeir. | |
|  +--------------------+---------------------+-----------------+------------+ |   [Ver na frente ->]   | |
|                                                                              |                        | |
|  --------------------------------------------------------------------------- | > CIDADES DA BACIA     | |
|  👥 E O SOCIAL? — COMO A CONDIÇÃO DO RIO AFETA A NOSSA GENTE                 |   16 municípios no     | |
|                                                                              |   entorno do rio.      | |
|  +-------------------------+ +-------------------------+ +-----------------+ |   Razão: Gestão urbana | |
|  | 🩺 ÁGUA E SAÚDE         | | 🎣 TRABALHO E RENDA     | | 🏡 MORADIA      | |   e captação de água.  | |
|  | Restrições de captação  | | Perda da pesca artesanal| | Comunidades     | |   [Ver na frente ->]   | |
|  | geram monitoramento de  | | e queda de renda rural  | | sob risco de    | |                        | |
|  | poços artesianos locais.| | no Baixo Paraopeba.     | | transbordamento.| |                        | |
|  | Fonte: SIH-SUS / Copasa | | Fonte: Emater / Colônias| | Fonte: Def.Civ.| |                        | |
|  +-------------------------+ +-------------------------+ +-----------------+ +------------------------+ |
+---------------------------------------------------------------------------------------------------------+
```

---

### 🏛️ Wireframe (B): Página de Diamantina com Sidebar Sanfona Aberta (`/diamantina`)

```text
+---------------------------------------------------------------------------------------------------------+
| [LOGO CONTROLE POPULAR]   Cidades > Minas Gerais > Diamantina (Código IBGE: 3121605)                    |
+---------------------------------------------------------------------------------------------------------+
| RECEITA TOTAL 2026: R$ [ligar à fonte]  |  POPULAÇÃO: [ligar à fonte] hab. (Censo)                      |
|                                                                                                         |
| CONTEÚDO DA PÁGINA MUNICIPAL                || GAVETA SANFONA: DIÁLOGO ENTRE FRENTES   [X Fechar]       |
| ------------------------------------------- || ======================================================== |
| 📊 RESUMO DE GASTOS DA PREFEITURA           || 💡 TAMBÉM ACONTECE POR AQUI                              |
| - Educação: [ligar à fonte]%                || O que outras frentes públicas dizem sobre este local:    |
| - Saúde: [ligar à fonte]%                   ||                                                          |
| - Obras e Urbanismo: [ligar à fonte]%       || 🌳 1. PARQUE ESTADUAL DO BIRIBIRI                       |
|                                             ||    Frente: ONSA (Meio Ambiente & Terras)                 |
| 📜 ÚLTIMOS CONTRATOS LICITADOS              ||    Ação: "Ver conservação, flora e fauna do Biribiri"    |
| 1. Transporte escolar distrital             ||    Por que mostramos isso: Protege os mananciais que     |
| 2. Manutenção de calçamento histórico       ||    abastecem Diamantina e as cachoeiras do Sentinela.    |
| [Ver todos os contratos ->]                 ||    Confiança: [Fato Documentado]                         |
|                                             ||    Ressalva: A gestão da unidade é estadual (IEF),       |
| 🏛️ CÂMARA MUNICIPAL DE DIAMANTINA          ||    não municipal.                                        |
| 11 vereadores em exercício                  ||    [Abrir Parque do Biribiri no ONSA ->]                 |
| Pauta da semana: Plano Diretor Distrital    ||                                                          |
|                                             || 🏛️ 2. CONCESSÃO TURÍSTICA DO BIRIBIRI                  |
| 👥 SAÚDE PÚBLICA E ATENÇÃO BÁSICA           ||    Frente: Executivo Estadual                            |
| 2 hospitais polo, [ligar à fonte] UBSs      ||    Ação: "Acompanhar edital de parceria privada"         |
|                                             ||    Por que mostramos isso: O governo de MG colocou o     |
|                                             ||    parque no plano estadual de parcerias e concessões.   |
|                                             ||    Confiança: [Fato Documentado]                         |
|                                             ||    Ressalva: A concessão abrange uso turístico; a terra  |
|                                             ||    continua pública e protegida por lei ambiental.       |
|                                             ||    [Ver Edital no Executivo ->]                          |
|                                             ||                                                          |
|                                             || 📜 3. PROJETOS NO CONGRESSO SOBRE O ESPINHAÇO            |
|                                             ||    Frente: Congresso Nacional                            |
|                                             ||    Ação: "Ver leis e emendas federais para a região"     |
|                                             ||    Por que mostramos isso: Propostas debatem mineração   |
|                                             ||    e preservação na cordilheira do Espinhaço.            |
|                                             ||    Confiança: [Sinal de Investigação]                    |
|                                             ||    Ressalva: Projeto em tramitação não é lei em vigor.   |
|                                             ||    [Ver Proposições do Congresso ->]                     |
+---------------------------------------------------------------------------------------------------------+
```

---

## 🧭 Parte 5 — Regras de Associação entre Frentes

### 📋 Tabela Editorial de Pontes Inter-Frentes

> **Regra de Ouro Editorial:** No máximo **3 pontes ativas por página**. Menos é mais: o usuário precisa de um caminho nítido, não de um labirinto. Toda ponte exige **Razão Editorial** clara e **Ressalva Obrigatória** para afastar inferências indevidas.

| Gatilho / Cenário | Origem (De onde vem) | Destino (Para onde vai) | Rótulo Amigável na Tela | Razão Editorial da Associação | Nível de Confiança | Ressalva Obrigatória |
|---|---|---|---|---|---|---|
| **Rio com barragens** | ONSA: Nossos Rios (`/ambiental/nossos-rios/[rio]`) | ONSA: Barragens (`/ambiental/barragens`) | "Conferir barragens cadastradas na bacia" | Estruturas de contenção a montante influenciam a segurança hídrica das cidades e a qualidade da água do leito. | Fato documentado | Estar cadastrada no SIGBM não significa risco iminente de rompimento. |
| **Serra com mineração** | ONSA: Nossas Serras (`/ambiental/nossas-serras/[serra]`) | Cidades (`/[municipio]`) | "Ver receitas de mineração (CFEM) do município" | A extração mineral na encosta gera arrecadação tributária municipal e demanda serviços de infraestrutura viária. | Fato documentado | O valor de CFEM arrecadado não compensa automaticamente perdas ecológicas locais. |
| **Cerrado com desmatamento** | ONSA: Nossos Territórios (`/ambiental/nossos-territorios/cerrado`) | ONSA: IBAMA (`/ambiental/ibama`) | "Ver autos de infração e embargos no Cerrado" | O Cerrado sofre taxas aceleradas de supressão vegetal, com registros de fiscalização federal e multas. | Fato documentado | Auto de infração é registro fiscalizatório; cabe recurso legal do autuado perante o órgão. |
| **Território quilombola com mineração** | ONSA: Territórios (`/ambiental/nossos-territorios/[quilombo]`) | Judiciário (`/judiciario`) | "Ver ações fundiárias e conflitos no Tribunal" | Sobreposições de títulos minerários ou fazendas em terras tradicionais desaguam em ações civis públicas na Justiça. | Fato documentado | A existência de ação judicial indica litígio em curso; não substitui decisão definitiva transitada em julgado. |
| **Vale com seca** | ONSA: Nossos Territórios (`/ambiental/nossos-territorios/[vale]`) | Cidades: Defesa Civil (`/[municipio]/defesa-civil`) | "Ver decretos de emergência por estiagem" | O regime hidrológico do semiárido condiciona as cotas de caminhões-pipa e os pedidos de verba emergencial do município. | Fato documentado | O decreto de emergência é ato formal para destravar verbas; não atesta que 100% da população esteja desabastecida. |
| **Cidade com emenda federal** | Cidades (`/[municipio]`) | Congresso: Emendas (`/congresso/emendas`) | "Ver quais deputados destinaram emendas à cidade" | Recursos federais indicados por parlamentares compõem fatia substantiva dos investimentos municipais em saúde e obras. | Fato documentado | Destinação de emenda indica indicação orçamentária; o pagamento efetivo depende da liberação do Executivo. |
| **Diamantina × Biribiri** | Cidades (`/diamantina`) | ONSA + Executivo + Congresso | "Ver Parque do Biribiri, projeto de concessão e leis" | Conecta o cotidiano da cidade histórica aos debates estaduais de concessão do parque e federais sobre o Espinhaço. | Fato documentado | Concessão de uso público transfere serviços turísticos; não transfere a titularidade pública do parque. |

---

## 🪜 Parte 6 — Priorização por Esforço

```
Onda 1: Fundação Barata (Rápida e leve)
   ↓
Onda 2: Voz e Poesia (Identidade e afeto cívico)
   ↓
Onda 3: Escala e Automatização (Expansão estrutural)
```

### 🌊 Onda 1 — Fundação Barata (Custo Pequeno | Valor Alto)
- **Objetivo:** Estabelecer a infraestrutura de dados e a primeira prova de conceito visual sem criar novas dependências no servidor.
- **Micro-etapas:**
  1. **Contratos TypeScript:** Criar `lib/lugares.ts` e `lib/dialogos.ts` com o schema consolidado e as primeiras 10 pontes estáticas. (Esforço: **Pequeno** | Valor: **Alto**)
  2. **Componente `PainelDialogo`:** Desenvolver a gaveta sanfona com HTML semântico, CSS puro e acessibilidade WAI-ARIA. (Esforço: **Pequeno** | Valor: **Altíssimo**)
  3. **Piloto em Diamantina (`/diamantina`):** plugar a sidebar sanfona conectando Diamantina ao Biribiri. (Esforço: **Pequeno** | Valor: **Alto**)
  4. **Unificação de Rotas:** Registrar o ONSA como a casa oficial de meio ambiente e território (`/ambiental`), preservando `/funcaosocialterra` via redirect estático. (Esforço: **Pequeno** | Valor: **Médio**)

### 🌿 Onda 2 — Voz e Poesia (Custo Pequeno a Médio | Valor Altíssimo)
- **Objetivo:** Dar cara, alma e afeto comunitário às páginas socioambientais, ancorando a denúncia na realidade de quem vive no local.
- **Micro-etapas:**
  1. **Hub `/ambiental/nossos`:** Tela de acolhimento com os 5 cards (Rios, Serras, Animais, Territórios e Gente). (Esforço: **Médio** | Valor: **Alto**)
  2. **Componente `BlocoSocial` ("E o social?"):** Módulo padronizado de cruzamento biofísico × vida real (saúde, renda, moradia, cultura). (Esforço: **Médio** | Valor: **Altíssimo**)
  3. **Páginas Piloto da Coleção "Nossos":**
     - Rio Paraopeba (`/ambiental/nossos-rios/rio-paraopeba`)
     - Serra do Espinhaço (`/ambiental/nossas-serras/serra-do-espinhaco`)
     - Vale do Jequitinhonha (`/ambiental/nossos-territorios/vale-do-jequitinhonha`) (Esforço: **Médio** | Valor: **Altíssimo**)
  4. **Espaço Editorial para Poesia:** Distribuição equilibrada de espaços para epígrafes e versos da equipe editorial, sem cortar nenhum poema do acervo. (Esforço: **Pequeno** | Valor: **Alto**)

### 🚀 Onda 3 — Escala e Automatização (Custo Médio a Grande | Valor Altíssimo)
- **Objetivo:** Universalizar a interligação das 6 frentes para centenas de cidades e lugares mapeados em lote.
- **Micro-etapas:**
  1. **Rotas Dinâmicas de Lugares:** Gerar páginas estáticas via App Router (`[tipo]/[slug]`) a partir de índices JSON compactados. (Esforço: **Grande** | Valor: **Altíssimo**)
  2. **Mapeador Geográfico Automático:** Cruzar código IBGE da cidade com bacias e serras para gerar as 3 pontes automaticamente sem curadoria manual para cada um dos 853 municípios de MG. (Esforço: **Grande** | Valor: **Altíssimo**)
  3. **Verificação Automatizada de Links e Payload:** Garantir em CI que nenhuma ponte aponte para rota inexistente (404) e que o bundle gzip respeite o teto de 3 MiB por rota na Cloudflare. (Esforço: **Médio** | Valor: **Crítico**)

---

## 🛡️ Parte 7 — Riscos Editoriais e Ressalvas

> ⚠️ **A Regra Central do Controle Popular:** Insinuação é dano, mesmo quando cada dado isolado está certo. Publicar dois dados verdadeiros lado a lado nunca pode induzir o cidadão a uma falsa causalidade.

### 🔍 Casos Reais e Redações Oficiais de Ressalvas

#### 1. Repasse Financeiro do Acordo × Município Atingido por Barragem
- **Risco:** O leitor vê que um município recebeu repasse do Acordo Judicial de Brumadinho e conclui que a lama passou dentro da cidade. Na realidade, 827 das 853 cidades de MG receberam verbas de fortalecimento de serviços públicos sem terem sido tocadas pela calha do rejeito.
- **Ressalva Curta Obrigatória:**
  > 📌 *"Receber repasse do Acordo de Reparação não significa que a lama atingiu a cidade. A lei distribuiu verbas para apoiar serviços públicos em todo o Estado de Minas Gerais."*

#### 2. Edital de Concessão de Parque Estadual × Venda/Privatização da Natureza
- **Risco:** O leitor lê "concessão do Parque do Biribiri" e conclui que o patrimônio público foi vendido para uma mineradora ou construtora privada.
- **Ressalva Curta Obrigatória:**
  > 📌 *"Concessão de parque transfere a gestão de bilheteria e serviços de apoio ao turista. A terra continua pública e a preservação ecológica segue sob fiscalização do Estado (IEF)."*

#### 3. Mineração na Serra × Dano em Toda a Cidade
- **Risco:** A página de uma serra lista outorgas de mineração e o cidadão deduz que a água do município inteiro está envenenada ou que todas as barragens vão romper.
- **Ressalva Curta Obrigatória:**
  > 📌 *"A presença de licença mineral atesta autorização legal de lavra ou pesquisa. Não representa, por si só, irregularidade ambiental ou risco iminente de rompimento."*

#### 4. Proposta de Lei Tramitando × Lei em Vigor
- **Risco:** A ponte para o Congresso mostra um Projeto de Lei alterando a demarcação de uma área de preservação e o usuário pensa que a área já perdeu a proteção.
- **Ressalva Curta Obrigatória:**
  > 📌 *"Projeto de Lei em tramitação é proposta em debate entre parlamentares. Não tem força de lei e pode ser alterado ou rejeitado antes da votação final."*

#### 5. Indicador Ambiental Ruim × Dado de Saúde Pública Municipal
- **Risco:** Colocar lado a lado uma mancha de turbidez no rio e o total de internações hospitalares da cidade sugere vínculo médico imediato sem comprovação epidemiológica.
- **Ressalva Curta Obrigatória:**
  > 📌 *"Os dados hospitalares refletem o total geral de internações do SUS na região. A relação direta entre a qualidade da água e uma doença específica exige laudo médico e pericial."*

---

## 🎯 Parte 8 — Critérios de Aceite

Os critérios abaixo devem ser testados em linguagem de usuário e validados em homologação antes da publicação:

1. **Navegabilidade em Dois Cliques:**
   - *Cenário:* Um usuário na página de Diamantina (`/diamantina`) clica no gatilho do Parque do Biribiri na sidebar sanfona.
   - *Critério:* No primeiro clique a gaveta expande revelando a ponte; no segundo clique ele é transportado para a rota ecológica do Biribiri no ONSA ou para o Projeto de Lei no Congresso.

2. **Presença Universal do Bloco "E o Social?":**
   - *Cenário:* Qualquer página das subfrentes "Nossos" (Rios, Serras, Animais, Territórios e Gente) é carregada no navegador.
   - *Critério:* A página exibe obrigatoriamente, antes do rodapé, a seção `"E o social?"` contendo dados explícitos de saúde, moradia, trabalho ou cultura, sem campos vazios não rotulados.

3. **Garantia Anti-Insinuação com Ressalva Visível:**
   - *Cenário:* O usuário inspeciona qualquer cartão de diálogo inter-frentes no painel lateral.
   - *Critério:* O cartão apresenta o nível de confiança (`Fato documentado` ou `Sinal de investigação`), a razão editorial e a ressalva em texto simples, sem termos jurídicos obscuros.

4. **Transparência de Lacuna e Vínculo com a Fonte:**
   - *Cenário:* O usuário passa o mouse ou navega via teclado sobre os números protagonistas e indicadores das páginas.
   - *Critério:* Todo número exibe a fonte oficial e a data da medição. Onde a fonte não disponibilizou o dado, a tela declara explicitamente `"Informação não disponível na fonte oficial"`, jamais inventando um valor.

5. **Acessibilidade e Desempenho Arquitetural:**
   - *Cenário:* O painel sanfona é acessado por teclado (Tab, Enter, Espaço, Esc) e inspecionado quanto ao peso de payload.
   - *Critério:* O painel abre e fecha por teclado com foco gerenciado e suporte a leitores de tela (`aria-expanded`). O bundle de JavaScript gerado para a rota não ultrapassa o limite de 3 MiB gzip e não utiliza bibliotecas pesadas de gráficos externos (usando apenas SVG nativo).
