# Mapeamento NACAB, ADAI e IBGP — 2026-08-19 (atualizado)

> **Tipo:** PESQUISA
> **Domínio:** paraopeba
> **Última medição:** 2026-08-22
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [README.md](../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** pesquisa, NACAB, ADAI, paraopeba, mapeamento

## Sumário

- [Propósito](#propósito)
- [NACAB — o script `coletar-biblioteca-ati.py` está desatualizado](#nacab-o-script-coletar-biblioteca-atipy-está-desatualizado)
- [ADAI — achado que muda `atores.ts`, não só a biblioteca](#adai-achado-que-muda-atorests-não-só-a-biblioteca)
- [IBGP — RESOLVIDO: e a ATI da Regiao 1](#ibgp-resolvido-e-a-ati-da-regiao-1)
- [Trabalho pendente (fica para a sessao de codigo, depois do lote)](#trabalho-pendente-fica-para-a-sessao-de-codigo-depois-do-lote)
- [Origem](#origem)

Pesquisa pedida pelo usuário para corrigir a biblioteca de ATIs. Não editei
código nesta rodada — só mapeei. A implementação fica para depois do lote
de resumos da auditoria AJRI, por decisão do usuário.

## NACAB — o script `coletar-biblioteca-ati.py` está desatualizado

O comentário `"NACAB (Região 3): sem biblioteca própria publicada"` estava
certo em algum momento, mas não está mais. Confirmado em
`https://nacab.org.br/projeto/paraopeba-estudos-e-publicacoes/`:

- **48 PDFs distintos**, confirmados por `grep` no HTML bruto (não estimativa
  do WebFetch) — `/tmp/nacab.html`, 412 KB, buscado com User-Agent de
  navegador (sem UA, o host devolve 406 — mesma armadilha já documentada do
  Guaicuy).
- Seis séries, cada uma sob um `<h2 class="elementor-heading-title">`:
  Germinar, Nacab em Campo, Mobilização, Reparação, Estudos e Relatórios.
- Documento mais recente: `20260817_relatorio_analitico_prt_v2corrigido.pdf`
  — 17/08/2026. Fonte ativa.

### Estrutura para o coletor (Elementor, não WP REST)

- **Sem texto âncora**: o `<a href=".pdf">` envolve uma imagem de capa, não
  texto. `alt` da imagem quase sempre vazio. Título tem de vir do NOME DO
  ARQUIVO tratado (ex.: `germinar_1.pdf` → "Germinar 1"), como o coletor já
  faz para casos parecidos.
- **Série = o `<h2>` mais próximo ACIMA do link** no documento — não há
  atributo que amarre item a série, é ordem no DOM.
- **Data**: o caminho `wp-content/uploads/AAAA/MM/` dá ano e mês reais
  (mês de upload, que pode não ser o mês de publicação — registrar a
  diferença, mesma cautela que `execucao-fgv.ts` já aplica a "executado" vs.
  "obra pronta"). Não é preciso raspar o texto em busca de data.
- Mesmo padrão do Guaicuy se aplica: sitemap ou raspagem de página, com
  User-Agent de navegador — não é API.

## ADAI — achado que muda `atores.ts`, não só a biblioteca

A medição de 15/08 ("19 publicações, zero sobre Paraopeba") estava certa
NAQUELE momento. Mudou: `adaibrasil.org.br/projetos/paraopeba/` existe agora
e contém uma **Proposta Técnica de dezembro de 2025 para a ADAI ser
selecionada como ATI das Regiões 1 e 2** da bacia do Paraopeba —
`ADAI-Proposta-Tecnica-para-ATI-R1-e-R2-1.pdf`, mais um documento de
perguntas e respostas de uma "live de apresentação das candidatas" em
04/12/2025.

**Isto e uma disputa/processo em andamento, nao um estudo publicado.** Antes
de tocar em `atores.ts` (que hoje lista só AEDAS, NACAB e Instituto Guaicuy
como as tres ATIs da bacia), e preciso apurar:

**RESOLVIDO PELO USUARIO em 2026-08-19: a ADAI e a ATI da Regiao 2.** A
candidatura de dezembro de 2025 nao e mais uma incognita — ela venceu (ou o
usuario ja sabe o resultado por outra via). `atores.ts` precisa passar a
listar quatro ATIs, nao tres: AEDAS, NACAB, Instituto Guaicuy e ADAI.

**Escopo pedido para a ADAI e so NOTICIAS do Paraopeba, nao a biblioteca
inteira.** A ADAI publica muito material de Amazonia/Fundo Amazonia que nao
interessa aqui — o coletor precisa filtrar por assunto/projeto Paraopeba nas
noticias, nao trazer o site inteiro. Lembrar: o parametro `?projeto=paraopeba`
no filtro de PUBLICACOES nao filtra de verdade (medido, devolveu Amazonia
mesmo com o parametro) — a mesma checagem precisa ser feita na secao de
noticias antes de confiar no filtro.

O que ainda falta apurar, mesmo com a ADAI confirmada como Regiao 2: se ela
SUBSTITUI quem respondia pela Regiao 2 antes, ou se e a primeira ocupante —
`atores.ts` teria de refletir a diferenca (ATI trocada vs. vaga preenchida
pela primeira vez).

## IBGP — RESOLVIDO: e a ATI da Regiao 1

`https://www.ibgpati.org.br/` — **Instituto Brasileiro de Gestao e Pesquisa**,
instituicao sem fins lucrativos com mais de 15 anos em gestao de projetos e
politicas publicas. `atores.ts` precisa passar a listar QUATRO ATIs, nao tres:
AEDAS, NACAB, Instituto Guaicuy e IBGP (mais a ADAI da Regiao 2, ver acima).

### Estrutura para o coletor — mais simples que NACAB e Guaicuy

Site proprio (nao WordPress/Elementor), estrutura de conteudo em
`/conexao/*`:

| Secao | URL | Conteudo |
|---|---|---|
| Biblioteca | `/conexao/biblioteca` | 4 itens hoje: Evolucao do Anexo I.1, Comunicado aos Conselhos de Representantes, Oficio Conjunto n. 47/2026, Cartilha Orientativa do IBGP-ATI |
| Noticias | `/conexao/noticias` | nao mapeado ainda |
| Editais | `/conexao/editais` | nao mapeado ainda |
| Relatorios Tecnicos | `/ati-brumadinho/relatorios-tecnicos` | pagina-indice; parece redirecionar ao mesmo conteudo da Biblioteca, ou ainda vazia — conferir com HTML bruto antes de decidir se e fonte separada |
| Prestacao de Contas | `/ati-brumadinho/prestacao-de-contas` | nao mapeado ainda |

**Diferenca boa em relacao a NACAB:** os links de PDF tem TEXTO ANCORA
legivel (ex.: "Oficio Conjunto n. 47/2026"), nao so imagem de capa. Nao
precisa inferir titulo do nome do arquivo.

**Biblioteca pequena hoje (4 itens) e a propria pagina avisa que vai
crescer** ("novos documentos serao adicionados conforme disponibilidade") —
coletor precisa rodar de novo periodicamente, nao e coleta de uma vez so.

Confirmar com HTML bruto (curl com User-Agent de navegador, como foi feito
para NACAB) antes de escrever o coletor — o WebFetch resume, nao mostra
seletor real.

## Trabalho pendente (fica para a sessao de codigo, depois do lote)

1. `atores.ts`: acrescentar IBGP (Regiao 1) e ADAI (Regiao 2) as tres ATIs ja
   listadas. Decidir se ADAI SUBSTITUI uma ocupante anterior da Regiao 2 ou
   preenche vaga nova — muda o texto, nao so o dado.
2. Corrigir `coletar-biblioteca-ati.py`:
   - adicionar coletor de NACAB (raspagem tipo Elementor, titulo do nome do
     arquivo, serie pelo `h2` mais proximo, data do path `uploads/AAAA/MM`);
   - adicionar coletor de IBGP (`/conexao/biblioteca` — texto ancora ja
     legivel, mais simples; confirmar HTML bruto antes de escrever);
   - adicionar coletor de ADAI, mas SO NOTICIAS do Paraopeba (nao a
     biblioteca inteira, que e majoritariamente Amazonia) — checar se algum
     filtro real existe nas noticias antes de confiar nele, ja que o de
     publicacoes nao filtra.
3. Baixar (nao so linkar) o PDF do protocolo SES-MG de exposicao quimica de
   mineracao, publicar em `/paraopeba` e na frente de legislacao.
4. Referencia cruzada bidirecional entre `legislacao-unificada.ts` e os
   modulos de estudo/biblioteca — campo tipo `documentosRelacionados`, geral,
   nao so para o PDF da SES-MG.
