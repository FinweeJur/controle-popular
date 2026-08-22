# Explorando o repo com um assistente de IA no terminal

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, procedimento, operacao

## Sumário

- [Propósito](#propósito)
- [Para quem é isto](#para-quem-é-isto)
- [1. Instalar o OpenCode](#1-instalar-o-opencode)
- [2. Conectar um provedor de LLM](#2-conectar-um-provedor-de-llm)
- [3. Apontar para este repo](#3-apontar-para-este-repo)
- [4. Perguntas que valem a pena fazer primeiro](#4-perguntas-que-valem-a-pena-fazer-primeiro)
- [5. Contribuindo de volta](#5-contribuindo-de-volta)

## Propósito

> Verificado ao vivo em 2026-08-07 contra a documentação oficial do > [OpenCode](https://opencode.ai/docs/) e da > [integração DeepSeek](https://api-docs.deepseek.com/quick_start/agent_integrations/opencode/). > Ferramenta de terceiros — se algum comando abaixo parar de bater com a > tela real, a...

> Verificado ao vivo em 2026-08-07 contra a documentação oficial do
> [OpenCode](https://opencode.ai/docs/) e da
> [integração DeepSeek](https://api-docs.deepseek.com/quick_start/agent_integrations/opencode/).
> Ferramenta de terceiros — se algum comando abaixo parar de bater com a
> tela real, a doc oficial é a fonte de verdade, não este arquivo.

## Para quem é isto

Este é um monorepo de três eixos (`apps/web/app/betim`, `/congresso`,
`/judiciario`) com convenções específicas — schema por zona, migrations sem
runner, dois tetos de infraestrutura que limitam decisões de arquitetura
(ver comentários em `apps/web/lib/db/`). Ler tudo isso do zero, sem ajuda,
leva um tempo real.

Se você não usa Claude Code mas quer um assistente de IA no terminal
apontado para este repo, o [OpenCode](https://opencode.ai) é a opção
open-source equivalente — roda com qualquer provedor de LLM, inclusive o
**DeepSeek**, que é ordens de grandeza mais barato que os modelos de
fronteira para tarefas de leitura/navegação de código. Este guia cobre
instalar o OpenCode, conectar um provedor, e os primeiros passos dentro
deste repo especificamente.

Nada aqui é exigido para rodar o projeto — é sobre ENTENDER o projeto mais
rápido. Para rodar de verdade, o guia é o `README.md` (seção "Rodando
localmente").

## 1. Instalar o OpenCode

```bash
# macOS/Linux
curl -fsSL https://opencode.ai/install | bash

# Windows — qualquer um dos três
npm install -g opencode-ai
scoop install opencode
choco install opencode
```

Como este projeto já exige Node 22 para rodar, `npm install -g opencode-ai`
é o caminho mais direto no Windows: você já tem o Node instalado.

## 2. Conectar um provedor de LLM

O OpenCode não vem com modelo nenhum embutido — ele fala com a API de um
provedor que você escolhe. Dentro de qualquer pasta, rode:

```bash
opencode
```

E dentro do OpenCode, digite `/connect`. Para usar o **DeepSeek**:

1. `/connect`
2. Escolha `deepseek` (ou "Other" e digite `deepseek` como id do provedor)
3. Cole sua chave — gerada em <https://platform.deepseek.com/api_keys>
4. Escolha o modelo (hoje `deepseek-v4-pro` para qualidade,
   `deepseek-v4-flash` para volume/custo menor)

**Outras APIs de LLM funcionam do mesmo jeito** — `/connect` reconhece os
provedores mais comuns (OpenAI, Anthropic, Google, Groq) e aceita qualquer
endpoint compatível com a API da OpenAI via "Other". Se preferir configurar
por arquivo em vez do assistente interativo, o formato é:

```json
// opencode.json, na raiz do seu clone deste repo
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "deepseek": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "DeepSeek",
      "options": { "baseURL": "https://api.deepseek.com/v1" },
      "models": { "deepseek-v4-pro": { "name": "DeepSeek V4 Pro" } }
    }
  }
}
```

Com a chave em variável de ambiente (`export DEEPSEEK_API_KEY=...` antes de
rodar `opencode`), você não precisa gravar a chave em arquivo nenhum.

> ⚠ A DeepSeek é uma empresa chinesa e processa os prompts nos servidores
> dela — não é diferente, em princípio, de mandar prompt para OpenAI ou
> Anthropic processarem nos servidores deles, mas a jurisdição muda. Nunca
> cole a `DATABASE_URL` de produção nem qualquer segredo de `.env` dentro de
> uma conversa com QUALQUER assistente de IA, deste ou de outro provedor —
> vale para este repo como vale para qualquer outro.

## 3. Apontar para este repo

```bash
git clone https://github.com/FinweeJur/controle-popular.git
cd controle-popular
opencode
```

Dentro do OpenCode, rode `/init`. Ele lê a árvore do projeto e monta um
resumo de arquitetura que fica disponível para o resto da conversa —
equivalente ao que um `CLAUDE.md`/`AGENTS.md` faria, mas gerado por
introspecção em vez de escrito à mão (este repo ainda não tem um desses
arquivos versionado; `/init` é o substituto até que exista um).

## 4. Perguntas que valem a pena fazer primeiro

Este repo tem decisões não óbvias documentadas **como comentário no próprio
código**, não em documento à parte — é assim que elas não envelhecem
desalinhadas do que o código faz de verdade. Um assistente de IA lê esses
comentários junto com o código, então perguntas que citam onde procurar
tendem a ir direto ao ponto:

- "Como funciona o `basePath` de cada zona, e por que `<a href>` cru não
  passa por ele? Olhe `lib/link-zona.tsx` e o README."
- "Por que as migrations não têm runner automático — o que
  `scripts/aplicar-migration.mts` faz de diferente de rodar o `.sql` direto
  no editor do Neon?"
- "Quais são os dois tetos de infraestrutura que limitam quantas cidades o
  eixo Cidades pode ter? Procure em `apps/web/lib/db/`."
- "O que `PESO_PROPOSICAO` em `lib/betim/vereadores.ts` faz, e por que a
  ponderação fica no JS em vez de no SQL?"

Perguntas genéricas ("explique este projeto") funcionam, mas custam mais
tokens e devolvem menos precisão que perguntas que já apontam para o
arquivo — o mesmo vale para qualquer assistente, não só para este.

## 5. Contribuindo de volta

Se a exploração virar uma mudança de código que você quer propor: `git
checkout -b sua-branch`, mude o que precisar, e abra um Pull Request contra
`main` em <https://github.com/FinweeJur/controle-popular>. Não há processo
formal de revisão documentado ainda — é um projeto novo e a licença
([AGPL-3.0](../../../LICENSE)) já deixa claro que qualquer fork, inclusive
rodando como serviço público, tem a mesma obrigação de manter o código
aberto.
