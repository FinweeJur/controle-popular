# Plano do RAG documental da biblioteca

> **Tipo:** PLANO
> **Domínio:** RAG, biblioteca, PDFs, fontes oficiais
> **Última medição:** 2026-10-21
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [MANUAL-RAG-E-LLM.md](../03-desenvolvimento/MANUAL-RAG-E-LLM.md), [PLANO-RAG-JURIMETRIA-TJMG.md](PLANO-RAG-JURIMETRIA-TJMG.md), [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** rag, documentos, pdf, biblioteca, pnab, brumadinho, paraopeba, ati, ocr, r2, coleta

## Sumário

- [Propósito](#propósito)
- [O que foi entregue](#o-que-foi-entregue)
- [Cobertura medida](#cobertura-medida)
- [Pipeline](#pipeline)
- [Integração com o Seu Nonô](#integração-com-o-seu-nonô)
- [Privacidade e CPF](#privacidade-e-cpf)
- [Próximas fases](#próximas-fases)
- [Critérios de pronto](#critérios-de-pronto)
- [Origem / Histórico](#origem--histórico)

## Propósito

Fazer o RAG do portal responder a partir de **PDF e fontes originais**, não
só dos cartões curados do Seu Nonô. A resposta deve citar o documento, a
página e o link oficial.

## O que foi entregue

- extração de PDF com `pdf-parse`, página a página;
- fatiamento de 180 palavras com 30 de sobreposição;
- índice lexical facetado por categoria, tema e ano;
- mapa de cobertura por categoria, tema e ano;
- integração opcional ao `responderComRag`: até 3 trechos documentais
  entram depois dos cartões curados;
- prompt passa a levar `URL oficial` e `Pagina` de cada fonte;
- índice em `apps/web/public/data/documentos-rag/`;
- cache de PDF em `apps/web/.cache/documentos-rag/` (fora do git);
- teste sintético do índice e teste do link/página no prompt;
- atalhos `npm run rag:index`, `rag:index:pdf` e `rag:check`.

## Cobertura medida

| Fonte | Documentos | Situação |
|---|---:|---|
| `documentos-paraopeba.json` | 471 | resumo/citação indexado |
| `biblioteca-desastres.json` | 936 | resumo indexado |
| `biblioteca-unificada.json` | 458 | microresumo indexado |
| `biblioteca-teses-atingidos.json` | 424 | resumo acadêmico indexado |
| `biblioteca-pro-brumadinho.json` | 129 | resumo + PDF quando há texto |
| **Total único no índice** | **2.242** | **8.057 trechos** |

O índice tem 18,6 MB. Desses trechos, 5.815 têm página de PDF e 6.148 têm
link de PDF. O Pro-Brumadinho teve 95 PDFs baixados; 11 não têm camada de
texto (escaneados) e por isso ficaram só com o metadado.

## Pipeline

```text
catálogo versionado
  -> metadado/resumo (sempre)
  -> PDF local ou download público (opcional)
  -> extração por página
  -> redação de CPF
  -> fatiamento 180/30
  -> índice + mapa
  -> RAG
```

O download usa User-Agent `finweejur/github artur colito`, lê `robots.txt`,
respeita `Disallow`, pausa 1,5 s e não usa login, CAPTCHA ou paywall. PDF
bruto fica no cache local; o repositório recebe só o índice derivado.

## Integração com o Seu Nonô

`responderComRag` consulta os cartões curados e o índice documental em
paralelo. Regras:

- cartões primeiro; documentos depois;
- no máximo 3 trechos documentais e 6 fontes no total;
- documento só entra com score mínimo;
- cada fonte leva título, URL oficial e página quando existe;
- se não houver cartão nem trecho, o assistente abstém.

## Privacidade e CPF

A primeira extração encontrou **74 CPFs válidos** em texto de PDF. O
indexador agora aplica mod-11 e troca CPF real por `[CPF removido]` antes de
gravar. O `checar-dado-pessoal-em-dado.py --extra` passa no índice. Nenhum
PDF bruto é commitado.

## Home-pc medido em 21/10/2026

O inventário amplo do `home-pc` encontrou **45.250 arquivos / 4.078,7 MB**.
Desses, **1.278 PDFs / 696,5 MB**: 1.150 estão em
`C:\DevCoder\tjmg-jurimetria\pdfs\_unificados`; fora do TJMG há 46 PDFs,
mas só **33 únicos / 61,9 MB** depois de descontar clones e worktrees.

Candidatos úteis fora do TJMG:

- `sementeira/public/biblioteca-docs`: 8 PDFs (Anexo I, Cáritas, ofícios).
- `acervo-documentos`: 5 PDFs (leis de Betim, Diamantina e PBH).
- `documentos-empresas`: 4 PDFs (REDESCA, SEC 20-F, CNDH, ONU).
- `esg`: 3 PDFs (Vale, 24,1 MB); já são dado do portal.
- `tjmg-jurimetria/docs/estudos`: 1 PDF (NACAB).
- `sementeira/docs/paraopeba`: 1 PDF.
- Downloads/Telegram: alguns PDFs, inclusive editais; separar antes de indexar.

O `cutiazinha` também está no home-pc: hub Go/Wails com extração de PDF,
mas não é RAG. O próximo recorte é indexar só candidato com URL oficial
declarada, descartando clone, duplicata e arquivo pessoal.

Na primeira rodada de fontes oficiais, entraram 2 PDFs da PBH (Lei Orgânica
e Lei 11.181/2008) e a Pesquisa Jurisprudencial NACAB/ADAI 2023 (49 páginas).
Betim (Lei Orgânica, 72 páginas) e Diamantina (Lei Orgânica, 64 páginas, e
LC 103/Plano Diretor, 60 páginas) entraram do **PDF já coletado** em
`acervo-documentos`, com `arquivoLocal` e `urlPdf: null`. O download oficial
continua recusado pelo `robots.txt` (`Disallow`); a URL oficial permanece
como citação, sem nova coleta.

O índice ganhou 367 trechos com Diamantina e a varredura de CPF continua
passando. A skill `/rag` documenta consulta, atualização, caminhos e
diagnóstico em `.claude/skills/rag/SKILL.md`.

## Próximas fases

1. **OCR** para os PDFs escaneados (Pro-Brumadinho e bases antigas).
2. **Mais PDFs**: ATIs/NACAB, CBH-Doce e Paraopeba, com decisão de licença
   por fonte.
3. **R2**: usar o pipeline existente, com chave única e domínio único;
   baixar no PC primeiro, subir depois.
4. **Automação — pendente**: os coletores e a rotina da madrugada ainda
   não chamam o RAG. `rag:index`/`rag:check` existem, mas não estão ligados
   ao `sincronizar-documentos-r2`; falta corrigir a rotina (`--listar` não
   coleta) e definir o gatilho de reindexação após coleta nova.
5. **Home-pc — parcial**: o acesso via Tailscale/SSH funciona e o acervo
   local foi inventariado; Betim e Diamantina já entraram. Faltam os demais
   candidatos com URL oficial.
6. **Avaliação**: golden set documental com pergunta, documento e página.

## Critérios de pronto

- índice sem CPF real;
- toda fonte com URL oficial ou `semFonte` explícito;
- resposta cita documento e página quando houver;
- nenhum PDF bruto no git;
- reindexação reproduzível e datada;
- golden set documental passando;
- coleta/atualização agendada ou documentada.

## Origem / Histórico

Criado em 21/10/2026 no worktree `rag-jurimetria-tjmg`, depois de o dono
confirmar que o Seu Nonô precisava acessar biblioteca, PDFs e fontes
originais. A primeira rodada baixou os PDFs do Pro-Brumadinho e indexou os
metadados das demais bases. Betim e Diamantina entraram do cache local;
Diamantina acrescentou 367 trechos. A skill `/rag` foi criada. O TJMG
continua apenas planejado e a automação dos coletores ainda não foi feita.
