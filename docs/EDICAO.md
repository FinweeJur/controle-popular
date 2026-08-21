# Edição de conteúdo — como editar o portal sem quebrar nada

Procedimento de edição do conteúdo publicado em controlepopular.com.br: o que dá para editar sem código, por onde, e o que rodar antes de publicar.

## Onde editar sem código

### Painel de edição (tela)

| Item | Valor |
|---|---|
| Onde | `http://localhost:3028/painel` |
| Como subir | `cd apps/web` e `PAINEL_LOCAL=1 npx next dev --port 3028` |
| Acesso | `PAINEL_TOKEN` em `apps/web/.env.local` (token próprio, estável entre reinícios, nunca versionado — o arquivo está no `.gitignore`). Sem token a API nega tudo (fail-closed) |
| O que edita | Título e descrição das páginas **ligadas** — hoje só `/paraopeba/entenda` |
| Obrigatório | `quem` e `motivo` em toda edição — edição sem motivo não é auditável |

- O painel **só existe em `next dev`**: as rotas vivem em arquivos `*.local.tsx` / `*.local.ts`, fora de `pageExtensions` quando `PAINEL_LOCAL` não é `1` **ou** `NODE_ENV` é `production`. Build e deploy nunca carregam o painel — a garantia é estrutural, não disciplinar.
- Ele lista as páginas ligadas por varredura do código (`metadataEditavel("/rota", …)`), não por lista à mão — lista à mão envelhece calada.
- **Não faz**: não apaga página, não renomeia URL, não edita textos de abertura (hero, ressalvas) e não mostra páginas de cidade — a tela diz isso em palavras em vez de fingir cobertura total.
- Alternativa de terminal: `npx tsx scripts/editar-pagina.mts` (`--listar`, `--rota … --titulo … --por … --motivo …`, `--remover`). Tela e terminal gravam o **mesmo** arquivo, no mesmo formato.

### Salvar não é publicar

O site é estático: `next build` imprime o HTML. Salvar grava `apps/web/data/edicoes.json` na hora; o site muda **no próximo build** (15–20 minutos, na máquina que tem o banco). O botão "Pedir publicação" grava `apps/web/data/pedido-build.json`, commita e dá push; o vigia na máquina de build puxa, vê o pedido, roda a rotina e grava `apps/web/data/ultimo-build.json` com o código de saída. A tela mostra "enfileirado", nunca "publicado".

## Quando o painel não cobre: arquivos de dado

`apps/web/data/` guarda o dado versionado que o build lê (edições, notícias, bases de fonte pública…). Editar um deles é editar o site:

1. **Formato**: JSON com 2 espaços de indentação e `\n` no fim — o formato dos arquivos existentes. Leia um como molde antes de criar.
2. **Compactação**: dado grande entra compactado (esqueleto + rótulos internados) — ver ARQUITETURA.md.
3. **Trilha**: o commit é o registro — `git log -p <arquivo>` mostra quem mudou o quê e quando, e `git revert` desfaz.
4. Um dado que o código não lê é peso morto: confira o ponto de leitura antes de criar arquivo novo.

## Ciclo de verificação, antes de publicar

| Passo | Comando |
|---|---|
| Testes | `npm test` (da raiz) |
| Tipos | `npx tsc --noEmit` |
| Dado pessoal | a suíte `sem-cpf-no-repo` valida por mod-11 — rode os testes **antes** de commitar dado coletado, varrendo o dado e não só o código |

O commit e o push seguem as regras de DESENVOLVIMENTO.md e AGENTS.md: mensagem por arquivo (`git commit --only <caminho> -F <arquivo-de-mensagem>`), em português sem acento, e `git fetch origin && git rebase origin/main && git push origin HEAD:main`. Segure o push enquanto a máquina de build estiver publicando.

## Regras editoriais

1. **O número vem do dado.** Modelo, se houver, só embrulha; se a fonte não tem, a resposta é "não sei, e aqui está o que existe perto".
2. **Ressalva colada ao número** — ou o número não vai (um total nacional exibido ao lado de um recorte local sugere o que não é).
3. **Lacuna é informação.** Diga quantos itens vieram vazios; publicar só o que tem valor finge cobertura completa.
4. **Resumo gerado por máquina é o portal afirmando algo.** Rotule com data e modelo, e nunca apresente como conclusão do autor do documento.
5. Dois dados verdadeiros lado a lado não autorizam o leitor a concluir um terceiro — insinuação é dano.

## Origem

- `docs/_historico/PAINEL-EDICAO-COMO-USAR.md` — absorvido (procedimento de uso do painel).
- `docs/_historico/PLANO-PAINEL-EDICAO.md` — **ENTREGUE**: painel no ar em dev (rota `/painel`, API `/api/painel/*`, token próprio), uso absorvido acima. Fases 2 e 3 (apagar página, renomear URL) seguem pendentes como dívida registrada. Mover para `docs/_historico/`.