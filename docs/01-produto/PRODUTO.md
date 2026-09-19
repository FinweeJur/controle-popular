# PRODUTO — o que é o portal, frentes e regras editoriais

> **Tipo:** PRODUTO
> **Domínio:** global
> **Última medição:** 2026-09-19
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md)
> **Palavras-chave:** portal, frentes, regras editoriais, acessibilidade, cidades, congresso, judiciario, ambiental, paraopeba, onsa, tts

## Sumário

- [Propósito](#propósito)
- [Quem lê, e o que isso exige](#quem-lê-e-o-que-isso-exige)
- [As seis frentes](#as-seis-frentes)
- [Features principais](#features-principais)
- [Regras editoriais](#regras-editoriais)
- [Números que importam](#números-que-importam)

## Propósito

Portal independente de transparência pública, no ar em controlepopular.com.br.
Reúne o dado oficial que já é público, mas vive espalhado em dezenas de
sistemas. Publica tudo em uma tela só, por cidade e por tema, em português comum.

## Quem lê, e o que isso exige

O leitor está sob estresse — denúncia, remoção, barragem.
Três consequências de qualidade, nesta ordem:

1. **Acessibilidade não é opcional.** Leitura em voz alta (TTS), teclado,
   três temas, contraste medido por regra WCAG (a norma de acessibilidade
   da web). Quando "ouvir esta página" fala a página, o **microresumo**
   (frase que descreve o que a página contém) vem primeiro.
2. **Número errado é dano.** Todo número exibido tem fonte identificável.
   Estimativa exibe a taxa de erro ao lado.
3. **Insinuação é dano.** Dois dados verdadeiros lado a lado não levam a
   conclusão que a fonte não autoriza.

## As seis frentes

| Frente | Rota | O que responde |
|---|---|---|
| Cidades | `/betim`, `/bh`, `/sp`, `/aracuai`, `/diamantina`, `/itinga` | Para onde vai o dinheiro da prefeitura; o que a câmara vota |
| Congresso | `/congresso` | Proposições federais por tema; análise de direitos; ofício em PDF |
| Judiciário | `/judiciario` | Composição de tribunais, vacância por idade, indicações |
| Função Social da Terra | `/funcaosocialterra` | Quanto do território não tem imóvel no CAR, no globo 3D |
| Paraopeba | `/paraopeba` | A reparação de Brumadinho: clipping, linha do tempo, documentos |
| ONSA / Ambiental | `/ambiental` | Licenciamento, barragens, legislação, COPAM, Mariana |

Rotas completas por frente, confirmadas no código:

- **Cidades** — `/[municipio]/prefeitura`, `/camara`, `/saude`, `/educacao`,
  `/economia`, `/mineracao`, `/terras`, `/meio-ambiente`, `/noticias`,
  `/servicos`, `/metodologia`. A cobertura varia por cidade;
  **a diferença é mostrada, nunca escondida**.
- **Congresso** — `/proposicoes`, `/parlamentares`, `/bancadas`, `/comissoes`,
  `/votacoes`, `/alertas`, `/bons-exemplos`, `/agenda`, `/metodologia`.
- **Judiciário** — `/tribunais`, `/vagas`, `/indicacoes`, `/sirenejud`,
  `/metodologia`.
- **Função Social da Terra** — `/mapa` (globo 3D), `/alertas`.
- **Paraopeba** — `/clipping`, `/linha-do-tempo`, `/auxilio`, `/documentos`,
  `/auditoria`, `/quem-atua`, `/entenda`, `/biblioteca`, `/execucao`.
- **ONSA** — `/copam`, `/licenciamento`, `/barragens`, `/legislacao`,
  `/direito-critico`, `/patrimonio-cultural`, `/mariana`, `/judiciario`,
  `/paraopeba/vale`.

## Features principais

| Feature | Onde | Nota |
|---|---|---|
| Painéis por município | rotas das 6 cidades | Dados com fonte e lacunas declaradas |
| Tabelas Estáticas | listas grandes | > 2 mil linhas: índice fatiado ou paginação no servidor — regra completa em [AGENTS.md § 5.1](/AGENTS.md#5.1-coleção-nunca-como-props-de-componente-de-cliente) |
| Alertas de contrato | contratos de Cidades | Duas categorias: violação legal (dispositivo citado) e heurística (com ressalva) |
| Busca e assistente | `/busca`, `/assistente` | Índice de texto sobre todo o acervo; navegação determinística, sem modelo |
| Seu Nonô (IA) | widget flutuante | RAG (busca sobre acervo + geração) com citação clicável, ressalva sempre visível — plano: [`planos/PLANO-SEU-NONO-NOTEBOOKLM.md`](../planos/PLANO-SEU-NONO-NOTEBOOKLM.md) |
| "Ouvir esta página" (TTS) | botão na navbar, leitura flutuante | Lê **primeiro o microresumo** do top-100 (`apps/web/lib/resumos-top100.ts`), depois o conteúdo — a pessoa sabe onde está já na primeira frase |
| Globo 3D | `/funcaosocialterra/mapa` | Camadas geográficas; 8 camadas do rompimento de Brumadinho |
| API pública v1 | `/api`(, `/api/v1/`) | Agregados em JSON aberto, sem chave, Swagger UI |
| Painel de edição | `/[municipio]/admin` (local, porta 3028) | Editar conteúdo sem tocar em código |

**Lacunas declaradas são conteúdo, não defeito escondido.** Principais hoje:
votações nominais zeradas no banco; diário oficial sem coleta municipal;
69 de 252 magistrados com data de nascimento; camada de terras devolutas
publicada vazia (o INCRA não publica a base — a ausência é o achado).

## Regras editoriais

A régua do projeto inteiro:

- **O número vem do dado; o modelo, se houver, só embrulha.** Resumo gerado
  por modelo é o portal afirmando algo. Rotulado com data e modelo, nunca
  como conclusão do autor do documento.
- **Lacuna é informação.** A tela diz quantos itens vieram vazios.
- **A ressalva viaja colada ao número, ou o número não vai.** Origem da
  regra: `total_doado` da Rouanet é do Brasil inteiro.
- **Dois dados verdadeiros nunca devem levar a uma terceira conclusão fala.**
  Exemplo: 827 de 853 cidades não têm relação com a bacia do Paraopeba.
- **Estimativa publica taxa de erro ao lado.** Vazio cadastral: 30,0% de erro
  (amostra conferida no satélite); teto 33% é decisão declarada.
- **Unidade inteira sempre que houver.** "0,4 bilhões" é erro editorial;
  "400 milhões" é a forma certa. Igual: "0,2 milhões" → "200 mil".
- **Editais não poluem o feed.** Certames, licitações e pregões moram na rota
  `/editais`; o Blog (`/noticias`) e `/novidades` não os recebem.

## Números que importam

Medidos em 16/08 — **remeça antes de decidir com eles**:

| Número | O que é |
|---|---|
| 853 | municípios de MG na camada de divisas do globo |
| 8.570 | normas federais do MMA no acervo |
| 2,26 MB | dado dos 853 municípios compactado (`comunicabr-31.json`) |
| 1.471+ | páginas no último build; se 21, o banco não foi lido |

Como remedir cada um: script por script citados nos arquivos de origem
(disponíveis no `historico/`) e no [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md).

## Origem

Absorve (e substitui) os arquivos: `README.md` antigo, `APRESENTACAO.md` e
`PLANO-INTEGRACAO-BRUMADINHO.md` (em [`historico/`](../historico/)).
`docs/LEIA-PRIMEIRO.md` lido como contexto.
Revisão continua **ATIVA** em [`planos/REVISAO-UX-E-ONBOARDING.md`](../planos/REVISAO-UX-E-ONBOARDING.md).
