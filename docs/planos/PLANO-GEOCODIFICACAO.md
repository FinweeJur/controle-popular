# Plano de geocodificação — dados do monitoramento da Vale e camadas novas

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** plano, ativo, tarefa

## Sumário

- [Propósito](#propósito)
- [1. O que já existe (infra de mapa pronta)](#1-o-que-já-existe-infra-de-mapa-pronta)
- [2. Método por camada do monitoramento da Vale](#2-método-por-camada-do-monitoramento-da-vale)
- [3. Regras de geocodificação (as mesmas do resto do portal)](#3-regras-de-geocodificação-as-mesmas-do-resto-do-portal)
- [4. Conferência manual necessária (o que a máquina não decide)](#4-conferência-manual-necessária-o-que-a-máquina-não-decide)
- [5. Ordem de execução (quando §11 tiver dado)](#5-ordem-de-execução-quando-11-tiver-dado)
- [6. O que NÃO está neste plano](#6-o-que-não-está-neste-plano)
- [Origem](#origem)

> Escrito em 2026-08-17, a pedido do dono ("plano de como geocodificar isso tudo
> depois" — `docs/planos/TODO-PROXIMAS-RODADAS.md` §12). Este é o PLANO, não a
> tela: a execução começa quando o monitoramento da Vale (§11) tiver dado
> coletado. Depende da infra de mapa que a Função Social da Terra e as camadas
> de barragem/mineração já têm.

## 1. O que já existe (infra de mapa pronta)

- **Globo 3D**: `apps/web/app/funcaosocialterra/mapa/` — `GloboIframe.tsx`
  embute o globo; as camadas ficam em `public/terras/globo/dados/camadas/`
  (39 arquivos GeoJSON, alguns `.gz`), com `proveniencia.json` no diretório
  `dados/`.
- **Leitura no build**: `lib/terras/camadas.ts` (`lerGeoJSON`) lê a MESMA pasta
  que o globo serve — contagem de camadas em `lib/terras/mapa-resumo.ts`
  (terras indígenas, SIGMINE operação/interesse, CFEM municípios, quilombolas,
  mancha de inundação) e alertas em `lib/terras/alertas.ts`.
- **Limite municipal**: `municipios-mg.geojson` já publicado — é a geometria de
  referência para geocodificar por município (o mesmo arquivo que alimenta
  `cfem-municipios.geojson` e `documentos-processo-municipios.geojson`).
- **Camadas do Paraopeba já geolocalizadas** (padrão a seguir):
  - `brumadinho-area-atingida.geojson` (polígono da mancha)
  - `brumadinho-obras-{pontuais,lineares,poligonais}.geojson` (obras por tipo
    de geometria)
  - `brumadinho-monitoramento.geojson`, `brumadinho-estruturas-contencao.geojson`,
    `brumadinho-remanejamento.geojson`, `brumadinho-restauracao.geojson`
  - `documentos-processo-municipios.geojson` (acervo UFMG por município)
- **Etiqueta de procedência**: `proveniencia.json` registra fonte de cada
  camada — toda camada nova entra com a entrada correspondente (regra já
  existente da frente de território).

## 2. Método por camada do monitoramento da Vale

Cada camada do monitoramento (§11) tem fonte de geometria própria. Nada é
geocodificado "em geral" — é geocodificado **pela fonte que o dado já traz**:

| Camada (§11) | Fonte de geometria | Método |
|---|---|---|
| Investimentos por município | `municipios-mg.geojson` | Junta por código IBGE (7 dígitos) ou nome normalizado (regra da armadilha IBGE 7×6 — ver `docs/planos/TODO-PROXIMAS-RODADAS.md` §3c; nunca misturar numeração) |
| Obras da reparação | `brumadinho-obras-*.geojson` (já publicadas) | Reuso direto; conferir cobertura por município |
| Barragens | `snisb_barragens`/`feam_barragens` (banco) têm lat/long | Converter para ponto GeoJSON no build; cruzar com `mancha-inundacao-barragens.geojson.gz` e `zas-barragens.geojson.gz` |
| Vendas/fornecedores | CNPJ → endereço | **Não geocodificar por endereço** (dado pessoal de empresa + custo alto). Geolocalizar é só o que a fonte pública já declara: município da sede (junta por CNPJ raiz com `municipios`), sem ponto de rua |
| Prestações de contas | `documentos-processo-municipios.geojson` | Padrão já existente do acervo UFMG |
| Licenças ambientais | `ambiental_licenciamento` (banco) tem lat/long quando a fonte dá | Ponto quando a fonte publica coordenada; senão, município do empreendimento (`municipios-mg.geojson`) |
| Benefícios fiscais | renúncia/incentivo por empresa | Município da sede (CNPJ raiz), mesma regra de vendas |

## 3. Regras de geocodificação (as mesmas do resto do portal)

1. **Geometria só da fonte, nunca adivinhada.** Coordenada não publicada NÃO é
   estimada por endereço de rua (custo, erro e dado pessoal de empresa).
   O máximo é o polígono do município, pela fonte que declara o município.
2. **Um ponto por registro, com `properties` carregando o id do registro** —
   o mesmo padrão de `brumadinho-obras-pontuais.geojson`. O clique no globo
   leva à página do registro (join por id), não a um HTML embutido no GeoJSON.
3. **Não duplicar geometria em dois arquivos.** Se a camada já existe
   (`cfem-municipios.geojson`, `documentos-processo-municipios.geojson`),
   reaproveitar; o `mapa-resumo` conta por arquivo, e arquivo partido é o
   sintoma que a frente já corrigiu (ver comentário ⟲ 13/08 em
   `lib/terras/mapa-resumo.ts`).
4. **Toda camada nova entra com entrada em `proveniencia.json`** — fonte,
   data de coleta e método de geocodificação, para quem ler o mapa daqui a um
   ano saber de onde cada ponto veio.
5. **Conferência manual antes de publicar**: geometrias derivadas de texto
   (município citado em documento) passam por amostra manual — o mesmo
   princípio da auditoria de links (amostra, não varredura cega).

## 4. Conferência manual necessária (o que a máquina não decide)

- Município citado em documento de acervo (UFMG): a máquina casa por nome
  normalizado; a amostra confere 100 registros por lote.
- Empreendimento com nome de cidade dentro do próprio nome ("Mina de
  Brumadinho") vs. município real — a régua do §3.1 evita o erro, a amostra
  confere o caso a caso.

## 5. Ordem de execução (quando §11 tiver dado)

1. Camada de investimentos por município (junta direta, sem coordenada).
2. Reuso das camadas de obras/remanejamento já publicadas.
3. Pontos de barragens a partir do banco (lat/long já existente).
4. Camadas derivadas de texto (documentos, prestações) com conferência manual.
5. Vendas/fornecedores e benefícios fiscais por município de sede (CNPJ raiz).

## 6. O que NÃO está neste plano

- Geocodificação de endereço de rua (não é necessária para nenhuma camada
  pedida; se um dia for, é outro projeto com outra régua de dado pessoal).
- Mapa interativo novo: o globo 3D já existe e já serve camadas por
  `public/terras/globo/dados/camadas/`; a tela do monitoramento da Vale usa
  a infra atual.
