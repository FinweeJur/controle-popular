# Controle Popular

Portal independente de transparência pública: reúne o dado oficial que já é público, mas vive espalhado por dezenas de sistemas, e o publica em uma tela só, por cidade e por tema, em português comum — no ar em controlepopular.com.br.

## Quem lê, e o que isso exige

O leitor está sob estresse — denúncia, remoção, barragem. Três consequências de qualidade, nessa ordem:

1. **Acessibilidade não é opcional** — leitura em voz alta, navegação por teclado, três temas (claro, escuro, alto contraste), contraste medido por regra WCAG, número sempre ao lado da ressalva.
2. **Número errado é dano** — todo número exibido tem fonte identificável; todo número que resulta de estimativa publica a taxa de erro ao lado.
3. **Insinuação é dano, mesmo quando cada dado isolado está certo** — dois dados verdadeiros lado a lado nunca levam a uma conclusão que a fonte não autoriza.

## As seis frentes

| Frente | Rota | O que responde |
|---|---|---|
| Cidades | `/betim`, `/bh`, `/sp`, `/aracuai`, `/diamantina`, `/itinga` | Para onde vai o dinheiro da prefeitura e o que a câmara vota |
| Congresso | `/congresso` | Proposições federais por tema, comissão e bancada; análise de direitos; ofício em PDF |
| Judiciário | `/judiciario` | Composição dos sete tribunais, vacância por idade e indicações do Senado |
| Função Social da Terra | `/funcaosocialterra` (+ `/mapa`, `/alertas`) | Quanto do território não tem imóvel declarado no CAR, no globo 3D |
| Paraopeba | `/paraopeba` | A reparação de Brumadinho: clipping, linha do tempo, auxílio, documentos do processo |
| Ambiental | `/ambiental` | Pauta do COPAM, licenciamento, barragens, legislação e patrimônio cultural de MG |

Rotas principais por frente, confirmadas no código:

- **Cidades** — `/[municipio]/prefeitura` (contratos, licitações, despesas), `/camara` (proposições, vereadores), `/saude`, `/educacao`, `/economia`, `/mineracao`, `/terras`, `/meio-ambiente`, `/noticias`, `/servicos`, `/metodologia`. Cobertura varia por cidade e a diferença é mostrada, nunca escondida.
- **Congresso** — `/proposicoes`, `/parlamentares`, `/bancadas`, `/comissoes`, `/votacoes`, `/alertas`, `/bons-exemplos`, `/agenda`, `/metodologia`.
- **Judiciário** — `/tribunais`, `/vagas`, `/indicacoes`, `/metodologia`.
- **Função Social da Terra** — `/mapa` (o globo 3D), `/alertas`.
- **Paraopeba** — `/clipping` (radar de imprensa), `/linha-do-tempo`, `/auxilio`, `/documentos` (documentos do processo judicial por município), `/auditoria`, `/quem-atua`, `/entenda`, `/biblioteca`, `/execucao`.
- **Ambiental** — `/copam`, `/licenciamento`, `/barragens`, `/legislacao`, `/direito-critico`, `/patrimonio-cultural`.

## Principais features

| Feature | Onde | Nota |
|---|---|---|
| Painéis por município | `/betim`, `/bh`, `/sp`, `/aracuai`, `/diamantina`, `/itinga` | Seis cidades; cada uma com dezenas de seções, dados com fonte e lacunas declaradas |
| Tabelas estáticas | rotas pesadas de cada zona | Acima de ~2 mil linhas, serve-se do índice fatiado ou da tabela estática — nunca o corpus inteiro como prop de componente de cliente (teto de 25 MiB por asset) |
| Alertas de contrato | páginas de contratos de Cidades | Duas categorias, nunca uma: violação legal (com dispositivo citado) e heurística (sinal de investigação, com a ressalva de que não é prova) |
| Radar de notícias Paraopeba | `/paraopeba/clipping` | Itens dos últimos dias por fonte, com as fontes que vieram vazias declaradas |
| Busca e assistente | `/busca`, `/assistente` | Índice de texto sobre todo o acervo; o assistente navega para 241 destinos e não afirma nada — nenhum número é escrito por modelo de linguagem |
| Painel de edição | `/[municipio]/admin` | Edição de conteúdo sem tocar em código |
| Globo 3D | `/funcaosocialterra/mapa` | Dezenas de camadas geográficas, incluindo as oito do rompimento real de Brumadinho (SEMAD) e os documentos do processo por município |

**Lacunas declaradas são conteúdo, não defeito escondido.** As principais hoje: votações nominais do Congresso e de câmaras municipais zeradas no banco, diário oficial não coletado em nenhuma cidade, 69 de 252 magistrados com data de nascimento levantada, camada de terras devolutas reconhecidas publicada vazia (o INCRA não publica a base — a ausência é o achado).

## Regras editoriais

A régua que organiza o projeto inteiro, em resumo:

- **O número vem do dado; o modelo, se houver, só embrulha.** Resumo gerado por modelo é o portal afirmando algo: rotulado com data e modelo, e nunca apresentado como conclusão do autor do documento.
- **Lacuna é informação.** Publicar só o que tem valor faz a cobertura parecer completa; a tela diz quantos itens vieram vazios.
- **A ressalva viaja colada ao número, ou o número não vai.** O caso que gerou a regra: o total doado do acervo da Rouanet é do Brasil inteiro, e exibi-lo ao lado de um contrato municipal sugeriria que o dinheiro foi para ali.
- **Nunca dois dados verdadeiros lado a lado levando a conclusão falsa.** Exemplo real: 827 das 853 cidades de Minas não têm relação com a bacia do Paraopeba, e a tela diz com todas as letras que receber o valor do repasse não significa ter sido atingida.
- **Estimativa publica a taxa de erro ao lado do número.** O vazio cadastral medido tem taxa de erro de 30,0% (amostra conferida a olho sobre satélite), com o teto de 33% declarado como decisão, não como medição.

## Números que importam

Todas as medições abaixo foram refeitas em 16/08 contra o código (medição em 16/08 — remeça antes de decidir com ele):

| Número | O que é | Como remeça |
|---|---|---|
| 853 | municípios de MG na camada de divisas do globo | `node -e "const fs=require('fs');const f=JSON.parse(fs.readFileSync('apps/web/public/terras/globo/dados/camadas/municipios-mg.geojson','utf8'));console.log(f.features.length)"` |
| 8.570 | normas federais do MMA no acervo de legislação | `node -e "const f=require('./etl/betim/dados/legislacao-mma.json');console.log(f.linhas.length)"` |
| 2,26 MB | dado dos 853 municípios compactado para o build | `Get-Item apps/web/public/data/comunicabr-31.json \| Select-Object Length` |
| 1.471+ | páginas do último build — 21 significa banco não lido | `node -e "console.log(Object.keys(require('./.next/prerender-manifest.json').routes).length)"` |

## Origem

Este documento absorve e substitui os seguintes arquivos-fonte:

- `README.md` — absorvido (visão geral, operação, dados).
- `docs/_historico/APRESENTACAO.md` — absorvido (o que é, frentes, método, garantias, lacunas).
- `docs/planos/REVISAO-UX-E-ONBOARDING.md` — **ATIVO** (pendências abertas; segue em `docs/planos/`).
- `docs/_historico/PLANO-INTEGRACAO-BRUMADINHO.md` — **ENTREGUE** (camadas no globo, triagem e documentos do processo implementados; vai para `docs/_historico/`).
- `docs/LEIA-PRIMEIRO.md` — lido como contexto; não reescrito aqui.