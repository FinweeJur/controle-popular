# Plano — Melhorias de Layout, Pente Fino de Links, Biblioteca Unificada, Pesquisa Acadêmica e Sabiá 7B

> **Tipo:** PLANO
> **Domínio:** ux/dados/biblioteca
> **Última medição:** 2026-09-08
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md), [PLANO-BIBLIOTECA-CRIMES-SOCIOAMBIENTAIS.md](./PLANO-BIBLIOTECA-CRIMES-SOCIOAMBIENTAIS.md)
> **Palavras-chave:** biblioteca, unificada, academico, teses, artigos, layout, mobile, links, linkmender, seu nono, sabia 7b

## Sumário

- [Propósito](#propósito)
- [1. Pente Fino de Links e Propostas do LinkMender](#1-pente-fino-de-links-e-propostas-do-linkmender)
- [2. Responsividade Mobile da Imagem na Home](#2-responsividade-mobile-da-imagem-na-home)
- [3. Título Centralizado e Sem Efeitos na Capa](#3-título-centralizado-e-sem-efeitos-na-capa)
- [4. Citação Literária de Fecho](#4-citação-literária-de-fecho)
- [5. Alinhamento Tipográfico do Poema e Autor](#5-alinhamento-tipográfico-do-poema-e-autor)
- [6. Quebra de Linha do Poema](#6-quebra-de-linha-do-poema)
- [7. Alinhamento à Direita da Descrição do Portal](#7-alinhamento-à-direita-da-descrição-do-portal)
- [8. Apresentação Institucional da Página Sobre](#8-apresentação-institucional-da-página-sobre)
- [9. Proporção do Avatar do Seu Nonô](#9-proporção-do-avatar-do-seu-nonô)
- [10. Nova Biblioteca Unificada de Documentos](#10-nova-biblioteca-unificada-de-documentos)
- [11. Pesquisa e Acervo Acadêmico Nacional](#11-pesquisa-e-acervo-acadêmico-nacional)
- [12. Atualização da Base do Seu Nonô Chatbot](#12-atualização-da-base-do-seu-nonô-chatbot)
- [13. Rito de Verificação e Publicação](#13-rito-de-verificação-e-publicação)
- [14. Treinamento do Sabiá 7B](#14-treinamento-do-sabiá-7b)

## Propósito

Consolidar a execução de quinze melhorias estruturais no portal Controle Popular: correção de links com base em diagnósticos do robô LinkMender, refinamento responsivo e tipográfico da Home page e componentes visuais, criação da Biblioteca Unificada com pesquisa acadêmica integrada, atualização do assistente Seu Nonô e roteiro prático para o treinamento dos pesos do modelo Sabiá 7B.

---

## 1. Pente Fino de Links e Propostas do LinkMender

O relatório `docs/relatorios-automacao/linkmender-propostas.md` mapeou links que necessitavam de atualização para rotas específicas e atualizadas em órgãos públicos:
1. `https://revendedoresapi.anp.gov.br/swagger/index.html` → Atualizado para o manual oficial atualizado de distribuição e revendedores de combustíveis da ANP.
2. `https://pncp.gov.br` → Atualizado para `https://www.gov.br/pncp/pt-br`.
3. `https://mpmg.mp.br/portal/menu/comunicacao/noticias/` → Atualizado para `https://www.mpmg.mp.br/portal/menu/comunicacao/noticias/`.
4. Varredura nas páginas de órgãos e empresas para que cada registro contenha links diretos para certidões, processos e laudos específicos em vez de portais genéricos.

---

## 2. Responsividade Mobile da Imagem na Home

Em telas de celular (abaixo de 420px de largura), o container da capa causava transbordamento horizontal (`overflow-x`), forçando rolagem lateral e cortando textos.

### Solução
- Container com `w-full max-w-full overflow-hidden`.
- Imagem com `object-cover object-center w-full h-full` sem definir larguras mínimas fixas.
- Padding adaptativo no mobile (`px-4 sm:px-8`) com quebra de linha forçada (`break-words`).

---

## 3. Título Centralizado e Sem Efeitos na Capa

O título "CONTROLE POPULAR" contava com contornos pesados (`-webkit-text-stroke`) e sombras escuras pronunciadas.
- O título volta a ser limpo e **centralizado** no eixo da página.
- Os efeitos de contraste são preservados apenas nos textos secundários e nas epígrafes literárias sobre a fotografia.

---

## 4. Citação Literária de Fecho

A citação de João Guimarães Rosa (*"O que a vida quer da gente é coragem"*, Grande Sertão: Veredas, 1956) é retirada da capa e movida para o fecho inferior da página inicial, utilizando a variante `"fecho"` do componente `Epigrafe.tsx`, antes do rodapé geral.

---

## 5. Alinhamento Tipográfico do Poema e Autor

Em `CapaFrente.tsx`, o tamanho da atribuição do autor passa a ter exatamente a mesma escala tipográfica dos versos do poema, assegurando harmonia estética.

---

## 6. Quebra de Linha do Poema

O poema de Itamar Vieira Junior (*Coração Sem Medo*, 2025) passa a ser exibido com quebra de linha por frase:
- Linha 1: *"Ela deita sementes para morrerem ou brotarem."*
- Linha 2: *"Ela semeia sonhos pra ver germinar sobrevivência."*

---

## 7. Alinhamento à Direita da Descrição do Portal

Na capa, a descrição concisa do portal fica alinhada à direita (`text-right ml-auto`), criando um equilíbrio visual dinâmico com o poema no canto esquerdo e o título centralizado.

---

## 8. Apresentação Institucional da Página Sobre

A página `/sobre` deixa de utilizar a primeira pessoa na voz do assistente Seu Nonô e passa a declarar institucionalmente a missão cívica do Observatório Nacional Socioambiental (ONSA). O Seu Nonô é mantido em sua posição legítima como ferramenta de diálogo com o cidadão.

---

## 9. Proporção do Avatar do Seu Nonô

No botão flutuante e no cartão da Home, a imagem do Seu Nonô é ampliada para preencher toda a área circular, eliminando o espaçamento morto alaranjado e adotando um contorno suave e harmonioso.

---

## 10. Nova Biblioteca Unificada de Documentos

Criação da rota canônica `/biblioteca` em `apps/web/app/biblioteca/page.tsx` com `BibliotecaGeralClient.tsx` e base `apps/web/data/biblioteca-unificada.json`.

Requisitos atendidos da regra das 5 coisas do AGENTS.md:
1. **Gráfico SVG inline**: Distribuição documental por área temático-setorial e linha do tempo.
2. **Status de topo**: 4 cartões com volume total, órgãos/empresas mapeados, páginas e temas.
3. **Planilha CSV**: Botão de exportação dos itens filtrados com BOM UTF-8 (`\uFEFF`) e separador `;`.
4. **Filtros interativos**: Filtragem por instituição, estado, empresa e tema.
5. **Ordenação e densidade**: Ordenação por colunas, busca em tempo real e modo comprimido/denso de leitura.

---

## 11. Pesquisa e Acervo Acadêmico Nacional

Mapeamento e integração à biblioteca de teses, dissertações, artigos científicos (SciELO) e notas técnicas de referência sobre:
- Vale S.A. e mineração (UFMG, Fiocruz, UFOP);
- Sigma Lithium e exploração de lítio no Jequitinhonha (UFVJM, Unesp, Inesc);
- Protocolo de Consulta Prévia e Povos Tradicionais (UnB, ISA, SciELO);
- Licenciamento Ambiental e Descaracterização de Barragens (Revista Brasileira de Ciências Ambientais);
- Transparência, Compras Públicas e PNCP (IPEA, FGV);
- Orçamento Público e Emendas Parlamentares (UnB, Transparência Brasil);
- Sistema de Justiça e Assimetrias Orçamentárias (CNJ, ANADEP).

Cada registro conta com título, autores, instituição, ano, microresumo factual, link oficial no repositório universitário e link direto para o PDF aberto.

---

## 12. Atualização da Base do Seu Nonô Chatbot

Atualização dos módulos `apps/web/lib/assistente/seu-nono-dados.ts` e `apps/web/app/components/SeuNonoData.ts` para que o assistente responda com precisão sobre:
- A nova Biblioteca Unificada e como acessar teses e documentos;
- A cobertura das 91 instituições de justiça dos 27 estados;
- As pesquisas sobre lítio, barragens e a Convenção 169 da OIT.

---

## 13. Rito de Verificação e Publicação

- Execução da suíte de testes unitários (`npm test`).
- Verificação rigorosa de tipagem TypeScript (`npx tsc --noEmit`).
- Auditoria de segurança e dados pessoais (`python scripts/checar-dado-pessoal-em-dado.py`).
- Validação do padrão de documentação (`python scripts/validar-documentacao.py`).
- Commit por pathspec com mensagem em arquivo sem acentos e `Co-Authored-By`.
- Publicação sincronizada via `git fetch origin && git rebase origin/main && git push origin HEAD:main`.

---

## 14. Treinamento do Sabiá 7B

### Diagnóstico Técnico
- O dataset já foi estruturado e expandido com 441 exemplos calibrados em `etl/finetuning/dataset-seu-nono-v1-expanded.jsonl`.
- O script Unsloth (`etl/finetuning/treinar_seu_nono_unsloth.py`) e o `Modelfile` para o Ollama estão perfeitamente preparados.
- O treinamento dos pesos da rede neural (que gera o arquivo binário `.gguf`) não pode ser executado nesta máquina local porque ela não possui acelerador CUDA configurado.

### Procedimento no Google Colab
1. Abrir o [Google Colab](https://colab.research.google.com/) com acelerador T4 (gratuito).
2. Fazer upload dos arquivos `treinar_seu_nono_unsloth.py` e `dataset-seu-nono-v1-expanded.jsonl`.
3. Instalar o ambiente:
   ```bash
   pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git" torch trl
   ```
4. Executar o script `python treinar_seu_nono_unsloth.py` (~20 minutos).
5. O script exporta diretamente o arquivo `seu-nono-7b-q4_k_m.gguf`.
6. Baixar o arquivo `.gguf`, colocá-lo na pasta `models/seu-nono/` do repositório e executar:
   ```bash
   ollama create seu-nono -f models/seu-nono/Modelfile
   ```
