# Plano — transporte gratuito nas Eleições 2026

> **Tipo:** PLANO
> **Domínio:** eleições 2026, mobilidade, direito ao voto
> **Última medição:** 2026-10-21
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [RADAR-HOTSPOTS.md](../02-estado/RADAR-HOTSPOTS.md), [PADRAO-PAGINA-WIKI.md](../03-desenvolvimento/PADRAO-PAGINA-WIKI.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** eleicoes 2026, transporte gratuito, tarifa zero, segundo turno, TSE, TRE, ADPF 1013, seu voto importa, mobilidade, acessibilidade, fontes oficiais

## Sumário

- [Propósito](#propósito)
- [Decisão de arquitetura](#decisão-de-arquitetura)
- [O que será publicado](#o-que-será-publicado)
- [Dataset e contrato](#dataset-e-contrato)
- [Fontes e método](#fontes-e-método)
- [Lacunas e riscos](#lacunas-e-riscos)
- [Critérios de pronto](#critérios-de-pronto)
- [Verificação](#verificação)
- [Fora de escopo](#fora-de-escopo)
- [Histórico](#histórico)

## Propósito

Publicar uma página única para responder, com fonte, três perguntas:

1. **O transporte público é gratuito no dia da eleição?**
   Sim, por obrigação nacional: ADPF 1013/STF e art. 23 da Resolução TSE
   nº 23.751/2026. Vale para o 1º turno (04/10/2026) e o 2º (25/10/2026).
2. **O que cada estado e cada TRE publicou?**
   Onde há política estadual, metropolitana ou municipal confirmada; onde o
   TRE apenas organiza transporte rural, indígena, quilombola ou especial.
3. **Como pedir transporte da Justiça Eleitoral?**
   Programa Seu Voto Importa, transporte rural da Lei nº 6.091/1974 e os
   canais de cada TRE.

A página não deve insinuar que todo município publicou decreto, nem tratar
transporte especial da Justiça Eleitoral como tarifa zero universal.

## Decisão de arquitetura

- Rota: `apps/web/app/eleicoes/2026/transporte-gratuito/page.tsx`.
- Dado: `apps/web/data/eleicoes/2026/transporte-gratuito-2026.json`.
- Tipos e testes: `apps/web/lib/eleicoes/transporte-2026.ts` e
  `apps/web/lib/eleicoes/transporte-2026.test.ts`.
- Componente cliente: `TabelaTransporte.tsx`, ao lado da página.
- `metadataEditavel`, `IndiceWiki`, `SecaoWiki`, `ResumoExpandivel` e
  `export const dynamic = "force-static"`.
- A página é server component. O cliente recebe apenas `politicas`; não
  importa o JSON inteiro. Tipos entram com `import type`.
- A tabela usa os helpers puros de `lib/tabela/ordenavel.ts` e exporta CSV
  com `BotoesExportar`/`baixarCsv`. Não usa `TabelaEstatica`, que é feita
  para índice fatiado e não para dezenas de linhas.
- O transporte da Justiça Eleitoral fica em cartões por TRE, não na tabela
  de políticas. São direitos diferentes.

## O que será publicado

Nove blocos, com âncoras no `IndiceWiki`:

1. **O essencial.** Três cartões: obrigação nacional nos dois turnos; 27
   TREs verificados; 31 políticas confirmadas em 19 UFs. Abaixo, um resumo
   curto separando tarifa zero de transporte da JE.
2. **O que diz a lei.** ADPF 1013, Res. 23.751/2026, Lei 6.091/1974,
   Res. 23.753/2026 e Res. 23.780/2026, com links oficiais.
3. **Transporte pela Justiça Eleitoral.** Zona rural, Seu Voto Importa,
   como pedir e a distinção entre os dois direitos.
4. **O que cada TRE publicou.** 27 cartões com status, resumo, link oficial,
   data e observação. Status: página dedicada, notícia, programa Seu Voto
   Importa ou sem página específica localizada.
5. **Políticas confirmadas.** Tabela com estados, Distrito Federal, região
   metropolitana e municípios; filtros por UF e tipo; busca; ordenação; CSV.
6. **Tensões, denúncias e limites.** ADPF 1013, TRE-AM/UNIVAJA, proibição de
   transporte por candidatos e partidos, redução de frota como possível crime
   eleitoral, PEC de 21/10/2026 e denúncias/cobranças do MPF, DPU, partidos,
   entidades da sociedade civil e imprensa.
7. **Metodologia e limites.** “Amostra verificada, não censo”; data de
   conferência; o que não foi possível confirmar; onde o leitor consulta o
   próprio município.
8. **Fontes.** Lista ABNT com os documentos e notícias usados.
9. **Correções.** Caminho para o leitor apontar erro e para a próxima
   atualização.

## Dataset e contrato

Topo:

```json
{
  "geradoEm": "2026-10-21",
  "eleicao": "Eleições Gerais 2026",
  "turnos": [
    { "nome": "1º turno", "data": "2026-10-04" },
    { "nome": "2º turno", "data": "2026-10-25" }
  ],
  "aviso": "Amostra verificada até 21/10/2026, não censo.",
  "politicas": [],
  "denuncias": [],
  "tres": []
}
```

`politicas`:

```json
{
  "id": "ba-estado",
  "uf": "BA",
  "ente": "Bahia",
  "tipo": "estadual",
  "cobertura": "Todo o estado",
  "modalidades": "Ônibus intermunicipais, ferry-boat, lanchinhas, transporte metropolitano e metrô",
  "periodo": "18h de 23/10 a 12h de 26/10 (ônibus); 18h de 23/10 a 23h59 de 25/10 (ferry e metropolitano); 18h de 24/10 a 23h59 de 25/10 (metrô)",
  "fonteNome": "Governo da Bahia",
  "fonteUrl": "https://...",
  "fonteData": "2026-10-10",
  "observacao": "Decreto 24.879/2026. O ferry vale só para passageiros a pé, sem veículo."
}
```

`tres`:

```json
{
  "uf": "MG",
  "nome": "Minas Gerais",
  "status": "pagina",
  "resumo": "Página oficial de transporte de eleitores.",
  "fonteNome": "TRE-MG",
  "fonteUrl": "https://...",
  "fonteData": "2026-10",
  "observacao": "Reúne transporte rural, comunidades tradicionais e Seu Voto Importa."
}
```

`denuncias`:

```json
{
  "id": "mpf-pe-transporte",
  "uf": "PE",
  "ente": "Pernambuco",
  "titulo": "MP Eleitoral cobra transporte gratuito e frota de dia útil em PE",
  "resumo": "Empresas foram notificadas após comunicação à Ouvidoria do TRE-PE.",
  "fonteNome": "MPF — PRR5",
  "fonteUrl": "https://...",
  "fonteData": "2026-10-19",
  "tipoFonte": "oficial",
  "observacao": "A cobrança alcança ônibus urbanos e intermunicipais."
}
```

`tipo` aceita `estadual`, `distrital`, `metropolitana` e `municipal`.
`status` aceita `pagina`, `noticia`, `programa` e `sem-pagina`.
`tipoFonte` aceita `oficial` e `imprensa`.
`fonteData` aceita `YYYY-MM-DD` e `YYYY-MM`; a UI mostra mês/ano quando não há
dia confirmado.

## Fontes e método

- Prioridade: TSE, TRE, governo estadual, prefeitura e agência oficial.
- Imprensa só quando a fonte oficial não publicou link direto; a origem aparece
  na tabela e a página não transforma notícia em decreto.
- Varredura dos 27 TREs por página de Eleições 2026, busca interna e notícias.
- Conferência em 21/10/2026, antes do 2º turno.
- Auditoria do JSON em 21/10/2026: 69 URLs únicas, 0 mortas, 41 com HTTP 200 e
  28 bloqueadas por 401/403 (TSE/TREs e uma prefeitura). Bloqueio não é link
  morto.
- Nenhum CPF, dado pessoal ou credencial entra no JSON.
- Links externos com `target="_blank"` e `rel="noopener noreferrer"`.

## Lacunas e riscos

- **Não existe lista nacional consolidada** de municípios com tarifa zero.
  A página é amostra e diz isso no topo, na tabela e na metodologia.
- **Mudança de última hora:** estados e prefeituras podem editar decreto até
  25/10. O carimbo de data é obrigatório.
- **Link de TRE quebrado:** a página usa URL oficial conferida; se cair, o
  leitor ainda tem o nome do tribunal e a data.
- **Confusão de conceito:** transporte rural da Lei 6.091 não é tarifa zero
  universal. A UI separa os blocos e os rótulos.
- **TSE bloqueia automação:** o portal devolve 403 para `curl` e
  `Invoke-WebRequest`; a conferência manual usa `webfetch`. Nada de burlar
  bloqueio.
- **TRE-RJ:** relatório de transporte devolve 401; usar resolução e notícia.
- **GO:** a notícia do TRE-GO cobre a região metropolitana no 1º turno; o G1
  confirma também o 2º. A linha dirá “Região Metropolitana de Goiânia”.
- **AP, AC e RR:** sem página específica de gratuidade geral localizada. O
  cartão dirá isso, em vez de inventar política.
- **Res. 23.780/2026:** confirmada em 15/10/2026; permite analisar pedidos com
  menos de 20 dias, conforme viabilidade local, sem garantia automática.

## Critérios de pronto

- [x] JSON com 27 UFs em `tres`, sem UF repetida.
- [x] Toda política tem `fonteUrl` e `fonteData`.
- [x] Página e tabela renderizam no smoke local (HTTP 200).
- [x] Tabela busca, filtra, ordena e exporta CSV.
- [x] Nenhum CPF no JSON ou no código.
- [x] Links externos abrem em nova aba com `rel` seguro.
- [x] Texto distingue obrigação nacional, política local e transporte da JE.
- [x] Metodologia declara amostra e data.
- [x] Página indexada na busca, no Seu Nonô e linkada na home.
- [x] Cards com magnet leve, TREs compactos e fontes públicas destacadas.
- [x] Páginas relacionadas ao final.
- [x] Revisor de fatos, links e declarações aplicado.
- [x] `typecheck`, `eslint` e testes da lib verdes.
- [ ] Validador global de docs verde; `AUDITORIA-GERAL.md`, gerado por outra
  rotina, está sem frontmatter.
- [x] Commit por pathspec e push; sem deploy.

## Verificação

```bash
cd apps/web
npm run typecheck
npx eslint app/eleicoes/2026/transporte-gratuito lib/eleicoes/transporte-2026.ts lib/eleicoes/transporte-2026.test.ts
node scripts/testar-lib.mjs lib/eleicoes lib/sem-cpf-no-repo.test.ts lib/sitemap
```

Na raiz, se `docs/` for tocado:

```bash
python scripts/validar-documentacao.py
```

## Fora de escopo

- Atualizar automaticamente todos os decretos municipais.
- Criar coletor nacional de tarifa zero.
- Alterar a página de locais de votação ou de gastos de campanha.
- Publicar, fazer deploy ou trocar DNS.

## Histórico

- **21/10/2026 — plano criado.** Pesquisa dos 27 TREs, da base jurídica e das
  políticas estaduais/municipais confirmadas; arquitetura da página e do
  dataset definida.
- **21/10/2026 — implementação.** Página, tabela filtrável, JSON, tipos e
  testes criados. `typecheck`, `eslint`, testes da lib, sitemap e smoke local
  verdes. A Resolução TSE 23.780/2026 foi confirmada em 15/10/2026 e ganhou
  link oficial. Commit `6e6ab7b` publicado em `origin/main`. Pendente:
  validador global de docs (falha em `AUDITORIA-GERAL.md`, gerado por outra
  rotina sem frontmatter).
- **21/10/2026 — ampliação de cobertura.** Acrescenta 14 políticas oficiais de
  estados, capitais e polos (CE, SE, Manaus, Porto Velho, Belém, Campo Grande,
  Uberlândia, Canoas, Caruaru, Mossoró, Caucaia, São Gonçalo, Nova Iguaçu e
  Cuiabá) e 16 denúncias/cobranças do MPF, DPU, partidos, entidades da
  sociedade civil e imprensa. Total: 31 políticas, 19 UFs e 69 URLs auditadas,
  sem link morto.
- **21/10/2026 — revisão e integração.** Revisor de fatos/links corrigiu o
  caso do Vale do Javari, o enquadramento de candidato/partido, fontes
  estaduais de CE/RJ e declarações sobre zonas urbanas. A página ganhou cards
  compactos de TRE, selo “Fonte pública”/“Imprensa”, magnet leve, links
  relacionados, entrada na busca, no Seu Nonô e na home.
