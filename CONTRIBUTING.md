# Como contribuir com o Controle Popular

> **Tipo:** GUIA
> **Domínio:** global
> **Última medição:** 2026-10-04
> **Palavras-chave:** contribuição, colaborador, boas-vindas, código, testes, commits

Obrigado por querer ajudar. Este documento explica como entrar no projeto,
o que respeitar e como enviar sua contribuição.

## Sumário

- [1. O que é o projeto](#1-o-que-é-o-projeto)
- [2. Antes de tudo](#2-antes-de-tudo)
- [3. Rodar o projeto](#3-rodar-o-projeto)
- [4. Padrões que não se negociam](#4-padrões-que-não-se-negociam)
- [5. Como enviar sua mudança](#5-como-enviar-sua-mudança)
- [6. O que procurar para contribuir](#6-o-que-procurar-para-contribuir)
- [7. Licença](#7-licença)

## 1. O que é o projeto

Portal cívico de transparência pública em
[controlepopular.com.br](https://www.controlepopular.com.br).
Ele publica dado oficial — orçamento, contratos, barragens, licenças,
votos — com link direto para a fonte.

**Por que existe:** quem procura esse dado geralmente está sob estresse
(denúncia, remoção, barragem). Isso muda o padrão do código: número errado
é dano, insinuação é dano mesmo com dados certos, e acessibilidade não é
opcional.

Stack: Next.js 16 (App Router), TypeScript, Drizzle ORM, Postgres.
Monorepo com npm workspaces — tudo mora em [`apps/web`](apps/web).

## 2. Antes de tudo

1. Leia o [`AGENTS.md`](AGENTS.md). Ele guarda as regras com a medição ou
   o estrago que as motivou — nada ali é preferência de estilo.
2. Abra uma issue (ou comente numa existente) antes de trabalhar em algo
   grande. Assim ninguém faz duas vezes.
3. Issues com o rótulo `boa-primeira-issue` foram escolhidas para quem
   está chegando.

## 3. Rodar o projeto

Requisitos: Node 20+, npm, e o repositório clonado.

```bash
npm install          # instala as dependências
npm run dev          # sobe o site em http://localhost:3000
```

Verificações antes de enviar (mesmas que a CI roda):

```bash
npm run lint                 # regras de estilo
npm run typecheck -w @cp/web # checagem de tipos (tsc)
npm test                     # testes (lib + globo 3D)
```

**Sem banco de dados local?** Use `npm run dev` normalmente: as páginas
que consultam Postgres caem em dados de exemplo quando falta
`DATABASE_URL`. Se quiser banco de verdade, pergunte na issue — o
projeto usa Postgres e a conexão é compartilhada pela equipe.

## 4. Padrões que não se negociam

Estes quatro têm história registrada. Vale ler antes de escrever código.

### 4.1. Comentário obrigatório

Todo `.ts`, `.tsx`, `.py` ou `.mjs` abre com um bloco de comentário que
diz: o que é o módulo, de onde vem a regra de negócio, e **por que** a
solução é assim. Toda função pública documenta parâmetros e retorno.
Português claro — o código é público e auditável por cidadãos.

### 4.2. Dado pessoal nunca entra

CPF, endereço e nome de vítima ficam fora do repositório e do prompt de
qualquer IA. A régua `scripts/checar-dado-pessoal-em-dado.py` roda na
suíte e barra o dado antes do push. Se coletou dado novo, rode os testes
**antes** de commitar.

### 4.3. Número vem da fonte, nunca digitado à mão

Todo número exibido vem de constante medida, com data, e cada registro
tem hiperlink direto para a fonte oficial (não a home do órgão).
Junção de dois dados verdadeiros ao lado também é golpe: a tela precisa
dizer o que o dado **não** significa.

### 4.4. Links internos usam `next/link`

`<a href="/pagina">` cru recarrega a página inteira e mata o áudio do
rádio e o estado do companheiro no meio da navegação. Use `Link` do
Next.js. Exceções: externo, `mailto:`, âncora (`#`), arquivo e `/api/`.

## 5. Como enviar sua mudança

1. Crie um branch a partir da `main`:

   ```bash
   git checkout -b meu-tema
   ```

2. Faça o trabalho, rode as verificações da seção 3.
3. Commit por caminho explícito, com mensagem em português **sem acento**,
   escrita num arquivo:

   ```bash
   git commit --only caminho/para/arquivo.ts -F mensagem.txt
   ```

   Sem caminho, o `git commit` leva tudo que está em staging — inclusive
   o trabalho de outra pessoa.
4. Abra um Pull Request descrevendo: o que mudou, por que, e como
   verificar (o que você rodou e o que viu).

Mensagem de commit: título curto, corpo explicando o porquê, e o trailer
de coautoria quando houver:

```
Co-Authored-By: Seu Nome <seu@email>
```

## 6. O que procurar para contribuir

- **Issues abertas** — a lista viva do que falta.
- **Acessibilidade**: contraste, navegação por teclado, texto alternativo
  em gráficos.
- **Dado novo com fonte oficial**: quer publicar uma base? Traga a fonte
  e o link direto do registro, não a home do órgão.
- **Escrita**: microresumos em português direto, frases curtas, sem
  jargão. O leitor está com pressa.
- **Testes**: teste que pega bug é mais valioso que comentário.

## 7. Licença

[GNU AGPL-3.0](LICENSE). Pode usar, estudar e modificar; derivações
precisam publicar o código sob a mesma licença. Dado publicado aqui é
dado público de fonte oficial — a licença do código não muda o direito
de acesso a ele.
